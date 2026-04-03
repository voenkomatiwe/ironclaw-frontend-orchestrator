import { CheckCircle, Loader, XCircle } from "lucide-react";
import { useState } from "react";
import { cn } from "@/common/lib/utils";
import { useListLlmModels, useLlmProviders, useTestLlmConnection } from "../queries";
import { CustomLlmProvidersPanel } from "./custom-llm-providers-panel";

export function InferenceTab() {
  const { data: providers = [], isLoading } = useLlmProviders();
  const testConnection = useTestLlmConnection();
  const listModels = useListLlmModels();

  const [testResults, setTestResults] = useState<Record<string, { ok: boolean; error?: string } | null>>({});
  const [modelLists, setModelLists] = useState<Record<string, string[]>>({});
  const [testingId, setTestingId] = useState<string | null>(null);
  const [listingId, setListingId] = useState<string | null>(null);

  async function handleTest(providerId: string) {
    setTestingId(providerId);
    try {
      const result = await testConnection.mutateAsync({ providerId });
      setTestResults((prev) => ({ ...prev, [providerId]: result }));
    } catch {
      setTestResults((prev) => ({ ...prev, [providerId]: { ok: false, error: "Request failed" } }));
    } finally {
      setTestingId(null);
    }
  }

  async function handleListModels(providerId: string) {
    setListingId(providerId);
    try {
      const result = await listModels.mutateAsync({ providerId });
      setModelLists((prev) => ({ ...prev, [providerId]: result.models }));
    } catch {} finally {
      setListingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <CustomLlmProvidersPanel />
      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Loader className="animate-spin" size={16} />
          Loading gateway providers…
        </div>
      ) : null}
      {providers.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No providers returned from the gateway <code className="font-mono">/api/llm/providers</code>. Add a custom
          provider above if your backend supports it.
        </p>
      ) : null}
      {providers.map((provider) => {
        const modelsForProvider = modelLists[provider.id];
        return (
          <div className="rounded-xl border border-border bg-surface-high p-5" key={provider.id}>
            <div className="mb-3 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h3 className="font-medium text-foreground text-sm">{provider.name}</h3>
                <p className="mt-0.5 truncate font-mono text-muted-foreground text-xs">{provider.baseUrl}</p>
                {provider.model && (
                  <p className="mt-1 text-muted-foreground text-xs">
                    Model: <span className="text-foreground">{provider.model}</span>
                  </p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {testResults[provider.id] !== undefined && (
                  <span
                    className={cn(
                      "flex items-center gap-1 text-xs",
                      testResults[provider.id]?.ok ? "text-success" : "text-destructive"
                    )}
                  >
                    {testResults[provider.id]?.ok ? <CheckCircle size={14} /> : <XCircle size={14} />}
                    {testResults[provider.id]?.ok
                      ? "Connected"
                      : (testResults[provider.id]?.error ?? "Failed")}
                  </span>
                )}
                <button
                  className="rounded-lg border border-border px-3 py-1.5 text-muted-foreground text-xs transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
                  disabled={testingId === provider.id}
                  onClick={() => handleTest(provider.id)}
                  type="button"
                >
                  {testingId === provider.id ? <Loader className="animate-spin" size={12} /> : "Test"}
                </button>
                <button
                  className="rounded-lg border border-border px-3 py-1.5 text-muted-foreground text-xs transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
                  disabled={listingId === provider.id}
                  onClick={() => handleListModels(provider.id)}
                  type="button"
                >
                  {listingId === provider.id ? <Loader className="animate-spin" size={12} /> : "List models"}
                </button>
              </div>
            </div>

            {modelsForProvider && modelsForProvider.length > 0 ? (
              <div className="mt-3 border-border border-t pt-3">
                <p className="mb-2 text-muted-foreground text-xs">Available models:</p>
                <div className="flex flex-wrap gap-1.5">
                  {modelsForProvider.map((m) => (
                    <span
                      className="rounded-md border border-border bg-surface-low px-2 py-0.5 font-mono text-foreground text-xs"
                      key={m}
                    >
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
