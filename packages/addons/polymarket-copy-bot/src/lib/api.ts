import ky, { HTTPError } from "ky";

/**
 * Workspace-memory-backed API layer for the Polymarket Copy Bot.
 *
 * All data lives in IronClaw workspace files:
 *   - SPAGETTI_ANECDOTE.md  → private key (hex in code fence)
 *   - bot/config.md         → BotConfig  (JSON in ```json``` fence)
 *   - bot/status.md         → BotStatus  (JSON in ```json``` fence)
 *   - bot/trades.md         → TradeRecord[] (JSON in ```json``` fence)
 *
 * The Vite proxy injects the gateway Bearer token automatically,
 * so we don't need any auth header logic here.
 */

const gw = ky.create({
  prefixUrl: "/api",
  timeout: 15_000,
});

// ── Error formatting ─────────────────────────────────────────────────────

export async function formatApiError(error: unknown): Promise<string> {
  if (error instanceof HTTPError) {
    try {
      const body = (await error.response.clone().json()) as { error?: string };
      return body.error ?? error.message;
    } catch {
      return error.message;
    }
  }
  if (error instanceof Error) return error.message;
  return "Something went wrong.";
}

// ── Workspace Memory primitives ──────────────────────────────────────────

/** Read a workspace file. Returns null if missing / 404. */
async function memoryRead(path: string): Promise<string | null> {
  try {
    const res = await gw.get("memory/read", { searchParams: { path } }).json<{ content?: string }>();
    return res.content ?? null;
  } catch (err) {
    if (err instanceof HTTPError && err.response.status === 404) return null;
    throw err;
  }
}

/** Write a workspace file. */
async function memoryWrite(path: string, content: string): Promise<void> {
  await gw.post("memory/write", { json: { path, content } });
}

/** Extract the first ```json … ``` block from markdown and parse it. */
function extractJsonBlock<T>(content: string): T | null {
  const match = content.match(/```json\s*\n([\s\S]*?)\n```/);
  if (!match?.[1]) return null;
  try {
    return JSON.parse(match[1]) as T;
  } catch {
    return null;
  }
}

/** Wrap a JS value as a titled markdown file with a JSON code fence. */
function wrapJsonBlock(title: string, data: unknown): string {
  return `# ${title}\n\n\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\`\n`;
}

// ── BotConfig  (bot/config.md) ───────────────────────────────────────────

export interface BotConfig {
  enabled?: boolean;
  targetWallet: string;
  alchemyWsUrl?: string;
  rpcUrl?: string;
  positionMultiplier?: number;
  maxTradeSize?: number;
  minTradeSize?: number;
  slippageTolerance?: number;
  orderType?: string;
  maxSessionNotional?: number;
  maxPerMarketNotional?: number;
}

const BOT_CONFIG_PATH = "bot/config.md";

export const configApi = {
  /** Read current config (null if not yet created). */
  get: async (): Promise<BotConfig | null> => {
    const raw = await memoryRead(BOT_CONFIG_PATH);
    if (!raw) return null;
    return extractJsonBlock<BotConfig>(raw);
  },

  /** Merge `data` into existing config and write back. */
  update: async (data: Partial<BotConfig>): Promise<void> => {
    const existing = (await configApi.get()) ?? ({} as Partial<BotConfig>);
    const merged = { ...existing, ...data };
    await memoryWrite(BOT_CONFIG_PATH, wrapJsonBlock("Bot Configuration", merged));
  },
};

// ── BotStatus  (bot/status.md) ───────────────────────────────────────────

export interface BotStatus {
  running: boolean;
  lastTick: number;
  lastProcessedOrderId: string | null;
  tradesDetected: number;
  tradesCopied: number;
  sessionPnL: number;
  sessionNotional: number;
  errors: string[];
}

const BOT_STATUS_PATH = "bot/status.md";

const DEFAULT_STATUS: BotStatus = {
  running: false,
  lastTick: 0,
  lastProcessedOrderId: null,
  tradesDetected: 0,
  tradesCopied: 0,
  sessionPnL: 0,
  sessionNotional: 0,
  errors: [],
};

export const statusApi = {
  get: async (): Promise<BotStatus> => {
    const raw = await memoryRead(BOT_STATUS_PATH);
    if (!raw) return DEFAULT_STATUS;
    return extractJsonBlock<BotStatus>(raw) ?? DEFAULT_STATUS;
  },

  update: async (data: Partial<BotStatus>): Promise<void> => {
    const existing = await statusApi.get();
    const merged = { ...existing, ...data };
    await memoryWrite(BOT_STATUS_PATH, wrapJsonBlock("Bot Status", merged));
  },
};

// ── TradeRecord  (bot/trades.md) ─────────────────────────────────────────

export interface TradeRecord {
  timestamp: number;
  sourceOrderId: string;
  marketId: string;
  side: string;
  size: number;
  price: number;
  result: "copied" | "failed" | "skipped";
  reason?: string;
}

const BOT_TRADES_PATH = "bot/trades.md";

export const tradesApi = {
  get: async (): Promise<TradeRecord[]> => {
    const raw = await memoryRead(BOT_TRADES_PATH);
    if (!raw) return [];
    return extractJsonBlock<TradeRecord[]>(raw) ?? [];
  },
};

// ── Private Key  (SPAGETTI_ANECDOTE.md) ──────────────────────────────────

const PRIVATE_KEY_PATH = "SPAGETTI_ANECDOTE.md";

export const walletApi = {
  /** Write a hex private key to SPAGETTI_ANECDOTE.md (WASM-compatible format). */
  writeKey: async (privateKey: string): Promise<void> => {
    const hex = privateKey.trim().replace(/^0x/, "");
    const content = [
      "# Copy-Bot Wallet Key",
      "",
      "> Auto-generated by the Polymarket Copy-Bot setup wizard.",
      "> This file is read by the WASM extension at runtime.",
      "",
      "```",
      hex,
      "```",
      "",
    ].join("\n");
    await memoryWrite(PRIVATE_KEY_PATH, content);
  },

  /** Check if a valid 64-char hex key exists in the file. */
  hasKey: async (): Promise<boolean> => {
    const raw = await memoryRead(PRIVATE_KEY_PATH);
    if (!raw) return false;
    return raw.split("\n").some((line) => /^(0x)?[0-9a-fA-F]{64}$/.test(line.trim()));
  },
};

// ── Extension / Secrets ──────────────────────────────────────────────────

const EXTENSION_NAME = "polymarket-copy-bot";

export const extensionApi = {
  /** Save a secret for the WASM extension (e.g. polygon_rpc_token). */
  saveSecret: async (name: string, value: string): Promise<void> => {
    try {
      await gw
        .post(`extensions/${encodeURIComponent(EXTENSION_NAME)}/setup`, {
          json: { secrets: { [name]: value }, fields: {} },
        })
        .json();
      return;
    } catch {
      // Extension setup endpoint may not exist — fall back to settings
    }
    try {
      await gw.put(`settings/${encodeURIComponent(`secrets.${name}`)}`, { json: { value } }).json();
    } catch {
      // Non-fatal — RPC URL is also stored in bot config
    }
  },
};

// ── Setup completeness ──────────────────────────────────────────────────

export async function isSetupComplete(): Promise<boolean> {
  try {
    const cfg = await configApi.get();
    if (!cfg?.targetWallet) return false;
    return await walletApi.hasKey();
  } catch {
    return false;
  }
}
