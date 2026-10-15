import { list } from '@vercel/blob';

// Отдаёт всем посетителям актуальные ссылки: { "logo": url, "video": url, "photo-0": url, ... }
export default async function handler(req, res) {
  try {
    const latest = {};
    let cursor;
    do {
      const page = await list({ prefix: 'media/', cursor, limit: 1000 });
      for (const b of page.blobs) {
        const m = /^media\/([^/]+)\//.exec(b.pathname);
        if (!m) continue;
        const k = m[1];
        if (!latest[k] || new Date(b.uploadedAt) > new Date(latest[k].uploadedAt)) latest[k] = b;
      }
      cursor = page.hasMore ? page.cursor : undefined;
    } while (cursor);

    const out = {};
    for (const k of Object.keys(latest)) out[k] = latest[k].url;
    res.setHeader('Cache-Control', 'max-age=0, s-maxage=5, stale-while-revalidate=60');
    res.status(200).json(out);
  } catch (e) {
    res.status(500).json({ error: 'storage' });
  }
}
