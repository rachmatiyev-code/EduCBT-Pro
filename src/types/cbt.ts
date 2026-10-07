export type QuestionType =
  | 'multiple_choice'
  | 'multiple_select'
  | 'true_false'
  | 'matching'
  | 'short_answer'
  | 'essay';

export interface QuestionMedia {
  type: 'image' | 'audio' | 'video';
  url: string;
  caption?: string;
  maxPlayCount?: number; // For listening test (audio)
}

export interface MatchingPair {
  left: string;
  right: string;
}

export interface QuestionItem {
  id: string;
  number: number;
  type: QuestionType;
  question: string;
  options?: string[]; // For multiple choice & multiple select
  correctAnswer: any; // string, string[], boolean, or record for matching
  matchingPairs?: MatchingPair[]; // For matching question
  explanation?: string;
  points: number;
  media?: QuestionMedia;
}

export interface QuestionBank {
  id: string;
  title: string;
  subjectId: string;
  gradeLevel: string;
  teacherId: string;
  totalQuestions: number;
  durationMinutes: number;
  passingScore: number;
  questions: QuestionItem[];
  createdAt: string;
  updatedAt: string;
}

export interface ExamSession {
  id: string;
  bankId: string;
  sessionCode: string; // Token (e.g., CBT-2026)
  title: string;
  targetClassIds: string[];
  startTime: string;
  endTime: string;
  durationMinutes: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showResultInstant: boolean;
  antiCheatEnabled: boolean;
  maxTabSwitches: number;
  status: 'scheduled' | 'active' | 'ended';
}

export interface SchoolProfile {
  name: string;
  npsn: string;
  address: string;
  phone: string;
  email: string;
  principalName: string;
  principalNip: string;
  academicYear: string;
  semester: string;
  logoUrl?: string;
}

export interface Teacher {
  id: string;
  name: string;
  nip: string;
  email: string;
  role: 'admin' | 'guru';
  subjectIds: string[];
}

export interface Student {
  id: string;
  nisn: string;
  name: string;
  classId: string;
  gender: 'L' | 'P';
  password?: string;
}

export interface ClassGroup {
  id: string;
  name: string;
  gradeLevel: string;
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  kkm: number;
  teacherName: string;
}

export interface ProctorPing {
  studentId: string;
  studentName: string;
  classId: string;
  sessionCode: string;
  currentQuestionIndex: number;
  answeredCount: number;
  totalQuestions: number;
  tabBlurCount: number;
  device: string;
  batteryLevel?: number;
  isOnline: boolean;
  lastPing: number;
  status: 'active' | 'warning' | 'idle' | 'offline' | 'submitted';
}

export interface ItemAnalysisResult {
  questionNumber: number;
  questionId: string;
  type: QuestionType;
  pointsMax: number;
  pointsEarned: number;
  isCorrect: boolean;
  studentAnswer: any;
  correctAnswer: any;
}

export interface ExamSubmission {
  id: string;
  sessionCode: string;
  studentId: string;
  studentName: string;
  studentClass: string;
  submittedAt: string;
  totalScore: number;
  maxPossibleScore: number;
  scorePercentage: number;
  isPassed: boolean;
  tabBlurCount: number;
  durationTakenSeconds: number;
  syncedToDrive: boolean;
  answers: Record<string, any>;
  itemAnalysis: ItemAnalysisResult[];
}
