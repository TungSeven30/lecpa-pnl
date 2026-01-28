# P&L Generator Tool - ExecPlan

This ExecPlan is a living document. The sections `Progress`, `Surprises & Discoveries`, `Decision Log`, and `Outcomes & Retrospective` must be kept up to date as work proceeds.

## Purpose / Big Picture

Build a web-based tool that allows CPA firm staff to upload bank checking and credit card CSV statements, have AI automatically categorize transactions into P&L line items, review/correct categorizations, and export professional Profit & Loss statements. The tool learns from corrections to improve future categorization accuracy.

After this is complete, a staff member can upload a client's Chase checking and Amex CSV exports, review the AI's categorization suggestions, resolve ambiguous transactions, and download a PDF/Excel P&L report comparing the current period to the prior period—all within 15-30 minutes instead of several hours of manual work.

## Progress

- [ ] Project planning and requirements gathering
- [ ] Technical architecture design
- [ ] Database schema design
- [ ] Authentication system (magic link)
- [ ] File upload and CSV parsing
- [ ] Column mapping auto-detection
- [ ] AI categorization engine
- [ ] Transaction review interface
- [ ] P&L report generation
- [ ] PDF/Excel export
- [ ] Client email review flow
- [ ] Testing and QA
- [ ] Deployment to production

## Surprises & Discoveries

(To be updated during implementation)

## Decision Log

- Decision: CSV only for MVP, no PDF/OFX parsing
  Rationale: Reduces complexity significantly. All major banks support CSV export.
  Date/Author: 2025-01-27 / Tung

- Decision: Cloudflare stack (Pages + Workers + D1 + R2)
  Rationale: Tung's company already uses Cloudflare. Keeps infrastructure consolidated.
  Date/Author: 2025-01-27 / Tung

- Decision: Three-bucket categorization (Business / Personal / Needs Review)
  Rationale: Clear decision tree. Personal goes to Shareholder Distribution. Uncertain items get human review.
  Date/Author: 2025-01-27 / Tung

- Decision: Global learning rules (not per-client)
  Rationale: Most vendors behave similarly across clients. Simplifies rule management.
  Date/Author: 2025-01-27 / Tung

- Decision: Claude Sonnet 4.5 for categorization, Opus 4.5 as fallback
  Rationale: Sonnet is cost-effective for bulk categorization. Opus available for edge cases.
  Date/Author: 2025-01-27 / Tung

- Decision: 7-year data retention with 30-day warning before purge
  Rationale: Covers IRS statute of limitations. Admin can extend if needed.
  Date/Author: 2025-01-27 / Tung

## Outcomes & Retrospective

(To be updated at milestones and completion)

---

## Context and Orientation

### What This Tool Does

The P&L Generator automates the tedious process of categorizing bank transactions into accounting categories for Profit & Loss statements. Currently, CPA staff manually review each transaction from bank statements, categorize them, and build P&L reports in Excel. This tool reduces that to: upload → review exceptions → export.

### Key Terms

- **P&L (Profit & Loss Statement)**: Financial report showing Revenue, Cost of Goods Sold, Operating Expenses, and Net Income for a period.
- **COGS (Cost of Goods Sold)**: Direct costs of producing goods/services (materials, labor). Distinct from operating expenses.
- **Chart of Accounts**: The list of valid expense/income categories for a business. Varies by industry.
- **Shareholder Distribution / Owner's Draw**: Money taken out of the business for personal use. Not a business expense—tracked separately.
- **Transaction Splitting**: Dividing one bank transaction into multiple categories (e.g., Costco trip: $200 office supplies + $150 personal groceries).
- **CC Payment Reconciliation**: When you pay a credit card from checking, that payment should NOT appear as an expense (the actual expenses are on the CC statement).

### Target Users

- Primary: Tinh Le CPA staff (2-3 people initially)
- Secondary: Eventually commercialized for other CPAs and small businesses

### Industries Supported (MVP)

1. Real Estate (Realtors, property management)
2. E-Commerce / Retail
3. Medical / Healthcare consulting

Each industry has a specific chart of accounts template.

