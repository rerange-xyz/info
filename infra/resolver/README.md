# Resolver

Resolver worker for Rerange protocol infra. It reads likely rerange candidates from Supabase `orders`, matches them to indexed `pools`, simulates `batchRerange`, removes failed items, prices resolver rewards in ETH terms with token `derivedETH`, estimates gas, and executes only when the batch is profitable.

## Environment

- `SUPABASE_URL`: Supabase project URL.
- `SUPABASE_SECRET_KEY`: Supabase service key.
- `RERANGE_RESOLVER_KEY`: Resolver signer private key. Optional only when `DRY_RUN=true`.
- `RESOLVER_CANDIDATE_SCAN_LIMIT`: Max non-closed orders fetched per chain. Defaults to `64`.
- `RESOLVER_BATCH_SIZE`: Max orders simulated/executed per chain batch. Defaults to `12`.
- `RESOLVER_DISTANCE_MULTIPLIER`: Candidate filter multiplier for `abs(currentTick - targetTick) <= triggerTicks * multiplier`. Defaults to `1.1`.
- `RESOLVER_MIN_PROFIT_WEI`: Extra ETH-denominated safety margin above gas cost. Defaults to `0`.
- `RESOLVER_ORDER_TABLE`: Supabase orders table name. Defaults to `orders`.
- `RESOLVER_POOLS_TABLE`: Supabase pools table name. Defaults to `pools`.
- `RERANGE_RPC_URLS`: Optional JSON object overriding RPC URLs by chain key or chain id.
- `RESOLVER_LOOP_INTERVAL_MS`: If greater than `0`, reruns the workflow in-process on that interval instead of exiting after one pass.
- `DRY_RUN`: When `true`, logs profitable batches without sending transactions.

## Run

```bash
npm install
cp .env.example .env
npm run start -- --dry-run
```
