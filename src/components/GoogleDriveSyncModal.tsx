import React, { useState, useEffect } from 'react';
import {
  Cloud,
  CheckCircle2,
  Copy,
  ExternalLink,
  Check,
  AlertCircle,
  RefreshCw,
  FolderOpen,
  FileSpreadsheet,
  X,
  ShieldCheck,
  Save,
  Send,
  Trash2,
  Wand2,
} from 'lucide-react';
import { GOOGLE_APPS_SCRIPT_CODE } from '../lib/gasTemplate';
import { api } from '../services/api';

interface GoogleDriveSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GoogleDriveSyncModal: React.FC<GoogleDriveSyncModalProps> = ({ isOpen, onClose }) => {
  const [webhookUrl, setWebhookUrl] = useState('');
  const [savedUrl, setSavedUrl] = useState('');
  const [copiedScript, setCopiedScript] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isSendingTestRow, setIsSendingTestRow] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; canForceSave?: boolean } | null>(null);

  useEffect(() => {
    if (isOpen) {
      api.getGasWebhook().then((url) => {
        setWebhookUrl(url);
        setSavedUrl(url);
      });
      setTestResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Clean URL helper
  const cleanGasUrl = (url: string) => {
    let clean = (url || '').trim().replace(/^["']+|["']+$/g, '');
    if (!clean.startsWith('http://') && !clean.startsWith('https://') && clean.length > 5) {
      clean = 'https://' + clean;
    }
    return clean;
  };

  const isEditorUrl = webhookUrl.includes('/edit') || webhookUrl.includes('/d/');
  const isDevUrl = webhookUrl.endsWith('/dev') || webhookUrl.includes('/dev');
  const isMissingExec =
    webhookUrl.includes('script.google.com/macros/s/') &&
    !webhookUrl.endsWith('/exec') &&
    !isEditorUrl &&
    !isDevUrl;

  const handleFixUrl = () => {
    let clean = cleanGasUrl(webhookUrl);
    if (clean.includes('script.google.com/macros/s/') && !clean.endsWith('/exec')) {
      if (clean.endsWith('/')) clean += 'exec';
      else clean += '/exec';
      setWebhookUrl(clean);
    }
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  const handleTestAndSave = async () => {
    let target = cleanGasUrl(webhookUrl);
    if (!target) {
      setTestResult({
        success: false,
        message: 'Masukkan URL Google Apps Script Web App!',
      });
      return;
    }

    if (isEditorUrl) {
      setTestResult({
        success: false,
        message:
          'URL yang Anda masukkan adalah URL Editor script (/edit), bukan URL Web App (/exec). Harap deploy sebagai Web App (Deploy -> New deployment -> Web app -> Anyone) lalu salin URL akhiran /exec.',
      });
      return;
    }

    if (isDevUrl) {
      setTestResult({
        success: false,
        message:
          'URL berakhiran /dev adalah versi pengujian internal yang memerlukan login. Gunakan URL berakhiran /exec dari menu New deployment.',
      });
      return;
    }

    if (isMissingExec) {
      if (target.endsWith('/')) target += 'exec';
      else target += '/exec';
      setWebhookUrl(target);
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await api.testGasConnection(target);
      const finalUrl = res.normalizedUrl || target;

      if (res.success) {
        await api.setGasWebhook(finalUrl);
        setSavedUrl(finalUrl);
        setWebhookUrl(finalUrl);
        setTestResult({
          success: true,
          message:
            res.message ||
            'Koneksi Berhasil! Folder "EduCBT_Cloud_Database" dan Google Sheets di GDrive terhubung persisten.',
        });
      } else {
        setTestResult({
          success: false,
          message: res.error || 'Gagal terhubung dengan Web App.',
          canForceSave: true,
        });
      }
    } catch (e: any) {
      setTestResult({
        success: false,
        message: e?.message || 'Terjadi kesalahan saat menguji koneksi.',
        canForceSave: true,
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveDirectly = async (overrideUrl?: string) => {
    let target = cleanGasUrl(overrideUrl || webhookUrl);
    if (!target) {
      setTestResult({
        success: false,
        message: 'Masukkan URL Google Apps Script Web App!',
      });
      return;
    }

    if (target.includes('script.google.com/macros/s/') && !target.endsWith('/exec')) {
      if (target.endsWith('/')) target += 'exec';
      else target += '/exec';
    }

    await api.setGasWebhook(target);
    setSavedUrl(target);
    setWebhookUrl(target);
    setTestResult({
      success: true,
      message: 'URL Web App berhasil disimpan ke konfigurasi sistem!',
    });
  };

  const handleSendTestRow = async () => {
    if (!savedUrl && !webhookUrl) return;
    setIsSendingTestRow(true);
    try {
      const res = await api.sendGasTestRow(savedUrl || webhookUrl);
      if (res.success) {
        setTestResult({
          success: true,
          message: res.message || 'Baris data tes berhasil dikirim ke Google Sheets di GDrive!',
        });
      } else {
        setTestResult({
          success: false,
          message: res.error || 'Gagal mengirim baris tes.',
        });
      }
    } catch (e: any) {
      setTestResult({
        success: false,
        message: e.message || 'Gagal mengirim baris tes.',
      });
    } finally {
      setIsSendingTestRow(false);
    }
  };

  const handleClearWebhook = async () => {
    if (confirm('Apakah Anda yakin ingin memutuskan integrasi Google Drive & Spreadsheet?')) {
      await api.setGasWebhook('');
      setSavedUrl('');
      setWebhookUrl('');
      setTestResult({
        success: true,
        message: 'Integrasi Google Drive telah diputuskan.',
      });
    }
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
                Integrasi Cloud Google Drive & Google Sheets
              </h2>
              <p className="text-xs text-emerald-100">
                Penyimpanan terpusat persisten di Google Drive pribadi Anda (Bebas Firebase & Anti Hilang)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-700">
          {/* Status Banner */}
          {savedUrl ? (
            <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-600 text-white rounded-xl">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-emerald-950 text-xs">
                    Integrasi Cloud Google Drive Aktif
                  </h4>
                  <p className="text-[11px] text-emerald-800 font-mono truncate max-w-md">
                    {savedUrl}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                <button
                  type="button"
                  onClick={handleSendTestRow}
                  disabled={isSendingTestRow}
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-xl font-semibold text-[11px] flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  title="Kirim 1 baris data percobaan ke Spreadsheet Google Drive"
                >
                  {isSendingTestRow ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>Kirim Data Tes</span>
                </button>
                <button
                  type="button"
                  onClick={handleClearWebhook}
                  className="px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-xl font-semibold text-[11px] flex items-center gap-1 cursor-pointer"
                  title="Putus koneksi webhook"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Putus</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex items-center gap-3">
              <div className="p-2 bg-amber-500 text-white rounded-xl">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-amber-950 text-xs">
                  Belum Terhubung ke Google Drive
                </h4>
                <p className="text-[11px] text-amber-800">
                  Ikuti 3 langkah cepat di bawah ini untuk menghubungkan Google Drive & Google Spreadsheet dalam 2 menit.
                </p>
              </div>
            </div>
          )}

          {/* Cloud Structure Visual Card */}
          <div className="bg-emerald-50/70 p-5 rounded-2xl border border-emerald-200 space-y-3">
            <h3 className="font-bold text-emerald-900 text-sm flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-emerald-700" />
              <span>Otomatis Dibuat di Google Drive Anda:</span>
            </h3>

            <div className="bg-white p-4 rounded-xl border border-emerald-200 font-mono text-[11px] space-y-2 text-slate-800 shadow-2xs">
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
                    ➔ Sheet: Submissions, Sessions, Question_Banks
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <FolderOpen className="w-3.5 h-3.5 text-teal-600" />
                  <span className="font-semibold text-slate-800">EduCBT_Media_Assets/</span>
                  <span className="text-[10px] text-slate-500">
                    ➔ Wadah terpusat berkas audio, gambar soal, dan backup JSON
                  </span>
                </div>
              </div>
            </div>
            <p className="text-[11px] text-emerald-800 leading-relaxed">
              * Seluruh jawaban ujian siswa akan disimpan secara otomatis ke Google Spreadsheet Anda tanpa membebani server lokal.
            </p>
          </div>

          {/* 3 Simple Setup Steps */}
          <div className="space-y-4">
            <h4 className="font-bold text-slate-800 text-sm">3 Langkah Setup Google Apps Script:</h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Step 1 */}
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
                      <span>Tersalin ke Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Salin Script (Code.gs)</span>
                    </>
                  )}
                </button>
              </div>

              {/* Step 2 */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 flex flex-col justify-between">
                <div>
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs mb-2">
                    2
                  </span>
                  <h5 className="font-bold text-slate-800 text-xs">Deploy di script.google.com</h5>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Buat proyek baru, tempel kode, lalu klik Deploy ➔ New deployment ➔ Web App (Who has access: <strong>Anyone</strong>).
                  </p>
                </div>
                <a
                  href="https://script.google.com/home/start"
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all text-center"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Buka script.google.com</span>
                </a>
              </div>

              {/* Step 3 */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 flex flex-col justify-between">
                <div>
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs mb-2">
                    3
                  </span>
                  <h5 className="font-bold text-slate-800 text-xs">Tempel Web App URL</h5>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Salin Web App URL (akhiran <strong>/exec</strong>) lalu tempelkan pada kolom di bawah.
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
            <div className="flex items-center justify-between">
              <label className="block font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                Google Apps Script Web App URL (/exec)
              </label>
              {savedUrl && (
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  Tersimpan di Sistem
                </span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2">
              <input
                type="url"
                value={webhookUrl}
                onChange={(e) => {
                  setWebhookUrl(e.target.value);
                  setTestResult(null);
                }}
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
                  onClick={() => handleSaveDirectly()}
                  className="px-3.5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer shrink-0"
                  title="Simpan URL langsung tanpa tes ping"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Saja</span>
                </button>
              </div>
            </div>

            {/* Smart Detection & Auto-Repair Hints */}
            {isMissingExec && (
              <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-between gap-2 text-[11px] text-blue-900">
                <span>URL belum memiliki akhiran <strong>/exec</strong>.</span>
                <button
                  type="button"
                  onClick={handleFixUrl}
                  className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <Wand2 className="w-3 h-3" />
                  <span>Tambahkan /exec Otomatis</span>
                </button>
              </div>
            )}

            {isEditorUrl && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-[11px] text-rose-800">
                ⚠ <strong>Perhatian:</strong> URL di atas adalah link Editor script (/edit). Anda perlu klik <strong>Deploy ➔ New deployment ➔ Web app</strong> lalu salin URL Web App yang berakhiran <strong>/exec</strong>.
              </div>
            )}

            {isDevUrl && (
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800">
                ⚠ <strong>Perhatian:</strong> URL berakhiran <strong>/dev</strong> hanya bisa diakses saat akun Anda login. Siswa tidak akan bisa mengirim jawaban. Buat <em>New deployment</em> dan gunakan URL <strong>/exec</strong>.
              </div>
            )}

            <p className="text-[11px] text-slate-500">
              * Pastikan pada pengaturan Deployment Web App diatur: <em>Execute as: Me</em> & <em>Who has access: Anyone (Siapa saja)</em>.
            </p>

            {/* Test Result Message with Force Save Option */}
            {testResult && (
              <div
                className={`p-3.5 rounded-xl border text-xs flex flex-col gap-2 ${
                  testResult.success
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}
              >
                <div className="flex items-start gap-2">
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <span className="leading-relaxed">{testResult.message}</span>
                </div>

                {testResult.canForceSave && (
                  <div className="pt-2 border-t border-rose-200/60 flex items-center justify-between">
                    <span className="text-[11px] text-rose-700">
                      Ingin tetap menyimpan URL ini tanpa pengujian?
                    </span>
                    <button
                      type="button"
                      onClick={() => handleSaveDirectly()}
                      className="px-3 py-1 bg-rose-700 hover:bg-rose-800 text-white rounded-lg text-xs font-semibold cursor-pointer"
                    >
                      Tetap Simpan URL Ini
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Sistem dilengkapi antrean cadangan otomatis sehingga pengiriman jawaban ujian siswa selalu aman.
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
