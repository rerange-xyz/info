import { createPublicClient, createWalletClient, defineChain } from "viem"
import { privateKeyToAccount } from "viem/accounts"

import { protocolDeployments } from "@rerange/wagmi"

import type {
	ProtocolDeployment,
	ResolverChainConfig,
	ResolverConfig,
	SupportedChainKey,
} from "./types.js"

import { createRpcTransport } from "./lib/rpc.js"
import { isDryRun, requireEnv } from "./lib/utils.js"

const DEFAULT_ORDER_TABLE = "orders"
const DEFAULT_POOLS_TABLE = "pools"
const DEFAULT_CANDIDATE_SCAN_LIMIT = 64
const DEFAULT_BATCH_SIZE = 12
const DEFAULT_DISTANCE_MULTIPLIER = 1.1
const DEFAULT_LOOP_INTERVAL_MS = 0

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

const CHAIN_NAME_BY_KEY: Record<SupportedChainKey, string> = {
	ethereum: "Ethereum",
	base: "Base",
}

const SUPPORTED_CHAINS: Array<{ chainId: number; chainKey: SupportedChainKey }> = [
	{ chainId: 1, chainKey: "ethereum" },
	{ chainId: 8453, chainKey: "base" },
]

type PublicDeploymentConfig =
	(typeof protocolDeployments)[keyof typeof protocolDeployments]

function parsePositiveInt(value: string | undefined, fallback: number) {
	if (!value) {
		return fallback
	}

	const parsed = Number(value)
	if (!Number.isFinite(parsed) || parsed <= 0 || !Number.isInteger(parsed)) {
		throw new Error(`Expected a positive integer, received: ${value}`)
	}

	return parsed
}

function parseNonNegativeInt(value: string | undefined, fallback: number) {
	if (!value) {
		return fallback
	}

	const parsed = Number(value)
	if (!Number.isFinite(parsed) || parsed < 0 || !Number.isInteger(parsed)) {
		throw new Error(`Expected a non-negative integer, received: ${value}`)
	}

	return parsed
}

function parsePositiveFloat(value: string | undefined, fallback: number) {
	if (!value) {
		return fallback
	}

	const parsed = Number(value)
	if (!Number.isFinite(parsed) || parsed <= 0) {
		throw new Error(`Expected a positive number, received: ${value}`)
	}

	return parsed
}

function parseBigIntValue(value: string | undefined, fallback: bigint) {
	if (!value) {
		return fallback
	}

	try {
		const parsed = BigInt(value)
		if (parsed < 0n) {
			throw new Error("negative")
		}
		return parsed
	} catch {
		throw new Error(`Expected a non-negative bigint string, received: ${value}`)
	}
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
			throw new Error(`RERANGE_RPC_URLS.${key} must be an array of strings`)
		}

		overrides[key] = value.map((entry) => entry.trim()).filter(Boolean)
	}

	return overrides
}

function resolveRpcUrls(params: {
	chainId: number
	chainKey: SupportedChainKey
	deployment: ProtocolDeployment
	rpcOverrides: Partial<Record<string, string[]>>
}) {
	const override =
		params.rpcOverrides[params.chainKey] ??
		params.rpcOverrides[String(params.chainId)] ??
		[]

	const baseUrls =
		override.length > 0
			? override
			: params.deployment.rpcUrls.length > 0
			? params.deployment.rpcUrls
			: DEFAULT_RPC_URLS[params.chainKey]

	if (baseUrls.length === 0) {
		throw new Error(`No RPC urls configured for chain ${params.chainId}`)
	}

	return [...new Set(baseUrls)]
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
		chainId: params.deployment.chainId,
		chainKey: params.chainKey,
		chainName: CHAIN_NAME_BY_KEY[params.chainKey],
		network: params.deployment.network,
		rpcUrl: params.rpcUrls[0]!,
		rpcUrls: params.rpcUrls,
		owner: params.deployment.owner as `0x${string}`,
		hubAddress: params.deployment.contracts.rerangeHub as `0x${string}`,
		v3AdapterAddress: params.deployment.contracts.uniswapV3Adapter as `0x${string}`,
		v4AdapterAddress: params.deployment.contracts.uniswapV4Adapter as
			| `0x${string}`
			| undefined,
	}
}

