import { useEffect, useState } from "react";
import type { CopiedTradeRecord, TargetTrade } from "../lib/api";
import { botApi } from "../lib/api";
import { wsClient } from "../lib/ws";

export function useTrades() {
  const [targetTrades, setTargetTrades] = useState<TargetTrade[]>([]);
  const [copiedTrades, setCopiedTrades] = useState<CopiedTradeRecord[]>([]);

  // Load history on mount
  useEffect(() => {
    void botApi
      .copiedTrades()
      .then(setCopiedTrades)
      .catch(() => {});
  }, []);

  // Subscribe to live events
  useEffect(() => {
    const unsub = wsClient.on((msg) => {
      if (msg.type === "trade:detected") {
        setTargetTrades((prev) => [msg.payload as TargetTrade, ...prev].slice(0, 100));
      } else if (msg.type === "trade:copied" || msg.type === "trade:failed" || msg.type === "trade:skipped") {
        setCopiedTrades((prev) => [msg.payload as CopiedTradeRecord, ...prev].slice(0, 100));
      }
    });
    return unsub;
  }, []);

  return { targetTrades, copiedTrades };
}
