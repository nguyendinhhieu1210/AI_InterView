// components/CVInfoModal.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Sparkles,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  AlertCircle,
} from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';
import { useInterview } from '../contexts/InterviewContext';
import { useAuth } from '../contexts/AuthContext';

// Import Base Components
import { BaseButton } from './base/BaseButton';
import { BaseCard } from './base/BaseCard';
import { BaseModal } from './base/BaseModal';
import { BaseBadge } from './base/BaseBadge';

pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.js';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function mergeBrokenVietnamese(text) {
  if (!text) return '';
  let merged = text.replace(/(\p{L})\s+(\p{M})/gu, '$1$2');
  merged = merged.replace(/\s+/g, ' ').trim();
  return merged;
}

export const CVInfoModal = ({
  cvData,
  onClose,
  onStartInterview,
  onQuestionsGenerated,
}) => {
  const navigate = useNavigate();
  const { startInterview, setIsGenerating: setGlobalGenerating } =
    useInterview();
  const { token, updateActivity, logout } = useAuth();

  const [generating, setGenerating] = useState(false);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [cvText, setCvText] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [skills, setSkills] = useState({
    frontend: [],
    backend: [],
    theory: [],
    devops: [],
  });
  const [selectedSkills, setSelectedSkills] = useState({
    frontend: [],
    backend: [],
    theory: [],
    devops: [],
  });
  const [showCvPreview, setShowCvPreview] = useState(true);
  const [isMobileView, setIsMobileView] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const MAX_SKILLS = 4;

  useEffect(() => {
    const check = () => setIsMobileView(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    setShowCvPreview(!isMobileView);
  }, [isMobileView]);

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  useEffect(() => {
    if (cvData?.fullName && cvData?.skills && cvData?.rawText) {
      setFullName(cvData.fullName);
      setCvText(cvData.rawText);
      const s = cvData.skills;
      setSkills(s);
      setSelectedSkills({
        frontend: [...(s.frontend || [])],
        backend: [...(s.backend || [])],
        theory: [...(s.theory || [])],
        devops: [...(s.devops || [])],
      });
    }
  }, [cvData]);

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

  const extractFullText = async (pdfDocument) => {
    let fullText = '';
    for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
      const page = await pdfDocument.getPage(pageNum);
      const textContent = await page.getTextContent();
      const items = textContent.items.filter(
        (item) => item.str && item.str.trim() !== ''
      );
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
        if (lastX !== null && x - lastX > 10) lineText += ' ';
        lineText += item.str;
        lastY = y;
        lastX = x;
      }
      if (lineText) fullText += lineText.trim() + '\n';
      fullText += '\n';
    }
    return mergeBrokenVietnamese(fullText);
  };

  const onLoadSuccess = async (pdf) => {
    setNumPages(pdf.numPages);
    setPageNumber(1);
    updateActivity();

    if (cvData?.rawText && cvData?.skills && cvData?.fullName) return;

    setAnalyzing(true);
    setErrorMessage('');
    try {
      const rawText = await extractFullText(pdf);
      setCvText(rawText);

      const response = await fetchWithAuth(`${BASE_URL}/cv/analyze-text`, {
        method: 'POST',
        body: JSON.stringify({ cvText: rawText }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();

      setFullName(data.fullName || '');
      const receivedSkills = data.skills || {
        frontend: [],
        backend: [],
        theory: [],
        devops: [],
      };
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
    updateActivity();
    const isCurrentlySelected = selectedSkills[category].includes(skill);
    if (!isCurrentlySelected && totalSelected >= MAX_SKILLS) {
      setErrorMessage(
        `You can only select up to ${MAX_SKILLS} skills. Please deselect another skill first.`
      );
      return;
    }
    setSelectedSkills((prev) => ({
      ...prev,
      [category]: prev[category].includes(skill)
        ? prev[category].filter((s) => s !== skill)
        : [...prev[category], skill],
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
    updateActivity();
    setGenerating(true);
    setGlobalGenerating(true);
    setErrorMessage('');

    try {
      const response = await fetchWithAuth(
        `${BASE_URL}/cv/generate-questions`,
        {
          method: 'POST',
          body: JSON.stringify({ cvText, selectedSkills }),
        }
      );
      const result = await response.json();

      if (result.success && result.questions) {
        const interviewData = {
          questions: result.questions,
          cvInfo: { fullName, selectedSkills },
        };
        startInterview(interviewData);
        onClose();
        navigate('/cvinterview');
        if (onQuestionsGenerated) onQuestionsGenerated(interviewData);
        if (onStartInterview) onStartInterview(interviewData);
        setGlobalGenerating(false);
        setGenerating(false);
      } else {
        throw new Error(result.message || 'Invalid response');
      }
    } catch (err) {
      console.error('Generate error', err);
      setErrorMessage(
        err.message || 'Failed to generate questions. Please try again.'
      );
      setGlobalGenerating(false);
      setGenerating(false);
    }
  };

  const goPrevPage = () => {
    if (pageNumber > 1) {
      setPageNumber((p) => p - 1);
      updateActivity();
    }
  };
  const goNextPage = () => {
    if (numPages && pageNumber < numPages) {
      setPageNumber((p) => p + 1);
      updateActivity();
    }
  };

  const SkillGroup = ({ title, items, selectedItems, onToggle }) => (
    <div className="mb-5">
      <h3 className="font-semibold text-text mb-2 flex justify-between">
        <span>{title}</span>
        <BaseBadge variant="default" size="sm" rounded>
          {items.length}
        </BaseBadge>
      </h3>
      <div className="flex flex-wrap gap-2">
        {items.map((skill) => (
          <label
            key={skill}
            className={`inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full cursor-pointer transition-all duration-200 ${
              selectedItems.includes(skill)
                ? 'bg-primary/20 text-primary ring-2 ring-primary/50 shadow-sm'
                : 'bg-muted/10 text-text hover:bg-muted/20'
            } ${generating ? 'pointer-events-none opacity-60' : ''}`}
          >
            <input
              type="checkbox"
              checked={selectedItems.includes(skill)}
              onChange={() => onToggle(skill)}
              className="w-3.5 h-3.5 accent-primary"
              disabled={generating}
            />
            <span className="capitalize">{skill}</span>
          </label>
        ))}
        {items.length === 0 && (
          <p className="text-xs text-muted italic">No skills detected</p>
        )}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 md:p-4 animate-fadeIn">
      <div className="bg-card rounded-2xl shadow-soft w-full max-w-7xl max-h-[95vh] flex flex-col overflow-hidden transform transition-all duration-300 scale-100 relative border border-border">
        {/* Loading Overlay */}
        {generating && (
          <>
            <div className="absolute inset-0 bg-transparent z-40" />
            <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
              <BaseCard className="p-6 flex flex-col items-center gap-3 pointer-events-auto">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
                <p className="text-text font-medium">
                  AI is generating questions...
                </p>
              </BaseCard>
            </div>
          </>
        )}

        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-border bg-gradient-to-r from-primary/5 to-secondary/5 sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-bold text-text">
              CV Preview & Analysis
            </h2>
            <p className="text-sm text-muted">
              {cvData?.fileName || 'Your document'}
            </p>
          </div>
          <BaseButton
            variant="ghost"
            size="sm"
            leftIcon={<X className="w-5 h-5" />}
            onClick={() => {
              updateActivity();
              onClose();
            }}
            className="p-2 hover:bg-muted/20 rounded-full"
          />
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto p-4 md:p-6 bg-muted/5">
          {/* Error Message */}
          {errorMessage && (
            <div className="mb-4 p-3 bg-error/10 border border-error/30 rounded-lg flex items-start gap-2 animate-in slide-in-from-top-2">
              <AlertCircle className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
              <div className="flex-1 text-sm text-error">{errorMessage}</div>
              <BaseButton
                variant="ghost"
                size="sm"
                leftIcon={<X className="w-4 h-4" />}
                onClick={() => setErrorMessage('')}
                className="text-error hover:text-error/80"
              />
            </div>
          )}

          <div
            className={`flex flex-col ${!isMobileView ? 'md:flex-row' : ''} gap-5`}
          >
            {/* CV Preview */}
            {(showCvPreview || !isMobileView) && (
              <div
                className={`${isMobileView ? 'w-full' : 'md:w-1/2 lg:w-3/5'} transition-all duration-300`}
              >
                <BaseCard className="p-3">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-medium text-text">
                      📄 Document Preview
                    </h3>
                    {isMobileView && (
                      <BaseButton
                        variant="outline"
                        size="sm"
                        leftIcon={<EyeOff className="w-3.5" />}
                        onClick={() => {
                          updateActivity();
                          setShowCvPreview(false);
                        }}
                        className="text-primary border-border"
                      >
                        Hide
                      </BaseButton>
                    )}
                  </div>
                  <div className="overflow-auto flex justify-center bg-muted/10 rounded-lg min-h-[300px] p-2">
                    <Document
                      file={cvData.fileUrl}
                      onLoadSuccess={onLoadSuccess}
                      loading={
                        <div className="p-10">
                          <Loader2 className="animate-spin text-primary" />
                        </div>
                      }
                      error={
                        <div className="p-10 text-error">
                          Failed to load PDF
                        </div>
                      }
                    >
                      <Page
                        pageNumber={pageNumber}
                        width={isMobileView ? 320 : 500}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                        className="shadow-md"
                      />
                    </Document>
                  </div>
                  {numPages > 1 && (
                    <div className="flex justify-center gap-4 mt-4 pt-2 border-t border-border">
                      <BaseButton
                        variant="ghost"
                        size="sm"
                        disabled={pageNumber === 1}
                        onClick={goPrevPage}
                        className="p-1.5 disabled:opacity-30"
                      >
                        <ChevronLeft />
                      </BaseButton>
                      <BaseBadge variant="default" rounded>
                        Page {pageNumber} / {numPages}
                      </BaseBadge>
                      <BaseButton
                        variant="ghost"
                        size="sm"
                        disabled={pageNumber === numPages}
                        onClick={goNextPage}
                        className="p-1.5 disabled:opacity-30"
                      >
                        <ChevronRight />
                      </BaseButton>
                    </div>
                  )}
                </BaseCard>
              </div>
            )}

            {/* AI Analysis */}
            <div className={`${isMobileView ? 'w-full' : 'md:w-1/2 lg:w-2/5'}`}>
              {isMobileView && !showCvPreview && (
                <BaseButton
                  variant="outline"
                  fullWidth
                  leftIcon={<Eye className="w-4" />}
                  onClick={() => {
                    updateActivity();
                    setShowCvPreview(true);
                  }}
                  className="mb-3 py-2 border-border"
                >
                  Show CV Preview
                </BaseButton>
              )}
              <BaseCard className="overflow-hidden">
                <div className="p-4 bg-gradient-to-r from-primary/5 to-secondary/5 border-b border-border">
                  <h3 className="font-bold flex gap-2 text-primary">
                    <Sparkles className="text-primary" /> AI Analysis
                  </h3>
                </div>
                <div className="p-4">
                  {analyzing ? (
                    <div className="flex flex-col items-center py-10">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      <p className="mt-2 font-medium text-text">
                        AI is analyzing your CV...
                      </p>
                      <p className="text-xs text-muted">
                        Scanning all pages for skills
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="mb-5 bg-gradient-to-r from-muted/10 to-primary/5 rounded-xl p-3 border border-primary/20">
                        <label className="text-xs font-semibold uppercase tracking-wide text-primary">
                          Full Name
                        </label>
                        <div className="font-bold text-lg text-text">
                          {fullName || 'Not detected'}
                        </div>
                      </div>
                      <div className="flex justify-between items-center mb-2 text-sm">
                        <span className="text-text">🎯 Skills Summary</span>
                        <BaseBadge
                          variant={isMaxExceeded ? 'error' : 'success'}
                          rounded
                        >
                          {totalSelected} / {MAX_SKILLS} selected
                        </BaseBadge>
                      </div>
                      {isMaxExceeded && (
                        <div className="mb-4 p-3 bg-warning/10 border border-warning/30 rounded-lg">
                          <p className="text-warning font-semibold text-sm">
                            ⚠️ Too many skills selected (max {MAX_SKILLS})
                          </p>
                          <p className="text-warning/80 text-xs mt-1">
                            You have selected {totalSelected} skills. Please
                            deselect some to focus on{' '}
                            <strong>2-3 core skills</strong>.
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
              </BaseCard>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-card border-t border-border p-4 sticky bottom-0">
          <BaseButton
            variant="primary"
            size="lg"
            fullWidth
            loading={generating}
            leftIcon={!generating && <Sparkles className="w-5 h-5" />}
            onClick={handleGenerate}
            disabled={
              generating || analyzing || totalSelected === 0 || isMaxExceeded
            }
            className="py-3 transform hover:scale-[1.02]"
          >
            {totalSelected === 0
              ? 'Select at least one skill'
              : isMaxExceeded
                ? `Please select up to ${MAX_SKILLS} skills`
                : `Start Interview (${totalSelected} skill${totalSelected > 1 ? 's' : ''})`}
          </BaseButton>
          {isMaxExceeded && (
            <p className="text-center text-xs text-error mt-2">
              ⚡ Deselect some skills (max {MAX_SKILLS})
            </p>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; backdrop-filter: blur(0px); }
          to { opacity: 1; backdrop-filter: blur(8px); }
        }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
      `}</style>
    </div>
  );
};
