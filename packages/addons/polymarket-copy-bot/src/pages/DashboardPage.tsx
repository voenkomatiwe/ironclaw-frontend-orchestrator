import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Bot, Copy, Loader2, LogOut, X } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { useBotStatus } from "../hooks/useBotStatus";
import { useConfig } from "../hooks/useConfig";
import { authApi } from "../lib/api";
import { clearAuthToken } from "../lib/auth-token";
import { formatUptime } from "../lib/utils";
import { wsClient } from "../lib/ws";
import ConfigEditor from "./dashboard/ConfigEditor";
import StatsCards from "./dashboard/StatsCards";
import StatusBar from "./dashboard/StatusBar";
import TradesFeed from "./dashboard/TradesFeed";
import WalletPanel from "./dashboard/WalletPanel";

function ResetModal({
  onConfirm,
  onCancel,
  loading,
}: {
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-sm border border-[#1A1A1A] bg-[#111111]">
        <div className="flex items-start justify-between border-[#1A1A1A] border-b p-5 pb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-[#FF4444]" />
            <span className="font-sans font-semibold text-white">Reset & Start Over?</span>
          </div>
          <button className="text-[#6e6e6e] transition-colors hover:text-white" disabled={loading} onClick={onCancel}>
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-4 p-5">
          <p className="font-mono text-[#999999] text-[12px]">
            This will <span className="font-semibold text-[#FF4444]">permanently delete</span> all stored data:
          </p>
          <ul className="space-y-1 pl-3">
            {["Password", "Wallet & private key", "Bot configuration", "Target wallet settings"].map((item) => (
              <li className="flex items-center gap-2 font-mono text-[#6e6e6e] text-[11px]" key={item}>
                <span className="h-1 w-1 shrink-0 bg-[#404040]" />
                {item}
              </li>
            ))}
          </ul>
          <p className="font-mono text-[#6e6e6e] text-[11px]">The bot will be stopped. This cannot be undone.</p>
          <div className="flex gap-2 pt-1">
            <button
              className="h-10 flex-1 border border-[#1A1A1A] bg-black font-medium font-mono text-[#6e6e6e] text-[12px] transition-colors hover:border-[#404040]"
              disabled={loading}
              onClick={onCancel}
            >
              Cancel
            </button>
            <button
              className="flex h-10 flex-1 items-center justify-center gap-2 bg-[#FF4444] font-mono font-semibold text-[12px] text-white transition-colors hover:bg-red-600 disabled:opacity-60"
              disabled={loading}
              onClick={onConfirm}
            >
              {loading && <Loader2 className="h-3 w-3 animate-spin" />}
              {loading ? "Resetting…" : "Reset everything"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data: status } = useBotStatus();
  const { data: cfg } = useConfig();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showReset, setShowReset] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [addrCopied, setAddrCopied] = useState(false);

  const isRunning = status?.status === "running";

  const handleReset = async () => {
    setResetting(true);
    try {
      await authApi.wipe();
    } catch {
      /* ignore */
    }
    clearAuthToken();
    sessionStorage.removeItem("_wizpwd");
    wsClient.disconnect();
    queryClient.clear();
    navigate("auth", { replace: true });
  };

  const copyTarget = () => {
    if (!cfg?.targetWallet) return;
    navigator.clipboard.writeText(cfg.targetWallet);
    setAddrCopied(true);
    setTimeout(() => setAddrCopied(false), 2000);
  };

  return (
    <div className="flex min-h-screen flex-col bg-black">
      {showReset && <ResetModal loading={resetting} onCancel={() => setShowReset(false)} onConfirm={handleReset} />}

      {/* Header */}
      <header className="flex h-14 shrink-0 items-center gap-4 border-[#1A1A1A] border-b px-8">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Bot className="h-[18px] w-[18px] text-[#BFFF00]" />
          <span className="font-sans font-semibold text-[13px] text-white tracking-[3px]">COPY BOT</span>
        </div>

        <div className="h-5 w-px bg-[#1A1A1A]" />

        {/* Target address */}
        {cfg?.targetWallet && (
          <>
            <span className="font-medium font-mono text-[#6e6e6e] text-[10px] tracking-widest">TARGET</span>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[#BFFF00] text-[12px]">
                {cfg.targetWallet.slice(0, 6)}…{cfg.targetWallet.slice(-4)}
              </span>
              <button className="text-[#6e6e6e] transition-colors hover:text-white" onClick={copyTarget}>
                <Copy className="h-3 w-3" />
              </button>
              {addrCopied && <span className="font-mono text-[#BFFF00] text-[10px]">Copied!</span>}
            </div>
          </>
        )}

        <div className="flex-1" />

        {/* Status */}
        <div className={`h-1.5 w-1.5 shrink-0 ${isRunning ? "animate-pulse bg-[#BFFF00]" : "bg-[#404040]"}`} />
        <span className={`font-medium font-mono text-[11px] ${isRunning ? "text-[#BFFF00]" : "text-[#6e6e6e]"}`}>
          {status?.status?.toUpperCase() ?? "STOPPED"}
        </span>
        {isRunning && status?.startedAt && (
          <span className="font-mono text-[#6e6e6e] text-[11px]">{formatUptime(status.startedAt)}</span>
        )}

        <div className="h-5 w-px bg-[#1A1A1A]" />

        {/* Controls */}
        <StatusBar compact status={status} />

        <div className="h-5 w-px bg-[#1A1A1A]" />

        <button
          className="p-1 text-[#6e6e6e] transition-colors hover:text-[#FF4444]"
          onClick={() => setShowReset(true)}
          title="Reset & start over"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </header>

      {/* Stats */}
      <StatsCards stats={status?.stats} />

      {/* Main body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Trades feed (2/3) */}
        <div className="flex flex-1 overflow-hidden border-[#1A1A1A] border-r">
          <TradesFeed />
        </div>

        {/* Right sidebar (fixed width) */}
        <div className="flex w-80 shrink-0 flex-col gap-0 overflow-y-auto">
          <WalletPanel walletAddress={status?.walletAddress ?? cfg?.walletAddress ?? ""} />
          <ConfigEditor />
        </div>
      </div>
    </div>
  );
}
