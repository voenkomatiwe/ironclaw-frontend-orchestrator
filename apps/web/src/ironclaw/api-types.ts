export type IronclawStatus = {
  connected: boolean;
  error?: string;
  gateway?: { status: string };
};

export type IronclawThread = {
  id: string;
  state?: string;
  turn_count?: number;
  created_at?: string;
  updated_at?: string;
  title?: string;
  thread_type?: string;
  channel?: string;
};

export type IronclawThreadsResponse = {
  assistant_thread: IronclawThread;
  threads: IronclawThread[];
  active_thread: string;
};

export type IronclawToolCall = {
  name: string;
  has_result: boolean;
  has_error: boolean;
  result_preview?: string;
};

export type IronclawTurn = {
  turn_number: number;
  user_input: string;
  response: string;
  state: string;
  started_at?: string;
  completed_at?: string;
  tool_calls: IronclawToolCall[];
};

export type IronclawHistoryResponse = {
  thread_id: string;
  turns: IronclawTurn[];
  has_more: boolean;
};

export type IronclawMessage = {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
  toolCalls?: IronclawToolCall[];
};

export type IronclawSendResponse = {
  thread_id?: string;
  [key: string]: unknown;
};
