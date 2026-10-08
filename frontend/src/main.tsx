import '@fontsource-variable/fredoka';
import '@fontsource-variable/jetbrains-mono';
import '@fontsource-variable/nunito';
import { Analytics } from '@vercel/analytics/react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { createHttpGameApi } from './api/gameApi';
import { GameApiProvider } from './api/GameApiProvider';
import { createHttpClient } from './api/httpClient';
import { API_BASE_URL, REQUEST_TIMEOUT_MS } from './config';
import './styles/global.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element "#root" not found in index.html');
}

const api = createHttpGameApi(
  createHttpClient({ baseUrl: API_BASE_URL, timeoutMs: REQUEST_TIMEOUT_MS }),
);

createRoot(rootElement).render(
  <StrictMode>
    <GameApiProvider api={api}>
      <App />
    </GameApiProvider>
    <Analytics />
  </StrictMode>,
);
