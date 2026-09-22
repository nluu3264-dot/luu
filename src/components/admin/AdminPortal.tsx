/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Classroom,
  Student,
  Exam,
  ExamSubmission,
  AppStoreData,
  GradeLevel,
  SubjectType,
  ScoreScale,
  AnswerRevealMode,
  ScoreRevealMode,
} from '../../types';
import {
  exportStudentsToExcel,
  exportExamResultsToExcel,
  parseStudentsFromExcel,
  parseStudentsFromClipboard,
} from '../../services/api';
import {
  Shield,
  School,
  Users,
  FileSpreadsheet,
  Upload,
  ClipboardPaste,
  Download,
  Plus,
  Trash2,
  Edit2,
  Search,
  CheckCircle,
  Clock,
  Award,
  BarChart3,
  Calendar,
  Shuffle,
  Eye,
  Key,
  Filter
} from 'lucide-react';

interface AdminPortalProps {
  store: AppStoreData;
  onUpdateStore: (data: Partial<AppStoreData>) => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  store,
  onUpdateStore,
  activeTab,
  onTabChange,
}) => {
  // Class & Student Management States
  const [selectedClassCode, setSelectedClassCode] = useState<string>('all');
  const [studentSearch, setStudentSearch] = useState('');
  const [showAddClassModal, setShowAddClassModal] = useState(false);
  const [newClassCode, setNewClassCode] = useState('');
  const [newClassName, setNewClassName] = useState('');
  const [newClassGrade, setNewClassGrade] = useState<GradeLevel>(6);

  // Student Import Methods
  const [showImportModal, setShowImportModal] = useState(false);
  const [importMethod, setImportMethod] = useState<'excel' | 'paste'>('paste');
  const [pasteContent, setPasteContent] = useState('');
  const [importTargetClass, setImportTargetClass] = useState('6A1');
  const [importPreview, setImportPreview] = useState<Partial<Student>[]>([]);

  // Exam Management States
  const [showAddExamModal, setShowAddExamModal] = useState(false);
  const [examTitle, setExamTitle] = useState('');
  const [examSubject, setExamSubject] = useState<SubjectType>('lich-su');
  const [examGrade, setExamGrade] = useState<GradeLevel>(6);
  const [examDuration, setExamDuration] = useState<number>(15);
  const [examScale, setExamScale] = useState<ScoreScale>(10);
  const [examAnswerReveal, setExamAnswerReveal] = useState<AnswerRevealMode>('immediate');
  const [examScoreReveal, setExamScoreReveal] = useState<ScoreRevealMode>('immediate');
  const [examShuffle, setExamShuffle] = useState(true);
  const [examAssignedClasses, setExamAssignedClasses] = useState<string[]>(['6A1']);
  const [examSelectedQIds, setExamSelectedQIds] = useState<string[]>([]);

  // Result Stats & Filters
  const [statExamFilter, setStatExamFilter] = useState<string>('all');
  const [statClassFilter, setStatClassFilter] = useState<string>('all');

  // Password Management
  const [newAuthorPassword, setNewAuthorPassword] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [pwdMessage, setPwdMessage] = useState<string | null>(null);

  // -------------------------------------------------------------
  // CLASS & STUDENT HANDLERS
  // -------------------------------------------------------------

  const handleCreateClass = () => {
    if (!newClassCode.trim()) return;
    const cleanCode = newClassCode.trim().toUpperCase();
    if (store.classrooms.some((c) => c.classCode === cleanCode)) {
      alert('Mã lớp này đã tồn tại!');
      return;
    }

    const newClass: Classroom = {
      id: `cls-${cleanCode.toLowerCase()}`,
      classCode: cleanCode,
      className: newClassName.trim() || `Lớp ${cleanCode}`,
      grade: newClassGrade,
      studentCount: 0,
    };

    onUpdateStore({ classrooms: [...store.classrooms, newClass] });
    setShowAddClassModal(false);
    setNewClassCode('');
    setNewClassName('');
  };

  const handleDeleteClass = (code: string) => {
    if (!confirm(`Bạn có chắc muốn xóa lớp ${code} và tất cả học sinh trong lớp?`)) return;
    const remainingClasses = store.classrooms.filter((c) => c.classCode !== code);
    const remainingStudents = store.students.filter((s) => s.classCode !== code);
    onUpdateStore({
      classrooms: remainingClasses,
      students: remainingStudents,
    });
    if (selectedClassCode === code) setSelectedClassCode('all');
  };

  const handleExcelFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const parsed = await parseStudentsFromExcel(file);
      setImportPreview(parsed);
    } catch (err: any) {
      alert(`Lỗi đọc file Excel: ${err.message}`);
    }
  };

  const handlePasteChange = (text: string) => {
    setPasteContent(text);
    const targetClassObj = store.classrooms.find((c) => c.classCode === importTargetClass);
    const grade = targetClassObj?.grade || 6;
    const parsed = parseStudentsFromClipboard(text, importTargetClass, grade);
    setImportPreview(parsed);
  };

  const handleConfirmImport = () => {
    if (importPreview.length === 0) return;

    const newStudents: Student[] = importPreview.map((p, idx) => ({
      id: `std-${Date.now()}-${idx}`,
      studentCode: p.studentCode || `HS${Math.floor(100 + Math.random() * 900)}`,
      fullName: p.fullName || 'Học sinh',
      classCode: p.classCode || importTargetClass,
      grade: p.grade || 6,
    }));

    onUpdateStore({ students: [...store.students, ...newStudents] });
    setShowImportModal(false);
    setPasteContent('');
    setImportPreview([]);
    alert(`Đã nhập thành công ${newStudents.length} học sinh!`);
  };

  const handleDeleteStudent = (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa học sinh này?')) return;
    onUpdateStore({ students: store.students.filter((s) => s.id !== id) });
  };

  // -------------------------------------------------------------
  // EXAM HANDLERS
  // -------------------------------------------------------------

  const handleCreateExam = () => {
    if (!examTitle.trim() || examSelectedQIds.length === 0) {
      alert('Vui lòng nhập tên đề và chọn ít nhất 1 câu hỏi!');
      return;
    }

    const newExam: Exam = {
      id: `exam-${Date.now()}`,
      title: examTitle.trim(),
      subject: examSubject,
      grade: examGrade,
      lessonIds: [],
      durationMinutes: examDuration,
      scoreScale: examScale,
      questionCount: examSelectedQIds.length,
      questionIds: examSelectedQIds,
      assignedClassCodes: examAssignedClasses,
      answerRevealMode: examAnswerReveal,
      scoreRevealMode: examScoreReveal,
      shuffleQuestions: examShuffle,
      status: 'published',
      createdAt: new Date().toISOString(),
    };

    onUpdateStore({ exams: [...store.exams, newExam] });
    setShowAddExamModal(false);
    setExamTitle('');
    setExamSelectedQIds([]);
  };

  const handleDeleteExam = (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa đề kiểm tra này?')) return;
    onUpdateStore({ exams: store.exams.filter((e) => e.id !== id) });
  };

  // -------------------------------------------------------------
  // PASSWORD HANDLERS
  // -------------------------------------------------------------

  const handleSavePasswords = () => {
    const updatedConfig = { ...store.config };
    if (newAuthorPassword.trim()) {
      updatedConfig.authorPasswordHash = newAuthorPassword.trim();
    }
    if (newAdminPassword.trim()) {
      updatedConfig.adminPasswordHash = newAdminPassword.trim();
    }
    onUpdateStore({ config: updatedConfig });
    setPwdMessage('Đã cập nhật mật khẩu hệ thống thành công!');
    setNewAuthorPassword('');
    setNewAdminPassword('');
  };

  // Filtered Students
  const filteredStudents = store.students.filter((s) => {
    const matchClass = selectedClassCode === 'all' || s.classCode === selectedClassCode;
    const matchSearch =
      !studentSearch ||
      s.fullName.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.studentCode.toLowerCase().includes(studentSearch.toLowerCase());
    return matchClass && matchSearch;
  });

  // Filtered Submissions for Statistics
  const filteredSubmissions = store.submissions.filter((sub) => {
    const matchExam = statExamFilter === 'all' || sub.examId === statExamFilter;
    const matchClass = statClassFilter === 'all' || sub.classCode === statClassFilter;
    return matchExam && matchClass;
  });

  // Calculate Cognitive Level Breakdown Stats
  const totalBietCorrect = filteredSubmissions.reduce((acc, s) => acc + s.breakdown.biet.correct, 0);
  const totalBietTotal = filteredSubmissions.reduce((acc, s) => acc + s.breakdown.biet.total, 0);
  const bietRate = totalBietTotal > 0 ? Math.round((totalBietCorrect / totalBietTotal) * 100) : 0;

  const totalHieuCorrect = filteredSubmissions.reduce((acc, s) => acc + s.breakdown.hieu.correct, 0);
  const totalHieuTotal = filteredSubmissions.reduce((acc, s) => acc + s.breakdown.hieu.total, 0);
  const hieuRate = totalHieuTotal > 0 ? Math.round((totalHieuCorrect / totalHieuTotal) * 100) : 0;

  const totalVdCorrect = filteredSubmissions.reduce((acc, s) => acc + s.breakdown.vanDung.correct, 0);
  const totalVdTotal = filteredSubmissions.reduce((acc, s) => acc + s.breakdown.vanDung.total, 0);
  const vdRate = totalVdTotal > 0 ? Math.round((totalVdCorrect / totalVdTotal) * 100) : 0;

  const avgScore = filteredSubmissions.length > 0
    ? (filteredSubmissions.reduce((acc, s) => acc + s.score, 0) / filteredSubmissions.length).toFixed(1)
    : '0';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Admin Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-700 flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Khu vực Giáo viên Quản lý & Kiểm soát
            </h2>
            <p className="text-xs text-slate-500">
              Cấu hình lớp học, danh sách học sinh, thiết lập đề kiểm tra và theo dõi thống kê nhận thức
            </p>
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => onTabChange('classes')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'classes'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Lớp & Học sinh
          </button>
          <button
            onClick={() => onTabChange('exams')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'exams'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Đề kiểm tra
          </button>
          <button
            onClick={() => onTabChange('results')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'results'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Thống kê kết quả
          </button>
          <button
            onClick={() => onTabChange('settings')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'settings'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Bảo mật
          </button>
        </div>
      </div>

      {/* ---------------- TAB 1: QUẢN LÝ LỚP HỌC & HỌC SINH ---------------- */}
      {activeTab === 'classes' && (
        <div className="space-y-6">
          {/* Class List Ribbon */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <School className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">Danh sách các Lớp học THCS</h3>
              </div>
              <button
                onClick={() => setShowAddClassModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm lớp mới</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
              <button
                onClick={() => setSelectedClassCode('all')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  selectedClassCode === 'all'
                    ? 'border-indigo-600 bg-indigo-50/60 shadow-xs'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span className="text-xs font-bold text-slate-800 block">Tất cả lớp</span>
                <span className="text-[11px] text-slate-500 font-medium">{store.students.length} học sinh</span>
              </button>

              {store.classrooms.map((cls) => {
                const count = store.students.filter((s) => s.classCode === cls.classCode).length;
                return (
                  <div
                    key={cls.id}
                    onClick={() => setSelectedClassCode(cls.classCode)}
                    className={`p-3 rounded-xl border text-left cursor-pointer relative group transition-all ${
                      selectedClassCode === cls.classCode
                        ? 'border-indigo-600 bg-indigo-50/60 shadow-xs'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">{cls.classCode}</span>
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                        K{cls.grade}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 font-medium block mt-1">
                      {count} học sinh
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClass(cls.classCode);
                      }}
                      className="absolute top-2 right-2 p-1 text-slate-300 hover:text-rose-600 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Student Table & Import Actions */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Danh sách học sinh {selectedClassCode !== 'all' ? `Lớp ${selectedClassCode}` : 'toàn trường'}
                </h3>
                <p className="text-xs text-slate-500">
                  Học sinh dùng chính Mã Lớp + Mã Học Sinh để đăng nhập ôn tập và thi
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setShowImportModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg shadow-xs transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Nhập học sinh (Excel / Dán)</span>
                </button>
                <button
                  onClick={() => exportStudentsToExcel(store.students, selectedClassCode !== 'all' ? selectedClassCode : undefined)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg shadow-2xs transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Xuất Excel</span>
                </button>
              </div>
            </div>

            {/* Search Filter */}
            <div className="flex items-center justify-between gap-4">
              <div className="relative max-w-sm w-full">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm theo họ tên hoặc mã học sinh..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                />
              </div>
              <span className="text-xs text-slate-500 font-medium">
                Tìm thấy: {filteredStudents.length} học sinh
              </span>
            </div>

            {/* Students Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="p-3">STT</th>
                    <th className="p-3">Mã Học Sinh</th>
                    <th className="p-3">Họ và Tên</th>
                    <th className="p-3">Lớp</th>
                    <th className="p-3">Khối</th>
                    <th className="p-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.map((std, idx) => (
                    <tr key={std.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3 text-slate-400 font-mono">{idx + 1}</td>
                      <td className="p-3 font-mono font-bold text-slate-900 bg-slate-50/50">
                        {std.studentCode}
                      </td>
                      <td className="p-3 font-semibold text-slate-800">{std.fullName}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold">
                          {std.classCode}
                        </span>
                      </td>
                      <td className="p-3 text-slate-600">Lớp {std.grade}</td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleDeleteStudent(std.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                          title="Xóa học sinh"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredStudents.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-400">
                        Chưa có học sinh nào trong danh sách.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- TAB 2: QUẢN LÝ ĐỀ KIỂM TRA ---------------- */}
      {activeTab === 'exams' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Quản lý Đề kiểm tra thường xuyên
              </h3>
              <p className="text-xs text-slate-500">
                Cấu hình thời gian, thang điểm 10/100, gán lớp và chế độ hiển thị đáp án
              </p>
            </div>
            <button
              onClick={() => setShowAddExamModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo đề kiểm tra mới</span>
            </button>
          </div>

          {/* Exam Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {store.exams.map((exam) => {
              const submissionCount = store.submissions.filter((s) => s.examId === exam.id).length;
              return (
                <div
                  key={exam.id}
                  className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-indigo-300 transition-all shadow-2xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                        exam.subject === 'lich-su' ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900'
                      }`}>
                        {exam.subject === 'lich-su' ? 'Lịch sử' : 'Địa lí'} • Lớp {exam.grade}
                      </span>
                      <h4 className="text-sm sm:text-base font-bold text-slate-900 mt-1">
                        {exam.title}
                      </h4>
                    </div>
                    <button
                      onClick={() => handleDeleteExam(exam.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                      title="Xóa đề"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Badges Info */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="bg-slate-50 p-2 rounded-lg text-center">
                      <span className="text-slate-500 text-[10px] block">Thời gian</span>
                      <span className="font-bold text-slate-800">{exam.durationMinutes} phút</span>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-lg text-center">
                      <span className="text-slate-500 text-[10px] block">Số câu</span>
                      <span className="font-bold text-slate-800">{exam.questionCount} câu</span>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-lg text-center">
                      <span className="text-slate-500 text-[10px] block">Thang điểm</span>
                      <span className="font-bold text-slate-800">Thang {exam.scoreScale}</span>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-lg text-center">
                      <span className="text-slate-500 text-[10px] block">Đã nộp bài</span>
                      <span className="font-bold text-indigo-700">{submissionCount} bài</span>
                    </div>
                  </div>

                  {/* Config details */}
                  <div className="text-xs text-slate-600 space-y-1 pt-1 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <span>Lớp được giao:</span>
                      <div className="flex gap-1">
                        {exam.assignedClassCodes.map((c) => (
                          <span key={c} className="px-1.5 py-0.5 rounded bg-slate-100 font-mono font-bold text-[11px]">
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Chế độ đáp án:</span>
                      <span className="font-semibold text-slate-800">
                        {exam.answerRevealMode === 'immediate' ? 'Hiện ngay sau nộp' : exam.answerRevealMode === 'teacher-only' ? 'Chỉ giáo viên xem' : 'Ẩn đáp án'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Trộn câu hỏi:</span>
                      <span className="font-semibold text-emerald-700">
                        {exam.shuffleQuestions ? 'Bật (trộn ngẫu nhiên)' : 'Tắt'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ---------------- TAB 3: THỐNG KÊ & BÁO CÁO KẾT QUẢ ---------------- */}
      {activeTab === 'results' && (
        <div className="space-y-6">
          {/* Overview Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Tổng lượt làm bài
              </span>
              <span className="text-2xl font-black text-slate-900 mt-1 block">
                {filteredSubmissions.length}
              </span>
              <span className="text-xs text-slate-400 mt-0.5 block">Học sinh đã nộp</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Điểm trung bình
              </span>
              <span className="text-2xl font-black text-indigo-700 mt-1 block">
                {avgScore}
              </span>
              <span className="text-xs text-slate-400 mt-0.5 block">Trên thang điểm chuẩn</span>
            </div>

            {/* Cognitive Level Breakdown Highlight */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs sm:col-span-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                Đánh giá mức độ nhận thức (Biết – Hiểu – Vận dụng)
              </span>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-2 rounded-xl bg-sky-50 border border-sky-100">
                  <span className="text-[11px] font-bold text-sky-800 block">Mức Biết</span>
                  <span className="text-lg font-black text-sky-900">{bietRate}%</span>
                  <span className="text-[10px] text-sky-600 block">Tỉ lệ đúng</span>
                </div>
                <div className="p-2 rounded-xl bg-amber-50 border border-amber-100">
                  <span className="text-[11px] font-bold text-amber-800 block">Mức Hiểu</span>
                  <span className="text-lg font-black text-amber-900">{hieuRate}%</span>
                  <span className="text-[10px] text-amber-600 block">Tỉ lệ đúng</span>
                </div>
                <div className="p-2 rounded-xl bg-purple-50 border border-purple-100">
                  <span className="text-[11px] font-bold text-purple-800 block">Mức Vận dụng</span>
                  <span className="text-lg font-black text-purple-900">{vdRate}%</span>
                  <span className="text-[10px] text-purple-600 block">Tỉ lệ đúng</span>
                </div>
              </div>
            </div>
          </div>

          {/* Submissions Table with Export */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Bảng kết quả kiểm tra thường xuyên
                </h3>
                <p className="text-xs text-slate-500">
                  Theo dõi từng học sinh, điểm số và tỉ lệ đúng theo từng mức độ nhận thức
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => exportExamResultsToExcel(filteredSubmissions)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg shadow-xs transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Xuất kết quả ra Excel</span>
                </button>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
              <div>
                <label className="block text-slate-500 font-semibold mb-1">Lọc theo Đề thi:</label>
                <select
                  value={statExamFilter}
                  onChange={(e) => setStatExamFilter(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                >
                  <option value="all">Tất cả đề kiểm tra</option>
                  {store.exams.map((e) => (
                    <option key={e.id} value={e.id}>{e.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">Lọc theo Lớp:</label>
                <select
                  value={statClassFilter}
                  onChange={(e) => setStatClassFilter(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                >
                  <option value="all">Tất cả các lớp</option>
                  {store.classrooms.map((c) => (
                    <option key={c.id} value={c.classCode}>{c.classCode}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Submissions Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="p-3">Học sinh</th>
                    <th className="p-3">Lớp</th>
                    <th className="p-3">Đề thi</th>
                    <th className="p-3 text-center">Điểm số</th>
                    <th className="p-3 text-center">Biết</th>
                    <th className="p-3 text-center">Hiểu</th>
                    <th className="p-3 text-center">Vận dụng</th>
                    <th className="p-3 text-right">Thời gian nộp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSubmissions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3">
                        <span className="font-bold text-slate-900 block">{sub.studentName}</span>
                        <span className="text-[11px] text-slate-400 font-mono">{sub.studentCode}</span>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold font-mono">
                          {sub.classCode}
                        </span>
                      </td>
                      <td className="p-3 text-slate-700 font-medium">{sub.examTitle}</td>
                      <td className="p-3 text-center font-bold text-sm text-indigo-800">
                        {sub.score} / {sub.maxScore}
                      </td>
                      <td className="p-3 text-center font-medium">
                        <span className="text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-200/50">
                          {sub.breakdown.biet.correct}/{sub.breakdown.biet.total}
                        </span>
                      </td>
                      <td className="p-3 text-center font-medium">
                        <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/50">
                          {sub.breakdown.hieu.correct}/{sub.breakdown.hieu.total}
                        </span>
                      </td>
                      <td className="p-3 text-center font-medium">
                        <span className="text-purple-800 bg-purple-50 px-2 py-0.5 rounded border border-purple-200/50">
                          {sub.breakdown.vanDung.correct}/{sub.breakdown.vanDung.total}
                        </span>
                      </td>
                      <td className="p-3 text-right text-slate-500 font-mono text-[11px]">
                        {new Date(sub.submittedAt).toLocaleTimeString('vi-VN')}
                      </td>
                    </tr>
                  ))}
                  {filteredSubmissions.length === 0 && (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-slate-400">
                        Chưa có lượt nộp bài nào theo điều kiện lọc.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- TAB 4: CÀI ĐẶT BẢO MẬT & MẬT KHẨU ---------------- */}
      {activeTab === 'settings' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs max-w-xl mx-auto space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <Key className="w-5 h-5 text-indigo-600" />
            <div>
              <h3 className="text-base font-bold text-slate-900">Bảo mật & Cấp mật khẩu giáo viên</h3>
              <p className="text-xs text-slate-500">Giáo viên quản lý có quyền thay đổi mật khẩu riêng biệt cho 2 vai trò</p>
            </div>
          </div>

          {pwdMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>{pwdMessage}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Mật khẩu Giáo viên Biên soạn (Author) mới:
              </label>
              <input
                type="text"
                placeholder="Nhập mật khẩu mới cho GV Biên soạn..."
                value={newAuthorPassword}
                onChange={(e) => setNewAuthorPassword(e.target.value)}
                className="w-full text-sm p-2.5 border border-slate-300 rounded-xl"
              />
              <span className="text-[11px] text-slate-500">Hiện tại: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">{store.config.authorPasswordHash}</code></span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Mật khẩu Giáo viên Quản lý (Admin) mới:
              </label>
              <input
                type="text"
                placeholder="Nhập mật khẩu mới cho GV Quản lý..."
                value={newAdminPassword}
                onChange={(e) => setNewAdminPassword(e.target.value)}
                className="w-full text-sm p-2.5 border border-slate-300 rounded-xl"
              />
              <span className="text-[11px] text-slate-500">Hiện tại: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">{store.config.adminPasswordHash}</code></span>
            </div>

            <button
              onClick={handleSavePasswords}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
            >
              Lưu thay đổi mật khẩu
            </button>
          </div>
        </div>
      )}

      {/* ---------------- MODAL: THÊM LỚP MỚI ---------------- */}
      {showAddClassModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Tạo lớp học mới</h3>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Mã lớp (ví dụ: 6A3, 7A2...)</label>
              <input
                type="text"
                required
                placeholder="6A3"
                value={newClassCode}
                onChange={(e) => setNewClassCode(e.target.value.toUpperCase())}
                className="w-full p-2 text-sm border border-slate-300 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Khối lớp</label>
              <select
                value={newClassGrade}
                onChange={(e) => setNewClassGrade(Number(e.target.value) as GradeLevel)}
                className="w-full p-2 text-sm border border-slate-300 rounded-lg bg-white"
              >
                <option value={6}>Khối 6</option>
                <option value={7}>Khối 7</option>
                <option value={8}>Khối 8</option>
                <option value={9}>Khối 9</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddClassModal(false)}
                className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleCreateClass}
                className="px-4 py-2 text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl"
              >
                Tạo lớp
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- MODAL: NHẬP DANH SÁCH HỌC SINH (EXCEL & DÁN) ---------------- */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-900">
              Nhập danh sách học sinh vào hệ thống
            </h3>

            {/* Target Class Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Lớp học tiếp nhận:
              </label>
              <select
                value={importTargetClass}
                onChange={(e) => setImportTargetClass(e.target.value)}
                className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-white font-mono font-bold"
              >
                {store.classrooms.map((c) => (
                  <option key={c.id} value={c.classCode}>{c.classCode} (Khối {c.grade})</option>
                ))}
              </select>
            </div>

            {/* Method Tabs: Excel vs Direct Paste */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setImportMethod('paste')}
                className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  importMethod === 'paste' ? 'bg-white text-indigo-800 shadow-xs' : 'text-slate-600'
                }`}
              >
                <ClipboardPaste className="w-4 h-4" />
                <span>Cách 1: Dán trực tiếp (Copy-Paste)</span>
              </button>
              <button
                type="button"
                onClick={() => setImportMethod('excel')}
                className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  importMethod === 'excel' ? 'bg-white text-indigo-800 shadow-xs' : 'text-slate-600'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Cách 2: Tải file Excel / CSV</span>
              </button>
            </div>

            {importMethod === 'paste' ? (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Dán nội dung từ Excel hoặc Word vào đây:
                </label>
                <textarea
                  rows={6}
                  placeholder={`Ví dụ sao chép từ Excel:
HS601	Nguyễn Văn An
HS602	Trần Thị Bình
HS603	Lê Hoàng Cường`}
                  value={pasteContent}
                  onChange={(e) => handlePasteChange(e.target.value)}
                  className="w-full p-3 font-mono text-xs border border-slate-300 rounded-xl"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Hệ thống tự nhận diện cột Mã học sinh và Họ tên (hoặc chỉ cần họ tên).
                </p>
              </div>
            ) : (
              <div className="p-6 border-2 border-dashed border-slate-300 rounded-xl text-center bg-slate-50">
                <FileSpreadsheet className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-800 mb-1">Chọn file Excel (.xlsx, .xls) hoặc CSV</p>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleExcelFileUpload}
                  className="text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-600 file:text-white cursor-pointer"
                />
              </div>
            )}

            {/* Preview of Parsed Students */}
            {importPreview.length > 0 && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-xs font-bold text-slate-800 block mb-2">
                  Xem trước dữ liệu nhận diện ({importPreview.length} học sinh):
                </span>
                <div className="max-h-36 overflow-y-auto space-y-1 text-xs font-mono">
                  {importPreview.map((p, i) => (
                    <div key={i} className="flex justify-between bg-white px-2 py-1 rounded border border-slate-100">
                      <span>{p.studentCode}</span>
                      <span className="font-sans font-medium">{p.fullName}</span>
                      <span className="text-indigo-600">{p.classCode}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={importPreview.length === 0}
                onClick={handleConfirmImport}
                className="px-4 py-2 text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl disabled:opacity-50 shadow-xs"
              >
                Xác nhận nhập {importPreview.length} học sinh
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- MODAL: TẠO ĐỀ KIỂM TRA MỚI ---------------- */}
      {showAddExamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 space-y-4 my-8 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-900">Thiết lập Đề kiểm tra mới</h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Môn học</label>
                <select
                  value={examSubject}
                  onChange={(e) => setExamSubject(e.target.value as SubjectType)}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="lich-su">Lịch sử</option>
                  <option value="dia-li">Địa lí</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Khối lớp</label>
                <select
                  value={examGrade}
                  onChange={(e) => setExamGrade(Number(e.target.value) as GradeLevel)}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value={6}>Lớp 6</option>
                  <option value={7}>Lớp 7</option>
                  <option value={8}>Lớp 8</option>
                  <option value={9}>Lớp 9</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tên bài kiểm tra (ví dụ: "Kiểm tra 15 phút - Lịch sử 6 Bài 1 & 3")
              </label>
              <input
                type="text"
                placeholder="Nhập tên đề kiểm tra..."
                value={examTitle}
                onChange={(e) => setExamTitle(e.target.value)}
                className="w-full text-sm p-2.5 border border-slate-300 rounded-xl"
              />
            </div>

            {/* Config: Duration, Score scale, Answer reveal, Shuffle */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Thời gian (phút)</label>
                <input
                  type="number"
                  min={5}
                  max={120}
                  value={examDuration}
                  onChange={(e) => setExamDuration(Number(e.target.value))}
                  className="w-full p-2 border border-slate-300 rounded-lg font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Thang điểm</label>
                <select
                  value={examScale}
                  onChange={(e) => setExamScale(Number(e.target.value) as ScoreScale)}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white font-bold"
                >
                  <option value={10}>Thang 10</option>
                  <option value={100}>Thang 100</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Hiện đáp án</label>
                <select
                  value={examAnswerReveal}
                  onChange={(e) => setExamAnswerReveal(e.target.value as AnswerRevealMode)}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="immediate">Hiện ngay sau khi nộp</option>
                  <option value="teacher-only">Chỉ giáo viên xem</option>
                  <option value="hidden">Không hiện đáp án</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Hiện điểm số</label>
                <select
                  value={examScoreReveal}
                  onChange={(e) => setExamScoreReveal(e.target.value as ScoreRevealMode)}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="immediate">Hiện ngay cho HS</option>
                  <option value="teacher-only">Chỉ lưu cho GV</option>
                </select>
              </div>
            </div>

            {/* Assigned Classes */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Gán cho các lớp làm bài:
              </label>
              <div className="flex flex-wrap gap-2 text-xs">
                {store.classrooms
                  .filter((c) => c.grade === examGrade)
                  .map((cls) => (
                    <label key={cls.id} className="flex items-center gap-1.5 p-2 bg-slate-50 border rounded-lg cursor-pointer">
                      <input
                        type="checkbox"
                        checked={examAssignedClasses.includes(cls.classCode)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setExamAssignedClasses([...examAssignedClasses, cls.classCode]);
                          } else {
                            setExamAssignedClasses(examAssignedClasses.filter((x) => x !== cls.classCode));
                          }
                        }}
                        className="rounded text-indigo-600"
                      />
                      <span className="font-bold">{cls.classCode}</span>
                    </label>
                  ))}
              </div>
            </div>

            {/* Select Questions from Bank */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-800">
                  Chọn câu hỏi từ Ngân hàng (Đã chọn: {examSelectedQIds.length} câu):
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const available = store.questions
                      .filter((q) => q.subject === examSubject && q.grade === examGrade)
                      .map((q) => q.id);
                    setExamSelectedQIds(available);
                  }}
                  className="text-xs text-indigo-600 font-semibold hover:underline"
                >
                  Chọn tất cả câu của lớp {examGrade}
                </button>
              </div>

              <div className="max-h-56 overflow-y-auto space-y-2 border border-slate-200 rounded-xl p-2 bg-slate-50 text-xs">
                {store.questions
                  .filter((q) => q.subject === examSubject && q.grade === examGrade)
                  .map((q, idx) => {
                    const isSelected = examSelectedQIds.includes(q.id);
                    return (
                      <div
                        key={q.id}
                        onClick={() => {
                          if (isSelected) {
                            setExamSelectedQIds(examSelectedQIds.filter((id) => id !== q.id));
                          } else {
                            setExamSelectedQIds([...examSelectedQIds, q.id]);
                          }
                        }}
                        className={`p-2.5 rounded-lg border cursor-pointer flex items-start gap-2.5 transition-all ${
                          isSelected ? 'bg-indigo-50/80 border-indigo-300 text-indigo-950 font-medium' : 'bg-white border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          readOnly
                          className="mt-0.5 rounded text-indigo-600"
                        />
                        <div className="flex-1">
                          <span className="font-bold text-slate-500 mr-1.5">[{idx + 1}]</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 mr-1.5">
                            {q.cognitiveLevel.toUpperCase()}
                          </span>
                          <span>{q.questionText}</span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAddExamModal(false)}
                className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleCreateExam}
                className="px-4 py-2 text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl shadow-xs"
              >
                Phát hành đề kiểm tra
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
