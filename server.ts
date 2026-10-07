import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Initialize Google GenAI
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// In-memory persistent cache & queue to guarantee no exam data loss
const examDataStore: {
  schoolProfile: any;
  teachers: any[];
  students: any[];
  classes: any[];
  subjects: any[];
  questionBanks: any[];
  examSessions: any[];
  submissions: any[];
  livePings: Record<string, any>;
  gasWebhookUrl: string;
} = {
  schoolProfile: {
    name: 'SMA Negeri 1 Prestasi Bangsa',
    npsn: '20108922',
    address: 'Jl. Pendidikan Merdeka No. 45, Jakarta Pusat',
    phone: '(021) 7890-1234',
    email: 'info@sman1prestasibangsa.sch.id',
    principalName: 'Drs. H. Bambang Sugiarto, M.Pd.',
    principalNip: '19680512 199403 1 004',
    academicYear: '2026/2027',
    semester: 'Ganjil',
    logoUrl: '',
  },
  teachers: [
    {
      id: 'T01',
      name: 'Dr. Siti Nurhaliza, M.Pd.',
      nip: '19750918 200212 2 001',
      email: 'siti.nurhaliza@sman1prestasibangsa.sch.id',
      role: 'admin',
      subjectIds: ['SUB-01', 'SUB-02'],
      password: '1234',
    },
    {
      id: 'T02',
      name: 'Ahmad Fauzi, S.Pd., M.Si.',
      nip: '19820314 200801 1 007',
      email: 'ahmad.fauzi@sman1prestasibangsa.sch.id',
      role: 'guru',
      subjectIds: ['SUB-03', 'SUB-04'],
      password: '1234',
    },
  ],
  classes: [
    { id: 'CLS-SD1A', name: 'I-A (Kelas 1 SD)', gradeLevel: '1' },
    { id: 'CLS-SD4A', name: 'IV-A (Kelas 4 SD)', gradeLevel: '4' },
    { id: 'CLS-SD6A', name: 'VI-A (Kelas 6 SD)', gradeLevel: '6' },
    { id: 'CLS-10A', name: 'X MIPA 1', gradeLevel: '10' },
    { id: 'CLS-10B', name: 'X MIPA 2', gradeLevel: '10' },
    { id: 'CLS-11A', name: 'XI MIPA 1', gradeLevel: '11' },
    { id: 'CLS-12A', name: 'XII MIPA 1', gradeLevel: '12' },
  ],
  subjects: [
    { id: 'SUB-01', code: 'BIN', name: 'Bahasa Indonesia', kkm: 75, teacherName: 'Dr. Siti Nurhaliza, M.Pd.' },
    { id: 'SUB-02', code: 'BIG', name: 'Bahasa Inggris', kkm: 75, teacherName: 'Dr. Siti Nurhaliza, M.Pd.' },
    { id: 'SUB-03', code: 'MAT', name: 'Matematika Wajib', kkm: 78, teacherName: 'Ahmad Fauzi, S.Pd., M.Si.' },
    { id: 'SUB-04', code: 'BIO', name: 'Biologi', kkm: 75, teacherName: 'Ahmad Fauzi, S.Pd., M.Si.' },
    { id: 'SUB-05', code: 'IPAS', name: 'IPAS (Ilmu Pengetahuan Alam & Sosial SD)', kkm: 75, teacherName: 'Dr. Siti Nurhaliza, M.Pd.' },
  ],
  students: [
    { id: 'STD-SD001', nisn: '0151234001', name: 'Aisyah Putri Ramadhani', classId: 'CLS-SD1A', gender: 'P' },
    { id: 'STD-SD002', nisn: '0121234002', name: 'Bima Satria Nusantara', classId: 'CLS-SD4A', gender: 'L' },
    { id: 'STD-SD003', nisn: '0101234003', name: 'Citra Kirana Dewi', classId: 'CLS-SD6A', gender: 'P' },
    { id: 'STD-001', nisn: '0071234001', name: 'Aditya Pratama Putra', classId: 'CLS-12A', gender: 'L' },
    { id: 'STD-002', nisn: '0071234002', name: 'Anindya Putri Lestari', classId: 'CLS-12A', gender: 'P' },
    { id: 'STD-003', nisn: '0071234003', name: 'Bagas Wicaksono', classId: 'CLS-12A', gender: 'L' },
    { id: 'STD-004', nisn: '0071234004', name: 'Cantika Dewi Maharani', classId: 'CLS-12A', gender: 'P' },
    { id: 'STD-005', nisn: '0071234005', name: 'Daffa Rizky Ramadhan', classId: 'CLS-12A', gender: 'L' },
    { id: 'STD-006', nisn: '0071234006', name: 'Elsa Febriyanti', classId: 'CLS-12A', gender: 'P' },
  ],
  questionBanks: [],
  examSessions: [],
  submissions: [],
  livePings: {},
  gasWebhookUrl: '',
};

