# IronClaw / Channels — HTTP API Reference

JSON bodies unless noted. Typical error responses: `4xx`/`5xx` with a plain-text or JSON error body (gateway-dependent).

---

## Authentication (Web Gateway)

| Mechanism | Usage |
|-----------|--------|
| Header | `Authorization: Bearer <token>` |
| Query | `?token=<token>` — **SSE and WebSocket only** |

---

## HTTP webhook channel

### `GET /health`

**Response:** `200 OK` — health probe.

### `POST /webhook`

**Headers (verification):** `X-Hub-Signature-256: sha256=<HMAC-SHA256(secret, raw_body)>`

**Request body (typical):** JSON message envelope (gateway-specific). Optional synchronous mode: `wait_for_response: true` — response may include the agent reply in the HTTP body.

**Response:** `200 OK` — acknowledgment or, if waiting, agent response payload.

---

## Signal channel (SSE)

### `GET /signal/subscribe/:sender_id`

**Response:** `text/event-stream` — SSE subscription for that sender.

### `POST /signal/send/:sender_id`

**Request:** JSON message payload (gateway-specific).

**Response:** `200 OK` or error.

---

## Web Gateway — Chat

Rate limit (typical): **30 requests / 60s** on chat routes.

### `POST /api/chat/send`

**Request:**

```json
{
  "content": "string",
  "thread_id": "uuid-string | null",
  "timezone": "IANA string | null",
  "images": [{ "data": "base64", "media_type": "image/png" }]
}
```

**Response:**

```json
{
  "message_id": "uuid",
  "status": "string"
}
```

### `GET /api/chat/history`

**Query:** `thread_id` (optional — uses active thread if omitted), `limit` (optional), `before` (optional, RFC3339 cursor).

**Response:**

```json
{
  "thread_id": "uuid",
  "turns": [
    {
      "turn_number": 0,
      "user_input": "string",
      "response": "string | null",
      "state": "string",
      "started_at": "RFC3339",
      "completed_at": "RFC3339 | null",
      "tool_calls": [
        {
          "name": "string",
          "has_result": true,
          "has_error": false,
          "result_preview": "string | null",
          "error": "string | null",
          "rationale": "string | null"
        }
      ],
      "narrative": "string | null"
    }
  ],
  "has_more": false,
  "oldest_timestamp": "RFC3339 | null",
  "pending_approval": null
}
```

`pending_approval` when present:

```json
{
  "request_id": "string",
  "tool_name": "string",
  "description": "string",
  "parameters": "string"
}
```

### `GET /api/chat/threads`

**Response:**

```json
{
  "assistant_thread": { } | null,
  "threads": [ { } ],
  "active_thread": "uuid | null"
}
```

Thread object shape (typical):

```json
{
  "id": "uuid",
  "state": "string",
  "turn_count": 0,
  "created_at": "RFC3339",
  "updated_at": "RFC3339",
  "title": "string | null",
  "thread_type": "string | null",
  "channel": "string | null"
}
```

### `POST /api/chat/thread/new`

**Request:** empty body `{}`.

**Response:** single thread object (same shape as in `threads` list).

### `POST /api/chat/approval`

**Request:**

```json
{
  "request_id": "string",
  "action": "approve | deny | always",
  "thread_id": "uuid-string | null"
}
```

**Response:** same family as send acknowledgement (e.g. `message_id`, `status`).

### `POST /api/chat/auth-token`

**Request:**

```json
{
  "extension_name": "string",
  "token": "string"
}
```

**Response:** gateway-specific JSON or empty.

### `POST /api/chat/auth-cancel`

**Request:**

```json
{
  "extension_name": "string"
}
```

**Response:** gateway-specific JSON or empty.

### `GET /api/chat/events`

**Response:** `text/event-stream` — SSE; event `data` lines are JSON payloads. Common logical event types include: `Response`, `StreamChunk`, `Thinking`, `ToolStarted`, `ToolCompleted`, `ToolResult`, `Status`, job-related events, `ApprovalNeeded`, `AuthRequired`, `AuthCompleted`, `ExtensionStatus`, `Error`, `Heartbeat`.

### `GET /api/chat/ws`

**Protocol:** WebSocket (browser `Origin` rules apply).

**Client → server** (JSON frames; exact envelope tags follow gateway `serde` — typically tagged enum variants):

| Variant | Payload fields |
|---------|----------------|
| Message | `content`, optional `thread_id`, `timezone`, `images[]` (`data`, `media_type` per image) |
| Approval | `request_id`, `action`, optional `thread_id` |
| AuthToken | `extension_name`, `token` |
| AuthCancel | `extension_name` |
| Ping | none |

**Server → client:**

