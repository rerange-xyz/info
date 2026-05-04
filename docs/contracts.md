---
title: Contracts
description: Contract surfaces and protocol data structures.
permalink: /contracts/
---

# Contracts

The live protocol has three primary surfaces: hub, vault, and adapter.

## RerangeHub

The hub stores minimal order data, resolves vaults, prepares opens, coordinates reranges and closes, settles fees, and exposes previews.

### Main Reads

| Function                         | Use                                                                                       |
| -------------------------------- | ----------------------------------------------------------------------------------------- |
| `hubConfig()`                    | Current Permit2, treasury, WETH, fee shares, cooldown, completion threshold, paused flag. |
| `vaults(owner)`                  | Number of vaults created or reserved for an owner.                                        |
| `predictVault(owner, index)`     | Deterministic vault address.                                                              |
| `vaultOrderCount(vault)`         | Number of orders opened from a vault.                                                     |
| `getOrderKey(vault, orderIndex)` | Deterministic order key.                                                                  |
| `getOrder(orderKey)`             | Raw order configuration and accounting.                                                   |
| `getOrderState(orderKey)`        | Canonical derived status, range, liquidity, progress, fees, and market data.              |
| `previewOpen(owner, params)`     | Open quote and range validation.                                                          |
| `previewRerange(orderKey)`       | Rerange quote and close prediction.                                                       |
| `previewClose(orderKey)`         | Close quote.                                                                              |

### Main Writes

| Function                                      | Use                                                                                     |
| --------------------------------------------- | --------------------------------------------------------------------------------------- |
| `createVault()`                               | Create the next deterministic vault for the caller.                                     |
| `open(params)`                                | Open an order with approval/pre-funded capital or native WETH wrapping when applicable. |
| `open2(params, permit, signature)`            | Open using Permit2 source-token transfer.                                               |
| `rerange(orderKey)`                           | Permissionless maintenance.                                                             |
| `rerange(orderKey, targetTick, triggerTicks)` | Manager-authorized rerange variant for updated execution parameters.                    |
| `close(orderKey)`                             | Close an open order.                                                                    |
| `batchRerange(orderKeys)`                     | Best-effort batch maintenance.                                                          |
| `multicall(data)`                             | Atomic delegatecall bundle.                                                             |

### Events

`VaultCreated`, `OrderOpened`, `OrderReranged`, `OrderClosed`, `AdapterAllowedUpdated`, `HubConfigUpdated`, and `OwnershipTransferred`.

## RerangeVault

The vault is the user's execution smart account. It owns tokens and LP positions, executes adapter calls only when instructed by the hub, and exposes owner withdrawals and calls.

| Function                                 | Use                                        |
| ---------------------------------------- | ------------------------------------------ |
| `owner()`                                | Vault owner wallet.                        |
| `hub()`                                  | Authorized hub.                            |
| `setAgent(agent, accessExpiresAt)`       | Owner assigns a manager until a timestamp. |
| `isManager(account)`                     | Owner or unexpired agent check.            |
| `execute(orderKey, plan)`                | Hub-only adapter execution.                |
| `payout(orderKey, isToken0, to, amount)` | Hub-only fee payout.                       |
| `withdraw(token, to, amount)`            | Owner withdrawal.                          |
| `call(target, value, data)`              | Owner arbitrary call.                      |
| `multicall(targets, values, data)`       | Owner batch calls.                         |

Vault events include `AgentUpdated`, `OrderExecuted`, `TokenPayout`, `TokenWithdraw`, and `CallExecuted`.

## IAdapter

Adapters are stateless venue integrations. They normalize adapter config, expose pool state, prepare executable calls, decode execution results, and expose position views.

| Function                                      | Use                                                                           |
| --------------------------------------------- | ----------------------------------------------------------------------------- |
| `version()`                                   | Adapter version.                                                              |
| `venue()`                                     | Venue identifier.                                                             |
| `initializeAdapterData(adapterConfig)`        | Convert user config to stored adapter data.                                   |
| `prepareExecution(vault, order, plan)`        | Finalize plan, minima, and ordered external calls.                            |
| `decodeExecuteResult(adapterData, results)`   | Convert call results into Rerange execution accounting and next adapter data. |
| `getPoolState(token0, token1, adapterData)`   | Current tick, TWAP tick, sqrt price, and liquidity.                           |
| `getTickSpacing(token0, token1, adapterData)` | Pool tick spacing.                                                            |
| `getMaxTwapDeviation(adapterData)`            | Configured TWAP safety limit.                                                 |
| `getPosition(vault, orderKey, adapterData)`   | LP position view.                                                             |

## Core Structs

### `CreateOrderParams`

```solidity
struct CreateOrderParams {
    address vault;
    address adapter;
    address token0;
    address token1;
    uint256 capital;
    bool isSell;
    int24 targetTick;
    uint24 triggerTicks;
    bytes adapterConfig;
    address referrer;
    bool keepBalancesInVault;
    bool unwrapOut;
}
```

### `OrderStateView`

```solidity
struct OrderStateView {
    Order order;
    OrderStatus status;
    int24 lowerTick;
    int24 upperTick;
    uint128 liquidity;
    uint32 rerangeCount;
    uint256 progressBps;
    uint256 remainingSource;
    uint256 convertedTarget;
    uint256 accruedFee0;
    uint256 accruedFee1;
    PoolState market;
}
```

## Source Links

- [Solidity interfaces](https://github.com/rerange-xyz/info/tree/main/protocol/interfaces)
- [ABI files](https://github.com/rerange-xyz/info/tree/main/protocol/abi)
- [Deployment manifests](https://github.com/rerange-xyz/info/tree/main/protocol/deployments)
- [Wagmi SDK source](https://github.com/rerange-xyz/info/tree/main/sdk)
