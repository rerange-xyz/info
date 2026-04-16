import { defineConfig } from "@wagmi/cli"
import { actions } from "@wagmi/cli/plugins"
import type { Abi, Address } from "viem"

import hubAbi from "./src/config/abi/hub.json" with { type: "json" }
import vaultAbi from "./src/config/abi/vault.json" with { type: "json" }
import baseDeployment from "./src/config/deployments/base.json" with { type: "json" }
import ethereumDeployment from "./src/config/deployments/ethereum.json" with { type: "json" }

export default defineConfig({
  out: "src/generated.ts",
  contracts: [
    {
      name: "RerangeHub",
      abi: hubAbi as Abi,
      address: {
        [ethereumDeployment.chainId]: ethereumDeployment.contracts
          .rerangeHub as Address,
        [baseDeployment.chainId]: baseDeployment.contracts.rerangeHub as Address,
      },
    },
    {
      name: "RerangeVault",
      abi: vaultAbi as Abi,
    },
  ],
  plugins: [
    actions({
      overridePackageName: "@wagmi/core",
    }),
  ],
})