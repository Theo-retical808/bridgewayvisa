import { User } from "../auth/types";

export interface AgentRecord {
  id: string;
  name: string;
  status: "Online" | "Offline";
  sessions: number;
  email: string;
}

export interface SessionRecord {
  id: string;
  clientName: string;
  clientEmail: string;
  clientContact: string;
  clientAddress: string;
  agent: string;
  service: string;
  status: "Active" | "Completed" | "Waiting";
  createdAt: string;
  acceptedAt?: string;
  endedAt?: string;
  messages?: { sender: string; text: string; time: string }[];
}

export interface AdminState {
  agents: AgentRecord[];
  sessions: SessionRecord[];
  waitingSessions: SessionRecord[];
}
