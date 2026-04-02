import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AppConfig } from "../lib/api";
import { configApi } from "../lib/api";

export function useConfig() {
  return useQuery({
    queryKey: ["config"],
    queryFn: () => configApi.get(),
    retry: false,
  });
}

export function useUpdateConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<AppConfig>) => configApi.update(data),
    onSuccess: (updated) => {
      qc.setQueryData(["config"], updated);
    },
  });
}
