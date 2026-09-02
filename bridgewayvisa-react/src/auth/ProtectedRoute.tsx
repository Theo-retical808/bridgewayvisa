import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { UserRole } from "../lib/auth";

export default function ProtectedRoute({
  allowedRole,
  children,
}: {
  allowedRole: UserRole;
  children: React.ReactNode;
}) {
  const { user, loading, isAuthenticated } = useAuth();

  // Show a minimal spinner while the session is being restored
  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <span className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to={`/${allowedRole}/login`} replace />;
  }

  if (user.role !== allowedRole) {
    // Cross-role redirect: admin visiting /agent/* → send to their dashboard
    return <Navigate to={`/${user.role}/dashboard`} replace />;
  }

  return <>{children}</>;
}
