// Shared wolts and apps. Each registry/<ranger>/<repo>.json holds the profiles
// of the wolts and apps shown from that seed, exactly as merged. The build
// reads only those files: an edit in someone's repo changes nothing here until
// a pull request brings it in. Only GitHub stars are fetched at build time.
import fs from 'node:fs';
import path from 'node:path';
import rangerExtras from '../data/rangers.json';
import shortLinkData from '../data/short-links.json';
import { checkEntry, LOGIN_RE, REPO_RE, NAME_RE, LIMITS } from './profile.mjs';

const REGISTRY_DIR = path.resolve(process.env.REGISTRY_DIR || 'registry');
const EMOJI: Record<string, string> = { otter: '🦦', beaver: '🦫', raccoon: '🦝', wolf: '🐺', dog: '🐶' };

export interface Ranger { login: string; badge: string | null; verified: boolean; wolts: Wolt[]; apps: App[] }
export interface Seed { ranger: string; repo: string; url: string; gitUrl: string; stars: number | null }
export interface Wolt {
  ranger: string; name: string; title: string; type: string; emoji: string; role: string; description: string;
  skills: string[]; seed: Seed; verified: boolean; identityUrl: string; treeUrl: string; siblings: string[]; apps: string[];
}
export interface App {
  ranger: string; name: string; emoji: string; description: string; stack: string; start: string;
  keeper: string; distribution: string; sourceUrl: string; seed: Seed; verified: boolean;
}
export interface Share { rangers: Ranger[]; wolts: Wolt[]; apps: App[]; shortLinks: Record<string, Wolt> }

const title = (name: string) => name.charAt(0).toUpperCase() + name.slice(1);

// Stars are the one live number; a failure here never drops a page.
async function stars(owner: string, repo: string): Promise<number | null> {
  if (process.env.SEED_FIXTURES) return null;
  try {
    const headers: Record<string, string> = { accept: 'application/vnd.github+json' };
    if (process.env.GITHUB_TOKEN) headers.authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers, signal: AbortSignal.timeout(15000) });
    return response.ok ? (await response.json()).stargazers_count ?? null : null;
  } catch {
    return null;
  }
}

function registryFiles(): { ranger: string; repo: string; raw: unknown }[] {
  if (!fs.existsSync(REGISTRY_DIR)) return [];
  const out = [];
  for (const ranger of fs.readdirSync(REGISTRY_DIR).sort()) {
    const dir = path.join(REGISTRY_DIR, ranger);
    if (!LOGIN_RE.test(ranger) || !fs.statSync(dir).isDirectory()) continue;
    const repos = fs.readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5)).filter((r) => REPO_RE.test(r)).sort();
    for (const repo of repos.slice(0, LIMITS.seedsPerRanger)) {
      try { out.push({ ranger, repo, raw: JSON.parse(fs.readFileSync(path.join(dir, `${repo}.json`), 'utf8')) }); }
      catch { console.warn(`registry: ${ranger}/${repo}.json is not valid JSON, skipped`); }
    }
  }
  return out;
}

async function load(): Promise<Share> {
  const extras = rangerExtras as Record<string, { badge?: string; verified?: boolean }>;
  const rangers = new Map<string, Ranger>();

  for (const { ranger, repo, raw } of registryFiles()) {
    const { entry: data, errors } = checkEntry(raw, ranger, repo);
    for (const error of errors) console.warn(`registry: ${ranger}/${repo}: ${error}`);
    if (!data.repo) continue;
    const extra = extras[ranger.toLowerCase()] ?? {};
    if (!rangers.has(ranger)) rangers.set(ranger, { login: ranger, badge: extra.badge ?? null, verified: extra.verified === true, wolts: [], apps: [] });
    const entry = rangers.get(ranger)!;
    const url = `https://github.com/${ranger}/${repo}`;
    const seed: Seed = { ranger, repo, url, gitUrl: `${url}.git`, stars: await stars(ranger, repo) };
    const woltData = (data.wolts ?? []).filter((w: any) => NAME_RE.test(w?.name ?? ''));
    const appData = (data.apps ?? []).filter((a: any) => NAME_RE.test(a?.name ?? ''));
    const woltNames: string[] = woltData.map((w: any) => w.name);
    const appNames: string[] = appData.map((a: any) => a.name);

    // A ranger's names are unique across their seeds: first seed (by repo name) wins.
    for (const w of woltData) {
      if (entry.wolts.some((existing) => existing.name === w.name)) continue;
      entry.wolts.push({
        ranger, name: w.name, title: title(w.name), type: w.type ?? '', emoji: EMOJI[w.type] ?? '',
        role: w.role ?? '', description: w.description ?? '', skills: w.skills ?? [], seed, verified: entry.verified,
        identityUrl: `https://raw.githubusercontent.com/${ranger}/${repo}/HEAD/wolts/${w.name}/identity.md`,
        treeUrl: `${url}/tree/HEAD/wolts/${w.name}`,
        siblings: woltNames.filter((n) => n !== w.name), apps: appNames,
      });
    }
    for (const a of appData) {
      if (entry.apps.some((existing) => existing.name === a.name)) continue;
      entry.apps.push({
        ranger, name: a.name, emoji: a.emoji ?? '', description: a.description ?? '', stack: a.stack ?? '', start: a.start ?? '',
        keeper: a.keeper ?? '', distribution: a.distribution ?? 'bundled',
        sourceUrl: typeof a.sourceUrl === 'string' && a.sourceUrl.startsWith('https://') ? a.sourceUrl : url,
        seed, verified: entry.verified,
      });
    }
  }

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

// Who a GitHub name is here: badge, verified, and whether they have a ranger page.
// Works for anyone, including someone who has shared nothing yet.
export async function rangerOf(login: string): Promise<{ login: string; badge: string | null; verified: boolean; hasPage: boolean }> {
  const { rangers } = await loadShare();
  const found = rangers.find((r) => r.login.toLowerCase() === login.toLowerCase());
  const extra = (rangerExtras as Record<string, { badge?: string; verified?: boolean }>)[login.toLowerCase()] ?? {};
  return { login: found?.login ?? login, badge: extra.badge ?? null, verified: extra.verified === true, hasPage: Boolean(found) };
}

let cached: Promise<Share> | null = null;
export function loadShare(): Promise<Share> {
  return (cached ??= load());
}
