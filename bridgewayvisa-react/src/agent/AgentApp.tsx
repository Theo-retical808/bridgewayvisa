import { useState, useEffect } from "react";
import AgentSidebar from "./components/AgentSidebar";
import AgentHeader from "./components/AgentHeader";
import AgentDashboard from "./AgentDashboard";
import AgentChat from "./AgentChat";
import AgentHistory from "./AgentHistory";
import AskAdmin from "./AskAdmin";
import { useSessions } from "../auth/SessionStore";
import { useAuth } from "../auth/AuthContext";
import { ChatSession } from "../auth/types";
import { supabase } from "../lib/supabase";

const TITLES: Record<string, string> = {
  dashboard: "Dashboard",
  queue: "Waiting Queue",
  chat: "Active Chat",
  history: "My Sessions",
  askadmin: "Ask Admin",
};

export default function AgentApp() {
  const { user } = useAuth();
  const {
    getWaitingSessions,
    getActiveSessions,
    getAgentActiveSession,
    endSession,
    refreshSessions,
  } = useSessions();

  const [current, setCurrent] = useState("dashboard");
  const [claimError, setClaimError] = useState<string | null>(null);

  // Use the agent's DB profile ID (not auth UUID) as the lookup key
  const agentProfileId = user?.profileId || "";

  // ── Presence: mark online on mount, offline on unmount/logout ──────────────
  useEffect(() => {
    if (!agentProfileId) return;

    // Set online when the agent dashboard loads
    supabase
      .from("agents")
      .update({ status: "online" })
      .eq("id", agentProfileId)
      .then(() => {});

    // Set offline when the tab is hidden/closed or component unmounts
    function handleVisibilityChange() {
      if (document.visibilityState === "hidden") {
        supabase
          .from("agents")
          .update({ status: "offline" })
          .eq("id", agentProfileId)
          .then(() => {});
      } else if (document.visibilityState === "visible") {
        supabase
          .from("agents")
          .update({ status: "online" })
          .eq("id", agentProfileId)
          .then(() => {});
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      // Set offline when component unmounts (logout)
      supabase
        .from("agents")
        .update({ status: "offline" })
        .eq("id", agentProfileId)
        .then(() => {});
    };
  }, [agentProfileId]);

  const waiting = getWaitingSessions();
  const activeChat = getAgentActiveSession(agentProfileId);

  const pendingAsks = getActiveSessions().filter(
    (s) => s.askAdmin?.pending
  ).length;

  async function handleAccept(session: ChatSession) {
    if (!agentProfileId) return;
    setClaimError(null);

    // Use the atomic RPC to prevent race conditions
    const { data: claimed, error } = await supabase.rpc("claim_chat_session", {
      p_session_id: session.id,
      p_agent_id: agentProfileId,
    });

    if (error) {
      setClaimError("Failed to claim session. Please try again.");
      return;
    }

    if (!claimed) {
      setClaimError(
        "This session was already claimed by another agent."
      );
      // Refresh to get the latest state
      await refreshSessions();
      return;
    }

    // Realtime will update sessions automatically — navigate to chat
    setCurrent("chat");
  }

  async function handleEnd() {
    if (!activeChat) return;
    await endSession(activeChat.id);
    setCurrent("dashboard");
  }

  const isChat = current === "chat" && activeChat;

  return (
    <div className="min-h-screen bg-zinc-950 flex">
      <AgentSidebar
        current={current}
        onNavigate={setCurrent}
        hasActiveChat={!!activeChat}
        askAdminCount={pendingAsks}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        {!isChat && (
          <AgentHeader
            title={TITLES[current] || "Agent"}
            current={current}
            onNavigate={setCurrent}
            hasActiveChat={!!activeChat}
          />
        )}

        {claimError && (
          <div className="mx-5 sm:mx-8 mt-4 rounded-lg border border-red-700/30 bg-red-700/10 px-4 py-3 text-sm text-red-400 flex items-center justify-between">
            {claimError}
            <button
              onClick={() => setClaimError(null)}
              className="text-zinc-500 hover:text-white ml-4"
            >
              ✕
            </button>
          </div>
        )}

        <main
          className={
            isChat ? "flex-1 min-h-0 flex" : "flex-1 px-5 sm:px-8 py-6"
          }
        >
          {current === "dashboard" && (
            <AgentDashboard
              onAccept={handleAccept}
              onViewChat={() => setCurrent("chat")}
            />
          )}
          {current === "queue" && (
            <div className="space-y-3">
              <h3 className="text-white font-semibold text-sm mb-1">
                Waiting Clients
              </h3>
              {waiting.length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/10 bg-zinc-900/40 py-10 text-center text-zinc-600 text-sm">
                  The queue is empty.
                </div>
              ) : (
                <div className="space-y-3">
                  {waiting.map((c) => (
                    <QueueCard
                      key={c.id}
                      session={c}
                      onAccept={handleAccept}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
          {current === "history" && <AgentHistory />}
          {current === "askadmin" && <AskAdmin />}
          {current === "chat" &&
            (activeChat ? (
              <AgentChat
                session={activeChat}
                onBack={() => setCurrent("dashboard")}
                onEnd={handleEnd}
              />
            ) : (
              <div className="rounded-xl border border-dashed border-white/10 bg-zinc-900/40 py-20 text-center text-zinc-600 text-sm">
                No active chat. Accept a client from the Waiting Queue to start
                one.
              </div>
            ))}
        </main>
      </div>
    </div>
  );
}

function QueueCard({
  session,
  onAccept,
}: {
  session: ChatSession;
  onAccept: (s: ChatSession) => void;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-zinc-900/60 px-5 py-4 flex items-center justify-between gap-4">
      <div>
        <p className="text-white text-sm font-medium">{session.client.name}</p>
        <p className="text-zinc-500 text-xs mt-0.5">
          Session {session.session_id} &middot; {session.service} &middot;
          created {session.createdAt}
        </p>
      </div>
      <button
        onClick={() => onAccept(session)}
        className="shrink-0 text-sm font-medium text-white bg-red-700 hover:bg-red-600 transition-colors px-4 py-2 rounded-lg"
      >
        Accept
      </button>
    </div>
  );
}
