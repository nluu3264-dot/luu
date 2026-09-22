/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AppStoreData, ExamSubmission, Student, Classroom, Lesson, Question, Exam } from '../types';
import * as XLSX from 'xlsx';

export async function fetchStore(): Promise<AppStoreData> {
  try {
    const res = await fetch('/api/data');
    if (!res.ok) throw new Error('Không thể tải dữ liệu máy chủ');
    const json = await res.json();
    return json.data;
  } catch (error) {
    console.warn('Using localStorage fallback for store data', error);
    const cached = localStorage.getItem('on_tap_thcs_store');
    if (cached) {
      return JSON.parse(cached);
    }
    throw error;
  }
}

export const getStoreApi = fetchStore;

export async function updateStore(partial: Partial<AppStoreData>): Promise<AppStoreData> {
  try {
    const res = await fetch('/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(partial),
    });
    if (!res.ok) throw new Error('Lỗi cập nhật dữ liệu máy chủ');
    const json = await res.json();
    localStorage.setItem('on_tap_thcs_store', JSON.stringify(json.data));
    return json.data;
  } catch (error) {
    console.warn('Updating localStorage fallback', error);
    const cached = localStorage.getItem('on_tap_thcs_store');
    const current = cached ? JSON.parse(cached) : {};
    const updated = { ...current, ...partial };
    localStorage.setItem('on_tap_thcs_store', JSON.stringify(updated));
    return updated as AppStoreData;
  }
}

export const saveStoreApi = updateStore;

export async function loginApi(payload: {
  role: 'student' | 'author' | 'admin';
  password?: string;
  classCode?: string;
  studentCode?: string;
}): Promise<{
  success: boolean;
  role: 'student' | 'author' | 'admin';
  student?: Student;
  requiresPassword?: boolean;
  requiresPasswordSetup?: boolean;
  hasSetPassword?: boolean;
  error?: string;
}> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok) {
    // If 401 with requiresPassword flag, return the object so UI can prompt for password
    if (json.requiresPassword) {
      return json;
    }
    throw new Error(json.error || 'Đăng nhập thất bại');
  }
  return json;
}

export async function checkStudentStatusApi(classCode: string, studentCode: string): Promise<{
  success: boolean;
  hasSetPassword: boolean;
  fullName: string;
}> {
  const res = await fetch('/api/student/check-status', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ classCode, studentCode }),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error || 'Không tìm thấy học sinh');
  }
  return json;
}

export async function setupStudentPasswordApi(studentId: string, password: string): Promise<{
  success: boolean;
  student: Student;
}> {
  const res = await fetch('/api/student/setup-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ studentId, password }),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error || 'Lỗi thiết lập mật khẩu');
  }
  return json;
}

export async function changeStudentPasswordApi(
  studentId: string,
  currentPassword: string,
  newPassword: string
): Promise<{
  success: boolean;
  student: Student;
}> {
  const res = await fetch('/api/student/change-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ studentId, currentPassword, newPassword }),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error || 'Lỗi thay đổi mật khẩu');
  }
  return json;
}

export async function resetStudentPasswordApi(studentId: string): Promise<{
  success: boolean;
  student: Student;
}> {
  const res = await fetch('/api/student/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ studentId }),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error || 'Lỗi đặt lại mật khẩu');
  }
  return json;
}

export async function submitExamApi(payload: {
  examId: string;
  studentId: string;
  studentCode: string;
  studentName: string;
  classCode: string;
  answers: any[];
}): Promise<ExamSubmission> {
  const res = await fetch('/api/submissions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error || 'Nộp bài thất bại');
  }
  return json.submission;
}

export async function summarizeDocumentApi(payload: {
  subject: string;
  grade: number;
  lessonTitle?: string;
  textContent?: string;
  files?: { base64: string; mimeType: string; name?: string }[];
}) {
  const res = await fetch('/api/gemini/extract-and-summarize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error || 'Lỗi xử lý tài liệu với Gemini AI');
  }
  return json.data;
}

export async function generateAIQuestionsApi(payload: {
  subject: string;
  grade: number;
  lessonTitle?: string;
  lessonTheory?: any;
  count: number;
  ratios: { biet: number; hieu: number; vanDung: number };
  questionTypes: string[];
  customPrompt?: string;
  files?: { base64: string; mimeType: string; name?: string }[];
}): Promise<Question[]> {
  const res = await fetch('/api/gemini/generate-questions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok && !json.questions) {
    throw new Error(json.error || 'Lỗi sinh câu hỏi với Gemini AI');
  }
  return json.questions || [];
}

// -------------------------------------------------------------
// Excel / CSV Export & Import Utilities
// -------------------------------------------------------------

