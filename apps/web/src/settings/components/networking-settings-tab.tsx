import { ChevronDown, ChevronRight, Loader } from "lucide-react";
import { useState } from "react";
import { useDeleteSettingKey, useGeneralSettings, useUpdateSetting } from "../queries";
import { SettingsKeysTab } from "./settings-keys-tab";

/* ── helpers ─────────────────────────────────────────────── */

const TUNNEL_PROVIDERS = ["none", "cloudflare", "ngrok", "tailscale", "custom"] as const;

const STRUCTURED_KEYS = [
  "tunnel.provider",
  "tunnel.public_url",
  "gateway.rate_limit",
  "gateway.max_connections",
] as const;

const inputClass =
  "w-full rounded-xl border border-border bg-surface-high px-3 py-2 text-[13px] text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";

const selectClass =
  "w-full rounded-xl border border-border bg-surface-high px-3 py-2 text-[13px] text-foreground focus:border-primary focus:outline-none";

function FormRow({ children, label }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="min-w-20 shrink-0 text-[13px] text-muted-foreground">{label}</span>
      <div className="max-w-[280px] flex-1">{children}</div>
    </div>
  );
}

/* ── NetworkingSettingsTab ────────────────────────────────── */

export function NetworkingSettingsTab() {
  const { data: settings, isLoading } = useGeneralSettings();
  const updateSetting = useUpdateSetting();
  const deleteKey = useDeleteSettingKey();
  const [restartHint, setRestartHint] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const tunnelProvider = settings?.["tunnel.provider"]?.trim() ?? "";
  const tunnelPublicUrl = settings?.["tunnel.public_url"]?.trim() ?? "";
  const rateLimit = settings?.["gateway.rate_limit"]?.trim() ?? "";
  const maxConnections = settings?.["gateway.max_connections"]?.trim() ?? "";

  function markRestart() {
    setRestartHint(true);
  }

  async function handleTunnelProvider(value: string) {
    if (!value) await deleteKey.mutateAsync("tunnel.provider");
    else await updateSetting.mutateAsync({ key: "tunnel.provider", value });
    markRestart();
  }

  async function handleTunnelPublicUrlBlur(raw: string) {
    const v = raw.trim();
    if (!v) await deleteKey.mutateAsync("tunnel.public_url");
    else await updateSetting.mutateAsync({ key: "tunnel.public_url", value: v });
    markRestart();
  }

  async function handleRateLimitBlur(raw: string) {
    const v = raw.trim();
    if (!v) await deleteKey.mutateAsync("gateway.rate_limit");
    else {
      const n = Number.parseInt(v, 10);
      if (Number.isNaN(n) || n < 0) return;
      await updateSetting.mutateAsync({ key: "gateway.rate_limit", value: String(n) });
    }
    markRestart();
  }

  async function handleMaxConnectionsBlur(raw: string) {
    const v = raw.trim();
    if (!v) await deleteKey.mutateAsync("gateway.max_connections");
    else {
      const n = Number.parseInt(v, 10);
      if (Number.isNaN(n) || n < 0) return;
      await updateSetting.mutateAsync({ key: "gateway.max_connections", value: String(n) });
    }
    markRestart();
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-8 text-muted-foreground text-sm">
        <Loader className="animate-spin" size={16} />
        Loading…
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Tunnel card */}
      <div className="rounded-2xl bg-white p-5 shadow-xs">
        <h3 className="font-semibold text-[15px] text-foreground">Tunnel</h3>
        <p className="mb-4 text-[12px] text-muted-foreground">Expose your gateway to the internet</p>

        <div className="flex flex-col gap-3">
          <FormRow label="Provider">
            <select
              className={selectClass}
              onChange={(e) => void handleTunnelProvider(e.target.value)}
              value={tunnelProvider}
            >
              <option value="">— use env default —</option>
              {TUNNEL_PROVIDERS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </FormRow>
          <FormRow label="Public URL">
            <input
              className={inputClass}
              defaultValue={tunnelPublicUrl}
              key={`tunnel-url-${tunnelPublicUrl}`}
              onBlur={(e) => void handleTunnelPublicUrlBlur(e.target.value)}
              placeholder="env default"
            />
          </FormRow>
        </div>
      </div>

      {/* Gateway card */}
      <div className="rounded-2xl bg-white p-5 shadow-xs">
        <h3 className="font-semibold text-[15px] text-foreground">Gateway Limits</h3>
        <p className="mb-4 text-[12px] text-muted-foreground">Rate limiting and connection caps</p>

        <div className="flex flex-col gap-3">
          <FormRow label="Rate limit">
            <input
              className={inputClass}
              defaultValue={rateLimit}
              inputMode="numeric"
              key={`rate-${rateLimit}`}
              onBlur={(e) => void handleRateLimitBlur(e.target.value)}
              placeholder="env default"
              type="text"
            />
          </FormRow>
          <FormRow label="Max connections">
            <input
              className={inputClass}
              defaultValue={maxConnections}
              inputMode="numeric"
              key={`max-conn-${maxConnections}`}
              onBlur={(e) => void handleMaxConnectionsBlur(e.target.value)}
              placeholder="env default"
              type="text"
            />
          </FormRow>
        </div>
      </div>

      {restartHint && (
        <div className="rounded-xl bg-warning/5 px-3 py-2 text-[11px] text-warning">
          ⚠ Changes may require a gateway restart
        </div>
      )}

      {/* Advanced (collapsible) */}
      <div className="rounded-2xl bg-white shadow-xs">
        <button
          className="flex w-full items-center justify-between p-4 text-left"
          onClick={() => setAdvancedOpen((v) => !v)}
          type="button"
        >
          <div>
            <h3 className="font-semibold text-[13px] text-foreground">Advanced settings</h3>
            <p className="mt-0.5 text-[11px] text-muted-foreground">Other tunnel.* and gateway.* keys</p>
          </div>
          {advancedOpen ? (
            <ChevronDown className="text-muted-foreground" size={16} />
          ) : (
            <ChevronRight className="text-muted-foreground" size={16} />
          )}
        </button>
        {advancedOpen && (
          <div className="border-border border-t px-4 pt-3 pb-4">
            <SettingsKeysTab hideKeys={STRUCTURED_KEYS} prefixes={["tunnel.", "gateway."]} />
          </div>
        )}
      </div>
    </div>
  );
}
