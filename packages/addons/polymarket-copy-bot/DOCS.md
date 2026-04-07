# copy-bot — API Reference

WASM tool package `copy-bot v0.1.0` for IronClaw.
Target: `wasm32-wasip2` | WIT world: `sandboxed-tool` (near:agent@0.3.0)

## Dependencies

| Crate | Version | Features | Purpose |
|---|---|---|---|
| serde | 1.0 | derive | JSON serialization |
| serde_json | 1.0 | — | JSON parsing |
| wit-bindgen | 0.41.0 | — | WIT interface bindings |
| k256 | 0.13 | ecdsa, arithmetic | secp256k1 ECDSA signing |
| sha3 | 0.10 | — | Keccak-256 hashing |
| sha2 | 0.10 | — | SHA-256 (HMAC) |
| hmac | 0.12 | — | HMAC-SHA256 |
| hex | 0.4 | alloc | Hex encode/decode |

---

## Exported Tool Interface

Implements `exports::near::agent::tool::Guest` (required by WIT `sandboxed-tool` world).

### `execute(req: Request) -> Response`

Main entry point called by IronClaw runtime on each tick (~2 min).

**Parameters** (JSON):

```json
{ "action": "tick" }
```

`action` is optional, defaults to `"tick"`.

**Returns** (JSON):

```json
{
  "status": "ok" | "skipped",
  "trades_detected": 3,
  "trades_copied": 2,
  "trades_skipped": 1,
  "session_notional": 150.50,
  "details": [ TradeRecord, ... ]
}
```

### `schema() -> String`

Returns JSON Schema for the `params` field.

### `description() -> String`

Returns human-readable tool description for LLM.

---

## Host Functions Used

Functions provided by IronClaw WASM runtime (imported via `near::agent::host`).

### `workspace_read(path: String) -> Option<String>`

Read a file from IronClaw workspace. Path must be relative, no `..`.

**Used for:**

| Path | Purpose |
|---|---|
| `SPAGETTI_ANECDOTE.md` | Private key (hex) |
| `bot/config.md` | Bot configuration (JSON block) |
| `bot/status.md` | Last tick state |
| `bot/trades.md` | Trade history |

### `http_request(method, url, headers_json, body, timeout_ms) -> Result<HttpResponse, String>`

Make an HTTP request through the host sandbox. Credentials injected by host, endpoints checked against allowlist.

**Allowed endpoints** (from capabilities.json):

| Host | Methods |
|---|---|
| `clob.polymarket.com` | GET, POST, DELETE |
| `gamma-api.polymarket.com` | GET |

### `tool_invoke(alias: String, params_json: String) -> Result<String, String>`

Invoke another IronClaw tool by alias.

**Configured aliases:**

| Alias | Real tool | Purpose |
|---|---|---|
| `memory_write` | `memory_write` | Persist bot state to workspace |
| `memory_read` | `memory_read` | Read workspace files |

### `secret_exists(name: String) -> bool`

Check if a named secret exists. WASM never reads the value.

**Allowed names:** `polygon_rpc_token`

### `log(level: LogLevel, message: String)`

Emit structured log. Rate-limited to 1000 entries/execution, 4KB/message.

### `now_millis() -> u64`

Current Unix timestamp in milliseconds.

---

## Internal Functions

### Core Logic

#### `execute_inner(params: &str, context: Option<&str>) -> Result<String, String>`

Orchestrates the full tick cycle:
1. Read config, check `enabled`
2. Read status (or use default)
3. Read private key from `SPAGETTI_ANECDOTE.md`
4. Parse signing key, derive Ethereum address
5. Derive CLOB API credentials via EIP-712 auth
6. Fetch target wallet orders
7. Filter new orders since last processed ID
8. Mirror each order (with multiplier, size clamp, notional check)
9. Persist updated status and trade history

---

### Workspace I/O

#### `read_private_key() -> Result<String, String>`

Reads `SPAGETTI_ANECDOTE.md` via `workspace_read`. Parses out a 64-char hex string (ignoring markdown headers, blank lines, code fences). Strips optional `0x` prefix.

**Errors:** file missing, no valid 64-char hex line found.

