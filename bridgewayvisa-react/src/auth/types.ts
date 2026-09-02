export type UserRole = "admin" | "agent";

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  email: string;
}

export type SessionStatus = "WAITING" | "ASSIGNED" | "ACTIVE" | "COMPLETED" | "CANCELLED";

export interface SessionMessage {
  id: number;
  sender: "client" | "agent";
  text: string;
  time: string;
  internal?: boolean;
}

export interface ChatSession {
  id: string;
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
