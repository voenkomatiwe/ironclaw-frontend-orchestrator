import type { CopiedTradeRecord, TargetTrade } from "../../lib/api";
import { formatAge, truncateAddress } from "../../lib/utils";

export function TargetTradeRow({ trade }: { trade: TargetTrade }) {
  const isBuy = trade.side?.toUpperCase() === "BUY";
  const size = parseFloat(trade.usdcSize ?? "0").toFixed(0);
  const price = parseFloat(trade.price ?? "0").toFixed(3);

  return (
    <div className="space-y-2 border border-[#1A1A1A] bg-[#111111] px-3.5 py-3">
      <div className="flex items-center gap-2">
        <span
          className={`shrink-0 px-2 py-0.5 font-bold font-mono text-[9px] ${
            isBuy ? "bg-[#BFFF00] text-black" : "border border-[#FF4444] text-[#FF4444]"
          }`}
        >
          {isBuy ? "BUY" : "SELL"}
        </span>
        <span className="flex-1 truncate font-mono text-[11px] text-white">
          {truncateAddress(trade.conditionId ?? "", 8)}
        </span>
        <span className="shrink-0 font-mono text-[#6e6e6e] text-[10px]">{formatAge(trade.timestamp * 1000)}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="font-mono text-[#999999] text-[11px]">@ {price}¢</span>
        <span className={`font-mono font-semibold text-[11px] ${isBuy ? "text-[#BFFF00]" : "text-[#999999]"}`}>
          ${size}
        </span>
        <span className="flex-1 truncate font-mono text-[#404040] text-[10px]">
          {truncateAddress(trade.transactionHash ?? "", 6)}
        </span>
      </div>
    </div>
  );
}

export function CopiedTradeRow({ record }: { record: CopiedTradeRecord }) {
  const isBuy = record.sourceTrade.side?.toUpperCase() === "BUY";
  const badgeStyle =
    {
      success: "bg-[#BFFF00] text-black",
      failed: "border border-[#FF4444] text-[#FF4444]",
      skipped: "bg-[#F59E0B] text-black",
    }[record.result] ?? "border border-[#1A1A1A] text-[#6e6e6e]";

  return (
    <div className="space-y-2 border border-[#1A1A1A] bg-[#111111] px-3.5 py-3">
      <div className="flex items-center gap-2">
        <span className={`shrink-0 px-2 py-0.5 font-bold font-mono text-[9px] capitalize ${badgeStyle}`}>
          {record.result.toUpperCase()}
        </span>
        <span className="flex-1 truncate font-mono text-[11px] text-white">
          {truncateAddress(record.sourceTrade.market ?? record.sourceTrade.conditionId ?? "", 8)}
        </span>
        <span className="shrink-0 font-mono text-[#6e6e6e] text-[10px]">
          {formatAge(new Date(record.executedAt).getTime())}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <span
          className={`px-2 py-0.5 font-bold font-mono text-[9px] ${
            isBuy ? "bg-[#BFFF00]/20 text-[#BFFF00]" : "text-[#FF4444]"
          }`}
        >
          {isBuy ? "BUY" : "SELL"}
        </span>
        {record.copyNotional != null && (
          <span
            className={`font-mono font-semibold text-[11px] ${record.result === "success" ? "text-[#BFFF00]" : "text-[#999999]"}`}
          >
            Copied ${record.copyNotional.toFixed(0)}
          </span>
        )}
        {record.result === "skipped" || record.result === "failed" ? (
          <span className="truncate font-mono text-[#F59E0B] text-[10px]">{record.reason}</span>
        ) : null}
      </div>
    </div>
  );
}