#### `read_bot_config() -> Result<BotConfig, String>`

Reads `bot/config.md`, extracts the first ` ```json ``` ` block, parses into `BotConfig`.

#### `read_bot_status() -> BotStatus`

Reads `bot/status.md`. Returns `BotStatus::default()` if missing or unparseable.

#### `write_bot_status(status: &BotStatus)`

Serializes `BotStatus` to JSON, wraps in markdown code fence, writes to `bot/status.md` via `tool_invoke("memory_write", ...)`.

#### `append_trades(trades: &[TradeRecord])`

Reads existing `bot/trades.md`, appends new trades, keeps last 500 entries, writes back via `tool_invoke("memory_write", ...)`.

#### `extract_json_block<T: DeserializeOwned>(content: &str) -> Option<T>`

Finds first ` ```json\n...\n``` ` block in markdown content and deserializes it.

---

### Polymarket CLOB API

#### `derive_api_credentials(signing_key, address, timestamp) -> Result<DerivedApiCredentials, String>`

Derives CLOB API key, secret, and passphrase:
1. Build EIP-712 `ClobAuth` struct (address, timestamp, nonce, message)
2. Compute domain separator (`ClobAuthDomain`, version `"1"`, chainId `137`)
3. Sign with secp256k1 private key
4. POST to `https://clob.polymarket.com/auth/derive-api-key`
5. Parse response into `DerivedApiCredentials { api_key, secret, passphrase }`

**EIP-712 type:** `ClobAuth(address address, uint256 timestamp, uint256 nonce, string message)`

#### `fetch_target_orders(target, creds, address, timestamp) -> Result<Vec<ClobOrder>, String>`

GET `https://clob.polymarket.com/data/orders?maker={target}` with HMAC-signed auth headers.

Returns list of `ClobOrder`.

#### `filter_new_orders(orders, last_id) -> Vec<ClobOrder>`

Filters orders to only those after `last_processed_order_id`. If `last_id` is `None` or not found in results (gap recovery), returns all orders.

#### `place_order(signing_key, address, creds, token_id, side, price, size, slippage, timestamp) -> Result<String, String>`

Places a mirror order on Polymarket:
1. Encode side (BUY=0, SELL=1)
2. Apply slippage to price (+slippage for BUY, -slippage for SELL), clamp to [0.001, 0.999]
3. Calculate `maker_amount` (USDC, 6 decimals) and `taker_amount` (shares, 6 decimals)
4. Generate salt from timestamp
5. Sign CTF Exchange EIP-712 order
6. POST to `https://clob.polymarket.com/order` with HMAC auth

**Order type:** FOK (Fill or Kill)

#### `sign_ctf_order(signing_key, salt, maker, token_id, maker_amount, taker_amount, side) -> Result<Vec<u8>, String>`

Signs an EIP-712 typed order for the Polymarket CTF Exchange contract.

**Domain:** `Polymarket CTF Exchange`, version `"1"`, chainId `137`, verifyingContract `0x4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982E`

**Type:** `Order(uint256 salt, address maker, address signer, address taker, uint256 tokenId, uint256 makerAmount, uint256 takerAmount, uint256 expiration, uint256 nonce, uint256 feeRateBps, uint8 side, uint8 signatureType)`

Returns 65-byte Ethereum signature (r || s || v).

#### `clob_auth_headers(address, api_key, passphrase, hmac_sig, timestamp) -> serde_json::Value`

Builds CLOB API authentication headers JSON:

| Header | Value |
|---|---|
| `POLY-ADDRESS` | `0x{address}` |
| `POLY-SIGNATURE` | HMAC signature (base64) |
| `POLY-TIMESTAMP` | Unix timestamp (seconds) |
| `POLY-NONCE` | `"0"` |
| `POLY-API-KEY` | Derived API key |
| `POLY-PASSPHRASE` | Derived passphrase |

#### `hmac_sign(secret_b64, timestamp, method, path, body) -> Result<String, String>`

Computes HMAC-SHA256 signature for CLOB API request authentication.

**Message format:** `{timestamp}\n{method}\n{path}\n{body}`

**Process:** base64-decode secret -> HMAC-SHA256(secret, message) -> base64-encode result

