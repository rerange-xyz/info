---
title: Developers
description: Developer quickstart for integrating Rerange.
permalink: /developers/
---

# Quickstart

Rerange can be integrated through the generated Wagmi package, raw ABIs, or Solidity interfaces. The public package is `@rerange/wagmi`; it exports generated reads/writes, ABI, and deployment metadata.

## Install

```bash
npm install @rerange/wagmi @wagmi/core @wagmi/connectors viem
```

Use `viem` for ABI encoding, ticks, and any app-specific price math. Use `@rerange/wagmi` for the contract surface.

## Preview An Order

```ts
import { createConfig, http } from "@wagmi/core";
import { base } from "viem/chains";
import { encodeAbiParameters, parseUnits, zeroAddress } from "viem";
import {
  readRerangeHubPreviewOpen,
  v3AdapterAddressByChainId,
} from "@rerange/wagmi";

const config = createConfig({
  chains: [base],
  transports: {
    [base.id]: http(),
  },
});

const adapterConfig = encodeAbiParameters(
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
      pool: "0x6c561b446416e1a00e8e93e221854d6ea4171372",
      fee: 3000,
      twapWindow: 0,
      maxTwapDeviation: 20,
      maxTickDeviation: 0,
      slippageBps: 30,
    },
  ],
);

const params = {
  vault: zeroAddress,
  adapter: v3AdapterAddressByChainId[base.id],
  token0: "0x4200000000000000000000000000000000000006",
  token1: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  capital: parseUnits("1", 18),
  isSell: true,
  targetTick: -195000,
  triggerTicks: 300,
  adapterConfig,
  referrer: zeroAddress,
  keepBalancesInVault: false,
  unwrapOut: false,
} as const;

const preview = await readRerangeHubPreviewOpen(config, {
  chainId: base.id,
  args: ["0x1111111111111111111111111111111111111111", params],
});

console.log(preview.lowerTick, preview.upperTick, preview.market.currentTick);
```

Apps should convert user prices into ticks before constructing `params`. Keep token order canonical for the pool: `token0` is the lower-address pool token, not necessarily the user's source token.

## Create An Order

After building `params` as above, connect a wallet and submit the open transaction.

```ts
import { connect, createConfig, http, switchChain } from "@wagmi/core";
import { injected } from "@wagmi/connectors";
import { base } from "viem/chains";
import { writeRerangeHubOpen } from "@rerange/wagmi";

const config = createConfig({
  chains: [base],
  connectors: [injected()],
  transports: {
    [base.id]: http(),
  },
});

const { accounts } = await connect(config, {
  connector: injected(),
});
await switchChain(config, { chainId: base.id });

const hash = await writeRerangeHubOpen(config, {
  chainId: base.id,
  account: accounts[0],
  args: [params],
});
```

Before calling `open`, approve the hub for the source token top-up or pre-fund the resolved vault. You can also use `open2` with Permit2.

## Read Orders And Vaults

```ts
import {
  readRerangeHubGetOrderKey,
  readRerangeHubGetOrderState,
  readRerangeHubPredictVault,
  readRerangeHubVaultOrderCount,
  readRerangeHubVaults,
} from "@rerange/wagmi";

const owner = "0x1111111111111111111111111111111111111111";
const vaultCount = await readRerangeHubVaults(config, {
  chainId: base.id,
  args: [owner],
});

const vault = await readRerangeHubPredictVault(config, {
  chainId: base.id,
  args: [owner, vaultCount - 1n],
});

const orderCount = await readRerangeHubVaultOrderCount(config, {
  chainId: base.id,
  args: [vault],
});

const orderKey = await readRerangeHubGetOrderKey(config, {
  chainId: base.id,
  args: [vault, orderCount - 1n],
});

const state = await readRerangeHubGetOrderState(config, {
  chainId: base.id,
  args: [orderKey],
});
```

`getOrderState(orderKey)` is the canonical read for status, range, liquidity, progress, fees, and market tick.

## Direct Contract Flow

If you call contracts directly:

1. Resolve or create a vault with `predictVault(owner, vaultIndex)` or `createVault()`.
2. Encode adapter config.
3. Call `previewOpen(owner, params)` to validate range and get current market context.
4. Approve the hub for source token top-up, pre-fund the vault, or use `open2` with Permit2.
5. Call `open(params)`.
6. Derive `orderKey = keccak256(abi.encode(vault, orderIndex))`, or read it from `OrderOpened`.
7. Read state with `getOrderState(orderKey)`.

## CreateOrderParams

| Field                 | Description                                                                                   |
| --------------------- | --------------------------------------------------------------------------------------------- |
| `vault`               | Existing vault address, or zero address to resolve/create the next vault for the caller.      |
| `adapter`             | Allowed adapter address, usually the public Uniswap v3 adapter.                               |
| `token0`, `token1`    | Canonical pool token order, not user input order.                                             |
| `capital`             | Source amount in raw token units.                                                             |
| `isSell`              | `true` when source is token0, `false` when source is token1.                                  |
| `targetTick`          | Fixed execution target in pool ticks.                                                         |
| `triggerTicks`        | Max tick distance from target for the live sliding range.                                     |
| `adapterConfig`       | Venue-specific config, such as Uniswap v3 pool, fee, TWAP, tick drift, and slippage settings. |
| `referrer`            | Address receiving configured non-target-asset fee share, or zero address.                     |
| `keepBalancesInVault` | Keep final balances in vault instead of withdrawing on close.                                 |
| `unwrapOut`           | Unwrap WETH output to native ETH where supported by close flow.                               |

## Uniswap v3 Adapter Config

The public v3 config tuple is:

| Field              | Type      | Typical value                         |
| ------------------ | --------- | ------------------------------------- |
| `pool`             | `address` | Uniswap v3 pool address               |
| `fee`              | `uint24`  | `500`, `3000`, or `10000`             |
| `twapWindow`       | `uint32`  | `0` or an integration-defined window  |
| `maxTwapDeviation` | `uint24`  | `20`                                  |
| `maxTickDeviation` | `uint24`  | `0` unless you explicitly allow drift |
| `slippageBps`      | `uint16`  | `30`                                  |

## Common Integration Checks

- Simulate `open`, `rerange`, and `close` before sending transactions.
- Treat `getOrderState` as the canonical status surface; status is derived from adapter market and position data.
- Use event logs for indexing: `VaultCreated`, `OrderOpened`, `OrderReranged`, `OrderClosed`, and vault `OrderExecuted`.
- Keep target prices in user-facing units and convert to ticks only at the integration boundary.
- All test cases can be found [here](https://github.com/rerange-xyz/info/tree/main/protocol/test).
