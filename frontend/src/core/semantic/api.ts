/**
 * Semantic search API
 */

import { requestJSON } from "../api";
import { getBackendBaseURL } from "../config";

export type SemanticSource = "upload" | "memory";
export type SemanticSourceFilter = "all" | SemanticSource;

export interface SemanticSearchParams {
  query: string;
  threadId?: string | null;
  source?: SemanticSourceFilter;
  topK?: number;
}

export interface SemanticSearchResult {
  score: number;
  source: string;
  thread_id: string;
  filename: string;
  chunk_index: number;
  excerpt: string;
  metadata: Record<string, unknown>;
  citation: Record<string, unknown>;
}

export interface SemanticSearchResponse {
  query: string;
  results: SemanticSearchResult[];
}

export interface SemanticReindexRequest {
  source?: "all" | SemanticSource;
  thread_id?: string | null;
}

export interface SemanticReindexResponse {
  indexed: number;
  source: string;
  thread_id?: string | null;
}

export async function semanticSearch(
  params: SemanticSearchParams,
): Promise<SemanticSearchResponse> {
  const searchParams = new URLSearchParams();
  searchParams.set("query", params.query);
  if (params.threadId) {
    searchParams.set("thread_id", params.threadId);
  }
  if (params.source && params.source !== "all") {
    searchParams.set("source", params.source);
  }
  if (params.topK) {
    searchParams.set("top_k", String(params.topK));
  }

  return requestJSON<SemanticSearchResponse>(
    `${getBackendBaseURL()}/api/semantic/search?${searchParams.toString()}`,
  );
}

export async function semanticReindex(
  payload: SemanticReindexRequest,
): Promise<SemanticReindexResponse> {
  return requestJSON<SemanticReindexResponse>(
    `${getBackendBaseURL()}/api/semantic/reindex`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
}
