import { handleUpload } from '@vercel/blob/client';
import { checkPassword, sleep } from './_auth.js';

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'image/svg+xml'];
const VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/ogg'];

// Выдаёт браузеру разрешение загрузить файл напрямую в хранилище. Без пароля разрешения нет.
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method' });
    return;
  }
  try {
    const json = await handleUpload({
      body: req.body,
      request: req,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        if (!checkPassword(clientPayload)) {
          await sleep(700);
          throw new Error('Неверный пароль');
        }
        const m = /^media\/(logo|video|photo-\d{1,2})\/[A-Za-z0-9._-]{1,100}$/.exec(pathname);
        if (!m) throw new Error('Недопустимое имя файла');
        const isVideo = m[1] === 'video';
        return {
          allowedContentTypes: isVideo ? VIDEO_TYPES : IMAGE_TYPES,
          maximumSizeInBytes: isVideo ? 300 * 1024 * 1024 : 20 * 1024 * 1024,
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async () => {},
    });
    res.status(200).json(json);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}
