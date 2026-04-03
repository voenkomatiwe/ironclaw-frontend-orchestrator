import { Loader, Search, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import type { SkillEntry } from "../api-types";
import { useInstallSkill, useRemoveSkill, useSearchSkills, useSkills } from "../queries";

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
    <div className="flex flex-col rounded-xl border border-border bg-surface-high p-4">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-medium text-foreground text-sm">{skill.display_name ?? skill.name}</h3>
          <div className="mt-0.5 flex items-center gap-1.5">
            {skill.version && <span className="text-muted-foreground text-xs">v{skill.version}</span>}
            {skill.trust && (
              <span className="rounded-full bg-surface-highest px-1.5 py-0.5 text-muted-foreground text-xs">
                {skill.trust}
              </span>
            )}
            {skill.source && <span className="text-muted-foreground text-xs">{skill.source}</span>}
          </div>
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
            className="shrink-0 rounded-lg bg-primary px-3 py-1 text-on-primary-fixed text-xs transition-colors hover:bg-primary/90 disabled:opacity-50"
            disabled={installing}
            onClick={onInstall}
            type="button"
          >
            {installing ? <Loader className="animate-spin" size={12} /> : "Install"}
          </button>
        )}
      </div>
      {skill.description && <p className="line-clamp-2 text-muted-foreground text-xs">{skill.description}</p>}
    </div>
  );
}

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
    <div>
      <div className="mb-5 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground" size={15} />
          <input
            className="w-full rounded-lg border border-border bg-surface-low py-2 pr-3 pl-9 text-foreground text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search ClawHub skills..."
            type="text"
            value={query}
          />
        </div>
        {searchResults !== null && (
          <button
            className="rounded-lg border border-border px-3 py-2 text-muted-foreground text-sm transition-colors hover:text-foreground"
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

      {isLoading && searchResults === null ? (
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Loader className="animate-spin" size={16} />
          Loading skills...
        </div>
      ) : displayList.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          {searchResults !== null ? "No skills found." : "No skills installed."}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
