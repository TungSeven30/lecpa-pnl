# Roadmap: LeCPA P&L Generator

## Overview

This roadmap delivers a web-based P&L generator that transforms 2-4 hours of manual transaction categorization into 15-30 minutes of AI-assisted review. The journey moves from authentication and project management (Foundation), through data ingestion (Upload & Parse), to intelligent categorization (AI Categorization), user review workflows (Review Interface), professional output (Reports & Export), and finally client collaboration (Client Review). Each phase builds on the previous, creating a complete end-to-end workflow for CPA staff.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation** - Authentication, database, project management, basic UI shell
- [ ] **Phase 2: Upload & Parse** - CSV upload, column detection, transaction parsing
- [ ] **Phase 3: AI Categorization** - Claude integration, rules engine, vendor normalization
- [ ] **Phase 4: Review Interface** - Transaction UI, batch actions, splitting, transfer/duplicate detection
- [ ] **Phase 5: Reports & Export** - P&L generation, PDF/Excel export, chart of accounts
- [ ] **Phase 6: Client Review** - Client email review flow, token-based access

## Phase Details

### Phase 1: Foundation
**Goal**: Staff can securely access the system, manage projects, and navigate the application
**Depends on**: Nothing (first phase)
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, SEC-01, SEC-02, SEC-03, SEC-05, EMAIL-01, EMAIL-03, PROJ-01, PROJ-02, PROJ-03, PROJ-04
**Success Criteria** (what must be TRUE):
  1. Staff can request magic link, receive it via email, and log in within 15 minutes
  2. Staff session persists across browser sessions for 7 days
  3. Staff can create a new P&L project with client name, email, industry, and date range
  4. Staff can view, edit, and delete their projects from a dashboard
  5. Staff can log out from any page in the application
  6. All endpoints served over HTTPS with rate limiting enabled
  7. Magic link tokens are single-use and expire after 15 minutes
  8. Magic link emails delivered via Resend API; delivery failures logged
**Plans**: 3 plans in 2 waves

Plans:
- [x] 01-01-PLAN.md — Project infrastructure setup (monorepo, Hono, React, D1 schema)
- [x] 01-02-PLAN.md — Authentication system (magic link, JWT, rate limiting, Resend)
- [x] 01-03-PLAN.md — Project management (CRUD API, Dashboard UI)

### Phase 2: Upload & Parse
**Goal**: Staff can upload CSV bank statements and have transactions parsed correctly
**Depends on**: Phase 1 (needs auth and projects)
**Requirements**: UPLD-01, UPLD-02, UPLD-03, UPLD-04, UPLD-05, UPLD-06, UPLD-07, SEC-06, SEC-07
**Success Criteria** (what must be TRUE):
  1. Staff can upload a CSV file (checking or credit card) to a project
  2. System auto-detects date, description, amount, and memo columns with reasonable accuracy
  3. Staff can confirm or override the detected column mapping before processing
  4. Only transactions within the project date range appear in the project
  5. Amounts are normalized (negative = expense) with bank-specific rules (Chase, BofA, Amex)
  6. CSV input is sanitized to prevent injection attacks
  7. Only parsed fields stored (date, description, amount, memo); no raw CSV rows persisted
**Plans**: TBD

Plans:
- [ ] 02-01: TBD
- [ ] 02-02: TBD

### Phase 3: AI Categorization
**Goal**: Transactions are automatically categorized using AI with learning from corrections
**Depends on**: Phase 2 (needs transactions to categorize)
**Requirements**: AICAT-01, AICAT-02, AICAT-03, AICAT-04, AICAT-05, AICAT-06, AICAT-07, AICAT-08, RULE-01, RULE-02, RULE-03, RULE-04
**Success Criteria** (what must be TRUE):
  1. After upload, transactions are automatically categorized into Business/Personal/Needs Review buckets
  2. Each transaction displays an AI confidence score (0-100%)
  3. When staff overrides a categorization, a rule is created for future matching
  4. Rules take precedence over AI for known vendors (firm-level rules)
  5. Staff can view and delete learned rules from a rules management interface
  6. AI category names are mapped to category_id; ambiguous names default to "Needs Review"
  7. If Claude API fails, system uses fallback chain; ultimate fallback marks as "Needs Review"
  8. Model availability validated on startup; logs warning if configured model unavailable
