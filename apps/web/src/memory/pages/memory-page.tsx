import { ChevronRight, File, FileCode, FileText, FolderOpen, Loader, Pencil, Save, Search, X } from "lucide-react";
import { useState } from "react";

import { cn } from "@/common/lib/utils";
import type { MemorySearchResult, MemoryTreeNode } from "../api-types";
import { useMemoryFile, useMemoryTree, useSearchMemory, useWriteMemory } from "../queries";

const MEMORY_TREE_PAD_START = [
  "ps-[8px]",
  "ps-[20px]",
  "ps-[32px]",
  "ps-[44px]",
  "ps-[56px]",
  "ps-[68px]",
  "ps-[80px]",
  "ps-[92px]",
  "ps-[104px]",
  "ps-[116px]",
  "ps-[128px]",
  "ps-[140px]",
  "ps-[152px]",
  "ps-[164px]",
  "ps-[176px]",
  "ps-[188px]",
  "ps-[200px]",
  "ps-[212px]",
  "ps-[224px]",
  "ps-[236px]",
  "ps-[248px]",
  "ps-[260px]",
  "ps-[272px]",
  "ps-[284px]",
] as const;

function memoryTreePadStartClass(depth: number): string {
  const i = Math.min(Math.max(depth, 0), MEMORY_TREE_PAD_START.length - 1);
  return MEMORY_TREE_PAD_START[i]!;
}

function fileIcon(name: string | undefined) {
  if (!name) return <File size={14} />;
  const ext = name.split(".").pop()?.toLowerCase();
  if (ext === "md") return <FileText size={14} />;
  if (["json", "yaml", "yml", "toml", "ts", "tsx", "js", "jsx", "rs"].includes(ext ?? ""))
    return <FileCode size={14} />;
  return <File size={14} />;
}

type TreeNodeProps = {
  node: MemoryTreeNode;
  depth: number;
  selectedPath: string | null;
  onSelect: (path: string) => void;
};

