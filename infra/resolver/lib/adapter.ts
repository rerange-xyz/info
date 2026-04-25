import type { Address } from "viem";
import { decodeAbiParameters } from "viem";

import type { ProtocolDeployment } from "../types.js";

export type AdapterKind = "uniswap-v3" | "uniswap-v4" | "unknown";

export function resolveAdapterKind(
  adapterAddress: Address,
  deployment: ProtocolDeployment,
): AdapterKind {
  const normalized = adapterAddress.toLowerCase();
  if (normalized === deployment.v3AdapterAddress.toLowerCase()) {
    return "uniswap-v3";
  }
  if (
    deployment.v4AdapterAddress &&
    normalized === deployment.v4AdapterAddress.toLowerCase()
  ) {
    return "uniswap-v4";
  }
  return "unknown";
}

export function decodePoolAddressFromAdapterData(
  adapter: AdapterKind,
  adapterData: `0x${string}`,
): Address | null {
  if (adapter !== "uniswap-v3") {
    return null;
  }

  try {
    const [decoded] = decodeAbiParameters(
      [
        {
          type: "tuple",
          components: [
            {
              name: "config",
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
            { name: "positionId", type: "uint256" },
          ],
        },
      ],
      adapterData,
    ) as readonly [
      {
        config: {
          pool: Address;
        };
      },
    ];

    return decoded.config.pool;
  } catch {
    return null;
  }
}
