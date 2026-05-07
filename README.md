# RΞRANGE | Liquid Orders

RΞRANGE is a liquid order protocol built around concentrated liquidity. Users place directional orders that stay active in liquidity, rerange as price moves, and aim to complete while earning fees along the way.

## What is here

- [docs.rerange.xyz](https://docs.rerange.xyz/): public documentation on github pages
- [protocol](./protocol): public protocol package with ABI files, public Solidity interfaces, deployment manifests, and fork-based validation tests
- [sdk](./sdk): generated Wagmi-based SDK for app integrations
- [skills](./skills): public agent skills for discovery, intent construction,
  monitoring, resolver execution, vault management, strategy composition, and
  safety checks

## Onchain integration

Import the public Solidity interfaces from [protocol/interfaces](./protocol/interfaces).

Main entry points:

- [IRerangeHub.sol](./protocol/interfaces/IRerangeHub.sol)
- [IRerangeVault.sol](./protocol/interfaces/IRerangeVault.sol)
- [RerangeTypes.sol](./protocol/libraries/RerangeTypes.sol)

These files are intended for contracts that need to open orders, read order state, manage vaults, or build integrations around the live protocol.

## ABI and deployments

Public ABI files live in [protocol/abi](./protocol/abi).

Public deployment manifests live in [protocol/deployments](./protocol/deployments).

Current public chain manifests included here:

- Ethereum
- Base

## Wagmi SDK

The JS SDK lives in [sdk](./sdk). \
The published package is [`@rerange/wagmi`](https://www.npmjs.com/package/@rerange/wagmi).

Install it with:

```bash
npm install @rerange/wagmi
```

It exports:

- generated Wagmi actions from [src/generated.ts](./sdk/src/generated.ts)
- deployment helpers from [src/deployments.ts](./sdk/src/deployments.ts)
- raw ABI and deployment config from [src/config/index.ts](./sdk/src/config/index.ts)

Simple example:

```ts
import { connect, createConfig, http, switchChain } from "@wagmi/core";
import { injected } from "@wagmi/connectors";
import { encodeAbiParameters, parseUnits, zeroAddress } from "viem";
import { base } from "viem/chains";
import { v3AdapterAddressByChainId, writeRerangeHubOpen } from "@rerange/wagmi";

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

const account = accounts[0];

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
      pool: "0xYourUniswapV3Pool",
      fee: 3_000,
      twapWindow: 0,
      maxTwapDeviation: 20,
      maxTickDeviation: 0,
      slippageBps: 30,
    },
  ],
);

const hash = await writeRerangeHubOpen(config, {
  chainId: base.id,
  account,
  args: [
    {
      vault: zeroAddress,
      adapter: v3AdapterAddressByChainId[base.id],
      token0: "0xToken0",
      token1: "0xToken1",
      capital: parseUnits("1000", 6),
      isSell: true,
      targetTick: 201240,
      triggerTicks: 100,
      adapterConfig,
      referrer: zeroAddress,
      keepBalancesInVault: false,
      unwrapOut: false,
    },
  ],
});

console.log({ hash });
```

Approve the hub for the source token before calling `open()`, or pre-fund the resolved vault. You can find more examples in [protocol tests](./protocol/test/RerangeProtocol.ts).

## Agent skills

Agents should use the public skills before constructing prompts, tools, or
autonomous loops around Rerange:

- [Skills catalog](./skills/README.md)
- [Skills manifest](./skills/manifest.json)
- [Protocol discovery](./skills/protocol-discovery.md)
- [Intent order builder](./skills/intent-order-builder.md)
- [Order monitor](./skills/order-monitor.md)
- [Resolver rerange](./skills/resolver-rerange.md)
- [Vault manager](./skills/vault-manager.md)
- [Strategy composer](./skills/strategy-composer.md)
- [Safety and risk](./skills/safety-risk.md)

Use the skills as the agent-facing source of truth for intent construction,
continuous monitoring, permissionless maintenance, owner-authorized vault
workflows, strategy planning, and mandatory preflight checks.
