'use server';

import { getCurrentUser } from '@/features/auth/actions';
import { inngest } from '@/features/inngest/client';
import { MessageRole, MessageType } from '@/features/projects/types';
import type { FragmentRecord, MessageRecord } from '@/features/projects/fragment-types';
import { db } from '@/prisma/db';

/**
 * Create a new user message in a project and kick off an agent run.
 *
 * Verifies the caller owns the target project, stores the message, then sends a
 * `code-agent/run` event so the coding agent generates a response.
 *
 * @param value The message content typed by the user.
 * @param projectId The project the message belongs to.
 * @returns The newly created message record.
 * @throws If the user is unauthorized or the project is not found.
 */
export const createMessage = async (value: string, projectId: string) => {
	const user = await getCurrentUser();

	if (!user) {
		throw new Error('Unauthorized');
	}

	// Prisma 8 check project ownership using fluent .where().first()
	const project = await db.orm.public.Project.where({
		id: projectId,
		userId: user.id,
	}).first();

	if (!project) {
		throw new Error('Project not found');
	}

	// Prisma 8 message creation
	const newMessage = await db.orm.public.Message.create({
		projectId,
		content: value,
		role: 'USER' as MessageRole,
		type: 'RESULT' as MessageType,
	});

	await inngest.send({
		name: 'code-agent/run',
		data: {
			value,
			projectId,
		},
	});

	// Return serialized message for client safety
	return {
		...newMessage,
		createdAt: newMessage.createdAt.toString(),
		updatedAt: newMessage.updatedAt.toString(),
	};
};

/**
 * List all messages for a project, oldest first, including their fragments.
 *
 * Ensures the signed-in user owns the project before returning anything.
 *
 * @param projectId The project whose messages should be returned.
 * @returns The project's messages (with related fragments) ordered by `updatedAt`.
 * @throws If the user is unauthorized or the project is not found.
 */
export const getMessages = async (projectId: string) => {
	const user = await getCurrentUser();

	if (!user) {
		throw new Error('Unauthorized');
	}

	const project = await db.orm.public.Project.where({
		id: projectId,
		userId: user.id,
	}).first();

	if (!project) {
		throw new Error('Project not found or unauthorized');
	}

	// Prisma 8 fluent query chain for fetching messages with fragments
	const messages = await db.orm.public.Message.where({
		projectId,
	})
		.orderBy((m) => m.updatedAt.asc())
		.include('fragment')
		.all();

	// Serialize Temporal.Instant timestamps for Next.js client component boundary
	return messages.map(
		(message): MessageRecord => ({
			id: message.id,
			projectId: message.projectId,
			content: message.content,
			role: message.role,
			type: message.type,
			createdAt: message.createdAt.toString(),
			updatedAt: message.updatedAt.toString(),
			fragment: message.fragment
				? ({
						id: message.fragment.id,
						messageId: message.fragment.messageId,
						title: message.fragment.title,
						sandboxUrl: message.fragment.sandboxUrl,
						files: message.fragment.files,
						createdAt: message.fragment.createdAt.toString(),
						updatedAt: message.fragment.updatedAt.toString(),
					} satisfies FragmentRecord)
				: null,
		}),
	);
};
