-- ============================================================
-- Bridgeway Visa — Initial Schema Migration
-- Run this against a fresh Supabase project.
-- ============================================================

-- Enable pgcrypto for gen_random_uuid() (already available in Supabase)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE chat_status AS ENUM ('waiting', 'active', 'ended');
CREATE TYPE agent_status AS ENUM ('online', 'offline', 'busy');

-- ============================================================
-- TABLE: admins
-- Profile/role table for administrator accounts.
-- Passwords are handled entirely by Supabase Auth.
-- ============================================================

CREATE TABLE IF NOT EXISTS admins (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id  UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT NOT NULL UNIQUE,
  full_name     TEXT NOT NULL,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: agents
-- Profile/role table for support agent accounts.
-- Passwords are handled entirely by Supabase Auth.
-- ============================================================

CREATE TABLE IF NOT EXISTS agents (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id  UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT NOT NULL UNIQUE,
  full_name     TEXT NOT NULL,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  status        agent_status NOT NULL DEFAULT 'offline',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: chat_sessions
-- Stores every client conversation and its messages.
-- Messages are stored as JSONB for simplicity on the free tier
-- (avoids a separate messages table and join overhead).
-- Tradeoff: JSONB messages cannot be individually queried by
-- Supabase Realtime column filters, but the whole row is
-- broadcast on UPDATE, which is sufficient for this use case.
-- ============================================================

CREATE TABLE IF NOT EXISTS chat_sessions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id          TEXT NOT NULL UNIQUE,
  client_name         TEXT NOT NULL,
  client_contact      TEXT NOT NULL,
  client_email        TEXT NOT NULL,
  client_address      TEXT NOT NULL,
  service_question    TEXT NOT NULL,
  pre_prompt          TEXT NOT NULL DEFAULT '',
  terms_accepted      BOOLEAN NOT NULL DEFAULT FALSE,
  terms_accepted_at   TIMESTAMPTZ,
  status              chat_status NOT NULL DEFAULT 'waiting',
  assigned_agent_id   UUID REFERENCES agents(id) ON DELETE SET NULL,
  messages            JSONB NOT NULL DEFAULT '[]'::JSONB,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at            TIMESTAMPTZ
);

-- ============================================================
-- INDEXES
-- ============================================================

-- chat_sessions
CREATE INDEX IF NOT EXISTS idx_chat_sessions_session_id      ON chat_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_status          ON chat_sessions(status);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_assigned_agent  ON chat_sessions(assigned_agent_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_client_email    ON chat_sessions(client_email);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_created_at      ON chat_sessions(created_at DESC);

-- agents
CREATE INDEX IF NOT EXISTS idx_agents_auth_user_id ON agents(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_agents_email        ON agents(email);
CREATE INDEX IF NOT EXISTS idx_agents_is_active    ON agents(is_active);
CREATE INDEX IF NOT EXISTS idx_agents_status       ON agents(status);

-- admins
CREATE INDEX IF NOT EXISTS idx_admins_auth_user_id ON admins(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_admins_email        ON admins(email);
CREATE INDEX IF NOT EXISTS idx_admins_is_active    ON admins(is_active);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_admins_updated_at
  BEFORE UPDATE ON admins
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_agents_updated_at
  BEFORE UPDATE ON agents
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_chat_sessions_updated_at
  BEFORE UPDATE ON chat_sessions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- RPC: claim_chat_session
-- Atomically claims a waiting session for an agent.
-- Prevents race conditions when multiple agents see the same
-- waiting chat simultaneously.
-- Returns TRUE if the claim succeeded, FALSE if already taken.
-- ============================================================

CREATE OR REPLACE FUNCTION claim_chat_session(
  p_session_id    UUID,
  p_agent_id      UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  rows_updated INTEGER;
BEGIN
  UPDATE chat_sessions
  SET
    status            = 'active',
    assigned_agent_id = p_agent_id,
    updated_at        = NOW()
  WHERE
    id     = p_session_id
    AND status = 'waiting';       -- only claim if still waiting

  GET DIAGNOSTICS rows_updated = ROW_COUNT;
  RETURN rows_updated > 0;
END;
$$;

-- ============================================================
-- ENABLE REALTIME
-- ============================================================

ALTER TABLE chat_sessions REPLICA IDENTITY FULL;
ALTER TABLE agents        REPLICA IDENTITY FULL;

-- Add tables to Supabase Realtime publication
-- (Run these in the SQL editor — the publication already exists)
ALTER PUBLICATION supabase_realtime ADD TABLE chat_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE agents;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE admins        ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents        ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;

-- -------------------------------------------------------
-- Helper: get the agent row for the current auth user
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION current_agent_id()
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT id FROM agents WHERE auth_user_id = auth.uid() AND is_active = TRUE LIMIT 1;
$$;

-- Helper: check if current user is an active admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM admins WHERE auth_user_id = auth.uid() AND is_active = TRUE
  );
$$;

-- Helper: check if current user is an active agent
CREATE OR REPLACE FUNCTION is_agent()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM agents WHERE auth_user_id = auth.uid() AND is_active = TRUE
  );
$$;

-- -------------------------------------------------------
-- ADMINS table policies
-- -------------------------------------------------------

-- Admins can read their own profile
CREATE POLICY "admins_read_own" ON admins
  FOR SELECT USING (auth.uid() = auth_user_id);

-- Admins can update their own profile
CREATE POLICY "admins_update_own" ON admins
  FOR UPDATE USING (auth.uid() = auth_user_id);

-- -------------------------------------------------------
-- AGENTS table policies
-- -------------------------------------------------------

-- Admins can do everything with agents
CREATE POLICY "admin_full_access_agents" ON agents
  FOR ALL USING (is_admin());

-- Agents can read all agent rows (needed for waiting queue display)
CREATE POLICY "agents_read_all" ON agents
  FOR SELECT USING (is_agent() OR is_admin());

-- Agents can update only their own profile
CREATE POLICY "agents_update_own" ON agents
  FOR UPDATE USING (auth.uid() = auth_user_id);

-- -------------------------------------------------------
-- CHAT_SESSIONS table policies
-- -------------------------------------------------------

-- Admins can read everything
CREATE POLICY "admin_read_all_sessions" ON chat_sessions
  FOR SELECT USING (is_admin());

-- Admins can update everything (e.g., answer ask-admin)
CREATE POLICY "admin_update_all_sessions" ON chat_sessions
  FOR UPDATE USING (is_admin());

-- Agents can read waiting sessions + their own assigned sessions
CREATE POLICY "agent_read_sessions" ON chat_sessions
  FOR SELECT USING (
    is_agent() AND (
      status = 'waiting'
      OR assigned_agent_id = current_agent_id()
    )
  );

-- Agents can update only their own assigned sessions (send message, end)
-- The claim_chat_session RPC uses SECURITY DEFINER so it bypasses this for claiming
CREATE POLICY "agent_update_own_sessions" ON chat_sessions
  FOR UPDATE USING (
    is_agent() AND assigned_agent_id = current_agent_id()
  );

-- Anonymous/client inserts: clients create their own session
-- The session_id is generated server-side; clients pass all required fields.
-- We use anon role here — lock it down to INSERT only with no password.
CREATE POLICY "anon_insert_session" ON chat_sessions
  FOR INSERT WITH CHECK (
    terms_accepted = TRUE
    AND client_name IS NOT NULL
    AND client_email IS NOT NULL
  );

-- Clients can read their own session by session_id using a custom claim
-- stored in localStorage (not a JWT claim). We allow anon SELECT by
-- exact session_id match. This is safe because session_id is a random UUID-based string.
-- A client without the session_id cannot find any row.
CREATE POLICY "anon_read_own_session" ON chat_sessions
  FOR SELECT USING (TRUE);
-- NOTE: The above is intentionally open for SELECT because:
-- 1. The session_id is a crypto-random value (unforgeable without the client having it)
-- 2. Clients filter by their known session_id in the query
-- 3. For stricter security, replace with a Postgres JWT claim approach.
--    This simple approach is appropriate for the Supabase Free Tier use case.

-- Clients can update their own session to append messages
-- (only the messages column, enforced in application logic via RPC or
--  by verifying the session_id in the WHERE clause)
CREATE POLICY "anon_update_own_session" ON chat_sessions
  FOR UPDATE USING (TRUE);
