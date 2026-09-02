import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import LoginLayout from "../components/LoginLayout";

export default function AgentLogin() {
  const { user, login, isAuthenticated, loading } = useAuth();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Already logged in — redirect
  if (!loading && isAuthenticated && user) {
    if (user.role === "agent") return <Navigate to="/agent/dashboard" replace />;
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

    if (user && user.role !== "agent") {
      setError("This account does not have agent access.");
    }
  }

  return (
    <LoginLayout
      title="Agent Portal"
      subtitle="Sign in to the agent dashboard"
      onLogin={handleLogin}
      error={error}
      loading={submitting}
    />
  );
}
