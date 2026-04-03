import { useEffect, useRef } from "react";
import { useAppStore } from "@/store/app";
import type { IronclawSsePayload } from "./api-types";
import { appendSseBuffer } from "./chat-sse";

export type ChatSseEvent = { event: string; payload: IronclawSsePayload };

function chatEventsUrls(apiUrl: string): string[] {
  const base = apiUrl.replace(/\/$/, "");
  return [`${base}/api/chat/events`, `${base}/api/ironclaw/chat/events`];
}

export function useIronclawChatSse(enabled: boolean, onEvent: (ev: ChatSseEvent) => void) {
  const token = useAppStore((s) => s.token);
  const apiUrl = useAppStore((s) => s.apiUrl);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    if (!enabled || !token?.trim() || !apiUrl?.trim()) return;

    const controller = new AbortController();
    let cancelled = false;

    (async () => {
      for (const url of chatEventsUrls(apiUrl)) {
        if (cancelled) return;
        let buf = "";
        try {
          const res = await fetch(url, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token.trim()}`,
              Accept: "text/event-stream",
            },
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
  }, [enabled, token, apiUrl]);
}
