import React, { useState, useRef } from 'react';
import {
  Upload,
  Download,
  FileSpreadsheet,
  FileText,
  FileJson,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  X,
  Plus,
  RefreshCw,
  FolderArchive,
  Layers,
  Sparkles,
} from 'lucide-react';
import { QuestionBank, QuestionItem, QuestionType, Subject } from '../types/cbt';
import { api } from '../services/api';

interface QuestionImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeBank: QuestionBank | null;
  allBanks: QuestionBank[];
  subjects: Subject[];
  onRefreshData: () => void;
  onSelectBank?: (bank: QuestionBank) => void;
}

export const QuestionImportExportModal: React.FC<QuestionImportExportModalProps> = ({
  isOpen,
  onClose,
  activeBank,
  allBanks,
  subjects,
  onRefreshData,
  onSelectBank,
}) => {
  const [activeTab, setActiveTab] = useState<'import' | 'export' | 'template'>('import');
  const [importMode, setImportMode] = useState<'append' | 'new'>('append');
  const [targetBankId, setTargetBankId] = useState<string>(activeBank?.id || allBanks[0]?.id || '');
  const [newBankTitle, setNewBankTitle] = useState('');
  const [newBankSubjectId, setNewBankSubjectId] = useState(subjects[0]?.id || 'SUB-01');
  const [newBankGrade, setNewBankGrade] = useState('10');
  
  // File upload & paste input
  const [importText, setImportText] = useState('');
  const [parsedQuestions, setParsedQuestions] = useState<QuestionItem[]>([]);
  const [parseError, setParseError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [copiedType, setCopiedType] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // 1. Download Template Functions
  const generateCsvTemplate = () => {
    const headers = [
      'No',
      'Tipe_Soal',
      'Pertanyaan',
      'Opsi_A',
      'Opsi_B',
      'Opsi_C',
      'Opsi_D',
      'Opsi_E',
      'Kunci_Jawaban',
      'Poin',
      'Pembahasan',
      'Level_Kognitif',
      'Indikator_Soal',
    ];

    const sampleRows = [
      [
        '1',
        'multiple_choice',
        '"Teks wacana: Fotosintesis pada tumbuhan memerlukan klorofil, air, dan cahaya matahari untuk menghasilkan glukosa dan oksigen. Berdasarkan wacana tersebut, manakah hasil utama fotosintesis?"',
        '"Glukosa dan Oksigen"',
        '"Karbon dioksida dan Nitrogen"',
        '"Air dan Klorofil"',
        '"Garam mineral dan Tanah"',
        '"Cahaya matahari dan Udara"',
        '"A"',
        '20',
        '"Hasil reaksi fotosintesis adalah karbohidrat (glukosa) dan gas oksigen."',
        '"C2"',
        '"Mengidentifikasi hasil proses biokimia tumbuhan"',
      ],
      [
        '2',
        'multiple_select',
        '"Manakah di antara pernyataan berikut yang merupakan sifat dari zat cair? (Pilih semua yang benar)"',
        '"Bentuk mengikuti wadahnya"',
        '"Volume selalu tetap"',
        '"Jarak antarpartikel sangat renggang"',
        '"Dapat mengalir"',
        '"Partikelnya diam mutlak"',
        '"A,B,D"',
        '20',
        '"Zat cair memiliki bentuk mengikuti wadah, volume tetap, dan dapat mengalir."',
        '"C3"',
        '"Menganalisis sifat fisis wujud zat"',
      ],
      [
        '3',
        'true_false',
        '"Pancasila disahkan sebagai dasar negara Republik Indonesia oleh PPKI pada tanggal 18 Agustus 1945."',
        '"Benar"',
        '"Salah"',
        '""',
        '""',
        '""',
        '"Benar"',
        '20',
        '"UUD 1945 dan dasar negara Pancasila disahkan pada sidang PPKI 18 Agustus 1945."',
        '"C1"',
        '"Menyebutkan fakta sejarah kemerdekaan RI"',
      ],
      [
        '4',
        'short_answer',
        '"Alat pernapasan utama pada manusia yang berfungsi sebagai tempat pertukaran oksigen dan karbon dioksida di dalam paru-paru adalah..."',
        '""',
        '""',
        '""',
        '""',
        '""',
        '"Alveolus"',
        '20',
        '"Pertukaran difusi gas O2 dan CO2 berlangsung di kantung alveolus."',
        '"C1"',
        '"Menyebutkan organ sistem respirasi"',
      ],
      [
        '5',
        'essay',
        '"Jelaskan dampak kenaikan suhu global terhadap siklus hidrologi bumi dan ketersediaan air bersih di daerah tropis!"',
        '""',
        '""',
        '""',
        '""',
        '""',
        '"Kenaikan suhu memicu evaporasi berlebih, pola hujan ekstrim, kekeringan berkepanjangan, dan intrusi air laut."',
        '20',
        '"Rubrik: menyebutkan 3 dampak utama dengan penalaran ilmiah utuh bernilai maksimal."',
        '"C4"',
        '"Menganalisis fenomena perubahan iklim global"',
      ],
    ];

    const csvContent = [headers.join(','), ...sampleRows.map((r) => r.join(','))].join('\n');
    return csvContent;
  };

  const handleDownloadCsvTemplate = () => {
    const csvData = generateCsvTemplate();
    const blob = new Blob(['\uFEFF' + csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'template_soal_cbt_educbt.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadJsonTemplate = () => {
    const jsonTemplate = [
      {
        number: 1,
        type: 'multiple_choice',
        question: 'Tuliskan teks pertanyaan soal nomor 1 di sini...',
        options: ['A. Opsi pertama', 'B. Opsi kedua', 'C. Opsi ketiga', 'D. Opsi keempat', 'E. Opsi kelima'],
        correctAnswer: 'A',
        explanation: 'Penjelasan dan pembahasan kunci jawaban.',
        points: 20,
        cognitiveDomain: 'bloom',
        cognitiveLevel: 'C2',
        competencyIndicator: 'Menjelaskan konsep pokok materi',
      },
      {
        number: 2,
        type: 'multiple_select',
        question: 'Pilihlah semua jawaban yang tepat dari pernyataan berikut:',
        options: ['A. Pilihan benar 1', 'B. Pilihan benar 2', 'C. Pilihan salah', 'D. Pilihan benar 3'],
        correctAnswer: ['A', 'B', 'D'],
        explanation: 'Kunci jawaban pilihan ganda kompleks.',
        points: 20,
        cognitiveDomain: 'bloom',
        cognitiveLevel: 'C3',
        competencyIndicator: 'Menerapkan kaidah pada kasus nyata',
      },
      {
        number: 3,
        type: 'true_false',
        question: 'Tentukan kebenaran dari pernyataan berikut:\n"Matahari adalah pusat tata surya kita."',
        options: ['Benar', 'Salah'],
        correctAnswer: 'Benar',
        explanation: 'Teori heliosentris membuktikan matahari adalah pusat tata surya.',
        points: 20,
        cognitiveDomain: 'solo',
        cognitiveLevel: 'Unistructural',
        competencyIndicator: 'Mengidentifikasi fakta astronomi dasar',
      },
    ];

    const blob = new Blob([JSON.stringify(jsonTemplate, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'template_soal_cbt_educbt.json');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyTextTemplate = () => {
    const textTemplate = `No\tTipe_Soal\tPertanyaan\tOpsi_A\tOpsi_B\tOpsi_C\tOpsi_D\tOpsi_E\tKunci_Jawaban\tPoin\tLevel_Kognitif\tIndikator
1\tmultiple_choice\tApa ibu kota negara Indonesia pada masa proklamasi 1945?\tJakarta\tBandung\tYogyakarta\tSurabaya\tSolo\tA\t20\tC1\tMenyebutkan ibu kota proklamasi
2\tmultiple_select\tPilih planet yang termasuk planet dalam:\tMerkurius\tVenus\tJupiter\tBumi\tSaturnus\tA,B,D\t20\tC2\tMengelompokkan planet dalam
3\ttrue_false\tAir mendidih pada suhu 100 derajat Celsius pada tekanan 1 atmosfer.\tBenar\tSalah\t\t\t\tBenar\t20\tC1\tMemahami titik didih air`;

    navigator.clipboard.writeText(textTemplate);
    setCopiedType('tsv');
    setTimeout(() => setCopiedType(null), 2000);
  };

  // 2. Parse Text / File Input
  const parseRawQuestionsText = (text: string) => {
    setParseError('');
    setParsedQuestions([]);
    const clean = text.trim();
    if (!clean) return;

    // A. Check if JSON
    if (clean.startsWith('[') || clean.startsWith('{')) {
      try {
        const parsed = JSON.parse(clean);
        const list = Array.isArray(parsed)
          ? parsed
          : parsed.questions || parsed.data || parsed.items || [];
        if (!Array.isArray(list) || list.length === 0) {
          throw new Error('Data JSON tidak berisi array butir soal');
        }

        const normalized: QuestionItem[] = list.map((q: any, idx: number) => {
          const num = q.number || idx + 1;
          const qType: QuestionType = [
            'multiple_choice',
            'multiple_select',
            'true_false',
            'matching',
            'short_answer',
            'essay',
          ].includes(q.type)
            ? q.type
            : 'multiple_choice';

          return {
            id: q.id || `imp-${Date.now()}-${idx}`,
            number: num,
            type: qType,
            question: q.question || `Pertanyaan butir nomor ${num}`,
            options: Array.isArray(q.options)
              ? q.options
              : qType === 'multiple_choice'
              ? ['A. Opsi A', 'B. Opsi B', 'C. Opsi C', 'D. Opsi D']
              : undefined,
            correctAnswer: q.correctAnswer ?? (qType === 'multiple_choice' ? 'A' : 'Jawaban'),
            explanation: q.explanation || '',
            points: Number(q.points) || 10,
            cognitiveDomain: q.cognitiveDomain || 'bloom',
            cognitiveLevel: q.cognitiveLevel || 'C2',
            competencyIndicator: q.competencyIndicator || 'Materi pokok evaluasi',
            learningObjective: q.learningObjective || '',
          };
        });

        setParsedQuestions(normalized);
        return;
      } catch (err: any) {
        // Not valid JSON, continue to tabular / line parser
      }
    }

    // B. Parse Tabular (CSV, TSV, Semicolon)
    try {
      const lines = clean.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length === 0) return;

      const questions: QuestionItem[] = [];
      let startIdx = 0;

      // Check if header exists
      const firstLower = lines[0].toLowerCase();
      if (
        firstLower.includes('tipe') ||
        firstLower.includes('pertanyaan') ||
        firstLower.includes('opsi') ||
        firstLower.startsWith('no')
      ) {
        startIdx = 1;
      }

      for (let i = startIdx; i < lines.length; i++) {
        const line = lines[i];
        let cols: string[] = [];

        if (line.includes('\t')) {
          cols = line.split('\t');
        } else if (line.includes(';')) {
          cols = line.split(';');
        } else {
          // CSV with potential quotes
          const regex = /(?:,|\n|^)("(?:(?:"")*[^"]*)*"|[^",\n]*|(?:\n|$))/g;
          const matches = [...line.matchAll(regex)];
          cols = matches
            .map((m) => m[1])
            .filter((c) => c !== undefined)
            .map((c) => c.replace(/^"|"$/g, '').replace(/""/g, '"').trim());
        }

        cols = cols.map((c) => c ? c.trim().replace(/^"|"$/g, '') : '');
        if (cols.length < 2) continue;

        // Extract columns based on standard format:
        // Col 0: No
        // Col 1: Tipe Soal
        // Col 2: Pertanyaan
        // Col 3: Opsi A
        // Col 4: Opsi B
        // Col 5: Opsi C
        // Col 6: Opsi D
        // Col 7: Opsi E
        // Col 8: Kunci Jawaban
        // Col 9: Poin
        // Col 10: Pembahasan
        // Col 11: Level Kognitif
        // Col 12: Indikator Soal

        let qNumber = i - startIdx + 1;
        let qTypeRaw = cols[1] || cols[0];
        let qText = cols[2] || cols[1] || `Pertanyaan nomor ${qNumber}`;

        // Type sanitization
        let cleanType: QuestionType = 'multiple_choice';
        const typeLower = (qTypeRaw || '').toLowerCase();
        if (typeLower.includes('select') || typeLower.includes('kompleks') || typeLower.includes('pgk')) {
          cleanType = 'multiple_select';
        } else if (typeLower.includes('true') || typeLower.includes('benar') || typeLower.includes('salah')) {
          cleanType = 'true_false';
        } else if (typeLower.includes('match') || typeLower.includes('jodoh')) {
          cleanType = 'matching';
        } else if (typeLower.includes('short') || typeLower.includes('isian') || typeLower.includes('singkat')) {
          cleanType = 'short_answer';
        } else if (typeLower.includes('essay') || typeLower.includes('uraian')) {
          cleanType = 'essay';
        }

        // Options
        const rawOptions = [cols[3], cols[4], cols[5], cols[6], cols[7]].filter(
          (o) => o && o.trim().length > 0
        );
        let finalOptions: string[] | undefined = undefined;

        if (cleanType === 'multiple_choice' || cleanType === 'multiple_select') {
          finalOptions =
            rawOptions.length > 0
              ? rawOptions.map((opt, idx) => {
                  const prefix = String.fromCharCode(65 + idx) + '. ';
                  return opt.startsWith(prefix) ? opt : `${prefix}${opt}`;
                })
              : ['A. Opsi A', 'B. Opsi B', 'C. Opsi C', 'D. Opsi D'];
        } else if (cleanType === 'true_false') {
          finalOptions = ['Benar', 'Salah'];
        }

        // Correct Answer
        let rawAnswer: any = cols[8] || 'A';
        if (cleanType === 'multiple_select') {
          if (typeof rawAnswer === 'string' && rawAnswer.includes(',')) {
            rawAnswer = rawAnswer.split(',').map((x: string) => x.trim().toUpperCase());
          } else if (typeof rawAnswer === 'string') {
            rawAnswer = [rawAnswer.trim().toUpperCase()];
          }
        }

        const points = Number(cols[9]) || 10;
        const explanation = cols[10] || '';
        const cogLevel = cols[11] || 'C2';
        const indicator = cols[12] || 'Indikator capaian pembelajaran';

        questions.push({
          id: `imp-${Date.now()}-${qNumber}`,
          number: qNumber,
          type: cleanType,
          question: qText,
          options: finalOptions,
          correctAnswer: rawAnswer,
          explanation,
          points,
          cognitiveDomain: cogLevel.startsWith('C') ? 'bloom' : 'solo',
          cognitiveLevel: cogLevel,
          competencyIndicator: indicator,
        });
      }

      if (questions.length === 0) {
        throw new Error('Tidak ada baris butir soal valid yang dapat dikenali.');
      }

      setParsedQuestions(questions);
    } catch (err: any) {
      setParseError(
        'Gagal membaca format data: ' +
          (err.message || 'Pastikan format data sesuai dengan template CSV/JSON.')
      );
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setImportText(content);
      parseRawQuestionsText(content);
    };
    reader.readAsText(file);
  };

  // 3. Confirm Import to Bank
  const handleConfirmImport = async () => {
    if (parsedQuestions.length === 0 || isProcessing) return;
    setIsProcessing(true);
    setParseError('');

    try {
      if (importMode === 'append') {
        const target = allBanks.find((b) => b.id === targetBankId) || activeBank || allBanks[0];
        if (!target) {
          throw new Error('Pilih bank soal tujuan untuk menambahkan soal.');
        }

        const startNumber = target.questions.length;
        const renumbered = parsedQuestions.map((q, idx) => ({
          ...q,
          number: startNumber + idx + 1,
          id: `q-imp-${Date.now()}-${idx}`,
        }));

        const updatedBank: QuestionBank = {
          ...target,
          questions: [...target.questions, ...renumbered],
          totalQuestions: target.questions.length + renumbered.length,
          updatedAt: new Date().toISOString(),
        };

        await api.saveQuestionBank(updatedBank);
        if (onSelectBank) onSelectBank(updatedBank);
        setSuccessMsg(
          `Berhasil mengimpor ${renumbered.length} butir soal ke bank "${updatedBank.title}"!`
        );
      } else {
        // Create new bank
        const title = newBankTitle.trim() || `Bank Soal Impor - ${new Date().toLocaleDateString('id-ID')}`;
        const newBank: QuestionBank = {
          id: `BANK-${Date.now()}`,
          title,
          subjectId: newBankSubjectId,
          gradeLevel: newBankGrade,
          teacherId: 'T01',
          totalQuestions: parsedQuestions.length,
          durationMinutes: Math.min(parsedQuestions.length * 3, 90),
          passingScore: 75,
          questions: parsedQuestions,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        await api.saveQuestionBank(newBank);
        if (onSelectBank) onSelectBank(newBank);
        setSuccessMsg(
          `Berhasil membuat Bank Soal Baru "${newBank.title}" dengan ${parsedQuestions.length} butir soal!`
        );
      }

      onRefreshData();
      setTimeout(() => {
        onClose();
        setSuccessMsg('');
        setParsedQuestions([]);
        setImportText('');
      }, 1800);
    } catch (err: any) {
      setParseError('Gagal menyimpan soal ke database: ' + (err.message || 'Terjadi kesalahan sistem'));
    } finally {
      setIsProcessing(false);
    }
  };

  // 4. Export Functions
  const handleExportJson = (bank: QuestionBank) => {
    const exportData = {
      bankMeta: {
        id: bank.id,
        title: bank.title,
        subjectId: bank.subjectId,
        gradeLevel: bank.gradeLevel,
        durationMinutes: bank.durationMinutes,
        passingScore: bank.passingScore,
        totalQuestions: bank.questions.length,
        exportedAt: new Date().toISOString(),
        app: 'EduCBT Pro Cloud',
      },
      questions: bank.questions,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${bank.title.replace(/[\s/\\?%*:|"<>]/g, '_')}_soal.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportCsv = (bank: QuestionBank) => {
    const headers = [
      'No',
      'Tipe_Soal',
      'Pertanyaan',
      'Opsi_A',
      'Opsi_B',
      'Opsi_C',
      'Opsi_D',
      'Opsi_E',
      'Kunci_Jawaban',
      'Poin',
      'Pembahasan',
      'Level_Kognitif',
      'Indikator_Soal',
    ];

    const rows = bank.questions.map((q, idx) => {
      const cleanQ = `"${(q.question || '').replace(/"/g, '""')}"`;
      const optA = q.options && q.options[0] ? `"${q.options[0].replace(/"/g, '""')}"` : '""';
      const optB = q.options && q.options[1] ? `"${q.options[1].replace(/"/g, '""')}"` : '""';
      const optC = q.options && q.options[2] ? `"${q.options[2].replace(/"/g, '""')}"` : '""';
      const optD = q.options && q.options[3] ? `"${q.options[3].replace(/"/g, '""')}"` : '""';
      const optE = q.options && q.options[4] ? `"${q.options[4].replace(/"/g, '""')}"` : '""';
      const answer = Array.isArray(q.correctAnswer)
        ? `"${q.correctAnswer.join(',')}"`
        : `"${String(q.correctAnswer || '').replace(/"/g, '""')}"`;
      const points = q.points || 10;
      const expl = `"${(q.explanation || '').replace(/"/g, '""')}"`;
      const cog = `"${q.cognitiveLevel || 'C2'}"`;
      const ind = `"${(q.competencyIndicator || '').replace(/"/g, '""')}"`;

      return [
        idx + 1,
        q.type || 'multiple_choice',
        cleanQ,
        optA,
        optB,
        optC,
        optD,
        optE,
        answer,
        points,
        expl,
        cog,
        ind,
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${bank.title.replace(/[\s/\\?%*:|"<>]/g, '_')}_soal.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const currentExportBank = activeBank || allBanks[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">Impor, Ekspor & Template Butir Soal</h2>
              <p className="text-xs text-slate-400">
                Pusat pertukaran data bank soal (Excel CSV, JSON, TSV, dan Kurikulum Merdeka)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
          <button
            onClick={() => setActiveTab('import')}
            className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'import'
                ? 'bg-white text-indigo-700 border-t-2 border-indigo-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Impor Soal (Excel/JSON/Teks)</span>
          </button>

          <button
            onClick={() => setActiveTab('export')}
            className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'export'
                ? 'bg-white text-indigo-700 border-t-2 border-indigo-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Ekspor Bank Soal</span>
          </button>

          <button
            onClick={() => setActiveTab('template')}
            className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'template'
                ? 'bg-white text-indigo-700 border-t-2 border-indigo-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Download Template Soal</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {successMsg && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {parseError && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{parseError}</span>
            </div>
          )}

          {/* TAB 1: IMPOR SOAL */}
          {activeTab === 'import' && (
            <div className="space-y-5">
              {/* Target Bank Selection */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Target Penyimpanan Soal
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label
                    className={`p-3 rounded-xl border text-xs cursor-pointer flex items-start gap-2.5 transition-all ${
                      importMode === 'append'
                        ? 'bg-indigo-50/50 border-indigo-300 font-bold text-indigo-950'
                        : 'bg-white border-slate-200 text-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'append'}
                      onChange={() => setImportMode('append')}
                      className="mt-0.5 accent-indigo-600"
                    />
                    <div>
                      <span>Tambahkan ke Bank Soal yang Ada</span>
                      <p className="text-[11px] font-normal text-slate-500 mt-0.5">
                        Menambahkan butir soal baru ke bank yang telah dibuat
                      </p>
                    </div>
                  </label>

                  <label
                    className={`p-3 rounded-xl border text-xs cursor-pointer flex items-start gap-2.5 transition-all ${
                      importMode === 'new'
                        ? 'bg-indigo-50/50 border-indigo-300 font-bold text-indigo-950'
                        : 'bg-white border-slate-200 text-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'new'}
                      onChange={() => setImportMode('new')}
                      className="mt-0.5 accent-indigo-600"
                    />
                    <div>
                      <span>Buat Bank Soal Baru</span>
                      <p className="text-[11px] font-normal text-slate-500 mt-0.5">
                        Otomatis membuat bank baru dari data yang diimpor
                      </p>
                    </div>
                  </label>
                </div>

                {importMode === 'append' ? (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Pilih Bank Soal Tujuan
                    </label>
                    <select
                      value={targetBankId}
                      onChange={(e) => setTargetBankId(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-indigo-500"
                    >
                      {allBanks.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.title} ({b.questions.length} Butir Soal)
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                        Judul Bank Soal Baru
                      </label>
                      <input
                        type="text"
                        value={newBankTitle}
                        onChange={(e) => setNewBankTitle(e.target.value)}
                        placeholder="Contoh: Penilaian Sumatif Akhir Tahun - Kimia"
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                        Mata Pelajaran
                      </label>
                      <select
                        value={newBankSubjectId}
                        onChange={(e) => setNewBankSubjectId(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold"
                      >
                        {subjects.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Upload File Drag & Drop Box */}
              <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center hover:border-indigo-400 transition-colors bg-slate-50/50">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".csv,.json,.tsv,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Upload className="w-8 h-8 text-indigo-500 mx-auto mb-2" />
                <h4 className="font-bold text-slate-800 text-sm">Upload File Soal (.CSV, .JSON, .TSV)</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-3">
                  Pilih file spreadsheet CSV yang sudah diisi atau format JSON backup bank soal
                </p>
                <div className="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-xs transition-all"
                  >
                    Pilih File dari Komputer
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('template')}
                    className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold cursor-pointer shadow-2xs transition-all"
                  >
                    Download Template Dulu
                  </button>
                </div>
              </div>

              {/* Direct Text Paste Option */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Atau Tempel (Paste) Teks Soal / JSON Langsung di Bawah:
                  </label>
                  {importText && (
                    <button
                      type="button"
                      onClick={() => {
                        setImportText('');
                        setParsedQuestions([]);
                      }}
                      className="text-xs text-rose-600 hover:underline"
                    >
                      Bersihkan
                    </button>
                  )}
                </div>
                <textarea
                  rows={4}
                  value={importText}
                  onChange={(e) => {
                    setImportText(e.target.value);
                    parseRawQuestionsText(e.target.value);
                  }}
                  placeholder="Paste tabel dari Excel/Spreadsheet atau teks JSON di sini..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-800 focus:outline-indigo-500"
                />
              </div>

              {/* Parsed Questions Preview */}
              {parsedQuestions.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>
                        Pratinjau Butir Soal Terdeteksi ({parsedQuestions.length} Butir)
                      </span>
                    </h4>
                    <span className="text-xs text-slate-500">
                      Total Poin: {parsedQuestions.reduce((sum, q) => sum + (q.points || 0), 0)}
                    </span>
                  </div>

                  <div className="max-h-60 overflow-y-auto space-y-2 border border-slate-200 rounded-xl p-3 bg-white divide-y divide-slate-100">
                    {parsedQuestions.map((q, idx) => (
                      <div key={idx} className="pt-2 first:pt-0 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-[10px]">
                              {idx + 1}
                            </span>
                            <span className="font-semibold uppercase text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">
                              {((q.type || 'multiple_choice') as string).replace(/_/g, ' ')}
                            </span>
                            <span className="text-slate-500 font-mono">({q.points || 10} Poin)</span>
                            {q.cognitiveLevel && (
                              <span className="px-1.5 py-0.2 bg-amber-50 text-amber-800 rounded font-bold text-[10px]">
                                {q.cognitiveLevel}
                              </span>
                            )}
                          </div>
                          <span className="font-semibold text-emerald-700">
                            Kunci: {typeof q.correctAnswer === 'object' ? JSON.stringify(q.correctAnswer) : String(q.correctAnswer)}
                          </span>
                        </div>
                        <p className="text-slate-800 font-medium line-clamp-2">{q.question}</p>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleConfirmImport}
                    disabled={isProcessing}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Menyimpan Soal ke Database...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>
                          Simpan {parsedQuestions.length} Butir Soal ke Bank Sekarang
                        </span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: EKSPOR BANK SOAL */}
          {activeTab === 'export' && (
            <div className="space-y-5">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Pilih Bank Soal yang Ingin Diekspor
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {allBanks.map((b) => {
                    const isSelected = (currentExportBank?.id === b.id);
                    return (
                      <div
                        key={b.id}
                        onClick={() => {
                          if (onSelectBank) onSelectBank(b);
                        }}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-indigo-50 border-indigo-400 shadow-2xs'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-xs text-slate-800">{b.title}</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                            {b.questions.length} Butir
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          Durasi: {b.durationMinutes} mnt • KKM: {b.passingScore}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {currentExportBank && (
                <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">{currentExportBank.title}</h4>
                      <p className="text-xs text-slate-500">
                        Total {currentExportBank.questions.length} butir soal siap diekspor
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Export to CSV / Excel */}
                    <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs uppercase tracking-wider">
                          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                          <span>Format Excel / CSV</span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">
                          File tabular (.csv) yang kompatibel dengan Microsoft Excel, Google Sheets, dan LibreOffice Calc.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleExportCsv(currentExportBank)}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer transition-all"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download File .CSV Excel</span>
                      </button>
                    </div>

                    {/* Export to JSON */}
                    <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/40 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-center gap-2 text-indigo-800 font-bold text-xs uppercase tracking-wider">
                          <FileJson className="w-4 h-4 text-indigo-600" />
                          <span>Format JSON Lengkap</span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">
                          File data JSON berstruktur penuh beserta kunci jawaban, taksonomi, media, dan relasi butir soal.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleExportJson(currentExportBank)}
                        className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer transition-all"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download File .JSON</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: DOWNLOAD TEMPLATE SOAL */}
          {activeTab === 'template' && (
            <div className="space-y-5">
              <div className="bg-linear-to-r from-indigo-50 via-blue-50 to-indigo-50 p-5 rounded-2xl border border-indigo-200 space-y-2">
                <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>Panduan & Format Template Soal EduCBT</span>
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Gunakan template di bawah ini untuk menyusun soal secara offline di komputer Anda. Setelah selesai diisi, unggah kembali file tersebut melalui tab <strong>"Impor Soal"</strong> untuk langsung digunakan dalam ujian.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* 1. CSV Template */}
                <div className="p-4 rounded-xl border border-slate-200 bg-white hover:border-emerald-300 transition-all flex flex-col justify-between space-y-3 shadow-xs">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs mb-3">
                      CSV
                    </div>
                    <h5 className="font-bold text-slate-800 text-xs">Template Excel (.CSV)</h5>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Dilengkapi contoh 5 tipe soal, opsi A–E, kolom poin, kunci, dan level kognitif.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadCsvTemplate}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Template CSV</span>
                  </button>
                </div>

                {/* 2. JSON Template */}
                <div className="p-4 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 transition-all flex flex-col justify-between space-y-3 shadow-xs">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold text-xs mb-3">
                      JSON
                    </div>
                    <h5 className="font-bold text-slate-800 text-xs">Template File (.JSON)</h5>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Struktur array objek JSON dengan atribut komprehensif taksonomi dan rubrik.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadJsonTemplate}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Template JSON</span>
                  </button>
                </div>

                {/* 3. Text TSV Copy */}
                <div className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all flex flex-col justify-between space-y-3 shadow-xs">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center font-bold text-xs mb-3">
                      TSV
                    </div>
                    <h5 className="font-bold text-slate-800 text-xs">Salin Teks Tabel</h5>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Salin format baris teks terpisah tab langsung ke clipboard Anda.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyTextTemplate}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    {copiedType === 'tsv' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Tersalin ke Clipboard!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin Contoh Teks</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Column Descriptions */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                <h5 className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                  Keterangan Kolom Template:
                </h5>
                <ul className="list-disc list-inside space-y-1 text-slate-600 text-[11px]">
                  <li><strong>Tipe_Soal</strong>: multiple_choice (Pilihan Ganda), multiple_select (Pilihan Ganda Kompleks), true_false (Benar/Salah), matching (Menjodohkan), short_answer (Isian Singkat), essay (Uraian).</li>
                  <li><strong>Opsi_A s/d Opsi_E</strong>: Opsi jawaban pilihan ganda. Boleh dikosongkan untuk isian singkat atau uraian.</li>
                  <li><strong>Kunci_Jawaban</strong>: Huruf pilihan ('A'), kumpulan huruf untuk PGK ('A,C'), 'Benar'/'Salah', atau teks jawaban tepat.</li>
                  <li><strong>Level_Kognitif</strong>: Opsi Taksonomi Bloom (C1, C2, C3, C4, C5, C6) atau SOLO (Unistructural, Multistructural, Relational, Extended Abstract).</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
