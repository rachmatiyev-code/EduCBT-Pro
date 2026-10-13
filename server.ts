import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_STORE_PATH = path.join(__dirname, 'data_store.json');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Helper to instantiate GoogleGenAI dynamically
function getGenAIClient(customKey?: string) {
  const apiKey = (customKey && customKey.trim()) || examDataStore.geminiApiKey || process.env.GEMINI_API_KEY || '';
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function maskApiKey(key?: string): string {
  if (!key || key.length < 8) return '';
  return `${key.substring(0, 6)}...${key.substring(key.length - 4)}`;
}

// In-memory persistent cache & file persistence to guarantee no data loss across restarts
let examDataStore: {
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
  geminiApiKey?: string;
} = {
  schoolProfile: {
    regionalGovernment: 'PEMERINTAH DAERAH PROVINSI DKI JAKARTA',
    educationDepartment: 'DINAS PENDIDIKAN DAN KEBUDAYAAN',
    name: 'SMP Negeri 5 Percontohan',
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
    { id: 'STD-000', nisn: '1', name: 'Siswa Percobaan (NISN 1)', classId: 'CLS-12A', gender: 'L' },
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
  geminiApiKey: '',
};

// Disk Persistence helpers
function loadDataStore() {
  try {
    if (fs.existsSync(DATA_STORE_PATH)) {
      const raw = fs.readFileSync(DATA_STORE_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        if (parsed.schoolProfile) {
          examDataStore.schoolProfile = {
            regionalGovernment: 'PEMERINTAH DAERAH PROVINSI DKI JAKARTA',
            educationDepartment: 'DINAS PENDIDIKAN DAN KEBUDAYAAN',
            ...parsed.schoolProfile,
          };
        }
        if (Array.isArray(parsed.teachers) && parsed.teachers.length > 0) {
          examDataStore.teachers = parsed.teachers;
        }
        if (Array.isArray(parsed.students) && parsed.students.length > 0) {
          examDataStore.students = parsed.students;
        }
        if (Array.isArray(parsed.classes) && parsed.classes.length > 0) {
          examDataStore.classes = parsed.classes;
        }
        if (Array.isArray(parsed.subjects) && parsed.subjects.length > 0) {
          examDataStore.subjects = parsed.subjects;
        }
        if (Array.isArray(parsed.questionBanks)) {
          // Deduplicate question banks by id
          const bankMap = new Map<string, any>();
          parsed.questionBanks.forEach((b: any) => {
            if (b && b.id) bankMap.set(b.id, b);
          });
          examDataStore.questionBanks = Array.from(bankMap.values());
        }
        if (Array.isArray(parsed.examSessions)) {
          // Deduplicate and filter only valid exam sessions with token and bankId
          const sessionMap = new Map<string, any>();
          parsed.examSessions.forEach((s: any) => {
            if (s && s.id && s.sessionCode && s.bankId) {
              sessionMap.set(s.id, s);
            }
          });
          examDataStore.examSessions = Array.from(sessionMap.values());
        }
        if (Array.isArray(parsed.submissions)) {
          examDataStore.submissions = parsed.submissions;
        }
        if (parsed.gasWebhookUrl) {
          examDataStore.gasWebhookUrl = parsed.gasWebhookUrl;
        }
        if (parsed.geminiApiKey) {
          examDataStore.geminiApiKey = parsed.geminiApiKey;
        }
        console.log(`[Store] Loaded data from disk: ${examDataStore.teachers.length} teachers, ${examDataStore.students.length} students`);
      }
    }
  } catch (err: any) {
    console.warn('[Store] Could not load data_store.json:', err.message);
  }
}

function saveDataStore() {
  try {
    const toSave = {
      schoolProfile: examDataStore.schoolProfile,
      teachers: examDataStore.teachers,
      students: examDataStore.students,
      classes: examDataStore.classes,
      subjects: examDataStore.subjects,
      questionBanks: examDataStore.questionBanks,
      examSessions: examDataStore.examSessions,
      submissions: examDataStore.submissions,
      gasWebhookUrl: examDataStore.gasWebhookUrl,
      geminiApiKey: examDataStore.geminiApiKey,
    };
    fs.writeFileSync(DATA_STORE_PATH, JSON.stringify(toSave, null, 2), 'utf-8');
  } catch (err: any) {
    console.warn('[Store] Could not write to data_store.json:', err.message);
  }
}

// Background auto-sync to Google Apps Script / Google Drive
function syncToGasWebhook(action: string, payload: any) {
  if (!examDataStore.gasWebhookUrl) return;
  try {
    fetch(examDataStore.gasWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...payload }),
    }).catch((e) => console.warn('[GAS] Auto-sync background dispatch:', e.message));
  } catch (err: any) {
    console.warn('[GAS] Auto-sync dispatch error:', err.message);
  }
}

