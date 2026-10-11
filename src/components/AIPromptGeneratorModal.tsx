import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Loader2,
  CheckCircle2,
  X,
  Sliders,
  BookOpen,
  HelpCircle,
  Plus,
  Trash2,
  ListChecks,
  KeyRound,
  RefreshCw,
  Layers,
} from 'lucide-react';
import { QuestionItem, QuestionType } from '../types/cbt';
import { api } from '../services/api';

interface AIPromptGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportQuestions: (
    questions: QuestionItem[],
    titleInfo: { subject: string; topic: string }
  ) => Promise<void> | void;
  defaultSubject?: string;
  defaultGrade?: string;
  onOpenGeminiModal?: () => void;
}

export const AIPromptGeneratorModal: React.FC<AIPromptGeneratorModalProps> = ({
  isOpen,
  onClose,
  onImportQuestions,
  defaultSubject = 'Bahasa Indonesia',
  defaultGrade = '12',
  onOpenGeminiModal,
}) => {
  const [subject, setSubject] = useState(defaultSubject);
  const [gradeLevel, setGradeLevel] = useState(defaultGrade);
  const [topic, setTopic] = useState('Literasi Digital dan Analisis Wacana Kritis');
  const [difficulty, setDifficulty] = useState('Campuran (Mudah, Sedang, HOTS)');
  const [questionCount, setQuestionCount] = useState(5);
  const [taxonomyOption, setTaxonomyOption] = useState<'bloom' | 'solo'>('bloom');
  const [customPrompt, setCustomPrompt] = useState(
    'Sertakan stimulus kasus kontekstual kekinian dan literasi tingkat tinggi. Pastikan kunci jawaban objektif.'
  );

  const [selectedTypes, setSelectedTypes] = useState<QuestionType[]>([
    'multiple_choice',
    'multiple_select',
    'true_false',
    'matching',
    'short_answer',
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<QuestionItem[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [successInfoMsg, setSuccessInfoMsg] = useState('');

  // Sync state when modal opens
  useEffect(() => {
    if (isOpen) {
      if (defaultSubject) setSubject(defaultSubject);
      if (defaultGrade) setGradeLevel(defaultGrade);
      setErrorMsg('');
      setSuccessInfoMsg('');
    }
  }, [isOpen, defaultSubject, defaultGrade]);

  if (!isOpen) return null;

  const toggleType = (t: QuestionType) => {
    if (selectedTypes.includes(t)) {
      if (selectedTypes.length === 1) return; // minimal 1
      setSelectedTypes(selectedTypes.filter((x) => x !== t));
    } else {
      setSelectedTypes([...selectedTypes, t]);
    }
  };

  const handleGenerate = async () => {
    setIsLoading(true);
    setErrorMsg('');
    setSuccessInfoMsg('');
    try {
      const questions = await api.generateQuestionsWithAI({
        subject,
        gradeLevel,
        topic,
        difficulty,
        questionTypes: selectedTypes,
        questionCount,
        customPrompt: `${customPrompt}. Gunakan Taksonomi ${
          taxonomyOption === 'bloom'
            ? 'Bloom-Anderson (C1, C2, C3, C4, C5, C6)'
            : 'SOLO (Prestructural, Unistructural, Multistructural, Relational, Extended Abstract)'
        } untuk menentukan level kognitif setiap butir soal.`,
      });

      // Sanitize and ensure each question has required fields and taxonomy
      const safeQuestions: QuestionItem[] = (questions || []).map((q: any, idx: number) => {
        const num = idx + 1;
        const safeType: QuestionType = [
          'multiple_choice',
          'multiple_select',
          'true_false',
          'matching',
          'short_answer',
          'essay',
        ].includes(q.type)
          ? q.type
          : 'multiple_choice';

        let cognitiveLvl = q.cognitiveLevel;
        if (!cognitiveLvl) {
          if (taxonomyOption === 'bloom') {
            cognitiveLvl = num % 3 === 1 ? 'C3' : num % 3 === 2 ? 'C4' : 'C2';
          } else {
            cognitiveLvl = num % 2 === 0 ? 'Relational' : 'Multistructural';
          }
        }

        return {
          id: q.id || `q-ai-${Date.now()}-${num}`,
          number: num,
          type: safeType,
          question: q.question || `Pertanyaan butir nomor ${num}`,
          options: Array.isArray(q.options)
            ? q.options
            : safeType === 'multiple_choice'
            ? ['A. Pilihan A', 'B. Pilihan B', 'C. Pilihan C', 'D. Pilihan D']
            : undefined,
          correctAnswer: q.correctAnswer ?? (safeType === 'multiple_choice' ? 'A' : 'Jawaban benar'),
          matchingPairs: Array.isArray(q.matchingPairs) ? q.matchingPairs : undefined,
          explanation: q.explanation || 'Pembahasan kunci jawaban butir soal.',
          points: Number(q.points) || Math.round(100 / Math.max(questionCount, 1)),
          cognitiveDomain: taxonomyOption,
          cognitiveLevel: cognitiveLvl,
          competencyIndicator: q.competencyIndicator || `Menyelesaikan persoalan terkait materi ${topic}`,
          learningObjective: `Memahami materi pokok ${topic}`,
          topicMaterial: topic,
        };
      });

      setGeneratedQuestions(safeQuestions);
      setSuccessInfoMsg(`Berhasil menyusun ${safeQuestions.length} butir soal berstandar kurikulum!`);
    } catch (err: any) {
      let msg = err.message || 'Gagal generate soal dari AI Gemini.';
      if (
        msg.includes('Unexpected token') ||
        msg.includes('is not valid JSON') ||
        msg.includes('The page c') ||
        msg.includes('SyntaxError')
      ) {
        msg =
          'Waktu tunggu respon server habis. Silakan coba kembali dengan jumlah soal 5–10 butir untuk hasil tercepat dan paling stabil.';
      }
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveQuestion = (idx: number) => {
    const updated = generatedQuestions
      .filter((_, i) => i !== idx)
      .map((q, i) => ({ ...q, number: i + 1 }));
    setGeneratedQuestions(updated);
  };

  const handleConfirmImport = async () => {
    if (generatedQuestions.length === 0 || isImporting) return;
    setIsImporting(true);
    setErrorMsg('');
    try {
      await Promise.resolve(onImportQuestions(generatedQuestions, { subject, topic }));
      onClose();
    } catch (err: any) {
      setErrorMsg('Gagal mengimpor butir soal: ' + (err.message || 'Terjadi kesalahan sistem'));
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-linear-to-r from-indigo-700 via-indigo-600 to-blue-600 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/15 rounded-xl backdrop-blur-md">
              <Sparkles className="w-6 h-6 text-yellow-300" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">AI Question Generator (Gemini 3.8)</h2>
              <p className="text-xs text-indigo-100">
                Penyusun instan butir soal Kurikulum Merdeka berstandar HOTS dengan Taksonomi Bloom / SOLO
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onOpenGeminiModal && (
              <button
                type="button"
                onClick={onOpenGeminiModal}
                className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-white/20"
                title="Input / Ganti Gemini API Key"
              >
                <KeyRound className="w-3.5 h-3.5 text-yellow-300" />
                <span className="hidden sm:inline">Set Gemini API Key</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorMsg && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start justify-between gap-3 animate-in fade-in">
              <div>
                <span className="font-semibold">Perhatian:</span> {errorMsg}
              </div>
              {onOpenGeminiModal && (
                <button
                  type="button"
                  onClick={onOpenGeminiModal}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Input API Key</span>
                </button>
              )}
            </div>
          )}

          {successInfoMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successInfoMsg}</span>
            </div>
          )}

          {/* Form Parameters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-slate-50 p-5 rounded-xl border border-slate-200">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Mata Pelajaran
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Contoh: Matematika, Biologi, Bahasa Indonesia"
                className="w-full px-3.5 py-2.5 bg-white rounded-lg border border-slate-300 text-slate-800 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Jenjang / Tingkat Kelas
              </label>
              <select
                value={gradeLevel}
                onChange={(e) => setGradeLevel(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white rounded-lg border border-slate-300 text-slate-800 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <optgroup label="Sekolah Dasar (SD / MI)">
                  <option value="1">Kelas 1 SD (Fase A)</option>
                  <option value="2">Kelas 2 SD (Fase A)</option>
                  <option value="3">Kelas 3 SD (Fase B)</option>
                  <option value="4">Kelas 4 SD (Fase B)</option>
                  <option value="5">Kelas 5 SD (Fase C)</option>
                  <option value="6">Kelas 6 SD (Fase C)</option>
                </optgroup>
                <optgroup label="Sekolah Menengah Pertama (SMP / MTs)">
                  <option value="7">Kelas 7 SMP (Fase D)</option>
                  <option value="8">Kelas 8 SMP (Fase D)</option>
                  <option value="9">Kelas 9 SMP (Fase D)</option>
                </optgroup>
                <optgroup label="Sekolah Menengah Atas (SMA / SMK / MA)">
                  <option value="10">Kelas 10 SMA/SMK (Fase E)</option>
                  <option value="11">Kelas 11 SMA/SMK (Fase F)</option>
                  <option value="12">Kelas 12 SMA/SMK (Fase F)</option>
                </optgroup>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Topik / Materi / Elemen Capaian Pembelajaran
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Contoh: Sistem Ekskresi Manusia & Gangguan Ginjal"
                className="w-full px-3.5 py-2.5 bg-white rounded-lg border border-slate-300 text-slate-800 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* Taxonomy Option (Bloom-Anderson vs SOLO) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Model Taksonomi Kognitif</span>
                <span className="text-[10px] text-indigo-600 font-bold">Kisi-Kisi Soal</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTaxonomyOption('bloom')}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all text-left flex items-center justify-between ${
                    taxonomyOption === 'bloom'
                      ? 'bg-indigo-50 border-indigo-400 text-indigo-900 shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <span>Bloom-Anderson (C1–C6)</span>
                  {taxonomyOption === 'bloom' && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />}
                </button>
                <button
                  type="button"
                  onClick={() => setTaxonomyOption('solo')}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all text-left flex items-center justify-between ${
                    taxonomyOption === 'solo'
                      ? 'bg-indigo-50 border-indigo-400 text-indigo-900 shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <span>SOLO Taxonomy</span>
                  {taxonomyOption === 'solo' && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Tingkat Kesulitan
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white rounded-lg border border-slate-300 text-slate-800 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="Mudah">Mudah (LOTS)</option>
                <option value="Sedang">Sedang (MOTS)</option>
                <option value="HOTS">Tinggi / Analisis Kritis (HOTS)</option>
                <option value="Campuran (Mudah, Sedang, HOTS)">Campuran Proporsional (Mudah, Sedang, HOTS)</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Jumlah Butir Soal (1 - 50)
                </label>
                <span className="text-xs font-bold text-indigo-700 px-2.5 py-0.5 bg-indigo-100 rounded-md">
                  {questionCount} Soal
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="50"
                step="1"
                value={questionCount}
                onChange={(e) => setQuestionCount(Number(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
              />
              <div className="flex justify-between text-[11px] text-slate-500 mt-1 font-mono">
                <span>1 butir</span>
                <span>10</span>
                <span>25</span>
                <span>50 butir</span>
              </div>
            </div>

            {/* Question Types Choice */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Format Tipe Soal yang Disertakan
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { id: 'multiple_choice' as QuestionType, label: 'Pilihan Ganda Biasa' },
                  { id: 'multiple_select' as QuestionType, label: 'Pilihan Ganda Kompleks' },
                  { id: 'true_false' as QuestionType, label: 'Benar / Salah' },
                  { id: 'matching' as QuestionType, label: 'Menjodohkan' },
                  { id: 'short_answer' as QuestionType, label: 'Isian Singkat' },
                  { id: 'essay' as QuestionType, label: 'Uraian / Essay' },
                ].map((typeItem) => {
                  const isChecked = selectedTypes.includes(typeItem.id);
                  return (
                    <button
                      key={typeItem.id}
                      type="button"
                      onClick={() => toggleType(typeItem.id)}
                      className={`px-3 py-2 text-xs font-medium rounded-lg border text-left transition-all flex items-center justify-between cursor-pointer ${
                        isChecked
                          ? 'bg-indigo-50 border-indigo-400 text-indigo-900 font-semibold shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <span>{typeItem.label}</span>
                      {isChecked && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Prompt Kustom & Instruksi Tambahan (Opsional)
              </label>
              <textarea
                rows={2}
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Contoh: Sisipkan kasus teks wacana berita sains terkini, dan buat 1 soal berbentuk studi kasus."
                className="w-full px-3.5 py-2 bg-white rounded-lg border border-slate-300 text-slate-800 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Action Trigger */}
          <div className="flex justify-end">
            <button
              onClick={handleGenerate}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-linear-to-r from-indigo-600 to-blue-600 text-white rounded-xl font-semibold shadow-md hover:from-indigo-700 hover:to-blue-700 disabled:opacity-50 transition-all text-sm cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>AI sedang menyusun {questionCount} butir soal...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate {questionCount} Soal dengan AI Gemini</span>
                </>
              )}
            </button>
          </div>

          {/* Generated List Preview */}
          {generatedQuestions.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ListChecks className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-bold text-slate-800 text-base">
                    Hasil Pratinjau Soal ({generatedQuestions.length} Butir)
                  </h3>
                </div>
                <span className="text-xs text-slate-600">
                  Total Bobot: {generatedQuestions.reduce((sum, q) => sum + (q.points || 0), 0)} Poin
                </span>
              </div>

              <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                {generatedQuestions.map((q, idx) => (
                  <div
                    key={q.id || idx}
                    className="p-4 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 transition-all text-sm space-y-2 relative group shadow-2xs"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs">
                          {idx + 1}
                        </span>
                        <span className="text-xs uppercase px-2 py-0.5 rounded-md font-semibold bg-slate-100 text-slate-700">
                          {((q.type || 'multiple_choice') as string).replace(/_/g, ' ')}
                        </span>
                        <span className="text-xs text-slate-600">({q.points || 10} Poin)</span>
                        {q.cognitiveLevel && (
                          <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 font-bold text-xs border border-amber-200">
                            {q.cognitiveLevel}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleRemoveQuestion(idx)}
                        className="text-slate-400 hover:text-red-600 p-1 rounded-md transition-colors cursor-pointer"
                        title="Hapus butir ini"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <p className="font-medium text-slate-800 whitespace-pre-line leading-relaxed">{q.question}</p>

                    {/* Options Preview */}
                    {Array.isArray(q.options) && q.options.length > 0 && (
                      <div className="pl-4 border-l-2 border-indigo-100 space-y-1 text-xs text-slate-600 my-2">
                        {q.options.map((opt, oIdx) => (
                          <div key={oIdx} className="py-0.5">
                            {typeof opt === 'string' ? opt : JSON.stringify(opt)}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Matching Pairs Preview */}
                    {q.type === 'matching' && Array.isArray(q.matchingPairs) && (
                      <div className="bg-slate-50 p-2.5 rounded-lg text-xs space-y-1 border border-slate-100">
                        <span className="font-semibold text-slate-700">Pasangan:</span>
                        {q.matchingPairs.map((pair, pIdx) => (
                          <div key={pIdx} className="flex items-center gap-2 text-slate-600">
                            <span>• {pair.left}</span>
                            <span className="text-indigo-600">➔</span>
                            <span className="font-medium text-slate-800">{pair.right}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="text-emerald-700 font-medium">
                        Kunci: <span className="font-bold">{typeof q.correctAnswer === 'object' ? JSON.stringify(q.correctAnswer) : String(q.correctAnswer)}</span>
                      </div>
                      {q.explanation && (
                        <div className="text-slate-600 italic">
                          Ket: {q.explanation.substring(0, 80)}...
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 font-medium cursor-pointer"
          >
            Tutup
          </button>
          <button
            onClick={handleConfirmImport}
            disabled={generatedQuestions.length === 0 || isImporting}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl font-semibold shadow-sm text-sm flex items-center gap-2 transition-all cursor-pointer"
          >
            {isImporting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Mengimpor ke Bank Soal...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Impor {generatedQuestions.length} Soal ke Bank Soal</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
