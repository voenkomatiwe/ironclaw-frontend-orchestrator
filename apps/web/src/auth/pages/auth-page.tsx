import { useState } from "react";
import { useNavigate } from "react-router";
import { NearSignInButton } from "@/auth/components/near-sign-in-button";
import { Button, Input } from "@/common/components/ui";
import { useAppStore } from "@/store/app";

export default function AuthPage() {
  const navigate = useNavigate();
  const setSession = useAppStore((s) => s.setSession);
  const existingToken = useAppStore((s) => s.token);
  const existingUrl = useAppStore((s) => s.apiUrl);

  const [apiUrl, setApiUrl] = useState(existingUrl || "");
  const [token, setToken] = useState(() => existingToken || "");
  const [error, setError] = useState("");
  const [connecting, setConnecting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
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
    setConnecting(true);
    try {
      await setSession({ token: t, apiUrl: u });
      void navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed");
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4 py-10">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-sm">
        <h1 className="font-display font-semibold text-foreground text-lg">Sign in</h1>
        <p className="mt-1 text-muted-foreground text-sm">Connect your NEAR wallet to get started.</p>

        <div className="mt-6">
          <NearSignInButton
            onSuccess={async ({ token, apiUrl: gatewayUrl, accountId }) => {
              try {
                await setSession({ token, apiUrl: gatewayUrl, accountId });
                void navigate("/dashboard", { replace: true });
              } catch (err) {
                setError(err instanceof Error ? err.message : "Connection failed");
              }
            }}
          />
        </div>

        <div className="relative mt-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-muted-foreground text-xs">or enter credentials manually</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <form className="mt-4 flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1.5">
            <label className="font-medium text-foreground text-sm" htmlFor="auth-api-url">
              API URL
            </label>
            <Input
              autoComplete="url"
              className="bg-input"
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
            <Input
              autoComplete="off"
              className="font-mono"
              id="auth-token"
              onChange={(e) => setToken(e.target.value)}
              placeholder="Bearer token"
              type="password"
              value={token}
            />
          </div>

          {error ? <p className="text-destructive text-sm">{error}</p> : null}

          <Button disabled={connecting} size="lg" type="submit">
            {connecting ? "Connecting…" : "Continue"}
          </Button>
        </form>
      </div>
    </div>
  );
}
