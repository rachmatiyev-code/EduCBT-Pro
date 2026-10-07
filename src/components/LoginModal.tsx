import React, { useState } from 'react';
import {
  Shield,
  GraduationCap,
  KeyRound,
  User,
  ArrowRight,
  School,
  Lock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Teacher, Student, ExamSession } from '../types/cbt';

interface LoginModalProps {
  teachers: Teacher[];
  students: Student[];
  sessions: ExamSession[];
  onLoginTeacher: (teacher: Teacher) => void;
  onLoginStudent: (student: Student, session: ExamSession) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  teachers,
  students,
  sessions,
  onLoginTeacher,
  onLoginStudent,
}) => {
  const [roleMode, setRoleMode] = useState<'student' | 'teacher'>('student');

  // Student login fields
  const [nisn, setNisn] = useState('');
  const [sessionToken, setSessionToken] = useState('CBT-2026');
  const [studentError, setStudentError] = useState('');

  // Teacher login fields
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(teachers[0]?.id || '');
  const [teacherPassword, setTeacherPassword] = useState('123456');

  const handleStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStudentError('');

    const cleanNisn = nisn.trim();
    const cleanToken = sessionToken.trim().toUpperCase();

    if (!cleanNisn || !cleanToken) {
      setStudentError('Harap isi NISN dan Token Ujian!');
      return;
    }

    // Match student
    const matchedStudent = students.find((s) => s.nisn === cleanNisn);
    if (!matchedStudent) {
      setStudentError(`NISN "${cleanNisn}" tidak ditemukan di database siswa.`);
      return;
    }

    // Match session token
    const matchedSession = sessions.find((s) => s.sessionCode.toUpperCase() === cleanToken);
    if (!matchedSession) {
      setStudentError(`Token Sesi Ujian "${cleanToken}" tidak aktif atau tidak ditemukan.`);
      return;
    }

    onLoginStudent(matchedStudent, matchedSession);
  };

  const handleTeacherSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const t = teachers.find((x) => x.id === selectedTeacherId) || teachers[0];
    if (t) {
      onLoginTeacher(t);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decorative Glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Brand Banner */}
        <div className="bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-7 text-center space-y-2 border-b border-indigo-900/50">
          <div className="w-14 h-14 bg-indigo-600/30 border border-indigo-400/30 rounded-2xl flex items-center justify-center mx-auto mb-1 text-indigo-300">
            <School className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-extrabold tracking-tight">EduCBT Pro Cloud</h1>
          <p className="text-xs text-indigo-200/80">
            Sistem Ujian Online Terpadu & Generator Soal AI
          </p>
        </div>

        {/* Role Toggle Switch */}
        <div className="p-4 pb-0 bg-slate-50 border-b border-slate-200">
          <div className="bg-slate-200/80 p-1 rounded-xl flex items-center text-xs font-bold">
            <button
              type="button"
              onClick={() => setRoleMode('student')}
              className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                roleMode === 'student'
                  ? 'bg-white text-indigo-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Portal Siswa</span>
            </button>
            <button
              type="button"
              onClick={() => setRoleMode('teacher')}
              className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                roleMode === 'teacher'
                  ? 'bg-white text-indigo-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Guru / Admin</span>
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-7 space-y-5">
          {roleMode === 'student' ? (
            <form onSubmit={handleStudentSubmit} className="space-y-4">
              <div>
                <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider block mb-1">
                  Masuk Ruang Ujian Siswa
                </span>
                <p className="text-xs text-slate-500">
                  Masukkan NISN Anda dan Token Ujian yang diberikan oleh pengawas
                </p>
              </div>

              {studentError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{studentError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  NISN (Nomor Induk Siswa Nasional)
                </label>
                <input
                  type="text"
                  value={nisn}
                  onChange={(e) => setNisn(e.target.value)}
                  placeholder="Contoh: 0071234001"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                <div className="flex flex-wrap gap-1.5 pt-1 text-[11px] text-slate-500">
                  <span>Pilih cepat:</span>
                  {students.slice(0, 3).map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setNisn(st.nisn)}
                      className="text-indigo-600 hover:underline font-mono"
                    >
                      {st.nisn} ({st.name.split(' ')[0]})
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Token Sesi Ujian (Karakter)
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={sessionToken}
                    onChange={(e) => setSessionToken(e.target.value.toUpperCase())}
                    placeholder="Contoh: CBT-2026"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold tracking-wider text-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                {sessions.length > 0 && (
                  <p className="text-[11px] text-emerald-600 font-medium pt-0.5">
                    * Sesi aktif tersedia: {sessions[0].sessionCode} ({sessions[0].title.substring(0, 32)}...)
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer mt-2"
              >
                <span>Masuk & Mulai Mengerjakan</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleTeacherSubmit} className="space-y-4">
              <div>
                <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider block mb-1">
                  Autentikasi Guru / Pendidik
                </span>
                <p className="text-xs text-slate-500">
                  Akses modul bank soal, AI generator, live monitoring, dan sinkronisasi GDrive
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Pilih Akun Guru / Pengawas
                </label>
                <select
                  value={selectedTeacherId}
                  onChange={(e) => setSelectedTeacherId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.role.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Kata Sandi
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    value={teacherPassword}
                    onChange={(e) => setTeacherPassword(e.target.value)}
                    placeholder="••••••"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer mt-2"
              >
                <span>Masuk ke Dasbor Guru</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
          <p className="text-[11px] text-slate-500">
            EduCBT Pro Cloud • Kurikulum Merdeka Terintegrasi Google Workspace
          </p>
        </div>
      </div>
    </div>
  );
};
