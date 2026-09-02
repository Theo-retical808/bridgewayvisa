import { User, Circle, Clock, MessageSquare, CheckCircle2 } from "lucide-react";
import { useSessions } from "../auth/SessionStore";
import { ChatSession } from "../auth/types";

interface Props {
  onAccept: (session: ChatSession) => void;
  onViewChat: () => void;
}

function WaitingClientCard({
  session,
  onAccept,
}: {
  session: ChatSession;
  onAccept: (s: ChatSession) => void;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-zinc-900/60 px-5 py-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center shrink-0">
          <User className="w-4 h-4 text-zinc-400" />
        </div>
        <div className="min-w-0">
          <p className="text-zinc-100 text-sm font-medium truncate">
            {session.client.name}
          </p>
          <p className="text-zinc-500 text-xs mt-0.5">
            Waiting &middot; Session {session.id} &middot; {session.service}
          </p>
        </div>
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

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-white/10 bg-zinc-900/60 px-5 py-4 flex-1 min-w-[110px]">
      <p className="text-2xl font-bold text-white leading-none">{value}</p>
      <p className="text-zinc-500 text-xs mt-1.5">{label}</p>
    </div>
  );
}

export default function AgentDashboard({ onAccept, onViewChat }: Props) {
  const { getWaitingSessions, getActiveSessions } = useSessions();
  const waiting = getWaitingSessions();
  const active = getActiveSessions();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-lg text-zinc-200">
          Welcome, <span className="text-white font-semibold">Agent</span>{" "}
          <span className="inline-flex items-center gap-1 text-xs text-red-400 ml-1">
            <Circle className="w-2 h-2 fill-red-500 text-red-500" /> Online
          </span>
        </h2>
      </div>

      <div className="flex flex-wrap gap-4">
        <StatCard label="Waiting" value={waiting.length} />
        <StatCard label="Active" value={active.length} />
      </div>

      <div>
        <h3 className="text-white font-semibold text-sm mb-3">
          Waiting Clients
        </h3>
        {waiting.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 bg-zinc-900/40 py-10 text-center text-zinc-600 text-sm">
            No one's waiting right now.
          </div>
        ) : (
          <div className="space-y-3">
            {waiting.map((c) => (
              <WaitingClientCard
                key={c.id}
                session={c}
                onAccept={onAccept}
              />
            ))}
          </div>
        )}
      </div>

      {active.length > 0 && (
        <div>
          <h3 className="text-white font-semibold text-sm mb-3">
            Your Active Chats
          </h3>
          <div className="space-y-3">
            {active.map((s) => (
              <div
                key={s.id}
                className="rounded-xl border border-white/10 bg-zinc-900/60 px-5 py-4 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-red-700/15 border border-red-700/30 flex items-center justify-center shrink-0">
                    <MessageSquare className="w-4 h-4 text-red-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-zinc-100 text-sm font-medium truncate">
                      {s.client.name}
                    </p>
                    <p className="text-zinc-500 text-xs mt-0.5">
                      {s.id} &middot; {s.service}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onViewChat}
                  className="shrink-0 text-sm font-medium text-white bg-red-700 hover:bg-red-600 transition-colors px-4 py-2 rounded-lg"
                >
                  Open Chat
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {waiting.length === 0 && active.length === 0 && (
        <div className="rounded-xl border border-dashed border-white/10 bg-zinc-900/40 py-10 text-center text-zinc-600 text-sm flex flex-col items-center gap-2">
          <Clock className="w-5 h-5 text-zinc-700" />
          All caught up. Waiting for new chat sessions.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <InfoCard
          icon={Clock}
          title="Accept Chats"
          desc="Accept waiting clients from the queue to start a conversation."
        />
        <InfoCard
          icon={MessageSquare}
          title="Respond Fast"
          desc="Keep clients informed while they wait for their visa queries."
        />
        <InfoCard
          icon={CheckCircle2}
          title="End Cleanly"
          desc="End conversations once the client's concern is fully resolved."
        />
      </div>
    </div>
  );
}

function InfoCard({
  icon: Icon,
  title,
  desc,
}: {
  icon: React.ElementType;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-zinc-900/60 p-5">
      <Icon className="w-5 h-5 text-red-500 mb-3" />
      <p className="text-white text-sm font-semibold">{title}</p>
      <p className="text-zinc-500 text-xs mt-1 leading-relaxed">{desc}</p>
    </div>
  );
}