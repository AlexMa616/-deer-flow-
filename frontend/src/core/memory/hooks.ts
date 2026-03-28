import { useQuery } from "@tanstack/react-query";

import { loadMemory } from "./api";

export function useMemory() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["memory"],
    queryFn: () => loadMemory(),
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 10 * 60 * 1000,
  });
  return { memory: data ?? null, isLoading, error };
}
