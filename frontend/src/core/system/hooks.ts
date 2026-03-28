import { useQuery } from "@tanstack/react-query";

import { fetchSystemOverview } from "./api";

export function useSystemOverview() {
  return useQuery({
    queryKey: ["system", "overview"],
    queryFn: () => fetchSystemOverview(),
    refetchInterval: false,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}
