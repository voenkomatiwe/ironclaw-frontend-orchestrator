import { ArrowRight, Copy, Eye, EyeOff, Key, Sparkles } from "lucide-react";
import { useState } from "react";
import { formatApiError, walletApi } from "../../lib/api";

interface Props {
  onNext: () => void;
}

export default function Step1Wallet({ onNext }: Props) {
  const [mode, setMode] = useState<"choose" | "generated" | "import">("choose");
  const [generated, setGenerated] = useState<{ address: string; privateKey: string; mnemonic: string | null } | null>(
    null
  );
  const [importKey, setImportKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const getPassword = () => sessionStorage.getItem("_wizpwd") ?? "";

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleGenerate = async () => {
    const pwd = getPassword();
    if (!pwd) {
      setError("Session expired — please log out and log in again.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await walletApi.generate(pwd);
      setGenerated(res);
      setMode("generated");
    } catch (err: unknown) {
      setError(await formatApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!importKey.trim()) {
      setError("Private key required.");
      return;
    }
    const pwd = getPassword();
    if (!pwd) {
      setError("Session expired — please log out and log in again.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await walletApi.import(importKey.trim(), pwd);
      onNext();
    } catch (err: unknown) {
      setError(await formatApiError(err));
    } finally {
      setLoading(false);
    }
  };

  if (mode === "generated" && generated) {
    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <h1 className="font-sans font-semibold text-[32px] text-white leading-tight">Wallet Setup</h1>
          <p className="max-w-lg font-mono text-[#6e6e6e] text-[13px]">
            Save your private key now — it will never be shown again.
          </p>
        </div>

        <div className="space-y-5 border border-[#1A1A1A] bg-[#111111] p-6">
          <h2 className="font-sans font-semibold text-[15px] text-white">Your New Wallet</h2>

          <div className="space-y-1.5">
            <label className="font-medium font-mono text-[#6e6e6e] text-[10px] tracking-widest">WALLET ADDRESS</label>
            <div className="flex h-10 items-center gap-2 border border-[#1A1A1A] bg-black px-3.5">
              <span className="flex-1 truncate font-mono text-[#BFFF00] text-[11px]">{generated.address}</span>
              <button
                className="shrink-0 text-[#6e6e6e] hover:text-white"
                onClick={() => copyText(generated.address, "addr")}
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
            </div>
            {copied === "addr" && <p className="font-mono text-[#BFFF00] text-[10px]">Copied!</p>}
          </div>

          <div className="space-y-1.5">
            <label className="font-medium font-mono text-[#FF4444] text-[10px] tracking-widest">
              PRIVATE KEY — SAVE THIS NOW
            </label>
            <div className="flex h-10 items-center gap-2 border border-[#FF4444] bg-black px-3.5">
              <span className="flex-1 truncate font-mono text-[#999999] text-[11px]">
                {showKey ? generated.privateKey : "0x" + "•".repeat(62)}
              </span>
              <button className="shrink-0 text-[#6e6e6e] hover:text-white" onClick={() => setShowKey(!showKey)}>
                {showKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
              <button
                className="shrink-0 text-[#6e6e6e] hover:text-white"
                onClick={() => copyText(generated.privateKey, "pk")}
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
            </div>
            {copied === "pk" && <p className="font-mono text-[#BFFF00] text-[10px]">Copied!</p>}
          </div>

          {generated.mnemonic && (
            <div className="space-y-1.5">
              <label className="font-medium font-mono text-[#6e6e6e] text-[10px] tracking-widest">
                RECOVERY PHRASE
              </label>
              <div className="border border-[#1A1A1A] bg-black p-3 font-mono text-[#999999] text-[11px] leading-relaxed">
                {generated.mnemonic}
              </div>
            </div>
          )}
        </div>

        <button
          className="flex h-12 items-center gap-2 bg-[#BFFF00] px-8 font-mono font-semibold text-[13px] text-black transition-colors hover:bg-[#d4ff33]"
          onClick={onNext}
        >
          I SAVED MY KEY — CONTINUE
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  if (mode === "import") {
    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <h1 className="font-sans font-semibold text-[32px] text-white">Wallet Setup</h1>
          <p className="max-w-lg font-mono text-[#6e6e6e] text-[13px]">
            Paste your private key (0x + 64 hex chars). It will be encrypted with AES-256-GCM.
          </p>
        </div>

        <div className="space-y-5 border border-[#1A1A1A] bg-[#111111] p-6">
          <div className="space-y-1.5">
            <label className="font-medium font-mono text-[#6e6e6e] text-[10px] tracking-widest">PRIVATE KEY</label>
            <div className="flex h-11 items-center border border-[#1A1A1A] bg-black px-3.5">
              <input
                className="flex-1 bg-transparent font-mono text-[13px] text-white outline-none placeholder:text-[#404040]"
                onChange={(e) => setImportKey(e.target.value)}
                placeholder="0x..."
                type="password"
                value={importKey}
              />
            </div>
          </div>
          {error && <p className="font-mono text-[#FF4444] text-xs">{error}</p>}
        </div>

        <div className="flex gap-3">
          <button
            className="flex h-12 items-center justify-center border border-[#1A1A1A] bg-black px-8 font-medium font-mono text-[#6e6e6e] text-[13px] transition-colors hover:border-[#404040]"
            onClick={() => setMode("choose")}
          >
            BACK
          </button>
          <button
            className="flex h-12 items-center gap-2 bg-[#BFFF00] px-8 font-mono font-semibold text-[13px] text-black transition-colors hover:bg-[#d4ff33] disabled:opacity-60"
            disabled={loading}
            onClick={handleImport}
          >
            {loading ? "IMPORTING…" : "IMPORT WALLET"}
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="font-sans font-semibold text-[32px] text-white">Wallet Setup</h1>
        <p className="max-w-lg font-mono text-[#6e6e6e] text-[13px]">
          Create a new wallet or import an existing private key. Your key is encrypted locally.
        </p>
      </div>

      {error && <p className="font-mono text-[#FF4444] text-xs">{error}</p>}

      <div className="grid grid-cols-2 gap-4">
        <button
          className="space-y-3 border-2 border-[#BFFF00] bg-[#111111] p-6 text-left transition-colors hover:bg-[#1a1a0a] disabled:opacity-60"
          disabled={loading}
          onClick={handleGenerate}
        >
          <Sparkles className="h-6 w-6 text-[#BFFF00]" />
          <div>
            <p className="font-sans font-semibold text-[16px] text-white">
              {loading ? "Generating…" : "Generate New Wallet"}
            </p>
            <p className="mt-1 font-mono text-[#999999] text-[12px] leading-relaxed">
              Create a fresh Ethereum wallet. You'll receive a private key and recovery phrase.
            </p>
          </div>
          <span className="inline-flex items-center bg-[#BFFF00] px-2.5 py-1 font-bold font-mono text-[9px] text-black tracking-wider">
            RECOMMENDED
          </span>
        </button>

        <button
          className="space-y-3 border border-[#1A1A1A] bg-[#111111] p-6 text-left transition-colors hover:border-[#404040]"
          onClick={() => setMode("import")}
        >
          <Key className="h-6 w-6 text-[#6e6e6e]" />
          <div>
            <p className="font-sans font-semibold text-[16px] text-white">Import Existing Wallet</p>
            <p className="mt-1 font-mono text-[#999999] text-[12px] leading-relaxed">
              Paste your private key (0x + 64 hex chars). It will be encrypted with AES-256-GCM.
            </p>
          </div>
        </button>
      </div>
    </div>
  );
}
