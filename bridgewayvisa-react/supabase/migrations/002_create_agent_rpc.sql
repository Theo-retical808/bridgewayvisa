-- ============================================================
-- Migration 002 — create_agent_profile RPC
--
-- Problem: when an admin calls supabase.auth.signUp() from the
-- frontend, the Supabase JS client temporarily switches the active
-- session to the newly created (unconfirmed) user. Any subsequent
-- INSERT into the agents table then runs as that new user, which
-- has no role and fails the is_admin() RLS policy.
--
-- Solution: a SECURITY DEFINER function that the admin calls via
-- supabase.rpc(). It runs with the privileges of its OWNER
-- (postgres / service role), bypasses RLS, and inserts the agent
-- profile row atomically.
-- ============================================================

CREATE OR REPLACE FUNCTION create_agent_profile(
  p_auth_user_id  UUID,
  p_email         TEXT,
  p_full_name     TEXT
)
RETURNS agents
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_agent agents;
BEGIN
  -- Guard: only an active admin may call this function
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Permission denied: caller is not an active admin';
  END IF;

  INSERT INTO agents (auth_user_id, email, full_name, is_active, status)
  VALUES (p_auth_user_id, p_email, p_full_name, TRUE, 'offline')
  RETURNING * INTO v_agent;

  RETURN v_agent;
END;
$$;