---

## Technical Architecture

### Stack

    Frontend: Cloudflare Pages (React or Vue - TBD)
    Backend: Cloudflare Workers (API endpoints)
    Database: Cloudflare D1 (SQLite-compatible)
    File Storage: Cloudflare R2 (CSV uploads, generated reports)
    AI: Anthropic Claude API (Sonnet 4.5, Opus 4.5 fallback)
    Auth: Email magic link
    Domain: Subdomain of existing site (e.g., pnl.tinhcpa.com)

### High-Level Data Flow

    1. Staff logs in via magic link
    2. Staff creates new P&L project (client name, industry, email, date range)
    3. Staff uploads CSV(s) - checking and/or credit card
    4. System auto-detects CSV column mapping, staff confirms
    5. System parses transactions, filters by date range
    6. AI categorizes each transaction into: Business (with category) / Personal / Needs Review
    7. Staff reviews transactions in batched UI
    8. Staff resolves "Needs Review" items (or forwards unresolved to client email)
    9. Client responds via web form (captured automatically)
    10. Staff exports P&L as PDF and/or Excel

---

## Database Schema

### Tables

**users**
    
    id              TEXT PRIMARY KEY
    email           TEXT UNIQUE NOT NULL
    name            TEXT
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
    last_login      DATETIME

**magic_links**

    id              TEXT PRIMARY KEY
    user_id         TEXT REFERENCES users(id)
    token           TEXT UNIQUE NOT NULL
    expires_at      DATETIME NOT NULL
    used_at         DATETIME

**projects** (a P&L project for one client/period)

    id              TEXT PRIMARY KEY
    user_id         TEXT REFERENCES users(id)
    client_name     TEXT NOT NULL
    client_email    TEXT
    industry        TEXT NOT NULL  -- 'real_estate', 'ecommerce', 'medical'
    period_start    DATE NOT NULL
    period_end      DATE NOT NULL
    prior_period_start  DATE
    prior_period_end    DATE
    status          TEXT DEFAULT 'draft'  -- 'draft', 'review', 'complete'
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
    updated_at      DATETIME

**uploads** (CSV files uploaded to a project)

    id              TEXT PRIMARY KEY
    project_id      TEXT REFERENCES projects(id)
    filename        TEXT NOT NULL
    r2_key          TEXT NOT NULL
    account_type    TEXT NOT NULL  -- 'checking', 'credit_card'
    bank_name       TEXT  -- 'chase', 'bofa', 'wells_fargo', 'capital_one', 'amex', 'other'
    column_mapping  TEXT  -- JSON: {"date": 0, "description": 1, "amount": 2, ...}
    row_count       INTEGER
    uploaded_at     DATETIME DEFAULT CURRENT_TIMESTAMP

**transactions**

    id              TEXT PRIMARY KEY
    project_id      TEXT REFERENCES projects(id)
    upload_id       TEXT REFERENCES uploads(id)
    date            DATE NOT NULL
    description     TEXT NOT NULL
    memo            TEXT  -- concatenated with description for AI
    amount          DECIMAL(12,2) NOT NULL  -- negative = expense, positive = income
    check_number    TEXT
    raw_row         TEXT  -- JSON of original CSV row
    
    -- Categorization
    category_id     TEXT REFERENCES categories(id)
    bucket          TEXT  -- 'business', 'personal', 'needs_review'
    confidence      DECIMAL(3,2)  -- AI confidence 0.00-1.00
    
    -- Split transactions (if split, this is parent; children reference this)
    parent_txn_id   TEXT REFERENCES transactions(id)
    
    -- Reconciliation
    is_transfer     BOOLEAN DEFAULT FALSE  -- CC payment detected
    transfer_pair_id TEXT REFERENCES transactions(id)
    
    -- Duplicate detection
    is_duplicate    BOOLEAN DEFAULT FALSE
    duplicate_of_id TEXT REFERENCES transactions(id)
    
    -- Audit
    categorized_by  TEXT  -- 'ai', 'rule', 'user:{user_id}', 'client'
    categorized_at  DATETIME
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP

