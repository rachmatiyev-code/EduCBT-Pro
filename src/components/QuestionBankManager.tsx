import React, { useState, useEffect } from 'react';
import {
  FolderArchive,
  Plus,
  Play,
  Copy,
  Trash2,
  Edit3,
  Sparkles,
  FileText,
  Clock,
  CheckCircle,
  HelpCircle,
  Image as ImageIcon,
  Video,
  Volume2,
  Share2,
  ShieldAlert,
  Shuffle,
  Eye,
  Sliders,
  ChevronDown,
  ChevronUp,
  Square,
  CheckSquare,
  Printer,
  Upload,
  Download,
  FileSpreadsheet,
  Layers,
  AlertTriangle,
  X,
  KeyRound,
  Check,
} from 'lucide-react';
import {
  QuestionBank,
  QuestionItem,
  QuestionType,
  ExamSession,
  Subject,
  ClassGroup,
  SchoolProfile,
  Teacher,
} from '../types/cbt';
import { api } from '../services/api';
import { AIPromptGeneratorModal } from './AIPromptGeneratorModal';
import { ExamPrintBlueprintModal } from './ExamPrintBlueprintModal';
import { QuestionImportExportModal } from './QuestionImportExportModal';

interface QuestionBankManagerProps {
  questionBanks: QuestionBank[];
  examSessions: ExamSession[];
  subjects: Subject[];
  classes: ClassGroup[];
  schoolProfile?: SchoolProfile;
  teachers?: Teacher[];
  onRefreshData: () => void;
  onOpenSessionMonitoring?: (sessionCode: string) => void;
}

