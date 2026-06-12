// pages/admin/UserDetail.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";
import {
  ArrowLeft,
  Mail,
  Calendar,
  Shield,
  CheckCircle,
  XCircle,
  Edit2,
  Save,
  X,
} from "lucide-react";

export default function UserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    fetchUser();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchUser = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/users/admin/users/${id}`);
      setUser(response.data.user);
      setEditForm({
        fullName: response.data.user.fullName || "",
        userName: response.data.user.userName || "",
        email: response.data.user.email || "",
        role: response.data.user.role || "user",
        isVerified: response.data.user.isVerified || false,
      });
    } catch (error) {
      console.error("Failed to fetch user:", error);
      navigate("/admin/users");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      await api.put(`/users/admin/users/${id}`, editForm);
      fetchUser();
      setEditing(false);
    } catch (error) {
      console.error("Update failed:", error);
      alert("Failed to update user");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate("/admin/users")}
        className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-indigo-600 transition"
      >
        <ArrowLeft size={18} />
        Back to Users
      </button>

      {/* Profile Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-500 to-blue-500 px-6 py-8">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm text-white flex items-center justify-center text-3xl font-bold border-2 border-white">
              {user.fullName?.charAt(0)?.toUpperCase() ||
                user.userName?.charAt(0)?.toUpperCase()}
            </div>
            <div className="text-white">
              {editing ? (
                <input
                  value={editForm.fullName}
                  onChange={(e) =>
                    setEditForm({ ...editForm, fullName: e.target.value })
                  }
                  className="text-2xl font-bold bg-white/20 rounded-lg px-3 py-1 text-white placeholder-white/50"
                />
              ) : (
                <h1 className="text-2xl font-bold">
                  {user.fullName || user.userName}
                </h1>
              )}
              <p className="text-white/80">@{user.userName}</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
              <Mail className="w-5 h-5 text-indigo-500" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Email
                </p>
                {editing ? (
                  <input
                    value={editForm.email}
                    onChange={(e) =>
                      setEditForm({ ...editForm, email: e.target.value })
                    }
                    className="text-sm font-medium bg-white dark:bg-gray-700 rounded px-2 py-1"
                  />
                ) : (
                  <p className="text-sm font-medium text-gray-800 dark:text-white">
                    {user.email}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
              <Calendar className="w-5 h-5 text-indigo-500" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Joined
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white">
                  {new Date(user.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
              <Shield className="w-5 h-5 text-indigo-500" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Role</p>
                {editing ? (
                  <select
                    value={editForm.role}
                    onChange={(e) =>
                      setEditForm({ ...editForm, role: e.target.value })
                    }
                    className="text-sm font-medium bg-white dark:bg-gray-700 rounded px-2 py-1"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                ) : (
                  <p className="text-sm font-medium text-gray-800 dark:text-white capitalize">
                    {user.role}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
              {user.isVerified ? (
                <CheckCircle className="w-5 h-5 text-emerald-500" />
              ) : (
                <XCircle className="w-5 h-5 text-amber-500" />
              )}
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Verification Status
                </p>
                {editing ? (
                  <label className="flex items-center gap-2 mt-1">
                    <input
                      type="checkbox"
                      checked={editForm.isVerified}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          isVerified: e.target.checked,
                        })
                      }
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm">Verified</span>
                  </label>
                ) : (
                  <p className="text-sm font-medium text-gray-800 dark:text-white">
                    {user.isVerified ? "Verified" : "Not Verified"}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
            {editing ? (
              <>
                <button
                  onClick={handleSave}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg"
                >
                  <Save size={16} />
                  Save Changes
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg"
                >
                  <X size={16} />
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditing(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-lg"
              >
                <Edit2 size={16} />
                Edit Profile
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
