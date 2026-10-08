export type ApiErrorKind = 'http' | 'network' | 'timeout' | 'aborted' | 'invalid_response';

interface ApiErrorOptions {
  readonly kind: ApiErrorKind;
  readonly status?: number;
  readonly code?: string;
  readonly details?: readonly string[];
  readonly cause?: unknown;
}

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status: number | null;
  readonly code: string | null;
  readonly details: readonly string[];

  constructor(message: string, options: ApiErrorOptions) {
    super(message, { cause: options.cause });
    this.name = 'ApiError';
    this.kind = options.kind;
    this.status = options.status ?? null;
    this.code = options.code ?? null;
    this.details = options.details ?? [];
  }

  /** The server understood the request but refuses this game (finished or invalid). */
  get isRejectedGame(): boolean {
    return this.status === 409 || this.status === 422;
  }

  get isAborted(): boolean {
    return this.kind === 'aborted';
  }
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  const message = error instanceof Error ? error.message : 'Erro desconhecido';
  return new ApiError(message, { kind: 'network', cause: error });
}

/** Message in Portuguese for the person playing, never raw technical details. */
export function describeApiError(error: ApiError): string {
  switch (error.kind) {
    case 'timeout':
      return 'O servidor demorou demais para responder.';
    case 'network':
      return 'Não foi possível falar com o servidor. Verifique sua conexão.';
    case 'aborted':
      return 'A requisição foi cancelada.';
    case 'invalid_response':
      return 'O servidor respondeu num formato inesperado.';
    case 'http':
      if (error.status !== null && error.status >= 500) {
        return 'O servidor encontrou um erro inesperado.';
      }
      return error.message;
  }
}
