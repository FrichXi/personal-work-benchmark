#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const defaultAuditDir = path.join(repoRoot, 'examples/funeralai-web4/audit/2026-06-16-webbridge');
const caseDir = path.join(repoRoot, 'examples/funeralai-web4');
const resultsDir = path.join(caseDir, 'results');
const generatedAt = '2026-06-16T00:00:00.000Z';
const expectedPromptSha = 'db10431344850b44bb044ecfdf749716fb62c097b389c2d0406f5cb32dbb7ea7';
const fixedPaths = ['/', '/graph/', '/articles/', '/articles/050/', '/articles/080/', '/articles/103/'];
const modelOrder = ['deepseek-v4-pro', 'kimi-k2.7-code', 'qwen3.7-max', 'glm-x-preview', 'minimax-m3', 'claude-opus-4-8'];

const args = parseArgs(process.argv.slice(2));
const auditDir = path.resolve(args.audit || defaultAuditDir);
const checkOnly = Boolean(args.check);

function parseArgs(argv) {
  const parsed = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--check') parsed.check = true;
    else if (arg === '--audit') parsed.audit = argv[++index];
    else if (arg.startsWith('--audit=')) parsed.audit = arg.slice('--audit='.length);
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return parsed;
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function round1(value) {
  return Math.round(value * 10) / 10;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function routeOk(page) {
  return page?.route?.status >= 200 && page.route.status < 400 && !page.navError;
}

function statusOk(page) {
  return page?.route?.status >= 200 && page.route.status < 400;
}

function graphVisible(graphProbe) {
  if (!graphProbe) return false;
  const canvasVisible = (graphProbe.canvases || []).some((canvas) => (
    canvas.nonBlank && canvas.clientWidth > 20 && canvas.clientHeight > 20
  ));
  const svgVisible = (graphProbe.svgs || []).some((svg) => (
    (svg.circles + svg.paths + svg.lines + svg.totalChildren) >= 50 &&
    svg.clientWidth > 20 &&
    svg.clientHeight > 20
  ));
  return canvasVisible || svgVisible;
}

function graphPartial(graphProbe) {
  if (!graphProbe) return false;
  const canvasPartial = (graphProbe.canvases || []).some((canvas) => canvas.sampled && canvas.uniqueColors > 1);
  const svgPartial = (graphProbe.svgs || []).some((svg) => (svg.circles + svg.paths + svg.lines + svg.totalChildren) >= 10);
  return canvasPartial || svgPartial || graphProbe.canvasCount > 0 || graphProbe.svgCount > 0;
}

function scoreSite(record) {
  const { entry, source } = record;
  const pages = record.pages || [];
  const byPath = Object.fromEntries(pages.map((page) => [page.path, page]));
  const home = byPath['/'];
  const graph = byPath['/graph/'];
  const articles = byPath['/articles/'];
  const details = ['/articles/050/', '/articles/080/', '/articles/103/'].map((pagePath) => byPath[pagePath]);
  const graphProbe = graph?.probe;
  const articlesProbe = articles?.probe;
  const detailLengths = details.map((page) => page?.probe?.bodyTextLength || 0);
  const detailOkCount = details.filter(routeOk).length;
  const avgDetailLength = detailLengths.reduce((a, b) => a + b, 0) / Math.max(1, detailLengths.length);
  const hasGraphVisible = graphVisible(graphProbe);
  const hasGraphPartial = graphPartial(graphProbe);

  const loadingComponents = {
    home: routeOk(home) ? (entry.entry_rule === 'root-missing-index' || /directory listing/i.test(home?.probe?.bodyExcerpt || '') ? 1.2 : 3) : 0,
    graph: routeOk(graph) ? 3 : (statusOk(graph) ? 1 : 0),
    articles: routeOk(articles) ? 3 : (statusOk(articles) ? 1 : 0),
    detail_050: routeOk(details[0]) ? 1.5 : (statusOk(details[0]) ? 0.5 : 0),
    detail_080: routeOk(details[1]) ? 1.5 : (statusOk(details[1]) ? 0.5 : 0),
    detail_103: routeOk(details[2]) ? 1.5 : (statusOk(details[2]) ? 0.5 : 0),
    readme: source.docs.readme ? 0.75 : 0,
    verification: source.docs.verification ? 0.75 : 0,
  };
  const loading = clamp(sumValues(loadingComponents), 0, 15);

  const graphComponents = {
    route: routeOk(graph) ? 4 : 0,
    visible_render: hasGraphVisible ? 16 : 0,
    partial_or_structural_render: !hasGraphVisible && hasGraphPartial ? 7 : 0,
    graph_library: source.code.graph_lib ? 3 : 0,
    corpus_size_signals: (source.text_markers.nodes || source.text_markers.edges) ? 3 : 0,
    zoom_affordance: source.code.zoom ? 2 : 0,
    drag_affordance: source.code.drag ? 2 : 0,
    click_affordance: source.code.click ? 2 : 0,
    clean_graph_page: graphProbe && !graphProbe.visibleErrors && (graphProbe.bodyTextLength > 200 || hasGraphVisible) ? 3 : 0,
  };
  const graphScore = clamp(sumValues(graphComponents), 0, 35);

  const articleLinks = articlesProbe?.articleLinkCount || 0;
  const shellPenalty = details.some((page) => /content preparing|coming soon|metadata|暂无|loading/i.test(page?.probe?.bodyExcerpt || '')) ? 1 : 0;
  const articleComponents = {
    list_route: routeOk(articles) ? 2 : 0,
    list_links: clamp(articleLinks / 25, 0, 4),
    detail_routes: detailOkCount,
    detail_text: detailLengths.reduce((sum, len) => sum + (len >= 1000 ? 2 : len >= 500 ? 1.3 : len >= 250 ? 0.7 : 0), 0),
    complete_detail_bonus: avgDetailLength >= 800 && shellPenalty === 0 ? 2 : avgDetailLength >= 400 ? 1 : 0,
    shell_penalty: -shellPenalty,
  };
  const articlesScore = clamp(sumValues(articleComponents), 0, 15);

  const homeText = home?.probe?.bodyTextLength || 0;
  const headings = home?.probe?.headings?.length || 0;
  const visualComponents = {
    design_tokens: clamp(source.css.variable_count / 4, 0, 4),
    dark_or_contrast_theme: source.css.has_dark_theme ? 3 : 0,
    typography: source.css.font_family ? 2 : 0,
    responsive_rules: source.css.has_media_query ? 3 : 0,
    homepage_structure: homeText > 500 && headings >= 2 ? 3 : (homeText > 200 || headings >= 1 ? 1.5 : 0),
    clean_home: !home?.probe?.visibleErrors && routeOk(home) ? 2 : 0,
    asset_structure: source.docs.assets_dir ? 1 : 0,
    multi_page_static_output: source.file_counts.html >= 3 && source.file_counts.css >= 1 ? 2 : 0,
  };
  const visual = clamp(sumValues(visualComponents), 0, 20);

  const hasSearchInput = (articlesProbe?.inputs || []).some((input) => (
    /search|filter|query|搜索|筛选/i.test(`${input.type} ${input.placeholder} ${input.aria}`)
  )) || source.code.search;
  const failedRoutes = pages.filter((page) => !routeOk(page)).length;
  const interactionComponents = {
    search_or_filter: hasSearchInput ? 4 : 0,
    navigation_density: (articlesProbe?.buttons || []).length >= 2 || (home?.probe?.linkCount || 0) >= 8 ? 2.5 : 0,
    graph_zoom: source.code.zoom ? 2 : 0,
    graph_drag: source.code.drag ? 2 : 0,
    graph_click: source.code.click ? 2 : 0,
    route_stability: failedRoutes === 0 ? 2.5 : failedRoutes <= 1 ? 1.5 : 0,
  };
  const interaction = clamp(sumValues(interactionComponents), 0, 15);

  const scores = {
    loading: round1(loading),
    graph: round1(graphScore),
    articles: round1(articlesScore),
    visual: round1(visual),
    interaction: round1(interaction),
  };
  const total = round1(scores.loading + scores.graph + scores.articles + scores.visual + scores.interaction);
  const failures = [];
  if (!routeOk(home) || entry.entry_rule === 'root-missing-index') failures.push('home-entry');
  if (!routeOk(graph)) failures.push('graph-route');
  else if (!hasGraphVisible) failures.push(hasGraphPartial ? 'graph-partial-or-blank' : 'graph-blank');
  if (!routeOk(articles) || articleLinks < 20) failures.push('article-list');
  if (avgDetailLength < 500) failures.push('article-detail-shell');
  if (!hasSearchInput) failures.push('weak-search-filter');
  if (visual < 12) failures.push('weak-visual-system');

  return {
    scores,
    total,
    graph_success: hasGraphVisible,
    failures,
    evidence: buildEvidence(entry, {
      home,
      graph,
      articles,
      details,
      articleLinks,
      detailLengths,
      hasGraphVisible,
      hasGraphPartial,
      source,
    }),
    components: {
      loading: roundComponentValues(loadingComponents),
      graph: roundComponentValues(graphComponents),
      articles: roundComponentValues(articleComponents),
      visual: roundComponentValues(visualComponents),
      interaction: roundComponentValues(interactionComponents),
    },
    metrics: {
      article_links: articleLinks,
      detail_text_lengths: detailLengths,
      avg_detail_text_length: Math.round(avgDetailLength),
      graph_canvas_count: graphProbe?.canvasCount || 0,
      graph_svg_count: graphProbe?.svgCount || 0,
      graph_visible: hasGraphVisible,
      graph_partial: hasGraphPartial,
      css_variable_count: source.css.variable_count,
      failed_route_count: failedRoutes,
      entry_rule: entry.entry_rule,
      article_page_count: entry.article_page_count,
      source_graph_interaction: Boolean(source.code.zoom || source.code.drag || source.code.click),
    },
  };
}

function sumValues(object) {
  return Object.values(object).reduce((sum, value) => sum + value, 0);
}

function roundComponentValues(object) {
  return Object.fromEntries(Object.entries(object).map(([key, value]) => [key, round1(value)]));
}

function buildEvidence(entry, data) {
  const routeBits = fixedPaths.map((pagePath) => {
    const page = pagePath === '/' ? data.home :
      pagePath === '/graph/' ? data.graph :
      pagePath === '/articles/' ? data.articles :
      data.details.find((detail) => detail.path === pagePath);
    return `${pagePath}:${page?.route?.status || 'ERR'}`;
  }).join(' ');
  const graphText = data.hasGraphVisible
    ? `graph rendered (${data.graph?.probe?.canvasCount || 0} canvas, ${data.graph?.probe?.svgCount || 0} svg)`
    : data.hasGraphPartial
      ? `graph had only partial/structural evidence (${data.graph?.probe?.canvasCount || 0} canvas, ${data.graph?.probe?.svgCount || 0} svg)`
      : 'graph showed no reliable render evidence';
  const articleText = `articles list links=${data.articleLinks}, detail lengths=${data.detailLengths.join('/')}`;
  const styleText = `css vars=${data.source.css.variable_count}, media=${data.source.css.has_media_query ? 'yes' : 'no'}, search=${data.source.code.search ? 'yes' : 'no'}`;
  const entryText = entry.entry_rule === 'root-missing-index' ? 'root index missing; ' : entry.entry_rule === 'site-index' ? 'served from site/; ' : '';
  return `${entry.round} ${entry.model_name}: ${entryText}${routeBits}; ${graphText}; ${articleText}; ${styleText}.`;
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function stdev(values) {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, value) => sum + ((value - mean) ** 2), 0) / values.length;
  return Math.sqrt(variance);
}

function summarize(records) {
  const byModel = new Map();
  for (const record of records) {
    const key = record.entry.model_slug;
    if (!byModel.has(key)) byModel.set(key, []);
    byModel.get(key).push(record);
  }
  const summary = [];
  for (const [model, rows] of byModel) {
    const totals = rows.map((row) => row.scoring.total);
    const failures = new Map();
    for (const row of rows) {
      for (const failure of row.scoring.failures) failures.set(failure, (failures.get(failure) || 0) + 1);
    }
    summary.push({
      model_slug: model,
      model_name: rows[0].entry.model_name,
      count: rows.length,
      mean: round1(totals.reduce((a, b) => a + b, 0) / totals.length),
      median: round1(median(totals)),
      min: round1(Math.min(...totals)),
      max: round1(Math.max(...totals)),
      stdev: round1(stdev(totals)),
      graph_success_count: rows.filter((row) => row.scoring.graph_success).length,
      common_failures: [...failures.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([name, count]) => `${name}(${count})`),
    });
  }
  summary.sort((a, b) => b.mean - a.mean || modelOrder.indexOf(a.model_slug) - modelOrder.indexOf(b.model_slug));
  return summary.map((row, index) => ({ rank: index + 1, ...row }));
}

function duplicateAudit(records) {
  const groups = new Map();
  for (const record of records) {
    const key = String(record.scoring.total);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(record);
  }
  return [...groups.entries()]
    .filter(([, rows]) => rows.length > 1)
    .sort((a, b) => b[1].length - a[1].length || Number(b[0]) - Number(a[0]))
    .map(([score, rows]) => ({
      score: Number(score),
      count: rows.length,
      site_ids: rows.map((row) => row.entry.site_id),
      evidence_samples: rows.slice(0, 3).map((row) => row.scoring.evidence),
    }));
}

function csvEscape(value) {
  const text = String(value ?? '');
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function loadEvidence() {
  const manifest = readJson(path.join(auditDir, 'manifest.json'));
  const rawDir = path.join(auditDir, 'raw');
  const rawFiles = fs.readdirSync(rawDir).filter((name) => name.endsWith('.json')).sort();
  const records = rawFiles.map((name) => {
    const raw = readJson(path.join(rawDir, name));
    const scoring = scoreSite(raw);
    return {
      site_id: raw.entry.site_id,
      audited_at: raw.audited_at,
      channel: raw.channel,
      max_open_pages: raw.max_open_pages,
      actual_site_concurrency: raw.actual_site_concurrency,
      wait_ms: raw.wait_ms,
      fixed_paths: raw.fixed_paths,
      entry: raw.entry,
      screenshots: raw.screenshots,
      server_log: raw.server_log,
      scoring,
    };
  });
  validateEvidence({ manifest, rawFiles, records });
  records.sort((a, b) => a.entry.round_number - b.entry.round_number || modelOrder.indexOf(a.entry.model_slug) - modelOrder.indexOf(b.entry.model_slug));
  const summary = summarize(records);
  const duplicates = duplicateAudit(records);
  return { manifest, records, summary, duplicates };
}

function validateEvidence({ manifest, rawFiles, records }) {
  if (!Array.isArray(manifest) || manifest.length !== 60) {
    throw new Error(`Expected manifest with 60 entries, got ${Array.isArray(manifest) ? manifest.length : 'non-array'}`);
  }
  if (rawFiles.length !== 60) throw new Error(`Expected 60 raw JSON files, got ${rawFiles.length}`);
  const screenshotsDir = path.join(auditDir, 'screenshots');
  const screenshotCount = fs.existsSync(screenshotsDir)
    ? fs.readdirSync(screenshotsDir).filter((name) => name.endsWith('.png')).length
    : 0;
  if (screenshotCount !== 180) throw new Error(`Expected 180 screenshot PNGs, got ${screenshotCount}`);
  const counts = new Map();
  for (const record of records) {
    if (JSON.stringify(record.fixed_paths) !== JSON.stringify(fixedPaths)) {
      throw new Error(`Unexpected fixed paths for ${record.entry.site_id}`);
    }
    counts.set(record.entry.model_slug, (counts.get(record.entry.model_slug) || 0) + 1);
    if (record.channel !== 'kimi-webbridge-cdp-real-browser') {
      throw new Error(`Unexpected channel for ${record.entry.site_id}: ${record.channel}`);
    }
  }
  for (const model of modelOrder) {
    if (counts.get(model) !== 10) throw new Error(`Expected 10 rows for ${model}, got ${counts.get(model) || 0}`);
  }
}

function renderSiteCsv(records) {
  const header = ['site_id', 'round', 'model', 'loading', 'graph', 'articles', 'visual', 'interaction', 'total', 'graph_success', 'failures', 'evidence'];
  const rows = records.map((record) => [
    record.entry.site_id,
    record.entry.round,
    record.entry.model_name,
    record.scoring.scores.loading,
    record.scoring.scores.graph,
    record.scoring.scores.articles,
    record.scoring.scores.visual,
    record.scoring.scores.interaction,
    record.scoring.total,
    record.scoring.graph_success ? 'yes' : 'no',
    record.scoring.failures.join(';'),
    record.scoring.evidence,
  ].map(csvEscape).join(','));
  return `${header.join(',')}\n${rows.join('\n')}\n`;
}

function renderLeaderboardJson(summary) {
  return `${JSON.stringify({
    generated_at: generatedAt,
    ranking_basis: 'mean score over 10 rounds per model',
    caution: 'Mean gaps below 2 points are narrow differences under this task and scoring formula, not strong general capability claims.',
    prompt_sha256: expectedPromptSha,
    models: summary,
  }, null, 2)}\n`;
}

function renderScoresJson(records) {
  return `${JSON.stringify({
    generated_at: generatedAt,
    prompt_sha256: expectedPromptSha,
    scoring_basis: 'Kimi WebBridge/CDP real-browser audit over fixed local routes',
    records,
  }, null, 2)}\n`;
}

function renderFinalResultsJson(records, summary, duplicates) {
  return `${JSON.stringify({
    generated_at: generatedAt,
    prompt_sha256: expectedPromptSha,
    audit_channel: 'kimi-webbridge-cdp-real-browser',
    fixed_paths: fixedPaths,
    scoring_formula: 'loading 15 + graph 35 + articles 15 + visual 20 + interaction 15',
    summary,
    duplicates,
    records,
  }, null, 2)}\n`;
}

function renderLeaderboardMd(summary) {
  const lines = [
    '# FuneralAI Web4 Leaderboard',
    '',
    'Ranking basis: mean score over 10 independent rounds per model.',
    '',
    '> Mean gaps below 2 points are narrow differences under this task and scoring formula, not strong general capability claims.',
    '',
    '| Rank | Model | Sites | Mean | Median | Min | Max | Stdev | Graph Success | Common Failures |',
    '|---:|---|---:|---:|---:|---:|---:|---:|---:|---|',
  ];
  for (const row of summary) {
    lines.push(`| ${row.rank} | ${row.model_name} | ${row.count} | ${row.mean} | ${row.median} | ${row.min} | ${row.max} | ${row.stdev} | ${row.graph_success_count}/10 | ${row.common_failures.join(', ') || '-'} |`);
  }
  return `${lines.join('\n')}\n`;
}

function renderReport(records, summary, duplicates) {
  const lines = [
    '# FuneralAI Web4 60-Site WebBridge Audit',
    '',
    `Generated at: ${generatedAt}`,
    '',
    '## Method Lock',
    '',
    '- Sample: `r1-r10 x 6 models = 60` generated static websites.',
    '- Browser channel: Kimi WebBridge/CDP real-browser path, using the same channel for every site.',
    '- Judge: deterministic Node scoring over browser route/DOM/canvas/SVG/text evidence collected by Codex-driven Chrome automation.',
    '- Not used: Opus 4.8 as a scoring judge, manual graph scoring, or model-level template scores.',
    '- Fixed pages: `/`, `/graph/`, `/articles/`, `/articles/050/`, `/articles/080/`, `/articles/103/`.',
    '- Formula: loading 15 + graph 35 + articles 15 + visual 20 + interaction-affordance/stability 15.',
    '- Weight caveat: the 35% graph weight is an author-defined task preference for this website refactor benchmark.',
    '- Interpretation caveat: mean gaps below 2 points are narrow differences under this task and scoring formula, not strong general capability claims.',
    '',
    '## Model Summary',
    '',
    '| Rank | Model | Sites | Mean | Median | Min | Max | Stdev | Graph Success | Common Failures |',
    '|---:|---|---:|---:|---:|---:|---:|---:|---:|---|',
  ];
  for (const row of summary) {
    lines.push(`| ${row.rank} | ${row.model_name} | ${row.count} | ${row.mean} | ${row.median} | ${row.min} | ${row.max} | ${row.stdev} | ${row.graph_success_count}/10 | ${row.common_failures.join(', ') || '-'} |`);
  }
  lines.push('');
  lines.push('## Site Scores');
  lines.push('');
  lines.push('| Site | Model | L | G | A | V | I | Total | Graph Success | Evidence |');
  lines.push('|---|---|---:|---:|---:|---:|---:|---:|---|---|');
  for (const record of records) {
    const s = record.scoring.scores;
    lines.push(`| ${record.entry.site_id} | ${record.entry.model_name} | ${s.loading} | ${s.graph} | ${s.articles} | ${s.visual} | ${s.interaction} | ${record.scoring.total} | ${record.scoring.graph_success ? 'yes' : 'no'} | ${record.scoring.evidence.replace(/\|/g, '/')} |`);
  }
  lines.push('');
  lines.push('## Duplicate-Score Audit');
  lines.push('');
  if (!duplicates.length) {
    lines.push('No duplicate total scores.');
  } else {
    lines.push('| Total | Count | Sites | Evidence Samples |');
    lines.push('|---:|---:|---|---|');
    for (const group of duplicates) {
      lines.push(`| ${group.score} | ${group.count} | ${group.site_ids.join(', ')} | ${group.evidence_samples.map((item) => item.replace(/\|/g, '/')).join(' / ')} |`);
    }
  }
  lines.push('');
  lines.push('## Submitted Artifacts');
  lines.push('');
  lines.push('- `audit/2026-06-16-webbridge/manifest.json`: frozen 60-site manifest.');
  lines.push('- `audit/2026-06-16-webbridge/raw/*.json`: route, DOM, canvas/SVG, text-length, and screenshot-path evidence.');
  lines.push('- `audit/2026-06-16-webbridge/screenshots/*.png`: home, graph, and articles screenshots for every site.');
  lines.push('- `audit/2026-06-16-webbridge/site-scores.csv`: per-site structured scores regenerated from raw evidence.');
  lines.push('- `audit/2026-06-16-webbridge/final-results.json`: summary and per-site scores.');
  return `${lines.join('\n')}\n`;
}

function buildOutputs(evidence) {
  const { records, summary, duplicates } = evidence;
  return new Map([
    [path.join(auditDir, 'site-scores.csv'), renderSiteCsv(records)],
    [path.join(auditDir, 'final-results.json'), renderFinalResultsJson(records, summary, duplicates)],
    [path.join(resultsDir, 'scores.csv'), renderSiteCsv(records)],
    [path.join(resultsDir, 'scores.json'), renderScoresJson(records)],
    [path.join(resultsDir, 'leaderboard.json'), renderLeaderboardJson(summary)],
    [path.join(resultsDir, 'leaderboard.md'), renderLeaderboardMd(summary)],
    [path.join(resultsDir, 'report.md'), renderReport(records, summary, duplicates)],
  ]);
}

function writeOrCheck(outputs) {
  const mismatches = [];
  for (const [file, content] of outputs) {
    if (checkOnly) {
      const current = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
      if (current !== content) mismatches.push(path.relative(repoRoot, file));
    } else {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, content);
    }
  }
  if (mismatches.length) {
    throw new Error(`Generated outputs are stale:\n${mismatches.map((item) => `- ${item}`).join('\n')}`);
  }
}

const evidence = loadEvidence();
const outputs = buildOutputs(evidence);
writeOrCheck(outputs);
console.log(`ok: ${checkOnly ? 'checked' : 'wrote'} FuneralAI WebBridge audit results (${evidence.records.length} raw records, ${evidence.summary.length} models)`);
