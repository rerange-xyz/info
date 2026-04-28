import "dotenv/config";

import { resolveIndexerConfig } from "./config.js";
import { collectChainOrderRows } from "./lib/orders.js";
import { pruneClosedOrders, upsertOrders } from "./lib/supabase.js";
import { isDryRun } from "./lib/utils.js";
import type { ChainSyncSummary } from "./types.js";

async function main() {
  const config = resolveIndexerConfig();
  const summaries: ChainSyncSummary[] = [];

  for (const chain of config.chains) {
    const result = await collectChainOrderRows({
      chain,
      lookbackHours: config.lookbackHours,
    });

    console.log(
      `Fetched ${result.openedEvents.length} opened, ${result.rerangedEvents.length} reranged, and ${result.closedEvents.length} closed order events for ${chain.chainKey} (${chain.chainId}) from block ${result.fromBlock} to ${result.toBlock}.`,
    );

    if (isDryRun()) {
      summaries.push({
        chainId: chain.chainId,
        chainKey: chain.chainKey,
        fromBlock: result.fromBlock,
        toBlock: result.toBlock,
        openedEvents: result.openedEvents.length,
        rerangedEvents: result.rerangedEvents.length,
        closedEvents: result.closedEvents.length,
        openedSync: {
          synced: result.openedRows.length,
          inserted: 0,
          updated: 0,
        },
        rerangedSync: {
          synced: result.rerangedRows.length,
          inserted: 0,
          updated: 0,
        },
        closedSync: {
          synced: result.closedRows.length,
          inserted: 0,
          updated: 0,
        },
        pruned: 0,
      });
      continue;
    }

    const openedSync = await upsertOrders(config.tableName, result.openedRows);
    const rerangedSync = await upsertOrders(
      config.tableName,
      result.rerangedRows,
    );
    const closedSync = await upsertOrders(config.tableName, result.closedRows);

    summaries.push({
      chainId: chain.chainId,
      chainKey: chain.chainKey,
      fromBlock: result.fromBlock,
      toBlock: result.toBlock,
      openedEvents: result.openedEvents.length,
      rerangedEvents: result.rerangedEvents.length,
      closedEvents: result.closedEvents.length,
      openedSync,
      rerangedSync,
      closedSync,
      pruned: 0,
    });
  }

  if (isDryRun()) {
    console.log("Dry run complete.");
    for (const summary of summaries) {
      console.log(
        `${summary.chainKey}: prepared ${summary.openedSync.synced} opened rows, ${summary.rerangedSync.synced} reranged rows, and ${summary.closedSync.synced} closed rows from ${summary.fromBlock} to ${summary.toBlock}.`,
      );
    }
    return;
  }

  const totalPruned = await pruneClosedOrders({
    tableName: config.tableName,
    retentionDays: config.retentionDays,
  });

  for (const summary of summaries) {
    console.log(
      `${summary.chainKey}: opened synced ${summary.openedSync.synced} (${summary.openedSync.inserted} inserted, ${summary.openedSync.updated} updated), reranged synced ${summary.rerangedSync.synced} (${summary.rerangedSync.inserted} inserted, ${summary.rerangedSync.updated} updated), closed synced ${summary.closedSync.synced} (${summary.closedSync.inserted} inserted, ${summary.closedSync.updated} updated).`,
    );
  }

  console.log(
    `Orders sync complete. Pruned ${totalPruned} closed rows older than ${config.retentionDays} days.`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
