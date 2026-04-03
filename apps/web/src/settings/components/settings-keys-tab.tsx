import { Check, Loader, Pencil, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useGeneralSettings, useUpdateSetting } from "../queries";

type Props = {
  prefixes: string[];
  description?: string;
  /** Keys to omit from the table (e.g. shown in a structured form above). */
  hideKeys?: readonly string[];
};

export function SettingsKeysTab({ prefixes, description, hideKeys }: Props) {
  const { data: settings, isLoading } = useGeneralSettings();
  const updateSetting = useUpdateSetting();

  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const hide = useMemo(() => new Set(hideKeys ?? []), [hideKeys]);

  const entries = useMemo(() => {
    if (!settings) return [];
    return Object.entries(settings).filter(
      ([k]) =>
        !hide.has(k) && prefixes.some((p) => (p.endsWith(".") ? k.startsWith(p) : k.startsWith(`${p}.`) || k === p))
    );
  }, [settings, prefixes, hide]);

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
        Loading…
      </div>
    );
  }

  return (
    <div>
      {description ? <p className="mb-4 text-muted-foreground text-sm">{description}</p> : null}
      {entries.length === 0 ? (
        <p className="text-muted-foreground text-sm">No matching settings in export.</p>
      ) : (
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
                        // biome-ignore lint/a11y/noAutofocus: focus edit field when opening inline editor
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
                      <span className="line-clamp-3 font-mono text-muted-foreground text-xs">
                        {value || <span className="text-muted-foreground/50 italic">empty</span>}
                      </span>
                    )}
                    {editing === key && saveError ? <p className="mt-1 text-destructive text-xs">{saveError}</p> : null}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {editing === key ? (
                      <div className="flex items-center justify-end gap-1">
                        {savingKey === key ? (
                          <Loader className="animate-spin text-muted-foreground" size={14} />
                        ) : (
                          <>
                            <button
                              className="rounded-md p-1 text-success transition-colors hover:bg-green-50"
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
