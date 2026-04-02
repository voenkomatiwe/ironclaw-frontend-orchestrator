import { useCallback, useState } from "react";
import { authApi } from "../lib/api";
import { clearAuthToken, getAuthToken, setAuthToken } from "../lib/auth-token";

export function useAuth() {
  const [token, setTokenState] = useState<string | null>(() => getAuthToken());

  const login = useCallback(async (password: string) => {
    const res = await authApi.login(password);
    setAuthToken(res.token);
    setTokenState(res.token);
  }, []);

  const logout = useCallback(() => {
    clearAuthToken();
    setTokenState(null);
  }, []);

  return { token, isLoggedIn: !!token, login, logout };
}
