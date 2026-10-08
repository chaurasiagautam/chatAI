# chatAI — frontend

React + TypeScript + Vite UI for chatAI. See [../docs/architecture.md](../docs/architecture.md) for the overall design.

## Run

```bash
npm install
npm run dev        # http://localhost:5173
```

By default **every HTTP call is mocked** in the browser with [MSW](https://mswjs.io).
The app code makes real `fetch` calls; MSW intercepts them.

## Configuration — `.env`

All URLs live in **`frontend/.env`** (Vite's equivalent of `application.properties`). `src/config.ts` reads it and builds every API endpoint; the API client, the MSW mocks and the dev server all use it.

| Property | Default | Meaning |
|---|---|---|
| `VITE_USE_MOCKS` | `true` | `true` = MSW answers every API call; `false` = call the real backend |
| `VITE_API_BASE_URL` | `/api/v1` | Base URL of the REST API. Relative = same origin (proxied in dev, CloudFront in AWS); absolute = separate API host (needs CORS) |
| `VITE_BACKEND_URL` | `http://localhost:8080` | Dev server only — where a relative `VITE_API_BASE_URL` is proxied |
| `VITE_DEV_PORT` | `5173` | Dev server only — port for `npm run dev` |

To change values on your machine without touching the committed file, create **`.env.local`** (git-ignored) with just the overrides, e.g. to use the real backend:

```properties
VITE_USE_MOCKS=false
VITE_BACKEND_URL=http://localhost:8080
```

Per-environment builds can use `.env.production` / `.env.development`. Values are baked in at build time — restart `npm run dev` after editing.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server with mocks |
| `npm run build` | Type-check + production build into `dist/` |
| `npm test` | Vitest (unit + UI flow against the same MSW handlers) |
| `npm run typecheck` | TypeScript only |

## Layout

```
src/
├── config.ts     # reads .env; every API URL/endpoint is defined here
├── api/          # REST client, types (mirror docs §6), SSE stream parser
├── auth/         # bearer token provider (placeholder until OIDC login)
├── hooks/        # TanStack Query hooks, chat streaming state
├── components/   # Sidebar (ClientSwitcher, ProductList, UserCard), ChatView, Composer, MessageList
├── mocks/        # MSW handlers + seed data (entitlements, conversations, streamed answers)
└── styles/       # app.css — light/dark via prefers-color-scheme
```

## UI

- **Sign-in** — the user first pastes a bearer token. The UI calls `GET /api/v1/me/entitlements` with it; only a 200 unlocks the app (the backend resolves the token through the entitlement service). The token is kept in `sessionStorage` for the tab and sent on every call; any later 401 signs the user out. **Sign out** is in the user card. In mock mode the accepted token is `demo-token` (see `MOCK_VALID_TOKENS`).
- **Sidebar** — client switcher on top, expandable product tree in the middle (each product lists its chats + "New chat"), signed-in user at the bottom. Collapsible; overlay on mobile.
- **Chat window** — selecting a product opens a new chat scoped to that client/product; the first message creates the conversation. Answers stream in token by token with markdown and source citations; **Stop** cancels.
- **URL = scope** — `/c/{clientId}/p/{productId}/{conversationId}`.

## Mock data

`src/mocks/data.ts` — user *Jane Doe* entitled to ACME Corp (Payments, Lending, Cards), Globex (Treasury, FX) and Initech (Payroll), with a few seeded chats.
The handlers enforce the same rules as the backend: 401 for a missing or unknown bearer token, 403 for a client/product outside the entitlements, 404 for unknown conversations.
