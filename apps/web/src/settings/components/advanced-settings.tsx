import { Check, ChevronRight, Loader, Pencil, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/common/lib/utils";
import { useGeneralSettings, useUpdateSetting } from "../queries";

export function AdvancedSettings() {
  const { data: settings, isLoading } = useGeneralSettings();
  const updateSetting = useUpdateSetting();

  const [open, setOpen] = useState(false);
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

  const entries = settings ? Object.entries(settings) : [];

  return (
    <div className="mt-6 border-border border-t">
      <button
        className="flex w-full items-center gap-1.5 py-3 font-medium text-[13px] text-muted-foreground transition-colors hover:text-foreground"
        onClick={() => setOpen((v) => !v)}
        type="button"
      >
        <ChevronRight className={cn("transition-transform", open && "rotate-90")} size={14} />
        Advanced
      </button>

      {open && (
        <>
          {isLoading ? (
            <div className="flex items-center gap-2 py-8 text-muted-foreground text-sm">
              <Loader className="animate-spin" size={16} />
              Loading…
            </div>
          ) : entries.length === 0 ? (
            <p className="py-8 text-center text-[13px] text-muted-foreground">No settings found.</p>
          ) : (
            <div className="overflow-hidden rounded-2xl bg-white shadow-xs">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-border border-b bg-surface-high">
                    <th className="px-4 py-3 text-left font-semibold text-[11px] text-muted-foreground">Key</th>
                    <th className="px-4 py-3 text-left font-semibold text-[11px] text-muted-foreground">Value</th>
                    <th className="px-4 py-3 text-right font-semibold text-[11px] text-muted-foreground" />
                  </tr>
                </thead>
                <tbody>
                  {entries.map(([key, value]) => (
                    <tr className="border-border border-b last:border-b-0 hover:bg-surface-high/50" key={key}>
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
                            {value || <span className="text-muted-foreground/50 italic">empty</span>}
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
        </>
      )}
    </div>
  );
}
