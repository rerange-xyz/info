import assert from "node:assert/strict";
import { before, beforeEach, describe, it } from "node:test";

import hre from "hardhat";
import { encodeAbiParameters, encodeFunctionData, parseAbi } from "viem";

describe("RerangeVault invariants", async () => {
  const PERMIT2 = "0x000000000022D473030F116dDEE9F6B43aC78BA3" as const;
  const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" as const;
  const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2" as const;
  const V3_POOL = "0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8" as const;
  const V3_POSITION_MANAGER =
    "0xC36442b4a4522E871399CD717aBDD847Ab11FE88" as const;
  const V3_SWAP_ROUTER = "0xE592427A0AEce92De3Edee1F18E0157C05861564" as const;
  const V3_FEE = 3_000;
  const V3_TICK_SPACING = 60;
  const DEFAULT_TRIGGER_TICKS = V3_TICK_SPACING * 5;
  const HUB_RESOLVER_SHARE_BPS = 5_000;
  const HUB_REFERRER_SHARE_BPS = 1_000;
  const HUB_RERANGE_COOLDOWN = 300;
  const HUB_COMPLETION_THRESHOLD_BPS = 8;
  const INITIAL_CAPITAL = 5n * 10n ** 18n;
  const EXTRA_PROTECTED_WETH = 2n * 10n ** 17n;
  const WETH_DEPOSIT_SELECTOR = "0xd0e30db0" as const;
  const SWAP_ROUTER_ABI = parseAbi([
    "function exactInputSingle((address tokenIn,address tokenOut,uint24 fee,address recipient,uint256 deadline,uint256 amountIn,uint256 amountOutMinimum,uint160 sqrtPriceLimitX96) params) payable returns (uint256 amountOut)",
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
    v3Pool: any;
    v3AdapterData: `0x${string}`;
  };

  let fixture: Fixture;
  let baseSnapshotId: string | undefined;

  async function waitFor(hashPromise: Promise<`0x${string}`>) {
    const hash = await hashPromise;
    await fixture.publicClient.waitForTransactionReceipt({ hash });
    return hash;
  }

  async function futureTimestamp(offsetSeconds: bigint = 3_600n) {
    const block = await fixture.publicClient.getBlock();
    return block.timestamp + offsetSeconds;
  }

  async function currentTick(): Promise<number> {
    const slot0 = await fixture.v3Pool.read.slot0();
    return Number(slot0[1]);
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
          sqrtPriceLimitX96: 0n,
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

  async function buildFixture(): Promise<Fixture> {
    const { viem } = await hre.network.connect("hardhat");
    const publicClient = await viem.getPublicClient();
    const [deployer, alice, bob, agent, resolver, referrer, treasuryWallet] =
      await viem.getWalletClients();

    const token0 = await viem.getContractAt("IERC20Minimal", USDC);
    const token1 = await viem.getContractAt("IERC20Minimal", WETH);
    const v3Pool = await viem.getContractAt("IUniswapV3PoolMinimal", V3_POOL);
    const v3Adapter = await viem.deployContract("UniswapV3Adapter", [
      V3_POSITION_MANAGER,
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
      v3Pool,
      v3AdapterData,
    };

    fixture = builtFixture;
    await waitFor(hub.write.setAdapterAllowed([v3Adapter.address, true]));
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
    return predicted;
  }

  async function getVaultOrderKey(vault: `0x${string}`, orderIndex: bigint) {
    return fixture.hub.read.getOrderKey([vault, orderIndex]);
  }

  async function openBuyOrder(
    vault: `0x${string}`,
    targetTick: number,
    account: Fixture["alice"],
    capital: bigint = INITIAL_CAPITAL,
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
            triggerTicks: DEFAULT_TRIGGER_TICKS,
            adapterConfig: fixture.v3AdapterData,
            referrer: fixture.referrer.account.address,
            keepBalancesInVault: false,
            unwrapOut: false,
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
            triggerTicks: DEFAULT_TRIGGER_TICKS,
            adapterConfig: fixture.v3AdapterData,
            referrer: fixture.referrer.account.address,
            keepBalancesInVault: false,
            unwrapOut: false,
          },
        ],
        { account: account.account },
      ),
    );
  }

  async function closeOrder(
    orderKey: `0x${string}`,
    account: Fixture["alice"],
  ) {
    return waitFor(
      fixture.hub.write.close([orderKey], { account: account.account }),
    );
  }

  async function impersonateWallet(address: `0x${string}`) {
    await fixture.publicClient.request({
      method: "hardhat_impersonateAccount",
      params: [address],
    });
    await fixture.publicClient.request({
      method: "hardhat_setBalance",
      params: [address, "0x3635c9adc5dea00000"],
    });
    return fixture.viem.getWalletClient(address);
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
  });

  it("INV-1: unauthorized actors cannot move vault funds", async () => {
    const vault = await createVault(fixture.alice);
    await fundVaultWithWeth(fixture.alice, vault, INITIAL_CAPITAL);

    const vaultContract = await fixture.viem.getContractAt(
      "RerangeVault",
      vault,
    );
    await waitFor(
      vaultContract.write.setAgent(
        [fixture.agent.account.address, await futureTimestamp(60n)],
        {
          account: fixture.alice.account,
        },
      ),
    );

    const vaultBefore = await fixture.token1.read.balanceOf([vault]);
    const attackerAddresses = [
      fixture.agent.account.address,
      fixture.resolver.account.address,
      fixture.bob.account.address,
    ];
    const attackerBalancesBefore = await Promise.all(
      attackerAddresses.map((account) =>
        fixture.token1.read.balanceOf([account]),
      ),
    );

    const transferData = encodeFunctionData({
      abi: fixture.token1.abi,
      functionName: "transfer",
      args: [fixture.bob.account.address, 1n],
    });
    const attackers = [fixture.agent, fixture.resolver, fixture.bob];

    for (const attacker of attackers) {
      await assert.rejects(
        waitFor(
          vaultContract.write.withdraw(
            [fixture.token1.address, attacker.account.address, 1n],
            {
              account: attacker.account,
            },
          ),
        ),
      );

      await assert.rejects(
        waitFor(
          vaultContract.write.call([fixture.token1.address, 0n, transferData], {
            account: attacker.account,
          }),
        ),
      );
    }

    const vaultAfter = await fixture.token1.read.balanceOf([vault]);
    const attackerBalancesAfter = await Promise.all(
      attackerAddresses.map((account) =>
        fixture.token1.read.balanceOf([account]),
      ),
    );

    assert.equal(vaultAfter, vaultBefore);
    assert.deepEqual(attackerBalancesAfter, attackerBalancesBefore);
  });

  it("INV-2: orders remain isolated to their originating vault", async () => {
    const vaultA = await createVault(fixture.alice);
    const predictedVaultB = await fixture.hub.read.predictVault([
      fixture.bob.account.address,
      0n,
    ]);
    await waitFor(
      fixture.hub.write.createVault({ account: fixture.bob.account }),
    );
    const vaultB = predictedVaultB;

    await fundVaultWithWeth(fixture.alice, vaultA, INITIAL_CAPITAL);
    const openTick = await currentTick();
    await openBuyOrder(vaultA, openTick - V3_TICK_SPACING * 10, fixture.alice);

    const vaultAContract = await fixture.viem.getContractAt(
      "RerangeVault",
      vaultA,
    );
    const vaultBContract = await fixture.viem.getContractAt(
      "RerangeVault",
      vaultB,
    );
    const orderKeyA = await getVaultOrderKey(vaultA, 0n);
    const orderFromA: any = await vaultAContract.read.getOrder([orderKeyA]);

    assert.equal(orderFromA.vault.toLowerCase(), vaultA.toLowerCase());
    await assert.rejects(vaultBContract.read.getOrder([orderKeyA]));
  });

  it("INV-3: non-owners cannot execute arbitrary external calls", async () => {
    const vault = await createVault(fixture.alice);
    await fundVaultWithWeth(fixture.alice, vault, INITIAL_CAPITAL);

    const vaultContract = await fixture.viem.getContractAt(
      "RerangeVault",
      vault,
    );
    await waitFor(
      vaultContract.write.setAgent(
        [fixture.agent.account.address, await futureTimestamp(60n)],
        {
          account: fixture.alice.account,
        },
      ),
    );

    const transferData = encodeFunctionData({
      abi: fixture.token1.abi,
      functionName: "transfer",
      args: [fixture.agent.account.address, 1n],
    });

    await assert.rejects(
      waitFor(
        vaultContract.write.call([fixture.token1.address, 0n, transferData], {
          account: fixture.agent.account,
        }),
      ),
    );

    await assert.rejects(
      waitFor(
        vaultContract.write.call([fixture.token1.address, 0n, transferData], {
          account: fixture.bob.account,
        }),
      ),
    );

    assert.equal(
      await fixture.token1.read.balanceOf([fixture.agent.account.address]),
      0n,
    );
    assert.equal(await fixture.token1.read.balanceOf([vault]), INITIAL_CAPITAL);
  });

  it("INV-4: closing an order does not leak the funded asset", async () => {
    const vault = await createVault(fixture.alice);
    await fundVaultWithWeth(fixture.alice, vault, INITIAL_CAPITAL);

    const fundedBalance = await fixture.token1.read.balanceOf([vault]);
    const openTick = await currentTick();
    await openBuyOrder(vault, openTick - V3_TICK_SPACING * 10, fixture.alice);
    await closeOrder(await getVaultOrderKey(vault, 0n), fixture.alice);

    const remainingVaultBalance = await fixture.token1.read.balanceOf([vault]);
    assert.ok(remainingVaultBalance <= fundedBalance);
    assert.equal(
      await fixture.token1.read.balanceOf([fixture.agent.account.address]),
      0n,
    );
    assert.equal(
      await fixture.token1.read.balanceOf([fixture.bob.account.address]),
      0n,
    );
  });

  it("INV-5: token0 actions cannot consume unrelated token1 inventory", async () => {
    const vault = await createVault(fixture.alice);
    await fundVaultWithWeth(fixture.alice, vault, EXTRA_PROTECTED_WETH);

    const sellCapital = await fundVaultWithUsdc(
      fixture.alice,
      vault,
      INITIAL_CAPITAL,
    );
    const wethBeforeOpen = await fixture.token1.read.balanceOf([vault]);
    const openTick = await currentTick();

    await openSellOrder(
      vault,
      openTick + V3_TICK_SPACING * 10,
      fixture.alice,
      sellCapital,
    );

    const wethAfterOpen = await fixture.token1.read.balanceOf([vault]);
    assert.equal(wethAfterOpen, wethBeforeOpen);
  });

  it("INV-6: each order stays bound to the vault recorded in hub storage", async () => {
    const vault = await createVault(fixture.alice);
    await fundVaultWithWeth(fixture.alice, vault, INITIAL_CAPITAL);

    const openTick = await currentTick();
    await openBuyOrder(vault, openTick - V3_TICK_SPACING * 10, fixture.alice);

    const order: any = await fixture.hub.read.getOrder([
      await getVaultOrderKey(vault, 0n),
    ]);
    assert.equal(order.vault.toLowerCase(), vault.toLowerCase());
  });

  it("INV-7: only the owner can withdraw directly from the vault", async () => {
    const vault = await createVault(fixture.alice);
    await fundVaultWithWeth(fixture.alice, vault, INITIAL_CAPITAL);

    const vaultContract = await fixture.viem.getContractAt(
      "RerangeVault",
      vault,
    );
    await assert.rejects(
      waitFor(
        vaultContract.write.withdraw(
          [fixture.token1.address, fixture.bob.account.address, 1n],
          {
            account: fixture.bob.account,
          },
        ),
      ),
    );

    assert.equal(
      await fixture.token1.read.balanceOf([fixture.bob.account.address]),
      0n,
    );
    assert.equal(await fixture.token1.read.balanceOf([vault]), INITIAL_CAPITAL);
  });

  it("INV-8: hub cannot execute an order on the wrong vault", async () => {
    const vaultA = await createVault(fixture.alice);
    const predictedVaultB = await fixture.hub.read.predictVault([
      fixture.bob.account.address,
      0n,
    ]);
    await waitFor(
      fixture.hub.write.createVault({ account: fixture.bob.account }),
    );
    const vaultB = predictedVaultB;

    await fundVaultWithWeth(fixture.alice, vaultA, INITIAL_CAPITAL);
    const openTick = await currentTick();
    await openBuyOrder(vaultA, openTick - V3_TICK_SPACING * 10, fixture.alice);

    const hubWallet = await impersonateWallet(fixture.hub.address);
    const vaultBAsHub = await fixture.viem.getContractAt(
      "RerangeVault",
      vaultB,
      {
        walletClient: hubWallet,
      },
    );
    const emptyPlan = {
      collectFees: false,
      removeLiquidity: false,
      activateOrder: false,
      closeOrder: false,
      expectedTick: 0,
      activateTickLower: 0,
      activateTickUpper: 0,
      deployAmount0: 0n,
      deployAmount1: 0n,
      minRemove0: 0n,
      minRemove1: 0n,
      minActivate0: 0n,
      minActivate1: 0n,
      minActivateLiquidity: 0n,
    };

    await assert.rejects(
      waitFor(
        vaultBAsHub.write.execute([
          await getVaultOrderKey(vaultA, 0n),
          emptyPlan,
        ]),
      ),
    );

    const order: any = await fixture.hub.read.getOrder([
      await getVaultOrderKey(vaultA, 0n),
    ]);
    assert.equal(order.vault.toLowerCase(), vaultA.toLowerCase());
  });
});
