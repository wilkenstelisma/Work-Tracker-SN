# ARC Task Tracker — CLAUDE.md

## Project Overview

**ARC Task Tracker v1.0** is a personal task and project management web app built for Wilkens (System Administrator & Digital Transformation Lead). It runs entirely in the browser — no backend, no external database. All data is persisted in `localStorage`.

Deployed to GitHub Pages via GitHub Actions on push to `main`. Base path: `/Work-Tracker-SN/`.

---

## Tech Stack

| Layer | Library/Tool |
|---|---|
| UI | React 18 + TypeScript |
| Bundler | Vite 5 |
| Styling | Tailwind CSS 3 |
| State | Zustand 4 |
| Routing | React Router 6 (HashRouter) |
| Drag & Drop | @dnd-kit/core + @dnd-kit/sortable |
| Dates | date-fns 3 |
| PDF Export | jsPDF + jspdf-autotable |
| Notifications | react-hot-toast |
| IDs | uuid v10 |

---

## Commands

```bash
npm run dev       # Start dev server (Vite)
npm run build     # TypeScript check + Vite production build → dist/
npm run preview   # Preview the production build locally
```

No test suite is currently configured.

---

## Project Structure

```
src/
  types/index.ts          # All shared TypeScript types
  store/
    taskStore.ts          # Tasks CRUD + subtasks/milestones/updates (localStorage: arc-tasks, arc-tasks-archive)
    projectStore.ts       # Projects CRUD (localStorage: arc-projects)
    notificationStore.ts  # In-memory alert state
    taskTypeStore.ts      # Customizable task type list (localStorage)
    meetingNotesStore.ts  # Meeting notes (localStorage)
  views/
    Dashboard.tsx         # Summary widgets, quick stats
    AllTasks.tsx          # Full task list with filters + search
    Projects.tsx          # Project list and detail panel
    CalendarView.tsx      # Tasks laid out on a monthly calendar
    RecurringTasks.tsx    # Recurring task management
    AlertsNotifications.tsx  # Active alerts list
    MeetingNotes.tsx      # Meeting notes with search
    Settings.tsx          # Preferences, export/import, task types, Claude API key
  components/
    TaskCard.tsx          # Kanban-style task card
    TaskForm.tsx          # Create/edit task modal form
    TaskDetailPanel.tsx   # Side panel with full task detail + inline editing
    ProjectForm.tsx       # Create/edit project form
    ProjectDetailPanel.tsx # Side panel for project detail
    MilestoneTimeline.tsx # Visual milestone timeline
    NotificationPanel.tsx # Notification dropdown
    DashboardWidget.tsx   # Reusable stat widget
    RecurrenceConfig.tsx  # Recurrence rule editor
    layout/
      Sidebar.tsx         # Left nav sidebar
      TopNav.tsx          # Top bar with page title + new task button
  utils/
    alertEngine.ts        # Computes alerts (overdue, due-today, at-risk, milestone alerts)
    recurrence.ts         # Auto-generates next task instances for recurring tasks
    export.ts             # Export to CSV, PDF, or JSON backup
  App.tsx                 # AppShell: layout, routing, alert engine loop, recurrence check
  main.tsx                # React entry point
```

---

## Data Model Key Types (`src/types/index.ts`)

### Task
Core entity. Fields include: `id`, `title`, `description`, `taskType`, `status`, `priority`, `dueDate`, `startDate`, `assignee`, `notes`, `updates[]`, `subtasks[]`, `milestones[]`, `links[]`, `isRecurring`, `recurrence?`, `reminderDays`, `changelog[]`, `projectId?`, `completedAt?`, `isPaused?`.

### Project
Fields: `id`, `name`, `description`, `status`, `priority`, `targetDate`, `startDate`, `owner`, `links[]`.

