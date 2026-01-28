# Requirements: LeCPA P&L Generator

**Defined:** 2025-01-27
**Core Value:** Staff can process a client's monthly financials in 15-30 minutes instead of several hours

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Authentication

- [ ] **AUTH-01**: User can request magic link via email
- [ ] **AUTH-02**: User can log in by clicking magic link (15-min expiry)
- [ ] **AUTH-03**: User session persists for 7 days (JWT in httpOnly cookie)
- [ ] **AUTH-04**: User can log out from any page

### Security

- [ ] **SEC-01**: All API endpoints served over HTTPS (Cloudflare default)
- [ ] **SEC-02**: R2 file storage encrypted at rest
- [ ] **SEC-03**: Magic link tokens single-use and expire after 15 minutes
- [ ] **SEC-04**: Client review tokens expire after 24 hours
- [ ] **SEC-05**: Rate limiting on auth endpoints (10 requests/min) and AI endpoints (100/min)
- [x] **SEC-06**: Input sanitization on all CSV uploads (prevent injection)
- [x] **SEC-07**: No raw CSV rows stored; only parsed fields persisted (data minimization)

### Email (Transactional)

- [ ] **EMAIL-01**: System sends magic link email via Resend API
- [ ] **EMAIL-02**: System sends client review link email via Resend API
- [ ] **EMAIL-03**: Email delivery failures logged and surfaced to staff

### Projects

- [ ] **PROJ-01**: User can create new P&L project (client name, email, industry, date range)
- [ ] **PROJ-02**: User can view list of their projects
- [ ] **PROJ-03**: User can edit project details
- [ ] **PROJ-04**: User can delete project (soft delete)

### File Upload

- [x] **UPLD-01**: User can upload CSV file (checking or credit card)
- [x] **UPLD-02**: System auto-detects column mapping (date, description, amount, memo)
- [x] **UPLD-03**: User can confirm or override column mapping
- [x] **UPLD-04**: System filters transactions by project date range
- [x] **UPLD-05**: System normalizes amounts (negative = expense, positive = income)
- [x] **UPLD-06**: User can delete an upload (removes associated transactions)
- [x] **UPLD-07**: Bank-specific amount normalization rules (Chase, BofA, Amex, etc.)

### AI Categorization

- [ ] **AICAT-01**: System categorizes transactions using Claude API (model ID from env var)
- [ ] **AICAT-02**: Each transaction assigned to bucket: Business / Personal / Needs Review
- [ ] **AICAT-03**: Each transaction shows AI confidence score (0-100%)
- [ ] **AICAT-04**: System normalizes vendor names before categorization
- [ ] **AICAT-05**: System checks rules table before calling AI (rules take precedence)
- [ ] **AICAT-06**: AI category names mapped to category_id; ambiguous names default to "Needs Review"
- [ ] **AICAT-07**: Claude API fallback chain: primary model → fallback model → mark as "Needs Review"
- [ ] **AICAT-08**: Model availability validated on startup; logs warning if configured model unavailable

### Rules Engine

- [ ] **RULE-01**: System creates rule when user overrides AI categorization
- [ ] **RULE-02**: Rules scoped to firm level (shared across all clients within the CPA firm)
- [ ] **RULE-03**: Rules match on normalized vendor pattern
- [ ] **RULE-04**: User can view and delete learned rules

### Transaction Review

- [ ] **REVIEW-01**: User can view transactions in paginated list (50 per page)
- [ ] **REVIEW-02**: User can filter by bucket, category, account type, date range
- [ ] **REVIEW-03**: User can search transactions by description
- [ ] **REVIEW-04**: User can change transaction category via dropdown
- [ ] **REVIEW-05**: User can split transaction into multiple line items
- [ ] **REVIEW-06**: Changes auto-save immediately (no Save button)
- [ ] **REVIEW-07**: User can select multiple transactions and batch-assign category
- [ ] **REVIEW-08**: User can apply category to "all similar vendors" (creates rule)

