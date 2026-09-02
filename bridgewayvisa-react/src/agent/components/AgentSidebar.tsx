import {
  LayoutDashboard,
  Clock,
  MessageSquare,
  History,
  User,
  LogOut,
} from "lucide-react";
import { useAuth } from "../../auth/AuthContext";

const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "queue", label: "Waiting Queue", icon: Clock },
  { key: "chat", label: "Active Chat", icon: MessageSquare },
  { key: "history", label: "My Sessions", icon: History },
  { key: "askadmin", label: "Ask Admin", icon: User },
];

interface Props {
  current: string;
  onNavigate: (key: string) => void;
  hasActiveChat: boolean;
  askAdminCount: number;
}

export default function AgentSidebar({
  current,
  onNavigate,
  hasActiveChat,
  askAdminCount,
}: Props) {
  const { user, logout } = useAuth();

  return (
    <aside className="hidden lg:flex lg:flex-col w-60 shrink-0 bg-zinc-950 border-r border-white/10 h-screen sticky top-0">
      <div className="px-6 pt-7 pb-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-red-700 to-red-900 flex items-center justify-center text-white font-bold text-sm">
            BW
          </div>
          <div>
            <p className="text-white font-semibold leading-tight text-sm">
              Agent Portal
            </p>
            <p className="text-zinc-500 text-[11px] tracking-wide">
              Bridgeway
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-5 space-y-1">
        {NAV_ITEMS.map(({ key, label, icon: Icon }) => {
          const isActive = current === key;
          const isChat = key === "chat";
          const disabled = isChat && !hasActiveChat;
          return (
            <button
              key={key}
              onClick={() => onNavigate(key)}
              disabled={disabled}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? "bg-red-700/15 text-white border border-red-700/30"
                  : disabled
                  ? "text-zinc-700 border border-transparent cursor-not-allowed"
                  : "text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent"
              }`}
            >
              <Icon
                className={`w-4 h-4 ${
                  isActive
                    ? "text-red-500"
                    : disabled
                    ? "text-zinc-700"
                    : "text-zinc-500"
                }`}
              />
              {label}
              {isChat && hasActiveChat && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-red-500" />
              )}
              {key === "askadmin" && askAdminCount > 0 && (
                <span className="ml-auto text-[10px] font-semibold text-white bg-red-700 rounded-full px-1.5 py-0.5">
                  {askAdminCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-zinc-300">
          <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center">
            <User className="w-3.5 h-3.5 text-zinc-400" />
          </div>
          {user?.name || "Agent"}
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-zinc-500 hover:text-red-400 hover:bg-white/5 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}