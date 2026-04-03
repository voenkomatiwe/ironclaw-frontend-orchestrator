import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { api } from "@/api";
import { useAppStore } from "@/store/app";
import type { LogEntry, LogLevel, LogsLevelResponse } from "./api-types";

function useCanFetchApi() {
  return useAppStore((s) => Boolean(s.token?.trim() && s.apiUrl?.trim()));
}

export const logsKeys = {
  level: () => ["logs", "level"] as const,
};

export function useLogsLevel() {
  const canFetch = useCanFetchApi();
  return useQuery({
    queryKey: logsKeys.level(),
    queryFn: () => api.get("logs/level").json<LogsLevelResponse>(),
    enabled: canFetch,
  });
}

export function useSetLogsLevel() {
  return useMutation({
    mutationFn: (level: LogLevel) => api.put("logs/level", { json: { level } }).json<LogsLevelResponse>(),
  });
}

export function useLogStream(enabled: boolean) {
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [connected, setConnected] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const token = useAppStore((s) => s.token);
  const apiUrl = useAppStore((s) => s.apiUrl);

  useEffect(() => {
    if (!enabled || !token || !apiUrl) return;

    const controller = new AbortController();
    abortRef.current = controller;

    (async () => {
      setConnected(true);
      try {
        const res = await fetch(`${apiUrl}/api/logs/events`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "text/event-stream",
          },
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
                const entry: LogEntry = JSON.parse(line.slice(5).trim());
                setEntries((prev) => [...prev.slice(-999), entry]);
              } catch {}
            }
          }
        }
      } catch {} finally {
        setConnected(false);
      }
    })();

    return () => {
      controller.abort();
      abortRef.current = null;
    };
  }, [enabled, token, apiUrl]);

  const clear = () => setEntries([]);

  return { entries, connected, clear };
}
