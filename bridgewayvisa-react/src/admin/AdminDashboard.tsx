import { Users, Circle, MessageSquare, Clock } from "lucide-react";
import { useSessions } from "../auth/SessionStore";

interface Props {
  onViewSession: (id: string) => void;
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-zinc-900/60 px-5 py-4 flex items-center gap-4">
      <div className="w-10 h-10 rounded-lg bg-red-700/15 border border-red-700/30 flex items-center justify-center">
        <Icon className="w-5 h-5 text-red-500" />
      </div>
      <div>
        <p className="text-2xl font-bold text-white leading-none">{value}</p>
        <p className="text-zinc-500 text-xs mt-1">{label}</p>
      </div>
    </div>
  );
}

function SessionStatusPill({ status }: { status: string }) {
  const active = status === "ACTIVE";
  const waiting = status === "WAITING";
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${
        active
          ? "border-red-700/40 bg-red-700/10 text-red-400"
          : waiting
          ? "border-yellow-700/40 bg-yellow-700/10 text-yellow-400"
          : "border-zinc-700 bg-zinc-800/60 text-zinc-400"
      }`}
    >
      <Circle
        className={`w-1.5 h-1.5 ${
          active
            ? "fill-red-500 text-red-500"
            : waiting
            ? "fill-yellow-500 text-yellow-500"
            : "fill-zinc-500 text-zinc-500"
        }`}
      />
      {status}
    </span>
  );
}

export default function AdminDashboard({ onViewSession }: Props) {
  const { sessions, getWaitingSessions, getActiveSessions } = useSessions();

  const active = getActiveSessions();
  const waiting = getWaitingSessions();
  const total = sessions.length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Sessions" value={total} />
        <StatCard icon={MessageSquare} label="Active Chats" value={active.length} />
        <StatCard icon={Clock} label="Waiting" value={waiting.length} />
        <StatCard
          icon={Circle}
          label="Completed"
          value={sessions.filter((s) => s.status === "COMPLETED").length}
        />
      </div>

      <div className="rounded-xl border border-white/10 bg-zinc-900/60 overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10">
          <h3 className="text-white font-semibold text-sm">
            Active Conversations
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-zinc-500 text-xs uppercase tracking-wide">
                <th className="px-5 py-3 font-medium">Session ID</th>
                <th className="px-5 py-3 font-medium">Client</th>
                <th className="px-5 py-3 font-medium">Agent</th>
                <th className="px-5 py-3 font-medium">Service</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {active.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-8 text-center text-zinc-600 text-sm"
                  >
                    No active conversations.
                  </td>
                </tr>
              ) : (
                active.map((s) => (
                  <tr
                    key={s.id}
                    onClick={() => onViewSession(s.id)}
                    className="border-t border-white/5 hover:bg-white/[0.03] cursor-pointer"
                  >
                    <td className="px-5 py-3 text-zinc-300 font-mono text-xs">
                      {s.id}
                    </td>
                    <td className="px-5 py-3 text-zinc-200">
                      {s.client.name}
                    </td>
                    <td className="px-5 py-3 text-zinc-400">
                      {s.agentName || "—"}
                    </td>
                    <td className="px-5 py-3 text-zinc-400">{s.service}</td>
                    <td className="px-5 py-3">
                      <SessionStatusPill status={s.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {waiting.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-zinc-900/60 overflow-hidden">
          <div className="px-5 py-4 border-b border-white/10">
            <h3 className="text-white font-semibold text-sm">
              Waiting for Agent
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-zinc-500 text-xs uppercase tracking-wide">
                  <th className="px-5 py-3 font-medium">Session ID</th>
                  <th className="px-5 py-3 font-medium">Client</th>
                  <th className="px-5 py-3 font-medium">Service</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {waiting.map((s) => (
                  <tr
                    key={s.id}
                    onClick={() => onViewSession(s.id)}
                    className="border-t border-white/5 hover:bg-white/[0.03] cursor-pointer"
                  >
                    <td className="px-5 py-3 text-zinc-300 font-mono text-xs">
                      {s.id}
                    </td>
                    <td className="px-5 py-3 text-zinc-200">
                      {s.client.name}
                    </td>
                    <td className="px-5 py-3 text-zinc-400">{s.service}</td>
                    <td className="px-5 py-3">
                      <SessionStatusPill status={s.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
