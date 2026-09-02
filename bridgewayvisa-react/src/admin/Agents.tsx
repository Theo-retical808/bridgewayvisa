import { useState, useMemo, useRef, useEffect } from "react";
import {
  Search,
  Plus,
  MoreVertical,
  Circle,
  Eye,
  Pencil,
  UserX,
  Trash2,
  X,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { DbAgent } from "../lib/database.types";

interface AgentRow {
  id: string;
  auth_user_id: string;
  full_name: string;
  email: string;
  is_active: boolean;
  status: DbAgent["status"];
  created_at: string;
  session_count?: number;
}

function StatusDot({ online }: { online: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <Circle
        className={`w-2 h-2 ${
          online ? "fill-red-600 text-red-600" : "fill-zinc-600 text-zinc-600"
        }`}
      />
      <span className={online ? "text-zinc-200" : "text-zinc-500"}>
        {online ? "Online" : "Offline"}
      </span>
    </span>
  );
}

function ActionMenu({
  agent,
  onAction,
}: {
  agent: AgentRow;
  onAction: (action: string, agent: AgentRow) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const items = [
    { key: "view", label: "View Profile", icon: Eye },
    { key: "edit", label: "Edit", icon: Pencil },
    {
      key: "toggle",
      label: agent.is_active ? "Deactivate" : "Activate",
      icon: UserX,
    },
    { key: "delete", label: "Delete", icon: Trash2, danger: true },
  ];

  return (
    <div className="relative inline-block text-left" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-8 h-8 flex items-center justify-center rounded-md text-zinc-500 hover:text-white hover:bg-white/5"
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-44 rounded-lg border border-white/10 bg-zinc-900 shadow-xl z-20 overflow-hidden">
          {items.map(({ key, label, icon: Icon, danger }) => (
            <button
              key={key}
              onClick={() => {
                setOpen(false);
                onAction(key, agent);
              }}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-left ${
                danger
                  ? "text-red-400 hover:bg-red-700/10"
                  : "text-zinc-300 hover:bg-white/5"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function AddAgentModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (name: string, email: string, password: string) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (!name.trim() || !email.trim() || !password.trim()) return;
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await onAdd(name.trim(), email.trim(), password);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create agent.");
    }
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-sm rounded-xl border border-white/10 bg-zinc-900 p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-white font-semibold">Add Agent</h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
        <label className="block text-xs text-zinc-500 mb-1.5">Full Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Diego Fernandez"
          className="w-full rounded-lg bg-zinc-950 border border-white/10 px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-red-700/60 mb-4"
        />
        <label className="block text-xs text-zinc-500 mb-1.5">Email</label>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="e.g. diego@bridgeway.ph"
          type="email"
          className="w-full rounded-lg bg-zinc-950 border border-white/10 px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-red-700/60 mb-4"
        />
        <label className="block text-xs text-zinc-500 mb-1.5">
          Password
          <span className="text-zinc-600 ml-1">(min. 6 characters)</span>
        </label>
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Temporary password"
          type="password"
          className="w-full rounded-lg bg-zinc-950 border border-white/10 px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-red-700/60 mb-5"
        />
        {error && (
          <p className="text-red-400 text-xs bg-red-700/10 border border-red-700/30 rounded-lg px-3 py-2 mb-4">
            {error}
          </p>
        )}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border border-white/10 text-zinc-400 text-sm hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={
              loading ||
              !name.trim() ||
              !email.trim() ||
              !password.trim()
            }
            className="flex-1 py-2.5 rounded-lg bg-red-700 text-white text-sm font-medium hover:bg-red-600 transition-colors disabled:bg-red-700/40 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
            ) : (
              "Add Agent"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function EditAgentModal({
  agent,
  onClose,
  onSave,
}: {
  agent: AgentRow;
  onClose: () => void;
  onSave: (id: string, name: string) => Promise<void>;
}) {
  const [name, setName] = useState(agent.full_name);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    if (!name.trim()) return;
    setLoading(true);
    setError("");
    try {
      await onSave(agent.id, name.trim());
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update agent.");
    }
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-sm rounded-xl border border-white/10 bg-zinc-900 p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-white font-semibold">Edit Agent</h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
        <label className="block text-xs text-zinc-500 mb-1.5">Full Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg bg-zinc-950 border border-white/10 px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-red-700/60 mb-5"
        />
        {error && (
          <p className="text-red-400 text-xs bg-red-700/10 border border-red-700/30 rounded-lg px-3 py-2 mb-4">
            {error}
          </p>
        )}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border border-white/10 text-zinc-400 text-sm hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading || !name.trim()}
            className="flex-1 py-2.5 rounded-lg bg-red-700 text-white text-sm font-medium hover:bg-red-600 transition-colors disabled:bg-red-700/40"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
            ) : (
              "Save"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Agents() {
  const [agents, setAgents] = useState<AgentRow[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(true);
  const [query, setQuery] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editAgent, setEditAgent] = useState<AgentRow | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  useEffect(() => {
    fetchAgents();

    // Subscribe to live agent status changes so the admin sees
    // online/offline toggle in real time without refreshing
    const channel = supabase
      .channel("agents_presence")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "agents" },
        (payload) => {
          const updated = payload.new as AgentRow;
          setAgents((prev) =>
            prev.map((a) => (a.id === updated.id ? { ...a, ...updated } : a))
          );
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "agents" },
        (payload) => {
          const inserted = payload.new as AgentRow;
          setAgents((prev) => [inserted, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchAgents() {
    setLoadingAgents(true);
    const { data, error } = await supabase
      .from("agents")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setAgents(data as AgentRow[]);
    }
    setLoadingAgents(false);
  }

  const filtered = useMemo(
    () =>
      agents.filter(
        (a) =>
          a.full_name.toLowerCase().includes(query.toLowerCase()) ||
          a.email.toLowerCase().includes(query.toLowerCase())
      ),
    [agents, query]
  );

  async function handleAction(action: string, agent: AgentRow) {
    if (action === "edit") {
      setEditAgent(agent);
    } else if (action === "toggle") {
      // Soft deactivate/activate
      const { error } = await supabase
        .from("agents")
        .update({ is_active: !agent.is_active })
        .eq("id", agent.id);

      if (error) {
        showToast("Failed to update agent status.");
        return;
      }
      setAgents((prev) =>
        prev.map((a) =>
          a.id === agent.id ? { ...a, is_active: !a.is_active } : a
        )
      );
      showToast(
        agent.is_active ? "Agent deactivated." : "Agent activated."
      );
    } else if (action === "delete") {
      // Soft delete: just deactivate. Historical sessions remain intact.
      const { error } = await supabase
        .from("agents")
        .update({ is_active: false })
        .eq("id", agent.id);

      if (error) {
        showToast("Failed to deactivate agent.");
        return;
      }
      setAgents((prev) =>
        prev.map((a) => (a.id === agent.id ? { ...a, is_active: false } : a))
      );
      showToast("Agent deactivated (historical sessions preserved).");
    } else if (action === "view") {
      showToast(`Agent: ${agent.full_name} — ${agent.email}`);
    }
  }

  async function handleAdd(
    name: string,
    email: string,
    password: string
  ) {
    // Save the current admin session BEFORE calling signUp, because
    // signUp() shifts the JS client session to the newly created user.
    const { data: { session: adminSession } } = await supabase.auth.getSession();
    if (!adminSession) {
      throw new Error("Admin session lost. Please log in again.");
    }

    // Step 1: Create the Supabase Auth user.
    const { data: authData, error: authError } =
      await supabase.auth.signUp({ email, password });

    if (authError || !authData.user) {
      throw new Error(authError?.message || "Failed to create auth user.");
    }

    const newUserId = authData.user.id;

    // Step 2: Restore the admin session immediately so subsequent
    // calls run as the admin again, not as the newly created user.
    await supabase.auth.setSession({
      access_token: adminSession.access_token,
      refresh_token: adminSession.refresh_token,
    });

    // Step 3: Insert the agent profile via SECURITY DEFINER RPC.
    // The admin session is now restored, so is_admin() returns true.
    const { data: agentData, error: agentError } = await supabase
      .rpc("create_agent_profile", {
        p_auth_user_id: newUserId,
        p_email: email,
        p_full_name: name,
      })
      .single<AgentRow>();

    if (agentError || !agentData) {
      throw new Error(agentError?.message || "Failed to create agent profile.");
    }

    setAgents((prev) => [agentData, ...prev]);
    setShowAdd(false);
    showToast(`Agent "${name}" created successfully.`);
  }

  async function handleSaveEdit(id: string, name: string) {
    const { error } = await supabase
      .from("agents")
      .update({ full_name: name })
      .eq("id", id);

    if (error) throw new Error(error.message);

    setAgents((prev) =>
      prev.map((a) => (a.id === id ? { ...a, full_name: name } : a))
    );
    showToast("Agent updated.");
  }

  return (
    <div className="space-y-5">
      {/* Toast */}
      {toast && (
        <div className="rounded-lg border border-white/10 bg-zinc-900 px-4 py-3 text-sm text-zinc-300">
          {toast}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search agent name or email..."
            className="w-full rounded-lg bg-zinc-900/60 border border-white/10 pl-9 pr-3 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-red-700/60"
          />
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-700 hover:bg-red-600 transition-colors text-white text-sm font-medium px-4 py-2.5"
        >
          <Plus className="w-4 h-4" />
          Add Agent
        </button>
      </div>

      <div className="rounded-xl border border-white/10 bg-zinc-900/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-zinc-500 text-xs uppercase tracking-wide">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Active</th>
                <th className="px-5 py-3 font-medium">Created</th>
                <th className="px-5 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {loadingAgents ? (
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
                    {query ? `No agents match "${query}".` : "No agents yet."}
                  </td>
                </tr>
              ) : (
                filtered.map((a) => (
                  <tr
                    key={a.id}
                    className="border-t border-white/5 hover:bg-white/[0.03]"
                  >
                    <td className="px-5 py-3 text-zinc-200 font-medium">
                      {a.full_name}
                    </td>
                    <td className="px-5 py-3 text-zinc-400 text-xs">
                      {a.email}
                    </td>
                    <td className="px-5 py-3">
                      <StatusDot online={a.status === "online"} />
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full border ${
                          a.is_active
                            ? "border-emerald-700/40 text-emerald-400 bg-emerald-700/10"
                            : "border-zinc-700 text-zinc-500 bg-zinc-800/60"
                        }`}
                      >
                        {a.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-zinc-500 text-xs">
                      {new Date(a.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <ActionMenu agent={a} onAction={handleAction} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAdd && (
        <AddAgentModal
          onClose={() => setShowAdd(false)}
          onAdd={handleAdd}
        />
      )}

      {editAgent && (
        <EditAgentModal
          agent={editAgent}
          onClose={() => setEditAgent(null)}
          onSave={handleSaveEdit}
        />
      )}
    </div>
  );
}
