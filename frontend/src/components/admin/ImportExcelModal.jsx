// frontend/src/components/admin/ImportExcelModal.jsx
import React, { useState } from 'react';
import {
  X,
  Upload,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';

export default function ImportExcelModal({ onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const ext = selectedFile.name.split('.').pop().toLowerCase();
      if (['xlsx', 'xls'].includes(ext)) {
        setFile(selectedFile);
        setResult(null);
      } else {
        toast.error('Please select an Excel file (.xlsx or .xls)');
        e.target.value = '';
      }
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast.error('Please select a file');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/admin/questions/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setResult({
        success: true,
        message: response.data.message,
        total: response.data.total,
        // ✅ Đổi từ topics → programmingLanguages
        programmingLanguages: response.data.programmingLanguages || [],
      });

      toast.success(response.data.message);
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (error) {
      const errorData = error.response?.data;
      setResult({
        success: false,
        message: errorData?.message || 'Import failed',
        errors: errorData?.errors || [],
      });
      toast.error(errorData?.message || 'Import failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            Import Questions from Excel
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Template Info */}
          <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-blue-800 dark:text-blue-300">
                  Excel Format Requirements
                </p>
                <ul className="mt-1 text-sm text-blue-700 dark:text-blue-400 space-y-0.5">
                  <li>
                    • <strong>Question</strong> - The question text
                  </li>
                  <li>
                    • <strong>Option A, B, C, D</strong> - Four answer choices
                  </li>
                  <li>
                    • <strong>Correct Answer</strong> - A, B, C, or D
                  </li>
                  <li>
                    • <strong>Explanation</strong> - Why the answer is correct
                  </li>
                  <li>
                    • <strong>Programming Language</strong> - e.g., JavaScript,
                    Python, React {/* ✅ Đổi */}
                  </li>
                  <li>
                    • <strong>Difficulty</strong> (Optional) -
                    Easy/Medium/Hard/Expert
                  </li>
                  <li>
                    • <strong>Tags</strong> (Optional) - Comma separated
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* File Upload */}
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors relative ${
              file
                ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'
            }`}
          >
            {file ? (
              <div className="flex flex-col items-center gap-2">
                <CheckCircle className="w-12 h-12 text-emerald-500" />
                <p className="font-medium text-gray-800 dark:text-white">
                  {file.name}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setFile(null);
                    setResult(null);
                  }}
                  className="text-sm text-red-600 hover:text-red-700 dark:text-red-400"
                >
                  Remove file
                </button>
              </div>
            ) : (
              <>
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 dark:text-gray-300">
                  Drag & drop your Excel file here, or{' '}
                  <span className="text-blue-600 dark:text-blue-400 font-medium">
                    browse
                  </span>
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                  Supports .xlsx and .xls files
                </p>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </>
            )}
          </div>

          {/* Result */}
          {result && (
            <div
              className={`rounded-lg p-4 ${
                result.success
                  ? 'bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800'
                  : 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800'
              }`}
            >
              <p
                className={`font-medium ${
                  result.success
                    ? 'text-green-800 dark:text-green-300'
                    : 'text-red-800 dark:text-red-300'
                }`}
              >
                {result.message}
              </p>
              {result.total && (
                <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                  Total: {result.total} questions imported
                </p>
              )}
              {/* ✅ Hiển thị danh sách programming languages đã import */}
              {result.programmingLanguages &&
                result.programmingLanguages.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm font-medium text-green-700 dark:text-green-400">
                      Programming Languages:
                    </p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {result.programmingLanguages.map((lang) => (
                        <span
                          key={lang.name}
                          className="px-2 py-1 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 text-xs rounded"
                        >
                          {lang.name} ({lang.count})
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              {result.errors && result.errors.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm font-medium text-red-700 dark:text-red-300">
                    Errors:
                  </p>
                  <ul className="text-sm text-red-600 dark:text-red-400 space-y-0.5 mt-1">
                    {result.errors.slice(0, 5).map((err, idx) => (
                      <li key={idx}>
                        • Row {err.row}: {err.error}
                      </li>
                    ))}
                    {result.errors.length > 5 && (
                      <li>... and {result.errors.length - 5} more errors</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={!file || loading}
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              )}
              Import Questions
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
