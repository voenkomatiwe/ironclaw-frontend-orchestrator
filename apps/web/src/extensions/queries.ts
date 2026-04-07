import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api";
import type {
  ExtensionActionResponse,
  ExtensionEntry,
  ExtensionRegistryEntry,
  ExtensionSetupSchema,
  ExtensionsRegistryResponse,
  ExtensionsResponse,
} from "@/settings/api-types";
import { useAppStore } from "@/store/app";

export const extensionKeys = {
  root: () => ["extensions"] as const,
  installed: () => ["extensions", "installed"] as const,
  registry: () => ["extensions", "registry"] as const,
  setupSchema: (name: string) => ["extensions", "setup", name] as const,
};

function useCanFetchApi() {
  return useAppStore((s) => s.proxyReady && Boolean(s.token?.trim() && s.apiUrl?.trim()));
}

export function useExtensions() {
  const canFetch = useCanFetchApi();
  return useQuery({
    queryKey: extensionKeys.installed(),
    queryFn: async () => {
      const res = await api.get("extensions").json<ExtensionsResponse | ExtensionEntry[]>();
      return Array.isArray(res) ? res : (res.extensions ?? []);
    },
    enabled: canFetch,
  });
}

export function useExtensionsRegistry() {
  const canFetch = useCanFetchApi();
  return useQuery({
    queryKey: extensionKeys.registry(),
    queryFn: async () => {
      const res = await api.get("extensions/registry").json<ExtensionsRegistryResponse | ExtensionRegistryEntry[]>();
      return Array.isArray(res) ? res : (res.entries ?? []);
    },
    enabled: canFetch,
  });
}

export type InstallExtensionBody = { name: string; url?: string; kind?: string };

export function useInstallExtension() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: InstallExtensionBody) =>
      api.post("extensions/install", { json: body }).json<ExtensionActionResponse>(),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: extensionKeys.root() });
    },
  });
}

export function useActivateExtension() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => api.post(`extensions/${name}/activate`).json<ExtensionEntry>(),
    onSuccess: () => void qc.invalidateQueries({ queryKey: extensionKeys.root() }),
  });
}

export function useRemoveExtension() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => api.post(`extensions/${name}/remove`).json<void>(),
    onSuccess: () => void qc.invalidateQueries({ queryKey: extensionKeys.root() }),
  });
}

export function useExtensionSetupSchema(name: string | null) {
  const canFetch = useCanFetchApi();
  return useQuery({
    queryKey: extensionKeys.setupSchema(name ?? ""),
    queryFn: () => api.get(`extensions/${encodeURIComponent(name!)}/setup`).json<ExtensionSetupSchema>(),
    enabled: canFetch && !!name?.trim(),
    retry: false,
  });
}

export function useExtensionSetupSubmit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { name: string; secrets: Record<string, string>; fields: Record<string, string> }) =>
      api
        .post(`extensions/${encodeURIComponent(vars.name)}/setup`, {
          json: { secrets: vars.secrets, fields: vars.fields },
        })
        .json<ExtensionActionResponse>(),
    onSuccess: () => void qc.invalidateQueries({ queryKey: extensionKeys.root() }),
  });
}
