import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { authenticate } from "../auth/credentials";
import LoginLayout from "../components/LoginLayout";

export default function AdminLogin() {
  const { user, login, isAuthenticated } = useAuth();
  const [error, setError] = useState("");

  if (isAuthenticated && user) {
    if (user.role === "admin") return <Navigate to="/admin/dashboard" replace />;
    return <Navigate to={`/${user.role}/dashboard`} replace />;
  }

  function handleLogin(username: string, password: string) {
    setError("");
    const result = authenticate(username, password);
    if (!result) {
      setError("Invalid username or password.");
      return;
    }
    if (result.role !== "admin") {
      setError("This account does not have admin access.");
      return;
    }
    login(result);
  }

  return (
    <LoginLayout
      title="Admin Portal"
      subtitle="Sign in to the admin dashboard"
      onLogin={handleLogin}
      error={error}
    />
  );
}
