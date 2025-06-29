import { redirect } from 'react-router';
import { getSessionUser, type User } from './auth';

export async function requireAuth(request: Request): Promise<User> {
  const sessionToken = getSessionToken(request);
  
  if (!sessionToken) {
    throw redirect('/login');
  }

  const user = await getSessionUser(sessionToken);
  
  if (!user) {
    throw redirect('/login');
  }

  return user;
}

export function getSessionToken(request: Request): string | null {
  const cookie = request.headers.get('Cookie');
  if (!cookie) return null;

  const sessionCookie = cookie
    .split(';')
    .find((c) => c.trim().startsWith('session='));

  if (!sessionCookie) return null;

  return sessionCookie.split('=')[1];
}

export function createSessionCookie(token: string): string {
  return `session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${30 * 24 * 60 * 60}`;
}

export function clearSessionCookie(): string {
  return 'session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0';
}