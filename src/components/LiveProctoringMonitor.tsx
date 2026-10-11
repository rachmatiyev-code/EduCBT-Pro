import React, { useState, useEffect } from 'react';
import {
  Activity,
  Users,
  ShieldAlert,
  Wifi,
  WifiOff,
  Battery,
  Smartphone,
  Monitor,
  RefreshCw,
  Search,
  CheckCircle,
  AlertTriangle,
  Clock,
  Eye,
  Filter,
  Copy,
  Check,
  CloudDownload,
} from 'lucide-react';
import { ProctorPing, ExamSession } from '../types/cbt';
import { api } from '../services/api';

interface LiveProctoringMonitorProps {
  session: ExamSession;
  allSessions?: ExamSession[];
  onBack?: () => void;
  onSelectSession?: (sessionCode: string) => void;
}

export const LiveProctoringMonitor: React.FC<LiveProctoringMonitorProps> = ({
  session,
  allSessions = [],
  onBack,
  onSelectSession,
}) => {
  const [selectedSessionCode, setSelectedSessionCode] = useState<string>(
    session?.sessionCode || 'ALL'
  );
  const [liveList, setLiveList] = useState<ProctorPing[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncingCloud, setIsSyncingCloud] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string>('');
  const [feedbackMsg, setFeedbackMsg] = useState<string>('');
  const [copiedToken, setCopiedToken] = useState(false);

  // Sync selected code when session prop changes
  useEffect(() => {
    if (session?.sessionCode) {
      setSelectedSessionCode(session.sessionCode);
    }
  }, [session?.sessionCode]);

  const fetchLive = async () => {
    setIsLoading(true);
    try {
      const codeToFetch = selectedSessionCode || session.sessionCode || 'ALL';
      const pings = await api.fetchLiveProctoring(codeToFetch);
      setLiveList(pings);
      const timeStr = new Date().toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      setLastRefreshedAt(timeStr);
      setFeedbackMsg(`✓ Data disegarkan (${pings.length} perangkat terdeteksi) • ${timeStr}`);
      setTimeout(() => setFeedbackMsg(''), 4000);
    } catch {
      setFeedbackMsg('Koneksi terhambat saat memperbarui status.');
      setTimeout(() => setFeedbackMsg(''), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePullFromCloud = async () => {
    setIsSyncingCloud(true);
    try {
      const res = await api.pullDataFromGas();
      if (res.success) {
        await fetchLive();
        setFeedbackMsg('✓ Data sinkron dari Google Sheets & Cloud!');
      } else {
        await fetchLive();
        setFeedbackMsg(res.error || 'Gagal sinkron cloud.');
      }
    } catch {
      await fetchLive();
    } finally {
      setIsSyncingCloud(false);
      setTimeout(() => setFeedbackMsg(''), 4000);
    }
  };

  useEffect(() => {
    fetchLive();
    const interval = setInterval(fetchLive, 4000); // 4s auto polling for responsive live tracking
    return () => clearInterval(interval);
  }, [selectedSessionCode]);

  const activeSessionObj =
    allSessions.find(
      (s) => s.sessionCode.trim().toUpperCase() === selectedSessionCode.trim().toUpperCase()
    ) || session;

  const currentDisplayToken =
    selectedSessionCode === 'ALL'
      ? 'SEMUA SESI AKTIF'
      : activeSessionObj?.sessionCode || selectedSessionCode;

  const filteredList = liveList.filter((p) => {
    const matchSearch =
      p.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.classId && p.classId.toLowerCase().includes(searchTerm.toLowerCase()));
    if (!matchSearch) return false;
    if (filterStatus === 'all') return true;
    if (filterStatus === 'warning') return p.tabBlurCount > 0;
    if (filterStatus === 'submitted') return p.status === 'submitted';
    if (filterStatus === 'online') return p.isOnline;
    return true;
  });

  const activeCount = liveList.filter((p) => p.isOnline && p.status !== 'submitted').length;
  const warningCount = liveList.filter((p) => p.tabBlurCount > 0).length;
  const submittedCount = liveList.filter((p) => p.status === 'submitted').length;

  const handleCopyToken = () => {
    if (currentDisplayToken && currentDisplayToken !== 'SEMUA SESI AKTIF') {
      navigator.clipboard.writeText(currentDisplayToken);
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            {onBack && (
              <button
                onClick={onBack}
                className="text-xs font-semibold text-indigo-600 hover:underline mr-1 cursor-pointer"
              >
                ← Kembali ke Bank Soal
              </button>
            )}
            <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 font-mono font-bold text-xs rounded-xl">
              <span>TOKEN: {currentDisplayToken}</span>
              {currentDisplayToken !== 'SEMUA SESI AKTIF' && (
                <button
                  type="button"
                  onClick={handleCopyToken}
                  className="p-0.5 hover:bg-indigo-100 rounded text-indigo-600 transition-colors cursor-pointer"
                  title="Salin Token Ujian"
                >
                  {copiedToken ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Proctoring Room
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
            {selectedSessionCode === 'ALL'
              ? 'Pantau Semua Sesi Ujian Aktif'
              : activeSessionObj?.title || 'Sesi Ujian Aktif'}
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Deteksi otomatis kehadiran perangkat siswa (Laptop, Tablet, Smartphone), progres pengerjaan, dan riwayat perpindahan tab secara realtime.
          </p>

          {feedbackMsg && (
            <div className="mt-2 text-xs font-semibold text-indigo-700 bg-indigo-50/70 border border-indigo-200/60 px-3 py-1 rounded-lg inline-block">
              {feedbackMsg}
            </div>
          )}
        </div>

        {/* Action Controls & Session Selector */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* Session Switcher Dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500 hidden sm:inline">Sesi:</span>
            <select
              value={selectedSessionCode}
              onChange={(e) => {
                const nextCode = e.target.value;
                setSelectedSessionCode(nextCode);
                if (onSelectSession) onSelectSession(nextCode);
              }}
              className="px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
            >
              <option value="ALL">🌐 Semua Sesi Ujian (Semua Token)</option>
              {allSessions.map((s) => (
                <option key={s.id} value={s.sessionCode}>
                  [{s.sessionCode}] {s.title}
                </option>
              ))}
            </select>
          </div>

          {/* Refresh Button */}
          <button
            onClick={fetchLive}
            disabled={isLoading}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Segarkan Data</span>
          </button>

          {/* Pull from Google Sheets */}
          <button
            onClick={handlePullFromCloud}
            disabled={isSyncingCloud}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            title="Tarik data live monitoring dari Google Apps Script"
          >
            <CloudDownload className={`w-3.5 h-3.5 ${isSyncingCloud ? 'animate-bounce text-indigo-600' : ''}`} />
            <span className="hidden sm:inline">Sinkron Cloud</span>
          </button>
        </div>
      </div>

      {/* Stats Quick Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Sedang Mengerjakan</span>
            <Activity className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-800 mt-2">{activeCount}</div>
          <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            Gadget terhubung aktif
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Peringatan Layar</span>
            <ShieldAlert className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-3xl font-extrabold text-amber-700 mt-2">{warningCount}</div>
          <span className="text-[11px] text-amber-600 font-semibold mt-0.5 block">
            Terdeteksi pindah tab
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Sudah Selesai</span>
            <CheckCircle className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-3xl font-extrabold text-indigo-700 mt-2">{submittedCount}</div>
          <span className="text-[11px] text-indigo-600 font-semibold mt-0.5 block">
            Ujian dikumpulkan
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Total Terdata</span>
            <Users className="w-4 h-4 text-slate-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-800 mt-2">{liveList.length}</div>
          <span className="text-[11px] text-slate-500 font-medium mt-0.5 block">
            {lastRefreshedAt ? `Update: ${lastRefreshedAt}` : 'Realtime tracker'}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nama siswa, NISN, atau kelas..."
            className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          {[
            { id: 'all', label: `Semua (${liveList.length})` },
            { id: 'online', label: `Online (${activeCount})` },
            { id: 'warning', label: `Ada Peringatan (${warningCount})` },
            { id: 'submitted', label: `Selesai (${submittedCount})` },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterStatus(f.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterStatus === f.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Connected Devices Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredList.length === 0 ? (
          <div className="col-span-full bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-500 flex items-center justify-center mx-auto">
              <Users className="w-8 h-8" />
            </div>
            <h4 className="font-bold text-slate-800 text-base">Belum Ada Perangkat Siswa Terdeteksi</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              Siswa yang masuk ke portal ujian di perangkat mereka menggunakan Token{' '}
              <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                {currentDisplayToken}
              </span>{' '}
              dan NISN mereka akan secara otomatis terdeteksi dan muncul di panel ini setiap 4 detik.
            </p>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={fetchLive}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Cek Ulang Sekarang
              </button>
              <button
                type="button"
                onClick={handlePullFromCloud}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Tarik Data dari Cloud Sheets
              </button>
            </div>
          </div>
        ) : (
          filteredList.map((p) => {
            const progressPct =
              p.totalQuestions > 0 ? Math.round((p.answeredCount / p.totalQuestions) * 100) : 0;

            return (
              <div
                key={`${p.sessionCode}_${p.studentId}`}
                className={`bg-white rounded-2xl border p-5 shadow-xs transition-all flex flex-col justify-between space-y-4 ${
                  p.tabBlurCount > 2
                    ? 'border-red-300 ring-2 ring-red-100'
                    : p.status === 'submitted'
                    ? 'border-emerald-200 bg-emerald-50/20'
                    : 'border-slate-200 hover:border-indigo-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                        NISN: {p.studentId}
                      </span>
                      {selectedSessionCode === 'ALL' && (
                        <span className="text-[10px] font-mono font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                          {p.sessionCode}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {p.isOnline ? (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          Online
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[11px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                          <WifiOff className="w-3 h-3" /> Offline
                        </span>
                      )}
                    </div>
                  </div>

                  <h4 className="font-extrabold text-slate-900 text-sm tracking-tight">{p.studentName}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Kelas: {p.classId}</p>

                  {/* Device & Battery */}
                  <div className="mt-3 flex items-center gap-3 text-xs text-slate-500 pt-2 border-t border-slate-100">
                    <span className="flex items-center gap-1">
                      {p.device && p.device.includes('Smart') ? (
                        <Smartphone className="w-3.5 h-3.5 text-indigo-500" />
                      ) : (
                        <Monitor className="w-3.5 h-3.5 text-indigo-500" />
                      )}
                      <span>{p.device || 'Browser Siswa'}</span>
                    </span>
                    {p.batteryLevel !== undefined && (
                      <span className="flex items-center gap-1">
                        <Battery className="w-3.5 h-3.5 text-emerald-500" />
                        <span>{p.batteryLevel}%</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Progres Ujian</span>
                    <span className="font-bold text-slate-800">
                      {p.answeredCount} / {p.totalQuestions} Soal ({progressPct}%)
                    </span>
                  </div>

                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        p.status === 'submitted' ? 'bg-emerald-500' : 'bg-indigo-600'
                      }`}
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1 text-[11px]">
                    <span className="text-slate-500">Soal Aktif: #{p.currentQuestionIndex}</span>
                    {p.tabBlurCount > 0 ? (
                      <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-md font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Pindah Tab: {p.tabBlurCount}x
                      </span>
                    ) : (
                      <span className="text-emerald-600 font-semibold flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Terpantau Aman
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
