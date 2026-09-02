import { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  Paperclip,
  Send,
  StickyNote,
  Repeat,
  AlertTriangle,
  CircleX,
  Circle,
} from "lucide-react";
import { useSessions } from "../auth/SessionStore";
import { ChatSession } from "../auth/types";
import { useAuth } from "../auth/AuthContext";

interface Props {
  session: ChatSession;
  onBack: () => void;
  onEnd: () => void;
}

function timeNow(): string {
  return new Date().toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function MessageBubble({
  message,
}: {
  message: ChatSession["messages"][number];
}) {
  const isAgent = message.sender === "agent";
  return (
    <div className={`flex flex-col ${isAgent ? "items-end" : "items-start"}`}>
      <div className="flex items-center gap-2 mb-1 text-xs text-zinc-500">
        {isAgent ? (
          <>
            <span>{message.time}</span>
            <span className="text-zinc-400">Agent</span>
          </>
        ) : (
          <>
            <span className="text-zinc-400">Client</span>
            <span>{message.time}</span>
          </>
        )}
      </div>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isAgent
            ? "bg-red-700 text-white rounded-tr-sm"
            : "bg-zinc-800 text-zinc-100 rounded-tl-sm"
        }`}
      >
        {message.text}
      </div>
    </div>
  );
}

function SessionStatusTag({ status }: { status: string }) {
  const active = status === "ACTIVE";
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-zinc-400">
      <Circle
        className={`w-1.5 h-1.5 ${
          active ? "fill-red-500 text-red-500" : "fill-zinc-500 text-zinc-500"
        }`}
      />
      {status}
    </span>
  );
}

function MessageInput({
  onSend,
  disabled,
}: {
  onSend: (text: string) => void;
  disabled?: boolean;
}) {
  const [value, setValue] = useState("");

  function submit() {
    const text = value.trim();
    if (!text || disabled) return;
    onSend(text);
    setValue("");
  }

  return (
    <div className="px-5 sm:px-6 py-3 border-t border-white/10">
      <div className="flex items-center gap-3">
        <button
          className="text-zinc-500 hover:text-white shrink-0"
          disabled={disabled}
        >
          <Paperclip className="w-4 h-4" />
        </button>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder={
            disabled ? "Conversation has ended." : "Type your message..."
          }
          disabled={disabled}
          className="flex-1 bg-zinc-900/60 border border-white/10 rounded-full px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-red-700/60 disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <button
          onClick={submit}
          disabled={disabled}
          className="shrink-0 inline-flex items-center gap-1.5 text-sm font-medium text-white bg-red-700 hover:bg-red-600 transition-colors px-4 py-2.5 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-3.5 h-3.5" />
          Send
        </button>
      </div>
    </div>
  );
}

export default function AgentChat({ session, onBack, onEnd }: Props) {
  const { addMessage, setAskAdmin } = useSessions();
  const { user } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [askOpen, setAskOpen] = useState(false);
  const [askText, setAskText] = useState("");
  const [endOpen, setEndOpen] = useState(false);
  const [sending, setSending] = useState(false);

  const isEnded = session.status === "ENDED";

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [session.messages]);

  async function handleSend(text: string) {
    if (sending || isEnded) return;
    setSending(true);
    await addMessage(session.id, {
      sender: "agent",
      sender_id: user?.profileId ?? null,
      text,
      time: timeNow(),
    });
    setSending(false);
  }

  function handleAskAdmin() {
    if (!askText.trim()) return;
    setAskAdmin(session.id, askText.trim());
    setAskOpen(false);
    setAskText("");
  }

  return (
    <div className="flex flex-1 min-w-0 flex-col h-full">
      {/* Header */}
      <div className="px-5 sm:px-6 py-4 border-b border-white/10 flex items-center gap-4">
        <button
          onClick={onBack}
          className="text-zinc-500 hover:text-white lg:hidden"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <p className="text-white font-semibold text-sm">
            {session.client.name}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-zinc-500 text-xs font-mono">
              {session.session_id}
            </span>
            <span className="text-zinc-700">&middot;</span>
            <SessionStatusTag status={session.status} />
          </div>
        </div>
      </div>

      {/* Client & service info strip */}
      <div className="px-5 sm:px-6 py-3 border-b border-white/10 flex flex-wrap gap-x-6 gap-y-1 text-xs text-zinc-500">
        <span>
          Service:{" "}
          <span className="text-zinc-300">{session.service}</span>
        </span>
        <span>
          Contact:{" "}
          <span className="text-zinc-300">{session.client.contact}</span>
        </span>
        <span>
          Email:{" "}
          <span className="text-zinc-300">{session.client.email}</span>
        </span>
      </div>

      {/* Ended banner */}
      {isEnded && (
        <div className="px-5 sm:px-6 py-2.5 bg-zinc-800/60 border-b border-white/10 text-center">
          <p className="text-xs text-zinc-400">
            This conversation has ended. No new messages can be sent.
          </p>
        </div>
      )}

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-5 sm:px-6 py-6 space-y-5"
      >
        {session.messages.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-zinc-600 text-sm">
              Say hello to start the conversation.
            </p>
            <div className="mt-4 mx-auto max-w-sm rounded-xl border border-white/5 bg-zinc-900/60 p-4 text-left">
              <p className="text-zinc-500 text-xs uppercase tracking-wide mb-2">
                Client Information
              </p>
              <p className="text-zinc-300 text-sm">{session.client.name}</p>
              <p className="text-zinc-500 text-xs mt-0.5">
                {session.client.email}
              </p>
              <p className="text-zinc-500 text-xs">{session.client.contact}</p>
              <p className="text-zinc-500 text-xs">{session.client.address}</p>
              <p className="text-zinc-500 text-xs mt-1">{session.service}</p>
            </div>
          </div>
        ) : (
          session.messages.map((m) => (
            <MessageBubble key={m.id} message={m} />
          ))
        )}
      </div>

      {/* Ask admin banner */}
      {session.askAdmin && session.askAdmin.pending && (
        <div className="px-5 sm:px-6 py-2.5 border-t border-yellow-700/30 bg-yellow-700/10 flex items-center justify-between">
          <p className="text-xs text-yellow-300">
            Question sent to admin &mdash; waiting for a response.
          </p>
          <span className="text-[10px] text-yellow-500 uppercase tracking-wide">
            Pending
          </span>
        </div>
      )}
      {session.askAdmin && session.askAdmin.answer && (
        <div className="px-5 sm:px-6 py-2.5 border-t border-red-700/30 bg-red-700/10 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs text-zinc-500">Admin response:</p>
            <p className="text-xs text-red-300 mt-0.5">
              {session.askAdmin.answer}
            </p>
          </div>
          <button
            onClick={() => setAskOpen(true)}
            className="shrink-0 text-[10px] text-red-400 hover:text-white uppercase tracking-wide"
          >
            Ask Again
          </button>
        </div>
      )}

      {/* Action bar */}
      {!isEnded && (
        <div className="px-5 sm:px-6 py-3 border-t border-white/10 flex flex-wrap items-center gap-2">
          <button
            onClick={() => setAskOpen(true)}
            className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white border border-white/10 hover:border-white/20 px-3 py-1.5 rounded-lg transition-colors"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Ask Admin
          </button>
          <button
            onClick={() => setAskOpen(true)}
            className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white border border-white/10 hover:border-white/20 px-3 py-1.5 rounded-lg transition-colors"
          >
            <StickyNote className="w-3.5 h-3.5" />
            Add Note
          </button>
          <button
            disabled
            className="inline-flex items-center gap-1.5 text-xs text-zinc-600 border border-white/5 px-3 py-1.5 rounded-lg cursor-not-allowed"
          >
            <Repeat className="w-3.5 h-3.5" />
            Transfer
          </button>
          <button
            onClick={() => setEndOpen(true)}
            className="ml-auto inline-flex items-center gap-1.5 text-xs text-red-400 hover:text-white hover:bg-red-700 border border-red-700/40 px-3 py-1.5 rounded-lg transition-colors"
          >
            <CircleX className="w-3.5 h-3.5" />
            End Conversation
          </button>
        </div>
      )}

      <MessageInput onSend={handleSend} disabled={isEnded || sending} />

      {/* Ask admin modal */}
      {askOpen && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-sm rounded-xl border border-white/10 bg-zinc-900 p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-semibold">Ask Admin</h3>
              <button
                onClick={() => setAskOpen(false)}
                className="text-zinc-500 hover:text-white"
              >
                <CircleX className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-zinc-500 mb-3">
              Session {session.session_id} &middot; {session.client.name}
            </p>
            <label className="block text-xs text-zinc-500 mb-1.5">
              Your question
            </label>
            <textarea
              value={askText}
              onChange={(e) => setAskText(e.target.value)}
              placeholder="Describe what you need help with..."
              rows={4}
              className="w-full rounded-lg bg-zinc-950 border border-white/10 px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-red-700/60 mb-5 resize-none"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setAskOpen(false)}
                className="flex-1 py-2.5 rounded-lg border border-white/10 text-zinc-400 text-sm hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                onClick={handleAskAdmin}
                className="flex-1 py-2.5 rounded-lg bg-red-700 text-white text-sm font-medium hover:bg-red-600 transition-colors"
              >
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* End conversation confirm */}
      {endOpen && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-sm rounded-xl border border-white/10 bg-zinc-900 p-6">
            <h3 className="text-white font-semibold mb-2">
              End Conversation
            </h3>
            <p className="text-sm text-zinc-400">
              Are you sure you want to end this conversation with{" "}
              {session.client.name}?
            </p>
            <p className="text-xs text-zinc-600 mt-1">
              The session will be marked as completed and saved to history.
            </p>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setEndOpen(false)}
                className="flex-1 py-2.5 rounded-lg border border-white/10 text-zinc-400 text-sm hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                onClick={onEnd}
                className="flex-1 py-2.5 rounded-lg bg-red-700 text-white text-sm font-medium hover:bg-red-600 transition-colors"
              >
                End Conversation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
