import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import { useAuth } from '../hooks/useAuth';

type VerifyStatus = 'checking' | 'valid' | 'invalid' | 'verifying' | 'error';

export function AuthVerify() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [status, setStatus] = useState<VerifyStatus>('checking');
  const [error, setError] = useState<string | null>(null);

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setStatus('invalid');
      setError('No token provided');
      return;
    }

    // Check if token is valid (GET request)
    apiFetch<{ valid: boolean; error?: string }>(`/auth/verify?token=${token}`)
      .then(data => {
        if (data.valid) {
          setStatus('valid');
        } else {
          setStatus('invalid');
          setError(data.error || 'Invalid token');
        }
      })
      .catch(() => {
        setStatus('invalid');
        setError('Failed to verify token');
      });
  }, [token]);

  const handleConfirm = async () => {
    setStatus('verifying');
    try {
      const data = await apiFetch<{ success: boolean; user: { id: number; email: string; name: string | null } }>(
        '/auth/verify',
        { method: 'POST', body: JSON.stringify({ token }) }
      );
      login(data.user);
      navigate('/dashboard');
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Failed to log in');
    }
  };

  if (status === 'checking') {
    return (
      <div style={{ maxWidth: 400, margin: '100px auto', padding: 20, textAlign: 'center' }}>
        <h1>Verifying...</h1>
        <p>Please wait while we verify your login link.</p>
      </div>
    );
  }

  if (status === 'invalid' || status === 'error') {
    return (
      <div style={{ maxWidth: 400, margin: '100px auto', padding: 20, textAlign: 'center' }}>
        <h1>Invalid Link</h1>
        <p style={{ color: '#666' }}>{error || 'This login link is invalid or has expired.'}</p>
        <a href="/login" style={{ color: '#2563eb' }}>Request a new login link</a>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 400, margin: '100px auto', padding: 20, textAlign: 'center' }}>
      <h1>Confirm Login</h1>
      <p style={{ color: '#666' }}>Click below to complete your login.</p>

      <button
        onClick={handleConfirm}
        disabled={status === 'verifying'}
        style={{
          marginTop: 20,
          padding: '12px 24px',
          fontSize: 16,
          backgroundColor: '#2563eb',
          color: 'white',
          border: 'none',
          borderRadius: 6,
          cursor: status === 'verifying' ? 'not-allowed' : 'pointer',
          opacity: status === 'verifying' ? 0.7 : 1
        }}
      >
        {status === 'verifying' ? 'Logging in...' : 'Log in to my account'}
      </button>
    </div>
  );
}
