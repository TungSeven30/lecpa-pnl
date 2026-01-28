import { sqliteTable, integer, text, index } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  name: text('name'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  lastLogin: integer('last_login', { mode: 'timestamp' })
}, (table) => ({
  emailIdx: index('users_email_idx').on(table.email)
}));

export const magicLinks = sqliteTable('magic_links', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  token: text('token').notNull().unique(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  usedAt: integer('used_at', { mode: 'timestamp' })
}, (table) => ({
  tokenIdx: index('magic_links_token_idx').on(table.token),
  expiresIdx: index('magic_links_expires_idx').on(table.expiresAt)
}));

export const projects = sqliteTable('projects', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  clientName: text('client_name').notNull(),
  clientEmail: text('client_email').notNull(),
  industry: text('industry').notNull(),
  periodStart: integer('period_start', { mode: 'timestamp' }).notNull(),
  periodEnd: integer('period_end', { mode: 'timestamp' }).notNull(),
  status: text('status').notNull().default('active'),
  deletedAt: integer('deleted_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
}, (table) => ({
  userIdIdx: index('projects_user_id_idx').on(table.userId),
  statusIdx: index('projects_status_idx').on(table.status)
}));

export const uploads = sqliteTable('uploads', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  projectId: integer('project_id').notNull().references(() => projects.id),
  bankType: text('bank_type').notNull(),
  accountType: text('account_type').notNull(),
  filename: text('filename').notNull(),
  transactionCount: integer('transaction_count').notNull(),
  status: text('status').notNull().default('active'),
  deletedAt: integer('deleted_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
}, (table) => ({
  projectIdIdx: index('uploads_project_id_idx').on(table.projectId),
  statusIdx: index('uploads_status_idx').on(table.status)
}));

export const transactions = sqliteTable('transactions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  projectId: integer('project_id').notNull().references(() => projects.id),
  uploadId: integer('upload_id').notNull().references(() => uploads.id),
  date: integer('date', { mode: 'timestamp' }).notNull(),
  description: text('description').notNull(),
  amount: integer('amount').notNull(),
  memo: text('memo'),
  bucket: text('bucket').notNull().default('needs_review'),
  categoryId: integer('category_id'),
  confidence: integer('confidence'),
  isTransfer: integer('is_transfer').notNull().default(0),
  isDuplicate: integer('is_duplicate').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
}, (table) => ({
  projectIdIdx: index('transactions_project_id_idx').on(table.projectId),
  uploadIdIdx: index('transactions_upload_id_idx').on(table.uploadId),
  dateIdx: index('transactions_date_idx').on(table.date),
  bucketIdx: index('transactions_bucket_idx').on(table.bucket)
}));

// Type exports for use in application code
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type MagicLink = typeof magicLinks.$inferSelect;
export type NewMagicLink = typeof magicLinks.$inferInsert;
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type Upload = typeof uploads.$inferSelect;
export type NewUpload = typeof uploads.$inferInsert;
export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
