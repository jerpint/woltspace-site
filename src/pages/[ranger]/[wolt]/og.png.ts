// The share card of every shared wolt, drawn at build time (lib/share-card.ts).
import { loadShare } from '../../../lib/registry';
import { shareCard } from '../../../lib/share-card';

export async function getStaticPaths() {
  const { wolts } = await loadShare();
  return wolts.map((wolt) => ({ params: { ranger: wolt.ranger, wolt: wolt.name }, props: { title: wolt.title, type: wolt.type } }));
}

export async function GET({ props }: { props: { title: string; type: string } }) {
  return new Response(await shareCard(props.title, props.type), { headers: { 'Content-Type': 'image/png' } });
}
