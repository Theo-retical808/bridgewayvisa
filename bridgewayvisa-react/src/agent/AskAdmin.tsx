import { useState } from "react";
import { Send, CheckCircle2, CircleX } from "lucide-react";
import { useSessions } from "../auth/SessionStore";
import { ChatSession } from "../auth/types";

function timeNow(): string {
  return new Date().toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function AskAdmin() {
  const { sessions, setAskAdmin, addMessage } = useSessions();
  const [selected, setSelected] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");

  const mySentRequests = sessions.filter((s) => s.askAdmin);

  function handleSend() {
    if (!selected || !question.trim()) return;
    setAskAdmin(selected, question.trim());
    addMessage(selected, {
      sender: "agent",
      text: `[Internal request to admin] ${question.trim()}`,
      time: timeNow(),
      internal: true,
    });
    setOpen(false);
    setQuestion("");
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-sm text-zinc-400">
          Ask the admin for assistance on a session. The client will not see
          these internal requests.
        </p>
        <button
          onClick={() => {
            setSelected(null);
            setOpen(true);
          }}
          className="shrink-0 inline-flex items-center justify-center gap-2 rounded-lg bg-red-700 hover:bg-red-600 transition-colors text-white text-sm font-medium px-4 py-2.5"
        >
          <Send className="w-4 h-4" />
          Ask Admin
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {mySentRequests.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 bg-zinc-900/40 py-10 text-center text-zinc-600 text-sm col-span-full">
            No admin requests yet. Click &quot;Ask Admin&quot; to get help.
          </div>
        ) : (
          mySentRequests.map((s) => (
            <RequestCard key={s.id} session={s} />
          ))
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-sm rounded-xl border border-white/10 bg-zinc-900 p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-semibold">Ask Admin</h3>
              <button
                onClick={() => setOpen(false)}
                className="text-zinc-500 hover:text-white"
              >
                <CircleX className="w-4 h-4" />
              </button>
            </div>

            <label className="block text-xs text-zinc-500 mb-1.5">
              Session
            </label>
            <select
              value={selected ?? ""}
              onChange={(e) => setSelected(e.target.value || null)}
              className="w-full rounded-lg bg-zinc-950 border border-white/10 px-3.5 py-2.5 text-sm text-white outline-none focus:border-red-700/60 mb-4"
            >
              <option value="">Select a session...</option>
              {sessions
                .filter((s) => s.status === "ACTIVE" || s.status === "COMPLETED")
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.id} &middot; {s.client.name}
                  </option>
                ))}
            </select>

            <label className="block text-xs text-zinc-500 mb-1.5">
              Question
            </label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Describe what you need help with..."
              rows={4}
              className="w-full rounded-lg bg-zinc-950 border border-white/10 px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-red-700/60 mb-5 resize-none"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setOpen(false)}
                className="flex-1 py-2.5 rounded-lg border border-white/10 text-zinc-400 text-sm hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={!selected || !question.trim()}
                className="flex-1 py-2.5 rounded-lg bg-red-700 text-white text-sm font-medium hover:bg-red-600 transition-colors disabled:bg-red-700/40 disabled:cursor-not-allowed"
              >
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RequestCard({ session }: { session: ChatSession }) {
  return (
    <div className="rounded-xl border border-white/10 bg-zinc-900/60 p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-white text-sm font-semibold">
            {session.askAdmin?.question}
          </p>
          <p className="text-zinc-500 text-xs mt-0.5">
            {session.id} &middot; {session.client.name}
          </p>
        </div>
        {session.askAdmin?.pending ? (
          <span className="shrink-0 text-[10px] font-medium text-yellow-300 bg-yellow-700/10 border border-yellow-700/30 px-2 py-1 rounded-full">
            Pending
          </span>
        ) : (
          <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-medium text-emerald-300 bg-emerald-700/10 border border-emerald-700/30 px-2 py-1 rounded-full">
            <CheckCircle2 className="w-3 h-3" />
            Answered
          </span>
        )}
      </div>
      {session.askAdmin?.answer && (
        <div className="mt-2 rounded-lg border border-red-700/20 bg-red-700/5 px-3.5 py-2.5">
          <p className="text-xs text-zinc-500 mb-0.5">Admin response</p>
          <p className="text-sm text-red-300">{session.askAdmin.answer}</p>
        </div>
      )}
    </div>
  );
}