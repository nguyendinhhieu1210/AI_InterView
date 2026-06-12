import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";

const AdminRoute = ({ children }) => {
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");

    if (!token || !userStr) {
      setChecking(false);
      return;
    }

    setHasToken(true);

    try {
      const user = JSON.parse(userStr);
      const isUserAdmin = user.role === "admin" || user.role === "ADMIN";
      setIsAdmin(isUserAdmin);
    } catch {
      setIsAdmin(false);
    }

    setChecking(false);
  }, []);

  if (checking) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500" />
      </div>
    );
  }

  if (!hasToken) return <Navigate to="/login" />;
  if (!isAdmin) return <Navigate to="/welcome" />;

  return children;
};

export default AdminRoute;
