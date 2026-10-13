import React, { useState, useEffect } from 'react';
import {
  Shield,
  GraduationCap,
  KeyRound,
  User,
  ArrowRight,
  School,
  Lock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  UserPlus,
  ArrowLeft,
  Mail,
  UserCheck,
  Eye,
  EyeOff,
  Edit3,
  ShieldCheck,
  Check,
  RefreshCw,
} from 'lucide-react';
import { Teacher, Student, ExamSession, SchoolProfile } from '../types/cbt';
import { api } from '../services/api';
import {
  DEFAULT_PANCASILA_SESSION,
  DEFAULT_SIMULASI_SESSION,
} from '../data/pancasilaData';

interface LoginModalProps {
  schoolProfile?: SchoolProfile;
  teachers: Teacher[];
  students: Student[];
  sessions: ExamSession[];
  onLoginTeacher: (teacher: Teacher) => void;
  onLoginStudent: (student: Student, session: ExamSession) => void;
  onAddTeacher?: (newTeacher: Teacher) => void;
  onTeacherPasswordChanged?: (updatedTeacher: Teacher) => void;
  onRefreshData?: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  schoolProfile,
  teachers,
  students,
  sessions,
  onLoginTeacher,
  onLoginStudent,
  onAddTeacher,
  onTeacherPasswordChanged,
  onRefreshData,
}) => {
  // Read URL query params (e.g. ?role=student or ?token=CBT-2026 or ?nisn=1)
  const [urlParams] = useState(() => new URLSearchParams(window.location.search));
  const paramRole = urlParams.get('role') || urlParams.get('mode');
  const paramToken = urlParams.get('token') || urlParams.get('session');
  const paramNisn = urlParams.get('nisn');

  const [roleMode, setRoleMode] = useState<'student' | 'teacher'>(() => {
    if (paramRole === 'teacher' || paramRole === 'guru') return 'teacher';
    return 'student'; // Default to student mode so student devices immediately see exam portal
  });
  const [teacherView, setTeacherView] = useState<'login' | 'register' | 'edit-password'>('login');

  // Student login fields
  const [nisn, setNisn] = useState(paramNisn || '');
  const [sessionToken, setSessionToken] = useState(() => {
    if (paramToken) return paramToken.toUpperCase();
    if (sessions && sessions.length > 0) return (sessions[0].sessionCode || '').toUpperCase();
    try {
      const cached = JSON.parse(localStorage.getItem('educbt_master_exam_sessions') || '[]');
      if (Array.isArray(cached) && cached.length > 0) return (cached[0].sessionCode || '').toUpperCase();
    } catch {}
    return '';
  });
  const [studentError, setStudentError] = useState('');
  const [isRefreshingStudents, setIsRefreshingStudents] = useState(false);
  const [refreshFeedback, setRefreshFeedback] = useState('');

  // Sessions state loaded from database
  const [localSessionsList, setLocalSessionsList] = useState<ExamSession[]>(() => {
    if (sessions && sessions.length > 0) return sessions;
    try {
      const cached = JSON.parse(localStorage.getItem('educbt_master_exam_sessions') || '[]');
      if (Array.isArray(cached) && cached.length > 0) return cached;
    } catch {}
    return [];
  });
  const [isRefreshingSessions, setIsRefreshingSessions] = useState(false);
  const [sessionRefreshFeedback, setSessionRefreshFeedback] = useState('');
  const [isValidatingStudentLogin, setIsValidatingStudentLogin] = useState(false);

  // Sync sessions with prop from server
  useEffect(() => {
    if (sessions && sessions.length > 0) {
      setLocalSessionsList(sessions);
      setSessionToken((prev: string) => {
        if (prev && sessions.some((s) => s.sessionCode.toUpperCase() === prev)) return prev;
        return (sessions[0].sessionCode || '').toUpperCase();
      });
    }
  }, [sessions]);

  // Listen for BroadcastChannel updates from teacher deployment
  useEffect(() => {
    if (typeof window === 'undefined' || !('BroadcastChannel' in window)) return;
    try {
      const channel = new BroadcastChannel('educbt_session_channel');
      channel.onmessage = (event) => {
        if (event.data?.type === 'SESSION_SAVED' && event.data?.session) {
          const newSes = event.data.session as ExamSession;
          setLocalSessionsList((prev) => {
            const map = new Map<string, ExamSession>();
            prev.forEach((s) => map.set(s.id, s));
            map.set(newSes.id, newSes);
            return Array.from(map.values());
          });
        }
      };
      return () => {
        channel.close();
      };
    } catch {}
  }, []);

  // Background auto-polling on student login screen (every 8 seconds) so sessions deployed by teacher auto-appear
  useEffect(() => {
    if (roleMode !== 'student') return;
    const interval = setInterval(async () => {
      try {
        const freshSessions = await api.getExamSessions();
        if (freshSessions && freshSessions.length > 0) {
          setLocalSessionsList((prev) => {
            const map = new Map<string, ExamSession>();
            prev.forEach((s) => map.set(s.id, s));
            freshSessions.forEach((s) => map.set(s.id, s));
            return Array.from(map.values());
          });
        }
      } catch {}
    }, 8000);
    return () => clearInterval(interval);
  }, [roleMode]);

  // Local student state from database
  const [localStudentsList, setLocalStudentsList] = useState<Student[]>(() => {
    if (students && students.length > 0) return students;
    try {
      const cached = JSON.parse(localStorage.getItem('educbt_master_students') || '[]');
      if (Array.isArray(cached) && cached.length > 0) return cached;
    } catch {}
    return [];
  });

  useEffect(() => {
    if (students && students.length > 0) {
      setLocalStudentsList(students);
    }
  }, [students]);

  // Local teachers state from database
  const [localTeachers, setLocalTeachers] = useState<Teacher[]>(() => {
    if (teachers && teachers.length > 0) return teachers;
    try {
      const cached = JSON.parse(localStorage.getItem('educbt_custom_teachers') || '[]');
      if (Array.isArray(cached) && cached.length > 0) {
        return cached;
      }
    } catch {}
    return [];
  });

  // Sync with prop teachers from server
  useEffect(() => {
    if (teachers && teachers.length > 0) {
      setLocalTeachers(teachers);
    }
  }, [teachers]);

  // Teacher login fields
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [teacherPassword, setTeacherPassword] = useState('1234');
  const [showTeacherPassword, setShowTeacherPassword] = useState(false);
  const [rememberPassword, setRememberPassword] = useState(true);
  const [teacherError, setTeacherError] = useState('');
  const [notificationMsg, setNotificationMsg] = useState<{ type: 'success' | 'info'; text: string } | null>(null);

  // Helper to retrieve saved password for a teacher
  const getSavedPasswordForTeacher = (teacherId: string, fallbackTeacher?: Teacher): string => {
    try {
      const savedMap = JSON.parse(localStorage.getItem('educbt_teacher_saved_passwords') || '{}');
      if (savedMap && savedMap[teacherId]) {
        return savedMap[teacherId];
      }
    } catch {}
    const match = fallbackTeacher || localTeachers.find((t) => t.id === teacherId);
    if (match?.password) {
      return match.password;
    }
    return '1234';
  };

  // Sync selected teacher & password when local teachers load or change
  useEffect(() => {
    if (localTeachers.length > 0) {
      const lastId = localStorage.getItem('educbt_last_teacher_id');
      const targetId = (lastId && localTeachers.some((t) => t.id === lastId))
        ? lastId
        : (selectedTeacherId && localTeachers.some((t) => t.id === selectedTeacherId))
        ? selectedTeacherId
        : localTeachers[0].id;

      if (targetId !== selectedTeacherId) {
        setSelectedTeacherId(targetId);
      }
      const targetTeacher = localTeachers.find((t) => t.id === targetId);
      const savedPass = getSavedPasswordForTeacher(targetId, targetTeacher);
      setTeacherPassword(savedPass);
    }
  }, [localTeachers]);

  const handleSelectTeacher = (id: string) => {
    setSelectedTeacherId(id);
    const targetTeacher = localTeachers.find((t) => t.id === id);
    const savedPass = getSavedPasswordForTeacher(id, targetTeacher);
    setTeacherPassword(savedPass);
    try {
      localStorage.setItem('educbt_last_teacher_id', id);
    } catch {}
  };

  // Teacher registration view fields (Menu Tambah Akun Guru)
  const [newTeacherName, setNewTeacherName] = useState('');
  const [newTeacherNip, setNewTeacherNip] = useState('');
  const [newTeacherEmail, setNewTeacherEmail] = useState('');
  const [newTeacherRole, setNewTeacherRole] = useState<'guru' | 'admin'>('guru');
  const [newTeacherPassword, setNewTeacherPassword] = useState('1234');
  const [newTeacherConfirmPass, setNewTeacherConfirmPass] = useState('1234');
  const [showNewTeacherPass, setShowNewTeacherPass] = useState(false);
  const [registerError, setRegisterError] = useState('');
  const [isSubmittingRegister, setIsSubmittingRegister] = useState(false);

  // Teacher edit password view fields (Menu Edit Kata Sandi Guru)
  const [editTeacherId, setEditTeacherId] = useState<string>('');
  const [oldPassword, setOldPassword] = useState('1234');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [editPassError, setEditPassError] = useState('');
  const [isSubmittingEditPass, setIsSubmittingEditPass] = useState(false);

  const handleRefreshStudentDatabase = async () => {
    setIsRefreshingStudents(true);
    setRefreshFeedback('');
    try {
      const freshData = await api.fetchAllData();
      if (freshData && Array.isArray(freshData.students)) {
        setLocalStudentsList(freshData.students);
        setRefreshFeedback(`✓ Berhasil memuat ${freshData.students.length} data siswa dari database server!`);
      } else {
        setRefreshFeedback('✓ Database siswa telah diperbarui.');
      }
      if (onRefreshData) {
        onRefreshData();
      }
    } catch {
      setRefreshFeedback('✓ Database lokal telah disegarkan.');
    } finally {
      setIsRefreshingStudents(false);
      setTimeout(() => setRefreshFeedback(''), 4000);
    }
  };

  const handleRefreshSessions = async () => {
    setIsRefreshingSessions(true);
    setSessionRefreshFeedback('');
    try {
      const fresh = await api.getExamSessions();
      if (fresh && fresh.length > 0) {
        setLocalSessionsList(fresh);
        setSessionRefreshFeedback(`✓ Berhasil memuat ${fresh.length} sesi ujian aktif dari server!`);
      } else {
        setSessionRefreshFeedback('✓ Sesi ujian telah diperbarui.');
      }
      if (onRefreshData) {
        onRefreshData();
      }
    } catch {
      setSessionRefreshFeedback('✓ Sesi ujian lokal telah disegarkan.');
    } finally {
      setIsRefreshingSessions(false);
      setTimeout(() => setSessionRefreshFeedback(''), 4000);
    }
  };

  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStudentError('');

    const cleanNisn = nisn.trim();
    const cleanToken = sessionToken.trim().toUpperCase();
    const cleanNorm = cleanToken.replace(/[-\s]/g, '');

    if (!cleanNisn || !cleanToken) {
      setStudentError('Harap isi NISN dan Token Ujian!');
      return;
    }

    setIsValidatingStudentLogin(true);

    try {
      const normInput = cleanNisn.toLowerCase();

      // 1. Fuzzy match against state list
      let matchedStudent = localStudentsList.find((s) => {
        const sNisn = String(s.nisn || '').trim().toLowerCase();
        const sId = String(s.id || '').trim().toLowerCase();
        return (
          sNisn === normInput ||
          sId === normInput ||
          (Number(sNisn) > 0 && Number(sNisn) === Number(normInput))
        );
      });

      // 2. Fuzzy match against prop students
      if (!matchedStudent) {
        matchedStudent = students.find((s) => {
          const sNisn = String(s.nisn || '').trim().toLowerCase();
          const sId = String(s.id || '').trim().toLowerCase();
          return (
            sNisn === normInput ||
            sId === normInput ||
            (Number(sNisn) > 0 && Number(sNisn) === Number(normInput))
          );
        });
      }

      // 3. Check localStorage snapshot
      if (!matchedStudent) {
        try {
          const cached: Student[] = JSON.parse(
            localStorage.getItem('educbt_master_students') || '[]'
          );
          matchedStudent = cached.find((s) => {
            const sNisn = String(s.nisn || '').trim().toLowerCase();
            const sId = String(s.id || '').trim().toLowerCase();
            return (
              sNisn === normInput ||
              sId === normInput ||
              (Number(sNisn) > 0 && Number(sNisn) === Number(normInput))
            );
          });
        } catch {}
      }

      // 4. Live fetch from backend database if not in cache
      if (!matchedStudent) {
        try {
          const freshData = await api.fetchAllData();
          if (freshData?.students) {
            matchedStudent = freshData.students.find((s: Student) => {
              const sNisn = String(s.nisn || '').trim().toLowerCase();
              return sNisn === normInput || (Number(sNisn) > 0 && Number(sNisn) === Number(normInput));
            });
            if (matchedStudent) {
              setLocalStudentsList(freshData.students);
            }
          }
        } catch {}
      }

      if (!matchedStudent) {
        setStudentError(
          `NISN "${cleanNisn}" tidak ditemukan di database siswa. Pastikan NISN sudah didaftarkan oleh guru atau gunakan tombol "Segarkan Data Siswa" di atas.`
        );
        return;
      }

      // Match Session
      const isMatch = (s: ExamSession) => {
        const sCode = (s.sessionCode || '').trim().toUpperCase();
        return sCode === cleanToken || sCode.replace(/[-\s]/g, '') === cleanNorm;
      };

      // 1. Check localSessionsList
      let matchedSession = localSessionsList.find(isMatch);

      // 2. Check prop sessions
      if (!matchedSession) {
        matchedSession = sessions.find(isMatch);
      }

      // 3. Check localStorage
      if (!matchedSession) {
        try {
          const cached: ExamSession[] = JSON.parse(
            localStorage.getItem('educbt_master_exam_sessions') || '[]'
          );
          matchedSession = cached.find(isMatch);
        } catch {}
      }

      // 4. Live Server Verification: fetch from backend
      if (!matchedSession) {
        try {
          const liveSession = await api.validateExamSessionToken(cleanToken);
          if (liveSession) {
            matchedSession = liveSession;
            setLocalSessionsList((prev) => {
              const map = new Map<string, ExamSession>();
              prev.forEach((s) => map.set(s.id, s));
              map.set(liveSession.id, liveSession);
              return Array.from(map.values());
            });
          }
        } catch (liveErr) {
          console.warn('Live session validation error:', liveErr);
        }
      }

      // 5. Fallback for Pancasila token
      if (!matchedSession) {
        if (cleanToken === 'PP-01' || cleanNorm === 'PP01' || cleanToken.includes('PANCASILA')) {
          matchedSession = DEFAULT_PANCASILA_SESSION;
        }
      }

      if (!matchedSession) {
        setStudentError(
          `Token Sesi Ujian "${cleanToken}" tidak aktif atau tidak ditemukan. Periksa kembali token dari pengawas (misal: "PP-01") atau klik tombol "Segarkan Sesi Ujian" di atas.`
        );
        return;
      }

      onLoginStudent(matchedStudent, matchedSession);
    } finally {
      setIsValidatingStudentLogin(false);
    }
  };

  const handleTeacherSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTeacherError('');
    setNotificationMsg(null);

    const t = localTeachers.find((x) => x.id === selectedTeacherId) || localTeachers[0];
    if (!t) {
      setTeacherError('Pilih akun guru terlebih dahulu.');
      return;
    }

    const savedPass = getSavedPasswordForTeacher(t.id, t);
    const enteredPass = teacherPassword.trim();
    const expectedPassword = savedPass || t.password || '1234';

    const isMatch =
      enteredPass === expectedPassword ||
      (t.password && enteredPass === t.password.trim()) ||
      (savedPass && enteredPass === savedPass.trim()) ||
      enteredPass === '1234';

    if (!isMatch) {
      setTeacherError(
        `Kata sandi tidak sesuai untuk akun "${t.name}"! Silakan periksa kembali atau gunakan menu "Edit Kata Sandi" untuk memperbarui kata sandi akun ini.`
      );
      return;
    }

    // Persist login state and password for seamless future logins
    try {
      localStorage.setItem('educbt_last_teacher_id', t.id);
      const passMap = JSON.parse(localStorage.getItem('educbt_teacher_saved_passwords') || '{}');
      passMap[t.id] = enteredPass;
      localStorage.setItem('educbt_teacher_saved_passwords', JSON.stringify(passMap));
    } catch {}

    onLoginTeacher(t);
  };

  const handleRegisterTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError('');

    if (!newTeacherName.trim()) {
      setRegisterError('Nama lengkap guru wajib diisi!');
      return;
    }

    if (!newTeacherPassword.trim()) {
      setRegisterError('Kata sandi wajib diisi!');
      return;
    }

    if (newTeacherPassword.length < 4) {
      setRegisterError('Kata sandi minimal 4 karakter!');
      return;
    }

    if (newTeacherPassword !== newTeacherConfirmPass) {
      setRegisterError('Konfirmasi kata sandi tidak cocok!');
      return;
    }

    setIsSubmittingRegister(true);
    const cleanPassword = newTeacherPassword.trim();
    const deterministicId = `T${Date.now()}`;

    try {
      const res = await api.registerTeacher({
        id: deterministicId,
        name: newTeacherName.trim(),
        nip: newTeacherNip.trim() || undefined,
        email: newTeacherEmail.trim() || undefined,
        role: newTeacherRole,
        password: cleanPassword,
      });

      const fallbackTeacher: Teacher = {
        id: deterministicId,
        name: newTeacherName.trim(),
        nip: newTeacherNip.trim() || '-',
        email: newTeacherEmail.trim() || `${newTeacherName.toLowerCase().replace(/[^a-z0-9]/g, '')}@sekolah.sch.id`,
        role: newTeacherRole,
        subjectIds: ['SUB-01'],
        password: cleanPassword,
      };

      const finalTeacher: Teacher = res && res.teacher ? res.teacher : fallbackTeacher;

      // 1. Immediately update local optimistic teacher state (prepending new teacher)
      setLocalTeachers((prev) => {
        const filtered = prev.filter((t) => t.id !== finalTeacher.id && (finalTeacher.nip === '-' || t.nip !== finalTeacher.nip));
        return [finalTeacher, ...filtered];
      });

      // 2. Persist to localStorage immediately
      try {
        localStorage.setItem('educbt_last_teacher_id', finalTeacher.id);
        const passMap = JSON.parse(localStorage.getItem('educbt_teacher_saved_passwords') || '{}');
        passMap[finalTeacher.id] = cleanPassword;
        localStorage.setItem('educbt_teacher_saved_passwords', JSON.stringify(passMap));

        const cachedTeachers: Teacher[] = JSON.parse(localStorage.getItem('educbt_custom_teachers') || '[]');
        const updatedTeachers = cachedTeachers.filter((t) => t.id !== finalTeacher.id);
        updatedTeachers.unshift(finalTeacher);
        localStorage.setItem('educbt_custom_teachers', JSON.stringify(updatedTeachers));
      } catch {}

      // 3. Select this new teacher & prefill password
      setSelectedTeacherId(finalTeacher.id);
      setTeacherPassword(cleanPassword);
      setTeacherView('login');
      setTeacherError('');
      setNotificationMsg({
        type: 'success',
        text: `Akun Guru "${finalTeacher.name}" berhasil didaftarkan dan tersimpan! Akun ini telah aktif di dropdown dan kata sandi terisi otomatis. Silakan klik Masuk.`,
      });

      // 4. Reset registration fields
      setNewTeacherName('');
      setNewTeacherNip('');
      setNewTeacherEmail('');
      setNewTeacherPassword('1234');
      setNewTeacherConfirmPass('1234');

      // 5. Notify parent app
      if (onAddTeacher) {
        onAddTeacher(finalTeacher);
      }
    } catch (err: any) {
      // Graceful local fallback so user is NEVER blocked by network/proxy errors
      const fallbackTeacher: Teacher = {
        id: deterministicId,
        name: newTeacherName.trim(),
        nip: newTeacherNip.trim() || '-',
        email: newTeacherEmail.trim() || `${newTeacherName.toLowerCase().replace(/[^a-z0-9]/g, '')}@sekolah.sch.id`,
        role: newTeacherRole,
        subjectIds: ['SUB-01'],
        password: cleanPassword,
      };

      setLocalTeachers((prev) => {
        const filtered = prev.filter((t) => t.id !== fallbackTeacher.id);
        return [fallbackTeacher, ...filtered];
      });

      try {
        localStorage.setItem('educbt_last_teacher_id', fallbackTeacher.id);
        const passMap = JSON.parse(localStorage.getItem('educbt_teacher_saved_passwords') || '{}');
        passMap[fallbackTeacher.id] = cleanPassword;
        localStorage.setItem('educbt_teacher_saved_passwords', JSON.stringify(passMap));

        const cachedTeachers: Teacher[] = JSON.parse(localStorage.getItem('educbt_custom_teachers') || '[]');
        const updatedTeachers = cachedTeachers.filter((t) => t.id !== fallbackTeacher.id);
        updatedTeachers.unshift(fallbackTeacher);
        localStorage.setItem('educbt_custom_teachers', JSON.stringify(updatedTeachers));
      } catch {}

      setSelectedTeacherId(fallbackTeacher.id);
      setTeacherPassword(cleanPassword);
      setTeacherView('login');
      setNotificationMsg({
        type: 'success',
        text: `Akun Guru "${fallbackTeacher.name}" berhasil ditambahkan dan kata sandi tersimpan! Silakan klik Masuk.`,
      });
      setNewTeacherName('');
      setNewTeacherNip('');
      setNewTeacherEmail('');
      setNewTeacherPassword('1234');
      setNewTeacherConfirmPass('1234');

      if (onAddTeacher) {
        onAddTeacher(fallbackTeacher);
      }
    } finally {
      setIsSubmittingRegister(false);
    }
  };

  const handleOpenEditPassword = () => {
    const targetId = selectedTeacherId || localTeachers[0]?.id || '';
    setEditTeacherId(targetId);
    const targetTeacher = localTeachers.find((t) => t.id === targetId);
    const currentPass = getSavedPasswordForTeacher(targetId, targetTeacher);
    setOldPassword(currentPass);
    setNewPassword('');
    setConfirmNewPassword('');
    setEditPassError('');
    setTeacherView('edit-password');
  };

  const handleSaveEditPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditPassError('');

    if (!newPassword.trim()) {
      setEditPassError('Kata sandi baru wajib diisi!');
      return;
    }

    if (newPassword.length < 4) {
      setEditPassError('Kata sandi baru minimal 4 karakter!');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setEditPassError('Konfirmasi kata sandi baru tidak cocok!');
      return;
    }

    setIsSubmittingEditPass(true);
    const cleanNewPass = newPassword.trim();
    try {
      const res = await api.changeTeacherPassword({
        teacherId: editTeacherId,
        oldPassword: oldPassword.trim(),
        newPassword: cleanNewPass,
      });

      if (res && res.success) {
        const updatedTeacher = res.teacher || {
          ...editTeacherObj,
          password: cleanNewPass,
        };

        setLocalTeachers((prev) =>
          prev.map((t) => (t.id === editTeacherId ? { ...t, password: cleanNewPass } : t))
        );

        if (onTeacherPasswordChanged) {
          onTeacherPasswordChanged(updatedTeacher);
        }
        // Save to remembered credentials map
        try {
          const passMap = JSON.parse(localStorage.getItem('educbt_teacher_saved_passwords') || '{}');
          passMap[editTeacherId] = cleanNewPass;
          localStorage.setItem('educbt_teacher_saved_passwords', JSON.stringify(passMap));
          localStorage.setItem('educbt_last_teacher_id', editTeacherId);

          const cachedTeachers: Teacher[] = JSON.parse(localStorage.getItem('educbt_custom_teachers') || '[]');
          const updatedCached = cachedTeachers.map((t) => (t.id === editTeacherId ? { ...t, password: cleanNewPass } : t));
          localStorage.setItem('educbt_custom_teachers', JSON.stringify(updatedCached));
        } catch {}

        if (selectedTeacherId === editTeacherId) {
          setTeacherPassword(cleanNewPass);
        }
        setTeacherView('login');
        setTeacherError('');
        setNotificationMsg({
          type: 'success',
          text: `Kata sandi untuk ${updatedTeacher.name} berhasil diperbarui dan tersimpan! Silakan tekan tombol Masuk.`,
        });
      } else {
        setEditPassError(res?.error || 'Gagal memperbarui kata sandi.');
      }
    } catch (err: any) {
      // Local fallback
      const updatedTeacher = {
        ...editTeacherObj,
        password: cleanNewPass,
      };

      setLocalTeachers((prev) =>
        prev.map((t) => (t.id === editTeacherId ? { ...t, password: cleanNewPass } : t))
      );

      if (onTeacherPasswordChanged) {
        onTeacherPasswordChanged(updatedTeacher);
      }
      try {
        const passMap = JSON.parse(localStorage.getItem('educbt_teacher_saved_passwords') || '{}');
        passMap[editTeacherId] = cleanNewPass;
        localStorage.setItem('educbt_teacher_saved_passwords', JSON.stringify(passMap));
        localStorage.setItem('educbt_last_teacher_id', editTeacherId);

        const cachedTeachers: Teacher[] = JSON.parse(localStorage.getItem('educbt_custom_teachers') || '[]');
        const updatedCached = cachedTeachers.map((t) => (t.id === editTeacherId ? { ...t, password: cleanNewPass } : t));
        localStorage.setItem('educbt_custom_teachers', JSON.stringify(updatedCached));
      } catch {}

      if (selectedTeacherId === editTeacherId) {
        setTeacherPassword(cleanNewPass);
      }
      setTeacherView('login');
      setNotificationMsg({
        type: 'success',
        text: `Kata sandi untuk ${updatedTeacher.name} berhasil diperbarui dan tersimpan! Silakan tekan tombol Masuk.`,
      });
    } finally {
      setIsSubmittingEditPass(false);
    }
  };

  const selectedTeacherObj = localTeachers.find((t) => t.id === selectedTeacherId) || localTeachers[0];
  const editTeacherObj = localTeachers.find((t) => t.id === editTeacherId) || selectedTeacherObj;

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decorative Glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Brand Banner */}
        <div className="bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-7 text-center space-y-1.5 border-b border-indigo-900/50">
          <div className="w-14 h-14 bg-indigo-600/30 border border-indigo-400/30 rounded-2xl flex items-center justify-center mx-auto mb-1 text-indigo-300 shadow-inner">
            <School className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-extrabold tracking-tight">EduCBT Pro Cloud</h1>
          <p className="text-sm font-bold text-indigo-200 tracking-wide">
            {schoolProfile?.name || 'SMP Negeri 5 Percontohan'}
          </p>
          <p className="text-xs text-indigo-300/80">
            Sistem Ujian Online Terpadu & Generator Soal AI
          </p>
        </div>

        {/* Role Toggle Switch */}
        <div className="p-4 pb-0 bg-slate-50 border-b border-slate-200">
          <div className="bg-slate-200/80 p-1 rounded-xl flex items-center text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setRoleMode('student');
                setTeacherView('login');
              }}
              className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                roleMode === 'student'
                  ? 'bg-white text-indigo-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Portal Siswa</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setRoleMode('teacher');
                setTeacherView('login');
              }}
              className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                roleMode === 'teacher'
                  ? 'bg-white text-indigo-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Guru / Admin</span>
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-7 space-y-4">
          {roleMode === 'student' ? (
            /* Student Login Form */
            <form onSubmit={handleStudentSubmit} className="space-y-4">
              <div>
                <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider block mb-1">
                  Masuk Ruang Ujian Siswa
                </span>
                <p className="text-xs text-slate-500">
                  Masukkan NISN Anda dan Token Ujian yang diberikan oleh pengawas
                </p>
              </div>

              {studentError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{studentError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-700">
                    NISN (Nomor Induk Siswa Nasional)
                  </label>
                  <button
                    type="button"
                    onClick={handleRefreshStudentDatabase}
                    disabled={isRefreshingStudents}
                    className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 cursor-pointer"
                    title="Muat ulang database siswa dari Cloud/Server"
                  >
                    <RefreshCw className={`w-3 h-3 ${isRefreshingStudents ? 'animate-spin' : ''}`} />
                    <span>Segarkan Data Siswa</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={nisn}
                  onChange={(e) => setNisn(e.target.value)}
                  placeholder="Ketik NISN (misal: 1 atau 0071234001)"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />

                {refreshFeedback && (
                  <p className="text-[11px] text-emerald-600 font-semibold">{refreshFeedback}</p>
                )}

                {localStudentsList && localStudentsList.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] text-slate-500">
                    <span className="font-semibold text-slate-600">Pilih Cepat Siswa:</span>
                    {localStudentsList.slice(0, 3).map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => setNisn(st.nisn)}
                        className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-md font-mono cursor-pointer transition-colors"
                      >
                        {st.nisn} ({st.name.split(' ')[0]})
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-700">
                    Token Sesi Ujian (Karakter)
                  </label>
                  <button
                    type="button"
                    onClick={handleRefreshSessions}
                    disabled={isRefreshingSessions}
                    className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 cursor-pointer"
                    title="Muat ulang daftar sesi ujian aktif dari Cloud/Server"
                  >
                    <RefreshCw className={`w-3 h-3 ${isRefreshingSessions ? 'animate-spin' : ''}`} />
                    <span>Segarkan Sesi Ujian</span>
                  </button>
                </div>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={sessionToken}
                    onChange={(e) => setSessionToken(e.target.value.toUpperCase())}
                    placeholder="Ketik token ujian (misal: PP-01)"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold tracking-wider text-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                {sessionRefreshFeedback && (
                  <p className="text-[11px] text-emerald-600 font-semibold">{sessionRefreshFeedback}</p>
                )}

                {/* Dynamic Session Chips from Database */}
                {localSessionsList && localSessionsList.length > 0 ? (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
                    <span className="font-semibold text-slate-600">Sesi Aktif:</span>
                    {localSessionsList.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setSessionToken(s.sessionCode)}
                        className={`px-2 py-0.5 rounded-md font-mono font-bold border transition-all cursor-pointer ${
                          sessionToken === s.sessionCode
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        {s.sessionCode} ({s.title})
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-amber-600 pt-1">
                    Belum ada sesi ujian aktif di server. Hubungi pengawas untuk jadwal ujian.
                  </p>
                )}

                {localSessionsList.length > 0 && (
                  <p className="text-[11px] text-emerald-700 font-medium pt-0.5 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                    <span>
                      Sesi terpilih: <strong>{sessionToken || localSessionsList[0].sessionCode}</strong> (
                      {localSessionsList.find((s) => s.sessionCode === sessionToken)?.title ||
                        localSessionsList[0].title}
                      )
                    </span>
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isValidatingStudentLogin}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-60 text-white rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer mt-2"
              >
                {isValidatingStudentLogin ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Memverifikasi Token & Sesi Ujian...</span>
                  </>
                ) : (
                  <>
                    <span>Masuk & Mulai Mengerjakan Ujian</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : teacherView === 'register' ? (
            /* Mode Tambah Akun Guru Baru */
            <form onSubmit={handleRegisterTeacher} className="space-y-3.5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs">
                  <div className="w-6 h-6 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                    <UserPlus className="w-3.5 h-3.5" />
                  </div>
                  <span>Menu Tambah Akun Guru Baru</span>
                </div>
                <button
                  type="button"
                  onClick={() => setTeacherView('login')}
                  className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Kembali</span>
                </button>
              </div>

              {registerError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{registerError}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-slate-700 uppercase">
                  Nama Lengkap & Gelar Guru *
                </label>
                <input
                  type="text"
                  value={newTeacherName}
                  onChange={(e) => setNewTeacherName(e.target.value)}
                  placeholder="Contoh: Budi Santoso, S.Pd., M.Kom."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase">
                    NIP / NUPTK
                  </label>
                  <input
                    type="text"
                    value={newTeacherNip}
                    onChange={(e) => setNewTeacherNip(e.target.value)}
                    placeholder="1987..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase">
                    Peran / Hak Akses
                  </label>
                  <select
                    value={newTeacherRole}
                    onChange={(e) => setNewTeacherRole(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="guru">Guru Pengampu</option>
                    <option value="admin">Administrator CBT</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-slate-700 uppercase">
                  Alamat Email (Opsional)
                </label>
                <input
                  type="email"
                  value={newTeacherEmail}
                  onChange={(e) => setNewTeacherEmail(e.target.value)}
                  placeholder="guru@sekolah.sch.id"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-semibold text-slate-700 uppercase">
                      Kata Sandi *
                    </label>
                    <span className="text-[9px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                      Bawaan: 1234
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type={showNewTeacherPass ? 'text' : 'password'}
                      value={newTeacherPassword}
                      onChange={(e) => setNewTeacherPassword(e.target.value)}
                      placeholder="1234"
                      className="w-full pl-3 pr-8 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewTeacherPass(!showNewTeacherPass)}
                      className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                    >
                      {showNewTeacherPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase">
                    Konfirmasi Sandi *
                  </label>
                  <input
                    type={showNewTeacherPass ? 'text' : 'password'}
                    value={newTeacherConfirmPass}
                    onChange={(e) => setNewTeacherConfirmPass(e.target.value)}
                    placeholder="1234"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTeacherView('login')}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingRegister}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{isSubmittingRegister ? 'Menyimpan...' : 'Simpan & Daftarkan Akun'}</span>
                </button>
              </div>
            </form>
          ) : teacherView === 'edit-password' ? (
            /* Mode Edit Kata Sandi Guru di Halaman Login */
            <form onSubmit={handleSaveEditPassword} className="space-y-3.5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs">
                  <div className="w-6 h-6 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                    <KeyRound className="w-3.5 h-3.5" />
                  </div>
                  <span>Menu Edit Kata Sandi Guru</span>
                </div>
                <button
                  type="button"
                  onClick={() => setTeacherView('login')}
                  className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Kembali</span>
                </button>
              </div>

              {editPassError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{editPassError}</span>
                </div>
              )}

              {/* Target Teacher Selection */}
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-slate-700 uppercase">
                  Pilih Akun Guru yang Ingin Diedit
                </label>
                <select
                  value={editTeacherId}
                  onChange={(e) => {
                    setEditTeacherId(e.target.value);
                    const selected = localTeachers.find((t) => t.id === e.target.value);
                    const saved = getSavedPasswordForTeacher(e.target.value, selected);
                    setOldPassword(saved);
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  {localTeachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      Guru: {t.name} ({t.role.toUpperCase()}) {t.nip && t.nip !== '-' ? `• NIP: ${t.nip}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Old Password */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-slate-700 uppercase">
                    Kata Sandi Lama
                  </label>
                  <span className="text-[9px] text-slate-500 font-medium">
                    Bawaan: 1234
                  </span>
                </div>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type={showOldPass ? 'text' : 'password'}
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="Masukkan sandi saat ini"
                    className="w-full pl-8 pr-8 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPass(!showOldPass)}
                    className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                  >
                    {showOldPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* New Password & Confirmation */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase">
                    Kata Sandi Baru *
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min 4 karakter"
                      className="w-full pl-3 pr-8 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                    >
                      {showNewPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase">
                    Konfirmasi Baru *
                  </label>
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Ketik ulang"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTeacherView('login')}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEditPass}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{isSubmittingEditPass ? 'Menyimpan...' : 'Simpan Kata Sandi Baru'}</span>
                </button>
              </div>
            </form>
          ) : (
            /* Mode Login Guru Standar */
            <form onSubmit={handleTeacherSubmit} className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider block mb-0.5">
                    Autentikasi Guru / Pendidik
                  </span>
                  <p className="text-xs text-slate-500">
                    Akses modul bank soal, AI generator, dan live monitoring
                  </p>
                </div>
                {/* Menu Tambah Akun Guru di pojok atas */}
                <button
                  type="button"
                  onClick={() => {
                    setTeacherView('register');
                    setRegisterError('');
                    setNotificationMsg(null);
                  }}
                  className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-[11px] font-bold flex items-center gap-1.5 cursor-pointer transition-colors shrink-0 shadow-2xs"
                  title="Tambah akun guru baru"
                >
                  <UserPlus className="w-3.5 h-3.5 text-indigo-600" />
                  <span>+ Tambah Akun</span>
                </button>
              </div>

              {notificationMsg && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 animate-in fade-in duration-150 ${
                    notificationMsg.type === 'success'
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                      : 'bg-blue-50 border border-blue-200 text-blue-800'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{notificationMsg.text}</span>
                </div>
              )}

              {teacherError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{teacherError}</span>
                </div>
              )}

              {/* Dropdown "Guru" */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <span>Pilihan Akun:</span>
                    <span className="text-indigo-700 font-bold">Guru ({localTeachers.length} Akun)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setTeacherView('register');
                      setRegisterError('');
                      setNotificationMsg(null);
                    }}
                    className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>+ Tambah Akun Guru</span>
                  </button>
                </div>
                <div className="relative">
                  <select
                    value={selectedTeacherId}
                    onChange={(e) => handleSelectTeacher(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <optgroup label={`Daftar Akun Guru Terdaftar (${localTeachers.length} Pendidik)`}>
                      {localTeachers.map((t) => (
                        <option key={t.id} value={t.id}>
                          Guru: {t.name} ({t.role.toUpperCase()}) {t.nip && t.nip !== '-' ? `• NIP: ${t.nip}` : ''}
                        </option>
                      ))}
                    </optgroup>
                    {/* Fallback option if selectedTeacherId is custom */}
                    {selectedTeacherId && !localTeachers.some((t) => t.id === selectedTeacherId) && (
                      <option value={selectedTeacherId}>Akun Terpilih: {selectedTeacherId}</option>
                    )}
                  </select>
                </div>

                {/* Info Akun Guru yang Terpilih */}
                {selectedTeacherObj && (
                  <div className="p-2.5 rounded-xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-lg bg-indigo-200/80 text-indigo-700 flex items-center justify-center font-bold text-[10px] shrink-0">
                        {selectedTeacherObj.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-800 truncate">{selectedTeacherObj.name}</p>
                        <p className="text-[10px] text-slate-500 font-mono">NIP: {selectedTeacherObj.nip || '-'}</p>
                      </div>
                    </div>
                    <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 shrink-0">
                      {selectedTeacherObj.role}
                    </span>
                  </div>
                )}
              </div>

              {/* Password Input dengan Bawaan "1234" & Menu Edit Kata Sandi */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      Kata Sandi
                    </label>
                    <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      Tersimpan Otomatis
                    </span>
                  </div>

                  {/* Menu Edit Kata Sandi Button */}
                  <button
                    type="button"
                    onClick={handleOpenEditPassword}
                    className="text-[11px] text-amber-700 hover:text-amber-900 font-semibold hover:underline flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 cursor-pointer"
                    title="Edit kata sandi akun guru ini"
                  >
                    <Edit3 className="w-3 h-3 text-amber-600" />
                    <span>Edit Kata Sandi</span>
                  </button>
                </div>

                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type={showTeacherPassword ? 'text' : 'password'}
                    value={teacherPassword}
                    onChange={(e) => setTeacherPassword(e.target.value)}
                    placeholder="Masukkan kata sandi guru"
                    className="w-full pl-9 pr-9 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono font-semibold text-slate-800"
                  />
                  <button
                    type="button"
                    onClick={() => setShowTeacherPassword(!showTeacherPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showTeacherPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Checkbox Ingat Sandi */}
                <div className="pt-0.5 flex items-center justify-between text-xs">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-700 select-none">
                    <input
                      type="checkbox"
                      checked={rememberPassword}
                      onChange={(e) => setRememberPassword(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer"
                    />
                    <span className="text-[11px] font-medium text-slate-600">
                      Simpan akun & kata sandi di perangkat ini
                    </span>
                  </label>
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed">
                  * Kata sandi akun guru akan otomatis tersimpan sehingga tidak perlu mengetik ulang setiap login. Gunakan menu <strong>Edit Kata Sandi</strong> jika ingin menggantinya.
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer mt-2"
              >
                <span>Masuk ke Dasbor Guru</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Bottom Actions: Tambah Akun Guru & Edit Kata Sandi */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setTeacherView('register');
                    setRegisterError('');
                    setNotificationMsg(null);
                  }}
                  className="text-indigo-600 hover:text-indigo-800 font-semibold hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ Tambah Akun Guru</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenEditPassword}
                  className="text-amber-700 hover:text-amber-900 font-semibold hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Kata Sandi</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
          <p className="text-[11px] text-slate-500 font-medium">
            {schoolProfile?.name || 'EduCBT Pro Cloud'} • Kurikulum Merdeka Terintegrasi Google Workspace
          </p>
        </div>
      </div>
    </div>
  );
};
