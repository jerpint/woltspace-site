// Reads the seeds named in registry/ when the site builds. Only the wolts and
// apps a registry file lists are read: a new wolt appears when a pull request
// adds its name, never on its own.
//
// A seed that is gone (404), too big or malformed is left out. Any other
// failure (GitHub down, rate limit) fails the build, so the live site stays as it was.
import fs from 'node:fs';
import path from 'node:path';

const REGISTRY_DIR = path.resolve(process.env.REGISTRY_DIR || 'registry');
// Local seed checkouts at <dir>/<owner>/<repo>/, read instead of GitHub when present (tests, offline dev).
const SEED_FIXTURES = process.env.SEED_FIXTURES ? path.resolve(process.env.SEED_FIXTURES) : null;
const fixture = (owner, repo) => {
  const dir = SEED_FIXTURES ? path.join(SEED_FIXTURES, owner, repo) : null;
  return dir && fs.existsSync(dir) ? dir : null;
};

const SEED_FORMAT = 'woltspace.colony-seed/v1';
// Limits, so one ranger cannot flood the site.
const MAX_SEEDS_PER_RANGER = 10;
const MAX_WOLTS_PER_SEED = 25;
const MAX_APPS_PER_SEED = 25;
const MAX_SKILLS_SHOWN = 30;
const MAX_FILE_BYTES = 64 * 1024;
const FETCH_TIMEOUT_MS = 15000;
const LOGIN_RE = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/;
const REPO_RE = /^[A-Za-z0-9._-]{1,100}$/;
const NAME_RE = /^[a-z0-9][a-z0-9_-]{0,63}$/;

const text = (value, max) => (typeof value === 'string' ? value.trim().slice(0, max) : '');
const named = (list) => (Array.isArray(list) ? list : []).filter((e) => NAME_RE.test(e?.name ?? ''));

async function readSeedFile(owner, repo, file) {
  const dir = fixture(owner, repo);
  if (dir) {
    const local = path.join(dir, file);
    if (!fs.existsSync(local) || fs.statSync(local).size > MAX_FILE_BYTES) return null;
    return fs.readFileSync(local, 'utf8');
  }
  const response = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/HEAD/${file}`, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`${owner}/${repo}/${file} answered ${response.status}`);
  if (Number(response.headers.get('content-length') ?? 0) > MAX_FILE_BYTES) return null;
  const body = await response.text();
  return body.length > MAX_FILE_BYTES ? null : body;
}

async function readSeedJson(owner, repo, file) {
  const body = await readSeedFile(owner, repo, file);
  if (body === null) return null;
  try { return JSON.parse(body); } catch { return null; }
}

// Stars and last push are nice to have; a failure here never drops a seed.
async function repoFacts(owner, repo) {
  if (fixture(owner, repo)) return { stars: null, updated: null };
  try {
    const headers = { accept: 'application/vnd.github+json' };
    if (process.env.GITHUB_TOKEN) headers.authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
    if (!response.ok) return { stars: null, updated: null };
    const data = await response.json();
    return { stars: data.stargazers_count ?? null, updated: (data.pushed_at || '').slice(0, 10) || null };
  } catch {
    return { stars: null, updated: null };
  }
}

const listed = (value, max) => (Array.isArray(value) ? value.filter((name) => NAME_RE.test(name ?? '')).slice(0, max) : []);

function registryEntries() {
  if (!fs.existsSync(REGISTRY_DIR)) return [];
  const entries = [];
  for (const ranger of fs.readdirSync(REGISTRY_DIR).sort()) {
    const dir = path.join(REGISTRY_DIR, ranger);
    if (!LOGIN_RE.test(ranger) || !fs.statSync(dir).isDirectory()) continue;
    const repos = fs.readdirSync(dir).sort().filter((file) => file.endsWith('.json')).map((file) => file.slice(0, -5)).filter((repo) => REPO_RE.test(repo));
    if (repos.length > MAX_SEEDS_PER_RANGER) console.warn(`${ranger} has ${repos.length} seeds, keeping the first ${MAX_SEEDS_PER_RANGER}`);
    for (const repo of repos.slice(0, MAX_SEEDS_PER_RANGER)) {
      let entry = {};
      try { entry = JSON.parse(fs.readFileSync(path.join(dir, `${repo}.json`), 'utf8')); } catch { console.warn(`registry/${ranger}/${repo}.json is not valid JSON`); continue; }
      entries.push({ ranger, repo, wolts: listed(entry.wolts, MAX_WOLTS_PER_SEED), apps: listed(entry.apps, MAX_APPS_PER_SEED) });
    }
  }
  return entries;
}

async function readSeed({ ranger, repo, wolts: allowedWolts, apps: allowedApps }) {
  const skip = (why) => { console.warn(`skipping ${ranger}/${repo}: ${why}`); return null; };
  const manifest = await readSeedJson(ranger, repo, 'seed.json');
  if (!manifest) return skip('no readable seed.json');
  if (manifest.format !== SEED_FORMAT) return skip(`unknown seed format ${manifest.format}`);
  // Only what the registry lists. Something in the seed but not listed waits for a pull request.
  const inSeed = (list, allowed, kind) => {
    const entries = named(list);
    for (const name of allowed) if (!entries.some((e) => e.name === name)) console.warn(`${ranger}/${repo}: listed ${kind} ${name} is not in the seed`);
    return entries.filter((e) => allowed.includes(e.name));
  };

  const wolts = [];
  for (const entry of inSeed(manifest.wolts, allowedWolts, 'wolt')) {
    const config = await readSeedJson(ranger, repo, `wolts/${entry.name}/wolt.json`);
    if (!config) { console.warn(`${ranger}/${repo}: wolt ${entry.name} has no wolt.json`); continue; }
    wolts.push({
      name: entry.name, type: text(config.type, 20).toLowerCase(), role: text(config.role, 80), description: text(config.description, 400),
      skills: (Array.isArray(entry.skills) ? entry.skills : []).filter((s) => NAME_RE.test(s ?? '')).slice(0, MAX_SKILLS_SHOWN),
    });
  }

  const apps = [];
  for (const entry of inSeed(manifest.apps, allowedApps, 'app')) {
    const distribution = entry.distribution === 'git' ? 'git' : 'bundled';
    let appManifest = null;
    let sourceUrl = `https://github.com/${ranger}/${repo}/tree/HEAD/apps/${entry.name}`;
    if (distribution === 'git') {
      const reference = await readSeedJson(ranger, repo, `apps/${entry.name}/app.json`);
      appManifest = reference?.manifest ?? null;
      if (typeof reference?.url === 'string' && /^https:\/\/[^\s"'<>]+$/.test(reference.url)) sourceUrl = reference.url;
    } else {
      appManifest = await readSeedJson(ranger, repo, `apps/${entry.name}/woltspace.json`);
    }
    if (!appManifest) { console.warn(`${ranger}/${repo}: app ${entry.name} has no manifest`); continue; }
    apps.push({
      name: entry.name, emoji: text(appManifest.emoji, 8), description: text(appManifest.description, 400),
      stack: text(appManifest.stack, 40), start: text(appManifest.start, 300),
      keeper: NAME_RE.test(entry.keeper ?? '') ? entry.keeper : '', distribution, sourceUrl,
    });
  }
  if (!wolts.length && !apps.length) return skip('nothing to show');
  return { ranger, repo, ...(await repoFacts(ranger, repo)), wolts, apps };
}

export async function readSeeds() {
  const seeds = [];
  for (const entry of registryEntries()) {
    const seed = await readSeed(entry);
    if (seed) seeds.push(seed);
  }
  return seeds;
}
