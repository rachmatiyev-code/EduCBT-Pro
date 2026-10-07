import React, { useState, useEffect } from 'react';
import {
  Cloud,
  CheckCircle2,
  Copy,
  ExternalLink,
  Check,
  AlertCircle,
  Database,
  RefreshCw,
  FolderOpen,
  FileSpreadsheet,
  X,
  ShieldCheck,
} from 'lucide-react';
import { GOOGLE_APPS_SCRIPT_CODE } from '../lib/gasTemplate';
import { api } from '../services/api';

interface GoogleDriveSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GoogleDriveSyncModal: React.FC<GoogleDriveSyncModalProps> = ({ isOpen, onClose }) => {
  const [webhookUrl, setWebhookUrl] = useState('');
  const [copiedScript, setCopiedScript] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isBackingUp, setIsBackingUp] = useState(false);

  useEffect(() => {
    if (isOpen) {
      api.getGasWebhook().then((url) => setWebhookUrl(url));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyScript = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  const handleTestAndSave = async () => {
    const cleanUrl = webhookUrl.trim();
    if (!cleanUrl) {
      alert('Masukkan URL Google Apps Script Web App!');
      return;
    }

    if (cleanUrl.includes('/edit')) {
      setTestResult({
        success: false,
        message:
          'URL yang Anda masukkan adalah URL Editor script (/edit), bukan URL Web App (/exec). Harap deploy sebagai Web App (Deploy -> New deployment -> Web app -> Anyone) lalu salin URL akhiran /exec.',
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await api.testGasConnection(cleanUrl);
      if (res.success) {
        await api.setGasWebhook(cleanUrl);
        setTestResult({
          success: true,
          message:
            'Koneksi Berhasil! Folder "EduCBT_Cloud_Database" dan Google Sheets di GDrive terhubung.',
        });
      } else {
        setTestResult({
          success: false,
          message: res.error || 'Gagal terhubung dengan Web App.',
        });
      }
    } catch (e: any) {
      setTestResult({
        success: false,
        message: e?.message || 'Terjadi kesalahan saat menguji koneksi.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveDirectly = async () => {
    const cleanUrl = webhookUrl.trim();
    if (!cleanUrl) {
      alert('Masukkan URL Google Apps Script Web App!');
      return;
    }
    await api.setGasWebhook(cleanUrl);
    setTestResult({
      success: true,
      message: 'URL Web App berhasil disimpan ke konfigurasi sistem!',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-linear-to-r from-emerald-700 via-teal-700 to-cyan-800 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 rounded-2xl backdrop-blur-md">
              <Cloud className="w-6 h-6 text-emerald-200" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">
                Integrasi Cloud Google Drive & Google Sheets (GAS)
              </h2>
              <p className="text-xs text-emerald-100">
                Solusi database terpusat persisten, anti error 404, dan bebas Firebase
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-700">
          {/* Cloud Structure Visual Card */}
          <div className="bg-emerald-50/70 p-5 rounded-2xl border border-emerald-200 space-y-3">
            <h3 className="font-bold text-emerald-900 text-sm flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-emerald-700" />
              <span>Arsitektur Folder Terpusat di Google Drive Anda:</span>
            </h3>

            <div className="bg-white p-4 rounded-xl border border-emerald-200 font-mono text-[11px] space-y-2 text-slate-800">
              <div className="flex items-center gap-2 font-bold text-emerald-800">
                <span>📁 My Drive /</span>
                <span className="bg-emerald-100 px-2 py-0.5 rounded text-emerald-900">
                  EduCBT_Cloud_Database/
                </span>
                <span className="text-[10px] text-emerald-600 font-normal">
                  (Folder Cloud Utama Terpusat)
                </span>
              </div>
              <div className="pl-6 space-y-1.5 border-l-2 border-emerald-200 ml-2">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="font-semibold text-slate-800">
                    EduCBT_Master_Database (Spreadsheet)
                  </span>
                  <span className="text-[10px] text-slate-500">
                    ➔ Sheet: Submissions, Sessions, Bank_Soal, Live_Monitor
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <FolderOpen className="w-3.5 h-3.5 text-teal-600" />
                  <span className="font-semibold text-slate-800">EduCBT_Media_Assets/</span>
                  <span className="text-[10px] text-slate-500">
                    ➔ Wadah terpusat berkas audio, video, dan gambar soal
                  </span>
                </div>
              </div>
            </div>
            <p className="text-[11px] text-emerald-800 leading-relaxed">
              * Seluruh jawaban ujian siswa, rekaman live proctoring, dan bank soal akan disimpan dan
              dicadangkan secara otomatis ke Google Spreadsheet Anda tanpa membebani penyimpanan lokal.
            </p>
          </div>

          {/* 3 Simple Setup Steps */}
          <div className="space-y-4">
            <h4 className="font-bold text-slate-800 text-sm">Langkah Setup Google Apps Script (3 Menit):</h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 flex flex-col justify-between">
                <div>
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs mb-2">
                    1
                  </span>
                  <h5 className="font-bold text-slate-800 text-xs">Salin Script Backend</h5>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Salin kode Google Apps Script lengkap yang sudah disiapkan khusus.
                  </p>
                </div>
                <button
                  onClick={handleCopyScript}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
                >
                  {copiedScript ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-300" />
                      <span>Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Salin Script (Code.gs)</span>
                    </>
                  )}
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 flex flex-col justify-between">
                <div>
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs mb-2">
                    2
                  </span>
                  <h5 className="font-bold text-slate-800 text-xs">Deploy di script.google.com</h5>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Buat proyek baru, tempel kode, lalu klik Deploy ➔ New deployment ➔ Web App (Who has access: Anyone).
                  </p>
                </div>
                <a
                  href="https://script.google.com/home/start"
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all text-center"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Buka Google Script</span>
                </a>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 flex flex-col justify-between">
                <div>
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs mb-2">
                    3
                  </span>
                  <h5 className="font-bold text-slate-800 text-xs">Tempel Web App URL</h5>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Salin Web App URL (akhiran /exec) dan tempelkan pada kolom di bawah ini.
                  </p>
                </div>
                <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 p-1.5 rounded-lg text-center border border-emerald-200">
                  ✔ Siap Terhubung Persisten
                </span>
              </div>
            </div>
          </div>

          {/* URL Input & Test Connection */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
            <label className="block font-bold text-slate-800 uppercase tracking-wider text-[11px]">
              Google Apps Script Web App URL (/exec)
            </label>
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <input
                type="url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
                className="w-full flex-1 px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleTestAndSave}
                  disabled={isTesting}
                  className="flex-1 sm:flex-initial px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer shrink-0"
                >
                  {isTesting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Menguji...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Uji & Simpan</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleSaveDirectly}
                  className="px-3.5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer shrink-0"
                  title="Simpan URL langsung tanpa tes ping"
                >
                  <span>Simpan Saja</span>
                </button>
              </div>
            </div>
            <p className="text-[11px] text-slate-500">
              * Pastikan URL berakhiran <strong>/exec</strong> dan pada Google Apps Script diatur: <em>Execute as: Me</em> & <em>Who has access: Anyone</em>.
            </p>

            {testResult && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                  testResult.success
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <span>{testResult.message}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Sistem dilengkapi automatic retry queue sehingga pengiriman data ujian tidak akan pernah gagal.
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold cursor-pointer"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};
