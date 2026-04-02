import { ChevronDown, ChevronUp, Save, Settings } from "lucide-react";
import { useEffect, useState } from "react";
import { useConfig, useUpdateConfig } from "../../hooks/useConfig";

export default function ConfigEditor() {
  const { data: cfg } = useConfig();
  const { mutate: update, isPending, isSuccess } = useUpdateConfig();
  const [expanded, setExpanded] = useState(false);
  const [form, setForm] = useState({
    positionMultiplier: 0.1,
    maxTradeSize: 100,
    minTradeSize: 1,
    slippageTolerance: 0.02,
    orderType: "FOK" as "FOK" | "FAK" | "LIMIT",
    maxSessionNotional: 0,
    maxPerMarketNotional: 0,
  });

  useEffect(() => {
    if (cfg)
      setForm({
        positionMultiplier: cfg.positionMultiplier,
        maxTradeSize: cfg.maxTradeSize,
        minTradeSize: cfg.minTradeSize,
        slippageTolerance: cfg.slippageTolerance,
        orderType: cfg.orderType,
        maxSessionNotional: cfg.maxSessionNotional,
        maxPerMarketNotional: cfg.maxPerMarketNotional,
      });
  }, [cfg]);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  const inputCls =
    "w-full bg-black border border-[#1A1A1A] h-9 px-3 font-mono text-[12px] text-white outline-none focus:border-[#BFFF00] transition-colors";

  return (
    <div className="border-[#1A1A1A] border-b">
      {/* Header */}
      <button
        className="flex w-full items-center justify-between px-5 py-3.5 transition-colors hover:bg-[#1A1A1A]/30"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <Settings className="h-3.5 w-3.5 text-[#6e6e6e]" />
          <span className="font-sans font-semibold text-[14px] text-white">Settings</span>
        </div>
        {expanded ? (
          <ChevronUp className="h-3.5 w-3.5 text-[#6e6e6e]" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-[#6e6e6e]" />
        )}
      </button>

      {!expanded && (
        <div className="space-y-1.5 px-5 pb-4">
          {[
            { label: "Position Multiplier", value: `${(form.positionMultiplier * 100).toFixed(0)}%` },
            { label: "Max Trade Size", value: `$${form.maxTradeSize}` },
            { label: "Order Type", value: form.orderType, highlight: true },
          ].map((r) => (
            <div className="flex items-center justify-between" key={r.label}>
              <span className="font-mono text-[#999999] text-[11px]">{r.label}</span>
              <span className={`font-mono font-semibold text-[11px] ${r.highlight ? "text-[#BFFF00]" : "text-white"}`}>
                {r.value}
              </span>
            </div>
          ))}
          <button
            className="mt-2 flex h-8 w-full items-center justify-center gap-1.5 border border-[#1A1A1A] bg-black font-medium font-mono text-[#6e6e6e] text-[11px] transition-colors hover:border-[#404040]"
            onClick={() => setExpanded(true)}
          >
            <Settings className="h-3 w-3" />
            EDIT SETTINGS
          </button>
        </div>
      )}

      {expanded && (
        <div className="space-y-4 px-5 pb-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-medium font-mono text-[#6e6e6e] text-[9px] tracking-widest">MULTIPLIER</label>
              <input
                className={inputCls}
                max="1"
                min="0.01"
                onChange={(e) => set("positionMultiplier", parseFloat(e.target.value))}
                step="0.01"
                type="number"
                value={form.positionMultiplier}
              />
              <p className="font-mono text-[#6e6e6e] text-[10px]">
                {(form.positionMultiplier * 100).toFixed(0)}% per trade
              </p>
            </div>
            <div className="space-y-1.5">
              <label className="font-medium font-mono text-[#6e6e6e] text-[9px] tracking-widest">
                MAX TRADE (USDC)
              </label>
              <input
                className={inputCls}
                min="1"
                onChange={(e) => set("maxTradeSize", parseFloat(e.target.value))}
                step="1"
                type="number"
                value={form.maxTradeSize}
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-medium font-mono text-[#6e6e6e] text-[9px] tracking-widest">
                MIN TRADE (USDC)
              </label>
              <input
                className={inputCls}
                min="0.5"
                onChange={(e) => set("minTradeSize", parseFloat(e.target.value))}
                step="0.5"
                type="number"
                value={form.minTradeSize}
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-medium font-mono text-[#6e6e6e] text-[9px] tracking-widest">SLIPPAGE</label>
              <input
                className={inputCls}
                max="0.1"
                min="0.005"
                onChange={(e) => set("slippageTolerance", parseFloat(e.target.value))}
                step="0.005"
                type="number"
                value={form.slippageTolerance}
              />
              <p className="font-mono text-[#6e6e6e] text-[10px]">{(form.slippageTolerance * 100).toFixed(1)}%</p>
            </div>
          </div>

          {/* Order type toggle */}
          <div className="space-y-1.5">
            <label className="font-medium font-mono text-[#6e6e6e] text-[9px] tracking-widest">ORDER TYPE</label>
            <div className="flex gap-2">
              {(["FOK", "FAK", "LIMIT"] as const).map((t) => (
                <button
                  className={`h-9 flex-1 font-mono font-semibold text-[11px] transition-colors ${
                    form.orderType === t
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
          </div>

          {/* Session cap */}
          <div className="space-y-1.5">
            <label className="font-medium font-mono text-[#6e6e6e] text-[9px] tracking-widest">
              SESSION CAP (0 = off)
            </label>
            <input
              className={inputCls}
              min="0"
              onChange={(e) => set("maxSessionNotional", parseFloat(e.target.value))}
              step="10"
              type="number"
              value={form.maxSessionNotional}
            />
          </div>

          <button
            className="flex h-10 w-full items-center justify-center gap-2 bg-[#BFFF00] font-mono font-semibold text-[12px] text-black transition-colors hover:bg-[#d4ff33] disabled:opacity-60"
            disabled={isPending}
            onClick={() => update(form)}
          >
            <Save className="h-3.5 w-3.5" />
            {isPending ? "SAVING…" : isSuccess ? "SAVED!" : "SAVE CHANGES"}
          </button>
        </div>
      )}
    </div>
  );
}
