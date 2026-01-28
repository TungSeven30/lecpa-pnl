import { Hono } from 'hono';
import { sign } from '@tsndr/cloudflare-worker-jwt';
import { eq, and, isNull, gt } from 'drizzle-orm';
import { z } from 'zod';
import type { Bindings } from '../index';
import { createDb } from '../db/client';
import { users, magicLinks } from '../db/schema';
import { sendMagicLink } from '../utils/email';
import { rateLimitAuth } from '../middleware/rateLimit';
import { jwtAuth } from '../middleware/jwt';

interface AuthVariables {
  userId: number;
  parsedBody: Record<string, unknown>;
}

const app = new Hono<{ Bindings: Bindings; Variables: AuthVariables }>();

const requestMagicLinkSchema = z.object({
  email: z.string().email('Invalid email address')
});

// POST /api/auth/request-magic-link - Request a magic link
app.post('/request-magic-link', rateLimitAuth, async (c) => {
  const body = c.get('parsedBody') || await c.req.json();

  const parsed = requestMagicLinkSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.issues[0].message }, 400);
  }

  const { email } = parsed.data;
  const db = createDb(c.env.DB);

  // Find or create user
  let user = await db.select().from(users).where(eq(users.email, email)).get();

  if (!user) {
    const result = await db.insert(users).values({
      email,
      createdAt: new Date()
    }).returning().get();
    user = result;
  }

  // Generate token
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  await db.insert(magicLinks).values({
    userId: user.id,
    token,
    expiresAt
  });

  // Send email
  const emailResult = await sendMagicLink({
    resendApiKey: c.env.RESEND_API_KEY,
    email,
    token,
    appUrl: c.env.APP_URL
  });

  if (!emailResult.success) {
    console.error('Magic link email failed:', { email, error: emailResult.error });
    // Still return success to prevent email enumeration, but log the failure
  }

  return c.json({ success: true, message: 'If an account exists, a login link has been sent.' });
});

// GET /api/auth/verify - Verify magic link token (shows confirmation page)
app.get('/verify', async (c) => {
  const token = c.req.query('token');

  if (!token) {
    return c.json({ error: 'Token required' }, 400);
  }

  const db = createDb(c.env.DB);

  // Check if token is valid (not used, not expired)
  const link = await db.select()
    .from(magicLinks)
    .where(and(
      eq(magicLinks.token, token),
      isNull(magicLinks.usedAt),
      gt(magicLinks.expiresAt, new Date())
    ))
    .get();

  if (!link) {
    return c.json({ valid: false, error: 'Invalid or expired token' });
  }

  return c.json({ valid: true });
});

// POST /api/auth/verify - Consume token and create session
app.post('/verify', async (c) => {
  const { token } = await c.req.json();

  if (!token) {
    return c.json({ error: 'Token required' }, 400);
  }

  const db = createDb(c.env.DB);

  // Find and validate token
  const link = await db.select()
    .from(magicLinks)
    .where(and(
      eq(magicLinks.token, token),
      isNull(magicLinks.usedAt),
      gt(magicLinks.expiresAt, new Date())
    ))
    .get();

  if (!link) {
    return c.json({ error: 'Invalid or expired token' }, 400);
  }

  // Mark as used (single-use)
  await db.update(magicLinks)
    .set({ usedAt: new Date() })
    .where(eq(magicLinks.id, link.id));

  // Update user's last login
  await db.update(users)
    .set({ lastLogin: new Date() })
    .where(eq(users.id, link.userId));

  // Get user for response
  const user = await db.select().from(users).where(eq(users.id, link.userId)).get();

  // Create JWT (7 days)
  const payload = {
    userId: link.userId,
    exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60)
  };
  const jwt = await sign(payload, c.env.JWT_SECRET);

  // Set httpOnly cookie
  c.header('Set-Cookie',
    `session=${jwt}; HttpOnly; Secure; SameSite=Strict; Max-Age=${7 * 24 * 60 * 60}; Path=/`
  );

  return c.json({
    success: true,
    user: { id: user!.id, email: user!.email, name: user!.name }
  });
});

// POST /api/auth/logout - Clear session
app.post('/logout', async (c) => {
  c.header('Set-Cookie', 'session=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/');
  return c.json({ success: true });
});

// GET /api/auth/me - Get current user (protected)
app.get('/me', jwtAuth, async (c) => {
  const userId = c.get('userId');
  const db = createDb(c.env.DB);

  const user = await db.select({
    id: users.id,
    email: users.email,
    name: users.name
  }).from(users).where(eq(users.id, userId)).get();

  if (!user) {
    return c.json({ error: 'User not found' }, 404);
  }

  return c.json({ user });
});

export default app;
