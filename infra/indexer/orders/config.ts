import type { Address } from "viem"

import { protocolDeployments } from "@rerange/wagmi"

export type SupportedChainKey = "ethereum" | "base"

type PublicDeploymentConfig =
	(typeof protocolDeployments)[keyof typeof protocolDeployments]

export type ProtocolDeployment = PublicDeploymentConfig & {
	chainName: string
	hubAddress: Address
	rpcUrls: string[]
}

export type ChainConfig = {
	chainId: number
	chainKey: SupportedChainKey
	averageBlockTimeSeconds: number
	deployment: ProtocolDeployment
	rpcUrls: string[]
}

export type OrdersIndexerConfig = {
	chains: ChainConfig[]
	lookbackHours: number
	retentionDays: number
	tableName: string
}

const DEFAULT_LOOKBACK_HOURS = 2
const DEFAULT_RETENTION_DAYS = 7
const DEFAULT_TABLE_NAME = "orders"

const CHAIN_NAME_BY_KEY: Record<SupportedChainKey, string> = {
	ethereum: "Ethereum",
	base: "Base",
}

const DEFAULT_RPC_URLS: Record<SupportedChainKey, string[]> = {
	ethereum: [
        "https://ethereum-rpc.publicnode.com",
		"https://eth.llamarpc.com",
        "https://eth.drpc.org",
	],
	base: [
		"https://mainnet.base.org",
		"https://base-rpc.publicnode.com",
		"https://base.llamarpc.com",
	],
}

const SUPPORTED_CHAINS: Array<{
	chainId: number
	chainKey: SupportedChainKey
	averageBlockTimeSeconds: number
}> = [
	{
		chainId: 1,
		chainKey: "ethereum",
		averageBlockTimeSeconds: 12,
	},
	{
		chainId: 8453,
		chainKey: "base",
		averageBlockTimeSeconds: 2,
	},
]

function parsePositiveNumber(value: string | undefined, fallback: number): number {
	if (!value) {
		return fallback
	}

	const parsed = Number(value)
	if (!Number.isFinite(parsed) || parsed <= 0) {
		throw new Error(`Expected a positive number, received: ${value}`)
	}

	return parsed
}

function parseRpcOverrides(): Partial<Record<string, string[]>> {
	const raw = process.env.RERANGE_RPC_URLS?.trim()
	if (!raw) {
		return {}
	}

	let parsed: unknown
	try {
		parsed = JSON.parse(raw)
	} catch (error) {
		throw new Error(`RERANGE_RPC_URLS must be valid JSON: ${String(error)}`)
	}

	if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
		throw new Error("RERANGE_RPC_URLS must be a JSON object")
	}

	const overrides: Partial<Record<string, string[]>> = {}
	for (const [key, value] of Object.entries(parsed)) {
		if (!Array.isArray(value) || value.some((entry) => typeof entry !== "string")) {
			throw new Error(
				`RERANGE_RPC_URLS.${key} must be an array of strings`,
			)
		}

		overrides[key] = value.map((entry) => entry.trim()).filter(Boolean)
	}

	return overrides
}

function getDeploymentByChainId(chainId: number): PublicDeploymentConfig | null {
	return protocolDeployments[chainId] ?? null
}

function normalizeDeployment(params: {
	chainKey: SupportedChainKey
	deployment: PublicDeploymentConfig
	rpcUrls: string[]
}): ProtocolDeployment {
	return {
		...params.deployment,
		chainName: CHAIN_NAME_BY_KEY[params.chainKey],
		hubAddress: params.deployment.contracts.rerangeHub as Address,
		rpcUrls: params.rpcUrls,
	}
}

function resolveRpcUrls(params: {
	chainId: number
	chainKey: SupportedChainKey
	deployment: ProtocolDeployment
	rpcOverrides: Partial<Record<string, string[]>>
}): string[] {
	const override =
		params.rpcOverrides[params.chainKey] ??
		params.rpcOverrides[String(params.chainId)] ??
		[]

	const rpcUrls =
		override.length > 0
			? override
			: params.deployment.rpcUrls.length > 0
			? params.deployment.rpcUrls
			: DEFAULT_RPC_URLS[params.chainKey]

	if (rpcUrls.length === 0) {
		throw new Error(`No RPC urls configured for chain ${params.chainId}`)
	}

	return [...new Set<string>(rpcUrls)]
}

export function resolveIndexerConfig(): OrdersIndexerConfig {
	const rpcOverrides = parseRpcOverrides()
	const chains = SUPPORTED_CHAINS.map((chain) => {
		const deployment = getDeploymentByChainId(chain.chainId)
		if (!deployment) {
			throw new Error(`No SDK deployment configured for chain ${chain.chainId}`)
		}

		const rpcUrls = resolveRpcUrls({
			chainId: chain.chainId,
			chainKey: chain.chainKey,
			deployment: normalizeDeployment({
				chainKey: chain.chainKey,
				deployment,
				rpcUrls: [],
			}),
			rpcOverrides,
		})

		return {
			chainId: chain.chainId,
			chainKey: chain.chainKey,
			averageBlockTimeSeconds: chain.averageBlockTimeSeconds,
			deployment: normalizeDeployment({
				chainKey: chain.chainKey,
				deployment,
				rpcUrls,
			}),
			rpcUrls,
		}
	})

	return {
		chains,
		lookbackHours: parsePositiveNumber(
			process.env.ORDER_LOOKBACK_HOURS,
			DEFAULT_LOOKBACK_HOURS,
		),
		retentionDays: parsePositiveNumber(
			process.env.ORDER_RETENTION_DAYS,
			DEFAULT_RETENTION_DAYS,
		),
		tableName: process.env.ORDERS_TABLE?.trim() || DEFAULT_TABLE_NAME,
	}
}