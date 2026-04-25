import { cp, mkdir, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const sdkRoot = path.resolve(scriptDir, "..");
const sourceRoot = path.join(sdkRoot, "src", "config");
const distRoot = path.join(sdkRoot, "dist", "config");

async function copyJsonTree(fromDir, toDir) {
  await mkdir(toDir, { recursive: true });

  const entries = await readdir(fromDir, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = path.join(fromDir, entry.name);
    const targetPath = path.join(toDir, entry.name);

    if (entry.isDirectory()) {
      await copyJsonTree(sourcePath, targetPath);
      continue;
    }

    if (!entry.isFile() || !entry.name.endsWith(".json")) {
      continue;
    }

    await cp(sourcePath, targetPath);
  }
}

await copyJsonTree(sourceRoot, distRoot);
