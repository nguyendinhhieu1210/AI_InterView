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
const CHECK_INTERVAL = 5000; // 5s check cho mượt
const TOKEN_REFRESH_THRESHOLD = 5 * 60 * 1000;

// ================= JWT PARSE =================
const parseJwt = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [token, setToken] = useState(
    localStorage.getItem('token')
  );

  const logoutLock = useRef(false);
  const refreshPromise = useRef(null);

  // ================= INIT AUTH =================
  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (token && storedUser) {
      const decoded = parseJwt(token);

      if (decoded?.exp * 1000 > Date.now()) {
        setIsAuthenticated(true);
        setUser(JSON.parse(storedUser));
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




  // ================= LOGOUT =================
  const logout = useCallback((isCrossTab = false) => {
    if (logoutLock.current) return;
    logoutLock.current = true;

    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('lastActivity');
    localStorage.removeItem('refreshToken');

    setIsAuthenticated(false);
    setUser(null);
    setToken(null);

    if (!isCrossTab) {
      localStorage.setItem('logout_event', Date.now().toString());

      setTimeout(() => {
        localStorage.removeItem('logout_event');
      }, 1000);
    }

    setTimeout(() => {
      logoutLock.current = false;
    }, 500);
  }, []);

  // ================= MULTI TAB LOGOUT =================
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'logout_event' && e.newValue) {
        logout(true);
      }
    };

    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [logout]);


  // ================= TOKEN SYNC BETWEEN TABS =================
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'token' && e.newValue) {
        setToken(e.newValue);

        const storedUser = localStorage.getItem('user');

        if (storedUser) {
          setUser(JSON.parse(storedUser));
          setIsAuthenticated(true);
        }
      }

      if (e.key === 'user' && e.newValue) {
        setUser(JSON.parse(e.newValue));
      }
    };

    window.addEventListener('storage', handler);

    return () =>
      window.removeEventListener('storage', handler);
  }, []);

  // ================= IDLE LOGOUT =================
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      const last = Number(localStorage.getItem('lastActivity') || 0);
      const idle = Date.now() - last;

      if (idle >= IDLE_TIMEOUT) {
        console.log('⛔ Idle 30 phút → logout');
        logout();
      }
    }, CHECK_INTERVAL);

    return () => clearInterval(interval);
  }, [isAuthenticated, logout]);
  // ================= UPDATE ACTIVITY =================
  const lastUpdateRef = useRef(0);

  const updateActivity = useCallback(() => {
    if (!isAuthenticated) return;

    const now = Date.now();

    if (now - lastUpdateRef.current < 10000) {
      return;
    }

    lastUpdateRef.current = now;

    localStorage.setItem(
      'lastActivity',
      now.toString()
    );
  }, [isAuthenticated]);
  // ================= REFRESH TOKEN =================
  const refreshToken = useCallback(async () => {
    if (refreshPromise.current) return refreshPromise.current;

    refreshPromise.current = (async () => {
      try {
        const refreshTokenValue = localStorage.getItem('refreshToken');
        if (!refreshTokenValue) throw new Error('No refresh token');

        const res = await api.post('/auth/refresh', {
          refreshToken: refreshTokenValue
        });

        const { token: newToken, refreshToken: newRefresh } = res.data;

        localStorage.setItem('token', newToken);

        setToken(newToken);
        if (newRefresh) {
          localStorage.setItem('refreshToken', newRefresh);
        }

        const decoded = parseJwt(newToken);

        if (decoded?.user) {
          localStorage.setItem(
            'user',
            JSON.stringify(decoded.user)
          );

          setUser(decoded.user);

          setIsAuthenticated(true);
        }

        updateActivity();
        return true;
      } catch (err) {
        console.log('Refresh failed');
        logout();
        return false;
      } finally {
        refreshPromise.current = null;
      }
    })();

    return refreshPromise.current;
  }, [logout, updateActivity]);

  // ================= TOKEN EXPIRE CHECK =================
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(async () => {
      if (document.hidden) return;

      const token = localStorage.getItem('token');
      if (!token) return;

      const decoded = parseJwt(token);

      if (!decoded?.exp) {
        logout();
        return;
      }

      const expiresIn = decoded.exp * 1000 - Date.now();

      const lastActivity = Number(
        localStorage.getItem('lastActivity') || 0
      );

      const isActive =
        Date.now() - lastActivity < 5 * 60 * 1000;

      // token hết hạn hoàn toàn
      if (expiresIn <= 0) {
        logout();
        return;
      }

      // sắp hết hạn
      if (expiresIn < TOKEN_REFRESH_THRESHOLD) {
        if (isActive) {
          await refreshToken();
        } else {
          logout();
        }
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [isAuthenticated, refreshToken, logout]);

  // ================= LOGIN =================
  const login = useCallback((newToken, userData, refreshTokenValue = null) => {
    localStorage.setItem('token', newToken);

    setToken(newToken);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('lastActivity', Date.now().toString());

    if (refreshTokenValue) {
      localStorage.setItem('refreshToken', refreshTokenValue);
    }

    setIsAuthenticated(true);
    setUser(userData);
  }, []);

  // ================= USER ACTIVITY EVENTS =================
  useEffect(() => {
    if (!isAuthenticated) return;

    const events = [
      'mousemove',
      'mousedown',
      'click',
      'keydown',
      'scroll',
      'touchstart'
    ];

    events.forEach(e => window.addEventListener(e, updateActivity));

    return () => {
      events.forEach(e => window.removeEventListener(e, updateActivity));
    };
  }, [isAuthenticated, updateActivity]);

  // ================= CONTEXT VALUE =================
  const value = {
    isAuthenticated,
    user,
    login,
    logout,
    loading,
    updateActivity,
    token
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// ================= HOOK =================
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};