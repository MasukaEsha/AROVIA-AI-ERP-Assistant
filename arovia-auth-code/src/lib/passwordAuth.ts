import { zite } from 'zitejs/db';
import { ZiteError } from 'zitejs/backend';

const enc = new TextEncoder();
const toHex = (buf: ArrayBuffer | Uint8Array) =>
  Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');

export function randomHex(bytes = 32) {
  return toHex(crypto.getRandomValues(new Uint8Array(bytes)));
}

export async function hashPassword(password: string, salt: string) {
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: enc.encode(salt), iterations: 100000, hash: 'SHA-256' },
    key,
    256,
  );
  return toHex(bits);
}

export const SESSION_DAYS = 7;

export async function createSession(accountId: string) {
  const token = randomHex(32);
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400000).toISOString();
  await zite.loginSessions.create({ record: { token, account: [accountId], expiresAt } });
  return token;
}

/** Returns the signed-in account for a session token, or throws. */
export async function requireAccount(token: string | undefined) {
  const fail = (): never => {
    throw new ZiteError({ code: 'UNAUTHORIZED' as any, message: 'Not signed in', userFacingMessage: 'Please sign in again.' });
  };
  if (!token) return fail();
  const { records } = await zite.loginSessions.findAll({ filters: { token }, limit: 1 });
  const session = records[0];
  if (!session || !session.expiresAt || new Date(session.expiresAt) < new Date()) return fail();
  const accountId = Array.isArray(session.account) ? session.account[0] : session.account;
  if (!accountId) return fail();
  const account = await zite.appAccounts.findOne({ id: accountId });
  if (!account) return fail();
  return { id: account.id, email: account.email ?? '', fullName: account.fullName ?? '' };
}
