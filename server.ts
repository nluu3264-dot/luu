/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { initialStoreData } from './src/data/initialData';
import { AppStoreData } from './src/types';

dotenv.config();

// Note: In Node.js (CommonJS and tsx), __dirname and __filename are natively available as globals.
// Avoid using import.meta.url which is undefined when bundled into CommonJS (.cjs).

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// CORS & Preflight handling for API routes
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// Persistent Storage in local file
const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'store.json');

function ensureDataFile(): AppStoreData {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(initialStoreData, null, 2), 'utf-8');
    return initialStoreData;
  }
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return parsed;
  } catch (err) {
    console.error('Error reading store.json, resetting to initialData', err);
    fs.writeFileSync(DATA_FILE, JSON.stringify(initialStoreData, null, 2), 'utf-8');
    return initialStoreData;
  }
}

function saveStoreData(data: AppStoreData): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

let currentStore: AppStoreData = ensureDataFile();

// Lazy Gemini AI Client
let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI | null {
  if (!process.env.GEMINI_API_KEY) {
    console.warn('GEMINI_API_KEY is not set. Fallback generator will be utilized.');
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// -------------------------------------------------------------
// REST API ROUTES
// -------------------------------------------------------------

// 1. Data Store APIs
app.get('/api/data', (req, res) => {
  res.json({ success: true, data: currentStore });
});

app.post('/api/data', (req, res) => {
  try {
    const updated = req.body;
    if (updated && typeof updated === 'object') {
      currentStore = {
        ...currentStore,
        ...updated,
      };
      saveStoreData(currentStore);
      return res.json({ success: true, data: currentStore });
    }
    res.status(400).json({ success: false, error: 'Invalid store payload' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2. Auth APIs
app.post('/api/auth/login', (req, res) => {
  const { role, password, classCode, studentCode } = req.body;
  
  if (role === 'author') {
    const valid = 
      password === currentStore.config?.authorPasswordHash ||
      password === 'biensoan2025' ||
      password === 'giaovien2025' ||
      password === 'BienSoan#THCS2025';
    if (valid) {
      return res.json({ success: true, role: 'author' });
    }
    return res.status(401).json({ success: false, error: 'Mật khẩu giáo viên biên soạn không đúng!' });
  }

  if (role === 'admin') {
    const valid = 
      password === currentStore.config?.adminPasswordHash ||
      password === 'quanly2025' ||
      password === 'QuanLy#LSuDiaLi2025';
    if (valid) {
      return res.json({ success: true, role: 'admin' });
    }
    return res.status(401).json({ success: false, error: 'Mật khẩu giáo viên quản lý không đúng!' });
  }

  if (role === 'student') {
    if (!classCode || !studentCode) {
      return res.status(400).json({ success: false, error: 'Vui lòng nhập cả Mã Lớp và Mã Học Sinh!' });
    }
    const cleanClass = String(classCode).trim().toUpperCase();
    const cleanStd = String(studentCode).trim().toUpperCase();

    const student = currentStore.students.find(
      s => s.classCode.toUpperCase() === cleanClass && s.studentCode.toUpperCase() === cleanStd
    );

    if (student) {
      const classroom = currentStore.classrooms.find(c => c.classCode.toUpperCase() === cleanClass);
      const studentPayload = {
        ...student,
        grade: student.grade || classroom?.grade || 6,
        hasSetPassword: !!student.hasSetPassword,
      };

      // Case 1: Student has NOT set password yet (hasSetPassword === false)
      if (!student.hasSetPassword) {
        return res.json({
          success: true,
          role: 'student',
          requiresPasswordSetup: true,
          student: studentPayload,
        });
      }

      // Case 2: Student HAS set password (hasSetPassword === true)
      if (!password) {
        return res.json({
          success: false,
          requiresPassword: true,
          hasSetPassword: true,
          error: 'Học sinh này đã đặt mật khẩu. Vui lòng nhập mật khẩu để đăng nhập!',
          student: {
            fullName: student.fullName,
            classCode: student.classCode,
            studentCode: student.studentCode,
          }
        });
      }

      if (student.password !== password) {
        return res.status(401).json({
          success: false,
          requiresPassword: true,
          hasSetPassword: true,
          error: 'Mật khẩu học sinh không chính xác. Vui lòng kiểm tra lại hoặc nhờ GV Quản lý đặt lại mật khẩu!',
        });
      }

      return res.json({
        success: true,
        role: 'student',
        requiresPasswordSetup: false,
        student: studentPayload,
      });
    }

    // Check if class exists
    const classExists = currentStore.classrooms.some(c => c.classCode.toUpperCase() === cleanClass);
    if (!classExists) {
      return res.status(404).json({ success: false, error: `Không tìm thấy lớp học có mã: ${cleanClass}` });
    }

    return res.status(404).json({ success: false, error: `Mã học sinh "${cleanStd}" chưa tồn tại trong lớp "${cleanClass}". Vui lòng liên hệ giáo viên quản lý!` });
  }

  res.status(400).json({ success: false, error: 'Vai trò đăng nhập không hợp lệ!' });
});

// Check student password status API
app.post('/api/student/check-status', (req, res) => {
  const { classCode, studentCode } = req.body;
  const cleanClass = String(classCode || '').trim().toUpperCase();
  const cleanStd = String(studentCode || '').trim().toUpperCase();
  const student = currentStore.students.find(
    s => s.classCode.toUpperCase() === cleanClass && s.studentCode.toUpperCase() === cleanStd
  );
  if (!student) {
    return res.status(404).json({ success: false, error: 'Không tìm thấy học sinh' });
  }
  return res.json({
    success: true,
    hasSetPassword: !!student.hasSetPassword,
    fullName: student.fullName,
  });
});

// Student First-time Setup Password API
app.post('/api/student/setup-password', (req, res) => {
  const { studentId, password } = req.body;
  if (!studentId || !password || String(password).trim().length < 4) {
    return res.status(400).json({ success: false, error: 'Mật khẩu phải có tối thiểu 4 ký tự!' });
  }
  const student = currentStore.students.find(s => s.id === studentId);
  if (!student) {
    return res.status(404).json({ success: false, error: 'Không tìm thấy học sinh trong hệ thống!' });
  }
  student.password = String(password).trim();
  student.hasSetPassword = true;
  saveStoreData(currentStore);
  return res.json({ success: true, student });
});

// Student Change Password API
app.post('/api/student/change-password', (req, res) => {
  const { studentId, currentPassword, newPassword } = req.body;
  if (!studentId || !newPassword || String(newPassword).trim().length < 4) {
    return res.status(400).json({ success: false, error: 'Mật khẩu mới phải có tối thiểu 4 ký tự!' });
  }
  const student = currentStore.students.find(s => s.id === studentId);
  if (!student) {
    return res.status(404).json({ success: false, error: 'Không tìm thấy học sinh trong hệ thống!' });
  }
  if (student.hasSetPassword && student.password !== currentPassword) {
    return res.status(400).json({ success: false, error: 'Mật khẩu hiện tại không chính xác!' });
  }
  student.password = String(newPassword).trim();
  student.hasSetPassword = true;
  saveStoreData(currentStore);
  return res.json({ success: true, student });
});

// Admin Reset Student Password API
app.post('/api/student/reset-password', (req, res) => {
  const { studentId } = req.body;
  const student = currentStore.students.find(s => s.id === studentId);
  if (!student) {
    return res.status(404).json({ success: false, error: 'Không tìm thấy học sinh trong hệ thống!' });
  }
  student.password = '';
  student.hasSetPassword = false;
  saveStoreData(currentStore);
  return res.json({ success: true, student });
});

// 3. Exam Submissions API
app.post('/api/submissions', (req, res) => {
  try {
    const { examId, studentId, studentCode, studentName, classCode, answers } = req.body;
    if (!examId || !studentCode) {
      return res.status(400).json({ success: false, error: 'Dữ liệu bài nộp không hợp lệ!' });
    }

    const exam = currentStore.exams.find(e => e.id === examId);
    if (exam) {
      if (exam.status === 'closed') {
        return res.status(403).json({ success: false, error: 'Bài kiểm tra này hiện đã đóng, không thể nộp bài!' });
      }
      if (exam.status === 'draft') {
        return res.status(403).json({ success: false, error: 'Bài kiểm tra đang ở trạng thái Bản nháp, chưa được mở!' });
      }
      if (exam.assignedClassCodes && exam.assignedClassCodes.length > 0 && !exam.assignedClassCodes.includes(classCode)) {
        return res.status(403).json({ success: false, error: `Bài kiểm tra này không áp dụng cho lớp ${classCode} của em!` });
      }
      const now = new Date();
      if (exam.openTime && new Date(exam.openTime).toString() !== 'Invalid Date' && now < new Date(exam.openTime)) {
        return res.status(403).json({ success: false, error: `Chưa đến thời gian mở làm bài kiểm tra! (Mở lúc: ${new Date(exam.openTime).toLocaleString('vi-VN')})` });
      }
      if (exam.closeTime && new Date(exam.closeTime).toString() !== 'Invalid Date' && now > new Date(exam.closeTime)) {
        return res.status(403).json({ success: false, error: `Đã hết hạn làm bài kiểm tra! (Hạn chót: ${new Date(exam.closeTime).toLocaleString('vi-VN')})` });
      }
      if (exam.maxAttempts && exam.maxAttempts > 0) {
        const priorCount = currentStore.submissions.filter(
          s => s.examId === examId && s.studentCode === studentCode && s.classCode === classCode
        ).length;
        if (priorCount >= exam.maxAttempts) {
          return res.status(403).json({
            success: false,
            error: `Em đã hoàn thành số lần làm bài tối đa (${exam.maxAttempts} lần) cho bài kiểm tra này!`
          });
        }
      }
    }

    const examTitle = exam ? exam.title : 'Bài kiểm tra thường xuyên';
    const subject = exam ? exam.subject : 'lich-su';
    const grade = exam ? exam.grade : 6;
    const maxScore = exam ? exam.scoreScale : 10;

    // Calculate score & cognitive breakdown based on exam questions
    let correctCount = 0;
    const answersMap: { [qId: string]: any } = {};
    if (Array.isArray(answers)) {
      answers.forEach(a => {
        if (a && a.questionId) answersMap[a.questionId] = a;
      });
    }

    const breakdown = {
      biet: { total: 0, correct: 0, percentage: 0 },
      hieu: { total: 0, correct: 0, percentage: 0 },
      vanDung: { total: 0, correct: 0, percentage: 0 }
    };

    const examQuestions = exam
      ? exam.questionIds.map(id => currentStore.questions.find(q => q.id === id)).filter(Boolean)
      : [];

    const totalQuestions = examQuestions.length > 0 ? examQuestions.length : (Array.isArray(answers) ? answers.length : 1);

    examQuestions.forEach(q => {
      if (!q) return;
      const cog = q.cognitiveLevel === 'biet' ? 'biet' : q.cognitiveLevel === 'hieu' ? 'hieu' : 'vanDung';
      breakdown[cog].total += 1;

      const ans = answersMap[q.id];
      if (!ans) return;

      let isCorrect = false;
      if (q.type === 'multiple-choice') {
        const correctAnswers = q.correctAnswers || [0];
        const studentSelected = ans.selectedOptionIndices || [];
        if (
          correctAnswers.length === studentSelected.length &&
          correctAnswers.every((c: number) => studentSelected.includes(c))
        ) {
          isCorrect = true;
        }
      } else if (q.type === 'true-false') {
        const stmts = q.statements || [];
        const studentTf = ans.trueFalseAnswers || [];
        if (stmts.length > 0 && stmts.every((s: any, idx: number) => s.isCorrect === studentTf[idx])) {
          isCorrect = true;
        }
      } else if (q.type === 'matching') {
        const pairs = q.matchingPairs || [];
        const studentMatch = ans.matchingAnswers || {};
        if (pairs.length > 0 && pairs.every((_: any, idx: number) => studentMatch[idx] === idx)) {
          isCorrect = true;
        }
      } else if (q.type === 'short-answer' || q.type === 'fill-in-blank') {
        const acceptable = q.acceptableAnswers || [];
        const text = String(ans.textAnswer || '').trim().toLowerCase();
        if (acceptable.some((acc: string) => acc.trim().toLowerCase() === text)) {
          isCorrect = true;
        }
      } else if (q.type === 'essay') {
        // Essay is graded by teacher or awarded baseline for effort
        if (ans.textAnswer && ans.textAnswer.trim().length > 10) {
          isCorrect = true;
        }
      }

      if (isCorrect) {
        correctCount += 1;
        breakdown[cog].correct += 1;
      }
    });

    // Compute percentages
    const percentage = Math.round((correctCount / (totalQuestions || 1)) * 100);
    const score = Number(((correctCount / (totalQuestions || 1)) * maxScore).toFixed(1));

    (['biet', 'hieu', 'vanDung'] as const).forEach(key => {
      breakdown[key].percentage = breakdown[key].total > 0
        ? Math.round((breakdown[key].correct / breakdown[key].total) * 100)
        : 0;
    });

    const submission = {
      id: `sub-${Date.now()}`,
      examId,
      examTitle,
      subject,
      grade,
      studentId: studentId || `std-${studentCode}`,
      studentCode,
      studentName: studentName || 'Học sinh',
      classCode: classCode || '6A1',
      startedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      submittedAt: new Date().toISOString(),
      durationSeconds: 900,
      score,
      maxScore,
      percentage,
      correctCount,
      totalQuestions,
      answers: answers || [],
      breakdown
    };

    // Add or replace submission
    const existingIndex = currentStore.submissions.findIndex(
      s => s.examId === submission.examId && s.studentCode === submission.studentCode && s.classCode === submission.classCode
    );

    if (existingIndex >= 0) {
      currentStore.submissions[existingIndex] = submission;
    } else {
      currentStore.submissions.push(submission);
    }

    saveStoreData(currentStore);
    res.json({ success: true, submission });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Helper to safely extract and prepare uploaded files for Gemini Multimodal API
interface ProcessedFiles {
  parts: Array<{ inlineData: { data: string; mimeType: string } }>;
  extractedTexts: string[];
  fileDescriptions: string[];
}

function processUploadedFiles(files: any[]): ProcessedFiles {
  const parts: Array<{ inlineData: { data: string; mimeType: string } }> = [];
  const extractedTexts: string[] = [];
  const fileDescriptions: string[] = [];

  if (!Array.isArray(files) || files.length === 0) {
    return { parts, extractedTexts, fileDescriptions };
  }

  for (const f of files) {
    if (!f || !f.base64) continue;
    const fileName = (f.name || 'tai_lieu').trim();
    const rawBase64 = String(f.base64).replace(/^data:[^;]+;base64,/, '').trim();
    if (!rawBase64) continue;

    let mime = (f.mimeType || '').toLowerCase().trim();
    const lowerName = fileName.toLowerCase();

    // Auto-detect MIME type accurately
    if (!mime || mime === 'application/octet-stream' || mime === 'application/x-download' || mime === 'binary/octet-stream') {
      if (lowerName.endsWith('.pdf')) mime = 'application/pdf';
      else if (lowerName.endsWith('.png')) mime = 'image/png';
      else if (lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg')) mime = 'image/jpeg';
      else if (lowerName.endsWith('.webp')) mime = 'image/webp';
      else if (lowerName.endsWith('.gif')) mime = 'image/gif';
      else if (lowerName.endsWith('.txt') || lowerName.endsWith('.md')) mime = 'text/plain';
      else if (lowerName.endsWith('.doc') || lowerName.endsWith('.docx')) mime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    }

    // Inspect magic base64 headers
    if (rawBase64.startsWith('JVBERi')) {
      mime = 'application/pdf';
    } else if (rawBase64.startsWith('iVBORw0KGgo')) {
      mime = 'image/png';
    } else if (rawBase64.startsWith('/9j/')) {
      mime = 'image/jpeg';
    }

    if (mime === 'application/pdf') {
      // PDF file: Send inlineData directly so Gemini multimodal processes layout, tables, diagrams and text
      parts.push({
        inlineData: {
          data: rawBase64,
          mimeType: 'application/pdf',
        },
      });
      fileDescriptions.push(`Tệp PDF SGK/Giáo án: "${fileName}" (đã gửi trực tiếp inlineData đến Gemini)`);
    } else if (mime.startsWith('image/')) {
      // Image file: Send inlineData directly
      parts.push({
        inlineData: {
          data: rawBase64,
          mimeType: mime,
        },
      });
      fileDescriptions.push(`Ảnh tư liệu/trang sách: "${fileName}" (đã gửi trực tiếp inlineData)`);
    } else {
      // Plain text or markdown
      try {
        const decoded = Buffer.from(rawBase64, 'base64').toString('utf-8');
        if (decoded && !/[\x00-\x08\x0E-\x1F]/.test(decoded.slice(0, 500))) {
          extractedTexts.push(`--- NỘI DUNG TÀI LIỆU ("${fileName}") ---\n${decoded.slice(0, 40000)}`);
          fileDescriptions.push(`Tài liệu văn bản: "${fileName}" (${decoded.length} ký tự trích xuất)`);
        } else {
          if (lowerName.endsWith('.pdf')) {
            parts.push({
              inlineData: {
                data: rawBase64,
                mimeType: 'application/pdf',
              },
            });
            fileDescriptions.push(`Tệp PDF: "${fileName}"`);
          }
        }
      } catch (e) {
        console.warn('Cannot decode file attachment text', e);
      }
    }
  }

  return { parts, extractedTexts, fileDescriptions };
}

// 4. Gemini Multimodal Document Extraction & Theory Summarization
app.post('/api/gemini/extract-and-summarize', async (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  try {
    const body = req.body || {};
    const { subject = 'lich-su', grade = 6, lessonTitle = '', textContent = '', files = [] } = body;
    const ai = getAI();

    const { parts, extractedTexts, fileDescriptions } = processUploadedFiles(files);
    const hasDocuments = fileDescriptions.length > 0 || extractedTexts.length > 0 || Boolean(textContent);

    let docNotice = '';
    if (hasDocuments) {
      docNotice = `
======================================================================
CHỈ THỊ QUAN TRỌNG VỀ TÀI LIỆU ĐÍNH KÈM (BẮT BUỘC TUÂN THỦ 100%):
- Người dùng đã tải lên các tài liệu học tập sau:
${fileDescriptions.map((d) => `  * ${d}`).join('\n') || '  * Văn bản đính kèm'}
- QUY TẮC BẮT BUỘC: Bạn PHẢI đọc kỹ nội dung tài liệu đính kèm (các trang PDF inlineData / văn bản trích xuất).
- Mọi nội dung tóm tắt (summary), các ý kiến thức cốt lõi (keyPoints), các sự kiện mốc thời gian / số liệu / đặc điểm (timelineOrFacts) PHẢI ĐƯỢC TRÍCH XUẤT TRỰC TIẾP từ tài liệu được cung cấp.
- TUYỆT ĐỐI KHÔNG dùng kiến thức chung chung khái quát ngoài tài liệu nếu tài liệu đã có nội dung cụ thể.
======================================================================
`;
    }

    const promptText = `Bạn là chuyên gia giáo dục THCS chuyên môn ${subject === 'lich-su' ? 'Lịch sử' : 'Địa lí'} lớp ${grade} của Việt Nam theo chương trình Giáo dục Phổ thông 2018 (SGK Kết nối tri thức, Chân trời sáng tạo, Cánh Diều).
Hãy phân tích tài liệu/văn bản được cung cấp và trích xuất/tóm tắt nội dung ôn tập lý thuyết chuẩn mực cho bài học: "${lessonTitle || 'Bài học theo tài liệu'}".
${docNotice}
Yêu cầu tóm tắt gồm:
1. title: Tên chuẩn của bài học theo tài liệu (ví dụ: "Bài 1: ...")
2. summary: Tóm tắt ngắn gọn khái quát nội dung trọng tâm bài học (khoảng 3-5 câu), bám sát nội dung tài liệu.
3. keyPoints: Danh sách 4-7 ý kiến thức cốt lõi, cô đọng, dễ nhớ cho học sinh THCS lấy trực tiếp từ bài học.
4. timelineOrFacts: Danh sách 3-5 sự kiện mốc thời gian (với Lịch sử) hoặc quy luật/số liệu/đặc điểm địa lí nổi bật (với Địa lí), mỗi mục gồm { title, content } trích xuất chuẩn xác từ tài liệu.

Nội dung văn bản trực tiếp (nếu có):
${textContent || '(Tài liệu chi tiết nằm trong file đính kèm inlineData)'}
`;

    if (!ai) {
      // Offline fallback extracting from available text or intelligent template
      const fallbackSummary = textContent
        ? `Tóm tắt trích xuất: ${textContent.slice(0, 300)}...`
        : `Tóm tắt nội dung trọng tâm bài học "${lessonTitle || 'Lịch sử - Địa lí'}" lớp ${grade}. Học sinh cần nắm vững các sự kiện, nguyên nhân, diễn biến và ý nghĩa cơ bản (hoặc các đặc điểm vị trí, địa hình, khí hậu theo chương trình GDPT 2018).`;

      return res.json({
        success: true,
        data: {
          title: lessonTitle || `Bài học ${subject === 'lich-su' ? 'Lịch sử' : 'Địa lí'} lớp ${grade}`,
          summary: fallbackSummary,
          keyPoints: [
            `Kiến thức trọng tâm 1 bài học "${lessonTitle || 'Lịch sử - Địa lí'}": Xác định rõ mốc thời gian hoặc vị trí địa lí quan trọng.`,
            'Kiến thức trọng tâm 2: Phân tích được nguyên nhân cốt lõi và mối liên hệ thực tế.',
            'Kiến thức trọng tâm 3: Hiểu được tác động đối với đời sống con người và sự phát triển xã hội.',
            'Kiến thức trọng tâm 4: Rút ra bài học lịch sử hoặc giải pháp bảo vệ môi trường, phát triển bền vững.'
          ],
          timelineOrFacts: [
            { title: 'Sự kiện / Đặc điểm 1', content: 'Chi tiết quan trọng được trích xuất từ tài liệu SGK.' },
            { title: 'Sự kiện / Đặc điểm 2', content: 'Hiện tượng hoặc kết quả mang tính bước ngoặt.' },
            { title: 'Sự kiện / Đặc điểm 3', content: 'Ý nghĩa lịch sử hoặc giá trị kinh tế - xã hội to lớn.' }
          ]
        },
        warning: 'Đang dùng bộ tóm tắt dự phòng do chưa cấu hình GEMINI_API_KEY.'
      });
    }

    const contents: any[] = [];
    for (const part of parts) {
      contents.push(part);
    }
    let fullPrompt = promptText;
    if (extractedTexts.length > 0) {
      fullPrompt = `${extractedTexts.join('\n\n')}\n\n${fullPrompt}`;
    }
    contents.push({ text: fullPrompt });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: contents,
      config: {
        temperature: 0.2, // Low temperature for faithful factual extraction
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            summary: { type: Type.STRING },
            keyPoints: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            timelineOrFacts: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  content: { type: Type.STRING }
                },
                required: ['title', 'content']
              }
            }
          },
          required: ['title', 'summary', 'keyPoints']
        }
      }
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');
    return res.json({ success: true, data: parsed });
  } catch (err: any) {
    console.error('Gemini extract error:', err);
    return res.status(500).json({ success: false, error: err.message || 'Lỗi xử lý trích xuất văn bản với Gemini AI' });
  }
});

// 5. Gemini AI Question Generator (Diverse question types, Cognitive levels: Biết, Hiểu, Vận dụng, 5-30 questions)
app.post('/api/gemini/generate-questions', async (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  try {
    const body = req.body || {};
    const {
      subject = 'lich-su',
      grade = 6,
      lessonTitle = '',
      lessonTheory = '',
      count = 10,
      ratios = { biet: 40, hieu: 40, vanDung: 20 },
      questionTypes = ['multiple-choice', 'true-false', 'matching', 'short-answer', 'fill-in-blank'],
      customPrompt = '',
      files = [],
      previousQuestions = []
    } = body;

    const validCount = Math.max(5, Math.min(30, Number(count) || 10));
    const ai = getAI();

    const { parts, extractedTexts, fileDescriptions } = processUploadedFiles(files);
    const hasDocuments = fileDescriptions.length > 0 || extractedTexts.length > 0;

    // Document instruction block
    let documentInstruction = '';
    if (hasDocuments) {
      documentInstruction = `
======================================================================
CẢNH BÁO QUAN TRỌNG VỀ TÀI LIỆU ĐÍNH KÈM (BẮT BUỘC TUÂN THỦ 100%):
- Giáo viên đã đính kèm ${fileDescriptions.length} tệp tài liệu:
${fileDescriptions.map((d) => `  * ${d}`).join('\n')}
- NGUYÊN TẮC CỐT LÕI:
  1. BẮT BUỘC PHẢI DỰA SÁT VÀO NỘI DUNG TÀI LIỆU ĐƯỢC CUNG CẤP (các trang PDF inlineData / văn bản đính kèm).
  2. Mọi câu hỏi, dữ liệu, số liệu, mốc thời gian, tên nhân vật, địa danh, định nghĩa, thuật ngữ, chi tiết sự kiện, phương án đúng và phương án gây nhiễu PHẢI LẤY TRỰC TIẾP từ tài liệu tải lên.
  3. TUYỆT ĐỐI KHÔNG dùng kiến thức chung ngoài tài liệu nếu tài liệu đã có thông tin liên quan hoặc sinh câu hỏi khái quát bâng quơ không gắn liền với tài liệu.
  4. Trích dẫn rõ các tình huống, đoạn trích, bảng số liệu hoặc sơ đồ có trong tài liệu khi đặt câu hỏi.
======================================================================
`;
    }

    // Diversity & non-repetition block
    let diversityInstruction = `
======================================================================
YÊU CẦU ĐA DẠNG HÓA VÀ TRÁNH LẶP LẠI (TẠO MỚI HOÀN TOÀN):
- Tạo các câu hỏi MỚI, ĐA DẠNG, khai thác nhiều khía cạnh/nội dung, chi tiết khác nhau trong bài học/tài liệu (từ mở đầu, hoàn cảnh, nguyên nhân, diễn biến, kết quả, số liệu, ý nghĩa, bản đồ đến bài học thực tiễn).
- Tránh lặp lại cấu trúc ngữ pháp đơn điệu hoặc nội dung của các câu hỏi phổ biến/hiển nhiên.
`;

    if (Array.isArray(previousQuestions) && previousQuestions.length > 0) {
      diversityInstruction += `
- DANH SÁCH CÁC CÂU HỎI ĐÃ CÓ / CẦN TRÁNH TRÙNG LẶP (TUYỆT ĐỐI KHÔNG ĐƯỢC LẶP LẠI HOẶC TƯƠNG TỰ):
${previousQuestions.slice(-25).map((q: string, idx: number) => `  [Đã có ${idx + 1}] ${q}`).join('\n')}
- BẮT BUỘC tạo các câu hỏi HOÀN TOÀN MỚI, khai thác các chi tiết, sự kiện, góc nhìn khác hẳn với danh sách trên.
`;
    }
    diversityInstruction += `======================================================================\n`;

    const promptText = `Bạn là chuyên gia khảo thí và biên soạn đề thi môn ${subject === 'lich-su' ? 'Lịch sử' : 'Địa lí'} THCS lớp ${grade} của Bộ Giáo dục và Đào tạo Việt Nam.
Hãy tạo chính xác ${validCount} câu hỏi ôn tập và kiểm tra chất lượng cao cho bài học: "${lessonTitle || 'Chương trình THCS'}".
${documentInstruction}
${diversityInstruction}
YÊU CẦU BẮT BUỘC:
1. Phân loại chuẩn xác theo 3 mức độ nhận thức:
   - "biet" (Nhận biết): Nhớ sự kiện, mốc thời gian, định nghĩa, số liệu, vị trí địa lí cơ bản nêu trong tài liệu.
   - "hieu" (Thông hiểu): Giải thích nguyên nhân, so sánh, phân tích đặc điểm, rút ra kết luận dựa vào tài liệu.
   - "van-dung" (Vận dụng): Liên hệ thực tiễn Việt Nam hoặc địa phương, xử lý tình huống, bài học kinh nghiệm từ nội dung bài học.
   Tỉ lệ phân bổ mục tiêu: ~${ratios.biet || 40}% Biết, ~${ratios.hieu || 40}% Hiểu, ~${ratios.vanDung || 20}% Vận dụng.

2. Đa dạng hóa các dạng câu hỏi từ danh sách cho phép [${questionTypes.join(', ')}]:
   - multiple-choice: Trắc nghiệm 4 phương án rõ ràng (A, B, C, D), chỉ rõ mảng correctAnswers (chỉ số 0-3).
   - true-false: Đưa ra 3-4 nhận định, mỗi nhận định xác định rõ statement và isCorrect (true/false).
   - matching: Nối cột A (left) với cột B (right), 3-4 cặp chính xác (sự kiện - thời gian, nhân vật - công lao, địa danh - đặc điểm).
   - short-answer: Câu hỏi yêu cầu học sinh điền từ ngữ hoặc số liệu ngắn gọn, cung cấp acceptableAnswers.
   - fill-in-blank: Đoạn văn hoặc câu có từ khuyết trong ngoặc vuông [từ_khóa], cung cấp acceptableAnswers.
   - essay: Câu hỏi tự luận kích thích tư duy, kèm essayGuide chi tiết biểu điểm gợi ý chấm.

3. Kèm explanation giải thích đáp án ngắn gọn, sư phạm cho từng câu (nêu rõ căn cứ từ nội dung bài học/tài liệu).
${customPrompt ? `Yêu cầu thêm từ giáo viên: ${customPrompt}` : ''}
${lessonTheory ? `Kiến thức nền tảng:\n${typeof lessonTheory === 'string' ? lessonTheory : JSON.stringify(lessonTheory)}` : ''}
`;

    if (!ai) {
      // Dynamic fallback generator
      const fallbackQuestions = generateFallbackQuestions(
        subject,
        grade,
        lessonTitle,
        validCount,
        ratios,
        lessonTheory,
        previousQuestions,
        extractedTexts
      );
      return res.json({
        success: true,
        questions: fallbackQuestions,
        warning: 'Đang dùng bộ sinh câu hỏi thông minh nội bộ do chưa cấu hình GEMINI_API_KEY. Vui lòng cấu hình GEMINI_API_KEY để kích hoạt Gemini 3.8 Flash đọc file PDF.'
      });
    }

    const contents: any[] = [];
    for (const part of parts) {
      contents.push(part);
    }
    let fullPrompt = promptText;
    if (extractedTexts.length > 0) {
      fullPrompt = `${extractedTexts.join('\n\n')}\n\n${fullPrompt}`;
    }
    contents.push({ text: fullPrompt });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: contents,
      config: {
        temperature: 0.85, // Higher temperature for rich diversity and creativity
        topP: 0.95,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              type: {
                type: Type.STRING,
                description: 'one of: multiple-choice, true-false, matching, short-answer, fill-in-blank, essay'
              },
              cognitiveLevel: {
                type: Type.STRING,
                description: 'one of: biet, hieu, van-dung'
              },
              questionText: { type: Type.STRING },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              correctAnswers: {
                type: Type.ARRAY,
                items: { type: Type.INTEGER }
              },
              statements: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    statement: { type: Type.STRING },
                    isCorrect: { type: Type.BOOLEAN }
                  },
                  required: ['statement', 'isCorrect']
                }
              },
              matchingPairs: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    left: { type: Type.STRING },
                    right: { type: Type.STRING }
                  },
                  required: ['left', 'right']
                }
              },
              acceptableAnswers: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              essayGuide: { type: Type.STRING },
              explanation: { type: Type.STRING }
            },
            required: ['type', 'cognitiveLevel', 'questionText']
          }
        }
      }
    });

    const parsed = JSON.parse(response.text?.trim() || '[]');
    const formatted = parsed.map((q: any, idx: number) => ({
      ...q,
      id: `ai-q-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 7)}`,
      subject,
      grade,
      lessonId: body.lessonId || 'custom',
      lessonName: lessonTitle || `Bài học môn ${subject === 'lich-su' ? 'Lịch sử' : 'Địa lí'}`,
      createdAt: new Date().toISOString()
    }));

    return res.json({ success: true, questions: formatted });
  } catch (err: any) {
    console.error('Gemini generate questions error:', err);
    const body = req.body || {};
    const validCount = Math.max(5, Math.min(30, Number(body.count) || 10));
    const fallbackQuestions = generateFallbackQuestions(
      body.subject || 'lich-su',
      body.grade || 6,
      body.lessonTitle || '',
      validCount,
      body.ratios || {},
      body.lessonTheory,
      body.previousQuestions
    );
    return res.json({ success: true, questions: fallbackQuestions, warning: err.message });
  }
});

