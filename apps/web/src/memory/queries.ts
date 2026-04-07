import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api";
import { useAppStore } from "@/store/app";
import type {
  MemoryReadResponse,
  MemorySearchApiResponse,
  MemorySearchRequest,
  MemorySearchResult,
  MemoryTreeApiEntry,
  MemoryTreeNode,
  MemoryWriteRequest,
} from "./api-types";

function useCanFetchApi() {
  return useAppStore((s) => s.proxyReady && Boolean(s.token?.trim() && s.apiUrl?.trim()));
}

export const memoryKeys = {
  tree: () => ["memory", "tree"] as const,
  file: (path: string) => ["memory", "file", path] as const,
};

function buildTreeFromFlatEntries(entries: MemoryTreeApiEntry[]): MemoryTreeNode {
  const root: MemoryTreeNode = { name: "", path: "", type: "directory", children: [] };

  const byPath = new Map<string, MemoryTreeApiEntry>();
  for (const e of entries) {
    byPath.set(e.path, e);
  }
  const sorted = [...byPath.values()].sort((a, b) => a.path.localeCompare(b.path));

  for (const e of sorted) {
    const parts = e.path.split("/").filter(Boolean);
    if (parts.length === 0) continue;

    let parent = root;
    for (let i = 0; i < parts.length; i++) {
      const segment = parts[i]!;
      const isLast = i === parts.length - 1;
      const mustBeDir = !isLast || e.is_dir;

      parent.children ??= [];
      let node: MemoryTreeNode | undefined = parent.children.find((c) => c.name === segment);

      if (!node) {
        const pathStr = parts.slice(0, i + 1).join("/");
        const created: MemoryTreeNode = mustBeDir
          ? { name: segment, path: pathStr, type: "directory", children: [] }
          : { name: segment, path: pathStr, type: "file" };
        parent.children.push(created);
        node = created;
      } else if (mustBeDir && node.type === "file") {
        node.type = "directory";
        node.children = [];
      }

      if (isLast) break;
      if (node.type !== "directory") {
        node.type = "directory";
        node.children = node.children ?? [];
      }
      parent = node;
    }
  }

  function sortChildren(n: MemoryTreeNode) {
    if (!n.children?.length) return;
    n.children.sort((a, b) => {
      if (a.type !== b.type) return a.type === "directory" ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    for (const c of n.children) sortChildren(c);
  }
  sortChildren(root);
  return root;
}

function normalizeTree(raw: unknown): MemoryTreeNode {
  if (raw === null || raw === undefined) {
    return { name: "", path: "", type: "directory", children: [] };
  }
  if (Array.isArray(raw)) {
    return { name: "", path: "", type: "directory", children: raw as MemoryTreeNode[] };
  }
  const obj = raw as Record<string, unknown>;
  if (typeof obj !== "object") {
    return { name: "", path: "", type: "directory", children: [] };
  }

  if (Array.isArray(obj.entries)) {
    return buildTreeFromFlatEntries(obj.entries as MemoryTreeApiEntry[]);
  }
  if (obj.tree) return normalizeTree(obj.tree);
  if (!obj.name && Array.isArray(obj.children)) {
    return {
      name: "",
      path: (obj.path as string) ?? "",
      type: "directory",
      children: obj.children as MemoryTreeNode[],
    };
  }
  if (typeof obj.name === "string" && (obj.type === "directory" || obj.type === "file")) {
    return obj as unknown as MemoryTreeNode;
  }
  return { name: "", path: "", type: "directory", children: [] };
}

export function useMemoryTree() {
  const canFetch = useCanFetchApi();
  return useQuery({
    queryKey: memoryKeys.tree(),
    queryFn: async () => {
      const raw = await api.get("memory/tree").json<unknown>();
      return normalizeTree(raw);
    },
    enabled: canFetch,
  });
}

export function useMemoryFile(path: string | null) {
  const canFetch = useCanFetchApi();
  return useQuery({
    queryKey: memoryKeys.file(path ?? ""),
    queryFn: () => api.get("memory/read", { searchParams: { path: path! } }).json<MemoryReadResponse>(),
    enabled: canFetch && path !== null,
  });
}

export function useSearchMemory() {
  return useMutation({
    mutationFn: async (body: MemorySearchRequest): Promise<MemorySearchResult[]> => {
      const res = await api
        .post("memory/search", { json: { query: body.query, limit: body.limit ?? 20 } })
        .json<MemorySearchApiResponse | MemorySearchResult[]>();
      if (Array.isArray(res)) return res;
      return (res.results ?? []).map((h) => ({
        path: h.path,
        snippet: h.content,
      }));
    },
  });
}

export function useWriteMemory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: MemoryWriteRequest) => api.post("memory/write", { json: body }).json<void>(),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: memoryKeys.file(vars.path) });
      qc.invalidateQueries({ queryKey: memoryKeys.tree() });
    },
  });
}
