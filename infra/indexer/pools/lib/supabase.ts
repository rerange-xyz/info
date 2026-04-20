import { createClient } from "@supabase/supabase-js"

import type { PoolRow, SyncResult } from "../types.js"

function requireEnv(name: string): string {
	const value = process.env[name]?.trim()
	if (!value) {
		throw new Error(`Missing required environment variable: ${name}`)
	}

	return value
}

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

export async function upsertPools(rows: PoolRow[]): Promise<SyncResult> {
	if (rows.length === 0) {
		return { synced: 0, inserted: 0, updated: 0 }
	}

	const supabase = createSupabaseAdmin()
	const upsertAttempt = await supabase
		.from("pools")
		.upsert(rows, { onConflict: "network,pool" })
		.select("pool, xmax")

	if (!upsertAttempt.error && upsertAttempt.data) {
		const inserted = upsertAttempt.data.filter((row) => row.xmax === "0").length
		const updated = upsertAttempt.data.length - inserted

		return {
			synced: rows.length,
			inserted,
			updated,
		}
	}

	const existingByKey = new Set<string>()

	for (const network of [...new Set(rows.map((row) => row.network))]) {
		const networkRows = rows.filter((row) => row.network === network)
		const pools = networkRows.map((row) => row.pool)

		const { data, error } = await supabase
			.from("pools")
			.select("pool, network")
			.eq("network", network)
			.in("pool", pools)

		if (error) {
			throw new Error(
				`Supabase lookup failed for network ${network}: ${error.message}`,
			)
		}

		for (const row of data ?? []) {
			existingByKey.add(`${row.network}:${String(row.pool).toLowerCase()}`)
		}
	}

	const toInsert: PoolRow[] = []
	const toUpdate: PoolRow[] = []

	for (const row of rows) {
		const key = `${row.network}:${row.pool.toLowerCase()}`
		if (existingByKey.has(key)) {
			toUpdate.push(row)
			continue
		}

		toInsert.push(row)
	}

	if (toInsert.length > 0) {
		const { error } = await supabase.from("pools").insert(toInsert)
		if (error) {
			throw new Error(`Supabase insert failed: ${error.message}`)
		}
	}

	for (const row of toUpdate) {
		const { error } = await supabase
			.from("pools")
			.update({
				timestamp: row.timestamp,
				data: row.data,
			})
			.eq("network", row.network)
			.eq("pool", row.pool)

		if (error) {
			throw new Error(
				`Supabase update failed for network ${row.network} pool ${row.pool}: ${error.message}`,
			)
		}
	}

	return {
		synced: rows.length,
		inserted: toInsert.length,
		updated: toUpdate.length,
	}
}