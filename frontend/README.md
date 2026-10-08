# chatAI — frontend

React + TypeScript + Vite UI for chatAI. See [../docs/architecture.md](../docs/architecture.md) for the overall design.

## Run

```bash
npm install
npm run dev        # http://localhost:5173
```

By default **every HTTP call is mocked** in the browser with [MSW](https://mswjs.io) (`VITE_USE_MOCKS=true` in `.env`).
The app code makes real `fetch` calls to `/api/v1/...`; MSW intercepts them, so switching to the real backend is just:

```bash
VITE_USE_MOCKS=false npm run dev   # /api is proxied to http://localhost:8080
```

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
├── api/          # REST client, types (mirror docs §6), SSE stream parser
├── auth/         # bearer token provider (placeholder until OIDC login)
├── hooks/        # TanStack Query hooks, chat streaming state
├── components/   # Sidebar (ClientSwitcher, ProductList, UserCard), ChatView, Composer, MessageList
├── mocks/        # MSW handlers + seed data (entitlements, conversations, streamed answers)
└── styles/       # app.css — light/dark via prefers-color-scheme
```

## UI

- **Sidebar** — client switcher on top, expandable product tree in the middle (each product lists its chats + "New chat"), signed-in user at the bottom. Collapsible; overlay on mobile.
- **Chat window** — selecting a product opens a new chat scoped to that client/product; the first message creates the conversation. Answers stream in token by token with markdown and source citations; **Stop** cancels.
- **URL = scope** — `/c/{clientId}/p/{productId}/{conversationId}`.

## Mock data

`src/mocks/data.ts` — user *Jane Doe* entitled to ACME Corp (Payments, Lending, Cards), Globex (Treasury, FX) and Initech (Payroll), with a few seeded chats.
The handlers enforce the same rules as the backend: 401 without a bearer token, 403 for a client/product outside the entitlements, 404 for unknown conversations.
