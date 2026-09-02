import { useState } from "react";
import { Search } from "lucide-react";
import { useSessions } from "../auth/SessionStore";
import { useAuth } from "../auth/AuthContext";
import ChatSessionDetails from "../admin/ChatSessionDetails";

export default function AgentHistory() {
  const { getAgentSessions } = useSessions();
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  const mySessions = user
    ? getAgentSessions(user.profileId).filter((s) => s.status === "ENDED")
    : [];

  const filtered = mySessions.filter(
    (s) =>
      (s.session_id ?? s.id).toLowerCase().includes(query.toLowerCase()) ||
      s.client.name.toLowerCase().includes(query.toLowerCase())
  );

  if (selected) {
    return (
      <ChatSessionDetails
        sessionId={selected}
        onBack={() => setSelected(null)}
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="relative w-full sm:max-w-xs">
        <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search session or client..."
          className="w-full rounded-lg bg-zinc-900/60 border border-white/10 pl-9 pr-3 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-red-700/60"
        />
      </div>

      <div className="rounded-xl border border-white/10 bg-zinc-900/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-zinc-500 text-xs uppercase tracking-wide">
                <th className="px-5 py-3 font-medium">Session</th>
                <th className="px-5 py-3 font-medium">Client</th>
                <th className="px-5 py-3 font-medium">Service</th>
                <th className="px-5 py-3 font-medium">Created</th>
                <th className="px-5 py-3 font-medium">Ended</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr
                  key={s.id}
                  onClick={() => setSelected(s.id)}
                  className="border-t border-white/5 hover:bg-white/[0.03] cursor-pointer"
                >
                  <td className="px-5 py-3 text-zinc-500 font-mono text-xs">
                    {s.session_id ?? s.id}
                  </td>
                  <td className="px-5 py-3 text-zinc-200">{s.client.name}</td>
                  <td className="px-5 py-3 text-zinc-400">{s.service}</td>
                  <td className="px-5 py-3 text-zinc-500">{s.createdAt}</td>
                  <td className="px-5 py-3 text-zinc-500">{s.endedAt ?? "—"}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-8 text-center text-zinc-600 text-sm"
                  >
                    No completed sessions yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
