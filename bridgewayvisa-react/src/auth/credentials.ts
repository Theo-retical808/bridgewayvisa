import { User } from "./types";

export const DEMO_CREDENTIALS: Record<string, { password: string; user: User }> = {
  admin: {
    password: "admin123",
    user: {
      id: "01",
      username: "admin",
      name: "Administrator",
      role: "admin",
      email: "admin@bridgeway.ph",
    },
  },
  agent: {
    password: "agent123",
    user: {
      id: "01",
      username: "agent",
      name: "Maria Santos",
      role: "agent",
      email: "maria.santos@bridgeway.ph",
    },
  },
};

export function authenticate(
  username: string,
  password: string
): User | null {
  const entry = DEMO_CREDENTIALS[username.toLowerCase().trim()];
  if (!entry) return null;
  if (entry.password !== password) return null;
  return entry.user;
}