// Initial load
loadDataStore();

// Seed initial bank only if questionBanks is completely empty
const initialBankId = 'BANK-001';
const initialSessionId = 'SES-001';

if (examDataStore.questionBanks.length === 0) {
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
}

if (examDataStore.examSessions.length === 0) {
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
}

// Seed Pendidikan Pancasila Bank & Session (Token: PP-01)
const pancasilaBankId = 'BANK-PP-01';
const pancasilaSessionId = 'SES-PP-01';

if (!examDataStore.questionBanks.some((b) => b.id === pancasilaBankId)) {
  examDataStore.questionBanks.push({
    id: pancasilaBankId,
    title: 'Penilaian Sumatif Pendidikan Pancasila',
    subjectId: 'SUB-PKN',
    gradeLevel: '10',
    teacherId: 'T01',
    totalQuestions: 5,
    durationMinutes: 60,
    passingScore: 75,
    curriculum: 'Kurikulum Merdeka',
    academicYear: '2025/2026',
    semester: 'Genap',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    questions: [
      {
        id: 'q-pp-1',
        number: 1,
        type: 'multiple_choice',
        question:
          'Dalam kehidupan berbangsa dan bernegara, sila kedua Pancasila yaitu "Kemanusiaan yang adil dan beradab" memberikan landasan moral bagi penyelenggaraan negara bahwa...',
        options: [
          'A. Setiap warga negara wajib dihormati martabat kemanusiaannya tanpa diskriminasi suku, agama, dan ras',
          'B. Kepentingan individu dan kelompok tertentu lebih diutamakan dibandingkan kepentingan umum',
          'C. Pembangunan ekonomi hanya ditujukan untuk kelompok masyarakat tingkat atas',
          'D. Penegakan hukum dilakukan berdasarkan status sosial dan jabatan warga negara',
          'E. Hak asasi manusia tidak berlaku bagi kelompok minoritas dalam masyarakat'
        ],
        correctAnswer: 'A',
        explanation:
          'Sila kedua Pancasila menjamin penghormatan atas harkat, martabat, dan hak asasi setiap warga negara secara adil dan beradab tanpa perlakuan diskriminatif.',
        points: 20,
        cognitiveLevel: 'C3',
        difficulty: 'medium',
        topicMaterial: 'Nilai-Nilai Luhur Pancasila dalam Kehidupan Berbangsa'
      },
      {
        id: 'q-pp-2',
        number: 2,
        type: 'multiple_select',
        question:
          'Pilihlah bentuk-bentuk implementasi nilai gotong royong dan keadilan sosial (Sila ke-5) dalam kehidupan bermasyarakat sehari-hari (Pilih 2 atau lebih jawaban yang benar):',
        options: [
          'A. Melaksanakan kerja bakti membersihkan saluran air dan fasilitas umum lingkungan RT/RW',
          'B. Mengembangkan sikap hidup boros dan gemar memamerkan kemewahan di ruang publik',
          'C. Menggalang bantuan sosial untuk korban bencana alam tanpa membeda-bedakan latar belakang korban',
          'D. Menghalangi hak orang lain demi memperoleh keuntungan pribadi secara sepihak'
        ],
        correctAnswer: ['A', 'C'],
        explanation:
          'Jawaban A dan C mencerminkan sikap gotong royong, kepedulian sosial, dan keadilan yang selaras dengan nilai-nilai Pancasila.',
        points: 20,
        cognitiveLevel: 'C4',
        difficulty: 'medium',
        topicMaterial: 'Implementasi Gotong Royong dan Keadilan Sosial'
      },
      {
        id: 'q-pp-3',
        number: 3,
        type: 'matching',
        question:
          'Jodohkanlah sila Pancasila dengan lambang/simbol perisai pada Garuda Pancasila yang tepat:',
        matchingPairs: [
          { left: 'Sila 1: Ketuhanan Yang Maha Esa', right: 'Bintang Emas' },
          { left: 'Sila 2: Kemanusiaan yang Adil dan Beradab', right: 'Rantai Emas' },
          { left: 'Sila 3: Persatuan Indonesia', right: 'Pohon Beringin' },
          { left: 'Sila 4: Kerakyatan yang Dipimpin oleh Hikmat Kebijaksanaan', right: 'Kepala Banteng' },
          { left: 'Sila 5: Keadilan Sosial bagi Seluruh Rakyat Indonesia', right: 'Padi dan Kapas' }
        ],
        correctAnswer: {
          'Sila 1: Ketuhanan Yang Maha Esa': 'Bintang Emas',
          'Sila 2: Kemanusiaan yang Adil dan Beradab': 'Rantai Emas',
          'Sila 3: Persatuan Indonesia': 'Pohon Beringin',
          'Sila 4: Kerakyatan yang Dipimpin oleh Hikmat Kebijaksanaan': 'Kepala Banteng',
          'Sila 5: Keadilan Sosial bagi Seluruh Rakyat Indonesia': 'Padi dan Kapas'
        },
        explanation:
          'Perisai Garuda Pancasila memuat lima lambang sila: Bintang (Sila 1), Rantai Emas (Sila 2), Pohon Beringin (Sila 3), Kepala Banteng (Sila 4), serta Padi dan Kapas (Sila 5).',
        points: 20,
        cognitiveLevel: 'C2',
        difficulty: 'easy',
        topicMaterial: 'Simbol dan Makna Lambang Negara Garuda Pancasila'
      },
      {
        id: 'q-pp-4',
        number: 4,
        type: 'true_false',
        question:
          'Pancasila berkedudukan sebagai ideologi terbuka yang fleksibel dan mampu menyerap perkembangan ilmu pengetahuan serta teknologi mutakhir tanpa mengubah nilai-nilai dasarnya.',
        options: ['Benar', 'Salah'],
        correctAnswer: 'Benar',
        explanation:
          'Pancasila sebagai ideologi terbuka memiliki dimensi realitas, idealisme, dan fleksibilitas sehingga selalu relevan dengan perkembangan zaman tanpa mengorbankan nilai fundamentalnya.',
        points: 20,
        cognitiveLevel: 'C3',
        difficulty: 'medium',
        topicMaterial: 'Kedudukan Pancasila sebagai Ideologi Terbuka'
      },
      {
        id: 'q-pp-5',
        number: 5,
        type: 'essay',
        question:
          'Jelaskan bagaimana generasi muda Indonesia dapat menerapkan dimensi "Berkebinekaan Global" dalam Profil Pelajar Pancasila di era kemajuan teknologi informasi saat ini!',
        correctAnswer:
          'Generasi muda dapat menerapkan kebinekaan global dengan mempertahankan budaya luhur, berinteraksi positif lintas budaya, dan bijak dalam menyaring informasi.',
        explanation:
          'Pelajar yang berkebinekaan global mempertahankan budaya luhur dan identitasnya serta berpikiran terbuka.',
        points: 20,
        cognitiveLevel: 'C5',
        difficulty: 'hard',
        topicMaterial: 'Profil Pelajar Pancasila & Kebinekaan Global'
      }
    ]
  });
}

