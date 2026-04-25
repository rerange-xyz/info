import { defineConfig } from "@wagmi/cli";
import { actions } from "@wagmi/cli/plugins";
import type { Abi, Address } from "viem";

import hubAbi from "./src/config/abi/hub.json" with { type: "json" };
import vaultAbi from "./src/config/abi/vault.json" with { type: "json" };
import baseDeployment from "./src/config/deployments/base.json" with { type: "json" };
import ethereumDeployment from "./src/config/deployments/ethereum.json" with { type: "json" };

function getShortName(contractName: string, itemName?: string) {
  if (!itemName) return "";

  const suffixMatch = contractName.match(/([A-Z][a-z0-9]*)$/);
  const contractSuffix = suffixMatch?.[1];
  if (!contractSuffix) return itemName;

  const shortName = itemName.replace(
    new RegExp(`^${contractSuffix}(?=[A-Z]|$)`),
    "",
  );

  return shortName || itemName;
}

export default defineConfig({
  out: "src/generated.ts",
  contracts: [
    {
      name: "RerangeHub",
      abi: hubAbi as Abi,
      address: {
        [ethereumDeployment.chainId]: ethereumDeployment.contracts
          .rerangeHub as Address,
        [baseDeployment.chainId]: baseDeployment.contracts
          .rerangeHub as Address,
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
      getActionName({ contractName, itemName, type }) {
        const actionName = `${type}${contractName}${getShortName(contractName, itemName)}`;
        return type === "watch" ? `${actionName}Event` : actionName;
      },
    }),
  ],
});
