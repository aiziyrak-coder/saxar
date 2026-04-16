import { describe, it, expect, beforeEach, vi } from 'vitest';
import { clearApiSession, clearStoredAuthTokens } from './api';

describe('api session helpers', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('auth_token', 't1');
    localStorage.setItem('auth_refresh_token', 'r1');
  });

  it('clearStoredAuthTokens removes tokens without dispatching', () => {
    const spy = vi.spyOn(window, 'dispatchEvent');
    clearStoredAuthTokens();
    expect(localStorage.getItem('auth_token')).toBeNull();
    expect(localStorage.getItem('auth_refresh_token')).toBeNull();
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it('clearApiSession clears tokens and dispatches auth:session-expired', () => {
    const spy = vi.spyOn(window, 'dispatchEvent');
    clearApiSession();
    expect(localStorage.getItem('auth_token')).toBeNull();
    expect(localStorage.getItem('auth_refresh_token')).toBeNull();
    expect(spy).toHaveBeenCalled();
    const first = spy.mock.calls[0]?.[0];
    expect(first).toBeInstanceOf(CustomEvent);
    expect((first as CustomEvent).type).toBe('auth:session-expired');
    spy.mockRestore();
  });
});