// Seed an initial ready-to-test bank soal and session
const initialBankId = 'BANK-001';
const initialSessionId = 'SES-001';

examDataStore.questionBanks.push({
  id: initialBankId,
  title: 'Penilaian Sumatif Akhir Semester - Bahasa Indonesia & Literasi',
  subjectId: 'SUB-01',
  gradeLevel: '12',
  teacherId: 'T01',
  totalQuestions: 5,
  durationMinutes: 45,
  passingScore: 75,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  questions: [
    {
      id: 'q-1',
      number: 1,
      type: 'multiple_choice',
      question: 'Bacalah kutipan teks berikut:\n\n"Teknologi kecerdasan buatan semakin terintegrasi dalam lanskap pendidikan modern. Guru tidak lagi berperan sebagai satu-satunya sumber informasi, melainkan bertransformasi menjadi fasilitator dan kurator pengetahuan."\n\nIde pokok paragraf di atas adalah...',
      options: [
        'A. Peran baru guru sebagai fasilitator akibat integrasi kecerdasan buatan',
        'B. Guru digantikan sepenuhnya oleh sistem kecerdasan buatan',
        'C. Kurikulum pendidikan modern yang menolak digitalisasi',
        'D. Siswa tidak lagi memerlukan bimbingan guru di sekolah',
        'E. Kecerdasan buatan merupakan satu-satunya kurator ilmu pengetahuan'
      ],
      correctAnswer: 'A',
      explanation: 'Paragraf menekankan integrasi kecerdasan buatan yang mengubah peran guru dari sumber informasi tunggal menjadi fasilitator.',
      points: 20,
    },
    {
      id: 'q-2',
      number: 2,
      type: 'multiple_select',
      question: 'Manakah di antara pernyataan berikut yang termasuk ke dalam ciri-ciri teks artikel ilmiah populer? (Pilih semua jawaban yang benar)',
      options: [
        'A. Menggunakan bahasa yang komunikatif dan mudah dipahami khalayak umum',
        'B. Berlandaskan pada data atau fakta yang valid dan dapat dipertanggungjawabkan',
        'C. Wajib menggunakan istilah teknis tanpa penjelasan konteks',
        'D. Disusun secara sistematis dengan argumen yang logis',
        'E. Bersifat fiktif dan mengutamakan imajinasi bebas'
      ],
      correctAnswer: ['A', 'B', 'D'],
      explanation: 'Artikel ilmiah populer memakai bahasa komunikatif, berbasis fakta valid, dan berargumen logis.',
      points: 20,
    },
    {
      id: 'q-3',
      number: 3,
      type: 'true_false',
      question: 'Tentukan kebenaran dari pernyataan berikut:\n\n"Kalimat efektif harus memenuhi syarat kepaduan (koherensi), keparalelan bentuk, dan kehematan kata tanpa menimbulkan ambiguitas makna."',
      options: ['Benar', 'Salah'],
      correctAnswer: 'Benar',
      explanation: 'Pernyataan tersebut tepat merangkum kriteria kaidah kalimat efektif dalam bahasa Indonesia baku.',
      points: 20,
    },
    {
      id: 'q-4',
      number: 4,
      type: 'matching',
      question: 'Jodohkan istilah kebahasaan berikut dengan definisinya yang tepat:',
      correctAnswer: {
        'Konjungsi Temporal': 'Kata hubung penanda urutan waktu kejadian',
        'Kalimat Imperatif': 'Kalimat yang mengandung perintah atau ajakan',
        'Kata Denotatif': 'Makna kata sebenarnya sesuai kamus'
      },
      matchingPairs: [
        { left: 'Konjungsi Temporal', right: 'Kata hubung penanda urutan waktu kejadian' },
        { left: 'Kalimat Imperatif', right: 'Kalimat yang mengandung perintah atau ajakan' },
        { left: 'Kata Denotatif', right: 'Makna kata sebenarnya sesuai kamus' },
      ],
      explanation: 'Pasangan istilah dan makna telah disesuaikan dengan tata bahasa baku.',
      points: 20,
    },
    {
      id: 'q-5',
      number: 5,
      type: 'short_answer',
      question: 'Sebutkan jenis teks yang bertujuan untuk menjelaskan proses terjadinya suatu fenomena alam atau sosial secara kausalitas/sebab-akibat!',
      correctAnswer: 'Eksplanasi',
      explanation: 'Teks yang memaparkan hubungan sebab-akibat suatu peristiwa disebut teks eksplanasi.',
      points: 20,
    }
  ]
});

