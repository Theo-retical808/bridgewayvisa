import { supabase } from "./supabase";
import { DbAdmin, DbAgent } from "./database.types";

export type UserRole = "admin" | "agent";

export interface AppUser {
  authId: string;       // Supabase auth.users UUID
  profileId: string;    // admins.id or agents.id
  email: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
}

/**
 * Detect the role of the currently authenticated Supabase Auth user.
 * Checks admins first, then agents.
 * Returns null if the user has no role (access denied).
 */
export async function detectRole(): Promise<AppUser | null> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;

  // Check admins table
  const { data: adminRow } = await supabase
    .from("admins")
    .select("id, email, full_name, is_active")
    .eq("auth_user_id", user.id)
    .single<DbAdmin>();

  if (adminRow) {
    if (!adminRow.is_active) return null; // inactive — treat as no access
    return {
      authId: user.id,
      profileId: adminRow.id,
      email: adminRow.email,
      fullName: adminRow.full_name,
      role: "admin",
      isActive: adminRow.is_active,
    };
  }

  // Check agents table
  const { data: agentRow } = await supabase
    .from("agents")
    .select("id, email, full_name, is_active")
    .eq("auth_user_id", user.id)
    .single<DbAgent>();

  if (agentRow) {
    if (!agentRow.is_active) return null; // inactive — access denied
    return {
      authId: user.id,
      profileId: agentRow.id,
      email: agentRow.email,
      fullName: agentRow.full_name,
      role: "agent",
      isActive: agentRow.is_active,
    };
  }

  return null; // authenticated but no role row
}

/** Sign out from Supabase Auth */
export async function signOut() {
  await supabase.auth.signOut();
}
