export interface RequestJSONOptions extends RequestInit {
  timeoutMs?: number;
  retries?: number;
}

const DEFAULT_TIMEOUT_MS = 15000;
const DEFAULT_RETRIES = 1;

export class HTTPError extends Error {
  status: number;
  url: string;

  constructor(message: string, status: number, url: string) {
    super(message);
    this.name = "HTTPError";
    this.status = status;
    this.url = url;
  }
}

function isRetryable(error: unknown): boolean {
  if (error instanceof HTTPError) {
    return error.status >= 500 || error.status === 429;
  }
  if (error instanceof TypeError) {
    return true;
  }
  return false;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function parseErrorMessage(response: Response): Promise<string> {
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const json = (await response.json().catch(() => null)) as
      | { detail?: string; message?: string; error?: string }
      | null;
    return (
      json?.detail ??
      json?.message ??
      json?.error ??
      `请求失败 (${response.status})`
    );
  }

  const text = await response.text().catch(() => "");
  return text.trim() || `请求失败 (${response.status})`;
}

export async function requestJSON<T>(
  url: string,
  options: RequestJSONOptions = {},
): Promise<T> {
  const {
    timeoutMs = DEFAULT_TIMEOUT_MS,
    retries = options.method ? 0 : DEFAULT_RETRIES,
    headers,
    ...init
  } = options;

  let attempt = 0;
  while (true) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...init,
        headers: {
          Accept: "application/json",
          ...headers,
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        const message = await parseErrorMessage(response);
        throw new HTTPError(message, response.status, url);
      }

      if (response.status === 204) {
        return {} as T;
      }

      const contentType = response.headers.get("content-type") ?? "";
      if (contentType.includes("application/json")) {
        return (await response.json()) as T;
      }

      return (await response.text()) as T;
    } catch (error) {
      const isTimeout = error instanceof DOMException && error.name === "AbortError";
      if (isTimeout) {
        throw new HTTPError(`请求超时（>${timeoutMs}ms）`, 408, url);
      }

      if (attempt < retries && isRetryable(error)) {
        attempt += 1;
        await sleep(250 * attempt);
        continue;
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }
}
