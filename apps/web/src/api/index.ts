import ky from "ky";

export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

// type AuthResponse = { token: string };
// async function refreshToken(): Promise<string | null> {
//   try {
//     const data = await ky.post(`${API_URL}/refresh-token`, { json: { token },}).json<AuthResponse>();
//     return data.token;
//   } catch {
//     return null;
//   }
// }

export const api = ky.create({
  prefixUrl: `${API_URL}/api/v1/`,
  timeout: 15000,
  retry: { limit: 2, statusCodes: [408, 429, 502, 503, 504] },
  // hooks: {
  //   beforeRequest: [
  //     (req) => {
  //       const token = useAppStore.getState().token;
  //       if (token) req.headers.set("Authorization", `Bearer ${token}`);
  //     },
  //   ],
  //   afterResponse: [
  //     async (req, _options, response) => {
  //       if (response.status !== 401) return response;
  //       // Token expired — try to get a fresh one and retry the request once
  //       const newToken = await refreshToken();
  //       if (!newToken) return response;
  //       req.headers.set("Authorization", `Bearer ${newToken}`);
  //       return ky(req);
  //     },
  //   ],
  // },
});
