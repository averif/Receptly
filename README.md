# Receptly

Waitlist landing page for Receptly, the AI phone receptionist.

- `index.html` is the whole page (HTML, CSS and JS in one file). Host it on any static host.
- `api/waitlist.ts` is a Neon Function. The page POSTs signups to it, and it stores them in Neon Postgres.
- `db/schema.sql` holds the `waitlist` table.

## Setup

```bash
npm install
neon link          # writes .neon and pulls DATABASE_URL into .env.local
npm run migrate    # creates the waitlist table
neon deploy --env .env.local
```

If the function URL changes, update `WAITLIST_ENDPOINT` in `index.html`.

## Viewing signups

Open the Neon console → project **receptly** → SQL Editor:

```sql
SELECT email, source, created_at FROM waitlist ORDER BY created_at DESC;
```
