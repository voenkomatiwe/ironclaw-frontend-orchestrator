import { useQuery } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { useTrades } from "../../hooks/useTrades";
import type { TargetTrade } from "../../lib/api";
import { proxyApi } from "../../lib/api";
import { CopiedTradeRow, TargetTradeRow } from "./TradeRow";

export default function TradesFeed() {
  const { targetTrades: liveTrades, copiedTrades } = useTrades();

  const { data: historicalTargetTrades, refetch } = useQuery({
    queryKey: ["target-trades-feed"],
    queryFn: () => proxyApi.targetTrades(20),
    refetchInterval: 30_000,
    retry: false,
  });

  const targetTrades = liveTrades.length > 0 ? liveTrades : (historicalTargetTrades ?? []);

  return (
    <div className="flex flex-1 divide-x divide-[#1A1A1A] overflow-hidden">
      {/* Target trades */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex shrink-0 items-center gap-2 border-[#1A1A1A] border-b px-5 py-3.5">
          <div className="h-1.5 w-1.5 animate-pulse bg-[#3B82F6]" />
          <h3 className="flex-1 font-sans font-semibold text-[14px] text-white">Target Trades</h3>
          <button className="text-[#6e6e6e] transition-colors hover:text-white" onClick={() => refetch()}>
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="flex-1 space-y-2 overflow-y-auto p-4">
          {targetTrades.length === 0 ? (
            <p className="py-10 text-center font-mono text-[#6e6e6e] text-[11px]">Waiting for trades…</p>
          ) : (
            targetTrades.map((t: TargetTrade, i: number) => <TargetTradeRow key={i} trade={t} />)
          )}
        </div>
      </div>

      {/* Copied trades */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex shrink-0 items-center gap-2 border-[#1A1A1A] border-b px-5 py-3.5">
          <div className="h-1.5 w-1.5 animate-pulse bg-[#BFFF00]" />
          <h3 className="flex-1 font-sans font-semibold text-[14px] text-white">Copied Trades</h3>
        </div>
        <div className="flex-1 space-y-2 overflow-y-auto p-4">
          {copiedTrades.length === 0 ? (
            <p className="py-10 text-center font-mono text-[#6e6e6e] text-[11px]">No trades copied yet.</p>
          ) : (
            copiedTrades.map((r) => <CopiedTradeRow key={r.id} record={r} />)
          )}
        </div>
      </div>
    </div>
  );
}