### Transfer Detection

- [ ] **XFER-01**: System detects CC payment transactions in checking account
- [ ] **XFER-02**: System matches CC payments with CC credits (same amount, +/-1 day)
- [ ] **XFER-03**: Matched transfers excluded from P&L calculations
- [ ] **XFER-04**: User can manually mark/unmark transaction as transfer

### Duplicate Detection

- [ ] **DUP-01**: System flags potential duplicates (same date + amount + similar description)
- [ ] **DUP-02**: User can confirm duplicate (exclude from P&L)
- [ ] **DUP-03**: User can dismiss duplicate warning
- [ ] **DUP-04**: User can delete confirmed duplicates

### Client Review

- [ ] **CLIENT-01**: User can create client review request for selected transactions
- [ ] **CLIENT-02**: System generates unique token/link for client access
- [ ] **CLIENT-03**: Client can access review page without login
- [ ] **CLIENT-04**: Client can mark each transaction as Business or Personal
- [ ] **CLIENT-05**: Client can optionally select category and add notes
- [ ] **CLIENT-06**: Client responses saved and applied to transactions

### P&L Reports

- [ ] **REPORT-01**: System generates P&L with standard sections (Revenue, COGS, OpEx, Other)
- [ ] **REPORT-02**: P&L shows current period and prior period side-by-side
- [ ] **REPORT-03**: User can export P&L as PDF
- [ ] **REPORT-04**: User can export P&L as Excel with transaction detail sheet
- [ ] **REPORT-05**: Shareholder Distribution shown separately from business expenses

### Chart of Accounts

- [ ] **COA-01**: System provides industry templates (Real Estate, E-Commerce, Medical)
- [ ] **COA-02**: Each template includes appropriate categories per section
- [ ] **COA-03**: User can add custom categories to any project
- [ ] **COA-04**: Personal expenses map to Shareholder Distribution category

### Data Retention

- [ ] **RETAIN-01**: Soft delete with deleted_at column (records recoverable)
- [ ] **RETAIN-02**: 7-year data retention with 30-day warning before purge
- [ ] **RETAIN-03**: Automated purge job for records exceeding retention period

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Authentication Enhancements

- **AUTH-V2-01**: OAuth login (Google)
- **AUTH-V2-02**: Two-factor authentication

### File Upload Enhancements

- **UPLD-V2-01**: PDF bank statement parsing
- **UPLD-V2-02**: OFX/QFX file support
- **UPLD-V2-03**: Multi-file drag-and-drop upload

### UX Enhancements

- **UX-V2-01**: Keyboard shortcuts (j/k navigation, e edit, s split)
- **UX-V2-02**: Undo/redo stack (50 actions)
- **UX-V2-03**: Progress indicator for AI categorization
- **UX-V2-04**: Bulk import from multiple files at once

### Client Review Enhancements

- **CLIENT-V2-01**: Automated email sending to clients
- **CLIENT-V2-02**: Reminder follow-ups for pending reviews

### Reporting Enhancements

- **REPORT-V2-01**: Custom report templates
- **REPORT-V2-02**: Drill-down view (click category to see transactions)
- **REPORT-V2-03**: YTD/QTD views
- **REPORT-V2-04**: Draft watermark until all items categorized

### Integration

