import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { currentAccount, signIn, signUp, signOut } from 'zitejs/api';

export type Account = { id: string; email: string; fullName: string };

type AuthState = {
  account: Account | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (fullName: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const KEY = 'arovia_session';
const Ctx = createContext<AuthState | null>(null);

export function AccountProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(KEY));
  const [account, setAccount] = useState<Account | null>(null);
  const [isLoading, setLoading] = useState(!!token);

  useEffect(() => {
    if (!token) return;
    currentAccount({ token })
      .then(setAccount)
      .catch(() => { localStorage.removeItem(KEY); setToken(null); })
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const save = (t: string, a: Account) => {
    localStorage.setItem(KEY, t);
    setToken(t);
    setAccount(a);
  };

  const value: AuthState = {
    account, token, isLoading,
    login: async (email, password) => {
      const r = await signIn({ email, password });
      save(r.token, r.user);
    },
    register: async (fullName, email, password) => {
      const r = await signUp({ fullName, email, password });
      save(r.token, r.user);
    },
    logout: async () => {
      if (token) await signOut({ token }).catch(() => {});
      localStorage.removeItem(KEY);
      setToken(null);
      setAccount(null);
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAccount() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAccount must be inside AccountProvider');
  return v;
}

/** Token for signed-in pages (always set inside the protected layout). */
export function useToken() {
  return useAccount().token ?? '';
}

export function errorMessage(e: unknown) {
  const err = e as { userFacingMessage?: string; message?: string };
  return err?.userFacingMessage || err?.message || 'Something went wrong. Please try again.';
}
