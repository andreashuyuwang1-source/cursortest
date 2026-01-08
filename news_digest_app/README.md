## Daily News Digest (Global Politics, Tech, Fundraising, Markets)

Small web app that fetches articles every morning from configured sources (RSS), groups them into:

- Global politics
- Technology
- Fundraising activity
- Stock market activity

It generates a concise digest with **links to the original articles**, and stores each day’s digest in SQLite so you can revisit prior mornings.

### Included sources (default)

The default config includes feeds from:

- New York Times (NYTimes)
- Forbes
- TechCrunch
- Wall Street Journal (WSJ)
- The Economist

You can add/remove sources in `config/sources.yaml`.

---

## Quickstart

### 1) Create a venv and install deps

```bash
cd /workspace/news_digest_app
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 2) Run the web app

```bash
uvicorn app.main:app --reload --port 8000
```

Open `http://localhost:8000`.

### 3) Generate today’s digest now (manual run)

```bash
python -m app.cli run
```

### 4) Schedule it every morning (cron example)

Runs daily at 7:00 AM local time:

```bash
crontab -e
```

Add:

```cron
0 7 * * * /bin/bash -lc 'cd /workspace/news_digest_app && source .venv/bin/activate && python -m app.cli run >> digest-cron.log 2>&1'
```

---

## Configuration

### Sources

Edit `config/sources.yaml`:

- Each source has a `name`, `homepage`, and one or more `feeds`.
- Each feed can include an optional `category_hint` (used for routing).

### Time window

By default, the app considers items from the last 36 hours (to avoid missing “overnight” posts). You can change this in `config/settings.yaml`.

---

## API

- `GET /`: latest digest
- `GET /digests`: list stored digests
- `GET /digests/{date}`: digest for a specific date (`YYYY-MM-DD`)
- `POST /admin/run`: generate digest now (no auth by default; protect it if deploying)
- `GET /api/latest`: JSON for latest digest

---

## Notes / Caveats

- Some publishers (notably WSJ/Economist) may provide only partial text via RSS or may restrict full article access. The app will still link to the original story and summarize from what it can retrieve.
- Summaries are **extractive** (no LLM/API key needed). If you want LLM summaries later, it’s easy to swap in.

