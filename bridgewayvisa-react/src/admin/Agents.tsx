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

interface AgentRecord {
  id: string;
  name: string;
  status: "Online" | "Offline";
  sessions: number;
  email: string;
}

const INITIAL_AGENTS: AgentRecord[] = [
  { id: "01", name: "Maria Santos", status: "Online", sessions: 12, email: "maria.santos@bridgeway.ph" },
  { id: "02", name: "Carlo Cruz", status: "Offline", sessions: 8, email: "carlo.cruz@bridgeway.ph" },
  { id: "03", name: "Ana Reyes", status: "Online", sessions: 15, email: "ana.reyes@bridgeway.ph" },
  { id: "04", name: "Jomar Villanueva", status: "Online", sessions: 6, email: "jomar.v@bridgeway.ph" },
  { id: "05", name: "Liza Bautista", status: "Offline", sessions: 3, email: "liza.b@bridgeway.ph" },
];

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
  agent: AgentRecord;
  onAction: (action: string, agent: AgentRecord) => void;
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
      label: agent.status === "Online" ? "Deactivate" : "Activate",
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
  onAdd: (name: string, email: string) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-sm rounded-xl border border-white/10 bg-zinc-900 p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-white font-semibold">Add Agent</h3>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-white"
          >
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
          className="w-full rounded-lg bg-zinc-950 border border-white/10 px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-red-700/60 mb-5"
        />
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border border-white/10 text-zinc-400 text-sm hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (name.trim() && email.trim()) onAdd(name.trim(), email.trim());
            }}
            className="flex-1 py-2.5 rounded-lg bg-red-700 text-white text-sm font-medium hover:bg-red-600 transition-colors"
          >
            Add Agent
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Agents() {
  const [agents, setAgents] = useState(INITIAL_AGENTS);
  const [query, setQuery] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const filtered = useMemo(
    () =>
      agents.filter((a) =>
        a.name.toLowerCase().includes(query.toLowerCase())
      ),
    [agents, query]
  );

  function handleAction(action: string, agent: AgentRecord) {
    if (action === "delete") {
      setAgents((prev) => prev.filter((a) => a.id !== agent.id));
    } else if (action === "toggle") {
      setAgents((prev) =>
        prev.map((a) =>
          a.id === agent.id
            ? { ...a, status: a.status === "Online" ? "Offline" : "Online" }
            : a
        )
      );
    }
  }

  function handleAdd(name: string, email: string) {
    const nextId = String(agents.length + 1).padStart(2, "0");
    setAgents((prev) => [
      ...prev,
      { id: nextId, name, status: "Offline" as const, sessions: 0, email },
    ]);
    setShowAdd(false);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search agent..."
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
                <th className="px-5 py-3 font-medium">ID</th>
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Sessions</th>
                <th className="px-5 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr
                  key={a.id}
                  className="border-t border-white/5 hover:bg-white/[0.03]"
                >
                  <td className="px-5 py-3 text-zinc-500 font-mono text-xs">
                    {a.id}
                  </td>
                  <td className="px-5 py-3 text-zinc-200 font-medium">
                    {a.name}
                  </td>
                  <td className="px-5 py-3 text-zinc-400 text-xs">{a.email}</td>
                  <td className="px-5 py-3">
                    <StatusDot online={a.status === "Online"} />
                  </td>
                  <td className="px-5 py-3 text-zinc-400">{a.sessions}</td>
                  <td className="px-5 py-3 text-right">
                    <ActionMenu agent={a} onAction={handleAction} />
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-8 text-center text-zinc-600 text-sm"
                  >
                    No agents match "{query}".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAdd && (
        <AddAgentModal onClose={() => setShowAdd(false)} onAdd={handleAdd} />
      )}
    </div>
  );
}
