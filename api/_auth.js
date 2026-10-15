import { createHash, timingSafeEqual } from 'node:crypto';

// Пароль хранится в настройках Vercel (переменная ADMIN_PASSWORD), в коде его нет.
export function checkPassword(given) {
  const real = process.env.ADMIN_PASSWORD || '';
  if (!real || typeof given !== 'string') return false;
  const a = createHash('sha256').update(given).digest();
  const b = createHash('sha256').update(real).digest();
  return timingSafeEqual(a, b);
}

export const KEY_RE = /^(logo|video|photo-\d{1,2})$/;

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