examDataStore.examSessions.push({
  id: initialSessionId,
  bankId: initialBankId,
  sessionCode: 'CBT-2026',
  title: 'Penilaian Sumatif Akhir Semester - Bahasa Indonesia & Literasi',
  targetClassIds: ['CLS-12A'],
  startTime: new Date(Date.now() - 3600000).toISOString(),
  endTime: new Date(Date.now() + 86400000).toISOString(),
  durationMinutes: 45,
  shuffleQuestions: false,
  shuffleOptions: false,
  showResultInstant: true,
  antiCheatEnabled: true,
  maxTabSwitches: 3,
  status: 'active',
});

// AI Question Generation API
app.post('/api/gemini/generate-questions', async (req, res) => {
  try {
    const {
      subject,
      gradeLevel,
      topic,
      difficulty,
      questionTypes,
      questionCount,
      customPrompt,
      includeExplanations = true,
    } = req.body;

    const count = Math.min(Math.max(Number(questionCount) || 5, 1), 50);

    const promptText = `
Anda adalah seorang pakar kurikulum dan pembuat soal evaluasi pendidikan tingkat nasional (Kurikulum Merdeka).
Tugas Anda adalah menyusun ${count} butir soal ujian berkualitas tinggi berdasarkan spesifikasi berikut:

- Mata Pelajaran: ${subject || 'Umum'}
- Jenjang / Kelas: Kelas ${gradeLevel || '10'}
- Topik / Materi: ${topic || 'Komprehensif'}
- Tingkat Kesulitan: ${difficulty || 'Campuran (Mudah, Sedang, HOTS)'}
- Format Bentuk Soal yang diminta: ${Array.isArray(questionTypes) && questionTypes.length > 0 ? questionTypes.join(', ') : 'Pilihan Ganda, Pilihan Ganda Kompleks, Benar/Salah, Menjodohkan, Isian Singkat'}
- Catatan / Instruksi Khusus: ${customPrompt || 'Buat soal relevan, berbobot, konteks nyata, dan tidak ambigu.'}

PENTING ATURAN FORMAT OUTPUT:
Hasilkan ${count} butir soal dalam format JSON terstruktur dengan skema array objek.
Setiap soal harus memiliki struktur:
{
  "id": "q-" + nomor,
  "number": nomor urut (1 s/d ${count}),
  "type": salah satu dari ["multiple_choice", "multiple_select", "true_false", "matching", "short_answer", "essay"],
  "question": "Teks soal lengkap termasuk stimulus/bacaan jika ada",
  "options": ["A. ...", "B. ...", "C. ...", "D. ...", "E. ..."] (hanya untuk multiple_choice dan multiple_select),
  "correctAnswer": 
     - Untuk multiple_choice: "A" atau "B" atau "C" atau "D" atau "E"
     - Untuk multiple_select: array pilihan benar misalnya ["A", "C"]
     - Untuk true_false: "Benar" atau "Salah"
     - Untuk matching: object pasangan {"Premis A": "Respon 1", "Premis B": "Respon 2"}
     - Untuk short_answer: string kata kunci jawaban tepat
     - Untuk essay: string rubrik/kunci pokok jawaban
  "matchingPairs": [ {"left": "premis", "right": "pasangan"} ] (khusus type matching),
  "explanation": "Penjelasan detail mengapa jawaban tersebut benar",
  "points": bobot nilai per butir soal (misal 10 atau 20)
}

Pastikan bahasa Indonesia baku, akurat, dan tidak ada kesalahan penulisan.
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
              id: { type: Type.STRING },
              number: { type: Type.INTEGER },
              type: { type: Type.STRING },
              question: { type: Type.STRING },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              correctAnswer: { type: Type.STRING },
              explanation: { type: Type.STRING },
              points: { type: Type.NUMBER },
              matchingPairs: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    left: { type: Type.STRING },
                    right: { type: Type.STRING },
                  },
                },
              },
            },
            required: ['number', 'type', 'question', 'points', 'correctAnswer'],
          },
        },
      },
    });

    const rawText = response.text || '[]';
    let questions = JSON.parse(rawText);

    // Normalize & validate questions
    questions = questions.map((q: any, idx: number) => {
      const qNum = idx + 1;
      let qType = q.type || 'multiple_choice';
      if (!['multiple_choice', 'multiple_select', 'true_false', 'matching', 'short_answer', 'essay'].includes(qType)) {
        qType = 'multiple_choice';
      }

      let options = q.options;
      if (qType === 'multiple_choice' || qType === 'multiple_select') {
        if (!options || !Array.isArray(options) || options.length < 2) {
          options = ['A. Opsi A', 'B. Opsi B', 'C. Opsi C', 'D. Opsi D'];
        }
      } else if (qType === 'true_false') {
        options = ['Benar', 'Salah'];
      }

      let parsedCorrect = q.correctAnswer;
      if (qType === 'multiple_select') {
        if (typeof parsedCorrect === 'string') {
          parsedCorrect = parsedCorrect.split(/[,;]/).map((x: string) => x.trim().toUpperCase());
        } else if (!Array.isArray(parsedCorrect)) {
          parsedCorrect = ['A', 'B'];
        }
      } else if (qType === 'true_false') {
        parsedCorrect = typeof parsedCorrect === 'string' && parsedCorrect.toLowerCase().includes('salah') ? 'Salah' : 'Benar';
      } else if (!parsedCorrect) {
        parsedCorrect = qType === 'multiple_choice' ? 'A' : 'Jawaban benar';
      }

      return {
        id: q.id || `gen-${Date.now()}-${qNum}`,
        number: qNum,
        type: qType,
        question: q.question || `Pertanyaan nomor ${qNum}`,
        options: options || undefined,
        correctAnswer: parsedCorrect,
        matchingPairs: q.matchingPairs || undefined,
        explanation: q.explanation || 'Pembahasan soal.',
        points: Number(q.points) || Math.round(100 / count),
      };
    });

    return res.json({
      success: true,
      count: questions.length,
      questions,
    });
  } catch (err: any) {
    console.error('Error in /api/gemini/generate-questions:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Gagal menghasilkan soal dengan AI',
    });
  }
});

// App Data Routes
app.get('/api/data/all', (req, res) => {
  return res.json({
    success: true,
    data: examDataStore,
  });
});

app.post('/api/data/school-profile', (req, res) => {
  examDataStore.schoolProfile = { ...examDataStore.schoolProfile, ...req.body };
  return res.json({ success: true, schoolProfile: examDataStore.schoolProfile });
});

app.post('/api/data/master', (req, res) => {
  const { teachers, students, classes, subjects } = req.body;
  if (teachers) examDataStore.teachers = teachers;
  if (students) examDataStore.students = students;
  if (classes) examDataStore.classes = classes;
  if (subjects) examDataStore.subjects = subjects;
  return res.json({ success: true, message: 'Data master berhasil diperbarui.' });
});

app.post('/api/teacher/change-password', (req, res) => {
  try {
    const { teacherId, oldPassword, newPassword } = req.body || {};
    if (!teacherId || !newPassword) {
      return res.status(400).json({ success: false, error: 'Data tidak lengkap.' });
    }

    const teacher = examDataStore.teachers.find((t) => t.id === teacherId);
    if (!teacher) {
      return res.status(404).json({ success: false, error: 'Akun guru tidak ditemukan.' });
    }

    const currentPass = teacher.password || '1234';
    if (oldPassword && oldPassword !== currentPass) {
      return res.status(400).json({ success: false, error: 'Kata sandi lama tidak sesuai.' });
    }

    teacher.password = newPassword.trim();
    return res.json({
      success: true,
      message: 'Kata sandi berhasil diubah! Silakan gunakan kata sandi baru untuk login.',
      teacher,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Gagal mengubah kata sandi' });
  }
});

app.post('/api/teacher/register', (req, res) => {
  try {
    const { name, nip, email, role, password, subjectIds } = req.body || {};
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Nama guru wajib diisi.' });
    }

    const newTeacher = {
      id: `T${Date.now()}`,
      name: name.trim(),
      nip: nip ? nip.trim() : '-',
      email: email ? email.trim() : `${name.toLowerCase().replace(/[^a-z0-9]/g, '')}@sekolah.sch.id`,
      role: role === 'admin' ? 'admin' : 'guru',
      subjectIds: Array.isArray(subjectIds) ? subjectIds : ['SUB-01'],
      password: password && password.trim() ? password.trim() : '1234',
    };

    examDataStore.teachers.push(newTeacher);
    return res.json({
      success: true,
      message: 'Akun guru baru berhasil ditambahkan!',
      teacher: newTeacher,
      teachers: examDataStore.teachers,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Gagal mendaftar guru' });
  }
});

app.post('/api/data/question-banks', (req, res) => {
  const bank = req.body;
  if (!bank.id) {
    bank.id = `BANK-${Date.now()}`;
  }
  const existingIdx = examDataStore.questionBanks.findIndex((b) => b.id === bank.id);
  if (existingIdx >= 0) {
    examDataStore.questionBanks[existingIdx] = bank;
  } else {
    examDataStore.questionBanks.push(bank);
  }
  return res.json({ success: true, bank });
});

app.delete('/api/data/question-banks/:id', (req, res) => {
  examDataStore.questionBanks = examDataStore.questionBanks.filter((b) => b.id !== req.params.id);
  return res.json({ success: true, message: 'Bank soal berhasil dihapus.' });
});

app.post('/api/data/exam-sessions', (req, res) => {
  const session = req.body;
  if (!session.id) {
    session.id = `SES-${Date.now()}`;
  }
  const existingIdx = examDataStore.examSessions.findIndex((s) => s.id === session.id);
  if (existingIdx >= 0) {
    examDataStore.examSessions[existingIdx] = session;
  } else {
    examDataStore.examSessions.push(session);
  }
  return res.json({ success: true, session });
});

app.delete('/api/data/exam-sessions/:id', (req, res) => {
  examDataStore.examSessions = examDataStore.examSessions.filter((s) => s.id !== req.params.id);
  return res.json({ success: true, message: 'Sesi ujian berhasil dihapus.' });
});

// Live Proctoring Heartbeat
app.post('/api/proctor/heartbeat', (req, res) => {
  const {
    studentId,
    studentName,
    classId,
    sessionCode,
    currentQuestionIndex,
    answeredCount,
    totalQuestions,
    tabBlurCount,
    device,
    batteryLevel,
    isOnline = true,
  } = req.body;

  if (!studentId || !sessionCode) {
    return res.status(400).json({ success: false, error: 'Missing studentId or sessionCode' });
  }

  const key = `${sessionCode}_${studentId}`;
  examDataStore.livePings[key] = {
    studentId,
    studentName,
    classId,
    sessionCode,
    currentQuestionIndex: currentQuestionIndex || 1,
    answeredCount: answeredCount || 0,
    totalQuestions: totalQuestions || 1,
    tabBlurCount: tabBlurCount || 0,
    device: device || 'Web Browser',
    batteryLevel,
    isOnline,
    lastPing: Date.now(),
    status: tabBlurCount > 2 ? 'warning' : 'active',
  };

  return res.json({ success: true });
});

app.get('/api/proctor/live/:sessionCode', (req, res) => {
  const { sessionCode } = req.params;
  const now = Date.now();
  const list = Object.values(examDataStore.livePings)
    .filter((p: any) => p.sessionCode === sessionCode)
    .map((p: any) => {
      const isStillOnline = now - p.lastPing < 25000;
      return {
        ...p,
        isOnline: isStillOnline,
        status: !isStillOnline ? 'offline' : p.tabBlurCount > 2 ? 'warning' : 'active',
      };
    });

  return res.json({ success: true, liveList: list });
});

// Student Submission & Instant Scoring
app.post('/api/exam/submit', async (req, res) => {
  try {
    const submission = req.body;
    submission.id = submission.id || `SUB-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    submission.submittedAt = new Date().toISOString();
    submission.syncedToDrive = false;

    // Save to store
    examDataStore.submissions.push(submission);

    // Mark live ping as submitted
    const key = `${submission.sessionCode}_${submission.studentId}`;
    if (examDataStore.livePings[key]) {
      examDataStore.livePings[key].status = 'submitted';
      examDataStore.livePings[key].answeredCount = submission.answeredCount || examDataStore.livePings[key].totalQuestions;
    }

    // Forward to GAS Webhook if configured
    if (examDataStore.gasWebhookUrl) {
      try {
        fetch(examDataStore.gasWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'recordSubmission',
            submission,
          }),
        }).catch((e) => console.warn('Background GAS sync dispatch:', e.message));
      } catch (err) {
        console.warn('Could not forward to GAS:', err);
      }
    }

    return res.json({
      success: true,
      message: 'Ujian berhasil dikumpulkan dan dinilai secara otomatis!',
      submission,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/exam/submissions/:sessionCode', (req, res) => {
  const { sessionCode } = req.params;
  const filtered = examDataStore.submissions.filter((s) => s.sessionCode === sessionCode);
  return res.json({ success: true, submissions: filtered });
});

// GAS Sync & Configuration
app.post('/api/gas/set-webhook', (req, res) => {
  const { url } = req.body;
  examDataStore.gasWebhookUrl = url || '';
  return res.json({ success: true, gasWebhookUrl: examDataStore.gasWebhookUrl });
});

app.get('/api/gas/get-webhook', (req, res) => {
  return res.json({ success: true, gasWebhookUrl: examDataStore.gasWebhookUrl });
});

app.post('/api/gas/test-connection', async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ success: false, error: 'URL Google Apps Script wajib diisi' });
  }

  try {
    const fetchRes = await fetch(url + '?action=ping', {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });
    const text = await fetchRes.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }

    return res.json({
      success: true,
      message: 'Terhubung dengan Google Apps Script Web App!',
      data,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: `Gagal menghubungi Google Apps Script: ${err.message}`,
    });
  }
});

// Express Vite mounting in dev mode
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, () => {
    console.log(`EduCBT Pro server listening on port ${port}`);
  });
}

startServer();
