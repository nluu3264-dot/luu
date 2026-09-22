/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type SubjectType = 'lich-su' | 'dia-li';

export type GradeLevel = 6 | 7 | 8 | 9;

export type CognitiveLevel = 'biet' | 'hieu' | 'van-dung';

export type QuestionType = 
  | 'multiple-choice' // Trắc nghiệm nhiều lựa chọn
  | 'true-false'       // Đúng / Sai
  | 'matching'         // Nối cột A - B
  | 'short-answer'     // Trả lời ngắn
  | 'fill-in-blank'    // Điền khuyết
  | 'essay';           // Tự luận

export type Role = 'student' | 'author' | 'admin' | 'guest';

export interface Student {
  id: string;
  studentCode: string;
  fullName: string;
  classCode: string;
  grade: GradeLevel;
  notes?: string;
  password?: string;
  hasSetPassword?: boolean;
}

export interface Classroom {
  id: string;
  classCode: string;
  className: string;
  grade: GradeLevel;
  academicYear?: string;
  studentCount?: number;
}

export interface MatchingPair {
  left: string;
  right: string;
}

export interface TrueFalseStatement {
  statement: string;
  isCorrect: boolean;
}

export interface Question {
  id: string;
  subject: SubjectType;
  grade: GradeLevel;
  lessonId: string;
  lessonName: string;
  type: QuestionType;
  cognitiveLevel: CognitiveLevel; // Biết, Hiểu, Vận dụng
  questionText: string;
  
  // Media support
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'youtube';
  
  // For multiple-choice
  options?: string[];
  correctAnswers?: number[]; // indices of correct answers (1 or multiple)
  
  // For true-false
  statements?: TrueFalseStatement[];
  
  // For matching
  matchingPairs?: MatchingPair[];
  
  // For short-answer & fill-in-blank
  acceptableAnswers?: string[];
  
  // For essay
  essayGuide?: string; // Gợi ý chấm điểm
  
  explanation?: string;
  createdAt: string;
}

export interface LessonTheory {
  summary: string;
  keyPoints: string[];
  timelineOrFacts?: { title: string; content: string }[];
  diagramUrls?: string[];
}

export interface Lesson {
  id: string;
  subject: SubjectType;
  grade: GradeLevel;
  chapterNumber?: number;
  chapterName?: string;
  lessonNumber: number;
  title: string;
  theory: LessonTheory;
  createdAt: string;
  updatedAt?: string;
}

export type ScoreScale = 10 | 100;
export type AnswerRevealMode = 'immediate' | 'teacher-only' | 'hidden';
export type ScoreRevealMode = 'immediate' | 'teacher-only' | 'scheduled';

export interface Exam {
  id: string;
  title: string;
  subject: SubjectType;
  grade: GradeLevel;
  lessonIds: string[]; // Các bài học trong phạm vi đề
  durationMinutes: number;
  scoreScale: ScoreScale;
  questionCount: number;
  questionIds: string[];
  assignedClassCodes: string[]; // Các lớp được giao
  answerRevealMode: AnswerRevealMode;
  scoreRevealMode: ScoreRevealMode;
  scheduledRevealDate?: string;
  shuffleQuestions: boolean;
  status: 'draft' | 'published' | 'closed';
  createdAt: string;
}

export interface StudentAnswer {
  questionId: string;
  selectedOptionIndices?: number[];
  trueFalseAnswers?: boolean[];
  matchingAnswers?: { [leftIndex: number]: number }; // leftIndex -> rightIndex
  textAnswer?: string;
}

export interface ExamSubmission {
  id: string;
  examId: string;
  examTitle: string;
  subject: SubjectType;
  grade: GradeLevel;
  studentId: string;
  studentCode: string;
  studentName: string;
  classCode: string;
  startedAt: string;
  submittedAt: string;
  durationSeconds: number;
  score: number;
  maxScore: number;
  percentage: number;
  correctCount: number;
  totalQuestions: number;
  answers: StudentAnswer[];
  
  // Breakdown by cognitive level
  breakdown: {
    biet: { total: number; correct: number; percentage: number };
    hieu: { total: number; correct: number; percentage: number };
    vanDung: { total: number; correct: number; percentage: number };
  };
}

export interface SystemConfig {
  authorPasswordHash: string; // Plain/hash for author
  adminPasswordHash: string;  // Plain/hash for admin
  studentCodeScope: 'shared' | 'per-class'; // Mã HS dùng chung hay riêng từng lớp
}

export interface AppStoreData {
  classrooms: Classroom[];
  students: Student[];
  lessons: Lesson[];
  questions: Question[];
  exams: Exam[];
  submissions: ExamSubmission[];
  config: SystemConfig;
}
