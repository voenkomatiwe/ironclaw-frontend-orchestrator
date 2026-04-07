import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { api } from "@/api";
import { useAppStore } from "@/store/app";
import type { JobEntry, JobFileReadResponse, JobStateEvent, JobSummary, JobWorkspaceListResponse } from "./api-types";

function useCanFetchApi() {
  return useAppStore((s) => s.proxyReady && Boolean(s.token?.trim() && s.apiUrl?.trim()));
}

export const jobKeys = {
  summary: () => ["jobs", "summary"] as const,
  all: () => ["jobs", "list"] as const,
  detail: (id: string) => ["jobs", id] as const,
};

export function useJobsSummary() {
  const canFetch = useCanFetchApi();
  return useQuery({
    queryKey: jobKeys.summary(),
    queryFn: () => api.get("jobs/summary").json<JobSummary>(),
    enabled: canFetch,
    refetchInterval: 5000,
  });
}

export function useJobs() {
  const canFetch = useCanFetchApi();
  return useQuery({
    queryKey: jobKeys.all(),
    queryFn: async () => {
      const res = await api.get("jobs").json<JobEntry[] | { jobs: JobEntry[] }>();
      return Array.isArray(res) ? res : (res.jobs ?? []);
    },
    enabled: canFetch,
    refetchInterval: 5000,
  });
}

export function useCancelJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`jobs/${id}/cancel`).json<JobEntry>(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: jobKeys.all() });
      qc.invalidateQueries({ queryKey: jobKeys.summary() });
    },
  });
}

export function useRestartJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`jobs/${id}/restart`).json<JobEntry>(),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: jobKeys.all() });
      qc.invalidateQueries({ queryKey: jobKeys.summary() });
      qc.invalidateQueries({ queryKey: jobKeys.detail(id) });
    },
  });
}

export function useJobWorkspaceList(jobId: string | null, relPath: string) {
  const canFetch = useCanFetchApi();
  return useQuery({
    queryKey: ["jobs", jobId, "files", relPath] as const,
    queryFn: () =>
      api.get(`jobs/${jobId}/files/list`, { searchParams: { path: relPath } }).json<JobWorkspaceListResponse>(),
    enabled: canFetch && !!jobId,
    retry: false,
  });
}

export function useJobWorkspaceFile(jobId: string | null, filePath: string | null) {
  const canFetch = useCanFetchApi();
  return useQuery({
    queryKey: ["jobs", jobId, "read", filePath] as const,
    queryFn: () =>
      api.get(`jobs/${jobId}/files/read`, { searchParams: { path: filePath! } }).json<JobFileReadResponse>(),
    enabled: canFetch && !!jobId && !!filePath,
    retry: false,
  });
}

export function useJobPrompt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; content: string; done?: boolean }) =>
      api
        .post(`jobs/${vars.id}/prompt`, {
          json: { content: vars.content, done: vars.done ?? false },
        })
        .json<unknown>(),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: jobKeys.all() });
      qc.invalidateQueries({ queryKey: jobKeys.detail(vars.id) });
    },
  });
}

export function useJobStream(jobId: string | null) {
  const [events, setEvents] = useState<JobStateEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const hasSession = useAppStore((s) => s.proxyReady && Boolean(s.token?.trim() && s.apiUrl?.trim()));

  useEffect(() => {
    if (!jobId || !hasSession) return;

    const controller = new AbortController();
    abortRef.current = controller;

    (async () => {
      setConnected(true);
      setEvents([]);
      try {
        const res = await fetch(`/api/jobs/${jobId}/events`, {
          headers: { Accept: "text/event-stream" },
          signal: controller.signal,
        });

        const reader = res.body?.getReader();
        if (!reader) return;
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            if (line.startsWith("data:")) {
              try {
                const evt: JobStateEvent = JSON.parse(line.slice(5).trim());
                setEvents((prev) => [...prev, evt]);
              } catch {
                const raw = line.slice(5).trim();
                if (raw) setEvents((prev) => [...prev, { message: raw }]);
              }
            }
          }
        }
      } catch {
      } finally {
        setConnected(false);
      }
    })();

    return () => {
      controller.abort();
      abortRef.current = null;
    };
  }, [jobId, hasSession]);

  return { events, connected };
}
