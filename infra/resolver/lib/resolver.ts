import type { Abi, AbiFunction, Address, Hex } from "viem";
import { decodeAbiParameters, encodeFunctionData, formatGwei } from "viem";

import { hubAbi } from "@rerange/wagmi";

import type {
  BatchSimulation,
  OrdersTableRow,
  ParsedOrderCandidate,
  ParsedOrderCandidateWithPool,
  PoolsTableRow,
  PreviewReward,
  ProtocolDeployment,
  ResolverChainConfig,
  ResolverConfig,
  StoredOrderState,
} from "../types.js";

import {
  decodePoolAddressFromAdapterData,
  resolveAdapterKind,
} from "./adapter.js";
import { fetchChainOrderRows, fetchPoolRowsByAddress } from "./supabase.js";
import {
  absInt,
  asBoolean,
  asNumber,
  asRecord,
  asString,
  formatEtherAmount,
  parseDecimalToWei,
} from "./utils.js";

const rerangeFunctionAbiItem = (hubAbi as Abi).find(
  (item): item is AbiFunction =>
    item.type === "function" &&
    item.name === "rerange" &&
    item.inputs.length === 1,
);

if (!rerangeFunctionAbiItem?.outputs) {
  throw new Error("Unable to resolve rerange(bytes32) ABI outputs");
}

const rerangeFunctionOutputs = rerangeFunctionAbiItem.outputs;

type DecodedRerangePreview = {
  order: {
    token0: Address;
    token1: Address;
  };
  reward0: bigint;
  reward1: bigint;
  willClose: boolean;
};

type FinalExecutionCall =
  | {
      functionName: "rerange";
      args: [Hex];
    }
  | {
      functionName: "batchRerange";
      args: [Hex[]];
    };

function parseStoredOrderState(row: OrdersTableRow): StoredOrderState | null {
  const data = asRecord(row.data);
  const orderRecord = asRecord(data?.order);
  const state = asRecord(orderRecord?.state);
  if (!state) {
    return null;
  }

  const order = asRecord(state.order);
  const market = asRecord(state.market);
  if (!order || !market) {
    return null;
  }

  const adapterData = asString(order.adapterData);
  const token0 = asString(order.token0);
  const token1 = asString(order.token1);
  const vault = asString(order.vault);
  const adapter = asString(order.adapter);
  const capital = asString(order.capital);
  if (!adapterData || !token0 || !token1 || !vault || !adapter || !capital) {
    return null;
  }

  const isSell = asBoolean(order.isSell);
  const closed = asBoolean(order.closed);
  if (isSell === null || closed === null) {
    return null;
  }

  return {
    order: {
      vault: vault as Address,
      adapter: adapter as Address,
      token0: token0 as Address,
      token1: token1 as Address,
      adapterData: adapterData as Hex,
      capital,
      isSell,
      targetTick: order.targetTick as number | string,
      triggerTicks: order.triggerTicks as number | string,
      closed,
      rerangeCount: order.rerangeCount as number | string,
      createdAt: order.createdAt as number | string,
      accruedFee0: String(order.accruedFee0 ?? "0"),
      accruedFee1: String(order.accruedFee1 ?? "0"),
      idle0: String(order.idle0 ?? "0"),
      idle1: String(order.idle1 ?? "0"),
    },
    status: state.status as number | string,
    progressBps: String(state.progressBps ?? "0"),
    remainingSource: String(state.remainingSource ?? "0"),
    convertedTarget: String(state.convertedTarget ?? "0"),
    market: {
      currentTick: market.currentTick as number | string,
      twapTick: market.twapTick as number | string,
      sqrtPriceX96: String(market.sqrtPriceX96 ?? "0"),
      poolLiquidity: String(market.poolLiquidity ?? "0"),
    },
    accruedFee0: String(state.accruedFee0 ?? "0"),
    accruedFee1: String(state.accruedFee1 ?? "0"),
    lowerTick: state.lowerTick as number | string,
    upperTick: state.upperTick as number | string,
    liquidity: String(state.liquidity ?? "0"),
    rerangeCount: state.rerangeCount as number | string,
  };
}

