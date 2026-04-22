import type { Address, Hex } from "viem"

export type OrderRow = {
	id: string
	timestamp: string
	network: number
	status: string
	vault: string
	key: string
	data: Record<string, unknown>
}

export type SyncResult = {
	synced: number
	inserted: number
	updated: number
}

export type OrderEventRecord = {
	orderKey: Hex
	blockNumber: bigint
	logIndex: number
	transactionHash: Hex
	timestamp: string
	args: Record<string, unknown>
}

export type OrderSnapshot = {
	orderKey: Hex
	status: string
	vault: Address
	data: Record<string, unknown>
}

export type ChainSyncSummary = {
	chainId: number
	chainKey: string
	fromBlock: bigint
	toBlock: bigint
	openedEvents: number
	closedEvents: number
	openedSync: SyncResult
	closedSync: SyncResult
	pruned: number
}