---

### HTTP Helpers

#### `http_get(url, headers_json) -> Result<String, String>`

GET request with retry logic (up to 3 attempts). Retries on 429 (rate limit) and 5xx (server error). Timeout: 30 seconds.

#### `http_post(url, headers_json, body) -> Result<String, String>`

POST request with identical retry logic.

---

### Cryptography

#### `type SigningKey = k256::ecdsa::SigningKey`

Type alias for the secp256k1 ECDSA signing key.

#### `parse_signing_key(hex_str: &str) -> Result<SigningKey, String>`

Parses a hex-encoded 32-byte private key into a `SigningKey`.

#### `derive_address(key: &SigningKey) -> String`

Derives Ethereum address from signing key:
1. Get uncompressed public key (65 bytes: `0x04 || x || y`)
2. Keccak-256 hash the 64 bytes after the `0x04` prefix
3. Take last 20 bytes of hash
4. Return as lowercase hex string (without `0x` prefix)

#### `sign_digest(key: &SigningKey, digest: &[u8; 32]) -> Result<Vec<u8>, String>`

Signs a 32-byte digest with secp256k1 ECDSA (prehash). Returns 65-byte Ethereum-compatible signature: `r (32) || s (32) || v (1)` where `v = recovery_id + 27`.

Uses `PrehashSigner` trait from `k256::ecdsa::signature::hazmat`.

#### `keccak256(data: &[u8]) -> [u8; 32]`

Computes Keccak-256 hash using `sha3::Keccak256`.

#### `eip712_domain_separator(name, version, chain_id, verifying_contract) -> [u8; 32]`

Computes EIP-712 domain separator hash.

**With contract:**
`keccak256(typeHash || keccak256(name) || keccak256(version) || chainId || verifyingContract)`

**Without contract:**
`keccak256(typeHash || keccak256(name) || keccak256(version) || chainId)`

---

### Encoding Helpers

#### `hex_decode(s: &str) -> Result<Vec<u8>, String>`

Hex string to bytes (delegates to `hex` crate).

#### `hex_encode(data: &[u8]) -> String`

Bytes to lowercase hex string (delegates to `hex` crate).

#### `u256_bytes(val: u64) -> [u8; 32]`

Encodes a `u64` as big-endian 32-byte ABI value (zero-padded left).

#### `u256_from_u128(val: u128) -> [u8; 32]`

Encodes a `u128` as big-endian 32-byte ABI value (zero-padded left).

#### `pad_left_32(data: &[u8]) -> [u8; 32]`

Left-pads arbitrary bytes to 32 bytes (ABI encoding for addresses, etc.).

#### `base64_encode(data: &[u8]) -> String`

RFC 4648 base64 encoding (custom implementation, no external dependency).

#### `base64_decode(s: &str) -> Result<Vec<u8>, String>`

RFC 4648 base64 decoding. Strips trailing `=` padding before decode.

---

### Logging Helpers

#### `log_debug(msg: &str)`

Emits debug-level log via host.

#### `log_warn(msg: &str)`

Emits warn-level log via host.

#### `log_error(msg: &str)`

Emits error-level log via host.

---

## Data Types

### `BotConfig`

Bot configuration read from `bot/config.md`.

| Field | JSON key | Type | Default | Description |
|---|---|---|---|---|
| `enabled` | `enabled` | `Option<bool>` | — | Enable/disable bot |
| `target_wallet` | `targetWallet` | `String` | required | Wallet address to copy |
| `position_multiplier` | `positionMultiplier` | `Option<f64>` | 1.0 | Size multiplier |
| `max_trade_size` | `maxTradeSize` | `Option<f64>` | 100.0 | Max single trade (USDC) |
| `min_trade_size` | `minTradeSize` | `Option<f64>` | 1.0 | Min single trade (USDC) |
| `slippage_tolerance` | `slippageTolerance` | `Option<f64>` | 0.02 | Slippage tolerance (0-1) |
| `order_type` | `orderType` | `Option<String>` | — | Order type (FOK/FAK/LIMIT) |
| `max_session_notional` | `maxSessionNotional` | `Option<f64>` | 10000.0 | Max session exposure |
| `max_per_market_notional` | `maxPerMarketNotional` | `Option<f64>` | — | Max per-market exposure |

