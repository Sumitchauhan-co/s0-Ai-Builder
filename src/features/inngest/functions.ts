import Sandbox from '@e2b/code-interpreter';
import { inngest } from './client';
import { db } from '@/prisma/db';
import {
	createAgent,
	createNetwork,
	createState,
	createTool,
	gemini,
} from '@inngest/agent-kit';
import z from 'zod';
import { FRAGMENT_TITLE_PROMPT, PROMPT, RESPONSE_PROMPT } from '@/lib/prompt';
import {
	agentOutputText,
	connectSandbox,
	lastAssistantTextMessageContent,
} from './utils';
import { MessageRole, MessageType } from '../projects/types';

export interface CodeAgentState {
	sandboxId: string;
	summary: string;
	files: Record<string, string>;
}

export const processTask = inngest.createFunction(
	{ id: 'process-task', triggers: { event: 'app/task.created' } },
	async ({ event, step }) => {
		const result = await step.run('handle-task', async () => {
			return { processed: true, id: event.data.id };
		});

		await step.sleep('pause', '1s');

		return { message: `Task ${event.data.id} complete`, result };
	},
);

export const codeAgentFunction = inngest.createFunction(
	{ id: 'code-agent', triggers: { event: 'code-agent/run' } },
	async ({ event, step }) => {
		const sandboxId = await step.run('get-sandbox-id', async () => {
			const sandbox = await Sandbox.create({
				template: 'k8mlf08dt929t2linmob',
				timeoutMs: 60 * 60 * 1000,
			});

			return sandbox.sandboxId;
		});

		const previousMessages = await step.run(
			'get-previous-messages',
			async () => {
				// Prisma 8 uses fluent builder chain: .where().orderBy().all()
				const messages = await db.orm.public.Message.where({
					projectId: event.data.projectId,
				})
					.orderBy((m) => m.createdAt.asc())
					.all();

				return messages.map((message) => ({
					type: 'text' as const,
					role:
						message.role === 'ASSISTANT'
							? ('assistant' as const)
							: ('user' as const),
					content: message.content,
				}));
			},
		);

		const state = createState<CodeAgentState>(
			{ sandboxId, summary: '', files: {} },
			{ messages: previousMessages },
		);

		const geminiApiKey = process.env.GEMINI_API_KEY;
		if (!geminiApiKey) {
			throw new Error('GEMINI_API_KEY is required to run the code agent.');
		}

		const geminiModel = gemini({
			model: 'gemini-3.8-flash',
			apiKey: geminiApiKey,
			defaultParameters: {
				generationConfig: {
					temperature: 0,
					maxOutputTokens: 8192,
					thinkingConfig: { thinkingBudget: 0 },
				},
			},
		});

		let toolStepIndex = 0;

		const codeAgent = createAgent({
			name: 'code-agent',
			description: 'An expert coding agent',
			system: PROMPT,
			model: geminiModel,
			tools: [
				// 1. Terminal
				createTool({
					name: 'terminal',
					description: 'Use the terminal to run commands',
					parameters: z.object({
						command: z.string(),
					}),
					handler: async ({ command }, { step }) => {
						const stepId = `terminal-${toolStepIndex++}`;
						return await step?.run(stepId, async () => {
							const buffers = { stdout: '', stderr: '' };

							try {
								const sandbox = await Sandbox.connect(sandboxId);

								const result = await sandbox.commands.run(command, {
									onStdout: (data) => {
										buffers.stdout += data;
									},

									onStderr: (data) => {
										buffers.stderr += data;
									},
								});

								return result.stdout;
							} catch (error) {
								console.log(
									`Command failed: ${error} \n stdout: ${buffers.stdout}\n stderr: ${buffers.stderr}`,
								);

								return `Command failed: ${error} \n stdout: ${buffers.stdout}\n stderr: ${buffers.stderr}`;
							}
						});
					},
				}),

				// 2. createOrUpdateFiles
				createTool({
					name: 'createOrUpdateFiles',
					description: 'Create or update files in the sandbox',
					parameters: z.object({
						files: z.array(
							z.object({
								path: z.string(),
								content: z.string(),
							}),
						),
					}),

					handler: async ({ files }, { step, network }) => {
						const stepId = `createOrUpdateFiles-${toolStepIndex++}`;
						const newFiles = await step?.run(
							stepId,
							async () => {
								try {
									const updatedFiles = network?.state?.data.files || {};
									const sandboxInstance = await Sandbox.connect(sandboxId);

									for (const file of files) {
										await sandboxInstance.files.write(file.path, file.content);
										updatedFiles[file.path] = file.content;
									}

									return updatedFiles;
								} catch (error) {
									return 'Error' + error;
								}
							},
						);

						if (typeof newFiles === 'object' && network?.state?.data) {
							network.state.data.files = newFiles;
						}
					},
				}),

				// 3. readFiles
				createTool({
					name: 'readFiles',
					description: 'Read files in the sandbox',
					parameters: z.object({
						files: z.array(z.string()),
					}),
					handler: async ({ files }, { step }) => {
						const stepId = `readFiles-${toolStepIndex++}`;
						return await step?.run(stepId, async () => {
							try {
								const sandboxInstance = await Sandbox.connect(sandboxId);
								const contents: any = [];

								for (const file of files) {
									const content = await sandboxInstance.files.read(file);
									contents.push({ path: file, content });
								}
								return JSON.stringify(contents);
							} catch (error) {
								return 'Error' + error;
							}
						});
					},
				}),
			],

			lifecycle: {
				onResponse: async ({ result, network }) => {
					const lastAssistantMessageText =
						lastAssistantTextMessageContent(result);

					if (lastAssistantMessageText && network) {
						if (lastAssistantMessageText.includes('<task_summary>')) {
							network.state.data.summary = lastAssistantMessageText;
						}
					}

					return result;
				},
			},
		});

		const network = createNetwork({
			name: 'code-agent-network',
			agents: [codeAgent],
			maxIter: 15,
			router: async ({ network }) => {
				const summary = network.state.data.summary;

				if (summary) {
					return;
				}

				return codeAgent;
			},
		});

		const result = await network.run(event.data.value, { state });
		const { summary, files } = result.state.data;

		if (!summary.trim() || Object.keys(files).length === 0) {
			await step.run('save-error', async () =>
				db.orm.public.Message.create({
					projectId: event.data.projectId,
					content: 'Something went wrong. Please try again',
					role: 'ASSISTANT' as MessageRole,
					type: 'ERROR' as MessageType,
				}),
			);

			return { error: 'The code agent returned no usable result.' };
		}

		const makeTextAgent = (name: string, system: string) =>
			createAgent({ name, system, model: geminiModel });

		const fragmentTitleGenerator = makeTextAgent(
			'fragment-title-generator',
			FRAGMENT_TITLE_PROMPT,
		);
		const responseGenerator = makeTextAgent(
			'response-generator',
			RESPONSE_PROMPT,
		);

		const [{ output: fragmentTitleOutput }, { output: responseOutput }] =
			await Promise.all([
				fragmentTitleGenerator.run(summary, { step }),
				responseGenerator.run(summary, { step }),
			]);

		const fragmentTitle = agentOutputText(fragmentTitleOutput);
		const responseText = agentOutputText(responseOutput);

		const sandboxUrl = await step.run('get-sandbox-url', async () => {
			const sandbox = await connectSandbox(sandboxId);
			return `http://${sandbox.getHost(3000)}`;
		});

		await step.run('save-result', async () => {
			return db.transaction(async (tx) => {
				if (!fragmentTitle?.trim() || !responseText?.trim()) {
					return tx.orm.public.Message.create({
						projectId: event.data.projectId,
						content: 'Something went wrong. Please try again',
						role: 'ASSISTANT' as MessageRole,
						type: 'ERROR' as MessageType,
					});
				}

				const message = await tx.orm.public.Message.create({
					projectId: event.data.projectId,
					content: responseText,
					role: 'ASSISTANT' as MessageRole,
					type: 'RESULT' as MessageType,
				});

				await tx.orm.public.Fragment.create({
					messageId: message.id,
					sandboxUrl,
					title: fragmentTitle,
					files,
				});

				return message;
			});
		});

		return {
			url: sandboxUrl,
			title: fragmentTitle,
			files,
			summary,
		};
	},
);
