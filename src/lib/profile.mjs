// The shape of a registry file, checked the same way by the site build and by
// scripts/check-registry.mjs. A registry file holds the profiles exactly as
// they will be shown: what is merged is what is published.
//
// {
//   "repo": "owner/repo",
//   "wolts": [{ "name", "type", "role", "description", "skills": [] }],
//   "apps":  [{ "name", "emoji", "description", "stack", "start", "keeper", "distribution", "sourceUrl" }]
// }

export const LOGIN_RE = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/;
export const REPO_RE = /^[A-Za-z0-9._-]{1,100}$/;
export const NAME_RE = /^[a-z0-9][a-z0-9_-]{0,63}$/;
export const LIMITS = { seedsPerRanger: 10, woltsPerSeed: 25, appsPerSeed: 25, skills: 30 };
const TEXT = { type: 20, role: 80, description: 400, emoji: 8, stack: 40, start: 300, keeper: 64, distribution: 10, sourceUrl: 300 };
const TYPES = ['otter', 'beaver', 'raccoon', 'wolf', 'dog'];

// Returns { entry, errors }. `entry` keeps only what is valid, so the build can
// still use a file that the check would reject.
export function checkEntry(raw, ranger, repoFromFile) {
  const errors = [];
  const entry = { repo: '', wolts: [], apps: [] };
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { entry, errors: ['must be a JSON object'] };
  for (const key of Object.keys(raw)) if (!['repo', 'wolts', 'apps'].includes(key)) errors.push(`unknown key "${key}"`);

  const [owner, repo, extra] = typeof raw.repo === 'string' ? raw.repo.split('/') : [];
  if (extra !== undefined || !LOGIN_RE.test(owner ?? '') || !REPO_RE.test(repo ?? '')) errors.push('"repo" must look like owner/repo');
  else if (owner !== ranger) errors.push(`repo owner "${owner}" must be the folder name "${ranger}"`);
  else if (repo !== repoFromFile) errors.push(`file must be named ${repo}.json`);
  else entry.repo = raw.repo;

  const text = (where, field, value, required = false) => {
    if (value === undefined || value === '') { if (required) errors.push(`${where}: "${field}" is missing`); return ''; }
    if (typeof value !== 'string') { errors.push(`${where}: "${field}" must be text`); return ''; }
    if (value.length > TEXT[field]) errors.push(`${where}: "${field}" is longer than ${TEXT[field]} characters`);
    return value.trim().slice(0, TEXT[field]);
  };
  const list = (kind, max, fields) => {
    const items = raw[kind] ?? [];
    if (!Array.isArray(items)) { errors.push(`"${kind}" must be a list`); return []; }
    if (items.length > max) errors.push(`at most ${max} ${kind} per seed`);
    const seen = new Set();
    const out = [];
    for (const item of items.slice(0, max)) {
      const name = item?.name;
      if (typeof name !== 'string' || !NAME_RE.test(name)) { errors.push(`${kind}: "${name}" is not a valid name`); continue; }
      if (seen.has(name)) { errors.push(`${kind}: ${name} is listed twice`); continue; }
      seen.add(name);
      for (const key of Object.keys(item)) if (key !== 'name' && key !== 'skills' && !fields.includes(key)) errors.push(`${kind} ${name}: unknown key "${key}"`);
      out.push({ name, ...Object.fromEntries(fields.map((f) => [f, text(`${kind} ${name}`, f, item[f], f === 'description')])), item });
    }
    return out;
  };

  entry.wolts = list('wolts', LIMITS.woltsPerSeed, ['type', 'role', 'description']).map(({ item, ...wolt }) => {
    if (wolt.type && !TYPES.includes(wolt.type)) errors.push(`wolts ${wolt.name}: unknown creature "${wolt.type}"`);
    const skills = Array.isArray(item.skills) ? item.skills : [];
    if (item.skills !== undefined && (!Array.isArray(item.skills) || skills.some((s) => typeof s !== 'string' || !NAME_RE.test(s)))) errors.push(`wolts ${wolt.name}: "skills" must be a list of skill names`);
    return { ...wolt, type: TYPES.includes(wolt.type) ? wolt.type : '', skills: skills.filter((s) => typeof s === 'string' && NAME_RE.test(s)).slice(0, LIMITS.skills) };
  });
  entry.apps = list('apps', LIMITS.appsPerSeed, ['emoji', 'description', 'stack', 'start', 'keeper', 'distribution', 'sourceUrl']).map(({ item, ...app }) => {
    if (app.keeper && !NAME_RE.test(app.keeper)) { errors.push(`apps ${app.name}: "keeper" is not a valid name`); app.keeper = ''; }
    if (app.sourceUrl && !/^https:\/\/[^\s"'<>]+$/.test(app.sourceUrl)) { errors.push(`apps ${app.name}: "sourceUrl" must be an https link`); app.sourceUrl = ''; }
    return { ...app, distribution: app.distribution === 'git' ? 'git' : 'bundled' };
  });
  if (!entry.wolts.length && !entry.apps.length && !errors.length) errors.push('list at least one wolt or app');
  return { entry, errors };
}
