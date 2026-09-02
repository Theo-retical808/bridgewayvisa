import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { authenticate } from "../auth/credentials";
import LoginLayout from "../components/LoginLayout";
import { useState } from "react";

export default function AgentLogin() {
  const { user, login, isAuthenticated } = useAuth();
  const [error, setError] = useState("");

  if (isAuthenticated && user) {
    if (user.role === "agent") return <Navigate to="/agent/dashboard" replace />;
    return <Navigate to={`/${user.role}/dashboard`} replace />;
  }

  function handleLogin(username: string, password: string) {
    setError("");
    const result = authenticate(username, password);
    if (!result) {
      setError("Invalid username or password.");
      return;
    }
    if (result.role !== "agent") {
      setError("This account does not have agent access.");
      return;
    }
    login(result);
  }

  return (
    <LoginLayout
      title="Agent Portal"
      subtitle="Sign in to the agent dashboard"
      onLogin={handleLogin}
      error={error}
    />
  );
}
