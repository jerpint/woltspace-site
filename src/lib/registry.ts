// Shared wolts and apps. The registry (registry/<ranger>/<repo>.json) only says
// which seed repos exist; everything shown on a page is read from the seed at
// build time. Nothing is pinned: a page follows its repo, as of the last build.
import fs from 'node:fs';
import path from 'node:path';
import rangerExtras from '../data/rangers.json';
import shortLinkData from '../data/short-links.json';

const REGISTRY_DIR = path.resolve(process.env.REGISTRY_DIR || 'registry');
// Local seed checkouts at <dir>/<owner>/<repo>/, read instead of GitHub when present (tests, offline dev).
const SEED_FIXTURES = process.env.SEED_FIXTURES ? path.resolve(process.env.SEED_FIXTURES) : null;
const fixture = (owner: string, repo: string) => {
  const dir = SEED_FIXTURES ? path.join(SEED_FIXTURES, owner, repo) : null;
  return dir && fs.existsSync(dir) ? dir : null;
};

const SEED_FORMAT = 'woltspace.colony-seed/v1';
// Limits, so one seed cannot flood the site or slow the build for everyone.
const MAX_SEEDS_PER_RANGER = 10;
const MAX_WOLTS_PER_SEED = 25;
const MAX_APPS_PER_SEED = 25;
const MAX_SKILLS_SHOWN = 30;
const MAX_FILE_BYTES = 64 * 1024;
const FETCH_TIMEOUT_MS = 15000;
const LOGIN_RE = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/;
const REPO_RE = /^[A-Za-z0-9._-]{1,100}$/;
const NAME_RE = /^[a-z0-9][a-z0-9_-]{0,63}$/;
const EMOJI: Record<string, string> = { otter: '🦦', beaver: '🦫', raccoon: '🦝', wolf: '🐺', dog: '🐶' };

export interface Ranger { login: string; badge: string | null; verified: boolean; wolts: Wolt[]; apps: App[] }
export interface Seed { ranger: string; repo: string; url: string; gitUrl: string; stars: number | null; updated: string | null }
export interface Wolt {
  ranger: string; name: string; title: string; type: string; emoji: string; role: string; description: string;
  skills: string[]; seed: Seed; verified: boolean; identityUrl: string; treeUrl: string; siblings: string[]; apps: string[];
}
export interface App {
  ranger: string; name: string; emoji: string; description: string; stack: string; start: string;
  keeper: string; distribution: string; sourceUrl: string; seed: Seed; verified: boolean;
}
export interface Share { rangers: Ranger[]; wolts: Wolt[]; apps: App[]; shortLinks: Record<string, Wolt> }

const text = (value: unknown, max: number) => (typeof value === 'string' ? value.trim().slice(0, max) : '');
const title = (name: string) => name.charAt(0).toUpperCase() + name.slice(1);

