---
name: rerange-liquid-orders
version: 1.0.2
description: Enables Base AI agents to read Rerange protocol state and construct unsigned hub or vault transactions through the local Rerange CLI.
author: Rerange Protocol
---

# Rerange Protocol Base Plugin

> [!IMPORTANT]
> ## STOP - COMPLETE ONBOARDING BEFORE USING THIS PLUGIN
>
> Before calling any Rerange command for a user, you MUST complete the Base MCP onboarding flow:
> 1. Call `get_wallets`.
> 2. Present wallet status and the required disclaimer.
>
> The user's wallet address and active network must be confirmed before you prepare any state-changing call.

Rerange is a non-custodial liquidity execution protocol for directional concentrated-liquidity orders. This plugin uses the local Node.js CLI in this folder to read protocol state and prepare unsigned calldata, then executes that calldata through Base MCP's `send_calls` tool.

This plugin is CLI-based. It requires a harness with shell access to run `node index.js ...` commands.

## Supported networks

- Base mainnet: `8453` -> Base MCP chain name `base`
- Ethereum mainnet: `1` -> Base MCP chain name `ethereum`

## Core rules

- Use `node index.js deployments <chainId>` to resolve the canonical hub address and deployment metadata for the target network. Canonical deployment metadata is stored in [deployments](https://github.com/rerange-xyz/info/tree/main/protocol/deployments).
- Use `node index.js read ...` for on-chain reads before preparing a transaction when you need to validate order state, protocol config, or vault parameters.
- Use `node index.js encode ...` to generate unsigned calldata only. The CLI does not sign or broadcast transactions.
- Map encoded calldata into a single `send_calls` request.
- Default `value` to `0x0` unless the specific action requires native ETH.
- Format `<jsonArgs>` as a valid stringified JSON array, for example `'["0x123..."]'` or `'[]'`.

---

## Read commands

### Get deployments

```bash
node index.js deployments <chainId>
```

Example:

```bash
node index.js deployments 8453
```

Returns deployment metadata including:

- `chainId`
- `network`
- `contracts.rerangeHub`
- adapter addresses and protocol config

### Read contract state

```bash
node index.js read <chainId> hub|vault <contractAddress> <functionName> '<jsonArgs>' [rpcUrl]
```

Example:

```bash
node index.js read <chainId> hub <resolvedHubAddress> hubConfig '[]' <rpcUrl>
```

Response shape:

```json
{
  "chainId": 8453,
  "network": "base",
  "kind": "hub",
  "address": "0x...",
  "functionName": "hubConfig",
  "result": {}
}
```

Use reads to confirm:

- the target deployment and chain
- protocol pause state and config
- order, vault, or preview-related preconditions

---

## Prepare commands

### Encode calldata for a hub or vault action

```bash
node index.js encode hub|vault <functionName> '<jsonArgs>'
```

Example:

```bash
JSON_ARGS='[{"vault":"<predictedOrExistingVault>","adapter":"<allowedAdapterAddress>","token0":"<canonicalToken0>","token1":"<canonicalToken1>","capital":"<rawSourceTokenAmount>","isSell":true,"targetTick":80000,"triggerTicks":1200,"adapterConfig":"<encodedAdapterConfig>","referrer":"<referrerOrZeroAddress>","keepBalancesInVault":false,"unwrapOut":false}]'
node index.js encode hub open "$JSON_ARGS"
```

Use real values from discovery and preview before submitting. The example above is only the `open(CreateOrderParams)` argument shape.

Response shape:

```json
{
  "kind": "hub",
  "functionName": "open",
  "data": "0x892734892..."
}
```

This is the prepare step. The returned `data` field is the unsigned calldata that must be sent to the correct hub or vault contract with Base MCP.

If the user asks to open, rerange, close, cancel, or otherwise manage an order, first determine:

- which network the user intends to use
- whether the target contract is the hub or a vault
- the exact contract address from `deployments` or the user-provided vault address
- the exact argument array to encode

---

## `send_calls` mapping

After `encode` succeeds, convert the result into Base MCP `send_calls` input.

### Single-call mapping

```json
{
  "chain": "base",
  "calls": [
    {
      "to": "<resolved hub or vault address>",
      "value": "0x0",
      "data": "<encode.data>"
    }
  ]
}
```

Mapping rules:

1. `chain`: map `8453` to `base` and `1` to `ethereum`.
2. `to`: use the canonical contract address resolved from `deployments` or the specific vault address the user is managing.
3. `data`: use the exact `data` field returned by `node index.js encode ...`.
4. `value`: use `0x0` unless the requested action explicitly requires native ETH.

Do not alter or re-encode the calldata after the CLI returns it.

---

## Orchestration pattern

1. Call `get_wallets` and complete Base MCP onboarding.
2. Determine the target network and map it to a supported chain.
3. Run `node index.js deployments <chainId>` to resolve canonical addresses.
4. If needed, run `node index.js read ...` to validate protocol state or order state.
5. Run `node index.js encode ...` to prepare calldata.
6. Call `send_calls` once with the mapped `chain`, `to`, `value`, and `data`.
7. Confirm the resulting transaction status or receipt with the user.

## Safety notes

- If the protocol deployment is paused, do not prepare or submit a state-changing call.
- If user input does not map cleanly to a JSON argument array, fix the arguments before running `encode`.
- If the request depends on token approvals, balances, or funding outside the hub or vault call itself, surface that requirement to the user before execution.
- Prefer canonical deployment data from this repository over hardcoded addresses.
