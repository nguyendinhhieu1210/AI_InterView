// src/components/admin/AdminSidebar.jsx
import { NavLink } from "react-router-dom";
import { useState, useEffect } from "react";
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
} from "lucide-react";

const AdminSidebar = ({ collapsed, onToggle, onLogout }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const menuItems = [
    { name: "Dashboard", icon: <LayoutDashboard size={20} />, path: "/admin" },
    { name: "Users", icon: <Users size={20} />, path: "/admin/users" },
    {
      name: "Interviews",
      icon: <Briefcase size={20} />,
      path: "/admin/interviews",
    },
    {
      name: "CV Interviews",
      icon: <FileText size={20} />,
      path: "/admin/cv-history",
    },
    {
      name: "Coding Interviews",
      icon: <Code size={20} />,
      path: "/admin/coding-sessions",
    },
    {
      name: "Adaptive Interviews",
      icon: <Brain size={20} />,
      path: "/admin/adaptive-sessions",
    },
    { name: "System Logs", icon: <History size={20} />, path: "/admin/logs" },
    { name: "Settings", icon: <Settings size={20} />, path: "/admin/settings" },
  ];

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setMobileOpen(false);
      }
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
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
      className={`hidden md:flex flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 relative ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Logo - Giống header */}
      <div
        className={`flex items-center ${collapsed ? "justify-center px-2" : "px-6"} h-16 border-b border-gray-200 dark:border-gray-700`}
      >
        {!collapsed ? (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-lg flex items-center justify-center shadow-md">
              <span className="text-white font-semibold text-sm">AI</span>
            </div>
            <h1 className="font-semibold text-lg tracking-tight bg-gradient-to-r from-indigo-600 to-blue-500 bg-clip-text text-transparent">
              AI Interview
            </h1>
          </div>
        ) : (
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-lg flex items-center justify-center transition-transform hover:scale-105 shadow-md">
            <span className="text-white font-semibold text-sm">AI</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-8rem)]">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/admin"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                isActive
                  ? "bg-gradient-to-r from-indigo-500 to-blue-500 text-white shadow-md"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              } ${collapsed ? "justify-center" : ""}`
            }
            title={collapsed ? item.name : ""}
          >
            <div className="transition-transform group-hover:scale-110">
              {item.icon}
            </div>
            {!collapsed && (
              <span className="font-medium text-sm">{item.name}</span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer & Logout */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-700 mt-auto">
        <button
          onClick={onLogout}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all duration-200 group w-full ${
            collapsed ? "justify-center" : ""
          }`}
          title={collapsed ? "Logout" : ""}
        >
          <div className="transition-transform group-hover:scale-110">
            <LogOut size={20} />
          </div>
          {!collapsed && <span className="font-medium text-sm">Logout</span>}
        </button>
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-20 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full p-1.5 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-110 z-10"
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>
    </aside>
  );

  // Mobile Sidebar
  const MobileSidebar = () => (
    <>
      {/* Mobile Menu Button - Giống header */}
      <button
        onClick={handleMobileToggle}
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
      >
        <Menu size={20} className="text-gray-600 dark:text-gray-300" />
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
          onClick={handleMobileToggle}
        />
      )}

      {/* Mobile Sidebar Panel */}
      <div
        className={`
          md:hidden fixed top-0 left-0 h-full w-72 bg-white dark:bg-gray-800 
          shadow-2xl z-50 transition-transform duration-300 ease-in-out
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Mobile Header - Giống header desktop */}
        <div className="flex items-center justify-between px-4 h-16 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-lg flex items-center justify-center shadow-md">
              <span className="text-white font-semibold text-sm">AI</span>
            </div>
            <h1 className="font-semibold text-lg tracking-tight bg-gradient-to-r from-indigo-600 to-blue-500 bg-clip-text text-transparent">
              AI Interview
            </h1>
          </div>
          <button
            onClick={handleMobileToggle}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            <X size={20} className="text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        {/* Mobile Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto h-[calc(100vh-8rem)]">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/admin"}
              onClick={handleLinkClick}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                  isActive
                    ? "bg-gradient-to-r from-indigo-500 to-blue-500 text-white shadow-md"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`
              }
            >
              {item.icon}
              <span className="font-medium text-sm">{item.name}</span>
            </NavLink>
          ))}
        </nav>

        {/* Mobile Footer */}
        <div className="p-3 border-t border-gray-200 dark:border-gray-700 mt-auto">
          <button
            onClick={() => {
              handleLinkClick();
              onLogout();
            }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all duration-200 w-full"
          >
            <LogOut size={20} />
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
