import "dotenv/config";

import { resolveResolverConfig } from "./config.js";
import { runResolverOnce } from "./lib/resolver.js";
import { formatError, sleep } from "./lib/utils.js";

async function runForever(intervalMs: number) {
  for (;;) {
    try {
      const config = resolveResolverConfig();
      await runResolverOnce(config);
    } catch (error) {
      console.error(`Resolver loop failed: ${formatError(error)}`);
    }

    await sleep(intervalMs);
  }
}

async function main() {
  const config = resolveResolverConfig();
  if (config.loopIntervalMs > 0) {
    console.log(
      `Starting resolver loop with ${config.loopIntervalMs}ms interval.`,
    );
    await runForever(config.loopIntervalMs);
    return;
  }

  await runResolverOnce(config);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
