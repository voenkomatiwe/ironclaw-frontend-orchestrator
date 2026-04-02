import ky, { HTTPError } from "ky";
import { clearAuthToken, getAuthToken, redirectToAddonAuth } from "./auth-token";

const api = ky.create({
  prefixUrl: "/api",
  hooks: {
    beforeRequest: [
      (request: Request) => {
        const token = getAuthToken();
        if (token) request.headers.set("Authorization", `Bearer ${token}`);
      },
    ],
    afterResponse: [
      async (request: Request, _options: unknown, response: Response) => {
        if (response.status === 401 && request.headers.get("Authorization")) {
          clearAuthToken();
          redirectToAddonAuth();
        }
        return response;
      },
    ],
  },
});

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

// ── Auth ──────────────────────────────────────────────────────────────────

export const authApi = {
  status: () => api.get("auth/status").json<{ passwordSet: boolean }>(),
  setup: (password: string) => api.post("auth/setup", { json: { password } }),
  login: (password: string) => api.post("auth/login", { json: { password } }).json<{ token: string }>(),
  wipe: () => api.post("auth/wipe"),
};

// ── Wallet ────────────────────────────────────────────────────────────────

export interface WalletGenResult {
  address: string;
  privateKey: string;
  mnemonic: string | null;
  warning: string;
}

export interface WalletBalance {
  walletAddress: string;
  maticBalance: string;
  usdcBalance: string;
}

export const walletApi = {
  generate: (password: string) => api.post("wallet/generate", { json: { password } }).json<WalletGenResult>(),
  import: (privateKey: string, password: string) =>
    api.post("wallet/import", { json: { privateKey, password } }).json<{ address: string }>(),
  export: (password: string) =>
    api.post("wallet/export", { json: { password } }).json<{ privateKey: string; address: string; warning: string }>(),
  balance: () => api.get("wallet/balance").json<WalletBalance>(),
};

// ── Config ────────────────────────────────────────────────────────────────

export interface AppConfig {
  walletAddress: string;
  targetWallet: string;
  rpcUrl: string;
  alchemyWsUrl: string;
  useAlchemy: boolean;
  positionMultiplier: number;
  maxTradeSize: number;
  minTradeSize: number;
  slippageTolerance: number;
  orderType: "FOK" | "FAK" | "LIMIT";
  maxSessionNotional: number;
  maxPerMarketNotional: number;
  pollInterval: number;
  useWebSocket: boolean;
  setupComplete: boolean;
  updatedAt: string;
}

export const configApi = {
  get: () => api.get("config").json<AppConfig>(),
  update: (data: Partial<AppConfig>) => api.put("config", { json: data }).json<AppConfig>(),
};

// ── Bot ───────────────────────────────────────────────────────────────────

export interface BotStatusPayload {
  status: "stopped" | "starting" | "running" | "stopping";
  startedAt: string | null;
  stats: { tradesDetected: number; tradesCopied: number; tradesFailed: number; totalVolume: number };
  walletAddress: string;
  setupComplete: boolean;
}

export interface CopiedTradeRecord {
  id: string;
  sourceTrade: TargetTrade;
  result: "success" | "failed" | "skipped";
  reason?: string;
  orderId?: string;
  copyNotional?: number;
  price?: number;
  executedAt: string;
}

export const botApi = {
  status: () => api.get("status").json<BotStatusPayload>(),
  start: (password: string) => api.post("bot/start", { json: { password } }),
  stop: () => api.post("bot/stop"),
  copiedTrades: () => api.get("trades/copied").json<CopiedTradeRecord[]>(),
};

// ── Proxy ─────────────────────────────────────────────────────────────────

export interface TargetTrade {
  transactionHash: string;
  timestamp: number;
  conditionId: string;
  asset: string;
  side: string;
  price: string;
  usdcSize: string;
  outcome: string;
  market?: string;
}

export const proxyApi = {
  targetTrades: (limit = 20) =>
    api.get("proxy/target-trades", { searchParams: { limit: String(limit) } }).json<TargetTrade[]>(),
  targetPositions: () => api.get("proxy/target-positions").json<unknown>(),
  ownPositions: () => api.get("proxy/own-positions").json<unknown>(),
};
