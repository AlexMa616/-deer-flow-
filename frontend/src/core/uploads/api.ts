/**
 * API functions for file uploads
 */

import { requestJSON } from "../api";
import { getBackendBaseURL } from "../config";

export interface UploadedFileInfo {
  filename: string;
  size: number;
  path: string;
  virtual_path: string;
  artifact_url: string;
  extension?: string;
  modified?: number;
  content_type?: string | null;
  checksum_sha256?: string | null;
  preview?: string | null;
  processing_job_id?: string | null;
  processing_status?: string | null;
  processing_progress?: number | null;
  markdown_file?: string;
  markdown_path?: string;
  markdown_virtual_path?: string;
  markdown_artifact_url?: string;
}

export interface UploadResponse {
  success: boolean;
  files: UploadedFileInfo[];
  message: string;
}

export interface ListFilesResponse {
  files: UploadedFileInfo[];
  count: number;
}

export interface UploadProcessingStatus {
  filename: string;
  job_id?: string | null;
  status: "queued" | "processing" | "completed" | "failed" | "cancelled";
  progress: number;
  steps: Record<string, string>;
  summary?: string | null;
  keywords?: string[];
  language?: string | null;
  highlights?: string[];
  markdown_file?: string | null;
  error?: string | null;
  updated_at?: string | null;
  events?: {
    time: string;
    level?: string;
    message: string;
  }[];
}

export interface UploadControlResponse {
  success: boolean;
  status: string;
  message: string;
}

/**
 * Upload files to a thread
 */
export async function uploadFiles(
  threadId: string,
  files: File[],
): Promise<UploadResponse> {
  const formData = new FormData();

  files.forEach((file) => {
    formData.append("files", file);
  });

  return requestJSON<UploadResponse>(
    `${getBackendBaseURL()}/api/threads/${threadId}/uploads`,
    {
      method: "POST",
      body: formData,
    },
  );
}

/**
 * List all uploaded files for a thread
 */
export async function listUploadedFiles(
  threadId: string,
): Promise<ListFilesResponse> {
  return requestJSON<ListFilesResponse>(
    `${getBackendBaseURL()}/api/threads/${threadId}/uploads/list`,
  );
}

/**
 * Delete an uploaded file
 */
export async function deleteUploadedFile(
  threadId: string,
  filename: string,
): Promise<{ success: boolean; message: string }> {
  return requestJSON<{ success: boolean; message: string }>(
    `${getBackendBaseURL()}/api/threads/${threadId}/uploads/${filename}`,
    {
      method: "DELETE",
    },
  );
}

/**
 * Fetch upload processing status for a single file
 */
export async function fetchUploadStatus(
  threadId: string,
  filename: string,
): Promise<UploadProcessingStatus | null> {
  const response = await requestJSON<UploadProcessingStatus[]>(
    `${getBackendBaseURL()}/api/threads/${threadId}/uploads/status?filename=${encodeURIComponent(
      filename,
    )}`,
  );
  return response[0] ?? null;
}

/**
 * Cancel an upload processing job
 */
export async function cancelUploadJob(
  threadId: string,
  filename: string,
): Promise<UploadControlResponse> {
  return requestJSON<UploadControlResponse>(
    `${getBackendBaseURL()}/api/threads/${threadId}/uploads/cancel`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename }),
    },
  );
}

/**
 * Retry an upload processing job
 */
export async function retryUploadJob(
  threadId: string,
  filename: string,
): Promise<UploadControlResponse> {
  return requestJSON<UploadControlResponse>(
    `${getBackendBaseURL()}/api/threads/${threadId}/uploads/retry`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename }),
    },
  );
}
