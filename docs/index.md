---
title: Liquid Orders
description: Rerange protocol overview for users, developers, and automation agents.
---

<section class="hero">
  <div class="hero-copy">
    <p class="eyebrow">Concentrated liquidity execution</p>
    <h1>Limit orders that liquid and earn</h1>
    <p class="lede">Rerange is a non-custodial protocol for directional liquid orders. Users set a target price, capital, direction, and trigger distance. The protocol deploys liquidity between market price and target price, reranges as price moves, and closes when conversion is complete.</p>
    <div class="actions">
      <a class="button primary" href="./developers/">Build with Rerange</a>
      <a class="button" href="./users/">Use the protocol</a>
      <a class="button" href="./agents/">Run automation</a>
    </div>
  </div>
  <div class="range-card" aria-label="Rerange liquidity window illustration">
    <p class="eyebrow">Liquidity Range</p>
    <p class="range-side">BUY</p>
    <div class="range-line"></div>
    <div class="range-window" aria-hidden="true"></div>
    <div class="range-dot current"><span>Current</span></div>
    <div class="range-dot target"><span>Target</span></div>
  </div>
</section>

## What Rerange Is

Rerange turns a limit order into a working concentrated liquidity position. Instead of waiting idle off-market, the order earns swap fees while price moves toward the user's target.

The core idea is simple:

- A **sell order** places liquidity from `max(current tick, target tick - trigger ticks)` up to the fixed target tick.
- A **buy order** places liquidity from the fixed target tick up to `min(current tick, target tick + trigger ticks)`.
- Reranging only moves the boundary touching market price. The target stays fixed.
- Assets stay in the user's vault. The hub coordinates execution but does not custody funds.

## Who This Is For

<div class="grid">
  <div class="card"><strong>Users</strong><p>Open orders that aim to convert one asset into another at a target price while collecting LP fees during execution.</p></div>
  <div class="card"><strong>Developers</strong><p>Integrate order creation, previews, vaults, and order state through contracts, ABIs, or the TypeScript SDK.</p></div>
  <div class="card"><strong>Agents</strong><p>Monitor order state, call permissionless reranges, batch executable orders, and earn resolver rewards from target-asset fees.</p></div>
</div>

## Protocol Components

| Component | Role                                                                                     |
| --------- | ---------------------------------------------------------------------------------------- |
| Hub       | Order registry, preview surface, range calculation, rerange coordinator, fee settlement. |
| Vault     | User-owned execution account that holds tokens and LP positions.                         |
| Adapter   | Stateless venue integration. Current public adapters target Uniswap v3 and v4.           |
| Resolver  | Offchain automation that calls `rerange(orderKey)` when an order is executable.          |

## The Lifecycle

1. User previews an order and resolves or creates a vault.
2. User approves or pre-funds the source token.
3. Hub opens the order and asks the vault to mint concentrated liquidity through an adapter.
4. Resolvers watch price, TWAP deviation, cooldown, and conversion progress.
5. A resolver calls `rerange(orderKey)` when the order is executable.
6. The vault removes liquidity, collects fees, and redeploys the next sliding window.
7. When price crosses target or source balance is effectively converted, the order closes and settles.

## Important Safety Properties

- **Non-custodial vaults:** user funds and LP NFTs stay in vaults owned by users.
- **Permissionless maintenance:** reranges can be called by anyone.
- **No market swap in rerange:** execution is done by removing and adding liquidity.
- **TWAP protection:** adapters expose TWAP and tick-deviation checks for execution plans.
- **Directional fee settlement:** resolver rewards come only from target-asset fees; referrer and treasury payments come only from non-target-asset fees.

<div class="card"><p>Rerange is protocol infrastructure. Integrators should still simulate transactions, check deployment config, and surface normal LP risks: price movement, fee variability, smart contract risk, and gas cost.</p></div>
