import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { ChatSession, SessionMessage, SessionStatus } from "../auth/types";

interface SessionStore {
  sessions: ChatSession[];
  createSession: (
    client: ChatSession["client"],
    service: string
  ) => ChatSession;
  acceptSession: (sessionId: string, agentId: string, agentName: string) => void;
  addMessage: (sessionId: string, message: Omit<SessionMessage, "id">) => void;
  endSession: (sessionId: string) => void;
  setAskAdmin: (sessionId: string, question: string) => void;
  answerAskAdmin: (sessionId: string, answer: string) => void;
  getWaitingSessions: () => ChatSession[];
  getActiveSessions: () => ChatSession[];
  getCompletedSessions: () => ChatSession[];
  getAgentActiveSession: (agentId: string) => ChatSession | null;
  getAgentSessions: (agentId: string) => ChatSession[];
}

const SessionContext = createContext<SessionStore | null>(null);

function generateId(): string {
  const num = Math.floor(10000 + Math.random() * 90000);
  return `CHAT-${num}`;
}

function timeNow(): string {
  return new Date().toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);

  const createSession = useCallback(
    (client: ChatSession["client"], service: string): ChatSession => {
      const id = generateId();
      const session: ChatSession = {
        id,
        client,
        service,
        status: "WAITING",
        messages: [],
        createdAt: timeNow(),
      };
      setSessions((prev) => [session, ...prev]);
      return session;
    },
    []
  );

  const acceptSession = useCallback(
    (sessionId: string, agentId: string, agentName: string) => {
      setSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId
            ? {
                ...s,
                status: "ASSIGNED" as SessionStatus,
                agentId,
                agentName,
              }
            : s
        )
      );
      setTimeout(() => {
        setSessions((prev) =>
          prev.map((s) =>
            s.id === sessionId
              ? { ...s, status: "ACTIVE" as SessionStatus, acceptedAt: timeNow() }
              : s
          )
        );
      }, 300);
    },
    []
  );

  const addMessage = useCallback(
    (sessionId: string, message: Omit<SessionMessage, "id">) => {
      setSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId
            ? {
                ...s,
                messages: [
                  ...s.messages,
                  { ...message, id: s.messages.length + 1 },
                ],
              }
            : s
        )
      );
    },
    []
  );

  const endSession = useCallback((sessionId: string) => {
    setSessions((prev) =>
      prev.map((s) =>
        s.id === sessionId
          ? { ...s, status: "COMPLETED" as SessionStatus, endedAt: timeNow() }
          : s
      )
    );
  }, []);

  const setAskAdmin = useCallback((sessionId: string, question: string) => {
    setSessions((prev) =>
      prev.map((s) =>
        s.id === sessionId
          ? {
              ...s,
              askAdmin: { question, pending: true },
            }
          : s
      )
    );
  }, []);

  const answerAskAdmin = useCallback((sessionId: string, answer: string) => {
    setSessions((prev) =>
      prev.map((s) =>
        s.id === sessionId && s.askAdmin
          ? {
              ...s,
              askAdmin: { ...s.askAdmin, answer, pending: false },
            }
          : s
      )
    );
  }, []);

  const getWaitingSessions = useCallback(
    () => sessions.filter((s) => s.status === "WAITING"),
    [sessions]
  );

  const getActiveSessions = useCallback(
    () => sessions.filter((s) => s.status === "ACTIVE"),
    [sessions]
  );

  const getCompletedSessions = useCallback(
    () => sessions.filter((s) => s.status === "COMPLETED"),
    [sessions]
  );

  const getAgentActiveSession = useCallback(
    (agentId: string): ChatSession | null =>
      sessions.find((s) => s.agentId === agentId && s.status === "ACTIVE") ??
      null,
    [sessions]
  );

  const getAgentSessions = useCallback(
    (agentId: string) => sessions.filter((s) => s.agentId === agentId),
    [sessions]
  );

  return (
    <SessionContext.Provider
      value={{
        sessions,
        createSession,
        acceptSession,
        addMessage,
        endSession,
        setAskAdmin,
        answerAskAdmin,
        getWaitingSessions,
        getActiveSessions,
        getCompletedSessions,
        getAgentActiveSession,
        getAgentSessions,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSessions() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSessions must be used within SessionProvider");
  return ctx;
}
