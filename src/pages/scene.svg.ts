// The landscape strip behind the page banner, as one cacheable file.
import { sceneSvg } from '../lib/pixels';

export const GET = () => new Response(sceneSvg(), { headers: { 'Content-Type': 'image/svg+xml' } });
