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
const ACTIVITY_THROTTLE = 10000;

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
  const [token, setToken] = useState(localStorage.getItem('token'));

  const logoutLock = useRef(false);
  const refreshPromise = useRef(null);
  const lastActivityRef = useRef(0);

  // ================= LOGOUT =================
  const logout = useCallback((isCrossTab = false) => {
    if (logoutLock.current) return;
    logoutLock.current = true;

    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('lastActivity');

    setToken(null);
    setUser(null);
    setIsAuthenticated(false);

    if (!isCrossTab) {
      localStorage.setItem('logout_event', Date.now().toString());
      setTimeout(() => localStorage.removeItem('logout_event'), 1000);
    }

    setTimeout(() => {
      logoutLock.current = false;
    }, 500);
  }, []);

  // ================= INIT =================
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      const decoded = parseJwt(storedToken);

      if (decoded?.exp * 1000 > Date.now()) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        setIsAuthenticated(true);
      } else {
        localStorage.clear();
      }
    }

    setLoading(false);
  }, []);

  // ================= LOGIN =================
  const login = useCallback((newToken, userData, refreshTokenValue = null) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('lastActivity', Date.now().toString());

    if (refreshTokenValue) {
      localStorage.setItem('refreshToken', refreshTokenValue);
    }

    setToken(newToken);
    setUser(userData);
    setIsAuthenticated(true);
  }, []);

  // ================= REFRESH TOKEN =================
  const refreshToken = useCallback(async () => {
    if (refreshPromise.current) return refreshPromise.current;

    refreshPromise.current = (async () => {
      try {
        const rt = localStorage.getItem('refreshToken');
        if (!rt) throw new Error('No refresh token');

        const res = await api.post('/auth/refresh', {
          refreshToken: rt
        });

        const { token: newToken, refreshToken: newRefresh } = res.data;

        localStorage.setItem('token', newToken);
        setToken(newToken);

        if (newRefresh) {
          localStorage.setItem('refreshToken', newRefresh);
        }

        const decoded = parseJwt(newToken);

        if (decoded?.user) {
          localStorage.setItem('user', JSON.stringify(decoded.user));
          setUser(decoded.user);
          setIsAuthenticated(true);
        }

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
    if (!isAuthenticated) return;

    const now = Date.now();

    if (now - lastActivityRef.current < ACTIVITY_THROTTLE) return;
    lastActivityRef.current = now;

    localStorage.setItem('lastActivity', String(now));

    const token = localStorage.getItem('token');
    if (!token) return;

    const decoded = parseJwt(token);
    if (!decoded?.exp) return;

    const expiresIn = decoded.exp * 1000 - now;

    // 🔥 auto refresh khi sắp hết hạn
    if (expiresIn < TOKEN_REFRESH_THRESHOLD) {
      refreshToken();
    }
  }, [isAuthenticated, refreshToken]);

  // ================= MULTI TAB LOGOUT =================
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'logout_event') logout(true);
    };

    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [logout]);

  // ================= TOKEN + USER SYNC =================
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'token' && e.newValue) {
        setToken(e.newValue);

        const u = localStorage.getItem('user');
        if (u) {
          setUser(JSON.parse(u));
          setIsAuthenticated(true);
        }
      }

      if (e.key === 'user' && e.newValue) {
        setUser(JSON.parse(e.newValue));
      }
    };

    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  // ================= IDLE LOGOUT =================
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      const last = Number(localStorage.getItem('lastActivity') || 0);
      const idle = Date.now() - last;

      if (idle >= IDLE_TIMEOUT) logout();
    }, 5000);

    return () => clearInterval(interval);
  }, [isAuthenticated, logout]);

  // ================= TOKEN EXP CHECK (FIXED LOGIC) =================
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(async () => {
      if (document.hidden) return;

      const t = localStorage.getItem('token');
      if (!t) return;

      const decoded = parseJwt(t);
      if (!decoded?.exp) {
        logout();
        return;
      }

      const now = Date.now();
      const expiresIn = decoded.exp * 1000 - now;

      const lastActivity = Number(localStorage.getItem('lastActivity') || 0);
      const isActive = now - lastActivity < 5 * 60 * 1000;

      // ❌ chỉ logout khi refresh fail
      if (expiresIn <= 0) {
        const ok = await refreshToken();
        if (!ok) logout();
        return;
      }

      if (expiresIn < TOKEN_REFRESH_THRESHOLD && isActive) {
        await refreshToken();
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [isAuthenticated, refreshToken, logout]);

  // ================= FOCUS REFRESH (IMPORTANT UX FIX) =================
  useEffect(() => {
    const onFocus = async () => {
      const t = localStorage.getItem('token');
      if (!t) return;

      const decoded = parseJwt(t);
      if (!decoded?.exp) return;

      const expiresIn = decoded.exp * 1000 - Date.now();

      if (expiresIn < TOKEN_REFRESH_THRESHOLD) {
        await refreshToken();
      }
    };

    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [refreshToken]);

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

    events.forEach(e =>
      window.addEventListener(e, updateActivity)
    );

    return () => {
      events.forEach(e =>
        window.removeEventListener(e, updateActivity)
      );
    };
  }, [isAuthenticated, updateActivity]);

  // ================= CONTEXT VALUE =================
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
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};