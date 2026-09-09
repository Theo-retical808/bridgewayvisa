# UPDATE.md — Bridgeway Visa System Updates

## Date: August 31, 2026

---

## Dependencies Installed

| Package            | Version | Purpose                                        |
| ------------------ | ------- | ---------------------------------------------- |
| `react-router-dom` | latest  | Client-side routing for admin/agent portals    |
| `lucide-react`     | latest  | Icon library used across all new UI components |

Run to install:

```bash
npm install react-router-dom lucide-react
```

---

## New Files Created (22 files)

### Authentication System (`src/auth/`)

| File                 | Purpose                                                                            |
| -------------------- | ---------------------------------------------------------------------------------- |
| `types.ts`           | Shared TypeScript types — `User`, `ChatSession`, `SessionMessage`, `SessionStatus` |
| `credentials.ts`     | Demo credentials: `admin/admin123`, `agent/agent123`                               |
| `AuthContext.tsx`    | React context for login/logout with localStorage persistence                       |
| `ProtectedRoute.tsx` | Route guard — blocks access if not the correct role                                |
| `SessionStore.tsx`   | In-memory session store — create, accept, send messages, end, ask admin            |

### Shared UI (`src/components/`)

| File              | Purpose                                          |
| ----------------- | ------------------------------------------------ |
| `LoginLayout.tsx` | Reusable login page UI shared by admin and agent |

### Admin Portal (`src/admin/`)

| File                          | Purpose                                                           |
| ----------------------------- | ----------------------------------------------------------------- |
| `AdminLogin.tsx`              | Admin login page at `/admin/login`                                |
| `AdminApp.tsx`                | Main admin shell — sidebar + header + view routing                |
| `AdminDashboard.tsx`          | Dashboard with stats cards and active/waiting session tables      |
| `ChatSessions.tsx`            | All sessions list with search and status filter                   |
| `ChatSessionDetails.tsx`      | Session detail view — client info, agent info, full conversation  |
| `Agents.tsx`                  | Agent management table — add, search, activate/deactivate, delete |
| `AgentHistory.tsx`            | Complete session history table                                    |
| `types.ts`                    | Admin-specific TypeScript types for agents and sessions           |
| `components/AdminSidebar.tsx` | Admin navigation sidebar                                          |
| `components/AdminHeader.tsx`  | Admin top bar with mobile tab navigation                          |

### Agent Portal (`src/agent/`)

| File                          | Purpose                                                           |
| ----------------------------- | ----------------------------------------------------------------- |
| `AgentLogin.tsx`              | Agent login page at `/agent/login`                                |
| `AgentApp.tsx`                | Main agent shell — sidebar + header + view routing                |
| `AgentDashboard.tsx`          | Dashboard with stats, waiting queue, active chat shortcut         |
| `AgentChat.tsx`               | Full chat interface — messages, send, ask admin, end conversation |
| `AgentHistory.tsx`            | Agent's own completed sessions with detail view                   |
| `AskAdmin.tsx`                | Internal admin request panel — client invisible                   |
| `components/AgentSidebar.tsx` | Agent navigation sidebar                                          |
| `components/AgentHeader.tsx`  | Agent top bar with mobile tab navigation                          |

---

## Modified Files

| File           | Change                                                                     |
| -------------- | -------------------------------------------------------------------------- |
| `src/main.tsx` | Wrapped in `BrowserRouter`, `AuthProvider`, `SessionProvider`              |
| `src/App.tsx`  | Replaced single-page layout with `Routes` — public site, admin, agent, 404 |

---

## New Routes

| Route          | Component               | Access          |
| -------------- | ----------------------- | --------------- |
| `/`            | Public site (unchanged) | Everyone        |
| `/admin/login` | `AdminLogin`            | Unauthenticated |
| `/admin/*`     | `AdminApp`              | Admin only      |
| `/agent/login` | `AgentLogin`            | Unauthenticated |
| `/agent/*`     | `AgentApp`              | Agent only      |
| `*`            | 404 page                | Everyone        |

---

## Session States

```
WAITING → ASSIGNED → ACTIVE → COMPLETED
```

Also supported: `CANCELLED`, `TRANSFERRED` (for future use).

---

## Demo Credentials

| Role  | Username | Password   |
| ----- | -------- | ---------- |
| Admin | `admin`  | `admin123` |
| Agent | `agent`  | `agent123` |

> These are development-only credentials. Production should use a real backend with hashed passwords.

---

## What Changed vs. Original Code

- **`App.tsx`**: No longer renders everything on one page. Now uses `react-router-dom` `<Routes>` to serve the public site at `/`, admin portal at `/admin/*`, and agent portal at `/agent/*`.
- **`main.tsx`**: Now wraps the app in `BrowserRouter` (routing), `AuthProvider` (login state), and `SessionProvider` (session data).
- **Public website**: Completely unchanged. `BubbleChat`, `Navbar`, `About`, etc. all remain as-is.

## Update — BubbleChat Improvements

### Added

#### 1. BubbleChat Expand/Minimize

- Added an **Expand/Minimize button** to the BubbleChat header.
- Users can switch between the default compact view and an expanded chat view.
- Added responsive sizing for desktop and mobile devices.
- Added smooth transition animation when expanding or minimizing the chat.
- Added maximize and minimize icons for better visual feedback.
- Expanded mode provides more space for viewing longer conversations.
- The active message area automatically uses the additional available space.

#### 2. Visa Services Options

- Added a **Services We Offer** selection section to the initial chat screen.
- Users can select the visa service they need assistance with before starting the chat.
- Added the following service options:
  - Tourist Visa
  - Student Visa
  - Dependent Visa / Open Work Permit
  - Post Graduation Work Visa
  - Residency & Citizenship
  - Digital Nomad Visa

