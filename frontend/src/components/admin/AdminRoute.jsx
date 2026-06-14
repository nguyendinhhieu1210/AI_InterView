// src/components/admin/AdminRoute.jsx
import { Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

const AdminRoute = ({ children }) => {
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    console.log('Token exists:', !!token);
    console.log('User string from storage:', userStr);
    
    if (!token) {
      setIsAdmin(false);
      setChecking(false);
      return;
    }
    
    try {
      const user = JSON.parse(userStr);
      console.log('Parsed user:', user);
      console.log('User role type:', typeof user.role);
      console.log('User role value:', user.role);
      
      // Kiểm tra cả 'admin' và 'ADMIN'
      const isUserAdmin = user.role === 'admin' || user.role === 'ADMIN';
      console.log('Is admin check result:', isUserAdmin);
      
      setIsAdmin(isUserAdmin);
    } catch (error) {
      console.error('Error parsing user:', error);
      setIsAdmin(false);
    }
    
    setChecking(false);
  }, []);

  if (checking) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  const token = localStorage.getItem('token');
  
  if (!token) {
    return <Navigate to="/login" />;
  }

  if (!isAdmin) {
    return <Navigate to="/welcome" />;
  }

  return children;
};

export default AdminRoute;