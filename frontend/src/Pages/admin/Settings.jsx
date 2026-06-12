// src/pages/admin/Settings.jsx
import { Settings as SettingsIcon } from 'lucide-react';

export default function Settings() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Settings</h1>
      <p className="text-gray-500 dark:text-gray-400 mt-2">System settings coming soon...</p>
      <div className="mt-8 p-12 text-center bg-gray-50 dark:bg-gray-900/50 rounded-xl">
        <SettingsIcon className="w-16 h-16 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-500">This module is under development</p>
      </div>
    </div>
  );
}