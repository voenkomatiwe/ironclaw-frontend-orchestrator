import { CheckCircle, Loader, XCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "@/common/lib/utils";
import type { CustomLlmProviderRow } from "../api-types";
import {
  useDeleteSettingKey,
  useGatewayStatus,
  useGeneralSettings,
  useListLlmModels,
  useLlmProviders,
  useTestLlmConnection,
  useUpdateSetting,
} from "../queries";
import { CustomLlmProvidersPanel } from "./custom-llm-providers-panel";
import { InferenceRow, InferenceSection, inferenceControlClass, inferenceSelectClass } from "./inference-settings-ui";

const EMBEDDING_PROVIDERS = ["openai", "nearai"] as const;

function parseCustom(raw: string | undefined): CustomLlmProviderRow[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw) as unknown;
    return Array.isArray(v) ? (v as CustomLlmProviderRow[]) : [];
  } catch {
    return [];
  }
}

export function InferenceTab() {
  const { data: gateway } = useGatewayStatus();
  const { data: settings, isLoading: loadingSettings } = useGeneralSettings();
  const { data: providers = [], isLoading: loadingProviders } = useLlmProviders();
  const updateSetting = useUpdateSetting();
  const deleteKey = useDeleteSettingKey();

  const testConnection = useTestLlmConnection();
  const listModels = useListLlmModels();

  const [testResults, setTestResults] = useState<Record<string, { ok: boolean; error?: string } | null>>({});
  const [modelLists, setModelLists] = useState<Record<string, string[]>>({});
  const [testingId, setTestingId] = useState<string | null>(null);
  const [listingId, setListingId] = useState<string | null>(null);
  const [restartHint, setRestartHint] = useState(false);

  const custom = useMemo(() => parseCustom(settings?.llm_custom_providers), [settings?.llm_custom_providers]);

  const providerOptions = useMemo(() => {
    const seen = new Set<string>();
    const out: { id: string; label: string }[] = [];
    for (const p of providers) {
      if (!seen.has(p.id)) {
        out.push({ id: p.id, label: p.name || p.id });
        seen.add(p.id);
      }
    }
    for (const c of custom) {
      if (!seen.has(c.id)) {
        out.push({ id: c.id, label: `${c.name} (custom)` });
        seen.add(c.id);
      }
    }
    return out.sort((a, b) => a.label.localeCompare(b.label));
  }, [providers, custom]);

  const envBackend = gateway?.llm_backend ?? "";
  const envModel = gateway?.llm_model ?? "";
  const savedBackend = settings?.llm_backend?.trim() ?? "";
  const savedModel = settings?.selected_model?.trim() ?? "";

  const embeddingsEnabled = settings?.["embeddings.enabled"]?.trim() ?? "";
  const embeddingsProvider = settings?.["embeddings.provider"]?.trim() ?? "";
  const embeddingsModel = settings?.["embeddings.model"]?.trim() ?? "";

  function markEmbeddingsRestart() {
    setRestartHint(true);
  }

  async function handleBackendChange(value: string) {
    if (!value) {
      await deleteKey.mutateAsync("llm_backend");
      return;
    }
    const p = providers.find((x) => x.id === value);
    const row = custom.find((x) => x.id === value);
    const model = row?.default_model?.trim() || p?.model?.trim() || "";
    await updateSetting.mutateAsync({ key: "llm_backend", value });
    if (model) await updateSetting.mutateAsync({ key: "selected_model", value: model });
    else await deleteKey.mutateAsync("selected_model");
  }

  async function handleModelBlur(raw: string) {
    const v = raw.trim();
    if (!v) await deleteKey.mutateAsync("selected_model");
    else await updateSetting.mutateAsync({ key: "selected_model", value: v });
  }

  async function handleEmbeddingEnabled(value: string) {
    if (!value) await deleteKey.mutateAsync("embeddings.enabled");
    else await updateSetting.mutateAsync({ key: "embeddings.enabled", value });
    markEmbeddingsRestart();
  }

  async function handleEmbeddingProvider(value: string) {
    if (!value) await deleteKey.mutateAsync("embeddings.provider");
    else await updateSetting.mutateAsync({ key: "embeddings.provider", value });
    markEmbeddingsRestart();
  }

  async function handleEmbeddingModelBlur(raw: string) {
    const v = raw.trim();
    if (!v) await deleteKey.mutateAsync("embeddings.model");
    else await updateSetting.mutateAsync({ key: "embeddings.model", value: v });
    markEmbeddingsRestart();
  }

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
    } catch {
    } finally {
      setListingId(null);
    }
  }

  const loadingTop = loadingSettings || loadingProviders;

  return (
    <div className="flex flex-col gap-2">
      {restartHint ? (
        <div
          className="mb-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-amber-200 text-xs"
          role="status"
        >
          Embedding changes may require restarting the gateway process to take effect.
        </div>
      ) : null}

      {loadingTop ? (
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Loader className="animate-spin" size={16} />
          Loading inference settings…
        </div>
      ) : (
        <>
          <InferenceSection title="LLM provider">
            <InferenceRow description="LLM inference provider" label="Backend">
              <select
                className={inferenceSelectClass}
                onChange={(e) => void handleBackendChange(e.target.value)}
                value={savedBackend}
              >
                <option value="">{envBackend ? `— env: ${envBackend} —` : "— use env default —"}</option>
                {providerOptions.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            </InferenceRow>
            <InferenceRow description="Model name or ID for the selected backend" label="Model">
              <input
                className={inferenceControlClass}
                defaultValue={savedModel}
                key={`${savedModel}-${savedBackend}`}
                onBlur={(e) => void handleModelBlur(e.target.value)}
                placeholder={envModel ? `env: ${envModel}` : "env default"}
              />
            </InferenceRow>
          </InferenceSection>

          <InferenceSection title="Embeddings">
            <InferenceRow description="Enable vector embeddings for memory search" label="Enabled">
              <select
                className={inferenceSelectClass}
                onChange={(e) => void handleEmbeddingEnabled(e.target.value)}
                value={embeddingsEnabled}
              >
                <option value="">— use env default —</option>
                <option value="true">true</option>
                <option value="false">false</option>
              </select>
            </InferenceRow>
            <InferenceRow description="Embeddings API provider" label="Provider">
              <select
                className={inferenceSelectClass}
                onChange={(e) => void handleEmbeddingProvider(e.target.value)}
                value={embeddingsProvider}
              >
                <option value="">— use env default —</option>
                {EMBEDDING_PROVIDERS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </InferenceRow>
            <InferenceRow description="Embedding model name" label="Model">
              <input
                className={inferenceControlClass}
                defaultValue={embeddingsModel}
                key={`emb-model-${embeddingsModel}-${embeddingsProvider}-${embeddingsEnabled}`}
                onBlur={(e) => void handleEmbeddingModelBlur(e.target.value)}
                placeholder="env default"
              />
            </InferenceRow>
          </InferenceSection>
        </>
      )}

      <CustomLlmProvidersPanel />

      {loadingProviders ? null : providers.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No providers returned from <code className="font-mono">/api/llm/providers</code>. Add a custom provider above
          if your backend supports it.
        </p>
      ) : (
        <InferenceSection className="mt-2" title="Provider tools">
          <p className="pb-3 text-muted-foreground text-xs">
            Test connectivity and list models for each registered provider (gateway API).
          </p>
          {providers.map((provider) => {
            const modelsForProvider = modelLists[provider.id];
            return (
              <div className="py-4" key={provider.id}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h3 className="font-medium text-foreground text-sm">{provider.name}</h3>
                    <p className="mt-0.5 truncate font-mono text-muted-foreground text-xs">{provider.baseUrl}</p>
                    {provider.model ? (
                      <p className="mt-1 text-muted-foreground text-xs">
                        Model: <span className="text-foreground">{provider.model}</span>
                      </p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    {testResults[provider.id] !== undefined ? (
                      <span
                        className={cn(
                          "flex items-center gap-1 text-xs",
                          testResults[provider.id]?.ok ? "text-success" : "text-destructive"
                        )}
                      >
                        {testResults[provider.id]?.ok ? <CheckCircle size={14} /> : <XCircle size={14} />}
                        {testResults[provider.id]?.ok ? "Connected" : (testResults[provider.id]?.error ?? "Failed")}
                      </span>
                    ) : null}
                    <button
                      className="rounded-lg border border-border px-3 py-1.5 text-muted-foreground text-xs transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
                      disabled={testingId === provider.id}
                      onClick={() => void handleTest(provider.id)}
                      type="button"
                    >
                      {testingId === provider.id ? <Loader className="animate-spin" size={12} /> : "Test"}
                    </button>
                    <button
                      className="rounded-lg border border-border px-3 py-1.5 text-muted-foreground text-xs transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
                      disabled={listingId === provider.id}
                      onClick={() => void handleListModels(provider.id)}
                      type="button"
                    >
                      {listingId === provider.id ? <Loader className="animate-spin" size={12} /> : "List models"}
                    </button>
                  </div>
                </div>

                {modelsForProvider && modelsForProvider.length > 0 ? (
                  <div className="mt-3 border-border/50 border-t pt-3">
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
        </InferenceSection>
      )}
    </div>
  );
}
