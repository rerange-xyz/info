import type { SubgraphConfig } from "./types.js";

export const DEFAULT_TOP_POOLS_LIMIT = 100;
export const POOL_RETENTION_DAYS = 7;
export const DEFAULT_SUBGRAPHS: SubgraphConfig[] = [
  {
    network: 1,
    id: "5zvR82QoaXYFyDEKLZ9t6v9adgnptxYpKpSbxtgVENFV",
    tokens: [
      "0xc02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", // WETH
      "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", // USDC
      "0xdAC17F958D2ee523a2206206994597C13D831ec7", // USDT
      "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599", // WBTC
      "0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf", // CBBTC
    ].map((address) => address.toLowerCase()),
  },
  {
    network: 8453,
    id: "43Hwfi3dJSoGpyas9VwNoDAv55yjgGrPpNSmbQZArzMG",
    tokens: [
      "0x4200000000000000000000000000000000000006", // WETH
      "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // USDC
      "0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf", // CBBTC
    ].map((address) => address.toLowerCase()),
  },
];
