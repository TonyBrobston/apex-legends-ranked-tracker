# Apex Legends Ranked Tracker

Next.js app that tracks ranked history for a configured list of Apex Legends
accounts: current rank, and a match-by-match history of legend played, RP
gained/lost, and rank at the time of the match.

## How it works

- **`app`** — the Next.js web UI. Home page lists the configured accounts;
  clicking one shows its ranked match history.
- **`poller`** — a background worker that polls the
  [Tracker.gg Apex API](https://tracker.gg/developers) on an interval and
  writes rank snapshots + match history into Postgres.
- **`db`** — Postgres, persisted via a Docker volume, shared by `app` and
  `poller`.

Match history is stored in the database (not just fetched live) so it
accumulates over time, since the public API generally only returns a limited
window of recent matches.

## Setup

1. Copy `apex.env.example` to `apex.env` and fill in:
   - `ACCOUNTS` — comma-separated `platform:accountName` pairs, e.g.
     `origin:MyName,psn:OtherAccount`. Platform is one of `origin` (PC),
     `psn` (PlayStation), `xbl` (Xbox).
   - `TRACKER_API_KEY` — free key from https://tracker.gg/developers.
2. `docker compose --env-file apex.env up --build`
3. Open http://localhost:3000

`apex.env` holds real secrets and is gitignored; `apex.env.example` is the
committed template. Docker Compose doesn't auto-load a non-`.env`-named file,
so the `--env-file apex.env` flag is required on every `docker compose`
invocation (or `export COMPOSE_ENV_FILES=apex.env` in your shell to avoid
typing it each time).

The `poller` service syncs immediately on startup, then every
`POLL_INTERVAL_MINUTES` (default 15). You can also click **Sync now** on the
home page to trigger an immediate sync from the UI.

## Important: verify the Tracker.gg field mapping

Tracker.gg's public API field names have shifted across versions and aren't
fully documented. The mapping in `src/lib/tracker.ts` (`pick(...)` calls) is
a best-effort guess at where `legendName`, `rpChange`, `rankScore`, etc. live
in the response, written without a live API key to test against.

Every match is stored with its full raw API payload in `Match.raw`, so if a
field renders as "—" in the UI but you can see the real value in `raw`,
open that match's row and adjust the corresponding `pick([...])` candidate
list in `src/lib/tracker.ts` — no data is lost while you do this, since
`raw` is preserved and `Match` rows are upserted (re-synced) on each poll.

## Local development (without Docker)

```bash
npm install
docker run -d --name apex-pg -e POSTGRES_USER=apex -e POSTGRES_PASSWORD=apex \
  -e POSTGRES_DB=apex_tracker -p 5432:5432 postgres:16-alpine
DATABASE_URL="postgresql://apex:apex@localhost:5432/apex_tracker" npx prisma migrate deploy
npm run dev
```

Run the poller separately with `npm run poll` (needs `DATABASE_URL`,
`TRACKER_API_KEY`, and `ACCOUNTS` set in the environment).

## Schema changes

After editing `prisma/schema.prisma`, generate a migration against a local
database:

```bash
DATABASE_URL="postgresql://apex:apex@localhost:5432/apex_tracker" npx prisma migrate dev --name <description>
```

Commit the generated `prisma/migrations/**` folder — `docker compose up`
applies migrations automatically on container start (`prisma migrate deploy`).
