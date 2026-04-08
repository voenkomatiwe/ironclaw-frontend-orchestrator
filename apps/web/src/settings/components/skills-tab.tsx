import { Loader, Search, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { Input } from "@/common/components/ui";
import type { SkillEntry } from "../api-types";
import { useInstallSkill, useRemoveSkill, useSearchSkills, useSkills } from "../queries";

/* ── SkillCard ───────────────────────────────────────────── */

function SkillCard({
  skill,
  onRemove,
  onInstall,
  removing,
  installing,
}: {
  skill: SkillEntry;
  onRemove?: () => void;
  onInstall?: () => void;
  removing?: boolean;
  installing?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-xl bg-white p-4 shadow-xs">
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-[14px] text-foreground">{skill.display_name ?? skill.name}</p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          {skill.version && <span className="text-[11px] text-muted-foreground">v{skill.version}</span>}
          {skill.trust && (
            <span className="rounded-md bg-surface-high px-1.5 py-0.5 text-[10px] text-muted-foreground">
              {skill.trust}
            </span>
          )}
          {skill.source && <span className="text-[11px] text-muted-foreground">{skill.source}</span>}
        </div>
        {skill.description && (
          <p className="mt-2 line-clamp-2 text-[12px] text-muted-foreground">{skill.description}</p>
        )}
      </div>
      {skill.installed ? (
        <button
          className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
          disabled={removing}
          onClick={onRemove}
          title="Remove"
          type="button"
        >
          {removing ? <Loader className="animate-spin" size={14} /> : <Trash2 size={14} />}
        </button>
      ) : (
        <button
          className="shrink-0 rounded-lg bg-primary px-3 py-1.5 font-medium text-[11px] text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
          disabled={installing}
          onClick={onInstall}
          type="button"
        >
          {installing ? <Loader className="animate-spin" size={12} /> : "Install"}
        </button>
      )}
    </div>
  );
}

/* ── SkillsTab ───────────────────────────────────────────── */

export function SkillsTab() {
  const { data: installedSkills = [], isLoading } = useSkills();
  const searchMutation = useSearchSkills();
  const installMutation = useInstallSkill();
  const removeMutation = useRemoveSkill();

  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SkillEntry[] | null>(null);
  const [installingName, setInstallingName] = useState<string | null>(null);
  const [removingName, setRemovingName] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleSearch(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim()) {
      setSearchResults(null);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const results = await searchMutation.mutateAsync({ query: value.trim() });
        setSearchResults(results);
      } catch {
        setSearchResults([]);
      }
    }, 300);
  }

  async function handleInstall(name: string) {
    setInstallingName(name);
    try {
      await installMutation.mutateAsync({ name });
    } finally {
      setInstallingName(null);
    }
  }

  async function handleRemove(name: string) {
    setRemovingName(name);
    try {
      await removeMutation.mutateAsync(name);
    } finally {
      setRemovingName(null);
    }
  }

  const installedNames = new Set(installedSkills.map((s) => s.name));
  const displayList: SkillEntry[] =
    searchResults !== null
      ? searchResults.map((s) => ({ ...s, installed: installedNames.has(s.name) }))
      : installedSkills.map((s) => ({ ...s, installed: true }));

  return (
    <div className="flex flex-col gap-4">
      {/* Search bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground" size={15} />
          <Input
            className="w-full rounded-xl bg-white py-2.5 pr-3 pl-9 text-[13px] shadow-xs"
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search ClawHub skills…"
            type="text"
            value={query}
          />
        </div>
        {searchResults !== null && (
          <button
            className="rounded-xl bg-surface-high px-3 py-2.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
            onClick={() => {
              setQuery("");
              setSearchResults(null);
            }}
            type="button"
          >
            Clear
          </button>
        )}
      </div>

      {/* List */}
      {isLoading && searchResults === null ? (
        <div className="flex items-center gap-2 py-8 text-muted-foreground text-sm">
          <Loader className="animate-spin" size={16} />
          Loading skills…
        </div>
      ) : displayList.length === 0 ? (
        <p className="py-8 text-center text-[13px] text-muted-foreground">
          {searchResults !== null ? "No skills found." : "No skills installed."}
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {displayList.map((skill) => (
            <SkillCard
              installing={installingName === skill.name}
              key={skill.name}
              onInstall={() => handleInstall(skill.name)}
              onRemove={() => handleRemove(skill.name)}
              removing={removingName === skill.name}
              skill={skill}
            />
          ))}
        </div>
      )}
    </div>
  );
}
