import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import LoginLayout from "../components/LoginLayout";

export default function AdminLogin() {
  const { user, login, isAuthenticated, loading } = useAuth();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Already logged in — redirect
  if (!loading && isAuthenticated && user) {
    if (user.role === "admin") return <Navigate to="/admin/dashboard" replace />;
    return <Navigate to={`/${user.role}/dashboard`} replace />;
  }

  async function handleLogin(email: string, password: string) {
    setError("");
    setSubmitting(true);
    const result = await login(email, password);
    setSubmitting(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    // Role check: if they logged in but aren't admin, AuthContext handles redirect
    // by setting user.role. The Navigate above will fire on next render.
    if (user && user.role !== "admin") {
      setError("This account does not have admin access.");
    }
  }

  return (
    <LoginLayout
      title="Admin Portal"
      subtitle="Sign in to the admin dashboard"
      onLogin={handleLogin}
      error={error}
      loading={submitting}
    />
  );
}
