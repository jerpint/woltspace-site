// Shared wolts and apps. registry/<ranger>/<repo>.json names a seed repo and
// the wolts and apps in it that may be shown; seeds.mjs reads them when the
// site builds. A new wolt appears only when a pull request lists it. Nothing is
// pinned: a listed wolt's page follows its repo, as of the last build.
import rangerExtras from '../data/rangers.json';
import shortLinkData from '../data/short-links.json';
import { readSeeds } from './seeds.mjs';

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

const title = (name: string) => name.charAt(0).toUpperCase() + name.slice(1);

async function load(): Promise<Share> {
  const extras = rangerExtras as Record<string, { badge?: string; verified?: boolean }>;
  const rangers = new Map<string, Ranger>();

  for (const data of await readSeeds()) {
    if (!LOGIN_RE.test(data?.ranger ?? '') || !REPO_RE.test(data?.repo ?? '')) continue;
    const { ranger, repo } = data;
    const extra = extras[ranger.toLowerCase()] ?? {};
    if (!rangers.has(ranger)) rangers.set(ranger, { login: ranger, badge: extra.badge ?? null, verified: extra.verified === true, wolts: [], apps: [] });
    const entry = rangers.get(ranger)!;
    const url = `https://github.com/${ranger}/${repo}`;
    const seed: Seed = { ranger, repo, url, gitUrl: `${url}.git`, stars: data.stars ?? null, updated: data.updated ?? null };
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

let cached: Promise<Share> | null = null;
export function loadShare(): Promise<Share> {
  return (cached ??= load());
}
