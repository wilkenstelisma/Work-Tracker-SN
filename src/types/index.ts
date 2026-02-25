export type TaskType =
  | 'System Admin'
  | 'Digital Transformation'
  | 'Audit Support'
  | 'Risk Management'
  | 'Reporting'
  | 'Stakeholder Engagement'
  | 'Ad-hoc'
  | 'Custom';

export type TaskStatus =
  | 'Not Started'
  | 'In Progress'
  | 'Blocked'
  | 'Under Review'
  | 'Complete'
  | 'Cancelled';

export type Priority = 'Critical' | 'High' | 'Medium' | 'Low';

export type MilestoneStatus = 'Upcoming' | 'In Progress' | 'Achieved' | 'Missed';

export type RecurrencePattern = 'Daily' | 'Weekly' | 'Bi-weekly' | 'Monthly' | 'Quarterly' | 'Custom';

export type AlertType = 'overdue' | 'due-today' | 'at-risk' | 'milestone-due-soon';

export interface UpdateEntry {
  id: string;
  timestamp: string;
  text: string;
}

export interface ChangelogEntry {
  id: string;
  timestamp: string;
  field: string;
  oldValue: string;
  newValue: string;
}

export interface TaskLink {
  id: string;
  label: string;
  url: string;
}

export interface Subtask {
  id: string;
  title: string;
  status: 'Open' | 'Done';
  dueDate?: string;
}

export interface Milestone {
  id: string;
  name: string;
  targetDate: string;
  status: MilestoneStatus;
}

export interface RecurrenceConfig {
  pattern: RecurrencePattern;
  interval: number;
  nextDue?: string;
  lastCompleted?: string;
  cycleCount: number;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  taskType: TaskType;
  status: TaskStatus;
  priority: Priority;
  dueDate: string;
  startDate?: string;
  assignee?: string;
  updates: UpdateEntry[];
  notes?: string;
  subtasks: Subtask[];
  milestones: Milestone[];
  isRecurring: boolean;
  recurrence?: RecurrenceConfig;
  reminderDays: number;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  changelog: ChangelogEntry[];
  isPaused?: boolean;
  links: TaskLink[];
}

export interface AlertItem {
  id: string;
  type: AlertType;
  taskId: string;
  taskTitle: string;
  milestoneId?: string;
  milestoneName?: string;
  date: string;
}

export interface FilterPreset {
  id: string;
  name: string;
  filters: TaskFilters;
}

export interface TaskFilters {
  statuses: TaskStatus[];
  priorities: Priority[];
  types: TaskType[];
  dateFrom?: string;
  dateTo?: string;
  hasSubtasks?: boolean;
  isRecurring?: boolean;
  search: string;
}
