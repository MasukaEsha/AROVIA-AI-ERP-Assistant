import { z } from 'zod';
import { createEndpoint } from 'zitejs/backend';
import { zite } from 'zitejs/db';

export default createEndpoint({
  description: 'Ends a sign-in session',
  inputSchema: z.object({ token: z.string() }),
  outputSchema: z.object({ success: z.boolean() }),
  execute: async ({ input }) => {
    const { records } = await zite.loginSessions.findAll({ filters: { token: input.token }, limit: 1 });
    if (records[0]) await zite.loginSessions.delete({ id: records[0].id });
    return { success: true };
  },
});
