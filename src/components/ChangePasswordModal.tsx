import React, { useState } from 'react';
import {
  KeyRound,
  Lock,
  CheckCircle2,
  AlertCircle,
  X,
  Eye,
  EyeOff,
  ShieldCheck,
} from 'lucide-react';
import { Teacher } from '../types/cbt';
import { api } from '../services/api';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTeacher: Teacher;
  onPasswordChanged: (updatedTeacher: Teacher) => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
  currentTeacher,
  onPasswordChanged,
}) => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!oldPassword.trim()) {
      setErrorMsg('Kata sandi lama wajib diisi!');
      return;
    }

    if (!newPassword.trim()) {
      setErrorMsg('Kata sandi baru wajib diisi!');
      return;
    }

    if (newPassword.length < 4) {
      setErrorMsg('Kata sandi baru minimal 4 karakter!');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Konfirmasi kata sandi baru tidak cocok!');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.changeTeacherPassword({
        teacherId: currentTeacher.id,
        oldPassword: oldPassword.trim(),
        newPassword: newPassword.trim(),
      });

      if (res.success && res.teacher) {
        setSuccessMsg('Kata sandi berhasil diperbarui!');
        onPasswordChanged(res.teacher);
        setTimeout(() => {
          onClose();
          setOldPassword('');
          setNewPassword('');
          setConfirmPassword('');
          setSuccessMsg('');
        }, 1500);
      } else {
        setErrorMsg(res.error || 'Gagal mengubah kata sandi.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-linear-to-r from-slate-900 to-indigo-950 text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-600/30 border border-indigo-400/30 rounded-xl text-indigo-300">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Ubah Kata Sandi Guru / Admin</h3>
              <p className="text-[11px] text-indigo-200/80">{currentTeacher.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="block font-semibold text-slate-700">
              Kata Sandi Saat Ini (Lama)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type={showOld ? 'text' : 'password'}
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="Masukkan kata sandi lama (bawaan: 1234)"
                className="w-full pl-9 pr-9 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowOld(!showOld)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                {showOld ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[10px] text-slate-500">* Kata sandi default awal adalah 1234</p>
          </div>

          <div className="space-y-1">
            <label className="block font-semibold text-slate-700">
              Kata Sandi Baru
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimal 4 karakter"
                className="w-full pl-9 pr-9 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="block font-semibold text-slate-700">
              Konfirmasi Kata Sandi Baru
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ketik ulang kata sandi baru"
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Kata Sandi Baru'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
