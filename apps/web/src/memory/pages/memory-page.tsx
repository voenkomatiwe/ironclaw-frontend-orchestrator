import {
  ArrowLeft,
  Brain,
  ChevronRight,
  File,
  FileCode,
  FileSearch,
  FileText,
  FolderOpen,
  Loader,
  Save,
  Search,
  X,
} from "lucide-react";
import { useState } from "react";

import { cn } from "@/common/lib/utils";
import { inferenceControlClass } from "@/settings/components/inference-settings-ui";
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
  if (ext === "md" || ext === "markdown") return <FileText size={14} />;
  if (["json", "yaml", "yml", "toml", "ts", "tsx", "js", "jsx", "rs"].includes(ext ?? ""))
    return <FileCode size={14} />;
  return <File size={14} />;
}

function simpleMarkdown(raw: string): string {
  return raw
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/^#{3}\s+(.+)$/gm, '<h3 class="mb-1 mt-4 font-semibold text-foreground text-sm">$1</h3>')
    .replace(/^#{2}\s+(.+)$/gm, '<h2 class="mb-2 mt-5 font-bold text-base text-foreground">$1</h2>')
    .replace(
      /^#{1}\s+(.+)$/gm,
      '<h1 class="mb-2 mt-6 border-b border-border pb-2 font-bold text-foreground text-lg">$1</h1>'
    )
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(
      /`([^`]+)`/g,
      '<code class="rounded bg-surface-highest px-1 py-0.5 font-mono text-[11px] text-foreground">$1</code>'
    )
    .replace(/\n/g, "<br />");
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

type FilePanelProps = {
  path: string;
  onClose: () => void;
};

function FilePanel({ path, onClose }: FilePanelProps) {
  const { data, isLoading, isError } = useMemoryFile(path);
  const writeMutation = useWriteMemory();

  const [activeTab, setActiveTab] = useState<"preview" | "source">("preview");
  const [editMode, setEditMode] = useState(false);
  const [draft, setDraft] = useState("");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const breadcrumbs = path.split("/").filter(Boolean);
  const isMarkdown = /\.(md|markdown)$/i.test(path);

  function startEdit() {
    setDraft(data?.content ?? "");
    setActiveTab("source");
    setEditMode(true);
    setSaveError(null);
    setSaveSuccess(false);
  }

  function cancelEdit() {
    setEditMode(false);
    setSaveError(null);
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

  function handleTabChange(tab: "preview" | "source") {
    setActiveTab(tab);
    if (tab === "preview") setEditMode(false);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Tab bar */}
      <div className="flex shrink-0 items-center border-border border-b bg-surface-low">
        {/* Back button — mobile only */}
        <button
          className="flex shrink-0 items-center gap-1 px-3 py-2.5 text-muted-foreground text-xs transition-colors hover:text-foreground lg:hidden"
          onClick={onClose}
          type="button"
        >
          <ArrowLeft size={14} />
          Back
        </button>

        {/* Breadcrumb */}
        <div className="flex min-w-0 items-center gap-1 px-4 font-mono text-muted-foreground text-xs">
          {breadcrumbs.map((seg, i) => (
            <span className="flex items-center gap-1" key={breadcrumbs.slice(0, i + 1).join("/")}>
              {i > 0 && <span className="text-muted-foreground/50">/</span>}
              <span className={i === breadcrumbs.length - 1 ? "font-medium text-foreground" : ""}>{seg}</span>
            </span>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex shrink-0 items-end self-stretch">
          <button
            className={cn(
              "border-b-2 px-4 pt-2.5 pb-2 font-medium text-xs transition-colors",
              activeTab === "preview"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
            onClick={() => handleTabChange("preview")}
            type="button"
          >
            Preview
          </button>
          <button
            className={cn(
              "border-b-2 px-4 pt-2.5 pb-2 font-medium text-xs transition-colors",
              activeTab === "source"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
            onClick={() => handleTabChange("source")}
            type="button"
          >
            Source
          </button>
        </div>

        {/* Actions */}
        <div className="ml-auto flex shrink-0 items-center gap-2 px-3">
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
                onClick={cancelEdit}
                type="button"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              className="flex items-center gap-1 rounded-lg border border-border px-3 py-1 text-muted-foreground text-xs transition-colors hover:border-primary hover:text-primary"
              onClick={startEdit}
              type="button"
            >
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

      {/* Panel body */}
      <div className="min-h-0 flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <Loader className="animate-spin" size={16} />
          </div>
        ) : isError ? (
          <div className="p-4 text-destructive text-sm">Could not read this file. Check the path or permissions.</div>
        ) : activeTab === "preview" ? (
          isMarkdown ? (
            <div
              className="p-4 text-foreground text-sm leading-relaxed"
              // biome-ignore lint/security/noDangerouslySetInnerHtml: content is sanitized by simpleMarkdown (HTML-escaped before regex transforms)
              dangerouslySetInnerHTML={{ __html: simpleMarkdown(data?.content ?? "") }}
            />
          ) : (
            <pre className="overflow-auto whitespace-pre-wrap p-4 font-mono text-foreground text-xs leading-relaxed">
              {data?.content ?? ""}
            </pre>
          )
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

export function MemoryView() {
  const { data: tree, isLoading: treeLoading } = useMemoryTree();
  const searchMutation = useSearchMemory();

  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<MemorySearchResult[] | null>(null);
  const [searching, setSearching] = useState(false);

  async function handleSearch(e: React.FormEvent<HTMLFormElement>) {
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
    <div className="flex h-[calc(100dvh-2.75rem)] flex-col gap-4 p-4 sm:p-6">
      {/* Header */}
      <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Brain size={18} />
          </div>
          <div>
            <h1 className="font-bold text-foreground text-xl leading-none">Memory</h1>
            <p className="mt-0.5 text-muted-foreground text-xs">Browse and edit workspace files</p>
          </div>
        </div>
        <form className="flex items-center gap-2" onSubmit={handleSearch}>
          <div className="relative flex-1 sm:flex-none">
            <Search
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <input
              aria-label="Search files"
              className={cn(inferenceControlClass, "pl-9 sm:w-56")}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search files…"
              type="search"
              value={searchQuery}
            />
          </div>
          <button
            className="rounded-lg border border-border px-3 py-1.5 text-muted-foreground text-sm transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
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

      {/* Two-column layout */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-surface-low lg:flex-row">
        {/* Sidebar */}
        <div
          className={cn(
            "flex shrink-0 flex-col border-border bg-surface-low",
            "max-h-52 w-full border-b lg:max-h-none lg:w-64 lg:border-b-0 lg:border-r",
            selectedPath !== null && "hidden lg:flex"
          )}
        >
          <div className="border-b border-border px-3 py-2">
            <span className="font-medium text-[10px] text-muted-foreground uppercase tracking-wider">
              {searchResults !== null ? "Search results" : "Files"}
            </span>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto py-1">
            {searchResults !== null ? (
              <SearchResults
                onClear={clearSearch}
                onSelect={(p) => setSelectedPath(p)}
                results={searchResults}
              />
            ) : treeLoading ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <Loader className="animate-spin" size={16} />
              </div>
            ) : tree ? (
              tree.children && tree.children.length > 0 ? (
                <TreeNode depth={0} node={tree} onSelect={setSelectedPath} selectedPath={selectedPath} />
              ) : (
                <div className="px-3 py-6">
                  <p className="text-muted-foreground text-sm">No files in workspace yet.</p>
                  <p className="mt-1 text-muted-foreground text-xs">
                    Add files to the agent workspace to see them here.
                  </p>
                </div>
              )
            ) : (
              <p className="px-3 py-4 text-muted-foreground text-xs">No data from server.</p>
            )}
          </div>
        </div>

        {/* File panel */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-surface-low">
          {selectedPath ? (
            <FilePanel onClose={() => setSelectedPath(null)} path={selectedPath} />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
              <FileSearch className="opacity-30" size={40} />
              <p className="text-sm">Select a file to view its contents</p>
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
