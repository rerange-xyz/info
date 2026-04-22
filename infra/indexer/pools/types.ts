export type SubgraphConfig = {
	network: number
	id: string
	topPools?: number
}

export type Token = {
	id: string
	symbol: string
	name: string
	decimals: string
	derivedETH: string
}

export type Pool = {
	id: string
	createdAtTimestamp: string
	feeTier: string
	liquidity: string
	sqrtPrice: string
	tick: string
	token0Price: string
	token1Price: string
	totalValueLockedUSD: string
	totalValueLockedToken0: string
	totalValueLockedToken1: string
	volumeUSD: string
	feesUSD: string
	txCount: string
	token0: Token
	token1: Token
}

export type PoolsResponse = {
	data?: {
		pools?: Pool[]
	}
	errors?: Array<{ message?: string }>
}

export type PoolRow = {
	id: string
	timestamp: string
	network: number
	pool: string
	data: Pool
}

export type SyncResult = {
	synced: number
	inserted: number
	updated: number
	pruned: number
}