// Checks the registry files. Run: node scripts/check-registry.mjs
// On a pull request, PR_AUTHOR and CHANGED_FILES (one path per line) add the
// ownership rule: you can only add or change files under registry/<your GitHub name>/.
import fs from 'node:fs';
import path from 'node:path';
import { checkEntry, LOGIN_RE, LIMITS } from '../src/lib/profile.mjs';

const MAINTAINERS = ['jerpint', 'woltspace-jerpint[bot]'];
const errors = [];

for (const ranger of fs.existsSync('registry') ? fs.readdirSync('registry') : []) {
  const dir = path.join('registry', ranger);
  if (!fs.statSync(dir).isDirectory()) continue;
  if (!LOGIN_RE.test(ranger)) errors.push(`${dir}: not a GitHub name`);
  const files = fs.readdirSync(dir);
  if (files.filter((f) => f.endsWith('.json')).length > LIMITS.seedsPerRanger) errors.push(`${dir}: at most ${LIMITS.seedsPerRanger} seeds per ranger`);
  for (const file of files) {
    const where = path.join(dir, file);
    if (!file.endsWith('.json')) { errors.push(`${where}: only .json files belong here`); continue; }
    let raw;
    try { raw = JSON.parse(fs.readFileSync(where, 'utf8')); } catch { errors.push(`${where}: not valid JSON`); continue; }
    for (const error of checkEntry(raw, ranger, file.slice(0, -5)).errors) errors.push(`${where}: ${error}`);
  }
}

const author = process.env.PR_AUTHOR;
if (author && !MAINTAINERS.includes(author.toLowerCase())) {
  for (const file of (process.env.CHANGED_FILES || '').split('\n').filter(Boolean)) {
    const parts = file.split('/');
    const own = parts.length === 3 && parts[0] === 'registry' && parts[1].toLowerCase() === author.toLowerCase();
    if (!own) errors.push(`${file}: @${author} can only change registry/${author}/`);
  }
}

if (errors.length) {
  console.error(errors.map((e) => `✗ ${e}`).join('\n'));
  process.exit(1);
}
console.log('registry ok');
