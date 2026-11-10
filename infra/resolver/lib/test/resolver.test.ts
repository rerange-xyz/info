import assert from "node:assert/strict";
import { afterEach, beforeEach, mock, test, type TestContext } from "node:test";
import { hubAbi } from "@rerange/wagmi";
import {
  encodeAbiParameters,
  encodeFunctionResult,
  parseAbiParameters,
  WaitForTransactionReceiptTimeoutError,
  type AbiParameter,
  type Hex,
} from "viem";
import type { ResolverChainConfig, ResolverConfig } from "../../types.js";

const address = `0x${"11".repeat(20)}` as const;
const orderKey = `0x${"22".repeat(32)}` as const;
const secondOrderKey = `0x${"44".repeat(32)}` as const;
let orderKeys: Hex[] = [orderKey];
const hash = `0x${"33".repeat(32)}` as const;
const adapterData = encodeAbiParameters(
  parseAbiParameters(
    "((address pool, uint24 fee, uint32 twapWindow, uint24 maxTwapDeviation, uint24 maxTickDeviation, uint16 slippageBps) config, uint256 positionId)",
  ),
  [
    {
      config: {
        pool: address,
        fee: 0,
        twapWindow: 0,
        maxTwapDeviation: 0,
        maxTickDeviation: 0,
        slippageBps: 0,
      },
      positionId: 0n,
    },
  ],
);
const order = {
  vault: address,
  adapter: address,
  token0: address,
  token1: address,
  adapterData,
  capital: "1",
  isSell: true,
  closed: false,
  targetTick: 0,
  triggerTicks: 10,
};

mock.module(new URL("../supabase.ts", import.meta.url).href, {
  namedExports: {
    fetchChainOrderRows: async () =>
      orderKeys.map((key) => ({
        key,
        status: "open",
        timestamp: "2026-01-01",
        data: { order: { state: { order, market: {} } } },
      })),
    fetchPoolRowsByAddress: async () => [
      {
        pool: address,
        data: { token0: { id: address, decimals: 18, derivedETH: "1" } },
      },
    ],
  },
});

// Encode a real ABI preview with a profitable reward; unused fields stay zero.
function previewValue(parameter: AbiParameter): unknown {
  if (parameter.name === "reward0") return 10n ** 18n;
  if (parameter.type === "tuple" && "components" in parameter) {
    return Object.fromEntries(
      parameter.components.map((entry) => [entry.name, previewValue(entry)]),
    );
  }
  if (parameter.type === "address") return address;
  if (parameter.type === "bool") return false;
  if (parameter.type === "bytes") return "0x";
  return 0n;
}

const rerangeAbi = hubAbi.find(
  (entry) => entry.type === "function" && entry.name === "rerange",
)!;
const preview = encodeFunctionResult({
  abi: [rerangeAbi],
  functionName: "rerange",
  result: previewValue(rerangeAbi.outputs![0]!) as never,
});
const { runResolverOnce } = await import("../resolver.js");

beforeEach(() => {
  orderKeys = [orderKey];
  mock.method(globalThis, "fetch", async () => {
    throw new Error("Network access is forbidden in tests");
  });
});

afterEach(() => {
  mock.restoreAll();
});

