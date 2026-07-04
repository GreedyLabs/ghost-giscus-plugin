import { LOCALES, ORIGIN } from '../lib/site';

export const dynamic = 'force-static';

export default function sitemap() {
  return [
    { url: `${ORIGIN}/`, changeFrequency: 'monthly', priority: 1.0 },
    ...LOCALES.map((l) => ({ url: `${ORIGIN}/${l}/`, changeFrequency: 'monthly', priority: 0.8 }))
  ];
}
