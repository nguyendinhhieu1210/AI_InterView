import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';

const ThemeContext = createContext();

export const ThemeProvider = ({ children, forcedTheme = null }) => {
  const { user } = useAuth();
  const themeKey = user ? `theme_${user.id}` : 'theme_guest';

  const [theme, setTheme] = useState(
    localStorage.getItem(themeKey) || 'light'
  );

  // Khi user đổi (login/logout/chuyển tài khoản) → load lại theme đúng của user đó
  useEffect(() => {
    setTheme(localStorage.getItem(themeKey) || 'light');
  }, [themeKey]);

  const toggleDarkMode = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const activeTheme = forcedTheme ?? theme;

  useEffect(() => {
    if (!forcedTheme) {
      localStorage.setItem(themeKey, theme);
      document.documentElement.classList.toggle('dark', theme === 'dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme, forcedTheme, themeKey]);

  return (
    <ThemeContext.Provider value={{ theme: activeTheme, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);