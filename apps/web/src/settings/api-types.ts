export type LlmProvider = {
  id: string;
  name: string;
  baseUrl: string;
  model: string;
};

export type LlmTestConnectionResponse = {
  ok: boolean;
  error?: string;
};

export type LlmListModelsResponse = {
  models: string[];
};

/** OpenAI-compatible `GET /v1/models` payload. */
export type OpenAiModelListItem = {
  id: string;
  object?: string;
  created?: number;
  owned_by?: string;
};

export type OpenAiModelsListResponse = {
  object?: string;
  data?: OpenAiModelListItem[];
};

export type SkillEntry = {
  name: string;
  installed?: boolean;
  version?: string;
  trust?: string;
  source?: string;
  keywords?: string[];
  display_name?: string;
  description?: string;
};

export type SkillsResponse = {
  skills: SkillEntry[];
  count: number;
};

export type SkillSearchRequest = {
  query: string;
};

export type SkillInstallRequest = {
  name: string;
  url?: string;
};

export type ExtensionKind = "wasm_tool" | "wasm_channel" | "mcp_server" | "channel_relay";

export type ExtensionEntry = {
  name: string;
  display_name: string;
  kind: ExtensionKind;
  description: string | null;
  authenticated: boolean;
  active: boolean;
  tools: string[];
  needs_setup: boolean;
  has_auth: boolean;
  version?: string;
  activation_status?: string;
};

export type ExtensionsResponse = {
  extensions: ExtensionEntry[];
};

export type ExtensionRegistryEntry = {
  name: string;
  display_name: string;
  kind: ExtensionKind;
  description?: string;
  keywords: string[];
  installed: boolean;
  version?: string;
};

export type ExtensionsRegistryResponse = {
  entries: ExtensionRegistryEntry[];
};

export type UserRole = "admin" | "user";
export type UserStatus = "active" | "suspended";

export type AdminUser = {
  id: string;
  name: string;
  email?: string;
  role: UserRole;
  status: UserStatus;
  createdAt?: string;
};

export type CreateUserRequest = {
  name: string;
  email?: string;
  role: UserRole;
  password?: string;
};

export type CreateUserResponse = {
  user: AdminUser;
  token?: string;
};

export type SettingsExportResponse = {
  settings: Record<string, string>;
};

export type GatewayStatus = {
  version: string;
  sse_connections: number;
  ws_connections: number;
  total_connections: number;
  uptime_secs: number;
  restart_enabled: boolean;
  daily_cost: string;
  actions_this_hour: number;
  model_usage: Array<{ model: string; count: number }>;
  llm_backend: string;
  llm_model: string;
  enabled_channels: string[];
};

export type ExtensionSetupSecretField = {
  name: string;
  prompt: string;
  optional: boolean;
  provided: boolean;
  auto_generate: boolean;
};

export type ExtensionSetupField = {
  name: string;
  prompt: string;
  optional: boolean;
  provided: boolean;
  input_type: string;
};

export type ExtensionSetupSchema = {
  name: string;
  kind: string;
  secrets?: ExtensionSetupSecretField[];
  fields?: ExtensionSetupField[];
};

export type ExtensionActionResponse = {
  success: boolean;
  message: string;
  auth_url?: string;
  activated?: boolean;
  needs_restart?: boolean;
  instructions?: string;
  verification?: unknown;
};

export type PairingRequest = {
  code: string;
  sender_id: string;
  meta?: unknown;
  created_at: string;
};

export type PairingListResponse = {
  channel: string;
  requests: PairingRequest[];
};

export type CustomLlmProviderRow = {
  id: string;
  name: string;
  adapter: string;
  base_url: string;
  api_key?: string;
  default_model?: string;
  builtin?: boolean;
};
