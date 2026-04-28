import type { Abi, AbiEvent, Address, Hex, PublicClient } from "viem";
import { createPublicClient, defineChain, getAbiItem } from "viem";

import type { ChainConfig } from "../config.js";
import type { OrderEventRecord, OrderRow, OrderSnapshot } from "../types.js";
import { createRpcTransport } from "./rpc.js";
import { formatError } from "./utils.js";
import { hubAbi } from "@rerange/wagmi";

type OpenedEventArgs = {
  orderKey?: Hex;
  vault?: Address;
  orderIndex?: bigint;
  adapter?: Address;
  isSell?: boolean;
  targetTick?: number | bigint;
};

type ClosedEventArgs = {
  orderKey?: Hex;
  resolver?: Address;
  referrer?: Address;
  accruedFee0?: bigint;
  accruedFee1?: bigint;
};

type RerangedEventArgs = {
  orderKey?: Hex;
  lowerTick?: number | bigint;
  upperTick?: number | bigint;
  sourceBalance?: bigint;
  rerangeCount?: number | bigint;
};

type RawOrderState = {
  order: {
    vault: Address;
    adapter: Address;
    token0: Address;
    token1: Address;
    capital: bigint;
    isSell: boolean;
    targetTick: number;
    triggerTicks: number | bigint;
    adapterData: Hex;
    referrer: Address;
    keepBalancesInVault: boolean;
    unwrapOut: boolean;
    closed: boolean;
    rerangeCount: number | bigint;
    createdAt: number | bigint;
    lastRerangeAt: number | bigint;
    accruedFee0: bigint;
    accruedFee1: bigint;
    idle0: bigint;
    idle1: bigint;
  };
  status: number | bigint;
  lowerTick: number;
  upperTick: number;
  liquidity: bigint;
  rerangeCount: number | bigint;
  progressBps: bigint;
  remainingSource: bigint;
  convertedTarget: bigint;
  accruedFee0: bigint;
  accruedFee1: bigint;
  market: {
    currentTick: number;
    twapTick: number;
    sqrtPriceX96: bigint;
    poolLiquidity: bigint;
  };
};

function serializeForJson(value: unknown): unknown {
  if (typeof value === "bigint") {
    return value.toString();
  }

  if (Array.isArray(value)) {
    return value.map((entry) => serializeForJson(entry));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        key,
        serializeForJson(entry),
      ]),
    );
  }

  return value;
}

function statusFromState(state: RawOrderState): string {
  if (state.order.closed) {
    return "closed";
  }

  return "open";
}

const orderOpenedEventAbi = getAbiItem({
  abi: hubAbi as Abi,
  name: "OrderOpened",
}) as AbiEvent;

const orderClosedEventAbi = getAbiItem({
  abi: hubAbi as Abi,
  name: "OrderClosed",
}) as AbiEvent;

const orderRerangedEventAbi = getAbiItem({
  abi: hubAbi as Abi,
  name: "OrderReranged",
}) as AbiEvent;

function createClient(chain: ChainConfig) {
  const resolvedChain = defineChain({
    id: chain.chainId,
    name: chain.deployment.chainName,
    nativeCurrency: { decimals: 18, name: "Ether", symbol: "ETH" },
    rpcUrls: {
      default: { http: chain.rpcUrls },
      public: { http: chain.rpcUrls },
    },
  });

  return createPublicClient({
    chain: resolvedChain,
    transport: createRpcTransport(chain.rpcUrls),
  });
}

function getFromBlock(
  latestBlock: bigint,
  lookbackHours: number,
  averageBlockTimeSeconds: number,
) {
  const lookbackBlocks = BigInt(
    Math.max(1, Math.ceil((lookbackHours * 60 * 60) / averageBlockTimeSeconds)),
  );

  return latestBlock > lookbackBlocks ? latestBlock - lookbackBlocks : 0n;
}

function uniqueBlockNumbers(logs: Array<{ blockNumber: bigint }>) {
  return [...new Set(logs.map((log) => log.blockNumber.toString()))].map(
    (value) => BigInt(value),
  );
}

async function loadBlockTimestampMap(
  client: PublicClient,
  logs: Array<{ blockNumber: bigint }>,
) {
  const entries = await Promise.all(
    uniqueBlockNumbers(logs).map(async (blockNumber) => {
      const block = await client.getBlock({ blockNumber });
      return [
        blockNumber.toString(),
        new Date(Number(block.timestamp) * 1_000).toISOString(),
      ] as const;
    }),
  );

  return new Map(entries);
}

function getRequiredLogField<T>(value: T | null | undefined, label: string): T {
  if (value === undefined || value === null) {
    throw new Error(`Missing ${label} on log`);
  }

  return value;
}