function buildCandidate(
  row: OrdersTableRow,
  state: StoredOrderState,
  deployment: ProtocolDeployment,
  distanceMultiplier: number,
): ParsedOrderCandidate | null {
  const targetTick = asNumber(state.order.targetTick);
  const currentTick = asNumber(state.market.currentTick);
  const triggerTicks = asNumber(state.order.triggerTicks) ?? 0;
  if (targetTick === null || currentTick === null) {
    return null;
  }

  const adapterKind = resolveAdapterKind(state.order.adapter, deployment);
  const poolAddress = decodePoolAddressFromAdapterData(
    adapterKind,
    state.order.adapterData,
  );
  if (!poolAddress) {
    return null;
  }

  const tickDistance = absInt(targetTick - currentTick);
  const readinessScore =
    triggerTicks > 0 ? tickDistance / triggerTicks : tickDistance;
  const isLikelyReady =
    row.status === "completed" ||
    triggerTicks === 0 ||
    tickDistance <= triggerTicks * distanceMultiplier;

  if (!isLikelyReady) {
    return null;
  }

  return {
    row,
    orderKey: row.key as Hex,
    status: row.status,
    poolAddress: poolAddress.toLowerCase() as Address,
    targetTick,
    currentTick,
    triggerTicks,
    tickDistance,
    readinessScore,
    state,
  };
}

async function loadCandidatesForChain(
  chain: ResolverChainConfig,
  config: ResolverConfig,
): Promise<ParsedOrderCandidateWithPool[]> {
  const rows = await fetchChainOrderRows({
    tableName: config.orderTable,
    chainId: chain.chainId,
    limit: config.candidateScanLimit,
  });

  const parsed = rows
    .map((row) => {
      const state = parseStoredOrderState(row);
      return state
        ? buildCandidate(
            row,
            state,
            chain.deployment,
            config.distanceMultiplier,
          )
        : null;
    })
    .filter((candidate): candidate is ParsedOrderCandidate =>
      Boolean(candidate),
    )
    .sort((left, right) => {
      if (left.status === "completed" && right.status !== "completed") {
        return -1;
      }
      if (left.status !== "completed" && right.status === "completed") {
        return 1;
      }
      if (left.readinessScore !== right.readinessScore) {
        return left.readinessScore - right.readinessScore;
      }
      if (left.tickDistance !== right.tickDistance) {
        return left.tickDistance - right.tickDistance;
      }
      return left.row.timestamp.localeCompare(right.row.timestamp);
    })
    .slice(0, config.batchSize);

  if (parsed.length === 0) {
    return [];
  }

  const pools = await fetchPoolRowsByAddress({
    tableName: config.poolsTable,
    chainId: chain.chainId,
    poolAddresses: [
      ...new Set(parsed.map((candidate) => candidate.poolAddress)),
    ],
  });
  const poolByAddress = new Map(
    pools.map((poolRow) => [poolRow.pool.toLowerCase(), poolRow]),
  );

  return parsed
    .map((candidate) => ({
      ...candidate,
      poolRow: poolByAddress.get(candidate.poolAddress.toLowerCase()),
    }))
    .filter(
      (
        candidate,
      ): candidate is ParsedOrderCandidate & { poolRow: PoolsTableRow } =>
        Boolean(candidate.poolRow),
    );
}

function decodeRerangePreview(resultData: Hex): DecodedRerangePreview {
  const [decoded] = decodeAbiParameters(rerangeFunctionOutputs, resultData) as [
    DecodedRerangePreview,
  ];
  return decoded;
}

function rewardEthWeiFromPool(params: {
  poolRow: PoolsTableRow;
  preview: DecodedRerangePreview;
}) {
  const poolData = asRecord(params.poolRow.data);
  const token0 = asRecord(poolData?.token0);
  const token1 = asRecord(poolData?.token1);
  const token0Id = asString(token0?.id)?.toLowerCase();
  const token1Id = asString(token1?.id)?.toLowerCase();
  const token0Decimals = asNumber(token0?.decimals);
  const token1Decimals = asNumber(token1?.decimals);
  const token0DerivedEthWei = parseDecimalToWei(
    asString(token0?.derivedETH) ?? undefined,
  );
  const token1DerivedEthWei = parseDecimalToWei(
    asString(token1?.derivedETH) ?? undefined,
  );

  let rewardEthWei = 0n;
  if (
    token0Id === params.preview.order.token0.toLowerCase() &&
    token0Decimals !== null &&
    token0DerivedEthWei > 0n
  ) {
    rewardEthWei +=
      (params.preview.reward0 * token0DerivedEthWei) /
      10n ** BigInt(token0Decimals);
    if (
      params.preview.reward1 > 0n &&
      token1Decimals !== null &&
      token1DerivedEthWei > 0n
    ) {
      rewardEthWei +=
        (params.preview.reward1 * token1DerivedEthWei) /
        10n ** BigInt(token1Decimals);
    }
  }

  return rewardEthWei;
}

