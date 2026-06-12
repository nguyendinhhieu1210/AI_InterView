// src/pages/admin/Dashboard.jsx
import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Users, UserCheck, UserX, Shield, TrendingUp } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalAdmins: 0,
    verifiedUsers: 0,
    unverifiedUsers: 0
  });
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, usersRes] = await Promise.all([
        api.get('/users/admin/users/stats'),
        api.get('/users/admin/users?limit=5')
      ]);
      setStats(statsRes.data);
      setRecentUsers(usersRes.data.users || []);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { title: 'Total Users', value: stats.totalUsers, icon: Users, color: 'from-blue-500 to-cyan-500', bg: 'bg-blue-50 dark:bg-blue-950/30' },
    { title: 'Verified Users', value: stats.verifiedUsers, icon: UserCheck, color: 'from-emerald-500 to-teal-500', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
    { title: 'Unverified', value: stats.unverifiedUsers, icon: UserX, color: 'from-amber-500 to-orange-500', bg: 'bg-amber-50 dark:bg-amber-950/30' },
    { title: 'Administrators', value: stats.totalAdmins, icon: Shield, color: 'from-purple-500 to-pink-500', bg: 'bg-purple-50 dark:bg-purple-950/30' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Welcome back! Here's an overview of your system.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 transition-all hover:shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-800 dark:text-white mt-1">{stat.value.toLocaleString()}</p>
                </div>
                <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} shadow-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Users */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-800 dark:text-white">Recent Users</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Latest registered users</p>
          </div>
          <TrendingUp className="w-5 h-5 text-gray-400" />
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {recentUsers.map((user) => (
            <div key={user._id} className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-blue-400 text-white flex items-center justify-center font-bold">
                  {user.fullName?.charAt(0)?.toUpperCase() || user.userName?.charAt(0)?.toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-gray-800 dark:text-white">{user.fullName || user.userName}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 text-xs rounded-full ${
                  user.isVerified 
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400' 
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400'
                }`}>
                  {user.isVerified ? 'Verified' : 'Pending'}
                </span>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  user.role === 'admin'
                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-400'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                }`}>
                  {user.role}
                </span>
              </div>
            </div>
          ))}
          {recentUsers.length === 0 && (
            <div className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
              No users found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}