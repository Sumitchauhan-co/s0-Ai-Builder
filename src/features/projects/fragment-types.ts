import type { Models } from '@/prisma/schema';

export type FragmentRecord = Pick<
	Models.public_Fragment,
	'id' | 'messageId' | 'sandboxUrl' | 'title'
> & {
	files: unknown;
	createdAt: string;
	updatedAt: string;
};

export type ProjectFragment = Omit<FragmentRecord, 'files'> & {
	files: Record<string, string>;
};

export type MessageRecord = Pick<
	Models.public_Message,
	'id' | 'content' | 'projectId' | 'role' | 'type'
> & {
	createdAt: string;
	updatedAt: string;
	fragment: FragmentRecord | null;
};

export function parseFragmentFiles(files: unknown): Record<string, string> {
	let parsed: unknown = files;

	if (typeof parsed === 'string') {
		try {
			parsed = JSON.parse(parsed);
		} catch {
			return {};
		}
	}

	if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
		return {};
	}

	return Object.fromEntries(
		Object.entries(parsed).filter(
			(entry): entry is [string, string] => typeof entry[1] === 'string',
		),
	);
}
