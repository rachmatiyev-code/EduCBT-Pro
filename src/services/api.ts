import {
  SchoolProfile,
  Teacher,
  Student,
  ClassGroup,
  Subject,
  QuestionBank,
  ExamSession,
  ExamSubmission,
  ProctorPing,
  QuestionItem,
  ItemAnalysisResult,
} from '../types/cbt';

export const api = {
  async fetchAllData() {
    try {
      const res = await fetch('/api/data/all');
      if (!res.ok) throw new Error('Network response not ok');
      const data = await res.json();
      return data.data;
    } catch (err) {
      console.error('Failed to fetch initial data:', err);
      return null;
    }
  },

  async saveSchoolProfile(profile: Partial<SchoolProfile>) {
    const res = await fetch('/api/data/school-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    });
    return res.json();
  },

  async saveMasterData(payload: {
    teachers?: Teacher[];
    students?: Student[];
    classes?: ClassGroup[];
    subjects?: Subject[];
  }) {
    const res = await fetch('/api/data/master', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  async saveQuestionBank(bank: QuestionBank) {
    const res = await fetch('/api/data/question-banks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bank),
    });
    return res.json();
  },

  async deleteQuestionBank(id: string) {
    const res = await fetch(`/api/data/question-banks/${id}`, {
      method: 'DELETE',
    });
    return res.json();
  },

  async saveExamSession(session: ExamSession) {
    const res = await fetch('/api/data/exam-sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(session),
    });
    return res.json();
  },

  async deleteExamSession(id: string) {
    const res = await fetch(`/api/data/exam-sessions/${id}`, {
      method: 'DELETE',
    });
    return res.json();
  },

  async generateQuestionsWithAI(params: {
    subject: string;
    gradeLevel: string;
    topic: string;
    difficulty: string;
    questionTypes: string[];
    questionCount: number;
    customPrompt?: string;
  }) {
    const res = await fetch('/api/gemini/generate-questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Gagal generate soal AI');
    }
    return data.questions as QuestionItem[];
  },

  async sendProctorHeartbeat(payload: Partial<ProctorPing>) {
    try {
      await fetch('/api/proctor/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (e) {
      // Non-blocking ping
    }
  },

  async fetchLiveProctoring(sessionCode: string): Promise<ProctorPing[]> {
    try {
      const res = await fetch(`/api/proctor/live/${sessionCode}`);
      if (!res.ok) return [];
      const data = await res.json();
      return data.liveList || [];
    } catch {
      return [];
    }
  },

  // Scoring engine for student submission
  calculateScore(
    questions: QuestionItem[],
    answers: Record<string, any>
  ): {
    totalScore: number;
    maxPossibleScore: number;
    scorePercentage: number;
    itemAnalysis: ItemAnalysisResult[];
  } {
    let totalScore = 0;
    let maxPossibleScore = 0;
    const itemAnalysis: ItemAnalysisResult[] = [];

    questions.forEach((q) => {
      const qMaxPoints = Number(q.points) || 10;
      maxPossibleScore += qMaxPoints;

      const studentAns = answers[q.id];
      let isCorrect = false;
      let pointsEarned = 0;

      if (q.type === 'multiple_choice') {
        const cleanAns = typeof studentAns === 'string' ? studentAns.trim().toUpperCase() : '';
        const cleanCorrect = typeof q.correctAnswer === 'string' ? q.correctAnswer.trim().toUpperCase() : '';
        // Extract prefix like 'A' from 'A. Bla bla'
        const ansLetter = cleanAns.split('.')[0]?.trim() || cleanAns;
        const correctLetter = cleanCorrect.split('.')[0]?.trim() || cleanCorrect;
        if (ansLetter === correctLetter && ansLetter !== '') {
          isCorrect = true;
          pointsEarned = qMaxPoints;
        }
      } else if (q.type === 'multiple_select') {
        const rawCorrect = Array.isArray(q.correctAnswer)
          ? q.correctAnswer
          : typeof q.correctAnswer === 'string'
          ? q.correctAnswer.split(/[,;]/).map((s: string) => s.trim())
          : [];
        if (Array.isArray(studentAns) && rawCorrect.length > 0) {
          const cleanStudent = studentAns.map((a: string) => a.split('.')[0].trim().toUpperCase()).sort();
          const cleanCorrect = rawCorrect.map((a: string) => a.split('.')[0].trim().toUpperCase()).sort();
          if (JSON.stringify(cleanStudent) === JSON.stringify(cleanCorrect)) {
            isCorrect = true;
            pointsEarned = qMaxPoints;
          } else {
            // Partial points for partially correct
            const matchingCount = cleanStudent.filter((x: string) => cleanCorrect.includes(x)).length;
            if (matchingCount > 0 && cleanStudent.length <= cleanCorrect.length) {
              pointsEarned = Math.round((matchingCount / cleanCorrect.length) * qMaxPoints);
            }
          }
        }
      } else if (q.type === 'true_false') {
        if (typeof studentAns === 'string' && typeof q.correctAnswer === 'string') {
          if (studentAns.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase()) {
            isCorrect = true;
            pointsEarned = qMaxPoints;
          }
        }
      } else if (q.type === 'matching') {
        if (typeof studentAns === 'object' && studentAns !== null && typeof q.correctAnswer === 'object') {
          let pairCount = 0;
          let matchCount = 0;
          for (const key of Object.keys(q.correctAnswer)) {
            pairCount++;
            if (studentAns[key] && studentAns[key].trim().toLowerCase() === q.correctAnswer[key].trim().toLowerCase()) {
              matchCount++;
            }
          }
          if (pairCount > 0) {
            pointsEarned = Math.round((matchCount / pairCount) * qMaxPoints);
            isCorrect = matchCount === pairCount;
          }
        }
      } else if (q.type === 'short_answer') {
        if (typeof studentAns === 'string' && typeof q.correctAnswer === 'string') {
          const studentNorm = studentAns.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
          const correctNorm = q.correctAnswer.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
          if (studentNorm === correctNorm && studentNorm.length > 0) {
            isCorrect = true;
            pointsEarned = qMaxPoints;
          }
        }
      } else if (q.type === 'essay') {
        // Default provisional points for answered essay (50%) pending manual teacher review if needed
        if (typeof studentAns === 'string' && studentAns.trim().length > 10) {
          pointsEarned = Math.round(qMaxPoints * 0.7);
          isCorrect = true;
        }
      }

      totalScore += pointsEarned;
      itemAnalysis.push({
        questionNumber: q.number,
        questionId: q.id,
        type: q.type,
        pointsMax: qMaxPoints,
        pointsEarned,
        isCorrect,
        studentAnswer: studentAns || null,
        correctAnswer: q.correctAnswer,
      });
    });

    const scorePercentage = maxPossibleScore > 0 ? Math.round((totalScore / maxPossibleScore) * 100) : 0;

    return {
      totalScore,
      maxPossibleScore,
      scorePercentage,
      itemAnalysis,
    };
  },

  async submitExam(submission: Partial<ExamSubmission>) {
    const res = await fetch('/api/exam/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submission),
    });
    return res.json();
  },

  async fetchSubmissions(sessionCode: string): Promise<ExamSubmission[]> {
    try {
      const res = await fetch(`/api/exam/submissions/${sessionCode}`);
      if (!res.ok) return [];
      const data = await res.json();
      return data.submissions || [];
    } catch {
      return [];
    }
  },

  async setGasWebhook(url: string) {
    const res = await fetch('/api/gas/set-webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    return res.json();
  },

  async getGasWebhook(): Promise<string> {
    try {
      const res = await fetch('/api/gas/get-webhook');
      const data = await res.json();
      return data.gasWebhookUrl || '';
    } catch {
      return '';
    }
  },

  async testGasConnection(url: string) {
    const res = await fetch('/api/gas/test-connection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    return res.json();
  },

  async changeTeacherPassword(params: {
    teacherId: string;
    oldPassword?: string;
    newPassword: string;
  }) {
    const res = await fetch('/api/teacher/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return res.json();
  },
};