**categories** (chart of accounts)

    id              TEXT PRIMARY KEY
    industry        TEXT NOT NULL
    section         TEXT NOT NULL  -- 'revenue', 'cogs', 'operating_expense', 'other_income', 'other_expense'
    name            TEXT NOT NULL
    parent_id       TEXT REFERENCES categories(id)  -- for subcategories
    display_order   INTEGER
    is_system       BOOLEAN DEFAULT TRUE  -- false if AI-created
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP

**rules** (learned categorization rules)

    id              TEXT PRIMARY KEY
    pattern         TEXT NOT NULL  -- normalized vendor pattern
    category_id     TEXT REFERENCES categories(id)
    bucket          TEXT NOT NULL  -- 'business' or 'personal'
    match_count     INTEGER DEFAULT 1
    created_by      TEXT REFERENCES users(id)
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
    updated_at      DATETIME

**vendor_aliases** (vendor name normalization)

    id              TEXT PRIMARY KEY
    pattern         TEXT NOT NULL  -- regex or substring match
    normalized_name TEXT NOT NULL  -- e.g., "AMAZON"
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP

**transaction_history** (audit log)

    id              TEXT PRIMARY KEY
    transaction_id  TEXT REFERENCES transactions(id)
    user_id         TEXT REFERENCES users(id)
    action          TEXT NOT NULL  -- 'categorize', 'split', 'mark_duplicate', 'delete', etc.
    old_value       TEXT  -- JSON
    new_value       TEXT  -- JSON
    timestamp       DATETIME DEFAULT CURRENT_TIMESTAMP

**client_reviews** (questions sent to clients)

    id              TEXT PRIMARY KEY
    project_id      TEXT REFERENCES projects(id)
    transaction_ids TEXT NOT NULL  -- JSON array
    token           TEXT UNIQUE NOT NULL  -- for client access without login
    sent_at         DATETIME
    responded_at    DATETIME
    expires_at      DATETIME

**client_responses**

    id              TEXT PRIMARY KEY
    review_id       TEXT REFERENCES client_reviews(id)
    transaction_id  TEXT REFERENCES transactions(id)
    response        TEXT NOT NULL  -- 'business', 'personal'
    category_id     TEXT REFERENCES categories(id)
    notes           TEXT
    responded_at    DATETIME DEFAULT CURRENT_TIMESTAMP

---

## Chart of Accounts Templates

Based on the uploaded Excel templates, the system will include these industry-specific charts:

### All Industries (Common Categories)

**Revenue**
- Sales
- Returns and Allowances
- Other Income (Cash)
- Other Income (Venmo/Cashapp)
- Rewards / Cash Back

**Operating Expenses**
- Advertising & Marketing
- Bank Charges & Fees
- Car & Truck (Gas, Insurance, Repair, Tolls)
- Home Office (Rent, Utilities, Mortgage Interest, Property Tax, Repairs, HOA)
- Commission and Fees
- Contractors
- Insurance (Business)
- Interest Paid
- Legal & Professional Services
- Meals & Entertainment
- Office Expenses
- Rent (Vehicles, Machinery, Others)
- Repairs & Maintenance
- Supplies
- Taxes & Licenses
- Phone Service
- Travel
- Utilities
- Wages
- Depreciation Expense

**Other**
- Shareholder Distribution / Owner's Draw (for personal expenses)

### Real Estate (Additional)

- Brokerage Fee
- MLS Fees
- NAR / Realtor Association Dues
- Staging Fees
- Professional Photography
- Client Gifts
- Appraisal Fees
- Finder Fees / Referral Fees
- Inspection Fees
- Open House Expenses
- Continuing Education (Books, Training, Seminars)

### E-Commerce / Retail (Additional)

**COGS**
- Beginning Inventory
- Purchases (Materials, Supplies by type)
- Ending Inventory

**Expenses**
- Platform Fees
- Booth Fees
- Website / Hosting
- Product Storage
- Shipping Supplies
- Payment Processing Fees

### Medical / Healthcare (Additional)

