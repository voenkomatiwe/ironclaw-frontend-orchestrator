import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api";
import { useAppStore } from "@/store/app";
import type { AddonInstance, AddonManifest } from "./api-types";

export const addonKeys = {
  all: () => ["addons"] as const,
  detail: (name: string) => ["addons", name] as const,
  logs: (name: string, service?: string) => ["logs", name, service] as const,
};

export function useAddons() {
  const token = useAppStore((s) => s.token);
  return useQuery({
    queryKey: addonKeys.all(),
    queryFn: () => api.get("addons").json<AddonInstance[]>(),
    refetchInterval: 5000,
    enabled: !!token,
  });
}

export function useAddon(name: string) {
  const token = useAppStore((s) => s.token);
  return useQuery({
    queryKey: addonKeys.detail(name),
    queryFn: () => api.get(`addons/${name}`).json<AddonInstance>(),
    refetchInterval: 5000,
    enabled: !!token,
  });
}

export function useRegistry() {
  const token = useAppStore((s) => s.token);
  return useQuery({
    queryKey: ["registry"],
    queryFn: () => api.get("registry").json<AddonManifest[]>(),
    enabled: !!token,
  });
}

export function useAddonLogs(name: string, service?: string) {
  const token = useAppStore((s) => s.token);
  return useQuery({
    queryKey: addonKeys.logs(name, service),
    queryFn: () => api.get(`addons/${name}/logs`, { searchParams: service ? { service } : {} }).text(),
    refetchInterval: 3000,
    enabled: !!token,
  });
}

export function useInstallAddon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { manifestName: string; envOverrides?: Record<string, string> }) =>
      api.post("addons", { json: vars }).json<AddonInstance>(),

    onMutate: async (vars) => {
      await qc.cancelQueries({ queryKey: addonKeys.all() });
      const previous = qc.getQueryData<AddonInstance[]>(addonKeys.all());

      const manifests = qc.getQueryData<AddonManifest[]>(["registry"]);
      const manifest = manifests?.find((m) => m.name === vars.manifestName);

      const now = new Date().toISOString();
      const optimistic: AddonInstance = {
        id: `optimistic-${vars.manifestName}`,
        name: vars.manifestName,
        manifestVersion: manifest?.version ?? "0.0.0",
        manifestJson: JSON.stringify(manifest ?? { displayName: vars.manifestName, description: "" }),
        containerId: null,
        containerIds: null,
        status: "installing",
        hostPort: null,
        envOverrides: vars.envOverrides ?? {},
        createdAt: now,
        updatedAt: now,
        lastHealthCheck: null,
        healthStatus: "unknown",
      };

      qc.setQueryData<AddonInstance[]>(addonKeys.all(), (old) => [...(old ?? []), optimistic]);
      return { previous };
    },

    onError: (_err, _vars, ctx) => {
      if (ctx?.previous !== undefined) {
        qc.setQueryData(addonKeys.all(), ctx.previous);
      }
    },

    onSettled: () => qc.invalidateQueries({ queryKey: addonKeys.all() }),
  });
}

export function useStartAddon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => api.post(`addons/${name}/start`).json<AddonInstance>(),
    onSuccess: () => qc.invalidateQueries({ queryKey: addonKeys.all() }),
  });
}

export function useStopAddon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => api.post(`addons/${name}/stop`).json<AddonInstance>(),
    onSuccess: () => qc.invalidateQueries({ queryKey: addonKeys.all() }),
  });
}

export function useRestartAddon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => api.post(`addons/${name}/restart`).json<AddonInstance>(),
    onSuccess: () => qc.invalidateQueries({ queryKey: addonKeys.all() }),
  });
}

export function useRemoveAddon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, purge }: { name: string; purge?: boolean }) =>
      api.delete(`addons/${name}`, { searchParams: { purge: String(purge ?? false) } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: addonKeys.all() }),
  });
}

export function useUpdateConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, envOverrides }: { name: string; envOverrides: Record<string, string> }) =>
      api.put(`addons/${name}/config`, { json: { envOverrides } }).json<AddonInstance>(),
    onSuccess: () => qc.invalidateQueries({ queryKey: addonKeys.all() }),
  });
}
