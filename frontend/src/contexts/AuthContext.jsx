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
import { authDebug } from '../utils/authDebugger';

const AuthContext = createContext();

// ================= CONFIG =================
const IDLE_TIMEOUT = 30 * 60 * 1000;
const TOKEN_REFRESH_THRESHOLD = 5 * 60 * 1000;
const REFRESH_THROTTLE = 60 * 1000;

// ================= JWT =================
const parseJwt = (token) => {
  try {
    const base64Url = token.split('.')[1];

    const base64 = base64Url
      .replace(/-/g, '+')
      .replace(/_/g, '/');

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
    (crossTab = false) => {
      authDebug('LOGOUT', {
        crossTab
      });

      if (logoutLock.current) {
        authDebug('LOGOUT BLOCKED');
        return;
      }

      logoutLock.current = true;

      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('lastActivity');

      sessionStorage.clear();

      setToken(null);
      setUser(null);
      setIsAuthenticated(false);

      if (!crossTab) {
        localStorage.setItem(
          'logout_event',
          Date.now().toString()
        );

        setTimeout(() => {
          localStorage.removeItem('logout_event');
        }, 500);
      }

      setTimeout(() => {
        logoutLock.current = false;
      }, 500);
    },
    []
  );

  // ================= LOGIN =================
  const login = useCallback(
    (newToken, userData, refreshTokenValue) => {
      authDebug('LOGIN START');

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

      authDebug('LOGIN SUCCESS', {
        email: userData?.email
      });
    },
    []
  );

  // ================= REFRESH TOKEN =================
  const refreshToken = useCallback(async () => {
    if (refreshPromise.current) {
      authDebug('REFRESH WAITING EXISTING PROMISE');

      return refreshPromise.current;
    }

    refreshPromise.current = (async () => {
      try {
        authDebug('REFRESH TOKEN START');

        const rt =
          localStorage.getItem('refreshToken');

        if (!rt) {
          authDebug('NO REFRESH TOKEN');

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

        authDebug('REFRESH SUCCESS');

        return true;
      } catch (err) {
        authDebug('REFRESH FAILED', {
          message: err?.message
        });

        console.error('Refresh token failed');

        logout();

        return false;
      } finally {
        refreshPromise.current = null;
      }
    })();

    return refreshPromise.current;
  }, [logout]);

  // ================= CHECK TOKEN =================
  const ensureValidToken =
    useCallback(async () => {
      const t = localStorage.getItem('token');

      if (!t) {
        authDebug('NO TOKEN');

        return false;
      }

      const decoded = parseJwt(t);

      if (!decoded?.exp) {
        authDebug('INVALID TOKEN');

        return false;
      }

      const expiresIn =
        decoded.exp * 1000 - Date.now();

      authDebug('CHECK TOKEN', {
        expiresInSeconds: Math.floor(
          expiresIn / 1000
        )
      });

      // token expired
      if (expiresIn <= 0) {
        authDebug('TOKEN EXPIRED');

        return await refreshToken();
      }

      // token gần hết hạn
      if (
        expiresIn <
        TOKEN_REFRESH_THRESHOLD
      ) {
        authDebug('TOKEN NEAR EXPIRE');

        return await refreshToken();
      }

      authDebug('TOKEN STILL VALID');

      return true;
    }, [refreshToken]);

  // ================= ACTIVITY =================
  const updateActivity = useCallback(async () => {
    const now = Date.now();

    authDebug('USER ACTIVITY');

    localStorage.setItem(
      'lastActivity',
      String(now)
    );

    if (!isAuthenticated) {
      authDebug('NOT AUTHENTICATED');

      return;
    }

    const lastRefreshCheck = Number(
      sessionStorage.getItem(
        'lastRefreshCheck'
      ) || 0
    );

    if (
      now - lastRefreshCheck <
      REFRESH_THROTTLE
    ) {
      authDebug('REFRESH THROTTLED');

      return;
    }

    sessionStorage.setItem(
      'lastRefreshCheck',
      String(now)
    );

    await ensureValidToken();
  }, [
    isAuthenticated,
    ensureValidToken
  ]);

  // ================= INIT =================
  useEffect(() => {
    const init = async () => {
      try {
        authDebug('INIT START');

        const storedToken =
          localStorage.getItem('token');

        const storedUser =
          localStorage.getItem('user');

        if (
          !storedToken ||
          !storedUser
        ) {
          authDebug('NO STORED AUTH');

          setLoading(false);

          return;
        }

        const decoded =
          parseJwt(storedToken);

        if (
          decoded?.exp * 1000 >
          Date.now()
        ) {
          authDebug('RESTORE SESSION');

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
          authDebug('TOKEN EXPIRED ON INIT');

          const ok =
            await refreshToken();

          if (!ok) {
            logout();
          }
        }
      } catch (err) {
        authDebug('INIT FAILED', {
          message: err?.message
        });

        logout();
      } finally {
        setLoading(false);

        authDebug('INIT DONE');
      }
    };

    init();
  }, [logout, refreshToken]);

  // ================= MULTI TAB =================
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'logout_event') {
        authDebug('CROSS TAB LOGOUT');

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

  // ================= IDLE CHECK =================
  // ================= IDLE CHECK =================
  useEffect(() => {
    if (!isAuthenticated) return;

    authDebug('IDLE CHECK START');

    const interval = setInterval(
      async () => {
        const last = Number(
          localStorage.getItem(
            'lastActivity'
          ) || 0
        );

        const idle =
          Date.now() - last;

        const remaining =
          IDLE_TIMEOUT - idle;

        const remainingMinutes =
          Math.floor(
            remaining / 1000 / 60
          );

        const remainingSeconds =
          Math.floor(
            (remaining / 1000) % 60
          );

        authDebug('IDLE COUNTDOWN', {
          idleSeconds: Math.floor(
            idle / 1000
          ),

          remainingTime: `${remainingMinutes}m ${remainingSeconds}s`
        });

        // TEST realtime trên browser
        console.clear();

        console.log(
          '%cAUTH IDLE TIMER',
          'color:#00ff88;font-size:18px;font-weight:bold'
        );

        console.table({
          Idle_Seconds: Math.floor(
            idle / 1000
          ),

          Remaining_Minutes:
            remainingMinutes,

          Remaining_Seconds:
            remainingSeconds,

          Logout_At:
            idle >= IDLE_TIMEOUT
        });

        if (idle < IDLE_TIMEOUT) {
          return;
        }

        authDebug('USER IDLE TIMEOUT');

        if (
          document.visibilityState ===
          'visible'
        ) {
          authDebug(
            'VISIBLE TAB - TRY REFRESH'
          );

          localStorage.setItem(
            'lastActivity',
            Date.now().toString()
          );

          const ok =
            await ensureValidToken();

          if (ok) {
            authDebug(
              'RECOVER SESSION SUCCESS'
            );

            return;
          }
        }

        authDebug('AUTO LOGOUT');

        logout();
      },

      // update mỗi giây
      1000
    );

    return () => {
      clearInterval(interval);

      authDebug('IDLE CHECK STOP');
    };
  }, [
    isAuthenticated,
    logout,
    ensureValidToken
  ]);

  // ================= AUTO REFRESH =================
  useEffect(() => {
    if (!isAuthenticated) return;

    authDebug('AUTO REFRESH START');

    const interval = setInterval(
      async () => {
        if (document.hidden) {
          authDebug(
            'TAB HIDDEN - SKIP REFRESH'
          );

          return;
        }

        authDebug('AUTO REFRESH RUN');

        await ensureValidToken();
      },
      60000
    );

    return () => {
      clearInterval(interval);

      authDebug('AUTO REFRESH STOP');
    };
  }, [
    isAuthenticated,
    ensureValidToken
  ]);

  // ================= USER EVENTS =================
  useEffect(() => {
    if (!isAuthenticated) return;

    authDebug('REGISTER USER EVENTS');

    const events = [
      'mousedown',
      'mousemove',
      'keydown',
      'scroll',
      'touchstart',
      'click'
    ];

    events.forEach((event) => {
      window.addEventListener(
        event,
        updateActivity,
        { passive: true }
      );
    });

    return () => {
      events.forEach((event) => {
        window.removeEventListener(
          event,
          updateActivity
        );
      });

      authDebug('REMOVE USER EVENTS');
    };
  }, [
    isAuthenticated,
    updateActivity
  ]);

  // ================= FOCUS =================
  useEffect(() => {
    const handleFocus = async () => {
      authDebug('WINDOW FOCUS');

      await updateActivity();
    };

    const handleVisible = async () => {
      if (!document.hidden) {
        authDebug('TAB VISIBLE');

        await updateActivity();
      }
    };

    window.addEventListener(
      'focus',
      handleFocus
    );

    document.addEventListener(
      'visibilitychange',
      handleVisible
    );

    return () => {
      window.removeEventListener(
        'focus',
        handleFocus
      );

      document.removeEventListener(
        'visibilitychange',
        handleVisible
      );
    };
  }, [updateActivity]);

  // ================= CONTEXT =================
  const value = {
    isAuthenticated,
    user,
    token,
    loading,
    login,
    logout,
    refreshToken,
    updateActivity
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