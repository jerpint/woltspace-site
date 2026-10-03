// The share card of a wolt (og:image, 1200x630), drawn at build time. Same
// layout as the first hand-made card (Onboardie's, by uxwolt): the name in
// Preahvihear, then "woltspace" and the tagline under a thin rule, and on the
// right a close-up of the lodge with the wolt's creature on the bank.
// satori lays out the text with the fonts in src/assets/fonts; sharp makes the PNG.
import fs from 'node:fs';
import satori from 'satori';
import sharp from 'sharp';
import { cardSceneSvg, critters, type Critter } from './pixels';

// Read from the project folder: the build runs there (bundling moves this file).
const font = (file: string) => fs.readFileSync(`src/assets/fonts/${file}`);
const fonts = [
  { name: 'Preahvihear', data: font('Preahvihear-Regular.ttf'), weight: 400 as const, style: 'normal' as const },
  { name: 'JetBrains Mono', data: font('JetBrainsMono-Regular.ttf'), weight: 400 as const, style: 'normal' as const },
];

const el = (type: string, style: Record<string, unknown>, children?: unknown, extra: Record<string, unknown> = {}) =>
  ({ type, props: { style, children, ...extra } });

export async function shareCard(name: string, type: string): Promise<Buffer> {
  const critter = type in critters ? (type as Critter) : undefined;
  // The scene is drawn at its final size, so the pixels stay sharp.
  const scene = await sharp(Buffer.from(cardSceneSvg(critter))).png().toBuffer();
  // 104px like the first card; long names get smaller to fit the 556px column
  // (a Preahvihear letter is about 0.6 of the font size wide), but never below
  // 64px: past that they wrap, after a hyphen or at a space.
  const size = Math.max(64, Math.min(104, Math.floor(556 / (0.6 * name.length))));
  const shown = name.replace(/-/g, '-\u200b');
  const card = el('div', { display: 'flex', width: 1200, height: 630, background: '#D5DFE3' }, [
    el('div', { flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '70px 56px 60px 72px' }, [
      el('div', { fontFamily: 'Preahvihear', fontSize: size, lineHeight: 1.05, color: '#18100A', margin: '18px 0 22px', maxWidth: 556 }, shown),
      el('div', { display: 'flex', flexDirection: 'column', gap: 6, borderTop: '2px solid rgba(24,16,10,.15)', paddingTop: 22, maxWidth: 500 }, [
        el('div', { fontFamily: 'Preahvihear', fontSize: 46, lineHeight: 1, color: '#18100A' }, 'woltspace'),
        el('div', { fontFamily: 'JetBrains Mono', fontSize: 28, color: '#C4531E' }, 'gnaw. build. repeat.'),
      ]),
    ]),
    el('img', { width: 516, height: 630 }, undefined, { src: `data:image/png;base64,${scene.toString('base64')}`, width: 516, height: 630 }),
  ]);
  const svg = await satori(card as any, { width: 1200, height: 630, fonts });
  return sharp(Buffer.from(svg)).png().toBuffer();
}
