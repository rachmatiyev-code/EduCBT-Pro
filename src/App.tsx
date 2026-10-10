import React, { useState, useEffect } from 'react';
import {
  FolderArchive,
  BarChart3,
  Activity,
  GraduationCap,
  School,
  Cloud,
  Sparkles,
  LogOut,
  User,
  Shield,
  Layers,
  ChevronRight,
  Menu,
  X,
  RefreshCw,
  CheckCircle2,
  ExternalLink,
  KeyRound,
} from 'lucide-react';
import {
  SchoolProfile,
  Teacher,
  Student,
  ClassGroup,
  Subject,
  QuestionBank,
  ExamSession,
} from './types/cbt';
import { api } from './services/api';
import { QuestionBankManager } from './components/QuestionBankManager';
import { LiveProctoringMonitor } from './components/LiveProctoringMonitor';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { MasterDataManager } from './components/MasterDataManager';
import { SchoolTeacherProfile } from './components/SchoolTeacherProfile';
import { GoogleDriveSyncModal } from './components/GoogleDriveSyncModal';
import { AIPromptGeneratorModal } from './components/AIPromptGeneratorModal';
import { GeminiApiKeyModal } from './components/GeminiApiKeyModal';
import { StudentExamRoom } from './components/StudentExamRoom';
import { LoginModal } from './components/LoginModal';
import { ChangePasswordModal } from './components/ChangePasswordModal';

