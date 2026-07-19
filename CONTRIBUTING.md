# Contributing to Lumpo

Thanks for considering a contribution.

## Setup

```bash
npm install
cp .env.example .env   # fill in your own DB/SMTP/API keys
npm run build          # runs migrations
npm run dev
```

## Adding a new endpoint

Lumpo uses a feature-hub layout: each endpoint is a self-contained file under
`endpoints/<domain>/<feature>.js` (route + handler + validation), auto-loaded
by the route registry — no manual wiring needed. Only promote shared logic
into `services/`, `repositories/`, or `utils/` once it's used by 2+ endpoints.

## Guidelines

- CommonJS throughout (no ESM syntax).
- Every async handler wraps I/O in try/catch and throws a structured error
  (`AppError`/`NotFoundError`/`ValidationError`, etc.) for the global error
  middleware to catch.
- Validate all input at the boundary; never trust query/body params directly.
- Run `npm test` before opening a PR. New bug fixes should include a
  regression test.
- Keep functions short and single-purpose; prefer flat guard clauses over
  nested conditionals.

## Pull requests

1. Fork the repo and create a branch off `main`.
2. Keep PRs focused — one feature or fix per PR.
3. Describe what changed and why in the PR description.

## Reporting issues

Open a GitHub issue with steps to reproduce, expected vs. actual behavior,
and relevant logs (redact any API keys/tokens first).
