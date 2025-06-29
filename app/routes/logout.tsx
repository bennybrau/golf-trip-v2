import { redirect } from 'react-router';
import { deleteSession } from '../lib/auth';
import { clearSessionCookie, getSessionToken } from '../lib/session';
import type { Route } from './+types/logout';

export async function action({ request }: Route.ActionArgs) {
  const sessionToken = getSessionToken(request);
  
  if (sessionToken) {
    await deleteSession(sessionToken);
  }
  
  return redirect('/login', {
    headers: {
      'Set-Cookie': clearSessionCookie(),
    },
  });
}

export async function loader() {
  return redirect('/');
}