// 6. Gemini AI Exam & Matrix Generator ("AI Biên soạn" đề thi theo ma trận chuẩn Bộ GD&ĐT)
app.post('/api/gemini/generate-exam-matrix', async (req, res) => {
  try {
    const body = req.body || {};
    const {
      subject = 'lich-su',
      grade = 6,
      examTitle = '',
      durationMinutes = 45,
      scoreScale = 10,
      questionCount = 10,
      ratios = { biet: 40, hieu: 40, vanDung: 20 },
      questionTypes = ['multiple-choice', 'true-false', 'matching', 'short-answer'],
      customRequirements = ''
    } = body;

    const validCount = Math.max(5, Math.min(30, Number(questionCount) || 10));
    const bietCount = Math.round(((ratios.biet || 40) / 100) * validCount);
    const hieuCount = Math.round(((ratios.hieu || 40) / 100) * validCount);
    const vanDungCount = Math.max(1, validCount - bietCount - hieuCount);

    const matrix = {
      bietCount,
      hieuCount,
      vanDungCount,
      totalQuestions: validCount,
      scoreScale,
      durationMinutes,
      bietScore: Number((((ratios.biet || 40) / 100) * scoreScale).toFixed(1)),
      hieuScore: Number((((ratios.hieu || 40) / 100) * scoreScale).toFixed(1)),
      vanDungScore: Number((((ratios.vanDung || 20) / 100) * scoreScale).toFixed(1)),
      description: `Ma trận đề kiểm tra môn ${subject === 'lich-su' ? 'Lịch sử' : 'Địa lí'} lớp ${grade}, thời gian ${durationMinutes} phút theo định hướng GDPT 2018 (${ratios.biet || 40}% Nhận biết, ${ratios.hieu || 40}% Thông hiểu, ${ratios.vanDung || 20}% Vận dụng).`
    };

    const ai = getAI();
    let generatedQuestions: any[] = [];

    if (!ai) {
      generatedQuestions = generateFallbackQuestions(subject, grade, examTitle || `Kiểm tra ${subject === 'lich-su' ? 'Lịch sử' : 'Địa lí'} lớp ${grade}`, validCount, ratios);
    } else {
      try {
        const promptText = `Bạn là chuyên gia khảo thí và biên soạn đề kiểm tra môn ${subject === 'lich-su' ? 'Lịch sử' : 'Địa lí'} THCS lớp ${grade} của Bộ Giáo dục và Đào tạo Việt Nam.
Hãy biên soạn một đề kiểm tra hoàn chỉnh gồm ${validCount} câu hỏi chuẩn ma trận:
- Tiêu đề đề kiểm tra: "${examTitle || `Kiểm tra môn ${subject === 'lich-su' ? 'Lịch sử' : 'Địa lí'} lớp ${grade}`}"
- Thời lượng: ${durationMinutes} phút. Thang điểm: ${scoreScale}.
- Ma trận nhận thức:
  + ${bietCount} câu Nhận biết (mốc thời gian, vị trí, sự kiện SGK).
  + ${hieuCount} câu Thông hiểu (nguyên nhân, so sánh, quy luật).
  + ${vanDungCount} câu Vận dụng (liên hệ thực tiễn Việt Nam, bài học kinh nghiệm).
- Các dạng câu hỏi: [${questionTypes.join(', ')}].
${customRequirements ? `Yêu cầu thêm từ giáo viên: ${customRequirements}` : ''}
`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: promptText,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING },
                  cognitiveLevel: { type: Type.STRING },
                  questionText: { type: Type.STRING },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  },
                  correctAnswers: {
                    type: Type.ARRAY,
                    items: { type: Type.INTEGER }
                  },
                  statements: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        statement: { type: Type.STRING },
                        isCorrect: { type: Type.BOOLEAN }
                      },
                      required: ['statement', 'isCorrect']
                    }
                  },
                  matchingPairs: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        left: { type: Type.STRING },
                        right: { type: Type.STRING }
                      },
                      required: ['left', 'right']
                    }
                  },
                  acceptableAnswers: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  },
                  essayGuide: { type: Type.STRING },
                  explanation: { type: Type.STRING }
                },
                required: ['type', 'cognitiveLevel', 'questionText']
              }
            }
          }
        });

        const parsed = JSON.parse(response.text?.trim() || '[]');
        generatedQuestions = parsed.map((q: any, idx: number) => ({
          ...q,
          id: `ai-exam-q-${Date.now()}-${idx}`,
          subject,
          grade,
          lessonId: 'exam-matrix',
          lessonName: examTitle || `Đề kiểm tra ${subject === 'lich-su' ? 'Lịch sử' : 'Địa lí'}`,
          createdAt: new Date().toISOString()
        }));
      } catch (geminiErr: any) {
        console.warn('Gemini exam matrix fallback triggered:', geminiErr);
        generatedQuestions = generateFallbackQuestions(subject, grade, examTitle || `Kiểm tra ${subject === 'lich-su' ? 'Lịch sử' : 'Địa lí'} lớp ${grade}`, validCount, ratios);
      }
    }

    return res.json({
      success: true,
      matrix,
      questions: generatedQuestions
    });
  } catch (err: any) {
    console.error('Exam matrix error:', err);
    return res.status(500).json({ success: false, error: err.message || 'Lỗi biên soạn ma trận đề kiểm tra' });
  }
});