- **INT-V2-01**: Import chart of accounts from QuickBooks
- **INT-V2-02**: Export transactions to QuickBooks format

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Mobile app | Web responsive is sufficient for office use |
| Multi-tenant roles/permissions | All staff equal for MVP; 2-3 users |
| Real-time collaboration | Single-user editing per project sufficient |
| Inventory tracking | COGS uses simple Beginning/Purchases/Ending formula |
| Per-client rules | Firm-level rules sufficient; most vendors behave similarly across clients |
| PDF bank statement parsing | CSV universally supported; PDF OCR complex |
| Batch AI with queuing | Direct API calls sufficient for transaction volumes |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Pending |
| AUTH-02 | Phase 1 | Pending |
| AUTH-03 | Phase 1 | Pending |
| AUTH-04 | Phase 1 | Pending |
| SEC-01 | Phase 1 | Pending |
| SEC-02 | Phase 1 | Pending |
| SEC-03 | Phase 1 | Pending |
| SEC-04 | Phase 6 | Pending |
| SEC-05 | Phase 1 | Pending |
| SEC-06 | Phase 2 | Complete |
| SEC-07 | Phase 2 | Complete |
| EMAIL-01 | Phase 1 | Pending |
| EMAIL-02 | Phase 6 | Pending |
| EMAIL-03 | Phase 1 | Pending |
| PROJ-01 | Phase 1 | Pending |
| PROJ-02 | Phase 1 | Pending |
| PROJ-03 | Phase 1 | Pending |
| PROJ-04 | Phase 1 | Pending |
| UPLD-01 | Phase 2 | Complete |
| UPLD-02 | Phase 2 | Complete |
| UPLD-03 | Phase 2 | Complete |
| UPLD-04 | Phase 2 | Complete |
| UPLD-05 | Phase 2 | Complete |
| UPLD-06 | Phase 2 | Complete |
| UPLD-07 | Phase 2 | Complete |
| AICAT-01 | Phase 3 | Pending |
| AICAT-02 | Phase 3 | Pending |
| AICAT-03 | Phase 3 | Pending |
| AICAT-04 | Phase 3 | Pending |
| AICAT-05 | Phase 3 | Pending |
| AICAT-06 | Phase 3 | Pending |
| AICAT-07 | Phase 3 | Pending |
| AICAT-08 | Phase 3 | Pending |
| RULE-01 | Phase 3 | Pending |
| RULE-02 | Phase 3 | Pending |
| RULE-03 | Phase 3 | Pending |
| RULE-04 | Phase 3 | Pending |
| REVIEW-01 | Phase 4 | Pending |
| REVIEW-02 | Phase 4 | Pending |
| REVIEW-03 | Phase 4 | Pending |
| REVIEW-04 | Phase 4 | Pending |
| REVIEW-05 | Phase 4 | Pending |
| REVIEW-06 | Phase 4 | Pending |
| REVIEW-07 | Phase 4 | Pending |
| REVIEW-08 | Phase 4 | Pending |
| XFER-01 | Phase 4 | Pending |
| XFER-02 | Phase 4 | Pending |
| XFER-03 | Phase 4 | Pending |
| XFER-04 | Phase 4 | Pending |
| DUP-01 | Phase 4 | Pending |
| DUP-02 | Phase 4 | Pending |
| DUP-03 | Phase 4 | Pending |
| DUP-04 | Phase 4 | Pending |
| REPORT-01 | Phase 5 | Pending |
| REPORT-02 | Phase 5 | Pending |
| REPORT-03 | Phase 5 | Pending |
| REPORT-04 | Phase 5 | Pending |
| REPORT-05 | Phase 5 | Pending |
| COA-01 | Phase 5 | Pending |
| COA-02 | Phase 5 | Pending |
| COA-03 | Phase 5 | Pending |
| COA-04 | Phase 5 | Pending |
| CLIENT-01 | Phase 6 | Pending |
| CLIENT-02 | Phase 6 | Pending |
| CLIENT-03 | Phase 6 | Pending |
| CLIENT-04 | Phase 6 | Pending |
| CLIENT-05 | Phase 6 | Pending |
| CLIENT-06 | Phase 6 | Pending |
| RETAIN-01 | Phase 6 | Pending |
| RETAIN-02 | Phase 6 | Pending |
| RETAIN-03 | Phase 6 | Pending |

**Coverage:**
- v1 requirements: 72 total
- Mapped to phases: 72
- Unmapped: 0 ✓

---
*Requirements defined: 2025-01-27*
*Last updated: 2026-01-28 - Phase 2 requirements marked Complete*
