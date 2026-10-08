import { describe, expect, it } from 'vitest';
import { createSafeStore } from './storage';

function throwingStorage(): Storage {
  const fail = () => {
    throw new Error('blocked');
  };
  return {
    length: 0,
    clear: fail,
    getItem: fail,
    key: fail,
    removeItem: fail,
    setItem: fail,
  };
}

describe('createSafeStore', () => {
  it('reads, writes and removes through localStorage', () => {
    const store = createSafeStore();
    store.write('k', 'v');
    expect(window.localStorage.getItem('k')).toBe('v');
    expect(store.read('k')).toBe('v');
    store.remove('k');
    expect(store.read('k')).toBeNull();
  });

  it('does not resurrect a value removed from localStorage by someone else', () => {
    const store = createSafeStore();
    store.write('k', 'v');
    window.localStorage.removeItem('k');
    expect(store.read('k')).toBeNull();
  });

  it('keeps working in memory when the storage throws', () => {
    const store = createSafeStore(throwingStorage);
    store.write('k', 'v');
    expect(store.read('k')).toBe('v');
    store.remove('k');
    expect(store.read('k')).toBeNull();
  });

  it('keeps working when the storage cannot even be resolved', () => {
    const store = createSafeStore(() => {
      throw new Error('SecurityError');
    });
    store.write('k', 'v');
    expect(store.read('k')).toBe('v');
  });
});
