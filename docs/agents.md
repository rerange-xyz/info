---
title: Agents
description: Resolver and automation guide for Rerange.
permalink: /agents/
---

# Agents Guide

Rerange agents monitor orders and call permissionless maintenance functions. The key function is `RerangeHub.rerange(orderKey)`.

Resolvers do not need vault ownership. They are paid from target-asset fees when a rerange closes or advances an order under the protocol's settlement rules.

## Agent Skills

Public Rerange skills are available for agents that need structured operating
guidance beyond this resolver quickstart:

- [Skills catalog](https://github.com/rerange-xyz/info/blob/main/skills/README.md)
- [Skills manifest](https://github.com/rerange-xyz/info/blob/main/skills/manifest.json)
- [SKILL.md](https://github.com/rerange-xyz/info/blob/main/skills/SKILL.md)
- [Protocol discovery](https://github.com/rerange-xyz/info/blob/main/skills/protocol-discovery.md)
- [Intent order builder](https://github.com/rerange-xyz/info/blob/main/skills/intent-order-builder.md)
- [Order monitor](https://github.com/rerange-xyz/info/blob/main/skills/order-monitor.md)
- [Resolver rerange](https://github.com/rerange-xyz/info/blob/main/skills/resolver-rerange.md)
- [Vault manager](https://github.com/rerange-xyz/info/blob/main/skills/vault-manager.md)
- [Strategy composer](https://github.com/rerange-xyz/info/blob/main/skills/strategy-composer.md)
- [Safety and risk](https://github.com/rerange-xyz/info/blob/main/skills/safety-risk.md)

Use the skills as the agent-facing source of truth for intent construction,
monitoring state, resolver execution, vault delegation, strategy composition,
and preflight safety. Use the canonical deployment manifests instead of copying
addresses into prompts or agent memory:
[protocol/deployments](https://github.com/rerange-xyz/info/tree/main/protocol/deployments).

## What To Monitor

For each known order:

- `getOrderState(orderKey)` for status, progress, current range, liquidity, and market tick,
- `previewRerange(orderKey)` for executability, reward estimate, next range, and whether the action will close,
- pool tick and TWAP data through the adapter,
- cooldown from `hubConfig.rerangeCooldown`,
- gas cost versus expected reward.

## Rerange Eligibility

A rerange is valid when the order is open and the adapter-prepared execution passes safety checks. Conceptually:

- if price is inside the current live position, rerange can refresh the sliding window,
- otherwise the price must be inside the trigger band around target, or already beyond target,
- SELL orders can rerange outside the old position when `currentTick >= targetTick - triggerTicks`,
- BUY orders can rerange outside the old position when `currentTick <= targetTick + triggerTicks`,
- if price crosses target, the order closes instead of deploying a new range.

The adapter finalizes execution minima and rejects excessive tick drift.

## Single Order Execution

```ts
import { encodeFunctionData } from "viem";
import { rerangeHubAbi } from "@rerange/wagmi";

const preview = await publicClient.readContract({
  address: hub,
  abi: rerangeHubAbi,
  functionName: "previewRerange",
  args: [orderKey],
});

if (preview.willClose || preview.activatePlan.activateOrder) {
  const hash = await walletClient.writeContract({
    address: hub,
    abi: rerangeHubAbi,
    functionName: "rerange",
    args: [orderKey],
    account,
  });
}
```

## Batch Execution

Use `batchRerange(bytes32[])` when scanning many orders. It delegatecalls `rerange` for each order and returns per-order success flags and result bytes instead of reverting the full batch on one failed order.

For stricter execution, build a `multicall` from known-good `rerange(orderKey)` calls after previewing them.

## Rewards

Resolver rewards are asset-aware:

- resolver rewards come only from fees accrued in the target asset,
- referrer and treasury rewards come only from non-target-asset fees,
- target-asset fees are never paid to referrer or treasury,
- non-target-asset fees are never paid to the resolver.

This means an agent should estimate reward in the order's target token and compare it with chain gas cost.

## Suggested Agent Loop

1. Build an order universe from `OrderOpened` logs.
2. Drop orders where `isOrderClosed(orderKey)` is true.
3. Read or multicall `getOrderState`.
4. Preview candidates with `previewRerange`.
5. Filter by cooldown, TWAP safety, expected close/activation, and gas economics.
6. Submit `batchRerange` or `multicall`.
7. Index `OrderReranged`, `OrderClosed`, and vault `OrderExecuted` logs.

## Manager Agents

Vault owners can also assign managers with `RerangeVault.setAgent(agent, accessExpiresAt)`. Managers can perform owner-authorized order management where supported, but cannot withdraw funds unless they are the vault owner.

Because that delegation is both scoped and time-bounded, `setAgent` can also be used in a session-key-like way. A vault owner can authorize a bot, automation service, or secondary wallet for a limited period so it can manage orders without granting full asset access.

In practice, that lets a vault owner delegate automation to specialized agents that manage different execution styles with reranges. For example, an agent can maintain a DCA-like flow by repeatedly advancing toward a target over time, or run a grid-style strategy by managing many staggered orders across price levels.