- Medical Licenses
- CME (Continuing Medical Education)
- Medical Equipment
- Malpractice Insurance
- Professional Memberships
- Medical Supplies

---

## CSV Parsing & Column Mapping

### Supported Banks (MVP)

1. **Chase** - Date, Description, Amount (negative = debit)
2. **Bank of America** - Date, Description, Amount (negative = debit)
3. **Wells Fargo** - Date, Description, Amount (negative = debit)
4. **Capital One** - Date, Description, Amount (negative = debit)
5. **American Express** - Date, Description, Amount (positive = charge on CC)

### Auto-Detection Logic

    1. Read first 5 rows of CSV
    2. Identify header row (if present)
    3. For each column, score likelihood of being:
       - Date (parse attempts, format detection)
       - Description (string length, text patterns)
       - Amount (numeric, currency symbols)
       - Memo (secondary text field)
       - Check Number (numeric, usually blank)
    4. Present detected mapping to user for confirmation
    5. User can override any mapping
    6. Save mapping for this upload

### Amount Normalization

All amounts normalized to: **negative = expense, positive = income**

If source shows expenses as positive (some CC exports), invert during import.

### Date Parsing

Support formats: MM/DD/YYYY, M/D/YYYY, YYYY-MM-DD, MM-DD-YYYY

Normalize all to ISO format (YYYY-MM-DD) in database.

---

## AI Categorization Engine

### Flow

    1. For each transaction:
       a. Normalize vendor name (strip numbers, standardize variations)
       b. Check rules table for exact match → if found, apply rule
       c. If no rule, call Claude API for categorization
       d. Claude returns: category, bucket (business/personal/needs_review), confidence
       e. Store result

### Claude API Prompt Structure

    System: You are a bookkeeping assistant for a CPA firm. Categorize bank transactions
    into P&L categories for {industry} businesses.
    
    Available categories:
    {list of categories with section hierarchy}
    
    Rules:
    - Expenses should be categorized into the most specific matching category
    - If transaction appears personal (groceries, luxury goods, entertainment not clearly business), mark as "needs_review"
    - If uncertain, mark as "needs_review" rather than guessing
    - Bank fees and interest charges go to their standard categories
    - Refunds should reduce the original expense category
    - CC payments to the same person's accounts are transfers, not expenses
    
    Respond in JSON:
    {
      "category": "category_name",
      "section": "revenue|cogs|operating_expense|other",
      "bucket": "business|personal|needs_review",
      "confidence": 0.85,
      "reasoning": "brief explanation"
    }

### Vendor Normalization Examples

    "AMZN*1234XYZ" → "AMAZON"
    "AMAZON.COM*5678" → "AMAZON"
    "AMZ MARKETPLACE" → "AMAZON"
    "WHOLEFDS MKT 10432" → "WHOLE FOODS"
    "COSTCO WHSE #1234" → "COSTCO"

System maintains `vendor_aliases` table. AI can suggest new aliases during categorization.

### Learning from Corrections

When user overrides AI categorization:

    1. Create/update rule: normalized_vendor → category + bucket
    2. Increment match_count on existing rules
    3. Log in transaction_history for audit

When user selects "Apply to all similar":

    1. Create rule for normalized vendor
    2. Retroactively apply to all uncategorized transactions with same vendor

---

## CC Payment Reconciliation

### Detection Logic

When both checking and CC statements are uploaded for same project:

    1. Find checking transactions matching patterns:
       - "AMEX", "AMERICAN EXPRESS", "CHASE CARD", "CAPITAL ONE", "PAYMENT THANK YOU"
       - Large round numbers (often CC payments)
    
    2. Find CC transactions that are credits (positive amounts)
    
    3. Match pairs where:
       - Amount matches (or within $0.01)
       - Dates within 1 day of each other
    
    4. Mark both as is_transfer = TRUE
    
    5. Exclude from P&L calculations

Staff can manually mark/unmark transfers in review UI.

---

## Transaction Review Interface

### List View

- 50 transactions per page
- Sortable by: Date, Amount, Category, Bucket
- Filterable by:
  - Bucket (Business / Personal / Needs Review / All)
  - Category
  - Account (Checking / Credit Card)
  - Upload file
  - Date range
