import { useEffect, useRef } from 'react';
import type { Action } from '../../api/types';

export const ACTION_SHORTCUTS: Record<string, Action> = {
  a: 'turn_left',
  arrowleft: 'turn_left',
  d: 'turn_right',
  arrowright: 'turn_right',
  w: 'forward',
  arrowup: 'forward',
  g: 'grab',
  f: 'shoot',
  c: 'climb',
};

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
}

/** Global keyboard shortcuts for the player's actions, ignored while typing in a form. */
export function useActionShortcuts(enabled: boolean, onAction: (action: Action) => void): void {
  const onActionRef = useRef(onAction);

  useEffect(() => {
    onActionRef.current = onAction;
  }, [onAction]);

  useEffect(() => {
    if (!enabled) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.defaultPrevented || isTypingTarget(event.target)) return;
      const action = ACTION_SHORTCUTS[event.key.toLowerCase()];
      if (!action) return;
      event.preventDefault();
      onActionRef.current(action);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled]);
}
