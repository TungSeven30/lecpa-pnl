# LeCPA P&L Generator

## What This Is

A web-based P&L (Profit & Loss) statement generator for CPA firms that automates bank transaction categorization using AI. Staff upload CSV bank/credit card statements, the system auto-categorizes transactions into accounting line items, staff review exceptions, and export professional P&L reports. The tool learns from corrections to improve accuracy over time.

## Core Value

**Staff can process a client's monthly financials in 15-30 minutes instead of several hours.** Everything else (fancy features, perfect UI) is secondary to this time savings.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Magic link authentication for staff
- [ ] CSV upload for checking and credit card statements
- [ ] Auto-detect CSV column mapping with user confirmation
- [ ] AI-powered transaction categorization (Claude Sonnet 4.5)
- [ ] Three-bucket system: Business / Personal / Needs Review
- [ ] Global learning rules from user corrections
- [ ] Transaction review interface with batch actions
- [ ] Transaction splitting for mixed-use purchases
- [ ] CC payment reconciliation (detect transfers, exclude from P&L)
- [ ] Duplicate detection and handling
- [ ] P&L report generation with prior period comparison
- [ ] PDF and Excel export
- [ ] Client email review flow for ambiguous transactions
- [ ] Industry-specific chart of accounts (Real Estate, E-Commerce, Medical)

### Out of Scope

- PDF/OFX statement parsing — CSV sufficient for MVP, all banks support it
- OAuth login (Google, etc.) — Magic link simpler for small team
- Mobile app — Web responsive is sufficient
- Multi-tenant roles/permissions — All staff equal for MVP
- Real-time collaboration — Single-user editing per project
- Inventory tracking — COGS uses simple Beginning/Purchases/Ending
- Marketing/bulk email — Only transactional email (magic links, client review) via Resend

## Context

**Business Context:**
- Primary users: Tinh Le CPA staff (2-3 people)
- Each staff member processes 10-20 clients/month during tax season
- Current process: Manual categorization in Excel, 2-4 hours per client
- Target: 15-30 minutes per client with this tool

**Technical Environment:**
- Cloudflare ecosystem (company already uses it)
- No existing codebase — greenfield project
- Domain available: pnl.tinhcpa.com

**Industries Supported (MVP):**
1. Real Estate (Realtors, property management)
2. E-Commerce / Retail
3. Medical / Healthcare consulting

Each has a specific chart of accounts template derived from actual CPA practice.

**Key Accounting Concepts:**
- P&L sections: Revenue → COGS → Gross Profit → Operating Expenses → Net Income
- Personal expenses → Shareholder Distribution (not a business expense)
- CC payments from checking → Transfer (not an expense, already on CC statement)

## Constraints

- **Stack**: Cloudflare (Pages + Workers + D1 + R2) — company standardized
- **AI Provider**: Anthropic Claude (model IDs configured via env vars, with fallback chain)
- **Email**: Resend for transactional email (magic links, client review links)
- **Budget**: Cost-conscious on AI — batch efficiently, cache aggressively
- **Timeline**: 6-week target for MVP
- **Data Retention**: 7 years (IRS statute of limitations)
- **Data Minimization**: No raw CSV rows stored; parse only needed fields (date, description, amount, memo). No SSN or full account numbers.
- **PII Scope**: Only client name/email stored as identifiable data; transaction descriptions may contain partial merchant info

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| CSV only for MVP | Reduces complexity; all banks support CSV export | — Pending |
| Cloudflare stack | Company already uses it; consolidated infrastructure | — Pending |
| Three-bucket categorization | Clear decision tree; uncertain → human review | — Pending |
| Global learning rules | Most vendors behave similarly; simpler rule management | — Pending |
| Claude models via env vars | Model IDs configurable; fallback chain: Sonnet → Opus → Haiku → error | — Pending |
| Resend for email | Transactional email for magic links and client review; free tier sufficient | — Pending |
| No raw CSV storage | Data minimization: store only parsed fields, not original row | — Pending |
| 7-year retention with 30-day purge warning | Covers IRS statute; admin can extend | — Pending |
| Magic link auth | Simple for small team; no password management | — Pending |
| Hono framework for Workers | Lightweight, fast, good DX for Cloudflare Workers | — Pending |
| Drizzle ORM for D1 | Type-safe, lightweight, good D1 support | — Pending |
| React + Vite frontend | Mature ecosystem, good Cloudflare Pages support | — Pending |
| Firm-level rules (not global) | Prevents cross-firm vendor leakage | — Pending |

---
*Last updated: 2025-01-27 after initialization*
