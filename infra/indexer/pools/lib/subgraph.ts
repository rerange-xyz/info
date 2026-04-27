import type { Pool, PoolsResponse, SubgraphConfig } from "../types.js";
import { DEFAULT_TOP_POOLS_LIMIT, DEFAULT_SUBGRAPHS } from "../config.js";

const TOP_POOLS_QUERY = `
  query TopPools($first: Int!, $tokens: [String!]!) {
		pools(
			first: $first
			orderBy: totalValueLockedUSD
			orderDirection: desc
      where: {
        liquidity_gt: "0"
        totalValueLockedUSD_gt: "1000000"
        feeTier_in: ["100", "500", "3000"]
        token0_in: $tokens
        token1_in: $tokens
      }
		) {
			id
			createdAtTimestamp
			feeTier
			liquidity
			sqrtPrice
			tick
			token0Price
			token1Price
			totalValueLockedUSD
			totalValueLockedToken0
			totalValueLockedToken1
			volumeUSD
			feesUSD
			txCount
			token0 {
				id
				symbol
				name
				decimals
				derivedETH
			}
			token1 {
				id
				symbol
				name
				decimals
				derivedETH
			}
		}
	}
`;

export function resolveSubgraphs(): SubgraphConfig[] {
  const raw = process.env.UNISWAP_V3_SUBGRAPHS?.trim();
  const fallbackTopPools = Number(
    process.env.UNISWAP_TOP_POOLS_LIMIT || DEFAULT_TOP_POOLS_LIMIT,
  );

  if (!raw) {
    return DEFAULT_SUBGRAPHS.map((config) => ({
      ...config,
      topPools: config.topPools ?? fallbackTopPools,
    }));
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new Error(
      `UNISWAP_V3_SUBGRAPHS must be valid JSON: ${String(error)}`,
    );
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error("UNISWAP_V3_SUBGRAPHS must be a non-empty JSON array");
  }

  return parsed.map((entry, index) => {
    if (!entry || typeof entry !== "object") {
      throw new Error(`UNISWAP_V3_SUBGRAPHS[${index}] must be an object`);
    }

    const candidate = entry as Partial<SubgraphConfig>;
    if (
      typeof candidate.network !== "number" ||
      !Number.isInteger(candidate.network)
    ) {
      throw new Error(
        `UNISWAP_V3_SUBGRAPHS[${index}].network must be an integer chain id`,
      );
    }

    if (typeof candidate.id !== "string" || candidate.id.trim().length === 0) {
      throw new Error(
        `UNISWAP_V3_SUBGRAPHS[${index}].id must be a subgraph id`,
      );
    }

    if (!candidate.tokens?.length) {
      throw new Error(
        `UNISWAP_V3_SUBGRAPHS[${index}].tokens must be a non-empty array of token addresses`,
      );
    }

    return {
      network: candidate.network,
      id: candidate.id.trim(),
      topPools: candidate.topPools ?? fallbackTopPools,
      tokens: candidate.tokens ?? [],
    };
  });
}

export async function fetchTopPools(
  config: SubgraphConfig,
  apiKey: string,
): Promise<Pool[]> {
  const response = await fetch(
    `https://gateway.thegraph.com/api/${apiKey}/subgraphs/id/${config.id}`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        query: TOP_POOLS_QUERY,
        variables: {
          first: config.topPools ?? DEFAULT_TOP_POOLS_LIMIT,
          tokens: config.tokens ?? [],
        },
      }),
    },
  );

  if (!response.ok) {
    throw new Error(
      `Subgraph request failed for network ${config.network}: ${response.status} ${response.statusText}`,
    );
  }

  const payload = (await response.json()) as PoolsResponse;
  if (payload.errors?.length) {
    const messages = payload.errors.map(
      (error) => error.message ?? "unknown error",
    );
    throw new Error(
      `Subgraph returned errors for network ${config.network}: ${messages.join("; ")}`,
    );
  }

  return payload.data?.pools ?? [];
}
