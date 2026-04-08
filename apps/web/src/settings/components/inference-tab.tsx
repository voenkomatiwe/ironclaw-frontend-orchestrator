import { CheckCircle, ChevronDown, ChevronRight, Loader, XCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { Input } from "@/common/components/ui";
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

/* ── helpers ─────────────────────────────────────────────── */

const EMBEDDING_PROVIDERS = ["openai", "nearai"] as const;

const inputOverrides = "w-full rounded-xl bg-surface-high text-[13px]";

const selectClass =
  "w-full rounded-xl border border-border bg-surface-high px-3 py-2 text-[13px] text-foreground focus:border-primary focus:outline-none";

function parseCustom(raw: string | undefined): CustomLlmProviderRow[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw) as unknown;
    return Array.isArray(v) ? (v as CustomLlmProviderRow[]) : [];
  } catch {
    return [];
  }
}

/* ── FormRow ─────────────────────────────────────────────── */

function FormRow({ children, label }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="min-w-20 shrink-0 text-[13px] text-muted-foreground">{label}</span>
      <div className="max-w-[280px] flex-1">{children}</div>
    </div>
  );
}

/* ── InferenceTab ────────────────────────────────────────── */

export function InferenceTab() {
  const { data: gateway } = useGatewayStatus();
  const { data: settings, isLoading: loadingSettings } = useGeneralSettings();
  const { data: providers = [], isLoading: loadingProviders } = useLlmProviders();
  const updateSetting = useUpdateSetting();
  const deleteKey = useDeleteSettingKey();

  const testConnection = useTestLlmConnection();
  const listModels = useListLlmModels();

  const [testResult, setTestResult] = useState<{ ok: boolean; error?: string } | null>(null);
  const [modelList, setModelList] = useState<string[] | null>(null);
  const [testing, setTesting] = useState(false);
  const [listing, setListing] = useState(false);
  const [restartHint, setRestartHint] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);

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
  const isEmbeddingsOn = embeddingsEnabled === "true";

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

  async function handleEmbeddingToggle() {
    const next = isEmbeddingsOn ? "false" : "true";
    await updateSetting.mutateAsync({ key: "embeddings.enabled", value: next });
    setRestartHint(true);
  }

  async function handleEmbeddingProvider(value: string) {
    if (!value) await deleteKey.mutateAsync("embeddings.provider");
    else await updateSetting.mutateAsync({ key: "embeddings.provider", value });
    setRestartHint(true);
  }

  async function handleEmbeddingModelBlur(raw: string) {
    const v = raw.trim();
    if (!v) await deleteKey.mutateAsync("embeddings.model");
    else await updateSetting.mutateAsync({ key: "embeddings.model", value: v });
    setRestartHint(true);
  }

  async function handleTest() {
    const providerId = savedBackend || envBackend;
    if (!providerId) return;
    setTesting(true);
    try {
      const result = await testConnection.mutateAsync({ providerId });
      setTestResult(result);
    } catch {
      setTestResult({ ok: false, error: "Request failed" });
    } finally {
      setTesting(false);
    }
  }

  async function handleListModels() {
    const providerId = savedBackend || envBackend;
    if (!providerId) return;
    setListing(true);
    try {
      const result = await listModels.mutateAsync({ providerId });
      setModelList(result.models);
    } catch {
      setModelList([]);
    } finally {
      setListing(false);
    }
  }

  if (loadingSettings || loadingProviders) {
    return (
      <div className="flex items-center gap-2 py-8 text-muted-foreground text-sm">
        <Loader className="animate-spin" size={16} />
        Loading…
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Card 1: AI Model */}
      <div className="rounded-2xl bg-white p-5 shadow-xs">
        <h3 className="font-semibold text-[15px] text-foreground">AI Model</h3>
        <p className="mb-4 text-[12px] text-muted-foreground">Choose which language model powers your assistant</p>

        <div className="flex flex-col gap-3">
          <FormRow label="Provider">
            <select
              className={selectClass}
              onChange={(e) => void handleBackendChange(e.target.value)}
              value={savedBackend}
            >
              <option value="">{envBackend ? `env: ${envBackend}` : "— use env default —"}</option>
              {providerOptions.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </FormRow>

          <FormRow label="Model">
            <Input
              className={inputOverrides}
              defaultValue={savedModel}
              key={`${savedModel}-${savedBackend}`}
              onBlur={(e) => void handleModelBlur(e.target.value)}
              placeholder={envModel ? `env: ${envModel}` : "env default"}
            />
          </FormRow>

          {/* Actions + result */}
          <div className="flex items-center justify-end gap-2">
            {testResult !== null && (
              <span
                className={cn("flex items-center gap-1 text-xs", testResult.ok ? "text-success" : "text-destructive")}
              >
                {testResult.ok ? <CheckCircle size={14} /> : <XCircle size={14} />}
                {testResult.ok ? "Connected" : (testResult.error ?? "Failed")}
              </span>
            )}
            <button
              className="rounded-xl bg-surface-high px-3 py-1.5 font-medium text-[12px] text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
              disabled={listing}
              onClick={() => void handleListModels()}
              type="button"
            >
              {listing ? <Loader className="animate-spin" size={12} /> : "List models"}
            </button>
            <button
              className="rounded-xl bg-primary px-3 py-1.5 font-medium text-[12px] text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
              disabled={testing}
              onClick={() => void handleTest()}
              type="button"
            >
              {testing ? <Loader className="animate-spin" size={12} /> : "Test connection"}
            </button>
          </div>

          {/* Model list */}
          {modelList && modelList.length > 0 && (
            <div className="border-border border-t pt-3">
              <p className="mb-2 text-[12px] text-muted-foreground">Available models:</p>
              <div className="flex flex-wrap gap-1.5">
                {modelList.map((m) => (
                  <span
                    className="rounded-lg bg-surface-high px-2 py-0.5 font-mono text-[11px] text-foreground"
                    key={m}
                  >
                    {m}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Card 2: Embeddings */}
      <div className="rounded-2xl bg-white p-5 shadow-xs">
        <div className="mb-1 flex items-center justify-between">
          <h3 className="font-semibold text-[15px] text-foreground">Embeddings</h3>
          <button
            className={cn(
              "relative h-[22px] w-10 rounded-full transition-colors",
              isEmbeddingsOn ? "bg-success" : "bg-gray-300"
            )}
            onClick={() => void handleEmbeddingToggle()}
            type="button"
          >
            <span
              className={cn(
                "absolute top-0.5 h-[18px] w-[18px] rounded-full bg-white shadow-sm transition-[left,right]",
                isEmbeddingsOn ? "right-0.5 left-auto" : "right-auto left-0.5"
              )}
            />
          </button>
        </div>
        <p className="mb-4 text-[12px] text-muted-foreground">Vector search for memory and context</p>

        {isEmbeddingsOn && (
          <div className="flex flex-col gap-3">
            <FormRow label="Provider">
              <select
                className={selectClass}
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
            </FormRow>
            <FormRow label="Model">
              <Input
                className={inputOverrides}
                defaultValue={embeddingsModel}
                key={`emb-${embeddingsModel}-${embeddingsProvider}-${embeddingsEnabled}`}
                onBlur={(e) => void handleEmbeddingModelBlur(e.target.value)}
                placeholder="env default"
              />
            </FormRow>
          </div>
        )}

        {restartHint && (
          <div className="mt-3 rounded-xl bg-warning/5 px-3 py-2 text-[11px] text-warning">
            ⚠ Changes may require a gateway restart
          </div>
        )}
      </div>

      {/* Card 3: Custom Providers (collapsible) */}
      <div className="rounded-2xl bg-white shadow-xs">
        <button
          className="flex w-full items-center justify-between p-5 text-left"
          onClick={() => setCustomOpen((v) => !v)}
          type="button"
        >
          <div>
            <h3 className="font-semibold text-[15px] text-foreground">Custom Providers</h3>
            <p className="mt-0.5 text-[12px] text-muted-foreground">Add your own LLM backends</p>
          </div>
          {customOpen ? (
            <ChevronDown className="text-muted-foreground" size={18} />
          ) : (
            <ChevronRight className="text-muted-foreground" size={18} />
          )}
        </button>
        {customOpen && (
          <div className="border-border border-t px-5 pt-4 pb-5">
            <CustomLlmProvidersPanel />
          </div>
        )}
      </div>
    </div>
  );
}
