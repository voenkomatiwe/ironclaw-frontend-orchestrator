export type JobState = "pending" | "running" | "completed" | "failed" | "cancelled" | string;

export type JobSummary = {
  total: number;
  running: number;
  completed: number;
  failed: number;
};

export type JobEntry = {
  id: string;
  title: string;
  state: JobState;
  source?: string;
  project_dir?: string;
  can_restart?: boolean;
  can_prompt?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type JobStateEvent = {
  type?: string;
  timestamp?: string;
  data?: string;
  message?: string;
};

export type JobFile = {
  name: string;
  path: string;
  size?: number;
};

export type JobWorkspaceEntry = {
  name: string;
  path: string;
  is_dir: boolean;
};

export type JobWorkspaceListResponse = {
  entries: JobWorkspaceEntry[];
};

export type JobFileReadResponse = {
  path: string;
  content: string;
};
