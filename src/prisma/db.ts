import 'dotenv/config';
import postgres from '@prisma/orm-postgres/runtime';
import type { Contract } from './contract.d';
import contractJson from './contract.json' with { type: 'json' };

const globalForDb = globalThis as unknown as {
	db: ReturnType<typeof postgres<Contract>> | undefined;
};

function createDb() {
	const url = process.env.DATABASE_URL;
	if (!url) {
		throw new Error('DATABASE_URL is not set');
	}

	return postgres<Contract>({
		contractJson,
		url,
	});
}

export const db = globalForDb.db ?? createDb();

if (process.env.NODE_ENV !== 'production') {
	globalForDb.db = db;
}
