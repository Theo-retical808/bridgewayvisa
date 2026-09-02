-- ============================================================
-- Migration 002 — create_agent_profile RPC
--
-- Problem: supabase.auth.signUp() called from the browser shifts
-- the JS client's active session to the newly created user.
-- Any subsequent INSERT runs as that new user (no role), so
-- is_admin() returns false and RLS blocks the insert.
--
-- Fix: a SECURITY DEFINER function that runs as the DB owner.
-- The frontend saves the admin session, calls signUp, restores
-- the admin session, then calls this RPC with the new user UUID.
-- The RPC inserts the agents row with owner privileges.
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
  INSERT INTO agents (auth_user_id, email, full_name, is_active, status)
  VALUES (p_auth_user_id, p_email, p_full_name, TRUE, 'offline')
  RETURNING * INTO v_agent;

  RETURN v_agent;
END;
$$;

-- Restrict execution to authenticated users only (anon cannot call this)
REVOKE ALL ON FUNCTION create_agent_profile(UUID, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION create_agent_profile(UUID, TEXT, TEXT) TO authenticated;
