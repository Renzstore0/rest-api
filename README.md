# Lumpo

A self-hosted REST API hub built on Node.js/Express — one server, many small
independent endpoints: AI tools, media downloaders, anime/manga scrapers,
image/canvas makers, mini-games, and account/API-key management.

Each feature lives in its own file and is auto-loaded by a route registry, so
adding a new endpoint doesn't require touching a central router.

## Features

| Category | Examples |
|---|---|
| **AI** | Upscaling (real ESRGAN model, not just resizing), background removal, chat completions (OpenAI/NVIDIA NIM/other providers), image generation |
| **Downloaders** | YouTube, TikTok, Instagram, Facebook, Twitter/X, Pinterest, Spotify |
| **Anime/Manga** | Samehadaku scraper (latest, search, detail, download links, genres, trending), MyAnimeList lookup |
| **Maker/Canvas** | Fake social post generator (20+ platforms), quote-chat image renderer, Brat-style covers, IG story cards |
| **Tools** | WhatsApp number checker, website screenshot, lyrics lookup, FIFA rankings |
| **Games** | 15+ "guess the ___" mini-games (anime, flag, food, logo, song, etc.) |
| **Platform** | API key issuance & management, usage analytics dashboard, IP blacklist, role-based access, QRIS payment flow for plan upgrades |

## Tech stack

- **Runtime:** Node.js (>=24) + Express 5, CommonJS
- **Database:** MySQL (`mysql2`), session store in MySQL
- **Views:** EJS (server-rendered dashboard/admin/auth pages)
- **Media:** `sharp`, `@napi-rs/canvas`, `fluent-ffmpeg`, `@tensorflow/tfjs-node` (AI upscale worker)
- **Scraping:** `cheerio`, `axios`, [`sengkrep-ryna`](https://www.npmjs.com/package/sengkrep-ryna) as the shared scraper reliability layer

## Getting started

### Prerequisites

- Node.js 24+
- A MySQL server
- `ffmpeg` available on the host (bundled via `@ffmpeg-installer/ffmpeg`, no separate install needed)

### Setup

```bash
git clone https://github.com/<your-username>/lumpo.git
cd lumpo
npm install

cp .env.example .env
# edit .env with your DB credentials, session secret, SMTP, and any
# provider API keys for the features you want to enable

npm run build     # runs database migrations (config/migrate.js)
npm run dev       # development, with nodemon
# or
npm start         # production
```

The server starts on `PORT` (default `3000`). Visit `/` for the dashboard.

### Environment variables

See [`.env.example`](.env.example) for the full list. Nothing is hardcoded —
every credential, secret, and third-party key is read from `process.env`.
Features tied to an unset key (e.g. `OPENAI_API_KEY`) simply return an error
when called rather than crashing the server.

## Project structure

```
endpoints/<domain>/<feature>.js   # self-contained route + handler + validation, auto-loaded
services/                        # business logic shared by 2+ endpoints
repositories/                    # DB queries
middlewares/                     # auth, rate limiting, anti-DDoS, request logging
controllers/                     # auth/upload/view controllers for non-API (web) routes
routes/                          # web.js, auth.js, api.js — top-level mounting only
config/                          # DB pool, migration runner
views/                           # EJS templates for the dashboard/admin/auth pages
tests/                           # Jest + Supertest
```

New endpoints go under `endpoints/<domain>/`; only promote logic to
`services/`/`repositories/`/`utils/` once it's shared by more than one
endpoint — see [CONTRIBUTING.md](CONTRIBUTING.md).

## API keys

Every `/api/*` route (except a small public allowlist) requires an API key,
either as a query param or header:

```
GET /api/anime/samehadaku/latest?apikey=YOUR_KEY
x-api-key: YOUR_KEY
```

Keys are issued per-account with per-key request limits and are managed
through the dashboard (`/dashboard`) or the `apikey-*` admin endpoints.

## Testing

```bash
npm test
```

Jest + Supertest. Unit tests mock the layer below them; integration tests hit
the real router.

## Disclaimer

Some endpoints (scrapers, downloaders) fetch data from third-party sites and
services. They're provided for personal/educational use — check the target
site's terms of service and applicable law in your jurisdiction before
deploying publicly. Lumpo doesn't rehost or redistribute any copyrighted media
itself; downloader endpoints proxy/stream from the original source.

## License

MIT — see [LICENSE](LICENSE).
