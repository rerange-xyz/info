import assert from "node:assert/strict";
import { before, beforeEach, describe, it } from "node:test";

import hre from "hardhat";
import {
  decodeEventLog,
  encodeAbiParameters,
  encodeFunctionData,
  keccak256,
  parseAbi,
} from "viem";

describe("RerangeProtocol", async () => {
  const PERMIT2 = "0x000000000022D473030F116dDEE9F6B43aC78BA3" as const;
  const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" as const;
  const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2" as const;
  const V3_POOL = "0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8" as const;
  const V3_POSITION_MANAGER =
    "0xC36442b4a4522E871399CD717aBDD847Ab11FE88" as const;
  const V3_SWAP_ROUTER = "0xE592427A0AEce92De3Edee1F18E0157C05861564" as const;
  const V4_POSITION_MANAGER =
    "0xbd216513d74c8cf14cf4747e6aaa6420ff64ee9e" as const;
  const V4_STATE_VIEW = "0x7ffe42c4a5deea5b0fec41c94c136cf115597227" as const;
  const V3_FEE = 3_000;
  const V3_TICK_SPACING = 60;
  const V4_FEE = 3_000;
  const V4_TICK_SPACING = 60;
  const DEFAULT_TRIGGER_TICKS = V3_TICK_SPACING * 5;
  const HUB_RESOLVER_SHARE_BPS = 5_000;
  const HUB_REFERRER_SHARE_BPS = 1_000;
  const HUB_RERANGE_COOLDOWN = 300;
  const HUB_COMPLETION_THRESHOLD_BPS = 8;
  const INITIAL_CAPITAL = 5n * 10n ** 18n;
  const OWNER_CALL_AMOUNT = 3n * 10n ** 17n;
  const WETH_DEPOSIT_SELECTOR = "0xd0e30db0" as const;
  const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as const;
  const SWAP_STEPS = [10n, 20n, 40n, 80n, 160n, 320n, 640n].map(
    (value) => value * 10n ** 18n,
  );
  const DOWN_SWAP_STEPS = [
    10_000n,
    20_000n,
    40_000n,
    80_000n,
    160_000n,
    320_000n,
  ].map((value) => value * 10n ** 6n);
  const FINE_SWAP_STEPS = [1n, 2n, 4n, 8n, 16n, 32n].map(
    (value) => value * 10n ** 18n,
  );
  const FINE_DOWN_SWAP_STEPS = [
    1_000n,
    2_000n,
    4_000n,
    8_000n,
    16_000n,
    32_000n,
  ].map((value) => value * 10n ** 6n);
  const MAX_V3_TICK = 887272n;
  const Q32_MASK = (1n << 32n) - 1n;
  const MAX_UINT256 = (1n << 256n) - 1n;
  const TICK_MATH_FACTORS = [
    0xfffcb933bd6fad37aa2d162d1a594001n,
    0xfff97272373d413259a46990580e213an,
    0xfff2e50f5f656932ef12357cf3c7fdccn,
    0xffe5caca7e10e4e61c3624eaa0941cd0n,
    0xffcb9843d60f6159c9db58835c926644n,
    0xff973b41fa98c081472e6896dfb254c0n,
    0xff2ea16466c96a3843ec78b326b52861n,
    0xfe5dee046a99a2a811c461f1969c3053n,
    0xfcbe86c7900a88aedcffc83b479aa3a4n,
    0xf987a7253ac413176f2b074cf7815e54n,
    0xf3392b0822b70005940c7a398e4b70f3n,
    0xe7159475a2c29b7443b29c7fa6e889d9n,
    0xd097f3bdfd2022b8845ad8f792aa5825n,
    0xa9f746462d870fdf8a65dc1f90e061e5n,
    0x70d869a156d2a1b890bb3df62baf32f7n,
    0x31be135f97d08fd981231505542fcfa6n,
    0x09aa508b5b7a84e1c677de54f3e99bc9n,
    0x05d6af8dedb81196699c329225ee604n,
    0x02216e584f5fa1ea926041bedfe98n,
    0x48a170391f7dc42444e8fa2n,
  ] as const;
  const SWAP_ROUTER_ABI = parseAbi([
    "function exactInputSingle((address tokenIn,address tokenOut,uint24 fee,address recipient,uint256 deadline,uint256 amountIn,uint256 amountOutMinimum,uint160 sqrtPriceLimitX96) params) payable returns (uint256 amountOut)",
  ]);
  const V4_POSITION_MANAGER_ABI = parseAbi([
    "function initializePool((address currency0,address currency1,uint24 fee,int24 tickSpacing,address hooks) key,uint160 sqrtPriceX96) payable returns (int24)",
  ]);

  type Fixture = {
    viem: any;
    publicClient: any;
    deployer: any;
    alice: any;
    bob: any;
    agent: any;
    resolver: any;
    referrer: any;
    treasuryWallet: any;
    token0: any;
    token1: any;
    hub: any;
    v3Adapter: any;
    v4Adapter: any;
    v3Pool: any;
    v3PositionManager: any;
    v3AdapterData: `0x${string}`;
    v4AdapterData: `0x${string}`;
  };

  let fixture: Fixture;
  let baseSnapshotId: string | undefined;
  let nextPermitNonce = 0n;

  async function waitFor(hashPromise: Promise<`0x${string}`>) {
    const hash = await hashPromise;
    await fixture.publicClient.waitForTransactionReceipt({ hash });
    return hash;
  }

  async function estimateBatchRerangeGas(orderKeys: readonly `0x${string}`[]) {
    const batchEstimate = await fixture.publicClient.estimateContractGas({
      address: fixture.hub.address,
      abi: fixture.hub.abi,
      functionName: "batchRerange",
      args: [orderKeys],
      account: fixture.resolver.account,
    });

    if (orderKeys.length === 0) {
      return batchEstimate;
    }

    const simulated: any = await fixture.hub.simulate.batchRerange(
      [orderKeys],
      {
        account: fixture.resolver.account,
      },
    );
    const executableCalls = orderKeys.flatMap((orderKey, index) =>
      simulated.result[0][index]
        ? [
            encodeFunctionData({
              abi: fixture.hub.abi,
              functionName: "rerange",
              args: [orderKey],
            }),
          ]
        : [],
    );

    if (executableCalls.length === 0) {
      return batchEstimate;
    }

    const multicallEstimate = await fixture.publicClient.estimateContractGas({
      address: fixture.hub.address,
      abi: fixture.hub.abi,
      functionName: "multicall",
      args: [executableCalls],
      account: fixture.resolver.account,
    });

    return multicallEstimate > batchEstimate
      ? multicallEstimate
      : batchEstimate;
  }

  async function futureTimestamp(offsetSeconds: bigint = 3_600n) {
    const block = await fixture.publicClient.getBlock();
    return block.timestamp + offsetSeconds;
  }

  async function increaseTime(seconds: bigint) {
    await fixture.publicClient.request({
      method: "evm_increaseTime",
      params: [Number(seconds)],
    });
    await fixture.publicClient.request({ method: "evm_mine", params: [] });
  }

  function toStorageWord(value: bigint) {
    return `0x${value.toString(16).padStart(64, "0")}` as `0x${string}`;
  }

  function addStorageOffset(slot: bigint, offset: bigint) {
    return toStorageWord(slot + offset);
  }

  async function setStorageAt(
    address: `0x${string}`,
    slot: `0x${string}`,
    value: `0x${string}`,
  ) {
    await fixture.publicClient.request({
      method: "hardhat_setStorageAt",
      params: [address, slot, value],
    });
  }

  const ORDER_CONFIGS_SLOT = 6n;
  const ORDER_STATES_SLOT = 7n;
  const ORDER_ADAPTER_DATA_SLOT = 8n;

  function mappingBaseSlot(orderKey: `0x${string}`, slot: bigint) {
    return BigInt(
      keccak256(
        encodeAbiParameters(
          [
            { name: "orderKey", type: "bytes32" },
            { name: "slot", type: "uint256" },
          ],
          [orderKey, slot],
        ),
      ),
    );
  }

  function orderConfigBaseSlot(orderKey: `0x${string}`) {
    return mappingBaseSlot(orderKey, ORDER_CONFIGS_SLOT);
  }

  function orderStateBaseSlot(orderKey: `0x${string}`) {
    return mappingBaseSlot(orderKey, ORDER_STATES_SLOT);
  }

  function orderAdapterDataBaseSlot(orderKey: `0x${string}`) {
    return BigInt(
      keccak256(
        toStorageWord(mappingBaseSlot(orderKey, ORDER_ADAPTER_DATA_SLOT)),
      ),
    );
  }

  async function getOrderExecutedEvent(
    hash: `0x${string}`,
    vault: `0x${string}`,
    abi: any,
  ) {
    const receipt = await fixture.publicClient.getTransactionReceipt({ hash });

    for (const log of receipt.logs) {
      if (log.address.toLowerCase() !== vault.toLowerCase()) {
        continue;
      }

      try {
        const decoded: any = decodeEventLog({
          abi,
          data: log.data,
          topics: log.topics,
        });
        if (decoded.eventName === "OrderExecuted") {
          return decoded.args as any;
        }
      } catch {
        continue;
      }
    }

    throw new Error("OrderExecuted event not found");
  }

  async function buildFixture(): Promise<Fixture> {
    const { viem } = await hre.network.connect("hardhat");
    const publicClient = await viem.getPublicClient();
    const [deployer, alice, bob, agent, resolver, referrer, treasuryWallet] =
      await viem.getWalletClients();

    const token0 = await viem.getContractAt("IERC20Minimal", USDC);
    const token1 = await viem.getContractAt("IERC20Minimal", WETH);
    const v3Pool = await viem.getContractAt("IUniswapV3PoolMinimal", V3_POOL);
    const v3PositionManager = await viem.getContractAt(
      "INonfungiblePositionManagerMinimal",
      V3_POSITION_MANAGER,
    );
    const v3Adapter = await viem.deployContract("UniswapV3Adapter", [
      V3_POSITION_MANAGER,
    ]);
    const v4Adapter = await viem.deployContract("UniswapV4Adapter", [
      V4_POSITION_MANAGER,
      V4_STATE_VIEW,
    ]);
    const hubEngine = await viem.deployContract("RerangeHubEngine");
    const hubViews = await viem.deployContract(
      "contracts/libraries/_RerangeHubViews.sol:RerangeHubViews",
    );
    const hub = await viem.deployContract(
      "RerangeHub",
      [deployer.account.address],
      {
        libraries: {
          RerangeHubEngine: hubEngine.address,
          RerangeHubViews: hubViews.address,
        },
      },
    );

    await publicClient.waitForTransactionReceipt({
      hash: await hub.write.setConfig([
        {
          permit2: PERMIT2,
          treasury: treasuryWallet.account.address,
          weth: WETH,
          resolverShareBps: HUB_RESOLVER_SHARE_BPS,
          referrerShareBps: HUB_REFERRER_SHARE_BPS,
          rerangeCooldown: HUB_RERANGE_COOLDOWN,
          completionThresholdBps: HUB_COMPLETION_THRESHOLD_BPS,
          paused: false,
        },
      ]),
    });

    const v3AdapterData = encodeAbiParameters(
      [
        {
          type: "tuple",
          components: [
            { name: "pool", type: "address" },
            { name: "fee", type: "uint24" },
            { name: "twapWindow", type: "uint32" },
            { name: "maxTwapDeviation", type: "uint24" },
            { name: "maxTickDeviation", type: "uint24" },
            { name: "slippageBps", type: "uint16" },
          ],
        },
      ],
      [
        {
          pool: V3_POOL,
          fee: V3_FEE,
          twapWindow: 0,
          maxTwapDeviation: 20,
          maxTickDeviation: 0,
          slippageBps: 0,
        },
      ],
    );

    const v4AdapterData = encodeAbiParameters(
      [
        {
          type: "tuple",
          components: [
            { name: "fee", type: "uint24" },
            { name: "tickSpacing", type: "int24" },
            { name: "hooks", type: "address" },
            { name: "twapWindow", type: "uint32" },
            { name: "hookData", type: "bytes" },
            { name: "maxTwapDeviation", type: "uint24" },
            { name: "maxTickDeviation", type: "uint24" },
            { name: "slippageBps", type: "uint16" },
          ],
        },
      ],
      [
        {
          fee: V4_FEE,
          tickSpacing: V4_TICK_SPACING,
          hooks: ZERO_ADDRESS,
          twapWindow: 0,
          hookData: "0x",
          maxTwapDeviation: 20,
          maxTickDeviation: 0,
          slippageBps: 0,
        },
      ],
    );

    const builtFixture: Fixture = {
      viem,
      publicClient,
      deployer,
      alice,
      bob,
      agent,
      resolver,
      referrer,
      treasuryWallet,
      token0,
      token1,
      hub,
      v3Adapter,
      v4Adapter,
      v3Pool,
      v3PositionManager,
      v3AdapterData,
      v4AdapterData,
    };

    fixture = builtFixture;

    await waitFor(hub.write.setAdapterAllowed([v3Adapter.address, true]));
    await waitFor(hub.write.setAdapterAllowed([v4Adapter.address, true]));

    const v3Slot0 = await v3Pool.read.slot0();
    await waitFor(
      deployer.sendTransaction({
        to: V4_POSITION_MANAGER,
        data: encodeFunctionData({
          abi: V4_POSITION_MANAGER_ABI,
          functionName: "initializePool",
          args: [
            {
              currency0: USDC,
              currency1: WETH,
              fee: V4_FEE,
              tickSpacing: V4_TICK_SPACING,
              hooks: ZERO_ADDRESS,
            },
            v3Slot0[0],
          ],
        }),
        value: 0n,
      }),
    );

    return builtFixture;
  }

  async function createVault(ownerClient: Fixture["alice"] | Fixture["bob"]) {
    const predicted = await fixture.hub.read.predictVault([
      ownerClient.account.address,
      0n,
    ]);
    await waitFor(
      fixture.hub.write.createVault({ account: ownerClient.account }),
    );
    assert.equal(
      (await fixture.hub.read.vaults([ownerClient.account.address])).toString(),
      "1",
    );
    return predicted;
  }

  async function getVaultOrderKey(vault: `0x${string}`, orderIndex: bigint) {
    return fixture.hub.read.getOrderKey([vault, orderIndex]);
  }

  async function getOwnedOrderKey(
    ownerClient: Fixture["alice"] | Fixture["bob"],
    orderIndex: bigint,
    vaultIndex: bigint = 0n,
  ) {
    const vault = await fixture.hub.read.predictVault([
      ownerClient.account.address,
      vaultIndex,
    ]);
    return getVaultOrderKey(vault, orderIndex);
  }

  function alignDown(tick: number, tickSpacing: number) {
    const remainder = tick % tickSpacing;
    if (remainder === 0) {
      return tick;
    }
    if (tick < 0) {
      return tick - remainder - tickSpacing;
    }
    return tick - remainder;
  }

  function alignUp(tick: number, tickSpacing: number) {
    const remainder = tick % tickSpacing;
    if (remainder === 0) {
      return tick;
    }
    if (tick < 0) {
      return tick - remainder;
    }
    return tick - remainder + tickSpacing;
  }

  function expectedRange(
    isSell: boolean,
    targetTick: number,
    triggerTicks: number,
    currentTick: number,
    tickSpacing: number,
  ) {
    const triggerBoundary = isSell
      ? targetTick - triggerTicks
      : targetTick + triggerTicks;
    let lowerTick: number;
    let upperTick: number;

    if (isSell) {
      lowerTick = alignUp(Math.max(currentTick, triggerBoundary), tickSpacing);
      upperTick = alignUp(targetTick, tickSpacing);
    } else {
      lowerTick = alignDown(targetTick, tickSpacing);
      upperTick = alignDown(
        Math.min(currentTick, triggerBoundary),
        tickSpacing,
      );
    }

    if (lowerTick >= upperTick) {
      if (isSell) {
        upperTick = alignUp(targetTick, tickSpacing);
        lowerTick = upperTick - tickSpacing;
      } else {
        lowerTick = alignDown(targetTick, tickSpacing);
        upperTick = lowerTick + tickSpacing;
      }
    }

    return { lowerTick, upperTick };
  }

  async function currentTick(): Promise<number> {
    const slot0 = await fixture.v3Pool.read.slot0();
    return Number(slot0[1]);
  }

  async function rerangeOrder(
    orderKey: `0x${string}`,
    account: Fixture["resolver"] | Fixture["alice"] | Fixture["agent"],
  ) {
    if (HUB_RERANGE_COOLDOWN > 0) {
      await increaseTime(BigInt(HUB_RERANGE_COOLDOWN));
    }
    return waitFor(
      fixture.hub.write.rerange([orderKey], { account: account.account }),
    );
  }

  async function rerangeOrderManaged(
    orderKey: `0x${string}`,
    targetTick: number,
    triggerTicks: number,
    account: Fixture["resolver"] | Fixture["alice"] | Fixture["agent"],
  ) {
    if (HUB_RERANGE_COOLDOWN > 0) {
      await increaseTime(BigInt(HUB_RERANGE_COOLDOWN));
    }
    return waitFor(
      fixture.hub.write.rerange([orderKey, targetTick, triggerTicks], {
        account: account.account,
      }),
    );
  }

  async function closeOrder(
    orderKey: `0x${string}`,
    account: Fixture["alice"] | Fixture["agent"],
  ) {
    return waitFor(
      fixture.hub.write.close([orderKey], { account: account.account }),
    );
  }

  async function hubMulticall(
    data: readonly `0x${string}`[],
    account: Fixture["deployer"] | Fixture["alice"] | Fixture["agent"],
  ) {
    return waitFor(
      fixture.hub.write.multicall([data], { account: account.account }),
    );
  }

  async function wrapEth(
    client: Fixture["deployer"] | Fixture["alice"] | Fixture["bob"],
    amount: bigint,
  ) {
    await waitFor(
      client.sendTransaction({
        to: WETH,
        value: amount,
        data: WETH_DEPOSIT_SELECTOR,
      }),
    );
  }

  async function fundVaultWithWeth(
    client: Fixture["alice"] | Fixture["bob"],
    vault: `0x${string}`,
    amount: bigint,
  ) {
    await wrapEth(client, amount);
    await waitFor(
      fixture.token1.write.transfer([vault, amount], {
        account: client.account,
      }),
    );
  }

  async function swapWethForUsdc(
    client: Fixture["deployer"] | Fixture["alice"],
    amountIn: bigint,
    sqrtPriceLimitX96: bigint = 0n,
  ): Promise<bigint> {
    const balanceBefore = (await fixture.token0.read.balanceOf([
      client.account.address,
    ])) as bigint;
    await wrapEth(client, amountIn);
    await waitFor(
      fixture.token1.write.approve([V3_SWAP_ROUTER, amountIn], {
        account: client.account,
      }),
    );
    const deadline = BigInt(Math.floor(Date.now() / 1_000) + 600);
    const data = encodeFunctionData({
      abi: SWAP_ROUTER_ABI,
      functionName: "exactInputSingle",
      args: [
        {
          tokenIn: WETH,
          tokenOut: USDC,
          fee: V3_FEE,
          recipient: client.account.address,
          deadline,
          amountIn,
          amountOutMinimum: 0n,
          sqrtPriceLimitX96,
        },
      ],
    });

    await waitFor(
      client.sendTransaction({ to: V3_SWAP_ROUTER, data, value: 0n }),
    );
    const balanceAfter = (await fixture.token0.read.balanceOf([
      client.account.address,
    ])) as bigint;
    return balanceAfter - balanceBefore;
  }

  async function swapUsdcForWeth(
    client: Fixture["deployer"] | Fixture["alice"],
    amountIn: bigint,
    sqrtPriceLimitX96: bigint = 0n,
  ): Promise<bigint> {
    const balanceBefore = (await fixture.token1.read.balanceOf([
      client.account.address,
    ])) as bigint;
    await waitFor(
      fixture.token0.write.approve([V3_SWAP_ROUTER, amountIn], {
        account: client.account,
      }),
    );
    const deadline = BigInt(Math.floor(Date.now() / 1_000) + 600);
    const data = encodeFunctionData({
      abi: SWAP_ROUTER_ABI,
      functionName: "exactInputSingle",
      args: [
        {
          tokenIn: USDC,
          tokenOut: WETH,
          fee: V3_FEE,
          recipient: client.account.address,
          deadline,
          amountIn,
          amountOutMinimum: 0n,
          sqrtPriceLimitX96,
        },
      ],
    });

    await waitFor(
      client.sendTransaction({ to: V3_SWAP_ROUTER, data, value: 0n }),
    );
    const balanceAfter = (await fixture.token1.read.balanceOf([
      client.account.address,
    ])) as bigint;
    return balanceAfter - balanceBefore;
  }

  async function fundVaultWithUsdc(
    client: Fixture["alice"],
    vault: `0x${string}`,
    amountInWeth: bigint,
  ): Promise<bigint> {
    const acquiredUsdc = await swapWethForUsdc(client, amountInWeth);
    await waitFor(
      fixture.token0.write.transfer([vault, acquiredUsdc], {
        account: client.account,
      }),
    );
    return acquiredUsdc;
  }

  async function movePriceUpTo(
    targetTick: number,
    swapSteps: bigint[] = SWAP_STEPS,
    rounds: number = 1,
  ) {
    for (let round = 0; round < rounds; round++) {
      for (const amountIn of swapSteps) {
        const tick = await currentTick();
        if (tick >= targetTick) {
          return tick;
        }

        await swapWethForUsdc(fixture.deployer, amountIn);
      }
    }

    return currentTick();
  }

  async function movePriceDownTo(
    targetTick: number,
    swapSteps: bigint[] = DOWN_SWAP_STEPS,
    rounds: number = 1,
  ) {
    for (let round = 0; round < rounds; round++) {
      for (const amountIn of swapSteps) {
        const tick = await currentTick();
        if (tick <= targetTick) {
          return tick;
        }

        const availableUsdc = (await fixture.token0.read.balanceOf([
          fixture.deployer.account.address,
        ])) as bigint;
        if (availableUsdc == 0n) {
          return tick;
        }

        await swapUsdcForWeth(
          fixture.deployer,
          amountIn > availableUsdc ? availableUsdc : amountIn,
        );
      }
    }

    return currentTick();
  }

  function getSqrtRatioAtTick(tick: number): bigint {
    const absTick = BigInt(Math.abs(tick));
    assert.ok(absTick <= MAX_V3_TICK);

    let ratio =
      absTick & 0x1n
        ? TICK_MATH_FACTORS[0]
        : 0x100000000000000000000000000000000n;

    for (let bit = 1n; bit < BigInt(TICK_MATH_FACTORS.length); bit += 1n) {
      if ((absTick & (1n << bit)) !== 0n) {
        ratio = (ratio * TICK_MATH_FACTORS[Number(bit)]) >> 128n;
      }
    }

    if (tick > 0) {
      ratio = MAX_UINT256 / ratio;
    }

    const shifted = ratio >> 32n;
    return shifted + (ratio & Q32_MASK ? 1n : 0n);
  }

  async function movePriceIntoBand(
    minTickInclusive: number,
    maxTickExclusive: number,
    upSwapSteps: bigint[] = FINE_SWAP_STEPS,
    downSwapSteps: bigint[] = FINE_DOWN_SWAP_STEPS,
    rounds: number = 8,
  ) {
    let tick = await currentTick();
    const upLimit = getSqrtRatioAtTick(maxTickExclusive - 1);
    const downLimit = getSqrtRatioAtTick(minTickInclusive);
    const upSteps = [SWAP_STEPS[SWAP_STEPS.length - 1] ?? 0n, ...upSwapSteps];
    const downSteps = [
      DOWN_SWAP_STEPS[DOWN_SWAP_STEPS.length - 1] ?? 0n,
      ...downSwapSteps,
    ];

    for (let round = 0; round < rounds; round++) {
      if (tick >= minTickInclusive && tick < maxTickExclusive) {
        return tick;
      }

      const previousTick = tick;

      if (tick < minTickInclusive) {
        for (const amountIn of upSteps) {
          await swapWethForUsdc(fixture.deployer, amountIn, upLimit);
          tick = await currentTick();
          if (tick > previousTick) {
            break;
          }
        }
        continue;
      }

      const availableUsdc = (await fixture.token0.read.balanceOf([
        fixture.deployer.account.address,
      ])) as bigint;
      if (availableUsdc == 0n) {
        return tick;
      }

      for (const amountIn of downSteps) {
        const nextAmountIn =
          amountIn > availableUsdc ? availableUsdc : amountIn;
        if (nextAmountIn == 0n) {
          continue;
        }

        await swapUsdcForWeth(fixture.deployer, nextAmountIn, downLimit);
        tick = await currentTick();
        if (tick < previousTick) {
          break;
        }
      }
    }

    return tick;
  }

  async function openBuyOrder(
    vault: `0x${string}`,
    targetTick: number,
    account: Fixture["alice"] | Fixture["agent"],
    capital: bigint = INITIAL_CAPITAL,
    keepBalancesInVault = false,
    triggerTicks = DEFAULT_TRIGGER_TICKS,
    unwrapOut = false,
  ) {
    return waitFor(
      fixture.hub.write.open(
        [
          {
            vault,
            adapter: fixture.v3Adapter.address,
            token0: fixture.token0.address,
            token1: fixture.token1.address,
            capital,
            isSell: false,
            targetTick,
            triggerTicks,
            adapterConfig: fixture.v3AdapterData,
            referrer: fixture.referrer.account.address,
            keepBalancesInVault,
            unwrapOut,
          },
        ],
        { account: account.account },
      ),
    );
  }

  async function openSellOrder(
    vault: `0x${string}`,
    targetTick: number,
    account: Fixture["alice"],
    capital: bigint,
    keepBalancesInVault = false,
    triggerTicks = DEFAULT_TRIGGER_TICKS,
    unwrapOut = false,
  ) {
    return waitFor(
      fixture.hub.write.open(
        [
          {
            vault,
            adapter: fixture.v3Adapter.address,
            token0: fixture.token0.address,
            token1: fixture.token1.address,
            capital,
            isSell: true,
            targetTick,
            triggerTicks,
            adapterConfig: fixture.v3AdapterData,
            referrer: fixture.referrer.account.address,
            keepBalancesInVault,
            unwrapOut,
          },
        ],
        { account: account.account },
      ),
    );
  }

  async function openBuyOrderV4(
    vault: `0x${string}`,
    targetTick: number,
    account: Fixture["alice"],
    capital: bigint = INITIAL_CAPITAL,
    keepBalancesInVault = false,
    unwrapOut = false,
  ) {
    return waitFor(
      fixture.hub.write.open(
        [
          {
            vault,
            adapter: fixture.v4Adapter.address,
            token0: fixture.token0.address,
            token1: fixture.token1.address,
            capital,
            isSell: false,
            targetTick,
            triggerTicks: DEFAULT_TRIGGER_TICKS,
            adapterConfig: fixture.v4AdapterData,
            referrer: fixture.referrer.account.address,
            keepBalancesInVault,
            unwrapOut,
          },
        ],
        { account: account.account },
      ),
    );
  }

  async function openSellOrderV4(
    vault: `0x${string}`,
    targetTick: number,
    account: Fixture["alice"],
    capital: bigint,
    keepBalancesInVault = false,
    unwrapOut = false,
  ) {
    return waitFor(
      fixture.hub.write.open(
        [
          {
            vault,
            adapter: fixture.v4Adapter.address,
            token0: fixture.token0.address,
            token1: fixture.token1.address,
            capital,
            isSell: true,
            targetTick,
            triggerTicks: DEFAULT_TRIGGER_TICKS,
            adapterConfig: fixture.v4AdapterData,
            referrer: fixture.referrer.account.address,
            keepBalancesInVault,
            unwrapOut,
          },
        ],
        { account: account.account },
      ),
    );
  }

  async function signPermitTransfer(
    client: Fixture["alice"],
    token: `0x${string}`,
    amount: bigint,
    spender: `0x${string}`,
  ) {
    const permit = {
      permitted: {
        token,
        amount,
      },
      nonce: nextPermitNonce++,
      deadline: await futureTimestamp(600n),
    };
    const chainId = await fixture.publicClient.getChainId();
    const signature = await client.signTypedData({
      account: client.account,
      domain: {
        name: "Permit2",
        chainId,
        verifyingContract: PERMIT2,
      },
      primaryType: "PermitTransferFrom",
      types: {
        TokenPermissions: [
          { name: "token", type: "address" },
          { name: "amount", type: "uint256" },
        ],
        PermitTransferFrom: [
          { name: "permitted", type: "TokenPermissions" },
          { name: "spender", type: "address" },
          { name: "nonce", type: "uint256" },
          { name: "deadline", type: "uint256" },
        ],
      },
      message: {
        ...permit,
        spender,
      },
    });

    return { permit, signature };
  }

  async function open2Order(
    ownerClient: Fixture["alice"],
    targetTick: number,
    capital: bigint,
    isSell: boolean,
    vault?: `0x${string}`,
    keepBalancesInVault = false,
    unwrapOut = false,
    callerClient: Fixture["alice"] | Fixture["agent"] = ownerClient,
  ) {
    const sourceToken = isSell ? fixture.token0 : fixture.token1;
    const resolvedVault =
      vault ??
      (await fixture.hub.read.predictVault([
        ownerClient.account.address,
        await fixture.hub.read.vaults([ownerClient.account.address]),
      ]));

    await waitFor(
      sourceToken.write.approve([PERMIT2, capital], {
        account: ownerClient.account,
      }),
    );

    const { permit, signature } = await signPermitTransfer(
      ownerClient,
      sourceToken.address,
      capital,
      fixture.hub.address,
    );

    await waitFor(
      fixture.hub.write.open2(
        [
          {
            vault: resolvedVault,
            adapter: fixture.v3Adapter.address,
            token0: fixture.token0.address,
            token1: fixture.token1.address,
            capital,
            isSell,
            targetTick,
            triggerTicks: DEFAULT_TRIGGER_TICKS,
            adapterConfig: fixture.v3AdapterData,
            referrer: fixture.referrer.account.address,
            keepBalancesInVault,
            unwrapOut,
          },
          permit,
          signature,
        ],
        { account: callerClient.account },
      ),
    );

    return resolvedVault;
  }

  function urgencyBps(
    isSell: boolean,
    lowerTick: number,
    upperTick: number,
    currentTick: number,
  ) {
    if (currentTick <= lowerTick || currentTick >= upperTick) {
      return 10_000n;
    }

    const range = BigInt(upperTick - lowerTick);
    if (range === 0n) {
      return 10_000n;
    }

    const progress = isSell
      ? (BigInt(currentTick - lowerTick) * 10_000n) / range
      : (BigInt(upperTick - currentTick) * 10_000n) / range;
    const distanceLower = BigInt(currentTick - lowerTick);
    const distanceUpper = BigInt(upperTick - currentTick);
    const boundary =
      10_000n -
      ((distanceLower < distanceUpper ? distanceLower : distanceUpper) *
        10_000n) /
        range;
    const urgency = (progress * 7_000n + boundary * 3_000n) / 10_000n;

    return urgency > 10_000n ? 10_000n : urgency;
  }

  function targetFeeSplit(
    accruedFee: bigint,
    maxResolverShareBps: bigint,
    urgency: bigint,
    hasResolver = true,
  ) {
    const resolverShareBps = hasResolver
      ? (maxResolverShareBps * urgency) / 10_000n
      : 0n;
    const resolverReward = (accruedFee * resolverShareBps) / 10_000n;
    const userAccrued = accruedFee - resolverReward;

    return {
      userAccrued,
      resolverReward,
    };
  }

  function nonTargetFeeSplit(
    accruedFee: bigint,
    referrerShareBps: bigint,
    hasReferrer = true,
  ) {
    const referrerReward = hasReferrer
      ? (accruedFee * referrerShareBps) / 10_000n
      : 0n;
    const treasuryReward = accruedFee - referrerReward;

    return {
      referrerReward,
      treasuryReward,
    };
  }

  before(async () => {
    fixture = await buildFixture();
    baseSnapshotId = await fixture.publicClient.request({
      method: "evm_snapshot",
      params: [],
    });
  });

  beforeEach(async () => {
    if (baseSnapshotId) {
      await fixture.publicClient.request({
        method: "evm_revert",
        params: [baseSnapshotId],
      });
      baseSnapshotId = await fixture.publicClient.request({
        method: "evm_snapshot",
        params: [],
      });
    }
    nextPermitNonce = 0n;
  });

  it("deploys deterministic vaults and allows agents to manage orders", async () => {
    const openTick = await currentTick();
    const targetTick = openTick - V3_TICK_SPACING * 10;
    const vault = await createVault(fixture.alice);
    await fundVaultWithWeth(fixture.alice, vault, INITIAL_CAPITAL);

    const vaultContract = await fixture.viem.getContractAt(
      "RerangeVault",
      vault,
    );
    await waitFor(
      vaultContract.write.setAgent(
        [fixture.agent.account.address, await futureTimestamp()],
        {
          account: fixture.alice.account,
        },
      ),
    );

    await openBuyOrder(vault, targetTick, fixture.agent);

    const state: any = await fixture.hub.read.getOrderState([
      await getVaultOrderKey(vault, 0n),
    ]);
    const range = expectedRange(
      false,
      targetTick,
      DEFAULT_TRIGGER_TICKS,
      openTick,
      V3_TICK_SPACING,
    );
    assert.equal(state.order.vault.toLowerCase(), vault.toLowerCase());
    assert.equal(state.lowerTick, range.lowerTick);
    assert.equal(state.upperTick, range.upperTick);
    assert.equal(state.order.targetTick, targetTick);
    assert.equal(state.rerangeCount, 0);
  });

  it("transfers hub ownership and revokes admin access from the previous owner", async () => {
    await waitFor(
      fixture.hub.write.transferOwnership([fixture.alice.account.address], {
        account: fixture.deployer.account,
      }),
    );

    assert.equal(
      (await fixture.hub.read.owner()).toLowerCase(),
      fixture.alice.account.address.toLowerCase(),
    );

    await assert.rejects(
      waitFor(
        fixture.hub.write.setAdapterAllowed(
          [fixture.v3Adapter.address, false],
          {
            account: fixture.deployer.account,
          },
        ),
      ),
    );

    await waitFor(
      fixture.hub.write.setAdapterAllowed([fixture.v3Adapter.address, false], {
        account: fixture.alice.account,
      }),
    );

    assert.equal(
      await fixture.hub.read.adapters([fixture.v3Adapter.address]),
      false,
    );
  });

  it("opens a regular order on first use by deploying a pre-funded predicted vault", async () => {
    const predictedVault = await fixture.hub.read.predictVault([
      fixture.alice.account.address,
      0n,
    ]);
    const openTick = await currentTick();
    const targetTick = openTick - V3_TICK_SPACING * 10;

    await fundVaultWithWeth(fixture.alice, predictedVault, INITIAL_CAPITAL);

    await waitFor(
      fixture.hub.write.open(
        [
          {
            vault: predictedVault,
            adapter: fixture.v3Adapter.address,
            token0: fixture.token0.address,
            token1: fixture.token1.address,
            capital: INITIAL_CAPITAL,
            isSell: false,
            targetTick,
            triggerTicks: DEFAULT_TRIGGER_TICKS,
            adapterConfig: fixture.v3AdapterData,
            referrer: fixture.referrer.account.address,
            keepBalancesInVault: false,
            unwrapOut: false,
          },
        ],
        { account: fixture.alice.account },
      ),
    );

    const order: any = await fixture.hub.read.getOrder([
      await getOwnedOrderKey(fixture.alice, 0n),
    ]);
    assert.equal(order.vault.toLowerCase(), predictedVault.toLowerCase());
    assert.equal(
      (
        await fixture.hub.read.vaults([fixture.alice.account.address])
      ).toString(),
      "1",
    );
  });

  it("tops up missing vault capital from the caller's ERC20 allowance", async () => {
    const vault = await createVault(fixture.alice);
    const openTick = await currentTick();
    const targetTick = openTick - V3_TICK_SPACING * 10;
    const prefundedCapital = INITIAL_CAPITAL / 2n;
    const allowanceCapital = INITIAL_CAPITAL - prefundedCapital;

    await fundVaultWithWeth(fixture.alice, vault, prefundedCapital);
    await wrapEth(fixture.alice, allowanceCapital);
    await waitFor(
      fixture.token1.write.approve([fixture.hub.address, allowanceCapital], {
        account: fixture.alice.account,
      }),
    );

    await openBuyOrder(vault, targetTick, fixture.alice);

    const order: any = await fixture.hub.read.getOrder([
      await getVaultOrderKey(vault, 0n),
    ]);
    assert.equal(order.vault.toLowerCase(), vault.toLowerCase());
    assert.ok(
      (await fixture.token1.read.balanceOf([fixture.alice.account.address])) <=
        1n,
    );
  });

  it("wraps native ETH sent to open into the vault source balance", async () => {
    const predictedVault = await fixture.hub.read.predictVault([
      fixture.alice.account.address,
      0n,
    ]);
    const openTick = await currentTick();
    const targetTick = openTick - V3_TICK_SPACING * 10;
    const aliceWethBefore = await fixture.token1.read.balanceOf([
      fixture.alice.account.address,
    ]);

    await waitFor(
      fixture.hub.write.open(
        [
          {
            vault: predictedVault,
            adapter: fixture.v3Adapter.address,
            token0: fixture.token0.address,
            token1: fixture.token1.address,
            capital: INITIAL_CAPITAL,
            isSell: false,
            targetTick,
            triggerTicks: DEFAULT_TRIGGER_TICKS,
            adapterConfig: fixture.v3AdapterData,
            referrer: fixture.referrer.account.address,
            keepBalancesInVault: false,
            unwrapOut: false,
          },
        ],
        { account: fixture.alice.account, value: INITIAL_CAPITAL },
      ),
    );

    const order: any = await fixture.hub.read.getOrder([
      await getOwnedOrderKey(fixture.alice, 0n),
    ]);
    const vaultRuntimeWeth = await fixture.token1.read.balanceOf([order.vault]);
    const aliceWethAfter = await fixture.token1.read.balanceOf([
      fixture.alice.account.address,
    ]);

    assert.equal(order.vault.toLowerCase(), predictedVault.toLowerCase());
    assert.equal(order.closed, false);
    assert.equal(aliceWethAfter, aliceWethBefore);
    assert.ok(vaultRuntimeWeth <= INITIAL_CAPITAL);
  });

  it("previews opens with deterministic vault and activation range", async () => {
    const predictedVault = await fixture.hub.read.predictVault([
      fixture.alice.account.address,
      0n,
    ]);
    const targetTick = (await currentTick()) - V3_TICK_SPACING * 10;
    const params = {
      vault: predictedVault,
      adapter: fixture.v3Adapter.address,
      token0: fixture.token0.address,
      token1: fixture.token1.address,
      capital: INITIAL_CAPITAL,
      isSell: false,
      targetTick,
      triggerTicks: DEFAULT_TRIGGER_TICKS,
      adapterConfig: fixture.v3AdapterData,
      referrer: fixture.referrer.account.address,
      keepBalancesInVault: false,
      unwrapOut: false,
    };

    const preview: any = await fixture.hub.read.previewOpen([
      fixture.alice.account.address,
      params,
    ]);
    const range = expectedRange(
      false,
      targetTick,
      DEFAULT_TRIGGER_TICKS,
      Number(preview.market.currentTick),
      V3_TICK_SPACING,
    );

    assert.equal(preview.vault.toLowerCase(), predictedVault.toLowerCase());
    assert.equal(preview.vaultExists, false);
    assert.equal(preview.activationPlan.activateOrder, true);
    assert.equal(preview.activationPlan.deployAmount0, 0n);
    assert.equal(preview.activationPlan.deployAmount1, INITIAL_CAPITAL);
    assert.equal(preview.lowerTick, range.lowerTick);
    assert.equal(preview.upperTick, range.upperTick);
  });

  it("previews market data without activation when open config is incomplete", async () => {
    const predictedVault = await fixture.hub.read.predictVault([
      fixture.alice.account.address,
      0n,
    ]);
    const preview: any = await fixture.hub.read.previewOpen([
      fixture.alice.account.address,
      {
        vault: predictedVault,
        adapter: fixture.v3Adapter.address,
        token0: fixture.token0.address,
        token1: fixture.token1.address,
        capital: 0,
        isSell: false,
        targetTick: 0,
        triggerTicks: 0,
        adapterConfig: fixture.v3AdapterData,
        referrer: fixture.referrer.account.address,
        keepBalancesInVault: false,
        unwrapOut: false,
      },
    ]);

    assert.equal(preview.vault.toLowerCase(), predictedVault.toLowerCase());
    assert.equal(preview.vaultExists, false);
    assert.equal(preview.tickSpacing, V3_TICK_SPACING);
    assert.notEqual(Number(preview.market.sqrtPriceX96), 0);
    assert.equal(preview.lowerTick, 0);
    assert.equal(preview.upperTick, 0);
    assert.equal(preview.activationPlan.activateOrder, false);
    assert.equal(preview.activationPlan.deployAmount0, 0n);
    assert.equal(preview.activationPlan.deployAmount1, 0n);
  });

  it("rejects zero vault addresses for regular and Permit2 opens", async () => {
    const openTick = await currentTick();
    const targetTick = openTick - V3_TICK_SPACING * 10;

    await assert.rejects(
      waitFor(
        fixture.hub.write.open(
          [
            {
              vault: "0x0000000000000000000000000000000000000000",
              adapter: fixture.v3Adapter.address,
              token0: fixture.token0.address,
              token1: fixture.token1.address,
              capital: INITIAL_CAPITAL,
              isSell: false,
              targetTick,
              triggerTicks: DEFAULT_TRIGGER_TICKS,
              adapterConfig: fixture.v3AdapterData,
              referrer: fixture.referrer.account.address,
              keepBalancesInVault: false,
              unwrapOut: false,
            },
          ],
          { account: fixture.alice.account },
        ),
      ),
    );

    await wrapEth(fixture.alice, INITIAL_CAPITAL);
    await waitFor(
      fixture.token1.write.approve([PERMIT2, INITIAL_CAPITAL], {
        account: fixture.alice.account,
      }),
    );
    const { permit, signature } = await signPermitTransfer(
      fixture.alice,
      fixture.token1.address,
      INITIAL_CAPITAL,
      fixture.hub.address,
    );

    await assert.rejects(
      waitFor(
        fixture.hub.write.open2(
          [
            {
              vault: "0x0000000000000000000000000000000000000000",
              adapter: fixture.v3Adapter.address,
              token0: fixture.token0.address,
              token1: fixture.token1.address,
              capital: INITIAL_CAPITAL,
              isSell: false,
              targetTick,
              triggerTicks: DEFAULT_TRIGGER_TICKS,
              adapterConfig: fixture.v3AdapterData,
              referrer: fixture.referrer.account.address,
              keepBalancesInVault: false,
              unwrapOut: false,
            },
            permit,
            signature,
          ],
          { account: fixture.alice.account },
        ),
      ),
    );
  });

  it("rejects unrelated undeployed vault addresses for regular and Permit2 opens", async () => {
    const openTick = await currentTick();
    const targetTick = openTick - V3_TICK_SPACING * 10;
    const unrelatedVault =
      "0x000000000000000000000000000000000000dEaD" as const;

    await assert.rejects(
      waitFor(
        fixture.hub.write.open(
          [
            {
              vault: unrelatedVault,
              adapter: fixture.v3Adapter.address,
              token0: fixture.token0.address,
              token1: fixture.token1.address,
              capital: INITIAL_CAPITAL,
              isSell: false,
              targetTick,
              triggerTicks: DEFAULT_TRIGGER_TICKS,
              adapterConfig: fixture.v3AdapterData,
              referrer: fixture.referrer.account.address,
              keepBalancesInVault: false,
              unwrapOut: false,
            },
          ],
          { account: fixture.alice.account },
        ),
      ),
    );

    await wrapEth(fixture.alice, INITIAL_CAPITAL);
    await waitFor(
      fixture.token1.write.approve([PERMIT2, INITIAL_CAPITAL], {
        account: fixture.alice.account,
      }),
    );
    const { permit, signature } = await signPermitTransfer(
      fixture.alice,
      fixture.token1.address,
      INITIAL_CAPITAL,
      fixture.hub.address,
    );

    await assert.rejects(
      waitFor(
        fixture.hub.write.open2(
          [
            {
              vault: unrelatedVault,
              adapter: fixture.v3Adapter.address,
              token0: fixture.token0.address,
              token1: fixture.token1.address,
              capital: INITIAL_CAPITAL,
              isSell: false,
              targetTick,
              triggerTicks: DEFAULT_TRIGGER_TICKS,
              adapterConfig: fixture.v3AdapterData,
              referrer: fixture.referrer.account.address,
              keepBalancesInVault: false,
              unwrapOut: false,
            },
            permit,
            signature,
          ],
          { account: fixture.alice.account },
        ),
      ),
    );
  });

  it("batches close and open into a single upgrade flow", async () => {
    const vault = await createVault(fixture.alice);
    await fundVaultWithWeth(fixture.alice, vault, INITIAL_CAPITAL * 2n);

    const openTick = await currentTick();
    const firstTargetTick = openTick - V3_TICK_SPACING * 10;
    const secondTargetTick = openTick - V3_TICK_SPACING * 18;

    await openBuyOrder(vault, firstTargetTick, fixture.alice);

    const firstOrderKey = await getVaultOrderKey(vault, 0n);
    const batch = [
      encodeFunctionData({
        abi: fixture.hub.abi,
        functionName: "close",
        args: [firstOrderKey],
      }),
      encodeFunctionData({
        abi: fixture.hub.abi,
        functionName: "open",
        args: [
          {
            vault,
            adapter: fixture.v3Adapter.address,
            token0: fixture.token0.address,
            token1: fixture.token1.address,
            capital: INITIAL_CAPITAL,
            isSell: false,
            targetTick: secondTargetTick,
            triggerTicks: DEFAULT_TRIGGER_TICKS,
            adapterConfig: fixture.v3AdapterData,
            referrer: fixture.referrer.account.address,
            keepBalancesInVault: false,
            unwrapOut: false,
          },
        ],
      }),
    ] as const;

    await hubMulticall(batch, fixture.alice);

    const firstOrder: any = await fixture.hub.read.getOrder([firstOrderKey]);
    const secondOrderKey = await getVaultOrderKey(vault, 1n);
    const secondOrder: any = await fixture.hub.read.getOrder([secondOrderKey]);

    assert.equal(firstOrder.closed, true);
    assert.equal(secondOrder.closed, false);
    assert.equal(secondOrder.vault.toLowerCase(), vault.toLowerCase());
    assert.equal(secondOrder.targetTick, secondTargetTick);
  });

  it("reverts the whole batch when one multicall action fails", async () => {
    const vault = await createVault(fixture.alice);
    await fundVaultWithWeth(fixture.alice, vault, INITIAL_CAPITAL);

    const openTick = await currentTick();
    const targetTick = openTick - V3_TICK_SPACING * 10;
    await openBuyOrder(vault, targetTick, fixture.alice);

    const orderKey = await getVaultOrderKey(vault, 0n);
    const invalidOrderKey = await fixture.hub.read.getOrderKey([vault, 99n]);

    await assert.rejects(
      hubMulticall(
        [
          encodeFunctionData({
            abi: fixture.hub.abi,
            functionName: "close",
            args: [orderKey],
          }),
          encodeFunctionData({
            abi: fixture.hub.abi,
            functionName: "close",
            args: [invalidOrderKey],
          }),
        ],
        fixture.alice,
      ),
    );

    const order: any = await fixture.hub.read.getOrder([orderKey]);
    assert.equal(order.closed, false);
  });

  it("reranges with a fixed target tick, then closes on overshoot and distributes live swap fees", async () => {
    const vault = await createVault(fixture.alice);
    const vaultContract = await fixture.viem.getContractAt(
      "RerangeVault",
      vault,
    );
    const initialCapital = await fundVaultWithUsdc(
      fixture.alice,
      vault,
      5n * 10n ** 18n,
    );
    const openTick = await currentTick();
    const targetTick = openTick + V3_TICK_SPACING * 30;
    const nonTargetReferrerShareBps = BigInt(HUB_REFERRER_SHARE_BPS);
    const targetResolverMaxShareBps = BigInt(HUB_RESOLVER_SHARE_BPS);

    await openSellOrder(vault, targetTick, fixture.alice, initialCapital);

    const triggerTick = await movePriceIntoBand(
      targetTick - V3_TICK_SPACING * 4,
      targetTick,
    );
    assert.ok(triggerTick >= targetTick - V3_TICK_SPACING * 4);
    assert.ok(triggerTick < targetTick);

    const resolverToken0Before = await fixture.token0.read.balanceOf([
      fixture.resolver.account.address,
    ]);
    const resolverToken1Before = await fixture.token1.read.balanceOf([
      fixture.resolver.account.address,
    ]);
    const referrerToken0Before = await fixture.token0.read.balanceOf([
      fixture.referrer.account.address,
    ]);
    const referrerToken1Before = await fixture.token1.read.balanceOf([
      fixture.referrer.account.address,
    ]);
    const treasuryToken0Before = await fixture.token0.read.balanceOf([
      fixture.treasuryWallet.account.address,
    ]);
    const treasuryToken1Before = await fixture.token1.read.balanceOf([
      fixture.treasuryWallet.account.address,
    ]);
    const orderKey = await getVaultOrderKey(vault, 0n);
    const firstStateBeforeRerange: any = await fixture.hub.read.getOrderState([
      orderKey,
    ]);
    const firstUrgency = urgencyBps(
      true,
      Number(firstStateBeforeRerange.lowerTick),
      Number(firstStateBeforeRerange.upperTick),
      Number(firstStateBeforeRerange.market.currentTick),
    );

    const firstRerangeHash = await rerangeOrder(orderKey, fixture.resolver);
    const firstRerangeExecution = await getOrderExecutedEvent(
      firstRerangeHash,
      vault,
      vaultContract.abi,
    );
    const firstNonTargetReward = nonTargetFeeSplit(
      firstRerangeExecution.fee0 as bigint,
      nonTargetReferrerShareBps,
    );
    const firstTargetReward = targetFeeSplit(
      firstRerangeExecution.fee1 as bigint,
      targetResolverMaxShareBps,
      firstUrgency,
    );

    const resolverToken0AfterFirst = await fixture.token0.read.balanceOf([
      fixture.resolver.account.address,
    ]);
    const resolverToken1AfterFirst = await fixture.token1.read.balanceOf([
      fixture.resolver.account.address,
    ]);
    const referrerToken0AfterFirst = await fixture.token0.read.balanceOf([
      fixture.referrer.account.address,
    ]);
    const referrerToken1AfterFirst = await fixture.token1.read.balanceOf([
      fixture.referrer.account.address,
    ]);
    const treasuryToken0AfterFirst = await fixture.token0.read.balanceOf([
      fixture.treasuryWallet.account.address,
    ]);
    const treasuryToken1AfterFirst = await fixture.token1.read.balanceOf([
      fixture.treasuryWallet.account.address,
    ]);

    assert.equal(resolverToken0AfterFirst - resolverToken0Before, 0n);
    assert.equal(
      resolverToken1AfterFirst - resolverToken1Before,
      firstTargetReward.resolverReward,
    );
    assert.equal(
      referrerToken0AfterFirst - referrerToken0Before,
      firstNonTargetReward.referrerReward,
    );
    assert.equal(referrerToken1AfterFirst - referrerToken1Before, 0n);
    assert.equal(
      treasuryToken0AfterFirst - treasuryToken0Before,
      firstNonTargetReward.treasuryReward,
    );
    assert.equal(treasuryToken1AfterFirst - treasuryToken1Before, 0n);

    const orderAfterFirstRerange: any = await fixture.hub.read.getOrder([
      orderKey,
    ]);
    assert.equal(orderAfterFirstRerange.targetTick, targetTick);

    let closeExecution = null;
    let closeTargetReward = targetFeeSplit(0n, targetResolverMaxShareBps, 0n);
    let closeNonTargetReward = nonTargetFeeSplit(0n, nonTargetReferrerShareBps);
    if (!orderAfterFirstRerange.closed) {
      const activeState: any = await fixture.hub.read.getOrderState([orderKey]);
      assert.equal(activeState.order.closed, false);
      assert.equal(activeState.rerangeCount, 1);
      assert.ok(activeState.remainingSource > 0n);

      const finalTick = await movePriceUpTo(
        targetTick + V3_TICK_SPACING,
        SWAP_STEPS,
        3,
      );
      assert.ok(finalTick >= targetTick);
      const closeStateBefore: any = await fixture.hub.read.getOrderState([
        orderKey,
      ]);
      const closeUrgency = urgencyBps(
        true,
        Number(closeStateBefore.lowerTick),
        Number(closeStateBefore.upperTick),
        Number(closeStateBefore.market.currentTick),
      );
      const closeHash = await rerangeOrder(orderKey, fixture.resolver);
      closeExecution = await getOrderExecutedEvent(
        closeHash,
        vault,
        vaultContract.abi,
      );
      closeNonTargetReward = nonTargetFeeSplit(
        closeExecution.fee0 as bigint,
        nonTargetReferrerShareBps,
      );
      closeTargetReward = targetFeeSplit(
        closeExecution.fee1 as bigint,
        targetResolverMaxShareBps,
        closeUrgency,
      );
    }

    const order: any = await fixture.hub.read.getOrder([orderKey]);
    assert.equal(order.closed, true);
    assert.ok(order.rerangeCount <= 1);
    const accruedFee0 = order.accruedFee0 as bigint;
    const accruedFee1 = order.accruedFee1 as bigint;
    assert.equal(accruedFee0, 0n);
    assert.equal(
      accruedFee1,
      firstTargetReward.userAccrued + closeTargetReward.userAccrued,
    );

    const resolverToken0 = await fixture.token0.read.balanceOf([
      fixture.resolver.account.address,
    ]);
    const resolverToken1 = await fixture.token1.read.balanceOf([
      fixture.resolver.account.address,
    ]);
    const referrerToken0 = await fixture.token0.read.balanceOf([
      fixture.referrer.account.address,
    ]);
    const referrerToken1 = await fixture.token1.read.balanceOf([
      fixture.referrer.account.address,
    ]);
    const treasuryToken0 = await fixture.token0.read.balanceOf([
      fixture.treasuryWallet.account.address,
    ]);
    const treasuryToken1 = await fixture.token1.read.balanceOf([
      fixture.treasuryWallet.account.address,
    ]);

    assert.equal(resolverToken0 - resolverToken0Before, 0n);
    assert.equal(
      resolverToken1 - resolverToken1Before,
      firstTargetReward.resolverReward + closeTargetReward.resolverReward,
    );
    assert.equal(referrerToken1 - referrerToken1Before, 0n);
    assert.equal(treasuryToken1 - treasuryToken1Before, 0n);
    assert.equal(
      referrerToken0 - referrerToken0Before,
      firstNonTargetReward.referrerReward + closeNonTargetReward.referrerReward,
    );
    assert.equal(
      treasuryToken0 - treasuryToken0Before,
      firstNonTargetReward.treasuryReward + closeNonTargetReward.treasuryReward,
    );
  });

  it("opens and closes Permit2 sell orders in an existing vault and returns funds to the user", async () => {
    const initialCapital = await swapWethForUsdc(
      fixture.alice,
      5n * 10n ** 18n,
    );
    const openTick = await currentTick();
    const targetTick = openTick + V3_TICK_SPACING * 24;
    const existingVault = await createVault(fixture.alice);
    const vault = await open2Order(
      fixture.alice,
      targetTick,
      initialCapital,
      true,
      existingVault,
    );

    const openedOrder: any = await fixture.hub.read.getOrder([
      await getVaultOrderKey(vault, 0n),
    ]);
    assert.equal(openedOrder.vault.toLowerCase(), vault.toLowerCase());
    assert.equal(
      (
        await fixture.hub.read.vaults([fixture.alice.account.address])
      ).toString(),
      "1",
    );

    const triggerTick = await movePriceIntoBand(
      targetTick - V3_TICK_SPACING * 4,
      targetTick,
    );
    assert.ok(triggerTick >= targetTick - V3_TICK_SPACING * 4);
    assert.ok(triggerTick < targetTick);

    const aliceUsdcBeforeClose = await fixture.token0.read.balanceOf([
      fixture.alice.account.address,
    ]);
    const aliceWethBeforeClose = await fixture.token1.read.balanceOf([
      fixture.alice.account.address,
    ]);

    await closeOrder(await getVaultOrderKey(vault, 0n), fixture.alice);

    const closedOrder: any = await fixture.hub.read.getOrder([
      await getVaultOrderKey(vault, 0n),
    ]);

    const vaultUsdc = await fixture.token0.read.balanceOf([vault]);
    const vaultWeth = await fixture.token1.read.balanceOf([vault]);
    const aliceUsdcAfterClose = await fixture.token0.read.balanceOf([
      fixture.alice.account.address,
    ]);
    const aliceWethAfterClose = await fixture.token1.read.balanceOf([
      fixture.alice.account.address,
    ]);

    assert.equal(closedOrder.closed, true);
    assert.equal(vaultUsdc, 0n);
    assert.equal(vaultWeth, 0n);
    assert.ok(
      aliceUsdcAfterClose > aliceUsdcBeforeClose ||
        aliceWethAfterClose > aliceWethBeforeClose,
    );
  });

  it("allows an authorized agent to submit open2 against an existing owner vault", async () => {
    await wrapEth(fixture.alice, INITIAL_CAPITAL);

    const openTick = await currentTick();
    const targetTick = openTick - V3_TICK_SPACING * 24;
    const vault = await createVault(fixture.alice);
    const vaultContract = await fixture.viem.getContractAt(
      "RerangeVault",
      vault,
    );

    await waitFor(
      vaultContract.write.setAgent(
        [fixture.agent.account.address, await futureTimestamp()],
        {
          account: fixture.alice.account,
        },
      ),
    );

    const resolvedVault = await open2Order(
      fixture.alice,
      targetTick,
      INITIAL_CAPITAL,
      false,
      vault,
      false,
      false,
      fixture.agent,
    );

    const order: any = await fixture.hub.read.getOrder([
      await getVaultOrderKey(resolvedVault, 0n),
    ]);
    assert.equal(order.vault.toLowerCase(), vault.toLowerCase());
    assert.equal(order.closed, false);
    assert.equal(
      (
        await fixture.hub.read.vaults([fixture.alice.account.address])
      ).toString(),
      "1",
    );
  });

  it("rejects unauthorized existing-vault opens for both regular and Permit2 flows", async () => {
    const vault = await createVault(fixture.alice);
    await fundVaultWithWeth(fixture.alice, vault, INITIAL_CAPITAL);

    const openTick = await currentTick();
    const targetTick = openTick - V3_TICK_SPACING * 10;

    await assert.rejects(
      waitFor(
        fixture.hub.write.open(
          [
            {
              vault,
              adapter: fixture.v3Adapter.address,
              token0: fixture.token0.address,
              token1: fixture.token1.address,
              capital: INITIAL_CAPITAL,
              isSell: false,
              targetTick,
              triggerTicks: DEFAULT_TRIGGER_TICKS,
              adapterConfig: fixture.v3AdapterData,
              referrer: fixture.referrer.account.address,
              keepBalancesInVault: false,
              unwrapOut: false,
            },
          ],
          { account: fixture.agent.account },
        ),
      ),
    );

    await wrapEth(fixture.alice, INITIAL_CAPITAL);
    await waitFor(
      fixture.token1.write.approve([PERMIT2, INITIAL_CAPITAL], {
        account: fixture.alice.account,
      }),
    );

    const { permit, signature } = await signPermitTransfer(
      fixture.alice,
      fixture.token1.address,
      INITIAL_CAPITAL,
      fixture.hub.address,
    );

    await assert.rejects(
      waitFor(
        fixture.hub.write.open2(
          [
            {
              vault,
              adapter: fixture.v3Adapter.address,
              token0: fixture.token0.address,
              token1: fixture.token1.address,
              capital: INITIAL_CAPITAL,
              isSell: false,
              targetTick,
              triggerTicks: DEFAULT_TRIGGER_TICKS,
              adapterConfig: fixture.v3AdapterData,
              referrer: fixture.referrer.account.address,
              keepBalancesInVault: false,
              unwrapOut: false,
            },
            permit,
            signature,
          ],
          { account: fixture.agent.account },
        ),
      ),
    );
  });

  it("opens and closes Permit2 buy orders, creating a vault only when needed", async () => {
    await swapWethForUsdc(fixture.deployer, 1_500n * 10n ** 18n);
    await wrapEth(fixture.alice, INITIAL_CAPITAL);

    const openTick = await currentTick();
    const targetTick = openTick - V3_TICK_SPACING * 30;
    const vault = await open2Order(
      fixture.alice,
      targetTick,
      INITIAL_CAPITAL,
      false,
    );

    assert.equal(
      (
        await fixture.hub.read.vaults([fixture.alice.account.address])
      ).toString(),
      "1",
    );

    let intermediateTick = await movePriceDownTo(
      targetTick + V3_TICK_SPACING * 3,
      DOWN_SWAP_STEPS,
      2,
    );
    if (
      alignDown(intermediateTick, V3_TICK_SPACING) <=
      alignDown(targetTick, V3_TICK_SPACING)
    ) {
      intermediateTick = await movePriceUpTo(
        alignDown(targetTick, V3_TICK_SPACING) + V3_TICK_SPACING,
        [1n * 10n ** 17n, 5n * 10n ** 17n, 1n * 10n ** 18n],
        2,
      );
    }
    assert.ok(intermediateTick > targetTick);
    assert.ok(
      alignDown(intermediateTick, V3_TICK_SPACING) >
        alignDown(targetTick, V3_TICK_SPACING),
    );

    await rerangeOrderManaged(
      await getVaultOrderKey(vault, 0n),
      targetTick,
      10_000,
      fixture.alice,
    );

    const activeState: any = await fixture.hub.read.getOrderState([
      await getVaultOrderKey(vault, 0n),
    ]);
    assert.equal(activeState.order.closed, false);
    assert.equal(activeState.rerangeCount, 1);
    assert.equal(activeState.order.triggerTicks, 10_000);

    const aliceUsdcBeforeClose = await fixture.token0.read.balanceOf([
      fixture.alice.account.address,
    ]);
    const aliceWethBeforeClose = await fixture.token1.read.balanceOf([
      fixture.alice.account.address,
    ]);

    await closeOrder(await getVaultOrderKey(vault, 0n), fixture.alice);

    const closedOrder: any = await fixture.hub.read.getOrder([
      await getVaultOrderKey(vault, 0n),
    ]);
    const vaultUsdc = await fixture.token0.read.balanceOf([vault]);
    const vaultWeth = await fixture.token1.read.balanceOf([vault]);
    const aliceUsdcAfterClose = await fixture.token0.read.balanceOf([
      fixture.alice.account.address,
    ]);
    const aliceWethAfterClose = await fixture.token1.read.balanceOf([
      fixture.alice.account.address,
    ]);

    assert.equal(closedOrder.closed, true);
    assert.equal(vaultUsdc, 0n);
    assert.equal(vaultWeth, 0n);
    assert.ok(
      aliceUsdcAfterClose > aliceUsdcBeforeClose ||
        aliceWethAfterClose > aliceWethBeforeClose,
    );
  });

  it("keeps multiple vaults isolated per owner and vault index", async () => {
    const vault0 = await createVault(fixture.alice);
    const predictedVault1 = await fixture.hub.read.predictVault([
      fixture.alice.account.address,
      1n,
    ]);
    await waitFor(
      fixture.hub.write.createVault({ account: fixture.alice.account }),
    );
    const vault1 = predictedVault1;
    const openTick = await currentTick();

    assert.equal(vault1.toLowerCase(), predictedVault1.toLowerCase());
    assert.equal(
      (
        await fixture.hub.read.vaults([fixture.alice.account.address])
      ).toString(),
      "2",
    );

    await fundVaultWithWeth(fixture.alice, vault0, INITIAL_CAPITAL);
    await fundVaultWithWeth(fixture.alice, vault1, INITIAL_CAPITAL / 2n);
    await openBuyOrder(vault0, openTick - V3_TICK_SPACING * 8, fixture.alice);
    await openBuyOrder(
      vault1,
      openTick - V3_TICK_SPACING * 14,
      fixture.alice,
      INITIAL_CAPITAL / 2n,
    );

    const order0: any = await fixture.hub.read.getOrder([
      await getVaultOrderKey(vault0, 0n),
    ]);
    const order1: any = await fixture.hub.read.getOrder([
      await getVaultOrderKey(vault1, 0n),
    ]);

    assert.equal(order0.vault.toLowerCase(), vault0.toLowerCase());
    assert.equal(order1.vault.toLowerCase(), vault1.toLowerCase());
  });

  it("lets the vault owner withdraw tokens while preserving agent restrictions", async () => {
    const vault = await createVault(fixture.bob);
    const depositAmount = 2n * 10n ** 18n;
    await fundVaultWithWeth(fixture.bob, vault, depositAmount);

    const vaultContract = await fixture.viem.getContractAt(
      "RerangeVault",
      vault,
    );
    await waitFor(
      vaultContract.write.withdraw(
        [fixture.token1.address, fixture.bob.account.address, 1n * 10n ** 18n],
        {
          account: fixture.bob.account,
        },
      ),
    );

    const ownerBalance = await fixture.token1.read.balanceOf([
      fixture.bob.account.address,
    ]);
    const vaultBalance = await fixture.token1.read.balanceOf([vault]);
    assert.equal(ownerBalance, 1n * 10n ** 18n);
    assert.equal(vaultBalance, depositAmount - 1n * 10n ** 18n);

    await assert.rejects(
      waitFor(
        vaultContract.write.withdraw(
          [fixture.token1.address, fixture.agent.account.address, 1n],
          {
            account: fixture.agent.account,
          },
        ),
      ),
    );

    assert.equal(
      await fixture.token1.read.balanceOf([fixture.agent.account.address]),
      0n,
    );
    assert.equal(
      await fixture.token1.read.balanceOf([vault]),
      depositAmount - 1n * 10n ** 18n,
    );
  });

  it("limits vault call to the owner even when an agent is active", async () => {
    const vault = await createVault(fixture.alice);
    const vaultContract = await fixture.viem.getContractAt(
      "RerangeVault",
      vault,
    );
    await fundVaultWithWeth(fixture.alice, vault, OWNER_CALL_AMOUNT);
    const ownerStartBalance = await fixture.token1.read.balanceOf([
      fixture.alice.account.address,
    ]);

    await waitFor(
      vaultContract.write.setAgent(
        [fixture.agent.account.address, await futureTimestamp(60n)],
        {
          account: fixture.alice.account,
        },
      ),
    );

    const transferOwnerData = encodeFunctionData({
      abi: fixture.token1.abi,
      functionName: "transfer",
      args: [fixture.alice.account.address, OWNER_CALL_AMOUNT],
    });
    await waitFor(
      vaultContract.write.call(
        [fixture.token1.address, 0n, transferOwnerData],
        { account: fixture.alice.account },
      ),
    );

    assert.equal(
      (await fixture.token1.read.balanceOf([fixture.alice.account.address])) -
        ownerStartBalance,
      OWNER_CALL_AMOUNT,
    );

    const transferAgentData = encodeFunctionData({
      abi: fixture.token1.abi,
      functionName: "transfer",
      args: [fixture.agent.account.address, 1n],
    });

    await assert.rejects(
      waitFor(
        vaultContract.write.call(
          [fixture.token1.address, 0n, transferAgentData],
          { account: fixture.agent.account },
        ),
      ),
    );

    await increaseTime(61n);

    await assert.rejects(
      waitFor(
        vaultContract.write.call(
          [fixture.token1.address, 0n, transferAgentData],
          { account: fixture.agent.account },
        ),
      ),
    );

    await assert.rejects(
      waitFor(
        vaultContract.write.call(
          [fixture.token1.address, 0n, transferAgentData],
          {
            account: fixture.resolver.account,
          },
        ),
      ),
    );
  });

  it("supports manual close against the live v3 position manager", async () => {
    const vault = await createVault(fixture.alice);
    await fundVaultWithWeth(fixture.alice, vault, INITIAL_CAPITAL);
    const openTick = await currentTick();
    await openBuyOrder(vault, openTick - V3_TICK_SPACING * 10, fixture.alice);

    const aliceWethBeforeClose = await fixture.token1.read.balanceOf([
      fixture.alice.account.address,
    ]);
    const aliceToken0BeforeClose = await fixture.token0.read.balanceOf([
      fixture.alice.account.address,
    ]);

    await closeOrder(await getVaultOrderKey(vault, 0n), fixture.alice);

    const order: any = await fixture.hub.read.getOrder([
      await getVaultOrderKey(vault, 0n),
    ]);
    const vaultWeth = await fixture.token1.read.balanceOf([vault]);
    const vaultToken0 = await fixture.token0.read.balanceOf([vault]);
    const aliceWethAfterClose = await fixture.token1.read.balanceOf([
      fixture.alice.account.address,
    ]);
    const aliceToken0AfterClose = await fixture.token0.read.balanceOf([
      fixture.alice.account.address,
    ]);

    assert.equal(order.closed, true);
    assert.equal(vaultWeth, 0n);
    assert.equal(vaultToken0, 0n);
    assert.ok(
      aliceWethAfterClose > aliceWethBeforeClose ||
        aliceToken0AfterClose > aliceToken0BeforeClose,
    );
  });

  it("allows a vault manager to close even when the TWAP safety check would be toxic", async () => {
    const vault = await createVault(fixture.alice);
    await fundVaultWithWeth(fixture.alice, vault, INITIAL_CAPITAL);
    const openTick = await currentTick();
    await openBuyOrder(vault, openTick - V3_TICK_SPACING * 10, fixture.alice);

    const orderKey = await getVaultOrderKey(vault, 0n);
    const adapterDataBaseSlot = orderAdapterDataBaseSlot(orderKey);

    await setStorageAt(
      fixture.hub.address,
      addStorageOffset(adapterDataBaseSlot, 2n),
      toStorageWord(3600n),
    );
    await setStorageAt(
      fixture.hub.address,
      addStorageOffset(adapterDataBaseSlot, 3n),
      toStorageWord(0n),
    );

    const shiftedTick = await movePriceUpTo(
      openTick + V3_TICK_SPACING * 12,
      SWAP_STEPS,
      2,
    );
    assert.ok(shiftedTick > openTick);

    await closeOrder(await getVaultOrderKey(vault, 0n), fixture.alice);

    const closedOrder: any = await fixture.hub.read.getOrder([
      await getVaultOrderKey(vault, 0n),
    ]);
    assert.equal(closedOrder.closed, true);
  });

  it("supports manual close when residual source dust is within the completion threshold", async () => {
    const vault = await createVault(fixture.alice);
    const capital = INITIAL_CAPITAL;
    const dustAmount =
      (capital * BigInt(HUB_COMPLETION_THRESHOLD_BPS)) / 20_000n;

    await fundVaultWithWeth(fixture.alice, vault, capital + dustAmount);
    const openTick = await currentTick();
    const targetTick = openTick - V3_TICK_SPACING * 12;
    await openBuyOrder(
      vault,
      targetTick,
      fixture.alice,
      capital,
      false,
      V3_TICK_SPACING * 10,
    );

    const orderKey = await getVaultOrderKey(vault, 0n);
    const orderStateSlot = orderStateBaseSlot(orderKey);
    const adapterDataBaseSlot = orderAdapterDataBaseSlot(orderKey);

    await setStorageAt(
      fixture.hub.address,
      addStorageOffset(orderStateSlot, 3n),
      toStorageWord(dustAmount),
    );
    await setStorageAt(
      fixture.hub.address,
      addStorageOffset(adapterDataBaseSlot, 6n),
      toStorageWord(0n),
    );

    const seededOrder: any = await fixture.hub.read.getOrder([
      await getVaultOrderKey(vault, 0n),
    ]);

    assert.ok(seededOrder.idle1 > 0n);
    assert.ok(seededOrder.idle1 <= dustAmount);

    const treasuryWethBefore = await fixture.token1.read.balanceOf([
      fixture.treasuryWallet.account.address,
    ]);

    await closeOrder(await getVaultOrderKey(vault, 0n), fixture.alice);

    const order: any = await fixture.hub.read.getOrder([
      await getVaultOrderKey(vault, 0n),
    ]);
    const treasuryWethAfter = await fixture.token1.read.balanceOf([
      fixture.treasuryWallet.account.address,
    ]);
    const treasuryReward = treasuryWethAfter - treasuryWethBefore;

    assert.equal(order.closed, true);
    assert.equal(order.idle1, 0n);
    assert.ok(treasuryReward >= 0n);
  });

  it("keeps closed balances in the vault when configured on open", async () => {
    const vault = await createVault(fixture.alice);
    await fundVaultWithWeth(fixture.alice, vault, INITIAL_CAPITAL);
    const openTick = await currentTick();
    await openBuyOrder(
      vault,
      openTick - V3_TICK_SPACING * 10,
      fixture.alice,
      INITIAL_CAPITAL,
      true,
    );

    const aliceWethBeforeClose = await fixture.token1.read.balanceOf([
      fixture.alice.account.address,
    ]);
    const aliceToken0BeforeClose = await fixture.token0.read.balanceOf([
      fixture.alice.account.address,
    ]);

    await closeOrder(await getVaultOrderKey(vault, 0n), fixture.alice);

    const order: any = await fixture.hub.read.getOrder([
      await getVaultOrderKey(vault, 0n),
    ]);
    const vaultWeth = await fixture.token1.read.balanceOf([vault]);
    const vaultToken0 = await fixture.token0.read.balanceOf([vault]);
    const aliceWethAfterClose = await fixture.token1.read.balanceOf([
      fixture.alice.account.address,
    ]);
    const aliceToken0AfterClose = await fixture.token0.read.balanceOf([
      fixture.alice.account.address,
    ]);

    assert.equal(order.keepBalancesInVault, true);
    assert.equal(order.closed, true);
    assert.equal(order.idle0, vaultToken0);
    assert.equal(order.idle1, vaultWeth);
    assert.ok(vaultWeth > 0n || vaultToken0 > 0n);
    assert.equal(aliceWethAfterClose, aliceWethBeforeClose);
    assert.equal(aliceToken0AfterClose, aliceToken0BeforeClose);
  });

  it("unwraps WETH to native ETH on close when configured on open", async () => {
    const vault = await createVault(fixture.alice);
    const vaultContract = await fixture.viem.getContractAt(
      "RerangeVault",
      vault,
    );

    await waitFor(
      vaultContract.write.setAgent(
        [fixture.agent.account.address, await futureTimestamp()],
        {
          account: fixture.alice.account,
        },
      ),
    );

    await fundVaultWithWeth(fixture.alice, vault, INITIAL_CAPITAL);
    const openTick = await currentTick();
    await openBuyOrder(
      vault,
      openTick - V3_TICK_SPACING * 10,
      fixture.alice,
      INITIAL_CAPITAL,
      false,
      DEFAULT_TRIGGER_TICKS,
      true,
    );

    const aliceEthBeforeClose = await fixture.publicClient.getBalance({
      address: fixture.alice.account.address,
    });
    const aliceWethBeforeClose = await fixture.token1.read.balanceOf([
      fixture.alice.account.address,
    ]);

    await closeOrder(await getVaultOrderKey(vault, 0n), fixture.agent);

    const order: any = await fixture.hub.read.getOrder([
      await getVaultOrderKey(vault, 0n),
    ]);
    const vaultWeth = await fixture.token1.read.balanceOf([vault]);
    const aliceEthAfterClose = await fixture.publicClient.getBalance({
      address: fixture.alice.account.address,
    });
    const aliceWethAfterClose = await fixture.token1.read.balanceOf([
      fixture.alice.account.address,
    ]);

    assert.equal(order.unwrapOut, true);
    assert.equal(order.closed, true);
    assert.equal(vaultWeth, 0n);
    assert.equal(aliceWethAfterClose, aliceWethBeforeClose);
    assert.ok(aliceEthAfterClose > aliceEthBeforeClose);
  });

  it("previews rerange and close actions for an active order", async () => {
    const vault = await createVault(fixture.alice);
    const targetTick = (await currentTick()) - V3_TICK_SPACING * 10;

    await fundVaultWithWeth(fixture.alice, vault, INITIAL_CAPITAL);
    await openBuyOrder(
      vault,
      targetTick,
      fixture.alice,
      INITIAL_CAPITAL,
      false,
      10,
    );

    const rerangePreview: any = await fixture.hub.read.previewRerange([
      await getVaultOrderKey(vault, 0n),
    ]);
    const closePreview: any = await fixture.hub.read.previewClose([
      await getVaultOrderKey(vault, 0n),
    ]);

    assert.equal(rerangePreview.order.closed, false);
    assert.equal(rerangePreview.position.active, true);
    assert.equal(rerangePreview.removePlan.collectFees, false);
    assert.equal(rerangePreview.removePlan.removeLiquidity, false);
    assert.equal(rerangePreview.removePlan.closeOrder, false);
    assert.equal(rerangePreview.activatePlan.activateOrder, false);
    assert.equal(rerangePreview.reward0, 0n);
    assert.equal(rerangePreview.reward1, 0n);
    assert.equal(rerangePreview.willClose, false);
    assert.equal(closePreview.willClose, true);
    assert.equal(closePreview.removePlan.collectFees, true);
    assert.equal(closePreview.removePlan.removeLiquidity, true);
    assert.equal(closePreview.removePlan.closeOrder, true);
    assert.equal(closePreview.activatePlan.activateOrder, false);
    assert.ok(closePreview.reward0 >= 0n);
    assert.ok(closePreview.reward1 >= 0n);
  });

  it("returns settled reward fields from viem simulation for rerange", async () => {
    const vault = await createVault(fixture.alice);
    const initialCapital = await fundVaultWithUsdc(
      fixture.alice,
      vault,
      5n * 10n ** 18n,
    );
    const openTick = await currentTick();
    const targetTick = openTick + V3_TICK_SPACING * 30;

    await openSellOrder(
      vault,
      targetTick,
      fixture.alice,
      initialCapital,
      false,
      V3_TICK_SPACING * 10,
    );

    const intermediateTick = await movePriceIntoBand(
      targetTick - V3_TICK_SPACING * 4,
      targetTick,
    );
    assert.ok(intermediateTick >= targetTick - V3_TICK_SPACING * 4);
    assert.ok(intermediateTick < targetTick);

    await increaseTime(BigInt(HUB_RERANGE_COOLDOWN) + 1n);

    const orderKey = await getVaultOrderKey(vault, 0n);
    const preview: any = await fixture.hub.read.previewRerange([orderKey]);
    const simulated: any = await fixture.hub.simulate.rerange([orderKey], {
      account: fixture.resolver.account,
    });

    assert.ok(simulated.result.reward0 >= preview.reward0);
    assert.ok(simulated.result.reward1 >= preview.reward1);
    assert.ok(simulated.result.reward0 > 0n || simulated.result.reward1 > 0n);
  });

  it("previews manager rerange with updated trigger ticks", async () => {
    const vault = await createVault(fixture.alice);
    const initialCapital = await fundVaultWithUsdc(
      fixture.alice,
      vault,
      5n * 10n ** 18n,
    );
    const openTick = await currentTick();
    const targetTick = openTick + V3_TICK_SPACING * 30;

    await openSellOrder(
      vault,
      targetTick,
      fixture.alice,
      initialCapital,
      false,
      10,
    );

    const intermediateTick = await movePriceIntoBand(
      targetTick - V3_TICK_SPACING * 9,
      targetTick - V3_TICK_SPACING * 4,
    );
    assert.ok(intermediateTick >= targetTick - V3_TICK_SPACING * 9);
    assert.ok(intermediateTick < targetTick - V3_TICK_SPACING * 4);

    const orderKey = await getVaultOrderKey(vault, 0n);
    const defaultPreview: any = await fixture.hub.read.previewRerange([
      orderKey,
    ]);
    const managerPreview: any = await fixture.hub.read.previewRerange([
      orderKey,
      targetTick,
      V3_TICK_SPACING * 9,
    ]);

    assert.equal(defaultPreview.activatePlan.activateOrder, false);
    assert.equal(defaultPreview.removePlan.removeLiquidity, false);
    assert.equal(managerPreview.order.targetTick, targetTick);
    assert.equal(managerPreview.order.triggerTicks, V3_TICK_SPACING * 9);
    assert.equal(managerPreview.removePlan.collectFees, true);
    assert.equal(managerPreview.removePlan.removeLiquidity, true);
    assert.equal(managerPreview.activatePlan.activateOrder, true);
    assert.equal(managerPreview.willClose, false);
    assert.equal(
      managerPreview.nextUpperTick,
      alignUp(targetTick, V3_TICK_SPACING),
    );
  });

  it("allows rerange when price is inside the active position ticks", async () => {
    const vault = await createVault(fixture.alice);
    const initialCapital = await fundVaultWithUsdc(
      fixture.alice,
      vault,
      5n * 10n ** 18n,
    );
    const openTick = await currentTick();
    const targetTick = openTick + V3_TICK_SPACING * 30;

    await openSellOrder(
      vault,
      targetTick,
      fixture.alice,
      initialCapital,
      false,
      V3_TICK_SPACING * 10,
    );

    const intermediateTick = await movePriceIntoBand(
      targetTick - V3_TICK_SPACING * 4,
      targetTick,
    );
    assert.ok(intermediateTick >= targetTick - V3_TICK_SPACING * 4);
    assert.ok(intermediateTick < targetTick);

    const orderKey = await getVaultOrderKey(vault, 0n);
    const preview: any = await fixture.hub.read.previewRerange([orderKey]);
    assert.equal(preview.removePlan.removeLiquidity, true);
    assert.ok(preview.activatePlan.activateOrder || preview.willClose);

    await rerangeOrder(orderKey, fixture.resolver);

    const state: any = await fixture.hub.read.getOrderState([orderKey]);
    if (state.order.closed) {
      assert.equal(state.rerangeCount, 0);
      assert.equal(preview.willClose, true);
      return;
    }

    assert.equal(state.rerangeCount, 1);
  });

  it("batches permissionless reranges for multiple orders", async () => {
    const firstVault = await createVault(fixture.alice);
    const secondVault = await fixture.hub.read.predictVault([
      fixture.alice.account.address,
      1n,
    ]);
    await waitFor(
      fixture.hub.write.createVault({ account: fixture.alice.account }),
    );
    assert.equal(
      (
        await fixture.hub.read.vaults([fixture.alice.account.address])
      ).toString(),
      "2",
    );
    const firstCapital = await fundVaultWithUsdc(
      fixture.alice,
      firstVault,
      5n * 10n ** 18n,
    );
    const secondCapital = await fundVaultWithUsdc(
      fixture.alice,
      secondVault,
      5n * 10n ** 18n,
    );
    const openTick = await currentTick();
    const firstTargetTick = openTick + V3_TICK_SPACING * 30;
    const secondTargetTick = openTick + V3_TICK_SPACING * 90;

    await openSellOrder(
      firstVault,
      firstTargetTick,
      fixture.alice,
      firstCapital,
      false,
      V3_TICK_SPACING * 10,
    );
    await openSellOrder(
      secondVault,
      secondTargetTick,
      fixture.alice,
      secondCapital,
      false,
      V3_TICK_SPACING * 10,
    );

    const intermediateTick = await movePriceIntoBand(
      firstTargetTick - V3_TICK_SPACING * 4,
      firstTargetTick,
    );
    assert.ok(intermediateTick >= firstTargetTick - V3_TICK_SPACING * 4);
    assert.ok(intermediateTick < firstTargetTick);
    assert.ok(intermediateTick < secondTargetTick - V3_TICK_SPACING * 10);

    if (HUB_RERANGE_COOLDOWN > 0) {
      await increaseTime(BigInt(HUB_RERANGE_COOLDOWN));
    }

    const firstOrderKey = await getVaultOrderKey(firstVault, 0n);
    const secondOrderKey = await getVaultOrderKey(secondVault, 0n);
    const simulated: any = await fixture.hub.simulate.batchRerange(
      [[firstOrderKey, secondOrderKey]],
      {
        account: fixture.resolver.account,
      },
    );

    assert.deepEqual(simulated.result[0], [true, false]);
    assert.equal(simulated.result[1].length, 2);

    const gas = await estimateBatchRerangeGas([firstOrderKey, secondOrderKey]);

    await waitFor(
      fixture.hub.write.batchRerange([[firstOrderKey, secondOrderKey]], {
        account: fixture.resolver.account,
        gas,
      }),
    );

    const firstState: any = await fixture.hub.read.getOrderState([
      firstOrderKey,
    ]);
    const secondState: any = await fixture.hub.read.getOrderState([
      secondOrderKey,
    ]);

    assert.equal(
      firstState.order.closed || firstState.rerangeCount === 1,
      true,
    );
    assert.equal(secondState.order.closed, false);
    assert.equal(secondState.rerangeCount, 0);
  });

  it("batches permissionless reranges when both orders are eligible", async () => {
    const firstVault = await createVault(fixture.alice);
    const secondVault = await fixture.hub.read.predictVault([
      fixture.alice.account.address,
      1n,
    ]);
    await waitFor(
      fixture.hub.write.createVault({ account: fixture.alice.account }),
    );
    assert.equal(
      (
        await fixture.hub.read.vaults([fixture.alice.account.address])
      ).toString(),
      "2",
    );

    const firstCapital = await fundVaultWithUsdc(
      fixture.alice,
      firstVault,
      5n * 10n ** 18n,
    );
    const secondCapital = await fundVaultWithUsdc(
      fixture.alice,
      secondVault,
      5n * 10n ** 18n,
    );
    const openTick = await currentTick();
    const firstTargetTick = openTick + V3_TICK_SPACING * 60;
    const secondTargetTick = openTick + V3_TICK_SPACING * 66;
    const triggerTicks = V3_TICK_SPACING * 20;

    await openSellOrder(
      firstVault,
      firstTargetTick,
      fixture.alice,
      firstCapital,
      false,
      triggerTicks,
    );
    await openSellOrder(
      secondVault,
      secondTargetTick,
      fixture.alice,
      secondCapital,
      false,
      triggerTicks,
    );

    const intermediateTick = await movePriceIntoBand(
      secondTargetTick - triggerTicks,
      secondTargetTick - triggerTicks + V3_TICK_SPACING * 4,
    );
    assert.ok(intermediateTick >= secondTargetTick - triggerTicks);
    assert.ok(
      intermediateTick < secondTargetTick - triggerTicks + V3_TICK_SPACING * 4,
    );
    assert.ok(intermediateTick < firstTargetTick);

    if (HUB_RERANGE_COOLDOWN > 0) {
      await increaseTime(BigInt(HUB_RERANGE_COOLDOWN));
    }

    const firstOrderKey = await getVaultOrderKey(firstVault, 0n);
    const secondOrderKey = await getVaultOrderKey(secondVault, 0n);
    const simulated: any = await fixture.hub.simulate.batchRerange(
      [[firstOrderKey, secondOrderKey]],
      {
        account: fixture.resolver.account,
      },
    );

    assert.deepEqual(simulated.result[0], [true, true]);
    assert.equal(simulated.result[1].length, 2);

    const gas = await estimateBatchRerangeGas([firstOrderKey, secondOrderKey]);

    await waitFor(
      fixture.hub.write.batchRerange([[firstOrderKey, secondOrderKey]], {
        account: fixture.resolver.account,
        gas,
      }),
    );

    const firstState: any = await fixture.hub.read.getOrderState([
      firstOrderKey,
    ]);
    const secondState: any = await fixture.hub.read.getOrderState([
      secondOrderKey,
    ]);

    assert.equal(firstState.order.closed, false);
    assert.equal(firstState.rerangeCount, 1);
    assert.equal(secondState.order.closed, false);
    assert.equal(secondState.rerangeCount, 1);
  });

  it("keeps permissionless rerange from widening beyond the last live range", async () => {
    const vault = await createVault(fixture.alice);
    const initialCapital = await fundVaultWithUsdc(
      fixture.alice,
      vault,
      5n * 10n ** 18n,
    );
    const openTick = await currentTick();
    const targetTick = openTick + V3_TICK_SPACING * 30;
    const triggerTicks = V3_TICK_SPACING * 20;

    await openSellOrder(
      vault,
      targetTick,
      fixture.alice,
      initialCapital,
      false,
      triggerTicks,
    );

    const firstTick = await movePriceIntoBand(
      targetTick - V3_TICK_SPACING * 8,
      targetTick - V3_TICK_SPACING * 4,
    );
    assert.ok(firstTick >= targetTick - V3_TICK_SPACING * 8);
    assert.ok(firstTick < targetTick - V3_TICK_SPACING * 4);

    const orderKey = await getVaultOrderKey(vault, 0n);
    await rerangeOrder(orderKey, fixture.resolver);

    const narrowedState: any = await fixture.hub.read.getOrderState([orderKey]);
    assert.equal(narrowedState.order.closed, false);

    const retraceTick = await movePriceDownTo(
      targetTick - V3_TICK_SPACING * 14,
      DOWN_SWAP_STEPS,
      2,
    );
    assert.ok(retraceTick < narrowedState.upperTick);
    assert.ok(retraceTick <= targetTick - V3_TICK_SPACING * 12);

    const preview: any = await fixture.hub.read.previewRerange([orderKey]);
    assert.equal(preview.activatePlan.activateOrder, false);
    assert.equal(preview.removePlan.removeLiquidity, false);
    assert.equal(preview.nextLowerTick, 0);
    assert.equal(preview.nextUpperTick, 0);

    await assert.rejects(rerangeOrder(orderKey, fixture.resolver));

    const rerangedState: any = await fixture.hub.read.getOrderState([orderKey]);
    assert.equal(rerangedState.lowerTick, narrowedState.lowerTick);
    assert.equal(rerangedState.upperTick, narrowedState.upperTick);
    assert.equal(rerangedState.rerangeCount, 1);
  });

  it("allows manager rerange to widen again from a narrowed live range", async () => {
    const vault = await createVault(fixture.alice);
    const initialCapital = await fundVaultWithUsdc(
      fixture.alice,
      vault,
      5n * 10n ** 18n,
    );
    const openTick = await currentTick();
    const targetTick = openTick + V3_TICK_SPACING * 30;
    const triggerTicks = V3_TICK_SPACING * 20;

    await openSellOrder(
      vault,
      targetTick,
      fixture.alice,
      initialCapital,
      false,
      triggerTicks,
    );

    const firstTick = await movePriceIntoBand(
      targetTick - V3_TICK_SPACING * 8,
      targetTick - V3_TICK_SPACING * 4,
    );
    assert.ok(firstTick >= targetTick - V3_TICK_SPACING * 8);
    assert.ok(firstTick < targetTick - V3_TICK_SPACING * 4);

    const orderKey = await getVaultOrderKey(vault, 0n);
    await rerangeOrder(orderKey, fixture.resolver);

    const narrowedState: any = await fixture.hub.read.getOrderState([orderKey]);
    const retraceTick = await movePriceDownTo(
      targetTick - V3_TICK_SPACING * 14,
      DOWN_SWAP_STEPS,
      2,
    );
    assert.ok(retraceTick <= targetTick - V3_TICK_SPACING * 12);

    const permissionlessPreview: any = await fixture.hub.read.previewRerange([
      orderKey,
    ]);
    const managerPreview: any = await fixture.hub.read.previewRerange([
      orderKey,
      targetTick,
      triggerTicks,
    ]);

    assert.equal(permissionlessPreview.activatePlan.activateOrder, false);
    assert.equal(permissionlessPreview.removePlan.removeLiquidity, false);
    assert.equal(permissionlessPreview.nextLowerTick, 0);
    assert.equal(managerPreview.activatePlan.activateOrder, true);
    assert.equal(managerPreview.removePlan.removeLiquidity, true);
    assert.ok(managerPreview.nextLowerTick < narrowedState.lowerTick);
    assert.equal(
      managerPreview.nextUpperTick,
      alignUp(targetTick, V3_TICK_SPACING),
    );
  });

  it("allows manager rerange when price moved outside current position but updated trigger ticks permit it", async () => {
    const vault = await createVault(fixture.alice);
    const openTick = await currentTick();
    const targetTick = openTick - V3_TICK_SPACING * 30;

    await fundVaultWithWeth(fixture.alice, vault, INITIAL_CAPITAL);
    await openBuyOrder(
      vault,
      targetTick,
      fixture.alice,
      INITIAL_CAPITAL,
      false,
      10,
    );

    const movedTick = await movePriceUpTo(
      openTick + V3_TICK_SPACING,
      SWAP_STEPS,
      2,
    );
    assert.ok(movedTick > openTick);

    const orderKey = await getVaultOrderKey(vault, 0n);
    const defaultPreview: any = await fixture.hub.read.previewRerange([
      orderKey,
    ]);
    const managerPreview: any = await fixture.hub.read.previewRerange([
      orderKey,
      targetTick,
      V3_TICK_SPACING * 40,
    ]);

    assert.equal(defaultPreview.activatePlan.activateOrder, false);
    assert.equal(managerPreview.order.triggerTicks, V3_TICK_SPACING * 40);
    assert.equal(managerPreview.activatePlan.activateOrder, true);

    await rerangeOrderManaged(
      orderKey,
      targetTick,
      V3_TICK_SPACING * 40,
      fixture.alice,
    );

    const state: any = await fixture.hub.read.getOrderState([orderKey]);
    assert.equal(state.order.triggerTicks, V3_TICK_SPACING * 40);
    assert.equal(state.order.closed, false);
    assert.equal(state.rerangeCount, 1);
  });

  it("rejects rerange before price enters the configured trigger window", async () => {
    const vault = await createVault(fixture.alice);
    const openTick = await currentTick();
    const targetTick = openTick + V3_TICK_SPACING * 12;
    const initialCapital = await fundVaultWithUsdc(
      fixture.alice,
      vault,
      5n * 10n ** 18n,
    );

    await openSellOrder(
      vault,
      targetTick,
      fixture.alice,
      initialCapital,
      false,
      10,
    );

    await assert.rejects(
      rerangeOrder(await getVaultOrderKey(vault, 0n), fixture.resolver),
    );
  });

  it("allows a vault manager to widen the rerange trigger and execute after price left the current position", async () => {
    const vault = await createVault(fixture.alice);
    const vaultContract = await fixture.viem.getContractAt(
      "RerangeVault",
      vault,
    );
    await fundVaultWithWeth(fixture.alice, vault, INITIAL_CAPITAL);
    const openTick = await currentTick();
    const targetTick = openTick - V3_TICK_SPACING * 30;

    await waitFor(
      vaultContract.write.setAgent(
        [fixture.agent.account.address, await futureTimestamp()],
        {
          account: fixture.alice.account,
        },
      ),
    );

    await openBuyOrder(
      vault,
      targetTick,
      fixture.alice,
      INITIAL_CAPITAL,
      false,
      10,
    );

    const movedTick = await movePriceUpTo(
      openTick + V3_TICK_SPACING,
      SWAP_STEPS,
      2,
    );
    assert.ok(movedTick > openTick);

    await assert.rejects(
      rerangeOrder(await getVaultOrderKey(vault, 0n), fixture.resolver),
    );

    const orderKey = await getVaultOrderKey(vault, 0n);
    await rerangeOrderManaged(
      orderKey,
      targetTick,
      V3_TICK_SPACING * 40,
      fixture.agent,
    );

    const state: any = await fixture.hub.read.getOrderState([orderKey]);
    assert.equal(state.order.triggerTicks, V3_TICK_SPACING * 40);
    assert.equal(state.order.targetTick, targetTick);
    assert.equal(state.order.closed, false);
    assert.equal(state.rerangeCount, 1);
  });

  it("restricts parameterized rerange to vault managers and applies updated target ticks", async () => {
    const vault = await createVault(fixture.alice);
    const initialCapital = await fundVaultWithUsdc(
      fixture.alice,
      vault,
      5n * 10n ** 18n,
    );
    const openTick = await currentTick();
    const targetTick = openTick + V3_TICK_SPACING * 30;

    await openSellOrder(vault, targetTick, fixture.alice, initialCapital);

    const intermediateTick = await movePriceIntoBand(
      targetTick - V3_TICK_SPACING * 4,
      targetTick,
    );
    assert.ok(intermediateTick >= targetTick - V3_TICK_SPACING * 4);
    assert.ok(intermediateTick < targetTick);

    const updatedTargetTick = targetTick + V3_TICK_SPACING * 6;

    await assert.rejects(
      rerangeOrderManaged(
        await getVaultOrderKey(vault, 0n),
        updatedTargetTick,
        V3_TICK_SPACING * 10,
        fixture.resolver,
      ),
    );

    const orderKey = await getVaultOrderKey(vault, 0n);
    await rerangeOrderManaged(
      orderKey,
      updatedTargetTick,
      V3_TICK_SPACING * 10,
      fixture.alice,
    );

    const order: any = await fixture.hub.read.getOrder([orderKey]);
    assert.equal(order.targetTick, updatedTargetTick);
    assert.equal(order.triggerTicks, V3_TICK_SPACING * 10);

    const state: any = await fixture.hub.read.getOrderState([orderKey]);
    assert.equal(state.order.targetTick, updatedTargetTick);
    assert.equal(state.order.triggerTicks, V3_TICK_SPACING * 10);
    if (!order.closed) {
      assert.equal(state.order.closed, false);
      assert.equal(state.rerangeCount, 1);
      assert.equal(
        state.upperTick,
        alignUp(updatedTargetTick, V3_TICK_SPACING),
      );
    } else {
      assert.equal(state.order.closed, true);
    }
  });

  it("preserves unrelated same-vault balances when closing one live order", async () => {
    const vault = await createVault(fixture.alice);
    const openTick = await currentTick();
    const extraInventory = 7n * 10n ** 17n;

    await fundVaultWithWeth(fixture.alice, vault, INITIAL_CAPITAL);
    await openBuyOrder(vault, openTick - V3_TICK_SPACING * 8, fixture.alice);

    await fundVaultWithWeth(
      fixture.alice,
      vault,
      INITIAL_CAPITAL / 2n + extraInventory,
    );
    await openBuyOrder(
      vault,
      openTick - V3_TICK_SPACING * 14,
      fixture.alice,
      INITIAL_CAPITAL / 2n,
    );

    const vaultWethBeforeClose = await fixture.token1.read.balanceOf([vault]);
    assert.ok(vaultWethBeforeClose >= extraInventory);

    await closeOrder(await getVaultOrderKey(vault, 0n), fixture.alice);

    const order1: any = await fixture.hub.read.getOrder([
      await getVaultOrderKey(vault, 0n),
    ]);
    const order2: any = await fixture.hub.read.getOrder([
      await getVaultOrderKey(vault, 1n),
    ]);
    const vaultWethAfterClose = await fixture.token1.read.balanceOf([vault]);

    assert.equal(order1.closed, true);
    assert.equal(order2.closed, false);
    assert.ok(vaultWethAfterClose >= extraInventory);
  });

  it("opens and closes a buy order with the live uniswap v4 adapter", async () => {
    const vault = await createVault(fixture.alice);
    await fundVaultWithWeth(fixture.alice, vault, INITIAL_CAPITAL);
    const previewParams = {
      vault,
      adapter: fixture.v4Adapter.address,
      token0: fixture.token0.address,
      token1: fixture.token1.address,
      capital: INITIAL_CAPITAL,
      isSell: false,
      targetTick: (await currentTick()) - V4_TICK_SPACING * 30,
      triggerTicks: DEFAULT_TRIGGER_TICKS,
      adapterConfig: fixture.v4AdapterData,
      referrer: fixture.referrer.account.address,
      keepBalancesInVault: false,
      unwrapOut: false,
    };
    const preview: any = await fixture.hub.read.previewOpen([
      fixture.alice.account.address,
      previewParams,
    ]);
    const targetTick =
      Number(preview.market.currentTick) - V4_TICK_SPACING * 10;

    await openBuyOrderV4(vault, targetTick, fixture.alice);

    const state: any = await fixture.hub.read.getOrderState([
      await getVaultOrderKey(vault, 0n),
    ]);
    const range = expectedRange(
      false,
      targetTick,
      DEFAULT_TRIGGER_TICKS,
      Number(state.market.currentTick),
      V4_TICK_SPACING,
    );
    assert.equal(
      state.order.adapter.toLowerCase(),
      fixture.v4Adapter.address.toLowerCase(),
    );
    assert.equal(state.lowerTick, range.lowerTick);
    assert.equal(state.upperTick, range.upperTick);
    assert.ok(state.liquidity > 0n);

    const aliceUsdcBeforeClose = await fixture.token0.read.balanceOf([
      fixture.alice.account.address,
    ]);
    const aliceWethBeforeClose = await fixture.token1.read.balanceOf([
      fixture.alice.account.address,
    ]);

    await closeOrder(await getVaultOrderKey(vault, 0n), fixture.alice);

    const order: any = await fixture.hub.read.getOrder([
      await getVaultOrderKey(vault, 0n),
    ]);
    const vaultUsdc = await fixture.token0.read.balanceOf([vault]);
    const vaultWeth = await fixture.token1.read.balanceOf([vault]);
    const aliceUsdcAfterClose = await fixture.token0.read.balanceOf([
      fixture.alice.account.address,
    ]);
    const aliceWethAfterClose = await fixture.token1.read.balanceOf([
      fixture.alice.account.address,
    ]);

    assert.equal(order.closed, true);
    assert.equal(vaultUsdc, 0n);
    assert.equal(vaultWeth, 0n);
    assert.ok(
      aliceUsdcAfterClose > aliceUsdcBeforeClose ||
        aliceWethAfterClose > aliceWethBeforeClose,
    );
  });

  it("opens and closes a sell order with the live uniswap v4 adapter", async () => {
    const vault = await createVault(fixture.alice);
    const initialCapital = await fundVaultWithUsdc(
      fixture.alice,
      vault,
      5n * 10n ** 18n,
    );
    const previewParams = {
      vault,
      adapter: fixture.v4Adapter.address,
      token0: fixture.token0.address,
      token1: fixture.token1.address,
      capital: initialCapital,
      isSell: true,
      targetTick: (await currentTick()) + V4_TICK_SPACING * 30,
      triggerTicks: DEFAULT_TRIGGER_TICKS,
      adapterConfig: fixture.v4AdapterData,
      referrer: fixture.referrer.account.address,
      keepBalancesInVault: false,
      unwrapOut: false,
    };
    const preview: any = await fixture.hub.read.previewOpen([
      fixture.alice.account.address,
      previewParams,
    ]);
    const targetTick =
      Number(preview.market.currentTick) + V4_TICK_SPACING * 10;

    await openSellOrderV4(vault, targetTick, fixture.alice, initialCapital);

    const state: any = await fixture.hub.read.getOrderState([
      await getVaultOrderKey(vault, 0n),
    ]);
    const range = expectedRange(
      true,
      targetTick,
      DEFAULT_TRIGGER_TICKS,
      Number(state.market.currentTick),
      V4_TICK_SPACING,
    );
    assert.equal(
      state.order.adapter.toLowerCase(),
      fixture.v4Adapter.address.toLowerCase(),
    );
    assert.equal(state.lowerTick, range.lowerTick);
    assert.equal(state.upperTick, range.upperTick);
    assert.ok(state.liquidity > 0n);

    const aliceUsdcBeforeClose = await fixture.token0.read.balanceOf([
      fixture.alice.account.address,
    ]);
    const aliceWethBeforeClose = await fixture.token1.read.balanceOf([
      fixture.alice.account.address,
    ]);

    await closeOrder(await getVaultOrderKey(vault, 0n), fixture.alice);

    const order: any = await fixture.hub.read.getOrder([
      await getVaultOrderKey(vault, 0n),
    ]);
    const vaultUsdc = await fixture.token0.read.balanceOf([vault]);
    const vaultWeth = await fixture.token1.read.balanceOf([vault]);
    const aliceUsdcAfterClose = await fixture.token0.read.balanceOf([
      fixture.alice.account.address,
    ]);
    const aliceWethAfterClose = await fixture.token1.read.balanceOf([
      fixture.alice.account.address,
    ]);

    assert.equal(order.closed, true);
    assert.equal(vaultUsdc, 0n);
    assert.equal(vaultWeth, 0n);
    assert.ok(
      aliceUsdcAfterClose > aliceUsdcBeforeClose ||
        aliceWethAfterClose > aliceWethBeforeClose,
    );
  });
});
