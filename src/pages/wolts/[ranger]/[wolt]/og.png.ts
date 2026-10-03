// The share picture of every shared wolt, drawn at build time from the lodge's
// pixel art. A wolt with a hand-made public/wolts/<ranger>/<wolt>/og.png keeps it.
import fs from 'node:fs';
import sharp from 'sharp';
import { loadShare } from '../../../../lib/registry';
import { critters, ogSvg, type Critter } from '../../../../lib/pixels';

export async function getStaticPaths() {
  const { wolts } = await loadShare();
  return wolts
    .filter((wolt) => !fs.existsSync(`public/wolts/${wolt.ranger}/${wolt.name}/og.png`))
    .map((wolt) => ({ params: { ranger: wolt.ranger, wolt: wolt.name }, props: { type: wolt.type } }));
}

export async function GET({ props }: { props: { type: string } }) {
  const critter = props.type in critters ? (props.type as Critter) : undefined;
  const png = await sharp(Buffer.from(ogSvg(critter))).png().toBuffer();
  return new Response(png, { headers: { 'Content-Type': 'image/png' } });
}