function compareLogPosition(left: OrderEventRecord, right: OrderEventRecord) {
  if (left.blockNumber !== right.blockNumber) {
    return left.blockNumber > right.blockNumber ? 1 : -1;
  }

  if (left.logIndex !== right.logIndex) {
    return left.logIndex > right.logIndex ? 1 : -1;
  }

  return 0;
}

function dedupeLatestByOrderKey(records: OrderEventRecord[]) {
  const byOrderKey = new Map<string, OrderEventRecord>();

  for (const record of records) {
    const key = record.orderKey.toLowerCase();
    const current = byOrderKey.get(key);
    if (!current || compareLogPosition(record, current) > 0) {
      byOrderKey.set(key, record);
    }
  }

  return [...byOrderKey.values()];
}

async function fetchOpenedEvents(params: {
  client: PublicClient;
  chain: ChainConfig;
  fromBlock: bigint;
  toBlock: bigint;
}): Promise<OrderEventRecord[]> {
  const logs = await params.client.getLogs({
    address: params.chain.deployment.hubAddress,
    event: orderOpenedEventAbi,
    fromBlock: params.fromBlock,
    toBlock: params.toBlock,
  });
  const timestampByBlock = await loadBlockTimestampMap(params.client, logs);

  return dedupeLatestByOrderKey(
    logs.map((log) => {
      const args = log.args as OpenedEventArgs;
      return {
        orderKey: getRequiredLogField(args.orderKey, "orderKey"),
        blockNumber: getRequiredLogField(log.blockNumber, "blockNumber"),
        logIndex: Number(getRequiredLogField(log.logIndex, "logIndex")),
        transactionHash: getRequiredLogField(
          log.transactionHash,
          "transactionHash",
        ) as Hex,
        timestamp:
          timestampByBlock.get(
            getRequiredLogField(log.blockNumber, "blockNumber").toString(),
          ) ?? new Date().toISOString(),
        args: {
          vault: args.vault,
          orderIndex: Number(args.orderIndex ?? 0n),
          adapter: args.adapter,
          isSell: args.isSell,
          targetTick: Number(args.targetTick ?? 0),
        },
      };
    }),
  );
}

async function fetchClosedEvents(params: {
  client: PublicClient;
  chain: ChainConfig;
  fromBlock: bigint;
  toBlock: bigint;
}): Promise<OrderEventRecord[]> {
  const logs = await params.client.getLogs({
    address: params.chain.deployment.hubAddress,
    event: orderClosedEventAbi,
    fromBlock: params.fromBlock,
    toBlock: params.toBlock,
  });
  const timestampByBlock = await loadBlockTimestampMap(params.client, logs);

  return dedupeLatestByOrderKey(
    logs.map((log) => {
      const args = log.args as ClosedEventArgs;
      return {
        orderKey: getRequiredLogField(args.orderKey, "orderKey"),
        blockNumber: getRequiredLogField(log.blockNumber, "blockNumber"),
        logIndex: Number(getRequiredLogField(log.logIndex, "logIndex")),
        transactionHash: getRequiredLogField(
          log.transactionHash,
          "transactionHash",
        ) as Hex,
        timestamp:
          timestampByBlock.get(
            getRequiredLogField(log.blockNumber, "blockNumber").toString(),
          ) ?? new Date().toISOString(),
        args: {
          resolver: args.resolver,
          referrer: args.referrer,
          accruedFee0: String(args.accruedFee0 ?? 0n),
          accruedFee1: String(args.accruedFee1 ?? 0n),
        },
      };
    }),
  );
}

async function fetchRerangedEvents(params: {
  client: PublicClient;
  chain: ChainConfig;
  fromBlock: bigint;
  toBlock: bigint;
}): Promise<OrderEventRecord[]> {
  const logs = await params.client.getLogs({
    address: params.chain.deployment.hubAddress,
    event: orderRerangedEventAbi,
    fromBlock: params.fromBlock,
    toBlock: params.toBlock,
  });
  const timestampByBlock = await loadBlockTimestampMap(params.client, logs);

  return dedupeLatestByOrderKey(
    logs.map((log) => {
      const args = log.args as RerangedEventArgs;
      return {
        orderKey: getRequiredLogField(args.orderKey, "orderKey"),
        blockNumber: getRequiredLogField(log.blockNumber, "blockNumber"),
        logIndex: Number(getRequiredLogField(log.logIndex, "logIndex")),
        transactionHash: getRequiredLogField(
          log.transactionHash,
          "transactionHash",
        ) as Hex,
        timestamp:
          timestampByBlock.get(
            getRequiredLogField(log.blockNumber, "blockNumber").toString(),
          ) ?? new Date().toISOString(),
        args: {
          lowerTick: Number(args.lowerTick ?? 0),
          upperTick: Number(args.upperTick ?? 0),
          sourceBalance: String(args.sourceBalance ?? 0n),
          rerangeCount: Number(args.rerangeCount ?? 0),
        },
      };
    }),
  );
}

