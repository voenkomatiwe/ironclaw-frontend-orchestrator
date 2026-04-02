import { Copy, Eye, EyeOff, RefreshCw } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
import { useBalance } from "../../hooks/useBalance";
import { formatApiError, walletApi } from "../../lib/api";
import { truncateAddress } from "../../lib/utils";

interface Props {
  walletAddress: string;
}

export default function WalletPanel({ walletAddress }: Props) {
  const { data: balance, refetch } = useBalance(!!walletAddress);
  const [showExport, setShowExport] = useState(false);
  const [exportPwd, setExportPwd] = useState("");
  const [exportedKey, setExportedKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const [exportErr, setExportErr] = useState("");

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = async () => {
    setExportErr("");
    try {
      const res = await walletApi.export(exportPwd);
      setExportedKey(res.privateKey);
      setExportPwd("");
    } catch (err: unknown) {
      setExportErr(await formatApiError(err));
    }
  };

  return (
    <div className="space-y-4 border-[#1A1A1A] border-b p-5">
      <p className="font-sans font-semibold text-[14px] text-white">Wallet</p>

      {walletAddress && (
        <div className="flex items-center gap-4">
          {/* QR */}
          <div className="shrink-0 bg-[#1A1A1A] p-2">
            <QRCodeSVG bgColor="#1A1A1A" fgColor="#BFFF00" size={64} value={walletAddress} />
          </div>
          {/* Address */}
          <div className="min-w-0 space-y-1">
            <p className="font-medium font-mono text-[#6e6e6e] text-[9px] tracking-widest">BOT ADDRESS</p>
            <div className="flex items-center gap-1.5">
              <span className="truncate font-mono text-[#BFFF00] text-[11px]">
                {truncateAddress(walletAddress, 10)}
              </span>
              <button className="shrink-0 text-[#6e6e6e] hover:text-white" onClick={() => copy(walletAddress)}>
                <Copy className="h-3 w-3" />
              </button>
            </div>
            {copied && <p className="font-mono text-[#BFFF00] text-[10px]">Copied!</p>}
          </div>
        </div>
      )}

      {/* Balances */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1 border border-[#1A1A1A] bg-black p-3">
          <p className="font-medium font-mono text-[#6e6e6e] text-[9px] tracking-widest">MATIC</p>
          <p className="font-sans font-semibold text-[18px] text-white">{balance?.maticBalance ?? "—"}</p>
        </div>
        <div className="space-y-1 border border-[#1A1A1A] bg-black p-3">
          <p className="font-medium font-mono text-[#6e6e6e] text-[9px] tracking-widest">USDC.e</p>
          <p className="font-sans font-semibold text-[#BFFF00] text-[18px]">{balance?.usdcBalance ?? "—"}</p>
        </div>
      </div>

      <button
        className="flex h-9 w-full items-center justify-center gap-1.5 border border-[#1A1A1A] bg-black font-medium font-mono text-[#6e6e6e] text-[11px] transition-colors hover:border-[#404040]"
        onClick={() => refetch()}
      >
        <RefreshCw className="h-3 w-3" />
        REFRESH
      </button>

      {/* Export */}
      {!showExport && !exportedKey && (
        <button
          className="w-full py-1 text-center font-mono text-[#404040] text-[11px] transition-colors hover:text-[#6e6e6e]"
          onClick={() => setShowExport(true)}
        >
          Export private key
        </button>
      )}

      {showExport && !exportedKey && (
        <div className="space-y-2">
          <input
            className="h-9 w-full border border-[#1A1A1A] bg-black px-3 font-mono text-[12px] text-white outline-none transition-colors placeholder:text-[#404040] focus:border-[#BFFF00]"
            onChange={(e) => setExportPwd(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleExport()}
            placeholder="Enter password to export"
            type="password"
            value={exportPwd}
          />
          {exportErr && <p className="font-mono text-[#FF4444] text-[11px]">{exportErr}</p>}
          <div className="flex gap-2">
            <button
              className="h-9 flex-1 border border-[#1A1A1A] bg-black font-mono text-[#6e6e6e] text-[11px] transition-colors hover:border-[#404040]"
              onClick={() => setShowExport(false)}
            >
              Cancel
            </button>
            <button
              className="h-9 flex-1 bg-[#BFFF00] font-mono font-semibold text-[11px] text-black transition-colors hover:bg-[#d4ff33]"
              onClick={handleExport}
            >
              Reveal
            </button>
          </div>
        </div>
      )}

      {exportedKey && (
        <div className="space-y-2">
          <div className="border border-[#F59E0B]/30 bg-black p-2.5 font-mono text-[#F59E0B] text-[11px]">
            ⚠ Never share your private key.
          </div>
          <div className="flex gap-1.5">
            <div className="flex h-9 flex-1 items-center overflow-hidden border border-[#1A1A1A] bg-black px-2.5">
              <span className="truncate font-mono text-[#999999] text-[10px]">
                {showKey ? exportedKey : "•".repeat(32)}
              </span>
            </div>
            <button
              className="flex h-9 w-9 items-center justify-center border border-[#1A1A1A] bg-black text-[#6e6e6e] hover:text-white"
              onClick={() => setShowKey(!showKey)}
            >
              {showKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>
            <button
              className="flex h-9 w-9 items-center justify-center border border-[#1A1A1A] bg-black text-[#6e6e6e] hover:text-white"
              onClick={() => copy(exportedKey)}
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
          </div>
          <button
            className="w-full py-1 text-center font-mono text-[#404040] text-[11px] transition-colors hover:text-[#6e6e6e]"
            onClick={() => setExportedKey("")}
          >
            Hide
          </button>
        </div>
      )}
    </div>
  );
}
