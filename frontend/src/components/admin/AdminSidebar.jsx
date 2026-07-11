// src/components/admin/AdminSidebar.jsx - Thêm menu Exam Sets
import { NavLink } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  FileText,
  Code,
  Brain,
  History,
  Menu,
  X,
  BookOpen,
  Layers,
} from 'lucide-react';

const AdminSidebar = ({ collapsed, onToggle, onLogout }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const menuItems = [
    { name: 'Dashboard', icon: <LayoutDashboard size={18} />, path: '/admin' },
    { name: 'Users', icon: <Users size={18} />, path: '/admin/users' },
    {
      name: 'Interviews',
      icon: <Briefcase size={18} />,
      path: '/admin/interviews',
    },
    {
      name: 'CV Interviews',
      icon: <FileText size={18} />,
      path: '/admin/cv-history',
    },
    {
      name: 'Coding Interviews',
      icon: <Code size={18} />,
      path: '/admin/coding-sessions',
    },
    {
      name: 'Adaptive Interviews',
      icon: <Brain size={18} />,
      path: '/admin/adaptive-sessions',
    },
    {
      name: 'Question Bank',
      icon: <BookOpen size={18} />,
      path: '/admin/questions',
    },
    {
      name: 'Exam Sets',
      icon: <Layers size={18} />,
      path: '/admin/exam-sets',
    },
    { name: 'System Logs', icon: <History size={18} />, path: '/admin/logs' },
    { name: 'Settings', icon: <Settings size={18} />, path: '/admin/settings' },
  ];

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setMobileOpen(false);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileOpen]);

  const handleMobileToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLinkClick = () => {
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  // Desktop Sidebar
  const DesktopSidebar = () => (
    <aside
      className={`hidden md:flex flex-col bg-white dark:bg-gray-800/95 border-r border-gray-200/60 dark:border-gray-700/60 transition-all duration-300 relative ${
        collapsed ? 'w-16' : 'w-56'
      }`}
    >
      {/* Logo */}
      <div
        className={`flex items-center ${collapsed ? 'justify-center px-1' : 'px-5'} h-14 border-b border-gray-200/60 dark:border-gray-700/60`}
      >
        {!collapsed ? (
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-xs">AI</span>
            </div>
            <h1 className="font-semibold text-base tracking-tight bg-gradient-to-r from-indigo-600 to-blue-500 bg-clip-text text-transparent">
              AI Interview
            </h1>
          </div>
        ) : (
          <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-lg flex items-center justify-center transition-transform hover:scale-105 shadow-sm">
            <span className="text-white font-bold text-xs">AI</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2.5 py-3 space-y-0.5 overflow-y-auto max-h-[calc(100vh-7rem)]">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/admin'}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-200 group ${
                isActive
                  ? 'bg-gradient-to-r from-indigo-500/90 to-blue-500/90 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100/80 dark:hover:bg-gray-700/50'
              } ${collapsed ? 'justify-center' : ''}`
            }
            title={collapsed ? item.name : ''}
          >
            <span className={`${collapsed ? '' : 'flex-shrink-0'}`}>
              {item.icon}
            </span>
            {!collapsed && (
              <span className="font-medium text-sm tracking-wide">
                {item.name}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer & Logout */}
      <div className="px-2.5 py-2.5 border-t border-gray-200/60 dark:border-gray-700/60 mt-auto">
        <button
          onClick={onLogout}
          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-red-500 hover:text-red-600 hover:bg-red-50/80 dark:hover:bg-red-950/30 transition-all duration-200 group w-full ${
            collapsed ? 'justify-center' : ''
          }`}
          title={collapsed ? 'Logout' : ''}
        >
          <span className="flex-shrink-0">
            <LogOut size={18} />
          </span>
          {!collapsed && <span className="font-medium text-sm">Logout</span>}
        </button>
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={onToggle}
        className="absolute -right-2.5 top-20 bg-white dark:bg-gray-800 border border-gray-200/60 dark:border-gray-700/60 rounded-full p-1 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-110 z-10"
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </aside>
  );

  // Mobile Sidebar
  const MobileSidebar = () => (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={handleMobileToggle}
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-lg border border-gray-200/60 dark:border-gray-700/60 hover:bg-gray-100/90 dark:hover:bg-gray-700/90 transition"
      >
        <Menu size={18} className="text-gray-600 dark:text-gray-300" />
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={handleMobileToggle}
        />
      )}

      {/* Mobile Sidebar Panel */}
      <div
        className={`
          md:hidden fixed top-0 left-0 h-full w-64 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm
          shadow-2xl z-50 transition-transform duration-300 ease-in-out
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Mobile Header */}
        <div className="flex items-center justify-between px-4 h-14 border-b border-gray-200/60 dark:border-gray-700/60">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-xs">AI</span>
            </div>
            <h1 className="font-semibold text-base tracking-tight bg-gradient-to-r from-indigo-600 to-blue-500 bg-clip-text text-transparent">
              AI Interview
            </h1>
          </div>
          <button
            onClick={handleMobileToggle}
            className="p-1.5 rounded-lg hover:bg-gray-100/80 dark:hover:bg-gray-700/50 transition"
          >
            <X size={18} className="text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        {/* Mobile Navigation */}
        <nav className="flex-1 px-2.5 py-3 space-y-0.5 overflow-y-auto h-[calc(100vh-7rem)]">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/admin'}
              onClick={handleLinkClick}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-500/90 to-blue-500/90 text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100/80 dark:hover:bg-gray-700/50'
                }`
              }
            >
              {item.icon}
              <span className="font-medium text-sm tracking-wide">
                {item.name}
              </span>
            </NavLink>
          ))}
        </nav>

        {/* Mobile Footer */}
        <div className="px-2.5 py-2.5 border-t border-gray-200/60 dark:border-gray-700/60">
          <button
            onClick={() => {
              handleLinkClick();
              onLogout();
            }}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-red-500 hover:text-red-600 hover:bg-red-50/80 dark:hover:bg-red-950/30 transition-all duration-200 w-full"
          >
            <LogOut size={18} />
            <span className="font-medium text-sm">Logout</span>
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      <DesktopSidebar />
      <MobileSidebar />
    </>
  );
};

export default AdminSidebar;
