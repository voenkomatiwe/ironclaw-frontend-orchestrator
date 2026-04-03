export type MemoryNodeType = "file" | "directory";

export type MemoryTreeNode = {
  name: string;
  path: string;
  type: MemoryNodeType;
  children?: MemoryTreeNode[];
};

export type MemoryTreeApiEntry = {
  path: string;
  is_dir: boolean;
};

export type MemoryTreeApiResponse = {
  entries: MemoryTreeApiEntry[];
};

export type MemorySearchApiHit = {
  path: string;
  content: string;
  score: number;
};

export type MemorySearchApiResponse = {
  results: MemorySearchApiHit[];
};

export type MemoryReadResponse = {
  path: string;
  content: string;
  mimeType?: string;
};

export type MemoryWriteRequest = {
  path: string;
  content: string;
};

export type MemorySearchRequest = {
  query: string;
  limit?: number;
};

export type MemorySearchResult = {
  path: string;
  snippet: string;
};
