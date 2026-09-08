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
