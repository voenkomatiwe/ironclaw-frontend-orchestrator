import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Options } from "ky";
import { api } from "@/api";
import { useAppStore } from "@/store/app";
import type {
  IronclawHistoryResponse,
  IronclawImageAttachment,
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

const PATHS = {
  gatewayStatus: ["gateway/status"] as const,
  chatHistory: ["chat/history", "ironclaw/chat/history"] as const,
  chatThreads: ["chat/threads", "ironclaw/threads"] as const,
  chatSend: ["chat/send", "ironclaw/chat/send"] as const,
  chatThreadNew: ["chat/thread/new", "ironclaw/threads"] as const,
  chatApproval: ["chat/approval", "ironclaw/chat/approval"] as const,
  chatAuthToken: ["chat/auth-token", "ironclaw/chat/auth-token"] as const,
  chatAuthCancel: ["chat/auth-cancel", "ironclaw/chat/auth-cancel"] as const,
} as const;

async function getFirstJson<T>(paths: readonly string[], options?: Options): Promise<T> {
  let last: Error | null = null;
  for (const path of paths) {
    try {
      return await api.get(path, options).json<T>();
    } catch (e) {
      last = e instanceof Error ? e : new Error(String(e));
    }
  }
  throw last ?? new Error("request failed");
}

async function postFirstJson<TRes, TBody extends Record<string, unknown>>(
  paths: readonly string[],
  body: TBody
): Promise<TRes> {
  let last: Error | null = null;
  for (const path of paths) {
    try {
      return await api.post(path, { json: body }).json<TRes>();
    } catch (e) {
      last = e instanceof Error ? e : new Error(String(e));
    }
  }
  throw last ?? new Error("request failed");
}

function useCanFetchApi() {
  return useAppStore((s) => Boolean(s.token?.trim() && s.apiUrl?.trim()));
}

export function useIronclawStatus() {
  const canFetch = useCanFetchApi();
  return useQuery({
    queryKey: ironclawKeys.status(),
    queryFn: async (): Promise<IronclawStatus> => {
      try {
        const gateway = await getFirstJson<Record<string, unknown>>(PATHS.gatewayStatus);
        return { connected: true, gateway };
      } catch (e) {
        return {
          connected: false,
          error: e instanceof Error ? e.message : String(e),
        };
      }
    },
    refetchInterval: 15000,
    retry: false,
    enabled: canFetch,
  });
}

export function useIronclawThreads() {
  const canFetch = useCanFetchApi();
  return useQuery({
    queryKey: ironclawKeys.threads(),
    queryFn: () => getFirstJson<IronclawThreadsResponse>(PATHS.chatThreads),
    refetchInterval: 10000,
    enabled: canFetch,
  });
}

export type IronclawHistoryOptions = {
  refetchInterval?: number | false;
};

export function useIronclawHistory(threadId?: string, options?: IronclawHistoryOptions) {
  const canFetch = useCanFetchApi();
  const interval = options?.refetchInterval ?? 3000;
  return useQuery({
    queryKey: ironclawKeys.history(threadId),
    queryFn: () =>
      getFirstJson<IronclawHistoryResponse>(PATHS.chatHistory, {
        searchParams: threadId ? { thread_id: threadId } : {},
      }),
    refetchInterval: interval === false ? false : interval,
    enabled: canFetch && !!threadId,
  });
}

export async function fetchIronclawHistoryBefore(threadId: string, before: string, limit = 50) {
  return getFirstJson<IronclawHistoryResponse>(PATHS.chatHistory, {
    searchParams: { thread_id: threadId, before, limit: String(limit) },
  });
}

export type IronclawSendVars = {
  content: string;
  thread_id?: string;
  timezone?: string;
  images?: IronclawImageAttachment[];
};

export function useIronclawSendMessage() {
  const qc = useQueryClient();
  return useMutation<IronclawSendResponse, Error, IronclawSendVars>({
    mutationFn: (vars) =>
      postFirstJson<IronclawSendResponse, Record<string, unknown>>(PATHS.chatSend, {
        content: vars.content,
        thread_id: vars.thread_id,
        timezone: vars.timezone,
        ...(vars.images?.length ? { images: vars.images } : {}),
      }),
    onSuccess: (_data, vars) => {
      setTimeout(() => {
        void qc.invalidateQueries({ queryKey: ironclawKeys.history(vars.thread_id) });
        void qc.invalidateQueries({ queryKey: ironclawKeys.threads() });
      }, 800);
    },
  });
}

export function useIronclawApproval() {
  const qc = useQueryClient();
  return useMutation<
    IronclawSendResponse,
    Error,
    { request_id: string; action: "approve" | "deny" | "always"; thread_id?: string }
  >({
    mutationFn: (body) =>
      postFirstJson<IronclawSendResponse, Record<string, unknown>>(PATHS.chatApproval, {
        request_id: body.request_id,
        action: body.action,
        ...(body.thread_id ? { thread_id: body.thread_id } : {}),
      }),
    onSuccess: (_d, vars) => {
      void qc.invalidateQueries({ queryKey: ironclawKeys.history(vars.thread_id) });
    },
  });
}

export function useIronclawAuthToken() {
  const qc = useQueryClient();
  return useMutation<unknown, Error, { extension_name: string; token: string }>({
    mutationFn: (body) =>
      postFirstJson<unknown, Record<string, unknown>>(PATHS.chatAuthToken, {
        extension_name: body.extension_name,
        token: body.token,
      }),
    onSuccess: () => {
      void qc.invalidateQueries();
    },
  });
}

export function useIronclawAuthCancel() {
  return useMutation<unknown, Error, { extension_name: string }>({
    mutationFn: (body) =>
      postFirstJson<unknown, Record<string, unknown>>(PATHS.chatAuthCancel, {
        extension_name: body.extension_name,
      }),
  });
}

export function useIronclawCreateThread() {
  const qc = useQueryClient();
  return useMutation<IronclawThread, Error, void>({
    mutationFn: () => postFirstJson<IronclawThread, Record<string, never>>(PATHS.chatThreadNew, {}),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ironclawKeys.threads() });
    },
  });
}
