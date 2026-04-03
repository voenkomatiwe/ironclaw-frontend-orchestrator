import { Loader, X } from "lucide-react";
import { useEffect, useState } from "react";

import { cn } from "@/common/lib/utils";
import { useExtensionSetupSchema, useExtensionSetupSubmit } from "@/extensions/queries";
import { inferenceControlClass } from "@/settings/components/inference-settings-ui";

type ExtensionSetupDialogProps = {
  extensionName: string | null;
  onClose: () => void;
};

export function ExtensionSetupDialog({ extensionName, onClose }: ExtensionSetupDialogProps) {
  const { data: schema, isLoading, isError } = useExtensionSetupSchema(extensionName);
  const submit = useExtensionSetupSubmit();
  const [secrets, setSecrets] = useState<Record<string, string>>({});
  const [fields, setFields] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: reset form when switching extension
  useEffect(() => {
    setSecrets({});
    setFields({});
    setMessage(null);
  }, [extensionName]);

  if (!extensionName) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]">
      <div className="max-h-[90vh] w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-surface-low shadow-xl">
        <div className="relative border-border border-b bg-surface-high/60 px-5 py-4">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(480px_circle_at_0%_0%,var(--primary)_0%,transparent_55%)] opacity-[0.12]"
          />
          <div className="relative flex items-center justify-between gap-3">
            <h2 className="font-semibold text-foreground text-sm tracking-tight">Setup: {extensionName}</h2>
            <button
              className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-surface-highest"
              onClick={onClose}
              type="button"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="max-h-[min(70vh,calc(90vh-5rem))] overflow-y-auto p-5">
          {isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Loader className="animate-spin" size={16} />
              Loading schema…
            </div>
          ) : isError ? (
            <p className="text-destructive text-sm">Could not load setup schema.</p>
          ) : schema ? (
            <form
              className="flex flex-col gap-4"
              onSubmit={(e) => {
                e.preventDefault();
                setMessage(null);
                submit.mutate(
                  { name: extensionName, secrets, fields },
                  {
                    onSuccess: (res) => {
                      if (res.success) {
                        if (res.auth_url && typeof res.auth_url === "string") {
                          try {
                            const u = new URL(res.auth_url);
                            if (u.protocol === "https:") window.open(u.href, "_blank", "width=600,height=700");
                          } catch {
                            setMessage("Invalid auth URL");
                          }
                        } else {
                          onClose();
                        }
                      } else {
                        setMessage(res.message ?? "Setup failed");
                      }
                    },
                    onError: () => setMessage("Request failed"),
                  }
                );
              }}
            >
              {(schema.secrets ?? []).map((s) => (
                <label className="block" key={s.name}>
                  <span className="mb-1 block text-foreground text-xs">{s.prompt}</span>
                  <input
                    className={cn(inferenceControlClass, "font-mono text-xs")}
                    onChange={(e) => setSecrets((prev) => ({ ...prev, [s.name]: e.target.value }))}
                    placeholder={s.provided ? "(configured)" : s.optional ? "(optional)" : ""}
                    type="password"
                    value={secrets[s.name] ?? ""}
                  />
                </label>
              ))}
              {(schema.fields ?? []).map((f) => (
                <label className="block" key={f.name}>
                  <span className="mb-1 block text-foreground text-xs">{f.prompt}</span>
                  <input
                    className={cn(inferenceControlClass, "font-mono text-xs")}
                    onChange={(e) => setFields((prev) => ({ ...prev, [f.name]: e.target.value }))}
                    placeholder={f.provided ? "(configured)" : f.optional ? "(optional)" : ""}
                    type={f.input_type === "password" ? "password" : "text"}
                    value={fields[f.name] ?? ""}
                  />
                </label>
              ))}
              {message ? <p className="text-destructive text-xs">{message}</p> : null}
              <div className="flex justify-end gap-2 border-border border-t pt-4">
                <button
                  className="rounded-lg border border-border bg-surface-high px-4 py-2 font-medium text-foreground text-xs transition-colors hover:bg-surface-highest"
                  onClick={onClose}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-medium text-on-primary-fixed text-xs transition-colors hover:bg-primary/90 disabled:opacity-50"
                  disabled={submit.isPending}
                  type="submit"
                >
                  {submit.isPending ? <Loader className="animate-spin" size={14} /> : null}
                  Submit
                </button>
              </div>
            </form>
          ) : null}
        </div>
      </div>
    </div>
  );
}
