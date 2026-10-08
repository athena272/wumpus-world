import { ApiError } from './ApiError';
import type { ErrorResponse } from './types';

export interface HttpClientOptions {
  readonly baseUrl: string;
  readonly timeoutMs: number;
  readonly fetchImpl?: typeof fetch;
}

export interface HttpClient {
  postJson<T>(path: string, body: unknown, signal?: AbortSignal): Promise<T>;
}

export function createHttpClient({
  baseUrl,
  timeoutMs,
  fetchImpl = (...args) => fetch(...args),
}: HttpClientOptions): HttpClient {
  const root = baseUrl.replace(/\/+$/, '');

  return {
    async postJson<T>(path: string, body: unknown, signal?: AbortSignal): Promise<T> {
      const controller = new AbortController();
      let timedOut = false;
      const timer = setTimeout(() => {
        timedOut = true;
        controller.abort();
      }, timeoutMs);
      const forwardAbort = () => controller.abort();
      signal?.addEventListener('abort', forwardAbort, { once: true });
      if (signal?.aborted) controller.abort();

      try {
        const response = await fetchImpl(`${root}${path}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: controller.signal,
        });
        const text = await response.text();
        if (!response.ok) throw httpError(response.status, tryParseJson(text));
        return parseJson(text, response.status) as T;
      } catch (error) {
        if (error instanceof ApiError) throw error;
        if (controller.signal.aborted) {
          throw timedOut
            ? new ApiError('Tempo esgotado', { kind: 'timeout', cause: error })
            : new ApiError('Requisição cancelada', { kind: 'aborted', cause: error });
        }
        throw new ApiError('Falha de rede', { kind: 'network', cause: error });
      } finally {
        clearTimeout(timer);
        signal?.removeEventListener('abort', forwardAbort);
      }
    },
  };
}

function parseJson(text: string, status: number): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch (cause) {
    throw new ApiError('JSON inválido', { kind: 'invalid_response', status, cause });
  }
}

function tryParseJson(text: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return undefined;
  }
}

function httpError(status: number, payload: unknown): ApiError {
  const error = isErrorResponse(payload) ? payload.error : null;
  return new ApiError(error?.message ?? `Erro HTTP ${status}`, {
    kind: 'http',
    status,
    code: error?.code,
    details: error?.details,
  });
}

function isErrorResponse(payload: unknown): payload is ErrorResponse {
  if (typeof payload !== 'object' || payload === null || !('error' in payload)) return false;
  const { error } = payload;
  return typeof error === 'object' && error !== null && 'message' in error;
}
