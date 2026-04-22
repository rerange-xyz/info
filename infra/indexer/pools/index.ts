import "dotenv/config"

import { fetchTopPools, resolveSubgraphs } from "./lib/subgraph.js"
import { upsertPools } from "./lib/supabase.js"
import { requireEnv, isDryRun } from "./lib/utils.js"
import type { PoolRow } from "./types.js"

async function main() {
	const apiKey = requireEnv("SUBGRAPH_API_KEY")
	const subgraphs = resolveSubgraphs()
	const rows: PoolRow[] = []

	for (const config of subgraphs) {
		const pools = await fetchTopPools(config, apiKey)
		const timestamp = new Date().toISOString()

		for (const pool of pools) {
			rows.push({
				id: `${config.network}:${pool.id.toLowerCase()}`,
				timestamp,
				network: config.network,
				pool: pool.id.toLowerCase(),
				data: pool,
			})
		}

		console.log(
			`Fetched ${pools.length} pools for network ${config.network} from subgraph ${config.id}`,
		)
	}

	if (isDryRun()) {
		console.log(`Dry run complete. Prepared ${rows.length} pool rows.`)
		return
	}

	const result = await upsertPools(rows)
	console.log(
		`Pools sync complete. Synced ${result.synced} pools. Inserted ${result.inserted}, updated ${result.updated}, pruned ${result.pruned}.`,
	)
}

main().catch((error) => {
	console.error(error)
	process.exit(1)
})