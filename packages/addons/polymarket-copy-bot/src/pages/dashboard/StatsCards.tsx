import { CircleCheck, CircleX, DollarSign, TrendingUp } from "lucide-react";
import type { BotStatusPayload } from "../../lib/api";
import { formatUsdc } from "../../lib/utils";

interface Props {
  stats: BotStatusPayload["stats"] | undefined;
}

export default function StatsCards({ stats }: Props) {
  const s = stats ?? { tradesDetected: 0, tradesCopied: 0, tradesFailed: 0, totalVolume: 0 };

  const cards = [
    {
      label: "DETECTED",
      value: s.tradesDetected,
      icon: TrendingUp,
      color: "text-[#3B82F6]",
      sub: "Target trades found",
    },
    {
      label: "COPIED",
      value: s.tradesCopied,
      icon: CircleCheck,
      color: "text-[#BFFF00]",
      sub: "Successfully executed",
      highlight: true,
    },
    { label: "FAILED", value: s.tradesFailed, icon: CircleX, color: "text-[#FF4444]", sub: "Failed or skipped" },
    {
      label: "VOLUME",
      value: formatUsdc(s.totalVolume),
      icon: DollarSign,
      color: "text-[#F59E0B]",
      sub: "Total notional copied",
    },
  ];

  return (
    <div className="grid grid-cols-4 divide-x divide-[#1A1A1A] border-[#1A1A1A] border-b">
      {cards.map((c) => (
        <div className="space-y-1.5 bg-black px-6 py-5" key={c.label}>
          <p className="font-medium font-mono text-[#6e6e6e] text-[10px] tracking-widest">{c.label}</p>
          <div className="flex items-center gap-2">
            <p className={`font-sans font-semibold text-[32px] ${c.highlight ? "text-[#BFFF00]" : "text-white"}`}>
              {c.value}
            </p>
            <c.icon className={`h-4.5 w-4.5 ${c.color}`} style={{ width: 18, height: 18 }} />
          </div>
          <p className="font-mono text-[#6e6e6e] text-[11px]">{c.sub}</p>
        </div>
      ))}
    </div>
  );
}
