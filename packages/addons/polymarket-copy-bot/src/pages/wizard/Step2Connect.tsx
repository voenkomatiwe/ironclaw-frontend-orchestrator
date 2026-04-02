import { ArrowLeft, ArrowRight, Info } from "lucide-react";
import { useState } from "react";
import { configApi, formatApiError } from "../../lib/api";

interface Props {
  onBack: () => void;
  onNext: () => void;
}

export default function Step2Connect({ onBack, onNext }: Props) {
  const [targetWallet, setTargetWallet] = useState("");
  const [alchemyWsUrl, setAlchemyWsUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isEthAddress = (v: string) => /^0x[0-9a-fA-F]{40}$/.test(v.trim());
  const isWss = (v: string) => v.trim().startsWith("wss://");
  const deriveRpcUrl = (wss: string) => wss.trim().replace(/^wss:\/\//, "https://");

  const handleNext = async () => {
    if (!isEthAddress(targetWallet)) {
      setError("Enter a valid Ethereum address (0x…40 hex chars).");
      return;
    }
    if (!isWss(alchemyWsUrl)) {
      setError("Alchemy URL must start with wss://");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await configApi.update({
        targetWallet: targetWallet.trim().toLowerCase(),
        alchemyWsUrl: alchemyWsUrl.trim(),
        rpcUrl: deriveRpcUrl(alchemyWsUrl),
        useAlchemy: true,
      });
      onNext();
    } catch (err: unknown) {
      setError(await formatApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="font-sans font-semibold text-[32px] text-white">Connect to Polymarket</h1>
        <p className="max-w-[560px] font-mono text-[#6e6e6e] text-[13px]">
          Enter the wallet address you want to copy-trade and your Alchemy WebSocket URL for real-time monitoring.
        </p>
      </div>

      <div className="space-y-6 border border-[#1A1A1A] bg-[#111111] p-8">
        {/* Target wallet */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <label className="font-medium font-mono text-[#6e6e6e] text-[10px] tracking-widest">
              TARGET WALLET ADDRESS
            </label>
            <span className="font-bold font-mono text-[#FF4444] text-[9px]">REQUIRED</span>
          </div>
          <div className="flex h-11 items-center gap-2 border border-[#1A1A1A] bg-black px-3.5 transition-colors focus-within:border-[#BFFF00]">
            <span className="shrink-0 font-mono text-[#BFFF00] text-[13px]">0x</span>
            <input
              className="flex-1 bg-transparent font-mono text-[13px] text-white outline-none placeholder:text-[#404040]"
              onChange={(e) => setTargetWallet("0x" + e.target.value.replace(/^0x/, ""))}
              placeholder="40-character hex address"
              value={targetWallet.startsWith("0x") ? targetWallet.slice(2) : targetWallet}
            />
          </div>
          <div className="flex items-center gap-1.5">
            <Info className="h-3 w-3 shrink-0 text-[#3B82F6]" />
            <p className="font-mono text-[#3B82F6] text-[11px]">The wallet you want to mirror trades from</p>
          </div>
        </div>

        {/* Alchemy WSS */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <label className="font-medium font-mono text-[#6e6e6e] text-[10px] tracking-widest">
              ALCHEMY WEBSOCKET URL
            </label>
            <span className="font-bold font-mono text-[#FF4444] text-[9px]">REQUIRED</span>
          </div>
          <div className="flex h-11 items-center gap-2 border border-[#1A1A1A] bg-black px-3.5 transition-colors focus-within:border-[#BFFF00]">
            <span className="shrink-0 font-mono text-[#BFFF00] text-[13px]">wss://</span>
            <input
              className="flex-1 bg-transparent font-mono text-[13px] text-white outline-none placeholder:text-[#404040]"
              onChange={(e) => setAlchemyWsUrl("wss://" + e.target.value.replace(/^wss:\/\//, ""))}
              placeholder="polygon-mainnet.g.alchemy.com/v2/YOUR_KEY"
              value={alchemyWsUrl.replace(/^wss:\/\//, "")}
            />
          </div>
          <div className="flex items-center gap-1.5">
            <Info className="h-3 w-3 shrink-0 text-[#3B82F6]" />
            <p className="font-mono text-[#3B82F6] text-[11px]">HTTP RPC derived automatically from this URL</p>
          </div>
        </div>

        {error && <p className="font-mono text-[#FF4444] text-xs">{error}</p>}
      </div>

      <div className="flex gap-3">
        <button
          className="flex h-12 items-center justify-center gap-2 border border-[#1A1A1A] bg-black px-8 font-medium font-mono text-[#6e6e6e] text-[13px] transition-colors hover:border-[#404040]"
          onClick={onBack}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          BACK
        </button>
        <button
          className="flex h-12 items-center gap-2 bg-[#BFFF00] px-8 font-mono font-semibold text-[13px] text-black transition-colors hover:bg-[#d4ff33] disabled:opacity-60"
          disabled={loading}
          onClick={handleNext}
        >
          {loading ? "SAVING…" : "CONTINUE"}
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
