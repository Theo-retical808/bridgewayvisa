/**
 * SessionStore — Supabase-backed realtime session management.
 *
 * Replaces the in-memory store. All state is read from Supabase and
 * kept in sync via Supabase Realtime subscriptions.
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
  useRef,
} from "react";
import { supabase } from "../lib/supabase";
import { DbChatSession, DbAgent, DbMessage } from "../lib/database.types";
import { ChatSession, SessionMessage, SessionStatus } from "./types";
import { RealtimeChannel } from "@supabase/supabase-js";

// ─── Helpers ────────────────────────────────────────────────────────────────

function dbStatusToApp(s: DbChatSession["status"]): SessionStatus {
  switch (s) {
    case "waiting": return "WAITING";
    case "active":  return "ACTIVE";
    case "ended":   return "ENDED";
    default:        return "WAITING";
  }
}

function dbToApp(
  row: DbChatSession,
  agentMap: Record<string, string> = {}
): ChatSession {
  return {
    id: row.id,
    session_id: row.session_id,
    client: {
      name: row.client_name,
      email: row.client_email,
      contact: row.client_contact,
      address: row.client_address,
    },
    service: row.service_question,
    status: dbStatusToApp(row.status),
    agentId: row.assigned_agent_id ?? undefined,
    // Resolve agent name from the lookup map
    agentName: row.assigned_agent_id
      ? agentMap[row.assigned_agent_id] ?? "Unknown Agent"
      : undefined,
    messages: (row.messages || []).map((m: DbMessage) => ({
      id: m.id,
      sender: m.sender_type,
      sender_id: m.sender_id,
      text: m.message,
      time: new Date(m.created_at).toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      }),
    })),
    createdAt: new Date(row.created_at).toLocaleString(),
    acceptedAt: row.updated_at
      ? new Date(row.updated_at).toLocaleString()
      : undefined,
    endedAt: row.ended_at
      ? new Date(row.ended_at).toLocaleString()
      : undefined,
  };
}

function generateSessionCode(): string {
  const num = Math.floor(10000 + Math.random() * 90000);
  return `CHAT-${num}`;
}

// ─── Context ─────────────────────────────────────────────────────────────────

interface SessionStore {
  sessions: ChatSession[];
  loadingSessions: boolean;
  createSession: (
    client: ChatSession["client"],
    service: string,
    termsAcceptedAt: string
  ) => Promise<{ session: ChatSession | null; error: string | null }>;
  addMessage: (
    sessionDbId: string,
    message: Omit<SessionMessage, "id">
  ) => Promise<void>;
  endSession: (sessionDbId: string) => Promise<void>;
  setAskAdmin: (sessionDbId: string, question: string) => void;
  answerAskAdmin: (sessionDbId: string, answer: string) => void;
  getWaitingSessions: () => ChatSession[];
  getActiveSessions: () => ChatSession[];
  getCompletedSessions: () => ChatSession[];
  getAgentActiveSession: (agentId: string) => ChatSession | null;
  getAgentSessions: (agentId: string) => ChatSession[];
  refreshSessions: () => Promise<void>;
}

const SessionContext = createContext<SessionStore | null>(null);

// ─── Provider ────────────────────────────────────────────────────────────────

export function SessionProvider({ children }: { children: ReactNode }) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  // Agent id → full_name lookup, kept in a ref so realtime callbacks always
  // have the latest copy without causing re-renders
  const agentMapRef = useRef<Record<string, string>>({});
  // Local-only askAdmin state (not persisted to DB in this iteration)
  const [askAdminMap, setAskAdminMap] = useState<
    Record<string, { question: string; answer?: string; pending: boolean }>
  >({});

  const loadSessions = useCallback(async () => {
    setLoading(true);

    // Fetch agents first to build the id → name map
    const { data: agentRows } = await supabase
      .from("agents")
      .select("id, full_name");

    const map: Record<string, string> = {};
    if (agentRows) {
      (agentRows as Pick<DbAgent, "id" | "full_name">[]).forEach((a) => {
        map[a.id] = a.full_name;
      });
    }
    agentMapRef.current = map;

    const { data, error } = await supabase
      .from("chat_sessions")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setSessions((data as DbChatSession[]).map((r) => dbToApp(r, map)));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadSessions();

    // Subscribe to all changes on chat_sessions via Realtime
    const channel: RealtimeChannel = supabase
      .channel("chat_sessions_all")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "chat_sessions" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newRow = payload.new as DbChatSession;
            setSessions((prev) => [dbToApp(newRow, agentMapRef.current), ...prev]);
          } else if (payload.eventType === "UPDATE") {
            const updated = payload.new as DbChatSession;
            // If a new agent was just assigned, ensure their name is in the map.
            // If not present yet, do a quick single-row fetch.
            if (
              updated.assigned_agent_id &&
              !agentMapRef.current[updated.assigned_agent_id]
            ) {
              supabase
                .from("agents")
                .select("id, full_name")
                .eq("id", updated.assigned_agent_id)
                .single<Pick<DbAgent, "id" | "full_name">>()
                .then(({ data }) => {
                  if (data) {
                    agentMapRef.current = {
                      ...agentMapRef.current,
                      [data.id]: data.full_name,
                    };
                    // Re-map this session now that we have the name
                    setSessions((prev) =>
                      prev.map((s) =>
                        s.id === updated.id
                          ? dbToApp(updated, agentMapRef.current)
                          : s
                      )
                    );
                  }
                });
            }
            setSessions((prev) =>
              prev.map((s) =>
                s.id === updated.id ? dbToApp(updated, agentMapRef.current) : s
              )
            );
          } else if (payload.eventType === "DELETE") {
            const deleted = payload.old as { id: string };
            setSessions((prev) => prev.filter((s) => s.id !== deleted.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadSessions]);

  // Merge askAdmin local state into sessions
  const sessionsWithAskAdmin = sessions.map((s) => ({
    ...s,
    askAdmin: askAdminMap[s.id],
  }));

  // ─── Actions ───────────────────────────────────────────────────────────────

  const createSession = useCallback(
    async (
      client: ChatSession["client"],
      service: string,
      termsAcceptedAt: string
    ): Promise<{ session: ChatSession | null; error: string | null }> => {
      const sessionCode = generateSessionCode();

      const { data, error } = await supabase
        .from("chat_sessions")
        .insert({
          session_id: sessionCode,
          client_name: client.name,
          client_contact: client.contact,
          client_email: client.email,
          client_address: client.address,
          service_question: service,
          terms_accepted: true,
          terms_accepted_at: termsAcceptedAt,
          status: "waiting",
          messages: [],
        })
        .select()
        .single<DbChatSession>();

      if (error) {
        return { session: null, error: error.message };
      }

      const appSession = dbToApp(data);
      return { session: appSession, error: null };
    },
    []
  );

  const addMessage = useCallback(
    async (sessionDbId: string, msg: Omit<SessionMessage, "id">) => {
      // Fetch current messages first to append safely
      const { data: current } = await supabase
        .from("chat_sessions")
        .select("messages")
        .eq("id", sessionDbId)
        .single<{ messages: DbMessage[] }>();

      const existing: DbMessage[] = current?.messages || [];
      const newMsg: DbMessage = {
        id: crypto.randomUUID(),
        sender_type: msg.sender,
        sender_id: msg.sender_id ?? null,
        message: msg.text,
        created_at: new Date().toISOString(),
      };

      await supabase
        .from("chat_sessions")
        .update({ messages: [...existing, newMsg] })
        .eq("id", sessionDbId);
    },
    []
  );

  const endSession = useCallback(async (sessionDbId: string) => {
    await supabase
      .from("chat_sessions")
      .update({
        status: "ended",
        ended_at: new Date().toISOString(),
      })
      .eq("id", sessionDbId);
  }, []);

  // Ask admin is kept local (not stored in DB) — can be extended later
  const setAskAdmin = useCallback((sessionDbId: string, question: string) => {
    setAskAdminMap((prev) => ({
      ...prev,
      [sessionDbId]: { question, pending: true },
    }));
  }, []);

  const answerAskAdmin = useCallback((sessionDbId: string, answer: string) => {
    setAskAdminMap((prev) => ({
      ...prev,
      [sessionDbId]: {
        ...(prev[sessionDbId] || { question: "" }),
        answer,
        pending: false,
      },
    }));
  }, []);

  // ─── Selectors ─────────────────────────────────────────────────────────────

  const getWaitingSessions = useCallback(
    () => sessionsWithAskAdmin.filter((s) => s.status === "WAITING"),
    [sessionsWithAskAdmin]
  );

  const getActiveSessions = useCallback(
    () => sessionsWithAskAdmin.filter((s) => s.status === "ACTIVE"),
    [sessionsWithAskAdmin]
  );

  const getCompletedSessions = useCallback(
    () => sessionsWithAskAdmin.filter((s) => s.status === "ENDED"),
    [sessionsWithAskAdmin]
  );

  const getAgentActiveSession = useCallback(
    (agentId: string): ChatSession | null =>
      sessionsWithAskAdmin.find(
        (s) => s.agentId === agentId && s.status === "ACTIVE"
      ) ?? null,
    [sessionsWithAskAdmin]
  );

  const getAgentSessions = useCallback(
    (agentId: string) =>
      sessionsWithAskAdmin.filter((s) => s.agentId === agentId),
    [sessionsWithAskAdmin]
  );

  return (
    <SessionContext.Provider
      value={{
        sessions: sessionsWithAskAdmin,
        loadingSessions: loading,
        createSession,
        addMessage,
        endSession,
        setAskAdmin,
        answerAskAdmin,
        getWaitingSessions,
        getActiveSessions,
        getCompletedSessions,
        getAgentActiveSession,
        getAgentSessions,
        refreshSessions: loadSessions,
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
