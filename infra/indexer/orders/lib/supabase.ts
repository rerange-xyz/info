import { createClient } from "@supabase/supabase-js"

import type { OrderRow, SyncResult } from "../types.js"
import { requireEnv } from "./utils.js"

function resolveSupabaseUrl(): string {
	return (
		process.env.SUPABASE_URL?.trim() ||
		process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
		requireEnv("SUPABASE_URL")
	)
	}

function resolveSupabaseKey(): string {
	return (
		process.env.SUPABASE_SECRET_KEY?.trim() ||
		process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
		requireEnv("SUPABASE_SECRET_KEY")
	)
	}

function createSupabaseAdmin() {
	return createClient(resolveSupabaseUrl(), resolveSupabaseKey(), {
		auth: {
			autoRefreshToken: false,
			persistSession: false,
		},
	})
	}

export async function upsertOrders(
	tableName: string,
	rows: OrderRow[],
): Promise<SyncResult> {
	if (rows.length === 0) {
		return { synced: 0, inserted: 0, updated: 0 }
	}

	const supabase = createSupabaseAdmin()
	const upsertAttempt = await supabase
		.from(tableName)
		.upsert(rows, { onConflict: "id" })
		.select("id, xmax")

	if (!upsertAttempt.error && upsertAttempt.data) {
		const inserted = upsertAttempt.data.filter((row) => row.xmax === "0").length
		const updated = upsertAttempt.data.length - inserted

		return {
			synced: rows.length,
			inserted,
			updated,
		}
	}

	const ids = rows.map((row) => row.id)
	const existingById = new Set<string>()
	const { data, error } = await supabase.from(tableName).select("id").in("id", ids)
	if (error) {
		throw new Error(`Supabase lookup failed: ${error.message}`)
	}

	for (const row of data ?? []) {
		existingById.add(String(row.id))
	}

	const toInsert = rows.filter((row) => !existingById.has(row.id))
	const toUpdate = rows.filter((row) => existingById.has(row.id))

	if (toInsert.length > 0) {
		const { error: insertError } = await supabase.from(tableName).insert(toInsert)
		if (insertError) {
			throw new Error(`Supabase insert failed: ${insertError.message}`)
		}
	}

	for (const row of toUpdate) {
		const { error: updateError } = await supabase
			.from(tableName)
			.update({
				timestamp: row.timestamp,
				network: row.network,
				status: row.status,
				vault: row.vault,
				key: row.key,
				data: row.data,
			})
			.eq("id", row.id)

		if (updateError) {
			throw new Error(
				`Supabase update failed for order ${row.id}: ${updateError.message}`,
			)
		}
	}

	return {
		synced: rows.length,
		inserted: toInsert.length,
		updated: toUpdate.length,
	}
	}

export async function pruneClosedOrders(params: {
	tableName: string
	retentionDays: number
}): Promise<number> {
	const supabase = createSupabaseAdmin()
	const cutoff = new Date(Date.now() - params.retentionDays * 24 * 60 * 60 * 1_000)
		.toISOString()

	const { data, error } = await supabase
		.from(params.tableName)
		.delete()
		.eq("status", "closed")
		.lt("timestamp", cutoff)
		.select("id")

	if (error) {
		throw new Error(`Supabase prune failed: ${error.message}`)
	}

	return data?.length ?? 0
	}