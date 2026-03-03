# ARC Task Tracker

A personal task and project management app built for tracking work across system administration, digital transformation initiatives, audits, and more. All data is stored locally in your browser — no accounts, no servers, no sync.

**Live app:** [wilkenstelisma.github.io/Work-Tracker-SN](https://wilkenstelisma.github.io/Work-Tracker-SN)

---

## Features

### Dashboard
- Summary tiles for Total Open, Overdue, Due This Week, and Completed This Month — each tile navigates to the All Tasks view with the corresponding filter applied
- Overdue and Due Today task cards shown at a glance
- Overdue and upcoming milestones surfaced directly on the dashboard (independent of their parent task's due date)

### Tasks
- **List view** with sortable columns and per-column filter dropdowns (Type, Status, Priority, Due Date)
- **Kanban view** with drag-and-drop cards across status columns
- **Filter presets** — save and reuse filter combinations
- **Task detail panel** with tabbed sections:
  - Details (title, type, status, priority, dates, assignee, notes, links)
  - Updates (timestamped log entries)
  - Subtasks (checklist with completion tracking)
  - Milestones (visual timeline with status and overdue indicators)
  - Changelog (automatic field-change history)
- Full task form with: configurable type, priority, status, due/start dates, assignee, description, notes, subtasks, milestones, related links, recurring schedule, reminder days, and project assignment

### Projects
- Create projects as parent records for multi-task initiatives
- Track status (Planning / Active / On Hold / Complete / Cancelled), priority, target date, owner, and related links
- **Tasks tab** — view linked tasks sorted by due date, unlink tasks, or create and link new tasks directly from the project record
- **Progress tab** — overall completion bar, per-status breakdown, and metric tiles (Total / Overdue / Complete / In Progress)

### Recurring Tasks
- Configure tasks to repeat on a daily, weekly, bi-weekly, monthly, quarterly, or custom schedule
- Cycle count tracking and next-due-date calculation

### Calendar
- Monthly calendar view of all task due dates

### Alerts & Notifications
- Bell icon in the nav bar with a live badge count
- Alert types:
  - **Overdue** — task is past its due date
  - **Due Today** — task is due today
  - **At Risk** — High or Critical task within its configured reminder window
  - **Milestone Overdue** — milestone date has passed and is not yet marked Achieved or Missed
  - **Milestone Due Soon** — milestone is within 3 days
- Alerts are recomputed on every task change and on a 15-minute interval
- Individual dismiss or Clear All; dismissed state persists across sessions

### Settings
- Default advance-warning days for High/Critical tasks
- Browser notification permission
- **Task Types** — add or remove task type options used in the task form and filters
- Data stats (total, completed, recurring task counts)
- Archive completed tasks older than 90 days
- Export to CSV, PDF, or JSON backup
- Import from a JSON backup file

---

## Tech Stack

| Layer | Library |
|---|---|
| Framework | React 18 + TypeScript |
| Build | Vite |
| Styling | Tailwind CSS |
| State | Zustand (persisted to `localStorage`) |
| Routing | React Router v6 (HashRouter) |
| Drag & Drop | @dnd-kit/core + @dnd-kit/sortable |
| Dates | date-fns |
| PDF Export | jsPDF + jspdf-autotable |
| Toasts | react-hot-toast |

---

## Local Development

**Prerequisites:** Node.js 18+

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Production build
npm run build
```

The app runs at `http://localhost:5173` by default. All data is stored in `localStorage` under the following keys:

| Key | Contents |
|---|---|
| `arc-tasks` | All task records |
| `arc-projects` | All project records |
| `arc-task-types` | Configurable task type list |
| `arc-filter-presets` | Saved filter presets |
| `arc-settings` | Notification and reminder preferences |
| `arc-dismissed` | Dismissed alert IDs |

---

## Deployment

The app is deployed automatically to GitHub Pages on every push to `main` via the workflow at [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

---

## Data & Privacy

All data lives in your browser's `localStorage`. Nothing is sent to any external server. Exporting a JSON backup from Settings > Export is the recommended way to back up your data.
