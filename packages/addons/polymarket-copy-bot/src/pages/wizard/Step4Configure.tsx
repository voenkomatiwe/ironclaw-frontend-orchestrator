import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import type { TargetTrade } from "../../lib/api";
import { botApi, configApi, formatApiError, proxyApi } from "../../lib/api";

interface Props {
  onBack: () => void;
}

interface Settings {
  positionMultiplier: number;
  maxTradeSize: number;
  minTradeSize: number;
  slippageTolerance: number;
  orderType: "FOK" | "FAK" | "LIMIT";
  maxSessionNotional: number;
}

function calcMedian(sizes: number[]): number {
  if (sizes.length === 0) return 50;
  const sorted = [...sizes].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)] ?? 50;
}

function FieldRow({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="font-medium font-mono text-[#6e6e6e] text-[10px] tracking-widest">{label}</label>
      {children}
      {hint && <p className="font-mono text-[#6e6e6e] text-[11px]">{hint}</p>}
    </div>
  );
}

export default function Step4Configure({ onBack }: Props) {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<Settings>({
    positionMultiplier: 0.1,
    maxTradeSize: 100,
    minTradeSize: 1,
    slippageTolerance: 0.02,
    orderType: "FOK",
    maxSessionNotional: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { data: targetTrades } = useQuery({
    queryKey: ["target-trades-config"],
    queryFn: () => proxyApi.targetTrades(20),
    retry: false,
  });

  useEffect(() => {
    if (!targetTrades || targetTrades.length === 0) return;
    const sizes = targetTrades.map((t: TargetTrade) => parseFloat(t.usdcSize ?? "0")).filter((s: number) => s > 0);
    const median = calcMedian(sizes);
    const suggested = Math.round(median * 1.5);
    setSettings((s) => ({ ...s, maxTradeSize: Math.max(10, Math.min(suggested, 500)) }));
  }, [targetTrades]);

  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => setSettings((s) => ({ ...s, [k]: v }));

  const handleStart = async () => {
    const password = sessionStorage.getItem("_wizpwd") ?? "";
    if (!password) {
      setError("Session expired — please log out and log in again.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await configApi.update({ ...settings, setupComplete: true });
      await botApi.start(password);
      navigate("dashboard");
    } catch (err: unknown) {
      setError(await formatApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="font-sans font-semibold text-[32px] text-white">Configure Trading</h1>
        <p className="max-w-[560px] font-mono text-[#6e6e6e] text-[13px]">
          Set your risk limits and execution preferences. These can be changed any time from the dashboard.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-5">
        <FieldRow
          hint={`Copy ${(settings.positionMultiplier * 100).toFixed(0)}% of each target trade`}
          label="POSITION MULTIPLIER"
        >
          <div className="flex h-11 items-center gap-2 border border-[#BFFF00] bg-black px-3.5">
            <input
              className="flex-1 bg-transparent font-mono text-[13px] text-white outline-none"
              max="1"
              min="0.01"
              onChange={(e) => set("positionMultiplier", parseFloat(e.target.value))}
              step="0.01"
              type="number"
              value={settings.positionMultiplier}
            />
            <span className="shrink-0 font-mono text-[#6e6e6e] text-[11px]">× multiplier</span>
          </div>
        </FieldRow>

        <FieldRow hint={`${(settings.slippageTolerance * 100).toFixed(1)}% max slippage`} label="SLIPPAGE TOLERANCE">
          <div className="flex h-11 items-center gap-2 border border-[#1A1A1A] bg-black px-3.5 transition-colors focus-within:border-[#BFFF00]">
            <input
              className="flex-1 bg-transparent font-mono text-[13px] text-white outline-none"
              max="0.1"
              min="0.005"
              onChange={(e) => set("slippageTolerance", parseFloat(e.target.value))}
              step="0.005"
              type="number"
              value={settings.slippageTolerance}
            />
            <span className="shrink-0 font-mono text-[#6e6e6e] text-[11px]">% slippage</span>
          </div>
        </FieldRow>

        <FieldRow label="MAX TRADE SIZE">
          <div className="flex h-11 items-center gap-2 border border-[#1A1A1A] bg-black px-3.5 transition-colors focus-within:border-[#BFFF00]">
            <input
              className="flex-1 bg-transparent font-mono text-[13px] text-white outline-none"
              min="1"
              onChange={(e) => set("maxTradeSize", parseFloat(e.target.value))}
              step="1"
              type="number"
              value={settings.maxTradeSize}
            />
            <span className="shrink-0 font-mono text-[#6e6e6e] text-[11px]">USDC</span>
          </div>
        </FieldRow>

        <FieldRow label="MIN TRADE SIZE">
          <div className="flex h-11 items-center gap-2 border border-[#1A1A1A] bg-black px-3.5 transition-colors focus-within:border-[#BFFF00]">
            <input
              className="flex-1 bg-transparent font-mono text-[13px] text-white outline-none"
              min="0.5"
              onChange={(e) => set("minTradeSize", parseFloat(e.target.value))}
              step="0.5"
              type="number"
              value={settings.minTradeSize}
            />
            <span className="shrink-0 font-mono text-[#6e6e6e] text-[11px]">USDC</span>
          </div>
        </FieldRow>

        <FieldRow label="ORDER TYPE">
          <div className="flex gap-2">
            {(["FOK", "FAK", "LIMIT"] as const).map((t) => (
              <button
                className={`h-11 flex-1 font-mono font-semibold text-[12px] transition-colors ${
                  settings.orderType === t
                    ? "bg-[#BFFF00] text-black"
                    : "border border-[#1A1A1A] bg-black text-[#6e6e6e] hover:border-[#404040]"
                }`}
                key={t}
                onClick={() => set("orderType", t)}
              >
                {t}
              </button>
            ))}
          </div>
        </FieldRow>

        <FieldRow hint="0 = no cap (unlimited)" label="SESSION CAP">
          <div className="flex h-11 items-center gap-2 border border-[#1A1A1A] bg-black px-3.5 transition-colors focus-within:border-[#BFFF00]">
            <input
              className="flex-1 bg-transparent font-mono text-[13px] text-white outline-none"
              min="0"
              onChange={(e) => set("maxSessionNotional", parseFloat(e.target.value))}
              step="10"
              type="number"
              value={settings.maxSessionNotional}
            />
            <span className="shrink-0 font-mono text-[#6e6e6e] text-[11px]">USDC</span>
          </div>
        </FieldRow>
      </div>

      {error && <p className="font-mono text-[#FF4444] text-xs">{error}</p>}

      <div className="flex gap-3">
        <button
          className="flex h-12 items-center justify-center gap-2 border border-[#1A1A1A] bg-black px-8 font-medium font-mono text-[#6e6e6e] text-[13px] transition-colors hover:border-[#404040]"
          onClick={onBack}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          BACK
        </button>
        <button
          className="flex h-12 items-center gap-2 bg-[#BFFF00] px-10 font-mono font-semibold text-[13px] text-black transition-colors hover:bg-[#d4ff33] disabled:opacity-60"
          disabled={loading}
          onClick={handleStart}
        >
          <Zap className="h-3.5 w-3.5" />
          {loading ? "STARTING…" : "START BOT"}
        </button>
      </div>
    </div>
  );
}
