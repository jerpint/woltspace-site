// Checks the registry. Run: node scripts/check-registry.mjs
// On a pull request, PR_AUTHOR and CHANGED_FILES (one path per line) add the
// ownership rule: you can only add or change seeds under registry/<your GitHub name>/.
import fs from 'node:fs';
import path from 'node:path';

const LOGIN_RE = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/;
const REPO_RE = /^[A-Za-z0-9._-]{1,100}$/;
const MAINTAINERS = ['jerpint'];
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
    if (keys.length !== 1 || keys[0] !== 'repo' || typeof entry.repo !== 'string') { errors.push(`${where}: must be exactly {"repo": "<owner>/<repo>"}`); continue; }
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
    if (file === 'src/data/rangers.json' || file === 'src/data/short-links.json') errors.push(`${file}: badges and short links are handed out by Woltspace`);
  }
}

if (errors.length) {
  console.error(errors.map((e) => `✗ ${e}`).join('\n'));
  process.exit(1);
}
console.log('registry ok');
