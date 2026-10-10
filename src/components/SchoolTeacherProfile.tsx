import React, { useState } from 'react';
import {
  School,
  UserCheck,
  Building,
  Save,
  CheckCircle,
  FileCheck,
  Mail,
  Phone,
  MapPin,
  Shield,
  FileText,
  KeyRound,
  Sparkles,
  UserPlus,
  Eye,
  EyeOff,
  Lock,
  AlertCircle,
  X,
} from 'lucide-react';
import { SchoolProfile, Teacher, Subject } from '../types/cbt';
import { api } from '../services/api';
import { ChangePasswordModal } from './ChangePasswordModal';

interface SchoolTeacherProfileProps {
  schoolProfile: SchoolProfile;
  teachers: Teacher[];
  subjects: Subject[];
  onRefreshData: () => void;
  onOpenGeminiModal?: () => void;
}

export const SchoolTeacherProfile: React.FC<SchoolTeacherProfileProps> = ({
  schoolProfile,
  teachers,
  subjects,
  onRefreshData,
  onOpenGeminiModal,
}) => {
  const [profile, setProfile] = useState<SchoolProfile>(schoolProfile);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [teacherToChangePassword, setTeacherToChangePassword] = useState<Teacher | null>(null);

  // Add teacher state
  const [isAddTeacherOpen, setIsAddTeacherOpen] = useState(false);
  const [newTeacherName, setNewTeacherName] = useState('');
  const [newTeacherNip, setNewTeacherNip] = useState('');
  const [newTeacherEmail, setNewTeacherEmail] = useState('');
  const [newTeacherRole, setNewTeacherRole] = useState<'guru' | 'admin'>('guru');
  const [newTeacherPassword, setNewTeacherPassword] = useState('1234');
  const [showNewTeacherPass, setShowNewTeacherPass] = useState(false);
  const [isSubmittingTeacher, setIsSubmittingTeacher] = useState(false);
  const [teacherActionError, setTeacherActionError] = useState('');
  const [teacherActionSuccess, setTeacherActionSuccess] = useState('');

  const handleRegisterNewTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setTeacherActionError('');
    setTeacherActionSuccess('');

    if (!newTeacherName.trim()) {
      setTeacherActionError('Nama lengkap guru wajib diisi!');
      return;
    }
    if (!newTeacherPassword.trim() || newTeacherPassword.length < 4) {
      setTeacherActionError('Kata sandi minimal 4 karakter!');
      return;
    }

    setIsSubmittingTeacher(true);
    const cleanPassword = newTeacherPassword.trim();
    try {
      const res = await api.registerTeacher({
        name: newTeacherName.trim(),
        nip: newTeacherNip.trim() || undefined,
        email: newTeacherEmail.trim() || undefined,
        role: newTeacherRole,
        password: cleanPassword,
      });

      if (res && res.success) {
        const createdTeacher = res.teacher;
        if (createdTeacher) {
          try {
            const passMap = JSON.parse(localStorage.getItem('educbt_teacher_saved_passwords') || '{}');
            passMap[createdTeacher.id] = cleanPassword;
            localStorage.setItem('educbt_teacher_saved_passwords', JSON.stringify(passMap));
            localStorage.setItem('educbt_last_teacher_id', createdTeacher.id);

            const cachedTeachers = JSON.parse(localStorage.getItem('educbt_custom_teachers') || '[]');
            const filtered = cachedTeachers.filter((t: Teacher) => t.id !== createdTeacher.id);
            filtered.unshift(createdTeacher);
            localStorage.setItem('educbt_custom_teachers', JSON.stringify(filtered));
          } catch {}
        }
        onRefreshData();
        setTeacherActionSuccess(`Akun Guru "${newTeacherName}" berhasil ditambahkan dan disimpan ke sistem CBT!`);
        setNewTeacherName('');
        setNewTeacherNip('');
        setNewTeacherEmail('');
        setNewTeacherPassword('1234');
        setIsAddTeacherOpen(false);
      } else {
        setTeacherActionError(res?.error || 'Gagal menambahkan guru');
      }
    } catch (err: any) {
      setTeacherActionError(err.message || 'Gagal menambahkan guru');
    } finally {
      setIsSubmittingTeacher(false);
    }
  };

  // Sync state if schoolProfile prop updates
  React.useEffect(() => {
    setProfile(schoolProfile);
  }, [schoolProfile]);

  const handleApplyPreset = (regional: string, dept: string) => {
    setProfile((prev) => ({
      ...prev,
      regionalGovernment: regional,
      educationDepartment: dept,
    }));
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      try {
        localStorage.setItem('educbt_school_profile', JSON.stringify(profile));
      } catch {}
      await api.saveSchoolProfile(profile);
      setSaveSuccess(true);
      onRefreshData();
      setTimeout(() => setSaveSuccess(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <School className="w-6 h-6 text-indigo-600" />
            <span>Identitas Sekolah & Profil Pendidik</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Konfigurasi lembaga pendidikan, pemerintah daerah, dinas pendidikan, kop surat resmi ujian, dan data guru
          </p>
        </div>

        <button
          onClick={handleSaveProfile}
          disabled={isSaving}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs cursor-pointer"
        >
          {saveSuccess ? (
            <>
              <CheckCircle className="w-4 h-4 text-emerald-300" />
              <span>Tersimpan!</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Menyimpan...' : 'Simpan Identitas Sekolah'}</span>
            </>
          )}
        </button>
      </div>

      {/* Official Letterhead (Kop Surat) Preview */}
      <div className="bg-white rounded-2xl border-2 border-dashed border-slate-300 p-6 shadow-xs text-center space-y-1.5">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
          [ Pratinjau Kop Surat Resmi Ujian CBT ]
        </span>
        <h3 className="text-base sm:text-lg font-extrabold uppercase tracking-wide text-slate-800 leading-snug">
          {profile.regionalGovernment || 'PEMERINTAH DAERAH PROVINSI / KABUPATEN / KOTA'}
        </h3>
        <h4 className="text-sm sm:text-base font-bold uppercase tracking-wider text-slate-700 leading-snug">
          {profile.educationDepartment || 'DINAS PENDIDIKAN DAN KEBUDAYAAN'}
        </h4>
        <h2 className="text-xl sm:text-2xl font-black text-indigo-900 uppercase pt-1">
          {profile.name || 'NAMA SEKOLAH'}
        </h2>
        <p className="text-xs text-slate-600 max-w-2xl mx-auto pt-0.5">
          NPSN: {profile.npsn} • {profile.address} • Telp: {profile.phone}
        </p>
        <p className="text-xs text-slate-500 font-mono">
          Email: {profile.email} • Tahun Ajaran: {profile.academicYear} ({profile.semester})
        </p>
        <div className="border-b-2 border-slate-800 pt-3" />
        <div className="border-b border-slate-400 pt-0.5" />
      </div>

      {/* Form Section 1: Pemerintah Daerah & Dinas Pendidikan */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <Building className="w-4 h-4 text-indigo-600" />
            <span>Pemerintah Daerah & Dinas Pendidikan (Kop Surat Ujian)</span>
          </h3>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-semibold text-slate-500 mr-1">Preset Instansi:</span>
            <button
              type="button"
              onClick={() => handleApplyPreset('PEMERINTAH DAERAH PROVINSI DKI JAKARTA', 'DINAS PENDIDIKAN DAN KEBUDAYAAN')}
              className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 rounded-lg text-[11px] font-medium border border-slate-200 transition-colors cursor-pointer"
            >
              Provinsi (SMA/SMK/SLB)
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('PEMERINTAH KABUPATEN / KOTA', 'DINAS PENDIDIKAN DAN KEBUDAYAAN')}
              className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 rounded-lg text-[11px] font-medium border border-slate-200 transition-colors cursor-pointer"
            >
              Kabupaten / Kota (SD/SMP)
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('KEMENTERIAN AGAMA REPUBLIK INDONESIA', 'KANTOR KEMENTERIAN AGAMA KABUPATEN/KOTA')}
              className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 rounded-lg text-[11px] font-medium border border-slate-200 transition-colors cursor-pointer"
            >
              Kemenag (Madrasah)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 uppercase mb-1">
              Pemerintah Daerah (Provinsi / Kabupaten / Kota) *
            </label>
            <input
              type="text"
              value={profile.regionalGovernment || ''}
              onChange={(e) => setProfile({ ...profile, regionalGovernment: e.target.value })}
              placeholder="Contoh: PEMERINTAH DAERAH PROVINSI DKI JAKARTA atau PEMERINTAH KABUPATEN BOGOR"
              className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Baris paling atas pada kop surat resmi instansi pembina sekolah
            </p>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 uppercase mb-1">
              Dinas Pendidikan dan Kebudayaan *
            </label>
            <input
              type="text"
              value={profile.educationDepartment || ''}
              onChange={(e) => setProfile({ ...profile, educationDepartment: e.target.value })}
              placeholder="Contoh: DINAS PENDIDIKAN DAN KEBUDAYAAN"
              className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Baris kedua pada kop surat (instansi dinas / kementerian terkait)
            </p>
          </div>
        </div>
      </div>

      {/* Form Fields: School Identity */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
        <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
          <Building className="w-4 h-4 text-indigo-600" />
          <span>Informasi Satuan Pendidikan (Sekolah)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="md:col-span-2">
            <label className="block font-semibold text-slate-700 uppercase mb-1">
              Nama Lengkap Sekolah
            </label>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 uppercase mb-1">
              NPSN (Nomor Pokok Sekolah Nasional)
            </label>
            <input
              type="text"
              value={profile.npsn}
              onChange={(e) => setProfile({ ...profile, npsn: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
            />
          </div>

          <div className="md:col-span-3">
            <label className="block font-semibold text-slate-700 uppercase mb-1">
              Alamat Lengkap Sekolah
            </label>
            <input
              type="text"
              value={profile.address}
              onChange={(e) => setProfile({ ...profile, address: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 uppercase mb-1">
              No. Telepon / Fax
            </label>
            <input
              type="text"
              value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 uppercase mb-1">
              Email Resmi Sekolah
            </label>
            <input
              type="email"
              value={profile.email}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 uppercase mb-1">
              Tahun Ajaran Aktif
            </label>
            <input
              type="text"
              value={profile.academicYear}
              onChange={(e) => setProfile({ ...profile, academicYear: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-300 text-xs font-bold text-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 uppercase mb-1">
              Semester
            </label>
            <select
              value={profile.semester}
              onChange={(e) => setProfile({ ...profile, semester: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="Ganjil">Semester Ganjil</option>
              <option value="Genap">Semester Genap</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 uppercase mb-1">
              Nama Kepala Sekolah
            </label>
            <input
              type="text"
              value={profile.principalName}
              onChange={(e) => setProfile({ ...profile, principalName: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 uppercase mb-1">
              NIP Kepala Sekolah
            </label>
            <input
              type="text"
              value={profile.principalNip}
              onChange={(e) => setProfile({ ...profile, principalNip: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Teachers / Educators Directory */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-indigo-600" />
              <span>Daftar Guru & Pendidik Terdaftar ({teachers.length})</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Akun guru yang terdaftar dapat digunakan untuk login ke portal ujian CBT
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setIsAddTeacherOpen(true);
              setTeacherActionError('');
            }}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 cursor-pointer transition-all shrink-0 self-start sm:self-auto"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Tambah Akun Guru</span>
          </button>
        </div>

        {teacherActionSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{teacherActionSuccess}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {teachers.map((t) => (
            <div
              key={t.id}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-start justify-between"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                      t.role === 'admin'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-indigo-100 text-indigo-700'
                    }`}
                  >
                    {t.role}
                  </span>
                  <span className="text-xs font-mono text-slate-500">NIP: {t.nip}</span>
                </div>
                <h4 className="font-bold text-slate-800 text-sm">{t.name}</h4>
                <p className="text-xs text-slate-500 mt-0.5">{t.email}</p>
                <button
                  type="button"
                  onClick={() => setTeacherToChangePassword(t)}
                  className="mt-2.5 px-3 py-1 bg-white hover:bg-indigo-50 text-indigo-700 border border-slate-200 hover:border-indigo-300 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                >
                  <KeyRound className="w-3 h-3 text-indigo-600" />
                  <span>Ubah Kata Sandi</span>
                </button>
              </div>

              <div className="p-2 rounded-xl bg-white border border-slate-200">
                <Shield className="w-4 h-4 text-indigo-600" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Tambah Guru Baru */}
      {isAddTeacherOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-4.5 bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-500/20 border border-indigo-400/30 rounded-xl text-indigo-300">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Tambah Akun Guru Baru</h3>
                  <p className="text-[11px] text-indigo-200/80">
                    Daftarkan guru pengampu atau administrator ujian CBT
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddTeacherOpen(false)}
                className="p-1.5 text-white/70 hover:text-white rounded-lg hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleRegisterNewTeacher} className="p-6 space-y-4 text-xs">
              {teacherActionError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{teacherActionError}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700 uppercase">
                  Nama Lengkap & Gelar Guru <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newTeacherName}
                  onChange={(e) => setNewTeacherName(e.target.value)}
                  placeholder="Contoh: Drs. H. Bambang Pamungkas, M.Pd."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase">
                    NIP / NUPTK
                  </label>
                  <input
                    type="text"
                    value={newTeacherNip}
                    onChange={(e) => setNewTeacherNip(e.target.value)}
                    placeholder="1985..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase">
                    Peran / Hak Akses
                  </label>
                  <select
                    value={newTeacherRole}
                    onChange={(e) => setNewTeacherRole(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="guru">Guru Pengampu</option>
                    <option value="admin">Administrator CBT</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700 uppercase">
                  Alamat Email (Opsional)
                </label>
                <input
                  type="email"
                  value={newTeacherEmail}
                  onChange={(e) => setNewTeacherEmail(e.target.value)}
                  placeholder="guru@sekolah.sch.id"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-700 uppercase">
                    Kata Sandi Akun <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Bawaan: 1234
                  </span>
                </div>
                <div className="relative">
                  <input
                    type={showNewTeacherPass ? 'text' : 'password'}
                    value={newTeacherPassword}
                    onChange={(e) => setNewTeacherPassword(e.target.value)}
                    placeholder="1234"
                    className="w-full pl-3.5 pr-9 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewTeacherPass(!showNewTeacherPass)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showNewTeacherPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Kata sandi ini tersimpan otomatis di halaman login untuk akun guru yang dibuat.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddTeacherOpen(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTeacher || !newTeacherName.trim()}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 cursor-pointer transition-all"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{isSubmittingTeacher ? 'Menyimpan...' : 'Simpan Akun Guru'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Gemini AI Integration Section */}
      <div className="bg-linear-to-r from-indigo-900 via-indigo-950 to-slate-900 rounded-2xl border border-indigo-800/40 p-6 shadow-sm text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-yellow-300 border border-white/10 shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-sm tracking-tight">Integrasi Google Gemini AI (Kurikulum Merdeka)</h3>
            <p className="text-xs text-indigo-200/80 mt-0.5 max-w-xl">
              Hubungkan Google Gemini API Key Anda sendiri untuk mengaktifkan generator butir soal HOTS otomatis, stimulus bacaan analitis, dan pembahasan instan.
            </p>
          </div>
        </div>

        {onOpenGeminiModal && (
          <button
            type="button"
            onClick={onOpenGeminiModal}
            className="px-4 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-bold rounded-xl text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer shrink-0"
          >
            <KeyRound className="w-4 h-4" />
            <span>Pengaturan Gemini API Key</span>
          </button>
        )}
      </div>

      {/* Change Password Modal */}
      {teacherToChangePassword && (
        <ChangePasswordModal
          isOpen={true}
          onClose={() => setTeacherToChangePassword(null)}
          currentTeacher={teacherToChangePassword}
          onPasswordChanged={() => {
            onRefreshData();
          }}
        />
      )}
    </div>
  );
};
