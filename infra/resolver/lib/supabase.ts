import { createClient } from "@supabase/supabase-js";

import type { OrdersTableRow, PoolsTableRow } from "../types.js";
import { requireEnv } from "./utils.js";

function resolveSupabaseUrl(): string {
  return (
    process.env.SUPABASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    requireEnv("SUPABASE_URL")
  );
}

function resolveSupabaseKey(): string {
  return (
    process.env.SUPABASE_SECRET_KEY?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    requireEnv("SUPABASE_SECRET_KEY")
  );
}

function createSupabaseAdmin() {
  return createClient(resolveSupabaseUrl(), resolveSupabaseKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function fetchChainOrderRows(params: {
  tableName: string;
  chainId: number;
  limit: number;
}): Promise<OrdersTableRow[]> {
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from(params.tableName)
    .select("id, timestamp, network, status, vault, key, data")
    .eq("network", params.chainId)
    .neq("status", "closed")
    .order("timestamp", { ascending: false })
    .limit(params.limit);

  if (error) {
    throw new Error(`Supabase orders query failed: ${error.message}`);
  }

  return (data ?? []) as OrdersTableRow[];
}

export async function fetchPoolRowsByAddress(params: {
  tableName: string;
  chainId: number;
  poolAddresses: string[];
}): Promise<PoolsTableRow[]> {
  if (params.poolAddresses.length === 0) {
    return [];
  }

  const ids = params.poolAddresses.map(
    (poolAddress) => `${params.chainId}:${poolAddress.toLowerCase()}`,
  );
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from(params.tableName)
    .select("id, timestamp, network, pool, data")
    .in("id", ids);

  if (error) {
    throw new Error(`Supabase pools query failed: ${error.message}`);
  }

  return (data ?? []) as PoolsTableRow[];
}
