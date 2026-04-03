import { Loader, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import type { CustomLlmProviderRow } from "../api-types";
import {
  useDeleteSettingKey,
  useGeneralSettings,
  useLlmProviders,
  usePutSettingJson,
  useUpdateSetting,
} from "../queries";

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
  const { data: providers = [], isLoading: loadingProv } = useLlmProviders();
  const putJson = usePutSettingJson();
  const updateSetting = useUpdateSetting();
  const deleteModel = useDeleteSettingKey();

  const llmBackend = settings?.llm_backend ?? "";
  const selectedModel = settings?.selected_model ?? "";

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

  async function setActive(id: string) {
    const p = providers.find((x) => x.id === id);
    const row = custom.find((x) => x.id === id);
    const model = row?.default_model?.trim() || p?.model?.trim() || "";
    await updateSetting.mutateAsync({ key: "llm_backend", value: id });
    if (model) await updateSetting.mutateAsync({ key: "selected_model", value: model });
    else await deleteModel.mutateAsync("selected_model");
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

  if (loadingSettings || loadingProv) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <Loader className="animate-spin" size={16} />
        Loading provider config…
      </div>
    );
  }

  return (
    <div className="mb-6 rounded-xl border border-border bg-surface-high p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <h3 className="font-medium text-foreground text-sm">Model providers</h3>
          <p className="text-muted-foreground text-xs">
            Active backend: <span className="font-mono text-foreground">{llmBackend || "—"}</span>
            {selectedModel ? (
              <>
                {" "}
                · model <span className="font-mono text-foreground">{selectedModel}</span>
              </>
            ) : null}
          </p>
        </div>
        <button
          className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-on-primary-fixed text-xs"
          onClick={() => setShowForm((v) => !v)}
          type="button"
        >
          <Plus size={14} />
          Add custom
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {providers.map((p) => (
          <div
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-surface-low px-3 py-2"
            key={p.id}
          >
            <div className="min-w-0">
              <p className="font-medium text-foreground text-xs">{p.name}</p>
              <p className="truncate font-mono text-[10px] text-muted-foreground">{p.id}</p>
            </div>
            <button
              className="rounded-lg border border-border px-2 py-1 text-xs disabled:opacity-50"
              disabled={p.id === llmBackend || putJson.isPending}
              onClick={() => void setActive(p.id)}
              type="button"
            >
              {p.id === llmBackend ? "Active" : "Use"}
            </button>
          </div>
        ))}
        {custom.map((c) => (
          <div
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-200/50 bg-amber-50/30 px-3 py-2 dark:bg-amber-950/20"
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
                onClick={() => void setActive(c.id)}
                type="button"
              >
                {c.id === llmBackend ? "Active" : "Use"}
              </button>
              <button
                className="rounded-lg p-1 text-destructive hover:bg-red-50 disabled:opacity-30"
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
        <div className="mt-4 space-y-2 rounded-lg border border-border bg-surface-low p-3">
          <p className="font-medium text-foreground text-xs">New custom provider</p>
          <input
            className="w-full rounded border border-border px-2 py-1.5 font-mono text-xs"
            onChange={(e) => setDraft((d) => ({ ...d, id: e.target.value }))}
            placeholder="id (e.g. my-openai)"
            value={draft.id}
          />
          <input
            className="w-full rounded border border-border px-2 py-1.5 text-xs"
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
            placeholder="Display name"
            value={draft.name}
          />
          <select
            className="w-full rounded border border-border px-2 py-1.5 text-xs"
            onChange={(e) => setDraft((d) => ({ ...d, adapter: e.target.value }))}
            value={draft.adapter}
          >
            {ADAPTERS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
          <input
            className="w-full rounded border border-border px-2 py-1.5 font-mono text-xs"
            onChange={(e) => setDraft((d) => ({ ...d, base_url: e.target.value }))}
            placeholder="Base URL"
            value={draft.base_url}
          />
          <input
            className="w-full rounded border border-border px-2 py-1.5 font-mono text-xs"
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="API key (once)"
            type="password"
            value={apiKey}
          />
          <input
            className="w-full rounded border border-border px-2 py-1.5 font-mono text-xs"
            onChange={(e) => setDraft((d) => ({ ...d, default_model: e.target.value }))}
            placeholder="Default model (optional)"
            value={draft.default_model ?? ""}
          />
          <button
            className="rounded-lg bg-primary px-3 py-1.5 text-on-primary-fixed text-xs disabled:opacity-50"
            disabled={putJson.isPending}
            onClick={() => void addProvider()}
            type="button"
          >
            Save provider
          </button>
        </div>
      ) : null}

      <p className="mt-3 text-[10px] text-muted-foreground">
        Some changes require restarting the IronClaw process to take effect.
      </p>
    </div>
  );
}
