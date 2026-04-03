import { SettingsKeysTab } from "./settings-keys-tab";

export function ChannelsSettingsTab() {
  return (
    <div>
      <p className="mb-4 text-muted-foreground text-sm">
        Channel transports (HTTP webhook, Signal, relay, etc.) are primarily configured on the gateway host. Any
        persisted keys prefixed with <code className="font-mono text-foreground">channels.</code> or{" "}
        <code className="font-mono text-foreground">signal.</code> appear in the table below.
      </p>
      <SettingsKeysTab prefixes={["channels.", "signal."]} />
    </div>
  );
}
