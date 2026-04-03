export type LogLevel = "TRACE" | "DEBUG" | "INFO" | "WARN" | "ERROR";

export type LogEntry = {
  timestamp: string;
  level: LogLevel;
  target: string;
  message: string;
};

export type LogsLevelResponse = {
  level: LogLevel;
};
