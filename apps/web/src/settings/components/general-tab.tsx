import { Check, Download, Loader, Pencil, Upload, X } from "lucide-react";
import { useRef, useState } from "react";
import { api } from "@/api";
import type { SettingsExportResponse } from "../api-types";
import { useGeneralSettings, useImportSettings, useUpdateSetting } from "../queries";

export function GeneralTab() {
  const { data: settings, isLoading } = useGeneralSettings();
  const updateSetting = useUpdateSetting();
  const importSettings = useImportSettings();
  const fileRef = useRef<HTMLInputElement>(null);

  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  function startEdit(key: string, currentValue: string) {
    setEditing(key);
    setDraft(currentValue);
    setSaveError(null);
  }

  function cancelEdit() {
    setEditing(null);
    setDraft("");
    setSaveError(null);
  }

  async function handleSave(key: string) {
    setSavingKey(key);
    setSaveError(null);
    try {
      await updateSetting.mutateAsync({ key, value: draft });
      setEditing(null);
    } catch {
      setSaveError("Failed to save.");
    } finally {
      setSavingKey(null);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <Loader className="animate-spin" size={16} />
        Loading settings...
      </div>
    );
  }

  const entries = settings ? Object.entries(settings) : [];

  async function handleExport() {
    const data = await api.get("settings/export").json<SettingsExportResponse>();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ironclaw-settings.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImportFile(f: File | null) {
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as Record<string, unknown>;
        importSettings.mutate(parsed);
      } catch {}
    };
    reader.readAsText(f);
    if (fileRef.current) fileRef.current.value = "";
  }

  if (entries.length === 0) {
    return (
      <div>
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-foreground text-xs"
            onClick={() => void handleExport()}
            type="button"
          >
            <Download size={14} />
            Export JSON
          </button>
          <input
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => handleImportFile(e.target.files?.[0] ?? null)}
            ref={fileRef}
            type="file"
          />
          <button
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-foreground text-xs disabled:opacity-50"
            disabled={importSettings.isPending}
            onClick={() => fileRef.current?.click()}
            type="button"
          >
            <Upload size={14} />
            Import JSON
          </button>
        </div>
        <p className="text-muted-foreground text-sm">No settings found.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-foreground text-xs"
          onClick={() => void handleExport()}
          type="button"
        >
          <Download size={14} />
          Export JSON
        </button>
        <input
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => handleImportFile(e.target.files?.[0] ?? null)}
          ref={fileRef}
          type="file"
        />
        <button
          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-foreground text-xs disabled:opacity-50"
          disabled={importSettings.isPending}
          onClick={() => fileRef.current?.click()}
          type="button"
        >
          <Upload size={14} />
          Import JSON
        </button>
      </div>
      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-border border-b bg-surface-high">
              <th className="px-4 py-3 text-left font-medium text-foreground text-xs">Key</th>
              <th className="px-4 py-3 text-left font-medium text-foreground text-xs">Value</th>
              <th className="px-4 py-3 text-right font-medium text-foreground text-xs">Actions</th>
            </tr>
          </thead>
          <tbody>
            {entries.map(([key, value]) => (
              <tr className="border-border border-b hover:bg-surface-highest" key={key}>
                <td className="px-4 py-3 font-mono text-foreground text-xs">{key}</td>
                <td className="px-4 py-3">
                  {editing === key ? (
                    <input
                      autoFocus
                      className="w-full rounded-lg border border-border bg-surface-low px-2 py-1 font-mono text-foreground text-xs focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSave(key);
                        if (e.key === "Escape") cancelEdit();
                      }}
                      value={draft}
                    />
                  ) : (
                    <span className="font-mono text-muted-foreground text-xs">
                      {value || <span className="text-muted-foreground/50 italic">empty</span>}
                    </span>
                  )}
                  {editing === key && saveError && <p className="mt-1 text-destructive text-xs">{saveError}</p>}
                </td>
                <td className="px-4 py-3 text-right">
                  {editing === key ? (
                    <div className="flex items-center justify-end gap-1">
                      {savingKey === key ? (
                        <Loader className="animate-spin text-muted-foreground" size={14} />
                      ) : (
                        <>
                          <button
                            className="rounded-md p-1 text-success transition-colors hover:bg-success-muted"
                            onClick={() => handleSave(key)}
                            title="Save"
                            type="button"
                          >
                            <Check size={14} />
                          </button>
                          <button
                            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-surface-highest"
                            onClick={cancelEdit}
                            title="Cancel"
                            type="button"
                          >
                            <X size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  ) : (
                    <button
                      className="rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
                      onClick={() => startEdit(key, value)}
                      title="Edit"
                      type="button"
                    >
                      <Pencil size={14} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
