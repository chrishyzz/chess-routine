import { HttpClient, LOCALSTORAGE_STATE, OAuth2AuthCodePKCE } from '@bity/oauth2-auth-code-pkce';
import { createContext, useContext, ReactNode, useState, useEffect } from 'react';

const lichessHost = 'https://lichess.org';
const scopes = ['email:read'];
const clientId = 'chess-study-tracker';
const sessionStorageKey = 'chess-routine-auth-session';
const clientUrl = (() => {
  const url = new URL(window.location.href);
  url.search = '';
  return url.href;
})();

interface User {
  id: string;
  email: string;
  username: string;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  loading: boolean;
  error: string | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  decoratedFetch: HttpClient | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const oauth = new OAuth2AuthCodePKCE({
  authorizationUrl: `${lichessHost}/oauth`,
  tokenUrl: `${lichessHost}/api/token`,
  clientId,
  scopes,
  redirectUrl: clientUrl,
  onAccessTokenExpiry: (refreshAccessToken) => refreshAccessToken(),
  onInvalidGrant: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [decoratedFetch, setDecoratedFetch] = useState<HttpClient | null>(null);

  useEffect(() => {
    initializeAuth();
  }, []);

  async function initializeAuth() {
    try {
      const hasAuthCode = await oauth.isReturningFromAuthServer();
      if (hasAuthCode) {
        window.history.replaceState({}, document.title, clientUrl);
      }
      const storedSession = localStorage.getItem(sessionStorageKey);
      const session = storedSession ? JSON.parse(storedSession) as { user: User; accessToken: string } : null;

      if (hasAuthCode || session) {
        const accessContext = await oauth.getAccessToken();
        const token = accessContext.token?.value;
        if (token) {
          setAccessToken(token);

          const fetch = oauth.decorateFetchHTTPClient(window.fetch);
          setDecoratedFetch(() => fetch);

          // Get user info
          const res = await fetch(`${lichessHost}/api/account`);
          const data = await res.json();
          
          const authenticatedUser = {
            id: data.id,
            email: data.email || '',
            username: data.username || data.id,
          };
          setUser(authenticatedUser);
          localStorage.setItem(sessionStorageKey, JSON.stringify({
            user: authenticatedUser,
            accessToken: token,
          }));
        }
      }
    } catch (err) {
      localStorage.removeItem(sessionStorageKey);
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  }

  async function login() {
    try {
      setError(null);
      await oauth.fetchAuthorizationCode();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    }
  }

  async function logout() {
    try {
      if (accessToken) {
        await fetch(`${lichessHost}/api/token`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
      }
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      setAccessToken(null);
      setDecoratedFetch(null);
      localStorage.removeItem(sessionStorageKey);
      localStorage.removeItem(LOCALSTORAGE_STATE);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        loading,
        error,
        login,
        logout,
        decoratedFetch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
