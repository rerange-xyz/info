import hubAbi from "./abi/hub.json" with { type: "json" };
import vaultAbi from "./abi/vault.json" with { type: "json" };
import baseDeployment from "./deployments/base.json" with { type: "json" };
import ethereumDeployment from "./deployments/ethereum.json" with { type: "json" };

export const rawAbiConfig = {
  hub: hubAbi,
  vault: vaultAbi,
} as const;

export const rawDeploymentConfig = {
  base: baseDeployment,
  ethereum: ethereumDeployment,
} as const;

export { hubAbi, vaultAbi, baseDeployment, ethereumDeployment };
