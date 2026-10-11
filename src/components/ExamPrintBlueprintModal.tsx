import React, { useState } from 'react';
import {
  Printer,
  Download,
  FileText,
  Layers,
  BookOpen,
  CheckCircle2,
  X,
  Sliders,
  Sparkles,
  HelpCircle,
  FileSpreadsheet,
  Award,
} from 'lucide-react';
import { QuestionBank, QuestionItem, SchoolProfile, Teacher } from '../types/cbt';
import { api } from '../services/api';

interface ExamPrintBlueprintModalProps {
  isOpen: boolean;
  onClose: () => void;
  bank: QuestionBank;
  schoolProfile: SchoolProfile;
  teachers: Teacher[];
  onRefreshData?: () => void;
}

export const ExamPrintBlueprintModal: React.FC<ExamPrintBlueprintModalProps> = ({
  isOpen,
  onClose,
  bank,
  schoolProfile,
  teachers,
  onRefreshData,
}) => {
  const [activeTab, setActiveTab] = useState<'paper' | 'blueprint'>('paper');
  const [taxonomyOption, setTaxonomyOption] = useState<'bloom' | 'solo'>(
    bank.taxonomyType || 'bloom'
  );
  const [includeAnswerKey, setIncludeAnswerKey] = useState(false);
  const [includeLjkSheet, setIncludeLjkSheet] = useState(false);
  const [twoColumnLayout, setTwoColumnLayout] = useState(false);

  // Editable local questions for kisi-kisi customization
  const [editableQuestions, setEditableQuestions] = useState<QuestionItem[]>(() => {
    return bank.questions.map((q, idx) => ({
      ...q,
      cognitiveDomain: q.cognitiveDomain || 'bloom',
      cognitiveLevel:
        q.cognitiveLevel ||
        (taxonomyOption === 'bloom' ? (idx % 3 === 0 ? 'C2' : idx % 3 === 1 ? 'C3' : 'C4') : 'Relational'),
      competencyIndicator:
        q.competencyIndicator || `Menganalisis konsep butir soal nomor ${idx + 1}`,
      learningObjective:
        q.learningObjective || `Memahami capaian kompetensi dasar materi pembelajaran`,
      topicMaterial: q.topicMaterial || bank.title,
    }));
  });

  const [isSavingTaxonomy, setIsSavingTaxonomy] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState(false);

  if (!isOpen) return null;

  const currentTeacher =
    teachers.find((t) => t.id === bank.teacherId) ||
    teachers[0] || {
      name: 'Guru Mata Pelajaran, S.Pd.',
      nip: '19850101 201001 1 002',
    };

  // Helper for Bloom Levels description
  const getBloomLabel = (level?: string) => {
    switch (level) {
      case 'C1':
        return 'C1 (Mengingat - LOTS)';
      case 'C2':
        return 'C2 (Memahami - LOTS)';
      case 'C3':
        return 'C3 (Menerapkan - MOTS)';
      case 'C4':
        return 'C4 (Menganalisis - HOTS)';
      case 'C5':
        return 'C5 (Mengevaluasi - HOTS)';
      case 'C6':
        return 'C6 (Mencipta - HOTS)';
      default:
        return level || 'C2 (Memahami)';
    }
  };

  // Helper for SOLO Levels description
  const getSoloLabel = (level?: string) => {
    switch (level) {
      case 'Prestructural':
        return 'Prestructural (Pra-struktural)';
      case 'Unistructural':
        return 'Unistructural (Satu Fakta/Konsep)';
      case 'Multistructural':
        return 'Multistructural (Banyak Aspek Mandiri)';
      case 'Relational':
        return 'Relational (Terhubung Terpadu - HOTS)';
      case 'Extended Abstract':
        return 'Extended Abstract (Generalisasi Konseptual - HOTS)';
      default:
        return level || 'Relational (Terhubung)';
    }
  };

  // Update a specific question's taxonomy data
  const handleUpdateQuestionTaxonomy = (
    idx: number,
    field: keyof QuestionItem,
    value: any
  ) => {
    const updated = [...editableQuestions];
    updated[idx] = {
      ...updated[idx],
      [field]: value,
    };
    setEditableQuestions(updated);
  };

  // Save changes to backend question bank
  const handleSaveTaxonomyChanges = async () => {
    setIsSavingTaxonomy(true);
    try {
      const updatedBank: QuestionBank = {
        ...bank,
        taxonomyType: taxonomyOption,
        questions: editableQuestions,
        updatedAt: new Date().toISOString(),
      };
      await api.saveQuestionBank(updatedBank);
      setSavedFeedback(true);
      if (onRefreshData) onRefreshData();
      setTimeout(() => setSavedFeedback(false), 3000);
    } catch (err: any) {
      alert('Gagal menyimpan perubahan kisi-kisi: ' + err.message);
    } finally {
      setIsSavingTaxonomy(false);
    }
  };

  // Calculate Cognitive Distribution Stats
  const calculateDistribution = () => {
    if (taxonomyOption === 'bloom') {
      let lots = 0;
      let mots = 0;
      let hots = 0;
      editableQuestions.forEach((q) => {
        const lvl = q.cognitiveLevel || 'C2';
        if (lvl === 'C1' || lvl === 'C2') lots++;
        else if (lvl === 'C3') mots++;
        else hots++;
      });
      const total = editableQuestions.length || 1;
      return {
        lots,
        mots,
        hots,
        lotsPct: Math.round((lots / total) * 100),
        motsPct: Math.round((mots / total) * 100),
        hotsPct: Math.round((hots / total) * 100),
      };
    } else {
      let uni = 0;
      let multi = 0;
      let rel = 0;
      let ext = 0;
      editableQuestions.forEach((q) => {
        const lvl = q.cognitiveLevel || 'Relational';
        if (lvl === 'Unistructural' || lvl === 'Prestructural') uni++;
        else if (lvl === 'Multistructural') multi++;
        else if (lvl === 'Relational') rel++;
        else ext++;
      });
      const total = editableQuestions.length || 1;
      return {
        uni,
        multi,
        rel,
        ext,
        uniPct: Math.round((uni / total) * 100),
        multiPct: Math.round((multi / total) * 100),
        relPct: Math.round((rel / total) * 100),
        extPct: Math.round((ext / total) * 100),
      };
    }
  };

  const dist = calculateDistribution();

  // Print Action
  const handlePrint = () => {
    window.print();
  };

  // Download HTML Document Action
  const handleDownloadDoc = () => {
    const printableArea = document.getElementById('printable-exam-document');
    if (!printableArea) return;

    const htmlContent = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<title>${activeTab === 'paper' ? 'Naskah_Soal' : 'Kisi_Kisi'}_${bank.title.replace(/[\s/\\?%*:|"<>]/g, '_')}</title>
<style>
  body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.4; color: #000; padding: 20px; }
  h1, h2, h3, h4 { margin: 0; padding: 0; text-align: center; }
  .kop { border-bottom: 3px double #000; padding-bottom: 8px; margin-bottom: 16px; text-align: center; }
  .table-bordered { width: 100%; border-collapse: collapse; margin-top: 10px; }
  .table-bordered th, .table-bordered td { border: 1px solid #000; padding: 6px 8px; font-size: 10pt; }
  .question-item { margin-bottom: 14px; page-break-inside: avoid; }
  .options { margin-left: 20px; }
  @media print { @page { margin: 1.5cm; } }
</style>
</head>
<body>
${printableArea.innerHTML}
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `${activeTab === 'paper' ? 'Naskah_Soal' : 'Kisi_Kisi'}_${bank.title.replace(/[\s/\\?%*:|"<>]/g, '_')}.html`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[94vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header (Hidden on print) */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-indigo-600 to-blue-600 text-white flex items-center justify-center shadow-xs">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">
                Cetak & Download Naskah Soal & Kisi-Kisi Ujian
              </h2>
              <p className="text-xs text-slate-400">
                Mendukung standar resmi Kop Sekolah, Taksonomi Bloom-Anderson dan Taksonomi SOLO
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
              title="Cetak langsung melalui dialog browser"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak / Simpan PDF</span>
            </button>

            <button
              onClick={handleDownloadDoc}
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-white/20 cursor-pointer transition-all"
              title="Download dokumen HTML/Word siap edit"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download File</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action & Option Toolbar (Hidden on print) */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 print:hidden">
          {/* Main Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-200/80 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setActiveTab('paper')}
              className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'paper'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Naskah Soal Ujian</span>
            </button>

            <button
              onClick={() => setActiveTab('blueprint')}
              className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'blueprint'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Kisi-Kisi Soal Ujian</span>
            </button>
          </div>

          {/* Options for Tab 1 (Naskah) */}
          {activeTab === 'paper' && (
            <div className="flex items-center gap-3 text-xs text-slate-700 font-semibold flex-wrap">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeAnswerKey}
                  onChange={(e) => setIncludeAnswerKey(e.target.checked)}
                  className="rounded accent-indigo-600 cursor-pointer"
                />
                <span>Kunci Jawaban & Pembahasan</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeLjkSheet}
                  onChange={(e) => setIncludeLjkSheet(e.target.checked)}
                  className="rounded accent-indigo-600 cursor-pointer"
                />
                <span>Lembar Jawab (LJK) Siswa</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={twoColumnLayout}
                  onChange={(e) => setTwoColumnLayout(e.target.checked)}
                  className="rounded accent-indigo-600 cursor-pointer"
                />
                <span>Format 2 Kolom Hemat Kertas</span>
              </label>
            </div>
          )}

          {/* Options for Tab 2 (Kisi-kisi) */}
          {activeTab === 'blueprint' && (
            <div className="flex items-center gap-3 text-xs flex-wrap">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-700">Model Taksonomi:</span>
                <div className="flex items-center gap-1 bg-white border border-slate-300 p-0.5 rounded-lg">
                  <button
                    type="button"
                    onClick={() => {
                      setTaxonomyOption('bloom');
                      // set default bloom levels if needed
                      setEditableQuestions((prev) =>
                        prev.map((q) => ({
                          ...q,
                          cognitiveDomain: 'bloom',
                          cognitiveLevel: q.cognitiveLevel?.startsWith('C') ? q.cognitiveLevel : 'C2',
                        }))
                      );
                    }}
                    className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                      taxonomyOption === 'bloom'
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Bloom-Anderson (C1–C6)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTaxonomyOption('solo');
                      // set default solo levels if needed
                      setEditableQuestions((prev) =>
                        prev.map((q) => ({
                          ...q,
                          cognitiveDomain: 'solo',
                          cognitiveLevel:
                            q.cognitiveLevel && !q.cognitiveLevel.startsWith('C')
                              ? q.cognitiveLevel
                              : 'Relational',
                        }))
                      );
                    }}
                    className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                      taxonomyOption === 'solo'
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    SOLO Taxonomy
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSaveTaxonomyChanges}
                disabled={isSavingTaxonomy}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-2xs cursor-pointer transition-all flex items-center gap-1"
              >
                {savedFeedback ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Tersimpan!</span>
                  </>
                ) : (
                  <span>{isSavingTaxonomy ? 'Menyimpan...' : 'Simpan ke Bank'}</span>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Printable Area Wrapper */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-slate-100 print:bg-white print:p-0 print:overflow-visible">
          <div
            id="printable-exam-document"
            className="max-w-[210mm] mx-auto bg-white p-8 sm:p-12 shadow-md rounded-2xl print:shadow-none print:p-0 print:rounded-none text-black"
            style={{ minHeight: '297mm' }}
          >
            {/* KOP RESMI LEMBAGA SEKOLAH */}
            <div className="border-b-[3px] border-double border-black pb-3 mb-5 text-center relative">
              {schoolProfile.logoUrl && (
                <img
                  src={schoolProfile.logoUrl}
                  alt="Logo Sekolah"
                  className="absolute left-2 top-1 w-16 h-16 object-contain hidden sm:block print:block"
                />
              )}
              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-800 print:text-black">
                {schoolProfile.regionalGovernment || 'PEMERINTAH DAERAH PROVINSI / KABUPATEN'}
              </h4>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 print:text-black">
                {schoolProfile.educationDepartment || 'DINAS PENDIDIKAN DAN KEBUDAYAAN'}
              </h3>
              <h2 className="text-lg sm:text-xl font-extrabold uppercase tracking-tight text-slate-950 print:text-black mt-0.5">
                {schoolProfile.name || 'SMP NEGERI 5 PERCONTOHAN'}
              </h2>
              <p className="text-[11px] text-slate-600 print:text-black mt-0.5">
                {schoolProfile.address} • NPSN: {schoolProfile.npsn || '-'} • Telp: {schoolProfile.phone || '-'}
              </p>
              <p className="text-[10px] text-slate-500 print:text-black italic">
                Website / Email: {schoolProfile.email || 'info@sekolah.sch.id'}
              </p>
            </div>

            {/* TAB 1: NASKAH SOAL UJIAN */}
            {activeTab === 'paper' && (
              <div className="space-y-6">
                {/* Header Judul Ujian */}
                <div className="text-center space-y-1 mb-4">
                  <h3 className="text-base font-bold uppercase tracking-wide underline underline-offset-4">
                    NASKAH SOAL EVALUASI & PENILAIAN SUMATIF
                  </h3>
                  <p className="text-xs font-semibold text-slate-700 print:text-black">
                    Tahun Ajaran: {schoolProfile.academicYear || '2026/2027'} (Semester {schoolProfile.semester || 'Ganjil'})
                  </p>
                </div>

                {/* Identitas Ujian Grid */}
                <div className="border border-black p-3 text-xs mb-5 grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50/50 print:bg-transparent">
                  <div>
                    <span className="text-slate-500 print:text-black block text-[10px] uppercase font-bold">Mata Pelajaran:</span>
                    <span className="font-bold text-slate-900 print:text-black">{bank.title}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 print:text-black block text-[10px] uppercase font-bold">Tingkat / Kelas:</span>
                    <span className="font-bold text-slate-900 print:text-black">Kelas {bank.gradeLevel}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 print:text-black block text-[10px] uppercase font-bold">Alokasi Waktu:</span>
                    <span className="font-bold text-slate-900 print:text-black">{bank.durationMinutes || 60} Menit</span>
                  </div>
                  <div>
                    <span className="text-slate-500 print:text-black block text-[10px] uppercase font-bold">Jumlah Soal:</span>
                    <span className="font-bold text-slate-900 print:text-black">{bank.questions.length} Butir Soal</span>
                  </div>
                </div>

                {/* Petunjuk Pengerjaan */}
                <div className="p-3 border border-dashed border-slate-400 text-[11px] space-y-1 bg-slate-50/30 print:bg-transparent">
                  <div className="font-bold uppercase tracking-wider text-slate-800 print:text-black">
                    Petunjuk Pengerjaan Soal:
                  </div>
                  <ol className="list-decimal list-inside space-y-0.5 text-slate-700 print:text-black">
                    <li>Berdoalah terlebih dahulu sebelum Anda mulai mengerjakan soal ujian.</li>
                    <li>Tuliskan nama lengkap, kelas, dan nomor peserta Anda pada lembar jawaban yang disediakan.</li>
                    <li>Periksa dan bacalah setiap butir soal dengan teliti sebelum memberikan jawaban.</li>
                    <li>Laporkan kepada pengawas ujian apabila terdapat lembar soal yang rusak atau tidak jelas.</li>
                    <li>Periksa kembali seluruh pekerjaan Anda sebelum diserahkan kepada pengawas ujian.</li>
                  </ol>
                </div>

                {/* Daftar Soal */}
                <div
                  className={`space-y-5 pt-3 ${
                    twoColumnLayout ? 'sm:columns-2 gap-6 space-y-4' : ''
                  }`}
                >
                  {editableQuestions.map((q, idx) => (
                    <div
                      key={q.id || idx}
                      className="break-inside-avoid text-xs space-y-2 border-b border-slate-200 pb-4 print:border-slate-300"
                    >
                      <div className="flex items-start gap-2">
                        <span className="font-bold text-sm shrink-0">{idx + 1}.</span>
                        <div className="flex-1 space-y-2">
                          <div className="font-medium leading-relaxed whitespace-pre-line text-slate-900 print:text-black">
                            {q.question}
                          </div>

                          {/* Media if image */}
                          {q.media && q.media.type === 'image' && (
                            <div className="my-2 text-center">
                              <img
                                src={q.media.url}
                                alt="Gambar stimulus soal"
                                className="max-h-48 mx-auto rounded object-contain border border-slate-200"
                              />
                              {q.media.caption && (
                                <p className="text-[10px] text-slate-500 italic mt-1">{q.media.caption}</p>
                              )}
                            </div>
                          )}

                          {/* Options Multiple Choice */}
                          {Array.isArray(q.options) && q.options.length > 0 && (
                            <div className="grid grid-cols-1 gap-1 pl-2 pt-1">
                              {q.options.map((opt, oIdx) => (
                                <div key={oIdx} className="text-slate-800 print:text-black flex items-start gap-1.5">
                                  <span>{typeof opt === 'string' ? opt : JSON.stringify(opt)}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Matching Pairs */}
                          {q.type === 'matching' && Array.isArray(q.matchingPairs) && (
                            <div className="p-2 border border-slate-300 rounded bg-slate-50 print:bg-transparent text-xs space-y-1">
                              <div className="font-bold text-[11px] mb-1">Pasangkan pernyataan berikut:</div>
                              {q.matchingPairs.map((pair, pIdx) => (
                                <div key={pIdx} className="flex items-center justify-between gap-4 border-b border-slate-200 pb-1">
                                  <span>• {pair.left}</span>
                                  <span className="font-semibold text-slate-600">[ ...................... ]</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Lembar Kunci Jawaban & Pembahasan (Jika dicentang) */}
                {includeAnswerKey && (
                  <div className="page-break-before pt-8 border-t-2 border-black space-y-4">
                    <h3 className="text-sm font-bold uppercase text-center underline">
                      KUNCI JAWABAN & PEMBAHASAN LENGKAP (PEGANGAN GURU)
                    </h3>
                    <table className="w-full border-collapse border border-black text-xs">
                      <thead>
                        <tr className="bg-slate-100 print:bg-slate-200">
                          <th className="border border-black p-1.5 text-center w-10">No</th>
                          <th className="border border-black p-1.5 text-center w-28">Tipe Soal</th>
                          <th className="border border-black p-1.5 text-center w-24">Kunci Jawaban</th>
                          <th className="border border-black p-1.5 text-center w-24">Level</th>
                          <th className="border border-black p-1.5 text-left">Pembahasan / Rubrik Penilaian</th>
                        </tr>
                      </thead>
                      <tbody>
                        {editableQuestions.map((q, idx) => (
                          <tr key={idx}>
                            <td className="border border-black p-1.5 text-center font-bold">{idx + 1}</td>
                            <td className="border border-black p-1.5 text-center uppercase text-[10px]">
                              {((q.type || 'multiple_choice') as string).replace(/_/g, ' ')}
                            </td>
                            <td className="border border-black p-1.5 text-center font-bold text-indigo-900 print:text-black">
                              {typeof q.correctAnswer === 'object'
                                ? JSON.stringify(q.correctAnswer)
                                : String(q.correctAnswer)}
                            </td>
                            <td className="border border-black p-1.5 text-center font-mono">
                              {q.cognitiveLevel || '-'}
                            </td>
                            <td className="border border-black p-1.5 text-slate-700 print:text-black">
                              {q.explanation || 'Sesuai kunci rubrik mata pelajaran.'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Lembar Jawab Komputer / Manual (LJK) Siswa (Jika dicentang) */}
                {includeLjkSheet && (
                  <div className="page-break-before pt-8 border-t-2 border-black space-y-4">
                    <div className="text-center space-y-1">
                      <h4 className="text-sm font-bold uppercase underline">LEMBAR JAWABAN PESERTA UJIAN (LJK)</h4>
                      <p className="text-xs text-slate-600 print:text-black">Mata Pelajaran: {bank.title}</p>
                    </div>

                    <div className="border border-black p-3 text-xs grid grid-cols-2 gap-2 mb-4">
                      <div>Nama Siswa: ....................................................</div>
                      <div>Nomor Peserta: ....................................................</div>
                      <div>Kelas / Ruang: ....................................................</div>
                      <div>Tanda Tangan: ....................................................</div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                      {editableQuestions.slice(0, 40).map((q, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 border border-slate-300 p-1">
                          <span className="w-5 text-right font-bold">{idx + 1}.</span>
                          <span className="flex items-center gap-1">
                            {['A', 'B', 'C', 'D', 'E'].map((letter) => (
                              <span
                                key={letter}
                                className="w-4 h-4 rounded-full border border-black flex items-center justify-center text-[9px]"
                              >
                                {letter}
                              </span>
                            ))}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: KISI-KISI SOAL UJIAN (TEST SPECIFICATION MATRIX) */}
            {activeTab === 'blueprint' && (
              <div className="space-y-6">
                <div className="text-center space-y-1 mb-4">
                  <h3 className="text-base font-bold uppercase tracking-wide underline underline-offset-4">
                    KISI-KISI PENULISAN SOAL EVALUASI & PENILAIAN SUMATIF
                  </h3>
                  <p className="text-xs font-semibold text-slate-700 print:text-black">
                    Format Standar Kurikulum Merdeka Berbasis{' '}
                    <span className="font-extrabold uppercase">
                      {taxonomyOption === 'bloom' ? 'Taksonomi Bloom-Anderson (Revisi)' : 'Taksonomi SOLO'}
                    </span>
                  </p>
                </div>

                {/* Identitas Kisi-Kisi Grid */}
                <div className="border border-black p-3 text-xs mb-4 grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50/50 print:bg-transparent">
                  <div>
                    <span className="text-slate-500 print:text-black block text-[10px] uppercase font-bold">Satuan Pendidikan:</span>
                    <span className="font-bold text-slate-900 print:text-black">{schoolProfile.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 print:text-black block text-[10px] uppercase font-bold">Mata Pelajaran:</span>
                    <span className="font-bold text-slate-900 print:text-black">{bank.title}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 print:text-black block text-[10px] uppercase font-bold">Kelas / Semester:</span>
                    <span className="font-bold text-slate-900 print:text-black">Kelas {bank.gradeLevel} / {schoolProfile.semester || 'Ganjil'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 print:text-black block text-[10px] uppercase font-bold">Guru Pengampu:</span>
                    <span className="font-bold text-slate-900 print:text-black">{currentTeacher.name}</span>
                  </div>
                </div>

                {/* Ringkasan Distribusi Taksonomi Badge */}
                <div className="p-3 border border-slate-300 rounded-xl bg-slate-50 print:bg-transparent text-xs space-y-1.5">
                  <div className="font-bold text-slate-800 print:text-black uppercase text-[11px] flex items-center justify-between">
                    <span>Distribusi Bobot Level Kognitif ({taxonomyOption.toUpperCase()}):</span>
                    <span className="text-indigo-600 print:text-black font-semibold">Total: {editableQuestions.length} Butir Soal</span>
                  </div>

                  {taxonomyOption === 'bloom' ? (
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="p-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 print:border-black print:bg-transparent">
                        <div className="font-bold">LOTS (C1-C2)</div>
                        <div className="text-[11px]">
                          {(dist as any).lots} Soal ({(dist as any).lotsPct}%)
                        </div>
                      </div>
                      <div className="p-1.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 print:border-black print:bg-transparent">
                        <div className="font-bold">MOTS (C3)</div>
                        <div className="text-[11px]">
                          {(dist as any).mots} Soal ({(dist as any).motsPct}%)
                        </div>
                      </div>
                      <div className="p-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 print:border-black print:bg-transparent">
                        <div className="font-bold">HOTS (C4-C6)</div>
                        <div className="text-[11px]">
                          {(dist as any).hots} Soal ({(dist as any).hotsPct}%)
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 gap-2 text-center text-xs">
                      <div className="p-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 print:border-black print:bg-transparent">
                        <div className="font-bold text-[10px]">Unistructural</div>
                        <div className="text-[11px]">{(dist as any).uni} Soal ({(dist as any).uniPct}%)</div>
                      </div>
                      <div className="p-1.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 print:border-black print:bg-transparent">
                        <div className="font-bold text-[10px]">Multistructural</div>
                        <div className="text-[11px]">{(dist as any).multi} Soal ({(dist as any).multiPct}%)</div>
                      </div>
                      <div className="p-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-900 print:border-black print:bg-transparent">
                        <div className="font-bold text-[10px]">Relational</div>
                        <div className="text-[11px]">{(dist as any).rel} Soal ({(dist as any).relPct}%)</div>
                      </div>
                      <div className="p-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 print:border-black print:bg-transparent">
                        <div className="font-bold text-[10px]">Extended Abstract</div>
                        <div className="text-[11px]">{(dist as any).ext} Soal ({(dist as any).extPct}%)</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Tabel Matriks Kisi-Kisi Soal */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-black text-xs">
                    <thead>
                      <tr className="bg-slate-100 print:bg-slate-200 text-center font-bold">
                        <th className="border border-black p-2 w-8">No</th>
                        <th className="border border-black p-2 w-32">Capaian Pembelajaran (CP) / KD</th>
                        <th className="border border-black p-2 w-28">Materi Pokok</th>
                        <th className="border border-black p-2">Indikator Soal</th>
                        <th className="border border-black p-2 w-28">
                          Level Kognitif ({taxonomyOption === 'bloom' ? 'Bloom' : 'SOLO'})
                        </th>
                        <th className="border border-black p-2 w-24">Bentuk Soal</th>
                        <th className="border border-black p-2 w-12">No. Soal</th>
                        <th className="border border-black p-2 w-12">Bobot Poin</th>
                      </tr>
                    </thead>
                    <tbody>
                      {editableQuestions.map((q, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/60 print:hover:bg-transparent">
                          <td className="border border-black p-2 text-center font-bold">{idx + 1}</td>
                          <td className="border border-black p-2">
                            <input
                              type="text"
                              value={q.learningObjective || ''}
                              onChange={(e) =>
                                handleUpdateQuestionTaxonomy(idx, 'learningObjective', e.target.value)
                              }
                              className="w-full bg-transparent border-0 focus:ring-1 focus:ring-indigo-500 text-xs"
                              placeholder="Capaian pembelajaran..."
                            />
                          </td>
                          <td className="border border-black p-2">
                            <input
                              type="text"
                              value={q.topicMaterial || ''}
                              onChange={(e) =>
                                handleUpdateQuestionTaxonomy(idx, 'topicMaterial', e.target.value)
                              }
                              className="w-full bg-transparent border-0 focus:ring-1 focus:ring-indigo-500 text-xs"
                              placeholder="Materi pokok..."
                            />
                          </td>
                          <td className="border border-black p-2 font-medium">
                            <textarea
                              rows={2}
                              value={q.competencyIndicator || ''}
                              onChange={(e) =>
                                handleUpdateQuestionTaxonomy(idx, 'competencyIndicator', e.target.value)
                              }
                              className="w-full bg-transparent border-0 focus:ring-1 focus:ring-indigo-500 text-xs leading-snug resize-y"
                              placeholder="Indikator soal..."
                            />
                          </td>
                          <td className="border border-black p-2 text-center">
                            {taxonomyOption === 'bloom' ? (
                              <select
                                value={q.cognitiveLevel || 'C2'}
                                onChange={(e) =>
                                  handleUpdateQuestionTaxonomy(idx, 'cognitiveLevel', e.target.value)
                                }
                                className="bg-transparent border border-slate-300 rounded px-1 py-0.5 text-xs font-bold"
                              >
                                <option value="C1">C1 (Mengingat)</option>
                                <option value="C2">C2 (Memahami)</option>
                                <option value="C3">C3 (Menerapkan)</option>
                                <option value="C4">C4 (Menganalisis)</option>
                                <option value="C5">C5 (Mengevaluasi)</option>
                                <option value="C6">C6 (Mencipta)</option>
                              </select>
                            ) : (
                              <select
                                value={q.cognitiveLevel || 'Relational'}
                                onChange={(e) =>
                                  handleUpdateQuestionTaxonomy(idx, 'cognitiveLevel', e.target.value)
                                }
                                className="bg-transparent border border-slate-300 rounded px-1 py-0.5 text-[11px] font-bold"
                              >
                                <option value="Prestructural">Prestructural</option>
                                <option value="Unistructural">Unistructural</option>
                                <option value="Multistructural">Multistructural</option>
                                <option value="Relational">Relational</option>
                                <option value="Extended Abstract">Extended Abstract</option>
                              </select>
                            )}
                          </td>
                          <td className="border border-black p-2 text-center uppercase text-[10px] font-bold">
                            {((q.type || 'multiple_choice') as string).replace(/_/g, ' ')}
                          </td>
                          <td className="border border-black p-2 text-center font-bold">{idx + 1}</td>
                          <td className="border border-black p-2 text-center font-mono font-bold">
                            {q.points || 10}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Kolom Tanda Tangan Resmi Pengesahan */}
                <div className="pt-8 grid grid-cols-2 gap-8 text-xs text-center break-inside-avoid">
                  <div className="space-y-16">
                    <div>
                      <p className="text-slate-500 print:text-black">Mengetahui,</p>
                      <p className="font-bold text-slate-800 print:text-black">Kepala Sekolah</p>
                    </div>
                    <div>
                      <p className="font-bold underline text-slate-900 print:text-black">
                        {schoolProfile.principalName || 'Drs. H. Bambang Sugiarto, M.Pd.'}
                      </p>
                      <p className="text-slate-600 print:text-black font-mono">
                        NIP: {schoolProfile.principalNip || '19680512 199403 1 004'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-16">
                    <div>
                      <p className="text-slate-500 print:text-black">
                        Jakarta, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                      <p className="font-bold text-slate-800 print:text-black">Guru Mata Pelajaran</p>
                    </div>
                    <div>
                      <p className="font-bold underline text-slate-900 print:text-black">
                        {currentTeacher.name}
                      </p>
                      <p className="text-slate-600 print:text-black font-mono">
                        NIP: {currentTeacher.nip || '-'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer (Hidden on print) */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between print:hidden">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Format kisi-kisi dan naskah telah disesuaikan dengan Kurikulum Merdeka & Kop Resmi Sekolah.</span>
          </div>

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