function setup(
  t: TestContext,
  options: {
    submissionError?: unknown;
    receiptError?: unknown;
    receiptStatus?: "success" | "reverted";
    legacyFees?: boolean;
    partialInitialSimulation?: boolean;
    simulationErrorAt?: number;
    simulationError?: unknown;
    gasEstimationError?: unknown;
    feeEstimationError?: unknown;
    feeEstimateOverride?: {
      maxFeePerGas?: bigint;
      maxPriorityFeePerGas?: bigint;
      gasPrice?: bigint;
    };
  } = {},
) {
  const logs: string[] = [];
  t.mock.method(console, "log", (message: string) => {
    logs.push(message);
  });
  t.mock.method(console, "warn", (message: string) => {
    logs.push(message);
  });
  const feeEstimate = options.legacyFees
    ? { gasPrice: 2n }
    : { maxFeePerGas: 2n, maxPriorityFeePerGas: 1n };
  const chains = (["ethereum", "base"] as const).map((chainKey, index) => {
    let batchSimulationCount = 0;
    const simulateContract = t.mock.fn(
      async (request: { functionName: string; args: [Hex[] | Hex] }) => {
        if (request.functionName !== "batchRerange") {
          return { result: [[true], [preview]] };
        }
        batchSimulationCount++;
        if (index === 0 && batchSimulationCount === options.simulationErrorAt) {
          throw options.simulationError;
        }
        const keys = request.args[0] as Hex[];
        return {
          result: [
            keys.map(
              (_, keyIndex) =>
                !(
                  options.partialInitialSimulation &&
                  batchSimulationCount === 1 &&
                  keyIndex > 0
                ),
            ),
            keys.map(() => preview),
          ],
        };
      },
    );
    const estimateContractGas = t.mock.fn(async () => {
      if (index === 0 && options.gasEstimationError)
        throw options.gasEstimationError;
      return 100n;
    });
    const estimateFeesPerGas = t.mock.fn(async () => {
      if (index === 0 && options.feeEstimationError)
        throw options.feeEstimationError;
      return index === 0
        ? (options.feeEstimateOverride ?? feeEstimate)
        : feeEstimate;
    });
    const writeContract = t.mock.fn(
      async (_request: Record<string, unknown>) => {
        if (index === 0 && options.submissionError)
          throw options.submissionError;
        return hash;
      },
    );
    const waitForTransactionReceipt = t.mock.fn(
      async (_request: { hash: Hex; timeout: number }) => {
        if (index === 0 && options.receiptError) throw options.receiptError;
        return {
          status:
            index === 0 ? (options.receiptStatus ?? "success") : "success",
          blockNumber: 100n,
          gasUsed: 90n,
        };
      },
    );
    return {
      chainId: index === 0 ? 1 : 8453,
      chainKey,
      deployment: { hubAddress: address, v3AdapterAddress: address },
      resolverAddress: address,
      publicClient: {
        multicall: async () => [{ status: "success", result: [0n, 0] }],
        simulateContract,
        estimateContractGas,
        estimateFeesPerGas,
        waitForTransactionReceipt,
      },
      walletClient: {
        account: { address },
        chain: { id: index === 0 ? 1 : 8453 },
        writeContract,
      },
    };
  });
  const config: ResolverConfig = {
    chains: chains as unknown as ResolverChainConfig[],
    orderTable: "orders",
    poolsTable: "pools",
    candidateScanLimit: 64,
    batchSize: 12,
    distanceMultiplier: 1.1,
    minProfitWei: 0n,
    loopIntervalMs: 0,
    dryRun: false,
  };
  return { chains, config, logs };
}

for (const [
  operation,
  expectedSimulations,
  expectedGasEstimates,
  expectedFeeEstimates,
] of [
  ["Final batch simulation", 2, 0, 0],
  ["Pre-submission batch simulation", 2, 0, 0],
  ["Contract gas estimation", 3, 1, 0],
  ["Gas fee estimation", 3, 1, 1],
  ["Unavailable gas price", 3, 1, 1],
  ["Zero gas price", 3, 1, 1],
] as const) {
  test(`${operation} failure on Ethereum is logged and Base executes without retries`, async (t) => {
    const failure = new Error(`${operation} RPC failure`);
    if (operation === "Final batch simulation")
      orderKeys = [orderKey, secondOrderKey];
    const { chains, config, logs } = setup(t, {
      partialInitialSimulation: operation === "Final batch simulation",
      simulationErrorAt:
        operation === "Final batch simulation" ||
        operation === "Pre-submission batch simulation"
          ? 2
          : undefined,
      simulationError: failure,
      gasEstimationError:
        operation === "Contract gas estimation" ? failure : undefined,
      feeEstimationError:
        operation === "Gas fee estimation" ? failure : undefined,
      feeEstimateOverride:
        operation === "Unavailable gas price"
          ? {}
          : operation === "Zero gas price"
            ? { gasPrice: 0n }
            : undefined,
    });

    await runResolverOnce(config);

    const ethereum = chains[0]!;
    const base = chains[1]!;
    assert.equal(
      ethereum.publicClient.simulateContract.mock.callCount(),
      expectedSimulations,
    );
    assert.equal(
      ethereum.publicClient.estimateContractGas.mock.callCount(),
      expectedGasEstimates,
    );
    assert.equal(
      ethereum.publicClient.estimateFeesPerGas.mock.callCount(),
      expectedFeeEstimates,
    );
    assert.equal(ethereum.walletClient.writeContract.mock.callCount(), 0);
    assert.equal(
      ethereum.publicClient.waitForTransactionReceipt.mock.callCount(),
      0,
    );
    assert.equal(base.walletClient.writeContract.mock.callCount(), 1);
    assert.equal(
      base.publicClient.waitForTransactionReceipt.mock.callCount(),
      1,
    );
    assert.ok(logs.some((line) => line.startsWith("Confirmed base tx")));
    const loggedFailure = logs.find((line) =>
      line.includes("failed on ethereum (1)"),
    );
    assert.ok(loggedFailure);
    const missingPrice =
      operation === "Unavailable gas price" || operation === "Zero gas price";
    assert.ok(
      loggedFailure.includes(missingPrice ? "Gas fee estimation" : operation),
    );
    assert.ok(
      loggedFailure.includes(
        missingPrice ? "gas price is unavailable" : failure.message,
      ),
    );
  });
}