export default function App() {
  // App-wide state
  const [schoolProfile, setSchoolProfile] = useState<SchoolProfile>({
    regionalGovernment: 'PEMERINTAH DAERAH PROVINSI DKI JAKARTA',
    educationDepartment: 'DINAS PENDIDIKAN DAN KEBUDAYAAN',
    name: 'SMA Negeri 1 Prestasi Bangsa',
    npsn: '20108922',
    address: 'Jl. Pendidikan Merdeka No. 45, Jakarta Pusat',
    phone: '(021) 7890-1234',
    email: 'info@sman1prestasibangsa.sch.id',
    principalName: 'Drs. H. Bambang Sugiarto, M.Pd.',
    principalNip: '19680512 199403 1 004',
    academicYear: '2026/2027',
    semester: 'Ganjil',
  });

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [questionBanks, setQuestionBanks] = useState<QuestionBank[]>([]);
  const [examSessions, setExamSessions] = useState<ExamSession[]>([]);
  const [gasWebhookUrl, setGasWebhookUrl] = useState<string>('');

  // Authentication State
  const [currentUser, setCurrentUser] = useState<
    | { role: 'teacher'; teacher: Teacher }
    | { role: 'student'; student: Student; session: ExamSession; bank: QuestionBank }
    | null
  >(null);

  // Teacher navigation tab
  const [activeMenu, setActiveMenu] = useState<
    'banks' | 'monitoring' | 'analytics' | 'master' | 'profile'
  >('banks');
  const [monitoredSessionCode, setMonitoredSessionCode] = useState<string>('');

  // Modals
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isGeminiModalOpen, setIsGeminiModalOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Load all initial data from backend
  const loadInitialData = async () => {
    setIsLoadingData(true);
    try {
      const data = await api.fetchAllData();
      if (data) {
        if (data.schoolProfile) setSchoolProfile(data.schoolProfile);
        if (data.teachers) setTeachers(data.teachers);
        if (data.students) setStudents(data.students);
        if (data.classes) setClasses(data.classes);
        if (data.subjects) setSubjects(data.subjects);
        if (data.questionBanks) setQuestionBanks(data.questionBanks);
        if (data.examSessions) setExamSessions(data.examSessions);
        if (data.gasWebhookUrl) setGasWebhookUrl(data.gasWebhookUrl);
      }
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const handleLoginStudent = (student: Student, session: ExamSession) => {
    const bank = questionBanks.find((b) => b.id === session.bankId);
    if (!bank) {
      alert('Bank soal untuk sesi ujian ini tidak ditemukan.');
      return;
    }
    setCurrentUser({
      role: 'student',
      student,
      session,
      bank,
    });
  };

  const handleLoginTeacher = (teacher: Teacher) => {
    setCurrentUser({
      role: 'teacher',
      teacher,
    });
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  // 1. If not logged in, show Multi-Level Login Modal
  if (!currentUser) {
    return (
      <LoginModal
        teachers={teachers}
        students={students}
        sessions={examSessions}
        onLoginTeacher={handleLoginTeacher}
        onLoginStudent={handleLoginStudent}
        onAddTeacher={(newTeacher) => {
          setTeachers((prev) => {
            const exists = prev.some((t) => t.id === newTeacher.id);
            if (exists) return prev.map((t) => (t.id === newTeacher.id ? newTeacher : t));
            return [...prev, newTeacher];
          });
          loadInitialData();
        }}
        onTeacherPasswordChanged={(updatedTeacher) => {
          setTeachers((prev) =>
            prev.map((t) => (t.id === updatedTeacher.id ? updatedTeacher : t))
          );
          loadInitialData();
        }}
      />
    );
  }

  // 2. If logged in as Student, show Pure Student Examination Room (Strictly separated mode)
  if (currentUser.role === 'student') {
    return (
      <StudentExamRoom
        student={currentUser.student}
        session={currentUser.session}
        bank={currentUser.bank}
        schoolProfile={schoolProfile}
        onExit={handleLogout}
      />
    );
  }

  // 3. Logged in as Teacher or Admin: Show Comprehensive Teacher & Administration Portal
  const activeSessionForMonitor =
    examSessions.find((s) => s.sessionCode === monitoredSessionCode) || examSessions[0];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col text-slate-800">
      {/* Top Main Navigation Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-indigo-700 to-blue-600 text-white flex items-center justify-center font-bold shadow-xs">
              <School className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 text-base tracking-tight">
                  EduCBT Pro
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {currentUser.teacher.role}
                </span>
              </div>
              <p className="text-xs text-slate-500 line-clamp-1">{schoolProfile.name}</p>
            </div>
          </div>

          {/* Quick Action Badges / Cloud Status */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsDriveModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              title="Konfigurasi integrasi Google Drive & Spreadsheet"
            >
              <Cloud className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">
                {gasWebhookUrl ? 'GDrive & Sheets Terhubung' : 'Setup GDrive & GAS'}
              </span>
            </button>

            <button
              onClick={() => setIsAIModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-linear-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
              <span className="hidden sm:inline">AI Question Generator</span>
            </button>

            {/* Menu Input Gemini API Key */}
            <button
              onClick={() => setIsGeminiModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50/80 hover:bg-indigo-100 text-indigo-900 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
              title="Menu Input & Pengaturan Google Gemini API Key"
            >
              <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden md:inline">Gemini API Key</span>
            </button>

            <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block" />

            {/* Change Password Button */}
            <button
              onClick={() => setIsChangePasswordOpen(true)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-indigo-50 hover:border-indigo-300 text-slate-700 hover:text-indigo-700 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
              title="Ubah Kata Sandi Akun Guru / Admin"
            >
              <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden lg:inline">Ubah Kata Sandi</span>
            </button>

            {/* User Profile & Logout */}
            <div className="flex items-center gap-2">
              <div className="hidden md:block text-right">
                <span className="text-xs font-bold text-slate-800 block">
                  {currentUser.teacher.name}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {currentUser.teacher.nip || currentUser.teacher.email}
                </span>
              </div>

              <button
                onClick={handleLogout}
                className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                title="Keluar / Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Secondary Subnavigation Bar */}
        <div className="border-t border-slate-100 bg-slate-50/70">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-1 overflow-x-auto py-1.5">
            {[
              {
                id: 'banks' as const,
                label: 'Bank Soal & Sesi Ujian',
                icon: FolderArchive,
                badge: questionBanks.length,
              },
              {
                id: 'monitoring' as const,
                label: 'Live Proctoring Gadget',
                icon: Activity,
                badge: examSessions.filter((s) => s.status === 'active').length,
              },
              {
                id: 'analytics' as const,
                label: 'Statistik & Analisis Butir',
                icon: BarChart3,
              },
              {
                id: 'master' as const,
                label: 'Data Siswa, Kelas & Mapel',
                icon: GraduationCap,
              },
              {
                id: 'profile' as const,
                label: 'Identitas Sekolah & Guru',
                icon: School,
              },
            ].map((menuItem) => {
              const Icon = menuItem.icon;
              const isActive = activeMenu === menuItem.id;
              return (
                <button
                  key={menuItem.id}
                  onClick={() => setActiveMenu(menuItem.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-500'}`} />
                  <span>{menuItem.label}</span>
                  {menuItem.badge !== undefined && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                        isActive ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {menuItem.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Workspace Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {activeMenu === 'banks' && (
          <QuestionBankManager
            questionBanks={questionBanks}
            examSessions={examSessions}
            subjects={subjects}
            classes={classes}
            onRefreshData={loadInitialData}
            onOpenSessionMonitoring={(sessionCode) => {
              setMonitoredSessionCode(sessionCode);
              setActiveMenu('monitoring');
            }}
          />
        )}

        {activeMenu === 'monitoring' && (
          <LiveProctoringMonitor
            session={
              activeSessionForMonitor || {
                id: 'SES-001',
                bankId: 'BANK-001',
                sessionCode: 'CBT-2026',
                title: 'Sesi Ujian Aktif',
                targetClassIds: [],
                startTime: '',
                endTime: '',
                durationMinutes: 60,
                shuffleQuestions: false,
                shuffleOptions: false,
                showResultInstant: true,
                antiCheatEnabled: true,
                maxTabSwitches: 3,
                status: 'active',
              }
            }
            onBack={() => setActiveMenu('banks')}
          />
        )}

        {activeMenu === 'analytics' && (
          <AnalyticsDashboard sessions={examSessions} questionBanks={questionBanks} />
        )}

        {activeMenu === 'master' && (
          <MasterDataManager
            students={students}
            classes={classes}
            subjects={subjects}
            teachers={teachers}
            onRefreshData={loadInitialData}
          />
        )}

        {activeMenu === 'profile' && (
          <SchoolTeacherProfile
            schoolProfile={schoolProfile}
            teachers={teachers}
            subjects={subjects}
            onRefreshData={loadInitialData}
            onOpenGeminiModal={() => setIsGeminiModalOpen(true)}
          />
        )}
      </main>

      {/* Global Modals */}
      <GoogleDriveSyncModal
        isOpen={isDriveModalOpen}
        onClose={() => setIsDriveModalOpen(false)}
      />

      <AIPromptGeneratorModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        onOpenGeminiModal={() => setIsGeminiModalOpen(true)}
        onImportQuestions={async (questions, titleInfo) => {
          const newBank: QuestionBank = {
            id: `BANK-${Date.now()}`,
            title: `Bank Soal AI - ${titleInfo.subject} (${titleInfo.topic})`,
            subjectId:
              subjects.find((s) => s.name.toLowerCase().includes(titleInfo.subject.toLowerCase()))?.id ||
              'SUB-01',
            gradeLevel: '12',
            teacherId: currentUser.teacher.id,
            totalQuestions: questions.length,
            durationMinutes: Math.min(questions.length * 3, 90),
            passingScore: 75,
            questions,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          await api.saveQuestionBank(newBank);
          loadInitialData();
          setActiveMenu('banks');
        }}
      />

      {/* Change Password Modal */}
      {currentUser.role === 'teacher' && (
        <ChangePasswordModal
          isOpen={isChangePasswordOpen}
          onClose={() => setIsChangePasswordOpen(false)}
          currentTeacher={currentUser.teacher}
          onPasswordChanged={(updatedTeacher) => {
            setCurrentUser({
              ...currentUser,
              teacher: updatedTeacher,
            });
            setTeachers((prev) =>
              prev.map((t) => (t.id === updatedTeacher.id ? updatedTeacher : t))
            );
            loadInitialData();
          }}
        />
      )}

      {/* Gemini API Key Configuration Modal */}
      <GeminiApiKeyModal
        isOpen={isGeminiModalOpen}
        onClose={() => setIsGeminiModalOpen(false)}
      />
    </div>
  );
}
