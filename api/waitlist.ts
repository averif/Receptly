// Receptly waitlist API — a Neon Function.
// POST { email, source?, company? } -> stores the email in Postgres.
import { Pool } from "pg";
import { parseEnv } from "@neon/env";
import { attachDatabasePool } from "@neon/functions";
import config from "../neon";

const { postgres } = parseEnv(config, ["DATABASE_URL"]);
const pool = new Pool({ connectionString: postgres.databaseUrl, max: 5 });
attachDatabasePool(pool);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const SOURCES = new Set(["hero", "final-cta", "pricing"]);
const MAX_BODY = 2048;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });
}

const clip = (v: string | null, n: number) => (v ? v.slice(0, n) : null);

export default {
  async fetch(req: Request): Promise<Response> {
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
    if (req.method === "GET") return json(200, { ok: true, service: "receptly-waitlist" });
    if (req.method !== "POST") return json(405, { ok: false, error: "method_not_allowed" });

    const raw = await req.text();
    if (raw.length > MAX_BODY) return json(413, { ok: false, error: "payload_too_large" });

    let body: { email?: unknown; source?: unknown; company?: unknown };
    try {
      body = JSON.parse(raw);
    } catch {
      return json(400, { ok: false, error: "invalid_json" });
    }

    // Honeypot: real users never fill the hidden "company" field. Pretend success for bots.
    if (typeof body.company === "string" && body.company.trim() !== "") {
      return json(200, { ok: true, duplicate: false });
    }

    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
      return json(422, { ok: false, error: "invalid_email" });
    }
    const source = typeof body.source === "string" && SOURCES.has(body.source) ? body.source : "unknown";

    try {
      const { rowCount } = await pool.query(
        `INSERT INTO waitlist (email, source, referrer, user_agent)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (lower(email)) DO NOTHING`,
        [email, source, clip(req.headers.get("referer"), 500), clip(req.headers.get("user-agent"), 500)],
      );
      return json(rowCount ? 201 : 200, { ok: true, duplicate: !rowCount });
    } catch (err) {
      console.error("waitlist insert failed", err);
      return json(500, { ok: false, error: "server_error" });
    }
  },
};