### Enums / Union Types
- **TaskStatus**: `Not Started` | `In Progress` | `Blocked` | `Under Review` | `Complete` | `Cancelled`
- **Priority**: `Critical` | `High` | `Medium` | `Low`
- **ProjectStatus**: `Planning` | `Active` | `On Hold` | `Complete` | `Cancelled`
- **MilestoneStatus**: `Upcoming` | `In Progress` | `Achieved` | `Missed`
- **RecurrencePattern**: `Daily` | `Weekly` | `Bi-weekly` | `Monthly` | `Quarterly` | `Custom`
- **AlertType**: `overdue` | `due-today` | `at-risk` | `milestone-overdue` | `milestone-due-soon`

---

## State Management

All stores use **Zustand** and persist to `localStorage` directly (no middleware).

| Store | localStorage key(s) |
|---|---|
| taskStore | `arc-tasks`, `arc-tasks-archive` |
| projectStore | `arc-projects` |
| taskTypeStore | (its own key) |
| meetingNotesStore | (its own key) |
| Settings (local state) | `arc-settings` |

Every task update automatically appends a `ChangelogEntry` to `task.changelog`. The `updateTask` action handles this automatically — do not manually build changelog entries.

---

## Alert Engine & Recurrence

- **Alert engine** (`utils/alertEngine.ts`) runs on every task state change and on a 15-minute `setInterval` (in `App.tsx`).
- **Recurrence check** (`utils/recurrence.ts`) also runs on every task state change. It auto-generates the next task instance when a recurring task is completed.
- Both are triggered from `AppShell`'s `useEffect` in `App.tsx`.

---

## Settings & Integrations

- **Claude API key** is stored in `arc-settings` localStorage and used for AI features. It is never sent anywhere except directly to Anthropic's API.
- **Browser notifications** require explicit permission grant via the Settings page.
- **Default reminder days** (advance warning before due date) is configurable per-user.
- **Task types** are user-customizable (add/remove). Defaults: System Admin, Digital Transformation, Audit Support, Risk Management, Reporting, Stakeholder Engagement, Ad-hoc, Custom.

---

## Export / Import

- **CSV** and **PDF** exports via `utils/export.ts` (jsPDF + autotable)
- **JSON backup** downloads the full `tasks` array
- **Import** replaces all current tasks from a JSON backup file
- **Archive**: tasks with `status === 'Complete'` completed 90+ days ago can be moved to `arc-tasks-archive`

---

## Deployment

- CI: `.github/workflows/deploy.yml` — builds on Node 20 with `npm ci && npm run build`, deploys `dist/` to GitHub Pages
- Vite base path is `/Work-Tracker-SN/` — required for GitHub Pages sub-path hosting
- Router uses `HashRouter` (not `BrowserRouter`) so client-side routing works on GitHub Pages without server config

---

## Git Workflow

- **Always create a new branch** before making any code changes. Never commit directly to `main`.
  - Branch naming: `feature/<short-description>`, `fix/<short-description>`, or `chore/<short-description>`
  - Example: `git checkout -b feature/add-task-export`
- **Auto-commit** changes to the feature branch as work progresses. Each commit should be atomic and have a clear, descriptive message.
- **Never push to `main` without explicit permission.** Always ask the user before merging or pushing to `main`, even if the work is complete.
- The typical flow:
  1. Create branch → make changes → commit to branch
  2. Ask: *"Changes are committed to `<branch-name>`. Ready to push and merge to main?"*
  3. Only push/merge after the user confirms.

---

## Conventions

- Components are functional React with hooks only — no class components.
- Use `uuid` (`uuidv4()`) for all new entity IDs.
- Dates are stored and manipulated as ISO 8601 strings; use `date-fns` for formatting and comparisons.
- Toast notifications via `react-hot-toast` (`toast.success()`, `toast.error()`).
- Tailwind utility classes only — no custom CSS except `src/index.css` (base styles).
- Avoid adding external dependencies without a clear need; the bundle is kept lean.
