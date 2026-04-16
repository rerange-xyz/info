# RΞRANGE | Liquid Orders

RΞRANGE is a liquid order protocol built around concentrated liquidity. Users place directional orders that stay active in liquidity, rerange as price moves, and aim to complete while earning fees along the way.

## What is here

- [protocol](./protocol): public protocol package with ABI files, public Solidity interfaces, deployment manifests, and fork-based validation tests
- [sdk](./sdk): generated Wagmi-based SDK for app integrations

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

The JS SDK lives in [sdk](./sdk).

It exports:

- generated Wagmi actions from [src/generated.ts](./sdk/src/generated.ts)
- deployment helpers from [src/deployments.ts](./sdk/src/deployments.ts)
- raw copied ABI and deployment config from [src/config/index.ts](./sdk/src/config/index.ts)
