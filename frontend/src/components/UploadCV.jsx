import { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, Loader2, FileText, X } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export const UploadCV = ({ onUploadSuccess }) => {
  const { darkMode } = useTheme();
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);
  const objectUrlRef = useRef(null);
  const isUploadingRef = useRef(false);
  // Thêm ref để lưu file data
  const fileDataRef = useRef(null);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
      if (fileDataRef.current) {
        URL.revokeObjectURL(fileDataRef.current);
        fileDataRef.current = null;
      }
    };
  }, []);

  const processFile = useCallback(
    async (file) => {
      if (!file) return;
      if (isUploadingRef.current) return;

      if (file.type !== 'application/pdf') {
        alert('Please select a PDF file');
        return;
      }

      isUploadingRef.current = true;
      setUploading(true);

      try {
        // Revoke old URLs
        if (objectUrlRef.current) {
          URL.revokeObjectURL(objectUrlRef.current);
          objectUrlRef.current = null;
        }
        if (fileDataRef.current) {
          URL.revokeObjectURL(fileDataRef.current);
          fileDataRef.current = null;
        }

        // Tạo object URL cho preview
        const fileUrl = URL.createObjectURL(file);
        objectUrlRef.current = fileUrl;
        fileDataRef.current = fileUrl; // Giữ ref
        setSelectedFile(file);

        // Đọc file thành ArrayBuffer để gửi lên server
        const arrayBuffer = await file.arrayBuffer();

        const formData = new FormData();
        formData.append('cv', file);
        const token = localStorage.getItem('token');
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/cv/upload`,
          {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
          }
        );
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Upload failed');

        if (onUploadSuccess) {
          onUploadSuccess({
            fileUrl: fileUrl, // Vẫn truyền blob URL
            fileData: arrayBuffer, // Thêm file data dạng ArrayBuffer
            fileName: file.name,
            fullName: data.fullName,
            skills: data.skills,
            rawText: data.rawText,
          });
        }
      } catch (error) {
        console.error('Upload error:', error);
        alert(error.message);
        setSelectedFile(null);
        if (objectUrlRef.current) {
          URL.revokeObjectURL(objectUrlRef.current);
          objectUrlRef.current = null;
        }
        if (fileDataRef.current) {
          URL.revokeObjectURL(fileDataRef.current);
          fileDataRef.current = null;
        }
      } finally {
        setUploading(false);
        isUploadingRef.current = false;
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    },
    [onUploadSuccess]
  );

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    processFile(file);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    if (fileDataRef.current) {
      URL.revokeObjectURL(fileDataRef.current);
      fileDataRef.current = null;
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      alert('Please drop a PDF file');
      return;
    }
    processFile(file);
  };

  return (
    <div
      className={`rounded-xl border-2 border-dashed transition-all duration-200 p-4 text-center cursor-pointer group
        ${
          darkMode
            ? 'border-gray-600 bg-gray-800/40 hover:border-indigo-400 hover:bg-gray-800/60'
            : 'border-gray-300 bg-gray-50/80 hover:border-indigo-400 hover:bg-indigo-50/30'
        }`}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={() => !uploading && fileInputRef.current?.click()}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        onChange={handleFileChange}
        className="hidden"
      />

      {uploading ? (
        <div className="flex flex-col items-center gap-2 py-2">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          <p
            className={`text-sm font-medium ${darkMode ? 'text-indigo-300' : 'text-indigo-700'}`}
          >
            Processing PDF...
          </p>
        </div>
      ) : selectedFile ? (
        <div
          className={`flex items-center justify-between gap-2 p-2 rounded-lg ${darkMode ? 'bg-gray-700/80' : 'bg-white shadow-sm'}`}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <FileText
              className={`w-4 h-4 ${darkMode ? 'text-indigo-300' : 'text-indigo-600'}`}
            />
            <span
              className={`text-sm font-medium truncate ${darkMode ? 'text-white' : 'text-gray-800'}`}
            >
              {selectedFile.name}
            </span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleRemoveFile();
            }}
            className={`p-1 rounded-full transition-colors ${darkMode ? 'hover:bg-gray-600 text-gray-300 hover:text-red-400' : 'hover:bg-gray-100 text-gray-500 hover:text-red-500'}`}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="py-3">
          <div
            className={`w-12 h-12 mx-auto rounded-xl flex items-center justify-center transition-all group-hover:scale-105 ${darkMode ? 'bg-indigo-900/30' : 'bg-indigo-100'}`}
          >
            <Upload
              className={`w-5 h-5 ${darkMode ? 'text-indigo-300' : 'text-indigo-600'}`}
            />
          </div>
          <p
            className={`mt-2 text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}
          >
            Upload your CV
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            PDF only • max 10MB
          </p>
        </div>
      )}
    </div>
  );
};
