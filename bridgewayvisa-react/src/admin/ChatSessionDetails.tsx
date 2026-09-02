import { ArrowLeft } from "lucide-react";
import { useSessions } from "../auth/SessionStore";

interface Props {
  sessionId: string;
  onBack: () => void;
}

export default function ChatSessionDetails({ sessionId, onBack }: Props) {
  const { sessions } = useSessions();
  // sessionId here is the DB UUID (session.id)
  const session = sessions.find((s) => s.id === sessionId);

  if (!session) {
    return (
      <div className="space-y-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-zinc-400 hover:text-white text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Sessions
        </button>
        <div className="rounded-xl border border-dashed border-white/10 bg-zinc-900/40 py-20 text-center">
          <p className="text-zinc-500 text-sm">Session not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-zinc-400 hover:text-white text-sm transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Sessions
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="rounded-xl border border-white/10 bg-zinc-900/60 p-5 space-y-4">
            <h3 className="text-zinc-500 text-xs uppercase tracking-wide">
              Session Info
            </h3>
            <InfoRow label="Session ID" value={session.session_id ?? session.id} mono />
            <InfoRow label="Service" value={session.service} />
            <InfoRow label="Status" value={session.status} />
            <InfoRow label="Created" value={session.createdAt} />
            {session.acceptedAt && (
              <InfoRow label="Accepted" value={session.acceptedAt} />
            )}
            {session.endedAt && (
              <InfoRow label="Ended" value={session.endedAt} />
            )}
          </div>

          <div className="rounded-xl border border-white/10 bg-zinc-900/60 p-5 space-y-4">
            <h3 className="text-zinc-500 text-xs uppercase tracking-wide">
              Client
            </h3>
            <InfoRow label="Name" value={session.client.name} />
            <InfoRow label="Email" value={session.client.email} />
            <InfoRow label="Contact" value={session.client.contact} />
            <InfoRow label="Address" value={session.client.address} />
          </div>

          <div className="rounded-xl border border-white/10 bg-zinc-900/60 p-5 space-y-4">
            <h3 className="text-zinc-500 text-xs uppercase tracking-wide">
              Agent
            </h3>
            <InfoRow
              label="Name"
              value={session.agentName || "Not assigned"}
            />
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="rounded-xl border border-white/10 bg-zinc-900/60 overflow-hidden h-full flex flex-col">
            <div className="px-5 py-4 border-b border-white/10">
              <h3 className="text-white font-semibold text-sm">
                Conversation
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4 min-h-[300px] max-h-[600px]">
              {session.messages.length === 0 ? (
                <p className="text-zinc-600 text-sm text-center py-10">
                  No messages yet.
                </p>
              ) : (
                session.messages.map((m) => {
                  const isClient = m.sender === "client";
                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${
                        isClient ? "items-start" : "items-end"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1 text-xs text-zinc-500">
                        <span className="text-zinc-400">
                          {isClient
                            ? "Client"
                            : m.internal
                            ? "System"
                            : "Agent"}
                        </span>
                        <span>{m.time}</span>
                      </div>
                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                          isClient
                            ? "bg-zinc-800 text-zinc-100 rounded-tl-sm"
                            : m.internal
                            ? "bg-yellow-700/15 text-yellow-300 border border-yellow-700/30"
                            : "bg-red-700 text-white rounded-tr-sm"
                        }`}
                      >
                        {m.text}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-zinc-500 text-sm shrink-0">{label}</span>
      <span
        className={`text-zinc-200 text-sm text-right ${
          mono ? "font-mono text-xs" : ""
        }`}
      >
        {value}
      </span>
    </div>
  );
}
