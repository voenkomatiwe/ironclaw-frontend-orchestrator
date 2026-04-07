import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, apiOrigin } from "@/api";
import { extensionKeys } from "@/extensions/queries";
import { useAppStore } from "@/store/app";
import type {
  AdminUser,
  CreateUserRequest,
  CreateUserResponse,
  ExtensionActionResponse,
  GatewayStatus,
  LlmListModelsResponse,
  LlmProvider,
  LlmTestConnectionResponse,
  OpenAiModelListItem,
  OpenAiModelsListResponse,
  PairingListResponse,
  SettingsExportResponse,
  SkillEntry,
  SkillInstallRequest,
  SkillSearchRequest,
  SkillsResponse,
} from "./api-types";

function useCanFetchApi() {
  return useAppStore((s) => s.proxyReady && Boolean(s.token?.trim() && s.apiUrl?.trim()));
}

export const settingsKeys = {
  v1Models: () => ["gateway", "v1", "models"] as const,
  providers: () => ["settings", "llm", "providers"] as const,
  skills: () => ["settings", "skills"] as const,
  users: () => ["settings", "users"] as const,
  general: () => ["settings", "general"] as const,
  gatewayStatus: () => ["settings", "gateway", "status"] as const,
};

function normalizeV1ModelsPayload(raw: unknown): OpenAiModelListItem[] {
  if (Array.isArray(raw)) {
    return raw.filter((x): x is OpenAiModelListItem =>
      Boolean(x && typeof x === "object" && typeof (x as OpenAiModelListItem).id === "string")
    );
  }
  if (raw && typeof raw === "object" && Array.isArray((raw as OpenAiModelsListResponse).data)) {
    return normalizeV1ModelsPayload((raw as OpenAiModelsListResponse).data);
  }
  return [];
}

/** OpenAI-style model catalog at `{apiUrl}/v1/models` (not under `/api/`). */
export function useV1Models() {
  const canFetch = useCanFetchApi();
  return useQuery({
    queryKey: settingsKeys.v1Models(),
    queryFn: async () => {
      const raw = await apiOrigin.get("v1/models").json<unknown>();
      return normalizeV1ModelsPayload(raw);
    },
    enabled: canFetch,
  });
}

export function useLlmProviders() {
  const canFetch = useCanFetchApi();
  return useQuery({
    queryKey: settingsKeys.providers(),
    queryFn: () => api.get("llm/providers").json<LlmProvider[]>(),
    enabled: canFetch,
  });
}

export function useTestLlmConnection() {
  return useMutation({
    mutationFn: (body: { providerId: string }) =>
      api.post("llm/test_connection", { json: body }).json<LlmTestConnectionResponse>(),
  });
}

export function useListLlmModels() {
  return useMutation({
    mutationFn: (body: { providerId: string }) =>
      api.post("llm/list_models", { json: body }).json<LlmListModelsResponse>(),
  });
}

export function useGatewayStatus() {
  const canFetch = useCanFetchApi();
  return useQuery({
    queryKey: settingsKeys.gatewayStatus(),
    queryFn: () => api.get("gateway/status").json<GatewayStatus>(),
    enabled: canFetch,
    refetchInterval: 15000,
  });
}

export function useSkills() {
  const canFetch = useCanFetchApi();
  return useQuery({
    queryKey: settingsKeys.skills(),
    queryFn: async () => {
      const res = await api.get("skills").json<SkillsResponse | SkillEntry[]>();
      return Array.isArray(res) ? res : (res.skills ?? []);
    },
    enabled: canFetch,
  });
}

export function useSearchSkills() {
  return useMutation({
    mutationFn: async (body: SkillSearchRequest) => {
      const res = await api.post("skills/search", { json: body }).json<SkillsResponse | SkillEntry[]>();
      return Array.isArray(res) ? res : (res.skills ?? []);
    },
  });
}

export function useInstallSkill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: SkillInstallRequest) => api.post("skills/install", { json: body }).json<SkillEntry>(),
    onSuccess: () => qc.invalidateQueries({ queryKey: settingsKeys.skills() }),
  });
}

export function useRemoveSkill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => api.delete(`skills/${name}`).json<void>(),
    onSuccess: () => qc.invalidateQueries({ queryKey: settingsKeys.skills() }),
  });
}

export function useAdminUsers() {
  const canFetch = useCanFetchApi();
  return useQuery({
    queryKey: settingsKeys.users(),
    queryFn: () => api.get("admin/users").json<AdminUser[]>(),
    enabled: canFetch,
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateUserRequest) => api.post("admin/users", { json: body }).json<CreateUserResponse>(),
    onSuccess: () => qc.invalidateQueries({ queryKey: settingsKeys.users() }),
  });
}

export function useSuspendUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`admin/users/${id}/suspend`).json<AdminUser>(),
    onSuccess: () => qc.invalidateQueries({ queryKey: settingsKeys.users() }),
  });
}

export function useActivateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`admin/users/${id}/activate`).json<AdminUser>(),
    onSuccess: () => qc.invalidateQueries({ queryKey: settingsKeys.users() }),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`admin/users/${id}`).json<void>(),
    onSuccess: () => qc.invalidateQueries({ queryKey: settingsKeys.users() }),
  });
}

export function useGeneralSettings() {
  const canFetch = useCanFetchApi();
  return useQuery({
    queryKey: settingsKeys.general(),
    queryFn: async () => {
      const res = await api.get("settings/export").json<SettingsExportResponse>();
      return res.settings ?? {};
    },
    enabled: canFetch,
  });
}

export function useUpdateSetting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) =>
      api.put(`settings/${key}`, { json: { value } }).json<void>(),
    onSuccess: () => qc.invalidateQueries({ queryKey: settingsKeys.general() }),
  });
}

export function usePutSettingJson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ key, value }: { key: string; value: unknown }) =>
      api.put(`settings/${encodeURIComponent(key)}`, { json: { value } }).json<void>(),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: settingsKeys.general() });
      void qc.invalidateQueries({ queryKey: settingsKeys.providers() });
    },
  });
}

export function useDeleteSettingKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (key: string) => api.delete(`settings/${encodeURIComponent(key)}`).json<void>(),
    onSuccess: () => void qc.invalidateQueries({ queryKey: settingsKeys.general() }),
  });
}

export function useImportSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (raw: Record<string, unknown>) => {
      const settings =
        raw && typeof raw === "object" && "settings" in raw && raw.settings && typeof raw.settings === "object"
          ? (raw.settings as Record<string, string>)
          : (raw as Record<string, string>);
      return api.post("settings/import", { json: { settings } }).json<void>();
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: settingsKeys.general() });
      void qc.invalidateQueries({ queryKey: settingsKeys.providers() });
      void qc.invalidateQueries({ queryKey: extensionKeys.root() });
    },
  });
}

export function usePairingRequests(channel: string | null) {
  const canFetch = useCanFetchApi();
  return useQuery({
    queryKey: ["pairing", channel] as const,
    queryFn: () => api.get(`pairing/${encodeURIComponent(channel!.trim())}`).json<PairingListResponse>(),
    enabled: canFetch && !!channel?.trim(),
    refetchInterval: 10_000,
    retry: false,
  });
}

export function usePairingApprove() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { channel: string; code: string }) =>
      api
        .post(`pairing/${encodeURIComponent(vars.channel)}/approve`, {
          json: { code: vars.code },
        })
        .json<ExtensionActionResponse>(),
    onSuccess: (_d, vars) => {
      void qc.invalidateQueries({ queryKey: ["pairing", vars.channel] });
    },
  });
}
