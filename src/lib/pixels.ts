// The lodge's pixel art, drawn at build time: the landscape from the home page
// (same maths and colours as Landing.astro), its clouds and its critters.

const S = 5, H = 42, BANK = 28, RIVER = 34;
export const SCENE = { rows: H, bank: BANK };
const C = { sky: '#B8D4E8', fa: '#8AA6BA', fb: '#6A8698', na: '#3E5A32', nb: '#293E20', ta: '#3A7030', tb: '#2A5225', tc: '#1A3A18', tt: '#4A2810', ga: '#72B855', gb: '#4A8838', gc: '#2A5A1A', ea: '#5A4020', eb: '#3A2810', rc: '#2A7AAA', rd: '#1A5888', ba: '#3A7030' };

const rect = (x: number, y: number, w: number, h: number, fill: string) =>
  `<rect x="${x * S}" y="${y * S}" width="${w * S}" height="${h * S}" fill="${fill}"/>`;

// One wide strip. Shown at full height and repeated sideways on very wide screens.
export function sceneSvg(W = 520): string {
  const fp: number[] = [], np: number[] = [];
  for (let x = 0; x < W; x++) {
    fp[x] = Math.round(7 + 5 * Math.sin(x * 0.05 + 0.3) + 3 * Math.sin(x * 0.12 + 1.7) + 1.5 * Math.sin(x * 0.04 + 0.9));
    np[x] = Math.round(6 + 6 * Math.sin(x * 0.08 + 1.0) + 3.5 * Math.sin(x * 0.16 + 0.5) + 1.5 * Math.sin(x * 0.22 + 2.4));
  }
  const out = [rect(0, 0, W, BANK, C.sky)];
  for (let x = 0; x < W; x++) {
    const ft = Math.max(BANK - 16 - fp[x], 0);
    out.push(rect(x, ft, 1, 1, C.fb), rect(x, ft + 1, 1, BANK - ft - 1, C.fa));
  }
  for (let x = 0; x < W; x++) {
    const nt = Math.max(BANK - 2 - np[x], 1);
    if (nt < BANK) out.push(rect(x, nt, 1, 1, C.nb), rect(x, nt + 1, 1, BANK - nt - 1, C.na));
  }
  out.push(rect(0, BANK, W, 1, C.ga), rect(0, BANK + 1, W, 1, C.gb), rect(0, BANK + 2, W, 1, C.gc), rect(0, BANK + 3, W, 1, C.ea), rect(0, BANK + 4, W, RIVER - BANK - 4, C.eb));
  out.push(rect(0, RIVER, W, 1, C.ba), rect(0, RIVER + 1, W, 2, C.rc), rect(0, RIVER + 3, W, H - RIVER - 3, C.rd));
  const tree = (cx: number, baseY: number, h: number) => {
    for (let dy = 0; dy < h; dy++) {
      const hw = Math.floor((dy + 1) * 0.55), tc = dy < 2 ? C.ta : dy < h - 2 ? C.tb : C.tc;
      const from = Math.max(cx - hw, 0), to = Math.min(cx + hw, W - 1);
      out.push(rect(from, baseY - h + 1 + dy, to - from + 1, 1, tc));
    }
    out.push(rect(cx, baseY + 1, 1, 2, C.tt));
  };
  let tx = 3;
  while (tx < W - 3) {
    const nt2 = BANK - 2 - np[tx];
    if (nt2 < BANK - 7) tree(tx, nt2 + Math.floor(np[tx] * 0.55), 5 + ((tx * 7) % 4));
    tx += 7 + ((tx * 13 + 5) % 5);
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W * S} ${H * S}" width="${W * S}" height="${H * S}" shape-rendering="crispEdges">${out.join('')}</svg>`;
}

