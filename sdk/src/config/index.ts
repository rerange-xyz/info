import hubAbi from "./abi/hub.json" with { type: "json" }
import vaultAbi from "./abi/vault.json" with { type: "json" }
import baseDeployment from "./deployments/base.json" with { type: "json" }
import ethereumDeployment from "./deployments/ethereum.json" with { type: "json" }
import hardhatDeployment from "./deployments/hardhat.json" with { type: "json" }
import virtualDeployment from "./deployments/virtual.json" with { type: "json" }

export const rawAbiConfig = {
  hub: hubAbi,
  vault: vaultAbi,
} as const

export const rawDeploymentConfig = {
  base: baseDeployment,
  ethereum: ethereumDeployment,
  hardhat: hardhatDeployment,
  virtual: virtualDeployment,
} as const

export { hubAbi, vaultAbi, baseDeployment, ethereumDeployment, hardhatDeployment, virtualDeployment }
