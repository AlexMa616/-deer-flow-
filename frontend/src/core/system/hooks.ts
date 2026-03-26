import { useQuery } from "@tanstack/react-query";

import { fetchSystemOverview } from "./api";

export function useSystemOverview() {
  return useQuery({
    queryKey: ["system", "overview"],
    queryFn: () => fetchSystemOverview(),
    refetchInterval: 15000,
    staleTime: 10000,
  });
}
