import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export interface ApiHealth {
  status: "ok";
  service: string;
  uptimeSeconds: number;
  timestamp: string;
}

/** Polls the API liveness endpoint; used for the status badge in the shell. */
export function useApiHealth() {
  return useQuery({
    queryKey: ["system", "health"],
    queryFn: () => apiFetch<ApiHealth>("/health"),
    refetchInterval: 30_000,
    retry: false,
  });
}