- Searchable by description/vendor

### Transaction Row

    [Checkbox] | Date | Description | Amount | Category Dropdown | Bucket | Actions

### Actions

- **Categorize**: Select category from dropdown
- **Split**: Divide transaction into multiple line items with amounts
- **Mark as Duplicate**: Flag and optionally delete
- **Mark as Transfer**: Exclude from P&L
- **Add Note**: Staff notes for documentation

### Batch Actions

- Select multiple → Assign same category
- Select one → "Apply to all similar vendors" (creates rule)

### Auto-Save

Every action saves immediately. No "Save" button needed.

### Undo

- Undo last action (within session)
- Full history available in transaction detail view

---

## Transaction Splitting

### Use Case

Costco receipt: $350 total
- $200 office supplies (business)
- $150 groceries (personal)

### Implementation

    1. User clicks "Split" on transaction
    2. Modal shows original amount: $350.00
    3. User adds line items:
       - $200.00 → Office Supplies → Business
       - $150.00 → Shareholder Distribution → Personal
    4. System validates: sum must equal original
    5. Original transaction becomes "parent"
    6. Child transactions created with parent_txn_id reference
    7. Parent excluded from P&L; children included

---

## Duplicate Detection

### Detection Logic

Duplicates identified by matching:
- Same date
- Same amount
- Same description (fuzzy match)
- Same or similar check number

### Handling

    1. Flag potential duplicates during import
    2. Show in review UI with warning badge
    3. Staff can:
       - Confirm duplicate → mark is_duplicate = TRUE, exclude from P&L
       - Delete duplicate
       - Mark as not duplicate (dismiss warning)

---

## Client Email Review Flow

### Trigger

Staff clicks "Send to Client" for selected "Needs Review" transactions.

### Flow

    1. System creates client_review record with unique token
    2. Staff sees confirmation: "Ready to send {N} items to {client_email}"
    3. Staff manually sends email (for now) with link: pnl.tinhcpa.com/review/{token}
    4. Client clicks link → sees list of transactions
    5. For each transaction, client selects: Business / Personal
    6. Optionally adds category and notes
    7. Client submits
    8. Responses saved to client_responses table
    9. Transactions updated automatically
    10. Staff notified (or checks dashboard)

### Client Review Page

Simple, no-login interface:

    "Please review these transactions for {Client Name}"
    
    For each transaction:
    - Date, Description, Amount
    - Radio buttons: [Business] [Personal]
    - Optional: Category dropdown (if Business)
    - Optional: Notes field
    
    [Submit All]

---

## P&L Report Generation

### Structure

    {Company Name}
    Profit and Loss
    For the period {start_date} to {end_date}
    
                                    Current Period    Prior Period
    REVENUE
      Sales                              $XX,XXX         $XX,XXX
      Returns and Allowances             ($X,XXX)        ($X,XXX)
      Other Income                        $X,XXX          $X,XXX
      Rewards / Cash Back                   $XXX            $XXX
    ─────────────────────────────────────────────────────────────
    TOTAL REVENUE                        $XX,XXX         $XX,XXX
    
    COST OF GOODS SOLD
      Beginning Inventory                 $X,XXX          $X,XXX
      Purchases                           $X,XXX          $X,XXX
      Ending Inventory                   ($X,XXX)        ($X,XXX)
    ─────────────────────────────────────────────────────────────
    TOTAL COGS                            $X,XXX          $X,XXX
    
    GROSS PROFIT                         $XX,XXX         $XX,XXX
    
    OPERATING EXPENSES
      Advertising & Marketing               $XXX            $XXX
      Bank Charges & Fees                   $XXX            $XXX
      [... all categories with non-zero amounts ...]
    ─────────────────────────────────────────────────────────────
    TOTAL OPERATING EXPENSES              $X,XXX          $X,XXX
    
    NET OPERATING INCOME                 $XX,XXX         $XX,XXX
    
    OTHER EXPENSES
      Depreciation                          $XXX            $XXX
    ─────────────────────────────────────────────────────────────
    TOTAL OTHER EXPENSES                    $XXX            $XXX
    
    NET INCOME                           $XX,XXX         $XX,XXX
    
    ═════════════════════════════════════════════════════════════
    
    SHAREHOLDER DISTRIBUTION / OWNER'S DRAW
      Personal Expenses                   $X,XXX          $X,XXX

