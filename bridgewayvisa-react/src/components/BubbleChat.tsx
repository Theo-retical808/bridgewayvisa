import { useState, useRef, useEffect } from "react";
import { Send, X, MessageCircle, CheckCircle2, Clock, Copy } from "lucide-react";
import { useSessions } from "../auth/SessionStore";
import { ChatSession } from "../auth/types";
import { supabase } from "../lib/supabase";
import { DbChatSession, DbMessage } from "../lib/database.types";
import { RealtimeChannel } from "@supabase/supabase-js";

// ─── Types ────────────────────────────────────────────────────────────────────

type Step =
  | "bubble"      // chat is closed
  | "preprompt"   // welcome + service question
  | "info"        // name / contact / email / address
  | "terms"       // accept T&C
  | "waiting"     // session created, waiting for agent
  | "chat"        // active conversation
  | "ended";      // session ended

interface ClientForm {
  name: string;
  contact: string;
  email: string;
  address: string;
  service: string;
}

interface LocalMessage {
  id: string;
  sender: "client" | "agent";
  text: string;
  time: string;
}

function timeNow() {
  return new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function ChatHeader({
  title,
  subtitle,
  onClose,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
}) {
  return (
    <div className="bg-red-700 text-white px-4 py-3.5 flex items-center justify-between shadow-md">
      <div>
        <h3 className="font-semibold text-sm tracking-wide">{title}</h3>
        {subtitle && (
          <p className="text-red-200 text-[11px] mt-0.5">{subtitle}</p>
        )}
      </div>
      <button
        onClick={onClose}
        className="text-white hover:text-red-200 transition-colors p-0.5"
        aria-label="Close chat"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function BubbleChat() {
  const { createSession } = useSessions();
  const [step, setStep] = useState<Step>("bubble");
  const [form, setForm] = useState<ClientForm>({
    name: "",
    contact: "",
    email: "",
    address: "",
    service: "",
  });
  const [termsChecked, setTermsChecked] = useState(false);
  const [session, setSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Auto-scroll messages
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  // Subscribe to realtime updates for the active session
  useEffect(() => {
    if (!session || (step !== "waiting" && step !== "chat")) return;

    const channel = supabase
      .channel(`chat_session_${session.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "chat_sessions",
          filter: `id=eq.${session.id}`,
        },
        (payload) => {
          const updated = payload.new as DbChatSession;

          // Agent joined — move from waiting to chat
          if (updated.status === "active" && step === "waiting") {
            setStep("chat");
            setSession((prev) =>
              prev ? { ...prev, status: "ACTIVE" } : prev
            );
          }

          // Session ended by agent
          if (updated.status === "ended") {
            setStep("ended");
            setSession((prev) =>
              prev ? { ...prev, status: "ENDED" } : prev
            );
          }

          // Sync messages (agent messages arrive here)
          const dbMsgs: DbMessage[] = updated.messages || [];
          const mapped: LocalMessage[] = dbMsgs.map((m) => ({
            id: m.id,
            sender: m.sender_type,
            text: m.message,
            time: new Date(m.created_at).toLocaleTimeString([], {
              hour: "numeric",
              minute: "2-digit",
            }),
          }));
          setMessages(mapped);
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [session?.id, step]);

  function handleOpen() {
    setStep("preprompt");
  }

  function handleClose() {
    // Don't destroy an active session — just close the bubble
    if (step === "waiting" || step === "chat") {
      setStep("bubble");
      return;
    }
    // Reset everything if they close before creating a session
    setStep("bubble");
    setForm({ name: "", contact: "", email: "", address: "", service: "" });
    setTermsChecked(false);
    setError("");
  }

  function handleReopen() {
    if (session && (step === "bubble")) {
      // Re-open to the correct step based on session status
      if (session.status === "WAITING") setStep("waiting");
      else if (session.status === "ACTIVE") setStep("chat");
      else if (session.status === "ENDED") setStep("ended");
    } else {
      handleOpen();
    }
  }

  async function handleStartSession() {
    if (!termsChecked) return;
    setSubmitting(true);
    setError("");

    const { session: newSession, error: err } = await createSession(
      {
        name: form.name,
        email: form.email,
        contact: form.contact,
        address: form.address,
      },
      form.service,
      new Date().toISOString()
    );

    setSubmitting(false);

    if (err || !newSession) {
      setError(err || "Failed to create session. Please try again.");
      return;
    }

    setSession(newSession);
    setMessages([]);
    setStep("waiting");
  }

  async function handleSend() {
    if (!inputText.trim() || !session || step !== "chat") return;

    const text = inputText.trim();
    setInputText("");

    // Fetch current messages, append, update
    const { data: current } = await supabase
      .from("chat_sessions")
      .select("messages")
      .eq("id", session.id)
      .single<{ messages: DbMessage[] }>();

    const existing: DbMessage[] = current?.messages || [];
    const newMsg: DbMessage = {
      id: crypto.randomUUID(),
      sender_type: "client",
      sender_id: null,
      message: text,
      created_at: new Date().toISOString(),
    };

    await supabase
      .from("chat_sessions")
      .update({ messages: [...existing, newMsg] })
      .eq("id", session.id);

    // Optimistically add to local state (realtime will also sync it)
    setMessages((prev) => [
      ...prev,
      { id: newMsg.id, sender: "client", text, time: timeNow() },
    ]);
  }

  function copySessionId() {
    if (!session) return;
    navigator.clipboard.writeText(session.session_id ?? session.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const isOpen = step !== "bubble";

  return (
    <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end">
      {/* Chat Window */}
      {isOpen && (
        <div className="mb-4 w-80 bg-neutral-900 rounded-2xl shadow-2xl border border-red-900/40 flex flex-col overflow-hidden max-h-[80vh]">

          {/* ── Step: Pre-prompt ── */}
          {step === "preprompt" && (
            <>
              <ChatHeader
                title="Chat with Us"
                subtitle="Bridgeway Visa Support"
                onClose={handleClose}
              />
              <div className="flex-1 p-4 overflow-y-auto text-gray-200 text-sm space-y-4 bg-neutral-900">
                <div className="bg-neutral-800 p-3 rounded-xl border border-neutral-700/50">
                  <p>
                    Hello! 👋 Welcome to{" "}
                    <span className="text-red-400 font-semibold">
                      Bridgeway Visa
                    </span>
                    . How can we assist your travel plans today?
                  </p>
                </div>
                <div>
                  <label className="block text-xs text-neutral-400 mb-1.5">
                    What service do you need help with? *
                  </label>
                  <textarea
                    value={form.service}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, service: e.target.value }))
                    }
                    placeholder="e.g. Student visa for Canada, tourist visa for Spain..."
                    rows={3}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-600 resize-none"
                  />
                </div>
              </div>
              <div className="p-3 bg-neutral-900 border-t border-neutral-800">
                <button
                  onClick={() => {
                    if (!form.service.trim()) return;
                    setStep("info");
                  }}
                  disabled={!form.service.trim()}
                  className="w-full bg-red-700 hover:bg-red-600 disabled:bg-red-700/40 disabled:cursor-not-allowed text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
                >
                  Continue
                </button>
              </div>
            </>
          )}

          {/* ── Step: Client Info ── */}
          {step === "info" && (
            <>
              <ChatHeader
                title="Your Information"
                subtitle="We need a few details to assist you"
                onClose={handleClose}
              />
              <div className="flex-1 p-4 overflow-y-auto text-sm space-y-3 bg-neutral-900">
                {(
                  [
                    { key: "name", label: "Full Name", placeholder: "Juan dela Cruz", type: "text" },
                    { key: "contact", label: "Contact Number", placeholder: "+63 9XX XXX XXXX", type: "tel" },
                    { key: "email", label: "Email Address", placeholder: "juan@example.com", type: "email" },
                    { key: "address", label: "Address", placeholder: "City, Province, Philippines", type: "text" },
                  ] as const
                ).map(({ key, label, placeholder, type }) => (
                  <div key={key}>
                    <label className="block text-xs text-neutral-400 mb-1">
                      {label} *
                    </label>
                    <input
                      type={type}
                      value={form[key]}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, [key]: e.target.value }))
                      }
                      placeholder={placeholder}
                      className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-600"
                    />
                  </div>
                ))}
              </div>
              <div className="p-3 bg-neutral-900 border-t border-neutral-800 flex gap-2">
                <button
                  onClick={() => setStep("preprompt")}
                  className="flex-1 py-2.5 rounded-lg border border-neutral-700 text-neutral-400 text-sm hover:bg-white/5"
                >
                  Back
                </button>
                <button
                  onClick={() => {
                    const { name, contact, email, address } = form;
                    if (!name || !contact || !email || !address) return;
                    setStep("terms");
                  }}
                  disabled={
                    !form.name || !form.contact || !form.email || !form.address
                  }
                  className="flex-1 bg-red-700 hover:bg-red-600 disabled:bg-red-700/40 disabled:cursor-not-allowed text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
                >
                  Continue
                </button>
              </div>
            </>
          )}

          {/* ── Step: Terms ── */}
          {step === "terms" && (
            <>
              <ChatHeader
                title="Terms & Conditions"
                subtitle="Please read before starting"
                onClose={handleClose}
              />
              <div className="flex-1 p-4 overflow-y-auto text-sm bg-neutral-900 space-y-4">
                <div className="bg-neutral-800 rounded-lg p-3 text-xs text-neutral-400 leading-relaxed border border-neutral-700/50 max-h-40 overflow-y-auto">
                  <p className="font-semibold text-neutral-300 mb-2">
                    Bridgeway Visa — Live Chat Terms
                  </p>
                  <p>
                    By starting this chat, you agree that the information you
                    provide (name, contact, email, address, and service inquiry)
                    will be used solely to process your visa consultation
                    request.
                  </p>
                  <p className="mt-2">
                    All conversations are recorded for quality assurance and
                    compliance purposes. Do not share sensitive documents (e.g.,
                    passport numbers, financial details) through this chat.
                  </p>
                  <p className="mt-2">
                    Your data will be handled in accordance with the Data
                    Privacy Act of 2012 (Republic Act No. 10173).
                  </p>
                </div>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={termsChecked}
                    onChange={(e) => setTermsChecked(e.target.checked)}
                    className="mt-0.5 accent-red-600"
                  />
                  <span className="text-xs text-neutral-300">
                    I have read and agree to the Terms and Conditions.
                  </span>
                </label>
                {error && (
                  <p className="text-red-400 text-xs bg-red-700/10 border border-red-700/30 rounded-lg px-3 py-2">
                    {error}
                  </p>
                )}
              </div>
              <div className="p-3 bg-neutral-900 border-t border-neutral-800 flex gap-2">
                <button
                  onClick={() => setStep("info")}
                  className="flex-1 py-2.5 rounded-lg border border-neutral-700 text-neutral-400 text-sm hover:bg-white/5"
                >
                  Back
                </button>
                <button
                  onClick={handleStartSession}
                  disabled={!termsChecked || submitting}
                  className="flex-1 bg-red-700 hover:bg-red-600 disabled:bg-red-700/40 disabled:cursor-not-allowed text-white py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    "Start Chat"
                  )}
                </button>
              </div>
            </>
          )}

          {/* ── Step: Waiting ── */}
          {step === "waiting" && session && (
            <>
              <ChatHeader
                title="Chat with Us"
                subtitle="Bridgeway Visa Support"
                onClose={handleClose}
              />
              <div className="flex-1 p-4 flex flex-col items-center justify-center text-center space-y-5 bg-neutral-900">
                <div className="w-12 h-12 rounded-full bg-red-700/15 border border-red-700/30 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-red-500 animate-pulse" />
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">
                    You're in the queue
                  </p>
                  <p className="text-neutral-400 text-xs mt-1">
                    Please wait while we connect you to an available agent.
                  </p>
                </div>
                <div className="bg-neutral-800 rounded-xl border border-neutral-700/50 px-4 py-3 w-full text-left">
                  <p className="text-neutral-500 text-[10px] uppercase tracking-wide mb-1">
                    Session ID
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-white text-sm font-mono font-semibold">
                      {session.session_id ?? session.id}
                    </span>
                    <button
                      onClick={copySessionId}
                      className="text-neutral-500 hover:text-white transition-colors"
                      title="Copy session ID"
                    >
                      {copied ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                  <p className="text-neutral-600 text-[10px] mt-1">
                    Save this ID for reference.
                  </p>
                </div>
              </div>
            </>
          )}

          {/* ── Step: Chat ── */}
          {step === "chat" && session && (
            <>
              <ChatHeader
                title={`Session ${session.session_id ?? session.id}`}
                subtitle="Connected to an agent"
                onClose={handleClose}
              />
              <div
                ref={scrollRef}
                className="flex-1 p-3 overflow-y-auto space-y-3 bg-neutral-900 min-h-0"
                style={{ maxHeight: "300px" }}
              >
                {messages.length === 0 && (
                  <div className="text-center py-6 text-neutral-600 text-xs">
                    Agent has joined. Say hello!
                  </div>
                )}
                {messages.map((m) => {
                  const isClient = m.sender === "client";
                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${
                        isClient ? "items-end" : "items-start"
                      }`}
                    >
                      <div className="text-[10px] text-neutral-500 mb-0.5 px-1">
                        {m.time}
                      </div>
                      <div
                        className={`max-w-[80%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                          isClient
                            ? "bg-red-700 text-white rounded-tr-sm"
                            : "bg-neutral-800 text-neutral-100 rounded-tl-sm"
                        }`}
                      >
                        {m.text}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="p-3 bg-neutral-900 border-t border-neutral-800 flex gap-2 items-center">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Type a message..."
                  className="flex-1 bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-red-600 transition-colors"
                />
                <button
                  onClick={handleSend}
                  className="bg-red-700 hover:bg-red-600 text-white p-2 rounded-lg transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </>
          )}

          {/* ── Step: Ended ── */}
          {step === "ended" && session && (
            <>
              <ChatHeader
                title="Chat Ended"
                subtitle={session.session_id ?? session.id}
                onClose={handleClose}
              />
              <div className="flex-1 p-4 flex flex-col items-center justify-center text-center space-y-4 bg-neutral-900">
                <div className="w-12 h-12 rounded-full bg-emerald-700/15 border border-emerald-700/30 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">
                    Conversation Ended
                  </p>
                  <p className="text-neutral-400 text-xs mt-1">
                    Your session has been completed. Thank you for contacting
                    Bridgeway Visa.
                  </p>
                </div>
                <div className="bg-neutral-800 rounded-lg px-4 py-3 w-full text-center">
                  <p className="text-neutral-500 text-[10px] uppercase tracking-wide mb-1">
                    Session ID
                  </p>
                  <p className="text-white font-mono text-sm">
                    {session.session_id ?? session.id}
                  </p>
                </div>
              </div>
              <div className="p-3 bg-neutral-900 border-t border-neutral-800">
                <button
                  onClick={() => {
                    // Reset for a new session
                    setStep("preprompt");
                    setSession(null);
                    setMessages([]);
                    setForm({
                      name: "",
                      contact: "",
                      email: "",
                      address: "",
                      service: "",
                    });
                    setTermsChecked(false);
                  }}
                  className="w-full bg-red-700 hover:bg-red-600 text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
                >
                  Start New Chat
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Bubble Toggle Button */}
      <button
        onClick={isOpen ? handleClose : (session ? handleReopen : handleOpen)}
        className="w-14 h-14 bg-red-700 hover:bg-red-600 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 focus:outline-none ring-2 ring-red-900/30 relative"
        aria-label="Toggle chat"
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <MessageCircle className="w-6 h-6" />
        )}
        {/* Indicator dot when session is active but chat is closed */}
        {!isOpen && session && session.status !== "ENDED" && (
          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-zinc-950" />
        )}
      </button>
    </div>
  );
}