// Ensure active session for PP-01 exists
const existingPP01 = examDataStore.examSessions.find(
  (s) => String(s.sessionCode || '').trim().toUpperCase() === 'PP-01'
);
if (!existingPP01) {
  examDataStore.examSessions.push({
    id: pancasilaSessionId,
    bankId: pancasilaBankId,
    sessionCode: 'PP-01',
    title: 'Penilaian Sumatif Pendidikan Pancasila',
    targetClassIds: ['CLS-10A', 'CLS-11A', 'CLS-12A', 'CLS-SD1A', 'CLS-SD4A', 'CLS-SD6A'],
    startTime: new Date(Date.now() - 3600000).toISOString(),
    endTime: new Date(Date.now() + 86400000 * 30).toISOString(),
    durationMinutes: 60,
    shuffleQuestions: false,
    shuffleOptions: false,
    showResultInstant: true,
    antiCheatEnabled: true,
    maxTabSwitches: 3,
    status: 'active',
  });
} else {
  existingPP01.status = 'active';
  existingPP01.bankId = existingPP01.bankId || pancasilaBankId;
}

saveDataStore();

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
      apiKey,
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

    const client = getGenAIClient(apiKey || (req.headers['x-gemini-api-key'] as string));
    const generateConfig = {
      responseMimeType: 'application/json',
    };

    let response;
    try {
      response = await client.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: promptText,
        config: generateConfig,
      });
    } catch (primaryErr: any) {
      console.warn('Primary 3.8-flash failed, trying 3.1-flash-lite:', primaryErr.message);
      try {
        response = await client.models.generateContent({
          model: 'gemini-3.1-flash-lite',
          contents: promptText,
          config: generateConfig,
        });
      } catch (secondaryErr: any) {
        console.error('Secondary 3.1-flash-lite also failed:', secondaryErr.message);
        throw new Error(secondaryErr.message || primaryErr.message || 'Gagal menghubungi model Gemini.');
      }
    }

    let rawText = (response.text || '[]').trim();
    if (rawText.startsWith('```json')) {
      rawText = rawText.replace(/^```json/, '').replace(/```$/, '').trim();
    } else if (rawText.startsWith('```')) {
      rawText = rawText.replace(/^```/, '').replace(/```$/, '').trim();
    }
    const firstBracket = rawText.indexOf('[');
    const lastBracket = rawText.lastIndexOf(']');
    if (firstBracket !== -1 && lastBracket !== -1) {
      rawText = rawText.substring(firstBracket, lastBracket + 1);
    }

    let questions: any[] = [];
    try {
      const parsed = JSON.parse(rawText);
      if (Array.isArray(parsed)) {
        questions = parsed;
      } else if (parsed && typeof parsed === 'object') {
        questions =
          parsed.questions ||
          parsed.data ||
          parsed.items ||
          parsed.soal ||
          (Object.values(parsed).find(Array.isArray) as any[]) ||
          [];
      }
    } catch (parseErr: any) {
      console.warn('Failed to parse Gemini response text as JSON:', rawText.slice(0, 300));
      throw new Error('Respon dari Gemini tidak berformat JSON yang valid. Silakan coba kembali.');
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error('Tidak ada butir soal yang berhasil disusun oleh AI. Silakan coba kembali.');
    }

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
        cognitiveDomain: q.cognitiveDomain || 'bloom',
        cognitiveLevel: q.cognitiveLevel || (qNum % 3 === 1 ? 'C3' : qNum % 3 === 2 ? 'C4' : 'C2'),
        competencyIndicator: q.competencyIndicator || `Menganalisis materi ${topic || subject}`,
        learningObjective: q.learningObjective || `Memahami capaian kompetensi dasar ${topic || subject}`,
        topicMaterial: topic || subject,
      };
    });

    return res.json({
      success: true,
      count: questions.length,
      questions,
    });
  } catch (err: any) {
    console.error('Error in /api/gemini/generate-questions:', err);
    let errMsg = err.message || 'Gagal memproses pembuatan soal dengan AI Gemini.';
    if (errMsg.includes('Unexpected token') || errMsg.includes('is not valid JSON') || errMsg.includes('The page c')) {
      errMsg = 'Koneksi ke server AI terputus atau waktu tunggu habis. Silakan coba kembali dengan jumlah soal 5–10 butir.';
    }
    return res.status(500).json({
      success: false,
      error: errMsg,
    });
  }
});

