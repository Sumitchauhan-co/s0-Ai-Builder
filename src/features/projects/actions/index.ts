'use server';

import { getCurrentUser } from '@/features/auth/actions';
import { inngest } from '@/features/inngest/client';
import { generateSlug } from 'random-word-slugs';
import { db } from '@/prisma/db';
import { MessageRole, MessageType } from '../types';

export const createProject = async (value: string) => {
	const user = await getCurrentUser();
	if (!user) {
		return { error: 'Unauthorized' };
	}

	try {
		const project = await db.transaction(async (tx) => {
			const newProject = await tx.orm.public.Project.create({
				name: generateSlug(2, { format: 'kebab' }),
				userId: user.id,
			});

			await tx.orm.public.Message.create({
				content: value,
				role: 'USER' as MessageRole,
				type: 'RESULT' as MessageType,
				projectId: newProject.id,
			});

			return newProject;
		});

		await inngest.send({
			name: 'code-agent/run',
			data: { value, projectId: project.id },
		});

		// Serialize Temporal.Instant fields
		return {
			...project,
			createdAt: project.createdAt.toString(),
			updatedAt: project.updatedAt.toString(),
		};
	} catch (error) {
		console.error('❌ Error creating project: ', error);
		return { error: 'Failed to create project' };
	}
};

export const getProjects = async () => {
	const user = await getCurrentUser();
	if (!user) {
		return { error: 'Unauthorized' };
	}

	try {
		const projects = await db.orm.public.Project.where({ userId: user.id })
			.orderBy((p) => p.createdAt.desc())
			.all();

		// Map over list and convert Temporal.Instant to strings
		return projects.map((project) => ({
			...project,
			createdAt: project.createdAt.toString(),
			updatedAt: project.updatedAt.toString(),
		}));
	} catch (error) {
		console.error('❌ Error getting projects: ', error);
		return { error: 'Failed to get projects' };
	}
};

export const getProjectById = async (id: string) => {
	const user = await getCurrentUser();
	if (!user) {
		return { error: 'Unauthorized' };
	}

	try {
		const project = await db.orm.public.Project.where({ id, userId: user.id })
			.include('messages')
			.first();

		if (!project) {
			return { error: 'Project not found' };
		}

		// Serialize project and its nested messages array
		return {
			...project,
			createdAt: project.createdAt.toString(),
			updatedAt: project.updatedAt.toString(),
			messages: project.messages?.map((msg: any) => ({
				...msg,
				createdAt: msg.createdAt.toString(),
				updatedAt: msg.updatedAt.toString(),
			})),
		};
	} catch (error) {
		console.error('❌ Error getting project by id: ', error);
		return { error: 'Failed to get project by id' };
	}
};
