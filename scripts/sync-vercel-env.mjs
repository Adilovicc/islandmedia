#!/usr/bin/env node
/**
 * Push the environment this app needs from .env.local into Vercel.
 *
 * WHY THIS EXISTS
 * Four of these values are long opaque credentials, and two of them have to be
 * renamed on the way in — Neon publishes its S3 credentials under the standard
 * AWS_* names, and Vercel presets AWS_REGION to its own Lambda region, so the
 * app reads NEON_S3_* instead. Copying six values by hand into a dashboard,
 * two of them under different names, is a step that goes wrong quietly: a
 * selection one line too long puts a newline in the middle of a credential,
 * and the resulting failure names an HTTP header rather than the variable.
 *
 * Reading the values programmatically removes the hand entirely.
 *
 * PREREQUISITES
 *   npx vercel login
 *   npx vercel link          # pick the islandmedia project
 *
 * USAGE
 *   node scripts/sync-vercel-env.mjs             # dry run, prints shapes only
 *   node scripts/sync-vercel-env.mjs --apply     # writes to Vercel
 *
 * Values are never printed. The dry run reports length and validity only, so
 * you can confirm the mapping before anything is written.
 */

import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

const APPLY = process.argv.includes("--apply");
const TARGET = "production";

/** Vercel variable name -> the .env.local key it takes its value from. */
const MAPPING = [
  ["DATABASE_URL", "DATABASE_URL"],
  ["DATABASE_URL_UNPOOLED", "DATABASE_URL_UNPOOLED"],
  ["SESSION_SECRET", "SESSION_SECRET"],
  ["NEON_S3_REGION", "AWS_REGION"],
  ["NEON_S3_ENDPOINT", "AWS_ENDPOINT_URL_S3"],
  ["NEON_S3_ACCESS_KEY_ID", "AWS_ACCESS_KEY_ID"],
  ["NEON_S3_SECRET_ACCESS_KEY", "AWS_SECRET_ACCESS_KEY"],
];

function readEnvFile(path) {
  const entries = new Map();
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    // Strip one layer of surrounding quotes, as dotenv does.
    const value = trimmed
      .slice(eq + 1)
      .trim()
      .replace(/^(['"])(.*)\1$/s, "$2");
    entries.set(key, value);
  }
  return entries;
}

const env = readEnvFile(".env.local");

let failed = false;
const plan = [];

for (const [vercelName, localName] of MAPPING) {
  const value = env.get(localName);

  if (value === undefined) {
    console.error(`MISSING  ${vercelName}  <- ${localName} is not in .env.local`);
    failed = true;
    continue;
  }

  // The exact check the app applies at runtime, so a bad value is caught here
  // rather than in a deployed function.
  const illegal = /[^\x20-\x7e]/.exec(value);
  if (illegal) {
    console.error(
      `INVALID  ${vercelName}  <- ${localName} contains code point ` +
        `${illegal[0].codePointAt(0)} at index ${illegal.index}`,
    );
    failed = true;
    continue;
  }

  plan.push({ vercelName, localName, value });
  const renamed = vercelName === localName ? "" : `  (renamed from ${localName})`;
  console.log(`ok       ${vercelName}  ${value.length} chars${renamed}`);
}

if (failed) {
  console.error("\nFix .env.local first. Nothing was written.");
  process.exit(1);
}

if (!APPLY) {
  console.log(
    `\nDry run. ${plan.length} variables ready for ${TARGET}.` +
      `\nRe-run with --apply to write them to Vercel.`,
  );
  process.exit(0);
}

function vercel(args, input) {
  return spawnSync("npx", ["vercel", ...args], {
    input,
    encoding: "utf8",
    shell: process.platform === "win32",
  });
}

console.log(`\nWriting to Vercel (${TARGET})...`);

for (const { vercelName, value } of plan) {
  // Remove first: `env add` on an existing name errors rather than replacing.
  // A missing variable makes this fail harmlessly, so the result is ignored.
  vercel(["env", "rm", vercelName, TARGET, "--yes"]);

  const added = vercel(["env", "add", vercelName, TARGET], value);
  if (added.status === 0) {
    console.log(`  set  ${vercelName}`);
  } else {
    console.error(`  FAILED  ${vercelName}`);
    console.error((added.stderr || added.stdout || "").trim());
    failed = true;
  }
}

console.log(
  failed
    ? "\nSome variables failed. Check you have run `npx vercel link`."
    : "\nDone. Redeploy for the new values to take effect: npx vercel --prod",
);
process.exit(failed ? 1 : 0);
