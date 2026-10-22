import type { AgentResult } from '@inngest/agent-kit';
import { Sandbox } from '@e2b/code-interpreter';

export interface CodeAgentState {
	sandboxId: string;
	summary: string;
	files: Record<string, string>;
}

function textFromMessage(
	message: AgentResult['output'][number],
): string | undefined {
	if (message.type !== 'text') {
		return undefined;
	}

	if (Array.isArray(message.content)) {
		return message.content
			.map((part) => (typeof part === 'string' ? part : (part.text ?? '')))
			.join('');
	}

	return message.content;
}

/** Plain text from agent output, if the model returned an assistant message. */
export function agentOutputText(
	output: AgentResult['output'],
): string | undefined {
	for (let i = output.length - 1; i >= 0; i--) {
		const message = output[i];
		if (message.role !== 'assistant') {
			continue;
		}

		const text = textFromMessage(message);
		if (text !== undefined) {
			return text;
		}
	}

	return undefined;
}

/** Save `<task_summary>` from the agent's latest reply into network state. */
export function captureTaskSummary(
	result: AgentResult,
	network?: { state: { data: { summary?: string } } },
) {
	const text = lastAssistantTextMessageContent(result);
	if (text?.includes('<task_summary>') && network) {
		network.state.data.summary = text;
	}
}

export async function connectSandbox(sandboxId: string) {
	return Sandbox.connect(sandboxId);
}

export function lastAssistantTextMessageContent(
	result: AgentResult,
): string | undefined {
	return agentOutputText(result.output);
}
