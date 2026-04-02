import { useState } from "react";
import { useNavigate } from "react-router";
import { useAppStore } from "@/store/app";

export default function AuthPage() {
  const navigate = useNavigate();
  const setSession = useAppStore((s) => s.setSession);
  const existingToken = useAppStore((s) => s.token);
  const existingUrl = useAppStore((s) => s.apiUrl);

  const [apiUrl, setApiUrl] = useState(existingUrl || "");
  const [token, setToken] = useState(() => existingToken || "");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const t = token.trim();
    const u = apiUrl.trim();
    if (!t) {
      setError("Token is required.");
      return;
    }
    if (!u) {
      setError("API URL is required.");
      return;
    }
    setSession({ token: t, apiUrl: u });
    void navigate("/dashboard", { replace: true });
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4 py-10">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-sm">
        <h1 className="font-semibold text-foreground text-lg">Sign in</h1>
        <p className="mt-1 text-muted-foreground text-sm">Enter the orchestrator API base URL and your bearer token.</p>

        <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1.5">
            <label className="font-medium text-foreground text-sm" htmlFor="auth-api-url">
              API URL
            </label>
            <input
              autoComplete="url"
              className="rounded-lg border border-border bg-input px-3 py-2 text-foreground text-sm outline-none ring-ring focus:border-primary focus:ring-1 focus:ring-primary"
              id="auth-api-url"
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder="http://localhost:3000"
              type="url"
              value={apiUrl}
            />
            <span className="text-muted-foreground text-xs">Origin only</span>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-medium text-foreground text-sm" htmlFor="auth-token">
              Token
            </label>
            <input
              autoComplete="off"
              className="rounded-lg border border-border bg-input px-3 py-2 font-mono text-foreground text-sm outline-none ring-ring focus:border-primary focus:ring-1 focus:ring-primary"
              id="auth-token"
              onChange={(e) => setToken(e.target.value)}
              placeholder="Bearer token"
              type="password"
              value={token}
            />
          </div>

          {error ? <p className="text-destructive text-sm">{error}</p> : null}

          <button
            className="rounded-lg bg-primary px-4 py-2.5 font-medium text-on-primary-fixed text-sm transition-colors hover:bg-primary/90"
            type="submit"
          >
            Continue
          </button>
        </form>
      </div>
    </div>
  );
}
