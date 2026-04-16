import type { Address } from "viem"

import { baseDeployment, ethereumDeployment } from "./config/index.js"

type DeploymentConfig = {
  chainId: number
  chainKey: string
  network: string
  owner: string
  permit2: string
  treasury: string
  weth: string
  contracts: {
    uniswapV3Adapter: string
    uniswapV4Adapter?: string
    rerangeHubViews?: string
    rerangeHub: string
  }
}

export const protocolDeployments = {
  [ethereumDeployment.chainId]: ethereumDeployment,
  [baseDeployment.chainId]: baseDeployment,
} as const satisfies Record<number, DeploymentConfig>

export const hubAddressByChainId = Object.fromEntries(
  Object.values(protocolDeployments).map((deployment) => [
    deployment.chainId,
    deployment.contracts.rerangeHub as Address,
  ])
) as Record<number, Address>

export const v3AdapterAddressByChainId = Object.fromEntries(
  Object.values(protocolDeployments).map((deployment) => [
    deployment.chainId,
    deployment.contracts.uniswapV3Adapter as Address,
  ])
) as Record<number, Address>

export const v4AdapterAddressByChainId = Object.fromEntries(
  Object.values(protocolDeployments)
    .filter((deployment) => deployment.contracts.uniswapV4Adapter)
    .map((deployment) => [
      deployment.chainId,
      deployment.contracts.uniswapV4Adapter as Address,
    ])
) as Record<number, Address>