### `BotStatus`

Persisted state between ticks (`bot/status.md`).

| Field | JSON key | Type | Default |
|---|---|---|---|
| `running` | `running` | `bool` | false |
| `last_tick` | `lastTick` | `u64` | 0 |
| `last_processed_order_id` | `lastProcessedOrderId` | `Option<String>` | None |
| `trades_detected` | `tradesDetected` | `u64` | 0 |
| `trades_copied` | `tradesCopied` | `u64` | 0 |
| `session_pnl` | `sessionPnL` | `f64` | 0.0 |
| `session_notional` | `sessionNotional` | `f64` | 0.0 |
| `errors` | `errors` | `Vec<String>` | [] |

### `ClobOrder`

Order record from Polymarket CLOB API response.

| Field | JSON key | Type |
|---|---|---|
| `id` | `id` | `Option<String>` |
| `market_id` | `market` | `Option<String>` |
| `asset_id` | `asset_id` | `Option<String>` |
| `side` | `side` | `Option<String>` |
| `size` | `original_size` | `Option<String>` |
| `price` | `price` | `Option<String>` |
| `status` | `status` | `Option<String>` |
| `created_at` | `created_at` | `Option<String>` |
| `associate_trades` | `associate_trades` | `Option<Value>` |

### `TradeRecord`

Record of a mirror trade attempt.

| Field | JSON key | Type |
|---|---|---|
| `timestamp` | `timestamp` | `u64` |
| `source_order_id` | `sourceOrderId` | `String` |
| `market_id` | `marketId` | `String` |
| `side` | `side` | `String` |
| `size` | `size` | `f64` |
| `price` | `price` | `f64` |
| `result` | `result` | `String` — `"copied"` / `"failed"` / `"skipped"` |
| `reason` | `reason` | `Option<String>` |

### `DerivedApiCredentials`

Credentials returned by `/auth/derive-api-key`.

| Field | JSON key | Type |
|---|---|---|
| `api_key` | `apiKey` | `String` |
| `secret` | `secret` | `String` |
| `passphrase` | `passphrase` | `String` |

### `TickParams`

Input parameters for `execute`.

| Field | Type | Description |
|---|---|---|
| `action` | `Option<String>` | `"tick"` (default) |

---

## Constants

| Name | Value | Description |
|---|---|---|
| `CLOB_BASE` | `https://clob.polymarket.com` | CLOB API base URL |
| `GAMMA_BASE` | `https://gamma-api.polymarket.com` | Gamma API base URL |
| `CTF_EXCHANGE` | `4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982E` | CTF Exchange contract (Polygon) |
| `CHAIN_ID` | `137` | Polygon PoS chain ID |
| `CLOB_AUTH_DOMAIN` | `ClobAuthDomain` | EIP-712 domain for auth |
| `CTF_EXCHANGE_DOMAIN` | `Polymarket CTF Exchange` | EIP-712 domain for orders |
| `MAX_RETRIES` | `3` | HTTP retry attempts |

---

## Capabilities (copy-bot.capabilities.json)

### workspace_read

Allowed prefixes: `SPAGETTI_ANECDOTE`, `bot/`

### http

| Host | Path | Methods | Credential |
|---|---|---|---|
| `clob.polymarket.com` | `*` | GET, POST, DELETE | — (HMAC in headers) |
| `gamma-api.polymarket.com` | `/` | GET | — |
| `*.g.alchemy.com` | `*` | `*` | `polygon_rpc_token` (Basic) |
| `*.quiknode.pro` | `*` | `*` | `polygon_rpc_token` (Basic) |
| `*.infura.io` | `*` | `*` | `polygon_rpc_token` (Basic) |
| `*.polygon-rpc.com` | `*` | `*` | `polygon_rpc_token` (Basic) |

Rate limit: 60 req/min, 1800 req/hour.

### tool_invoke

Aliases: `memory_write` -> `memory_write`, `memory_read` -> `memory_read`. Rate limit: 30/min.

### secrets

Allowed names: `polygon_rpc_token`
