import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  X,
  Trash2,
  Zap,
  ShieldCheck,
} from 'lucide-react';
import { api } from '../services/api';

interface GeminiApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeyUpdated?: () => void;
}

export const GeminiApiKeyModal: React.FC<GeminiApiKeyModalProps> = ({
  isOpen,
  onClose,
  onKeyUpdated,
}) => {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [isCustom, setIsCustom] = useState(false);
  const [maskedKey, setMaskedKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadKeyStatus();
    }
  }, [isOpen]);

  const loadKeyStatus = async () => {
    setIsLoading(true);
    setFeedback(null);
    try {
      const localKey = localStorage.getItem('educbt_gemini_api_key') || '';
      if (localKey) {
        setApiKey(localKey);
      }
      const info = await api.getGeminiApiKeyInfo();
      setIsConfigured(info.isConfigured);
      setIsCustom(info.isCustom);
      setMaskedKey(info.maskedKey);
      if (localKey && !info.isCustom) {
        // Sync local key to server
        await api.saveGeminiApiKey(localKey);
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setFeedback(null);

    const cleanKey = apiKey.trim();
    try {
      const res = await api.saveGeminiApiKey(cleanKey);
      setIsConfigured(res.isConfigured);
      setIsCustom(res.isCustom);
      setMaskedKey(res.maskedKey);
      setFeedback({
        type: 'success',
        message: cleanKey
          ? 'Gemini API Key berhasil disimpan & siap digunakan untuk Generator Soal AI!'
          : 'Gemini API Key kustom telah dihapus.',
      });
      if (onKeyUpdated) onKeyUpdated();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Gagal menyimpan API Key.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setFeedback(null);
    const keyToTest = apiKey.trim();
    try {
      const res = await api.testGeminiApiKey(keyToTest || undefined);
      if (res.success) {
        setFeedback({
          type: 'success',
          message: `${res.message || 'Koneksi ke Gemini AI berhasil!'} Model: gemini-3.8-flash aktif merespons.`,
        });
      } else {
        setFeedback({
          type: 'error',
          message: res.error || 'Uji koneksi gagal. Pastikan API Key valid dan memiliki kuota.',
        });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Terjadi kesalahan saat menguji API Key.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleClearKey = async () => {
    if (confirm('Yakin ingin menghapus Gemini API Key kustom dari aplikasi?')) {
      setApiKey('');
      localStorage.removeItem('educbt_gemini_api_key');
      setIsLoading(true);
      try {
        const res = await api.saveGeminiApiKey('');
        setIsConfigured(res.isConfigured);
        setIsCustom(false);
        setMaskedKey(res.maskedKey);
        setFeedback({
          type: 'success',
          message: 'API Key kustom telah dihapus.',
        });
        if (onKeyUpdated) onKeyUpdated();
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText('https://aistudio.google.com/app/apikey');
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col my-8">
        {/* Header */}
        <div className="px-6 py-5 bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-indigo-900/50">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-indigo-500/20 border border-indigo-400/30 rounded-2xl flex items-center justify-center text-yellow-300 shadow-inner">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">Pengaturan Gemini API Key</h2>
              <p className="text-xs text-indigo-200/80">
                Integrasi Google Gemini AI untuk Generator Soal Ujian Otomatis
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[78vh]">
          {/* Status Badge Card */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className={`w-3.5 h-3.5 rounded-full ${
                  isConfigured ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'
                }`}
              />
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  Status API Key: {isConfigured ? 'Terhubung & Aktif' : 'Belum Dikonfigurasi'}
                </span>
                <span className="text-[11px] text-slate-500 font-mono">
                  {maskedKey ? `Kunci aktif: ${maskedKey}` : 'Belum ada API Key aktif'}
                  {isCustom ? ' (Kustom Pribadi)' : isConfigured ? ' (Default Sistem)' : ''}
                </span>
              </div>
            </div>

            <span
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                isConfigured
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : 'bg-amber-100 text-amber-800 border border-amber-200'
              }`}
            >
              {isConfigured ? 'Siap Digunakan' : 'Perlu Input'}
            </span>
          </div>

          {/* Alert / Feedback message */}
          {feedback && (
            <div
              className={`p-4 rounded-2xl text-xs flex items-start gap-2.5 animate-in fade-in duration-150 ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 font-medium leading-relaxed">{feedback.message}</div>
            </div>
          )}

          {/* Form Input Key */}
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Google Gemini API Key *</span>
                </label>
                {apiKey && (
                  <button
                    type="button"
                    onClick={() => setApiKey('')}
                    className="text-[11px] text-slate-400 hover:text-red-500 cursor-pointer font-medium"
                  >
                    Kosongkan input
                  </button>
                )}
              </div>

              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Masukkan Gemini API Key (contoh: AIzaSy...)"
                  className="w-full pl-3.5 pr-10 py-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none transition-all shadow-inner"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-700 cursor-pointer"
                  title={showKey ? 'Sembunyikan karakter' : 'Tampilkan karakter'}
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed">
                * Kunci API Anda disimpan secara aman dan digunakan untuk memproses pembuatan soal dengan model{' '}
                <strong className="text-indigo-700 font-mono">gemini-3.8-flash</strong>.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Simpan & Aktifkan</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting}
                className="py-2.5 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 disabled:opacity-50 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
                title="Kirim permintaan uji coba singkat ke Google Gemini"
              >
                {isTesting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
                    <span>Menguji...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 text-emerald-600" />
                    <span>Uji Koneksi</span>
                  </>
                )}
              </button>

              {(isCustom || apiKey) && (
                <button
                  type="button"
                  onClick={handleClearKey}
                  disabled={isLoading}
                  className="p-2.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl text-xs font-semibold flex items-center justify-center transition-all cursor-pointer"
                  title="Hapus API Key kustom"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </form>

          {/* How to get API Key Box */}
          <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Cara Mendapatkan Gemini API Key Gratis:</span>
              </span>

              <button
                type="button"
                onClick={handleCopyLink}
                className="text-[11px] text-indigo-700 hover:text-indigo-900 font-semibold flex items-center gap-1 bg-white px-2 py-0.5 rounded-md border border-indigo-200 shadow-2xs cursor-pointer"
              >
                {copiedLink ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copiedLink ? 'Tersalin!' : 'Salin URL'}</span>
              </button>
            </div>

            <ol className="text-xs text-slate-700 space-y-1.5 list-decimal list-inside leading-relaxed">
              <li>
                Buka laman resmi{' '}
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-700 font-bold hover:underline inline-flex items-center gap-0.5"
                >
                  Google AI Studio <ExternalLink className="w-3 h-3 inline" />
                </a>
              </li>
              <li>Masuk menggunakan akun Google Anda (email pribadi atau belajar.id).</li>
              <li>Klik tombol <strong>"Create API key"</strong> di pojok kanan atas.</li>
              <li>Salin string API key yang muncul, lalu tempelkan pada kolom di atas dan klik <strong>"Simpan & Aktifkan"</strong>.</li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <p className="text-[11px] text-slate-500">
            Model AI: <strong>gemini-3.8-flash</strong> (Standar Kurikulum Merdeka & HOTS)
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
