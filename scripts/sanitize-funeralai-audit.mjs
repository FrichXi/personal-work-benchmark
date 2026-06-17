#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const expectedPromptSha = 'db10431344850b44bb044ecfdf749716fb62c097b389c2d0406f5cb32dbb7ea7';
const modelOrder = [
  ['deepseek-v4-pro', 'DeepSeek V4 Pro', 'deepseek.log'],
  ['kimi-k2.7-code', 'Kimi K2.7-code', 'kimi.log'],
  ['qwen3.7-max', 'Qwen 3.7 Max', 'qwen.log'],
  ['glm-x-preview', 'GLM 5.2', 'glm.log'],
  ['minimax-m3', 'MiniMax M3', 'minimax.log'],
  ['claude-opus-4-8', 'Claude Opus 4.8', 'opus-4-8.log'],
];

const args = parseArgs(process.argv.slice(2));
const defaultSource = path.resolve(repoRoot, '../qwen/recheck-60-20260616');
const sourceDir = path.resolve(args.source || process.env.FUNERALAI_AUDIT_SOURCE || defaultSource);
const sourceWorkspace = path.resolve(args.benchmarkWorkdir || process.env.FUNERALAI_BENCHMARK_WORKDIR || path.dirname(sourceDir));
const privateSourceWorkspace = path.resolve(args.sourceWorkdir || process.env.FUNERALAI_SOURCE_WORKDIR || path.resolve(repoRoot, '../../葬AI Web4'));
const defaultOut = path.join(repoRoot, 'examples/funeralai-web4/audit/2026-06-16-webbridge');
const outDir = path.resolve(args.out || defaultOut);
const promptSource = path.resolve(args.prompt || process.env.FUNERALAI_PROMPT_SOURCE || path.join(sourceWorkspace, 'refactor-prompt.txt'));
const promptOut = path.join(repoRoot, 'examples/funeralai-web4/prompts/refactor-prompt.redacted.md');
const metadataOutCsv = path.join(repoRoot, 'examples/funeralai-web4/run-metadata.csv');
const metadataOutJson = path.join(repoRoot, 'examples/funeralai-web4/run-metadata.json');

function parseArgs(argv) {
  const parsed = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--source') parsed.source = argv[++index];
    else if (arg.startsWith('--source=')) parsed.source = arg.slice('--source='.length);
    else if (arg === '--benchmark-workdir') parsed.benchmarkWorkdir = argv[++index];
    else if (arg.startsWith('--benchmark-workdir=')) parsed.benchmarkWorkdir = arg.slice('--benchmark-workdir='.length);
    else if (arg === '--source-workdir') parsed.sourceWorkdir = argv[++index];
    else if (arg.startsWith('--source-workdir=')) parsed.sourceWorkdir = arg.slice('--source-workdir='.length);
    else if (arg === '--prompt') parsed.prompt = argv[++index];
    else if (arg.startsWith('--prompt=')) parsed.prompt = arg.slice('--prompt='.length);
    else if (arg === '--out') parsed.out = argv[++index];
    else if (arg.startsWith('--out=')) parsed.out = arg.slice('--out='.length);
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return parsed;
}

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function ensureCleanDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
}

