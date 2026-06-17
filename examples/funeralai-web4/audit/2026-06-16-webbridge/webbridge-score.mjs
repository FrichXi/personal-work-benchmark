#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.resolve(root, 'recheck-60-20260616');
const manifestPath = path.join(outDir, 'manifest.json');
const rawDir = path.join(outDir, 'raw');
const screenshotsDir = path.join(outDir, 'screenshots');
const logsDir = path.join(outDir, 'server-logs');
const daemonUrl = 'http://127.0.0.1:10086/command';
const fixedPaths = ['/', '/graph/', '/articles/', '/articles/050/', '/articles/080/', '/articles/103/'];
const waitMs = 2200;

const args = new Set(process.argv.slice(2));
const dryRun = args.has('--dry-run');
const resume = args.has('--resume');
const noScreenshots = args.has('--no-screenshots');
const refreshScreenshots = args.has('--refresh-screenshots');
const limitArg = process.argv.find((arg) => arg.startsWith('--limit='));
const onlyArg = process.argv.find((arg) => arg.startsWith('--site='));
const limit = limitArg ? Number(limitArg.split('=')[1]) : Infinity;
const onlySite = onlyArg ? onlyArg.split('=')[1] : '';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function ensureDirs() {
  for (const dir of [outDir, rawDir, screenshotsDir, logsDir]) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function loadManifest() {
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Missing manifest: ${manifestPath}. Run generate-manifest.mjs first.`);
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  validateManifest(manifest);
  return manifest;
}

function validateManifest(manifest) {
  if (!Array.isArray(manifest) || manifest.length !== 60) {
    throw new Error(`Manifest must contain exactly 60 entries, got ${Array.isArray(manifest) ? manifest.length : 'non-array'}`);
  }
  const counts = new Map();
  for (const entry of manifest) {
    if (entry.source_dir.includes('/archive/') || entry.source_dir.includes('/r11/')) {
      throw new Error(`Out-of-scope entry in manifest: ${entry.source_dir}`);
    }
    counts.set(entry.model_slug, (counts.get(entry.model_slug) || 0) + 1);
    for (const key of ['round', 'model_slug', 'model_name', 'source_dir', 'serve_dir', 'base_url', 'site_id']) {
      if (!entry[key]) throw new Error(`Manifest entry ${entry.site_id || '<unknown>'} missing ${key}`);
    }
  }
  for (const [model, count] of counts) {
    if (count !== 10) throw new Error(`Model ${model} must have 10 entries, got ${count}`);
  }
  if (counts.size !== 6) throw new Error(`Manifest must have 6 models, got ${counts.size}`);
}

async function command(action, commandArgs = {}, session = 'recheck60') {
  const response = await fetch(daemonUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ action, args: commandArgs, session }),
  });
  const text = await response.text();
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(`WebBridge returned non-JSON for ${action}: ${text.slice(0, 300)}`);
  }
  if (!response.ok || parsed.error) {
    throw new Error(`WebBridge ${action} failed: ${JSON.stringify(parsed).slice(0, 500)}`);
  }
  return parsed.data ?? parsed;
}

async function checkWebBridge() {
  const data = await command('list_tabs', {}, 'recheck60-health');
  return data;
}

function startServer(entry) {
  const logPath = path.join(logsDir, `${entry.site_id}.log`);
  const out = fs.openSync(logPath, 'w');
  const child = spawn('python3', ['-m', 'http.server', String(entry.port), '--bind', '127.0.0.1', '--directory', entry.serve_dir], {
    cwd: entry.serve_dir,
    stdio: ['ignore', out, out],
  });
  return { child, logPath };
}

async function waitForServer(url) {
  let lastError = '';
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(url);
      return { ok: true, status: response.status };
    } catch (error) {
      lastError = error.message;
      await sleep(250);
    }
  }
  return { ok: false, error: lastError };
}

function stopServer(child) {
  if (!child || child.killed) return;
  child.kill('SIGTERM');
}

async function fetchStatus(url) {
  try {
    const response = await fetch(url, { redirect: 'manual' });
    return { ok: true, status: response.status, contentType: response.headers.get('content-type') || '' };
  } catch (error) {
    return { ok: false, status: 0, error: error.message };
  }
}

function safeRead(file) {
  try {
    return fs.readFileSync(file, 'utf8');
  } catch {
    return '';
  }
}

function walkFiles(dir, matcher, maxFiles = 2000) {
  const found = [];
  const stack = [dir];
  while (stack.length && found.length < maxFiles) {
    const current = stack.pop();
    let entries = [];
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      if (entry.name === 'node_modules' || entry.name === '.git') continue;
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) stack.push(full);
      else if (matcher(full)) found.push(full);
    }
  }
  return found;
}

function sourceEvidence(entry) {
  const files = walkFiles(entry.serve_dir, (file) => /\.(html|css|js|json|md)$/i.test(file), 2500);
  const cssFiles = files.filter((file) => /\.css$/i.test(file));
  const jsFiles = files.filter((file) => /\.js$/i.test(file));
  const htmlFiles = files.filter((file) => /\.html$/i.test(file));
  const cssText = cssFiles.map(safeRead).join('\n').slice(0, 2_000_000);
  const jsText = jsFiles.map(safeRead).join('\n').slice(0, 2_000_000);
  const htmlText = htmlFiles.slice(0, 150).map(safeRead).join('\n').slice(0, 2_000_000);
  const allText = `${cssText}\n${jsText}\n${htmlText}`;
  return {
    file_counts: {
      css: cssFiles.length,
      js: jsFiles.length,
      html: htmlFiles.length,
    },
    docs: {
      readme: fs.existsSync(path.join(entry.source_dir, 'README.md')),
      verification: fs.existsSync(path.join(entry.source_dir, 'VERIFICATION.md')),
      build_py: fs.existsSync(path.join(entry.source_dir, 'build.py')) || fs.existsSync(path.join(entry.serve_dir, 'build.py')),
      assets_dir: fs.existsSync(path.join(entry.serve_dir, 'assets')),
    },
    css: {
      variable_count: (cssText.match(/--[a-zA-Z0-9_-]+\s*:/g) || []).length,
      has_media_query: /@media\b/i.test(cssText) || /viewport/i.test(htmlText),
      has_dark_theme: /#[0-2][0-9a-f][0-2][0-9a-f][0-2][0-9a-f]|rgb\(\s*(?:[0-3]?\d|4\d|50)\s*,\s*(?:[0-3]?\d|4\d|50)\s*,\s*(?:[0-3]?\d|4\d|50)\s*\)/i.test(cssText),
      has_purple: /#(?:7351cf|8b5cf6|7c3aed|a855f7|6d28d9|9333ea)|purple|violet/i.test(cssText),
      font_family: /font-family\s*:/i.test(cssText),
    },
    code: {
      zoom: /\b(zoom|scale|wheel|d3\.zoom)\b/i.test(jsText),
      drag: /\b(drag|pan|translate|d3\.drag)\b/i.test(jsText),
      click: /\b(click|select|mouseover|pointer)\b/i.test(jsText),
      search: /\b(search|filter|query|input)\b/i.test(jsText + htmlText),
      graph_lib: /\b(d3|vis-network|sigma|cytoscape|forceSimulation|canvas|getContext|svg)\b/i.test(jsText + htmlText),
    },
    text_markers: {
      nodes: /\b(600|605)\b/.test(allText),
      edges: /\b(1546|1566)\b/.test(allText),
      articles_103_or_104: /\b(103|104)\b/.test(allText),
    },
  };
}

function browserProbeCode() {
  return `(() => {
    const text = document.body ? document.body.innerText || '' : '';
    const links = [...document.querySelectorAll('a')].map(a => ({text:(a.innerText||a.textContent||'').trim().slice(0,80), href:a.href || a.getAttribute('href') || ''}));
    const articleLinks = links.filter(a => /\\/articles\\//.test(a.href));
    const inputs = [...document.querySelectorAll('input, textarea, [contenteditable="true"], select')].map(el => ({tag:el.tagName, type:el.getAttribute('type') || '', placeholder:el.getAttribute('placeholder') || '', aria:el.getAttribute('aria-label') || ''}));
    const buttons = [...document.querySelectorAll('button, [role="button"]')].map(el => (el.innerText || el.textContent || el.getAttribute('aria-label') || '').trim()).filter(Boolean).slice(0,30);
    const headings = [...document.querySelectorAll('h1,h2,h3')].map(el => (el.innerText || el.textContent || '').trim()).filter(Boolean).slice(0,20);
    const canvases = [...document.querySelectorAll('canvas')].map((canvas) => {
      const info = {width: canvas.width, height: canvas.height, clientWidth: canvas.clientWidth, clientHeight: canvas.clientHeight, sampled: false, nonBlank: false, uniqueColors: 0, coloredPixels: 0, nonTransparentPixels: 0, error: ''};
      try {
        const ctx = canvas.getContext('2d');
        if (ctx && canvas.width > 0 && canvas.height > 0) {
          const colors = new Set();
          const xs = [0.08, 0.2, 0.35, 0.5, 0.65, 0.8, 0.92];
          const ys = [0.08, 0.2, 0.35, 0.5, 0.65, 0.8, 0.92];
          let nonTransparent = 0;
          let colored = 0;
          const patch = Math.max(8, Math.min(28, Math.floor(Math.min(canvas.width, canvas.height) / 20)));
          for (const xr of xs) {
            for (const yr of ys) {
              const x = Math.max(0, Math.min(canvas.width - patch, Math.floor(canvas.width * xr) - Math.floor(patch / 2)));
              const y = Math.max(0, Math.min(canvas.height - patch, Math.floor(canvas.height * yr) - Math.floor(patch / 2)));
              const data = ctx.getImageData(x, y, patch, patch).data;
              for (let i = 0; i < data.length; i += 16) {
                const r = data[i], g = data[i+1], b = data[i+2], a = data[i+3];
                if (a > 8) {
                  nonTransparent += 1;
                  const max = Math.max(r, g, b);
                  const min = Math.min(r, g, b);
                  if (max > 45 || max - min > 18) colored += 1;
                }
                colors.add(Math.round(r / 16) + ',' + Math.round(g / 16) + ',' + Math.round(b / 16) + ',' + Math.round(a / 32));
              }
            }
          }
          info.sampled = true;
          info.uniqueColors = colors.size;
          info.coloredPixels = colored;
          info.nonTransparentPixels = nonTransparent;
          info.nonBlank = (colored > 20 && colors.size > 4) || (nonTransparent > 120 && colors.size > 8);
        }
      } catch (error) {
        info.error = error.message;
      }
      return info;
    });
    const svgs = [...document.querySelectorAll('svg')].map(svg => ({
      clientWidth: svg.clientWidth,
      clientHeight: svg.clientHeight,
      circles: svg.querySelectorAll('circle').length,
      paths: svg.querySelectorAll('path').length,
      lines: svg.querySelectorAll('line').length,
      groups: svg.querySelectorAll('g').length,
      texts: svg.querySelectorAll('text').length,
      totalChildren: svg.querySelectorAll('*').length
    }));
    const visibleErrors = /404|not found|cannot get|error|exception|directory listing|content preparing|coming soon/i.test(text);
    return JSON.stringify({
      url: location.href,
      title: document.title || '',
      bodyTextLength: text.length,
      bodyExcerpt: text.replace(/\\s+/g, ' ').slice(0, 300),
      linkCount: links.length,
      articleLinkCount: articleLinks.length,
      firstArticleLinks: articleLinks.slice(0, 8),
      headings,
      inputs,
      buttons,
      canvasCount: canvases.length,
      canvases,
      svgCount: svgs.length,
      svgs,
      visibleErrors,
      viewport: {innerWidth, innerHeight, devicePixelRatio},
      metaViewport: !!document.querySelector('meta[name="viewport"]')
    });
  })()`;
}

async function navigateAndProbe(entry, pagePath, session, isFirstNavigation) {
  const url = new URL(pagePath, entry.base_url).href;
  const route = await fetchStatus(url);
  let nav = null;
  let probe = null;
  let navError = '';
  try {
    nav = await command('navigate', { url, newTab: isFirstNavigation, group_title: 'recheck-60' }, session);
    await sleep(pagePath === '/graph/' ? waitMs + 1200 : waitMs);
    const evaluated = await command('evaluate', { code: browserProbeCode() }, session);
    const value = typeof evaluated.value === 'string' ? evaluated.value : evaluated;
    probe = typeof value === 'string' ? JSON.parse(value) : value;
  } catch (error) {
    navError = error.message;
  }
  return { path: pagePath, url, route, nav, probe, navError };
}

async function takeScreenshot(session, outputPath) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  try {
    const result = await command('screenshot', { format: 'png' }, session);
    if (result.path && fs.existsSync(result.path)) {
      fs.copyFileSync(result.path, outputPath);
      return { ok: true, path: outputPath, daemon_path: result.path, size_bytes: fs.statSync(outputPath).size };
    }
    if (typeof result.data === 'string' && result.data.length > 0) {
      fs.writeFileSync(outputPath, Buffer.from(result.data, 'base64'));
      return { ok: true, path: outputPath, size_bytes: fs.statSync(outputPath).size };
    }
    return { ok: false, error: `Unsupported screenshot response: ${JSON.stringify(result).slice(0, 300)}` };
  } catch (error) {
    return { ok: false, error: error.message };
  }
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
  const canvasVisible = (graphProbe.canvases || []).some((canvas) => canvas.nonBlank && canvas.clientWidth > 20 && canvas.clientHeight > 20);
  const svgVisible = (graphProbe.svgs || []).some((svg) => (svg.circles + svg.paths + svg.lines + svg.totalChildren) >= 50 && svg.clientWidth > 20 && svg.clientHeight > 20);
  return canvasVisible || svgVisible;
}

function graphPartial(graphProbe) {
  if (!graphProbe) return false;
  const canvasPartial = (graphProbe.canvases || []).some((canvas) => canvas.sampled && canvas.uniqueColors > 1);
  const svgPartial = (graphProbe.svgs || []).some((svg) => (svg.circles + svg.paths + svg.lines + svg.totalChildren) >= 10);
  return canvasPartial || svgPartial || graphProbe.canvasCount > 0 || graphProbe.svgCount > 0;
}

function scoreSite(entry, pages, source) {
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
  const sourceGraphInteraction = source.code.zoom || source.code.drag || source.code.click;
  const routeScores = [
    routeOk(home) ? (entry.entry_rule === 'root-missing-index' || /directory listing/i.test(home?.probe?.bodyExcerpt || '') ? 1.2 : 3) : 0,
    routeOk(graph) ? 3 : (statusOk(graph) ? 1 : 0),
    routeOk(articles) ? 3 : (statusOk(articles) ? 1 : 0),
    ...details.map((page) => routeOk(page) ? 1.5 : (statusOk(page) ? 0.5 : 0)),
    source.docs.readme ? 0.75 : 0,
    source.docs.verification ? 0.75 : 0,
  ];
  const loading = clamp(routeScores.reduce((a, b) => a + b, 0), 0, 15);

  let graphScore = 0;
  if (routeOk(graph)) graphScore += 4;
  if (hasGraphVisible) graphScore += 16;
  else if (hasGraphPartial) graphScore += 7;
  if (source.code.graph_lib) graphScore += 3;
  if (source.text_markers.nodes || source.text_markers.edges) graphScore += 3;
  if (source.code.zoom) graphScore += 2;
  if (source.code.drag) graphScore += 2;
  if (source.code.click) graphScore += 2;
  if (graphProbe && !graphProbe.visibleErrors && (graphProbe.bodyTextLength > 200 || hasGraphVisible)) graphScore += 3;
  graphScore = clamp(graphScore, 0, 35);

  let articlesScore = 0;
  const articleLinks = articlesProbe?.articleLinkCount || 0;
  articlesScore += routeOk(articles) ? 2 : 0;
  articlesScore += clamp(articleLinks / 25, 0, 4);
  articlesScore += detailOkCount;
  articlesScore += detailLengths.reduce((sum, len) => sum + (len >= 1000 ? 2 : len >= 500 ? 1.3 : len >= 250 ? 0.7 : 0), 0);
  const shellPenalty = details.some((page) => /content preparing|coming soon|metadata|暂无|loading/i.test(page?.probe?.bodyExcerpt || '')) ? 1 : 0;
  articlesScore += avgDetailLength >= 800 && shellPenalty === 0 ? 2 : avgDetailLength >= 400 ? 1 : 0;
  articlesScore = clamp(articlesScore - shellPenalty, 0, 15);

  let visual = 0;
  visual += clamp(source.css.variable_count / 3, 0, 5);
  if (source.css.has_dark_theme) visual += 3;
  if (source.css.has_purple) visual += 2;
  if (source.css.font_family) visual += 2;
  if (source.css.has_media_query) visual += 3;
  const homeText = home?.probe?.bodyTextLength || 0;
  const headings = home?.probe?.headings?.length || 0;
  if (homeText > 500 && headings >= 2) visual += 3;
  else if (homeText > 200 || headings >= 1) visual += 1.5;
  if (!home?.probe?.visibleErrors && routeOk(home)) visual += 2;
  visual = clamp(visual, 0, 20);

  let interaction = 0;
  const hasSearchInput = (articlesProbe?.inputs || []).some((input) => /search|filter|query|搜索|筛选/i.test(`${input.type} ${input.placeholder} ${input.aria}`)) || source.code.search;
  if (hasSearchInput) interaction += 4;
  if ((articlesProbe?.buttons || []).length >= 2 || (home?.probe?.linkCount || 0) >= 8) interaction += 2.5;
  if (source.code.zoom) interaction += 2;
  if (source.code.drag) interaction += 2;
  if (source.code.click) interaction += 2;
  const failedRoutes = pages.filter((page) => !routeOk(page)).length;
  interaction += failedRoutes === 0 ? 2.5 : failedRoutes <= 1 ? 1.5 : 0;
  interaction = clamp(interaction, 0, 15);

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

  const evidence = buildEvidence(entry, {
    home,
    graph,
    articles,
    details,
    articleLinks,
    detailLengths,
    hasGraphVisible,
    hasGraphPartial,
    source,
    scores,
    total,
    failures,
  });

  return {
    scores,
    total,
    graph_success: hasGraphVisible,
    failures,
    evidence,
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
      source_graph_interaction: sourceGraphInteraction,
    },
  };
}

function round1(value) {
  return Math.round(value * 10) / 10;
}

function buildEvidence(entry, data) {
  const routeBits = fixedPaths.map((pagePath) => {
    const page = pagePath === '/' ? data.home : pagePath === '/graph/' ? data.graph : pagePath === '/articles/' ? data.articles : data.details.find((detail) => detail.path === pagePath);
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

async function auditSite(entry) {
  const session = `recheck60-${entry.site_id}`;
  const rawPath = path.join(rawDir, `${entry.site_id}.json`);
  const priorRecord = fs.existsSync(rawPath) ? JSON.parse(fs.readFileSync(rawPath, 'utf8')) : null;
  if (resume && fs.existsSync(rawPath) && !refreshScreenshots) {
    return priorRecord;
  }

  const server = startServer(entry);
  const started = await waitForServer(entry.base_url);
  if (!started.ok) {
    stopServer(server.child);
    throw new Error(`Server failed for ${entry.site_id}: ${started.error}`);
  }

  const source = sourceEvidence(entry);
  const pages = [];
  const screenshots = [];
  try {
    for (let index = 0; index < fixedPaths.length; index += 1) {
      const pagePath = fixedPaths[index];
      const page = await navigateAndProbe(entry, pagePath, session, index === 0);
      pages.push(page);

      const shouldScreenshot = !noScreenshots && (pagePath === '/' || pagePath === '/graph/' || pagePath === '/articles/');
      if (shouldScreenshot) {
        const name = pagePath === '/' ? 'home' : pagePath.replace(/^\/|\/$/g, '').replace(/\//g, '-');
        const screenshotPath = path.join(screenshotsDir, `${entry.site_id}-${name}.png`);
        screenshots.push({ path: pagePath, ...(await takeScreenshot(session, screenshotPath)) });
      }
    }
  } finally {
    try {
      await command('close_session', {}, session);
    } catch {
      // The browser session is best-effort cleanup; the server still needs to stop.
    }
    stopServer(server.child);
  }

  const scoring = scoreSite(entry, pages, source);
  const record = {
    audited_at: new Date().toISOString(),
    channel: 'kimi-webbridge-cdp-real-browser',
    max_open_pages: 6,
    actual_site_concurrency: 1,
    wait_ms: waitMs,
    fixed_paths: fixedPaths,
    entry,
    source,
    pages,
    screenshots: noScreenshots && priorRecord?.screenshots ? priorRecord.screenshots : screenshots,
    scoring,
    server_log: server.logPath,
  };
  fs.writeFileSync(rawPath, `${JSON.stringify(record, null, 2)}\n`);
  return record;
}

async function refreshSiteScreenshots(entry) {
  const rawPath = path.join(rawDir, `${entry.site_id}.json`);
  if (!fs.existsSync(rawPath)) {
    throw new Error(`Cannot refresh screenshots without raw record: ${entry.site_id}`);
  }
  const record = JSON.parse(fs.readFileSync(rawPath, 'utf8'));
  const session = `recheck60-shot-${entry.site_id}`;
  const server = startServer(entry);
  const started = await waitForServer(entry.base_url);
  if (!started.ok) {
    stopServer(server.child);
    throw new Error(`Server failed for screenshot refresh ${entry.site_id}: ${started.error}`);
  }
  const screenshots = [];
  try {
    const screenshotPaths = ['/', '/graph/', '/articles/'];
    for (let index = 0; index < screenshotPaths.length; index += 1) {
      const pagePath = screenshotPaths[index];
      const url = new URL(pagePath, entry.base_url).href;
      await command('navigate', { url, newTab: index === 0, group_title: 'recheck-60-shots' }, session);
      await sleep(pagePath === '/graph/' ? waitMs + 1200 : waitMs);
      const name = pagePath === '/' ? 'home' : pagePath.replace(/^\/|\/$/g, '').replace(/\//g, '-');
      const screenshotPath = path.join(screenshotsDir, `${entry.site_id}-${name}.png`);
      screenshots.push({ path: pagePath, ...(await takeScreenshot(session, screenshotPath)) });
    }
  } finally {
    try {
      await command('close_session', {}, session);
    } catch {
      // Best-effort tab cleanup.
    }
    stopServer(server.child);
  }
  record.screenshots = screenshots;
  record.screenshot_refreshed_at = new Date().toISOString();
  fs.writeFileSync(rawPath, `${JSON.stringify(record, null, 2)}\n`);
  return record;
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
      common_failures: [...failures.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([name, count]) => `${name}(${count})`).join(', '),
    });
  }
  summary.sort((a, b) => b.mean - a.mean);
  return summary;
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
    .sort((a, b) => b[1].length - a[1].length)
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

function writeOutputs(records) {
  records.sort((a, b) => a.entry.round_number - b.entry.round_number || modelOrder(a.entry.model_slug) - modelOrder(b.entry.model_slug));
  const summary = summarize(records);
  const duplicates = duplicateAudit(records);
  const jsonPath = path.join(outDir, 'final-results.json');
  fs.writeFileSync(jsonPath, `${JSON.stringify({ records, summary, duplicates }, null, 2)}\n`);

  const csvHeader = ['site_id', 'round', 'model', 'loading', 'graph', 'articles', 'visual', 'interaction', 'total', 'graph_success', 'failures', 'evidence'];
  const csvRows = records.map((record) => [
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
  fs.writeFileSync(path.join(outDir, 'site-scores.csv'), `${csvHeader.join(',')}\n${csvRows.join('\n')}\n`);

  const lines = [];
  lines.push('# 60 个产出网站统一 CDP/WebBridge 复评报告');
  lines.push('');
  lines.push(`生成时间：${new Date().toISOString()}`);
  lines.push('');
  lines.push('## 方法锁');
  lines.push('');
  lines.push('- 样本：`r1-r10 × 6 models = 60`，排除 `r11/claude-opus-4` 和 `archive/`。');
  lines.push('- 浏览器通道：Kimi WebBridge 真实浏览器/CDP 通道，所有站点同一通道。');
  lines.push('- 并发：上限 6 个打开页面；本次脚本实际按 1 个站点会话串行执行。');
  lines.push('- 固定页面：`/`、`/graph/`、`/articles/`、`/articles/050/`、`/articles/080/`、`/articles/103/`。');
  lines.push('- 公式：loading 15 + graph 35 + articles 15 + visual 20 + interaction 15。');
  lines.push('- 解释边界：模型均分差距小于 2 分时，不做强能力断言，只视为本轮样本和本评分公式下的窄幅差异。');
  lines.push('');
  lines.push('## 模型汇总');
  lines.push('');
  lines.push('| 排名 | 模型 | 站点数 | 均分 | 中位数 | 最低 | 最高 | 标准差 | 图谱成功轮数 | 主要失败类型 |');
  lines.push('|---:|---|---:|---:|---:|---:|---:|---:|---:|---|');
  summary.forEach((row, index) => {
    lines.push(`| ${index + 1} | ${row.model_name} | ${row.count} | ${row.mean} | ${row.median} | ${row.min} | ${row.max} | ${row.stdev} | ${row.graph_success_count}/10 | ${row.common_failures || '-'} |`);
  });
  lines.push('');
  lines.push('## 逐站评分');
  lines.push('');
  lines.push('| 站点 | 模型 | L | G | A | V | I | 总分 | 图谱成功 | 证据 |');
  lines.push('|---|---|---:|---:|---:|---:|---:|---:|---|---|');
  for (const record of records) {
    const s = record.scoring.scores;
    lines.push(`| ${record.entry.site_id} | ${record.entry.model_name} | ${s.loading} | ${s.graph} | ${s.articles} | ${s.visual} | ${s.interaction} | ${record.scoring.total} | ${record.scoring.graph_success ? 'yes' : 'no'} | ${record.scoring.evidence.replace(/\|/g, '/')} |`);
  }
  lines.push('');
  lines.push('## 重复分数审计');
  lines.push('');
  if (!duplicates.length) {
    lines.push('没有重复总分。');
  } else {
    lines.push('| 总分 | 数量 | 站点 | 说明 |');
    lines.push('|---:|---:|---|---|');
    for (const group of duplicates) {
      lines.push(`| ${group.score} | ${group.count} | ${group.site_ids.join(', ')} | 已保留逐站证据；前三条例证：${group.evidence_samples.map((item) => item.replace(/\|/g, '/')).join(' / ')} |`);
    }
  }
  lines.push('');
  lines.push('## 产物');
  lines.push('');
  lines.push('- `manifest.json`：冻结的 60 站清单。');
  lines.push('- `raw/*.json`：每站原始 WebBridge/DOM/路由证据。');
  lines.push('- `screenshots/*.png`：每站首页、图谱页、文章列表页截图。');
  lines.push('- `site-scores.csv`：逐站结构化评分。');
  lines.push('- `final-results.json`：最终结构化汇总。');
  fs.writeFileSync(path.join(outDir, 'final-report.md'), `${lines.join('\n')}\n`);
}

function modelOrder(model) {
  return ['deepseek-v4-pro', 'kimi-k2.7-code', 'qwen3.7-max', 'glm-x-preview', 'minimax-m3', 'claude-opus-4-8'].indexOf(model);
}

async function main() {
  ensureDirs();
  const manifest = loadManifest();
  await checkWebBridge();
  let selected = manifest;
  if (onlySite) selected = selected.filter((entry) => entry.site_id === onlySite);
  selected = selected.slice(0, limit);

  if (dryRun) {
    console.log(`dry_run ok manifest_entries=${manifest.length} selected=${selected.length}`);
    console.log(`first=${selected[0]?.site_id || 'none'} last=${selected[selected.length - 1]?.site_id || 'none'}`);
    return;
  }

  const records = [];
  for (let index = 0; index < selected.length; index += 1) {
    const entry = selected[index];
    console.log(`[${index + 1}/${selected.length}] ${entry.site_id} ${entry.model_name}`);
    const record = refreshScreenshots ? await refreshSiteScreenshots(entry) : await auditSite(entry);
    records.push(record);
    console.log(`  total=${record.scoring.total} graph=${record.scoring.scores.graph} evidence=${record.scoring.evidence}`);
  }

  const allRawRecords = fs.readdirSync(rawDir)
    .filter((name) => name.endsWith('.json'))
    .map((name) => JSON.parse(fs.readFileSync(path.join(rawDir, name), 'utf8')))
    .filter((record) => manifest.some((entry) => entry.site_id === record.entry.site_id));

  writeOutputs(allRawRecords);
  console.log(`wrote ${path.join(outDir, 'final-report.md')}`);
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