async function readSeedFile(owner: string, repo: string, file: string): Promise<string | null> {
  const dir = fixture(owner, repo);
  if (dir) {
    const local = path.join(dir, file);
    if (!fs.existsSync(local) || fs.statSync(local).size > MAX_FILE_BYTES) return null;
    return fs.readFileSync(local, 'utf8');
  }
  const response = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/HEAD/${file}`, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  if (response.status === 404) return null;
  // Anything else (GitHub down, rate limit) fails the build, so the last good deploy stays up.
  if (!response.ok) throw new Error(`registry: ${owner}/${repo}/${file} answered ${response.status}`);
  if (Number(response.headers.get('content-length') ?? 0) > MAX_FILE_BYTES) return null;
  const body = await response.text();
  return body.length > MAX_FILE_BYTES ? null : body;
}

async function readSeedJson(owner: string, repo: string, file: string): Promise<any | null> {
  const body = await readSeedFile(owner, repo, file);
  if (body === null) return null;
  try { return JSON.parse(body); } catch { return null; }
}

// Stars and last push are nice to have; a failure here never drops a page.
async function repoFacts(owner: string, repo: string): Promise<{ stars: number | null; updated: string | null }> {
  if (fixture(owner, repo)) return { stars: null, updated: null };
  try {
    const headers: Record<string, string> = { accept: 'application/vnd.github+json' };
    if (process.env.GITHUB_TOKEN) headers.authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
    if (!response.ok) return { stars: null, updated: null };
    const data = await response.json();
    return { stars: data.stargazers_count ?? null, updated: (data.pushed_at || '').slice(0, 10) || null };
  } catch {
    return { stars: null, updated: null };
  }
}

function registryEntries(): { ranger: string; repo: string }[] {
  if (!fs.existsSync(REGISTRY_DIR)) return [];
  const entries = [];
  for (const ranger of fs.readdirSync(REGISTRY_DIR).sort()) {
    const dir = path.join(REGISTRY_DIR, ranger);
    if (!LOGIN_RE.test(ranger) || !fs.statSync(dir).isDirectory()) continue;
    const repos = fs.readdirSync(dir).sort().filter((file) => file.endsWith('.json')).map((file) => file.slice(0, -5)).filter((repo) => REPO_RE.test(repo));
    if (repos.length > MAX_SEEDS_PER_RANGER) console.warn(`registry: ${ranger} has ${repos.length} seeds, showing the first ${MAX_SEEDS_PER_RANGER}`);
    for (const repo of repos.slice(0, MAX_SEEDS_PER_RANGER)) entries.push({ ranger, repo });
  }
  return entries;
}

async function loadSeed(ranger: string, repo: string, verified: boolean): Promise<{ wolts: Wolt[]; apps: App[] }> {
  const skip = (why: string) => { console.warn(`registry: skipping ${ranger}/${repo}: ${why}`); return { wolts: [], apps: [] }; };
  const manifest = await readSeedJson(ranger, repo, 'seed.json');
  if (!manifest) return skip('no readable seed.json');
  if (manifest.format !== SEED_FORMAT) return skip(`unknown seed format ${manifest.format}`);

  const url = `https://github.com/${ranger}/${repo}`;
  const seed: Seed = { ranger, repo, url, gitUrl: `${url}.git`, ...(await repoFacts(ranger, repo)) };
  const named = (list: unknown) => (Array.isArray(list) ? list : []).filter((e: any) => NAME_RE.test(e?.name ?? ''));
  if (named(manifest.wolts).length > MAX_WOLTS_PER_SEED || named(manifest.apps).length > MAX_APPS_PER_SEED) {
    console.warn(`registry: ${ranger}/${repo} is over the limit (${MAX_WOLTS_PER_SEED} wolts, ${MAX_APPS_PER_SEED} apps); showing the first ones`);
  }
  const woltEntries = named(manifest.wolts).slice(0, MAX_WOLTS_PER_SEED);
  const appEntries = named(manifest.apps).slice(0, MAX_APPS_PER_SEED);
  const woltNames: string[] = woltEntries.map((e: any) => e.name);
  const appNames: string[] = appEntries.map((e: any) => e.name);

  const wolts: Wolt[] = [];
  for (const entry of woltEntries) {
    const config = await readSeedJson(ranger, repo, `wolts/${entry.name}/wolt.json`);
    if (!config) { console.warn(`registry: ${ranger}/${repo}: wolt ${entry.name} has no wolt.json`); continue; }
    const type = text(config.type, 20).toLowerCase();
    wolts.push({
      ranger, name: entry.name, title: title(entry.name), type, emoji: EMOJI[type] ?? '',
      role: text(config.role, 80), description: text(config.description, 400),
      skills: (Array.isArray(entry.skills) ? entry.skills : []).filter((s: any) => NAME_RE.test(s ?? '')).slice(0, MAX_SKILLS_SHOWN),
      seed, verified,
      identityUrl: `https://raw.githubusercontent.com/${ranger}/${repo}/HEAD/wolts/${entry.name}/identity.md`,
      treeUrl: `${url}/tree/HEAD/wolts/${entry.name}`,
      siblings: woltNames.filter((n) => n !== entry.name), apps: appNames,
    });
  }

  const apps: App[] = [];
  for (const entry of appEntries) {
    const distribution = entry.distribution === 'git' ? 'git' : 'bundled';
    let appManifest: any = null;
    let sourceUrl = `${url}/tree/HEAD/apps/${entry.name}`;
    if (distribution === 'git') {
      const reference = await readSeedJson(ranger, repo, `apps/${entry.name}/app.json`);
      appManifest = reference?.manifest ?? null;
      if (typeof reference?.url === 'string' && reference.url.startsWith('https://')) sourceUrl = reference.url;
    } else {
      appManifest = await readSeedJson(ranger, repo, `apps/${entry.name}/woltspace.json`);
    }
    if (!appManifest) { console.warn(`registry: ${ranger}/${repo}: app ${entry.name} has no manifest`); continue; }
    apps.push({
      ranger, name: entry.name, emoji: text(appManifest.emoji, 8), description: text(appManifest.description, 400),
      stack: text(appManifest.stack, 40), start: text(appManifest.start, 300),
      keeper: NAME_RE.test(entry.keeper ?? '') ? entry.keeper : '', distribution, sourceUrl, seed, verified,
    });
  }
  return { wolts, apps };
}

async function load(): Promise<Share> {
  const extras = rangerExtras as Record<string, { badge?: string; verified?: boolean }>;
  const rangers = new Map<string, Ranger>();
  for (const { ranger, repo } of registryEntries()) {
    const extra = extras[ranger.toLowerCase()] ?? {};
    if (!rangers.has(ranger)) rangers.set(ranger, { login: ranger, badge: extra.badge ?? null, verified: extra.verified === true, wolts: [], apps: [] });
    const entry = rangers.get(ranger)!;
    const { wolts, apps } = await loadSeed(ranger, repo, entry.verified);
    // A ranger's names are unique across their seeds: first seed (by repo name) wins.
    for (const wolt of wolts) if (!entry.wolts.some((w) => w.name === wolt.name)) entry.wolts.push(wolt);
    for (const app of apps) if (!entry.apps.some((a) => a.name === app.name)) entry.apps.push(app);
  }
  // No page for a ranger whose seeds all failed to load.
  const all = [...rangers.values()].filter((r) => r.wolts.length || r.apps.length);
  const wolts = all.flatMap((r) => r.wolts);
  const shortLinks: Record<string, Wolt> = {};
  for (const [short, target] of Object.entries(shortLinkData as Record<string, string>)) {
    const wolt = wolts.find((w) => `${w.ranger}/${w.name}`.toLowerCase() === target.toLowerCase());
    if (wolt && NAME_RE.test(short)) shortLinks[short] = wolt;
    else console.warn(`registry: short link ${short} points to nothing (${target})`);
  }
  return { rangers: all, wolts, apps: all.flatMap((r) => r.apps), shortLinks };
}

let cached: Promise<Share> | null = null;
export function loadShare(): Promise<Share> {
  return (cached ??= load());
}
