export interface KeyValueStore {
  read(key: string): string | null;
  write(key: string, value: string): void;
  remove(key: string): void;
}

function defaultBackend(): Storage | null {
  return typeof window === 'undefined' ? null : window.localStorage;
}

/**
 * localStorage wrapper that never throws: private modes, disabled storage or a
 * full quota fall back to an in-memory map so the session keeps working.
 * The map only holds values that could not be persisted, so it never shadows storage.
 */
export function createSafeStore(
  resolveBackend: () => Storage | null = defaultBackend,
): KeyValueStore {
  const memory = new Map<string, string>();

  const backend = (): Storage | null => {
    try {
      return resolveBackend();
    } catch {
      return null;
    }
  };

  return {
    read(key) {
      try {
        const value = backend()?.getItem(key);
        if (value !== null && value !== undefined) return value;
      } catch {
        // Unreadable storage: use the in-memory copy below.
      }
      return memory.get(key) ?? null;
    },
    write(key, value) {
      try {
        const storage = backend();
        if (storage) {
          storage.setItem(key, value);
          memory.delete(key);
          return;
        }
      } catch {
        // Quota exceeded or storage blocked: keep the in-memory copy below.
      }
      memory.set(key, value);
    },
    remove(key) {
      memory.delete(key);
      try {
        backend()?.removeItem(key);
      } catch {
        // Storage blocked: nothing else to clean up.
      }
    },
  };
}