export const QuestionBankManager: React.FC<QuestionBankManagerProps> = ({
  questionBanks,
  examSessions,
  subjects,
  classes,
  schoolProfile = {
    regionalGovernment: 'PEMERINTAH DAERAH PROVINSI DKI JAKARTA',
    educationDepartment: 'DINAS PENDIDIKAN DAN KEBUDAYAAN',
    name: 'SMP Negeri 5 Percontohan',
    npsn: '20108922',
    address: 'Jl. Pendidikan Merdeka No. 45, Jakarta Pusat',
    phone: '(021) 7890-1234',
    email: 'info@sman1prestasibangsa.sch.id',
    principalName: 'Drs. H. Bambang Sugiarto, M.Pd.',
    principalNip: '19680512 199403 1 004',
    academicYear: '2026/2027',
    semester: 'Ganjil',
  },
  teachers = [],
  onRefreshData,
  onOpenSessionMonitoring,
}) => {
  const [activeTab, setActiveTab] = useState<'banks' | 'sessions'>('banks');
  const [selectedBank, setSelectedBank] = useState<QuestionBank | null>(null);
  const [isEditingBank, setIsEditingBank] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);

  // Print & Blueprint Modal State
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printModalBank, setPrintModalBank] = useState<QuestionBank | null>(null);

  // Import / Export Modal State
  const [isImportExportModalOpen, setIsImportExportModalOpen] = useState(false);

  // Synchronize selectedBank with questionBanks prop on updates
  useEffect(() => {
    if (selectedBank) {
      const updated = questionBanks.find((b) => b.id === selectedBank.id);
      if (updated) {
        setSelectedBank(updated);
      }
    }
  }, [questionBanks]);

  // Selection State for Question Banks and Exam Sessions
  const [selectedBankIds, setSelectedBankIds] = useState<string[]>([]);
  const [selectedSessionIds, setSelectedSessionIds] = useState<string[]>([]);

  // Modal for Editing Question Bank Metadata
  const [editingBankMeta, setEditingBankMeta] = useState<QuestionBank | null>(null);
  const [editBankTitle, setEditBankTitle] = useState('');
  const [editBankSubjectId, setEditBankSubjectId] = useState('');
  const [editBankGrade, setEditBankGrade] = useState('10');
  const [editBankPassingScore, setEditBankPassingScore] = useState(75);
  const [editBankDuration, setEditBankDuration] = useState(60);
  const [editBankCurriculum, setEditBankCurriculum] = useState('Kurikulum Merdeka');
  const [editBankAcademicYear, setEditBankAcademicYear] = useState('2026/2027');
  const [editBankSemester, setEditBankSemester] = useState<'Ganjil' | 'Genap'>('Ganjil');

  // Modal for Editing Active Exam Session
  const [editingSession, setEditingSession] = useState<ExamSession | null>(null);
  const [editSessionToken, setEditSessionToken] = useState('');
  const [editSessionTitle, setEditSessionTitle] = useState('');
  const [editSessionBankId, setEditSessionBankId] = useState('');
  const [editSessionDuration, setEditSessionDuration] = useState(60);
  const [editSessionTargetClasses, setEditSessionTargetClasses] = useState<string[]>([]);
  const [editSessionShuffleQuestions, setEditSessionShuffleQuestions] = useState(false);
  const [editSessionShuffleOptions, setEditSessionShuffleOptions] = useState(false);
  const [editSessionShowResult, setEditSessionShowResult] = useState(true);
  const [editSessionAntiCheat, setEditSessionAntiCheat] = useState(true);
  const [editSessionMaxTabSwitches, setEditSessionMaxTabSwitches] = useState(3);
  const [editSessionStatus, setEditSessionStatus] = useState<'active' | 'ended' | 'scheduled'>('active');

  // Delete Confirmation Modal
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: 'bank' | 'session' | 'bulk-banks' | 'bulk-sessions';
    id?: string;
    ids?: string[];
    title?: string;
    count?: number;
  } | null>(null);
  const [isDeletingLoading, setIsDeletingLoading] = useState(false);

  // Deploy session modal state
  const [deployModalBank, setDeployModalBank] = useState<QuestionBank | null>(null);
  const [deployToken, setDeployToken] = useState('CBT-' + Math.floor(1000 + Math.random() * 9000));
  const [deployTargetClasses, setDeployTargetClasses] = useState<string[]>([]);
  const [deployDuration, setDeployDuration] = useState(60);
  const [deployShuffleQuestions, setDeployShuffleQuestions] = useState(false);
  const [deployShuffleOptions, setDeployShuffleOptions] = useState(false);
  const [deployShowResult, setDeployShowResult] = useState(true);
  const [deployAntiCheat, setDeployAntiCheat] = useState(true);
  const [deployMaxTabSwitches, setDeployMaxTabSwitches] = useState(3);
  const [isDeploying, setIsDeploying] = useState(false);

  // New question form state
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [qType, setQType] = useState<QuestionType>('multiple_choice');
  const [qText, setQText] = useState('');
  const [qPoints, setQPoints] = useState(10);
  const [qOptions, setQOptions] = useState<string[]>(['A. ', 'B. ', 'C. ', 'D. ']);
  const [qCorrect, setQCorrect] = useState<any>('A');
  const [qExplanation, setQExplanation] = useState('');
  // Media insertion state
  const [mediaType, setMediaType] = useState<'none' | 'image' | 'audio' | 'video'>('none');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaCaption, setMediaCaption] = useState('');
  const [audioPlayLimit, setAudioPlayLimit] = useState(2);
  // Matching pairs
  const [matchingPairs, setMatchingPairs] = useState<{ left: string; right: string }[]>([
    { left: 'Premis 1', right: 'Jawaban 1' },
    { left: 'Premis 2', right: 'Jawaban 2' },
  ]);

  // Selected questions for bulk operations (Fitur Pilih Soal)
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);

  const handleToggleSelectQuestion = (qId: string) => {
    setSelectedQuestionIds((prev) =>
      prev.includes(qId) ? prev.filter((x) => x !== qId) : [...prev, qId]
    );
  };

  const handleToggleSelectAllQuestions = () => {
    if (!selectedBank) return;
    if (selectedQuestionIds.length === selectedBank.questions.length && selectedBank.questions.length > 0) {
      setSelectedQuestionIds([]);
    } else {
      setSelectedQuestionIds(selectedBank.questions.map((q) => q.id));
    }
  };

  const handleBulkDeleteQuestions = async () => {
    if (!selectedBank || selectedQuestionIds.length === 0) return;
    if (
      confirm(
        `Yakin ingin menghapus ${selectedQuestionIds.length} butir soal yang telah Anda pilih?`
      )
    ) {
      const remaining = selectedBank.questions
        .filter((q) => !selectedQuestionIds.includes(q.id))
        .map((q, idx) => ({ ...q, number: idx + 1 }));
      setSelectedQuestionIds([]);
      const updatedBank = {
        ...selectedBank,
        questions: remaining,
        totalQuestions: remaining.length,
        updatedAt: new Date().toISOString(),
      };
      setSelectedBank(updatedBank);
      await handleSaveBankMeta(updatedBank);
    }
  };

  const handleBulkDuplicateQuestions = async () => {
    if (!selectedBank || selectedQuestionIds.length === 0) return;
    const toDuplicate = selectedBank.questions.filter((q) => selectedQuestionIds.includes(q.id));
    const newCopies = toDuplicate.map((q, i) => ({
      ...q,
      id: `q-dup-${Date.now()}-${i}`,
    }));
    const updatedQuestions = [...selectedBank.questions, ...newCopies].map((q, idx) => ({
      ...q,
      number: idx + 1,
    }));
    setSelectedQuestionIds([]);
    const updatedBank = {
      ...selectedBank,
      questions: updatedQuestions,
      totalQuestions: updatedQuestions.length,
      updatedAt: new Date().toISOString(),
    };
    setSelectedBank(updatedBank);
    await handleSaveBankMeta(updatedBank);
  };

  const handleCreateNewBank = () => {
    const newBank: QuestionBank = {
      id: `BANK-${Date.now()}`,
      title: 'Bank Soal Baru',
      subjectId: subjects[0]?.id || 'SUB-01',
      gradeLevel: '10',
      teacherId: 'T01',
      totalQuestions: 0,
      durationMinutes: 60,
      passingScore: 75,
      questions: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setSelectedBank(newBank);
    setIsEditingBank(true);
  };

  const handleSaveBankMeta = async (bankToSave: QuestionBank) => {
    bankToSave.totalQuestions = bankToSave.questions.length;
    bankToSave.updatedAt = new Date().toISOString();
    await api.saveQuestionBank(bankToSave);
    onRefreshData();
    setSelectedBank(bankToSave);
  };

  const handleDeleteBank = (id: string, title?: string, count?: number) => {
    setDeleteConfirm({
      type: 'bank',
      id,
      title: title || 'Bank Soal',
      count,
    });
  };

  const handleDeleteSession = (id: string, title?: string) => {
    setDeleteConfirm({
      type: 'session',
      id,
      title: title || 'Sesi Ujian',
    });
  };

  const handleDuplicateBank = async (bank: QuestionBank) => {
    const duplicated: QuestionBank = {
      ...bank,
      id: `BANK-${Date.now()}`,
      title: `${bank.title} (Salinan)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await api.saveQuestionBank(duplicated);
    onRefreshData();
  };

  const handleSaveQuestionItem = async () => {
    if (!selectedBank) return;
    if (!qText.trim()) {
      alert('Teks pertanyaan tidak boleh kosong!');
      return;
    }

    const questionMedia =
      mediaType !== 'none' && mediaUrl.trim()
        ? {
            type: mediaType,
            url: mediaUrl.trim(),
            caption: mediaCaption.trim() || undefined,
            maxPlayCount: mediaType === 'audio' ? audioPlayLimit : undefined,
          }
        : undefined;

    let finalCorrectAnswer = qCorrect;
    let finalMatchingPairs = undefined;

    if (qType === 'matching') {
      const matchObj: Record<string, string> = {};
      matchingPairs.forEach((p) => {
        if (p.left && p.right) matchObj[p.left] = p.right;
      });
      finalCorrectAnswer = matchObj;
      finalMatchingPairs = matchingPairs;
    }

    const newQuestion: QuestionItem = {
      id: editingQuestionId || `q-${Date.now()}`,
      number: editingQuestionId
        ? selectedBank.questions.find((x) => x.id === editingQuestionId)?.number || selectedBank.questions.length + 1
        : selectedBank.questions.length + 1,
      type: qType,
      question: qText,
      options: qType === 'multiple_choice' || qType === 'multiple_select' ? qOptions : undefined,
      correctAnswer: finalCorrectAnswer,
      matchingPairs: finalMatchingPairs,
      explanation: qExplanation,
      points: Number(qPoints) || 10,
      media: questionMedia,
    };

    let updatedQuestions = [...selectedBank.questions];
    if (editingQuestionId) {
      updatedQuestions = updatedQuestions.map((q) => (q.id === editingQuestionId ? newQuestion : q));
    } else {
      updatedQuestions.push(newQuestion);
    }

    // Renumber
    updatedQuestions = updatedQuestions.map((q, i) => ({ ...q, number: i + 1 }));

    const updatedBank: QuestionBank = {
      ...selectedBank,
      questions: updatedQuestions,
      totalQuestions: updatedQuestions.length,
      updatedAt: new Date().toISOString(),
    };

    setSelectedBank(updatedBank);
    await handleSaveBankMeta(updatedBank);

    // Reset question form
    setIsAddingQuestion(false);
    setEditingQuestionId(null);
    setQText('');
    setQOptions(['A. ', 'B. ', 'C. ', 'D. ']);
    setQCorrect('A');
    setQExplanation('');
    setMediaType('none');
    setMediaUrl('');
    setMediaCaption('');
  };

  const handleEditQuestion = (q: QuestionItem) => {
    setEditingQuestionId(q.id);
    setQType(q.type);
    setQText(q.question);
    setQPoints(q.points);
    setQOptions(q.options || ['A. ', 'B. ', 'C. ', 'D. ']);
    setQCorrect(q.correctAnswer);
    setQExplanation(q.explanation || '');
    if (q.media) {
      setMediaType(q.media.type);
      setMediaUrl(q.media.url);
      setMediaCaption(q.media.caption || '');
      setAudioPlayLimit(q.media.maxPlayCount || 2);
    } else {
      setMediaType('none');
      setMediaUrl('');
      setMediaCaption('');
    }
    if (q.matchingPairs && q.matchingPairs.length > 0) {
      setMatchingPairs(q.matchingPairs);
    } else if (q.type === 'matching' && typeof q.correctAnswer === 'object' && q.correctAnswer !== null) {
      const converted = Object.entries(q.correctAnswer).map(([left, right]) => ({
        left: String(left),
        right: String(right),
      }));
      setMatchingPairs(
        converted.length > 0
          ? converted
          : [
              { left: 'Premis 1', right: 'Jawaban 1' },
              { left: 'Premis 2', right: 'Jawaban 2' },
            ]
      );
    } else if (q.type === 'matching') {
      setMatchingPairs([
        { left: 'Premis 1', right: 'Jawaban 1' },
        { left: 'Premis 2', right: 'Jawaban 2' },
      ]);
    }
    setIsAddingQuestion(true);
  };

  const handleDeleteQuestion = async (qId: string) => {
    if (!selectedBank) return;
    const filtered = selectedBank.questions.filter((q) => q.id !== qId).map((q, i) => ({ ...q, number: i + 1 }));
    const updatedBank = {
      ...selectedBank,
      questions: filtered,
      totalQuestions: filtered.length,
    };
    setSelectedBank(updatedBank);
    await handleSaveBankMeta(updatedBank);
  };

  const handleImportAIQuestions = async (
    aiQuestions: QuestionItem[],
    titleInfo: { subject: string; topic: string }
  ) => {
    try {
      if (!selectedBank) {
        // Create new bank from AI
        const newBank: QuestionBank = {
          id: `BANK-${Date.now()}`,
          title: `Ujian ${titleInfo.subject} - ${titleInfo.topic}`,
          subjectId:
            subjects.find((s) => s.name.toLowerCase().includes(titleInfo.subject.toLowerCase()))?.id ||
            (subjects[0]?.id || 'SUB-01'),
          gradeLevel: '10',
          teacherId: 'T01',
          totalQuestions: aiQuestions.length,
          durationMinutes: Math.min(aiQuestions.length * 3, 90),
          passingScore: 75,
          questions: aiQuestions,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await api.saveQuestionBank(newBank);
        setSelectedBank(newBank);
        setIsEditingBank(true);
      } else {
        // Append to current bank
        const currentCount = selectedBank.questions.length;
        const renumbered = aiQuestions.map((q, idx) => ({
          ...q,
          id: `q-ai-${Date.now()}-${idx}`,
          number: currentCount + idx + 1,
        }));
        const updatedQuestions = [...selectedBank.questions, ...renumbered];
        const updatedBank: QuestionBank = {
          ...selectedBank,
          questions: updatedQuestions,
          totalQuestions: updatedQuestions.length,
          updatedAt: new Date().toISOString(),
        };
        setSelectedBank(updatedBank);
        await api.saveQuestionBank(updatedBank);
      }
      onRefreshData();
    } catch (err: any) {
      console.error('Error importing questions to bank:', err);
    }
  };

  const handleOpenDeployModal = (bank: QuestionBank) => {
    setDeployModalBank(bank);
    const generatedToken = 'CBT-' + Math.floor(1000 + Math.random() * 9000);
    setDeployToken(generatedToken);
    setDeployDuration(bank.durationMinutes || 60);
    // Default to all classes if available, otherwise open to all
    setDeployTargetClasses(classes.length > 0 ? classes.map((c) => c.id) : []);
  };

  const handleConfirmDeploy = async () => {
    if (!deployModalBank) return;
    setIsDeploying(true);
    const finalToken = (deployToken.trim() || 'CBT-' + Math.floor(1000 + Math.random() * 9000)).toUpperCase();
    const finalTargetClasses =
      deployTargetClasses.length > 0 ? deployTargetClasses : classes.map((c) => c.id);

    const newSession: ExamSession = {
      id: `SES-${Date.now()}`,
      bankId: deployModalBank.id,
      sessionCode: finalToken,
      title: deployModalBank.title,
      targetClassIds: finalTargetClasses,
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 86400000).toISOString(),
      durationMinutes: deployDuration || 60,
      shuffleQuestions: deployShuffleQuestions,
      shuffleOptions: deployShuffleOptions,
      showResultInstant: deployShowResult,
      antiCheatEnabled: deployAntiCheat,
      maxTabSwitches: deployMaxTabSwitches,
      status: 'active',
    };

    try {
      await api.saveExamSession(newSession);
      onRefreshData();
      setDeployModalBank(null);
      setActiveTab('sessions');
    } catch (err: any) {
      console.warn('Deploy session encountered an issue, verifying local fallback:', err);
      try {
        const cached: ExamSession[] = JSON.parse(
          localStorage.getItem('educbt_master_exam_sessions') || '[]'
        );
        if (!cached.some((s) => s.id === newSession.id)) {
          cached.push(newSession);
          localStorage.setItem('educbt_master_exam_sessions', JSON.stringify(cached));
        }
        onRefreshData();
        setDeployModalBank(null);
        setActiveTab('sessions');
      } catch (localErr) {
        alert('Gagal meluncurkan ujian: ' + (err.message || 'Terjadi kendala pada perangkat'));
      }
    } finally {
      setIsDeploying(false);
    }
  };

  // Selection Handlers - Banks
  const handleToggleSelectBank = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedBankIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSelectAllBanks = () => {
    if (selectedBankIds.length === questionBanks.length && questionBanks.length > 0) {
      setSelectedBankIds([]);
    } else {
      setSelectedBankIds(questionBanks.map((b) => b.id));
    }
  };

  // Selection Handlers - Sessions
  const handleToggleSelectSession = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedSessionIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSelectAllSessions = () => {
    if (selectedSessionIds.length === examSessions.length && examSessions.length > 0) {
      setSelectedSessionIds([]);
    } else {
      setSelectedSessionIds(examSessions.map((s) => s.id));
    }
  };

  // Bulk Toggle Sessions Active/Inactive (Ended)
  const handleBulkToggleSessionsStatus = async () => {
    if (selectedSessionIds.length === 0) return;
    const targetSessions = examSessions.filter((s) => selectedSessionIds.includes(s.id));
    // If all active, set all ended; otherwise set all active
    const allActive = targetSessions.every((s) => s.status === 'active');
    const newStatus: 'active' | 'ended' | 'scheduled' = allActive ? 'ended' : 'active';
    await Promise.all(
      targetSessions.map((s) =>
        api.saveExamSession({ ...s, status: newStatus })
      )
    );
    onRefreshData();
  };

  // Edit Bank Metadata Handlers
  const handleOpenEditBankMeta = (bank: QuestionBank, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingBankMeta(bank);
    setEditBankTitle(bank.title || '');
    setEditBankSubjectId(bank.subjectId || subjects[0]?.id || 'SUB-01');
    setEditBankGrade(bank.gradeLevel || '10');
    setEditBankPassingScore(bank.passingScore || 75);
    setEditBankDuration(bank.durationMinutes || 60);
    setEditBankCurriculum(bank.curriculum || 'Kurikulum Merdeka');
    setEditBankAcademicYear(bank.academicYear || schoolProfile?.academicYear || '2026/2027');
    setEditBankSemester(bank.semester === 'Genap' ? 'Genap' : 'Ganjil');
  };

  const handleSaveBankMetaForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBankMeta) return;
    const updatedBank: QuestionBank = {
      ...editingBankMeta,
      title: editBankTitle.trim() || editingBankMeta.title,
      subjectId: editBankSubjectId,
      gradeLevel: editBankGrade,
      passingScore: Number(editBankPassingScore) || 75,
      durationMinutes: Number(editBankDuration) || 60,
      curriculum: editBankCurriculum,
      academicYear: editBankAcademicYear,
      semester: editBankSemester,
      updatedAt: new Date().toISOString(),
    };
    await api.saveQuestionBank(updatedBank);
    onRefreshData();
    if (selectedBank?.id === updatedBank.id) {
      setSelectedBank(updatedBank);
    }
    setEditingBankMeta(null);
  };

  // Edit Exam Session Handlers
  const handleOpenEditSession = (session: ExamSession, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingSession(session);
    setEditSessionToken(session.sessionCode || '');
    setEditSessionTitle(session.title || '');
    setEditSessionBankId(session.bankId || questionBanks[0]?.id || '');
    setEditSessionDuration(session.durationMinutes || 60);
    setEditSessionTargetClasses(Array.isArray(session.targetClassIds) ? session.targetClassIds : []);
    setEditSessionShuffleQuestions(Boolean(session.shuffleQuestions));
    setEditSessionShuffleOptions(Boolean(session.shuffleOptions));
    setEditSessionShowResult(session.showResultInstant !== false);
    setEditSessionAntiCheat(session.antiCheatEnabled !== false);
    setEditSessionMaxTabSwitches(session.maxTabSwitches || 3);
    setEditSessionStatus(session.status || 'active');
  };

  const handleSaveEditSessionForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSession) return;
    const cleanToken = editSessionToken.trim().toUpperCase() || editingSession.sessionCode;
    const updatedSession: ExamSession = {
      ...editingSession,
      sessionCode: cleanToken,
      title: editSessionTitle.trim() || editingSession.title,
      bankId: editSessionBankId || editingSession.bankId,
      durationMinutes: Number(editSessionDuration) || 60,
      targetClassIds: editSessionTargetClasses,
      shuffleQuestions: editSessionShuffleQuestions,
      shuffleOptions: editSessionShuffleOptions,
      showResultInstant: editSessionShowResult,
      antiCheatEnabled: editSessionAntiCheat,
      maxTabSwitches: editSessionMaxTabSwitches,
      status: editSessionStatus,
    };
    await api.saveExamSession(updatedSession);
    onRefreshData();
    setEditingSession(null);
  };

  const handleToggleSessionStatus = async (session: ExamSession, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const newStatus: 'active' | 'ended' | 'scheduled' = session.status === 'active' ? 'ended' : 'active';
    const updated: ExamSession = { ...session, status: newStatus };
    await api.saveExamSession(updated);
    onRefreshData();
  };

  // Execute Deletion from Modal
  const handleConfirmExecuteDelete = async () => {
    if (!deleteConfirm) return;
    setIsDeletingLoading(true);
    try {
      if (deleteConfirm.type === 'bank' && deleteConfirm.id) {
        await api.deleteQuestionBank(deleteConfirm.id);
        if (selectedBank?.id === deleteConfirm.id) {
          setSelectedBank(null);
          setIsEditingBank(false);
        }
        setSelectedBankIds((prev) => prev.filter((x) => x !== deleteConfirm.id));
      } else if (deleteConfirm.type === 'bulk-banks' && deleteConfirm.ids) {
        await api.deleteMultipleQuestionBanks(deleteConfirm.ids);
        if (selectedBank && deleteConfirm.ids.includes(selectedBank.id)) {
          setSelectedBank(null);
          setIsEditingBank(false);
        }
        setSelectedBankIds([]);
      } else if (deleteConfirm.type === 'session' && deleteConfirm.id) {
        await api.deleteExamSession(deleteConfirm.id);
        setSelectedSessionIds((prev) => prev.filter((x) => x !== deleteConfirm.id));
      } else if (deleteConfirm.type === 'bulk-sessions' && deleteConfirm.ids) {
        await api.deleteMultipleExamSessions(deleteConfirm.ids);
        setSelectedSessionIds([]);
      }
      onRefreshData();
    } finally {
      setIsDeletingLoading(false);
      setDeleteConfirm(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2.5">
            <FolderArchive className="w-6 h-6 text-indigo-600" />
            <span>Bank Soal & Manajemen Sesi Ujian</span>
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Arsip soal hingga 50+ butir, sisip audio/video/gambar, dan deploy ulang dengan token ujian
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-slate-100 p-1 rounded-xl flex items-center text-xs font-semibold">
            <button
              onClick={() => {
                setActiveTab('banks');
                setSelectedBank(null);
              }}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'banks' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Arsip Bank Soal ({questionBanks.length})
            </button>
            <button
              onClick={() => {
                setActiveTab('sessions');
                setSelectedBank(null);
              }}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'sessions' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sesi Aktif ({examSessions.length})
            </button>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => {
                const target = selectedBank || questionBanks[0];
                if (!target) {
                  alert('Belum ada bank soal. Buat bank soal terlebih dahulu.');
                  return;
                }
                setPrintModalBank(target);
                setIsPrintModalOpen(true);
              }}
              className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
              title="Cetak Naskah Soal & Kisi-Kisi Soal Ujian (Bloom / SOLO)"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak & Kisi-Kisi</span>
            </button>

            <button
              onClick={() => setIsImportExportModalOpen(true)}
              className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
              title="Impor dan Ekspor Butir Soal (Excel/JSON/TSV)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Impor & Ekspor</span>
            </button>

            <button
              onClick={() => setIsAIModalOpen(true)}
              className="px-3.5 py-2 bg-linear-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
              <span>AI Generator Soal</span>
            </button>

            <button
              onClick={handleCreateNewBank}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Buat Bank Baru</span>
            </button>
          </div>
        </div>
      </div>

      {/* View: Sessions Active List */}
      {activeTab === 'sessions' && (
        <div className="space-y-4">
          {/* Action & Selection Bar for Sessions */}
          {examSessions.length > 0 && (
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleSelectAllSessions}
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer border border-slate-200"
                >
                  {selectedSessionIds.length === examSessions.length && examSessions.length > 0 ? (
                    <CheckSquare className="w-4 h-4 text-indigo-600" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400" />
                  )}
                  <span>
                    {selectedSessionIds.length === examSessions.length && examSessions.length > 0
                      ? 'Batalkan Semua'
                      : 'Pilih Semua'}
                  </span>
                </button>
                {selectedSessionIds.length > 0 && (
                  <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-md">
                    {selectedSessionIds.length} Sesi Dipilih
                  </span>
                )}
              </div>

              {selectedSessionIds.length > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleBulkToggleSessionsStatus}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Ubah status aktif / nonaktif untuk semua sesi terpilih"
                  >
                    <Sliders className="w-3.5 h-3.5 text-slate-600" />
                    <span>Ubah Status ({selectedSessionIds.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setDeleteConfirm({
                        type: 'bulk-sessions',
                        ids: selectedSessionIds,
                        count: selectedSessionIds.length,
                      })
                    }
                    className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-600" />
                    <span>Hapus Terpilih ({selectedSessionIds.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedSessionIds([])}
                    className="text-xs text-slate-500 hover:text-slate-800 underline cursor-pointer ml-1"
                  >
                    Batal
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {examSessions.length === 0 ? (
              <div className="col-span-full bg-white p-12 text-center rounded-2xl border border-slate-200">
                <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="font-bold text-slate-700 text-base">Belum Ada Sesi Ujian Aktif</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Buka tab Arsip Bank Soal lalu klik tombol "Deploy Ujian" untuk meluncurkan token ujian bagi siswa.
                </p>
              </div>
            ) : (
              examSessions.map((ses) => {
                const bank = questionBanks.find((b) => b.id === ses.bankId);
                const isSelected = selectedSessionIds.includes(ses.id);
                return (
                  <div
                    key={ses.id}
                    className={`rounded-2xl border p-5 shadow-xs transition-all flex flex-col justify-between space-y-4 ${
                      isSelected
                        ? 'border-indigo-400 ring-2 ring-indigo-200 bg-indigo-50/20'
                        : 'border-slate-200 bg-white hover:border-indigo-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2 gap-2">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => handleToggleSelectSession(ses.id, e)}
                            className="p-1 text-slate-400 hover:text-indigo-600 rounded transition-colors cursor-pointer"
                            title="Pilih sesi ujian ini"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-indigo-600" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-400" />
                            )}
                          </button>
                          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono font-bold text-xs rounded-lg tracking-wider">
                            TOKEN: {ses.sessionCode}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => handleToggleSessionStatus(ses, e)}
                          title="Klik untuk mengubah status sesi"
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase cursor-pointer transition-all ${
                            ses.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : ses.status === 'scheduled'
                              ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {ses.status === 'active' ? 'Aktif' : ses.status === 'ended' ? 'Berakhir' : 'Terjadwal'}
                        </button>
                      </div>

                      <h4 className="font-bold text-slate-800 text-sm line-clamp-2">{ses.title}</h4>
                      <p className="text-xs text-slate-500 mt-1">
                        {bank ? bank.title : 'Bank Soal Tidak Ditemukan'} • {bank?.totalQuestions || 0} Soal • Durasi: {ses.durationMinutes} Menit
                      </p>

                      <div className="mt-3 flex flex-wrap gap-1.5 text-[11px] text-slate-600">
                        {ses.antiCheatEnabled && (
                          <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-md border border-amber-200 flex items-center gap-1">
                            <ShieldAlert className="w-3 h-3" /> Anti-Curang
                          </span>
                        )}
                        {ses.shuffleQuestions && (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md flex items-center gap-1">
                            <Shuffle className="w-3 h-3" /> Acak Soal
                          </span>
                        )}
                        {ses.showResultInstant && (
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md">Skor Instan</span>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        onClick={() => onOpenSessionMonitoring && onOpenSessionMonitoring(ses.sessionCode)}
                        className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Live Monitoring</span>
                      </button>

                      <button
                        onClick={(e) => handleOpenEditSession(ses, e)}
                        className="p-2 text-indigo-700 hover:bg-indigo-50 border border-slate-200 rounded-xl transition-colors cursor-pointer"
                        title="Edit pengaturan sesi & token"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDeleteSession(ses.id, `${ses.sessionCode} - ${ses.title}`)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 border border-slate-200 rounded-xl transition-colors cursor-pointer"
                        title="Hapus sesi ujian"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* View: Bank Soal List (when no bank is selected for editing) */}
      {activeTab === 'banks' && !selectedBank && (
        <div className="space-y-4">
          {/* Action & Selection Bar for Question Banks */}
          {questionBanks.length > 0 && (
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleSelectAllBanks}
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer border border-slate-200"
                >
                  {selectedBankIds.length === questionBanks.length && questionBanks.length > 0 ? (
                    <CheckSquare className="w-4 h-4 text-indigo-600" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400" />
                  )}
                  <span>
                    {selectedBankIds.length === questionBanks.length && questionBanks.length > 0
                      ? 'Batalkan Semua'
                      : 'Pilih Semua'}
                  </span>
                </button>
                {selectedBankIds.length > 0 && (
                  <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-md">
                    {selectedBankIds.length} Bank Soal Dipilih
                  </span>
                )}
              </div>

              {selectedBankIds.length > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setDeleteConfirm({
                        type: 'bulk-banks',
                        ids: selectedBankIds,
                        count: selectedBankIds.length,
                      })
                    }
                    className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-600" />
                    <span>Hapus Terpilih ({selectedBankIds.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedBankIds([])}
                    className="text-xs text-slate-500 hover:text-slate-800 underline cursor-pointer ml-1"
                  >
                    Batal
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {questionBanks.map((bank) => {
              const subject = subjects.find((s) => s.id === bank.subjectId);
              const isSelected = selectedBankIds.includes(bank.id);
              return (
                <div
                  key={bank.id}
                  className={`rounded-2xl border p-5 shadow-xs transition-all flex flex-col justify-between space-y-4 ${
                    isSelected
                      ? 'border-indigo-400 ring-2 ring-indigo-200 bg-indigo-50/20'
                      : 'border-slate-200 bg-white hover:border-indigo-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => handleToggleSelectBank(bank.id, e)}
                          className="p-1 text-slate-400 hover:text-indigo-600 rounded transition-colors cursor-pointer"
                          title="Pilih bank soal ini"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-indigo-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400" />
                          )}
                        </button>
                        <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 font-semibold text-xs rounded-md">
                          {subject?.name || 'Mata Pelajaran'} • Kls {bank.gradeLevel}
                        </span>
                      </div>
                      <span className="text-xs text-slate-600 font-mono">
                        KKM: {bank.passingScore}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-800 text-sm line-clamp-2 leading-snug">{bank.title}</h3>
                    <p className="text-xs text-slate-600 mt-2 flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-slate-600" />
                      <span>{bank.questions?.length || 0} Butir Soal</span>
                      <span>•</span>
                      <Clock className="w-3.5 h-3.5 text-slate-600" />
                      <span>{bank.durationMinutes} Menit</span>
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-1.5 flex-wrap">
                    <button
                      onClick={() => handleOpenDeployModal(bank)}
                      className="flex-1 min-w-[100px] py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer shadow-xs"
                      title="Deploy sesi ujian dengan token"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Deploy Ujian</span>
                    </button>

                    <button
                      onClick={(e) => handleOpenEditBankMeta(bank, e)}
                      className="p-2 text-indigo-700 hover:bg-indigo-50 border border-slate-200 rounded-xl transition-colors cursor-pointer"
                      title="Edit Arsip & Metadata (Judul, Mapel, KKM, Durasi, dsb)"
                    >
                      <Sliders className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        setSelectedBank(bank);
                        setIsEditingBank(true);
                      }}
                      className="p-2 text-indigo-600 hover:bg-indigo-50 border border-slate-200 rounded-xl transition-colors cursor-pointer"
                      title="Edit butir-butir soal"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        setPrintModalBank(bank);
                        setIsPrintModalOpen(true);
                      }}
                      className="p-2 text-indigo-700 hover:bg-indigo-50 border border-slate-200 rounded-xl transition-colors cursor-pointer"
                      title="Cetak Naskah Soal & Kisi-Kisi Ujian (Bloom / SOLO)"
                    >
                      <Printer className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        setSelectedBank(bank);
                        setIsImportExportModalOpen(true);
                      }}
                      className="p-2 text-emerald-700 hover:bg-emerald-50 border border-slate-200 rounded-xl transition-colors cursor-pointer"
                      title="Ekspor atau Impor Soal Bank Ini"
                    >
                      <Download className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDuplicateBank(bank)}
                      className="p-2 text-slate-600 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
                      title="Duplikasi bank soal"
                    >
                      <Copy className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDeleteBank(bank.id, bank.title, bank.questions?.length)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 border border-slate-200 rounded-xl transition-colors cursor-pointer"
                      title="Hapus bank soal"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* View: Detail Bank Soal & Editor Butir Soal */}
      {activeTab === 'banks' && selectedBank && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-xs">
          {/* Bank Metadata Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-200">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedBank(null)}
                  className="text-xs text-indigo-600 font-semibold hover:underline"
                >
                  ← Kembali ke Daftar Bank
                </button>
                <span className="text-slate-300">•</span>
                <span className="text-xs text-slate-500">ID: {selectedBank.id}</span>
              </div>
              <input
                type="text"
                value={selectedBank.title}
                onChange={(e) => setSelectedBank({ ...selectedBank, title: e.target.value })}
                className="text-lg font-bold text-slate-800 border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:outline-none w-full"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs bg-slate-100 px-3 py-1.5 rounded-xl">
                <span className="text-slate-500">Mapel:</span>
                <select
                  value={selectedBank.subjectId}
                  onChange={(e) => setSelectedBank({ ...selectedBank, subjectId: e.target.value })}
                  className="bg-transparent font-semibold text-slate-700 focus:outline-none"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5 text-xs bg-slate-100 px-3 py-1.5 rounded-xl">
                <span className="text-slate-500">Kelas:</span>
                <select
                  value={selectedBank.gradeLevel}
                  onChange={(e) => setSelectedBank({ ...selectedBank, gradeLevel: e.target.value })}
                  className="bg-transparent font-semibold text-slate-700 focus:outline-none"
                >
                  <optgroup label="Sekolah Dasar (SD)">
                    <option value="1">Kelas 1 SD</option>
                    <option value="2">Kelas 2 SD</option>
                    <option value="3">Kelas 3 SD</option>
                    <option value="4">Kelas 4 SD</option>
                    <option value="5">Kelas 5 SD</option>
                    <option value="6">Kelas 6 SD</option>
                  </optgroup>
                  <optgroup label="SMP">
                    <option value="7">Kelas 7 SMP</option>
                    <option value="8">Kelas 8 SMP</option>
                    <option value="9">Kelas 9 SMP</option>
                  </optgroup>
                  <optgroup label="SMA/SMK">
                    <option value="10">Kelas 10 SMA</option>
                    <option value="11">Kelas 11 SMA</option>
                    <option value="12">Kelas 12 SMA</option>
                  </optgroup>
                </select>
              </div>

              <div className="flex items-center gap-1.5 text-xs bg-slate-100 px-3 py-1.5 rounded-xl">
                <span className="text-slate-500">Durasi:</span>
                <input
                  type="number"
                  value={selectedBank.durationMinutes}
                  onChange={(e) => setSelectedBank({ ...selectedBank, durationMinutes: Number(e.target.value) })}
                  className="w-14 bg-transparent font-semibold text-slate-700 focus:outline-none text-center"
                />
                <span className="text-slate-500">Mnt</span>
              </div>

              <button
                onClick={() => handleSaveBankMeta(selectedBank)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer"
              >
                Simpan Perubahan
              </button>
            </div>
          </div>

          {/* Quick Action Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleToggleSelectAllQuestions}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-indigo-600 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 shadow-2xs"
                title="Pilih Semua Soal"
              >
                {selectedBank.questions.length > 0 &&
                selectedQuestionIds.length === selectedBank.questions.length ? (
                  <CheckSquare className="w-4 h-4 text-indigo-600" />
                ) : (
                  <Square className="w-4 h-4 text-slate-400" />
                )}
                <span>Pilih Semua</span>
              </button>
              <span className="text-slate-300">|</span>
              <span className="text-xs font-bold text-slate-700">
                Total Soal: {selectedBank.questions.length} / 50 Butir
              </span>
              <span className="text-slate-300">|</span>
              <span className="text-xs text-slate-500">
                Total Poin:{' '}
                {selectedBank.questions.reduce((sum, q) => sum + (Number(q.points) || 0), 0)}
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => {
                  setPrintModalBank(selectedBank);
                  setIsPrintModalOpen(true);
                }}
                className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                title="Cetak Naskah Soal & Kisi-Kisi Ujian (Bloom-Anderson / SOLO)"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak & Kisi-Kisi</span>
              </button>

              <button
                onClick={() => setIsImportExportModalOpen(true)}
                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                title="Impor atau Ekspor Soal ke Excel/JSON"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Impor & Ekspor</span>
              </button>

              <button
                onClick={() => setIsAIModalOpen(true)}
                className="px-3 py-1.5 bg-linear-to-r from-indigo-600 to-blue-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs hover:opacity-90 transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                <span>Tambah Soal via AI</span>
              </button>

              <button
                onClick={() => {
                  setEditingQuestionId(null);
                  setQText('');
                  setQOptions(['A. ', 'B. ', 'C. ', 'D. ']);
                  setQCorrect('A');
                  setMediaType('none');
                  setMediaUrl('');
                  setIsAddingQuestion(true);
                }}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tulis Soal Manual</span>
              </button>

              <button
                onClick={() => handleOpenDeployModal(selectedBank)}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Deploy Ujian Sekarang</span>
              </button>
            </div>
          </div>

          {/* Bulk Action Bar for Selected Questions */}
          {selectedQuestionIds.length > 0 && (
            <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-200 flex items-center justify-between animate-in fade-in duration-150">
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-900">
                <CheckSquare className="w-4 h-4 text-indigo-600" />
                <span>{selectedQuestionIds.length} Butir Soal Terpilih</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedQuestionIds([])}
                  className="px-3 py-1 text-xs text-slate-600 hover:text-slate-900 font-semibold"
                >
                  Batal Pilih
                </button>
                <button
                  onClick={handleBulkDuplicateQuestions}
                  className="px-3 py-1 bg-white hover:bg-slate-50 text-indigo-700 border border-indigo-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Duplikasi Terpilih ({selectedQuestionIds.length})</span>
                </button>
                <button
                  onClick={handleBulkDeleteQuestions}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus Terpilih ({selectedQuestionIds.length})</span>
                </button>
              </div>
            </div>
          )}

          {/* Inline Add / Edit Question Form */}
          {isAddingQuestion && (
            <div className="p-5 rounded-2xl border-2 border-indigo-200 bg-indigo-50/40 space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between border-b border-indigo-100 pb-3">
                <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-indigo-600" />
                  <span>{editingQuestionId ? 'Edit Butir Soal' : 'Tambah Butir Soal Baru'}</span>
                </h4>
                <button
                  onClick={() => setIsAddingQuestion(false)}
                  className="text-xs text-slate-500 hover:text-slate-800"
                >
                  Batal
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                    Tipe Bentuk Soal
                  </label>
                  <select
                    value={qType}
                    onChange={(e) => setQType(e.target.value as QuestionType)}
                    className="w-full px-3 py-2 bg-white rounded-lg border border-slate-300 text-xs font-medium"
                  >
                    <option value="multiple_choice">Pilihan Ganda (Single Choice)</option>
                    <option value="multiple_select">Pilihan Ganda Kompleks (Multi Select)</option>
                    <option value="true_false">Benar / Salah</option>
                    <option value="matching">Menjodohkan (Matching Pairs)</option>
                    <option value="short_answer">Isian Singkat</option>
                    <option value="essay">Uraian / Essay</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                    Bobot Poin
                  </label>
                  <input
                    type="number"
                    value={qPoints}
                    onChange={(e) => setQPoints(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white rounded-lg border border-slate-300 text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                    Sisip Media Pendukung
                  </label>
                  <select
                    value={mediaType}
                    onChange={(e) => setMediaType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white rounded-lg border border-slate-300 text-xs font-medium"
                  >
                    <option value="none">Tanpa Media</option>
                    <option value="image">Gambar (URL / GDrive)</option>
                    <option value="audio">Audio / Suara (Listening Test)</option>
                    <option value="video">Video (YouTube / MP4)</option>
                  </select>
                </div>
              </div>

              {/* Media URL Input if active */}
              {mediaType !== 'none' && (
                <div className="p-3 bg-white rounded-xl border border-indigo-200 grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      URL Media ({mediaType})
                    </label>
                    <input
                      type="url"
                      value={mediaUrl}
                      onChange={(e) => setMediaUrl(e.target.value)}
                      placeholder={
                        mediaType === 'image'
                          ? 'https://images.unsplash.com/... atau link gambar drive'
                          : mediaType === 'audio'
                          ? 'https://example.com/audio.mp3 atau link suara'
                          : 'https://youtube.com/watch?v=... atau direct video URL'
                      }
                      className="w-full px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-300 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Keterangan / Caption Media
                    </label>
                    <input
                      type="text"
                      value={mediaCaption}
                      onChange={(e) => setMediaCaption(e.target.value)}
                      placeholder="Contoh: Perhatikan bagan di atas"
                      className="w-full px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-300 text-xs"
                    />
                  </div>
                </div>
              )}

              {/* Question Text */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                  Isi Teks Pertanyaan / Stimulus
                </label>
                <textarea
                  rows={3}
                  value={qText}
                  onChange={(e) => setQText(e.target.value)}
                  placeholder="Tuliskan stimulus teks, wacana, dan pokok pertanyaan..."
                  className="w-full px-3 py-2 bg-white rounded-lg border border-slate-300 text-xs leading-relaxed focus:outline-indigo-500"
                />
              </div>

              {/* Multiple Choice / Select Options */}
              {(qType === 'multiple_choice' || qType === 'multiple_select') && (
                <div className="space-y-2 bg-white p-3 rounded-xl border border-slate-200">
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase">
                    Pilihan Jawaban (A, B, C, D, E)
                  </label>
                  {qOptions.map((opt, oIdx) => (
                    <div key={oIdx} className="flex items-center gap-2">
                      <span className="w-6 text-center font-bold text-xs text-slate-600">
                        {String.fromCharCode(65 + oIdx)}.
                      </span>
                      <input
                        type="text"
                        value={opt.replace(/^[A-E]\.\s*/, '')}
                        onChange={(e) => {
                          const updated = [...qOptions];
                          updated[oIdx] = `${String.fromCharCode(65 + oIdx)}. ${e.target.value}`;
                          setQOptions(updated);
                        }}
                        className="flex-1 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-300 text-xs"
                        placeholder={`Teks pilihan ${String.fromCharCode(65 + oIdx)}`}
                      />
                    </div>
                  ))}

                  <div className="pt-2 flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">Kunci Jawaban Benar:</span>
                    {qType === 'multiple_choice' ? (
                      <select
                        value={qCorrect}
                        onChange={(e) => setQCorrect(e.target.value)}
                        className="px-3 py-1 bg-slate-100 rounded-md font-bold text-emerald-700 text-xs"
                      >
                        {qOptions.map((_, i) => (
                          <option key={i} value={String.fromCharCode(65 + i)}>
                            Pilihan {String.fromCharCode(65 + i)}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="flex gap-2">
                        {qOptions.map((_, i) => {
                          const letter = String.fromCharCode(65 + i);
                          const isSel = Array.isArray(qCorrect) && qCorrect.includes(letter);
                          return (
                            <button
                              key={i}
                              type="button"
                              onClick={() => {
                                const current = Array.isArray(qCorrect) ? [...qCorrect] : [];
                                if (current.includes(letter)) {
                                  setQCorrect(current.filter((x) => x !== letter));
                                } else {
                                  setQCorrect([...current, letter]);
                                }
                              }}
                              className={`w-7 h-7 rounded-md font-bold text-xs border ${
                                isSel
                                  ? 'bg-emerald-600 text-white border-emerald-600'
                                  : 'bg-white text-slate-700 border-slate-300'
                              }`}
                            >
                              {letter}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Matching pairs */}
              {qType === 'matching' && (
                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div>
                      <label className="text-xs font-bold text-indigo-900 uppercase">
                        Pasangan Menjodohkan (Kiri ➔ Kanan)
                      </label>
                      <p className="text-[11px] text-slate-500">
                        Masukkan butir soal di kolom kiri dan pasangannya yang benar di kolom kanan. Pilihan kanan akan diacak otomatis untuk siswa.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setMatchingPairs([
                          ...matchingPairs,
                          {
                            left: `Premis ${matchingPairs.length + 1}`,
                            right: `Jawaban ${matchingPairs.length + 1}`,
                          },
                        ])
                      }
                      className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold cursor-pointer shrink-0"
                    >
                      + Tambah Pasangan
                    </button>
                  </div>

                  <div className="grid grid-cols-12 gap-2 text-[11px] font-bold text-slate-500 uppercase px-1">
                    <span className="col-span-1">No</span>
                    <span className="col-span-5">Kolom Soal / Premis (Kiri)</span>
                    <span className="col-span-1 text-center"></span>
                    <span className="col-span-4">Kolom Kunci / Pasangan Cocok (Kanan)</span>
                    <span className="col-span-1 text-center">Aksi</span>
                  </div>

                  <div className="space-y-2">
                    {matchingPairs.map((pair, pIdx) => (
                      <div key={pIdx} className="grid grid-cols-12 gap-2 items-center bg-slate-50/70 p-2 rounded-xl border border-slate-200">
                        <span className="col-span-1 font-mono font-bold text-xs text-slate-500 text-center">
                          {pIdx + 1}.
                        </span>
                        <input
                          type="text"
                          value={pair.left}
                          onChange={(e) => {
                            const updated = [...matchingPairs];
                            updated[pIdx].left = e.target.value;
                            setMatchingPairs(updated);
                          }}
                          className="col-span-5 px-3 py-1.5 bg-white rounded-lg border border-slate-300 text-xs font-medium focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                          placeholder="Ketik premis soal kiri..."
                        />
                        <span className="col-span-1 text-center text-indigo-500 font-bold">➔</span>
                        <input
                          type="text"
                          value={pair.right}
                          onChange={(e) => {
                            const updated = [...matchingPairs];
                            updated[pIdx].right = e.target.value;
                            setMatchingPairs(updated);
                          }}
                          className="col-span-4 px-3 py-1.5 bg-white rounded-lg border border-slate-300 text-xs font-medium focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                          placeholder="Ketik jawaban yang cocok..."
                        />
                        <div className="col-span-1 flex justify-center">
                          <button
                            type="button"
                            onClick={() => {
                              if (matchingPairs.length <= 1) {
                                alert('Soal menjodohkan minimal memiliki 1 pasangan!');
                                return;
                              }
                              setMatchingPairs(matchingPairs.filter((_, idx) => idx !== pIdx));
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                            title="Hapus pasangan ini"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Short Answer */}
              {qType === 'short_answer' && (
                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                    Kunci Jawaban Singkat (Case-insensitive)
                  </label>
                  <input
                    type="text"
                    value={typeof qCorrect === 'string' ? qCorrect : ''}
                    onChange={(e) => setQCorrect(e.target.value)}
                    placeholder="Contoh: Fotosintesis"
                    className="w-full px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-300 text-xs"
                  />
                </div>
              )}

              {/* Explanation */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                  Pembahasan / Rubrik Penilaian
                </label>
                <input
                  type="text"
                  value={qExplanation}
                  onChange={(e) => setQExplanation(e.target.value)}
                  placeholder="Catatan pembahasan atau alasan jawaban benar..."
                  className="w-full px-3 py-1.5 bg-white rounded-lg border border-slate-300 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingQuestion(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveQuestionItem}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer"
                >
                  Simpan Butir Soal
                </button>
              </div>
            </div>
          )}

          {/* Question List (1 s/d 50) */}
          <div className="space-y-3">
            {selectedBank.questions.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
                <p className="text-sm font-semibold text-slate-600">Bank soal ini masih kosong.</p>
                <p className="text-xs text-slate-600 mt-1">
                  Klik "AI Generator Soal" untuk generate cepat atau "Tulis Soal Manual".
                </p>
              </div>
            ) : (
              selectedBank.questions.map((q, idx) => {
                const isSelected = selectedQuestionIds.includes(q.id);
                return (
                <div
                  key={q.id || idx}
                  className={`p-4 rounded-xl border transition-all text-xs space-y-2 group ${
                    isSelected
                      ? 'border-indigo-400 bg-indigo-50/30 ring-2 ring-indigo-200'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleSelectQuestion(q.id)}
                        className="p-1 hover:text-indigo-600 text-slate-400"
                        title={isSelected ? 'Batal pilih' : 'Pilih butir soal'}
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-indigo-600" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-300 group-hover:text-slate-500" />
                        )}
                      </button>
                      <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-xs">
                        {idx + 1}
                      </span>
                      <span className="uppercase font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                        {((q.type || 'multiple_choice') as string).replace(/_/g, ' ')}
                      </span>
                      <span className="text-slate-600 font-medium">({q.points || 10} Poin)</span>
                      {q.cognitiveLevel && (
                        <span className="px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 font-bold text-[10px]">
                          {q.cognitiveLevel}
                        </span>
                      )}
                      {q.media && (
                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md font-semibold flex items-center gap-1">
                          {q.media.type === 'image' && <ImageIcon className="w-3 h-3" />}
                          {q.media.type === 'audio' && <Volume2 className="w-3 h-3" />}
                          {q.media.type === 'video' && <Video className="w-3 h-3" />}
                          Media
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEditQuestion(q)}
                        className="p-1.5 text-slate-600 hover:text-indigo-600 rounded-md hover:bg-slate-100"
                        title="Edit soal"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteQuestion(q.id)}
                        className="p-1.5 text-slate-600 hover:text-red-600 rounded-md hover:bg-red-50"
                        title="Hapus soal"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="font-medium text-slate-800 whitespace-pre-line text-sm leading-relaxed">{q.question}</p>

                  {/* Media Preview if attached */}
                  {q.media && (
                    <div className="my-2 p-2 bg-slate-50 rounded-lg border border-slate-200 inline-block">
                      {q.media.type === 'image' && (
                        <img
                          src={q.media.url}
                          alt={q.media.caption || 'Media soal'}
                          className="max-h-40 rounded-md object-contain"
                        />
                      )}
                      {q.media.type === 'audio' && (
                        <audio controls src={q.media.url} className="h-8 max-w-xs" />
                      )}
                      {q.media.type === 'video' && (
                        <div className="text-xs text-indigo-600 font-mono">
                          Video: {q.media.url}
                        </div>
                      )}
                      {q.media.caption && (
                        <p className="text-[11px] text-slate-500 italic mt-1">{q.media.caption}</p>
                      )}
                    </div>
                  )}

                  {/* Options */}
                  {Array.isArray(q.options) && q.options.length > 0 && (
                    <div className="pl-3 border-l-2 border-slate-200 space-y-1 text-slate-600">
                      {q.options.map((opt, oIdx) => (
                        <div key={oIdx}>{typeof opt === 'string' ? opt : JSON.stringify(opt)}</div>
                      ))}
                    </div>
                  )}

                  {/* Matching pairs if any */}
                  {Array.isArray(q.matchingPairs) && q.matchingPairs.length > 0 && (
                    <div className="pl-3 border-l-2 border-indigo-200 space-y-1 text-slate-700 bg-indigo-50/40 p-2 rounded-lg">
                      <div className="font-semibold text-[11px] text-indigo-800 mb-1">Pasangan Menjodohkan:</div>
                      {q.matchingPairs.map((pair, pIdx) => (
                        <div key={pIdx} className="text-xs flex items-center gap-2">
                          <span className="font-semibold text-slate-800">{pair.left}</span>
                          <span className="text-indigo-400">➔</span>
                          <span>{pair.right}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <div className="text-emerald-700 font-semibold">
                      Kunci: {typeof q.correctAnswer === 'object' ? JSON.stringify(q.correctAnswer) : String(q.correctAnswer)}
                    </div>
                    {q.explanation && <div className="text-slate-600 italic">{q.explanation}</div>}
                  </div>
                </div>
              );
            })
            )}
          </div>
        </div>
      )}

      {/* Deploy Session Modal */}
      {deployModalBank && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-800 text-lg">Deploy Sesi Ujian Baru</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Luncurkan sesi ujian berbasis token untuk bank: {deployModalBank.title}
                </p>
              </div>
              <button
                onClick={() => setDeployModalBank(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">
                  Token / Kode Akses Ujian (Untuk Siswa Login)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={deployToken}
                    onChange={(e) => setDeployToken(e.target.value.toUpperCase())}
                    className="flex-1 px-3.5 py-2.5 font-mono text-base font-bold bg-slate-50 border border-slate-300 rounded-xl tracking-wider text-indigo-700"
                  />
                  <button
                    type="button"
                    onClick={() => setDeployToken('CBT-' + Math.floor(1000 + Math.random() * 9000))}
                    className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl font-semibold text-slate-700"
                  >
                    Acak Token
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">
                  Durasi Pengerjaan (Menit)
                </label>
                <input
                  type="number"
                  value={deployDuration}
                  onChange={(e) => setDeployDuration(Number(e.target.value))}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-semibold text-slate-700 uppercase">
                    Target Kelas Peserta
                  </label>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setDeployTargetClasses(classes.map((c) => c.id))}
                      className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold px-2 py-0.5 rounded-md bg-indigo-50 hover:bg-indigo-100"
                    >
                      Pilih Semua
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeployTargetClasses([])}
                      className="text-[11px] text-slate-600 hover:text-slate-800 font-semibold px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200"
                    >
                      Semua Siswa (Terbuka)
                    </button>
                  </div>
                </div>

                {classes.length === 0 ? (
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-800 text-xs">
                    <p className="font-semibold">Akses Terbuka untuk Semua Siswa</p>
                    <p className="text-[11px] text-emerald-600 mt-0.5">
                      Belum ada kelas spesifik di Master Data. Sesi ujian akan otomatis terbuka bagi semua siswa yang memasukkan token.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                      {classes.map((cls) => {
                        const isChecked = deployTargetClasses.includes(cls.id);
                        return (
                          <button
                            key={cls.id}
                            type="button"
                            onClick={() => {
                              if (isChecked) {
                                setDeployTargetClasses(deployTargetClasses.filter((x) => x !== cls.id));
                              } else {
                                setDeployTargetClasses([...deployTargetClasses, cls.id]);
                              }
                            }}
                            className={`px-3 py-2 rounded-lg border text-left flex items-center justify-between font-semibold transition-all cursor-pointer ${
                              isChecked
                                ? 'bg-indigo-50 border-indigo-400 text-indigo-900 shadow-xs'
                                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                            }`}
                          >
                            <span className="truncate">{cls.name}</span>
                            {isChecked ? (
                              <CheckCircle className="w-3.5 h-3.5 text-indigo-600 shrink-0 ml-1" />
                            ) : (
                              <span className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0 ml-1" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      {deployTargetClasses.length === 0
                        ? 'ℹ Tidak ada kelas yang dibatasi (Sesi terbuka untuk seluruh siswa yang memiliki token).'
                        : `✓ ${deployTargetClasses.length} dari ${classes.length} kelas dipilih.`}
                    </p>
                  </>
                )}
              </div>

              {/* Warning if bank has no questions yet */}
              {deployModalBank.questions.length === 0 && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-xs flex items-start gap-2">
                  <span className="text-amber-600 text-sm">⚠</span>
                  <div>
                    <span className="font-semibold">Bank soal belum memiliki butir soal:</span>
                    <p className="text-[11px] text-amber-700 mt-0.5">
                      Anda tetap dapat meluncurkan sesi ujian ini. Pastikan Anda menambahkan butir soal sebelum siswa mulai mengerjakan.
                    </p>
                  </div>
                </div>
              )}

              {/* Security & Display Settings */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-slate-800">Mode Anti-Curang (Proctoring)</span>
                    <p className="text-[11px] text-slate-600">Catat peringatan saat siswa pindah tab / keluar layar</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={deployAntiCheat}
                    onChange={(e) => setDeployAntiCheat(e.target.checked)}
                    className="w-4 h-4 accent-indigo-600"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-slate-800">Acak Urutan Soal</span>
                    <p className="text-[11px] text-slate-600">Setiap siswa mendapatkan urutan nomor soal berbeda</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={deployShuffleQuestions}
                    onChange={(e) => setDeployShuffleQuestions(e.target.checked)}
                    className="w-4 h-4 accent-indigo-600"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-slate-800">Tampilkan Nilai Instan</span>
                    <p className="text-[11px] text-slate-600">Siswa langsung melihat nilai dan ketuntasan setelah kumpul</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={deployShowResult}
                    onChange={(e) => setDeployShowResult(e.target.checked)}
                    className="w-4 h-4 accent-indigo-600"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <div className="text-[11px] text-slate-500 font-medium">
                Status: <span className="text-emerald-600 font-bold">Siap Diluncurkan</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDeployModalBank(null)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeploy}
                  disabled={isDeploying}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>
                    {isDeploying
                      ? 'Meluncurkan Sesi...'
                      : `Luncurkan Ujian (${deployToken.trim() || 'Otomatis'})`}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Prompt Generator Modal */}
      <AIPromptGeneratorModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        onImportQuestions={handleImportAIQuestions}
        defaultSubject={
          selectedBank ? subjects.find((s) => s.id === selectedBank.subjectId)?.name : 'Bahasa Indonesia'
        }
        defaultGrade={selectedBank?.gradeLevel || '12'}
      />

      {/* Print Exam & Specification Matrix (Kisi-Kisi) Modal */}
      {printModalBank && (
        <ExamPrintBlueprintModal
          isOpen={isPrintModalOpen}
          onClose={() => {
            setIsPrintModalOpen(false);
            setPrintModalBank(null);
          }}
          bank={printModalBank}
          schoolProfile={schoolProfile}
          teachers={teachers}
          onRefreshData={onRefreshData}
        />
      )}

      {/* Modal: Edit Arsip Bank Soal Metadata */}
      {editingBankMeta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">Edit Arsip Bank Soal</h3>
                  <p className="text-xs text-slate-500">ID: {editingBankMeta.id} • {editingBankMeta.questions?.length || 0} butir soal</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingBankMeta(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBankMetaForm} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Judul Bank Soal *</label>
                <input
                  type="text"
                  required
                  value={editBankTitle}
                  onChange={(e) => setEditBankTitle(e.target.value)}
                  placeholder="Contoh: Penilaian Sumatif Akhir Semester - Bahasa Indonesia"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mata Pelajaran *</label>
                  <select
                    value={editBankSubjectId}
                    onChange={(e) => setEditBankSubjectId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 text-xs bg-white"
                  >
                    {subjects.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name} ({sub.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tingkat Kelas *</label>
                  <select
                    value={editBankGrade}
                    onChange={(e) => setEditBankGrade(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 text-xs bg-white"
                  >
                    <option value="7">Kelas 7 (SMP / MTs)</option>
                    <option value="8">Kelas 8 (SMP / MTs)</option>
                    <option value="9">Kelas 9 (SMP / MTs)</option>
                    <option value="10">Kelas 10 (SMA / SMK)</option>
                    <option value="11">Kelas 11 (SMA / SMK)</option>
                    <option value="12">Kelas 12 (SMA / SMK)</option>
                    <option value="Semua">Semua Tingkat</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">KKM / Nilai Ketuntasan Minimal</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={editBankPassingScore}
                    onChange={(e) => setEditBankPassingScore(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Durasi Default Pengerjaan (Menit)</label>
                  <input
                    type="number"
                    min="5"
                    max="300"
                    value={editBankDuration}
                    onChange={(e) => setEditBankDuration(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kurikulum</label>
                  <input
                    type="text"
                    value={editBankCurriculum}
                    onChange={(e) => setEditBankCurriculum(e.target.value)}
                    placeholder="Kurikulum Merdeka"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tahun Ajaran</label>
                  <input
                    type="text"
                    value={editBankAcademicYear}
                    onChange={(e) => setEditBankAcademicYear(e.target.value)}
                    placeholder="2026/2027"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Semester</label>
                  <select
                    value={editBankSemester}
                    onChange={(e) => setEditBankSemester(e.target.value as 'Ganjil' | 'Genap')}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 text-xs bg-white"
                  >
                    <option value="Ganjil">Ganjil</option>
                    <option value="Genap">Genap</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingBankMeta(null)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
                >
                  Simpan Perubahan Arsip
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Sesi Ujian Aktif & Token */}
      {editingSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center">
                  <Play className="w-5 h-5 fill-current" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">Edit Pengaturan Sesi Ujian</h3>
                  <p className="text-xs text-slate-500">ID: {editingSession.id} • Token: {editingSession.sessionCode}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingSession(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditSessionForm} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Token Sesi Ujian *</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={editSessionToken}
                      onChange={(e) => setEditSessionToken(e.target.value.toUpperCase())}
                      placeholder="CBT-2026"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-mono font-bold text-indigo-700 uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setEditSessionToken('CBT-' + Math.floor(1000 + Math.random() * 9000))}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer shrink-0"
                      title="Acak token baru"
                    >
                      Acak
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status Sesi *</label>
                  <select
                    value={editSessionStatus}
                    onChange={(e) => setEditSessionStatus(e.target.value as 'active' | 'ended' | 'scheduled')}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 text-xs bg-white font-semibold"
                  >
                    <option value="active">Aktif (Siswa Dapat Mengerjakan)</option>
                    <option value="scheduled">Terjadwal (Belum Dibuka)</option>
                    <option value="ended">Berakhir (Selesai / Ditutup)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Judul Sesi Ujian *</label>
                <input
                  type="text"
                  required
                  value={editSessionTitle}
                  onChange={(e) => setEditSessionTitle(e.target.value)}
                  placeholder="Contoh: Penilaian Sumatif Akhir Semester"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Bank Soal Terhubung *</label>
                  <select
                    value={editSessionBankId}
                    onChange={(e) => setEditSessionBankId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 text-xs bg-white"
                  >
                    {questionBanks.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.title} ({b.questions?.length || 0} Soal)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Durasi Pengerjaan (Menit) *</label>
                  <input
                    type="number"
                    min="5"
                    max="300"
                    required
                    value={editSessionDuration}
                    onChange={(e) => setEditSessionDuration(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Kelas Peserta Ujian</label>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                  {classes.length === 0 ? (
                    <span className="text-slate-400 italic">Semua kelas dapat mengikuti (bebas kelas)</span>
                  ) : (
                    classes.map((cls) => {
                      const isChecked = editSessionTargetClasses.includes(cls.id);
                      return (
                        <label
                          key={cls.id}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs cursor-pointer select-none transition-all ${
                            isChecked
                              ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-bold'
                              : 'bg-white border-slate-200 text-slate-600'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setEditSessionTargetClasses([...editSessionTargetClasses, cls.id]);
                              } else {
                                setEditSessionTargetClasses(editSessionTargetClasses.filter((id) => id !== cls.id));
                              }
                            }}
                            className="w-3.5 h-3.5 accent-indigo-600 rounded"
                          />
                          <span>{cls.name}</span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Security & Display Settings */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="font-bold text-slate-800 text-xs border-b border-slate-200 pb-1.5">
                  Pengaturan Keamanan & Tampilan Soal
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-slate-800">Mode Anti-Curang (Proctoring)</span>
                    <p className="text-[11px] text-slate-500">Peringatkan dan batasi perpindahan tab / keluar jendela</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={editSessionAntiCheat}
                    onChange={(e) => setEditSessionAntiCheat(e.target.checked)}
                    className="w-4 h-4 accent-indigo-600 cursor-pointer"
                  />
                </div>

                {editSessionAntiCheat && (
                  <div className="flex items-center justify-between pl-4 border-l-2 border-indigo-200">
                    <span className="text-xs text-slate-600">Maksimal Peringatan Pindah Tab:</span>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={editSessionMaxTabSwitches}
                      onChange={(e) => setEditSessionMaxTabSwitches(Number(e.target.value))}
                      className="w-16 px-2 py-1 rounded-lg border border-slate-300 text-center text-xs"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-slate-800">Acak Urutan Soal</span>
                    <p className="text-[11px] text-slate-500">Nomor soal diacak berbeda untuk setiap siswa</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={editSessionShuffleQuestions}
                    onChange={(e) => setEditSessionShuffleQuestions(e.target.checked)}
                    className="w-4 h-4 accent-indigo-600 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-slate-800">Acak Pilihan Ganda</span>
                    <p className="text-[11px] text-slate-500">Opsi jawaban A, B, C, D diacak bagi setiap siswa</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={editSessionShuffleOptions}
                    onChange={(e) => setEditSessionShuffleOptions(e.target.checked)}
                    className="w-4 h-4 accent-indigo-600 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-slate-800">Tampilkan Nilai Instan</span>
                    <p className="text-[11px] text-slate-500">Siswa langsung melihat nilai dan ketuntasan setelah kirim</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={editSessionShowResult}
                    onChange={(e) => setEditSessionShowResult(e.target.checked)}
                    className="w-4 h-4 accent-indigo-600 cursor-pointer"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingSession(null)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
                >
                  Simpan Pengaturan Sesi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Konfirmasi Hapus Data (Bank Soal / Sesi) */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-bold text-slate-800 text-base">Konfirmasi Hapus Data</h3>
              <p className="text-xs text-slate-600 mt-2">
                {deleteConfirm.type === 'bank' && (
                  <>
                    Apakah Anda yakin ingin menghapus arsip bank soal <strong className="text-slate-900">"{deleteConfirm.title}"</strong>?
                    {deleteConfirm.count !== undefined && (
                      <span className="block mt-1 text-red-600 font-semibold">
                        Semua {deleteConfirm.count} butir soal di dalamnya akan dihapus.
                      </span>
                    )}
                  </>
                )}
                {deleteConfirm.type === 'bulk-banks' && (
                  <>
                    Apakah Anda yakin ingin menghapus <strong className="text-slate-900">{deleteConfirm.count} arsip bank soal</strong> yang dipilih secara permanen?
                  </>
                )}
                {deleteConfirm.type === 'session' && (
                  <>
                    Apakah Anda yakin ingin menghapus sesi ujian <strong className="text-slate-900">"{deleteConfirm.title}"</strong>? Siswa tidak akan dapat mengakses token ini lagi.
                  </>
                )}
                {deleteConfirm.type === 'bulk-sessions' && (
                  <>
                    Apakah Anda yakin ingin menghapus <strong className="text-slate-900">{deleteConfirm.count} sesi ujian terpilih</strong> secara permanen?
                  </>
                )}
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                disabled={isDeletingLoading}
                className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmExecuteDelete}
                disabled={isDeletingLoading}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isDeletingLoading ? 'Menghapus...' : 'Ya, Hapus Sekarang'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
