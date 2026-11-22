import { z } from 'zod';
import { createEndpoint, ZiteError } from 'zitejs/backend';
import { zite } from 'zitejs/db';
import { createSession, hashPassword, randomHex } from '../lib/passwordAuth';

export default createEndpoint({
  description: 'Creates a new account with email and password',
  inputSchema: z.object({
    fullName: z.string(),
    email: z.string(),
    password: z.string(),
  }),
  outputSchema: z.object({
    token: z.string(),
    user: z.object({ id: z.string(), email: z.string(), fullName: z.string() }),
  }),
  execute: async ({ input }) => {
    const email = input.email.trim().toLowerCase();
    const fullName = input.fullName.trim();
    if (!fullName) throw new ZiteError({ code: 'BAD_REQUEST' as any, message: 'name', userFacingMessage: 'Please enter your name.' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ZiteError({ code: 'BAD_REQUEST' as any, message: 'email', userFacingMessage: 'Please enter a valid email address.' });
    if (input.password.length < 8) throw new ZiteError({ code: 'BAD_REQUEST' as any, message: 'pw', userFacingMessage: 'Password must be at least 8 characters.' });

    const { records } = await zite.appAccounts.findAll({ filters: { email }, limit: 1 });
    if (records[0]) throw new ZiteError({ code: 'BAD_REQUEST' as any, message: 'exists', userFacingMessage: 'An account with this email already exists. Please sign in.' });

    const salt = randomHex(16);
    const passwordHash = await hashPassword(input.password, salt);
    const account = await zite.appAccounts.create({ record: { email, fullName, passwordHash, passwordSalt: salt } });
    const token = await createSession(account.id);
    return { token, user: { id: account.id, email, fullName } };
  },
});
