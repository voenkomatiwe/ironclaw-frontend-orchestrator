import { Loader, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Button, Input } from "@/common/components/ui";
import type { CustomLlmProviderRow } from "../api-types";
import { useDeleteSettingKey, useGeneralSettings, usePutSettingJson, useUpdateSetting, useV1Models } from "../queries";
import { InferenceSection } from "./inference-settings-ui";

const ADAPTERS = ["open_ai_completions", "anthropic", "ollama", "bedrock", "nearai"] as const;

function parseCustom(raw: string | undefined): CustomLlmProviderRow[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw) as unknown;
    return Array.isArray(v) ? (v as CustomLlmProviderRow[]) : [];
  } catch {
    return [];
  }
}

export function CustomLlmProvidersPanel() {
  const { data: settings, isLoading: loadingSettings } = useGeneralSettings();
  const { data: catalogModels = [], isLoading: loadingModels, isError: modelsError } = useV1Models();
  const putJson = usePutSettingJson();
  const updateSetting = useUpdateSetting();
  const deleteModel = useDeleteSettingKey();

  const llmBackend = settings?.llm_backend ?? "";
  const selectedModel = settings?.selected_model?.trim() ?? "";

  const custom = useMemo(() => parseCustom(settings?.llm_custom_providers), [settings?.llm_custom_providers]);

  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState<CustomLlmProviderRow>({
    id: "",
    name: "",
    adapter: "open_ai_completions",
    base_url: "",
    default_model: "",
  });
  const [apiKey, setApiKey] = useState("");

  async function saveProviders(next: CustomLlmProviderRow[]) {
    await putJson.mutateAsync({ key: "llm_custom_providers", value: next });
  }

  async function setActiveProvider(id: string) {
    const row = custom.find((x) => x.id === id);
    const model = row?.default_model?.trim() || "";
    await updateSetting.mutateAsync({ key: "llm_backend", value: id });
    if (model) await updateSetting.mutateAsync({ key: "selected_model", value: model });
    else await deleteModel.mutateAsync("selected_model");
  }

  async function setActiveCatalogModel(modelId: string) {
    await updateSetting.mutateAsync({ key: "selected_model", value: modelId });
  }

  async function addProvider() {
    if (!draft.id.trim() || !draft.name.trim()) return;
    const row: CustomLlmProviderRow = {
      ...draft,
      id: draft.id.trim(),
      name: draft.name.trim(),
      base_url: draft.base_url.trim(),
      default_model: draft.default_model?.trim() || undefined,
    };
    if (apiKey.trim()) row.api_key = apiKey.trim();
    await saveProviders([...custom.filter((c) => c.id !== row.id), row]);
    setShowForm(false);
    setApiKey("");
    setDraft({
      id: "",
      name: "",
      adapter: "open_ai_completions",
      base_url: "",
      default_model: "",
    });
  }

  async function removeProvider(id: string) {
    if (id === llmBackend) return;
    if (!confirm(`Remove provider ${id}?`)) return;
    await saveProviders(custom.filter((c) => c.id !== id));
  }

  if (loadingSettings || loadingModels) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <Loader className="animate-spin" size={16} />
        Loading models…
      </div>
    );
  }

  return (
    <InferenceSection className="mb-2" title="Model providers">
      <div className="flex flex-col gap-3 pb-3">
        <p className="text-muted-foreground text-xs leading-relaxed">
          Built-in list comes from <code className="font-mono text-[11px]">GET /v1/models</code> on your gateway origin.
          Choosing a model updates <span className="font-medium text-foreground">selected model</span>; set backend in{" "}
          <span className="font-medium text-foreground">LLM provider</span> above. Custom rows still set{" "}
          <span className="font-medium text-foreground">llm_backend</span>.
        </p>
        <div className="flex justify-end">
          <Button onClick={() => setShowForm((v) => !v)} size="sm" type="button">
            <Plus size={14} />
            Add custom
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-2 border-border/50 border-t pt-3">
        {modelsError ? (
          <p className="text-destructive text-xs">Could not load /v1/models. Check gateway URL and token.</p>
        ) : catalogModels.length === 0 ? (
          <p className="text-muted-foreground text-xs">No models returned from /v1/models.</p>
        ) : null}
        {catalogModels.map((m) => (
          <div
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-surface-low px-3 py-2"
            key={m.id}
          >
            <div className="min-w-0">
              <p className="font-medium text-foreground text-xs">{m.id}</p>
              {m.owned_by ? <p className="truncate font-mono text-[10px] text-muted-foreground">{m.owned_by}</p> : null}
            </div>
            <button
              className="rounded-lg border border-border px-2 py-1 text-xs disabled:opacity-50"
              disabled={putJson.isPending || updateSetting.isPending}
              onClick={() => void setActiveCatalogModel(m.id)}
              type="button"
            >
              {selectedModel === m.id ? "Active" : "Use"}
            </button>
          </div>
        ))}
        {custom.map((c) => (
          <div
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-warning/25 bg-warning-muted/50 px-3 py-2"
            key={c.id}
          >
            <div className="min-w-0">
              <p className="font-medium text-foreground text-xs">{c.name} (custom)</p>
              <p className="font-mono text-[10px] text-muted-foreground">
                {c.id} · {c.adapter}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <button
                className="rounded-lg border border-border px-2 py-1 text-xs"
                disabled={c.id === llmBackend}
                onClick={() => void setActiveProvider(c.id)}
                type="button"
              >
                {c.id === llmBackend ? "Active" : "Use"}
              </button>
              <button
                className="rounded-lg p-1 text-destructive hover:bg-destructive-muted disabled:opacity-30"
                disabled={c.id === llmBackend}
                onClick={() => void removeProvider(c.id)}
                title="Remove"
                type="button"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showForm ? (
        <div className="mt-2 space-y-2 rounded-lg border border-border bg-surface-low p-3">
          <p className="font-medium text-foreground text-xs">New custom provider</p>
          <Input
            className="w-full font-mono text-xs"
            onChange={(e) => setDraft((d) => ({ ...d, id: e.target.value }))}
            placeholder="id (e.g. my-openai)"
            value={draft.id}
          />
          <Input
            className="w-full text-xs"
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
            placeholder="Display name"
            value={draft.name}
          />
          <select
            className="w-full cursor-pointer rounded-lg border border-border bg-surface-low px-3 py-2 text-foreground text-xs outline-none focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary"
            onChange={(e) => setDraft((d) => ({ ...d, adapter: e.target.value }))}
            value={draft.adapter}
          >
            {ADAPTERS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
          <Input
            className="w-full font-mono text-xs"
            onChange={(e) => setDraft((d) => ({ ...d, base_url: e.target.value }))}
            placeholder="Base URL"
            value={draft.base_url}
          />
          <Input
            className="w-full font-mono text-xs"
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="API key (once)"
            type="password"
            value={apiKey}
          />
          <Input
            className="w-full font-mono text-xs"
            onChange={(e) => setDraft((d) => ({ ...d, default_model: e.target.value }))}
            placeholder="Default model (optional)"
            value={draft.default_model ?? ""}
          />
          <Button disabled={putJson.isPending} onClick={() => void addProvider()} size="sm" type="button">
            Save provider
          </Button>
        </div>
      ) : null}
    </InferenceSection>
  );
}
