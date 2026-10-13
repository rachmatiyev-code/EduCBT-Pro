import { QuestionBank, ExamSession } from '../types/cbt';

export const DEFAULT_PANCASILA_BANK: QuestionBank = {
  id: 'BANK-PP-01',
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
  createdAt: '2026-01-10T08:00:00.000Z',
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
        'E. Hak asasi manusia tidak berlaku bagi kelompok minoritas dalam masyarakat',
      ],
      correctAnswer: 'A',
      explanation:
        'Sila kedua Pancasila menjamin penghormatan atas harkat, martabat, dan hak asasi setiap warga negara secara adil dan beradab tanpa perlakuan diskriminatif.',
      points: 20,
      cognitiveLevel: 'C3',
      difficulty: 'medium',
      topicMaterial: 'Nilai-Nilai Luhur Pancasila dalam Kehidupan Berbangsa',
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
        'D. Menghalangi hak orang lain demi memperoleh keuntungan pribadi secara sepihak',
      ],
      correctAnswer: ['A', 'C'],
      explanation:
        'Jawaban A dan C mencerminkan sikap gotong royong, kepedulian sosial, dan keadilan yang selaras dengan nilai-nilai Pancasila.',
      points: 20,
      cognitiveLevel: 'C4',
      difficulty: 'medium',
      topicMaterial: 'Implementasi Gotong Royong dan Keadilan Sosial',
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
        { left: 'Sila 5: Keadilan Sosial bagi Seluruh Rakyat Indonesia', right: 'Padi dan Kapas' },
      ],
      correctAnswer: {
        'Sila 1: Ketuhanan Yang Maha Esa': 'Bintang Emas',
        'Sila 2: Kemanusiaan yang Adil dan Beradab': 'Rantai Emas',
        'Sila 3: Persatuan Indonesia': 'Pohon Beringin',
        'Sila 4: Kerakyatan yang Dipimpin oleh Hikmat Kebijaksanaan': 'Kepala Banteng',
        'Sila 5: Keadilan Sosial bagi Seluruh Rakyat Indonesia': 'Padi dan Kapas',
      },
      explanation:
        'Perisai Garuda Pancasila memuat lima lambang sila: Bintang (Sila 1), Rantai Emas (Sila 2), Pohon Beringin (Sila 3), Kepala Banteng (Sila 4), serta Padi dan Kapas (Sila 5).',
      points: 20,
      cognitiveLevel: 'C2',
      difficulty: 'easy',
      topicMaterial: 'Simbol dan Makna Lambang Negara Garuda Pancasila',
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
      topicMaterial: 'Kedudukan Pancasila sebagai Ideologi Terbuka',
    },
    {
      id: 'q-pp-5',
      number: 5,
      type: 'essay',
      question:
        'Jelaskan bagaimana generasi muda Indonesia dapat menerapkan dimensi "Berkebinekaan Global" dalam Profil Pelajar Pancasila di era kemajuan teknologi informasi saat ini!',
      correctAnswer:
        'Generasi muda dapat menerapkan kebinekaan global dengan cara: (1) Mengenal dan menghargai keberagaman budaya dunia dengan tetap mempertahankan identitas luhur budaya Indonesia; (2) Memiliki kemampuan komunikasi interkultural yang santun di media sosial; (3) Berpikir kritis dalam menyaring arus informasi global agar tidak terjerumus paham radikalisme atau berita bohong (hoaks).',
      explanation:
        'Pelajar yang berkebinekaan global mempertahankan budaya luhur, lokalitas, dan identitasnya, serta tetap berpikiran terbuka dalam berinteraksi dengan budaya lain.',
      points: 20,
      cognitiveLevel: 'C5',
      difficulty: 'hard',
      topicMaterial: 'Profil Pelajar Pancasila & Kebinekaan Global',
    },
  ],
};

export const DEFAULT_PANCASILA_SESSION: ExamSession = {
  id: 'SES-PP-01',
  bankId: 'BANK-PP-01',
  sessionCode: 'PP-01',
  title: 'Penilaian Sumatif Pendidikan Pancasila',
  targetClassIds: ['CLS-10A', 'CLS-11A', 'CLS-12A', 'CLS-SD1A', 'CLS-SD4A', 'CLS-SD6A'],
  startTime: '2026-01-01T00:00:00.000Z',
  endTime: '2026-12-31T23:59:59.000Z',
  durationMinutes: 60,
  shuffleQuestions: false,
  shuffleOptions: false,
  showResultInstant: true,
  antiCheatEnabled: true,
  maxTabSwitches: 3,
  status: 'active',
};

export const DEFAULT_SIMULASI_SESSION: ExamSession = {
  id: 'SES-001',
  bankId: 'BANK-001',
  sessionCode: 'CBT-2026',
  title: 'Penilaian Sumatif Akhir Semester - Bahasa Indonesia & Literasi',
  targetClassIds: ['CLS-10A', 'CLS-11A', 'CLS-12A', 'CLS-SD1A', 'CLS-SD4A', 'CLS-SD6A'],
  startTime: '2026-01-01T00:00:00.000Z',
  endTime: '2026-12-31T23:59:59.000Z',
  durationMinutes: 45,
  shuffleQuestions: false,
  shuffleOptions: false,
  showResultInstant: true,
  antiCheatEnabled: true,
  maxTabSwitches: 3,
  status: 'active',
};
