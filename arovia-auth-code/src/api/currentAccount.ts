import { z } from 'zod';
import { createEndpoint } from 'zitejs/backend';
import { requireAccount } from '../lib/passwordAuth';

export default createEndpoint({
  description: 'Returns the signed-in account for a session',
  inputSchema: z.object({ token: z.string() }),
  outputSchema: z.object({ id: z.string(), email: z.string(), fullName: z.string() }),
  execute: async ({ input }) => requireAccount(input.token),
});
