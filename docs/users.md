---
title: Users
description: How users should understand Rerange liquid orders.
permalink: /users/
---

# User Guide

Rerange lets you place a target-price order without leaving capital idle. Your order becomes concentrated liquidity between the current market price and your target price. As price moves, the protocol can slide that liquidity window and keep the order working.

## What You Choose

| Field            | Meaning                                                                       |
| ---------------- | ----------------------------------------------------------------------------- |
| Pair             | The two assets you want to convert between, such as WETH and USDC.            |
| Direction        | Sell the first asset for the second, or buy the first asset using the second. |
| Amount           | How much source asset to place into the order.                                |
| Target price     | The execution objective. Rerange does not move it.                            |
| Trigger distance | How far from the target the protocol may place or refresh liquidity.          |

You do not need to think in ticks in the app. Ticks are the protocol's precise price units.

## How A Liquid Order Works

For a sell order, the upper edge of the liquidity range is the target. The lower edge follows market price as it moves up.

For a buy order, the lower edge is the target. The upper edge follows market price as it moves down.

That creates a window between market and target. The order earns swap fees while traders interact with that liquidity.

## Where Funds Live

Funds stay inside your Rerange vault. A vault is a small smart account owned by your wallet. It can hold tokens and LP positions for one or more orders.

The hub coordinates orders but does not hold your funds. Agents and resolvers can maintain orders, but they cannot withdraw from your vault.

## When The Order Closes

An order can close when:

- price crosses the target,
- remaining source asset is below the completion threshold,
- the LP position reaches a fully converted single-asset state,
- you close it manually.

At close, the protocol removes liquidity, collects fees, settles protocol rewards, and returns the order's remaining balances according to your order settings.

## Fees And Rewards

Rerange uses directional fee settlement:

- target-asset fees pay resolver rewards, then the user receives the rest,
- non-target-asset fees pay referrer rewards and treasury,
- protocol rewards do not take target-asset fees,
- resolver rewards do not take non-target-asset fees.

Principal is not protocol fee revenue.

## Practical Notes

- Orders are active liquidity positions, not guaranteed fills.
- Fee earnings depend on volume through the chosen pool and range.
- Reranging costs gas, so very small orders may be less efficient.
- LP positions can experience price and liquidity risks while active.
- Always check the chain, token pair, amount, and target price before signing.