function TreeNode({ node, depth, selectedPath, onSelect }: TreeNodeProps) {
  const [open, setOpen] = useState(depth === 0);

  if (node.type === "directory") {
    if (depth === 0 && !node.name) {
      return (
        <div>
          {(node.children ?? []).map((child) => (
            <TreeNode
              depth={0}
              key={child.path || child.name}
              node={child}
              onSelect={onSelect}
              selectedPath={selectedPath}
            />
          ))}
        </div>
      );
    }

    return (
      <div>
        <button
          className={cn(
            "flex w-full cursor-pointer items-center gap-1.5 rounded-md py-1 pr-2 text-left text-muted-foreground text-xs transition-colors hover:bg-surface-highest hover:text-foreground",
            memoryTreePadStartClass(depth)
          )}
          onClick={() => setOpen((v) => !v)}
          type="button"
        >
          <ChevronRight className={cn("shrink-0 transition-transform", open && "rotate-90")} size={12} />
          <FolderOpen className="shrink-0 text-primary" size={13} />
          <span className="truncate">{node.name}</span>
        </button>
        {open && node.children && node.children.length > 0 && (
          <div>
            {node.children.map((child) => (
              <TreeNode
                depth={depth + 1}
                key={child.path}
                node={child}
                onSelect={onSelect}
                selectedPath={selectedPath}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      className={cn(
        "flex w-full cursor-pointer items-center gap-1.5 rounded-md py-1 pr-2 text-left text-xs transition-colors",
        memoryTreePadStartClass(depth),
        selectedPath === node.path
          ? "bg-primary/15 font-medium text-foreground ring-1 ring-primary/40"
          : "text-muted-foreground hover:bg-surface-highest hover:text-foreground"
      )}
      onClick={() => onSelect(node.path)}
      type="button"
    >
      <span className="shrink-0">{fileIcon(node.name)}</span>
      <span className="truncate">{node.name}</span>
    </button>
  );
}

type FilePanelProps = {
  path: string;
  onClose: () => void;
};

function FilePanel({ path, onClose }: FilePanelProps) {
  const { data, isLoading, isError } = useMemoryFile(path);
  const writeMutation = useWriteMemory();

  const [editMode, setEditMode] = useState(false);
  const [draft, setDraft] = useState("");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const breadcrumbs = path.split("/").filter(Boolean);

  function startEdit() {
    setDraft(data?.content ?? "");
    setEditMode(true);
    setSaveError(null);
    setSaveSuccess(false);
  }

  async function handleSave() {
    setSaveError(null);
    try {
      await writeMutation.mutateAsync({ path, content: draft });
      setEditMode(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch {
      setSaveError("Failed to save file.");
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between border-border border-b px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-1 font-mono text-muted-foreground text-xs">
          {breadcrumbs.map((seg, i) => (
            <span className="flex items-center gap-1" key={breadcrumbs.slice(0, i + 1).join("/")}>
              {i > 0 && <span>/</span>}
              <span className={i === breadcrumbs.length - 1 ? "font-medium text-foreground" : ""}>{seg}</span>
            </span>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {saveSuccess && <span className="text-success text-xs">Saved</span>}
          {saveError && <span className="text-destructive text-xs">{saveError}</span>}
          {editMode ? (
            <>
              <button
                className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1 text-on-primary-fixed text-xs transition-colors hover:bg-primary/90 disabled:opacity-50"
                disabled={writeMutation.isPending}
                onClick={handleSave}
                type="button"
              >
                {writeMutation.isPending ? <Loader className="animate-spin" size={12} /> : <Save size={12} />}
                Save
              </button>
              <button
                className="flex items-center gap-1 rounded-lg border border-border px-3 py-1 text-muted-foreground text-xs transition-colors hover:text-foreground"
                onClick={() => setEditMode(false)}
                type="button"
              >
                <X size={12} />
                Cancel
              </button>
            </>
          ) : (
            <button
              className="flex items-center gap-1 rounded-lg border border-border px-3 py-1 text-muted-foreground text-xs transition-colors hover:border-primary hover:text-primary"
              onClick={startEdit}
              type="button"
            >
              <Pencil size={12} />
              Edit
            </button>
          )}
          <button
            className="rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
            onClick={onClose}
            title="Close"
            type="button"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
            <Loader className="animate-spin" size={16} />
          </div>
        ) : isError ? (
          <div className="p-4 text-destructive text-sm">Could not read this file. Check the path or permissions.</div>
        ) : editMode ? (
          <textarea
            className="h-full min-h-48 w-full resize-none border-0 bg-surface-low p-4 font-mono text-foreground text-sm focus:outline-none"
            onChange={(e) => setDraft(e.target.value)}
            value={draft}
          />
        ) : (
          <pre className="overflow-auto whitespace-pre-wrap p-4 font-mono text-foreground text-xs leading-relaxed">
            {data?.content ?? ""}
          </pre>
        )}
      </div>
    </div>
  );
}

function SearchResults({
  results,
  onSelect,
  onClear,
}: {
  results: MemorySearchResult[];
  onSelect: (path: string) => void;
  onClear: () => void;
}) {
  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between px-3 py-2">
        <span className="text-muted-foreground text-xs">{results.length} results</span>
        <button className="text-muted-foreground text-xs underline" onClick={onClear} type="button">
          Clear
        </button>
      </div>
      {results.length === 0 ? (
        <p className="px-3 py-2 text-muted-foreground text-xs">No results found.</p>
      ) : (
        results.map((r) => (
          <button
            className="px-3 py-2 text-left transition-colors hover:bg-surface-highest"
            key={r.path}
            onClick={() => onSelect(r.path)}
            type="button"
          >
            <p className="font-mono text-foreground text-xs">{r.path}</p>
            <p className="mt-0.5 line-clamp-2 text-muted-foreground text-xs">{r.snippet}</p>
          </button>
        ))
      )}
    </div>
  );
}

export function MemoryView() {
  const { data: tree, isLoading: treeLoading } = useMemoryTree();
  const searchMutation = useSearchMemory();

  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<MemorySearchResult[] | null>(null);
  const [searching, setSearching] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const results = await searchMutation.mutateAsync({ query: searchQuery.trim() });
      setSearchResults(results);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }

  function clearSearch() {
    setSearchQuery("");
    setSearchResults(null);
  }

  return (
    <div className="box-border flex h-[calc(100dvh-2.75rem)] max-h-[calc(100dvh-2.75rem)] flex-col gap-4 p-6">
      <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-bold text-foreground text-xl">Memory</h1>
          <p className="mt-0.5 text-muted-foreground text-sm">Browse and edit workspace files</p>
        </div>
        <form className="flex w-full flex-wrap items-center gap-2 sm:w-auto" onSubmit={handleSearch}>
          <div className="relative">
            <Search className="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground" size={14} />
            <input
              className="rounded-lg border border-border bg-surface-low py-1.5 pr-3 pl-8 text-foreground text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search files..."
              type="text"
              value={searchQuery}
            />
          </div>
          <button
            className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-muted-foreground text-sm transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
            disabled={searching || !searchQuery.trim()}
            type="submit"
          >
            {searching ? <Loader className="animate-spin" size={14} /> : "Search"}
          </button>
          {searchResults !== null && (
            <button
              className="rounded-lg border border-border px-3 py-1.5 text-muted-foreground text-sm transition-colors hover:text-foreground"
              onClick={clearSearch}
              type="button"
            >
              Clear
            </button>
          )}
        </form>
      </div>

      <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden rounded-xl border border-border bg-surface-low">
        <div className="flex w-[min(100%,18rem)] shrink-0 flex-col border-border border-r bg-surface-low sm:w-72">
          <div className="border-border border-b px-3 py-2">
            <span className="text-muted-foreground text-xs">{searchResults !== null ? "Search results" : "Files"}</span>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto py-1">
            {searchResults !== null ? (
              <SearchResults
                onClear={clearSearch}
                onSelect={(p) => {
                  setSelectedPath(p);
                }}
                results={searchResults}
              />
            ) : treeLoading ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
                <Loader className="animate-spin" size={16} />
              </div>
            ) : tree ? (
              tree.children && tree.children.length > 0 ? (
                <TreeNode depth={0} node={tree} onSelect={setSelectedPath} selectedPath={selectedPath} />
              ) : (
                <div className="px-3 py-6">
                  <p className="text-muted-foreground text-sm">No files in workspace yet.</p>
                  <p className="mt-1 text-muted-foreground text-xs">
                    The tree builds from <span className="font-mono">GET /api/memory/tree</span> (flat{" "}
                    <span className="font-mono">entries</span>). Add files to the agent workspace to see them here.
                  </p>
                </div>
              )
            ) : (
              <p className="px-3 py-4 text-muted-foreground text-xs">No data from server.</p>
            )}
          </div>
        </div>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-surface-low">
          {selectedPath ? (
            <FilePanel onClose={() => setSelectedPath(null)} path={selectedPath} />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
              Select a file to view its contents
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MemoryPage() {
  return <MemoryView />;
}
