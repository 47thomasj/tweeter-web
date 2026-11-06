// Partially written by AI.

const { readdirSync } = require("node:fs");
const path = require("node:path");
const { buildSync } = require("esbuild");

const lambdaRoot = path.resolve(__dirname, "../src/lambda");

function findLambdaHandlers(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      return findLambdaHandlers(entryPath);
    }

    return entry.isFile() && entry.name.endsWith("Lambda.ts")
      ? [entryPath]
      : [];
  });
}

const entryPoints = readdirSync(lambdaRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .flatMap((entry) => findLambdaHandlers(path.join(lambdaRoot, entry.name)))
  .sort();

if (entryPoints.length === 0) {
  throw new Error(`No Lambda handlers found under ${lambdaRoot}`);
}

buildSync({
  entryPoints,
  bundle: true,
  platform: "node",
  target: "node22",
  outdir: path.resolve(__dirname, "../dist/lambda"),
  outbase: lambdaRoot,
  logLevel: "info",
});