**Plans**: TBD

Plans:
- [ ] 03-01: TBD
- [ ] 03-02: TBD

### Phase 4: Review Interface
**Goal**: Staff can efficiently review, correct, and batch-process transactions
**Depends on**: Phase 3 (needs categorized transactions)
**Requirements**: REVIEW-01, REVIEW-02, REVIEW-03, REVIEW-04, REVIEW-05, REVIEW-06, REVIEW-07, REVIEW-08, XFER-01, XFER-02, XFER-03, XFER-04, DUP-01, DUP-02, DUP-03, DUP-04
**Success Criteria** (what must be TRUE):
  1. Staff can view transactions in a paginated list with filter/search capabilities
  2. Staff can change a transaction's category and have it auto-save immediately
  3. Staff can split a single transaction into multiple line items with different categories
  4. Staff can select multiple transactions and batch-assign the same category
  5. CC payments from checking are detected and matched with CC credits, excluded from P&L
  6. Potential duplicates are flagged and staff can confirm/dismiss them
**Plans**: TBD

Plans:
- [ ] 04-01: TBD
- [ ] 04-02: TBD
- [ ] 04-03: TBD

### Phase 5: Reports & Export
**Goal**: Staff can generate professional P&L reports and export in multiple formats
**Depends on**: Phase 4 (needs reviewed transactions)
**Requirements**: REPORT-01, REPORT-02, REPORT-03, REPORT-04, REPORT-05, COA-01, COA-02, COA-03, COA-04
**Success Criteria** (what must be TRUE):
  1. System generates P&L with standard sections (Revenue, COGS, Operating Expenses, Other)
  2. P&L displays current period and prior period side-by-side for comparison
  3. Staff can export P&L as PDF with professional formatting
  4. Staff can export P&L as Excel with transaction detail on a separate sheet
  5. Personal expenses appear as Shareholder Distribution, separate from business expenses
**Plans**: TBD

Plans:
- [ ] 05-01: TBD
- [ ] 05-02: TBD

### Phase 6: Client Review & Polish
**Goal**: Staff can send ambiguous transactions to clients for clarification; system is production-ready
**Depends on**: Phase 4 (needs review interface and transactions)
**Requirements**: CLIENT-01, CLIENT-02, CLIENT-03, CLIENT-04, CLIENT-05, CLIENT-06, EMAIL-02, SEC-04, RETAIN-01, RETAIN-02, RETAIN-03
**Success Criteria** (what must be TRUE):
  1. Staff can create a client review request for selected "Needs Review" transactions
  2. System generates a unique token/link for client access (no login required)
  3. Client can mark each transaction as Business or Personal from the review page
  4. Client can optionally select a category and add notes
  5. Client responses are automatically applied to the transactions
  6. Client review link emails delivered via Resend API
  7. Client review tokens expire after 24 hours
  7. Soft delete is implemented with deleted_at column
  8. Automated purge job runs for records exceeding 7-year retention
**Plans**: TBD

Plans:
- [ ] 06-01: TBD
- [ ] 06-02: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 3/3 | Complete | 2026-01-28 |
| 2. Upload & Parse | 0/? | Not started | - |
| 3. AI Categorization | 0/? | Not started | - |
| 4. Review Interface | 0/? | Not started | - |
| 5. Reports & Export | 0/? | Not started | - |
| 6. Client Review | 0/? | Not started | - |

---
*Roadmap created: 2025-01-27*
*Last updated: 2026-01-28*
