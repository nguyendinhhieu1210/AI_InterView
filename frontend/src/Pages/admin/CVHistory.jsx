// src/pages/admin/CVHistory.jsx
import { FileText } from 'lucide-react';

export default function CVHistory() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white">CV History</h1>
      <p className="text-gray-500 dark:text-gray-400 mt-2">View all CV uploads and analysis history</p>
      <div className="mt-8 p-12 text-center bg-gray-50 dark:bg-gray-900/50 rounded-xl">
        <FileText className="w-16 h-16 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-500">CV history module coming soon</p>
      </div>
    </div>
  );
}