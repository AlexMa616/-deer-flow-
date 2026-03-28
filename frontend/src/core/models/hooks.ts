import { useQuery } from "@tanstack/react-query";

import { loadModels } from "./api";

export function useModels({ enabled = true }: { enabled?: boolean } = {}) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["models"],
    queryFn: () => loadModels(),
    enabled,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 10 * 60 * 1000,
  });
  return { models: data ?? [], isLoading, error };
}