### Drill-Down

Summary shows totals. Click category → see all transactions in that category.

### Export Options

User selects what to include:
- [ ] P&L PDF
- [ ] P&L Excel
- [ ] Categorized Transaction List (Excel)
- [ ] Shareholder Distribution Report

### Watermark

Optional "DRAFT" watermark until all items categorized.

---

## Authentication

### Magic Link Flow

    1. User enters email on login page
    2. System generates token, saves to magic_links with 15-min expiry
    3. System shows: "Check your email for login link"
    4. (For now) Staff manually checks email
    5. User clicks link: pnl.tinhcpa.com/auth/{token}
    6. System validates token, creates session
    7. Redirect to dashboard

### Session

- JWT stored in httpOnly cookie
- 7-day expiry, refresh on activity
- All staff have equal permissions (no roles for MVP)

---

## API Endpoints

### Auth

    POST /api/auth/request-link     - Request magic link
    GET  /api/auth/verify/{token}   - Verify magic link, create session
    POST /api/auth/logout           - End session

### Projects

    GET    /api/projects            - List user's projects
    POST   /api/projects            - Create new project
    GET    /api/projects/{id}       - Get project details
    PATCH  /api/projects/{id}       - Update project
    DELETE /api/projects/{id}       - Delete project (soft delete)

### Uploads

    POST   /api/projects/{id}/uploads           - Upload CSV
    GET    /api/projects/{id}/uploads           - List uploads for project
    PATCH  /api/uploads/{id}/mapping            - Confirm/update column mapping
    DELETE /api/uploads/{id}                    - Remove upload

### Transactions

    GET    /api/projects/{id}/transactions      - List transactions (paginated, filterable)
    PATCH  /api/transactions/{id}               - Update categorization
    POST   /api/transactions/{id}/split         - Split transaction
    POST   /api/transactions/bulk-update        - Batch categorize
    DELETE /api/transactions/{id}               - Delete (duplicates only)

### Categories

    GET    /api/categories?industry={industry}  - Get chart of accounts
    POST   /api/categories                      - Add custom category

### Rules

    GET    /api/rules                           - List learned rules
    POST   /api/rules                           - Create rule manually
    DELETE /api/rules/{id}                      - Delete rule

### Client Review

    POST   /api/projects/{id}/client-review     - Create review request
    GET    /api/review/{token}                  - Client access (no auth)
    POST   /api/review/{token}                  - Submit client responses

### Export

    POST   /api/projects/{id}/export            - Generate report
    GET    /api/exports/{id}                    - Download generated file

---

## File Structure (Frontend)

    /src
      /components
        /auth
          LoginForm.tsx
          MagicLinkSent.tsx
        /dashboard
          ProjectList.tsx
          ProjectCard.tsx
        /project
          ProjectHeader.tsx
          UploadZone.tsx
          ColumnMapper.tsx
        /transactions
          TransactionTable.tsx
          TransactionRow.tsx
          CategoryDropdown.tsx
          SplitModal.tsx
          BatchActions.tsx
          FilterBar.tsx
        /reports
          PLPreview.tsx
          ExportModal.tsx
        /client
          ClientReviewPage.tsx
      /pages
        Login.tsx
        Dashboard.tsx
        Project.tsx
        Transactions.tsx
        Export.tsx
        ClientReview.tsx  (public, no auth)
      /hooks
        useAuth.ts
        useProject.ts
        useTransactions.ts
      /services
        api.ts
        auth.ts
      /utils
        csvParser.ts
        amountNormalizer.ts
        dateParser.ts