async function simulateBatch(
  chain: ResolverChainConfig,
  candidates: ParsedOrderCandidateWithPool[],
): Promise<BatchSimulation> {
  if (!chain.resolverAddress) {
    throw new Error(
      `Resolver private key is required for chain ${chain.chainId}`,
    );
  }

  const orderKeys = candidates.map((candidate) => candidate.orderKey);
  const simulation = await chain.publicClient.simulateContract({
    address: chain.deployment.hubAddress,
    abi: hubAbi,
    functionName: "batchRerange",
    args: [orderKeys],
    account: chain.resolverAddress,
  });

  const [success, results] = simulation.result as [boolean[], Hex[]];
  const poolByKey = new Map(
    candidates.map((candidate) => [
      candidate.orderKey.toLowerCase(),
      candidate,
    ]),
  );
  const decodedRewards: PreviewReward[] = [];

  for (let index = 0; index < success.length; index += 1) {
    if (!success[index]) {
      continue;
    }

    const orderKey = orderKeys[index];
    const resultData = results[index];
    if (!orderKey || !resultData) {
      continue;
    }

    const candidate = poolByKey.get(orderKey.toLowerCase());
    if (!candidate?.poolRow) {
      continue;
    }

    const preview = decodeRerangePreview(resultData);
    decodedRewards.push({
      orderKey,
      reward0: preview.reward0,
      reward1: preview.reward1,
      rewardEthWei: rewardEthWeiFromPool({
        poolRow: candidate.poolRow,
        preview,
      }),
      willClose: preview.willClose,
      poolAddress: candidate.poolAddress,
      poolRow: candidate.poolRow,
      resultData,
      state: candidate.state,
    });
  }

  return {
    request: {
      address: chain.deployment.hubAddress,
      abi: hubAbi,
      functionName: "batchRerange",
      args: [orderKeys],
      account: chain.resolverAddress,
    },
    success,
    results,
    decodedRewards,
    orderKeys,
  };
}

function summarizeCandidates(candidates: ParsedOrderCandidate[]) {
  return candidates
    .map(
      (candidate) =>
        `${candidate.orderKey} distance=${candidate.tickDistance} trigger=${candidate.triggerTicks} status=${candidate.status}`,
    )
    .join(", ");
}

function summarizeFailedOrderKeys(simulation: BatchSimulation) {
  return simulation.orderKeys.filter((_, index) => !simulation.success[index]);
}

function buildFinalExecutionCall(orderKeys: Hex[]): FinalExecutionCall {
  if (orderKeys.length === 1) {
    return {
      functionName: "rerange",
      args: [orderKeys[0]!],
    };
  }

  return {
    functionName: "batchRerange",
    args: [orderKeys],
  };
}

async function estimateFinalExecutionGas(params: {
  chain: ResolverChainConfig;
  executionCall: FinalExecutionCall;
  finalOrderKeys: Hex[];
}) {
  const request = {
    address: params.chain.deployment.hubAddress,
    abi: hubAbi,
    functionName: params.executionCall.functionName,
    args: params.executionCall.args,
    account: params.chain.resolverAddress as Address,
  };

  if (params.executionCall.functionName !== "batchRerange") {
    return params.chain.publicClient.estimateContractGas(request);
  }

  const multicallData = params.finalOrderKeys.map((orderKey) =>
    encodeFunctionData({
      abi: hubAbi,
      functionName: "rerange",
      args: [orderKey],
    }),
  );

  return params.chain.publicClient.estimateContractGas({
    address: params.chain.deployment.hubAddress,
    abi: hubAbi,
    functionName: "multicall",
    args: [multicallData],
    account: params.chain.resolverAddress as Address,
  });
}

