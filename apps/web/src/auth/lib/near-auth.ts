import ky from "ky";

const NEAR_AI_BASE = "https://private.near.ai/v1";
const SIGN_MESSAGE = "Sign in to NEAR AI";
const SIGN_RECIPIENT = "agent.near.ai";

/** Generate a NEP-413 nonce: first 8 bytes = timestamp (ms, big-endian), remaining 24 = random. */
export function generateNonce(): Uint8Array {
  const nonce = new Uint8Array(32);
  const view = new DataView(nonce.buffer);
  view.setBigUint64(0, BigInt(Date.now()), false);
  crypto.getRandomValues(nonce.subarray(8));
  return nonce;
}

export function getSignMessageParams(nonce: Uint8Array) {
  return {
    message: SIGN_MESSAGE,
    recipient: SIGN_RECIPIENT,
    nonce,
  } as const;
}

export type NearSignedMessage = {
  accountId: string;
  publicKey: string;
  signature: string;
};

type AuthResponse = {
  token: string;
  session_id: string;
  expires_at: string;
  is_new_user: boolean;
};

type AgentInstance = {
  id: string;
  instance_id: string;
  name: string;
  dashboard_url: string;
  status: string;
  service_type: string;
};

type InstancesResponse = {
  items: AgentInstance[];
};

export type NearAuthResult = {
  apiUrl: string;
  token: string;
  accountId: string;
};

/** POST signed message to NEAR AI and return session token. */
async function authenticate(signed: NearSignedMessage, nonce: Uint8Array): Promise<AuthResponse> {
  return ky
    .post(`${NEAR_AI_BASE}/auth/near`, {
      json: {
        signed_message: {
          accountId: signed.accountId,
          publicKey: signed.publicKey,
          signature: signed.signature,
        },
        payload: {
          message: SIGN_MESSAGE,
          nonce: Array.from(nonce),
          recipient: SIGN_RECIPIENT,
        },
      },
    })
    .json<AuthResponse>();
}

/** Fetch agent instances using the session token, find the ironclaw dashboard_url. */
async function fetchGatewayCredentials(sessionToken: string): Promise<{ apiUrl: string; token: string }> {
  const res = await ky
    .get(`${NEAR_AI_BASE}/agents/instances`, {
      headers: { Authorization: `Bearer ${sessionToken}` },
    })
    .json<InstancesResponse>();

  const instance = res.items.find((i) => i.service_type === "ironclaw" && i.status === "active");

  if (!instance) {
    throw new Error("No active ironclaw instance found");
  }

  const url = new URL(instance.dashboard_url);
  const gatewayToken = url.searchParams.get("token");
  if (!gatewayToken) {
    throw new Error("Dashboard URL missing token parameter");
  }

  return {
    apiUrl: url.origin,
    token: gatewayToken,
  };
}

/** Full sign-in flow: authenticate → fetch instances → return gateway credentials. */
export async function signInWithNearAi(signed: NearSignedMessage, nonce: Uint8Array): Promise<NearAuthResult> {
  const auth = await authenticate(signed, nonce);
  const gateway = await fetchGatewayCredentials(auth.token);

  return {
    apiUrl: gateway.apiUrl,
    token: gateway.token,
    accountId: signed.accountId,
  };
}
