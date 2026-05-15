import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Sparkles, Loader2, ChevronLeft, ChevronRight, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';
import { useInterview } from '../contexts/InterviewContext';
import { useAuth } from '../contexts/AuthContext'; // ✅ import AuthContext

pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.js';

function mergeBrokenVietnamese(text) {
  if (!text) return '';
  let merged = text.replace(/(\p{L})\s+(\p{M})/gu, '$1$2');
  merged = merged.replace(/\s+/g, ' ').trim();
  return merged;
}

export const CVInfoModal = ({ cvData, onClose, onStartInterview, onQuestionsGenerated }) => {
  const navigate = useNavigate();
  const { startInterview, setIsGenerating: setGlobalGenerating } = useInterview();
  const { token, updateActivity, logout } = useAuth(); // ✅ lấy token và các hàm từ Auth

  const [generating, setGenerating] = useState(false);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [cvText, setCvText] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [skills, setSkills] = useState({ frontend: [], backend: [], theory: [], devops: [] });
  const [selectedSkills, setSelectedSkills] = useState({ frontend: [], backend: [], theory: [], devops: [] });
  const [showCvPreview, setShowCvPreview] = useState(true);
  const [isMobileView, setIsMobileView] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const MAX_SKILLS = 4;

  // Cập nhật responsive
  useEffect(() => {
    const check = () => setIsMobileView(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    setShowCvPreview(!isMobileView);
  }, [isMobileView]);

  // Tự động xóa thông báo lỗi sau 5 giây
  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  // Hàm gọi API có gửi token
  const fetchWithAuth = async (url, options = {}) => {
    if (!token) {
      logout();
      throw new Error('Session expired. Please login again.');
    }
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    };
    const response = await fetch(url, { ...options, headers });
    if (response.status === 401) {
      logout();
      throw new Error('Your session has expired. Please login again.');
    }
    return response;
  };

  // Trích xuất text từ PDF (giữ nguyên)
  const extractFullText = async (pdfDocument) => {
    let fullText = '';
    for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
      const page = await pdfDocument.getPage(pageNum);
      const textContent = await page.getTextContent();
      const items = textContent.items.filter(item => item.str && item.str.trim() !== '');
      if (items.length === 0) continue;

      items.sort((a, b) => {
        const yA = a.transform[5];
        const yB = b.transform[5];
        if (Math.abs(yA - yB) > 5) return yB - yA;
        return a.transform[4] - b.transform[4];
      });

      let lastY = null;
      let lastX = null;
      let lineText = '';
      for (const item of items) {
        const y = item.transform[5];
        const x = item.transform[4];
        if (lastY !== null && Math.abs(y - lastY) > 5) {
          fullText += lineText.trim() + '\n';
          lineText = '';
          lastX = null;
        }
        if (lastX !== null && x - lastX > 10) {
          lineText += ' ';
        }
        lineText += item.str;
        lastY = y;
        lastX = x;
      }
      if (lineText) fullText += lineText.trim() + '\n';
      fullText += '\n';
    }
    return mergeBrokenVietnamese(fullText);
  };

  // Load PDF thành công -> phân tích CV
  const onLoadSuccess = async (pdf) => {
    setNumPages(pdf.numPages);
    setPageNumber(1);
    setAnalyzing(true);
    setErrorMessage('');
    updateActivity(); // cập nhật hoạt động

    try {
      const rawText = await extractFullText(pdf);
      setCvText(rawText);

      const response = await fetchWithAuth('/api/cv/analyze-text', {
        method: 'POST',
        body: JSON.stringify({ cvText: rawText }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();

      setFullName(data.fullName || '');
      const receivedSkills = data.skills || { frontend: [], backend: [], theory: [], devops: [] };
      setSkills(receivedSkills);
      setSelectedSkills({
        frontend: [...receivedSkills.frontend],
        backend: [...receivedSkills.backend],
        theory: [...receivedSkills.theory],
        devops: [...(receivedSkills.devops || [])],
      });
    } catch (err) {
      console.error('CV analysis failed', err);
      setErrorMessage(err.message || 'Failed to analyze CV. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const totalSelected =
    selectedSkills.frontend.length +
    selectedSkills.backend.length +
    selectedSkills.theory.length +
    (selectedSkills.devops?.length || 0);

  const isMaxExceeded = totalSelected > MAX_SKILLS;

  const toggleSkill = (category, skill) => {
    if (generating) return;
    updateActivity(); // ✅ cập nhật activity khi tương tác

    const isCurrentlySelected = selectedSkills[category].includes(skill);
    if (!isCurrentlySelected && totalSelected >= MAX_SKILLS) {
      setErrorMessage(`You can only select up to ${MAX_SKILLS} skills. Please deselect another skill first.`);
      return;
    }

    setSelectedSkills(prev => ({
      ...prev,
      [category]: prev[category].includes(skill)
        ? prev[category].filter(s => s !== skill)
        : [...prev[category], skill]
    }));
    if (errorMessage) setErrorMessage('');
  };

  const handleGenerate = async () => {
    if (!cvText) {
      setErrorMessage('CV content not ready yet. Please wait.');
      return;
    }
    if (isMaxExceeded) {
      setErrorMessage(`Please select at most ${MAX_SKILLS} skills.`);
      return;
    }
    if (totalSelected === 0) {
      setErrorMessage('Please select at least one skill.');
      return;
    }
    updateActivity(); // cập nhật activity

    setGenerating(true);
    setGlobalGenerating(true);
    setErrorMessage('');

    try {
      const response = await fetchWithAuth('/api/cv/generate-questions', {
        method: 'POST',
        body: JSON.stringify({ cvText, selectedSkills }),
      });
      const result = await response.json();

      if (result.success && result.questions) {
        const interviewData = {
          questions: result.questions,
          cvInfo: { fullName, selectedSkills }
        };
        startInterview(interviewData);
        setTimeout(() => {
          onClose();
          if (onQuestionsGenerated) onQuestionsGenerated(interviewData);
          else if (onStartInterview) onStartInterview(interviewData);
          else navigate('/cvinterview');
          setGlobalGenerating(false);
        }, 500);
      } else {
        throw new Error(result.message || 'Invalid response');
      }
    } catch (err) {
      console.error('Generate error', err);
      setErrorMessage(err.message || 'Failed to generate questions. Please try again.');
      setGlobalGenerating(false);
      setGenerating(false);
    }
  };

  // Chuyển trang PDF – cập nhật activity
  const goPrevPage = () => {
    if (pageNumber > 1) {
      setPageNumber(p => p - 1);
      updateActivity();
    }
  };
  const goNextPage = () => {
    if (numPages && pageNumber < numPages) {
      setPageNumber(p => p + 1);
      updateActivity();
    }
  };

  const SkillGroup = ({ title, items, selectedItems, onToggle }) => (
    <div className="mb-5">
      <h3 className="font-semibold text-gray-800 mb-2 flex justify-between">
        <span>{title}</span>
        <span className="text-xs bg-gray-200 px-2 py-0.5 rounded-full">{items.length}</span>
      </h3>
      <div className="flex flex-wrap gap-2">
        {items.map(skill => (
          <label
            key={skill}
            className={`inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full cursor-pointer transition-all duration-200 ${
              selectedItems.includes(skill)
                ? 'bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-800 ring-2 ring-indigo-300 shadow-sm'
                : 'bg-gray-100 hover:bg-gray-200'
            } ${generating ? 'pointer-events-none opacity-60' : ''}`}
          >
            <input
              type="checkbox"
              checked={selectedItems.includes(skill)}
              onChange={() => onToggle(skill)}
              className="w-3.5 h-3.5 accent-indigo-600"
              disabled={generating}
            />
            <span className="capitalize">{skill}</span>
          </label>
        ))}
        {items.length === 0 && <p className="text-xs text-gray-400 italic">No skills detected</p>}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 md:p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[95vh] flex flex-col overflow-hidden transform transition-all duration-300 scale-100 relative">
        {generating && (
          <>
            <div className="absolute inset-0 bg-transparent z-40" />
            <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl p-6 flex flex-col items-center gap-3 pointer-events-auto">
                <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
                <p className="text-gray-700 font-medium">AI is generating questions...</p>
              </div>
            </div>
          </>
        )}

        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b bg-gradient-to-r from-indigo-50 to-purple-50 sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-bold bg-gradient-to-r from-indigo-700 to-purple-700 bg-clip-text text-transparent">CV Preview & Analysis</h2>
            <p className="text-sm text-gray-500">{cvData?.fileName || 'Your document'}</p>
          </div>
          <button onClick={() => { updateActivity(); onClose(); }} className="p-2 hover:bg-white/60 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto p-4 md:p-6 bg-gray-50/30">
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 animate-in slide-in-from-top-2">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1 text-sm text-red-700">{errorMessage}</div>
              <button onClick={() => setErrorMessage('')} className="text-red-500 hover:text-red-700">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className={`flex flex-col ${!isMobileView ? 'md:flex-row' : ''} gap-5`}>
            {/* CV preview */}
            {(showCvPreview || !isMobileView) && (
              <div className={`${isMobileView ? 'w-full' : 'md:w-1/2 lg:w-3/5'} transition-all duration-300`}>
                <div className="bg-white rounded-xl shadow-md border border-gray-100 p-3">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-medium text-gray-700">📄 Document Preview</h3>
                    {isMobileView && (
                      <button onClick={() => { updateActivity(); setShowCvPreview(false); }} className="text-indigo-600 flex gap-1 border px-2 py-1 rounded-full text-sm">
                        <EyeOff className="w-3.5" /> Hide
                      </button>
                    )}
                  </div>
                  <div className="overflow-auto flex justify-center bg-gray-100 rounded-lg min-h-[300px] p-2">
                    <Document
                      file={cvData.fileUrl}
                      onLoadSuccess={onLoadSuccess}
                      loading={<div className="p-10"><Loader2 className="animate-spin text-indigo-600" /></div>}
                      error={<div className="p-10 text-red-500">Failed to load PDF</div>}
                    >
                      <Page
                        pageNumber={pageNumber}
                        width={isMobileView ? 320 : 500}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                        className="shadow-lg"
                      />
                    </Document>
                  </div>
                  {numPages > 1 && (
                    <div className="flex justify-center gap-4 mt-4 pt-2 border-t">
                      <button
                        disabled={pageNumber === 1}
                        onClick={goPrevPage}
                        className="p-1.5 disabled:opacity-30 hover:bg-gray-100 rounded-full"
                      >
                        <ChevronLeft />
                      </button>
                      <span className="text-sm bg-gray-100 px-3 py-1 rounded-full">
                        Page {pageNumber} / {numPages}
                      </span>
                      <button
                        disabled={pageNumber === numPages}
                        onClick={goNextPage}
                        className="p-1.5 disabled:opacity-30 hover:bg-gray-100 rounded-full"
                      >
                        <ChevronRight />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Analysis Panel */}
            <div className={`${isMobileView ? 'w-full' : 'md:w-1/2 lg:w-2/5'}`}>
              {isMobileView && !showCvPreview && (
                <button
                  onClick={() => { updateActivity(); setShowCvPreview(true); }}
                  className="w-full mb-3 py-2 bg-indigo-50 text-indigo-700 rounded-xl flex items-center justify-center gap-2 border"
                >
                  <Eye className="w-4" /> Show CV Preview
                </button>
              )}
              <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
                <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-b">
                  <h3 className="font-bold flex gap-2 text-indigo-800">
                    <Sparkles className="text-indigo-600" /> AI Analysis
                  </h3>
                </div>
                <div className="p-4">
                  {analyzing ? (
                    <div className="flex flex-col items-center py-10">
                      <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                      <p className="mt-2 font-medium">AI is analyzing your CV...</p>
                      <p className="text-xs text-gray-400">Scanning all pages for skills</p>
                    </div>
                  ) : (
                    <>
                      <div className="mb-5 bg-gradient-to-r from-gray-50 to-indigo-50/30 rounded-xl p-3 border border-indigo-100">
                        <label className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Full Name</label>
                        <div className="font-bold text-lg">{fullName || 'Not detected'}</div>
                      </div>

                      <div className="flex justify-between items-center mb-2 text-sm">
                        <span>🎯 Skills Summary</span>
                        <span className={`px-2 py-0.5 rounded-full font-medium ${isMaxExceeded ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                          {totalSelected} / {MAX_SKILLS} selected
                        </span>
                      </div>

                      {isMaxExceeded && (
                        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                          <p className="text-amber-700 font-semibold text-sm">⚠️ Too many skills selected (max {MAX_SKILLS})</p>
                          <p className="text-amber-600 text-xs mt-1">
                            You have selected {totalSelected} skills. Please deselect some to focus on <strong>2-3 core skills</strong> for a better interview experience.
                          </p>
                        </div>
                      )}

                      <SkillGroup
                        title="Frontend"
                        items={skills.frontend}
                        selectedItems={selectedSkills.frontend}
                        onToggle={(s) => toggleSkill('frontend', s)}
                      />
                      <SkillGroup
                        title="Backend"
                        items={skills.backend}
                        selectedItems={selectedSkills.backend}
                        onToggle={(s) => toggleSkill('backend', s)}
                      />
                      <SkillGroup
                        title="Core Knowledge"
                        items={skills.theory}
                        selectedItems={selectedSkills.theory}
                        onToggle={(s) => toggleSkill('theory', s)}
                      />
                      <SkillGroup
                        title="Tools & DevOps"
                        items={skills.devops || []}
                        selectedItems={selectedSkills.devops || []}
                        onToggle={(s) => toggleSkill('devops', s)}
                      />
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-white border-t p-4 sticky bottom-0">
          <button
            onClick={handleGenerate}
            disabled={generating || analyzing || totalSelected === 0 || isMaxExceeded}
            className={`w-full py-3 rounded-xl flex justify-center items-center gap-2 font-bold transition-all duration-300 transform hover:scale-[1.02] ${
              generating || analyzing || totalSelected === 0 || isMaxExceeded
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg'
            }`}
          >
            <Sparkles className="w-5 h-5" />
            {totalSelected === 0
              ? 'Select at least one skill'
              : isMaxExceeded
              ? `Please select up to ${MAX_SKILLS} skills`
              : `Start Interview (${totalSelected} skill${totalSelected > 1 ? 's' : ''})`}
          </button>
          {isMaxExceeded && (
            <p className="text-center text-xs text-red-500 mt-2">
              ⚡ Deselect some skills (max {MAX_SKILLS})
            </p>
          )}
        </div>
      </div>
    </div>
  );
};