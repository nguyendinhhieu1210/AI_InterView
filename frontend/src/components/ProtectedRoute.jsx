import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  console.log(
    'ProtectedRoute:',
    loading,
    isAuthenticated
  );

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <span className="text-gray-500 text-lg">
          Loading...
        </span>
      </div>
    );
  }

  return isAuthenticated
    ? children
    : <Navigate to="/login" replace />;
};

export default ProtectedRoute;