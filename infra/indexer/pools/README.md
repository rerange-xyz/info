# Pools Indexer

Simple daily indexer for top Uniswap v3 liquidity pools. It fetches pool data with token prices from the Uniswap v3 subgraph and writes the payload into the `pools` table in Supabase.

## Environment

- `SUBGRAPH_API_KEY`: The Graph gateway API key.
- `SUPABASE_URL`: Supabase project URL.
- `SUPABASE_SECRET_KEY`: Supabase service key.
- `UNISWAP_V3_SUBGRAPHS`: Optional JSON array of subgraph configs.
- `UNISWAP_TOP_POOLS_LIMIT`: Optional default pool count per network.

Example `UNISWAP_V3_SUBGRAPHS`:

```json
[
  {
    "network": 1,
    "id": "5zvR82QoaXYFyDEKLZ9t6v9adgnptxYpKpSbxtgVENFV",
    "topPools": 100
  }
]
```

## Local run

```bash
npm install
cp .env.example .env
npm run start -- --dry-run
```

## Supabase table

Expected schema: [pools_table.sql](./pools_table.sql)
