import React, { useState, useEffect } from 'react';
import {
  Users,
  GraduationCap,
  BookOpen,
  Plus,
  Trash2,
  Edit3,
  Save,
  Upload,
  Search,
  CheckCircle,
  FileSpreadsheet,
  X,
  AlertCircle,
  CheckSquare,
  Square,
  Download,
  Copy,
  Check,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { Student, ClassGroup, Subject, Teacher } from '../types/cbt';
import { api } from '../services/api';

interface MasterDataManagerProps {
  students: Student[];
  classes: ClassGroup[];
  subjects: Subject[];
  teachers: Teacher[];
  onRefreshData: () => void;
}

export const MasterDataManager: React.FC<MasterDataManagerProps> = ({
  students,
  classes,
  subjects,
  teachers,
  onRefreshData,
}) => {
  const [activeTab, setActiveTab] = useState<'students' | 'classes' | 'subjects'>('students');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');
  const [newlyImportedIds, setNewlyImportedIds] = useState<string[]>([]);

  // Local optimistic data states with localStorage backup to prevent state wipe on tab change
  const [localStudents, setLocalStudents] = useState<Student[]>(() => {
    if (students && students.length > 0) return students;
    try {
      const cached = JSON.parse(localStorage.getItem('educbt_master_students') || '[]');
      if (Array.isArray(cached) && cached.length > 0) return cached;
    } catch {}
    return students;
  });

  const [localClasses, setLocalClasses] = useState<ClassGroup[]>(() => {
    if (classes && classes.length > 0) return classes;
    try {
      const cached = JSON.parse(localStorage.getItem('educbt_master_classes') || '[]');
      if (Array.isArray(cached) && cached.length > 0) return cached;
    } catch {}
    return classes;
  });

  const [localSubjects, setLocalSubjects] = useState<Subject[]>(() => {
    if (subjects && subjects.length > 0) return subjects;
    try {
      const cached = JSON.parse(localStorage.getItem('educbt_master_subjects') || '[]');
      if (Array.isArray(cached) && cached.length > 0) return cached;
    } catch {}
    return subjects;
  });

  useEffect(() => {
    if (students && students.length > 0) {
      setLocalStudents(students);
    }
  }, [students]);

  useEffect(() => {
    if (classes && classes.length > 0) {
      setLocalClasses(classes);
    }
  }, [classes]);

  useEffect(() => {
    if (subjects && subjects.length > 0) {
      setLocalSubjects(subjects);
    }
  }, [subjects]);

  // Selected students state (Fitur Pilih)
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  // Student Add / Edit Modal State
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [isSavingStudent, setIsSavingStudent] = useState(false);
  const [studentFeedbackMsg, setStudentFeedbackMsg] = useState('');
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [studentNisn, setStudentNisn] = useState('');
  const [studentName, setStudentName] = useState('');
  const [studentClassId, setStudentClassId] = useState(classes[0]?.id || '');
  const [studentGender, setStudentGender] = useState<'L' | 'P'>('L');

  // Bulk Import Students State
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkInputText, setBulkInputText] = useState('');
  const [bulkTargetClassId, setBulkTargetClassId] = useState<string>('auto');
  const [bulkOverwriteExisting, setBulkOverwriteExisting] = useState<boolean>(true);
  const [isSavingBulk, setIsSavingBulk] = useState<boolean>(false);
  const [bulkSuccessResult, setBulkSuccessResult] = useState<{
    added: number;
    updated: number;
    total: number;
  } | null>(null);
  const [bulkParsedStudents, setBulkParsedStudents] = useState<
    { nisn: string; name: string; classId: string; gender: 'L' | 'P' }[]
  >([]);
  const [bulkParseError, setBulkParseError] = useState('');
  const [copiedTemplate, setCopiedTemplate] = useState(false);

  // Class State & Handlers
  const [isAddingClass, setIsAddingClass] = useState(false);
  const [className, setClassName] = useState('');
  const [classGrade, setClassGrade] = useState('1'); // Default to SD
  const [isManualSavingClasses, setIsManualSavingClasses] = useState(false);
  const [classFeedbackMsg, setClassFeedbackMsg] = useState('');

  // Subject State & Handlers
  const [isAddingSubject, setIsAddingSubject] = useState(false);
  const [subjectCode, setSubjectCode] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [subjectKkm, setSubjectKkm] = useState(75);
  const [subjectTeacher, setSubjectTeacher] = useState(teachers[0]?.name || '');
  const [isManualSavingSubjects, setIsManualSavingSubjects] = useState(false);
  const [subjectFeedbackMsg, setSubjectFeedbackMsg] = useState('');

  // Handlers for Student Single Add / Edit
  const handleOpenAddStudent = () => {
    setEditingStudent(null);
    setStudentNisn('');
    setStudentName('');
    setStudentClassId(localClasses[0]?.id || '');
    setStudentGender('L');
    setIsStudentModalOpen(true);
  };

  const [isManualSavingStudents, setIsManualSavingStudents] = useState(false);
  const handleManualSaveStudents = async () => {
    setIsManualSavingStudents(true);
    try {
      await api.saveMasterData({ students: localStudents });
      try {
        localStorage.setItem('educbt_master_students', JSON.stringify(localStudents));
      } catch {}
      onRefreshData();
      setStudentFeedbackMsg('Semua data siswa berhasil disimpan permanen ke server CBT!');
      setTimeout(() => setStudentFeedbackMsg(''), 4000);
    } catch (err: any) {
      alert('Gagal menyimpan data siswa: ' + (err.message || 'Terjadi kesalahan'));
    } finally {
      setIsManualSavingStudents(false);
    }
  };

  const handleOpenEditStudent = (st: Student) => {
    setEditingStudent(st);
    setStudentNisn(st.nisn || '');
    setStudentName(st.name || '');
    const stClassId = (st.classId || '').trim();
    // Safe match against class ID or Name (with null/undefined safety)
    const matchedClass = localClasses.find(
      (c) =>
        c.id === stClassId ||
        (c.name && stClassId && c.name.toLowerCase() === stClassId.toLowerCase())
    );
    setStudentClassId(matchedClass ? matchedClass.id : stClassId || localClasses[0]?.id || '');
    setStudentGender(st.gender === 'P' ? 'P' : 'L');
    setIsStudentModalOpen(true);
  };

  const handleSaveStudent = async () => {
    if (!studentNisn.trim() || !studentName.trim()) {
      alert('NISN dan Nama Siswa wajib diisi!');
      return;
    }

    setIsSavingStudent(true);
    try {
      let updated: Student[];
      const trimmedNisn = studentNisn.trim();
      const trimmedName = studentName.trim();
      const targetClass = studentClassId || localClasses[0]?.id || 'CLS-10A';

      if (editingStudent) {
        let matched = false;
        updated = localStudents.map((s) => {
          const isTarget =
            (editingStudent.id && s.id === editingStudent.id) ||
            (editingStudent.nisn && s.nisn === editingStudent.nisn);

          if (isTarget && !matched) {
            matched = true;
            return {
              ...s,
              id: s.id || editingStudent.id || `STD-${Date.now()}`,
              nisn: trimmedNisn,
              name: trimmedName,
              classId: targetClass,
              gender: studentGender,
            };
          }
          return s;
        });

        // If target wasn't found in array, prepend the updated student
        if (!matched) {
          const editedItem: Student = {
            id: editingStudent.id || `STD-${Date.now()}`,
            nisn: trimmedNisn,
            name: trimmedName,
            classId: targetClass,
            gender: studentGender,
          };
          updated = [editedItem, ...localStudents];
        }

        setStudentFeedbackMsg(`Data siswa "${trimmedName}" berhasil diperbarui!`);
      } else {
        const newStudent: Student = {
          id: `STD-${Date.now()}`,
          nisn: trimmedNisn,
          name: trimmedName,
          classId: targetClass,
          gender: studentGender,
        };
        updated = [newStudent, ...localStudents];
        setStudentFeedbackMsg(`Siswa baru "${trimmedName}" berhasil ditambahkan!`);
      }

      // Optimistic update
      setLocalStudents(updated);
      setIsStudentModalOpen(false);
      setEditingStudent(null);
      setStudentNisn('');
      setStudentName('');

      try {
        localStorage.setItem('educbt_master_students', JSON.stringify(updated));
      } catch {}

      await api.saveMasterData({ students: updated });
      onRefreshData();
      setTimeout(() => setStudentFeedbackMsg(''), 4000);
    } catch (err: any) {
      alert('Gagal menyimpan data siswa: ' + (err.message || 'Terjadi kesalahan'));
    } finally {
      setIsSavingStudent(false);
    }
  };

  const handleDeleteStudent = async (id: string) => {
    if (confirm('Yakin ingin menghapus data siswa ini?')) {
      const updated = localStudents.filter((s) => s.id !== id);
      setLocalStudents(updated);
      setSelectedStudentIds((prev) => prev.filter((x) => x !== id));
      await api.saveMasterData({ students: updated });
      onRefreshData();
    }
  };

  // Bulk Selection & Deletion for Students
  const handleToggleSelectStudent = (id: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAllStudents = () => {
    if (selectedStudentIds.length === filteredStudents.length && filteredStudents.length > 0) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(filteredStudents.map((s) => s.id));
    }
  };

  const handleBulkDeleteStudents = async () => {
    if (selectedStudentIds.length === 0) return;
    if (
      confirm(
        `Yakin ingin menghapus ${selectedStudentIds.length} siswa yang telah Anda pilih? Tindakan ini tidak dapat dibatalkan.`
      )
    ) {
      const updated = localStudents.filter((s) => !selectedStudentIds.includes(s.id));
      setLocalStudents(updated);
      setSelectedStudentIds([]);
      await api.saveMasterData({ students: updated });
      onRefreshData();
    }
  };

  // Bulk Import Smart Parsing with Universal Separator & Space/Numbered Support
  const handleParseBulkText = (text: string, targetClassOverride?: string) => {
    setBulkInputText(text);
    setBulkParseError('');
    setBulkSuccessResult(null);

    const activeTargetClass = targetClassOverride !== undefined ? targetClassOverride : bulkTargetClassId;

    if (!text.trim()) {
      setBulkParsedStudents([]);
      return;
    }

    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const parsed: { nisn: string; name: string; classId: string; gender: 'L' | 'P' }[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lowerLine = line.toLowerCase();

      // Skip header row if it contains descriptive column titles
      const isHeader =
        (lowerLine.includes('nisn') && (lowerLine.includes('nama') || lowerLine.includes('siswa'))) ||
        lowerLine.startsWith('no\t') ||
        lowerLine.startsWith('no,') ||
        lowerLine.startsWith('no.') ||
        lowerLine.startsWith('no |') ||
        lowerLine.startsWith('no ') ||
        (lowerLine.includes('nama lengkap') && lowerLine.includes('kelas')) ||
        (lowerLine.includes('nomor') && lowerLine.includes('nama'));

      if (isHeader) {
        continue;
      }

      // Remove leading row number e.g. "1. ", "1) ", "[1] ", "1\t", "1 - "
      const cleanLine = line.replace(/^\s*\[?\d{1,4}[.)\]]\s*[\t,-]?\s*/, '').trim();
      if (!cleanLine) continue;

      // Detect separator: Tab, Semicolon, Pipe, Comma, " - ", or multiple spaces
      let parts: string[] = [];
      if (cleanLine.includes('\t')) {
        parts = cleanLine.split('\t');
      } else if (cleanLine.includes(';')) {
        parts = cleanLine.split(';');
      } else if (cleanLine.includes('|')) {
        parts = cleanLine.split('|');
      } else if (cleanLine.includes(',')) {
        parts = cleanLine.split(',');
      } else if (cleanLine.includes(' - ')) {
        parts = cleanLine.split(' - ');
      } else if (/\s{2,}/.test(cleanLine)) {
        parts = cleanLine.split(/\s{2,}/);
      } else {
        // Space-separated fallback: check if starts or ends with numeric NISN (4-14 digits)
        const nisnLeading = cleanLine.match(/^(\d{4,14})\s+(.+)$/);
        const nisnTrailing = cleanLine.match(/^(.+?)\s+(\d{4,14})$/);
        if (nisnLeading) {
          parts = [nisnLeading[1], nisnLeading[2]];
        } else if (nisnTrailing) {
          parts = [nisnTrailing[2], nisnTrailing[1]];
        } else {
          // Just name provided
          parts = [cleanLine];
        }
      }

      // Clean each part (strip quotes and whitespace)
      parts = parts
        .map((p) => p.trim().replace(/^["'\s]+|["'\s]+$/g, ''))
        .filter((p) => p.length > 0);

      if (parts.length === 0) continue;

      let nisnVal = '';
      let nameVal = '';
      let classVal = localClasses[0]?.id || '1';
      let genderVal: 'L' | 'P' = 'L';

      if (parts.length === 1) {
        // Only name is provided; auto-generate a valid 10-digit NISN
        nameVal = parts[0];
        nisnVal = '00' + Math.floor(10000000 + Math.random() * 90000000);
      } else {
        const col0 = parts[0];
        const col1 = parts[1];
        const isCol0Numeric = /^[0-9]+$/.test(col0.replace(/[-\s]/g, ''));
        const isCol1Numeric = /^[0-9]+$/.test(col1.replace(/[-\s]/g, ''));

        if (isCol0Numeric && !isCol1Numeric) {
          nisnVal = col0.replace(/[^0-9A-Za-z]/g, '');
          nameVal = col1;
        } else if (!isCol0Numeric && isCol1Numeric) {
          nameVal = col0;
          nisnVal = col1.replace(/[^0-9A-Za-z]/g, '');
        } else {
          nisnVal = col0.replace(/[^0-9A-Za-z]/g, '') || ('00' + Math.floor(10000000 + Math.random() * 90000000));
          nameVal = col1;
        }

        // Parse remaining parts for Class and Gender
        const remainingParts = parts.slice(2);
        for (const rem of remainingParts) {
          const upperRem = rem.toUpperCase();
          if (['L', 'P', 'LAKI-LAKI', 'PEREMPUAN', 'PRIA', 'WANITA', 'M', 'F'].includes(upperRem)) {
            genderVal = ['P', 'PEREMPUAN', 'WANITA', 'F'].includes(upperRem) ? 'P' : 'L';
          } else {
            // Check if matches an existing class by ID or Name
            const matched = localClasses.find(
              (c) =>
                c.id.toLowerCase() === rem.toLowerCase() ||
                c.name.toLowerCase() === rem.toLowerCase()
            );
            classVal = matched ? matched.id : rem;
          }
        }
      }

      // If activeTargetClass is specified (not auto), override with that class
      if (activeTargetClass && activeTargetClass !== 'auto') {
        classVal = activeTargetClass;
      }

      if (nameVal) {
        parsed.push({
          nisn: nisnVal || ('00' + Math.floor(10000000 + Math.random() * 90000000)),
          name: nameVal,
          classId: classVal,
          gender: genderVal,
        });
      }
    }

    if (parsed.length === 0) {
      setBulkParseError(
        'Format data belum dikenali. Anda dapat menempelkan daftar NISN dan Nama dari Excel/Sheets, atau salinan daftar nama siswa.'
      );
    }
    setBulkParsedStudents(parsed);
  };

  const handleConfirmBulkImport = async () => {
    if (bulkParsedStudents.length === 0) return;
    setIsSavingBulk(true);
    setBulkParseError('');

    try {
      // 1. Check for any new classes introduced in the import and auto-create them
      const updatedClasses = [...localClasses];
      let hasNewClasses = false;

      bulkParsedStudents.forEach((st) => {
        const classExists = updatedClasses.some(
          (c) => c.id === st.classId || c.name.toLowerCase() === st.classId.toLowerCase()
        );
        if (!classExists && st.classId && st.classId.trim()) {
          const newClassGroup: ClassGroup = {
            id: `CLS-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            name: st.classId.trim(),
            gradeLevel: '10',
          };
          updatedClasses.push(newClassGroup);
          st.classId = newClassGroup.id;
          hasNewClasses = true;
        } else if (classExists) {
          const match = updatedClasses.find(
            (c) => c.id === st.classId || c.name.toLowerCase() === st.classId.toLowerCase()
          );
          if (match) {
            st.classId = match.id;
          }
        }
      });

      // 2. Build updated students list (prepend newly added students so they are immediately visible at the top!)
      const updatedStudents = [...localStudents];
      const newlyAdded: Student[] = [];
      let addedCount = 0;
      let updatedCount = 0;

      bulkParsedStudents.forEach((bp, idx) => {
        const existingIdx = updatedStudents.findIndex((s) => s.nisn === bp.nisn);
        if (existingIdx >= 0) {
          if (bulkOverwriteExisting) {
            updatedStudents[existingIdx] = {
              ...updatedStudents[existingIdx],
              name: bp.name,
              classId: bp.classId,
              gender: bp.gender,
            };
            updatedCount++;
          }
        } else {
          const newSt: Student = {
            id: `STD-BULK-${Date.now()}-${idx}`,
            nisn: bp.nisn,
            name: bp.name,
            classId: bp.classId,
            gender: bp.gender,
          };
          newlyAdded.push(newSt);
          addedCount++;
        }
      });

      // Prepend newly added students so they appear right at the top
      const finalStudentsList = [...newlyAdded, ...updatedStudents];

      // Update UI state IMMEDIATELY (optimistic local state)
      setLocalStudents(finalStudentsList);
      if (hasNewClasses) {
        setLocalClasses(updatedClasses);
      }
      setNewlyImportedIds(newlyAdded.map((s) => s.id));
      setSearchTerm('');
      setSelectedClassFilter('all');

      // 3. Persist to API and localStorage
      await api.saveMasterData({
        students: finalStudentsList,
        classes: hasNewClasses ? updatedClasses : undefined,
      });

      setBulkSuccessResult({
        added: addedCount,
        updated: updatedCount,
        total: addedCount + updatedCount,
      });

      // Sync parent app state
      onRefreshData();

      // Auto close modal smoothly after brief confirmation
      setTimeout(() => {
        setIsBulkModalOpen(false);
        setBulkInputText('');
        setBulkParsedStudents([]);
        setBulkSuccessResult(null);
      }, 1500);
    } catch (err: any) {
      setBulkParseError(`Gagal menyimpan data siswa: ${err.message || 'Terjadi kesalahan sistem'}`);
    } finally {
      setIsSavingBulk(false);
    }
  };

  const handleCopyTemplate = () => {
    const template = `NISN\tNama Siswa\tKelas\tJenis Kelamin\n0081234001\tAhmad Dahlan\t1A\tL\n0081234002\tFatimah Azzahra\t1A\tP\n0081234003\tBudi Santoso\t4A\tL\n0081234004\tSiti Nurjanah\t6A\tP`;
    navigator.clipboard.writeText(template);
    setCopiedTemplate(true);
    setTimeout(() => setCopiedTemplate(false), 2000);
  };

  const handleLoadSampleData = () => {
    const sample = `0081234001\tAhmad Dahlan\tKelas 10 A\tL\n0081234002\tFatimah Azzahra\tKelas 10 A\tP\n0081234003\tBudi Santoso\tKelas 10 B\tL\n0081234004\tSiti Nurjanah\tKelas 10 B\tP`;
    handleParseBulkText(sample);
  };

  // Handlers for Classes
  const handleSaveClass = async () => {
    if (!className.trim()) {
      alert('Nama kelas wajib diisi!');
      return;
    }
    const newClass: ClassGroup = {
      id: `CLS-${Date.now()}`,
      name: className.trim(),
      gradeLevel: classGrade,
    };
    const updated = [...localClasses, newClass];
    setLocalClasses(updated);
    try {
      localStorage.setItem('educbt_master_classes', JSON.stringify(updated));
    } catch {}
    await api.saveMasterData({ classes: updated });
    onRefreshData();
    setIsAddingClass(false);
    setClassName('');
    setClassFeedbackMsg(`Kelas "${newClass.name}" berhasil ditambahkan dan disimpan!`);
    setTimeout(() => setClassFeedbackMsg(''), 4000);
  };

  const handleManualSaveClasses = async () => {
    setIsManualSavingClasses(true);
    try {
      await api.saveMasterData({ classes: localClasses });
      try {
        localStorage.setItem('educbt_master_classes', JSON.stringify(localClasses));
      } catch {}
      onRefreshData();
      setClassFeedbackMsg('Semua data kelas berhasil disimpan permanen ke database CBT!');
      setTimeout(() => setClassFeedbackMsg(''), 4000);
    } catch (err: any) {
      alert('Gagal menyimpan data kelas: ' + (err.message || 'Terjadi kesalahan'));
    } finally {
      setIsManualSavingClasses(false);
    }
  };

  const handleLoadStandardClasses = async () => {
    const standard: ClassGroup[] = [
      { id: 'CLS-SD1A', name: 'Kelas 1-A (SD)', gradeLevel: '1' },
      { id: 'CLS-SD2A', name: 'Kelas 2-A (SD)', gradeLevel: '2' },
      { id: 'CLS-SD3A', name: 'Kelas 3-A (SD)', gradeLevel: '3' },
      { id: 'CLS-SD4A', name: 'Kelas 4-A (SD)', gradeLevel: '4' },
      { id: 'CLS-SD5A', name: 'Kelas 5-A (SD)', gradeLevel: '5' },
      { id: 'CLS-SD6A', name: 'Kelas 6-A (SD)', gradeLevel: '6' },
      { id: 'CLS-SMP7A', name: 'Kelas 7-A (SMP)', gradeLevel: '7' },
      { id: 'CLS-SMP8A', name: 'Kelas 8-A (SMP)', gradeLevel: '8' },
      { id: 'CLS-SMP9A', name: 'Kelas 9-A (SMP)', gradeLevel: '9' },
      { id: 'CLS-SMA10A', name: 'Kelas 10 MIPA (SMA)', gradeLevel: '10' },
      { id: 'CLS-SMA11A', name: 'Kelas 11 MIPA (SMA)', gradeLevel: '11' },
      { id: 'CLS-SMA12A', name: 'Kelas 12 MIPA (SMA)', gradeLevel: '12' },
    ];
    const map = new Map<string, ClassGroup>();
    localClasses.forEach((c) => map.set(c.id, c));
    standard.forEach((c) => {
      if (!Array.from(map.values()).some((x) => x.name.toLowerCase() === c.name.toLowerCase())) {
        map.set(c.id, c);
      }
    });
    const updated = Array.from(map.values());
    setLocalClasses(updated);
    try {
      localStorage.setItem('educbt_master_classes', JSON.stringify(updated));
    } catch {}
    await api.saveMasterData({ classes: updated });
    onRefreshData();
    setClassFeedbackMsg('Daftar rombel standar (SD, SMP, SMA) berhasil dimuat dan disimpan!');
    setTimeout(() => setClassFeedbackMsg(''), 4000);
  };

  const handleDeleteClass = async (id: string) => {
    if (confirm('Hapus rombel/kelas ini? Siswa yang terhubung mungkin perlu dipindahkan.')) {
      const updated = localClasses.filter((c) => c.id !== id);
      setLocalClasses(updated);
      try {
        localStorage.setItem('educbt_master_classes', JSON.stringify(updated));
      } catch {}
      await api.saveMasterData({ classes: updated });
      onRefreshData();
      setClassFeedbackMsg('Kelas berhasil dihapus.');
      setTimeout(() => setClassFeedbackMsg(''), 3000);
    }
  };

  // Handlers for Subjects
  const handleSaveSubject = async () => {
    if (!subjectCode.trim() || !subjectName.trim()) {
      alert('Kode dan Nama Mapel wajib diisi!');
      return;
    }
    const newSubject: Subject = {
      id: `SUB-${Date.now()}`,
      code: subjectCode.trim().toUpperCase(),
      name: subjectName.trim(),
      kkm: Number(subjectKkm) || 75,
      teacherName: subjectTeacher || teachers[0]?.name || 'Guru Pengampu',
    };
    const updated = [...localSubjects, newSubject];
    setLocalSubjects(updated);
    try {
      localStorage.setItem('educbt_master_subjects', JSON.stringify(updated));
    } catch {}
    await api.saveMasterData({ subjects: updated });
    onRefreshData();
    setIsAddingSubject(false);
    setSubjectCode('');
    setSubjectName('');
    setSubjectFeedbackMsg(`Mata pelajaran "${newSubject.name}" berhasil ditambahkan dan disimpan!`);
    setTimeout(() => setSubjectFeedbackMsg(''), 4000);
  };

  const handleManualSaveSubjects = async () => {
    setIsManualSavingSubjects(true);
    try {
      await api.saveMasterData({ subjects: localSubjects });
      try {
        localStorage.setItem('educbt_master_subjects', JSON.stringify(localSubjects));
      } catch {}
      onRefreshData();
      setSubjectFeedbackMsg('Semua data mata pelajaran berhasil disimpan permanen ke database CBT!');
      setTimeout(() => setSubjectFeedbackMsg(''), 4000);
    } catch (err: any) {
      alert('Gagal menyimpan data mata pelajaran: ' + (err.message || 'Terjadi kesalahan'));
    } finally {
      setIsManualSavingSubjects(false);
    }
  };

  const handleLoadStandardSubjects = async () => {
    const standard: Subject[] = [
      { id: 'SUB-BIN', code: 'BIN', name: 'Bahasa Indonesia', kkm: 75, teacherName: teachers[0]?.name || 'Guru B. Indonesia' },
      { id: 'SUB-MAT', code: 'MAT', name: 'Matematika', kkm: 70, teacherName: teachers[0]?.name || 'Guru Matematika' },
      { id: 'SUB-IPAS', code: 'IPAS', name: 'Ilmu Pengetahuan Alam & Sosial (IPAS)', kkm: 75, teacherName: teachers[0]?.name || 'Guru IPAS' },
      { id: 'SUB-BIG', code: 'BIG', name: 'Bahasa Inggris', kkm: 75, teacherName: teachers[0]?.name || 'Guru B. Inggris' },
      { id: 'SUB-PKN', code: 'PPKN', name: 'Pendidikan Pancasila & Kewarganegaraan', kkm: 78, teacherName: teachers[0]?.name || 'Guru PPKN' },
      { id: 'SUB-PAI', code: 'PAI', name: 'Pendidikan Agama & Budi Pekerti', kkm: 80, teacherName: teachers[0]?.name || 'Guru Agama' },
    ];
    const map = new Map<string, Subject>();
    localSubjects.forEach((s) => map.set(s.id, s));
    standard.forEach((s) => {
      if (!Array.from(map.values()).some((x) => x.name.toLowerCase() === s.name.toLowerCase() || x.code === s.code)) {
        map.set(s.id, s);
      }
    });
    const updated = Array.from(map.values());
    setLocalSubjects(updated);
    try {
      localStorage.setItem('educbt_master_subjects', JSON.stringify(updated));
    } catch {}
    await api.saveMasterData({ subjects: updated });
    onRefreshData();
    setSubjectFeedbackMsg('Daftar mata pelajaran standar Kurikulum Merdeka berhasil dimuat dan disimpan!');
    setTimeout(() => setSubjectFeedbackMsg(''), 4000);
  };

  const handleDeleteSubject = async (id: string) => {
    if (confirm('Hapus mata pelajaran ini?')) {
      const updated = localSubjects.filter((s) => s.id !== id);
      setLocalSubjects(updated);
      try {
        localStorage.setItem('educbt_master_subjects', JSON.stringify(updated));
      } catch {}
      await api.saveMasterData({ subjects: updated });
      onRefreshData();
      setSubjectFeedbackMsg('Mata pelajaran berhasil dihapus.');
      setTimeout(() => setSubjectFeedbackMsg(''), 3000);
    }
  };

  const filteredStudents = localStudents.filter((s) => {
    const sClassId = (s.classId || '').trim();
    const sName = (s.name || '').trim();
    const sNisn = (s.nisn || '').trim();
    const classObj = localClasses.find(
      (c) => c.id === sClassId || (c.name && sClassId && c.name.toLowerCase() === sClassId.toLowerCase())
    );
    const classNameText = classObj?.name || '';
    const query = searchTerm.toLowerCase().trim();

    const matchesSearch =
      !query ||
      sName.toLowerCase().includes(query) ||
      sNisn.includes(query) ||
      sClassId.toLowerCase().includes(query) ||
      classNameText.toLowerCase().includes(query);

    const matchesClass =
      selectedClassFilter === 'all' ||
      sClassId === selectedClassFilter ||
      (classNameText && classNameText.toLowerCase() === selectedClassFilter.toLowerCase());

    return matchesSearch && matchesClass;
  });

  return (
    <div className="space-y-6">
      {/* Header and Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-indigo-600" />
            <span>Master Data Akademik (SD, SMP & SMA/SMK)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Pengelolaan peserta didik (siswa), rombel kelas berjenjang (Kelas 1–6 SD, 7–9 SMP, 10–12 SMA), dan mata pelajaran
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab('students')}
            className={`px-3.5 py-1.5 rounded-lg transition-all ${
              activeTab === 'students'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Data Siswa ({localStudents.length})
          </button>
          <button
            onClick={() => setActiveTab('classes')}
            className={`px-3.5 py-1.5 rounded-lg transition-all ${
              activeTab === 'classes'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Kelas & Jenjang ({localClasses.length})
          </button>
          <button
            onClick={() => setActiveTab('subjects')}
            className={`px-3.5 py-1.5 rounded-lg transition-all ${
              activeTab === 'subjects'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Mata Pelajaran ({localSubjects.length})
          </button>
        </div>
      </div>

      {/* TAB 1: DATA SISWA */}
      {activeTab === 'students' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          {/* Top Toolbar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Cari NISN, nama, atau nama kelas..."
                  className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* Filter By Class Dropdown */}
              <select
                value={selectedClassFilter}
                onChange={(e) => setSelectedClassFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="all">Semua Kelas ({localStudents.length} Siswa)</option>
                {localClasses.map((cls) => {
                  const countInClass = localStudents.filter(
                    (s) => s.classId === cls.id || (s.classId || '').toLowerCase() === (cls.name || '').toLowerCase()
                  ).length;
                  return (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} ({countInClass} Siswa)
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleManualSaveStudents}
                disabled={isManualSavingStudents}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-all flex-1 sm:flex-none"
                title="Simpan seluruh data siswa ke server CBT"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isManualSavingStudents ? 'Menyimpan...' : 'Simpan Data Siswa'}</span>
              </button>

              <button
                onClick={() => setIsBulkModalOpen(true)}
                className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-all flex-1 sm:flex-none"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Tambah Siswa Bulk (Excel/CSV)</span>
              </button>

              <button
                onClick={handleOpenAddStudent}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer flex-1 sm:flex-none"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Siswa</span>
              </button>
            </div>
          </div>

          {/* Newly imported banner */}
          {newlyImportedIds.length > 0 && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between animate-in fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  <strong>{newlyImportedIds.length} Siswa baru berhasil ditambahkan!</strong> Data langsung tersimpan dan ditampilkan di urutan teratas tabel di bawah.
                </span>
              </div>
              <button
                onClick={() => setNewlyImportedIds([])}
                className="text-emerald-700 hover:text-emerald-900 font-bold text-xs px-2 py-0.5 rounded hover:bg-emerald-100 cursor-pointer"
                title="Tutup pemberitahuan"
              >
                ✕
              </button>
            </div>
          )}

          {/* Action Bar for Selected Students (Pilih Siswa) */}
          {selectedStudentIds.length > 0 && (
            <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-200 flex items-center justify-between animate-in fade-in duration-150">
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-900">
                <CheckSquare className="w-4 h-4 text-indigo-600" />
                <span>{selectedStudentIds.length} Siswa Terpilih</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedStudentIds([])}
                  className="px-3 py-1 text-xs text-slate-600 hover:text-slate-900 font-semibold"
                >
                  Batal Pilih
                </button>
                <button
                  onClick={handleBulkDeleteStudents}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus {selectedStudentIds.length} Siswa Terpilih</span>
                </button>
              </div>
            </div>
          )}

          {/* Student Feedback Toast / Notification */}
          {studentFeedbackMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center justify-between animate-in fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{studentFeedbackMsg}</span>
              </div>
              <button
                type="button"
                onClick={() => setStudentFeedbackMsg('')}
                className="text-emerald-700 hover:text-emerald-900 font-bold px-1.5 py-0.5 rounded hover:bg-emerald-100 cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* Student Table with Select, Edit, and Delete */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-y border-slate-200 text-slate-600 font-semibold uppercase text-[11px]">
                  <th className="py-3 px-3 w-10 text-center">
                    <button
                      type="button"
                      onClick={handleToggleSelectAllStudents}
                      className="p-1 hover:text-indigo-600"
                      title="Pilih Semua"
                    >
                      {selectedStudentIds.length === filteredStudents.length &&
                      filteredStudents.length > 0 ? (
                        <CheckSquare className="w-4 h-4 text-indigo-600" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                  </th>
                  <th className="py-3 px-3">No</th>
                  <th className="py-3 px-4">NISN</th>
                  <th className="py-3 px-4">Nama Lengkap</th>
                  <th className="py-3 px-4">Kelas</th>
                  <th className="py-3 px-4">L/P</th>
                  <th className="py-3 px-4 text-right">Aksi (Edit / Hapus)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      Tidak ada data siswa ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((s, idx) => {
                    const isSelected = selectedStudentIds.includes(s.id);
                    const isNew = newlyImportedIds.includes(s.id);
                    const sClassId = (s.classId || '').trim();
                    const classInfo = localClasses.find(
                      (c) => c.id === sClassId || (c.name && sClassId && c.name.toLowerCase() === sClassId.toLowerCase())
                    );

                    return (
                      <tr
                        key={s.id}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          isSelected ? 'bg-indigo-50/40' : isNew ? 'bg-emerald-50/40' : ''
                        }`}
                      >
                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleSelectStudent(s.id)}
                            className="p-1 cursor-pointer"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-indigo-600" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-300 hover:text-slate-500" />
                            )}
                          </button>
                        </td>
                        <td className="py-3 px-3 font-bold text-slate-500">{idx + 1}</td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-700">{s.nisn}</td>
                        <td className="py-3 px-4 font-semibold text-slate-800">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenEditStudent(s)}
                              className="text-left font-bold text-slate-800 hover:text-indigo-600 hover:underline cursor-pointer transition-colors"
                              title={`Klik untuk edit data siswa: ${s.name}`}
                            >
                              {s.name}
                            </button>
                            {isNew && (
                              <span className="px-1.5 py-0.2 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[9px] uppercase tracking-wider">
                                Baru
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-medium">
                          {classInfo?.name || s.classId || '-'}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                              s.gender === 'P'
                                ? 'bg-pink-50 text-pink-700'
                                : 'bg-blue-50 text-blue-700'
                            }`}
                          >
                            {s.gender || 'L'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEditStudent(s)}
                              className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                              title={`Edit data siswa: ${s.name}`}
                            >
                              <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteStudent(s.id)}
                              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                              title={`Hapus data siswa: ${s.name}`}
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                              <span>Hapus</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: DATA KELAS DENGAN DUKUNGAN SEKOLAH DASAR (KELAS 1 - 6 SD) */}
      {activeTab === 'classes' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <span>Daftar Rombongan Belajar (Kelas SD, SMP, SMA/SMK)</span>
                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-md">
                  {localClasses.length} Rombel
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Mendukung fase kurikulum Sekolah Dasar (Kelas 1–6), SMP (Kelas 7–9), dan SMA (Kelas 10–12)
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleManualSaveClasses}
                disabled={isManualSavingClasses}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
                title="Simpan seluruh data kelas ke server CBT"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isManualSavingClasses ? 'Menyimpan...' : 'Simpan Data Kelas'}</span>
              </button>

              <button
                onClick={handleLoadStandardClasses}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs cursor-pointer transition-all"
                title="Muat data rombel kelas standar SD, SMP, dan SMA"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                <span>Muat Rombel Standar</span>
              </button>

              <button
                onClick={() => setIsAddingClass(true)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Kelas</span>
              </button>
            </div>
          </div>

          {classFeedbackMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 animate-in fade-in">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{classFeedbackMsg}</span>
            </div>
          )}

          {isAddingClass && (
            <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-200 flex flex-wrap items-end gap-3 animate-in fade-in duration-150">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                  Nama Kelas
                </label>
                <input
                  type="text"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  placeholder="Contoh: I-A, IV-B, VII-A, XII MIPA"
                  className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs w-52"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                  Jenjang / Tingkat Kelas
                </label>
                <select
                  value={classGrade}
                  onChange={(e) => setClassGrade(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold"
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

              <button
                onClick={handleSaveClass}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Simpan Kelas
              </button>
              <button
                onClick={() => setIsAddingClass(false)}
                className="px-3 py-2 bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
              >
                Batal
              </button>
            </div>
          )}

          {localClasses.length === 0 ? (
            <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-2xl p-6">
              <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h4 className="font-bold text-slate-700 text-sm">Belum Ada Rombel Kelas Terdaftar</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
                Tambahkan kelas baru secara manual atau muat paket rombel standar kurikulum nasional (SD, SMP, dan SMA).
              </p>
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={handleLoadStandardClasses}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs"
                >
                  Muat Rombel Standar (SD, SMP, SMA)
                </button>
                <button
                  onClick={() => setIsAddingClass(true)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs"
                >
                  + Tambah Kelas Manual
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              {localClasses.map((c) => {
                const studentCount = localStudents.filter(
                  (s) => s.classId === c.id || (s.classId || '').toLowerCase() === (c.name || '').toLowerCase()
                ).length;
                const isSD = Number(c.gradeLevel) >= 1 && Number(c.gradeLevel) <= 6;
                const isSMP = Number(c.gradeLevel) >= 7 && Number(c.gradeLevel) <= 9;

                return (
                  <div
                    key={c.id}
                    className="p-4 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 transition-all flex items-center justify-between shadow-xs"
                  >
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${
                            isSD
                              ? 'bg-amber-100 text-amber-800'
                              : isSMP
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-indigo-100 text-indigo-800'
                          }`}
                        >
                          {isSD ? 'Jenjang SD' : isSMP ? 'Jenjang SMP' : 'Jenjang SMA'}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-800 text-sm">{c.name}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Tingkat {c.gradeLevel} • {studentCount} Siswa
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteClass(c.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      title="Hapus kelas"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: DATA MATA PELAJARAN */}
      {activeTab === 'subjects' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <span>Daftar Mata Pelajaran & KKM</span>
                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-md">
                  {localSubjects.length} Mapel
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Pengaturan kode kurikulum, nama mata pelajaran, standar KKM, dan guru pengampu
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleManualSaveSubjects}
                disabled={isManualSavingSubjects}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
                title="Simpan seluruh data mata pelajaran ke server CBT"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isManualSavingSubjects ? 'Menyimpan...' : 'Simpan Data Mapel'}</span>
              </button>

              <button
                onClick={handleLoadStandardSubjects}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs cursor-pointer transition-all"
                title="Muat daftar mata pelajaran standar Kurikulum Merdeka"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                <span>Muat Mapel Standar</span>
              </button>

              <button
                onClick={() => setIsAddingSubject(true)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Mapel</span>
              </button>
            </div>
          </div>

          {subjectFeedbackMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 animate-in fade-in">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{subjectFeedbackMsg}</span>
            </div>
          )}

          {isAddingSubject && (
            <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-200 grid grid-cols-1 sm:grid-cols-4 gap-3 animate-in fade-in duration-150">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                  Kode Mapel
                </label>
                <input
                  type="text"
                  value={subjectCode}
                  onChange={(e) => setSubjectCode(e.target.value)}
                  placeholder="BIN, MAT, IPAS..."
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs uppercase"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                  Nama Mata Pelajaran
                </label>
                <input
                  type="text"
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  placeholder="IPAS SD, Matematika..."
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                  Nilai KKM (Kelulusan Minimal)
                </label>
                <input
                  type="number"
                  value={subjectKkm}
                  onChange={(e) => setSubjectKkm(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex items-end gap-2">
                <button
                  type="button"
                  onClick={handleSaveSubject}
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Simpan Mapel
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingSubject(false)}
                  className="px-3 py-2 bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
                >
                  Batal
                </button>
              </div>
            </div>
          )}

          {localSubjects.length === 0 ? (
            <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-2xl p-6">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h4 className="font-bold text-slate-700 text-sm">Belum Ada Mata Pelajaran Terdaftar</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
                Tambahkan mata pelajaran baru atau muat paket standar Kurikulum Merdeka (Bahasa Indonesia, Matematika, IPAS, Bahasa Inggris, dll).
              </p>
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={handleLoadStandardSubjects}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs"
                >
                  Muat Mapel Standar Kurikulum Merdeka
                </button>
                <button
                  onClick={() => setIsAddingSubject(true)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs"
                >
                  + Tambah Mapel Manual
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              {localSubjects.map((s) => (
                <div
                  key={s.id}
                  className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-indigo-300 transition-all flex flex-col justify-between space-y-3 shadow-xs"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 font-mono font-bold text-xs rounded-md">
                        {s.code}
                      </span>
                      <span className="text-xs font-bold text-emerald-700">KKM: {s.kkm}</span>
                    </div>
                    <h4 className="font-bold text-slate-800 text-base">{s.name}</h4>
                    <p className="text-xs text-slate-500 mt-1">Guru: {s.teacherName}</p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
                    <button
                      onClick={() => handleDeleteSubject(s.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      title="Hapus mapel"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* BULK IMPORT STUDENTS MODAL */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-linear-to-r from-indigo-700 to-blue-700 text-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Tambah Siswa Secara Bulk</h3>
                  <p className="text-xs text-indigo-100">
                    Tempel daftar siswa langsung dari spreadsheet Excel, Google Sheets, atau CSV
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsBulkModalOpen(false);
                  setBulkSuccessResult(null);
                  setBulkParseError('');
                }}
                className="p-2 text-white/80 hover:text-white rounded-lg hover:bg-white/20 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              {/* Format Help & Template Buttons */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="font-bold text-slate-700">Format Kolom yang Didukung:</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleLoadSampleData}
                      className="text-xs text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-lg border border-amber-200 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                      title="Isi textarea dengan contoh data siswa untuk mencoba"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      <span>Muat Contoh Data</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleCopyTemplate}
                      className="text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg border border-indigo-200 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      {copiedTemplate ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Tersalin!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Salin Format Tab/Excel</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
                <p className="text-[11px] text-slate-700 font-mono bg-white p-2 rounded-lg border border-slate-200">
                  NISN [Tab/Koma] Nama Siswa [Tab/Koma] Kelas (Opsional) [Tab/Koma] L/P (Opsional)
                </p>
                <p className="text-[11px] text-slate-500">
                  * Otomatis mengenali salinan tabel dari Microsoft Excel, Google Sheets, CSV koma, atau titik-koma (;).
                </p>
              </div>

              {/* Class Target & Overwrite Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-indigo-50/50 rounded-xl border border-indigo-100">
                <div>
                  <label className="block font-semibold text-slate-700 uppercase mb-1 text-[11px]">
                    Terapkan ke Kelas Tujuan:
                  </label>
                  <select
                    value={bulkTargetClassId}
                    onChange={(e) => {
                      setBulkTargetClassId(e.target.value);
                      handleParseBulkText(bulkInputText, e.target.value);
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="auto">Deteksi Otomatis dari Kolom Kelas Data</option>
                    {localClasses.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        Semua Siswa Masuk: {cls.name} (Tingkat {cls.gradeLevel})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center pt-2 sm:pt-4">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-medium select-none text-[11px]">
                    <input
                      type="checkbox"
                      checked={bulkOverwriteExisting}
                      onChange={(e) => setBulkOverwriteExisting(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                    />
                    <span>Perbarui / sinkronkan data jika NISN sudah terdaftar</span>
                  </label>
                </div>
              </div>

              {/* Textarea Input */}
              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1.5 text-[11px]">
                  Tempelkan Data Siswa di Bawah Ini:
                </label>
                <textarea
                  rows={6}
                  value={bulkInputText}
                  onChange={(e) => handleParseBulkText(e.target.value)}
                  placeholder="Contoh salinan Excel / Google Sheets:&#10;0081234001	Ahmad Dahlan	1A	L&#10;0081234002	Siti Fatimah	1A	P&#10;0081234003	Budi Santoso	4A	L"
                  className="w-full p-3 font-mono text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* Success Result Banner */}
              {bulkSuccessResult && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl flex items-center gap-2.5 animate-in fade-in">
                  <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <p className="font-bold">
                      ✔ Berhasil menyimpan {bulkSuccessResult.total} data siswa!
                    </p>
                    <p className="text-[11px] text-emerald-700">
                      {bulkSuccessResult.added} siswa baru ditambahkan, {bulkSuccessResult.updated} siswa diperbarui.
                    </p>
                  </div>
                </div>
              )}

              {/* Error Banner */}
              {bulkParseError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{bulkParseError}</span>
                </div>
              )}

              {/* Preview Parsed */}
              {bulkParsedStudents.length > 0 && !bulkSuccessResult && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-700">
                      ✔ Siap Disimpan: {bulkParsedStudents.length} Siswa Terdeteksi
                    </span>
                    <span className="text-slate-500 text-[11px]">
                      Periksa pratinjau sebelum menyimpan
                    </span>
                  </div>

                  <div className="max-h-44 overflow-y-auto border border-slate-200 rounded-xl shadow-2xs">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-700 sticky top-0">
                        <tr>
                          <th className="p-2 w-8">No</th>
                          <th className="p-2">NISN</th>
                          <th className="p-2">Nama</th>
                          <th className="p-2">Kelas</th>
                          <th className="p-2">L/P</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {bulkParsedStudents.slice(0, 20).map((st, i) => {
                          const classObj = localClasses.find(
                            (c) => c.id === st.classId || c.name.toLowerCase() === st.classId.toLowerCase()
                          );
                          return (
                            <tr key={i} className="hover:bg-slate-50">
                              <td className="p-2 text-slate-400 font-bold">{i + 1}</td>
                              <td className="p-2 font-mono font-bold text-slate-800">{st.nisn}</td>
                              <td className="p-2 font-semibold text-slate-800">{st.name}</td>
                              <td className="p-2 text-slate-600">
                                {classObj?.name || st.classId}
                              </td>
                              <td className="p-2">
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                    st.gender === 'P'
                                      ? 'bg-pink-100 text-pink-700'
                                      : 'bg-blue-100 text-blue-700'
                                  }`}
                                >
                                  {st.gender}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {bulkParsedStudents.length > 20 && (
                    <p className="text-[11px] text-slate-500 text-center">
                      ... dan {bulkParsedStudents.length - 20} siswa lainnya.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setIsBulkModalOpen(false);
                  setBulkSuccessResult(null);
                  setBulkParseError('');
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer"
              >
                {bulkSuccessResult ? 'Tutup' : 'Batal'}
              </button>
              <button
                type="button"
                onClick={handleConfirmBulkImport}
                disabled={bulkParsedStudents.length === 0 || isSavingBulk}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                {isSavingBulk ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Menyimpan ke Sistem...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Simpan {bulkParsedStudents.length} Siswa</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DEDICATED ADD / EDIT STUDENT MODAL DIALOG */}
      {isStudentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-linear-to-r from-slate-900 to-indigo-900 text-white">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/10 rounded-xl">
                  {editingStudent ? <Edit3 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-bold text-base">
                    {editingStudent ? 'Edit Data Siswa' : 'Tambah Siswa Baru'}
                  </h3>
                  <p className="text-xs text-slate-300">
                    {editingStudent
                      ? `Perbarui informasi peserta didik: ${editingStudent.name}`
                      : 'Masukkan data identitas siswa baru ke sistem CBT'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsStudentModalOpen(false);
                  setEditingStudent(null);
                }}
                className="p-2 text-white/80 hover:text-white rounded-lg hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1.5">
                  NISN / Nomor Induk Siswa <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={studentNisn}
                  onChange={(e) => setStudentNisn(e.target.value)}
                  placeholder="Contoh: 0071234001"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  NISN digunakan sebagai akun login bagi siswa saat membuka ujian.
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1.5">
                  Nama Lengkap Siswa <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="Contoh: Muhammad Rizky Pratama"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1.5">
                    Rombel / Kelas <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={studentClassId}
                    onChange={(e) => setStudentClassId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    {localClasses.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name} (Tingkat {cls.gradeLevel})
                      </option>
                    ))}
                    {/* Fallback if student has custom class ID */}
                    {studentClassId && !localClasses.some((c) => c.id === studentClassId) && (
                      <option value={studentClassId}>{studentClassId}</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1.5">
                    Jenis Kelamin <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setStudentGender('L')}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                        studentGender === 'L'
                          ? 'bg-blue-50 border-blue-400 text-blue-800 shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <span>L (Laki-laki)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setStudentGender('P')}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                        studentGender === 'P'
                          ? 'bg-pink-50 border-pink-400 text-pink-800 shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <span>P (Perempuan)</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setIsStudentModalOpen(false);
                  setEditingStudent(null);
                }}
                className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveStudent}
                disabled={isSavingStudent || !studentName.trim() || !studentNisn.trim()}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 cursor-pointer transition-all"
              >
                {isSavingStudent ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>{editingStudent ? 'Simpan Perubahan' : 'Tambahkan Siswa'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
