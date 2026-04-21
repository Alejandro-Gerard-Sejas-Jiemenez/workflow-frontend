import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import dotenv from 'dotenv';

const root = process.cwd();
const envPath = resolve(root, '.env');
const outputDir = resolve(root, 'public');
const outputPath = resolve(outputDir, 'env.js');

const parsed = dotenv.parse(readFileSync(envPath, 'utf8'));

mkdirSync(outputDir, { recursive: true });
writeFileSync(
  outputPath,
  `window.__env = ${JSON.stringify(parsed, null, 2)};\n`,
  'utf8'
);
