import { useState } from "react";
import { Search } from "lucide-react";
import { useSessions } from "../auth/SessionStore";

interface Props {
  onViewSession: (id: string) => void;
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
      {status}
    </span>
  );
}

export default function ChatSessions({ onViewSession }: Props) {
  const { sessions, loadingSessions } = useSessions();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const filtered = sessions.filter((s) => {
    const sid = s.session_id ?? s.id;
    const matchQuery =
      sid.toLowerCase().includes(query.toLowerCase()) ||
      s.client.name.toLowerCase().includes(query.toLowerCase()) ||
      s.client.email.toLowerCase().includes(query.toLowerCase()) ||
      s.client.contact.toLowerCase().includes(query.toLowerCase());
    const matchStatus =
      statusFilter === "ALL" || s.status === statusFilter;
    return matchQuery && matchStatus;
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search session, client, email, contact..."
            className="w-full rounded-lg bg-zinc-900/60 border border-white/10 pl-9 pr-3 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-red-700/60"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg bg-zinc-900/60 border border-white/10 px-3 py-2.5 text-sm text-zinc-300 outline-none focus:border-red-700/60"
        >
          <option value="ALL">All Status</option>
          <option value="WAITING">Waiting</option>
          <option value="ACTIVE">Active</option>
          <option value="ENDED">Ended</option>
        </select>
      </div>

      <div className="rounded-xl border border-white/10 bg-zinc-900/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-zinc-500 text-xs uppercase tracking-wide">
                <th className="px-5 py-3 font-medium">Session ID</th>
                <th className="px-5 py-3 font-medium">Client</th>
                <th className="px-5 py-3 font-medium">Agent</th>
                <th className="px-5 py-3 font-medium">Service</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {loadingSessions ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center">
                    <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin inline-block" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-8 text-center text-zinc-600 text-sm"
                  >
                    No sessions found.
                  </td>
                </tr>
              ) : (
                filtered.map((s) => (
                  <tr
                    key={s.id}
                    onClick={() => onViewSession(s.id)}
                    className="border-t border-white/5 hover:bg-white/[0.03] cursor-pointer"
                  >
                    <td className="px-5 py-3 text-zinc-300 font-mono text-xs">
                      {s.session_id ?? s.id}
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
                    <td className="px-5 py-3 text-zinc-500">{s.createdAt}</td>
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
