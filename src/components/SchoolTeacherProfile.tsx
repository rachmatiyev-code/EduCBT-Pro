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
} from 'lucide-react';
import { SchoolProfile, Teacher, Subject } from '../types/cbt';
import { api } from '../services/api';
import { ChangePasswordModal } from './ChangePasswordModal';

interface SchoolTeacherProfileProps {
  schoolProfile: SchoolProfile;
  teachers: Teacher[];
  subjects: Subject[];
  onRefreshData: () => void;
}

export const SchoolTeacherProfile: React.FC<SchoolTeacherProfileProps> = ({
  schoolProfile,
  teachers,
  subjects,
  onRefreshData,
}) => {
  const [profile, setProfile] = useState<SchoolProfile>(schoolProfile);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [teacherToChangePassword, setTeacherToChangePassword] = useState<Teacher | null>(null);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
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
            Konfigurasi lembaga pendidikan, kop surat resmi ujian, dan data pendidik/guru pengampu
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
      <div className="bg-white rounded-2xl border-2 border-dashed border-slate-300 p-6 shadow-xs text-center space-y-1">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
          [ Pratinjau Kop Surat Resmi Ujian CBT ]
        </span>
        <h3 className="text-lg font-extrabold uppercase tracking-wide text-slate-900">
          PEMERINTAH PROVINSI / DAERAH KHUSUS
        </h3>
        <h2 className="text-xl font-black text-indigo-900 uppercase">
          {profile.name || 'NAMA SEKOLAH'}
        </h2>
        <p className="text-xs text-slate-600 max-w-xl mx-auto">
          NPSN: {profile.npsn} • {profile.address} • Telp: {profile.phone}
        </p>
        <p className="text-xs text-slate-500 font-mono">
          Email: {profile.email} • Tahun Ajaran: {profile.academicYear} ({profile.semester})
        </p>
        <div className="border-b-2 border-slate-800 pt-3" />
        <div className="border-b border-slate-400 pt-0.5" />
      </div>

      {/* Form Fields: School Identity */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
        <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
          <Building className="w-4 h-4 text-indigo-600" />
          <span>Informasi Lembaga Sekolah</span>
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
        <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-indigo-600" />
          <span>Daftar Guru & Pendidik Terdaftar ({teachers.length})</span>
        </h3>

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
