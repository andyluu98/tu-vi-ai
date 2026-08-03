import { renderOgImage, OG_SIZE, OG_CONTENT_TYPE, OG_ALT } from '@/lib/og/render-og';

export const runtime = 'nodejs';
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = OG_ALT;

export default function Image() {
  return renderOgImage();
}
