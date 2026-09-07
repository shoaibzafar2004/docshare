import { cookies } from 'next/headers';
import { getUser } from './users';
import type { User } from './types';

const COOKIE_NAME = 'docshare_user';

export function getCurrentUser(): User | null {
  const userId = cookies().get(COOKIE_NAME)?.value;
  if (!userId) return null;
  return getUser(userId) ?? null;
}

export function setCurrentUserCookie(userId: string) {
  cookies().set(COOKIE_NAME, userId, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
}

export function clearCurrentUserCookie() {
  cookies().delete(COOKIE_NAME);
}