## File Structure (Backend - Workers)

    /src
      /routes
        auth.ts
        projects.ts
        uploads.ts
        transactions.ts
        categories.ts
        rules.ts
        clientReview.ts
        export.ts
      /services
        csvParser.ts
        columnDetector.ts
        aiCategorizer.ts
        vendorNormalizer.ts
        transferDetector.ts
        duplicateDetector.ts
        reportGenerator.ts
        pdfGenerator.ts
        excelGenerator.ts
      /db
        schema.sql
        migrations/
      /utils
        jwt.ts
        email.ts
      index.ts

---

## Validation and Acceptance

### MVP Acceptance Criteria

1. **Upload Flow**
   - User can upload Chase checking CSV
   - System auto-detects columns, user confirms
   - Transactions appear in review table filtered by specified date range

2. **Categorization**
   - AI categorizes transactions with visible confidence
   - Rules override AI for known vendors
   - Unknown vendors go to "Needs Review"

3. **Review Interface**
   - 50 per page with filters working
   - Can change category via dropdown
   - Can split transaction into multiple lines
   - Can apply category to "all similar vendors"
   - Auto-saves on every change

4. **P&L Export**
   - PDF generates with correct structure
   - Totals match sum of transactions
   - Prior period comparison shows (if data exists)
   - Excel export includes transaction detail sheet

5. **Personal Expenses**
   - Marked as Shareholder Distribution
   - Separate report available

### Test Scenarios

    Scenario: Upload and categorize basic checking statement
    Given: Staff uploads Chase checking CSV with 50 transactions
    When: Column mapping confirmed, date range set to Jan 2025
    Then: 45 transactions appear (5 outside date range excluded)
    And: ~30 auto-categorized as Business with category
    And: ~10 marked Needs Review
    And: ~5 marked Personal

    Scenario: CC payment reconciliation
    Given: Project has both checking and CC uploads
    When: Checking shows "AMEX PAYMENT $5,000" on Jan 15
    And: CC shows "+$5,000 PAYMENT RECEIVED" on Jan 16
    Then: Both marked as transfers
    And: Neither appears in P&L expenses

    Scenario: Transaction split
    Given: Transaction "COSTCO #1234 $350.00"
    When: Staff splits into $200 Office Supplies + $150 Personal
    Then: Original transaction hidden
    And: Two child transactions appear
    And: $200 in Operating Expenses, $150 in Shareholder Distribution

    Scenario: Export P&L with comparison
    Given: Project has Jan 2025 data and Jan 2024 data uploaded
    When: Staff exports P&L
    Then: PDF shows both periods side by side
    And: All category totals correct
    And: Net Income matches manual calculation

---

## Idempotence and Recovery

### Safe Retries

- CSV upload: Same file uploaded twice creates duplicate warning, not duplicate records
- Categorization: Re-running AI on already-categorized transaction overwrites only if user confirms
- Export: Generating new export creates new file, doesn't delete old ones

### Rollback

- All changes logged in transaction_history
- "Undo" available in UI for immediate reversal
- Admin can restore from history for any transaction

### Data Safety

- R2 stores original CSVs permanently (within retention period)
- Can re-import from original if needed
- Database backups via D1's built-in backup (configure separately)

---

## Milestones

### Milestone 1: Foundation (Week 1)

Scope: Auth, database, basic UI shell

- D1 database created with schema
- Magic link auth working
- Dashboard page shows (empty state)
- Project creation form

Acceptance: Can login via magic link, create a project, see it listed.

### Milestone 2: Upload & Parse (Week 2)

Scope: CSV upload, parsing, column detection

- R2 bucket for file storage
- CSV upload endpoint
- Column auto-detection
- Mapping confirmation UI
- Transactions stored in DB

Acceptance: Upload Chase CSV, confirm columns, see transactions in database.

### Milestone 3: AI Categorization (Week 3)

Scope: Claude integration, rules engine, vendor normalization

- Claude API integration
- Categorization prompt tuned
- Vendor normalization
- Rules table population
- Bulk categorization on upload

Acceptance: Upload CSV, transactions auto-categorized, rules created for common vendors.

### Milestone 4: Review Interface (Week 4)

Scope: Transaction review UI, batch actions, splitting

