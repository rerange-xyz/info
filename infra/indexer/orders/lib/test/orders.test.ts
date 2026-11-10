import assert from "node:assert/strict";
import { afterEach, beforeEach, mock, test } from "node:test";
import * as viem from "viem";
import { resolveIndexerConfig } from "../../config.js";

type LogRequest = {
  event: viem.AbiEvent;
  fromBlock: bigint;
  toBlock: bigint;
};

let requests: LogRequest[];
let latestBlock: bigint;
let fetchLogs: (request: LogRequest) => Promise<unknown[]>;
const orderKey = `0x${"11".repeat(32)}`;
const vault = `0x${"22".repeat(20)}`;

mock.module("viem", {
  namedExports: {
    ...viem,
    createPublicClient: () => ({
      getBlockNumber: async () => latestBlock,
      getLogs: async (request: LogRequest) => {
        requests.push(request);
        return fetchLogs(request);
      },
      getBlock: async () => ({ timestamp: 1_700_000_000n }),
      readContract: async () => ({ order: { vault, closed: false } }),
    }),
  },
});

const { collectChainOrderRows } = await import("../orders.js");

const previousEnv = process.env;
beforeEach(() => {
  process.env = { ...previousEnv };
  delete process.env.ORDER_LOOKBACK_HOURS;
  delete process.env.RERANGE_RPC_URLS;
  mock.method(globalThis, "fetch", async () => {
    throw new Error("Network access is forbidden in tests");
  });
  requests = [];
  latestBlock = 100_000n;
  fetchLogs = async () => [];
});

afterEach(() => {
  process.env = previousEnv;
  mock.restoreAll();
});

test("defaults to one hour and preserves the environment override", () => {
  const config = resolveIndexerConfig();
  assert.equal(config.lookbackHours, 1);
  assert.equal(
    config.chains.find((chain) => chain.chainKey === "base")
      ?.averageBlockTimeSeconds,
    0.2,
  );
  process.env.ORDER_LOOKBACK_HOURS = "2.5";
  assert.equal(resolveIndexerConfig().lookbackHours, 2.5);
});

for (const [chainKey, lookbackBlocks, chunkSizes] of [
  ["base", 18_000n, [5_000n, 5_000n, 5_000n, 3_001n]],
  ["ethereum", 300n, [301n]],
] as const) {
  test(`${chainKey} fetches all event types in contiguous inclusive chunks`, async () => {
    const inFlight = new Set<string>();
    fetchLogs = async ({ event }) => {
      assert.ok(
        !inFlight.has(event.name),
        "chunks for each event must be sequential",
      );
      inFlight.add(event.name);
      await new Promise<void>((resolve) => setImmediate(resolve));
      inFlight.delete(event.name);
      return [];
    };
    const config = resolveIndexerConfig();
    const chain = config.chains.find((entry) => entry.chainKey === chainKey)!;
    const result = await collectChainOrderRows({
      chain,
      lookbackHours: config.lookbackHours,
    });
    assert.equal(result.fromBlock, latestBlock - lookbackBlocks);

    for (const event of ["OrderOpened", "OrderReranged", "OrderClosed"]) {
      const chunks = requests.filter((request) => request.event.name === event);
      assert.deepEqual(
        chunks.map(({ fromBlock, toBlock }) => toBlock - fromBlock + 1n),
        chunkSizes,
      );
      assert.equal(chunks[0]!.fromBlock, result.fromBlock);
      assert.equal(chunks.at(-1)!.toBlock, result.toBlock);
      for (let i = 1; i < chunks.length; i++) {
        assert.equal(chunks[i]!.fromBlock, chunks[i - 1]!.toBlock + 1n);
      }
    }
  });
}

for (const [head, expectedSizes] of [
  [0n, [1n]],
  [4_999n, [5_000n]],
  [5_000n, [5_000n, 1n]],
] as const) {
  test(`clamps the lookback at genesis and includes block ${head}`, async () => {
    latestBlock = head;
    const chain = resolveIndexerConfig().chains.find(
      (entry) => entry.chainKey === "base",
    )!;
    const result = await collectChainOrderRows({ chain, lookbackHours: 1 });
    assert.equal(result.fromBlock, 0n);
    const chunks = requests.filter(
      (request) => request.event.name === "OrderOpened",
    );
    assert.deepEqual(
      chunks.map(({ fromBlock, toBlock }) => toBlock - fromBlock + 1n),
      expectedSizes,
    );
  });
}

test("aggregates chunks before deduplication and snapshot processing", async () => {
  fetchLogs = async ({ event, fromBlock }) =>
    event.name !== "OrderReranged"
      ? []
      : [
          {
            args: { orderKey, rerangeCount: Number(fromBlock) },
            blockNumber: fromBlock,
            logIndex: 0,
            transactionHash: `0x${"33".repeat(32)}`,
          },
        ];
  const chain = resolveIndexerConfig().chains.find(
    (entry) => entry.chainKey === "base",
  )!;
  const result = await collectChainOrderRows({ chain, lookbackHours: 1 });
  assert.equal(result.rerangedEvents.length, 1);
  assert.equal(result.rerangedEvents[0]!.blockNumber, 97_000n);
  assert.equal(result.rerangedRows.length, 1);
  assert.equal(result.rerangedRows[0]!.key, orderKey);
  assert.equal(result.rerangedRows[0]!.vault, vault);
});

test("propagates an RPC failure without skipping to later chunks", async () => {
  const failure = new Error("indexing RPC failed");
  fetchLogs = async ({ fromBlock }) => {
    if (fromBlock === 87_000n) throw failure;
    return [];
  };
  const chain = resolveIndexerConfig().chains.find(
    (entry) => entry.chainKey === "base",
  )!;
  await assert.rejects(
    collectChainOrderRows({ chain, lookbackHours: 1 }),
    (error) => error === failure,
  );
  assert.equal(
    requests.filter((request) => request.fromBlock > 87_000n).length,
    0,
  );
});
