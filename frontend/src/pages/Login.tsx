import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiFetch } from '../lib/api';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email')
});

type LoginForm = z.infer<typeof loginSchema>;

export function Login() {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = async (data: LoginForm) => {
    setError(null);
    try {
      await apiFetch('/auth/request-magic-link', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send login link');
    }
  };

  if (submitted) {
    return (
      <div style={{ maxWidth: 400, margin: '100px auto', padding: 20, textAlign: 'center' }}>
        <h1>Check your email</h1>
        <p>We sent a login link to your email address. Click the link to log in.</p>
        <p style={{ color: '#666', fontSize: 14 }}>The link expires in 15 minutes.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 400, margin: '100px auto', padding: 20 }}>
      <h1>Log in to LeCPA P&L</h1>
      <p style={{ color: '#666' }}>Enter your email to receive a login link.</p>

      <form onSubmit={handleSubmit(onSubmit)} style={{ marginTop: 20 }}>
        <div style={{ marginBottom: 16 }}>
          <label htmlFor="email" style={{ display: 'block', marginBottom: 4 }}>Email</label>
          <input
            id="email"
            type="email"
            {...register('email')}
            style={{ width: '100%', padding: 8, fontSize: 16, border: '1px solid #ccc', borderRadius: 4, boxSizing: 'border-box' }}
            placeholder="you@example.com"
          />
          {errors.email && (
            <p style={{ color: 'red', fontSize: 14, marginTop: 4 }}>{errors.email.message}</p>
          )}
        </div>

        {error && (
          <p style={{ color: 'red', marginBottom: 16 }}>{error}</p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            width: '100%',
            padding: 12,
            fontSize: 16,
            backgroundColor: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            opacity: isSubmitting ? 0.7 : 1
          }}
        >
          {isSubmitting ? 'Sending...' : 'Send login link'}
        </button>
      </form>
    </div>
  );
}
