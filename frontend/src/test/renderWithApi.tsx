import { render, renderHook, type RenderOptions } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import type { GameApi } from '../api/gameApi';
import { GameApiProvider } from '../api/GameApiProvider';

function wrapperFor(api: GameApi) {
  return function Wrapper({ children }: { readonly children: ReactNode }) {
    return <GameApiProvider api={api}>{children}</GameApiProvider>;
  };
}

export function renderWithApi(ui: ReactElement, api: GameApi, options?: RenderOptions) {
  return render(ui, { wrapper: wrapperFor(api), ...options });
}

export function renderHookWithApi<Result>(hook: () => Result, api: GameApi) {
  return renderHook(hook, { wrapper: wrapperFor(api) });
}
