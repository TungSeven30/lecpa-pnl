import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { eq, and } from 'drizzle-orm';
import { uploads, transactions, projects } from '../db/schema';
import { jwtAuth } from '../middleware/jwt';
import type { Bindings, Variables } from '../index';

const app = new Hono<{ Bindings: Bindings; Variables: Variables & { userId: number } }>();

// Apply JWT auth to all routes
app.use('/*', jwtAuth);

// Zod schemas for validation
const TransactionSchema = z.object({
  date: z.string(), // ISO date string
  description: z.string().min(1).max(500),
  amount: z.number().int(), // Already in cents
  memo: z.string().max(500).nullable()
});

const CreateUploadSchema = z.object({
  bankType: z.enum(['chase', 'bankofamerica', 'wellsfargo', 'capitalone', 'amex']),
  accountType: z.enum(['checking', 'credit']),
  filename: z.string().min(1).max(255),
  transactions: z.array(TransactionSchema).min(1).max(5000)
});

// Helper to chunk array for batch inserts
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

// POST /projects/:projectId/uploads - Create new upload with transactions
app.post(
  '/',
  zValidator('json', CreateUploadSchema),
  async (c) => {
    const projectIdParam = c.req.param('projectId');
    if (!projectIdParam) {
      return c.json({ error: 'Project ID is required' }, 400);
    }
    const projectId = parseInt(projectIdParam);
    const userId = c.get('userId');
    const db = c.get('db');
    const data = c.req.valid('json');

    // Verify project exists and belongs to user
    const [project] = await db
      .select()
      .from(projects)
      .where(and(
        eq(projects.id, projectId),
        eq(projects.userId, userId),
        eq(projects.status, 'active')
      ))
      .limit(1);

    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }

    const now = new Date();

    // Create upload record
    const [upload] = await db.insert(uploads).values({
      projectId,
      bankType: data.bankType,
      accountType: data.accountType,
      filename: data.filename,
      transactionCount: data.transactions.length,
      status: 'active',
      createdAt: now
    }).returning();

    // Batch insert transactions
    // D1 limit: 100 parameters per statement
    // With ~8 columns, 12 rows per batch is safe
    const CHUNK_SIZE = 12;
    const chunks = chunkArray(data.transactions, CHUNK_SIZE);

    for (const chunk of chunks) {
      await db.insert(transactions).values(
        chunk.map(tx => ({
          projectId,
          uploadId: upload.id,
          date: new Date(tx.date),
          description: tx.description,
          amount: tx.amount,
          memo: tx.memo,
          bucket: 'needs_review' as const,
          categoryId: null,
          confidence: null,
          isTransfer: 0,
          isDuplicate: 0,
          createdAt: now,
          updatedAt: now
        }))
      );
    }

    return c.json({
      upload: {
        id: upload.id,
        projectId: upload.projectId,
        bankType: upload.bankType,
        accountType: upload.accountType,
        filename: upload.filename,
        transactionCount: upload.transactionCount,
        createdAt: upload.createdAt.toISOString()
      },
      imported: data.transactions.length
    }, 201);
  }
);

// GET /projects/:projectId/uploads - List uploads for project
app.get('/', async (c) => {
  const projectIdParam = c.req.param('projectId');
  if (!projectIdParam) {
    return c.json({ error: 'Project ID is required' }, 400);
  }
  const projectId = parseInt(projectIdParam);
  const userId = c.get('userId');
  const db = c.get('db');

  // Verify project belongs to user
  const [project] = await db
    .select()
    .from(projects)
    .where(and(
      eq(projects.id, projectId),
      eq(projects.userId, userId)
    ))
    .limit(1);

  if (!project) {
    return c.json({ error: 'Project not found' }, 404);
  }

  const projectUploads = await db
    .select()
    .from(uploads)
    .where(and(
      eq(uploads.projectId, projectId),
      eq(uploads.status, 'active')
    ))
    .orderBy(uploads.createdAt);

  return c.json({
    uploads: projectUploads.map(u => ({
      ...u,
      createdAt: u.createdAt.toISOString()
    }))
  });
});

export default app;
