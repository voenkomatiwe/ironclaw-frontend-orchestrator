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

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-8 text-muted-foreground text-sm">
        <Loader className="animate-spin" size={16} />
        Loading…
      </div>
    );
  }

  const entries = settings ? Object.entries(settings) : [];

  return (
    <div className="flex flex-col gap-3">
      {/* Export/Import card */}
      <div className="flex gap-2 rounded-2xl bg-white p-4 shadow-xs">
        <button
          className="flex items-center gap-1.5 rounded-xl bg-surface-high px-3 py-2 text-[12px] font-medium text-muted-foreground transition-colors hover:text-foreground"
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
          className="flex items-center gap-1.5 rounded-xl bg-surface-high px-3 py-2 text-[12px] font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
          disabled={importSettings.isPending}
          onClick={() => fileRef.current?.click()}
          type="button"
        >
          <Upload size={14} />
          Import JSON
        </button>
      </div>

      {/* Settings table card */}
      {entries.length === 0 ? (
        <p className="py-8 text-center text-[13px] text-muted-foreground">No settings found.</p>
      ) : (
        <div className="overflow-hidden rounded-2xl bg-white shadow-xs">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border bg-surface-high">
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-muted-foreground">Key</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-muted-foreground">Value</th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold text-muted-foreground" />
              </tr>
            </thead>
            <tbody>
              {entries.map(([key, value]) => (
                <tr className="border-b border-border last:border-b-0 hover:bg-surface-high/50" key={key}>
                  <td className="px-4 py-3 font-mono text-[11px] text-foreground">{key}</td>
                  <td className="px-4 py-3">
                    {editing === key ? (
                      <input
                        autoFocus
                        className="w-full rounded-lg border border-border bg-surface-high px-2 py-1 font-mono text-[11px] text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSave(key);
                          if (e.key === "Escape") cancelEdit();
                        }}
                        value={draft}
                      />
                    ) : (
                      <span className="font-mono text-[11px] text-muted-foreground">
                        {value || <span className="italic text-muted-foreground/50">empty</span>}
                      </span>
                    )}
                    {editing === key && saveError && (
                      <p className="mt-1 text-[11px] text-destructive">{saveError}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {editing === key ? (
                      <div className="flex items-center justify-end gap-1">
                        {savingKey === key ? (
                          <Loader className="animate-spin text-muted-foreground" size={14} />
                        ) : (
                          <>
                            <button
                              className="rounded-md p-1 text-success transition-colors hover:bg-success/10"
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
      )}
    </div>
  );
}
