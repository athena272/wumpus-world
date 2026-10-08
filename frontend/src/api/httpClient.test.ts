import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, describeApiError } from './ApiError';
import { createHttpClient } from './httpClient';

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function catchError(promise: Promise<unknown>): Promise<ApiError> {
  try {
    await promise;
  } catch (error) {
    if (error instanceof ApiError) return error;
    throw error;
  }
  throw new Error('Expected the request to fail');
}

describe('createHttpClient', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('posts JSON to the base URL and returns the parsed body', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse(200, { ok: true }));
    const client = createHttpClient({ baseUrl: 'https://api.test/', timeoutMs: 1000, fetchImpl });

    await expect(client.postJson('/api/games/state', { a: 1 })).resolves.toEqual({ ok: true });

    const [url, init] = fetchImpl.mock.calls[0] ?? [];
    expect(url).toBe('https://api.test/api/games/state');
    expect(init?.method).toBe('POST');
    expect(init?.body).toBe('{"a":1}');
  });

  it('maps the standard error body of the API', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      jsonResponse(409, {
        error: { code: 'game_over', message: 'A partida já terminou.', details: [] },
      }),
    );
    const client = createHttpClient({ baseUrl: '', timeoutMs: 1000, fetchImpl });

    const error = await catchError(client.postJson('/x', {}));

    expect(error.kind).toBe('http');
    expect(error.status).toBe(409);
    expect(error.code).toBe('game_over');
    expect(error.isRejectedGame).toBe(true);
    expect(describeApiError(error)).toBe('A partida já terminou.');
  });

  it('hides server internals on 5xx errors, even when the body is not JSON', async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response('<html>Bad gateway</html>', { status: 502 }));
    const client = createHttpClient({ baseUrl: '', timeoutMs: 1000, fetchImpl });

    const error = await catchError(client.postJson('/x', {}));

    expect(error.kind).toBe('http');
    expect(error.status).toBe(502);
    expect(describeApiError(error)).toBe('O servidor encontrou um erro inesperado.');
  });

  it('rejects a successful response that is not JSON', async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response('oops', { status: 200 }));
    const client = createHttpClient({ baseUrl: '', timeoutMs: 1000, fetchImpl });

    const error = await catchError(client.postJson('/x', {}));

    expect(error.kind).toBe('invalid_response');
  });

  it('reports network failures', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockRejectedValue(new TypeError('Failed to fetch'));
    const client = createHttpClient({ baseUrl: '', timeoutMs: 1000, fetchImpl });

    const error = await catchError(client.postJson('/x', {}));

    expect(error.kind).toBe('network');
    expect(error.isRejectedGame).toBe(false);
  });

  it('aborts and reports a timeout when the server takes too long', async () => {
    vi.useFakeTimers();
    const fetchImpl = vi.fn<typeof fetch>(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            reject(new DOMException('Aborted', 'AbortError'));
          });
        }),
    );
    const client = createHttpClient({ baseUrl: '', timeoutMs: 500, fetchImpl });

    const pending = catchError(client.postJson('/x', {}));
    await vi.advanceTimersByTimeAsync(500);
    const error = await pending;

    expect(error.kind).toBe('timeout');
  });

  it('reports a cancellation requested by the caller', async () => {
    const fetchImpl = vi.fn<typeof fetch>(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            reject(new DOMException('Aborted', 'AbortError'));
          });
        }),
    );
    const client = createHttpClient({ baseUrl: '', timeoutMs: 5000, fetchImpl });
    const controller = new AbortController();

    const pending = catchError(client.postJson('/x', {}, controller.signal));
    controller.abort();
    const error = await pending;

    expect(error.isAborted).toBe(true);
  });
});