- Transaction table with pagination
- Filters and search
- Category dropdown
- Split modal
- Batch "apply to similar"
- Auto-save

Acceptance: Review 100 transactions, change categories, split one, batch categorize vendors.

### Milestone 5: Reports & Export (Week 5)

Scope: P&L generation, PDF/Excel export

- P&L calculation engine
- PDF generation (using pdf-lib or similar)
- Excel generation (using xlsx library)
- Export options UI
- Drill-down view

Acceptance: Export P&L PDF and Excel, verify totals match, prior period shows if data exists.

### Milestone 6: Polish & Deploy (Week 6)

Scope: Bug fixes, client review flow, deployment

- Client review page (no auth)
- Duplicate detection refinement
- Transfer detection refinement
- Error handling and friendly messages
- Deploy to pnl.tinhcpa.com

Acceptance: End-to-end flow works. Staff can process a real client's statements.

---

## Interfaces and Dependencies

### External Dependencies

    @anthropic-ai/sdk          - Claude API client
    xlsx                       - Excel file generation
    pdf-lib                    - PDF generation  
    papaparse                  - CSV parsing
    date-fns                   - Date manipulation
    zod                        - Schema validation
    hono                       - Cloudflare Workers framework
    drizzle-orm                - D1 database ORM

### Key Interfaces

In `/src/services/aiCategorizer.ts`:

    interface CategorizationResult {
      categoryId: string;
      categoryName: string;
      section: 'revenue' | 'cogs' | 'operating_expense' | 'other_income' | 'other_expense';
      bucket: 'business' | 'personal' | 'needs_review';
      confidence: number;
      reasoning: string;
    }
    
    interface AICategorizer {
      categorize(transaction: Transaction, industry: string): Promise<CategorizationResult>;
      batchCategorize(transactions: Transaction[], industry: string): Promise<CategorizationResult[]>;
    }

In `/src/services/reportGenerator.ts`:

    interface PLLineItem {
      categoryId: string;
      categoryName: string;
      section: string;
      currentPeriod: number;
      priorPeriod: number | null;
      transactions: Transaction[];
    }
    
    interface PLReport {
      clientName: string;
      periodStart: Date;
      periodEnd: Date;
      priorPeriodStart: Date | null;
      priorPeriodEnd: Date | null;
      revenue: PLLineItem[];
      cogs: PLLineItem[];
      operatingExpenses: PLLineItem[];
      otherExpenses: PLLineItem[];
      shareholderDistribution: PLLineItem[];
      totals: {
        totalRevenue: number;
        totalCogs: number;
        grossProfit: number;
        totalOperatingExpenses: number;
        netOperatingIncome: number;
        totalOtherExpenses: number;
        netIncome: number;
        totalDistributions: number;
      };
    }

---

## Artifacts and Notes

### Sample Chase CSV Format

    Transaction Date,Post Date,Description,Category,Type,Amount,Memo
    01/15/2025,01/16/2025,AMAZON.COM*1A2B3C4D5,Shopping,Sale,-47.32,
    01/15/2025,01/16/2025,WHOLEFDS MKT 10432,Groceries,Sale,-127.89,

### Sample AI Categorization Response

    {
      "category": "Office Expenses",
      "section": "operating_expense",
      "bucket": "business",
      "confidence": 0.92,
      "reasoning": "Amazon purchase, common source for office supplies. Amount typical for supplies."
    }

### Sample P&L Export (abbreviated)

    Tinh Le CPA Client
    Profit and Loss
    For the period January 1, 2025 to December 31, 2025
    
                                        2025          2024
    REVENUE
      Sales                          $150,000      $142,000
      Other Income                     $2,500        $1,800
    ────────────────────────────────────────────────────────
    TOTAL REVENUE                    $152,500      $143,800
    
    OPERATING EXPENSES
      Advertising & Marketing          $3,200        $2,800
      Office Expenses                  $1,450        $1,200
      ...
    ────────────────────────────────────────────────────────
    TOTAL OPERATING EXPENSES         $45,000       $41,000
    
    NET INCOME                       $107,500      $102,800

---

## Revision Notes

(To be updated when plan changes)
