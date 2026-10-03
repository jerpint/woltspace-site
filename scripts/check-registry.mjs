// Checks the registry files. Run: node scripts/check-registry.mjs
// On a pull request, PR_AUTHOR and CHANGED_FILES (one path per line) add the
// ownership rule: you can only add or change seeds under registry/<your GitHub name>/.
import fs from 'node:fs';
import path from 'node:path';

const LOGIN_RE = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/;
const REPO_RE = /^[A-Za-z0-9._-]{1,100}$/;
const NAME_RE = /^[a-z0-9][a-z0-9_-]{0,63}$/;
const MAX_LISTED = 25;
const MAINTAINERS = ['jerpint', 'woltspace-jerpint[bot]'];
const errors = [];

for (const ranger of fs.existsSync('registry') ? fs.readdirSync('registry') : []) {
  const dir = path.join('registry', ranger);
  if (!fs.statSync(dir).isDirectory()) continue;
  if (!LOGIN_RE.test(ranger)) errors.push(`${dir}: not a GitHub name`);
  for (const file of fs.readdirSync(dir)) {
    const where = path.join(dir, file);
    if (!file.endsWith('.json')) { errors.push(`${where}: only .json files belong here`); continue; }
    let entry;
    try { entry = JSON.parse(fs.readFileSync(where, 'utf8')); } catch { errors.push(`${where}: not valid JSON`); continue; }
    const keys = Object.keys(entry);
    if (typeof entry.repo !== 'string' || keys.some((k) => !['repo', 'wolts', 'apps'].includes(k))) { errors.push(`${where}: must look like {"repo": "<owner>/<repo>", "wolts": [...], "apps": [...]}`); continue; }
    for (const kind of ['wolts', 'apps']) {
      const names = entry[kind] ?? [];
      if (!Array.isArray(names) || names.some((n) => typeof n !== 'string' || !NAME_RE.test(n))) errors.push(`${where}: "${kind}" must be a list of seed names (lowercase, digits, - and _)`);
      else if (names.length > MAX_LISTED) errors.push(`${where}: at most ${MAX_LISTED} ${kind} per seed`);
      else if (new Set(names).size !== names.length) errors.push(`${where}: "${kind}" lists a name twice`);
    }
    if (!(entry.wolts ?? []).length && !(entry.apps ?? []).length) errors.push(`${where}: list at least one wolt or app`);
    const [owner, repo, extra] = entry.repo.split('/');
    if (extra !== undefined || !REPO_RE.test(repo ?? '')) errors.push(`${where}: repo must look like owner/repo`);
    if (owner !== ranger) errors.push(`${where}: repo owner "${owner}" must be the folder name "${ranger}"`);
    if (`${repo}.json` !== file) errors.push(`${where}: file must be named ${repo}.json`);
  }
}

const author = process.env.PR_AUTHOR;
if (author && !MAINTAINERS.includes(author.toLowerCase())) {
  for (const file of (process.env.CHANGED_FILES || '').split('\n').filter(Boolean)) {
    const parts = file.split('/');
    const own = parts[0] === 'registry' && parts.length === 3 && parts[1].toLowerCase() === author.toLowerCase();
    if (parts[0] === 'registry' && parts[1] !== 'README.md' && !own) errors.push(`${file}: @${author} can only change registry/${author}/`);
    if (parts[0] === 'registry' && parts[1] === 'README.md') errors.push(`${file}: only maintainers change this file`);
    if (file.startsWith('src/data/')) errors.push(`${file}: badges and short links are handed out by Woltspace`);
  }
}

if (errors.length) {
  console.error(errors.map((e) => `✗ ${e}`).join('\n'));
  process.exit(1);
}
console.log('registry ok');