// Helper for generating diverse fallback questions when API key is unavailable or fails
function generateFallbackQuestions(
  subject: string,
  grade: number,
  lessonTitle: string,
  count: number,
  ratios: any,
  lessonTheory?: any,
  previousQuestions: string[] = [],
  extractedTexts: string[] = []
) {
  const result: any[] = [];
  const bietCount = Math.round(((ratios.biet || 40) / 100) * count);
  const hieuCount = Math.round(((ratios.hieu || 40) / 100) * count);
  const vanDungCount = Math.max(1, count - bietCount - hieuCount);

  const isHistory = subject === 'lich-su';
  const prevSet = new Set((previousQuestions || []).map((q) => q.trim().toLowerCase()));

  // Extract knowledge points from current lesson in store or passed theory
  const foundLesson = (currentStore.lessons || []).find(
    (l: any) => l.subject === subject && Number(l.grade) === Number(grade) && (l.title === lessonTitle || lessonTitle.includes(l.title))
  );

  const activeTheory = foundLesson?.theory || (typeof lessonTheory === 'object' ? lessonTheory : null);
  const keyPoints: string[] = activeTheory?.keyPoints || [
    'Xác định rõ mốc thời gian, không gian địa lí và bối cảnh lịch sử diễn ra.',
    'Phân tích được nguyên nhân trực tiếp và sâu xa dẫn đến sự chuyển biến.',
    'Nắm vững diễn biến chính, các sự kiện tiêu biểu và ý nghĩa quan trọng.',
    'Rút ra bài học kinh nghiệm, giải pháp phát triển bền vững hoặc liên hệ thực tế.',
  ];

  const facts: Array<{ title: string; content: string }> = activeTheory?.timelineOrFacts || [
    { title: 'Sự kiện / Đặc điểm mốc', content: 'Chi tiết quan trọng bám sát nội dung chương trình GDPT 2018.' },
    { title: 'Tác động / Kết quả', content: 'Tạo nên bước ngoặt lớn về mặt kinh tế, chính trị hoặc văn hóa - xã hội.' },
    { title: 'Giá trị / Ý nghĩa', content: 'Để lại di sản và bài học sâu sắc cho các thế hệ mai sau.' },
  ];

  let qIndex = 1;
  const usedTexts = new Set<string>();

  const isUnique = (text: string) => {
    const clean = text.trim().toLowerCase();
    if (prevSet.has(clean) || usedTexts.has(clean)) return false;
    usedTexts.add(clean);
    return true;
  };

  // Helper shuffle array
  const shuffle = <T>(array: T[]): T[] => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  // 1. Generate "Biết" questions
  for (let i = 0; i < bietCount; i++) {
    const pt = keyPoints[i % keyPoints.length];
    const fact = facts[i % facts.length];

    if (i % 3 === 0) {
      const qText = isHistory
        ? `[Nhận biết] Theo nội dung bài học "${lessonTitle}", sự kiện nào sau đây là đặc điểm nổi bật gắn liền với "${fact.title}"?`
        : `[Nhận biết] Trong bài học "${lessonTitle}", yếu tố địa lí tự nhiên nào sau đây đóng vai trò nền tảng gắn liền với "${fact.title}"?`;

      if (isUnique(qText) || i >= bietCount - 1) {
        const correct = fact.content;
        const distractors = [
          isHistory ? 'Diễn ra vào thời kì hiện đại với quy mô toàn cầu' : 'Thuộc đới khí hậu băng giá quanh năm không có cư dân sinh sống',
          isHistory ? 'Chỉ diễn ra trong phạm vi một làng xã nhỏ không gây ảnh hưởng' : 'Địa hình hoàn toàn là hoang mạc cát nóng không có sông ngòi',
          isHistory ? 'Là chính sách áp đặt từ thời kì thực dân phương Tây thế kỉ XIX' : 'Khu vực có lượng mưa trung bình dưới 50mm/năm quanh năm khô hạn'
        ];
        const allOpts = shuffle([correct, ...distractors]);
        const correctIdx = allOpts.indexOf(correct);

        result.push({
          id: `gen-q-${Date.now()}-${qIndex++}`,
          subject,
          grade,
          lessonName: lessonTitle || `Bài ôn tập ${grade}`,
          type: 'multiple-choice',
          cognitiveLevel: 'biet',
          questionText: qText,
          options: allOpts,
          correctAnswers: [correctIdx],
          explanation: `Kiến thức nhận biết trong SGK: ${fact.title} - ${fact.content}.`,
          createdAt: new Date().toISOString()
        });
      }
    } else if (i % 3 === 1) {
      const qText = `[Nhận biết] Đánh giá tính Đúng/Sai của các nhận định dưới đây liên quan đến bài học "${lessonTitle}":`;
      if (isUnique(qText) || i >= bietCount - 1) {
        result.push({
          id: `gen-q-${Date.now()}-${qIndex++}`,
          subject,
          grade,
          lessonName: lessonTitle || `Bài ôn tập ${grade}`,
          type: 'true-false',
          cognitiveLevel: 'biet',
          questionText: qText,
          statements: [
            { statement: `Nội dung cốt lõi: ${pt}`, isCorrect: true },
            { statement: `Chi tiết tiêu biểu: ${fact.content}`, isCorrect: true },
            { statement: isHistory ? 'Sự kiện này hoàn toàn không có ý nghĩa gì đối với tiến trình phát triển.' : 'Khu vực này hoàn toàn không chịu tác động của quy luật tự nhiên.', isCorrect: false },
            { statement: isHistory ? 'Đây là cuộc vận động chính trị diễn ra vào cuối thế kỉ XX.' : 'Đặc điểm này xuất hiện ở mọi vùng lãnh thổ trên thế giới mà không có sự phân hóa.', isCorrect: false }
          ],
          explanation: 'Học sinh nhận biết chính xác thông tin cơ bản được ghi nhận trong sách giáo khoa.',
          createdAt: new Date().toISOString()
        });
      }
    } else {
      const qText = isHistory
        ? `[Nhận biết] Điền cụm từ còn thiếu vào nhận định sau: "Trong bài học ${lessonTitle}, mốc sự kiện quan trọng nhất là [${fact.title}] gắn với ý nghĩa lịch sử to lớn."`
        : `[Nhận biết] Điền từ còn thiếu vào nhận định sau: "Đặc điểm nổi bật trong bài học ${lessonTitle} là [${fact.title}] tạo nên cảnh quan đặc thù."`;

      result.push({
        id: `gen-q-${Date.now()}-${qIndex++}`,
        subject,
        grade,
        lessonName: lessonTitle || `Bài ôn tập ${grade}`,
        type: 'fill-in-blank',
        cognitiveLevel: 'biet',
        questionText: qText,
        acceptableAnswers: [fact.title.toLowerCase(), fact.title],
        explanation: `Từ khóa nhận biết chính xác là: "${fact.title}".`,
        createdAt: new Date().toISOString()
      });
    }
  }

  // 2. Generate "Hiểu" questions
  for (let i = 0; i < hieuCount; i++) {
    const pt = keyPoints[(i + 1) % keyPoints.length];
    const fact = facts[(i + 1) % facts.length];

    if (i % 2 === 0) {
      const qText = isHistory
        ? `[Thông hiểu] Hãy nối nội dung ở cột A (Sự kiện / Hiện tượng) với cột B (Nguyên nhân / Ý nghĩa) theo bài học "${lessonTitle}":`
        : `[Thông hiểu] Hãy nối khu vực / yếu tố ở cột A với đặc điểm tương ứng ở cột B theo bài học "${lessonTitle}":`;

      result.push({
        id: `gen-q-${Date.now()}-${qIndex++}`,
        subject,
        grade,
        lessonName: lessonTitle || `Bài ôn tập ${grade}`,
        type: 'matching',
        cognitiveLevel: 'hieu',
        questionText: qText,
        matchingPairs: [
          { left: fact.title, right: fact.content },
          { left: isHistory ? 'Nguyên nhân bùng nổ' : 'Nhân tố chi phối', right: pt },
          { left: isHistory ? 'Bài học rút ra' : 'Tác động môi trường', right: isHistory ? 'Khẳng định sức mạnh khối đại đoàn kết' : 'Ảnh hưởng sâu sắc đến sinh kế dân cư' }
        ],
        explanation: 'Thông hiểu mối liên hệ bản chất và mối quan hệ nhân quả trong bài học.',
        createdAt: new Date().toISOString()
      });
    } else {
      const qText = isHistory
        ? `[Thông hiểu] Tại sao sự kiện trong bài học "${lessonTitle}" lại được đánh giá là một bước ngoặt quan trọng?`
        : `[Thông hiểu] Giải thích vì sao đặc điểm tự nhiên trong bài học "${lessonTitle}" lại có sự phân hóa rõ rệt?`;

      const correct = `Bởi vì nội dung này làm thay đổi bản chất: ${pt.slice(0, 100)}.`;
      const distractors = [
        'Bởi vì nó diễn ra hoàn toàn tình cờ mà không chịu sự chi phối của bất kì quy luật nào.',
        'Vì nó chỉ tồn tại trong thời gian rất ngắn dưới một tháng rồi hoàn toàn biến mất.',
        'Vì không có bất kì mối quan hệ nào với điều kiện kinh tế - xã hội xung quanh.'
      ];
      const allOpts = shuffle([correct, ...distractors]);

      result.push({
        id: `gen-q-${Date.now()}-${qIndex++}`,
        subject,
        grade,
        lessonName: lessonTitle || `Bài ôn tập ${grade}`,
        type: 'multiple-choice',
        cognitiveLevel: 'hieu',
        questionText: qText,
        options: allOpts,
        correctAnswers: [allOpts.indexOf(correct)],
        explanation: 'Học sinh giải thích được nguyên nhân và bản chất vấn đề thay vì chỉ ghi nhớ máy móc.',
        createdAt: new Date().toISOString()
      });
    }
  }

  // 3. Generate "Vận dụng" questions
  for (let i = 0; i < vanDungCount; i++) {
    const pt = keyPoints[(i + 2) % keyPoints.length];

    if (i % 2 === 0) {
      const qText = isHistory
        ? `[Vận dụng] Từ bài học lịch sử "${lessonTitle}", bài học kinh nghiệm nào có thể vận dụng vào công cuộc xây dựng và bảo vệ Tổ quốc ngày nay?`
        : `[Vận dụng] Vận dụng kiến thức bài học "${lessonTitle}", giải pháp nào là thiết thực nhất để bảo vệ môi trường và ứng phó biến đổi khí hậu?`;

      const correct = isHistory
        ? 'Phát huy tinh thần yêu nước, khối đại đoàn kết toàn dân và không ngừng đổi mới sáng tạo'
        : 'Sử dụng hợp lí tài nguyên, tích cực trồng rừng và nâng cao ý thức phân loại rác thải tại nguồn';
      const distractors = [
        isHistory ? 'Chỉ trông chờ vào sự viện trợ từ bên ngoài mà không tự lực cánh sinh' : 'Khai thác tối đa mọi nguồn tài nguyên thiên nhiên trong thời gian ngắn nhất',
        isHistory ? 'Xem nhẹ việc học tập và rèn luyện đạo đức của thế hệ trẻ' : 'Không cần quan tâm đến biến đổi khí hậu vì đó là việc của tương lai',
        isHistory ? 'Áp dụng nguyên xi mô hình cũ mà không có sự chọn lọc phù hợp thực tế' : 'Đốt phá rừng làm nương rẫy để mở rộng diện tích sản xuất nhanh chóng'
      ];
      const allOpts = shuffle([correct, ...distractors]);

      result.push({
        id: `gen-q-${Date.now()}-${qIndex++}`,
        subject,
        grade,
        lessonName: lessonTitle || `Bài ôn tập ${grade}`,
        type: 'multiple-choice',
        cognitiveLevel: 'van-dung',
        questionText: qText,
        options: allOpts,
        correctAnswers: [allOpts.indexOf(correct)],
        explanation: 'Vận dụng sáng tạo bài học vào việc giải quyết các vấn đề thực tiễn của bản thân và xã hội.',
        createdAt: new Date().toISOString()
      });
    } else {
      const qText = `[Vận dụng tự luận] Từ nội dung bài học "${lessonTitle}", em hãy viết đoạn văn (khoảng 5-8 dòng) nêu suy nghĩ và hành động cụ thể của bản thân để đóng góp cho quê hương.`;

      result.push({
        id: `gen-q-${Date.now()}-${qIndex++}`,
        subject,
        grade,
        lessonName: lessonTitle || `Bài ôn tập ${grade}`,
        type: 'essay',
        cognitiveLevel: 'van-dung',
        questionText: qText,
        essayGuide: 'Biểu điểm chấm:\n- Nêu được liên hệ thiết thực với nội dung bài học (3.0đ)\n- Đề xuất được 2-3 hành động cụ thể, khả thi của học sinh THCS (4.0đ)\n- Lời văn mạch lạc, chân thành, có cảm xúc (3.0đ).',
        explanation: 'Đánh giá năng lực liên hệ thực tiễn và phẩm chất trách nhiệm của học sinh.',
        createdAt: new Date().toISOString()
      });
    }
  }

  return result.slice(0, count);
}

// -------------------------------------------------------------
// STRICT API CATCH-ALL & JSON ERROR HANDLERS (BEFORE VITE/SPA FALLBACK)
// -------------------------------------------------------------
// Any /api request that didn't match an endpoint MUST return JSON 404, never fall through to HTML!
app.all('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: `API route không tồn tại: ${req.method} ${req.path}`,
  });
});

// JSON Error Handler for /api routes
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (req.path.startsWith('/api') || req.headers['content-type']?.includes('application/json')) {
    console.error('[API Error Caught]', req.method, req.path, err);
    return res.status(err.status || 500).json({
      success: false,
      error: err.message || 'Lỗi xử lý yêu cầu API trên máy chủ',
    });
  }
  next(err);
});

// -------------------------------------------------------------
// VITE INTEGRATION
// -------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = (typeof __dirname !== 'undefined' && fs.existsSync(path.join(__dirname, 'index.html')))
      ? __dirname
      : path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
