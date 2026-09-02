import { useState, FormEvent } from "react";
import { Eye, EyeOff, LogIn } from "lucide-react";

interface LoginLayoutProps {
  title: string;
  subtitle: string;
  onLogin: (username: string, password: string) => void;
  error?: string;
}

export default function LoginLayout({
  title,
  subtitle,
  onLogin,
  error,
}: LoginLayoutProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;
    setLoading(true);
    setTimeout(() => {
      onLogin(username.trim(), password);
      setLoading(false);
    }, 400);
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-700 to-red-900 flex items-center justify-center text-white font-bold text-lg mx-auto mb-4">
            BW
          </div>
          <h1 className="text-white font-bold text-2xl tracking-wide">
            Bridgeway Visa
          </h1>
          <p className="text-zinc-500 text-sm mt-1">{subtitle}</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-white/10 bg-zinc-900/60 p-6 space-y-5"
        >
          <div>
            <label className="block text-xs text-zinc-500 mb-1.5">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              className="w-full rounded-lg bg-zinc-950 border border-white/10 px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-red-700/60 transition-colors"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs text-zinc-500 mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full rounded-lg bg-zinc-950 border border-white/10 px-3.5 py-2.5 pr-10 text-sm text-white placeholder-zinc-600 outline-none focus:border-red-700/60 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPw((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
              >
                {showPw ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-red-400 text-xs bg-red-700/10 border border-red-700/30 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !username.trim() || !password.trim()}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-red-700 hover:bg-red-600 disabled:bg-red-700/40 disabled:cursor-not-allowed transition-colors text-white text-sm font-medium px-4 py-2.5"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                Login
              </>
            )}
          </button>
        </form>

        <p className="text-center text-zinc-600 text-xs mt-6">
          {title} &middot; Bridgeway Visa &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
