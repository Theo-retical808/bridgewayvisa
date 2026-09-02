import {
  LayoutDashboard,
  Users,
  MessageSquare,
  History,
  LogOut,
  User,
} from "lucide-react";
import { useAuth } from "../../auth/AuthContext";

const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "agents", label: "Agents", icon: Users },
  { key: "sessions", label: "Chat Sessions", icon: MessageSquare },
  { key: "history", label: "History", icon: History },
];

interface Props {
  current: string;
  onNavigate: (key: string) => void;
}

export default function AdminSidebar({ current, onNavigate }: Props) {
  const { logout } = useAuth();

  return (
    <aside className="hidden lg:flex lg:flex-col w-64 shrink-0 bg-zinc-950 border-r border-white/10 h-screen sticky top-0">
      <div className="px-6 pt-7 pb-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-red-700 to-red-900 flex items-center justify-center text-white font-bold text-sm">
            BW
          </div>
          <div>
            <p className="text-white font-semibold leading-tight text-sm">
              Bridgeway
            </p>
            <p className="text-zinc-500 text-[11px] tracking-wide">
              Admin Portal
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-5 space-y-1">
        {NAV_ITEMS.map(({ key, label, icon: Icon }) => {
          const isActive = current === key;
          return (
            <button
              key={key}
              onClick={() => onNavigate(key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? "bg-red-700/15 text-white border border-red-700/30"
                  : "text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent"
              }`}
            >
              <Icon
                className={`w-4 h-4 ${isActive ? "text-red-500" : "text-zinc-500"}`}
              />
              {label}
            </button>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-white/10 space-y-1">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-zinc-300">
          <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center">
            <User className="w-3.5 h-3.5 text-zinc-400" />
          </div>
          Admin
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
