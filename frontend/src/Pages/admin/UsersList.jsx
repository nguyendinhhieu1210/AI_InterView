// src/pages/admin/UsersList.jsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import {
  Search,
  UserPlus,
  Eye,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Key,
  CheckCircle,
} from "lucide-react";
import toast from "react-hot-toast";

export default function UsersList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showDeleteModal, setShowDeleteModal] = useState(null);
  const [showResetModal, setShowResetModal] = useState(null);
  const [showEditModal, setShowEditModal] = useState(null);
  const [resetPassword, setResetPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [editForm, setEditForm] = useState({ fullName: "", email: "" });
  const [editLoading, setEditLoading] = useState(false);
  const [successPopup, setSuccessPopup] = useState(null);

  const limit = 10;

  useEffect(() => {
    fetchUsers();
  }, [page, search, roleFilter]);

  useEffect(() => {
    if (successPopup) {
      const timer = setTimeout(() => setSuccessPopup(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [successPopup]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = { page, limit };
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;

      const response = await api.get("/users/admin/users", { params });
      setUsers(response.data.users || []);
      setTotalPages(response.data.pages || 1);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId) => {
    try {
      await api.delete(`/users/admin/users/${userId}`);
      toast.success("User deleted successfully");
      fetchUsers();
      setShowDeleteModal(null);
    } catch (error) {
      console.error("Delete failed:", error);
      toast.error("Failed to delete user");
    }
  };

  const handleResetPassword = async (userId) => {
    if (!resetPassword || resetPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setResetLoading(true);
    try {
      await api.put(`/users/admin/users/${userId}/reset-password`, {
        newPassword: resetPassword,
      });
      setSuccessPopup({ message: "Password reset successfully!", userId });
      setShowResetModal(null);
      setResetPassword("");
    } catch (error) {
      console.error("Reset failed:", error);
      toast.error("Failed to reset password");
    } finally {
      setResetLoading(false);
    }
  };

  const handleEditUser = async (userId) => {
    if (!editForm.fullName || !editForm.email) {
      toast.error("Please fill all fields");
      return;
    }
    setEditLoading(true);
    try {
      await api.put(`/users/admin/users/${userId}`, {
        fullName: editForm.fullName,
        email: editForm.email,
      });
      toast.success("User updated successfully");
      setShowEditModal(null);
      fetchUsers();
    } catch (error) {
      console.error("Edit failed:", error);
      toast.error("Failed to update user");
    } finally {
      setEditLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.put(`/users/admin/users/${userId}`, { role: newRole });
      toast.success("Role updated");
      fetchUsers();
    } catch (error) {
      console.error("Role update failed:", error);
      toast.error("Failed to update role");
    }
  };

  const handleVerifyToggle = async (userId, currentVerified) => {
    try {
      await api.put(`/users/admin/users/${userId}`, {
        isVerified: !currentVerified,
      });
      toast.success(`User ${!currentVerified ? "verified" : "unverified"}`);
      fetchUsers();
    } catch (error) {
      console.error("Verify update failed:", error);
      toast.error("Failed to update verification status");
    }
  };

  // Hàm lấy chữ cái đầu từ fullName
  const getInitials = (fullName) => {
    if (!fullName) return "U";
    const nameParts = fullName.trim().split(/\s+/);
    if (nameParts.length === 1) {
      return nameParts[0].charAt(0).toUpperCase();
    }
    // Lấy chữ cái đầu của từ đầu và từ cuối
    const firstInitial = nameParts[0].charAt(0).toUpperCase();
    const lastInitial = nameParts[nameParts.length - 1].charAt(0).toUpperCase();
    return `${firstInitial}${lastInitial}`;
  };

  return (
    <div className="space-y-4 md:space-y-5 p-4 md:p-6">
      {/* Success Popup */}
      {successPopup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-sm w-full">
            <div className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <CheckCircle
                    size={20}
                    className="text-emerald-600 dark:text-emerald-400"
                  />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-white">
                    Success!
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {successPopup.message}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSuccessPopup(null)}
                className="w-full py-2 bg-emerald-500 text-white rounded-lg text-sm hover:bg-emerald-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white">
            User Management
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Manage system users, roles, and permissions
          </p>
        </div>
        <button className="inline-flex items-center justify-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-gradient-to-r from-indigo-600 to-blue-500 text-white rounded-lg text-sm font-medium shadow hover:shadow-md transition-all">
          <UserPlus size={16} />
          <span className="hidden sm:inline">Add User</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-3 md:p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, or username..."
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Roles</option>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
          <button
            onClick={() => {
              setSearch("");
              setRoleFilter("");
              setPage(1);
            }}
            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  User
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Email
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Role
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Joined
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto"></div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-12 text-center text-gray-500 dark:text-gray-400"
                  >
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user._id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition duration-150"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-blue-500 text-white flex items-center justify-center font-semibold text-sm shadow-md flex-shrink-0">
                          {getInitials(user.fullName || user.userName)}
                        </div>
                        <div>
                          <p className="font-medium text-sm text-gray-800 dark:text-white">
                            {user.fullName || user.userName}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            @{user.userName}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                      {user.email}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() =>
                          handleVerifyToggle(user._id, user.isVerified)
                        }
                        className={`px-2 py-0.5 text-xs rounded-full ${
                          user.isVerified
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400"
                        }`}
                      >
                        {user.isVerified ? "Verified" : "Pending"}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={user.role}
                        onChange={(e) =>
                          handleRoleChange(user._id, e.target.value)
                        }
                        className="px-2 py-1 text-xs rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          to={`/admin/users/${user._id}`}
                          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </Link>
                        <button
                          onClick={() => {
                            setEditForm({
                              fullName: user.fullName || "",
                              email: user.email,
                            });
                            setShowEditModal(user);
                          }}
                          className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/30 text-blue-500 transition-colors"
                          title="Edit User"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => setShowResetModal(user)}
                          className="p-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/30 text-amber-500 transition-colors"
                          title="Reset Password"
                        >
                          <Key size={16} />
                        </button>
                        <button
                          onClick={() => setShowDeleteModal(user)}
                          className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-red-500 transition-colors"
                          title="Delete User"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-900/30">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white dark:hover:bg-gray-800 transition"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white dark:hover:bg-gray-800 transition"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-sm w-full">
            <div className="p-5">
              <h3 className="font-bold text-lg mb-2 text-gray-800 dark:text-white">
                Delete User
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-5">
                Delete{" "}
                <span className="font-semibold">
                  {showDeleteModal.fullName || showDeleteModal.userName}
                </span>
                ?
              </p>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowDeleteModal(null)}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(showDeleteModal._id)}
                  className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-sm hover:bg-red-600"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full">
            <div className="p-5">
              <h3 className="font-bold text-lg mb-2 text-gray-800 dark:text-white">
                Edit User
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Editing{" "}
                <span className="font-semibold">
                  {showEditModal.fullName || showEditModal.userName}
                </span>
              </p>
              <div className="space-y-3 mb-5">
                <input
                  type="text"
                  placeholder="Full Name"
                  value={editForm.fullName}
                  onChange={(e) =>
                    setEditForm({ ...editForm, fullName: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:ring-2 focus:ring-indigo-500"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={editForm.email}
                  onChange={(e) =>
                    setEditForm({ ...editForm, email: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => {
                    setShowEditModal(null);
                    setEditForm({ fullName: "", email: "" });
                  }}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleEditUser(showEditModal._id)}
                  disabled={editLoading}
                  className="px-3 py-1.5 rounded-lg bg-blue-500 text-white text-sm hover:bg-blue-600 disabled:opacity-50"
                >
                  {editLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full">
            <div className="p-5">
              <h3 className="font-bold text-lg mb-2 text-gray-800 dark:text-white">
                Reset Password
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Reset for{" "}
                <span className="font-semibold">
                  {showResetModal.fullName || showResetModal.userName}
                </span>
              </p>
              <input
                type="password"
                placeholder="New password (min 6 characters)"
                value={resetPassword}
                onChange={(e) => setResetPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm mb-5 focus:ring-2 focus:ring-indigo-500"
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => {
                    setShowResetModal(null);
                    setResetPassword("");
                  }}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleResetPassword(showResetModal._id)}
                  disabled={resetLoading}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 text-white text-sm hover:bg-amber-600 disabled:opacity-50"
                >
                  {resetLoading ? "Resetting..." : "Reset"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
