import { Loader, Wrench } from "lucide-react";
import { useState } from "react";
import { cn } from "@/common/lib/utils";
import {
  useActivateExtension,
  useExtensions,
  useExtensionsRegistry,
  useInstallExtension,
  useRemoveExtension,
} from "../queries";
import { ExtensionSetupDialog } from "./extension-setup-dialog";
import { PairingPanel } from "./pairing-panel";

const kindLabel: Record<string, string> = {
  wasm_tool: "Tool",
  wasm_channel: "Channel",
  mcp_server: "MCP",
  channel_relay: "Relay",
};

export function ExtensionsTab() {
  const { data: installed = [], isLoading: loadingInstalled } = useExtensions();
  const { data: registry = [], isLoading: loadingRegistry } = useExtensionsRegistry();
  const installMutation = useInstallExtension();
  const activateMutation = useActivateExtension();
  const removeMutation = useRemoveExtension();

  const [pendingName, setPendingName] = useState<string | null>(null);
  const [setupFor, setSetupFor] = useState<string | null>(null);
  const [wasmName, setWasmName] = useState("");
  const [wasmUrl, setWasmUrl] = useState("");

  const installedByName = Object.fromEntries(installed.map((e) => [e.name, e]));

  async function handleInstall(name: string) {
    setPendingName(name);
    try {
      await installMutation.mutateAsync({ name });
    } finally {
      setPendingName(null);
    }
  }

  async function handleInstallFromUrl() {
    if (!wasmName.trim()) return;
    setPendingName(wasmName.trim());
    try {
      await installMutation.mutateAsync({
        name: wasmName.trim(),
        url: wasmUrl.trim() || undefined,
        kind: "wasm_channel",
      });
      setWasmName("");
      setWasmUrl("");
    } finally {
      setPendingName(null);
    }
  }

  async function handleToggleActive(name: string, active: boolean) {
    setPendingName(name);
    try {
      if (active) {
        await removeMutation.mutateAsync(name);
      } else {
        await activateMutation.mutateAsync(name);
      }
    } finally {
      setPendingName(null);
    }
  }

  const isLoading = loadingInstalled || loadingRegistry;

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <Loader className="animate-spin" size={16} />
        Loading extensions...
      </div>
    );
  }

  const rows = registry.map((reg) => {
    const inst = installedByName[reg.name];
    return {
      name: reg.name,
      displayName: reg.display_name,
      kind: reg.kind,
      description: reg.description,
      version: inst?.version ?? reg.version,
      active: inst?.active ?? false,
      isInstalled: reg.installed || Boolean(inst),
      needsSetup: inst?.needs_setup ?? false,
    };
  });

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-surface-high p-4">
        <h3 className="mb-2 font-medium text-foreground text-sm">Install extension from URL</h3>
        <p className="mb-3 text-muted-foreground text-xs">
          WASM channel/tool bundle (.tar.gz). Maps to gateway install with optional URL.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            className="flex-1 rounded-lg border border-border bg-surface-low px-3 py-2 font-mono text-xs"
            onChange={(e) => setWasmName(e.target.value)}
            placeholder="Extension name"
            value={wasmName}
          />
          <input
            className="flex-1 rounded-lg border border-border bg-surface-low px-3 py-2 font-mono text-xs"
            onChange={(e) => setWasmUrl(e.target.value)}
            placeholder="URL to .tar.gz"
            value={wasmUrl}
          />
          <button
            className="rounded-lg bg-primary px-4 py-2 text-on-primary-fixed text-xs disabled:opacity-50"
            disabled={!wasmName.trim() || installMutation.isPending}
            onClick={() => void handleInstallFromUrl()}
            type="button"
          >
            Install
          </button>
        </div>
      </div>

      <PairingPanel />

      {rows.length === 0 ? (
        <p className="text-muted-foreground text-sm">No extensions found.</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-border border-b bg-surface-high">
                <th className="px-4 py-3 text-left font-medium text-foreground text-xs">Name</th>
                <th className="px-4 py-3 text-left font-medium text-foreground text-xs">Type</th>
                <th className="px-4 py-3 text-left font-medium text-foreground text-xs">Description</th>
                <th className="px-4 py-3 text-left font-medium text-foreground text-xs">Status</th>
                <th className="px-4 py-3 text-right font-medium text-foreground text-xs">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr className="border-border border-b hover:bg-surface-highest" key={row.name}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground text-sm">{row.displayName}</p>
                    {row.version ? <p className="font-mono text-muted-foreground text-xs">v{row.version}</p> : null}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-md border border-border bg-surface-highest px-1.5 py-0.5 text-muted-foreground text-xs">
                      {kindLabel[row.kind] ?? row.kind}
                    </span>
                  </td>
                  <td className="max-w-xs px-4 py-3 text-muted-foreground text-sm">
                    <span className="line-clamp-1">{row.description ?? "—"}</span>
                  </td>
                  <td className="px-4 py-3">
                    {row.isInstalled ? (
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 font-medium text-xs",
                          row.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                        )}
                      >
                        {row.needsSetup ? "Needs setup" : row.active ? "Active" : "Inactive"}
                      </span>
                    ) : (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-400 text-xs">Not installed</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      {pendingName === row.name ? (
                        <Loader className="animate-spin text-muted-foreground" size={14} />
                      ) : null}
                      {row.isInstalled && row.needsSetup ? (
                        <button
                          className="flex items-center gap-1 rounded-lg border border-amber-200 px-2 py-1 text-amber-800 text-xs"
                          onClick={() => setSetupFor(row.name)}
                          type="button"
                        >
                          <Wrench size={12} />
                          Setup
                        </button>
                      ) : null}
                      {row.isInstalled ? (
                        <button
                          className="rounded-lg border border-border px-3 py-1 text-muted-foreground text-xs transition-colors hover:border-primary hover:text-primary"
                          disabled={pendingName === row.name}
                          onClick={() => handleToggleActive(row.name, row.active)}
                          type="button"
                        >
                          {row.active ? "Deactivate" : "Activate"}
                        </button>
                      ) : (
                        <button
                          className="rounded-lg bg-primary px-3 py-1 text-on-primary-fixed text-xs transition-colors hover:bg-primary/90"
                          disabled={pendingName === row.name}
                          onClick={() => handleInstall(row.name)}
                          type="button"
                        >
                          Install
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ExtensionSetupDialog extensionName={setupFor} onClose={() => setSetupFor(null)} />
    </div>
  );
}
