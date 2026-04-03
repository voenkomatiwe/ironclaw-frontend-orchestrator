import { Loader } from "lucide-react";
import { useState } from "react";
import { useExtensions, useInstallExtension } from "../queries";
import { SettingsKeysTab } from "./settings-keys-tab";

export function McpTab() {
  const { data: installed = [], isLoading } = useExtensions();
  const install = useInstallExtension();
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");

  const mcp = installed.filter((e) => e.kind === "mcp_server");

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-2 font-medium text-foreground text-sm">Installed MCP servers</h3>
        {isLoading ? (
          <Loader className="animate-spin text-muted-foreground" size={16} />
        ) : mcp.length === 0 ? (
          <p className="text-muted-foreground text-xs">No MCP extensions installed.</p>
        ) : (
          <ul className="space-y-1">
            {mcp.map((e) => (
              <li className="font-mono text-foreground text-xs" key={e.name}>
                {e.display_name} ({e.name}) — {e.active ? "active" : "inactive"}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-xl border border-border bg-surface-high p-4">
        <h3 className="mb-2 font-medium text-foreground text-sm">Add MCP server</h3>
        <p className="mb-3 text-muted-foreground text-xs">
          Install an MCP server extension by name and optional bundle URL (gateway{" "}
          <code className="font-mono">POST /api/extensions/install</code>).
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            className="flex-1 rounded-lg border border-border bg-surface-low px-3 py-2 font-mono text-xs"
            onChange={(e) => setName(e.target.value)}
            placeholder="Server name"
            value={name}
          />
          <input
            className="flex-1 rounded-lg border border-border bg-surface-low px-3 py-2 font-mono text-xs"
            onChange={(e) => setUrl(e.target.value)}
            placeholder="URL to bundle (optional)"
            value={url}
          />
          <button
            className="rounded-lg bg-primary px-4 py-2 text-on-primary-fixed text-xs disabled:opacity-50"
            disabled={!name.trim() || install.isPending}
            onClick={() =>
              install.mutate(
                { name: name.trim(), url: url.trim() || undefined, kind: "mcp_server" },
                {
                  onSuccess: () => {
                    setName("");
                    setUrl("");
                  },
                }
              )
            }
            type="button"
          >
            {install.isPending ? "…" : "Add"}
          </button>
        </div>
      </div>

      <div>
        <h3 className="mb-2 font-medium text-foreground text-sm">MCP-related settings</h3>
        <SettingsKeysTab prefixes={["mcp."]} />
      </div>
    </div>
  );
}
