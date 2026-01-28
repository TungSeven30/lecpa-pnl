# Claude Code Instructions for LeCPA P&L Generator

## Project Overview

This is a P&L (Profit & Loss) statement generator for CPA firms. It automates bank transaction categorization using AI, reducing manual categorization from hours to minutes.

**Core Value:** Staff can process a client's monthly financials in 15-30 minutes instead of several hours.

## Tech Stack

- **Frontend:** React + Vite + TypeScript
- **Backend:** Cloudflare Workers with Hono framework
- **Database:** Cloudflare D1 (SQLite-compatible)
- **ORM:** Drizzle ORM
- **File Storage:** Cloudflare R2
- **AI:** Anthropic Claude API (Sonnet 4 primary, Opus 4 fallback)
- **Auth:** Email magic link with JWT sessions

## Key Architecture Decisions

1. **Cloudflare-first**: All infrastructure on Cloudflare (Pages, Workers, D1, R2)
2. **Firm-level rules**: Learned categorization rules are scoped to the CPA firm, not global
3. **Three-bucket categorization**: Business / Personal / Needs Review
4. **CSV only**: No PDF/OFX parsing for MVP - all banks support CSV export
5. **Amount normalization**: Negative = expense, positive = income (normalize on import)

## Domain Knowledge

### Accounting Terms

- **P&L Sections**: Revenue → COGS → Gross Profit → Operating Expenses → Net Income
- **Shareholder Distribution**: Personal expenses paid from business account (not a business expense)
- **COGS**: Cost of Goods Sold - direct costs of producing goods/services
- **Transfer**: CC payment from checking - NOT an expense (already on CC statement)

### Supported Industries

Each has a specific chart of accounts template:
1. Real Estate (Realtors, property management)
2. E-Commerce / Retail
3. Medical / Healthcare consulting

### Supported Banks (MVP)

- Chase
- Bank of America
- Wells Fargo
- Capital One
- American Express

## Code Conventions

### TypeScript

```typescript
// Use strict types, avoid `any`
interface Transaction {
  id: string;
  amount: number;  // negative = expense
  bucket: 'business' | 'personal' | 'needs_review';
  confidence: number;  // 0.00 - 1.00
}

// Use Zod for runtime validation
const TransactionSchema = z.object({
  id: z.string().uuid(),
  amount: z.number(),
  bucket: z.enum(['business', 'personal', 'needs_review']),
});
```

### Database (D1/Drizzle)

```typescript
// Use Drizzle ORM for type-safe queries
import { drizzle } from 'drizzle-orm/d1';

// Always use transactions for multi-table operations
await db.transaction(async (tx) => {
  await tx.insert(transactions).values(data);
  await tx.insert(rules).values(rule);
});
```

### API Endpoints (Hono)

```typescript
// Follow RESTful conventions
app.get('/api/projects', listProjects);
app.post('/api/projects', createProject);
app.get('/api/projects/:id', getProject);
app.patch('/api/projects/:id', updateProject);
app.delete('/api/projects/:id', deleteProject);

// Always validate input with Zod
app.post('/api/projects', zValidator('json', CreateProjectSchema), async (c) => {
  const data = c.req.valid('json');
  // ...
});
```

### Error Handling

```typescript
// Use structured errors
class AppError extends Error {
  constructor(
    public code: string,
    public message: string,
    public status: number = 400
  ) {
    super(message);
  }
}

// AI categorization fallback
async function categorize(transaction: Transaction): Promise<CategorizationResult> {
  try {
    return await callClaude('sonnet');
  } catch (e) {
    try {
      return await callClaude('opus');
    } catch (e) {
      return { bucket: 'needs_review', confidence: 0, reason: 'AI unavailable' };
    }
  }
}
```

## File Structure

```
src/
├── frontend/
│   ├── components/
│   │   ├── auth/           # LoginForm, MagicLinkSent
│   │   ├── dashboard/      # ProjectList, ProjectCard
│   │   ├── project/        # UploadZone, ColumnMapper
│   │   ├── transactions/   # TransactionTable, SplitModal
│   │   ├── reports/        # PLPreview, ExportModal
│   │   └── client/         # ClientReviewPage
│   ├── hooks/              # useAuth, useProject, useTransactions
│   ├── services/           # api.ts, auth.ts
│   └── utils/              # csvParser, amountNormalizer
├── backend/
│   ├── routes/             # auth, projects, uploads, transactions
│   ├── services/           # aiCategorizer, vendorNormalizer, reportGenerator
│   ├── db/
│   │   ├── schema.ts       # Drizzle schema
│   │   └── migrations/
│   └── utils/              # jwt, email
```

## Security Requirements

- All endpoints over HTTPS (Cloudflare default)
- R2 files encrypted at rest
- Magic link tokens: single-use, 15-min expiry
- Client review tokens: 24-hour expiry
- Rate limiting: 10 req/min auth, 100 req/min AI
- CSV input sanitization (prevent injection)

## Testing

```bash
# Run tests
npm test

# Run specific test file
npm test -- src/services/aiCategorizer.test.ts
```

Use Vitest for Workers, Jest for frontend components.

## Common Tasks

### Adding a New Category

1. Update `src/backend/db/seed/categories.ts`
2. Run migration: `npm run db:migrate`
3. Category will be available for the specified industry

### Adding a New Bank Format

1. Add bank config to `src/backend/services/bankConfigs.ts`
2. Define column patterns and amount sign convention
3. Add test vectors in `src/backend/services/bankConfigs.test.ts`

### Updating AI Prompt

1. Edit `src/backend/services/aiCategorizer.ts`
2. Update the system prompt in `buildCategorizationPrompt()`
3. Test with sample transactions before deploying

## Planning Artifacts

Project planning documents are in `.planning/`:

- `PROJECT.md` - Project context and key decisions
- `REQUIREMENTS.md` - All v1 requirements with traceability
- `ROADMAP.md` - 6-phase implementation plan
- `STATE.md` - Current progress state

Use `/gsd:progress` to check current status.

## Important Notes

1. **Never store PII beyond client name/email** - No SSN, bank account numbers, etc.
2. **7-year data retention** - Required for IRS compliance
3. **Manual email for MVP** - Staff manually sends magic links and client review links
4. **Soft delete only** - Use `deleted_at` column, never hard delete
5. **Amount signs matter** - Always normalize: negative = expense, positive = income
