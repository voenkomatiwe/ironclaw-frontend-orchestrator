import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Loader2, Play, Square, X } from "lucide-react";
import { useState } from "react";
import type { BotStatusPayload } from "../../lib/api";
import { botApi, formatApiError } from "../../lib/api";

interface Props {
  status: BotStatusPayload | undefined;
  compact?: boolean;
}

function ApprovalModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-md border border-[#1A1A1A] bg-[#111111]">
        <div className="flex items-start justify-between border-[#1A1A1A] border-b p-5 pb-4">
          <div className="flex items-center gap-2 text-[#F59E0B]">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span className="font-sans font-semibold text-white">USDC Approval Required</span>
          </div>
          <button className="text-[#6e6e6e] hover:text-white" onClick={onClose}>
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-3 p-5">
          <p className="font-mono text-[#999999] text-[12px]">
            Your wallet needs to approve USDC spending before the bot can place orders. This is a one-time on-chain
            transaction that costs a small amount of MATIC for gas.
          </p>
          <ol className="space-y-1.5 pl-3">
            {[
              "Ensure your wallet has MATIC for gas (~0.01 MATIC)",
              "Go to polymarket.com and connect your wallet",
              "Deposit any amount of USDC to trigger approval",
              "Come back here and start the bot",
            ].map((s, i) => (
              <li className="flex gap-2 font-mono text-[#999999] text-[11px]" key={i}>
                <span className="shrink-0 text-[#BFFF00]">{i + 1}.</span>
                {s}
              </li>
            ))}
          </ol>
          <button
            className="mt-2 h-10 w-full bg-[#BFFF00] font-mono font-semibold text-[12px] text-black transition-colors hover:bg-[#d4ff33]"
            onClick={onClose}
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

function isApprovalError(msg: string) {
  const l = msg.toLowerCase();
  return l.includes("allowance") || l.includes("approval") || l.includes("approve") || l.includes("not enough balance");
}

export default function StatusBar({ status, compact: _compact }: Props) {
  const qc = useQueryClient();
  const [showPwd, setShowPwd] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showApproval, setShowApproval] = useState(false);

  const isRunning = status?.status === "running";
  const isTransitioning = status?.status === "starting" || status?.status === "stopping";

  const handleStop = async () => {
    setLoading(true);
    try {
      await botApi.stop();
      qc.invalidateQueries({ queryKey: ["bot-status"] });
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async () => {
    if (!password) {
      setShowPwd(true);
      return;
    }
    setLoading(true);
    setError("");
    try {
      await botApi.start(password);
      setShowPwd(false);
      setPassword("");
      qc.invalidateQueries({ queryKey: ["bot-status"] });
    } catch (err: unknown) {
      const msg = await formatApiError(err);
      setError(msg);
      if (isApprovalError(msg)) setShowApproval(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {showApproval && <ApprovalModal onClose={() => setShowApproval(false)} />}

      <div className="flex items-center gap-3">
        {showPwd && !isRunning && (
          <div className="flex items-center gap-2">
            <input
              autoFocus
              className="h-8 w-32 border border-[#1A1A1A] bg-black px-2.5 font-mono text-[12px] text-white outline-none transition-colors placeholder:text-[#404040] focus:border-[#BFFF00]"
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleStart()}
              placeholder="Password"
              type="password"
              value={password}
            />
            {error && <span className="max-w-[120px] truncate font-mono text-[#FF4444] text-[10px]">{error}</span>}
          </div>
        )}

        {isRunning ? (
          <button
            className="flex h-8 items-center gap-1.5 border border-[#FF4444] bg-black px-3.5 font-medium font-mono text-[#FF4444] text-[12px] transition-colors hover:bg-[#FF4444]/10 disabled:opacity-50"
            disabled={loading || isTransitioning}
            onClick={handleStop}
          >
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Square className="h-3 w-3" />}
            STOP
          </button>
        ) : (
          <button
            className="flex h-8 items-center gap-1.5 bg-[#BFFF00] px-3.5 font-mono font-semibold text-[12px] text-black transition-colors hover:bg-[#d4ff33] disabled:opacity-50"
            disabled={loading || isTransitioning}
            onClick={handleStart}
          >
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
            {isTransitioning ? (status?.status === "starting" ? "STARTING…" : "STOPPING…") : "START"}
          </button>
        )}
      </div>
    </>
  );
}
