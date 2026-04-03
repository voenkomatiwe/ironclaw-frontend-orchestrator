import { Loader } from "lucide-react";
import { useState } from "react";
import { useDeleteSettingKey, useGeneralSettings, useUpdateSetting } from "../queries";
import { InferenceRow, InferenceSection, inferenceControlClass, inferenceSelectClass } from "./inference-settings-ui";
import { SettingsKeysTab } from "./settings-keys-tab";

const TUNNEL_PROVIDERS = ["none", "cloudflare", "ngrok", "tailscale", "custom"] as const;

const STRUCTURED_KEYS = [
  "tunnel.provider",
  "tunnel.public_url",
  "gateway.rate_limit",
  "gateway.max_connections",
] as const;

export function NetworkingSettingsTab() {
  const { data: settings, isLoading } = useGeneralSettings();
  const updateSetting = useUpdateSetting();
  const deleteKey = useDeleteSettingKey();
  const [restartHint, setRestartHint] = useState(false);

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
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <Loader className="animate-spin" size={16} />
        Loading networking settings…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">
        Public tunnel and gateway limits. Values left empty use the gateway environment defaults.
      </p>

      {restartHint ? (
        <div
          className="rounded-lg border border-warning/30 bg-warning-muted/80 px-3 py-2 text-warning text-xs"
          role="status"
        >
          Networking changes may require restarting the gateway process to take effect.
        </div>
      ) : null}

      <InferenceSection title="Tunnel">
        <InferenceRow description="Public URL tunnel provider" label="Provider">
          <select
            className={inferenceSelectClass}
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
        </InferenceRow>
        <InferenceRow description="Static public URL (if not using tunnel provider)" label="Public URL">
          <input
            className={inferenceControlClass}
            defaultValue={tunnelPublicUrl}
            key={`tunnel-url-${tunnelPublicUrl}`}
            onBlur={(e) => void handleTunnelPublicUrlBlur(e.target.value)}
            placeholder="env default"
          />
        </InferenceRow>
      </InferenceSection>

      <InferenceSection title="Gateway">
        <InferenceRow description="Max chat messages per minute" label="Rate limit">
          <input
            className={inferenceControlClass}
            defaultValue={rateLimit}
            inputMode="numeric"
            key={`rate-${rateLimit}`}
            onBlur={(e) => void handleRateLimitBlur(e.target.value)}
            placeholder="env default"
            type="text"
          />
        </InferenceRow>
        <InferenceRow description="Max simultaneous SSE/WS connections" label="Max connections">
          <input
            className={inferenceControlClass}
            defaultValue={maxConnections}
            inputMode="numeric"
            key={`max-conn-${maxConnections}`}
            onBlur={(e) => void handleMaxConnectionsBlur(e.target.value)}
            placeholder="env default"
            type="text"
          />
        </InferenceRow>
      </InferenceSection>

      <section className="border-border border-t pt-6">
        <h2 className="mb-2 font-medium text-foreground text-sm">Other tunnel and gateway keys</h2>
        <SettingsKeysTab
          description="Additional keys from the settings store matching tunnel.* or gateway.*"
          hideKeys={STRUCTURED_KEYS}
          prefixes={["tunnel.", "gateway."]}
        />
      </section>
    </div>
  );
}
