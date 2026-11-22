import { z } from 'zod';
import { createEndpoint, ZiteError } from 'zitejs/backend';
import { zite } from 'zitejs/db';
import { createSession, hashPassword } from '../lib/passwordAuth';

export default createEndpoint({
  description: 'Signs in with email and password',
  inputSchema: z.object({ email: z.string(), password: z.string() }),
  outputSchema: z.object({
    token: z.string(),
    user: z.object({ id: z.string(), email: z.string(), fullName: z.string() }),
  }),
  execute: async ({ input }) => {
    const email = input.email.trim().toLowerCase();
    const bad = () => new ZiteError({ code: 'UNAUTHORIZED' as any, message: 'bad login', userFacingMessage: 'Incorrect email or password.' });
    const { records } = await zite.appAccounts.findAll({ filters: { email }, limit: 1 });
    const account = records[0];
    if (!account?.passwordSalt || !account.passwordHash) throw bad();
    const hash = await hashPassword(input.password, account.passwordSalt);
    if (hash !== account.passwordHash) throw bad();
    const token = await createSession(account.id);
    return { token, user: { id: account.id, email, fullName: account.fullName ?? '' } };
  },
});
