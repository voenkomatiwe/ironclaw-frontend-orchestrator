import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api";
import { useAppStore } from "@/store/app";
import type {
  IronclawHistoryResponse,
  IronclawSendResponse,
  IronclawStatus,
  IronclawThread,
  IronclawThreadsResponse,
} from "./api-types";

export const ironclawKeys = {
  status: () => ["ironclaw", "status"] as const,
  threads: () => ["ironclaw", "threads"] as const,
  history: (threadId?: string) => ["ironclaw", "history", threadId] as const,
};

export function useIronclawStatus() {
  const token = useAppStore((s) => s.token);
  return useQuery({
    queryKey: ironclawKeys.status(),
    queryFn: () => api.get("ironclaw/status").json<IronclawStatus>(),
    refetchInterval: 15000,
    retry: false,
    enabled: !!token,
  });
}

export function useIronclawThreads() {
  const token = useAppStore((s) => s.token);
  return useQuery({
    queryKey: ironclawKeys.threads(),
    queryFn: () => api.get("ironclaw/threads").json<IronclawThreadsResponse>(),
    refetchInterval: 10000,
    enabled: !!token,
  });
}

export function useIronclawHistory(threadId?: string) {
  const token = useAppStore((s) => s.token);
  return useQuery({
    queryKey: ironclawKeys.history(threadId),
    queryFn: () =>
      api
        .get("ironclaw/chat/history", { searchParams: threadId ? { thread_id: threadId } : {} })
        .json<IronclawHistoryResponse>(),
    refetchInterval: 3000,
    enabled: !!token && !!threadId,
  });
}

export function useIronclawSendMessage() {
  const qc = useQueryClient();
  return useMutation<IronclawSendResponse, Error, { content: string; thread_id?: string }>({
    mutationFn: (vars) => api.post("ironclaw/chat/send", { json: vars }).json<IronclawSendResponse>(),
    onSuccess: (_data, vars) => {
      setTimeout(() => {
        void qc.invalidateQueries({ queryKey: ironclawKeys.history(vars.thread_id) });
        void qc.invalidateQueries({ queryKey: ironclawKeys.threads() });
      }, 1500);
    },
  });
}

export function useIronclawCreateThread() {
  const qc = useQueryClient();
  return useMutation<IronclawThread, Error, void>({
    mutationFn: () => api.post("ironclaw/threads").json<IronclawThread>(),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ironclawKeys.threads() });
    },
  });
}
