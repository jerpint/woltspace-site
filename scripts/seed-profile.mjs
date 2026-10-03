// Writes the registry file for a seed: the profiles of the wolts and apps you
// want shown, read from the seed as it is today. Commit the file in a pull
// request. To update the profiles later, run it again and open a new one.
//
//   node scripts/seed-profile.mjs <owner>/<repo> [name ...]
//
// With no names, every wolt and app in the seed is listed (up to the limits).
// Nothing is read from the seed when the site builds; only this file counts.
import fs from 'node:fs';
import path from 'node:path';
import { checkEntry, LOGIN_RE, REPO_RE, NAME_RE, LIMITS } from '../src/lib/profile.mjs';

const SEED_FORMAT = 'woltspace.colony-seed/v1';
const MAX_FILE_BYTES = 64 * 1024;
const FETCH_TIMEOUT_MS = 15000;
const REGISTRY_DIR = path.resolve(process.env.REGISTRY_DIR || 'registry');
// Local seed checkouts at <dir>/<owner>/<repo>/, read instead of GitHub when present (tests, offline).
const SEED_FIXTURES = process.env.SEED_FIXTURES ? path.resolve(process.env.SEED_FIXTURES) : null;

const [target, ...wanted] = process.argv.slice(2);
const [owner, repo] = (target ?? '').split('/');
if (!LOGIN_RE.test(owner ?? '') || !REPO_RE.test(repo ?? '')) {
  console.error('usage: node scripts/seed-profile.mjs <owner>/<repo> [name ...]');
  process.exit(2);
}

async function readFile(file) {
  const local = SEED_FIXTURES && path.join(SEED_FIXTURES, owner, repo, file);
  if (local && fs.existsSync(path.join(SEED_FIXTURES, owner, repo))) {
    return fs.existsSync(local) && fs.statSync(local).size <= MAX_FILE_BYTES ? fs.readFileSync(local, 'utf8') : null;
  }
  const response = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/HEAD/${file}`, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`${owner}/${repo}/${file} answered ${response.status}`);
  const body = await response.text();
  return body.length > MAX_FILE_BYTES ? null : body;
}
async function readJson(file) {
  const body = await readFile(file);
  try { return body === null ? null : JSON.parse(body); } catch { return null; }
}
const text = (value, max) => (typeof value === 'string' ? value.trim().slice(0, max) : '');
const named = (list) => (Array.isArray(list) ? list : []).filter((e) => NAME_RE.test(e?.name ?? ''));
const pick = (entries) => (wanted.length ? entries.filter((e) => wanted.includes(e.name)) : entries);

const manifest = await readJson('seed.json');
if (!manifest || manifest.format !== SEED_FORMAT) {
  console.error(`${owner}/${repo}: no readable ${SEED_FORMAT} seed.json`);
  process.exit(1);
}
const inSeed = [...named(manifest.wolts), ...named(manifest.apps)].map((e) => e.name);
for (const name of wanted) if (!inSeed.includes(name)) console.warn(`${name} is not in the seed`);

const wolts = [];
for (const entry of pick(named(manifest.wolts)).slice(0, LIMITS.woltsPerSeed)) {
  const config = await readJson(`wolts/${entry.name}/wolt.json`);
  if (!config) { console.warn(`wolt ${entry.name} has no wolt.json, left out`); continue; }
  wolts.push({
    name: entry.name, type: text(config.type, 20).toLowerCase(), role: text(config.role, 80), description: text(config.description, 400),
    skills: (Array.isArray(entry.skills) ? entry.skills : []).filter((s) => NAME_RE.test(s ?? '')).slice(0, LIMITS.skills),
  });
}
const apps = [];
for (const entry of pick(named(manifest.apps)).slice(0, LIMITS.appsPerSeed)) {
  const git = entry.distribution === 'git';
  const reference = git ? await readJson(`apps/${entry.name}/app.json`) : null;
  const config = git ? reference?.manifest : await readJson(`apps/${entry.name}/woltspace.json`);
  if (!config) { console.warn(`app ${entry.name} has no manifest, left out`); continue; }
  apps.push({
    name: entry.name, emoji: text(config.emoji, 8), description: text(config.description, 400), stack: text(config.stack, 40), start: text(config.start, 300),
    keeper: NAME_RE.test(entry.keeper ?? '') ? entry.keeper : '', distribution: git ? 'git' : 'bundled',
    sourceUrl: git && /^https:\/\/[^\s"'<>]+$/.test(reference?.url ?? '') ? reference.url : `https://github.com/${owner}/${repo}/tree/HEAD/apps/${entry.name}`,
  });
}

const entry = { repo: `${owner}/${repo}`, wolts, apps };
const { errors } = checkEntry(entry, owner, repo);
if (errors.length) { console.error(errors.map((e) => `✗ ${e}`).join('\n')); process.exit(1); }
const out = path.join(REGISTRY_DIR, owner, `${repo}.json`);
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(entry, null, 2) + '\n');
console.log(`wrote ${path.relative(process.cwd(), out)}: ${wolts.length} wolts, ${apps.length} apps. Read it, then open a pull request.`);
