# Allo Inventory — Take-Home Exercise

A concurrency-safe inventory reservation system built with Next.js App Router, Prisma, and PostgreSQL.

## Live URL

> Deploy to Vercel and add the URL here before the debrief call.

---

## Local setup

### Prerequisites

- Node.js 18+
- A hosted Postgres instance ([Neon](https://neon.tech) or [Supabase](https://supabase.com) — both have free tiers)

### Steps

```bash
# 1. Clone and install
git clone https://github.com/YOUR_ORG/allo-inventory
cd allo-inventory
npm install

# 2. Configure environment
cp .env.example .env.local
# Edit .env.local and fill in DATABASE_URL, DIRECT_URL, CRON_SECRET

# 3. Run migrations
npx prisma migrate dev

# 4. Seed the database (creates 3 warehouses + 5 products with varied stock)
npm run db:seed

# 5. Start the dev server
npm run dev
# Open http://localhost:3000
```

### Environment variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | Pooled Postgres connection string (runtime) |
| `DIRECT_URL` | Direct (non-pooled) connection string (migrations) |
| `CRON_SECRET` | Secret used to authenticate the Vercel Cron route |
| `RESERVATION_WINDOW_MINUTES` | How long a reservation is held (default: 10) |

---

## How reservation expiry works

### In production (Vercel Cron)

`vercel.json` schedules `GET /api/cron/expire-reservations` every minute. The route:

1. Queries all `PENDING` reservations where `expiresAt < now()`.
2. For each, decrements `reserved` on the `Stock` row and sets `status = RELEASED` in a single transaction.
3. The route is protected by an `Authorization: Bearer <CRON_SECRET>` header check.

### In development / as a fallback (lazy cleanup)

Every `GET /api/reservations/:id`, `POST …/confirm`, and `POST …/release` request checks whether the reservation has expired before acting. If it has, the hold is released in the same transaction and the caller receives a 410. This means stock is always freed correctly even if the cron hasn't run yet.

---

## Concurrency strategy

The critical path is `POST /api/reservations`. The risk: two requests arrive simultaneously for the last unit of a SKU, both read `available = 1`, and both succeed — one customer gets a refund.

**Solution: `SELECT ... FOR UPDATE` inside a Prisma interactive transaction.**

```sql
-- Inside a transaction:
SELECT id, total, reserved FROM "Stock"
WHERE "productId" = $1 AND "warehouseId" = $2
FOR UPDATE;           -- acquires exclusive row-level lock
```

The lock is held until the transaction commits or rolls back. If two requests race:

1. Request A acquires the lock and reads `available = 1`.
2. Request B blocks at the `FOR UPDATE` line, waiting.
3. Request A decrements `reserved` and commits.
4. Request B unblocks, re-reads `available = 0`, throws `StockUnavailableError` → 409.

No Redis required. The correctness guarantee comes entirely from PostgreSQL's ACID properties.

**Why not optimistic locking (version fields)?** Optimistic locking puts the conflict detection on the client — a failed update requires a retry loop, which shifts complexity to the caller and is harder to reason about under high contention. For inventory (write-heavy, conflict likely), pessimistic locking is simpler and more predictable.

---

## Idempotency (bonus)

`POST /api/reservations` and `POST /api/reservations/:id/confirm` accept an optional `Idempotency-Key` header.

On first request: the response is stored in the `IdempotencyKey` table with a 24-hour TTL.  
On subsequent requests with the same key: the stored response is returned immediately, without re-executing the side effect.

The key is stored in Postgres (same DB, no extra infra needed). At scale, this would move to Redis for lower latency lookups.

---

## Trade-offs and what I'd do differently

| Trade-off | Decision | Alternative with more time |
|---|---|---|
| Expiry mechanism | Lazy cleanup + Vercel Cron | A dedicated worker with a priority queue for more precise release timing |
| Idempotency store | Postgres `IdempotencyKey` table | Redis with TTL for sub-millisecond lookups |
| Auth | None | Session-based auth; `userId` on `Reservation` to prevent cross-user confirm/release |
| Stock granularity | 1 unit per reservation | Variable quantity; quantity validation in the lock |
| No optimistic locking | Deliberate — pessimistic is simpler for this access pattern | Version-based OCC for lower-contention scenarios |
| No rate limiting | Out of scope for demo | Upstash Redis + sliding window on the reserve endpoint |

---

## Project structure

```
src/
├── app/
│   ├── api/
│   │   ├── products/route.ts
│   │   ├── warehouses/route.ts
│   │   ├── reservations/
│   │   │   ├── route.ts              POST — create reservation
│   │   │   └── [id]/
│   │   │       ├── route.ts          GET  — fetch reservation (for polling)
│   │   │       ├── confirm/route.ts  POST — confirm
│   │   │       └── release/route.ts  POST — release
│   │   └── cron/expire-reservations/route.ts
│   ├── products/page.tsx             Product listing (Server Component)
│   └── reservations/[id]/page.tsx   Checkout page
├── components/
│   ├── ProductCard.tsx               Reserve button + 409 error display
│   ├── ReservationView.tsx           Countdown, confirm, cancel, status
│   └── CountdownTimer.tsx
├── hooks/
│   ├── useReservation.ts             SWR polling + confirm/release actions
│   └── useCountdown.ts              Live second-by-second countdown
├── lib/
│   ├── db/prisma.ts                 Singleton Prisma client
│   ├── repositories/                Data access (raw SQL for locking)
│   ├── services/
│   │   ├── reservation.service.ts   All business logic + SELECT FOR UPDATE
│   │   └── idempotency.service.ts
│   └── errors/http.errors.ts
├── schemas/reservation.schema.ts    Zod — shared API ↔ frontend
└── types/
    ├── domain.types.ts
    └── api.types.ts
prisma/
├── schema.prisma
└── seed.ts
```

---

## Git history milestones

Each commit in this repo represents a working, deployable state:

1. `feat: project scaffold — Next.js, TypeScript, Prisma, Tailwind`
2. `feat(db): schema for Product, Warehouse, Stock, Reservation, IdempotencyKey`
3. `feat(db): seed with 5 products × 3 warehouses, varied stock levels`
4. `feat(api): GET /api/products and /api/warehouses`
5. `feat(api): POST /api/reservations with SELECT FOR UPDATE`
6. `feat(api): confirm and release endpoints with lazy expiry`
7. `feat(api): Zod validation and structured error handling`
8. `feat(ui): product listing page with per-warehouse Reserve button`
9. `feat(ui): checkout page with live countdown timer`
10. `feat(ui): 409 and 410 error handling in components`
11. `feat(expiry): Vercel Cron route for background cleanup`
12. `feat(bonus): idempotency with IdempotencyKey table`
13. `chore: README, .env.example, deployment docs`