| Variant | Payload fields |
|---------|----------------|
| Event | `event_type`, `data` (arbitrary JSON — same family as SSE chat events) |
| Pong | — |
| Error | `message` |

---

## Web Gateway — Memory

### `GET /api/memory/tree`

**Response:**

```json
{
  "entries": [{ "path": "string", "is_dir": true }]
}
```

### `GET /api/memory/list`

**Query:** `path` (optional, directory to list).

**Response:**

```json
{
  "path": "string",
  "entries": [
    {
      "name": "string",
      "path": "string",
      "is_dir": false,
      "updated_at": "RFC3339 | null"
    }
  ]
}
```

### `GET /api/memory/read`

**Query:** `path` (required).

**Response:**

```json
{
  "path": "string",
  "content": "string",
  "updated_at": "RFC3339 | null"
}
```

### `POST /api/memory/write`

**Request:**

```json
{
  "path": "string",
  "content": "string",
  "layer": "string | null",
  "append": false,
  "force": false
}
```

**Response:**

```json
{
  "path": "string",
  "status": "written",
  "redirected": true,
  "actual_layer": "string"
}
```

(Optional fields depend on layer / redirect behaviour.)

### `POST /api/memory/search`

**Request:**

```json
{
  "query": "string",
  "limit": 10
}
```

**Response:**

```json
{
  "results": [
    {
      "path": "string",
      "content": "string",
      "score": 0.0
    }
  ]
}
```

---

## Web Gateway — Jobs

### `GET /api/jobs`

**Response:** JSON array of job summaries (gateway-specific fields; includes `id`, `state`, etc.).

### `GET /api/jobs/summary`

**Response:** aggregate counts / stats object.

### `GET /api/jobs/{id}`

**Response (typical):**

```json
{
  "id": "uuid",
  "title": "string",
  "state": "string",
  "project_dir": "string | null",
  "can_restart": true,
  "can_prompt": true
}
```

### `GET /api/jobs/{id}/events`

**Response:** `text/event-stream`.

### `GET /api/jobs/{id}/files/list`

**Query:** `path` — relative directory under sandbox.

**Response:** directory listing (gateway-specific JSON).

### `GET /api/jobs/{id}/files/read`

**Query:** `path` (required).

**Response:** file content / metadata (gateway-specific JSON or raw).

### `POST /api/jobs/{id}/cancel`

**Response:** status JSON.

### `POST /api/jobs/{id}/restart`

**Response:** status JSON.

### `POST /api/jobs/{id}/prompt`

**Request:** JSON body with prompt text / fields per gateway.

**Response:** status JSON.

---

## Web Gateway — Extensions

### `GET /api/extensions`

**Response:**

```json
{
  "extensions": [
    {
      "name": "string",
      "display_name": "string",
      "kind": "wasm_tool | wasm_channel | mcp_server | channel_relay",
      "description": "string | null",
      "authenticated": false,
      "active": false,
      "tools": ["string"],
      "needs_setup": false,
      "has_auth": false
    }
  ]
}
```

### `GET /api/extensions/tools`

**Response:** tools listing JSON.

### `GET /api/extensions/registry`

**Response:** registry entries JSON.

### `POST /api/extensions/install`

**Request:**

```json
{
  "name": "string",
  "url": "string | optional",
  "kind": "string | optional"
}
```

**Response:** action result (`success`, `message`, optional `auth_url`, etc.).

### `POST /api/extensions/{name}/activate`

**Response:** action result JSON.

### `POST /api/extensions/{name}/remove`

**Response:** action result JSON.

### `GET /api/extensions/{name}/setup`

### `POST /api/extensions/{name}/setup`

**Request (POST):** JSON map of secret/field values submitted by the client.

**Response (GET, typical):**

```json
{
  "name": "string",
  "kind": "string",
  "secrets": [
    {
      "name": "string",
      "prompt": "string",
      "optional": false,
      "provided": false,
      "auto_generate": false
    }
  ],
  "fields": []
}
```

`fields` may be omitted when empty.

---

## Web Gateway — Skills

### `GET /api/skills`

**Response:**

```json
{
  "skills": [
    {
      "name": "string",
      "version": "string",
      "trust": "string",
      "source": "string",
      "keywords": ["string"]
    }
  ],
  "count": 0
}
```

### `POST /api/skills/search`

**Request:**

```json
{
  "query": "string"
}
```

**Response:** same envelope as `GET /api/skills`.

### `POST /api/skills/install`

**Request:**

```json
{
  "name": "string",
  "url": "string | optional"
}
```

**Response:** gateway-specific.

### `DELETE /api/skills/{name}`

**Response:** gateway-specific.

---

## Web Gateway — Routines

### `GET /api/routines`

**Response:** list of routines.

### `GET /api/routines/summary`

