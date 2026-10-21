'use server';

import { getCurrentUser } from '@/features/auth/actions';
import { inngest } from '@/features/inngest/client';
import { generateSlug } from 'random-word-slugs';
import { db } from '@/prisma/db';

type MessageRole = 'USER' | 'ASSISTANT';
type MessageType = 'RESULT' | 'ERROR';

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

		// TODO: Send the project to inngest
		return project;
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
		// Prisma 8 PostgreSQL orderBy uses a callback returning .asc() or .desc()
		const projects = await db.orm.public.Project.where({ userId: user.id })
			.orderBy((p) => p.createdAt.desc())
			.all();

		return projects;
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

		return project;
	} catch (error) {
		console.error('❌ Error getting project by id: ', error);
		return { error: 'Failed to get project by id' };
	}
};
