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
  resetStudentPasswordApi,
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
  EyeOff,
  Key,
  KeyRound,
  Filter,
  Pencil,
  UserPlus,
  X,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  BookOpen,
  Compass,
  Lock,
  Unlock,
  AlertTriangle,
  RotateCcw,
  Power,
  Save,
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

  // Single Student Create & Edit States
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [singleStudentFullName, setSingleStudentFullName] = useState('');
  const [singleStudentCode, setSingleStudentCode] = useState('');
  const [singleStudentClass, setSingleStudentClass] = useState('6A1');
  const [singleStudentError, setSingleStudentError] = useState<string | null>(null);

  const [showEditStudentModal, setShowEditStudentModal] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [editStudentFullName, setEditStudentFullName] = useState('');
  const [editStudentCode, setEditStudentCode] = useState('');
  const [editStudentClass, setEditStudentClass] = useState('6A1');
  const [editStudentError, setEditStudentError] = useState<string | null>(null);

  // Exam Management States (Kiểm tra thường xuyên)
  const [showExamModal, setShowExamModal] = useState(false);
  const [editingExamId, setEditingExamId] = useState<string | null>(null);
  const [examTitle, setExamTitle] = useState('');
  const [examSubject, setExamSubject] = useState<SubjectType>('lich-su');
  const [examGrade, setExamGrade] = useState<GradeLevel>(6);
  const [examLessonIds, setExamLessonIds] = useState<string[]>([]);
  const [examDuration, setExamDuration] = useState<number>(15);
  const [examScale, setExamScale] = useState<ScoreScale>(10);
  const [examOpenTime, setExamOpenTime] = useState<string>('');
  const [examCloseTime, setExamCloseTime] = useState<string>('');
  const [examMaxAttemptsMode, setExamMaxAttemptsMode] = useState<'unlimited' | 'limited'>('unlimited');
  const [examMaxAttempts, setExamMaxAttempts] = useState<number>(1);
  const [examShowAnswersImmediately, setExamShowAnswersImmediately] = useState<boolean>(true);
  const [examShowScoreImmediately, setExamShowScoreImmediately] = useState<boolean>(true);
  const [examShuffle, setExamShuffle] = useState(true);
  const [examStatus, setExamStatus] = useState<'published' | 'draft' | 'closed'>('published');
  const [examAssignedClasses, setExamAssignedClasses] = useState<string[]>(['6A1']);
  const [examQuestionSelectionMode, setExamQuestionSelectionMode] = useState<'manual' | 'ai' | 'random'>('manual');
  const [examSelectedQIds, setExamSelectedQIds] = useState<string[]>([]);

  // Filter & Search inside exam question picker
  const [qPickerSearch, setQPickerSearch] = useState('');
  const [qPickerLevelFilter, setQPickerLevelFilter] = useState<'all' | 'biet' | 'hieu' | 'van-dung'>('all');
  const [qPickerLessonFilter, setQPickerLessonFilter] = useState<string>('all');

  // Random picker settings
  const [randomTargetCount, setRandomTargetCount] = useState<number>(10);
  const [randomRatioBiet, setRandomRatioBiet] = useState<number>(40);
  const [randomRatioHieu, setRandomRatioHieu] = useState<number>(40);
  const [randomRatioVanDung, setRandomRatioVanDung] = useState<number>(20);

  // Exam list filters in Admin tab
  const [examFilterSubject, setExamFilterSubject] = useState<string>('all');
  const [examFilterGrade, setExamFilterGrade] = useState<string>('all');
  const [examFilterStatus, setExamFilterStatus] = useState<string>('all');
  const [examSearchText, setExamSearchText] = useState('');

  // Result Stats & Filters
  const [statExamFilter, setStatExamFilter] = useState<string>('all');
  const [statClassFilter, setStatClassFilter] = useState<string>('all');

  // Password Management
  const [newAuthorPassword, setNewAuthorPassword] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [showCurrentAuthorPwd, setShowCurrentAuthorPwd] = useState(false);
  const [showCurrentAdminPwd, setShowCurrentAdminPwd] = useState(false);
  const [showNewAuthorPwd, setShowNewAuthorPwd] = useState(false);
  const [showNewAdminPwd, setShowNewAdminPwd] = useState(false);
  const [pwdMessage, setPwdMessage] = useState<string | null>(null);
  const [pwdError, setPwdError] = useState<string | null>(null);

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
      password: '',
      hasSetPassword: false,
    }));

    onUpdateStore({ students: [...store.students, ...newStudents] });
    setShowImportModal(false);
    setPasteContent('');
    setImportPreview([]);
    alert(`Đã nhập thành công ${newStudents.length} học sinh!`);
  };

  // Helper to auto-generate unique student code by class/grade (e.g., HS601, HS602, HS701...)
  const generateStudentCodeForClass = (classCode: string): string => {
    const targetClassObj = store.classrooms.find((c) => c.classCode === classCode);
    const grade = targetClassObj?.grade || 6;
    const prefix = `HS${grade}`;

    let maxNum = 0;
    store.students.forEach((s) => {
      const code = s.studentCode.toUpperCase().trim();
      if (code.startsWith(prefix)) {
        const numPart = parseInt(code.slice(prefix.length), 10);
        if (!isNaN(numPart) && numPart > maxNum) {
          maxNum = numPart;
        }
      }
    });

    let nextNum = maxNum >= 1 ? maxNum + 1 : 1;
    let candidate = `${prefix}${String(nextNum).padStart(2, '0')}`;

    // Guarantee system-wide uniqueness
    while (store.students.some((s) => s.studentCode.toUpperCase() === candidate.toUpperCase())) {
      nextNum++;
      candidate = `${prefix}${String(nextNum).padStart(2, '0')}`;
    }
    return candidate;
  };

  const handleAddSingleStudent = (e: React.FormEvent) => {
    e.preventDefault();
    setSingleStudentError(null);

    const fullName = singleStudentFullName.trim();
    if (!fullName) {
      setSingleStudentError('Vui lòng nhập họ và tên học sinh!');
      return;
    }

    const targetClass = singleStudentClass.trim().toUpperCase();
    if (!targetClass) {
      setSingleStudentError('Vui lòng chọn lớp học!');
      return;
    }

    let code = singleStudentCode.trim().toUpperCase();
    if (!code) {
      code = generateStudentCodeForClass(targetClass);
    } else {
      // Check duplicate code across the entire system
      const isDuplicate = store.students.some(
        (s) => s.studentCode.toUpperCase() === code
      );
      if (isDuplicate) {
        setSingleStudentError(`Mã học sinh "${code}" đã tồn tại trong hệ thống! Vui lòng chọn mã khác.`);
        return;
      }
    }

    const targetClassObj = store.classrooms.find((c) => c.classCode === targetClass);
    const grade = targetClassObj?.grade || 6;

    const newStudent: Student = {
      id: `std-${Date.now()}`,
      studentCode: code,
      fullName,
      classCode: targetClass,
      grade,
      password: '',
      hasSetPassword: false,
    };

    onUpdateStore({ students: [...store.students, newStudent] });
    setShowAddStudentModal(false);
    setSingleStudentFullName('');
    setSingleStudentCode('');
    setSingleStudentError(null);
  };

  const handleStartEditStudent = (student: Student) => {
    setEditingStudentId(student.id);
    setEditStudentFullName(student.fullName);
    setEditStudentCode(student.studentCode);
    setEditStudentClass(student.classCode);
    setEditStudentError(null);
    setShowEditStudentModal(true);
  };

  const handleSaveEditedStudent = (e: React.FormEvent) => {
    e.preventDefault();
    setEditStudentError(null);

    if (!editingStudentId) return;

    const fullName = editStudentFullName.trim();
    if (!fullName) {
      setEditStudentError('Vui lòng nhập họ và tên học sinh!');
      return;
    }

    const code = editStudentCode.trim().toUpperCase();
    if (!code) {
      setEditStudentError('Mã học sinh không được để trống!');
      return;
    }

    const targetClass = editStudentClass.trim().toUpperCase();
    if (!targetClass) {
      setEditStudentError('Vui lòng chọn lớp học!');
      return;
    }

    // Check duplicate student code across OTHER students in system
    const isDuplicate = store.students.some(
      (s) => s.id !== editingStudentId && s.studentCode.toUpperCase() === code
    );
    if (isDuplicate) {
      setEditStudentError(`Mã học sinh "${code}" đã tồn tại cho một học sinh khác trong hệ thống!`);
      return;
    }

    const targetClassObj = store.classrooms.find((c) => c.classCode === targetClass);
    const grade = targetClassObj?.grade || 6;

    const updatedStudents = store.students.map((s) => {
      if (s.id === editingStudentId) {
        return {
          ...s,
          fullName,
          studentCode: code,
          classCode: targetClass,
          grade,
        };
      }
      return s;
    });

    onUpdateStore({ students: updatedStudents });
    setShowEditStudentModal(false);
    setEditingStudentId(null);
    setEditStudentError(null);
  };

  const handleDeleteStudent = (student: Student) => {
    if (
      !confirm(
        `Bạn có chắc chắn muốn xóa học sinh "${student.fullName}" (Mã: ${student.studentCode}, Lớp: ${student.classCode}) khỏi hệ thống?`
      )
    ) {
      return;
    }
    onUpdateStore({ students: store.students.filter((s) => s.id !== student.id) });
  };

  const handleResetStudentPassword = async (std: Student) => {
    const confirmed = window.confirm(
      `Đặt lại mật khẩu cho học sinh "${std.fullName}" (Mã: ${std.studentCode})?\n\nSau khi đặt lại, trạng thái sẽ thành "Chưa đặt mật khẩu" và học sinh sẽ phải tạo mật khẩu mới khi đăng nhập tiếp theo.`
    );
    if (!confirmed) return;

    try {
      await resetStudentPasswordApi(std.id);
    } catch (e) {
      console.warn('API reset failed, updating local state', e);
    }

    const updatedStudents = store.students.map((s) => {
      if (s.id === std.id) {
        return { ...s, password: '', hasSetPassword: false };
      }
      return s;
    });

    onUpdateStore({ students: updatedStudents });
    alert(`Đã đặt lại mật khẩu cho học sinh "${std.fullName}". Học sinh sẽ được yêu cầu tạo mật khẩu mới ở lần đăng nhập tiếp theo.`);
  };

  // -------------------------------------------------------------
  // EXAM HANDLERS (Kiểm tra thường xuyên)
  // -------------------------------------------------------------

  const openCreateExamModal = () => {
    setEditingExamId(null);
    setExamTitle('');
    setExamSubject('lich-su');
    setExamGrade(6);
    setExamLessonIds([]);
    setExamDuration(15);
    setExamScale(10);
    setExamOpenTime('');
    setExamCloseTime('');
    setExamMaxAttemptsMode('unlimited');
    setExamMaxAttempts(1);
    setExamShowAnswersImmediately(true);
    setExamShowScoreImmediately(true);
    setExamShuffle(true);
    setExamStatus('published');
    const gradeClasses = store.classrooms.filter((c) => c.grade === 6).map((c) => c.classCode);
    setExamAssignedClasses(gradeClasses.length > 0 ? gradeClasses : ['6A1']);
    setExamQuestionSelectionMode('manual');
    setExamSelectedQIds([]);
    setQPickerSearch('');
    setQPickerLevelFilter('all');
    setQPickerLessonFilter('all');
    setShowExamModal(true);
  };

  const openEditExamModal = (exam: Exam) => {
    setEditingExamId(exam.id);
    setExamTitle(exam.title);
    setExamSubject(exam.subject);
    setExamGrade(exam.grade);
    setExamLessonIds(exam.lessonIds || []);
    setExamDuration(exam.durationMinutes || 15);
    setExamScale(exam.scoreScale || 10);
    setExamOpenTime(exam.openTime || '');
    setExamCloseTime(exam.closeTime || '');
    setExamMaxAttemptsMode(exam.maxAttempts && exam.maxAttempts > 0 ? 'limited' : 'unlimited');
    setExamMaxAttempts(exam.maxAttempts && exam.maxAttempts > 0 ? exam.maxAttempts : 1);
    setExamShowAnswersImmediately(exam.showAnswersImmediately !== undefined ? exam.showAnswersImmediately : exam.answerRevealMode === 'immediate');
    setExamShowScoreImmediately(exam.showScoreImmediately !== undefined ? exam.showScoreImmediately : exam.scoreRevealMode === 'immediate');
    setExamShuffle(exam.shuffleQuestions ?? true);
    setExamStatus(exam.status || 'published');
    setExamAssignedClasses(exam.assignedClassCodes || []);
    setExamQuestionSelectionMode(exam.questionSelectionMode || 'manual');
    setExamSelectedQIds(exam.questionIds || []);
    setQPickerSearch('');
    setQPickerLevelFilter('all');
    setQPickerLessonFilter('all');
    setShowExamModal(true);
  };

  const handleSaveExam = () => {
    if (!examTitle.trim()) {
      alert('Vui lòng nhập tên bài kiểm tra!');
      return;
    }
    if (examAssignedClasses.length === 0) {
      alert('Vui lòng chọn ít nhất 1 lớp được làm bài!');
      return;
    }
    if (examDuration <= 0) {
      alert('Thời gian làm bài phải lớn hơn 0 phút!');
      return;
    }
    if (examSelectedQIds.length === 0) {
      alert('Vui lòng chọn ít nhất 1 câu hỏi cho bài kiểm tra!');
      return;
    }
    if (examOpenTime && examCloseTime && new Date(examOpenTime) >= new Date(examCloseTime)) {
      alert('Thời gian mở bài kiểm tra phải trước thời gian hết hạn!');
      return;
    }

    const calculatedMaxAttempts = examMaxAttemptsMode === 'limited' ? Math.max(1, examMaxAttempts) : 0;
    const answerRevealMode: AnswerRevealMode = examShowAnswersImmediately ? 'immediate' : 'teacher-only';
    const scoreRevealMode: ScoreRevealMode = examShowScoreImmediately ? 'immediate' : 'teacher-only';

    if (editingExamId) {
      // Cập nhật bài kiểm tra đã có
      const updatedExams = store.exams.map((e) => {
        if (e.id === editingExamId) {
          return {
            ...e,
            title: examTitle.trim(),
            subject: examSubject,
            grade: examGrade,
            lessonIds: examLessonIds,
            durationMinutes: examDuration,
            scoreScale: examScale,
            questionCount: examSelectedQIds.length,
            questionIds: examSelectedQIds,
            assignedClassCodes: examAssignedClasses,
            answerRevealMode,
            scoreRevealMode,
            shuffleQuestions: examShuffle,
            status: examStatus,
            openTime: examOpenTime || undefined,
            closeTime: examCloseTime || undefined,
            maxAttempts: calculatedMaxAttempts,
            showAnswersImmediately: examShowAnswersImmediately,
            showScoreImmediately: examShowScoreImmediately,
            questionSelectionMode: examQuestionSelectionMode,
            updatedAt: new Date().toISOString(),
          };
        }
        return e;
      });
      onUpdateStore({ exams: updatedExams });
    } else {
      // Tạo mới bài kiểm tra
      const newExam: Exam = {
        id: `exam-${Date.now()}`,
        title: examTitle.trim(),
        subject: examSubject,
        grade: examGrade,
        lessonIds: examLessonIds,
        durationMinutes: examDuration,
        scoreScale: examScale,
        questionCount: examSelectedQIds.length,
        questionIds: examSelectedQIds,
        assignedClassCodes: examAssignedClasses,
        answerRevealMode,
        scoreRevealMode,
        shuffleQuestions: examShuffle,
        status: examStatus,
        createdAt: new Date().toISOString(),
        openTime: examOpenTime || undefined,
        closeTime: examCloseTime || undefined,
        maxAttempts: calculatedMaxAttempts,
        showAnswersImmediately: examShowAnswersImmediately,
        showScoreImmediately: examShowScoreImmediately,
        questionSelectionMode: examQuestionSelectionMode,
      };
      onUpdateStore({ exams: [newExam, ...store.exams] });
    }

    setShowExamModal(false);
  };

  const handleToggleExamStatus = (exam: Exam) => {
    const newStatus: 'published' | 'closed' = exam.status === 'published' ? 'closed' : 'published';
    const statusText = newStatus === 'published' ? 'Mở bài kiểm tra cho học sinh làm' : 'Đóng bài kiểm tra (tạm khóa)';
    if (!confirm(`Bạn có chắc muốn ${statusText} bài: "${exam.title}"?`)) return;

    const updated = store.exams.map((e) => (e.id === exam.id ? { ...e, status: newStatus } : e));
    onUpdateStore({ exams: updated });
  };

  const handleDeleteExam = (id: string) => {
    const exam = store.exams.find((e) => e.id === id);
    const relatedSubmissions = store.submissions.filter((s) => s.examId === id);
    let confirmMsg = `Bạn có chắc chắn muốn xóa bài kiểm tra "${exam?.title || id}"?`;
    if (relatedSubmissions.length > 0) {
      confirmMsg = `CẢNH BÁO: Đã có ${relatedSubmissions.length} lượt học sinh làm và nộp bài kiểm tra này!\nNếu bạn xóa, toàn bộ ${relatedSubmissions.length} kết quả nộp bài của học sinh cũng sẽ bị xóa khỏi hệ thống.\n\nBạn có chắc chắn muốn xóa bài kiểm tra này không?`;
    }
    if (!confirm(confirmMsg)) return;

    onUpdateStore({
      exams: store.exams.filter((e) => e.id !== id),
      submissions: store.submissions.filter((s) => s.examId !== id),
    });
    setSelectedExamIds((prev) => prev.filter((item) => item !== id));
  };

  const handlePickRandomQuestions = () => {
    let pool = store.questions.filter((q) => q.subject === examSubject && q.grade === examGrade);
    if (examLessonIds.length > 0) {
      const lessonPool = pool.filter((q) => examLessonIds.includes(q.lessonId));
      if (lessonPool.length >= randomTargetCount) {
        pool = lessonPool;
      }
    }

    if (pool.length === 0) {
      alert(`Không có câu hỏi nào trong ngân hàng cho môn ${examSubject === 'lich-su' ? 'Lịch sử' : 'Địa lí'} lớp ${examGrade}!`);
      return;
    }

    const bietCount = Math.round((randomRatioBiet / 100) * randomTargetCount);
    const hieuCount = Math.round((randomRatioHieu / 100) * randomTargetCount);
    const vanDungCount = Math.max(0, randomTargetCount - bietCount - hieuCount);

    const bietPool = pool.filter((q) => q.cognitiveLevel === 'biet').sort(() => Math.random() - 0.5);
    const hieuPool = pool.filter((q) => q.cognitiveLevel === 'hieu').sort(() => Math.random() - 0.5);
    const vanDungPool = pool.filter((q) => q.cognitiveLevel === 'van-dung').sort(() => Math.random() - 0.5);

    const selected: string[] = [];
    selected.push(...bietPool.slice(0, bietCount).map((q) => q.id));
    selected.push(...hieuPool.slice(0, hieuCount).map((q) => q.id));
    selected.push(...vanDungPool.slice(0, vanDungCount).map((q) => q.id));

    if (selected.length < randomTargetCount) {
      const remainingPool = pool.filter((q) => !selected.includes(q.id)).sort(() => Math.random() - 0.5);
      const needed = randomTargetCount - selected.length;
      selected.push(...remainingPool.slice(0, needed).map((q) => q.id));
    }

    setExamSelectedQIds(selected);
    alert(`Đã tự động bốc ngẫu nhiên thành công ${selected.length} câu hỏi theo ma trận (${randomRatioBiet}% Biết, ${randomRatioHieu}% Hiểu, ${randomRatioVanDung}% Vận dụng)!`);
  };

  const handlePickAIQuestions = () => {
    const aiQuestions = store.questions.filter(
      (q) =>
        q.subject === examSubject &&
        q.grade === examGrade &&
        (q.id.startsWith('ai-') || q.id.startsWith('gen-'))
    );
    if (aiQuestions.length === 0) {
      alert(`Chưa tìm thấy câu hỏi do AI sinh cho môn ${examSubject === 'lich-su' ? 'Lịch sử' : 'Địa lí'} lớp ${examGrade}! Bạn có thể vào tab "Biên soạn" để nhờ AI tạo thêm.`);
      return;
    }
    const aiIds = aiQuestions.map((q) => q.id);
    const merged = Array.from(new Set([...examSelectedQIds, ...aiIds]));
    setExamSelectedQIds(merged);
    alert(`Đã thêm ${aiQuestions.length} câu hỏi do AI tạo vào bài kiểm tra!`);
  };

  // -------------------------------------------------------------
  // PASSWORD HANDLERS
  // -------------------------------------------------------------

  const handleSavePasswords = () => {
    setPwdMessage(null);
    setPwdError(null);

    const authorTrim = newAuthorPassword.trim();
    const adminTrim = newAdminPassword.trim();

    if (!authorTrim && !adminTrim) {
      setPwdError('Vui lòng nhập ít nhất một mật khẩu mới để cập nhật!');
      return;
    }

    if (authorTrim && authorTrim.length < 6) {
      setPwdError('Mật khẩu GV Biên soạn phải có độ dài tối thiểu 6 ký tự!');
      return;
    }

    if (adminTrim && adminTrim.length < 6) {
      setPwdError('Mật khẩu GV Quản lý phải có độ dài tối thiểu 6 ký tự!');
      return;
    }

    const updatedConfig = { ...store.config };
    if (authorTrim) {
      updatedConfig.authorPasswordHash = authorTrim;
    }
    if (adminTrim) {
      updatedConfig.adminPasswordHash = adminTrim;
    }

    onUpdateStore({ config: updatedConfig });
    setPwdMessage('Đã cập nhật và lưu mật khẩu hệ thống mới thành công!');
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

  // -------------------------------------------------------------
  // BATCH SELECTION STATES & HANDLERS
  // -------------------------------------------------------------
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [selectedClassCodes, setSelectedClassCodes] = useState<string[]>([]);
  const [selectedExamIds, setSelectedExamIds] = useState<string[]>([]);
  const [selectedSubmissionIds, setSelectedSubmissionIds] = useState<string[]>([]);

  // Batch Class deletion
  const handleToggleSelectClass = (code: string) => {
    setSelectedClassCodes((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const handleToggleSelectAllClasses = () => {
    if (selectedClassCodes.length === store.classrooms.length && store.classrooms.length > 0) {
      setSelectedClassCodes([]);
    } else {
      setSelectedClassCodes(store.classrooms.map((c) => c.classCode));
    }
  };

  const handleBatchDeleteClasses = () => {
    if (selectedClassCodes.length === 0) return;
    const count = selectedClassCodes.length;
    if (!confirm(`Bạn có chắc chắn muốn xóa ${count} lớp học đã chọn và tất cả học sinh thuộc các lớp này?`)) return;

    const remainingClasses = store.classrooms.filter((c) => !selectedClassCodes.includes(c.classCode));
    const remainingStudents = store.students.filter((s) => !selectedClassCodes.includes(s.classCode));
    onUpdateStore({
      classrooms: remainingClasses,
      students: remainingStudents,
    });
    if (selectedClassCodes.includes(selectedClassCode)) {
      setSelectedClassCode('all');
    }
    setSelectedClassCodes([]);
  };

  // Batch Student deletion
  const handleToggleSelectStudent = (id: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAllStudents = () => {
    if (selectedStudentIds.length === filteredStudents.length && filteredStudents.length > 0) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(filteredStudents.map((s) => s.id));
    }
  };

  const handleBatchDeleteStudents = () => {
    if (selectedStudentIds.length === 0) return;
    const count = selectedStudentIds.length;
    if (!confirm(`Bạn có chắc chắn muốn xóa ${count} học sinh đã chọn khỏi hệ thống?`)) return;

    const remaining = store.students.filter((s) => !selectedStudentIds.includes(s.id));
    onUpdateStore({ students: remaining });
    setSelectedStudentIds([]);
  };

  // Filtered Exams (Kiểm tra thường xuyên)
  const filteredExams = store.exams.filter((exam) => {
    const matchSubject = examFilterSubject === 'all' || exam.subject === examFilterSubject;
    const matchGrade = examFilterGrade === 'all' || exam.grade.toString() === examFilterGrade;
    const matchStatus = examFilterStatus === 'all' || exam.status === examFilterStatus;
    const matchSearch =
      !examSearchText.trim() ||
      exam.title.toLowerCase().includes(examSearchText.toLowerCase()) ||
      (exam.assignedClassCodes || []).some((c) => c.toLowerCase().includes(examSearchText.toLowerCase()));
    return matchSubject && matchGrade && matchStatus && matchSearch;
  });

  // Batch Exam deletion
  const handleToggleSelectExam = (id: string) => {
    setSelectedExamIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAllExams = () => {
    if (selectedExamIds.length === filteredExams.length && filteredExams.length > 0) {
      setSelectedExamIds([]);
    } else {
      setSelectedExamIds(filteredExams.map((e) => e.id));
    }
  };

  const handleBatchDeleteExams = () => {
    if (selectedExamIds.length === 0) return;
    const count = selectedExamIds.length;
    const relatedSubmissions = store.submissions.filter((s) => selectedExamIds.includes(s.examId));
    let confirmMsg = `Bạn có chắc chắn muốn xóa ${count} bài kiểm tra thường xuyên đã chọn?`;
    if (relatedSubmissions.length > 0) {
      confirmMsg = `CẢNH BÁO: Trong các bài kiểm tra đã chọn, có ${relatedSubmissions.length} lượt nộp bài của học sinh!\nNếu bạn xóa, toàn bộ ${relatedSubmissions.length} kết quả này cũng sẽ bị xóa vĩnh viễn khỏi hệ thống.\n\nBạn có chắc chắn muốn xóa không?`;
    }
    if (!confirm(confirmMsg)) return;

    const remainingExams = store.exams.filter((e) => !selectedExamIds.includes(e.id));
    const remainingSubmissions = store.submissions.filter((s) => !selectedExamIds.includes(s.examId));
    onUpdateStore({
      exams: remainingExams,
      submissions: remainingSubmissions,
    });
    setSelectedExamIds([]);
  };

  // Single Submission deletion
  const handleDeleteSubmission = (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa kết quả nộp bài này?')) return;
    onUpdateStore({
      submissions: store.submissions.filter((s) => s.id !== id),
    });
  };

  // Batch Submission deletion
  const handleToggleSelectSubmission = (id: string) => {
    setSelectedSubmissionIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAllSubmissions = () => {
    if (selectedSubmissionIds.length === filteredSubmissions.length && filteredSubmissions.length > 0) {
      setSelectedSubmissionIds([]);
    } else {
      setSelectedSubmissionIds(filteredSubmissions.map((s) => s.id));
    }
  };

  const handleBatchDeleteSubmissions = () => {
    if (selectedSubmissionIds.length === 0) return;
    const count = selectedSubmissionIds.length;
    if (!confirm(`Bạn có chắc chắn muốn xóa ${count} bài nộp đã chọn khỏi hệ thống?`)) return;

    const remaining = store.submissions.filter((s) => !selectedSubmissionIds.includes(s.id));
    onUpdateStore({ submissions: remaining });
    setSelectedSubmissionIds([]);
  };

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
            Kiểm tra thường xuyên
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
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100 flex-wrap gap-2">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <School className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-sm font-bold text-slate-900">Danh sách các Lớp học THCS</h3>
                </div>
                {store.classrooms.length > 0 && (
                  <label className="inline-flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer select-none bg-slate-100 hover:bg-slate-200/80 px-2.5 py-1 rounded-md transition-colors">
                    <input
                      type="checkbox"
                      checked={selectedClassCodes.length === store.classrooms.length && store.classrooms.length > 0}
                      onChange={handleToggleSelectAllClasses}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                    />
                    <span className="font-medium">Chọn tất cả</span>
                  </label>
                )}
                {selectedClassCodes.length > 0 && (
                  <button
                    onClick={handleBatchDeleteClasses}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-xs transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Xóa lớp đã chọn ({selectedClassCodes.length})</span>
                  </button>
                )}
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
                const isSelected = selectedClassCodes.includes(cls.classCode);
                return (
                  <div
                    key={cls.id}
                    onClick={() => setSelectedClassCode(cls.classCode)}
                    className={`p-3 rounded-xl border text-left cursor-pointer relative group transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/70 shadow-xs ring-1 ring-indigo-500'
                        : selectedClassCode === cls.classCode
                        ? 'border-indigo-600 bg-indigo-50/60 shadow-xs'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onClick={(e) => e.stopPropagation()}
                          onChange={() => handleToggleSelectClass(cls.classCode)}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer"
                        />
                        <span className="text-xs font-bold text-slate-900">{cls.classCode}</span>
                      </div>
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
                      title="Xóa lớp học"
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
                {selectedStudentIds.length > 0 && (
                  <button
                    onClick={handleBatchDeleteStudents}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-xs transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Xóa đã chọn ({selectedStudentIds.length})</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    const initialClass = selectedClassCode !== 'all' ? selectedClassCode : (store.classrooms[0]?.classCode || '6A1');
                    setSingleStudentFullName('');
                    setSingleStudentCode('');
                    setSingleStudentClass(initialClass);
                    setSingleStudentError(null);
                    setShowAddStudentModal(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ Thêm học sinh</span>
                </button>
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
                    <th className="p-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={selectedStudentIds.length === filteredStudents.length && filteredStudents.length > 0}
                        onChange={handleToggleSelectAllStudents}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer"
                        title="Chọn tất cả học sinh đang hiển thị"
                      />
                    </th>
                    <th className="p-3">STT</th>
                    <th className="p-3">Mã Học Sinh</th>
                    <th className="p-3">Họ và Tên</th>
                    <th className="p-3">Lớp</th>
                    <th className="p-3">Khối</th>
                    <th className="p-3">Mật khẩu</th>
                    <th className="p-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.map((std, idx) => {
                    const isSelected = selectedStudentIds.includes(std.id);
                    return (
                      <tr
                        key={std.id}
                        className={`transition-colors ${
                          isSelected ? 'bg-indigo-50/50 hover:bg-indigo-50/80' : 'hover:bg-slate-50/70'
                        }`}
                      >
                        <td className="p-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelectStudent(std.id)}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer"
                          />
                        </td>
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
                        <td className="p-3">
                          {std.hasSetPassword ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Đã đặt mật khẩu</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium text-slate-400 bg-slate-100">
                              <span>- Chưa đặt mật khẩu</span>
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleResetStudentPassword(std)}
                              className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                              title="Đặt lại mật khẩu (yêu cầu tạo mật khẩu mới khi đăng nhập)"
                            >
                              <KeyRound className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleStartEditStudent(std)}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="Sửa thông tin học sinh"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteStudent(std)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Xóa học sinh"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredStudents.length === 0 && (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-slate-400">
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

      {/* ---------------- TAB 2: QUẢN LÝ KIỂM TRA THƯỜNG XUYÊN ---------------- */}
      {activeTab === 'exams' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-6">
          {/* Header & Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 flex-wrap">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Quản lý Kiểm tra thường xuyên
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">
                  {store.exams.length} bài
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Cấu hình thời gian làm bài, chọn câu hỏi (thủ công/AI/ngẫu nhiên), phân công lớp và mở/đóng bài kiểm tra
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {filteredExams.length > 0 && (
                <label className="inline-flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer select-none bg-slate-100 hover:bg-slate-200/80 px-3 py-2 rounded-xl transition-colors">
                  <input
                    type="checkbox"
                    checked={selectedExamIds.length === filteredExams.length && filteredExams.length > 0}
                    onChange={handleToggleSelectAllExams}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                  />
                  <span className="font-medium">Chọn tất cả ({filteredExams.length})</span>
                </label>
              )}
              {selectedExamIds.length > 0 && (
                <button
                  onClick={handleBatchDeleteExams}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Xóa đã chọn ({selectedExamIds.length})</span>
                </button>
              )}
              <button
                onClick={openCreateExamModal}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl shadow-xs transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Tạo bài kiểm tra mới</span>
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 text-xs">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Tìm kiếm bài kiểm tra:</label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Nhập tên bài, lớp..."
                  value={examSearchText}
                  onChange={(e) => setExamSearchText(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Phân môn:</label>
              <select
                value={examFilterSubject}
                onChange={(e) => setExamFilterSubject(e.target.value)}
                className="w-full p-1.5 bg-white border border-slate-300 rounded-lg text-xs"
              >
                <option value="all">Tất cả phân môn</option>
                <option value="lich-su">Lịch sử</option>
                <option value="dia-li">Địa lí</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Khối lớp:</label>
              <select
                value={examFilterGrade}
                onChange={(e) => setExamFilterGrade(e.target.value)}
                className="w-full p-1.5 bg-white border border-slate-300 rounded-lg text-xs"
              >
                <option value="all">Tất cả các khối</option>
                <option value="6">Khối 6</option>
                <option value="7">Khối 7</option>
                <option value="8">Khối 8</option>
                <option value="9">Khối 9</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Trạng thái mở/đóng:</label>
              <select
                value={examFilterStatus}
                onChange={(e) => setExamFilterStatus(e.target.value)}
                className="w-full p-1.5 bg-white border border-slate-300 rounded-lg text-xs"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="published">Đang mở (Published)</option>
                <option value="draft">Bản nháp (Draft)</option>
                <option value="closed">Đã đóng (Closed)</option>
              </select>
            </div>
          </div>

          {/* Exam Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredExams.map((exam) => {
              const submissionCount = store.submissions.filter((s) => s.examId === exam.id).length;
              const isSelected = selectedExamIds.includes(exam.id);

              // Lessons applied
              const appliedLessonTitles = (exam.lessonIds || [])
                .map((lid) => store.lessons.find((l) => l.id === lid)?.title)
                .filter(Boolean);

              // Status calculation
              const now = new Date();
              let statusLabel = 'Đang mở';
              let statusBadgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
              let statusIcon = <CheckCircle2 className="w-3.5 h-3.5" />;

              if (exam.status === 'draft') {
                statusLabel = 'Bản nháp';
                statusBadgeClass = 'bg-slate-100 text-slate-600 border-slate-200';
                statusIcon = <Pencil className="w-3.5 h-3.5" />;
              } else if (exam.status === 'closed') {
                statusLabel = 'Đã đóng';
                statusBadgeClass = 'bg-rose-50 text-rose-700 border-rose-200';
                statusIcon = <Lock className="w-3.5 h-3.5" />;
              } else if (exam.openTime && now < new Date(exam.openTime)) {
                statusLabel = 'Sắp mở (Hẹn giờ)';
                statusBadgeClass = 'bg-amber-50 text-amber-700 border-amber-200';
                statusIcon = <Clock className="w-3.5 h-3.5" />;
              } else if (exam.closeTime && now > new Date(exam.closeTime)) {
                statusLabel = 'Đã hết hạn';
                statusBadgeClass = 'bg-orange-50 text-orange-700 border-orange-200';
                statusIcon = <AlertTriangle className="w-3.5 h-3.5" />;
              }

              return (
                <div
                  key={exam.id}
                  className={`p-5 rounded-2xl border transition-all shadow-2xs flex flex-col justify-between space-y-3.5 ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50/20 ring-1 ring-indigo-500'
                      : 'border-slate-200 bg-white hover:border-indigo-300'
                  }`}
                >
                  <div className="space-y-2.5">
                    {/* Top row: Checkbox, Badges, Status */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectExam(exam.id)}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                        />
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                          exam.subject === 'lich-su' ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900'
                        }`}>
                          {exam.subject === 'lich-su' ? 'Lịch sử' : 'Địa lí'} • Lớp {exam.grade}
                        </span>
                        <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${statusBadgeClass}`}>
                          {statusIcon}
                          <span>{statusLabel}</span>
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-400 font-mono shrink-0">
                        {exam.createdAt ? new Date(exam.createdAt).toLocaleDateString('vi-VN') : ''}
                      </div>
                    </div>

                    {/* Exam Title */}
                    <div>
                      <h4 className="text-base font-bold text-slate-900 leading-snug">
                        {exam.title}
                      </h4>
                    </div>

                    {/* Applied Lessons */}
                    <div className="flex items-start gap-1.5 text-xs text-slate-600 bg-slate-50/80 p-2 rounded-xl border border-slate-100">
                      <BookOpen className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                      <div className="leading-relaxed">
                        <span className="font-semibold text-slate-700">Bài học áp dụng: </span>
                        {appliedLessonTitles.length > 0 ? (
                          <span>{appliedLessonTitles.join(', ')}</span>
                        ) : (
                          <span className="text-slate-500 italic">Tất cả bài học (Tổng hợp kiến thức)</span>
                        )}
                      </div>
                    </div>

                    {/* Badges Info Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div className="bg-slate-50 p-2 rounded-xl text-center border border-slate-100">
                        <span className="text-slate-500 text-[10px] block">Thời gian</span>
                        <span className="font-bold text-slate-800">{exam.durationMinutes} phút</span>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-xl text-center border border-slate-100">
                        <span className="text-slate-500 text-[10px] block">Số câu hỏi</span>
                        <span className="font-bold text-slate-800">{exam.questionCount} câu</span>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-xl text-center border border-slate-100">
                        <span className="text-slate-500 text-[10px] block">Thang điểm</span>
                        <span className="font-bold text-slate-800">Thang {exam.scoreScale}</span>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-xl text-center border border-slate-100">
                        <span className="text-slate-500 text-[10px] block">Đã nộp bài</span>
                        <span className="font-bold text-indigo-700">{submissionCount} bài</span>
                      </div>
                    </div>

                    {/* Details: Assigned classes, Window time, Attempt limits */}
                    <div className="text-xs text-slate-600 space-y-1.5 pt-1.5 border-t border-slate-100">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Lớp được giao:</span>
                        <div className="flex gap-1 flex-wrap justify-end">
                          {exam.assignedClassCodes && exam.assignedClassCodes.length > 0 ? (
                            exam.assignedClassCodes.map((c) => (
                              <span key={c} className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100 font-mono font-bold text-[11px]">
                                {c}
                              </span>
                            ))
                          ) : (
                            <span className="text-rose-500 italic text-[11px]">Chưa gán lớp</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Khung giờ mở bài:</span>
                        <span className="font-medium text-slate-800 text-[11px]">
                          {exam.openTime || exam.closeTime ? (
                            <>
                              {exam.openTime ? new Date(exam.openTime).toLocaleString('vi-VN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Bắt đầu ngay'}
                              {' → '}
                              {exam.closeTime ? new Date(exam.closeTime).toLocaleString('vi-VN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Không hết hạn'}
                            </>
                          ) : (
                            'Không giới hạn thời gian'
                          )}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Số lần làm lại:</span>
                        <span className="font-semibold text-slate-800 text-[11px]">
                          {exam.maxAttempts && exam.maxAttempts > 0 ? `Tối đa ${exam.maxAttempts} lần` : 'Không giới hạn (làm tự do)'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">Hiện điểm / Đáp án:</span>
                        <span className="font-medium text-slate-700">
                          {exam.showScoreImmediately ?? exam.scoreRevealMode === 'immediate' ? 'Hiện điểm' : 'Bảo mật điểm'} • {exam.showAnswersImmediately ?? exam.answerRevealMode === 'immediate' ? 'Hiện đáp án' : 'Ẩn đáp án'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => handleToggleExamStatus(exam)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors ${
                        exam.status === 'published'
                          ? 'border-slate-300 text-slate-700 hover:bg-slate-100'
                          : 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                      }`}
                      title={exam.status === 'published' ? 'Đóng bài kiểm tra (học sinh không vào làm được)' : 'Mở cho học sinh làm bài'}
                    >
                      {exam.status === 'published' ? (
                        <>
                          <Lock className="w-3.5 h-3.5 text-slate-500" />
                          <span>Đóng bài</span>
                        </>
                      ) : (
                        <>
                          <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Mở bài</span>
                        </>
                      )}
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => openEditExamModal(exam)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        <span>Sửa</span>
                      </button>
                      <button
                        onClick={() => handleDeleteExam(exam.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Xóa</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredExams.length === 0 && (
              <div className="col-span-1 md:col-span-2 text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <FileSpreadsheet className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-700">Chưa tìm thấy bài kiểm tra nào phù hợp</p>
                <p className="text-xs text-slate-500 mt-1">
                  Hãy thử thay đổi điều kiện lọc hoặc bấm "Tạo bài kiểm tra mới" để thiết lập.
                </p>
                <button
                  onClick={openCreateExamModal}
                  className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl shadow-xs transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tạo bài kiểm tra mới ngay</span>
                </button>
              </div>
            )}
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

              <div className="flex items-center gap-2 flex-wrap">
                {selectedSubmissionIds.length > 0 && (
                  <button
                    onClick={handleBatchDeleteSubmissions}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-xs transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Xóa bài nộp đã chọn ({selectedSubmissionIds.length})</span>
                  </button>
                )}
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
                    <th className="p-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={selectedSubmissionIds.length === filteredSubmissions.length && filteredSubmissions.length > 0}
                        onChange={handleToggleSelectAllSubmissions}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer"
                        title="Chọn tất cả bài nộp"
                      />
                    </th>
                    <th className="p-3">Học sinh</th>
                    <th className="p-3">Lớp</th>
                    <th className="p-3">Đề thi</th>
                    <th className="p-3 text-center">Điểm số</th>
                    <th className="p-3 text-center">Biết</th>
                    <th className="p-3 text-center">Hiểu</th>
                    <th className="p-3 text-center">Vận dụng</th>
                    <th className="p-3 text-right">Thời gian nộp</th>
                    <th className="p-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSubmissions.map((sub) => {
                    const isSelected = selectedSubmissionIds.includes(sub.id);
                    return (
                      <tr
                        key={sub.id}
                        className={`transition-colors ${
                          isSelected ? 'bg-indigo-50/50 hover:bg-indigo-50/80' : 'hover:bg-slate-50/70'
                        }`}
                      >
                        <td className="p-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelectSubmission(sub.id)}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer"
                          />
                        </td>
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
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleDeleteSubmission(sub.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Xóa bài nộp này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredSubmissions.length === 0 && (
                    <tr>
                      <td colSpan={10} className="text-center py-8 text-slate-400">
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
              <p className="text-xs text-slate-500">Giáo viên quản lý có quyền thay đổi mật khẩu riêng biệt cho cả 2 vai trò</p>
            </div>
          </div>

          {pwdMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{pwdMessage}</span>
            </div>
          )}

          {pwdError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{pwdError}</span>
            </div>
          )}

          <div className="space-y-5">
            {/* Author Password Setting */}
            <div className="p-4 bg-slate-50/70 border border-slate-200/80 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-800">
                  Mật khẩu Giáo viên Biên soạn (Author) mới:
                </label>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                  <span>Hiện tại:</span>
                  <code className="bg-white border border-slate-200 px-1.5 py-0.5 rounded font-mono text-slate-700">
                    {showCurrentAuthorPwd ? store.config.authorPasswordHash : '••••••••'}
                  </code>
                  <button
                    type="button"
                    onClick={() => setShowCurrentAuthorPwd(!showCurrentAuthorPwd)}
                    className="p-1 text-slate-400 hover:text-slate-600"
                    title={showCurrentAuthorPwd ? 'Ẩn' : 'Xem mật khẩu hiện tại'}
                  >
                    {showCurrentAuthorPwd ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
              <div className="relative">
                <input
                  type={showNewAuthorPwd ? 'text' : 'password'}
                  placeholder="Nhập mật khẩu mới cho GV Biên soạn (tối thiểu 6 ký tự)..."
                  value={newAuthorPassword}
                  onChange={(e) => setNewAuthorPassword(e.target.value)}
                  className="w-full text-sm p-2.5 pr-10 border border-slate-300 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                />
                <button
                  type="button"
                  onClick={() => setShowNewAuthorPwd(!showNewAuthorPwd)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showNewAuthorPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-500">
                Để trống nếu không muốn thay đổi mật khẩu của Giáo viên Biên soạn.
              </p>
            </div>

            {/* Admin Password Setting */}
            <div className="p-4 bg-slate-50/70 border border-slate-200/80 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-800">
                  Mật khẩu Giáo viên Quản lý (Admin) mới:
                </label>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                  <span>Hiện tại:</span>
                  <code className="bg-white border border-slate-200 px-1.5 py-0.5 rounded font-mono text-slate-700">
                    {showCurrentAdminPwd ? store.config.adminPasswordHash : '••••••••'}
                  </code>
                  <button
                    type="button"
                    onClick={() => setShowCurrentAdminPwd(!showCurrentAdminPwd)}
                    className="p-1 text-slate-400 hover:text-slate-600"
                    title={showCurrentAdminPwd ? 'Ẩn' : 'Xem mật khẩu hiện tại'}
                  >
                    {showCurrentAdminPwd ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
              <div className="relative">
                <input
                  type={showNewAdminPwd ? 'text' : 'password'}
                  placeholder="Nhập mật khẩu mới cho GV Quản lý (tối thiểu 6 ký tự)..."
                  value={newAdminPassword}
                  onChange={(e) => setNewAdminPassword(e.target.value)}
                  className="w-full text-sm p-2.5 pr-10 border border-slate-300 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
                <button
                  type="button"
                  onClick={() => setShowNewAdminPwd(!showNewAdminPwd)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showNewAdminPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-500">
                Để trống nếu không muốn thay đổi mật khẩu của Giáo viên Quản lý.
              </p>
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

      {/* ---------------- MODAL: THÊM HỌC SINH MỚI ---------------- */}
      {showAddStudentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">Thêm học sinh mới</h3>
              </div>
              <button
                onClick={() => setShowAddStudentModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {singleStudentError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs text-rose-700">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{singleStudentError}</span>
              </div>
            )}

            <form onSubmit={handleAddSingleStudent} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Họ và tên học sinh <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Nguyễn Văn An"
                  value={singleStudentFullName}
                  onChange={(e) => setSingleStudentFullName(e.target.value)}
                  className="w-full p-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mã học sinh
                </label>
                <input
                  type="text"
                  placeholder="Để trống cho hệ thống tự sinh mã (ví dụ HS601, HS702...)"
                  value={singleStudentCode}
                  onChange={(e) => setSingleStudentCode(e.target.value.toUpperCase())}
                  className="w-full p-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Mã duy nhất trong toàn hệ thống. Nếu để trống, hệ thống sẽ tự động gán mã theo đúng khối lớp.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Chọn Lớp học <span className="text-rose-500">*</span>
                </label>
                <select
                  value={singleStudentClass}
                  onChange={(e) => setSingleStudentClass(e.target.value)}
                  className="w-full p-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl bg-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  {store.classrooms.map((cls) => (
                    <option key={cls.id} value={cls.classCode}>
                      {cls.className || `Lớp ${cls.classCode}`} (Khối {cls.grade})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddStudentModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl shadow-xs transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Thêm học sinh</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------- MODAL: CHỈNH SỬA THÔNG TIN HỌC SINH ---------------- */}
      {showEditStudentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Pencil className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">Sửa thông tin học sinh</h3>
              </div>
              <button
                onClick={() => setShowEditStudentModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {editStudentError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs text-rose-700">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{editStudentError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEditedStudent} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Họ và tên học sinh <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editStudentFullName}
                  onChange={(e) => setEditStudentFullName(e.target.value)}
                  className="w-full p-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mã học sinh <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editStudentCode}
                  onChange={(e) => setEditStudentCode(e.target.value.toUpperCase())}
                  className="w-full p-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Mã học sinh dùng để đăng nhập và không được trùng lặp toàn trường.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Đổi Lớp học (chuyển lớp / khối) <span className="text-rose-500">*</span>
                </label>
                <select
                  value={editStudentClass}
                  onChange={(e) => setEditStudentClass(e.target.value)}
                  className="w-full p-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl bg-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  {store.classrooms.map((cls) => (
                    <option key={cls.id} value={cls.classCode}>
                      {cls.className || `Lớp ${cls.classCode}`} (Khối {cls.grade})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditStudentModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl shadow-xs transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Lưu thông tin</span>
                </button>
              </div>
            </form>
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

      {/* ---------------- MODAL: TẠO / SỬA BÀI KIỂM TRA THƯỜNG XUYÊN ---------------- */}
      {showExamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full p-5 sm:p-7 space-y-5 my-6 max-h-[92vh] overflow-y-auto border border-slate-100">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">
                    {editingExamId ? 'Chỉnh sửa bài Kiểm tra thường xuyên' : 'Tạo bài Kiểm tra thường xuyên mới'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Thiết lập phân môn, bài học áp dụng, thời gian làm bài, phân công lớp và câu hỏi
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowExamModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <div className="space-y-5 text-xs">
              {/* PHẦN 1: THÔNG TIN CHUNG & BÀI HỌC ÁP DỤNG */}
              <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/70 space-y-3.5">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  1. Thông tin chung & Bài học áp dụng
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Phân môn <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={examSubject}
                      onChange={(e) => {
                        const newSub = e.target.value as SubjectType;
                        setExamSubject(newSub);
                        setExamLessonIds([]);
                        setExamSelectedQIds([]);
                      }}
                      className="w-full p-2.5 border border-slate-300 rounded-xl bg-white font-medium"
                    >
                      <option value="lich-su">Lịch sử</option>
                      <option value="dia-li">Địa lí</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Khối lớp <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={examGrade}
                      onChange={(e) => {
                        const newG = Number(e.target.value) as GradeLevel;
                        setExamGrade(newG);
                        setExamLessonIds([]);
                        setExamSelectedQIds([]);
                        // Tự động gán các lớp thuộc khối mới
                        const defaultClasses = store.classrooms.filter((c) => c.grade === newG).map((c) => c.classCode);
                        setExamAssignedClasses(defaultClasses);
                      }}
                      className="w-full p-2.5 border border-slate-300 rounded-xl bg-white font-medium"
                    >
                      <option value={6}>Lớp 6</option>
                      <option value={7}>Lớp 7</option>
                      <option value={8}>Lớp 8</option>
                      <option value={9}>Lớp 9</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Trạng thái phát hành
                    </label>
                    <select
                      value={examStatus}
                      onChange={(e) => setExamStatus(e.target.value as 'published' | 'draft' | 'closed')}
                      className="w-full p-2.5 border border-slate-300 rounded-xl bg-white font-medium"
                    >
                      <option value="published">Đang mở (Published)</option>
                      <option value="draft">Bản nháp (Draft)</option>
                      <option value="closed">Đã đóng (Closed)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Tên bài kiểm tra <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Kiểm tra thường xuyên 15 phút - Lịch sử 6 Bài 1 & 2"
                    value={examTitle}
                    onChange={(e) => setExamTitle(e.target.value)}
                    className="w-full p-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl bg-white font-medium focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                {/* Lesson Picker */}
                <div>
                  <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
                    <label className="font-semibold text-slate-700">
                      Bài học cụ thể áp dụng (chọn các bài có trong nội dung kiểm tra):
                    </label>
                    <div className="flex items-center gap-2 text-[11px]">
                      <button
                        type="button"
                        onClick={() => {
                          const allLids = store.lessons
                            .filter((l) => l.subject === examSubject && l.grade === examGrade)
                            .map((l) => l.id);
                          setExamLessonIds(allLids);
                        }}
                        className="text-indigo-600 hover:underline font-medium"
                      >
                        Chọn tất cả bài
                      </button>
                      <span className="text-slate-300">|</span>
                      <button
                        type="button"
                        onClick={() => setExamLessonIds([])}
                        className="text-slate-500 hover:underline font-medium"
                      >
                        Bỏ chọn (Kiểm tra tổng hợp)
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 bg-white rounded-xl border border-slate-200">
                    {store.lessons
                      .filter((l) => l.subject === examSubject && l.grade === examGrade)
                      .map((lesson) => {
                        const isChecked = examLessonIds.includes(lesson.id);
                        return (
                          <button
                            type="button"
                            key={lesson.id}
                            onClick={() => {
                              if (isChecked) {
                                setExamLessonIds(examLessonIds.filter((id) => id !== lesson.id));
                              } else {
                                setExamLessonIds([...examLessonIds, lesson.id]);
                              }
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all text-left ${
                              isChecked
                                ? 'bg-indigo-600 text-white shadow-2xs'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80'
                            }`}
                          >
                            {lesson.title}
                          </button>
                        );
                      })}
                    {store.lessons.filter((l) => l.subject === examSubject && l.grade === examGrade).length === 0 && (
                      <span className="text-slate-400 italic text-[11px] p-1">
                        Chưa có bài học nào được định nghĩa cho môn {examSubject === 'lich-su' ? 'Lịch sử' : 'Địa lí'} lớp {examGrade}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* PHẦN 2: PHÂN CÔNG LỚP & THỜI GIAN */}
              <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/70 space-y-3.5">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  2. Phân công lớp & Thời gian làm bài
                </span>

                {/* Assigned Classes */}
                <div>
                  <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
                    <label className="font-semibold text-slate-700">
                      Gán cho các lớp làm bài <span className="text-rose-500">*</span>:
                    </label>
                    <div className="flex items-center gap-2 text-[11px]">
                      <button
                        type="button"
                        onClick={() => {
                          const allClasses = store.classrooms
                            .filter((c) => c.grade === examGrade)
                            .map((c) => c.classCode);
                          setExamAssignedClasses(allClasses);
                        }}
                        className="text-indigo-600 hover:underline font-medium"
                      >
                        Chọn tất cả lớp khối {examGrade}
                      </button>
                      <span className="text-slate-300">|</span>
                      <button
                        type="button"
                        onClick={() => setExamAssignedClasses([])}
                        className="text-slate-500 hover:underline font-medium"
                      >
                        Bỏ chọn tất cả
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {store.classrooms
                      .filter((c) => c.grade === examGrade)
                      .map((cls) => {
                        const isChecked = examAssignedClasses.includes(cls.classCode);
                        return (
                          <label
                            key={cls.id}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border cursor-pointer transition-all ${
                              isChecked
                                ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-bold'
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setExamAssignedClasses([...examAssignedClasses, cls.classCode]);
                                } else {
                                  setExamAssignedClasses(examAssignedClasses.filter((x) => x !== cls.classCode));
                                }
                              }}
                              className="rounded text-indigo-600 focus:ring-indigo-500"
                            />
                            <span>{cls.classCode}</span>
                            <span className="text-[10px] text-slate-400 font-normal">({cls.studentCount} HS)</span>
                          </label>
                        );
                      })}
                    {store.classrooms.filter((c) => c.grade === examGrade).length === 0 && (
                      <span className="text-rose-500 italic text-[11px]">
                        Chưa có lớp học nào thuộc khối {examGrade}. Hãy tạo lớp ở tab "Lớp học & Học sinh".
                      </span>
                    )}
                  </div>
                </div>

                {/* Duration & Presets */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Thời gian làm bài (phút) <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        max={180}
                        required
                        value={examDuration}
                        onChange={(e) => setExamDuration(Number(e.target.value))}
                        className="w-24 p-2 border border-slate-300 rounded-xl bg-white font-bold text-center text-sm"
                      />
                      <div className="flex items-center gap-1">
                        {[15, 20, 30, 45].map((preset) => (
                          <button
                            type="button"
                            key={preset}
                            onClick={() => setExamDuration(preset)}
                            className={`px-2 py-1 rounded-lg border text-[11px] font-semibold transition-all ${
                              examDuration === preset
                                ? 'bg-indigo-600 border-indigo-600 text-white'
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            {preset}p
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Thang điểm đánh giá
                    </label>
                    <select
                      value={examScale}
                      onChange={(e) => setExamScale(Number(e.target.value) as ScoreScale)}
                      className="w-full p-2.5 border border-slate-300 rounded-xl bg-white font-bold"
                    >
                      <option value={10}>Thang điểm 10 (tiêu chuẩn phổ thông)</option>
                      <option value={100}>Thang điểm 100</option>
                    </select>
                  </div>
                </div>

                {/* Open & Close Timestamps */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-200/60">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Thời gian bắt đầu mở bài (tùy chọn):
                    </label>
                    <input
                      type="datetime-local"
                      value={examOpenTime}
                      onChange={(e) => setExamOpenTime(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-xl bg-white text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Thời gian hết hạn/đóng bài (tùy chọn):
                    </label>
                    <input
                      type="datetime-local"
                      value={examCloseTime}
                      onChange={(e) => setExamCloseTime(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-xl bg-white text-xs font-mono"
                    />
                  </div>
                  <div className="col-span-1 sm:col-span-2 text-[11px] text-slate-500 italic">
                    * Mẹo: Để trống cả 2 ô nếu cho phép học sinh làm bài tự do bất cứ lúc nào (không giới hạn khung giờ).
                  </div>
                </div>
              </div>

              {/* PHẦN 3: CÀI ĐẶT LÀM BÀI & KẾT QUẢ */}
              <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/70 space-y-3.5">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  3. Quy định làm bài & Hiển thị kết quả
                </span>

                {/* Max attempts & Shuffle */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Số lần học sinh được phép làm bài:
                    </label>
                    <div className="space-y-1.5">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="attemptsMode"
                          checked={examMaxAttemptsMode === 'unlimited'}
                          onChange={() => setExamMaxAttemptsMode('unlimited')}
                          className="text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-slate-700">Không giới hạn (làm tự do nhiều lần)</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="attemptsMode"
                            checked={examMaxAttemptsMode === 'limited'}
                            onChange={() => setExamMaxAttemptsMode('limited')}
                            className="text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="text-slate-700">Giới hạn số lần làm:</span>
                        </label>
                        {examMaxAttemptsMode === 'limited' && (
                          <input
                            type="number"
                            min={1}
                            max={10}
                            value={examMaxAttempts}
                            onChange={(e) => setExamMaxAttempts(Number(e.target.value))}
                            className="w-16 p-1 text-center font-bold border border-slate-300 rounded-lg bg-white"
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Trộn ngẫu nhiên câu hỏi:
                    </label>
                    <label className="flex items-center gap-2 p-2 bg-white rounded-xl border border-slate-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={examShuffle}
                        onChange={(e) => setExamShuffle(e.target.checked)}
                        className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                      />
                      <span className="font-semibold text-slate-800">
                        Xáo trộn thứ tự câu hỏi khi học sinh mở bài làm
                      </span>
                    </label>
                  </div>
                </div>

                {/* Score & Answer Reveal */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200/60">
                  <label className="flex items-start gap-2.5 p-3 bg-white rounded-xl border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={examShowScoreImmediately}
                      onChange={(e) => setExamShowScoreImmediately(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 mt-0.5"
                    />
                    <div>
                      <span className="font-semibold text-slate-800 block">
                        Hiện điểm số ngay sau khi nộp bài
                      </span>
                      <span className="text-[11px] text-slate-500 block mt-0.5">
                        Học sinh biết ngay điểm đạt được. Nếu tắt, chỉ giáo viên mới thấy điểm.
                      </span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-3 bg-white rounded-xl border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={examShowAnswersImmediately}
                      onChange={(e) => setExamShowAnswersImmediately(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 mt-0.5"
                    />
                    <div>
                      <span className="font-semibold text-slate-800 block">
                        Hiện đáp án đúng & giải thích sau khi nộp
                      </span>
                      <span className="text-[11px] text-slate-500 block mt-0.5">
                        Cho phép học sinh xem lại chi tiết các câu đúng/sai để tự ôn tập.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* PHẦN 4: CHỌN CÂU HỎI CHO BÀI KIỂM TRA */}
              <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/70 space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                    4. Chọn câu hỏi cho bài kiểm tra
                  </span>

                  {/* Mode Tabs */}
                  <div className="flex items-center gap-1 p-1 bg-white rounded-xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setExamQuestionSelectionMode('manual')}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                        examQuestionSelectionMode === 'manual'
                          ? 'bg-indigo-600 text-white shadow-2xs'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Thủ công từ ngân hàng
                    </button>
                    <button
                      type="button"
                      onClick={() => setExamQuestionSelectionMode('ai')}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                        examQuestionSelectionMode === 'ai'
                          ? 'bg-indigo-600 text-white shadow-2xs'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Dùng câu AI sinh sẵn
                    </button>
                    <button
                      type="button"
                      onClick={() => setExamQuestionSelectionMode('random')}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                        examQuestionSelectionMode === 'random'
                          ? 'bg-indigo-600 text-white shadow-2xs'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Bốc ngẫu nhiên ma trận
                    </button>
                  </div>
                </div>

                {/* TAB 1: THỦ CÔNG TỪ NGÂN HÀNG */}
                {examQuestionSelectionMode === 'manual' && (
                  <div className="space-y-3">
                    {/* Filters bar in picker */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-white p-2.5 rounded-xl border border-slate-200 text-xs">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Tìm câu hỏi..."
                          value={qPickerSearch}
                          onChange={(e) => setQPickerSearch(e.target.value)}
                          className="w-full pl-8 pr-2 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>

                      <select
                        value={qPickerLevelFilter}
                        onChange={(e) => setQPickerLevelFilter(e.target.value as any)}
                        className="p-1.5 border border-slate-200 rounded-lg text-xs bg-white"
                      >
                        <option value="all">Mọi mức độ nhận thức</option>
                        <option value="biet">Chỉ mức Biết (Nhận biết)</option>
                        <option value="hieu">Chỉ mức Hiểu (Thông hiểu)</option>
                        <option value="van-dung">Chỉ mức Vận dụng</option>
                      </select>

                      <select
                        value={qPickerLessonFilter}
                        onChange={(e) => setQPickerLessonFilter(e.target.value)}
                        className="p-1.5 border border-slate-200 rounded-lg text-xs bg-white"
                      >
                        <option value="all">Mọi bài học</option>
                        {store.lessons
                          .filter((l) => l.subject === examSubject && l.grade === examGrade)
                          .map((l) => (
                            <option key={l.id} value={l.id}>{l.title}</option>
                          ))}
                      </select>
                    </div>

                    {/* Quick selection buttons */}
                    <div className="flex items-center justify-between text-xs px-1">
                      <span className="text-slate-500 font-medium">
                        Hiển thị {
                          store.questions.filter((q) => {
                            if (q.subject !== examSubject || q.grade !== examGrade) return false;
                            if (qPickerLevelFilter !== 'all' && q.cognitiveLevel !== qPickerLevelFilter) return false;
                            if (qPickerLessonFilter !== 'all' && q.lessonId !== qPickerLessonFilter) return false;
                            if (qPickerSearch.trim() && !q.questionText.toLowerCase().includes(qPickerSearch.toLowerCase())) return false;
                            return true;
                          }).length
                        } câu hỏi phù hợp
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const matched = store.questions
                              .filter((q) => {
                                if (q.subject !== examSubject || q.grade !== examGrade) return false;
                                if (qPickerLevelFilter !== 'all' && q.cognitiveLevel !== qPickerLevelFilter) return false;
                                if (qPickerLessonFilter !== 'all' && q.lessonId !== qPickerLessonFilter) return false;
                                if (qPickerSearch.trim() && !q.questionText.toLowerCase().includes(qPickerSearch.toLowerCase())) return false;
                                return true;
                              })
                              .map((q) => q.id);
                            const combined = Array.from(new Set([...examSelectedQIds, ...matched]));
                            setExamSelectedQIds(combined);
                          }}
                          className="text-indigo-600 hover:underline font-semibold"
                        >
                          + Chọn các câu đang lọc
                        </button>
                        <span className="text-slate-300">|</span>
                        <button
                          type="button"
                          onClick={() => setExamSelectedQIds([])}
                          className="text-slate-500 hover:underline font-semibold"
                        >
                          Bỏ chọn tất cả
                        </button>
                      </div>
                    </div>

                    {/* Scrollable Questions list */}
                    <div className="max-h-60 overflow-y-auto space-y-2 border border-slate-200 rounded-xl p-2 bg-white text-xs">
                      {store.questions
                        .filter((q) => {
                          if (q.subject !== examSubject || q.grade !== examGrade) return false;
                          if (qPickerLevelFilter !== 'all' && q.cognitiveLevel !== qPickerLevelFilter) return false;
                          if (qPickerLessonFilter !== 'all' && q.lessonId !== qPickerLessonFilter) return false;
                          if (qPickerSearch.trim() && !q.questionText.toLowerCase().includes(qPickerSearch.toLowerCase())) return false;
                          return true;
                        })
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
                              className={`p-2.5 rounded-xl border cursor-pointer flex items-start gap-2.5 transition-all ${
                                isSelected
                                  ? 'bg-indigo-50/80 border-indigo-300 text-indigo-950 font-medium ring-1 ring-indigo-400'
                                  : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                readOnly
                                className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                              />
                              <div className="flex-1 space-y-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-bold text-slate-500 text-[11px]">#{idx + 1}</span>
                                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                                    q.cognitiveLevel === 'biet'
                                      ? 'bg-sky-100 text-sky-800'
                                      : q.cognitiveLevel === 'hieu'
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-purple-100 text-purple-800'
                                  }`}>
                                    {q.cognitiveLevel}
                                  </span>
                                  {q.isAIGenerated && (
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                                      AI
                                    </span>
                                  )}
                                  <span className="text-[10px] text-slate-400">
                                    {store.lessons.find((l) => l.id === q.lessonId)?.title || q.lessonId}
                                  </span>
                                </div>
                                <p className="text-xs leading-relaxed line-clamp-2">
                                  {q.questionText}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* TAB 2: DÙNG CÂU DO AI SINH SẴN */}
                {examQuestionSelectionMode === 'ai' && (
                  <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <h4 className="font-bold text-slate-800 text-xs sm:text-sm">
                          Câu hỏi được tạo bởi Trí tuệ nhân tạo (AI)
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Chọn các câu hỏi đã được tạo từ tính năng "AI Biên soạn" hoặc "AI Tạo câu hỏi"
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handlePickAIQuestions}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl shadow-xs transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Thêm toàn bộ câu do AI tạo</span>
                      </button>
                    </div>

                    <div className="max-h-56 overflow-y-auto space-y-2 border border-slate-200 rounded-xl p-2 bg-slate-50 text-xs">
                      {store.questions
                        .filter((q) => q.subject === examSubject && q.grade === examGrade && q.isAIGenerated)
                        .map((q) => {
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
                              className={`p-2.5 rounded-xl border cursor-pointer flex items-start gap-2.5 transition-all ${
                                isSelected ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-medium' : 'bg-white border-slate-200'
                              }`}
                            >
                              <input type="checkbox" checked={isSelected} readOnly className="mt-0.5 rounded text-emerald-600" />
                              <div className="flex-1">
                                <div className="flex items-center gap-1.5 mb-1">
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 uppercase">
                                    AI • {q.cognitiveLevel}
                                  </span>
                                  <span className="text-[10px] text-slate-500">
                                    {store.lessons.find((l) => l.id === q.lessonId)?.title || q.lessonId}
                                  </span>
                                </div>
                                <span>{q.questionText}</span>
                              </div>
                            </div>
                          );
                        })}
                      {store.questions.filter((q) => q.subject === examSubject && q.grade === examGrade && q.isAIGenerated).length === 0 && (
                        <div className="text-center py-6 text-slate-400 italic">
                          Chưa có câu hỏi nào do AI tạo trong môn {examSubject === 'lich-su' ? 'Lịch sử' : 'Địa lí'} lớp {examGrade}.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 3: BỐC NGẪU NHIÊN THEO MA TRẬN */}
                {examQuestionSelectionMode === 'random' && (
                  <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200">
                    <div>
                      <h4 className="font-bold text-slate-800 text-xs sm:text-sm">
                        Bốc đề ngẫu nhiên theo ma trận nhận thức
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Hệ thống sẽ tự động bốc câu hỏi từ ngân hàng theo đúng tỷ lệ Biết - Hiểu - Vận dụng
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Tổng số câu cần ra:
                        </label>
                        <input
                          type="number"
                          min={2}
                          max={50}
                          value={randomTargetCount}
                          onChange={(e) => setRandomTargetCount(Number(e.target.value))}
                          className="w-full p-2 border border-slate-300 rounded-lg bg-white font-bold text-center"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-sky-800 mb-1">
                          % Nhận biết (Biết):
                        </label>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={randomRatioBiet}
                            onChange={(e) => setRandomRatioBiet(Number(e.target.value))}
                            className="w-full p-2 border border-sky-300 rounded-lg bg-white font-bold text-center"
                          />
                          <span className="font-bold text-slate-500">%</span>
                        </div>
                      </div>

                      <div>
                        <label className="block font-semibold text-amber-800 mb-1">
                          % Thông hiểu (Hiểu):
                        </label>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={randomRatioHieu}
                            onChange={(e) => setRandomRatioHieu(Number(e.target.value))}
                            className="w-full p-2 border border-amber-300 rounded-lg bg-white font-bold text-center"
                          />
                          <span className="font-bold text-slate-500">%</span>
                        </div>
                      </div>

                      <div>
                        <label className="block font-semibold text-purple-800 mb-1">
                          % Vận dụng:
                        </label>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={randomRatioVanDung}
                            onChange={(e) => setRandomRatioVanDung(Number(e.target.value))}
                            className="w-full p-2 border border-purple-300 rounded-lg bg-white font-bold text-center"
                          />
                          <span className="font-bold text-slate-500">%</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
                      <span className="text-[11px] text-slate-500">
                        Tổng tỉ lệ: <strong className={randomRatioBiet + randomRatioHieu + randomRatioVanDung === 100 ? 'text-emerald-600' : 'text-rose-600'}>{randomRatioBiet + randomRatioHieu + randomRatioVanDung}%</strong>
                      </span>
                      <button
                        type="button"
                        onClick={handlePickRandomQuestions}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl shadow-xs transition-colors"
                      >
                        <Shuffle className="w-3.5 h-3.5" />
                        <span>Bốc ngẫu nhiên ngay</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Question Selection Summary */}
                <div className="flex items-center justify-between p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-700" />
                    <span className="font-bold text-indigo-950 text-xs">
                      Đã chọn: {examSelectedQIds.length} câu hỏi
                    </span>
                    <span className="text-[11px] text-indigo-800">
                      (Biết: {
                        store.questions.filter((q) => examSelectedQIds.includes(q.id) && q.cognitiveLevel === 'biet').length
                      }, Hiểu: {
                        store.questions.filter((q) => examSelectedQIds.includes(q.id) && q.cognitiveLevel === 'hieu').length
                      }, Vận dụng: {
                        store.questions.filter((q) => examSelectedQIds.includes(q.id) && q.cognitiveLevel === 'van-dung').length
                      })
                    </span>
                  </div>

                  {examSelectedQIds.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setExamSelectedQIds([])}
                      className="text-xs text-rose-600 hover:underline font-semibold"
                    >
                      Bỏ chọn tất cả
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowExamModal(false)}
                className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleSaveExam}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl shadow-xs transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>{editingExamId ? 'Cập nhật bài kiểm tra' : 'Lưu & Phát hành bài kiểm tra'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
