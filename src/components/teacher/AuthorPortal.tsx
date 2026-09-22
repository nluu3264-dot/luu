/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  SubjectType,
  GradeLevel,
  Lesson,
  Question,
  CognitiveLevel,
  QuestionType,
  AppStoreData,
} from '../../types';
import {
  summarizeDocumentApi,
  generateAIQuestionsApi,
} from '../../services/api';
import { QuestionItem } from '../questions/QuestionItem';
import {
  BookOpen,
  Compass,
  Sparkles,
  Plus,
  Trash2,
  Edit,
  Save,
  FileText,
  UploadCloud,
  Layers,
  HelpCircle,
  CheckCircle,
  RefreshCw,
  Search,
  Filter,
  Image,
  Video,
  ListPlus,
  ChevronRight,
  BookMarked,
  Pencil,
  Check,
  X
} from 'lucide-react';

interface AuthorPortalProps {
  store: AppStoreData;
  onUpdateStore: (data: Partial<AppStoreData>) => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  currentSubject: SubjectType | 'all';
  currentGrade: GradeLevel | 'all';
}

export const AuthorPortal: React.FC<AuthorPortalProps> = ({
  store,
  onUpdateStore,
  activeTab,
  onTabChange,
  currentSubject,
  currentGrade,
}) => {
  // Navigation filters
  const [selectedSubject, setSelectedSubject] = useState<SubjectType>(
    currentSubject === 'all' ? 'lich-su' : currentSubject
  );
  const [selectedGrade, setSelectedGrade] = useState<GradeLevel>(
    currentGrade === 'all' ? 6 : currentGrade
  );

  // Lesson selected in curriculum tree
  const filteredLessons = store.lessons.filter(
    (l) => l.subject === selectedSubject && l.grade === selectedGrade
  );
  const [activeLessonId, setActiveLessonId] = useState<string>(
    filteredLessons[0]?.id || ''
  );
  const currentLesson = store.lessons.find((l) => l.id === activeLessonId) || filteredLessons[0];

  // Lesson sub-section (1: Ly thuyet, 2: Bai tap, 3: Tu luan)
  const [lessonSubSection, setLessonSubSection] = useState<'theory' | 'exercises' | 'essay'>('theory');

  // Theory Inline Editing State
  const [isEditingTheory, setIsEditingTheory] = useState(false);
  const [editTheorySummary, setEditTheorySummary] = useState('');
  const [editTheoryKeyPoints, setEditTheoryKeyPoints] = useState<string[]>([]);

  // New Lesson Modal State
  const [showAddLessonModal, setShowAddLessonModal] = useState(false);
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [newLessonSummary, setNewLessonSummary] = useState('');

  // AI Generator State
  const [aiCount, setAiCount] = useState<number>(10);
  const [aiBiet, setAiBiet] = useState<number>(40);
  const [aiHieu, setAiHieu] = useState<number>(40);
  const [aiVanDung, setAiVanDung] = useState<number>(20);
  const [aiTypes, setAiTypes] = useState<string[]>([
    'multiple-choice',
    'true-false',
    'matching',
    'short-answer',
    'fill-in-blank'
  ]);
  const [aiUploadedFiles, setAiUploadedFiles] = useState<{ name: string; base64: string; mimeType: string }[]>([]);
  const [aiCustomPrompt, setAiCustomPrompt] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiSummarizing, setAiSummarizing] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<Question[]>([]);
  const [aiStatusMsg, setAiStatusMsg] = useState<string | null>(null);

  // Question Bank Search & Filter
  const [qbSearch, setQbSearch] = useState('');
  const [qbCogFilter, setQbCogFilter] = useState<string>('all');
  const [qbTypeFilter, setQbTypeFilter] = useState<string>('all');

  // Manual Question Create State
  const [showAddQuestionModal, setShowAddQuestionModal] = useState(false);
  const [manualQText, setManualQText] = useState('');
  const [manualQType, setManualQType] = useState<QuestionType>('multiple-choice');
  const [manualQCog, setManualQCog] = useState<CognitiveLevel>('biet');
  const [manualOptions, setManualOptions] = useState(['', '', '', '']);
  const [manualCorrectAns, setManualCorrectAns] = useState<number>(0);
  const [manualTFStatements, setManualTFStatements] = useState([
    { statement: '', isCorrect: true },
    { statement: '', isCorrect: false },
  ]);
  const [manualMatching, setManualMatching] = useState([
    { left: '', right: '' },
    { left: '', right: '' },
  ]);
  const [manualShortAns, setManualShortAns] = useState('');
  const [manualEssayGuide, setManualEssayGuide] = useState('');
  const [manualMediaUrl, setManualMediaUrl] = useState('');

  // -------------------------------------------------------------
  // HANDLERS
  // -------------------------------------------------------------

  const handleCreateLesson = () => {
    if (!newLessonTitle.trim()) return;
    const newLesson: Lesson = {
      id: `lesson-${selectedSubject}-${selectedGrade}-${Date.now()}`,
      subject: selectedSubject,
      grade: selectedGrade,
      lessonNumber: filteredLessons.length + 1,
      title: newLessonTitle.trim(),
      theory: {
        summary: newLessonSummary.trim() || 'Tóm tắt bài học đang được cập nhật.',
        keyPoints: [
          'Ý kiến thức trọng tâm 1',
          'Ý kiến thức trọng tâm 2',
        ],
      },
      createdAt: new Date().toISOString(),
    };

    onUpdateStore({ lessons: [...store.lessons, newLesson] });
    setActiveLessonId(newLesson.id);
    setShowAddLessonModal(false);
    setNewLessonTitle('');
    setNewLessonSummary('');
  };

  const handleDeleteLesson = (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa bài học này khỏi chương trình?')) return;
    const remaining = store.lessons.filter((l) => l.id !== id);
    onUpdateStore({ lessons: remaining });
    if (activeLessonId === id) {
      setActiveLessonId(remaining[0]?.id || '');
    }
  };

  const handleSaveLessonTheory = (summary: string, keyPoints: string[]) => {
    if (!currentLesson) return;
    const updated = store.lessons.map((l) => {
      if (l.id === currentLesson.id) {
        return {
          ...l,
          theory: {
            ...l.theory,
            summary,
            keyPoints,
          },
        };
      }
      return l;
    });
    onUpdateStore({ lessons: updated });
  };

  const handleStartEditTheory = () => {
    if (!currentLesson) return;
    setEditTheorySummary(currentLesson.theory.summary || '');
    setEditTheoryKeyPoints(
      currentLesson.theory.keyPoints && currentLesson.theory.keyPoints.length > 0
        ? [...currentLesson.theory.keyPoints]
        : ['']
    );
    setIsEditingTheory(true);
  };

  const handleCancelEditTheory = () => {
    setIsEditingTheory(false);
  };

  const handleSaveEditedTheory = () => {
    if (!currentLesson) return;
    const cleanedPoints = editTheoryKeyPoints.map((p) => p.trim()).filter(Boolean);
    handleSaveLessonTheory(editTheorySummary.trim(), cleanedPoints);
    setIsEditingTheory(false);
  };

  const handleAddKeyPoint = () => {
    setEditTheoryKeyPoints((prev) => [...prev, '']);
  };

  const handleUpdateKeyPoint = (index: number, val: string) => {
    setEditTheoryKeyPoints((prev) => {
      const copy = [...prev];
      copy[index] = val;
      return copy;
    });
  };

  const handleRemoveKeyPoint = (index: number) => {
    setEditTheoryKeyPoints((prev) => {
      const filtered = prev.filter((_, idx) => idx !== index);
      return filtered.length > 0 ? filtered : [''];
    });
  };

  // AI File Upload Reader (supports multiple files at once: PDF, images, Word docs)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        setAiUploadedFiles((prev) => [
          ...prev,
          {
            name: file.name,
            base64,
            mimeType: file.type || 'application/octet-stream',
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  // AI Document Summarize
  const handleAiSummarize = async () => {
    if (!currentLesson && !newLessonTitle) {
      alert('Vui lòng chọn hoặc nhập tên bài học!');
      return;
    }
    setAiSummarizing(true);
    setAiStatusMsg('Đang phân tích tài liệu và tóm tắt lý thuyết bằng Gemini 3.8 Flash...');

    try {
      const res = await summarizeDocumentApi({
        subject: selectedSubject,
        grade: selectedGrade,
        lessonTitle: currentLesson?.title || newLessonTitle,
        files: aiUploadedFiles,
      });

      if (res && currentLesson) {
        handleSaveLessonTheory(res.summary, res.keyPoints);
        setAiStatusMsg('Đã trích xuất và cập nhật lý thuyết bài học thành công!');
      }
    } catch (err: any) {
      setAiStatusMsg(`Lỗi trích xuất: ${err.message}`);
    } finally {
      setAiSummarizing(false);
    }
  };

  // AI Question Generate
  const handleAiGenerateQuestions = async (isAppend = false) => {
    setAiGenerating(true);
    setAiStatusMsg('Gemini AI đang sinh câu hỏi chuẩn theo 3 mức độ nhận thức...');

    try {
      const targetLessonTitle = currentLesson?.title || `Bài học môn ${selectedSubject === 'lich-su' ? 'Lịch sử' : 'Địa lí'} lớp ${selectedGrade}`;
      const questions = await generateAIQuestionsApi({
        subject: selectedSubject,
        grade: selectedGrade,
        lessonTitle: targetLessonTitle,
        lessonTheory: currentLesson?.theory,
        count: aiCount,
        ratios: { biet: aiBiet, hieu: aiHieu, vanDung: aiVanDung },
        questionTypes: aiTypes,
        customPrompt: aiCustomPrompt,
        files: aiUploadedFiles,
      });

      if (isAppend) {
        setGeneratedQuestions((prev) => [...prev, ...questions]);
        setAiStatusMsg(`Đã tạo thêm ${questions.length} câu hỏi thành công!`);
      } else {
        setGeneratedQuestions(questions);
        setAiStatusMsg(`Đã sinh thành công ${questions.length} câu hỏi theo tỉ lệ yêu cầu!`);
      }
    } catch (err: any) {
      setAiStatusMsg(`Lỗi tạo câu hỏi: ${err.message}`);
    } finally {
      setAiGenerating(false);
    }
  };

  const handleSaveAiQuestionsToBank = () => {
    if (generatedQuestions.length === 0) return;
    const updated = [...store.questions, ...generatedQuestions];
    onUpdateStore({ questions: updated });
    setGeneratedQuestions([]);
    setAiStatusMsg(`Đã lưu ${generatedQuestions.length} câu hỏi vào Ngân hàng câu hỏi!`);
  };

  // Manual Question Submit
  const handleSaveManualQuestion = () => {
    if (!manualQText.trim() || !currentLesson) return;

    const newQ: Question = {
      id: `manual-q-${Date.now()}`,
      subject: selectedSubject,
      grade: selectedGrade,
      lessonId: currentLesson.id,
      lessonName: currentLesson.title,
      type: manualQType,
      cognitiveLevel: manualQCog,
      questionText: manualQText.trim(),
      mediaUrl: manualMediaUrl.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    if (manualQType === 'multiple-choice') {
      newQ.options = manualOptions.filter((o) => o.trim().length > 0);
      newQ.correctAnswers = [manualCorrectAns];
    } else if (manualQType === 'true-false') {
      newQ.statements = manualTFStatements.filter((s) => s.statement.trim().length > 0);
    } else if (manualQType === 'matching') {
      newQ.matchingPairs = manualMatching.filter((m) => m.left.trim() && m.right.trim());
    } else if (manualQType === 'short-answer' || manualQType === 'fill-in-blank') {
      newQ.acceptableAnswers = manualShortAns.split(',').map((s) => s.trim());
    } else if (manualQType === 'essay') {
      newQ.essayGuide = manualEssayGuide.trim();
    }

    onUpdateStore({ questions: [...store.questions, newQ] });
    setShowAddQuestionModal(false);
    setManualQText('');
    setManualMediaUrl('');
  };

  const handleDeleteQuestion = (qId: string) => {
    if (!confirm('Bạn có chắc muốn xóa câu hỏi này khỏi ngân hàng?')) return;
    onUpdateStore({ questions: store.questions.filter((q) => q.id !== qId) });
  };

  // Questions for current lesson
  const currentLessonQuestions = store.questions.filter(
    (q) => q.lessonId === currentLesson?.id || q.lessonName === currentLesson?.title
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Subject & Grade Sub-Header Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Khu vực Giáo viên Biên soạn
            </h2>
            <p className="text-xs text-slate-500">
              Biên soạn tóm tắt lý thuyết, tạo ngân hàng câu hỏi đa dạng và sử dụng AI đọc tài liệu
            </p>
          </div>
        </div>

        {/* Subject & Grade Quick Switch */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setSelectedSubject('lich-su')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                selectedSubject === 'lich-su'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Lịch sử
            </button>
            <button
              onClick={() => setSelectedSubject('dia-li')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                selectedSubject === 'dia-li'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Địa lí
            </button>
          </div>

          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            {([6, 7, 8, 9] as const).map((gr) => (
              <button
                key={gr}
                onClick={() => setSelectedGrade(gr)}
                className={`px-2.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  selectedGrade === gr
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Lớp {gr}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ---------------- SECTION 1: KHO NỘI DUNG ÔN TẬP ---------------- */}
      {activeTab === 'curriculum' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Tree Navigation: List of Lessons in Grade */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Cây bài học SGK Lớp {selectedGrade}
                </h3>
                <span className="text-xs text-slate-500">
                  {selectedSubject === 'lich-su' ? 'Phân môn Lịch sử' : 'Phân môn Địa lí'} ({filteredLessons.length} bài)
                </span>
              </div>
              <button
                onClick={() => setShowAddLessonModal(true)}
                className="p-1.5 text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm bài</span>
              </button>
            </div>

            <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-1">
              {filteredLessons.map((les) => (
                <div
                  key={les.id}
                  onClick={() => {
                    setActiveLessonId(les.id);
                    setIsEditingTheory(false);
                  }}
                  className={`p-3 rounded-xl cursor-pointer text-xs sm:text-sm font-medium transition-all flex items-start justify-between gap-2 ${
                    currentLesson?.id === les.id
                      ? 'bg-amber-50/90 text-amber-950 border border-amber-300 shadow-xs'
                      : 'text-slate-700 hover:bg-slate-50 border border-transparent'
                  }`}
                >
                  <div className="flex items-start gap-2 leading-snug">
                    <BookMarked className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>{les.title}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                </div>
              ))}
              {filteredLessons.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-6">Chưa có bài học nào. Hãy bấm "Thêm bài" hoặc dùng AI để tải tài liệu.</p>
              )}
            </div>
          </div>

          {/* Lesson Content Detail View (3 Large Sub-sections) */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            {currentLesson ? (
              <div className="space-y-5">
                {/* Lesson Header Title */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-800 uppercase tracking-wider">
                      {selectedSubject === 'lich-su' ? 'Lịch sử' : 'Địa lí'} • Lớp {selectedGrade}
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-1">
                      {currentLesson.title}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {lessonSubSection === 'theory' && (
                      !isEditingTheory ? (
                        <button
                          onClick={handleStartEditTheory}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors"
                          title="Chỉnh sửa nội dung lý thuyết"
                        >
                          <Pencil className="w-3.5 h-3.5 text-amber-600" />
                          <span>Sửa</span>
                        </button>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={handleSaveEditedTheory}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs transition-colors"
                            title="Lưu nội dung lý thuyết"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Lưu</span>
                          </button>
                          <button
                            onClick={handleCancelEditTheory}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                            title="Hủy bỏ chỉnh sửa"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Hủy</span>
                          </button>
                        </div>
                      )
                    )}
                    <button
                      onClick={() => onTabChange('ai-generator')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-600 text-white hover:bg-amber-700 shadow-xs transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>AI Tự động soạn bài</span>
                    </button>
                    <button
                      onClick={() => handleDeleteLesson(currentLesson.id)}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Xóa bài học"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* 3 Sub-sections Tabs: 3.1 Lý thuyết, 3.2 Bài tập, 3.3 Tự luận */}
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                  <button
                    onClick={() => {
                      setLessonSubSection('theory');
                    }}
                    className={`pb-2 px-3 text-xs sm:text-sm font-semibold transition-all relative ${
                      lessonSubSection === 'theory'
                        ? 'text-amber-800 border-b-2 border-amber-600'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    3.1. Ôn tập Lý thuyết
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingTheory(false);
                      setLessonSubSection('exercises');
                    }}
                    className={`pb-2 px-3 text-xs sm:text-sm font-semibold transition-all relative ${
                      lessonSubSection === 'exercises'
                        ? 'text-amber-800 border-b-2 border-amber-600'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    3.2. Ôn tập Bài tập ({currentLessonQuestions.filter(q => q.type !== 'essay').length})
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingTheory(false);
                      setLessonSubSection('essay');
                    }}
                    className={`pb-2 px-3 text-xs sm:text-sm font-semibold transition-all relative ${
                      lessonSubSection === 'essay'
                        ? 'text-amber-800 border-b-2 border-amber-600'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    3.3. Ôn tập Tự luận ({currentLessonQuestions.filter(q => q.type === 'essay').length})
                  </button>
                </div>

                {/* 3.1 THEORY VIEW */}
                {lessonSubSection === 'theory' && (
                  <div className="space-y-4">
                    {isEditingTheory ? (
                      /* EDITING MODE */
                      <div className="p-4 bg-amber-50/40 rounded-2xl border border-amber-200 space-y-5">
                        <div className="flex items-center justify-between pb-3 border-b border-amber-200">
                          <div className="flex items-center gap-2">
                            <Pencil className="w-4 h-4 text-amber-700" />
                            <h4 className="text-xs sm:text-sm font-bold text-amber-900 uppercase tracking-wider">
                              Chỉnh sửa nội dung lý thuyết bài học
                            </h4>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={handleSaveEditedTheory}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs transition-colors"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Lưu thay đổi</span>
                            </button>
                            <button
                              onClick={handleCancelEditTheory}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Hủy</span>
                            </button>
                          </div>
                        </div>

                        {/* Edit Summary */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                            <FileText className="w-4 h-4 text-amber-600" />
                            Tóm tắt kiến thức trọng tâm
                          </label>
                          <textarea
                            rows={4}
                            value={editTheorySummary}
                            onChange={(e) => setEditTheorySummary(e.target.value)}
                            placeholder="Nhập tóm tắt khái quát nội dung trọng tâm bài học..."
                            className="w-full text-xs sm:text-sm p-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-slate-800 leading-relaxed"
                          />
                        </div>

                        {/* Edit Key Points List */}
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                              Kiến thức cốt lõi cần nhớ (từng dòng)
                            </label>
                            <button
                              type="button"
                              onClick={handleAddKeyPoint}
                              className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 bg-amber-100 text-amber-900 hover:bg-amber-200 rounded-lg transition-colors"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Thêm ý kiến thức</span>
                            </button>
                          </div>

                          <div className="space-y-2">
                            {editTheoryKeyPoints.map((pt, idx) => (
                              <div key={idx} className="flex items-start gap-2 bg-white p-2.5 rounded-xl border border-slate-200">
                                <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 text-xs font-bold flex items-center justify-center shrink-0 mt-1">
                                  {idx + 1}
                                </span>
                                <textarea
                                  rows={2}
                                  value={pt}
                                  onChange={(e) => handleUpdateKeyPoint(idx, e.target.value)}
                                  placeholder={`Ý kiến thức cốt lõi ${idx + 1}...`}
                                  className="flex-1 text-xs sm:text-sm p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 text-slate-800"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleRemoveKeyPoint(idx)}
                                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors shrink-0"
                                  title="Xóa ý này"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Bottom action buttons */}
                        <div className="flex items-center justify-end gap-2 pt-3 border-t border-amber-200/60">
                          <button
                            type="button"
                            onClick={handleCancelEditTheory}
                            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                          >
                            Hủy
                          </button>
                          <button
                            type="button"
                            onClick={handleSaveEditedTheory}
                            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl shadow-xs transition-colors"
                          >
                            <Check className="w-4 h-4" />
                            <span>Lưu thay đổi lý thuyết</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* READ-ONLY VIEW */
                      <>
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            <FileText className="w-4 h-4 text-amber-600" />
                            Tóm tắt kiến thức trọng tâm
                          </h4>
                          <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-line">
                            {currentLesson.theory.summary || 'Chưa có tóm tắt lý thuyết. Hãy bấm "Sửa" hoặc "AI Tự động soạn bài".'}
                          </p>
                        </div>

                        <div>
                          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
                            Kiến thức cốt lõi cần nhớ
                          </h4>
                          <div className="space-y-2">
                            {currentLesson.theory.keyPoints && currentLesson.theory.keyPoints.length > 0 ? (
                              currentLesson.theory.keyPoints.map((pt, idx) => (
                                <div
                                  key={idx}
                                  className="p-3 rounded-lg bg-amber-50/50 border border-amber-100 text-xs sm:text-sm text-amber-950 flex items-start gap-2.5"
                                >
                                  <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-800 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                                    {idx + 1}
                                  </span>
                                  <span>{pt}</span>
                                </div>
                              ))
                            ) : (
                              <p className="text-xs text-slate-400 italic p-3">Chưa có danh sách kiến thức cốt lõi.</p>
                            )}
                          </div>
                        </div>

                        {currentLesson.theory.timelineOrFacts && currentLesson.theory.timelineOrFacts.length > 0 && (
                          <div>
                            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
                              {selectedSubject === 'lich-su' ? 'Mốc sự kiện lịch sử nổi bật' : 'Quy luật & Số liệu địa lí tiêu biểu'}
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              {currentLesson.theory.timelineOrFacts.map((item, idx) => (
                                <div key={idx} className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
                                  <span className="font-bold text-xs text-amber-800 block mb-0.5">{item.title}</span>
                                  <span className="text-xs text-slate-600">{item.content}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* 3.2 EXERCISES VIEW */}
                {lessonSubSection === 'exercises' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-slate-500">
                        Bao gồm các dạng: Trắc nghiệm 4 lựa chọn, Đúng/Sai, Nối cột A-B, Trả lời ngắn, Điền khuyết.
                      </p>
                      <button
                        onClick={() => {
                          setManualQType('multiple-choice');
                          setShowAddQuestionModal(true);
                        }}
                        className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Thêm câu hỏi mới</span>
                      </button>
                    </div>

                    <div className="space-y-3">
                      {currentLessonQuestions.filter(q => q.type !== 'essay').map((q, idx) => (
                        <div key={q.id} className="relative group">
                          <QuestionItem
                            question={q}
                            index={idx}
                            mode="preview"
                            showAnswer={true}
                          />
                          <button
                            onClick={() => handleDeleteQuestion(q.id)}
                            className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Xóa câu hỏi"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      {currentLessonQuestions.filter(q => q.type !== 'essay').length === 0 && (
                        <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                          <p className="text-sm text-slate-500 mb-2">Chưa có bài tập nào cho bài này.</p>
                          <button
                            onClick={() => onTabChange('ai-generator')}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            Dùng AI sinh 5-30 câu hỏi ngay
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 3.3 ESSAY VIEW */}
                {lessonSubSection === 'essay' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-slate-500">
                        Câu hỏi tự luận rèn luyện tư duy phân tích, tổng hợp và liên hệ thực tế, kèm gợi ý chấm điểm.
                      </p>
                      <button
                        onClick={() => {
                          setManualQType('essay');
                          setShowAddQuestionModal(true);
                        }}
                        className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Thêm câu tự luận</span>
                      </button>
                    </div>

                    <div className="space-y-3">
                      {currentLessonQuestions.filter(q => q.type === 'essay').map((q, idx) => (
                        <div key={q.id} className="relative group">
                          <QuestionItem
                            question={q}
                            index={idx}
                            mode="preview"
                            showAnswer={true}
                          />
                          <button
                            onClick={() => handleDeleteQuestion(q.id)}
                            className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Xóa câu hỏi"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      {currentLessonQuestions.filter(q => q.type === 'essay').length === 0 && (
                        <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                          <p className="text-sm text-slate-500 mb-2">Chưa có câu hỏi tự luận nào cho bài này.</p>
                          <button
                            onClick={() => {
                              setManualQType('essay');
                              setShowAddQuestionModal(true);
                            }}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Soạn câu tự luận mới
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400">Vui lòng chọn bài học từ danh sách bên trái.</div>
            )}
          </div>
        </div>
      )}

      {/* ---------------- SECTION 2: NGÂN HÀNG CÂU HỎI ---------------- */}
      {activeTab === 'questions' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-5">
          {/* Header Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Ngân hàng câu hỏi Lịch sử – Địa lí THCS
              </h3>
              <p className="text-xs text-slate-500">
                Tổng số: <span className="font-semibold text-amber-700">{store.questions.length} câu hỏi</span> đã được phân loại nhận thức
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAddQuestionModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 shadow-xs transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm câu hỏi mới</span>
              </button>
              <button
                onClick={() => onTabChange('ai-generator')}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-amber-600 text-white hover:bg-amber-700 shadow-xs transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                <span>AI Sinh câu hỏi</span>
              </button>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm nội dung câu hỏi..."
                value={qbSearch}
                onChange={(e) => setQbSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
              />
            </div>

            {/* Cognitive Filter */}
            <div>
              <select
                value={qbCogFilter}
                onChange={(e) => setQbCogFilter(e.target.value)}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
              >
                <option value="all">Mọi mức độ nhận thức</option>
                <option value="biet">Biết (Nhận biết)</option>
                <option value="hieu">Hiểu (Thông hiểu)</option>
                <option value="van-dung">Vận dụng</option>
              </select>
            </div>

            {/* Type Filter */}
            <div>
              <select
                value={qbTypeFilter}
                onChange={(e) => setQbTypeFilter(e.target.value)}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
              >
                <option value="all">Mọi dạng câu hỏi</option>
                <option value="multiple-choice">Trắc nghiệm</option>
                <option value="true-false">Đúng / Sai</option>
                <option value="matching">Nối cột</option>
                <option value="short-answer">Trả lời ngắn</option>
                <option value="fill-in-blank">Điền khuyết</option>
                <option value="essay">Tự luận</option>
              </select>
            </div>

            {/* Counter */}
            <div className="flex items-center justify-end font-medium text-slate-600">
              Lọc được: {
                store.questions.filter((q) => {
                  const matchSubject = currentSubject === 'all' || q.subject === currentSubject;
                  const matchGrade = currentGrade === 'all' || q.grade === currentGrade;
                  const matchCog = qbCogFilter === 'all' || q.cognitiveLevel === qbCogFilter;
                  const matchType = qbTypeFilter === 'all' || q.type === qbTypeFilter;
                  const matchSearch = !qbSearch || q.questionText.toLowerCase().includes(qbSearch.toLowerCase());
                  return matchSubject && matchGrade && matchCog && matchType && matchSearch;
                }).length
              } câu
            </div>
          </div>

          {/* List of Questions */}
          <div className="space-y-3">
            {store.questions
              .filter((q) => {
                const matchSubject = currentSubject === 'all' || q.subject === currentSubject;
                const matchGrade = currentGrade === 'all' || q.grade === currentGrade;
                const matchCog = qbCogFilter === 'all' || q.cognitiveLevel === qbCogFilter;
                const matchType = qbTypeFilter === 'all' || q.type === qbTypeFilter;
                const matchSearch = !qbSearch || q.questionText.toLowerCase().includes(qbSearch.toLowerCase());
                return matchSubject && matchGrade && matchCog && matchType && matchSearch;
              })
              .map((q, idx) => (
                <div key={q.id} className="relative group">
                  <QuestionItem
                    question={q}
                    index={idx}
                    mode="preview"
                    showAnswer={true}
                  />
                  <button
                    onClick={() => handleDeleteQuestion(q.id)}
                    className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Xóa câu hỏi khỏi ngân hàng"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ---------------- SECTION 3: AI TRỢ LÝ BIÊN SOẠN & ĐỌC TÀI LIỆU ---------------- */}
      {activeTab === 'ai-generator' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 inline-flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                  Gemini 3.8 Flash Multimodal
                </span>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  AI Trợ lý Đọc tài liệu & Tự động sinh câu hỏi
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Tải lên nhiều tài liệu cùng lúc (PDF, Word, ảnh chụp trang sách, PowerPoint) để AI tự động trích xuất lý thuyết và sinh 5–30 câu hỏi theo tỉ lệ nhận thức.
              </p>
            </div>
          </div>

          {/* Multimodal Upload Zone */}
          <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/40 border-2 border-dashed border-amber-200/80">
            <div className="flex flex-col items-center justify-center text-center">
              <UploadCloud className="w-10 h-10 text-amber-600 mb-2" />
              <p className="text-sm font-bold text-slate-800">
                Tải lên tài liệu SGK, giáo án hoặc ảnh chụp trang sách
              </p>
              <p className="text-xs text-slate-500 mt-0.5 mb-3">
                Cho phép chọn nhiều file cùng lúc: PDF, tài liệu Word/PowerPoint, ảnh JPEG/PNG
              </p>
              <label className="cursor-pointer px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-700 shadow-2xs transition-colors">
                <span>Chọn tập tin tài liệu</span>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.ppt,.pptx,image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Uploaded Files Chips */}
            {aiUploadedFiles.length > 0 && (
              <div className="mt-4 pt-3 border-t border-amber-200/60 flex flex-wrap gap-2">
                <span className="text-xs font-semibold text-slate-700 w-full mb-1">
                  Đã tải lên ({aiUploadedFiles.length} tệp):
                </span>
                {aiUploadedFiles.map((f, i) => (
                  <div
                    key={i}
                    className="inline-flex items-center gap-1.5 bg-white border border-amber-200 px-2.5 py-1 rounded-lg text-xs text-slate-800 shadow-2xs"
                  >
                    <FileText className="w-3.5 h-3.5 text-amber-600" />
                    <span className="truncate max-w-[180px]">{f.name}</span>
                    <button
                      type="button"
                      onClick={() => setAiUploadedFiles((prev) => prev.filter((_, idx) => idx !== i))}
                      className="text-slate-400 hover:text-rose-600 ml-1"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AI Settings Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/70 p-4 rounded-2xl border border-slate-200">
            {/* Left: Question Count (5 to 30) & Ratios */}
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-1.5">
                  <label>Số lượng câu hỏi muốn tạo (5 đến 30 câu):</label>
                  <span className="text-sm font-extrabold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-lg">
                    {aiCount} câu
                  </span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={30}
                  value={aiCount}
                  onChange={(e) => setAiCount(Number(e.target.value))}
                  className="w-full accent-amber-600 cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                  <span>5 câu</span>
                  <span>15 câu</span>
                  <span>30 câu</span>
                </div>
              </div>

              {/* Cognitive Ratios */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-2">
                  Quy định tỉ lệ theo 3 mức độ nhận thức (%):
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-center">
                    <span className="block text-[11px] font-bold text-sky-700">Biết</span>
                    <div className="flex items-center justify-center gap-1 mt-1">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={aiBiet}
                        onChange={(e) => setAiBiet(Number(e.target.value))}
                        className="w-12 text-center text-xs font-bold border rounded p-1"
                      />
                      <span className="text-xs text-slate-500">%</span>
                    </div>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-center">
                    <span className="block text-[11px] font-bold text-amber-700">Hiểu</span>
                    <div className="flex items-center justify-center gap-1 mt-1">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={aiHieu}
                        onChange={(e) => setAiHieu(Number(e.target.value))}
                        className="w-12 text-center text-xs font-bold border rounded p-1"
                      />
                      <span className="text-xs text-slate-500">%</span>
                    </div>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-center">
                    <span className="block text-[11px] font-bold text-purple-700">Vận dụng</span>
                    <div className="flex items-center justify-center gap-1 mt-1">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={aiVanDung}
                        onChange={(e) => setAiVanDung(Number(e.target.value))}
                        className="w-12 text-center text-xs font-bold border rounded p-1"
                      />
                      <span className="text-xs text-slate-500">%</span>
                    </div>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 italic text-center">
                  Tổng: {aiBiet + aiHieu + aiVanDung}% {aiBiet + aiHieu + aiVanDung !== 100 && '(Nên để tổng = 100%)'}
                </p>
              </div>
            </div>

            {/* Right: Question Types & Prompt Note */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Các dạng câu hỏi sinh ra:
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { id: 'multiple-choice', label: 'Trắc nghiệm (4 lựa chọn)' },
                    { id: 'true-false', label: 'Đúng / Sai' },
                    { id: 'matching', label: 'Nối cột A - B' },
                    { id: 'short-answer', label: 'Trả lời ngắn' },
                    { id: 'fill-in-blank', label: 'Điền khuyết' },
                    { id: 'essay', label: 'Tự luận' }
                  ].map((t) => (
                    <label key={t.id} className="flex items-center gap-1.5 bg-white p-2 rounded-lg border border-slate-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={aiTypes.includes(t.id)}
                        onChange={(e) => {
                          if (e.target.checked) setAiTypes([...aiTypes, t.id]);
                          else setAiTypes(aiTypes.filter((x) => x !== t.id));
                        }}
                        className="rounded text-amber-600"
                      />
                      <span>{t.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Ghi chú hoặc yêu cầu riêng cho AI (tùy chọn):
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Tập trung vào các mốc thời gian thời Hùng Vương..."
                  value={aiCustomPrompt}
                  onChange={(e) => setAiCustomPrompt(e.target.value)}
                  className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Action Trigger Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleAiSummarize}
              disabled={aiSummarizing || aiGenerating}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-white border border-slate-300 text-slate-800 hover:bg-slate-50 transition-colors shadow-2xs disabled:opacity-50"
            >
              {aiSummarizing ? (
                <RefreshCw className="w-4 h-4 animate-spin text-amber-600" />
              ) : (
                <FileText className="w-4 h-4 text-amber-600" />
              )}
              <span>AI Đọc & Tóm tắt Lý thuyết bài học</span>
            </button>

            <button
              onClick={() => handleAiGenerateQuestions(false)}
              disabled={aiGenerating || aiSummarizing}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-amber-600 hover:bg-amber-700 text-white transition-colors shadow-xs disabled:opacity-50"
            >
              {aiGenerating ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              <span>AI Tạo câu hỏi ({aiCount} câu)</span>
            </button>

            {generatedQuestions.length > 0 && (
              <>
                <button
                  onClick={() => handleAiGenerateQuestions(true)}
                  disabled={aiGenerating}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-amber-100 text-amber-900 hover:bg-amber-200 transition-colors"
                >
                  <ListPlus className="w-4 h-4" />
                  <span>Tạo thêm</span>
                </button>
                <button
                  onClick={() => handleAiGenerateQuestions(false)}
                  disabled={aiGenerating}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Tạo lại</span>
                </button>
                <button
                  onClick={handleSaveAiQuestionsToBank}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs ml-auto transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Lưu tất cả ({generatedQuestions.length}) vào Ngân hàng</span>
                </button>
              </>
            )}
          </div>

          {/* Status Alert Banner */}
          {aiStatusMsg && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{aiStatusMsg}</span>
            </div>
          )}

          {/* Generated Questions Preview List */}
          {generatedQuestions.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-900">
                  Danh sách câu hỏi vừa được AI sinh ra ({generatedQuestions.length} câu)
                </h4>
                <span className="text-xs text-slate-500">Giáo viên xem lại trước khi lưu</span>
              </div>

              <div className="space-y-3">
                {generatedQuestions.map((q, idx) => (
                  <div key={q.id} className="relative group">
                    <QuestionItem
                      question={q}
                      index={idx}
                      mode="preview"
                      showAnswer={true}
                    />
                    <button
                      onClick={() => setGeneratedQuestions((prev) => prev.filter((item) => item.id !== q.id))}
                      className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Bỏ câu này"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ---------------- MODAL: THÊM BÀI HỌC MỚI ---------------- */}
      {showAddLessonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Thêm bài học mới theo SGK</h3>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tên bài học (ví dụ: "Bài 4: Xã hội nguyên thủy")
              </label>
              <input
                type="text"
                placeholder="Nhập tên bài học..."
                value={newLessonTitle}
                onChange={(e) => setNewLessonTitle(e.target.value)}
                className="w-full text-sm p-2.5 border border-slate-300 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tóm tắt sơ lược bài học (hoặc để AI tạo sau)
              </label>
              <textarea
                rows={3}
                placeholder="Nội dung khái quát..."
                value={newLessonSummary}
                onChange={(e) => setNewLessonSummary(e.target.value)}
                className="w-full text-sm p-2.5 border border-slate-300 rounded-xl"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddLessonModal(false)}
                className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleCreateLesson}
                className="px-4 py-2 text-xs font-semibold bg-amber-600 text-white hover:bg-amber-700 rounded-xl shadow-xs"
              >
                Tạo bài học
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- MODAL: THÊM CÂU HỎI THỦ CÔNG ---------------- */}
      {showAddQuestionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full p-6 space-y-4 my-8 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-900">Thêm câu hỏi mới vào Ngân hàng</h3>
            
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Dạng câu hỏi</label>
                <select
                  value={manualQType}
                  onChange={(e) => setManualQType(e.target.value as any)}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="multiple-choice">Trắc nghiệm 4 lựa chọn</option>
                  <option value="true-false">Đúng / Sai</option>
                  <option value="matching">Nối cột A - B</option>
                  <option value="short-answer">Trả lời ngắn</option>
                  <option value="fill-in-blank">Điền khuyết</option>
                  <option value="essay">Tự luận</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mức độ nhận thức</label>
                <select
                  value={manualQCog}
                  onChange={(e) => setManualQCog(e.target.value as any)}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="biet">Biết (Nhận biết)</option>
                  <option value="hieu">Hiểu (Thông hiểu)</option>
                  <option value="van-dung">Vận dụng</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nội dung câu hỏi</label>
              <textarea
                rows={3}
                placeholder="Nhập nội dung câu hỏi..."
                value={manualQText}
                onChange={(e) => setManualQText(e.target.value)}
                className="w-full text-sm p-2.5 border border-slate-300 rounded-xl"
              />
            </div>

            {/* Media Link */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Liên kết Hình ảnh hoặc Video YouTube (tùy chọn)
              </label>
              <input
                type="text"
                placeholder="https://... (link ảnh hoặc link video YouTube)"
                value={manualMediaUrl}
                onChange={(e) => setManualMediaUrl(e.target.value)}
                className="w-full text-xs p-2 border border-slate-300 rounded-lg"
              />
            </div>

            {/* Type Specific Fields */}
            {manualQType === 'multiple-choice' && (
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700">4 Phương án (Chọn phương án đúng)</label>
                {manualOptions.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="correct_ans"
                      checked={manualCorrectAns === i}
                      onChange={() => setManualCorrectAns(i)}
                      className="text-amber-600"
                    />
                    <span className="font-bold text-xs">{String.fromCharCode(65 + i)}:</span>
                    <input
                      type="text"
                      placeholder={`Phương án ${String.fromCharCode(65 + i)}`}
                      value={opt}
                      onChange={(e) => {
                        const copy = [...manualOptions];
                        copy[i] = e.target.value;
                        setManualOptions(copy);
                      }}
                      className="flex-1 text-xs p-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                ))}
              </div>
            )}

            {manualQType === 'essay' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Gợi ý đáp án & Biểu điểm chấm
                </label>
                <textarea
                  rows={3}
                  placeholder="Gợi ý chấm cho giáo viên..."
                  value={manualEssayGuide}
                  onChange={(e) => setManualEssayGuide(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-xl"
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAddQuestionModal(false)}
                className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSaveManualQuestion}
                className="px-4 py-2 text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 rounded-xl shadow-xs"
              >
                Lưu vào ngân hàng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