// Gemini API Key Management Routes
app.get('/api/gemini/get-key', (req, res) => {
  const customKey = examDataStore.geminiApiKey || '';
  const envKey = process.env.GEMINI_API_KEY || '';
  const effectiveKey = customKey || envKey;
  return res.json({
    success: true,
    isConfigured: !!effectiveKey,
    isCustom: !!customKey,
    maskedKey: maskApiKey(effectiveKey),
  });
});

app.post('/api/gemini/set-key', (req, res) => {
  try {
    const { apiKey } = req.body || {};
    const cleanKey = (apiKey || '').trim();
    examDataStore.geminiApiKey = cleanKey;
    saveDataStore();
    const effectiveKey = cleanKey || process.env.GEMINI_API_KEY || '';
    return res.json({
      success: true,
      message: cleanKey
        ? 'Google Gemini API Key berhasil disimpan dan diaktifkan!'
        : 'Gemini API Key kustom telah dihapus (kembali menggunakan setelan bawaan sistem).',
      isConfigured: !!effectiveKey,
      isCustom: !!cleanKey,
      maskedKey: maskApiKey(effectiveKey),
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Gagal menyimpan API key' });
  }
});

app.post('/api/gemini/test-key', async (req, res) => {
  try {
    const { apiKey } = req.body || {};
    const client = getGenAIClient(apiKey);
    let text = '';
    let modelUsed = 'gemini-3.1-flash-lite';
    try {
      const result = await client.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: 'Tuliskan hanya satu kata sambutan singkat dalam Bahasa Indonesia: Sukses',
      });
      text = result.text || '';
    } catch (primaryErr: any) {
      console.warn('3.1-flash-lite failed, trying 3.8-flash:', primaryErr.message);
      modelUsed = 'gemini-3.8-flash';
      const result = await client.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: 'Tuliskan hanya satu kata sambutan singkat dalam Bahasa Indonesia: Sukses',
      });
      text = result.text || '';
    }

    return res.json({
      success: true,
      message: `Koneksi ke Google Gemini AI (Model: ${modelUsed}) Berhasil & Aktif!`,
      sampleResponse: text.trim(),
    });
  } catch (err: any) {
    console.error('Error testing Gemini key:', err);
    return res.status(400).json({
      success: false,
      error: err.message || 'Koneksi gagal. Pastikan API Key Gemini Anda valid dan aktif dari Google AI Studio.',
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
  saveDataStore();
  syncToGasWebhook('backupAllData', { payload: examDataStore });
  return res.json({ success: true, schoolProfile: examDataStore.schoolProfile });
});

app.post('/api/data/master', (req, res) => {
  try {
    const { teachers, students, classes, subjects } = req.body || {};
    if (teachers && Array.isArray(teachers)) examDataStore.teachers = teachers;
    if (students && Array.isArray(students)) examDataStore.students = students;
    if (classes && Array.isArray(classes)) examDataStore.classes = classes;
    if (subjects && Array.isArray(subjects)) examDataStore.subjects = subjects;
    saveDataStore();
    syncToGasWebhook('backupAllData', { payload: examDataStore });
    return res.json({
      success: true,
      message: 'Data master berhasil diperbarui dan tersimpan permanen.',
      students: examDataStore.students,
      classes: examDataStore.classes,
      subjects: examDataStore.subjects,
      teachers: examDataStore.teachers,
      studentsCount: examDataStore.students.length,
      classesCount: examDataStore.classes.length,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Gagal menyimpan data master' });
  }
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
    saveDataStore();
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
    const { id, name, nip, email, role, password, subjectIds } = req.body || {};
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Nama guru wajib diisi.' });
    }

    const cleanName = name.trim();
    const cleanNip = nip && nip.trim() ? nip.trim() : '-';
    const teacherId = id && String(id).trim() ? String(id).trim() : `T${Date.now()}`;
    const cleanPassword = password && String(password).trim() ? String(password).trim() : '1234';

    const newTeacher = {
      id: teacherId,
      name: cleanName,
      nip: cleanNip,
      email: email && email.trim() ? email.trim() : `${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '')}@sekolah.sch.id`,
      role: role === 'admin' ? 'admin' : 'guru',
      subjectIds: Array.isArray(subjectIds) && subjectIds.length > 0 ? subjectIds : ['SUB-01'],
      password: cleanPassword,
    };

    // Check if teacher already exists by ID, NIP (if not '-'), or exact name
    const existingIdx = examDataStore.teachers.findIndex(
      (t) =>
        t.id === newTeacher.id ||
        (cleanNip !== '-' && t.nip && t.nip.trim() === cleanNip) ||
        (t.name && t.name.trim().toLowerCase() === cleanName.toLowerCase())
    );

    if (existingIdx >= 0) {
      examDataStore.teachers[existingIdx] = {
        ...examDataStore.teachers[existingIdx],
        ...newTeacher,
        id: examDataStore.teachers[existingIdx].id || newTeacher.id,
      };
      newTeacher.id = examDataStore.teachers[existingIdx].id;
    } else {
      examDataStore.teachers.push(newTeacher);
    }
    saveDataStore();

    return res.json({
      success: true,
      message: 'Akun guru baru berhasil didaftarkan dan disimpan ke sistem CBT!',
      teacher: newTeacher,
      teachers: examDataStore.teachers,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Gagal mendaftar guru' });
  }
});

app.get('/api/data/question-banks', (req, res) => {
  return res.json({ success: true, questionBanks: examDataStore.questionBanks });
});

app.get('/api/data/question-banks/:id', (req, res) => {
  const bank = examDataStore.questionBanks.find((b) => b.id === req.params.id);
  if (bank) {
    return res.json({ success: true, bank });
  }
  return res.status(404).json({ success: false, error: 'Bank soal tidak ditemukan' });
});

app.post('/api/data/question-banks', (req, res) => {
  try {
    const bank = req.body || {};
    if (!bank.id) {
      bank.id = `BANK-${Date.now()}`;
    }
    if (!Array.isArray(examDataStore.questionBanks)) {
      examDataStore.questionBanks = [];
    }
    const existingIdx = examDataStore.questionBanks.findIndex((b) => b.id === bank.id);
    if (existingIdx >= 0) {
      examDataStore.questionBanks[existingIdx] = bank;
    } else {
      examDataStore.questionBanks.push(bank);
    }
    saveDataStore();
    syncToGasWebhook('backupAllData', { payload: examDataStore });
    return res.json({ success: true, bank });
  } catch (err: any) {
    console.error('Error saving question bank in server:', err);
    return res.status(500).json({ success: false, error: err.message || 'Gagal menyimpan bank soal' });
  }
});

app.delete('/api/data/question-banks/:id', (req, res) => {
  try {
    if (Array.isArray(examDataStore.questionBanks)) {
      examDataStore.questionBanks = examDataStore.questionBanks.filter((b) => b.id !== req.params.id);
    }
    saveDataStore();
    syncToGasWebhook('backupAllData', { payload: examDataStore });
    return res.json({ success: true, message: 'Bank soal berhasil dihapus.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Gagal menghapus bank soal' });
  }
});

app.get('/api/data/exam-sessions', (req, res) => {
  return res.json({ success: true, examSessions: examDataStore.examSessions });
});

app.get('/api/data/exam-sessions/check/:token', (req, res) => {
  const token = String(req.params.token || '').trim().toUpperCase();
  const norm = token.replace(/[-\s]/g, '');
  const session = examDataStore.examSessions.find((s) => {
    const code = String(s.sessionCode || '').trim().toUpperCase();
    return code === token || code.replace(/[-\s]/g, '') === norm;
  });
  if (session) {
    return res.json({ success: true, session });
  }
  return res.status(404).json({ success: false, error: `Sesi ujian dengan token "${token}" tidak ditemukan` });
});

app.post('/api/data/exam-sessions', (req, res) => {
  try {
    const session = req.body || {};
    if (!session.id) {
      session.id = `SES-${Date.now()}`;
    }
    if (!Array.isArray(examDataStore.examSessions)) {
      examDataStore.examSessions = [];
    }
    const existingIdx = examDataStore.examSessions.findIndex((s) => s.id === session.id);
    if (existingIdx >= 0) {
      examDataStore.examSessions[existingIdx] = session;
    } else {
      examDataStore.examSessions.push(session);
    }
    saveDataStore();
    syncToGasWebhook('backupAllData', { payload: examDataStore });
    return res.json({ success: true, session });
  } catch (err: any) {
    console.error('Error saving exam session in server:', err);
    return res.status(500).json({ success: false, error: err.message || 'Gagal menyimpan sesi ujian' });
  }
});

app.delete('/api/data/exam-sessions/:id', (req, res) => {
  try {
    if (Array.isArray(examDataStore.examSessions)) {
      examDataStore.examSessions = examDataStore.examSessions.filter((s) => s.id !== req.params.id);
    }
    saveDataStore();
    syncToGasWebhook('backupAllData', { payload: examDataStore });
    return res.json({ success: true, message: 'Sesi ujian berhasil dihapus.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Gagal menghapus sesi ujian' });
  }
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

  const cleanCode = String(sessionCode).trim().toUpperCase();
  const cleanId = String(studentId).trim();
  const key = `${cleanCode}_${cleanId}`;

  const pingRecord = {
    studentId: cleanId,
    studentName: studentName || 'Siswa',
    classId: classId || '-',
    sessionCode: cleanCode,
    currentQuestionIndex: Number(currentQuestionIndex) || 1,
    answeredCount: Number(answeredCount) || 0,
    totalQuestions: Number(totalQuestions) || 1,
    tabBlurCount: Number(tabBlurCount) || 0,
    device: device || 'Web Browser',
    batteryLevel,
    isOnline,
    lastPing: Date.now(),
    status: tabBlurCount > 2 ? 'warning' : 'active',
  };

  examDataStore.livePings[key] = pingRecord;

  // Background dispatch to GAS Webhook if configured
  if (examDataStore.gasWebhookUrl) {
    syncToGasWebhook('heartbeat', { payload: pingRecord });
  }

  return res.json({ success: true });
});

app.get('/api/proctor/live/:sessionCode', (req, res) => {
  const rawCode = (req.params.sessionCode || '').trim().toUpperCase();
  const now = Date.now();
  const list = Object.values(examDataStore.livePings)
    .filter((p: any) => {
      if (!rawCode || rawCode === 'ALL') return true;
      return String(p.sessionCode || '').trim().toUpperCase() === rawCode;
    })
    .map((p: any) => {
      // 45s heartbeat grace period for mobile/network jitter
      const isStillOnline = now - p.lastPing < 45000;
      return {
        ...p,
        isOnline: isStillOnline,
        status: !isStillOnline
          ? 'offline'
          : p.status === 'submitted'
          ? 'submitted'
          : p.tabBlurCount > 2
          ? 'warning'
          : 'active',
      };
    });

  return res.json({ success: true, liveList: list });
});

// GAS Full Database Sync Routes (Firebase Replacement)
app.post('/api/gas/pull-data', async (req, res) => {
  try {
    const targetUrl = (req.body?.url && String(req.body.url).trim()) || examDataStore.gasWebhookUrl;
    if (!targetUrl) {
      return res.status(400).json({ success: false, error: 'URL Google Apps Script belum dikonfigurasi.' });
    }
    const cleanUrl = targetUrl.includes('?') ? `${targetUrl}&action=getAllData` : `${targetUrl}?action=getAllData`;
    const response = await fetch(cleanUrl, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });
    const result = await response.json();
    if (result && result.status === 'success') {
      if (Array.isArray(result.students) && result.students.length > 0) {
        examDataStore.students = result.students;
      }
      if (Array.isArray(result.teachers) && result.teachers.length > 0) {
        examDataStore.teachers = result.teachers;
      }
      if (Array.isArray(result.classes) && result.classes.length > 0) {
        examDataStore.classes = result.classes;
      }
      if (Array.isArray(result.subjects) && result.subjects.length > 0) {
        examDataStore.subjects = result.subjects;
      }
      if (Array.isArray(result.questionBanks) && result.questionBanks.length > 0) {
        examDataStore.questionBanks = result.questionBanks;
      }
      if (Array.isArray(result.examSessions) && result.examSessions.length > 0) {
        examDataStore.examSessions = result.examSessions;
      }
      if (result.schoolProfile && Object.keys(result.schoolProfile).length > 0) {
        examDataStore.schoolProfile = { ...examDataStore.schoolProfile, ...result.schoolProfile };
      }
      // Ensure NISN 1 is preserved
      if (!examDataStore.students.some((s) => String(s.nisn).trim() === '1')) {
        examDataStore.students.unshift({
          id: 'STD-000',
          nisn: '1',
          name: 'Siswa Percobaan (NISN 1)',
          classId: 'CLS-12A',
          gender: 'L',
        });
      }
      saveDataStore();
      return res.json({
        success: true,
        message: 'Seluruh data master berhasil ditarik dari Google Sheets!',
        data: examDataStore,
      });
    }
    return res.status(500).json({ success: false, error: 'Format data dari Google Apps Script tidak sesuai.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Gagal menarik data dari Google Sheets' });
  }
});

app.post('/api/gas/push-data', async (req, res) => {
  try {
    const targetUrl = (req.body?.url && String(req.body.url).trim()) || examDataStore.gasWebhookUrl;
    if (!targetUrl) {
      return res.status(400).json({ success: false, error: 'URL Google Apps Script belum dikonfigurasi.' });
    }
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'syncAllData',
        payload: examDataStore,
      }),
    });
    const result = await response.json();
    return res.json({
      success: true,
      message: 'Seluruh data CBT berhasil disinkronkan ke Google Sheets & Google Drive!',
      result,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Gagal sinkron data ke Google Sheets' });
  }
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
  try {
    const { url } = req.body || {};
    let cleanUrl = typeof url === 'string' ? url.trim().replace(/^["']+|["']+$/g, '') : '';
    if (cleanUrl.includes('script.google.com/macros/s/') && !cleanUrl.endsWith('/exec')) {
      if (cleanUrl.endsWith('/')) cleanUrl += 'exec';
      else cleanUrl += '/exec';
    }
    examDataStore.gasWebhookUrl = cleanUrl;
    saveDataStore();
    syncToGasWebhook('backupAllData', { payload: examDataStore });
    return res.json({ success: true, gasWebhookUrl: examDataStore.gasWebhookUrl });
  } catch (err: any) {
    return res.json({ success: false, error: err.message || 'Gagal menyimpan URL webhook' });
  }
});

app.get('/api/gas/get-webhook', (_req, res) => {
  return res.json({ success: true, gasWebhookUrl: examDataStore.gasWebhookUrl || '' });
});

app.post('/api/gas/test-connection', async (req, res) => {
  const { url } = req.body || {};
  if (!url || typeof url !== 'string' || !url.trim()) {
    return res.json({ success: false, error: 'URL Google Apps Script wajib diisi.' });
  }

  let cleanUrl = url.trim().replace(/^["']+|["']+$/g, '');

  // Auto-prepend https if omitted
  if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
    cleanUrl = 'https://' + cleanUrl;
  }

  // Detect script editor URL
  if (cleanUrl.includes('/edit') || cleanUrl.includes('/d/')) {
    return res.json({
      success: false,
      error: 'URL yang Anda masukkan adalah URL Editor script (/edit), bukan URL Web App (/exec). Harap deploy sebagai Web App (Deploy -> New deployment -> Web app -> Anyone) lalu salin URL yang berakhiran /exec.',
    });
  }

  // Detect test/dev URL
  if (cleanUrl.endsWith('/dev') || cleanUrl.includes('/dev')) {
    return res.json({
      success: false,
      error: 'URL yang Anda masukkan adalah URL mode dev (/dev). URL ini hanya dapat diakses saat login di Google. Harap buat New Deployment -> Web App -> Who has access: Anyone, lalu salin URL berakhiran /exec.',
    });
  }

  // Auto append /exec if user omitted it
  if (cleanUrl.includes('script.google.com/macros/s/') && !cleanUrl.endsWith('/exec')) {
    if (cleanUrl.endsWith('/')) {
      cleanUrl += 'exec';
    } else {
      cleanUrl += '/exec';
    }
  }

  // Helper function to diagnose error messages from Google
  const diagnoseGoogleError = (text: string) => {
    const lower = text.toLowerCase();
    if (
      lower.includes('the page could not be found') ||
      lower.includes('the page cannot be found') ||
      lower.includes('page not found') ||
      lower.includes('sorry, the file you have requested does not exist') ||
      lower.includes('file does not exist')
    ) {
      return 'URL Web App tidak ditemukan di Google Apps Script (Error 404). Pastikan Anda telah membuat deployment baru di script.google.com (Deploy ➔ New deployment ➔ Web app ➔ Anyone) dan URL lengkap disalin hingga akhiran /exec.';
    }
    if (
      lower.includes('sign in') ||
      lower.includes('google accounts') ||
      lower.includes('servicelogin') ||
      lower.includes('accounts.google.com')
    ) {
      return 'Google memblokir akses publik (meminta login akun). Pada jendela Deploy di script.google.com, pastikan pengaturan "Who has access" (Siapa yang memiliki akses) diatur ke "Anyone" (Siapa saja, bahkan tanpa akun Google).';
    }
    if (lower.includes('script function not found') || lower.includes('exception:')) {
      return 'Script Google Apps Script mengalami kesalahan fungsi. Pastikan Anda telah menyalin seluruh isi kode Code.gs dari tombol "Salin Script" di EduCBT dan menempelkannya di script.google.com.';
    }
    return `Google Script mengembalikan respon bukan JSON: ${text.substring(0, 120)}`;
  };

  let lastErrorText = '';

  // 1. Try GET ping first
  try {
    const pingUrl = cleanUrl + (cleanUrl.includes('?') ? '&action=ping' : '?action=ping');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const fetchRes = await fetch(pingUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'User-Agent': 'Mozilla/5.0 (EduCBT Pro Cloud Tester)',
      },
      redirect: 'follow',
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const text = await fetchRes.text();
    lastErrorText = text;

    try {
      const data = JSON.parse(text);
      examDataStore.gasWebhookUrl = cleanUrl;
      return res.json({
        success: true,
        message: 'Terhubung dengan Google Apps Script Web App! Folder dan spreadsheet di GDrive siap digunakan.',
        normalizedUrl: cleanUrl,
        data,
      });
    } catch {
      // If not JSON, proceed to POST attempt below
    }
  } catch (err: any) {
    if (err.name !== 'AbortError') {
      lastErrorText = err.message || '';
    }
  }

  // 2. Try POST ping as fallback (for scripts that only support doPost)
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 9000);

    const postRes = await fetch(cleanUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/plain, */*',
      },
      body: JSON.stringify({ action: 'ping' }),
      redirect: 'follow',
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const postText = await postRes.text();
    lastErrorText = postText;

    try {
      const data = JSON.parse(postText);
      examDataStore.gasWebhookUrl = cleanUrl;
      return res.json({
        success: true,
        message: 'Terhubung dengan Google Apps Script Web App via POST! Folder dan spreadsheet di GDrive siap digunakan.',
        normalizedUrl: cleanUrl,
        data,
      });
    } catch {
      // Handled in diagnosis below
    }
  } catch (err: any) {
    if (err.name !== 'AbortError') {
      lastErrorText = err.message || lastErrorText;
    }
  }

  // Diagnose the failure
  const diagnostic = diagnoseGoogleError(lastErrorText || '');
  return res.json({
    success: false,
    error: diagnostic,
    normalizedUrl: cleanUrl,
  });
});

app.post('/api/gas/send-test-row', async (req, res) => {
  const { url } = req.body || {};
  const targetUrl = (url && typeof url === 'string' && url.trim()) || examDataStore.gasWebhookUrl;

  if (!targetUrl) {
    return res.json({ success: false, error: 'URL Google Apps Script belum ditentukan.' });
  }

  try {
    const testSubmission = {
      action: 'recordSubmission',
      submission: {
        id: 'TEST-' + Date.now().toString().slice(-4),
        sessionCode: 'SESI-UJI-COBA',
        studentId: 'NISN0000',
        studentName: 'Siswa Percobaan (Uji Koneksi)',
        studentClass: 'Uji Coba Cloud',
        totalScore: 100,
        maxPossibleScore: 100,
        scorePercentage: 100,
        isPassed: true,
        tabBlurCount: 0,
        durationTakenSeconds: 30,
        answers: { Q1: 'Koneksi Berhasil' },
      },
    };

    const fetchRes = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testSubmission),
      redirect: 'follow',
    });

    const text = await fetchRes.text();
    try {
      const data = JSON.parse(text);
      return res.json({
        success: true,
        message: 'Baris data tes berhasil dikirim ke spreadsheet EduCBT_Master_Database di Google Drive!',
        data,
      });
    } catch {
      return res.json({
        success: false,
        error: 'Data terkirim namun Google Apps Script mengembalikan respon bukan JSON: ' + text.substring(0, 100),
      });
    }
  } catch (err: any) {
    return res.json({ success: false, error: `Gagal mengirim data tes: ${err.message}` });
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
