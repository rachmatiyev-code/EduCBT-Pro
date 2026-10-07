import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Award,
  CheckCircle,
  XCircle,
  Download,
  Search,
  Filter,
  FileSpreadsheet,
  AlertTriangle,
  RefreshCw,
  Clock,
} from 'lucide-react';
import { ExamSession, ExamSubmission, QuestionBank } from '../types/cbt';
import { api } from '../services/api';

interface AnalyticsDashboardProps {
  sessions: ExamSession[];
  questionBanks: QuestionBank[];
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ sessions, questionBanks }) => {
  const [selectedSessionCode, setSelectedSessionCode] = useState<string>(
    sessions[0]?.sessionCode || ''
  );
  const [submissions, setSubmissions] = useState<ExamSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const activeSession = sessions.find((s) => s.sessionCode === selectedSessionCode);
  const activeBank = activeSession ? questionBanks.find((b) => b.id === activeSession.bankId) : null;

  const loadSubmissions = async () => {
    if (!selectedSessionCode) return;
    setIsLoading(true);
    try {
      const list = await api.fetchSubmissions(selectedSessionCode);
      setSubmissions(list);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSubmissions();
  }, [selectedSessionCode]);

  // Metrics calculations
  const totalStudents = submissions.length;
  const avgScore =
    totalStudents > 0
      ? Math.round(submissions.reduce((acc, s) => acc + s.scorePercentage, 0) / totalStudents)
      : 0;
  const highestScore =
    totalStudents > 0 ? Math.max(...submissions.map((s) => s.scorePercentage)) : 0;
  const lowestScore =
    totalStudents > 0 ? Math.min(...submissions.map((s) => s.scorePercentage)) : 0;
  const passedStudents = submissions.filter((s) => s.isPassed).length;
  const passRate = totalStudents > 0 ? Math.round((passedStudents / totalStudents) * 100) : 0;

  // Item analysis (for questions 1..N)
  const itemAnalysisSummary = (activeBank?.questions || []).map((q) => {
    let correctCount = 0;
    submissions.forEach((sub) => {
      const match = sub.itemAnalysis?.find((ia) => ia.questionNumber === q.number);
      if (match && match.isCorrect) {
        correctCount++;
      }
    });

    const correctPct = totalStudents > 0 ? Math.round((correctCount / totalStudents) * 100) : 0;
    let difficultyLabel = 'Sedang';
    if (correctPct < 30) difficultyLabel = 'Sukar (HOTS)';
    else if (correctPct > 70) difficultyLabel = 'Mudah';

    return {
      number: q.number,
      type: q.type,
      points: q.points,
      correctCount,
      correctPct,
      difficultyLabel,
    };
  });

  const exportToCSV = () => {
    if (submissions.length === 0) return;
    const headers = [
      'ID Submisi',
      'NISN',
      'Nama Siswa',
      'Kelas',
      'Skor Total',
      'Skor Maksimal',
      'Persentase (%)',
      'Status Kelulusan',
      'Pelanggaran Tab',
      'Waktu Submisi',
    ];

    const rows = submissions.map((s) => [
      s.id,
      s.studentId,
      `"${s.studentName}"`,
      s.studentClass,
      s.totalScore,
      s.maxPossibleScore,
      s.scorePercentage,
      s.isPassed ? 'TUNTAS' : 'BELUM TUNTAS',
      s.tabBlurCount,
      s.submittedAt,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Rekap_Nilai_${selectedSessionCode}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredSubmissions = submissions.filter(
    (s) =>
      s.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.studentId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Session Selector & Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-indigo-600" />
            <span>Dashboard Statistik & Analisis Performa Siswa</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Rekap nilai otomatis, daya pembeda butir soal, dan persentase ketuntasan kurikulum
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
            <span className="text-xs font-semibold text-slate-600">Pilih Sesi:</span>
            <select
              value={selectedSessionCode}
              onChange={(e) => setSelectedSessionCode(e.target.value)}
              className="bg-transparent font-bold text-xs text-indigo-700 focus:outline-none"
            >
              {sessions.map((s) => (
                <option key={s.id} value={s.sessionCode}>
                  {s.sessionCode} - {s.title}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={loadSubmissions}
            disabled={isLoading}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600 transition-colors"
            title="Segarkan data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={exportToCSV}
            disabled={submissions.length === 0}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Unduh CSV Rekap</span>
          </button>
        </div>
      </div>

      {/* Overview Stat Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 block">Total Peserta Selesai</span>
          <div className="text-2xl font-bold text-slate-800 mt-1">{totalStudents}</div>
          <span className="text-[11px] text-slate-400">Lembar jawaban</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 block">Rata-rata Nilai</span>
          <div className="text-2xl font-bold text-indigo-700 mt-1">{avgScore}</div>
          <span className="text-[11px] text-indigo-500">Skala 100</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 block">Nilai Tertinggi</span>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{highestScore}</div>
          <span className="text-[11px] text-emerald-500">Maksimum</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 block">Nilai Terendah</span>
          <div className="text-2xl font-bold text-rose-600 mt-1">{lowestScore}</div>
          <span className="text-[11px] text-rose-500">Minimum</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs col-span-2 sm:col-span-1">
          <span className="text-xs text-slate-500 block">Tingkat Ketuntasan</span>
          <div className="text-2xl font-bold text-teal-600 mt-1">{passRate}%</div>
          <span className="text-[11px] text-teal-600 font-medium">
            {passedStudents} dari {totalStudents} lulus KKM
          </span>
        </div>
      </div>

      {/* Item Difficulty Analysis (Analisis Butir Soal) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-800 text-sm">
              Analisis Butir Soal & Tingkat Kesukaran (Item Analysis)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Distribusi persentase jawaban benar per nomor soal untuk evaluasi daya serap siswa
            </p>
          </div>
          <span className="text-xs text-slate-500">
            {itemAnalysisSummary.length} Butir Soal Terdaftar
          </span>
        </div>

        {itemAnalysisSummary.length === 0 ? (
          <p className="text-xs text-slate-400 italic">Belum ada butir soal pada sesi ini.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-5 md:grid-cols-10 gap-2.5">
            {itemAnalysisSummary.map((item) => (
              <div
                key={item.number}
                className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between text-center space-y-1.5"
              >
                <div className="text-xs font-bold text-slate-700">Soal #{item.number}</div>
                <div className="text-base font-extrabold text-indigo-700">{item.correctPct}%</div>
                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${
                      item.correctPct < 40
                        ? 'bg-rose-500'
                        : item.correctPct < 70
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${item.correctPct}%` }}
                  />
                </div>
                <span
                  className={`text-[10px] font-bold uppercase rounded py-0.5 ${
                    item.difficultyLabel.includes('Sukar')
                      ? 'text-rose-700 bg-rose-50'
                      : item.difficultyLabel === 'Mudah'
                      ? 'text-emerald-700 bg-emerald-50'
                      : 'text-amber-700 bg-amber-50'
                  }`}
                >
                  {item.difficultyLabel.split(' ')[0]}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Submissions Detail Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-4 p-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <h3 className="font-bold text-slate-800 text-sm">
            Daftar Hasil & Rekap Nilai Siswa ({filteredSubmissions.length})
          </h3>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari siswa atau NISN..."
              className="w-full pl-9 pr-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-y border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Peringkat</th>
                <th className="py-3 px-4">NISN / ID</th>
                <th className="py-3 px-4">Nama Siswa</th>
                <th className="py-3 px-4">Kelas</th>
                <th className="py-3 px-4 text-center">Nilai (%)</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Pindah Tab</th>
                <th className="py-3 px-4">Waktu Selesai</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSubmissions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Belum ada submisi ujian yang masuk untuk sesi ini.
                  </td>
                </tr>
              ) : (
                filteredSubmissions
                  .sort((a, b) => b.scorePercentage - a.scorePercentage)
                  .map((sub, idx) => (
                    <tr key={sub.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-700">#{idx + 1}</td>
                      <td className="py-3 px-4 font-mono text-slate-600">{sub.studentId}</td>
                      <td className="py-3 px-4 font-bold text-slate-800">{sub.studentName}</td>
                      <td className="py-3 px-4 text-slate-600">{sub.studentClass}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-extrabold text-sm text-indigo-700">
                          {sub.scorePercentage}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          ({sub.totalScore}/{sub.maxPossibleScore})
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                            sub.isPassed
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {sub.isPassed ? 'TUNTAS' : 'BELUM TUNTAS'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {sub.tabBlurCount > 0 ? (
                          <span className="text-amber-600 font-bold">{sub.tabBlurCount}x</span>
                        ) : (
                          <span className="text-emerald-600">0</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                        {new Date(sub.submittedAt).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
