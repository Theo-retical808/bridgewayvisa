import { useSessions } from "../auth/SessionStore";

function SessionStatusPill({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${
        status === "ENDED"
          ? "border-zinc-700 bg-zinc-800/60 text-zinc-400"
          : status === "ACTIVE"
          ? "border-red-700/40 bg-red-700/10 text-red-400"
          : "border-yellow-700/40 bg-yellow-700/10 text-yellow-400"
      }`}
    >
      {status}
    </span>
  );
}

export default function AgentHistory() {
  const { sessions, loadingSessions } = useSessions();

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-white/10 bg-zinc-900/60 overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10">
          <h3 className="text-white font-semibold text-sm">All Sessions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-zinc-500 text-xs uppercase tracking-wide">
                <th className="px-5 py-3 font-medium">Session</th>
                <th className="px-5 py-3 font-medium">Client</th>
                <th className="px-5 py-3 font-medium">Agent</th>
                <th className="px-5 py-3 font-medium">Service</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Created</th>
                <th className="px-5 py-3 font-medium">Ended</th>
              </tr>
            </thead>
            <tbody>
              {loadingSessions ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center">
                    <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin inline-block" />
                  </td>
                </tr>
              ) : sessions.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-8 text-center text-zinc-600 text-sm"
                  >
                    No sessions found.
                  </td>
                </tr>
              ) : (
                sessions.map((s) => (
                  <tr
                    key={s.id}
                    className="border-t border-white/5 hover:bg-white/[0.03]"
                  >
                    <td className="px-5 py-3 text-zinc-500 font-mono text-xs">
                      {s.session_id ?? s.id}
                    </td>
                    <td className="px-5 py-3 text-zinc-200">{s.client.name}</td>
                    <td className="px-5 py-3 text-zinc-400">
                      {s.agentName || "—"}
                    </td>
                    <td className="px-5 py-3 text-zinc-400">{s.service}</td>
                    <td className="px-5 py-3">
                      <SessionStatusPill status={s.status} />
                    </td>
                    <td className="px-5 py-3 text-zinc-500">{s.createdAt}</td>
                    <td className="px-5 py-3 text-zinc-500">
                      {s.endedAt || "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
