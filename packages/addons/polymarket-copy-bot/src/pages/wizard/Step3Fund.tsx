import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Copy, Lightbulb, RefreshCw } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
import type { TargetTrade } from "../../lib/api";
import { configApi, proxyApi, walletApi } from "../../lib/api";
import { formatAge, truncateAddress } from "../../lib/utils";

interface Props {
  onBack: () => void;
  onNext: () => void;
}

export default function Step3Fund({ onBack, onNext }: Props) {
  const [copied, setCopied] = useState(false);
  const { data: cfg } = useQuery({ queryKey: ["config"], queryFn: () => configApi.get() });
  const { data: balance, refetch } = useQuery({
    queryKey: ["wallet-balance"],
    queryFn: () => walletApi.balance(),
    refetchInterval: 8000,
  });
  const { data: targetTrades } = useQuery({
    queryKey: ["target-trades-preview"],
    queryFn: () => proxyApi.targetTrades(6),
    retry: false,
  });

  const address = cfg?.walletAddress ?? "";
  const hasMatic = parseFloat(balance?.maticBalance ?? "0") > 0.01;
  const hasUsdc = parseFloat(balance?.usdcBalance ?? "0") > 1;

  const copyAddr = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="font-sans font-semibold text-[32px] text-white">Fund Your Wallet</h1>
        <p className="max-w-[560px] font-mono text-[#6e6e6e] text-[13px]">
          Deposit MATIC for gas fees and USDC.e as trading capital. Your bot is ready to trade once funded.
        </p>
      </div>

      <div className="grid grid-cols-[auto_1fr] gap-4">
        {/* QR Card */}
        <div className="flex flex-col gap-5 border border-[#1A1A1A] bg-[#111111] p-6">
          <p className="font-sans font-semibold text-[15px] text-white">Bot Wallet</p>
          {address ? (
            <>
              <div className="flex items-center justify-center bg-[#1A1A1A] p-3">
                <QRCodeSVG bgColor="#1A1A1A" fgColor="#BFFF00" size={120} value={address} />
              </div>
              <div className="flex h-9 items-center gap-2 border border-[#1A1A1A] bg-black px-2.5">
                <span className="flex-1 truncate font-mono text-[#BFFF00] text-[11px]">
                  {truncateAddress(address, 10)}
                </span>
                <button className="text-[#6e6e6e] hover:text-white" onClick={copyAddr}>
                  <Copy className="h-3 w-3" />
                </button>
              </div>
              {copied && <p className="-mt-3 font-mono text-[#BFFF00] text-[10px]">Copied!</p>}
            </>
          ) : (
            <div className="h-32 w-32 animate-pulse bg-[#1A1A1A]" />
          )}
        </div>

        {/* Balances */}
        <div className="flex flex-col gap-4 border border-[#1A1A1A] bg-[#111111] p-6">
          <p className="font-sans font-semibold text-[15px] text-white">Balances</p>
          <div className="grid grid-cols-2 gap-3">
            <div className={`space-y-1.5 border bg-black p-4 ${hasMatic ? "border-[#BFFF00]" : "border-[#1A1A1A]"}`}>
              <p className="font-medium font-mono text-[#6e6e6e] text-[10px] tracking-widest">MATIC</p>
              <p className="font-sans font-semibold text-[24px] text-white">{balance?.maticBalance ?? "—"}</p>
              <p className="font-mono text-[#6e6e6e] text-[11px]">Gas fees</p>
            </div>
            <div className={`space-y-1.5 border bg-black p-4 ${hasUsdc ? "border-[#BFFF00]" : "border-[#1A1A1A]"}`}>
              <p className="font-medium font-mono text-[#6e6e6e] text-[10px] tracking-widest">USDC.e</p>
              <p className="font-sans font-semibold text-[#BFFF00] text-[24px]">{balance?.usdcBalance ?? "—"}</p>
              <p className="font-mono text-[#6e6e6e] text-[11px]">Trading capital</p>
            </div>
          </div>
          <button
            className="flex h-9 items-center justify-center gap-2 border border-[#1A1A1A] bg-black font-medium font-mono text-[#6e6e6e] text-[11px] transition-colors hover:border-[#404040]"
            onClick={() => refetch()}
          >
            <RefreshCw className="h-3 w-3" />
            REFRESH
          </button>
        </div>
      </div>

      {/* Skip tip */}
      <div className="flex items-start gap-3 border border-[#1A1A1A] bg-black p-4">
        <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-[#F59E0B]" />
        <p className="font-mono text-[#F59E0B] text-[11px] leading-relaxed">
          You can skip this step and fund later. The bot won't execute trades until it has sufficient USDC.e balance.
        </p>
      </div>

      {/* Target trades preview */}
      {targetTrades && targetTrades.length > 0 && (
        <div className="space-y-3 border border-[#1A1A1A] bg-[#111111] p-5">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 animate-pulse bg-[#BFFF00]" />
            <p className="font-sans font-semibold text-[13px] text-white">Recent Target Trades</p>
          </div>
          <div className="space-y-2">
            {targetTrades.slice(0, 4).map((t: TargetTrade, i: number) => {
              const isBuy = t.side?.toUpperCase() === "BUY";
              return (
                <div className="flex items-center gap-3 border border-[#1A1A1A] bg-black px-3 py-2.5" key={i}>
                  <span
                    className={`shrink-0 px-2 py-0.5 font-bold font-mono text-[9px] ${
                      isBuy ? "bg-[#BFFF00] text-black" : "border border-[#FF4444] text-[#FF4444]"
                    }`}
                  >
                    {isBuy ? "BUY" : "SELL"}
                  </span>
                  <span className="flex-1 truncate font-mono text-[11px] text-white">
                    {truncateAddress(t.conditionId ?? "", 8)}
                  </span>
                  <span
                    className={`font-mono font-semibold text-[11px] ${isBuy ? "text-[#BFFF00]" : "text-[#999999]"}`}
                  >
                    ${parseFloat(t.usdcSize ?? "0").toFixed(0)}
                  </span>
                  <span className="shrink-0 font-mono text-[#6e6e6e] text-[10px]">{formatAge(t.timestamp * 1000)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <button
          className="flex h-12 items-center justify-center gap-2 border border-[#1A1A1A] bg-black px-8 font-medium font-mono text-[#6e6e6e] text-[13px] transition-colors hover:border-[#404040]"
          onClick={onBack}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          BACK
        </button>
        <button
          className="flex h-12 items-center gap-2 bg-[#BFFF00] px-8 font-mono font-semibold text-[13px] text-black transition-colors hover:bg-[#d4ff33]"
          onClick={onNext}
        >
          {hasMatic && hasUsdc ? "CONTINUE" : "SKIP FOR NOW"}
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
