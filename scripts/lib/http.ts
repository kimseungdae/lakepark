/**
 * 공공 API 호출 공용 유틸. Node 24 내장 fetch만 사용한다 (외부 의존성 0).
 * 실패는 호출자가 잡아서 "기존 JSON 유지 + exit 0"으로 처리한다.
 */

const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_RETRIES = 2;

async function fetchWithRetry(url: string, timeoutMs: number, retries: number): Promise<Response> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
      if (!response.ok) throw new Error(`HTTP ${response.status} — ${url}`);
      return response;
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
      }
    }
  }
  throw lastError;
}

export async function fetchText(url: string, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<string> {
  const response = await fetchWithRetry(url, timeoutMs, DEFAULT_RETRIES);
  return response.text();
}

export async function fetchJson(url: string, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<unknown> {
  const response = await fetchWithRetry(url, timeoutMs, DEFAULT_RETRIES);
  return response.json();
}
