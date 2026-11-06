// Applies db/schema.sql to the linked Neon branch.
// Usage: node --env-file=.env.local scripts/migrate.mjs
import { readFile } from 'node:fs/promises';
import pg from 'pg';

const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is not set. Run `neon env pull` first.');
  process.exit(1);
}

const sql = await readFile(new URL('../db/schema.sql', import.meta.url), 'utf8');
const client = new pg.Client({ connectionString: url });
await client.connect();
try {
  await client.query(sql);
  const { rows } = await client.query('SELECT count(*)::int AS n FROM waitlist');
  console.log(`Schema applied. waitlist rows: ${rows[0].n}`);
} finally {
  await client.end();
}
