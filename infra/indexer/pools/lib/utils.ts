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