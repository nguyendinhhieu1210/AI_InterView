// frontend/src/components/admin/CreateExamSetModal.jsx
import React, { useState, useEffect } from 'react';
import { X, Layers, FileText, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';

export default function CreateExamSetModal({
  editingExamSet,
  onClose,
  onSuccess,
  programmingLanguages,
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: editingExamSet?.name || '',
    programmingLanguage: editingExamSet?.programmingLanguage || '',
    description: editingExamSet?.description || '',
    numberOfQuestions: 20,
  });
  const [result, setResult] = useState(null);
  const [maxAvailable, setMaxAvailable] = useState(0);

  // ✅ Danh sách ngôn ngữ đã có exam set (bất kể active/inactive)
  const [usedLanguages, setUsedLanguages] = useState([]);
  const [loadingUsedLanguages, setLoadingUsedLanguages] = useState(false);

  // ✅ Fetch danh sách exam set hiện có để biết ngôn ngữ nào đã được dùng
  useEffect(() => {
    if (editingExamSet) return; // chỉ cần khi tạo mới

    let isMounted = true;
    setLoadingUsedLanguages(true);

    api
      .get('/admin/exam-sets')
      .then((res) => {
        if (!isMounted) return;
        const existing = res.data?.data || [];
        const usedList = existing.map((e) => e.programmingLanguage);
        setUsedLanguages(usedList);
      })
      .catch((error) => {
        console.error('Failed to fetch existing exam sets:', error);
        // Không chặn form nếu fetch lỗi, chỉ log — backend vẫn sẽ chặn khi submit
      })
      .finally(() => {
        if (isMounted) setLoadingUsedLanguages(false);
      });

    return () => {
      isMounted = false;
    };
  }, [editingExamSet]);

  // ✅ Khi chọn ngôn ngữ, tự động cập nhật số lượng câu hỏi tối đa
  useEffect(() => {
    if (formData.programmingLanguage && programmingLanguages) {
      const selected = programmingLanguages.find(
        (lang) => lang.name === formData.programmingLanguage
      );
      if (selected) {
        const max = selected.count || 0;
        setMaxAvailable(max);

        // ✅ Tự động set số lượng câu hỏi = tối đa (hoặc 20 nếu max > 20)
        if (!editingExamSet) {
          const defaultCount = Math.min(max, 20);
          setFormData((prev) => ({
            ...prev,
            numberOfQuestions: defaultCount > 0 ? defaultCount : 5,
          }));
        }
      }
    }
  }, [formData.programmingLanguage, programmingLanguages, editingExamSet]);

  // ✅ Nếu ngôn ngữ đang chọn bỗng nằm trong danh sách đã dùng (vd sau khi fetch xong),
  // reset lựa chọn để tránh submit vào ngôn ngữ không hợp lệ
  useEffect(() => {
    if (
      !editingExamSet &&
      formData.programmingLanguage &&
      usedLanguages.includes(formData.programmingLanguage)
    ) {
      setFormData((prev) => ({ ...prev, programmingLanguage: '' }));
      toast.error(
        `"${formData.programmingLanguage}" đã có exam set. Vui lòng chọn ngôn ngữ khác.`
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usedLanguages]);

  const isLanguageUsed = (langName) => usedLanguages.includes(langName);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.programmingLanguage) {
      toast.error('Please select a programming language');
      return;
    }

    // ✅ Chặn thêm ở frontend: ngôn ngữ đã có exam set thì không cho submit
    if (!editingExamSet && isLanguageUsed(formData.programmingLanguage)) {
      toast.error(
        `⚠️ "${formData.programmingLanguage}" already has an exam set. Please delete it first or choose another language.`
      );
      return;
    }

    // ✅ Kiểm tra số lượng câu hỏi yêu cầu có vượt quá số lượng có sẵn không
    if (formData.numberOfQuestions > maxAvailable) {
      toast.error(
        `⚠️ Only ${maxAvailable} questions available for "${formData.programmingLanguage}". Please reduce the number of questions.`
      );
      return;
    }

    if (formData.numberOfQuestions < 1) {
      toast.error('Please enter at least 1 question');
      return;
    }

    setLoading(true);
    try {
      if (editingExamSet) {
        await api.put(`/admin/exam-sets/${editingExamSet._id}`, {
          name: formData.name,
          description: formData.description,
        });
        toast.success('Exam set updated successfully!');
      } else {
        const response = await api.post('/admin/exam-sets', {
          name: formData.name,
          programmingLanguage: formData.programmingLanguage,
          description: formData.description,
          numberOfQuestions: formData.numberOfQuestions,
        });
        setResult(response.data.data);
        toast.success(response.data.message);
      }

      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (error) {
      const message =
        error.response?.data?.message || 'Failed to create exam set';
      toast.error(message);

      // ✅ Nếu backend báo ngôn ngữ đã tồn tại (race condition hoặc dữ liệu cũ),
      // cập nhật lại usedLanguages ngay để UI đồng bộ
      if (error.response?.data?.existingExamSet) {
        setUsedLanguages((prev) =>
          prev.includes(formData.programmingLanguage)
            ? prev
            : [...prev, formData.programmingLanguage]
        );
        setFormData((prev) => ({ ...prev, programmingLanguage: '' }));
      }
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
            <Layers className="w-5 h-5 text-purple-600" />
            {editingExamSet ? 'Edit Exam Set' : 'Create Exam Set'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Exam Set Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:text-white"
              placeholder="e.g., JavaScript Core Exam Set 1"
              required
            />
          </div>

          {/* Programming Language */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Programming Language <span className="text-red-500">*</span>
              </label>
              {!editingExamSet && loadingUsedLanguages && (
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Checking availability...
                </span>
              )}
            </div>
            <select
              value={formData.programmingLanguage}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  programmingLanguage: e.target.value,
                })
              }
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:text-white disabled:opacity-60"
              disabled={!!editingExamSet || loadingUsedLanguages}
            >
              <option value="">Select a programming language</option>
              {programmingLanguages &&
                programmingLanguages.map((lang) => {
                  const notEnough = lang.count < 5;
                  const alreadyUsed =
                    !editingExamSet && isLanguageUsed(lang.name);
                  const disabled = notEnough || alreadyUsed;

                  let suffix = '';
                  if (alreadyUsed) suffix = ' ✅ Already has an exam set';
                  else if (notEnough)
                    suffix = ' ⚠️ Not enough questions (min 5)';

                  return (
                    <option
                      key={lang.name}
                      value={lang.name}
                      disabled={disabled}
                    >
                      {lang.name} ({lang.count} questions){suffix}
                    </option>
                  );
                })}
            </select>

            {editingExamSet ? (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Programming language cannot be changed after creation
              </p>
            ) : (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Select a programming language with at least 5 questions
                available. Languages that already have an exam set are disabled
                — delete the existing exam set to create a new one.
              </p>
            )}

            {/* ✅ Danh sách nhỏ các ngôn ngữ đã có exam set, để user không phải đoán */}
            {!editingExamSet &&
              !loadingUsedLanguages &&
              usedLanguages.length > 0 && (
                <div className="mt-2 flex items-start gap-1.5 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-2">
                  <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0 text-purple-500" />
                  <span>
                    Already have an exam set:{' '}
                    <span className="font-medium text-gray-600 dark:text-gray-300">
                      {usedLanguages.join(', ')}
                    </span>
                  </span>
                </div>
              )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={2}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:text-white resize-none"
              placeholder="Describe what this exam set covers..."
            />
          </div>

          {/* Number of Questions (only for new) */}
          {!editingExamSet && (
            <div>
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Number of Questions <span className="text-red-500">*</span>
                </label>
                {formData.programmingLanguage && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Max: {maxAvailable} questions available
                  </span>
                )}
              </div>
              <input
                type="number"
                min="1"
                max={maxAvailable || 100}
                value={formData.numberOfQuestions}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 1;
                  // ✅ Giới hạn không vượt quá số lượng có sẵn
                  const limitedValue = Math.min(value, maxAvailable || 100);
                  setFormData({
                    ...formData,
                    numberOfQuestions: Math.max(1, limitedValue),
                  });
                }}
                disabled={!formData.programmingLanguage}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:text-white disabled:opacity-60"
              />
              <div className="flex justify-between items-center mt-1">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Min: 1, Max: {maxAvailable || 0} questions
                </p>
                {formData.numberOfQuestions > maxAvailable && (
                  <p className="text-xs text-red-500 dark:text-red-400">
                    ⚠️ Exceeds available questions!
                  </p>
                )}
              </div>
              {/* ✅ Nút tự động set số lượng tối đa */}
              {formData.programmingLanguage && maxAvailable > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setFormData({
                      ...formData,
                      numberOfQuestions: maxAvailable,
                    });
                  }}
                  className="mt-2 text-xs text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 font-medium"
                >
                  Use all {maxAvailable} questions
                </button>
              )}
            </div>
          )}

          {/* Result Preview */}
          {result && !editingExamSet && (
            <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg p-4 space-y-2">
              <p className="font-medium text-green-800 dark:text-green-300 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Exam Set Generated!
              </p>
              <div className="space-y-1 text-sm text-green-700 dark:text-green-400">
                <p>
                  • <strong>Name:</strong> {result.name}
                </p>
                <p>
                  • <strong>Programming Language:</strong>{' '}
                  {result.programmingLanguage}
                </p>
                <p>
                  • <strong>Total Questions:</strong> {result.totalQuestions}
                </p>
                {result.difficultyStats && (
                  <div>
                    <strong>Difficulty Distribution:</strong>
                    <div className="flex gap-2 mt-1 flex-wrap">
                      {Object.entries(result.difficultyStats).map(
                        ([level, count]) => (
                          <span
                            key={level}
                            className="px-2 py-0.5 bg-green-100 dark:bg-green-800/50 rounded text-xs"
                          >
                            {level}: {count}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                )}
                {result.totalAvailable && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    Available: {result.totalAvailable} questions in this
                    language
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                loading ||
                (!editingExamSet &&
                  (!formData.programmingLanguage ||
                    loadingUsedLanguages ||
                    isLanguageUsed(formData.programmingLanguage) ||
                    formData.numberOfQuestions > maxAvailable ||
                    formData.numberOfQuestions < 1))
              }
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              )}
              {editingExamSet ? 'Update Exam Set' : 'Generate Exam Set'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
