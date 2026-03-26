/**
 * Semantic search hooks
 */

import { useMutation } from "@tanstack/react-query";

import {
  semanticReindex,
  semanticSearch,
  type SemanticReindexRequest,
  type SemanticReindexResponse,
  type SemanticSearchParams,
  type SemanticSearchResponse,
} from "./api";

export function useSemanticSearch() {
  return useMutation<SemanticSearchResponse, Error, SemanticSearchParams>({
    mutationFn: (params: SemanticSearchParams) => semanticSearch(params),
  });
}

export function useSemanticReindex() {
  return useMutation<SemanticReindexResponse, Error, SemanticReindexRequest>({
    mutationFn: (payload: SemanticReindexRequest) => semanticReindex(payload),
  });
}
