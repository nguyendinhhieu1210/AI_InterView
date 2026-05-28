
// contexts/AuthContext.js
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef
} from 'react';
import api from '../services/api';

const AuthContext = createContext();

// ================= CONFIG =================
const IDLE_TIMEOUT = 30 * 60 * 1000; // 30 phút
const TOKEN_REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 phút
const REFRESH_THROTTLE = 60 * 1000; // 1 phút

// ================= JWT PARSE =================
const parseJwt = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');

    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(
          (c) =>
            '%' +
            ('00' + c.charCodeAt(0).toString(16)).slice(-2)
        )
        .join('')
    );

    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] =
    useState(false);

  const [user, setUser] = useState(null);

  const [loading, setLoading] = useState(true);

  const [token, setToken] = useState(
    localStorage.getItem('token')
  );

  const logoutLock = useRef(false);

  const refreshPromise = useRef(null);

  // ================= LOGOUT =================
  const logout = useCallback(
    (isCrossTab = false) => {
      if (logoutLock.current) return;

      logoutLock.current = true;

      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('lastActivity');

      sessionStorage.removeItem('lastRefreshCheck');

      setToken(null);
      setUser(null);
      setIsAuthenticated(false);

      if (!isCrossTab) {
        localStorage.setItem(
          'logout_event',
          Date.now().toString()
        );

        setTimeout(() => {
          localStorage.removeItem('logout_event');
        }, 1000);
      }

      setTimeout(() => {
        logoutLock.current = false;
      }, 500);
    },
    []
  );

  // ================= LOGIN =================
  const login = useCallback(
    (newToken, userData, refreshTokenValue = null) => {
      localStorage.setItem('token', newToken);

      localStorage.setItem(
        'user',
        JSON.stringify(userData)
      );

      localStorage.setItem(
        'lastActivity',
        Date.now().toString()
      );

      if (refreshTokenValue) {
        localStorage.setItem(
          'refreshToken',
          refreshTokenValue
        );
      }

      setToken(newToken);
      setUser(userData);
      setIsAuthenticated(true);
    },
    []
  );

  // ================= REFRESH TOKEN =================
  const refreshToken = useCallback(async () => {
    if (refreshPromise.current) {
      return refreshPromise.current;
    }

    refreshPromise.current = (async () => {
      try {
        const rt =
          localStorage.getItem('refreshToken');

        if (!rt) {
          throw new Error('No refresh token');
        }

        const res = await api.post(
          '/auth/refresh',
          {
            refreshToken: rt
          }
        );

        const {
          token: newToken,
          refreshToken: newRefresh
        } = res.data;

        localStorage.setItem(
          'token',
          newToken
        );

        setToken(newToken);

        if (newRefresh) {
          localStorage.setItem(
            'refreshToken',
            newRefresh
          );
        }

        const decoded = parseJwt(newToken);

        if (decoded?.user) {
          localStorage.setItem(
            'user',
            JSON.stringify(decoded.user)
          );

          setUser(decoded.user);
        }

        setIsAuthenticated(true);

        return true;
      } catch (err) {
        logout();
        return false;
      } finally {
        refreshPromise.current = null;
      }
    })();

    return refreshPromise.current;
  }, [logout]);

  // ================= UPDATE ACTIVITY =================
  const updateActivity = useCallback(() => {
    const now = Date.now();

    // ALWAYS update activity
    localStorage.setItem(
      'lastActivity',
      String(now)
    );

    if (!isAuthenticated) return;

    // throttle ONLY refresh check
    const lastRefreshCheck = Number(
      sessionStorage.getItem(
        'lastRefreshCheck'
      ) || 0
    );

    if (
      now - lastRefreshCheck <
      REFRESH_THROTTLE
    ) {
      return;
    }

    sessionStorage.setItem(
      'lastRefreshCheck',
      String(now)
    );

    const t = localStorage.getItem('token');

    if (!t) return;

    const decoded = parseJwt(t);

    if (!decoded?.exp) return;

    const expiresIn =
      decoded.exp * 1000 - now;

    if (
      expiresIn < TOKEN_REFRESH_THRESHOLD
    ) {
      refreshToken();
    }
  }, [isAuthenticated, refreshToken]);

  // ================= INIT =================
  useEffect(() => {
    const storedToken =
      localStorage.getItem('token');

    const storedUser =
      localStorage.getItem('user');

    if (storedToken && storedUser) {
      const decoded = parseJwt(storedToken);

      if (
        decoded?.exp * 1000 >
        Date.now()
      ) {
        setToken(storedToken);

        setUser(
          JSON.parse(storedUser)
        );

        setIsAuthenticated(true);

        localStorage.setItem(
          'lastActivity',
          Date.now().toString()
        );
      } else {
        localStorage.clear();
      }
    }

    setLoading(false);
  }, []);

  // ================= MULTI TAB LOGOUT =================
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'logout_event') {
        logout(true);
      }
    };

    window.addEventListener(
      'storage',
      handler
    );

    return () => {
      window.removeEventListener(
        'storage',
        handler
      );
    };
  }, [logout]);

  // ================= SYNC TOKEN =================
  useEffect(() => {
    const handler = (e) => {
      if (
        e.key === 'token' &&
        e.newValue
      ) {
        setToken(e.newValue);

        const u =
          localStorage.getItem('user');

        if (u) {
          setUser(JSON.parse(u));

          setIsAuthenticated(true);
        }
      }

      if (
        e.key === 'user' &&
        e.newValue
      ) {
        setUser(
          JSON.parse(e.newValue)
        );
      }
    };

    window.addEventListener(
      'storage',
      handler
    );

    return () => {
      window.removeEventListener(
        'storage',
        handler
      );
    };
  }, []);

  // ================= IDLE LOGOUT =================
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      const last = Number(
        localStorage.getItem(
          'lastActivity'
        ) || 0
      );

      const idle =
        Date.now() - last;

      if (idle >= IDLE_TIMEOUT) {
        logout();
      }
    }, 30000);

    return () =>
      clearInterval(interval);
  }, [isAuthenticated, logout]);

  // ================= AUTO REFRESH TOKEN =================
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(
      async () => {
        if (document.hidden) return;

        const t =
          localStorage.getItem(
            'token'
          );

        if (!t) return;

        const decoded =
          parseJwt(t);

        if (!decoded?.exp) return;

        const expiresIn =
          decoded.exp * 1000 -
          Date.now();

        // token expired
        if (expiresIn <= 0) {
          const ok =
            await refreshToken();

          if (!ok) {
            logout();
          }

          return;
        }

        // token near expired
        if (
          expiresIn <
          TOKEN_REFRESH_THRESHOLD
        ) {
          await refreshToken();
        }
      },
      60000
    );

    return () =>
      clearInterval(interval);
  }, [
    isAuthenticated,
    refreshToken,
    logout
  ]);

  // ================= FOCUS + VISIBILITY =================
  useEffect(() => {
    const handleFocus = async () => {
      updateActivity();

      const t =
        localStorage.getItem(
          'token'
        );

      if (!t) return;

      const decoded =
        parseJwt(t);

      if (!decoded?.exp) return;

      const expiresIn =
        decoded.exp * 1000 -
        Date.now();

      if (
        expiresIn <
        TOKEN_REFRESH_THRESHOLD
      ) {
        await refreshToken();
      }
    };

    const handleVisibility = () => {
      if (!document.hidden) {
        updateActivity();
      }
    };

    window.addEventListener(
      'focus',
      handleFocus
    );

    document.addEventListener(
      'visibilitychange',
      handleVisibility
    );

    return () => {
      window.removeEventListener(
        'focus',
        handleFocus
      );

      document.removeEventListener(
        'visibilitychange',
        handleVisibility
      );
    };
  }, [
    refreshToken,
    updateActivity
  ]);

  // ================= USER EVENTS =================
  useEffect(() => {
    if (!isAuthenticated) return;

    const events = [
      'mousedown',
      'click',
      'keydown',
      'scroll',
      'touchstart'
    ];

    events.forEach((event) => {
      window.addEventListener(
        event,
        updateActivity,
        {
          passive: true
        }
      );
    });

    return () => {
      events.forEach((event) => {
        window.removeEventListener(
          event,
          updateActivity
        );
      });
    };
  }, [
    isAuthenticated,
    updateActivity
  ]);

  // ================= CONTEXT =================
  const value = {
    isAuthenticated,
    user,
    token,
    login,
    logout,
    loading,
    updateActivity,
    refreshToken
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// ================= HOOK =================
export const useAuth = () => {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error(
      'useAuth must be used within AuthProvider'
    );
  }

  return ctx;
};
