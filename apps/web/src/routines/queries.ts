import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api";
import { useAppStore } from "@/store/app";
import type { RoutineEntry, RoutineRunHistoryEntry, RoutineSummary } from "./api-types";

function useCanFetchApi() {
  return useAppStore((s) => s.proxyReady && Boolean(s.token?.trim() && s.apiUrl?.trim()));
}

export const routineKeys = {
  summary: () => ["routines", "summary"] as const,
  all: () => ["routines", "list"] as const,
  history: (id: string) => ["routines", id, "history"] as const,
};

export function useRoutinesSummary() {
  const canFetch = useCanFetchApi();
  return useQuery({
    queryKey: routineKeys.summary(),
    queryFn: () => api.get("routines/summary").json<RoutineSummary>(),
    enabled: canFetch,
    refetchInterval: 10000,
  });
}

export function useRoutines() {
  const canFetch = useCanFetchApi();
  return useQuery({
    queryKey: routineKeys.all(),
    queryFn: async () => {
      const res = await api.get("routines").json<RoutineEntry[] | { routines: RoutineEntry[] }>();
      return Array.isArray(res) ? res : (res.routines ?? []);
    },
    enabled: canFetch,
    refetchInterval: 10000,
  });
}

export function useTriggerRoutine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`routines/${id}/trigger`).json<void>(),
    onSuccess: () => qc.invalidateQueries({ queryKey: routineKeys.all() }),
  });
}

export function useToggleRoutine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, enable }: { id: string; enable: boolean }) =>
      api.post(`routines/${id}/toggle`, { json: { enable } }).json<RoutineEntry>(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: routineKeys.all() });
      qc.invalidateQueries({ queryKey: routineKeys.summary() });
    },
  });
}

export function useDeleteRoutine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`routines/${id}`).json<void>(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: routineKeys.all() });
      qc.invalidateQueries({ queryKey: routineKeys.summary() });
    },
  });
}

export function useRoutineHistory(id: string) {
  const canFetch = useCanFetchApi();
  return useQuery({
    queryKey: routineKeys.history(id),
    queryFn: () => api.get(`routines/${id}/runs`).json<RoutineRunHistoryEntry[]>(),
    enabled: canFetch && Boolean(id),
  });
}