for (const scenario of [
  "timeout",
  "reverted",
  "submission",
  "receipt RPC",
] as const) {
  test(`${scenario} on Ethereum still allows Base execution without resubmission`, async (t) => {
    const { chains, config, logs } = setup(t, {
      receiptError:
        scenario === "timeout"
          ? new WaitForTransactionReceiptTimeoutError({ hash })
          : scenario === "receipt RPC"
            ? new Error("receipt RPC unavailable")
            : undefined,
      submissionError:
        scenario === "submission" ? new Error("nonce too low") : undefined,
      receiptStatus: scenario === "reverted" ? "reverted" : "success",
    });
    await runResolverOnce(config);
    for (const chain of chains)
      assert.equal(chain.walletClient.writeContract.mock.callCount(), 1);
    assert.ok(logs.some((line) => line.startsWith("Confirmed base tx")));
    assert.ok(!logs.some((line) => line.startsWith("Confirmed ethereum tx")));
    const failure = logs.find(
      (line) =>
        line.startsWith("Transaction ") && line.includes("ethereum (1)"),
    )!;
    assert.ok(failure);
    assert.match(failure, /gas=100/);
    assert.match(failure, /maxFeePerGas=2/);
    assert.match(failure, /maxPriorityFeePerGas=1/);
    if (scenario === "timeout") assert.match(failure, /unconfirmed/);
    if (scenario === "reverted") assert.match(failure, /reverted/);
    if (scenario === "submission") assert.match(failure, /nonce too low/);
    if (scenario !== "submission") assert.ok(failure.includes(hash));
    assert.equal(
      chains[0]!.publicClient.waitForTransactionReceipt.mock.callCount(),
      scenario === "submission" ? 0 : 1,
    );
    assert.deepEqual(
      chains[1]!.publicClient.waitForTransactionReceipt.mock.calls[0]!
        .arguments[0],
      { hash, timeout: 180_000 },
    );
  });
}

test("preserves legacy fee parameters and logs them on failure", async (t) => {
  const { chains, config, logs } = setup(t, {
    legacyFees: true,
    submissionError: new Error("submission rejected"),
  });
  await runResolverOnce(config);
  assert.match(
    logs.find((line) => line.includes("submission failed"))!,
    /gasPrice=2/,
  );
  const submitted = chains[1]!.walletClient.writeContract.mock.calls[0]!
    .arguments[0] as { gas: bigint; gasPrice: bigint };
  assert.equal(submitted.gas, 100n);
  assert.equal(submitted.gasPrice, 2n);
});

test("missing wallet configuration remains fatal", async (t) => {
  const { config, chains } = setup(t);
  config.chains[0]!.walletClient = null;
  await assert.rejects(runResolverOnce(config), /Wallet client is required/);
  assert.equal(chains[1]!.walletClient.writeContract.mock.callCount(), 0);
});

test("missing wallet account remains fatal", async (t) => {
  const { config, chains } = setup(t);
  config.chains[0]!.walletClient!.account = undefined;
  await assert.rejects(runResolverOnce(config), /Wallet account is required/);
  assert.equal(chains[0]!.walletClient.writeContract.mock.callCount(), 0);
  assert.equal(chains[1]!.walletClient.writeContract.mock.callCount(), 0);
});

test("missing resolver address remains fatal before simulation", async (t) => {
  const { config, chains } = setup(t);
  config.chains[0]!.resolverAddress = null;
  await assert.rejects(
    runResolverOnce(config),
    /Resolver private key is required/,
  );
  assert.equal(chains[0]!.publicClient.simulateContract.mock.callCount(), 0);
  assert.equal(chains[1]!.walletClient.writeContract.mock.callCount(), 0);
});
