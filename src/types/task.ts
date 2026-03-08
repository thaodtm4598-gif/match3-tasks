export type TaskStatus = 'Open' | 'To Do' | 'In Progress' | 'Done';
export type TaskPriority = 'High' | 'Medium' | 'Low';
export type TaskSprint = 'Build 1' | 'Build 2' | 'Build 3' | 'Backlog';

export interface Task {
  id: string;
  summary: string;
  label: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee: string;
  start_date: string | null;
  end_date: string | null;
  sprint: TaskSprint;
  note: string;
  created_at?: string;
  updated_at?: string;
}

export interface DeadlineAlert {
  task: Task;
  type: 'overdue' | 'today' | 'soon';
  days: number;
}