function createChainConfig(params: {
	chainId: number
	chainKey: SupportedChainKey
	privateKey: `0x${string}` | null
	rpcOverrides: Partial<Record<string, string[]>>
}): ResolverChainConfig {
	const deployment = getDeploymentByChainId(params.chainId)
	if (!deployment) {
		throw new Error(`No SDK deployment configured for chain ${params.chainId}`)
	}

	const provisionalDeployment = normalizeDeployment({
		chainKey: params.chainKey,
		deployment,
		rpcUrls: [],
	})
	const rpcUrls = resolveRpcUrls({
		chainId: params.chainId,
		chainKey: params.chainKey,
		deployment: provisionalDeployment,
		rpcOverrides: params.rpcOverrides,
	})
	const normalizedDeployment = normalizeDeployment({
		chainKey: params.chainKey,
		deployment,
		rpcUrls,
	})
	const publicClient = createPublicClient({
		chain: defineChain({
			id: params.chainId,
			name: normalizedDeployment.chainName,
			nativeCurrency: { decimals: 18, name: "Ether", symbol: "ETH" },
			rpcUrls: {
				default: { http: rpcUrls },
				public: { http: rpcUrls },
			},
		}),
		transport: createRpcTransport(rpcUrls),
	})

	if (!params.privateKey) {
		return {
			chainId: params.chainId,
			chainKey: params.chainKey,
			deployment: normalizedDeployment,
			rpcUrls,
			publicClient,
			walletClient: null,
			resolverAddress: null,
		}
	}

	const account = privateKeyToAccount(params.privateKey)
	const chain = defineChain({
		id: params.chainId,
		name: normalizedDeployment.chainName,
		nativeCurrency: { decimals: 18, name: "Ether", symbol: "ETH" },
		rpcUrls: {
			default: { http: rpcUrls },
			public: { http: rpcUrls },
		},
	})

	const walletClient = createWalletClient({
		account,
		chain,
		transport: createRpcTransport(rpcUrls),
	})

	return {
		chainId: params.chainId,
		chainKey: params.chainKey,
		deployment: normalizedDeployment,
		rpcUrls,
		publicClient,
		walletClient,
		resolverAddress: account.address,
	}
}

export function resolveResolverConfig(): ResolverConfig {
	const dryRun = isDryRun()
	const privateKey = process.env.RERANGE_RESOLVER_KEY?.trim() as `0x${string}` | undefined
	if (!dryRun && !privateKey) {
		requireEnv("RERANGE_RESOLVER_KEY")
	}

	const rpcOverrides = parseRpcOverrides()
	const chains = SUPPORTED_CHAINS.map((chain) =>
		createChainConfig({
			chainId: chain.chainId,
			chainKey: chain.chainKey,
			privateKey: privateKey ?? null,
			rpcOverrides,
		}),
	)

	return {
		chains,
		orderTable: process.env.RESOLVER_ORDER_TABLE?.trim() || DEFAULT_ORDER_TABLE,
		poolsTable: process.env.RESOLVER_POOLS_TABLE?.trim() || DEFAULT_POOLS_TABLE,
		candidateScanLimit: parsePositiveInt(
			process.env.RESOLVER_CANDIDATE_SCAN_LIMIT,
			DEFAULT_CANDIDATE_SCAN_LIMIT,
		),
		batchSize: parsePositiveInt(process.env.RESOLVER_BATCH_SIZE, DEFAULT_BATCH_SIZE),
		distanceMultiplier: parsePositiveFloat(
			process.env.RESOLVER_DISTANCE_MULTIPLIER,
			DEFAULT_DISTANCE_MULTIPLIER,
		),
		minProfitWei: parseBigIntValue(process.env.RESOLVER_MIN_PROFIT_WEI, 0n),
		loopIntervalMs: parseNonNegativeInt(
			process.env.RESOLVER_LOOP_INTERVAL_MS,
			DEFAULT_LOOP_INTERVAL_MS,
		),
		dryRun,
	}
}