/** Empty in development: Vite proxies `/api` to the local FastAPI server. */
export const API_BASE_URL = (import.meta.env.VITE_API_URL ?? '').trim();

/** Generous, because a sleeping serverless function may take a few seconds to wake up. */
export const REQUEST_TIMEOUT_MS = 20_000;

/** After this long, the loading message explains that the server may be waking up. */
export const SLOW_REQUEST_MS = 2_000;
