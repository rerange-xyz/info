export function requireEnv(name: string): string {
	const value = process.env[name]?.trim()
	if (!value) {
		throw new Error(`Missing required environment variable: ${name}`)
	}

	return value
}

export function isDryRun(): boolean {
	return process.argv.includes("--dry-run") || process.env.DRY_RUN === "true"
}

export function formatError(error: unknown): string {
	return error instanceof Error ? error.message : String(error)
}

export function sleep(ms: number) {
	return new Promise<void>((resolve) => {
		setTimeout(resolve, ms)
	})
}

export function asRecord(value: unknown): Record<string, unknown> | null {
	if (!value || typeof value !== "object" || Array.isArray(value)) {
		return null
	}

	return value as Record<string, unknown>
}

export function asString(value: unknown): string | null {
	return typeof value === "string" && value.length > 0 ? value : null
}

export function asBoolean(value: unknown): boolean | null {
	return typeof value === "boolean" ? value : null
}

export function asNumber(value: unknown): number | null {
	if (typeof value === "number" && Number.isFinite(value)) {
		return value
	}

	if (typeof value === "string" && value.trim().length > 0) {
		const parsed = Number(value)
		return Number.isFinite(parsed) ? parsed : null
	}

	return null
}

export function absInt(value: number) {
	return value < 0 ? -value : value
}

export function parseDecimalToWei(value: string | undefined): bigint {
	if (!value) {
		return 0n
	}

	const trimmed = value.trim()
	if (!trimmed) {
		return 0n
	}

	const negative = trimmed.startsWith("-")
	const normalized = negative ? trimmed.slice(1) : trimmed
	const [wholePart, fractionPart = ""] = normalized.split(".")
	if (!/^\d+$/.test(wholePart || "0") || !/^\d*$/.test(fractionPart)) {
		return 0n
	}

	const paddedFraction = `${fractionPart}000000000000000000`.slice(0, 18)
	const wei = BigInt(wholePart || "0") * 10n ** 18n + BigInt(paddedFraction || "0")
	return negative ? -wei : wei
}

export function formatEtherAmount(value: bigint) {
	const negative = value < 0n
	const absolute = negative ? -value : value
	const whole = absolute / 10n ** 18n
	const fraction = (absolute % 10n ** 18n)
		.toString()
		.padStart(18, "0")
		.slice(0, 6)
		.replace(/0+$/, "")
	const formatted = fraction ? `${whole.toString()}.${fraction}` : whole.toString()
	return `${negative ? "-" : ""}${formatted} ETH`
}