#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.resolve(root, 'recheck-60-20260616');
const manifestPath = path.join(outDir, 'manifest.json');

const models = [
  ['deepseek-v4-pro', 'DeepSeek V4 Pro'],
  ['kimi-k2.7-code', 'Kimi K2.7-code'],
  ['qwen3.7-max', 'Qwen 3.7 Max'],
  ['glm-x-preview', 'GLM 5.2'],
  ['minimax-m3', 'MiniMax M3'],
  ['claude-opus-4-8', 'Claude Opus 4.8'],
];

const entries = [];
let port = 8500;

function countArticlePages(dir) {
  const articlesDir = path.join(dir, 'articles');
  if (!fs.existsSync(articlesDir)) return 0;
  return fs.readdirSync(articlesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .filter((entry) => fs.existsSync(path.join(articlesDir, entry.name, 'index.html')))
    .length;
}

for (let round = 1; round <= 10; round += 1) {
  for (const [modelSlug, modelName] of models) {
    const sourceDir = path.join(root, `r${round}`, modelSlug);
    const rootIndex = path.join(sourceDir, 'index.html');
    const siteIndex = path.join(sourceDir, 'site', 'index.html');
    let serveDir = sourceDir;
    let entryRule = 'root-index';

    if (!fs.existsSync(rootIndex) && fs.existsSync(siteIndex)) {
      serveDir = path.join(sourceDir, 'site');
      entryRule = 'site-index';
    } else if (!fs.existsSync(rootIndex)) {
      entryRule = 'root-missing-index';
    }

    const siteId = `r${round}-${modelSlug}`;
    entries.push({
      site_id: siteId,
      round: `r${round}`,
      round_number: round,
      model_slug: modelSlug,
      model_name: modelName,
      source_dir: sourceDir,
      serve_dir: serveDir,
      entry_rule: entryRule,
      base_url: `http://127.0.0.1:${port}`,
      port,
      article_page_count: countArticlePages(serveDir),
    });
    port += 1;
  }
}

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(manifestPath, `${JSON.stringify(entries, null, 2)}\n`);

const counts = entries.reduce((acc, entry) => {
  acc[entry.model_slug] = (acc[entry.model_slug] || 0) + 1;
  return acc;
}, {});

console.log(`Wrote ${manifestPath}`);
console.log(`entries=${entries.length}`);
console.log(JSON.stringify(counts, null, 2));
