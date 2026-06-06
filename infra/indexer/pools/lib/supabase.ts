import { createClient } from "@supabase/supabase-js";

import { POOL_RETENTION_DAYS } from "../config.js";
import type { PoolRow, SyncResult } from "../types.js";

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function resolveSupabaseUrl(): string {
  return process.env.SUPABASE_URL?.trim() || requireEnv("SUPABASE_URL");
}

function resolveSupabaseKey(): string {
  return (
    process.env.SUPABASE_SECRET_KEY?.trim() || requireEnv("SUPABASE_SECRET_KEY")
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

async function pruneStalePools(): Promise<number> {
  const cutoff = new Date(
    Date.now() - POOL_RETENTION_DAYS * 24 * 60 * 60 * 1000,
  );
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("pools")
    .delete()
    .lt("timestamp", cutoff.toISOString())
    .select("id");

  if (error) {
    throw new Error(`Supabase prune failed: ${error.message}`);
  }

  return data?.length ?? 0;
}

export async function upsertPools(rows: PoolRow[]): Promise<SyncResult> {
  if (rows.length === 0) {
    return { synced: 0, inserted: 0, updated: 0, pruned: 0 };
  }

  const supabase = createSupabaseAdmin();
  const upsertAttempt = await supabase
    .from("pools")
    .upsert(rows, { onConflict: "id" })
    .select("id, xmax");

  if (!upsertAttempt.error && upsertAttempt.data) {
    const inserted = upsertAttempt.data.filter(
      (row) => row.xmax === "0",
    ).length;
    const updated = upsertAttempt.data.length - inserted;
    const pruned = await pruneStalePools();

    return {
      synced: rows.length,
      inserted,
      updated,
      pruned,
    };
  }

  const rowIds = rows.map((row) => row.id);
  const { data: existingRows, error: lookupError } = await supabase
    .from("pools")
    .select("id")
    .in("id", rowIds);

  if (lookupError) {
    throw new Error(`Supabase lookup failed: ${lookupError.message}`);
  }

  const existingById = new Set(
    (existingRows ?? []).map((row) => String(row.id)),
  );

  const toInsert: PoolRow[] = [];
  const toUpdate: PoolRow[] = [];

  for (const row of rows) {
    if (existingById.has(row.id)) {
      toUpdate.push(row);
      continue;
    }

    toInsert.push(row);
  }

  if (toInsert.length > 0) {
    const { error } = await supabase.from("pools").insert(toInsert);
    if (error) {
      throw new Error(`Supabase insert failed: ${error.message}`);
    }
  }

  for (const row of toUpdate) {
    const { error } = await supabase
      .from("pools")
      .update({
        timestamp: row.timestamp,
        network: row.network,
        pool: row.pool,
        data: row.data,
      })
      .eq("id", row.id);

    if (error) {
      throw new Error(`Supabase update failed for ${row.id}: ${error.message}`);
    }
  }

  const pruned = await pruneStalePools();

  return {
    synced: rows.length,
    inserted: toInsert.length,
    updated: toUpdate.length,
    pruned,
  };
}
