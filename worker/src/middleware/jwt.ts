import { verify, decode } from '@tsndr/cloudflare-worker-jwt';
import { createMiddleware } from 'hono/factory';
import type { Bindings } from '../index';

interface JwtPayload {
  userId: number;
  exp: number;
}

export const jwtAuth = createMiddleware<{ Bindings: Bindings }>(async (c, next) => {
  const cookie = c.req.header('Cookie');
  const session = cookie?.match(/session=([^;]+)/)?.[1];

  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const isValid = await verify(session, c.env.JWT_SECRET, {
      throwError: true,
      clockTolerance: 15
    });

    if (!isValid) {
      return c.json({ error: 'Invalid token' }, 401);
    }

    // Decode the payload to get userId
    const decoded = decode<JwtPayload>(session);
    if (!decoded.payload?.userId) {
      return c.json({ error: 'Invalid token payload' }, 401);
    }

    c.set('userId' as never, decoded.payload.userId);
    await next();
  } catch (err) {
    console.error('JWT verification error:', err);
    return c.json({ error: 'Invalid or expired token' }, 401);
  }
});
