# LeCPA P&L Generator

A web-based Profit & Loss statement generator for CPA firms that automates bank transaction categorization using AI.

## What It Does

Staff upload CSV bank/credit card statements → AI auto-categorizes transactions → Staff review exceptions → Export professional P&L reports.

**Time savings:** 2-4 hours of manual categorization → 15-30 minutes of AI-assisted review.

## Features

- **CSV Upload**: Upload Chase, Bank of America, Wells Fargo, Capital One, or Amex statements
- **AI Categorization**: Claude-powered classification into Business / Personal / Needs Review
- **Learning Rules**: System learns from corrections and applies rules to future transactions
- **Transaction Review**: Paginated list with filters, batch actions, and transaction splitting
- **Transfer Detection**: Automatically identifies and excludes CC payments from P&L
- **Duplicate Detection**: Flags potential duplicate transactions for review
- **Client Review**: Send ambiguous items to clients via secure link for clarification
- **P&L Export**: Generate professional PDF and Excel reports with prior period comparison
- **Industry Templates**: Pre-built charts of accounts for Real Estate, E-Commerce, and Medical

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React + Vite |
| Backend | Cloudflare Workers (Hono) |
| Database | Cloudflare D1 (SQLite) |
| File Storage | Cloudflare R2 |
| AI | Anthropic Claude (Sonnet 4 / Opus 4) |
| Auth | Email magic link (JWT sessions) |

## Project Structure

```
├── .planning/           # GSD workflow artifacts
│   ├── PROJECT.md       # Project context and decisions
│   ├── REQUIREMENTS.md  # v1 requirements with traceability
│   ├── ROADMAP.md       # 6-phase implementation plan
│   ├── STATE.md         # Current progress state
│   └── config.json      # Workflow preferences
├── src/
│   ├── frontend/        # React application
│   └── backend/         # Cloudflare Workers API
├── README.md
└── CLAUDE.md            # AI assistant instructions
```

## Development

### Prerequisites

- Node.js 20+
- Cloudflare account with Workers, D1, and R2 enabled
- Anthropic API key

### Setup

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your API keys

# Run locally
npm run dev
```

### Deployment

```bash
# Deploy to Cloudflare
npm run deploy
```

## Roadmap

| Phase | Description | Status |
|-------|-------------|--------|
| 1 | Foundation (Auth, Projects, Security) | Not started |
| 2 | Upload & Parse (CSV, Column Detection) | Not started |
| 3 | AI Categorization (Claude, Rules Engine) | Not started |
| 4 | Review Interface (Transaction UI, Detection) | Not started |
| 5 | Reports & Export (P&L, PDF/Excel) | Not started |
| 6 | Client Review & Polish (Client Flow, Retention) | Not started |

See `.planning/ROADMAP.md` for detailed phase breakdowns.

## Contributing

This is an internal tool for Tinh Le CPA. Contributions are welcome from team members.

## License

Proprietary - Tinh Le CPA