export function exportStudentsToExcel(students: Student[], classCode?: string) {
  const filtered = classCode ? students.filter(s => s.classCode === classCode) : students;
  const rows = filtered.map((s, idx) => ({
    'STT': idx + 1,
    'Mã học sinh': s.studentCode,
    'Họ và tên': s.fullName,
    'Lớp': s.classCode,
    'Khối': s.grade,
    'Ghi chú': s.notes || ''
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'DanhSachHocSinh');
  XLSX.writeFile(workbook, `Danh_Sach_Hoc_Sinh_${classCode || 'Tat_Ca'}.xlsx`);
}

export function exportExamResultsToExcel(submissions: ExamSubmission[], examTitle?: string) {
  const rows = submissions.map((sub, idx) => ({
    'STT': idx + 1,
    'Đề kiểm tra': sub.examTitle,
    'Môn': sub.subject === 'lich-su' ? 'Lịch sử' : 'Địa lí',
    'Khối': sub.grade,
    'Lớp': sub.classCode,
    'Mã học sinh': sub.studentCode,
    'Họ tên học sinh': sub.studentName,
    'Điểm': sub.score,
    'Thang điểm': sub.maxScore,
    'Tỉ lệ đạt (%)': `${sub.percentage}%`,
    'Số câu Biết đúng': `${sub.breakdown.biet.correct}/${sub.breakdown.biet.total}`,
    'Tỉ lệ Biết (%)': `${sub.breakdown.biet.percentage}%`,
    'Số câu Hiểu đúng': `${sub.breakdown.hieu.correct}/${sub.breakdown.hieu.total}`,
    'Tỉ lệ Hiểu (%)': `${sub.breakdown.hieu.percentage}%`,
    'Số câu Vận dụng đúng': `${sub.breakdown.vanDung.correct}/${sub.breakdown.vanDung.total}`,
    'Tỉ lệ Vận dụng (%)': `${sub.breakdown.vanDung.percentage}%`,
    'Thời gian nộp': new Date(sub.submittedAt).toLocaleString('vi-VN')
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'KetQuaKiemTra');
  XLSX.writeFile(workbook, `Ket_Qua_${examTitle ? examTitle.replace(/\s+/g, '_') : 'Kiem_Tra'}.xlsx`);
}

export function parseStudentsFromExcel(file: File): Promise<Partial<Student>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const json: any[] = XLSX.utils.sheet_to_json(sheet);

        const students: Partial<Student>[] = [];
        for (const row of json) {
          // Identify columns flexibly
          const studentCode = row['Mã học sinh'] || row['Mã HS'] || row['MaHS'] || row['Code'] || row['Mã'] || '';
          const fullName = row['Họ và tên'] || row['Họ tên'] || row['Họ Tên'] || row['FullName'] || row['Tên'] || '';
          const classCode = row['Lớp'] || row['Mã lớp'] || row['Class'] || row['Lop'] || '';
          const grade = row['Khối'] || row['Khoi'] || (classCode ? parseInt(classCode) || 6 : 6);

          if (fullName || studentCode) {
            students.push({
              studentCode: String(studentCode || `HS${Math.floor(100 + Math.random() * 900)}`).trim(),
              fullName: String(fullName || 'Học sinh').trim(),
              classCode: String(classCode || '').trim().toUpperCase(),
              grade: [6, 7, 8, 9].includes(Number(grade)) ? (Number(grade) as any) : 6
            });
          }
        }
        resolve(students);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

export function parseStudentsFromClipboard(text: string, defaultClassCode: string, defaultGrade: 6 | 7 | 8 | 9): Partial<Student>[] {
  const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
  const students: Partial<Student>[] = [];

  for (const line of lines) {
    // Split by tab, comma, or semicolon
    const parts = line.split(/\t|,|;/).map(p => p.trim());
    if (parts.length === 1) {
      // Just full name or code
      const val = parts[0];
      students.push({
        studentCode: `HS${Math.floor(100 + Math.random() * 900)}`,
        fullName: val,
        classCode: defaultClassCode,
        grade: defaultGrade
      });
    } else if (parts.length === 2) {
      // Might be [Code, Name] or [STT, Name]
      const isFirstCode = parts[0].length < 10 && /\d/.test(parts[0]);
      students.push({
        studentCode: isFirstCode ? parts[0] : `HS${Math.floor(100 + Math.random() * 900)}`,
        fullName: isFirstCode ? parts[1] : parts[0],
        classCode: defaultClassCode,
        grade: defaultGrade
      });
    } else if (parts.length >= 3) {
      // Often [STT, Code, Name] or [Code, Name, Class]
      let code = parts[0];
      let name = parts[1];
      let cls = defaultClassCode;

      if (!isNaN(Number(parts[0])) && parts.length >= 3) {
        // First is index STT
        code = parts[1];
        name = parts[2];
        if (parts[3]) cls = parts[3].toUpperCase();
      } else {
        if (parts[2]) cls = parts[2].toUpperCase();
      }

      students.push({
        studentCode: code || `HS${Math.floor(100 + Math.random() * 900)}`,
        fullName: name,
        classCode: cls || defaultClassCode,
        grade: defaultGrade
      });
    }
  }

  return students;
}
