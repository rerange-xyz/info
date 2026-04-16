import { cp, mkdir, readdir, rm, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const sdkRoot = path.resolve(scriptDir, "..")
const protocolRoot = path.resolve(sdkRoot, "../../protocol")

const configRoot = path.join(sdkRoot, "src", "config")

function toIdentifier(fileName, suffix) {
  const baseName = path.basename(fileName, ".json")
  const camelBase = baseName.replace(/[-_]+([a-zA-Z0-9])/g, (_, char) =>
    String(char).toUpperCase()
  )

  return `${camelBase}${suffix}`
}

async function copyJsonDirectory(directory) {
  const sourceDir = path.join(protocolRoot, directory)
  const targetDir = path.join(configRoot, directory)

  await rm(targetDir, { recursive: true, force: true })
  await mkdir(targetDir, { recursive: true })

  const entries = await readdir(sourceDir, { withFileTypes: true })
  const copiedFiles = []

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".json")) {
      continue
    }

    const from = path.join(sourceDir, entry.name)
    const to = path.join(targetDir, entry.name)
    await cp(from, to)
    copiedFiles.push(entry.name)
  }

  return copiedFiles.sort()
}

function buildConfigIndex(params) {
  const abiImports = params.abiFiles.map((fileName) => {
    const identifier = toIdentifier(fileName, "Abi")
    return `import ${identifier} from "./abi/${fileName}" with { type: "json" }`
  })

  const deploymentImports = params.deploymentFiles.map((fileName) => {
    const identifier = toIdentifier(fileName, "Deployment")
    return `import ${identifier} from "./deployments/${fileName}" with { type: "json" }`
  })

  const abiEntries = params.abiFiles.map((fileName) => {
    const key = path.basename(fileName, ".json")
    const identifier = toIdentifier(fileName, "Abi")
    return `  ${key}: ${identifier},`
  })

  const deploymentEntries = params.deploymentFiles.map((fileName) => {
    const key = path.basename(fileName, ".json")
    const identifier = toIdentifier(fileName, "Deployment")
    return `  ${key}: ${identifier},`
  })

  const namedExports = [
    ...params.abiFiles.map((fileName) => toIdentifier(fileName, "Abi")),
    ...params.deploymentFiles.map((fileName) =>
      toIdentifier(fileName, "Deployment")
    ),
  ]

  return `${[...abiImports, ...deploymentImports].join("\n")}

export const rawAbiConfig = {
${abiEntries.join("\n")}
} as const

export const rawDeploymentConfig = {
${deploymentEntries.join("\n")}
} as const

export { ${namedExports.join(", ")} }
`
}

const abiFiles = await copyJsonDirectory("abi")
const deploymentFiles = await copyJsonDirectory("deployments")

await writeFile(
  path.join(configRoot, "index.ts"),
  buildConfigIndex({ abiFiles, deploymentFiles })
)