import { fallback, http } from "viem"

const RPC_QUEUE_INTERVAL_MS = 40
const RPC_BATCH_SIZE = 128
const RPC_BATCH_WAIT_MS = 8

type QueueState = {
	next: Promise<void>
	nextAvailableAt: number
}

const rpcQueueByKey = new Map<string, QueueState>()

function getQueueState(queueKey: string) {
	const existing = rpcQueueByKey.get(queueKey)
	if (existing) {
		return existing
	}

	const created: QueueState = {
		next: Promise.resolve(),
		nextAvailableAt: 0,
	}
	rpcQueueByKey.set(queueKey, created)
	return created
}

function wait(ms: number) {
	return new Promise<void>((resolve) => {
		setTimeout(resolve, ms)
	})
}

export function createQueuedFetch(queueKey: string) {
	return async (input: string | URL | Request, init?: RequestInit) => {
		const state = getQueueState(queueKey)
		const previous = state.next.catch(() => undefined)

		const request = previous.then(async () => {
			const now = Date.now()
			const delay = Math.max(0, state.nextAvailableAt - now)
			if (delay > 0) {
				await wait(delay)
			}

			state.nextAvailableAt = Date.now() + RPC_QUEUE_INTERVAL_MS
			return fetch(input, init)
		})

		state.next = request.then(
			() => undefined,
			() => undefined,
		)

		return request
	}
}

function normalizeRpcUrls(rpc: string | string[]) {
	const urls = (Array.isArray(rpc) ? rpc : [rpc]).filter(Boolean)
	if (urls.length === 0) {
		throw new Error("At least one rpc url is required")
	}

	return [...new Set(urls)]
}

function createHttpTransport(url: string) {
	return http(url, {
		batch: {
			batchSize: RPC_BATCH_SIZE,
			wait: RPC_BATCH_WAIT_MS,
		},
		fetchFn: createQueuedFetch(url),
	})
}

export function createRpcTransport(rpc: string | string[]) {
	const rpcUrls = normalizeRpcUrls(rpc)
	if (rpcUrls.length === 1) {
		return createHttpTransport(rpcUrls[0]!)
	}

	return fallback(rpcUrls.map((url) => createHttpTransport(url)))
}