export type IronclawStatus = {
  connected: boolean;
  error?: string;
  gateway?: Record<string, unknown>;
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
  assistant_thread?: IronclawThread | null;
  threads: IronclawThread[];
  active_thread?: string | null;
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
  response?: string | null;
  state: string;
  started_at?: string;
  completed_at?: string;
  tool_calls: IronclawToolCall[];
};

export type IronclawPendingApproval = {
  request_id: string;
  tool_name: string;
  description: string;
  parameters: string;
};

export type IronclawHistoryResponse = {
  thread_id: string;
  turns: IronclawTurn[];
  has_more: boolean;
  oldest_timestamp?: string;
  pending_approval?: IronclawPendingApproval | null;
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

export type IronclawImageAttachment = {
  data: string;
  media_type: string;
};

export type IronclawSsePayload = {
  type: string;
  thread_id?: string;
  content?: string;
  message?: string;
  name?: string;
  success?: boolean;
  error?: string;
  parameters?: string;
  preview?: string;
  request_id?: string;
  tool_name?: string;
  description?: string;
  allow_always?: boolean;
  extension_name?: string;
  instructions?: string;
  auth_url?: string;
  setup_url?: string;
  [key: string]: unknown;
};
