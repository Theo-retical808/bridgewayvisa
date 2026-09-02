// Database row shapes matching the Supabase schema.
// These are used throughout the app for type safety.

export type ChatStatus = "waiting" | "active" | "ended";
export type AgentStatus = "online" | "offline" | "busy";

/** A single message stored inside chat_sessions.messages JSONB */
export interface DbMessage {
  id: string;            // UUID string
  sender_type: "client" | "agent";
  sender_id: string | null;  // agent UUID or null for client
  message: string;
  created_at: string;    // ISO timestamp
}

export interface DbChatSession {
  id: string;
  session_id: string;
  client_name: string;
  client_contact: string;
  client_email: string;
  client_address: string;
  service_question: string;
  pre_prompt: string;
  terms_accepted: boolean;
  terms_accepted_at: string | null;
  status: ChatStatus;
  assigned_agent_id: string | null;
  messages: DbMessage[];
  created_at: string;
  updated_at: string;
  ended_at: string | null;
}

export interface DbAgent {
  id: string;
  auth_user_id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  status: AgentStatus;
  created_at: string;
  updated_at: string;
}

export interface DbAdmin {
  id: string;
  auth_user_id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
