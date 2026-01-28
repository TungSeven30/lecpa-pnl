import { Hono } from 'hono';
import { eq, and, isNull } from 'drizzle-orm';
import { z } from 'zod';
import type { Bindings } from '../index';
import { createDb } from '../db/client';
import { projects } from '../db/schema';
import { jwtAuth } from '../middleware/jwt';

const app = new Hono<{ Bindings: Bindings; Variables: { userId: number } }>();

// All routes require authentication
app.use('/*', jwtAuth);

// Validation schemas - base schema for partial updates
const projectBaseSchema = z.object({
  clientName: z.string().min(1, 'Client name is required').max(100),
  clientEmail: z.string().email('Invalid email address'),
  industry: z.enum(['real_estate', 'ecommerce', 'medical'], {
    errorMap: () => ({ message: 'Please select a valid industry' })
  }),
  periodStart: z.string().refine(val => !isNaN(Date.parse(val)), 'Invalid start date'),
  periodEnd: z.string().refine(val => !isNaN(Date.parse(val)), 'Invalid end date')
});

// Full create schema with cross-field date validation
const createProjectSchema = projectBaseSchema.refine(
  data => new Date(data.periodStart) < new Date(data.periodEnd),
  { message: 'End date must be after start date', path: ['periodEnd'] }
);

// Partial update schema (no cross-field validation - handled in route logic)
const updateProjectSchema = projectBaseSchema.partial();

// GET /api/projects - List user's projects
app.get('/', async (c) => {
  const userId = c.get('userId');
  const db = createDb(c.env.DB);

  const userProjects = await db.select()
    .from(projects)
    .where(and(
      eq(projects.userId, userId),
      isNull(projects.deletedAt)
    ))
    .orderBy(projects.createdAt);

  // Transform timestamps for JSON response
  const transformed = userProjects.map(p => ({
    ...p,
    periodStart: p.periodStart.toISOString(),
    periodEnd: p.periodEnd.toISOString(),
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString()
  }));

  return c.json({ projects: transformed });
});

// GET /api/projects/:id - Get single project
app.get('/:id', async (c) => {
  const userId = c.get('userId');
  const projectId = parseInt(c.req.param('id'));

  if (isNaN(projectId)) {
    return c.json({ error: 'Invalid project ID' }, 400);
  }

  const db = createDb(c.env.DB);

  const project = await db.select()
    .from(projects)
    .where(and(
      eq(projects.id, projectId),
      eq(projects.userId, userId),
      isNull(projects.deletedAt)
    ))
    .get();

  if (!project) {
    return c.json({ error: 'Project not found' }, 404);
  }

  return c.json({
    project: {
      ...project,
      periodStart: project.periodStart.toISOString(),
      periodEnd: project.periodEnd.toISOString(),
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString()
    }
  });
});

// POST /api/projects - Create new project
app.post('/', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();

  const parsed = createProjectSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.issues[0].message }, 400);
  }

  const { clientName, clientEmail, industry, periodStart, periodEnd } = parsed.data;
  const db = createDb(c.env.DB);
  const now = new Date();

  const project = await db.insert(projects).values({
    userId,
    clientName,
    clientEmail,
    industry,
    periodStart: new Date(periodStart),
    periodEnd: new Date(periodEnd),
    status: 'active',
    createdAt: now,
    updatedAt: now
  }).returning().get();

  return c.json({
    project: {
      ...project,
      periodStart: project.periodStart.toISOString(),
      periodEnd: project.periodEnd.toISOString(),
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString()
    }
  }, 201);
});

// PUT /api/projects/:id - Update project
app.put('/:id', async (c) => {
  const userId = c.get('userId');
  const projectId = parseInt(c.req.param('id'));

  if (isNaN(projectId)) {
    return c.json({ error: 'Invalid project ID' }, 400);
  }

  const body = await c.req.json();
  const parsed = updateProjectSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: parsed.error.issues[0].message }, 400);
  }

  const db = createDb(c.env.DB);

  // Check ownership
  const existing = await db.select()
    .from(projects)
    .where(and(
      eq(projects.id, projectId),
      eq(projects.userId, userId),
      isNull(projects.deletedAt)
    ))
    .get();

  if (!existing) {
    return c.json({ error: 'Project not found' }, 404);
  }

  // Build update object
  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (parsed.data.clientName) updates.clientName = parsed.data.clientName;
  if (parsed.data.clientEmail) updates.clientEmail = parsed.data.clientEmail;
  if (parsed.data.industry) updates.industry = parsed.data.industry;
  if (parsed.data.periodStart) updates.periodStart = new Date(parsed.data.periodStart);
  if (parsed.data.periodEnd) updates.periodEnd = new Date(parsed.data.periodEnd);

  const updated = await db.update(projects)
    .set(updates)
    .where(eq(projects.id, projectId))
    .returning()
    .get();

  return c.json({
    project: {
      ...updated,
      periodStart: updated.periodStart.toISOString(),
      periodEnd: updated.periodEnd.toISOString(),
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString()
    }
  });
});

// DELETE /api/projects/:id - Soft delete project
app.delete('/:id', async (c) => {
  const userId = c.get('userId');
  const projectId = parseInt(c.req.param('id'));

  if (isNaN(projectId)) {
    return c.json({ error: 'Invalid project ID' }, 400);
  }

  const db = createDb(c.env.DB);

  // Check ownership
  const existing = await db.select()
    .from(projects)
    .where(and(
      eq(projects.id, projectId),
      eq(projects.userId, userId),
      isNull(projects.deletedAt)
    ))
    .get();

  if (!existing) {
    return c.json({ error: 'Project not found' }, 404);
  }

  // Soft delete
  await db.update(projects)
    .set({ deletedAt: new Date(), status: 'deleted' })
    .where(eq(projects.id, projectId));

  return c.json({ success: true });
});

export default app;
