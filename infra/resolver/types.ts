import type { Address, Hex, PublicClient, WalletClient } from "viem"

export type ProtocolDeployment = {
	chainId: number
	chainKey: string
	chainName: string
	network: string
	rpcUrl: string
	rpcUrls: string[]
	owner: Address
	hubAddress: Address
	v3AdapterAddress: Address
	v4AdapterAddress?: Address
}

export type SupportedChainKey = "ethereum" | "base"

export type ResolverChainConfig = {
	chainId: number
	chainKey: SupportedChainKey
	deployment: ProtocolDeployment
	rpcUrls: string[]
	publicClient: PublicClient
	walletClient: WalletClient | null
	resolverAddress: Address | null
}

export type ResolverConfig = {
	chains: ResolverChainConfig[]
	orderTable: string
	poolsTable: string
	candidateScanLimit: number
	batchSize: number
	distanceMultiplier: number
	minProfitWei: bigint
	loopIntervalMs: number
	dryRun: boolean
}

export type OrdersTableRow = {
	id: string
	timestamp: string
	network: number
	status: string
	vault: string
	key: string
	data: Record<string, unknown>
}

export type PoolsTableRow = {
	id: string
	timestamp: string
	network: number
	pool: string
	data: Record<string, unknown>
}

export type StoredOrderState = {
	order: {
		vault: Address
		adapter: Address
		token0: Address
		token1: Address
		adapterData: Hex
		capital: string
		isSell: boolean
		targetTick: number | string
		triggerTicks: number | string
		closed: boolean
		rerangeCount: number | string
		createdAt: number | string
		accruedFee0: string
		accruedFee1: string
		idle0: string
		idle1: string
	}
	status: number | string
	progressBps: string
	remainingSource: string
	convertedTarget: string
	market: {
		currentTick: number | string
		twapTick: number | string
		sqrtPriceX96: string
		poolLiquidity: string
	}
	accruedFee0: string
	accruedFee1: string
	lowerTick: number | string
	upperTick: number | string
	liquidity: string
	rerangeCount: number | string
}

export type ParsedOrderCandidate = {
	row: OrdersTableRow
	orderKey: Hex
	status: string
	poolAddress: Address
	targetTick: number
	currentTick: number
	triggerTicks: number
	tickDistance: number
	readinessScore: number
	state: StoredOrderState
	poolRow?: PoolsTableRow
}

export type ParsedOrderCandidateWithPool = ParsedOrderCandidate & {
	poolRow: PoolsTableRow
}

export type PreviewReward = {
	orderKey: Hex
	reward0: bigint
	reward1: bigint
	rewardEthWei: bigint
	willClose: boolean
	poolAddress: Address
	poolRow: PoolsTableRow
	resultData: Hex
	state: StoredOrderState
}

export type BatchSimulation = {
	request: {
		address: Address
		abi: unknown
		functionName: "batchRerange"
		args: [Hex[]]
		account: Address
	}
	success: boolean[]
	results: Hex[]
	decodedRewards: PreviewReward[]
	orderKeys: Hex[]
}