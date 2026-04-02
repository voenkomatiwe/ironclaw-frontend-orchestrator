import { Bot, Eye, EyeOff, Lock } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { authApi, configApi, formatApiError } from "../lib/api";
import { setAuthToken } from "../lib/auth-token";
import { wsClient } from "../lib/ws";

export default function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "setup">("login");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const switchMode = (next: "login" | "setup") => {
    setMode(next);
    setError("");
    setPassword("");
    setConfirm("");
  };

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (mode === "setup" && password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      if (mode === "setup") await authApi.setup(password);
      const res = await authApi.login(password);
      setAuthToken(res.token);
      sessionStorage.setItem("_wizpwd", password);
      wsClient.connect();
      try {
        const cfg = await configApi.get();
        navigate(cfg.setupComplete ? "dashboard" : "wizard");
      } catch {
        navigate("wizard");
      }
    } catch (err: unknown) {
      setError(await formatApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-black p-4">
      <div className="w-full max-w-[480px] border border-[#1A1A1A] bg-[#111111]">
        <div className="flex flex-col items-center gap-2 px-10 pt-10 pb-8">
          <div className="flex items-center gap-2.5">
            <Bot className="h-6 w-6 text-[#BFFF00]" />
            <span className="font-sans font-semibold text-[15px] text-white tracking-[3px]">POLYMARKET COPY BOT</span>
          </div>
          <p className="font-mono text-[#6e6e6e] text-xs">Automated copy trading on prediction markets</p>
        </div>

        <div className="flex border-[#1A1A1A] border-b">
          <button
            className={`flex-1 py-3.5 font-medium font-mono text-xs tracking-wider transition-colors ${
              mode === "login" ? "-mb-px border-[#BFFF00] border-b-2 text-[#BFFF00]" : "text-[#6e6e6e]"
            }`}
            onClick={() => switchMode("login")}
            type="button"
          >
            LOGIN
          </button>
          <button
            className={`flex-1 py-3.5 font-medium font-mono text-xs tracking-wider transition-colors ${
              mode === "setup" ? "-mb-px border-[#BFFF00] border-b-2 text-[#BFFF00]" : "text-[#6e6e6e]"
            }`}
            onClick={() => switchMode("setup")}
            type="button"
          >
            REGISTER
          </button>
        </div>

        <form className="space-y-5 px-10 py-8" onSubmit={handle}>
          <div className="space-y-1.5">
            <span className="font-medium font-mono text-[#6e6e6e] text-[10px] tracking-widest">PASSWORD</span>
            <div className="flex h-11 items-center gap-2 border border-[#1A1A1A] bg-black px-3.5">
              <input
                className="flex-1 bg-transparent font-mono text-[13px] text-white outline-none placeholder:text-[#404040]"
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                type={showPw ? "text" : "password"}
                value={password}
              />
              <button className="text-[#404040] hover:text-[#6e6e6e]" onClick={() => setShowPw(!showPw)} type="button">
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {mode === "setup" && (
            <div className="space-y-1.5">
              <span className="font-medium font-mono text-[#6e6e6e] text-[10px] tracking-widest">CONFIRM PASSWORD</span>
              <div className="flex h-11 items-center gap-2 border border-[#1A1A1A] bg-black px-3.5">
                <input
                  className="flex-1 bg-transparent font-mono text-[13px] text-white outline-none placeholder:text-[#404040]"
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Repeat your password"
                  type={showConfirm ? "text" : "password"}
                  value={confirm}
                />
                <button
                  className="text-[#404040] hover:text-[#6e6e6e]"
                  onClick={() => setShowConfirm(!showConfirm)}
                  type="button"
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          )}

          {error && <p className="font-mono text-[#FF4444] text-xs">{error}</p>}

          <button
            className="flex h-12 w-full items-center justify-center gap-2 bg-[#BFFF00] font-mono font-semibold text-[13px] text-black transition-colors hover:bg-[#d4ff33] disabled:opacity-60"
            disabled={loading}
            type="submit"
          >
            <Lock className="h-3.5 w-3.5" />
            {loading ? "PLEASE WAIT…" : mode === "setup" ? "CREATE PASSWORD" : "UNLOCK BOT"}
          </button>
        </form>

        <div className="flex justify-center border-[#1A1A1A] border-t px-10 py-4">
          <span className="font-mono text-[#404040] text-[11px]">Polygon Mainnet · Chain ID 137</span>
        </div>
      </div>
    </div>
  );
}
