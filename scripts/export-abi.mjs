#!/usr/bin/env node
/**
 * Copies the `abi` field of each compiled contract from out/<Name>.sol/<Name>.json
 * into config/abi/<Name>.json so the frontend ships only the ABIs it needs.
 *
 * Usage: forge build && node scripts/export-abi.mjs
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const CONTRACTS = [
  'TeraPToken',
  'TeraPCore',
  'TeraPSubscription',
  'TeraPGovernance',
  'WellnessGameification',
  'ZKCredentialVerifier',
];

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'out');
const abiDir = path.join(root, 'config', 'abi');

await mkdir(abiDir, { recursive: true });

let failed = false;
for (const name of CONTRACTS) {
  const source = path.join(outDir, `${name}.sol`, `${name}.json`);
  const target = path.join(abiDir, `${name}.json`);
  try {
    const artifact = JSON.parse(await readFile(source, 'utf8'));
    if (!Array.isArray(artifact.abi)) throw new Error('artifact has no abi array');
    await writeFile(target, `${JSON.stringify(artifact.abi, null, 2)}\n`);
    console.log(`${name}: ${artifact.abi.length} entries -> ${path.relative(root, target)}`);
  } catch (err) {
    failed = true;
    console.error(`${name}: failed to export from ${path.relative(root, source)}: ${err.message}`);
  }
}

if (failed) {
  console.error('Some ABIs were not exported. Run `forge build` first.');
  process.exit(1);
}
