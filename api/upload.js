import { handleUploadPresigned } from '@vercel/blob/client';
import { issueSignedToken } from '@vercel/blob';
import { checkPassword, sleep } from './_auth.js';

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'image/svg+xml'];
const VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/ogg'];
const PATH_RE = /^media\/(logo|video|photo-\d{1,2})\/\d{10,14}-[A-Za-z0-9._-]{1,80}$/;

// Выдаёт браузеру разрешение загрузить один файл напрямую в хранилище. Без пароля разрешения нет.
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method' });
    return;
  }
  try {
    const json = await handleUploadPresigned({
      body: req.body,
      request: req,
      getSignedToken: async (pathname, clientPayload) => {
        if (!checkPassword(clientPayload)) {
          await sleep(700);
          throw new Error('Неверный пароль');
        }
        const m = PATH_RE.exec(pathname);
        if (!m) throw new Error('Недопустимое имя файла');
        const isVideo = m[1] === 'video';
        const allowedContentTypes = isVideo ? VIDEO_TYPES : IMAGE_TYPES;
        const maximumSizeInBytes = isVideo ? 300 * 1024 * 1024 : 20 * 1024 * 1024;
        const validUntil = Date.now() + 60 * 60 * 1000;
        const token = await issueSignedToken({
          pathname,
          operations: ['put'],
          allowedContentTypes,
          maximumSizeInBytes,
          validUntil,
        });
        return { token, urlOptions: { allowedContentTypes, maximumSizeInBytes, validUntil } };
      },
    });
    res.status(200).json(json);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}
