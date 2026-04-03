export type RoutineStatus = "enabled" | "disabled" | "failing";

export type RoutineSummary = {
  total: number;
  enabled: number;
  disabled: number;
  failing: number;
  runsToday: number;
};

export type RoutineEntry = {
  id: string;
  name: string;
  trigger: string;
  action: string;
  lastRun?: string;
  nextRun?: string;
  runs: number;
  status: RoutineStatus;
};

export type RoutineRunHistoryEntry = {
  id: string;
  startedAt: string;
  completedAt?: string;
  success: boolean;
  output?: string;
};