function sanitizeText(text) {
  return text
    .replaceAll(sourceDir, '<AUDIT_DIR>')
    .replaceAll(sourceWorkspace, '<BENCHMARK_WORKDIR>')
    .replaceAll(privateSourceWorkspace, '<SOURCE_WORKDIR>')
    .replace(/\/Users\/[^/\s"'`]+/g, '<USER_HOME>');
}

function copyTextFile(relativePath) {
  const sourceFile = path.join(sourceDir, relativePath);
  const outFile = path.join(outDir, relativePath);
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, sanitizeText(fs.readFileSync(sourceFile, 'utf8')).replace(/\n+$/g, '\n'));
}

function copyBinaryDir(relativeDir, extension) {
  const sourceSubdir = path.join(sourceDir, relativeDir);
  const outSubdir = path.join(outDir, relativeDir);
  fs.mkdirSync(outSubdir, { recursive: true });
  for (const name of fs.readdirSync(sourceSubdir).filter((item) => item.endsWith(extension)).sort()) {
    fs.copyFileSync(path.join(sourceSubdir, name), path.join(outSubdir, name));
  }
}

function sanitizeRawFiles() {
  const rawSource = path.join(sourceDir, 'raw');
  const rawOut = path.join(outDir, 'raw');
  fs.mkdirSync(rawOut, { recursive: true });
  for (const name of fs.readdirSync(rawSource).filter((item) => item.endsWith('.json')).sort()) {
    const record = JSON.parse(fs.readFileSync(path.join(rawSource, name), 'utf8'));
    delete record.scoring;
    delete record.server_log;
    record.entry.source_dir = sanitizeText(record.entry.source_dir);
    record.entry.serve_dir = sanitizeText(record.entry.serve_dir);
    record.screenshots = (record.screenshots || []).map((screenshot) => ({
      ...screenshot,
      path: screenshot.path ? `screenshots/${path.basename(screenshot.path)}` : screenshot.path,
      daemon_path: screenshot.daemon_path ? '<WEBBRIDGE_SCREENSHOT_PATH>' : screenshot.daemon_path,
    }));
    record.server_log = `server-logs/${record.entry.site_id}.log`;
    fs.writeFileSync(path.join(rawOut, name), `${JSON.stringify(record, null, 2)}\n`);
  }
}

function sanitizeManifest() {
  const manifest = JSON.parse(fs.readFileSync(path.join(sourceDir, 'manifest.json'), 'utf8'));
  const sanitized = manifest.map((entry) => ({
    ...entry,
    source_dir: sanitizeText(entry.source_dir),
    serve_dir: sanitizeText(entry.serve_dir),
  }));
  fs.writeFileSync(path.join(outDir, 'manifest.json'), `${JSON.stringify(sanitized, null, 2)}\n`);
}

function writePrompt() {
  const promptHash = sha256(promptSource);
  if (promptHash !== expectedPromptSha) {
    throw new Error(`Unexpected prompt hash: ${promptHash}`);
  }
  fs.mkdirSync(path.dirname(promptOut), { recursive: true });
  const body = sanitizeText(fs.readFileSync(promptSource, 'utf8'));
  const header = [
    '# FuneralAI Web4 Refactor Prompt (Redacted)',
    '',
    `Original SHA-256: \`${promptHash}\``,
    '',
    'Only local filesystem paths were redacted. Task requirements, data-file names, expected routes, and scoring-relevant counts are preserved.',
    '',
    '```text',
  ];
  fs.writeFileSync(promptOut, `${header.join('\n')}\n${body}\n\`\`\`\n`);
}

function collectRunMetadata() {
  const rows = [];
  for (let round = 1; round <= 10; round += 1) {
    for (const [modelSlug, modelName, logName] of modelOrder) {
      const siteId = `r${round}-${modelSlug}`;
      const runDir = path.join(sourceWorkspace, `r${round}`, modelSlug);
      const logPath = path.join(runDir, logName);
      const logText = fs.existsSync(logPath) ? fs.readFileSync(logPath, 'utf8') : '';
      const dbLockLog = path.join(runDir, 'opus-4-8.db-lock-attempt.log');
      const startAt = matchLine(logText, /^START\s+(.+)$/m);
      const endAt = matchLine(logText, /^END\s+(.+)$/m);
      const exitCode = matchLine(logText, /^EXIT_CODE\s+(.+)$/m);
      const modelLine = matchLine(logText, /^MODEL\s+(.+)$/m);
      const promptHash = matchLine(logText, /^PROMPT_SHA256\s+(.+)$/m) || expectedPromptSha;
      rows.push({
        site_id: siteId,
        round: `r${round}`,
        model_slug: modelSlug,
        model_name: modelName,
        runner: 'opencode local shell',
        runner_config: modelSlug === 'minimax-m3' ? 'opencode-minimax-provider' : modelSlug === 'claude-opus-4-8' ? 'opencode-anthropic-provider' : 'opencode-default-provider',
        model_invocation: modelLine || modelSlug,
        prompt_sha256: promptHash,
        prompt_file: 'prompts/refactor-prompt.redacted.md',
        command_template: 'opencode run -m <MODEL> --dangerously-skip-permissions -f <PROMPT_FILE>',
        primary_log_recorded: fs.existsSync(logPath) ? `local-log-redacted:${logName}` : '',
        start_at: startAt || '',
        end_at: endAt || '',
        exit_code: exitCode || '',
        retry_note: fs.existsSync(dbLockLog) ? 'Previous database-locked attempt recorded locally; final run used primary log.' : '',
      });
    }
  }
  return rows;
}

function matchLine(text, regex) {
  const match = text.match(regex);
  return match ? sanitizeText(stripAnsi(match[1].trim())) : '';
}

function stripAnsi(text) {
  return text.replace(/\x1B\[[0-?]*[ -/]*[@-~]/g, '');
}

function csvEscape(value) {
  const text = String(value ?? '');
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function writeRunMetadata() {
  const rows = collectRunMetadata();
  fs.writeFileSync(metadataOutJson, `${JSON.stringify(rows, null, 2)}\n`);
  const header = Object.keys(rows[0]);
  const lines = [header.join(',')];
  for (const row of rows) {
    lines.push(header.map((key) => csvEscape(row[key])).join(','));
  }
  fs.writeFileSync(metadataOutCsv, `${lines.join('\n')}\n`);
}

function writeAuditReadme() {
  const lines = [
    '# 2026-06-16 WebBridge Audit Package',
    '',
    'This directory contains the submitted evidence package for the FuneralAI Web4 60-site recheck.',
    '',
    '## What It Contains',
    '',
    '- `method-lock.md`: scope, browser channel, concurrency, fixed pages, and scoring formula.',
    '- `manifest.json`: frozen list of 60 generated sites.',
    '- `webbridge-score.mjs`: redacted copy of the original browser audit script used locally.',
    '- `generate-manifest.mjs`: redacted copy of the original manifest generator.',
    '- `raw/*.json`: route, DOM, canvas/SVG, text-length, and screenshot-path evidence for every site.',
    '- `screenshots/*.png`: home, graph, and articles screenshots for every site.',
    '- `server-logs/*.log`: local static-server logs.',
    '- `site-scores.csv`: per-site scores regenerated from submitted raw evidence.',
    '- `final-results.json`: model summary, duplicate-score audit, and per-site score records.',
    '- `graph-contact-sheet.jpg`: visual contact sheet for graph-page inspection.',
    '',
    '## Recompute',
    '',
    'From the repository root:',
    '',
    '```bash',
    'npm run funeralai:check',
    '```',
    '',
    'To regenerate the derived result files:',
    '',
    '```bash',
    'npm run funeralai:recompute',
    '```',
    '',
    '## Privacy Redaction',
    '',
    'Local filesystem paths were replaced with placeholders such as `<BENCHMARK_WORKDIR>`, `<SOURCE_WORKDIR>`, and `<AUDIT_DIR>`. Screenshot paths inside raw JSON are relative to this audit directory.',
    '',
    '## Scoring Channel',
    '',
    'The scoring channel is Codex-authored Node code operating on evidence collected through Kimi WebBridge/CDP real-browser automation. Opus 4.8 is one of the contestants, not the judge for this submitted result set.',
  ];
  fs.writeFileSync(path.join(outDir, 'README.md'), `${lines.join('\n')}\n`);
}

ensureCleanDir(outDir);
for (const relativePath of ['method-lock.md', 'webbridge-score.mjs', 'generate-manifest.mjs', 'opus-4-8-low-score-diagnosis.md']) {
  copyTextFile(relativePath);
}
sanitizeManifest();
sanitizeRawFiles();
copyBinaryDir('screenshots', '.png');
copyBinaryDir('server-logs', '.log');
fs.copyFileSync(path.join(sourceDir, 'graph-contact-sheet.jpg'), path.join(outDir, 'graph-contact-sheet.jpg'));
writeAuditReadme();
writePrompt();
writeRunMetadata();

console.log(`ok: sanitized audit package to ${path.relative(repoRoot, outDir)}`);
console.log(`ok: wrote ${path.relative(repoRoot, promptOut)}`);
console.log(`ok: wrote ${path.relative(repoRoot, metadataOutCsv)} and ${path.relative(repoRoot, metadataOutJson)}`);
