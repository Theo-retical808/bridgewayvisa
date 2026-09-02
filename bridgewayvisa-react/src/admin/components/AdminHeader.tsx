import { User } from "lucide-react";
import { useAuth } from "../../auth/AuthContext";

const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard" },
  { key: "agents", label: "Agents" },
  { key: "sessions", label: "Sessions" },
  { key: "history", label: "History" },
];

interface Props {
  title: string;
  current: string;
  onNavigate: (key: string) => void;
}

export default function AdminHeader({ title, current, onNavigate }: Props) {
  const { logout, user } = useAuth();

  return (
    <div className="sticky top-0 z-10 bg-zinc-950/95 backdrop-blur border-b border-white/10">
      <div className="px-5 sm:px-8 py-5 flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-wide">
          {title}
        </h1>
        <div className="flex items-center gap-3">
          <span className="hidden sm:block text-xs text-zinc-500">
            {user?.fullName}
          </span>
          <button
            onClick={logout}
            className="hidden sm:flex items-center gap-2 text-xs text-zinc-500 hover:text-red-400 transition-colors"
          >
            Logout
          </button>
          <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center lg:hidden">
            <User className="w-4 h-4 text-zinc-400" />
          </div>
        </div>
      </div>
      <div className="flex lg:hidden overflow-x-auto px-5 pb-3 gap-2">
        {NAV_ITEMS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => onNavigate(key)}
            className={`shrink-0 text-xs px-3 py-1.5 rounded-full border ${
              current === key
                ? "border-red-700/40 bg-red-700/15 text-white"
                : "border-white/10 text-zinc-400"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
