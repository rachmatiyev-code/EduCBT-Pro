import React, { useState, useEffect, useRef } from 'react';
import {
  Clock,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Flag,
  Wifi,
  WifiOff,
  Battery,
  Volume2,
  Video,
  Image as ImageIcon,
  Send,
  Printer,
  Sparkles,
  Award,
  CheckCircle,
  XCircle,
  HelpCircle,
  LogOut,
} from 'lucide-react';
import {
  ExamSession,
  QuestionBank,
  QuestionItem,
  Student,
  ExamSubmission,
  ItemAnalysisResult,
  SchoolProfile,
} from '../types/cbt';
import { api } from '../services/api';

interface StudentExamRoomProps {
  student: Student;
  session: ExamSession;
  bank: QuestionBank;
  schoolProfile: SchoolProfile;
  onExit: () => void;
}

export const StudentExamRoom: React.FC<StudentExamRoomProps> = ({
  student,
  session,
  bank,
  schoolProfile,
  onExit,
}) => {
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [flagged, setFlagged] = useState<Record<number, boolean>>({});
  const [tabBlurCount, setTabBlurCount] = useState(0);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<ExamSubmission | null>(null);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [batteryLevel, setBatteryLevel] = useState<number | undefined>(undefined);
  const [audioPlayCounts, setAudioPlayCounts] = useState<Record<string, number>>({});

  // Countdown timer
  const [secondsRemaining, setSecondsRemaining] = useState(session.durationMinutes * 60);

  // Stable refs for interval closures
  const answersRef = useRef(answers);
  answersRef.current = answers;
  const questionsRef = useRef(questions);
  questionsRef.current = questions;
  const secondsRemainingRef = useRef(secondsRemaining);
  secondsRemainingRef.current = secondsRemaining;

  // Initialize questions (optionally shuffled)
  useEffect(() => {
    let qList = [...bank.questions];
    if (session.shuffleQuestions) {
      qList = [...qList].sort(() => Math.random() - 0.5);
    }
    // Re-assign display numbers 1..N
    qList = qList.map((q, idx) => ({ ...q, number: idx + 1 }));
    setQuestions(qList);

    // Try battery API if available
    if ('getBattery' in navigator) {
      (navigator as any).getBattery?.().then((bat: any) => {
        setBatteryLevel(Math.round(bat.level * 100));
        bat.addEventListener('levelchange', () => {
          setBatteryLevel(Math.round(bat.level * 100));
        });
      });
    }

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [bank, session]);

  // Anti-Cheat: Detect Tab Blur / Window switch
  useEffect(() => {
    if (!session.antiCheatEnabled || submissionResult) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabBlurCount((prev) => {
          const next = prev + 1;
          setShowWarningModal(true);
          return next;
        });
      }
    };

    const handleWindowBlur = () => {
      setTabBlurCount((prev) => {
        const next = prev + 1;
        setShowWarningModal(true);
        return next;
      });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [session.antiCheatEnabled, submissionResult]);

  // Periodic Live Proctoring Heartbeat Ping (Communicates with Teacher/GAS dashboard)
  useEffect(() => {
    if (submissionResult) return;

    const sendPing = () => {
      const answeredCount = Object.keys(answers).length;
      api.sendProctorHeartbeat({
        studentId: student.nisn,
        studentName: student.name,
        classId: student.classId,
        sessionCode: session.sessionCode,
        currentQuestionIndex: currentIndex + 1,
        answeredCount,
        totalQuestions: questions.length,
        tabBlurCount,
        device: navigator.userAgent.includes('Mobile') ? 'Smartphone/Tablet' : 'Komputer/Laptop',
        batteryLevel,
        isOnline: navigator.onLine,
      });
    };

    sendPing();
    const interval = setInterval(sendPing, 8000);
    return () => clearInterval(interval);
  }, [student, session, currentIndex, answers, questions.length, tabBlurCount, batteryLevel, submissionResult]);

  // Timer interval (runs stably without restarting on each answer click)
  useEffect(() => {
    if (submissionResult) return;

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleFinalSubmit(); // Auto-submit when time expires
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [submissionResult]);

  const formatTimer = (totalSec: number) => {
    const hours = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    if (hours > 0) {
      return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const currentQ = questions[currentIndex];

  const handleSelectAnswer = (qId: string, val: any) => {
    setAnswers((prev) => ({ ...prev, [qId]: val }));
  };

  const toggleFlag = (qNumber: number) => {
    setFlagged((prev) => ({ ...prev, [qNumber]: !prev[qNumber] }));
  };

  const handleAudioPlay = (qId: string, limit?: number) => {
    if (!limit) return;
    setAudioPlayCounts((prev) => {
      const cur = prev[qId] || 0;
      return { ...prev, [qId]: cur + 1 };
    });
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    setShowConfirmSubmit(false);

    try {
      const currentAnswers = answersRef.current;
      const currentQuestions = questionsRef.current;
      const scoreData = api.calculateScore(currentQuestions, currentAnswers);
      const isPassed = scoreData.scorePercentage >= (bank.passingScore || 75);

      const submission: ExamSubmission = {
        id: `SUB-${Date.now()}-${student.nisn}`,
        sessionCode: session.sessionCode,
        studentId: student.nisn,
        studentName: student.name,
        studentClass: student.classId,
        submittedAt: new Date().toISOString(),
        totalScore: scoreData.totalScore,
        maxPossibleScore: scoreData.maxPossibleScore,
        scorePercentage: scoreData.scorePercentage,
        isPassed,
        tabBlurCount,
        durationTakenSeconds: Math.max(session.durationMinutes * 60 - secondsRemainingRef.current, 0),
        syncedToDrive: false,
        answers: currentAnswers,
        itemAnalysis: scoreData.itemAnalysis,
      };

      await api.submitExam(submission);
      setSubmissionResult(submission);
    } catch (err: any) {
      alert('Terjadi kendala saat mengirim jawaban: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Result view if completed
  if (submissionResult) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Header Banner */}
          <div className="bg-linear-to-r from-emerald-600 to-teal-700 text-white p-6 text-center space-y-2">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
              <Award className="w-9 h-9 text-yellow-300" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Ujian Berhasil Diselesaikan!</h2>
            <p className="text-xs text-emerald-100">
              Jawaban Anda telah tersimpan dan disinkronkan ke pusat data cloud
            </p>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {/* Student Info */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between text-xs gap-3">
              <div>
                <span className="text-slate-600 block">Nama Peserta:</span>
                <span className="font-bold text-slate-800 text-sm">{student.name}</span>
              </div>
              <div>
                <span className="text-slate-600 block">NISN / ID:</span>
                <span className="font-mono font-bold text-slate-700">{student.nisn}</span>
              </div>
              <div>
                <span className="text-slate-600 block">Mata Pelajaran:</span>
                <span className="font-bold text-indigo-700">{session.title}</span>
              </div>
            </div>

            {/* Instant Score Card */}
            {session.showResultInstant && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl">
                  <span className="text-xs text-emerald-700 font-semibold uppercase tracking-wider block">
                    Nilai Akhir
                  </span>
                  <div className="text-4xl font-extrabold text-emerald-700 mt-1">
                    {submissionResult.scorePercentage}
                  </div>
                  <span className="text-[11px] text-emerald-600 mt-1 block">
                    Skor: {submissionResult.totalScore} / {submissionResult.maxPossibleScore}
                  </span>
                </div>

                <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-2xl">
                  <span className="text-xs text-indigo-700 font-semibold uppercase tracking-wider block">
                    Status Ketuntasan
                  </span>
                  <div className="text-xl font-bold text-indigo-800 mt-2 flex items-center justify-center gap-1.5">
                    {submissionResult.isPassed ? (
                      <>
                        <CheckCircle className="w-5 h-5 text-emerald-600" />
                        <span>TUNTAS</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-5 h-5 text-red-600" />
                        <span>BELUM TUNTAS</span>
                      </>
                    )}
                  </div>
                  <span className="text-[11px] text-indigo-600 mt-1 block">
                    KKM: {bank.passingScore}
                  </span>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl">
                  <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">
                    Integritas & Waktu
                  </span>
                  <div className="text-lg font-bold text-slate-800 mt-1">
                    {Math.round(submissionResult.durationTakenSeconds / 60)} Menit
                  </div>
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Pindah Layar: {submissionResult.tabBlurCount}x
                  </span>
                </div>
              </div>
            )}

            {/* Item Breakdown Preview */}
            <div className="space-y-2">
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                Ringkasan Pengerjaan ({questions.length} Butir Soal)
              </h4>
              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                {submissionResult.itemAnalysis.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl border border-slate-200 flex items-center justify-between text-xs bg-white"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold w-6 text-slate-600">#{item.questionNumber}</span>
                      <span className="text-slate-500 uppercase text-[10px] bg-slate-100 px-1.5 py-0.5 rounded">
                        {item.type.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-600">
                        {item.pointsEarned} / {item.pointsMax} Poin
                      </span>
                      {item.isCorrect ? (
                        <span className="text-emerald-600 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> Tepat
                        </span>
                      ) : (
                        <span className="text-slate-400 font-medium">Evaluasi</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Bukti Ujian</span>
              </button>

              <button
                onClick={onExit}
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <LogOut className="w-4 h-4" />
                <span>Keluar dari Ruang Ujian</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          {/* School & Student Info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              {schoolProfile.name ? schoolProfile.name.charAt(0) : 'E'}
            </div>
            <div>
              <h1 className="font-bold text-slate-800 text-sm leading-tight">{session.title}</h1>
              <p className="text-xs text-slate-500">
                {student.name} ({student.nisn}) • Kelas {student.classId}
              </p>
            </div>
          </div>

          {/* Center Timer */}
          <div className="flex items-center gap-3">
            <div
              className={`px-4 py-1.5 rounded-xl font-mono font-bold text-sm flex items-center gap-2 border shadow-xs ${
                secondsRemaining < 300
                  ? 'bg-red-50 text-red-700 border-red-300 animate-pulse'
                  : 'bg-indigo-50 text-indigo-700 border-indigo-200'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>{formatTimer(secondsRemaining)}</span>
            </div>
          </div>

          {/* Right Status / Telemetry */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-xs font-semibold">
              {isOnline ? (
                <span className="flex items-center gap-1 text-emerald-600">
                  <Wifi className="w-3.5 h-3.5" /> Terhubung
                </span>
              ) : (
                <span className="flex items-center gap-1 text-red-600">
                  <WifiOff className="w-3.5 h-3.5" /> Offline (Tersimpan Lokal)
                </span>
              )}
              {batteryLevel !== undefined && (
                <span className="text-slate-500 flex items-center gap-1">
                  <Battery className="w-3.5 h-3.5" /> {batteryLevel}%
                </span>
              )}
            </div>

            <button
              onClick={() => setShowConfirmSubmit(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Selesai & Kumpulkan</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Examination Work Area */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left / Center: Question & Answer Canvas (3 Cols) */}
        <div className="lg:col-span-3 space-y-4">
          {currentQ ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs flex flex-col justify-between min-h-[500px]">
              <div>
                {/* Question Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-xl bg-slate-900 text-white font-extrabold flex items-center justify-center text-sm shadow-xs">
                      {currentQ.number}
                    </span>
                    <div>
                      <span className="text-xs uppercase font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                        {currentQ.type.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-slate-400 ml-2">
                        Bobot: {currentQ.points} Poin
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleFlag(currentQ.number)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
                      flagged[currentQ.number]
                        ? 'bg-amber-100 text-amber-800 border-amber-300'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Flag className={`w-3.5 h-3.5 ${flagged[currentQ.number] ? 'fill-amber-600' : ''}`} />
                    <span>{flagged[currentQ.number] ? 'Ragu-ragu (Ditandai)' : 'Tandai Ragu-ragu'}</span>
                  </button>
                </div>

                {/* Stimulus Media Preview if present */}
                {currentQ.media && (
                  <div className="mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    {currentQ.media.type === 'image' && (
                      <div className="text-center">
                        <img
                          src={currentQ.media.url}
                          alt={currentQ.media.caption || 'Stimulus Soal'}
                          className="max-h-72 mx-auto rounded-xl object-contain shadow-xs"
                        />
                      </div>
                    )}

                    {currentQ.media.type === 'audio' && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                            <Volume2 className="w-4 h-4 text-indigo-600" />
                            <span>Audio Listening Section</span>
                          </span>
                          {currentQ.media.maxPlayCount && (
                            <span className="text-slate-500">
                              Diputar: {audioPlayCounts[currentQ.id] || 0} / {currentQ.media.maxPlayCount}x
                            </span>
                          )}
                        </div>
                        <audio
                          controls
                          src={currentQ.media.url}
                          className="w-full"
                          onPlay={() => handleAudioPlay(currentQ.id, currentQ.media?.maxPlayCount)}
                        />
                      </div>
                    )}

                    {currentQ.media.type === 'video' && (
                      <div className="aspect-video max-w-xl mx-auto rounded-xl overflow-hidden shadow-xs">
                        {currentQ.media.url.includes('youtube.com') || currentQ.media.url.includes('youtu.be') ? (
                          <iframe
                            src={currentQ.media.url.replace('watch?v=', 'embed/')}
                            className="w-full h-full"
                            allowFullScreen
                          />
                        ) : (
                          <video controls src={currentQ.media.url} className="w-full h-full" />
                        )}
                      </div>
                    )}

                    {currentQ.media.caption && (
                      <p className="text-xs text-slate-500 text-center mt-2 italic">
                        {currentQ.media.caption}
                      </p>
                    )}
                  </div>
                )}

                {/* Question Text */}
                <div className="text-slate-800 text-base leading-relaxed font-medium mb-8 whitespace-pre-line">
                  {currentQ.question}
                </div>

                {/* Answer Controls Based on Question Type */}
                <div className="space-y-3">
                  {/* Type 1: Multiple Choice */}
                  {currentQ.type === 'multiple_choice' && (
                    <div className="space-y-2.5">
                      {currentQ.options?.map((opt, oIdx) => {
                        const optLetter = String.fromCharCode(65 + oIdx);
                        const isSelected =
                          answers[currentQ.id] === optLetter ||
                          answers[currentQ.id] === opt;

                        return (
                          <button
                            key={oIdx}
                            type="button"
                            onClick={() => handleSelectAnswer(currentQ.id, optLetter)}
                            className={`w-full p-4 rounded-xl border text-left flex items-start gap-3.5 transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-indigo-50 border-indigo-500 text-indigo-950 font-semibold shadow-xs ring-2 ring-indigo-200'
                                : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50/50'
                            }`}
                          >
                            <span
                              className={`w-7 h-7 rounded-lg font-bold flex items-center justify-center text-xs shrink-0 transition-colors ${
                                isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {optLetter}
                            </span>
                            <span className="text-sm pt-0.5 leading-snug">
                              {opt.replace(/^[A-E]\.\s*/, '')}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Type 2: Multiple Select */}
                  {currentQ.type === 'multiple_select' && (
                    <div className="space-y-2.5">
                      <p className="text-xs text-indigo-700 font-semibold bg-indigo-50 p-2.5 rounded-lg border border-indigo-200">
                        * Anda dapat memilih lebih dari satu jawaban yang benar.
                      </p>
                      {currentQ.options?.map((opt, oIdx) => {
                        const optLetter = String.fromCharCode(65 + oIdx);
                        const currentArr = Array.isArray(answers[currentQ.id]) ? answers[currentQ.id] : [];
                        const isSelected = currentArr.includes(optLetter);

                        return (
                          <button
                            key={oIdx}
                            type="button"
                            onClick={() => {
                              const nextArr = isSelected
                                ? currentArr.filter((x: string) => x !== optLetter)
                                : [...currentArr, optLetter];
                              handleSelectAnswer(currentQ.id, nextArr);
                            }}
                            className={`w-full p-4 rounded-xl border text-left flex items-start gap-3.5 transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-indigo-50 border-indigo-500 text-indigo-950 font-semibold shadow-xs'
                                : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                            }`}
                          >
                            <div
                              className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 ${
                                isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 bg-white'
                              }`}
                            >
                              {isSelected && <CheckCircle className="w-4 h-4" />}
                            </div>
                            <span className="text-sm leading-snug">
                              <strong className="mr-1">{optLetter}.</strong>
                              {opt.replace(/^[A-E]\.\s*/, '')}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Type 3: True / False */}
                  {currentQ.type === 'true_false' && (
                    <div className="grid grid-cols-2 gap-4">
                      {['Benar', 'Salah'].map((val) => {
                        const isSelected = answers[currentQ.id] === val;
                        return (
                          <button
                            key={val}
                            type="button"
                            onClick={() => handleSelectAnswer(currentQ.id, val)}
                            className={`p-5 rounded-2xl border text-center font-bold text-base transition-all cursor-pointer ${
                              isSelected
                                ? val === 'Benar'
                                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                                  : 'bg-rose-600 text-white border-rose-600 shadow-md'
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            {val}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Type 4: Matching Pairs */}
                  {currentQ.type === 'matching' && currentQ.matchingPairs && (
                    <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                      <p className="text-xs font-semibold text-slate-700 mb-2">
                        Pilih pasangan yang sesuai untuk setiap premis di kolom kiri:
                      </p>
                      {currentQ.matchingPairs.map((pair, pIdx) => {
                        const currentMatchObj = answers[currentQ.id] || {};
                        const selectedMatch = currentMatchObj[pair.left] || '';

                        return (
                          <div
                            key={pIdx}
                            className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                          >
                            <span className="font-medium text-xs text-slate-800 flex-1">
                              {pair.left}
                            </span>
                            <span className="text-indigo-600 font-bold hidden sm:inline">➔</span>
                            <select
                              value={selectedMatch}
                              onChange={(e) => {
                                const nextMatch = { ...currentMatchObj, [pair.left]: e.target.value };
                                handleSelectAnswer(currentQ.id, nextMatch);
                              }}
                              className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none flex-1"
                            >
                              <option value="">-- Pilih Jawaban Pasangan --</option>
                              {currentQ.matchingPairs?.map((optPair, opIdx) => (
                                <option key={opIdx} value={optPair.right}>
                                  {optPair.right}
                                </option>
                              ))}
                            </select>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Type 5: Short Answer */}
                  {currentQ.type === 'short_answer' && (
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-slate-700 uppercase">
                        Tuliskan Jawaban Singkat Anda
                      </label>
                      <input
                        type="text"
                        value={answers[currentQ.id] || ''}
                        onChange={(e) => handleSelectAnswer(currentQ.id, e.target.value)}
                        placeholder="Ketik jawaban di sini..."
                        className="w-full px-4 py-3 bg-white rounded-xl border border-slate-300 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                  )}

                  {/* Type 6: Essay */}
                  {currentQ.type === 'essay' && (
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-slate-700 uppercase">
                        Lembar Jawaban Uraian
                      </label>
                      <textarea
                        rows={6}
                        value={answers[currentQ.id] || ''}
                        onChange={(e) => handleSelectAnswer(currentQ.id, e.target.value)}
                        placeholder="Uraikan jawaban dan argumen Anda secara lengkap dan terstruktur..."
                        className="w-full px-4 py-3 bg-white rounded-xl border border-slate-300 text-sm leading-relaxed focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Pagination Controls */}
              <div className="pt-8 border-t border-slate-100 flex items-center justify-between gap-4 mt-8">
                <button
                  type="button"
                  onClick={() => setCurrentIndex((prev) => Math.max(prev - 1, 0))}
                  disabled={currentIndex === 0}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-30 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Soal Sebelumnya</span>
                </button>

                <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                  Soal ke-{currentIndex + 1} dari {questions.length}
                </span>

                <button
                  type="button"
                  onClick={() => setCurrentIndex((prev) => Math.min(prev + 1, questions.length - 1))}
                  disabled={currentIndex === questions.length - 1}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-30 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                >
                  <span>Soal Selanjutnya</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
              <p className="text-slate-500 text-sm">Tidak ada butir soal dalam ujian ini.</p>
            </div>
          )}
        </div>

        {/* Right Sidebar: Floating Navigation Grid (1 s/d 50) */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs sticky top-20 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                Navigasi Soal (1 - {questions.length})
              </h3>
              <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                {Object.keys(answers).length} Terjawab
              </span>
            </div>

            {/* Grid 1 s/d 50 */}
            <div className="grid grid-cols-5 gap-2 max-h-[360px] overflow-y-auto p-1">
              {questions.map((q, idx) => {
                const isAnswered = answers[q.id] !== undefined && answers[q.id] !== '';
                const isFlagged = flagged[q.number];
                const isCurrent = idx === currentIndex;

                let btnClass = 'bg-slate-100 text-slate-600 hover:bg-slate-200';
                if (isAnswered) {
                  btnClass = 'bg-emerald-600 text-white font-bold shadow-xs';
                }
                if (isFlagged) {
                  btnClass = 'bg-amber-400 text-slate-900 font-bold ring-2 ring-amber-300';
                }

                return (
                  <button
                    key={q.id || idx}
                    type="button"
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-10 rounded-xl text-xs font-semibold transition-all relative cursor-pointer ${btnClass} ${
                      isCurrent ? 'ring-2 ring-indigo-600 ring-offset-2' : ''
                    }`}
                  >
                    {idx + 1}
                    {isFlagged && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-600 rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="pt-3 border-t border-slate-100 text-[11px] space-y-1.5 text-slate-600">
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 bg-emerald-600 rounded-md shrink-0" />
                <span>Sudah Dijawab</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 bg-amber-400 rounded-md shrink-0" />
                <span>Ragu-ragu (Ditandai)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 bg-slate-100 border border-slate-300 rounded-md shrink-0" />
                <span>Belum Dijawab</span>
              </div>
            </div>

            <button
              onClick={() => setShowConfirmSubmit(true)}
              className="w-full py-3 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>Kumpulkan Lembar Ujian</span>
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Submit Modal */}
      {showConfirmSubmit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto text-amber-600">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-bold text-slate-800 text-base">Kumpulkan Lembar Ujian?</h3>
              <p className="text-xs text-slate-500">
                Anda telah menjawab{' '}
                <strong className="text-emerald-600 font-bold">
                  {Object.keys(answers).length}
                </strong>{' '}
                dari {questions.length} butir soal.
                {questions.length - Object.keys(answers).length > 0 && (
                  <span className="text-red-600 block mt-1">
                    (Terdapat {questions.length - Object.keys(answers).length} soal yang belum Anda isi!)
                  </span>
                )}
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmSubmit(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Kembali Periksa
              </button>
              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Ya, Kumpulkan Sekarang</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Anti-cheat tab blur warning modal */}
      {showWarningModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border-2 border-red-300 max-w-sm w-full p-6 text-center space-y-4 animate-in shake duration-200">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <div>
              <h4 className="font-bold text-red-700 text-base">Peringatan Integritas!</h4>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Terdeteksi meninggalkan halaman ujian! Aktivitas ini dicatat di dasbor pengawas secara langsung.
              </p>
              <div className="mt-3 px-3 py-1.5 bg-red-50 text-red-800 rounded-lg text-xs font-semibold">
                Pelanggaran tercatat: {tabBlurCount} kali
              </div>
            </div>

            <button
              onClick={() => setShowWarningModal(false)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer"
            >
              Saya Mengerti & Kembali Ujian
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
