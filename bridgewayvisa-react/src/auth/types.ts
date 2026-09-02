// Re-export AppUser so existing imports of User from this file still work.
export type { AppUser as User, UserRole } from "../lib/auth";

export type SessionStatus = "WAITING" | "ACTIVE" | "ENDED" | "ASSIGNED";

export interface SessionMessage {
  id: string;         // UUID string (from DB) or temp string
  sender: "client" | "agent";
  sender_id: string | null;
  text: string;
  time: string;       // formatted display time
  internal?: boolean;
}

export interface ChatSession {
  id: string;         // DB UUID (chat_sessions.id)
  session_id: string; // human-readable session code e.g. CHAT-12345
  client: {
    name: string;
    email: string;
    contact: string;
    address: string;
  };
  service: string;
  status: SessionStatus;
  agentId?: string;
  agentName?: string;
  messages: SessionMessage[];
  createdAt: string;
  acceptedAt?: string;
  endedAt?: string;
  askAdmin?: {
    question: string;
    answer?: string;
    pending: boolean;
  };
}
