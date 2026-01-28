import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { createDb } from './db/client';

// Define environment bindings
export interface Bindings {
  DB: D1Database;
  JWT_SECRET: string;
  RESEND_API_KEY: string;
  APP_URL: string;
  // Rate limiter binding - typed as unknown since this is a Cloudflare-specific binding
  // that may not be available in all environments
  RATE_LIMITER?: unknown;
}

// Define variables that can be set in middleware
export interface Variables {
  db: ReturnType<typeof createDb>;
}

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// CORS middleware - allow requests from frontend
app.use('/api/*', async (c, next) => {
  const corsMiddleware = cors({
    origin: c.env.APP_URL,
    credentials: true,
  });
  return corsMiddleware(c, next);
});

// Database middleware - make db available on all routes
app.use('/api/*', async (c, next) => {
  c.set('db', createDb(c.env.DB));
  await next();
});

// Health check endpoint
app.get('/api/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

export default app;
