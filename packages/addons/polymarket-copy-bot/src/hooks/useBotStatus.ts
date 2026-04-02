import { useQuery } from "@tanstack/react-query";
import { botApi } from "../lib/api";

export function useBotStatus() {
  return useQuery({
    queryKey: ["bot-status"],
    queryFn: () => botApi.status(),
    refetchInterval: 2000,
    retry: false,
  });
}