async function readOrderSnapshot(params: {
  client: PublicClient;
  chain: ChainConfig;
  orderKey: Hex;
  statusOverride?: string;
}): Promise<OrderSnapshot> {
  const state = (await params.client.readContract({
    address: params.chain.deployment.hubAddress,
    abi: hubAbi as Abi,
    functionName: "getOrderState",
    args: [params.orderKey],
  })) as RawOrderState;
  const status = params.statusOverride ?? statusFromState(state);

  return {
    orderKey: params.orderKey,
    status,
    vault: state.order.vault,
    data: {
      status,
      state: serializeForJson(state) as Record<string, unknown>,
    },
  };
}

function buildOrderRow(params: {
  chain: ChainConfig;
  eventType: "opened" | "reranged" | "closed";
  event: OrderEventRecord;
  snapshot: OrderSnapshot;
}): OrderRow {
  const orderKey = params.snapshot.orderKey.toLowerCase();
  return {
    id: `${params.chain.chainId}:${orderKey}`,
    timestamp: params.event.timestamp,
    network: params.chain.chainId,
    status: params.snapshot.status,
    vault: params.snapshot.vault.toLowerCase(),
    key: orderKey,
    data: {
      chainId: params.chain.chainId,
      chainKey: params.chain.chainKey,
      hub: params.chain.deployment.hubAddress,
      eventType: params.eventType,
      event: {
        transactionHash: params.event.transactionHash,
        blockNumber: params.event.blockNumber.toString(),
        logIndex: params.event.logIndex,
        timestamp: params.event.timestamp,
        args: params.event.args,
      },
      order: params.snapshot.data,
    },
  };
}

export async function collectChainOrderRows(params: {
  chain: ChainConfig;
  lookbackHours: number;
}) {
  const client = createClient(params.chain);
  const toBlock = await client.getBlockNumber();
  const fromBlock = getFromBlock(
    toBlock,
    params.lookbackHours,
    params.chain.averageBlockTimeSeconds,
  );

  const [openedEvents, rerangedEvents, closedEvents] = await Promise.all([
    fetchOpenedEvents({
      client,
      chain: params.chain,
      fromBlock,
      toBlock,
    }),
    fetchRerangedEvents({
      client,
      chain: params.chain,
      fromBlock,
      toBlock,
    }),
    fetchClosedEvents({
      client,
      chain: params.chain,
      fromBlock,
      toBlock,
    }),
  ]);

  const openedRows = (
    await Promise.all(
      openedEvents.map(async (event) => {
        try {
          const snapshot = await readOrderSnapshot({
            client,
            chain: params.chain,
            orderKey: event.orderKey,
          });
          return buildOrderRow({
            chain: params.chain,
            eventType: "opened",
            event,
            snapshot,
          });
        } catch (error) {
          console.warn(
            `Failed to read opened order ${event.orderKey} on chain ${params.chain.chainId}: ${formatError(error)}`,
          );
          return null;
        }
      }),
    )
  ).filter((row): row is OrderRow => Boolean(row));

  const closedRows = (
    await Promise.all(
      closedEvents.map(async (event) => {
        try {
          const snapshot = await readOrderSnapshot({
            client,
            chain: params.chain,
            orderKey: event.orderKey,
            statusOverride: "closed",
          });
          return buildOrderRow({
            chain: params.chain,
            eventType: "closed",
            event,
            snapshot,
          });
        } catch (error) {
          console.warn(
            `Failed to read closed order ${event.orderKey} on chain ${params.chain.chainId}: ${formatError(error)}`,
          );
          return null;
        }
      }),
    )
  ).filter((row): row is OrderRow => Boolean(row));

  const rerangedRows = (
    await Promise.all(
      rerangedEvents.map(async (event) => {
        try {
          const snapshot = await readOrderSnapshot({
            client,
            chain: params.chain,
            orderKey: event.orderKey,
          });
          return buildOrderRow({
            chain: params.chain,
            eventType: "reranged",
            event,
            snapshot,
          });
        } catch (error) {
          console.warn(
            `Failed to read reranged order ${event.orderKey} on chain ${params.chain.chainId}: ${formatError(error)}`,
          );
          return null;
        }
      }),
    )
  ).filter((row): row is OrderRow => Boolean(row));

  return {
    fromBlock,
    toBlock,
    openedEvents,
    rerangedEvents,
    closedEvents,
    openedRows,
    rerangedRows,
    closedRows,
  };
}
