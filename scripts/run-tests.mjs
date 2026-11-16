#!/usr/bin/env node
import { createServer } from "vite";
import { readdirSync, statSync } from "node:fs";
import { resolve, join } from "node:path";

// Initialize global window before any imports or module evaluation
globalThis.window = globalThis;
global.window = globalThis;

// Ensure environment is set to test
process.env.NODE_ENV = "test";

// Parse CLI arguments (ignoring "run" subcommand if invoked via vitest alias)
const rawArgs = process.argv.slice(2);
const filteredArgs = rawArgs.filter((arg) => arg !== "run" && !arg.startsWith("-"));
const filter = filteredArgs[0] ? filteredArgs[0].toLowerCase().replace(/\\/g, "/") : "";

// Function to recursively discover test files
function findTestFiles(dir) {
  let results = [];
  try {
    const entries = readdirSync(dir);
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        results = results.concat(findTestFiles(fullPath));
      } else if (/\.(test|spec)\.(ts|tsx|js|mjs)$/.test(entry)) {
        results.push(fullPath);
      }
    }
  } catch (err) {
    console.error(`Error reading directory ${dir}:`, err);
  }
  return results;
}

const testsDir = resolve("tests");
const allTestFiles = findTestFiles(testsDir);

const matchedFiles = allTestFiles.filter((filePath) => {
  if (!filter) return true;
  const normalized = filePath.replace(/\\/g, "/").toLowerCase();
  return normalized.includes(filter);
});

if (matchedFiles.length === 0) {
  if (filter) {
    console.log(`[DAYMARK Test Runner] No test files matched filter: "${filter}"`);
  } else {
    console.log(`[DAYMARK Test Runner] No test files found in ${testsDir}`);
  }
  process.exit(0);
}

console.log(`\n[DAYMARK Test Runner] Discovered ${matchedFiles.length} test suite(s):`);
matchedFiles.forEach((f) => {
  const rel = f.replace(resolve(".") + "\\", "").replace(/\\/g, "/");
  console.log(`  • ${rel}`);
});
console.log("");

// Boot Vite SSR Dev Server with TSX support for all test files
const server = await createServer({
  server: { middlewareMode: true, hmr: false },
  optimizeDeps: { noDiscovery: true },
  appType: "custom",
  logLevel: "error",
  esbuild: {
    loader: "tsx",
    include: /\.[jt]sx?$/,
  },
});

// Initialize global test setup environment
try {
  await server.ssrLoadModule("/tests/setup.ts");
} catch (setupErr) {
  console.error("[DAYMARK Test Runner] Failed to initialize tests/setup.ts:", setupErr);
  await server.close();
  process.exit(1);
}

// Sequentially load each test module into Vite SSR
for (const file of matchedFiles) {
  try {
    const rootDir = resolve(".");
    let relPath = file.startsWith(rootDir) ? file.slice(rootDir.length).replace(/\\/g, "/") : file;
    if (!relPath.startsWith("/")) relPath = "/" + relPath;
    await server.ssrLoadModule(relPath);
  } catch (err) {
    console.error(`[DAYMARK Test Runner] Error loading test module ${file}:`, err);
    await server.close();
    process.exit(1);
  }
}

// Close Vite dev server listeners so node:test can complete and process can exit cleanly
await server.close();