- Added an **Additional Details or Destination** field for users who want to provide more information about their inquiry.
- The selected service and additional details are combined and included in the client's service inquiry.

### Improved

- Improved the initial chat experience by guiding users to specify their visa service.
- Improved conversation usability with the expandable chat interface.
- Improved responsiveness for different screen sizes.
- Added visual feedback when a service option is selected.
- The Continue button remains disabled until a service is selected.

### Unchanged

- Existing Supabase realtime functionality remains unchanged.
- Session creation and tracking remain unchanged.
- Message sending and receiving remain unchanged.
- Existing client information and Terms & Conditions workflow remain unchanged.
- Existing chat session and agent connection functionality remain unchanged.
- Existing Close and BubbleChat behavior remain unchanged.

### User Experience

The BubbleChat now provides a more structured support experience by allowing users to **select their visa service first**, provide optional details, and then continue to the client information and agent connection process.

Users can also **expand the chat window** whenever they need more space to read or manage their conversation.

# Agent Live Chat — Update Notes

## Update: Fix Agent Active Chats Filtering

**Date:** September 9, 2026
**Area:** Agent Dashboard / Live Chat Session Management

### Issue

The **"Your Active Chats"** section on the Agent Dashboard was displaying active chat sessions that were accepted by **other agents**.

This happened because the `getActiveSessions()` function in `SessionStore.tsx` returned **all sessions with an `ACTIVE` status**, without checking which agent the session was assigned to.

### Previous Behavior

The previous implementation filtered sessions only by status:

```tsx
const getActiveSessions = useCallback(
  () => sessionsWithAskAdmin.filter((s) => s.status === "ACTIVE"),
  [sessionsWithAskAdmin],
);
```

Because there was no agent ID condition, every logged-in agent could see every active chat.

### Fix

`getActiveSessions()` was changed to receive the current agent's profile ID and filter by both:

1. Session status must be `ACTIVE`
2. Session must be assigned to the current agent

```tsx
const getActiveSessions = useCallback(
  (agentId: string) =>
    sessionsWithAskAdmin.filter(
      (s) => s.status === "ACTIVE" && s.agentId === agentId,
    ),
  [sessionsWithAskAdmin],
);
```

### AgentDashboard.tsx

The dashboard now receives the current agent's ID:

```tsx
<AgentDashboard
  onAccept={handleAccept}
  onViewChat={() => setCurrent("chat")}
  agentId={agentProfileId}
/>
```

Inside `AgentDashboard.tsx`, active sessions are retrieved using that agent ID:

```tsx
const active = getActiveSessions(agentId);
```

This ensures that **"Your Active Chats" only contains chats assigned to the logged-in agent**.

### AgentApp.tsx

The `pendingAsks` calculation was also updated to use the current agent:

```tsx
const pendingAsks = getActiveSessions(agentProfileId).filter(
  (s) => s.askAdmin?.pending,
).length;
```

This prevents the Ask Admin count from including active chats belonging to other agents.

---

## Session Assignment Flow

The intended flow is now:

```text
Client creates chat
       ↓
Chat status = WAITING
       ↓
Agent sees chat in Waiting Clients
       ↓
Agent clicks Accept
       ↓
claim_chat_session RPC
       ↓
Chat assigned to Agent A
       ↓
assigned_agent_id = Agent A's profile ID
       ↓
status = ACTIVE
       ↓
Agent A sees the chat
       ↓
Other agents do NOT see it in "Your Active Chats"
```

### Important Database Field

The session assignment is based on:

```text
chat_sessions.assigned_agent_id
```

The application maps this database value to:

```tsx
ChatSession.agentId;
```

Therefore, the agent ID used by the dashboard must match the value stored in `assigned_agent_id`.

---

## Current Agent Identification

The Agent application uses the agent's **database profile ID**:

```tsx
const agentProfileId = user?.profileId || "";
```

This is intentionally used instead of the authentication UUID because the `chat_sessions.assigned_agent_id` field references the agent's database profile.

---

## Files Updated

### `src/auth/SessionStore.tsx`

Updated:

- `getActiveSessions` interface
- `getActiveSessions` implementation
- Active session filtering by `agentId`

### `src/agent/AgentDashboard.tsx`

Updated:

- Added `agentId` prop
- Retrieves active sessions using the current agent ID

```tsx
const active = getActiveSessions(agentId);
```

### `src/agent/AgentApp.tsx`

Updated:

- Passes `agentProfileId` to `AgentDashboard`
- Uses `agentProfileId` when calculating pending Ask Admin sessions

---

## Expected Result

### Agent A

If Agent A accepts:

```text
Session #123
assigned_agent_id = Agent A
status = ACTIVE
```

Agent A sees:

```text
Your Active Chats

Client A
Session #123
[Open Chat]
```

### Agent B

Agent B should **not** see Session #123 under:

```text
Your Active Chats
```

Agent B should only see chats assigned to Agent B.

---

## Additional Verification

The `handleAccept()` function uses the Supabase RPC:

```tsx
supabase.rpc("claim_chat_session", {
  p_session_id: session.id,
  p_agent_id: agentProfileId,
});
```

The RPC should correctly:

1. Find the waiting session
2. Assign `assigned_agent_id`
3. Change the session status to `active`
4. Prevent another agent from claiming the same session

The RPC should be verified separately to ensure it correctly updates:

```text
chat_sessions.assigned_agent_id
chat_sessions.status
```

---

## Status

**Fixed:** Agent Active Chats are now filtered by the logged-in agent.

**Pending Verification:** Confirm that the `claim_chat_session` Supabase RPC correctly saves the agent's profile ID into `assigned_agent_id`.
