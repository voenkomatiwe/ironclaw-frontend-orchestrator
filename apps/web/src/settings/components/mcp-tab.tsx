import { ChevronDown, ChevronRight, Loader, Server } from "lucide-react";
import { useState } from "react";
import { cn } from "@/common/lib/utils";
import { useExtensions, useInstallExtension } from "@/extensions/queries";
import { SettingsKeysTab } from "./settings-keys-tab";

export function McpTab() {
  const { data: installed = [], isLoading } = useExtensions();
  const install = useInstallExtension();
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const mcp = installed.filter((e) => e.kind === "mcp_server");

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
      {/* Installed servers card */}
      <div className="rounded-2xl bg-white p-5 shadow-xs">
        <h3 className="font-semibold text-[15px] text-foreground">MCP Servers</h3>
        <p className="mb-4 text-[12px] text-muted-foreground">Model Context Protocol server extensions</p>

        {mcp.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <Server className="text-muted-foreground/30" size={36} />
            <p className="text-[13px] text-muted-foreground">No MCP servers installed</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {mcp.map((e) => (
              <div className="flex items-center justify-between rounded-xl bg-surface-high px-3 py-2.5" key={e.name}>
                <div>
                  <p className="font-medium text-[13px] text-foreground">{e.display_name || e.name}</p>
                  <p className="text-[11px] text-muted-foreground">{e.name}</p>
                </div>
                <span
                  className={cn(
                    "rounded-md px-2 py-0.5 text-[10px] font-medium",
                    e.active ? "bg-success/10 text-success" : "bg-muted text-muted-foreground",
                  )}
                >
                  {e.active ? "Active" : "Inactive"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add server card */}
      <div className="rounded-2xl bg-white p-5 shadow-xs">
        <h3 className="font-semibold text-[15px] text-foreground">Add MCP Server</h3>
        <p className="mb-4 text-[12px] text-muted-foreground">Install by name and optional bundle URL</p>

        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            className="flex-1 rounded-xl border border-border bg-surface-high px-3 py-2 text-[13px] text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            onChange={(e) => setName(e.target.value)}
            placeholder="Server name"
            value={name}
          />
          <input
            className="flex-1 rounded-xl border border-border bg-surface-high px-3 py-2 text-[13px] text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            onChange={(e) => setUrl(e.target.value)}
            placeholder="URL (optional)"
            value={url}
          />
          <button
            className="shrink-0 rounded-xl bg-primary px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
            disabled={!name.trim() || install.isPending}
            onClick={() =>
              install.mutate(
                { name: name.trim(), url: url.trim() || undefined, kind: "mcp_server" },
                {
                  onSuccess: () => {
                    setName("");
                    setUrl("");
                  },
                },
              )
            }
            type="button"
          >
            {install.isPending ? <Loader className="animate-spin" size={14} /> : "Add"}
          </button>
        </div>
      </div>

      {/* Advanced (collapsible) */}
      <div className="rounded-2xl bg-white shadow-xs">
        <button
          className="flex w-full items-center justify-between p-4 text-left"
          onClick={() => setAdvancedOpen((v) => !v)}
          type="button"
        >
          <div>
            <h3 className="font-semibold text-[13px] text-foreground">Advanced settings</h3>
            <p className="mt-0.5 text-[11px] text-muted-foreground">mcp.* keys</p>
          </div>
          {advancedOpen ? (
            <ChevronDown className="text-muted-foreground" size={16} />
          ) : (
            <ChevronRight className="text-muted-foreground" size={16} />
          )}
        </button>
        {advancedOpen && (
          <div className="border-t border-border px-4 pb-4 pt-3">
            <SettingsKeysTab prefixes={["mcp."]} />
          </div>
        )}
      </div>
    </div>
  );
}
