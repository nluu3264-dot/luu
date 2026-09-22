/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Student,
  SubjectType,
  GradeLevel,
  Lesson,
  Exam,
  ExamSubmission,
  StudentAnswer,
  AppStoreData,
  CognitiveLevel,
  Question,
} from '../../types';
import { submitExamApi } from '../../services/api';
import { QuestionItem } from '../questions/QuestionItem';
import {
  BookOpen,
  Compass,
  FileText,
  Clock,
  Award,
  CheckCircle2,
  AlertTriangle,
  Play,
  History,
  RotateCcw,
  Sparkles,
  ChevronRight,
  ShieldAlert,
  ArrowLeft
} from 'lucide-react';

interface StudentPortalProps {
  student: Student;
  store: AppStoreData;
  onUpdateStore: (data: Partial<AppStoreData>) => void;
  currentSubject: SubjectType | 'all';
  currentGrade: GradeLevel | 'all';
}

export const StudentPortal: React.FC<StudentPortalProps> = ({
  student,
  store,
  onUpdateStore,
  currentSubject,
}) => {
  // Navigation tabs for student
  const [activeTab, setActiveTab] = useState<'study' | 'exams' | 'history'>('study');
  const [selectedSubject, setSelectedSubject] = useState<SubjectType>(
    currentSubject === 'all' ? 'lich-su' : currentSubject
  );

  // Filter lessons for student's grade and subject
  const availableLessons = store.lessons.filter(
    (l) => l.grade === student.grade && l.subject === selectedSubject
  );
  const [selectedLessonId, setSelectedLessonId] = useState<string>(
    availableLessons[0]?.id || ''
  );
  const currentLesson = store.lessons.find((l) => l.id === selectedLessonId) || availableLessons[0];
  const [studySubTab, setStudySubTab] = useState<'theory' | 'exercises' | 'essay'>('theory');

  // Active Exam Taking States
  const [activeExam, setActiveExam] = useState<Exam | null>(null);
  const [lastSubmittedExam, setLastSubmittedExam] = useState<Exam | null>(null);
  const [activeExamQuestions, setActiveExamQuestions] = useState<Question[]>([]);
  const [examTimeRemaining, setExamTimeRemaining] = useState<number>(0);
  const [studentAnswers, setStudentAnswers] = useState<{ [qId: string]: StudentAnswer }>({});
  const [submitting, setSubmitting] = useState(false);
  const [submittedResult, setSubmittedResult] = useState<ExamSubmission | null>(null);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);

  // Available Exams assigned to student's class
  const assignedExams = store.exams.filter(
    (e) => e.status === 'published' && e.assignedClassCodes.includes(student.classCode)
  );

  // Previous submissions of this student
  const mySubmissions = store.submissions.filter(
    (s) => s.studentCode === student.studentCode && s.classCode === student.classCode
  );

  // -------------------------------------------------------------
  // EXAM TIMER & ANTI-CHEAT FOCUS MONITOR
  // -------------------------------------------------------------
  useEffect(() => {
    if (!activeExam) return;

    const timer = setInterval(() => {
      setExamTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitchCount((c) => c + 1);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [activeExam]);

  const handleStartExam = (exam: Exam) => {
    // Check timing and attempt constraints
    const now = new Date();
    if (exam.openTime && new Date(exam.openTime) > now) {
      alert(`Bài kiểm tra này chưa mở. Thời gian mở: ${new Date(exam.openTime).toLocaleString('vi-VN')}`);
      return;
    }
    if (exam.closeTime && new Date(exam.closeTime) < now) {
      alert(`Bài kiểm tra này đã kết thúc thời gian làm bài vào: ${new Date(exam.closeTime).toLocaleString('vi-VN')}`);
      return;
    }
    const attempts = mySubmissions.filter((s) => s.examId === exam.id).length;
    const maxAttempts = exam.maxAttempts || 1;
    if (maxAttempts > 0 && attempts >= maxAttempts) {
      alert(`Em đã hoàn thành tối đa số lần cho phép (${attempts}/${maxAttempts} lần).`);
      return;
    }

    let qs = exam.questionIds
      .map((qId) => store.questions.find((q) => q.id === qId))
      .filter(Boolean) as Question[];

    if (exam.shuffleQuestions) {
      qs = [...qs].sort(() => Math.random() - 0.5);
    }

    setActiveExamQuestions(qs);
    setActiveExam(exam);
    setLastSubmittedExam(exam);
    setExamTimeRemaining(exam.durationMinutes * 60);
    setStudentAnswers({});
    setTabSwitchCount(0);
    setSubmittedResult(null);
  };

  const handleAnswerChange = (ans: StudentAnswer) => {
    setStudentAnswers((prev) => ({
      ...prev,
      [ans.questionId]: ans,
    }));
  };

  const handleAutoSubmit = async () => {
    if (!activeExam) return;
    await handleSubmitExam();
  };

  const handleSubmitExam = async () => {
    if (!activeExam) return;

    // Check unanswered questions
    const answeredCount = Object.keys(studentAnswers).length;
    const totalCount = activeExam.questionIds.length;
    if (answeredCount < totalCount) {
      if (!confirm(`Em còn ${totalCount - answeredCount} câu chưa trả lời. Em có chắc chắn muốn nộp bài ngay?`)) {
        return;
      }
    }

    setSubmitting(true);
    try {
      const answersArray = Object.values(studentAnswers);
      const submission = await submitExamApi({
        examId: activeExam.id,
        studentId: student.id,
        studentCode: student.studentCode,
        studentName: student.fullName,
        classCode: student.classCode,
        answers: answersArray,
      });

      onUpdateStore({
        submissions: [submission, ...store.submissions],
      });
      setSubmittedResult(submission);
      setActiveExam(null);
    } catch (err: any) {
      alert(`Lỗi khi nộp bài: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Practice questions for current lesson
  const currentLessonQuestions = store.questions.filter(
    (q) => q.lessonId === currentLesson?.id || q.lessonName === currentLesson?.title
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Student Welcome Banner */}
      {!activeExam && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-emerald-500/10 text-emerald-700 flex items-center justify-center shrink-0">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  Lớp {student.grade} • {student.classCode}
                </span>
                <span className="text-xs font-mono text-slate-500">Mã HS: {student.studentCode}</span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
                Xin chào, {student.fullName}!
              </h2>
            </div>
          </div>

          {/* Student Tabs Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('study')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'study'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Ôn tập bài học
            </button>
            <button
              onClick={() => setActiveTab('exams')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'exams'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Kiểm tra thường xuyên ({assignedExams.length})
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'history'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Lịch sử làm bài ({mySubmissions.length})
            </button>
          </div>
        </div>
      )}

      {/* ---------------- 1. ACTIVE EXAM TAKING VIEW ---------------- */}
      {activeExam && (
        <div className="space-y-5">
          {/* Exam Fixed Timer Banner */}
          <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 sticky top-18 z-30">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                Đang làm bài kiểm tra • Lớp {activeExam.grade}
              </span>
              <h3 className="text-base font-bold">{activeExam.title}</h3>
            </div>

            <div className="flex items-center gap-4">
              {/* Anti-cheat tab switch warning */}
              {tabSwitchCount > 0 && (
                <div className="flex items-center gap-1.5 bg-rose-500/20 border border-rose-500/40 text-rose-300 px-2.5 py-1 rounded-lg text-xs">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  <span>Rời màn hình: {tabSwitchCount} lần</span>
                </div>
              )}

              {/* Countdown clock */}
              <div className="flex items-center gap-2 bg-slate-800 px-3.5 py-1.5 rounded-xl border border-slate-700">
                <Clock className="w-5 h-5 text-amber-400 animate-pulse" />
                <span className="font-mono text-lg font-black text-amber-400">
                  {formatTime(examTimeRemaining)}
                </span>
              </div>

              {/* Submit button */}
              <button
                onClick={handleSubmitExam}
                disabled={submitting}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
              >
                {submitting ? 'Đang nộp...' : 'Nộp bài thi'}
              </button>
            </div>
          </div>

          {/* Question Navigator & Questions List */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 space-y-4">
              {activeExamQuestions.map((q, idx) => (
                <QuestionItem
                  key={q!.id}
                  question={q!}
                  index={idx}
                  mode="exam"
                  studentAnswer={studentAnswers[q!.id]}
                  onAnswerChange={handleAnswerChange}
                  showAnswer={false}
                />
              ))}
            </div>

            {/* Sticky Question Navigator Map */}
            <div className="lg:col-span-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs sticky top-40 space-y-4">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Bảng tiến độ câu hỏi ({Object.keys(studentAnswers).length}/{activeExamQuestions.length})
                </h4>
                <div className="grid grid-cols-5 gap-2">
                  {activeExamQuestions.map((q, idx) => {
                    const isAnswered = !!studentAnswers[q!.id];
                    return (
                      <div
                        key={q!.id}
                        className={`p-2 rounded-lg text-center font-bold text-xs border transition-colors ${
                          isAnswered
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        {idx + 1}
                      </div>
                    );
                  })}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-emerald-600 inline-block" />
                    <span>Đã làm</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-slate-100 border border-slate-300 inline-block" />
                    <span>Chưa làm</span>
                  </div>
                </div>

                <button
                  onClick={handleSubmitExam}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors mt-2"
                >
                  Xác nhận Nộp bài
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- 2. POST-EXAM RESULT SCORECARD ---------------- */}
      {submittedResult && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs max-w-3xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-xs">
              <Award className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-slate-900">
              Kết quả bài kiểm tra của em
            </h3>
            <p className="text-xs text-slate-500">{submittedResult.examTitle}</p>
          </div>

          {/* Big Score Card */}
          {lastSubmittedExam?.showScoreImmediately === false ? (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center space-y-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Trạng thái bài làm
              </span>
              <span className="text-2xl font-black text-slate-800 mt-1 block">
                Đã nộp bài thành công
              </span>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                Giáo viên đã cài đặt ẩn điểm số tức thì. Điểm chính thức và nhận xét chi tiết sẽ được công bố sau khi hoàn tất đợt kiểm tra.
              </p>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200 p-6 text-center">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">
                Điểm số đạt được
              </span>
              <span className="text-5xl font-black text-emerald-900 mt-1 block">
                {submittedResult.score} <span className="text-xl font-bold text-emerald-700">/ {submittedResult.maxScore}</span>
              </span>
              <span className="text-xs text-emerald-700 font-medium mt-1 block">
                Đúng {submittedResult.correctCount} / {submittedResult.totalQuestions} câu hỏi
              </span>
            </div>
          )}

          {/* Cognitive Level Breakdown (Biết - Hiểu - Vận dụng) */}
          {lastSubmittedExam?.showScoreImmediately !== false && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Đánh giá theo 3 mức độ nhận thức:
              </h4>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-sky-50 rounded-xl p-3 border border-sky-100 text-center">
                  <span className="text-xs font-bold text-sky-800 block">Biết (Nhận biết)</span>
                  <span className="text-lg font-black text-sky-900">
                    {submittedResult.breakdown.biet.correct} / {submittedResult.breakdown.biet.total}
                  </span>
                  <span className="text-[10px] text-sky-600 block mt-0.5">
                    {submittedResult.breakdown.biet.total > 0
                      ? Math.round((submittedResult.breakdown.biet.correct / submittedResult.breakdown.biet.total) * 100)
                      : 0}% đúng
                  </span>
                </div>

                <div className="bg-amber-50 rounded-xl p-3 border border-amber-100 text-center">
                  <span className="text-xs font-bold text-amber-800 block">Hiểu (Thông hiểu)</span>
                  <span className="text-lg font-black text-amber-900">
                    {submittedResult.breakdown.hieu.correct} / {submittedResult.breakdown.hieu.total}
                  </span>
                  <span className="text-[10px] text-amber-600 block mt-0.5">
                    {submittedResult.breakdown.hieu.total > 0
                      ? Math.round((submittedResult.breakdown.hieu.correct / submittedResult.breakdown.hieu.total) * 100)
                      : 0}% đúng
                  </span>
                </div>

                <div className="bg-purple-50 rounded-xl p-3 border border-purple-100 text-center">
                  <span className="text-xs font-bold text-purple-800 block">Vận dụng</span>
                  <span className="text-lg font-black text-purple-900">
                    {submittedResult.breakdown.vanDung.correct} / {submittedResult.breakdown.vanDung.total}
                  </span>
                  <span className="text-[10px] text-purple-600 block mt-0.5">
                    {submittedResult.breakdown.vanDung.total > 0
                      ? Math.round((submittedResult.breakdown.vanDung.correct / submittedResult.breakdown.vanDung.total) * 100)
                      : 0}% đúng
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-center pt-2">
            <button
              onClick={() => setSubmittedResult(null)}
              className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
            >
              Quay lại danh sách ôn tập
            </button>
          </div>
        </div>
      )}

      {/* ---------------- 3. TAB: ÔN TẬP BÀI HỌC (3 MỤC LỚN) ---------------- */}
      {activeTab === 'study' && !activeExam && !submittedResult && (
        <div className="space-y-6">
          {/* Subject Switcher */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedSubject('lich-su')}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                selectedSubject === 'lich-su'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Phân môn Lịch sử (Lớp {student.grade})</span>
            </button>
            <button
              onClick={() => setSelectedSubject('dia-li')}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                selectedSubject === 'dia-li'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>Phân môn Địa lí (Lớp {student.grade})</span>
            </button>
          </div>

          {/* Lesson Tree & Content */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Lessons List */}
            <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 pb-2 border-b border-slate-100">
                Danh sách bài học SGK ({availableLessons.length} bài)
              </h3>
              <div className="space-y-1.5 max-h-[550px] overflow-y-auto pr-1">
                {availableLessons.map((les) => (
                  <div
                    key={les.id}
                    onClick={() => setSelectedLessonId(les.id)}
                    className={`p-3 rounded-xl cursor-pointer text-xs sm:text-sm font-medium transition-all flex items-start justify-between gap-2 ${
                      currentLesson?.id === les.id
                        ? 'bg-emerald-50 text-emerald-950 border border-emerald-300 font-bold shadow-xs'
                        : 'text-slate-700 hover:bg-slate-50 border border-transparent'
                    }`}
                  >
                    <span>{les.title}</span>
                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Lesson 3 Sections */}
            <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-5">
              {currentLesson ? (
                <>
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                      {selectedSubject === 'lich-su' ? 'Lịch sử' : 'Địa lí'} THCS
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-1">
                      {currentLesson.title}
                    </h3>
                  </div>

                  {/* 3 Large Sections */}
                  <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                    <button
                      onClick={() => setStudySubTab('theory')}
                      className={`pb-2 px-3 text-xs sm:text-sm font-bold transition-all ${
                        studySubTab === 'theory'
                          ? 'text-emerald-800 border-b-2 border-emerald-600'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      3.1. Ôn tập Lý thuyết
                    </button>
                    <button
                      onClick={() => setStudySubTab('exercises')}
                      className={`pb-2 px-3 text-xs sm:text-sm font-bold transition-all ${
                        studySubTab === 'exercises'
                          ? 'text-emerald-800 border-b-2 border-emerald-600'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      3.2. Bài tập tự luyện ({currentLessonQuestions.filter(q => q.type !== 'essay').length})
                    </button>
                    <button
                      onClick={() => setStudySubTab('essay')}
                      className={`pb-2 px-3 text-xs sm:text-sm font-bold transition-all ${
                        studySubTab === 'essay'
                          ? 'text-emerald-800 border-b-2 border-emerald-600'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      3.3. Tự luận ôn tập ({currentLessonQuestions.filter(q => q.type === 'essay').length})
                    </button>
                  </div>

                  {/* 3.1 THEORY */}
                  {studySubTab === 'theory' && (
                    <div className="space-y-4">
                      <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100 text-emerald-950">
                        <h4 className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5 text-emerald-800">
                          <FileText className="w-4 h-4" />
                          Tóm tắt kiến thức trọng tâm
                        </h4>
                        <p className="text-sm leading-relaxed">{currentLesson.theory.summary}</p>
                      </div>

                      <div>
                        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
                          Các ý kiến thức cốt lõi cần ghi nhớ
                        </h4>
                        <div className="space-y-2">
                          {currentLesson.theory.keyPoints.map((pt, i) => (
                            <div
                              key={i}
                              className="p-3 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 flex items-start gap-2.5 shadow-2xs"
                            >
                              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                                {i + 1}
                              </span>
                              <span>{pt}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {currentLesson.theory.timelineOrFacts && (
                        <div>
                          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                            Mốc thời gian & Sự kiện nổi bật
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {currentLesson.theory.timelineOrFacts.map((item, idx) => (
                              <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                                <span className="font-bold text-emerald-800 block">{item.title}</span>
                                <span className="text-slate-600">{item.content}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 3.2 PRACTICE EXERCISES */}
                  {studySubTab === 'exercises' && (
                    <div className="space-y-4">
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
                        Phần tự luyện giúp em củng cố kiến thức. Em có thể chọn đáp án và xem ngay giải thích chi tiết.
                      </div>
                      <div className="space-y-3">
                        {currentLessonQuestions.filter(q => q.type !== 'essay').map((q, idx) => (
                          <QuestionItem
                            key={q.id}
                            question={q}
                            index={idx}
                            mode="practice"
                            showAnswer={true}
                          />
                        ))}
                        {currentLessonQuestions.filter(q => q.type !== 'essay').length === 0 && (
                          <p className="text-xs text-slate-400 text-center py-8">Chưa có bài tập tự luyện cho bài này.</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 3.3 ESSAY */}
                  {studySubTab === 'essay' && (
                    <div className="space-y-4">
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
                        Tự luận giúp rèn luyện khả năng lập luận, phân tích và trình bày logic.
                      </div>
                      <div className="space-y-3">
                        {currentLessonQuestions.filter(q => q.type === 'essay').map((q, idx) => (
                          <QuestionItem
                            key={q.id}
                            question={q}
                            index={idx}
                            mode="practice"
                            showAnswer={true}
                          />
                        ))}
                        {currentLessonQuestions.filter(q => q.type === 'essay').length === 0 && (
                          <p className="text-xs text-slate-400 text-center py-8">Chưa có câu hỏi tự luận cho bài này.</p>
                        )}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12 text-slate-400">Chọn bài học từ cột bên trái.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ---------------- 4. TAB: BÀI KIỂM TRA THƯỜNG XUYÊN ---------------- */}
      {activeTab === 'exams' && !activeExam && !submittedResult && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900">
              Đề kiểm tra thường xuyên được giao cho lớp {student.classCode}
            </h3>
            <p className="text-xs text-slate-500">
              Bấm "Bắt đầu làm bài" để mở đề và tính giờ làm bài
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assignedExams.map((exam) => {
              const now = new Date();
              const attempts = mySubmissions.filter((s) => s.examId === exam.id);
              const attemptCount = attempts.length;
              const maxAttempts = exam.maxAttempts || 1;
              const isExhausted = maxAttempts > 0 && attemptCount >= maxAttempts;
              const isBeforeOpen = exam.openTime ? new Date(exam.openTime) > now : false;
              const isAfterClose = exam.closeTime ? new Date(exam.closeTime) < now : false;
              const canStart = !isBeforeOpen && !isAfterClose && !isExhausted;
              const latestSubmission = attempts[0]; // newest is first if unshifted

              return (
                <div
                  key={exam.id}
                  className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-emerald-300 transition-all shadow-2xs space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                        exam.subject === 'lich-su' ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900'
                      }`}>
                        {exam.subject === 'lich-su' ? 'Lịch sử' : 'Địa lí'} • Lớp {exam.grade}
                      </span>
                      {attemptCount > 0 && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-100 text-sky-800">
                          Đã làm {attemptCount}/{maxAttempts} lần
                        </span>
                      )}
                    </div>

                    <h4 className="text-base font-bold text-slate-900">{exam.title}</h4>

                    {(() => {
                      const labels = (exam.lessonNames && exam.lessonNames.length > 0)
                        ? exam.lessonNames
                        : exam.lessonIds
                            .map((id) => store.lessons.find((l) => l.id === id)?.title)
                            .filter(Boolean) as string[];

                      if (!labels || labels.length === 0) return null;

                      return (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] text-slate-500 font-medium">Bài học:</span>
                          {labels.map((name: string, i: number) => (
                            <span key={i} className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium truncate max-w-[200px]">
                              {name}
                            </span>
                          ))}
                        </div>
                      );
                    })()}
                  </div>

                  <div className="space-y-2.5">
                    <div className="flex items-center gap-4 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-slate-400" />
                        <span>{exam.durationMinutes} phút</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-slate-400" />
                        <span>{exam.questionCount} câu</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-slate-400" />
                        <span>Thang {exam.scoreScale}đ</span>
                      </div>
                    </div>

                    {(exam.openTime || exam.closeTime) && (
                      <div className="text-[11px] text-slate-500 bg-slate-50/70 p-2 rounded-lg border border-slate-100 space-y-0.5">
                        {exam.openTime && (
                          <div>Mở đề: <span className="font-medium text-slate-700">{new Date(exam.openTime).toLocaleString('vi-VN')}</span></div>
                        )}
                        {exam.closeTime && (
                          <div>Hạn chót: <span className="font-medium text-slate-700">{new Date(exam.closeTime).toLocaleString('vi-VN')}</span></div>
                        )}
                      </div>
                    )}

                    {latestSubmission && (
                      <div className="text-[11px] text-emerald-800 bg-emerald-50/70 p-2 rounded-lg border border-emerald-100 flex items-center justify-between">
                        <span>Điểm gần nhất:</span>
                        <span className="font-black text-sm">{latestSubmission.score} / {latestSubmission.maxScore}đ</span>
                      </div>
                    )}

                    <button
                      onClick={() => handleStartExam(exam)}
                      disabled={!canStart}
                      className={`w-full py-2.5 font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 ${
                        !canStart
                          ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      }`}
                    >
                      <Play className="w-4 h-4" />
                      <span>
                        {isBeforeOpen
                          ? `Chưa mở (Từ ${new Date(exam.openTime!).toLocaleDateString('vi-VN')})`
                          : isAfterClose
                          ? 'Đã hết hạn làm bài'
                          : isExhausted
                          ? 'Đã hết lượt làm bài'
                          : attemptCount > 0
                          ? `Làm lại bài (Lần ${attemptCount + 1}/${maxAttempts})`
                          : 'Bắt đầu làm bài'}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}

            {assignedExams.length === 0 && (
              <div className="col-span-2 text-center py-12 text-slate-400">
                Hiện tại chưa có đề kiểm tra nào được phát cho lớp của em.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---------------- 5. TAB: LỊCH SỬ LÀM BÀI ---------------- */}
      {activeTab === 'history' && !activeExam && !submittedResult && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100">
            Lịch sử các bài kiểm tra đã nộp
          </h3>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="p-3">Tên đề kiểm tra</th>
                  <th className="p-3 text-center">Điểm số</th>
                  <th className="p-3 text-center">Đúng/Tổng</th>
                  <th className="p-3 text-center">Mức Biết</th>
                  <th className="p-3 text-center">Mức Hiểu</th>
                  <th className="p-3 text-center">Mức Vận dụng</th>
                  <th className="p-3 text-right">Ngày giờ nộp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {mySubmissions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50/70">
                    <td className="p-3 font-bold text-slate-900">{sub.examTitle}</td>
                    <td className="p-3 text-center font-black text-sm text-emerald-700">
                      {sub.score} / {sub.maxScore}
                    </td>
                    <td className="p-3 text-center text-slate-600 font-medium">
                      {sub.correctCount} / {sub.totalQuestions}
                    </td>
                    <td className="p-3 text-center">
                      <span className="text-sky-800 bg-sky-50 px-2 py-0.5 rounded font-medium">
                        {sub.breakdown.biet.correct}/{sub.breakdown.biet.total}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded font-medium">
                        {sub.breakdown.hieu.correct}/{sub.breakdown.hieu.total}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span className="text-purple-800 bg-purple-50 px-2 py-0.5 rounded font-medium">
                        {sub.breakdown.vanDung.correct}/{sub.breakdown.vanDung.total}
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono text-slate-500">
                      {new Date(sub.submittedAt).toLocaleString('vi-VN')}
                    </td>
                  </tr>
                ))}
                {mySubmissions.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-400">
                      Em chưa làm bài kiểm tra nào.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
