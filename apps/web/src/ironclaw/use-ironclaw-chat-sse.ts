import { useEffect, useRef } from "react";
import { useAppStore } from "@/store/app";
import type { IronclawSsePayload } from "./api-types";
import { appendSseBuffer } from "./chat-sse";

export type ChatSseEvent = { event: string; payload: IronclawSsePayload };

/** SSE paths to try — relative so they go through the Vite proxy (no CORS). */
const CHAT_SSE_PATHS = ["/api/chat/events", "/api/ironclaw/chat/events"];

export function useIronclawChatSse(enabled: boolean, onEvent: (ev: ChatSseEvent) => void) {
  const hasSession = useAppStore((s) => s.proxyReady && Boolean(s.token?.trim() && s.apiUrl?.trim()));
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    if (!enabled || !hasSession) return;

    const controller = new AbortController();
    let cancelled = false;

    (async () => {
      for (const path of CHAT_SSE_PATHS) {
        if (cancelled) return;
        let buf = "";
        try {
          const res = await fetch(path, {
            method: "GET",
            headers: { Accept: "text/event-stream" },
            signal: controller.signal,
          });
          if (!res.ok || !res.body) continue;

          const reader = res.body.getReader();
          const decoder = new TextDecoder();

          while (!cancelled) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            const parsed = appendSseBuffer(buf, chunk);
            buf = parsed.rest;
            for (const { event, data } of parsed.events) {
              if (!data || data === "" || data === "{}") continue;
              try {
                const payload = JSON.parse(data) as IronclawSsePayload;
                onEventRef.current({ event, payload });
              } catch {}
            }
          }
          return;
        } catch {}
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [enabled, hasSession]);
}
