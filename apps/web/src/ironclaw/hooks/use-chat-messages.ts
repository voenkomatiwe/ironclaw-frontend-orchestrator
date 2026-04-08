import { useCallback, useMemo, useState } from "react";
import type { IronclawMessage, IronclawTurn } from "../api-types";
import { fetchIronclawHistoryBefore } from "../queries";

function turnsToMessages(turns: IronclawTurn[]): IronclawMessage[] {
  const msgs: IronclawMessage[] = [];
  for (const turn of turns) {
    if (turn.user_input) {
      msgs.push({
        role: "user",
        content: turn.user_input,
        timestamp: turn.started_at,
      });
    }
    if (turn.response) {
      msgs.push({
        role: "assistant",
        content: turn.response,
        timestamp: turn.completed_at,
        toolCalls: turn.tool_calls?.length ? turn.tool_calls : undefined,
      });
    }
  }
  return msgs;
}

type ChatMessagesReturn = {
  messages: IronclawMessage[];
  hasMore: boolean;
  loadOlderMessages: () => void;
  isLoadingOlder: boolean;
  resetPagination: () => void;
};

export function useChatMessages(
  activeThreadId: string | undefined,
  historyTurns: IronclawTurn[] | undefined,
  historyHasMore: boolean | undefined,
  historyOldestTimestamp: string | undefined
): ChatMessagesReturn {
  const [prependedTurns, setPrependedTurns] = useState<IronclawTurn[]>([]);
  const [paginationBefore, setPaginationBefore] = useState<string | null>(null);
  const [olderHasMore, setOlderHasMore] = useState<boolean | null>(null);
  const [loadOlderBusy, setLoadOlderBusy] = useState(false);

  const mergedTurns = useMemo(() => [...prependedTurns, ...(historyTurns ?? [])], [prependedTurns, historyTurns]);

  const messages = useMemo(() => turnsToMessages(mergedTurns), [mergedTurns]);

  const hasMore = Boolean((olderHasMore ?? historyHasMore) && (paginationBefore ?? historyOldestTimestamp));

  const loadOlderMessages = useCallback(async () => {
    const before = paginationBefore ?? historyOldestTimestamp;
    if (!activeThreadId || !before || loadOlderBusy) return;
    setLoadOlderBusy(true);
    try {
      const page = await fetchIronclawHistoryBefore(activeThreadId, before);
      setPrependedTurns((prev) => [...(page.turns ?? []), ...prev]);
      setPaginationBefore(page.oldest_timestamp ?? null);
      setOlderHasMore(page.has_more);
    } catch {
      /* swallow */
    } finally {
      setLoadOlderBusy(false);
    }
  }, [activeThreadId, paginationBefore, historyOldestTimestamp, loadOlderBusy]);

  const resetPagination = useCallback(() => {
    setPrependedTurns([]);
    setPaginationBefore(null);
    setOlderHasMore(null);
  }, []);

  return {
    messages,
    hasMore,
    loadOlderMessages: () => void loadOlderMessages(),
    isLoadingOlder: loadOlderBusy,
    resetPagination,
  };
}
