/**
 * Gateway-side helpers: auto-install WASM extension and store secrets.
 *
 * All calls go through the Vite proxy (relative paths, no CORS).
 * The proxy injects the Bearer token automatically.
 */
import ky from "ky";

const gw = ky.create({ prefixUrl: "/api" });

const EXTENSION_NAME = "polymarket-copy-bot";
const WASM_URL = `${window.location.origin}/wasm/copy-bot.wasm`;

// ── WASM auto-install ────────────────────────────────────────────────────

type ExtensionEntry = {
  name: string;
  active: boolean;
  [key: string]: unknown;
};

type ExtensionsResponse = ExtensionEntry[] | { extensions: ExtensionEntry[] };

async function isExtensionInstalled(): Promise<boolean> {
  try {
    const res = await gw.get("extensions").json<ExtensionsResponse>();
    const list = Array.isArray(res) ? res : (res.extensions ?? []);
    return list.some((e) => e.name === EXTENSION_NAME);
  } catch {
    return false;
  }
}

/**
 * Ensure the copy-bot WASM extension is installed and activated on the
 * gateway. Safe to call multiple times — skips if already installed.
 */
export async function ensureWasmInstalled(): Promise<void> {
  if (await isExtensionInstalled()) return;

  await gw
    .post("extensions/install", {
      json: { name: EXTENSION_NAME, url: WASM_URL, kind: "wasm_tool" },
    })
    .json();

  try {
    await gw.post(`extensions/${EXTENSION_NAME}/activate`).json();
  } catch {
    // Activation may fail if already active — non-fatal.
  }
}