**Response:** summary object.

### `GET /api/routines/{id}`

**Response:** routine detail.

### `GET /api/routines/{id}/runs`

**Response:** run history.

### `POST /api/routines/{id}/trigger`

**Response:** trigger acknowledgement.

### `POST /api/routines/{id}/toggle`

**Response:** updated state.

### `DELETE /api/routines/{id}`

**Response:** deletion acknowledgement.

---

## Web Gateway — Settings

### `GET /api/settings`

**Response:** map of all keys → values.

### `GET /api/settings/{key}`

**Response:** single setting value JSON.

### `PUT /api/settings/{key}`

**Request:** JSON value (scalar or object).

**Response:** acknowledgement.

### `DELETE /api/settings/{key}`

**Response:** acknowledgement.

### `GET /api/settings/export`

**Response:** full settings export JSON.

### `POST /api/settings/import`

**Request:**

```json
{
  "settings": {
    "some.key": "value"
  }
}
```

**Response:** acknowledgement.

---

## Web Gateway — LLM helpers

### `GET /api/llm/providers`

**Response:** JSON array of provider descriptors (`id`, `name`, `adapter`, `base_url`, flags, etc.).

### `POST /api/llm/test_connection`

**Request:**

```json
{
  "adapter": "string",
  "base_url": "string",
  "model": "string",
  "api_key": "string | optional",
  "provider_id": "string | optional",
  "provider_type": "builtin | custom | optional"
}
```

**Response:**

```json
{
  "ok": true,
  "message": "string"
}
```

### `POST /api/llm/list_models`

**Request:** same core fields as test_connection (gateway resolves provider).

**Response:**

```json
{
  "ok": true,
  "models": ["string"],
  "message": "string"
}
```

---

## Web Gateway — Admin (`admin` role)

### `POST /api/admin/users`

**Request / Response:** create user DTOs (gateway-specific).

### `GET /api/admin/users`

**Response:** user list.

### `GET /api/admin/users/{id}`

**Response:** single user.

### `PATCH /api/admin/users/{id}`

**Request:** partial profile / metadata.

**Response:** updated user.

### `DELETE /api/admin/users/{id}`

**Response:** acknowledgement.

### `POST /api/admin/users/{id}/suspend`

### `POST /api/admin/users/{id}/activate`

**Response:** acknowledgement.

### `GET /api/admin/usage`

**Response:** LLM usage statistics.

### `GET /api/admin/users/{user_id}/secrets`

**Response:** secret names.

### `PUT /api/admin/users/{user_id}/secrets/{name}`

**Request:** secret payload.

**Response:** acknowledgement.

### `DELETE /api/admin/users/{user_id}/secrets/{name}`

**Response:** acknowledgement.

---

## Web Gateway — Profile & tokens (self)

### `GET /api/profile`

**Response:** current user profile JSON.

### `PATCH /api/profile`

**Request:** display name / metadata fields.

**Response:** updated profile.

### `POST /api/tokens`

**Request:** create-token payload (label / scopes — gateway-specific).

**Response:** includes plaintext token **once**.

### `GET /api/tokens`

**Response:** list of tokens (no secrets).

### `DELETE /api/tokens/{id}`

**Response:** acknowledgement.

---

## Web Gateway — Other

### `GET /api/health`

**Response:** health JSON / `200 OK`.

### `GET /api/logs/events`

**Response:** `text/event-stream`.

### `GET /api/logs/level`

**Response:** current log level string / JSON.

### `PUT /api/logs/level`

**Request:** body sets levels (e.g. `ironclaw=info` style — gateway-specific).

**Response:** acknowledgement.

### `GET /api/pairing/{channel}`

**Response:** pairing payload (QR / code).

### `POST /api/pairing/{channel}/approve`

**Request:** approval payload.

**Response:** acknowledgement.

### `GET /api/gateway/status`

**Response (typical):**

```json
{
  "version": "string",
  "sse_connections": 0,
  "ws_connections": 0,
  "total_connections": 0,
  "uptime_secs": 0,
  "restart_enabled": false,
  "daily_cost": "string",
  "actions_this_hour": 0,
  "model_usage": [{ "model": "string", "count": 0 }],
  "llm_backend": "string",
  "llm_model": "string",
  "enabled_channels": ["string"]
}
```

### `GET /oauth/callback`

**Query:** OAuth parameters from provider.

**Response:** redirect / HTML — provider flow.

### `GET /v1/models`

**Response:** OpenAI-compatible models list JSON.

### `POST /v1/chat/completions`

**Request / Response:** OpenAI Chat Completions API shape.

### `GET /`

**Response:** SPA static assets.

### `GET /projects/{id}/*`

**Response:** static files for job workspace browser (when enabled).
