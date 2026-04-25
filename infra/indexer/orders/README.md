# Orders Indexer

Simple multichain indexer for protocol orders. It reads `OrderOpened` and `OrderClosed` events from the hub, upserts order snapshots into Supabase, marks closed orders, and deletes closed older rows.

## Environment

- `SUPABASE_URL`: Supabase project URL.
- `SUPABASE_SECRET_KEY`: Supabase service key.
- `ORDER_LOOKBACK_HOURS`: Optional RPC lookback window. Defaults to `3`.
- `ORDER_RETENTION_DAYS`: Optional closed-order retention window. Defaults to `7`.
- `ORDERS_TABLE`: Optional Supabase table name. Defaults to `orders`.
- `RERANGE_RPC_URLS`: Optional JSON object that overrides RPC URLs by chain key or chain id.

## Local run

```bash
npm install
cp .env.example .env
npm run start -- --dry-run
```

## Supabase table

Expected schema: [orders_table.sql](./orders_table.sql)
