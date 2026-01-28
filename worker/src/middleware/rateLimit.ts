import { createMiddleware } from 'hono/factory';
import type { Bindings } from '../index';

interface RateLimiterBinding {
  limit: (options: { key: string }) => Promise<{ success: boolean }>;
}

export const rateLimitAuth = createMiddleware<{ Bindings: Bindings }>(async (c, next) => {
  const body = await c.req.json().catch(() => ({}));
  const email = (body as { email?: string }).email || 'unknown';

  // Check if rate limiter is available (may not be in dev without binding)
  if (!c.env.RATE_LIMITER) {
    console.warn('Rate limiter not configured, skipping rate limit check');
    c.set('parsedBody' as never, body);
    await next();
    return;
  }

  // Rate limit by email to prevent abuse (10 requests per minute)
  const rateLimiter = c.env.RATE_LIMITER as RateLimiterBinding;
  const { success } = await rateLimiter.limit({
    key: `magic-link:${email}`
  });

  if (!success) {
    return c.json({ error: 'Too many requests. Please try again later.' }, 429);
  }

  // Re-attach body for downstream handlers (already consumed)
  c.set('parsedBody' as never, body);
  await next();
});
