import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { ApiError, api } from '../api/client';
import { setToken } from '../auth/token';
import { keys } from '../hooks/queries';

/** Sign-in screen: the user pastes a bearer token, the backend verifies it before any UI is shown. */
export function TokenGate() {
  const qc = useQueryClient();
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const submit = async () => {
    const token = value.trim().replace(/^Bearer\s+/i, '');
    if (!token || checking) return;
    setChecking(true);
    setError(null);
    try {
      const entitlements = await api.verifyToken(token);
      qc.setQueryData(keys.entitlements, entitlements);
      setToken(token);
    } catch (err) {
      setError(
        err instanceof ApiError && err.problem.status === 401
          ? 'This token is invalid or has expired.'
          : 'Could not verify the token. Please try again.',
      );
      setChecking(false);
    }
  };

  return (
    <div className="gate">
      <form
        className="gate__card"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <div className="brand gate__brand">
          <span className="brand__logo">◆</span> chatAI
        </div>
        <h1>Sign in</h1>
        <p>Paste your bearer token to continue.</p>
        <label htmlFor="token" className="gate__label">
          Bearer token
        </label>
        <textarea
          id="token"
          className="gate__input"
          rows={4}
          value={value}
          spellCheck={false}
          autoComplete="off"
          autoFocus
          placeholder="eyJhbGciOi…"
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              void submit();
            }
          }}
          aria-invalid={!!error}
          aria-describedby={error ? 'token-error' : undefined}
        />
        {error && (
          <p id="token-error" className="gate__error" role="alert">
            {error}
          </p>
        )}
        <button type="submit" className="gate__submit" disabled={!value.trim() || checking}>
          {checking ? 'Verifying…' : 'Continue'}
        </button>
        {import.meta.env.VITE_USE_MOCKS === 'true' && (
          <p className="gate__hint">
            Mock mode: use <code>demo-token</code>
          </p>
        )}
      </form>
    </div>
  );
}
