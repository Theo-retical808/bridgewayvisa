import { useState } from "react";
import AdminSidebar from "./components/AdminSidebar";
import AdminHeader from "./components/AdminHeader";
import AdminDashboard from "./AdminDashboard";
import ChatSessions from "./ChatSessions";
import ChatSessionDetails from "./ChatSessionDetails";
import Agents from "./Agents";
import AgentHistory from "./AgentHistory";

const TITLES: Record<string, string> = {
  dashboard: "Dashboard",
  agents: "Agents",
  sessions: "Chat Sessions",
  history: "History",
};

export default function AdminApp() {
  const [current, setCurrent] = useState("dashboard");
  const [selectedSession, setSelectedSession] = useState<string | null>(null);

  function handleNavigate(key: string) {
    setSelectedSession(null);
    setCurrent(key);
  }

  function handleViewSession(sessionId: string) {
    setSelectedSession(sessionId);
    setCurrent("sessions");
  }

  function handleBackFromSession() {
    setSelectedSession(null);
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex">
      <AdminSidebar current={current} onNavigate={handleNavigate} />

      <div className="flex-1 min-w-0">
        <AdminHeader
          title={
            selectedSession
              ? "Session Details"
              : TITLES[current] || "Admin"
          }
          current={current}
          onNavigate={handleNavigate}
        />

        <main className="px-5 sm:px-8 py-6">
          {current === "dashboard" && (
            <AdminDashboard onViewSession={handleViewSession} />
          )}
          {current === "sessions" &&
            (selectedSession ? (
              <ChatSessionDetails
                sessionId={selectedSession}
                onBack={handleBackFromSession}
              />
            ) : (
              <ChatSessions onViewSession={handleViewSession} />
            ))}
          {current === "agents" && <Agents />}
          {current === "history" && <AgentHistory />}
        </main>
      </div>
    </div>
  );
}
