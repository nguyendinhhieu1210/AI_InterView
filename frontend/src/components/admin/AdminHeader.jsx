// src/components/admin/AdminHeader.jsx
import { useState, useEffect } from 'react';
import { Bell, Menu, Sun, Moon, UserCircle } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

const AdminHeader = () => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const [user, setUser] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 h-16 flex items-center justify-between px-4 md:px-6">
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 md:hidden"
      >
        <Menu size={22} className="text-gray-600 dark:text-gray-300" />
      </button>

      <h2 className="text-lg font-semibold text-gray-800 dark:text-white hidden md:block">
        Admin Dashboard
      </h2>
      
      <div className="flex-1" />

      <div className="flex items-center gap-3">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
        >
          {isDark ? <Sun size={20} className="text-yellow-500" /> : <Moon size={20} className="text-gray-600" />}
        </button>

        {/* Notifications */}
        <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 relative">
          <Bell size={20} className="text-gray-600 dark:text-gray-300" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {/* User Info */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-blue-500 text-white flex items-center justify-center font-bold shadow-md">
            {user?.fullName?.charAt(0)?.toUpperCase() || user?.userName?.charAt(0)?.toUpperCase() || 'A'}
          </div>
          <div className="hidden md:block">
            <p className="font-medium text-gray-800 dark:text-white text-sm">
              {user?.fullName || user?.userName || 'Admin'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Administrator
            </p>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed left-0 top-0 bottom-0 w-64 bg-white dark:bg-gray-800 z-50 shadow-xl md:hidden">
            {/* Mobile sidebar content would go here */}
          </div>
        </>
      )}
    </header>
  );
};

export default AdminHeader;