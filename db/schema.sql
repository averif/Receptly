-- Receptly waitlist. Safe to re-run.
CREATE TABLE IF NOT EXISTS waitlist (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email       text        NOT NULL CHECK (char_length(email) <= 254),
  source      text        NOT NULL DEFAULT 'unknown',
  referrer    text,
  user_agent  text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- One signup per address, case-insensitive.
CREATE UNIQUE INDEX IF NOT EXISTS waitlist_email_lower_key ON waitlist (lower(email));
CREATE INDEX IF NOT EXISTS waitlist_created_at_idx ON waitlist (created_at DESC);
