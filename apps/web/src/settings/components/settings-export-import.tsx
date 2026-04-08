import { Download, Upload } from "lucide-react";
import { useRef } from "react";
import { api } from "@/api";
import { Button } from "@/common/components/ui";
import type { SettingsExportResponse } from "../api-types";
import { useImportSettings } from "../queries";

export function SettingsExportImport() {
  const importSettings = useImportSettings();
  const fileRef = useRef<HTMLInputElement>(null);

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

  return (
    <div className="flex gap-2">
      <Button className="rounded-xl text-[12px]" onClick={() => void handleExport()} type="button" variant="ghost">
        <Download size={14} />
        Export
      </Button>
      <input
        accept="application/json,.json"
        className="hidden"
        onChange={(e) => handleImportFile(e.target.files?.[0] ?? null)}
        ref={fileRef}
        type="file"
      />
      <Button
        className="rounded-xl text-[12px]"
        disabled={importSettings.isPending}
        onClick={() => fileRef.current?.click()}
        type="button"
        variant="ghost"
      >
        <Upload size={14} />
        Import
      </Button>
    </div>
  );
}
