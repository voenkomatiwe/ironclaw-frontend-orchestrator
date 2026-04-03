import { Binary, Link2 } from "lucide-react";
import { useState } from "react";

import { cn } from "@/common/lib/utils";
import { useInstallExtension } from "@/extensions/queries";
import type { ExtensionKind } from "@/settings/api-types";
import { inferenceControlClass, inferenceSelectClass } from "@/settings/components/inference-settings-ui";

const KIND_OPTIONS: { value: ExtensionKind; label: string; hint: string }[] = [
  { value: "wasm_tool", label: "WASM tool", hint: "Agent tools & capabilities" },
  { value: "wasm_channel", label: "WASM channel", hint: "Messaging / transport" },
];

export function InstallWasmPanel() {
  const install = useInstallExtension();
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [kind, setKind] = useState<ExtensionKind>("wasm_tool");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    install.mutate(
      { name: name.trim(), url: url.trim() || undefined, kind },
      {
        onSuccess: () => {
          setName("");
          setUrl("");
        },
      }
    );
  };

  return (
    <section
      className="relative overflow-hidden rounded-2xl border border-border bg-surface-high shadow-sm"
      id="install-wasm"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_circle_at_100%_0%,var(--primary)_0%,transparent_55%)] opacity-[0.07]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(640px_circle_at_0%_100%,var(--chart-5)_0%,transparent_50%)] opacity-[0.04]" />
      <div className="relative border-border border-b bg-surface-highest/40 px-5 py-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Binary size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold text-foreground text-sm">Install from WASM URL</h2>
            <p className="mt-0.5 text-muted-foreground text-xs leading-relaxed">
              Paste a direct link to a <span className="font-mono text-[11px]">.wasm</span> bundle. Uses{" "}
              <span className="font-mono text-[11px]">POST /api/extensions/install</span>. After install, activate from
              the Installed section on this page.
            </p>
          </div>
        </div>
      </div>

      <form className="relative space-y-4 p-5" onSubmit={handleSubmit}>
        <div>
          <label className="mb-1.5 block font-medium text-muted-foreground text-xs" htmlFor="wasm-ext-name">
            Extension id <span className="text-destructive">*</span>
          </label>
          <input
            autoComplete="off"
            className={cn(inferenceControlClass, "max-w-full")}
            id="wasm-ext-name"
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. polymarket-copy-bot"
            required
            value={name}
          />
        </div>

        <div>
          <label
            className="mb-1.5 flex items-center gap-1.5 font-medium text-muted-foreground text-xs"
            htmlFor="wasm-ext-url"
          >
            <Link2 className="text-muted-foreground" size={12} />
            WASM URL
          </label>
          <input
            className={cn(inferenceControlClass, "max-w-full")}
            id="wasm-ext-url"
            inputMode="url"
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://…/extension.wasm"
            type="url"
            value={url}
          />
        </div>

        <div>
          <label className="mb-1.5 block font-medium text-muted-foreground text-xs" htmlFor="wasm-ext-kind">
            Kind
          </label>
          <select
            className={cn(inferenceSelectClass, "max-w-full")}
            id="wasm-ext-kind"
            onChange={(e) => setKind(e.target.value as ExtensionKind)}
            value={kind}
          >
            {KIND_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label} — {o.hint}
              </option>
            ))}
          </select>
        </div>

        {install.error ? <p className="text-destructive text-xs">{install.error.message}</p> : null}

        <button
          className="w-full rounded-xl bg-primary py-2.5 font-semibold text-on-primary-fixed text-sm transition-colors hover:bg-primary/90 disabled:opacity-50"
          disabled={!name.trim() || install.isPending}
          type="submit"
        >
          {install.isPending ? "Installing…" : "Install WASM extension"}
        </button>
      </form>
    </section>
  );
}
