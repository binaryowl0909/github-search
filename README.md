# GitHub Search

A fullstack single-page app for searching GitHub: a React + TypeScript frontend
talking to a Django REST Framework backend, with Redis caching search results
on the server side.

## High-level solution

The frontend never talks to the GitHub API directly — every search goes through
a single backend endpoint, `POST /api/search`. The backend proxies the request
to the GitHub Search API and caches each result in Redis, keyed by search type
and normalized search text (`(type, trim+lowercase(text))`), for two hours
(`SEARCH_CACHE_TTL`, configurable via an environment variable). A repeated
search for the same term and type within that window is served straight from
Redis without hitting GitHub again.

On the client, input is debounced 300 ms (via lodash) and a search only fires
once the term reaches three characters, cutting down on redundant requests
while the user is still typing. The `useGithubSearch` hook also keeps its own
in-memory cache (a `Map` keyed `${type}:${term}`), so re-running a search
already seen in the current session resolves instantly with no network call.
The hook tracks which search type a result belongs to and only commits a
response to state if it still matches the latest request, which avoids a race
where a slow "users" response could overwrite a newer "repositories" result if
the user switches the dropdown mid-search.

## Running locally

### Backend

Redis is required. Either run it via Docker Compose, or point at a locally
installed `redis-server`:

    docker compose up -d redis
    # or: redis-server

Then start the Django app:

    cd backend
    python3 -m venv .venv && source .venv/bin/activate
    pip install -r requirements.txt
    python manage.py runserver          # http://127.0.0.1:8000
    # optional: export GITHUB_TOKEN=... to raise GitHub's rate limits

### Frontend

    cd frontend
    npm install
    npm run dev                         # http://localhost:5173 (proxies /api to the backend)

## API

- `POST /api/search` — body `{"search_type": "users"|"repositories"|"issues", "search_text": "react"}`,
  returns the raw GitHub Search API payload (`total_count`, `incomplete_results`, `items`).
- `POST /api/clear-cache` — flushes every cached search result from Redis.
- Interactive Swagger UI: `/api/docs/`
- Raw OpenAPI schema (JSON): `/api/schema/`

## Tests

    cd backend && source .venv/bin/activate && python manage.py test    # 18 tests
    cd frontend && npm test                                             # 18 tests

Backend tests are Django `TestCase`s that run against `LocMemCache` (so the
suite doesn't need a real Redis instance) with all GitHub API calls mocked, so
the whole suite runs fast and fully offline. Frontend tests use Vitest and
React Testing Library.

## Decisions

- **No Redux, no redux-persist, no router.** The app is a single screen with
  one search flow; a `Map` inside a hook satisfies the caching requirement
  with much less code and complexity than a global store would add.
- **The backend accepts `issues` as a search type**, per the spec, but the UI
  dropdown only exposes Users and Repositories, matching the spec's
  description of the interface.
- **Search text is normalized** (trimmed and lowercased) before it's used as a
  cache key on both frontend and backend, so cache hits are case-insensitive
  and whitespace-insensitive.
- **User cards show only what GitHub's search endpoint returns** — login,
  avatar, account type, and profile link. Fields like name or location live on
  the user's individual profile endpoint and would need one extra API call per
  result, which isn't worth the added latency and rate-limit cost for this
  use case.
- **Error mapping:** a GitHub `403` (rate limit) is surfaced to the frontend as
  `429`; any other non-`200` GitHub response becomes a `502`; and a network
  failure reaching GitHub becomes a `503`. The frontend renders whatever
  message comes back in an error/alert state.

## Deployment

Deploying and sharing a public URL is intentionally left out of this
repository, since it depends on a choice of hosting platform and credentials.
A reasonable path: containerize each service with its own `Dockerfile` and
deploy via Docker Compose to a platform such as Fly.io, Render, or Railway,
with `DEBUG=0` and `ALLOWED_HOSTS` set on the backend, the frontend built and
served as static files (e.g. via WhiteNoise or the platform's static
hosting), and `REDIS_URL` pointing at a managed Redis instance.
