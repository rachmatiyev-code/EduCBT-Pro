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
} from 'lucide-react';
import { ProctorPing, ExamSession } from '../types/cbt';
import { api } from '../services/api';

interface LiveProctoringMonitorProps {
  session: ExamSession;
  onBack?: () => void;
}

export const LiveProctoringMonitor: React.FC<LiveProctoringMonitorProps> = ({ session, onBack }) => {
  const [liveList, setLiveList] = useState<ProctorPing[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const fetchLive = async () => {
    setIsLoading(true);
    try {
      const pings = await api.fetchLiveProctoring(session.sessionCode);
      setLiveList(pings);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLive();
    const interval = setInterval(fetchLive, 5000); // 5s auto polling
    return () => clearInterval(interval);
  }, [session.sessionCode]);

  const filteredList = liveList.filter((p) => {
    const matchSearch =
      p.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.studentId.toLowerCase().includes(searchTerm.toLowerCase());
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

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {onBack && (
              <button
                onClick={onBack}
                className="text-xs font-semibold text-indigo-600 hover:underline mr-1"
              >
                ← Kembali
              </button>
            )}
            <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 font-mono font-bold text-xs rounded-lg">
              TOKEN: {session.sessionCode}
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500">Live Proctoring Room</span>
          </div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">{session.title}</h2>
          <p className="text-xs text-slate-500 mt-1">
            Pantau status gadget peserta, aktivitas layar, progres jawaban, dan deteksi pelanggaran secara real-time
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchLive}
            disabled={isLoading}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Segarkan Data</span>
          </button>
        </div>
      </div>

      {/* Stats Quick Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Sedang Mengerjakan</span>
            <Activity className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-800 mt-1">{activeCount}</div>
          <span className="text-[11px] text-emerald-600 font-medium">Gadget aktif</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Peringatan Layar</span>
            <ShieldAlert className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-700 mt-1">{warningCount}</div>
          <span className="text-[11px] text-amber-600 font-medium">Terdeteksi pindah tab</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Sudah Kumpulkan</span>
            <CheckCircle className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-indigo-700 mt-1">{submittedCount}</div>
          <span className="text-[11px] text-indigo-600 font-medium">Selesai dinilai</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Total Terkoneksi</span>
            <Users className="w-4 h-4 text-slate-600" />
          </div>
          <div className="text-2xl font-bold text-slate-800 mt-1">{liveList.length}</div>
          <span className="text-[11px] text-slate-500">Peserta tercatat</span>
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
            placeholder="Cari siswa atau NISN..."
            className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          {[
            { id: 'all', label: 'Semua' },
            { id: 'warning', label: 'Ada Peringatan' },
            { id: 'submitted', label: 'Selesai' },
            { id: 'online', label: 'Online' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterStatus(f.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                filterStatus === f.id
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Student Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredList.length === 0 ? (
          <div className="col-span-full bg-white p-12 text-center rounded-2xl border border-slate-200">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="font-bold text-slate-700 text-sm">Belum Ada Siswa Terhubung</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Siswa yang masuk ke ruang ujian dengan token {session.sessionCode} akan otomatis muncul di sini.
            </p>
          </div>
        ) : (
          filteredList.map((p) => {
            const progressPct =
              p.totalQuestions > 0 ? Math.round((p.answeredCount / p.totalQuestions) * 100) : 0;

            return (
              <div
                key={p.studentId}
                className={`bg-white rounded-2xl border p-5 shadow-xs transition-all flex flex-col justify-between space-y-4 ${
                  p.tabBlurCount > 2
                    ? 'border-red-300 ring-2 ring-red-100'
                    : p.status === 'submitted'
                    ? 'border-emerald-200 bg-emerald-50/20'
                    : 'border-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold text-slate-600">{p.studentId}</span>
                    <div className="flex items-center gap-1.5">
                      {p.isOnline ? (
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          Online
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[11px] text-slate-400">
                          <WifiOff className="w-3 h-3" /> Offline
                        </span>
                      )}
                    </div>
                  </div>

                  <h4 className="font-bold text-slate-800 text-sm">{p.studentName}</h4>
                  <p className="text-xs text-slate-500">Kelas: {p.classId}</p>

                  {/* Device & Battery */}
                  <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      {p.device.includes('Smart') ? (
                        <Smartphone className="w-3.5 h-3.5 text-indigo-500" />
                      ) : (
                        <Monitor className="w-3.5 h-3.5 text-indigo-500" />
                      )}
                      <span>{p.device}</span>
                    </span>
                    {p.batteryLevel !== undefined && (
                      <span className="flex items-center gap-1">
                        <Battery className="w-3.5 h-3.5 text-emerald-500" />
                        <span>{p.batteryLevel}%</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-2 pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Progres Pengerjaan</span>
                    <span className="font-bold text-slate-700">
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
                      <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-md font-semibold flex items-center gap-1">
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