export async function runResolverOnce(config: ResolverConfig) {
  for (const chain of config.chains) {
    console.log(`Scanning chain ${chain.chainKey} (${chain.chainId})`);

    const candidates = await loadCandidatesForChain(chain, config);
    if (candidates.length === 0) {
      console.log(`No likely rerange candidates found for ${chain.chainKey}.`);
      continue;
    }

    console.log(
      `Selected ${candidates.length} candidates for ${chain.chainKey}: ${summarizeCandidates(candidates)}`,
    );

    let initialSimulation: BatchSimulation;
    try {
      initialSimulation = await simulateBatch(chain, candidates);
    } catch (error) {
      console.warn(
        `Initial batch simulation failed on ${chain.chainKey}: ${error instanceof Error ? error.message : String(error)}`,
      );
      continue;
    }

    const successfulCandidates = candidates.filter((candidate) =>
      initialSimulation.decodedRewards.some(
        (reward) =>
          reward.orderKey.toLowerCase() === candidate.orderKey.toLowerCase(),
      ),
    );

    if (successfulCandidates.length === 0) {
      console.log(`No successful rerange simulations on ${chain.chainKey}.`);
      continue;
    }

    const finalSimulation =
      successfulCandidates.length === candidates.length
        ? initialSimulation
        : await simulateBatch(chain, successfulCandidates);

    const profitableRewards = finalSimulation.decodedRewards.filter(
      (reward) => reward.rewardEthWei > 0n,
    );
    if (profitableRewards.length === 0) {
      console.log(
        `Successful reranges on ${chain.chainKey} have zero indexed ETH reward.`,
      );
      continue;
    }

    const profitableOrderKeySet = new Set(
      profitableRewards.map((reward) => reward.orderKey.toLowerCase()),
    );
    const profitableCandidates = successfulCandidates.filter((candidate) =>
      profitableOrderKeySet.has(candidate.orderKey.toLowerCase()),
    );
    const submissionSimulation = await simulateBatch(
      chain,
      profitableCandidates,
    );
    const failedSubmissionOrderKeys =
      summarizeFailedOrderKeys(submissionSimulation);
    if (failedSubmissionOrderKeys.length > 0) {
      console.log(
        `Skipping ${chain.chainKey} execution: final batch is no longer executable for ${failedSubmissionOrderKeys.join(", ")}.`,
      );
      continue;
    }

    const submissionRewards = submissionSimulation.decodedRewards.filter(
      (reward) => reward.rewardEthWei > 0n,
    );
    if (submissionRewards.length !== profitableCandidates.length) {
      console.log(
        `Skipping ${chain.chainKey} execution: final batch reward check changed before submission.`,
      );
      continue;
    }

    const finalOrderKeys = submissionRewards.map((reward) => reward.orderKey);
    const executionCall = buildFinalExecutionCall(finalOrderKeys);
    try {
      await chain.publicClient.simulateContract({
        address: chain.deployment.hubAddress,
        abi: hubAbi,
        functionName: executionCall.functionName,
        args: executionCall.args,
        account: chain.resolverAddress,
      });
    } catch (error) {
      console.log(
        `Skipping ${chain.chainKey} execution: strict pre-submit simulation failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      continue;
    }

    const finalRequest = {
      address: chain.deployment.hubAddress,
      abi: hubAbi,
      functionName: executionCall.functionName,
      args: executionCall.args,
      account: chain.resolverAddress as Address,
    };
    const gasEstimate = await estimateFinalExecutionGas({
      chain,
      executionCall,
      finalOrderKeys,
    });
    const feeEstimate = await chain.publicClient.estimateFeesPerGas();
    const gasPriceWei = feeEstimate.maxFeePerGas ?? feeEstimate.gasPrice;
    if (!gasPriceWei) {
      throw new Error(
        `Unable to estimate gas price for chain ${chain.chainId}`,
      );
    }

    const totalRewardWei = submissionRewards.reduce(
      (total, reward) => total + reward.rewardEthWei,
      0n,
    );
    const gasCostWei = gasEstimate * gasPriceWei;
    const profitWei = totalRewardWei - gasCostWei;

    console.log(
      [
        `Final ${chain.chainKey} batch keys=${finalOrderKeys.length}`,
        `reward=${formatEtherAmount(totalRewardWei)}`,
        `gas=${gasEstimate.toString()}`,
        `gasPrice=${formatGwei(gasPriceWei)} gwei`,
        `gasCost=${formatEtherAmount(gasCostWei)}`,
        `profit=${formatEtherAmount(profitWei)}`,
      ].join(" | "),
    );

    if (profitWei <= config.minProfitWei) {
      console.log(
        `Skipping ${chain.chainKey} execution: profit ${formatEtherAmount(profitWei)} is below minimum ${formatEtherAmount(config.minProfitWei)}.`,
      );
      continue;
    }

    if (config.dryRun) {
      console.log(
        `Dry run: profitable batch on ${chain.chainKey} not submitted.`,
      );
      continue;
    }

    if (!chain.walletClient || !chain.resolverAddress) {
      throw new Error(
        `Wallet client is required to execute on chain ${chain.chainId}`,
      );
    }

    const walletAccount = chain.walletClient.account;
    if (!walletAccount) {
      throw new Error(
        `Wallet account is required to execute on chain ${chain.chainId}`,
      );
    }

    const hash = await chain.walletClient.writeContract({
      address: finalRequest.address,
      abi: finalRequest.abi,
      functionName: finalRequest.functionName,
      args: finalRequest.args,
      account: walletAccount,
      chain: chain.walletClient.chain,
      gas: gasEstimate,
      ...(feeEstimate.maxFeePerGas
        ? {
            maxFeePerGas: feeEstimate.maxFeePerGas,
            maxPriorityFeePerGas: feeEstimate.maxPriorityFeePerGas,
          }
        : { gasPrice: feeEstimate.gasPrice }),
    });

    console.log(
      `Submitted ${chain.chainKey} ${finalRequest.functionName} tx ${hash}`,
    );
    const receipt = await chain.publicClient.waitForTransactionReceipt({
      hash,
    });
    console.log(
      `Confirmed ${chain.chainKey} tx ${hash} in block ${receipt.blockNumber.toString()} using ${receipt.gasUsed.toString()} gas.`,
    );
  }
}
