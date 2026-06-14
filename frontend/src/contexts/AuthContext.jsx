// contexts/AuthContext.js
import React, {
  createContext, useContext, useState,
  useEffect, useCallback, useRef
} from 'react';
import api from '../services/api';
import { authDebug } from '../utils/authDebugger';

const AuthContext = createContext();

const IDLE_TIMEOUT = 30 * 60 * 1000;
const TOKEN_REFRESH_THRESHOLD = 5 * 60 * 1000;
const REFRESH_THROTTLE = 60 * 1000;

// ── Phân biệt admin / user bằng storage key riêng ──
const isAdminPath = () => window.location.pathname.startsWith('/admin');

const STORAGE_KEYS = {
  token:        () => isAdminPath() ? 'admin_token'        : 'token',
  user:         () => isAdminPath() ? 'admin_user'         : 'user',
  refreshToken: () => isAdminPath() ? 'admin_refreshToken' : 'refreshToken',
  lastActivity: () => isAdminPath() ? 'admin_lastActivity' : 'lastActivity',
};

const parseJwt = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64).split('').map(
        c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
      ).join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser]                       = useState(null);
  const [loading, setLoading]                 = useState(true);
  const [token, setToken]                     = useState(
    () => localStorage.getItem(STORAGE_KEYS.token())
  );

  const logoutLock     = useRef(false);
  const refreshPromise = useRef(null);

  // ================= LOGOUT =================
  const logout = useCallback(() => {
    authDebug('LOGOUT');

    if (logoutLock.current) {
      authDebug('LOGOUT BLOCKED');
      return;
    }

    logoutLock.current = true;

    // Chỉ xóa key của role hiện tại, không đụng key của role kia
    localStorage.removeItem(STORAGE_KEYS.token());
    localStorage.removeItem(STORAGE_KEYS.user());
    localStorage.removeItem(STORAGE_KEYS.refreshToken());
    localStorage.removeItem(STORAGE_KEYS.lastActivity());
    sessionStorage.clear();

    setToken(null);
    setUser(null);
    setIsAuthenticated(false);

    const redirectPath = isAdminPath() ? '/login' : '/login';
    window.location.replace(redirectPath);

    // ❌ Bỏ hoàn toàn logout_event - không broadcast cross-tab
    setTimeout(() => { logoutLock.current = false; }, 500);
  }, []);

  // ================= LOGIN =================
  const login = useCallback((newToken, userData, refreshTokenValue) => {
    authDebug('LOGIN START');

    localStorage.setItem(STORAGE_KEYS.token(),        newToken);
    localStorage.setItem(STORAGE_KEYS.user(),         JSON.stringify(userData));
    localStorage.setItem(STORAGE_KEYS.lastActivity(), Date.now().toString());

    if (refreshTokenValue) {
      localStorage.setItem(STORAGE_KEYS.refreshToken(), refreshTokenValue);
    }

    setToken(newToken);
    setUser(userData);
    setIsAuthenticated(true);

    authDebug('LOGIN SUCCESS', { email: userData?.email });
  }, []);

  // ================= REFRESH TOKEN =================
  const refreshToken = useCallback(async () => {
    if (refreshPromise.current) return refreshPromise.current;

    refreshPromise.current = (async () => {
      try {
        authDebug('REFRESH TOKEN START');

        const rt = localStorage.getItem(STORAGE_KEYS.refreshToken());
        if (!rt) throw new Error('No refresh token');

        const res = await api.post('/auth/refresh', { refreshToken: rt });
        const { token: newToken, refreshToken: newRefresh } = res.data;

        localStorage.setItem(STORAGE_KEYS.token(), newToken);
        setToken(newToken);

        if (newRefresh) {
          localStorage.setItem(STORAGE_KEYS.refreshToken(), newRefresh);
        }

        const decoded = parseJwt(newToken);
        if (decoded?.user) {
          localStorage.setItem(STORAGE_KEYS.user(), JSON.stringify(decoded.user));
          setUser(decoded.user);
        }

        setIsAuthenticated(true);
        authDebug('REFRESH SUCCESS');
        return true;
      } catch (err) {
        authDebug('REFRESH FAILED', { message: err?.message });
        logout();
        return false;
      } finally {
        refreshPromise.current = null;
      }
    })();

    return refreshPromise.current;
  }, [logout]);

  // ================= CHECK TOKEN =================
  const ensureValidToken = useCallback(async () => {
    const t = localStorage.getItem(STORAGE_KEYS.token());
    if (!t) return false;

    const decoded = parseJwt(t);
    if (!decoded?.exp) return false;

    const expiresIn = decoded.exp * 1000 - Date.now();

    if (expiresIn <= 0) return await refreshToken();
    if (expiresIn < TOKEN_REFRESH_THRESHOLD) return await refreshToken();

    return true;
  }, [refreshToken]);

  // ================= ACTIVITY =================
  const updateActivity = useCallback(async () => {
    const now = Date.now();
    localStorage.setItem(STORAGE_KEYS.lastActivity(), String(now));

    if (!isAuthenticated) return;

    const lastRefreshCheck = Number(sessionStorage.getItem('lastRefreshCheck') || 0);
    if (now - lastRefreshCheck < REFRESH_THROTTLE) return;

    sessionStorage.setItem('lastRefreshCheck', String(now));
    await ensureValidToken();
  }, [isAuthenticated, ensureValidToken]);

  // ================= INIT =================
  useEffect(() => {
    const init = async () => {
      try {
        authDebug('INIT START');

        const storedToken = localStorage.getItem(STORAGE_KEYS.token());
        const storedUser  = localStorage.getItem(STORAGE_KEYS.user());

        if (!storedToken || !storedUser) {
          setLoading(false);
          return;
        }

        const decoded = parseJwt(storedToken);

        if (decoded?.exp * 1000 > Date.now()) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          setIsAuthenticated(true);
          localStorage.setItem(STORAGE_KEYS.lastActivity(), Date.now().toString());
        } else {
          const ok = await refreshToken();
          if (!ok) logout();
        }
      } catch (err) {
        authDebug('INIT FAILED', { message: err?.message });
        logout();
      } finally {
        setLoading(false);
        authDebug('INIT DONE');
      }
    };

    init();
  }, [logout, refreshToken]);

  // ================= MULTI TAB =================
  // ❌ Bỏ hoàn toàn listener logout_event
  // Mỗi tab tự quản lý session độc lập

  // ================= IDLE CHECK =================
  useEffect(() => {
    if (!isAuthenticated) return;

    authDebug('IDLE CHECK START');

    const interval = setInterval(async () => {
      // Chỉ check khi tab đang active (visible)
      if (document.hidden) return;

      const last  = Number(localStorage.getItem(STORAGE_KEYS.lastActivity()) || 0);
      const idle  = Date.now() - last;

      const remainingMinutes = Math.floor((IDLE_TIMEOUT - idle) / 1000 / 60);
      const remainingSeconds = Math.floor(((IDLE_TIMEOUT - idle) / 1000) % 60);

      authDebug('IDLE COUNTDOWN', {
        idleSeconds: Math.floor(idle / 1000),
        remainingTime: `${remainingMinutes}m ${remainingSeconds}s`
      });

      if (idle < IDLE_TIMEOUT) return;

      authDebug('USER IDLE TIMEOUT');

      // Tab visible + idle → thử refresh trước khi logout
      const ok = await ensureValidToken();
      if (ok) {
        // Refresh thành công → reset activity, không logout
        localStorage.setItem(STORAGE_KEYS.lastActivity(), Date.now().toString());
        authDebug('RECOVER SESSION SUCCESS');
        return;
      }

      authDebug('AUTO LOGOUT');
      logout();
    }, 1000);

    return () => {
      clearInterval(interval);
      authDebug('IDLE CHECK STOP');
    };
  }, [isAuthenticated, logout, ensureValidToken]);

  // ================= AUTO REFRESH =================
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(async () => {
      if (document.hidden) return;
      await ensureValidToken();
    }, 60000);

    return () => clearInterval(interval);
  }, [isAuthenticated, ensureValidToken]);

  // ================= USER EVENTS =================
  useEffect(() => {
    if (!isAuthenticated) return;

    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach(e => window.addEventListener(e, updateActivity, { passive: true }));

    return () => events.forEach(e => window.removeEventListener(e, updateActivity));
  }, [isAuthenticated, updateActivity]);

  // ================= FOCUS =================
  useEffect(() => {
    const handleFocus   = () => updateActivity();
    const handleVisible = () => { if (!document.hidden) updateActivity(); };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisible);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisible);
    };
  }, [updateActivity]);

  // ================= CONTEXT =================
  return (
    <AuthContext.Provider value={{
      isAuthenticated, user, token, loading,
      login, logout, refreshToken, updateActivity
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};