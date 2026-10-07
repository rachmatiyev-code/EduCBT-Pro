import React, { useState } from 'react';
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

  // Selected students state (Fitur Pilih)
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  // Student Add / Edit Form State
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [studentNisn, setStudentNisn] = useState('');
  const [studentName, setStudentName] = useState('');
  const [studentClassId, setStudentClassId] = useState(classes[0]?.id || '');
  const [studentGender, setStudentGender] = useState<'L' | 'P'>('L');

  // Bulk Import Students State
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkInputText, setBulkInputText] = useState('');
  const [bulkParsedStudents, setBulkParsedStudents] = useState<
    { nisn: string; name: string; classId: string; gender: 'L' | 'P' }[]
  >([]);
  const [bulkParseError, setBulkParseError] = useState('');
  const [copiedTemplate, setCopiedTemplate] = useState(false);

  // Class Form State
  const [isAddingClass, setIsAddingClass] = useState(false);
  const [className, setClassName] = useState('');
  const [classGrade, setClassGrade] = useState('1'); // Default to SD

  // Subject Form State
  const [isAddingSubject, setIsAddingSubject] = useState(false);
  const [subjectCode, setSubjectCode] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [subjectKkm, setSubjectKkm] = useState(75);
  const [subjectTeacher, setSubjectTeacher] = useState(teachers[0]?.name || '');

  // Handlers for Student Single Add / Edit
  const handleOpenAddStudent = () => {
    setEditingStudent(null);
    setStudentNisn('');
    setStudentName('');
    setStudentClassId(classes[0]?.id || '');
    setStudentGender('L');
    setIsAddingStudent(true);
  };

  const handleOpenEditStudent = (st: Student) => {
    setEditingStudent(st);
    setStudentNisn(st.nisn);
    setStudentName(st.name);
    setStudentClassId(st.classId);
    setStudentGender(st.gender);
    setIsAddingStudent(true);
  };

  const handleSaveStudent = async () => {
    if (!studentNisn.trim() || !studentName.trim()) {
      alert('NISN dan Nama Siswa wajib diisi!');
      return;
    }

    let updated: Student[];
    if (editingStudent) {
      updated = students.map((s) =>
        s.id === editingStudent.id
          ? {
              ...s,
              nisn: studentNisn.trim(),
              name: studentName.trim(),
              classId: studentClassId,
              gender: studentGender,
            }
          : s
      );
    } else {
      const newStudent: Student = {
        id: `STD-${Date.now()}`,
        nisn: studentNisn.trim(),
        name: studentName.trim(),
        classId: studentClassId,
        gender: studentGender,
      };
      updated = [...students, newStudent];
    }

    await api.saveMasterData({ students: updated });
    onRefreshData();
    setIsAddingStudent(false);
    setEditingStudent(null);
    setStudentNisn('');
    setStudentName('');
  };

  const handleDeleteStudent = async (id: string) => {
    if (confirm('Yakin ingin menghapus data siswa ini?')) {
      const updated = students.filter((s) => s.id !== id);
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
      const updated = students.filter((s) => !selectedStudentIds.includes(s.id));
      setSelectedStudentIds([]);
      await api.saveMasterData({ students: updated });
      onRefreshData();
    }
  };

  // Bulk Import Parsing
  const handleParseBulkText = (text: string) => {
    setBulkInputText(text);
    setBulkParseError('');
    if (!text.trim()) {
      setBulkParsedStudents([]);
      return;
    }

    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const parsed: { nisn: string; name: string; classId: string; gender: 'L' | 'P' }[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Skip header if detected
      if (i === 0 && (line.toLowerCase().includes('nisn') || line.toLowerCase().includes('nama'))) {
        continue;
      }

      // Detect separator: tab (Excel paste), comma, or semicolon
      let parts: string[] = [];
      if (line.includes('\t')) {
        parts = line.split('\t').map((p) => p.trim());
      } else if (line.includes(';')) {
        parts = line.split(';').map((p) => p.trim());
      } else if (line.includes(',')) {
        parts = line.split(',').map((p) => p.trim());
      } else {
        parts = line.split(/\s{2,}/).map((p) => p.trim()); // 2 or more spaces
      }

      if (parts.length >= 2) {
        const nisnVal = parts[0].replace(/[^0-9]/g, '') || parts[0];
        const nameVal = parts[1];
        let classVal = parts[2] || classes[0]?.id || '1';
        let genderVal: 'L' | 'P' = 'L';
        if (parts[3]) {
          const g = parts[3].toUpperCase().trim();
          genderVal = g === 'P' || g === 'PEREMPUAN' || g === 'F' ? 'P' : 'L';
        }

        if (nisnVal && nameVal) {
          parsed.push({
            nisn: nisnVal,
            name: nameVal,
            classId: classVal,
            gender: genderVal,
          });
        }
      }
    }

    if (parsed.length === 0) {
      setBulkParseError(
        'Format data tidak dikenali. Pastikan minimal memiliki kolom NISN dan Nama Siswa (dipisah koma atau tab).'
      );
    }
    setBulkParsedStudents(parsed);
  };

  const handleConfirmBulkImport = async () => {
    if (bulkParsedStudents.length === 0) return;

    const newStudentObjects: Student[] = bulkParsedStudents.map((bp, idx) => ({
      id: `STD-BULK-${Date.now()}-${idx}`,
      nisn: bp.nisn,
      name: bp.name,
      classId: bp.classId,
      gender: bp.gender,
    }));

    // Avoid duplicate NISN if exists
    const existingNisns = new Set(students.map((s) => s.nisn));
    const finalNew = newStudentObjects.filter((s) => !existingNisns.has(s.nisn));

    const updated = [...students, ...finalNew];
    await api.saveMasterData({ students: updated });
    onRefreshData();
    setIsBulkModalOpen(false);
    setBulkInputText('');
    setBulkParsedStudents([]);
    alert(
      `Berhasil mengimpor ${finalNew.length} siswa baru! (${
        newStudentObjects.length - finalNew.length
      } data diabaikan karena NISN sudah terdaftar).`
    );
  };

  const handleCopyTemplate = () => {
    const template = `NISN,Nama Siswa,Kelas,Jenis Kelamin\n0081234001,Ahmad Dahlan,CLS-SD1A,L\n0081234002,Fatimah Azzahra,CLS-SD1A,P\n0081234003,Budi Santoso,CLS-SD4A,L\n0081234004,Siti Nurjanah,CLS-SD6A,P`;
    navigator.clipboard.writeText(template);
    setCopiedTemplate(true);
    setTimeout(() => setCopiedTemplate(false), 2000);
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
    const updated = [...classes, newClass];
    await api.saveMasterData({ classes: updated });
    onRefreshData();
    setIsAddingClass(false);
    setClassName('');
  };

  const handleDeleteClass = async (id: string) => {
    if (confirm('Hapus rombel/kelas ini? Siswa yang terhubung mungkin perlu dipindahkan.')) {
      const updated = classes.filter((c) => c.id !== id);
      await api.saveMasterData({ classes: updated });
      onRefreshData();
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
      teacherName: subjectTeacher,
    };
    const updated = [...subjects, newSubject];
    await api.saveMasterData({ subjects: updated });
    onRefreshData();
    setIsAddingSubject(false);
    setSubjectCode('');
    setSubjectName('');
  };

  const handleDeleteSubject = async (id: string) => {
    if (confirm('Hapus mata pelajaran ini?')) {
      const updated = subjects.filter((s) => s.id !== id);
      await api.saveMasterData({ subjects: updated });
      onRefreshData();
    }
  };

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.nisn.includes(searchTerm) ||
      s.classId.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            Data Siswa ({students.length})
          </button>
          <button
            onClick={() => setActiveTab('classes')}
            className={`px-3.5 py-1.5 rounded-lg transition-all ${
              activeTab === 'classes'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Kelas & Jenjang ({classes.length})
          </button>
          <button
            onClick={() => setActiveTab('subjects')}
            className={`px-3.5 py-1.5 rounded-lg transition-all ${
              activeTab === 'subjects'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Mata Pelajaran ({subjects.length})
          </button>
        </div>
      </div>

      {/* TAB 1: DATA SISWA */}
      {activeTab === 'students' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          {/* Top Toolbar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari NISN, nama, atau kelas..."
                className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => setIsBulkModalOpen(true)}
                className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-all flex-1 sm:flex-none"
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

          {/* Add / Edit Student Form */}
          {isAddingStudent && (
            <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-200 grid grid-cols-1 sm:grid-cols-4 gap-3 animate-in fade-in duration-150">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                  NISN / Nomor Induk
                </label>
                <input
                  type="text"
                  value={studentNisn}
                  onChange={(e) => setStudentNisn(e.target.value)}
                  placeholder="0071234..."
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                  Nama Lengkap Siswa
                </label>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="Nama peserta..."
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                  Rombel / Kelas
                </label>
                <select
                  value={studentClassId}
                  onChange={(e) => setStudentClassId(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                >
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} (Tingkat {cls.gradeLevel})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end gap-2">
                <button
                  type="button"
                  onClick={handleSaveStudent}
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                >
                  {editingStudent ? 'Simpan Perubahan' : 'Simpan Siswa'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingStudent(false);
                    setEditingStudent(null);
                  }}
                  className="px-3 py-2 bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
                >
                  Batal
                </button>
              </div>
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
                    const classInfo = classes.find((c) => c.id === s.classId);

                    return (
                      <tr
                        key={s.id}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          isSelected ? 'bg-indigo-50/40' : ''
                        }`}
                      >
                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleSelectStudent(s.id)}
                            className="p-1"
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
                        <td className="py-3 px-4 font-semibold text-slate-800">{s.name}</td>
                        <td className="py-3 px-4 text-slate-600">
                          {classInfo?.name || s.classId}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                              s.gender === 'P'
                                ? 'bg-pink-50 text-pink-700'
                                : 'bg-blue-50 text-blue-700'
                            }`}
                          >
                            {s.gender}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpenEditStudent(s)}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="Edit siswa"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteStudent(s.id)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Hapus siswa"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">
                Daftar Rombongan Belajar (Kelas SD, SMP, SMA/SMK)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Mendukung fase kurikulum Sekolah Dasar (Kelas 1–6), SMP (Kelas 7–9), dan SMA (Kelas 10–12)
              </p>
            </div>
            <button
              onClick={() => setIsAddingClass(true)}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Kelas</span>
            </button>
          </div>

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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            {classes.map((c) => {
              const studentCount = students.filter((s) => s.classId === c.id).length;
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
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Hapus kelas"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: DATA MATA PELAJARAN */}
      {activeTab === 'subjects' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-sm">Daftar Mata Pelajaran & KKM</h3>
            <button
              onClick={() => setIsAddingSubject(true)}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Mapel</span>
            </button>
          </div>

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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {subjects.map((s) => (
              <div
                key={s.id}
                className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-indigo-300 transition-all flex flex-col justify-between space-y-3"
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
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Hapus mapel"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
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
                onClick={() => setIsBulkModalOpen(false)}
                className="p-2 text-white/80 hover:text-white rounded-lg hover:bg-white/20"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700">Format Kolom yang Didukung:</span>
                  <button
                    type="button"
                    onClick={handleCopyTemplate}
                    className="text-indigo-600 hover:underline font-semibold flex items-center gap-1"
                  >
                    {copiedTemplate ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Contoh Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin Contoh Format</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-slate-600 font-mono bg-white p-2 rounded-lg border border-slate-200">
                  NISN, Nama Lengkap Siswa, ID/Nama Kelas, Jenis Kelamin (L/P)
                </p>
                <p className="text-[11px] text-slate-500">
                  * Bisa dipisahkan tanda koma (,), titik koma (;), atau langsung copy-paste tabel Excel (Tab).
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1.5">
                  Tempelkan Data Teks Siswa di Bawah Ini:
                </label>
                <textarea
                  rows={6}
                  value={bulkInputText}
                  onChange={(e) => handleParseBulkText(e.target.value)}
                  placeholder="Contoh:&#10;0081234001, Ahmad Dahlan, CLS-SD1A, L&#10;0081234002, Siti Fatimah, CLS-SD1A, P&#10;0081234003, Budi Santoso, CLS-SD4A, L"
                  className="w-full p-3 font-mono text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {bulkParseError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{bulkParseError}</span>
                </div>
              )}

              {/* Preview Parsed */}
              {bulkParsedStudents.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-700">
                      ✔ Siap Diimpor: {bulkParsedStudents.length} Siswa Terdeteksi
                    </span>
                    <span className="text-slate-500 text-[11px]">
                      Periksa pratinjau sebelum menyimpan
                    </span>
                  </div>

                  <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-700 sticky top-0">
                        <tr>
                          <th className="p-2">NISN</th>
                          <th className="p-2">Nama</th>
                          <th className="p-2">Kelas</th>
                          <th className="p-2">L/P</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {bulkParsedStudents.slice(0, 15).map((st, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="p-2 font-mono">{st.nisn}</td>
                            <td className="p-2 font-semibold">{st.name}</td>
                            <td className="p-2">{st.classId}</td>
                            <td className="p-2">{st.gender}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {bulkParsedStudents.length > 15 && (
                    <p className="text-[11px] text-slate-500 text-center">
                      ... dan {bulkParsedStudents.length - 15} siswa lainnya.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={() => setIsBulkModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmBulkImport}
                disabled={bulkParsedStudents.length === 0}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Simpan {bulkParsedStudents.length} Siswa</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