function sprite(map: string[], palette: Record<string, string>): { svg: string; cols: number; rows: number } {
  const rows = map.length, cols = Math.max(...map.map((r) => r.length));
  const rects: string[] = [];
  map.forEach((row, r) => [...row].forEach((ch, c) => {
    if (palette[ch]) rects.push(`<rect x="${c}" y="${r}" width="1" height="1" fill="${palette[ch]}"/>`);
  }));
  return { svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${cols} ${rows}" shape-rendering="crispEdges" aria-hidden="true">${rects.join('')}</svg>`, cols, rows };
}

const beaver = sprite([
  '..AAA........AAA.....', '.ABBBA......ABBBA....', '.ABAAAAAAAAAAAABA....', '.ABABBBBBBBBBAABA....', '..ABBBBBBBBBBBAA.....', '..ABABBBBAEBBBAA.....',
  '..ABABBBBAEBBBAA.....', '.ABBAAAABAEBBBBA.....', '.ABACAACCCFABBBA.....', '.ABACCACCCFABBBA.AAA.', '.ABBAAAAAAEBBBAAADDDA', '..ABBCAFABBBBAA.AADDA',
  '...ABAAAABBBBBBAADADA', '..ABBBBBBBBBBBBAADDAA', '.ABBABCCCAEBBBBBAADDA', '.ABBACCCABBBBABBADADA', '.AGGACCCAGGGGABBADADA', '..AAACCCAAAAABBBADDA.',
  '..ABCCCCCCFABBBBAAAA.', '.AAABCCCCAAAABBBAA...', 'ABBBACCCABBBBBBAA....', 'AAAAAAAAAAAAAAAA.....',
], { A: '#3f190e', B: '#af6127', C: '#fce6b0', D: '#773c1f', E: '#050003', F: '#fffee7', G: '#dd7a2d' });

const raccoon = sprite([
  '...BB........BBB.........', '...BFGG.....GFFB.........', '...BABB.....BAAB.........', '...BCAABBBBBACCB.........', '...BAAAAAAAAAAAB.........',
  '...BCCCCAAACCCCB.........', '...BCBCCAAACCCCB.........', '.BBCCBBCBCCCBCBCB........', '.BBACBBCAAACBCCAB........', '.BBCAAADHHHDAAACB...BBB..',
  '.BBCAAADHHHDAAACB...BBB..', '...BCAADDDDDAEEB...BCCCB.', '....BCCCCEEECBB....BAAACB', '...BAAAAAAAAAAAB...BCCCBB', '...BAAAAAAAAAAAB...BCCCCB',
  '.BBAAAAAAAAAAAAAB..BAAAAB', '.BBAABBAAAAABAAAB..BCCCCB', '.BBAAAABAAABAAAABBBAACCCB', '.GGFAAABAAABAAAAGBBAABBCG', 'BAABAAABAAABAAABABBCAAAB.',
  'BAAABBBBAAABBBBAABBCCBB..', 'BCCAAAAAAAAAAAAACBBBB....', '.BBBBGGAAAAAGBBBB........', '.BBCCBBAAAAABCCCB........', '...BBBBBBBBBBBBB.........',
], { A: '#7f8894', B: '#282c33', C: '#40454b', D: '#f0ecf0', E: '#545c65', F: '#a0abbd', G: '#050029', H: '#efa09f' });

const otter = sprite([
  '.....AAAAAAAA......', '..AAACCCCCCCCAAA...', '.ACCCCCCCCCCCCCCA..', '.ACACCCCCCCCCCACA..', '..ACCBACCCCBACCA...', '..ACCAACDDCAACCA...',
  'AAACBBBBAABBBBCAAA.', '..ABEBABAABABEBA...', '.AAABBBABBABBBAAA..', '...AABBBBBBBBAA....', '...ACCCCCCCCCCA....', '..ACCCCBBBBCCCCA...',
  '..ACCABBBBBBACCA...', '..ACCCABBBBACCCA...', '..AACCABBBBACCAA.AA', '..ACAABBBBBBAACAACA', '.ACCCBBBBBBBBCCCACA', '.ACAAABBBBBBAAACAA.',
  '.ACCCCABBBBACCCCA..', '..ACCCAAAAAACCCA...', '...AAA......AAA....',
], { A: '#402110', B: '#f2d79d', C: '#9f5332', D: '#ff6970', E: '#c47b4a' });

export const critters = { beaver, raccoon, otter };
export type Critter = keyof typeof critters;

const cloudPalette = { O: '#8898A8', w: '#E0E8EE', W: '#F8FCFF', s: '#BCC8D0' };
export const clouds = [
  sprite(['......OOOO...OOOO.......', '.....OwwWwOOOwwWwO......', '....OwWWWWwOwWWWWwO.....', '...OOwWWWWWwwWWWWWwOO...', '..OwwWWWWWWWWWWWWWWwO...', '..OwWWWWWWWWWWWWWWWWwO..', '..OwwWWWWWWWWWWWWWWwwO..', '..OssssssssssssssssssO..', '...OOOOOOOOOOOOOOOOOO...'], cloudPalette),
  sprite(['....OOO...OOO......', '...OwWwOOOwWwO.....', '..OwWWWwOwWWWwO....', '.OOwWWWWwwWWWWwOO..', '.OwwWWWWWWWWWWWwO..', '.OwWWWWWWWWWWWWwO..', '.OwwWWWWWWWWWWwwO..', '.OssssssssssssssO..', '..OOOOOOOOOOOOOO...'], cloudPalette),
  sprite(['...OOO..OOO....', '..OwWwOOwWwO...', '.OwWWWwwWWWwO..', '.OwwWWWWWWwwO..', '.OwWWWWWWWWwO..', '.OwwWWWWWWwwO..', '.OssssssssssO..', '..OOOOOOOOOO...'], cloudPalette),
];

// The right-hand art of a share card (516x630): a close-up of the landscape
// with the critter (if we draw that creature) on the bank. Scene and critter
// share one grid, 15px per pixel (the landscape's 42 rows fill the 630px), and
// a few highlights sparkle on the river. Drawn as rects at the final size, so it
// stays crisp without scaling.
export function cardSceneSvg(critter?: Critter, firstCol = 90): string {
  const width = 516, height = 630, px = height / H, cols = Math.ceil(width / px);
  const view = `${firstCol * S} 0 ${(width / px) * S} ${H * S}`;
  const scene = sceneSvg(firstCol + cols)
    .replace(/^<svg([^>]*)>/, (_, attrs: string) => `<svg${attrs.replace(/\s(width|height|viewBox)="[^"]*"/g, '')} viewBox="${view}" width="${width}" height="${height}">`);
  const sparkles = [[3, RIVER + 1], [9, RIVER + 2], [16, RIVER + 1], [22, RIVER + 2], [28, RIVER + 1], [6, RIVER + 4], [19, RIVER + 4], [31, RIVER + 3]]
    .map(([x, y]) => `<rect x="${x * px}" y="${y * px}" width="${px}" height="${px}" fill="#9CCBE6"/>`).join('');
  let who = '';
  if (critter && critters[critter]) {
    const { svg, cols: w, rows: h } = critters[critter];
    // Feet two pixels into the bank, a little left of centre.
    who = svg.replace(/^<svg([^>]*)>/, (_, attrs: string) => `<svg${attrs} x="${8 * px}" y="${(BANK + 2 - h) * px}" width="${w * px}" height="${h * px}">`);
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" shape-rendering="crispEdges">${scene}${sparkles}${who}</svg>`;
}
