import { list, del } from '@vercel/blob';
import { checkPassword, KEY_RE, sleep } from './_auth.js';

// POST { action: "check" | "prune" | "remove", password, key }
//   check  проверить пароль
//   prune  оставить для рамки только самый новый файл, старые удалить (экономит место)
//   remove убрать из рамки все файлы
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method' });
    return;
  }
  const body = req.body && typeof req.body === 'object' ? req.body : {};
  if (!checkPassword(body.password)) {
    await sleep(700);
    res.status(401).json({ error: 'Неверный пароль' });
    return;
  }
  if (body.action === 'check') {
    res.status(200).json({ ok: true });
    return;
  }
  if ((body.action === 'prune' || body.action === 'remove') && KEY_RE.test(body.key || '')) {
    try {
      const blobs = [];
      let cursor;
      do {
        const page = await list({ prefix: 'media/' + body.key + '/', cursor, limit: 1000 });
        blobs.push(...page.blobs);
        cursor = page.hasMore ? page.cursor : undefined;
      } while (cursor);
      blobs.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
      const doomed = (body.action === 'prune' ? blobs.slice(1) : blobs).map((b) => b.url);
      if (doomed.length) await del(doomed);
      res.status(200).json({ ok: true, deleted: doomed.length });
    } catch (e) {
      res.status(500).json({ error: 'storage' });
    }
    return;
  }
  res.status(400).json({ error: 'bad request' });
}
