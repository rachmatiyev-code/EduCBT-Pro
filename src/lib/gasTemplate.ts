/**
 * EduCBT Pro - Google Apps Script (GAS) Serverless Cloud Backend
 * Solusi Full Database & Realtime Sync Tanpa Perlu Firebase (Full Sheets & Drive)
 * 
 * PANDUAN DEPLOY (HANYA 1 MENIT):
 * 1. Buka https://script.google.com/ lalu klik "Proyek Baru" (New project)
 * 2. Hapus seluruh isi kode bawaan, lalu TEMPEL (PASTE) SELURUH KODE DI BAWAH INI.
 * 3. Beri nama proyek di kiri atas: "EduCBT Cloud Database"
 * 4. Klik ikon Disket (Ctrl + S) untuk Menyimpan.
 * 5. Klik tombol biru "Deploy" (Terapkan) di kanan atas ➔ Pilih "New deployment" (Deployment baru).
 * 6. Klik ikon gerigi (Select type) ➔ Pilih "Web app" (Aplikasi Web).
 * 7. Konfigurasi Deployment (SANGAT PENTING):
 *    - Description: EduCBT Cloud Backend v2
 *    - Execute as: "Me" (Email Google Anda)
 *    - Who has access: "Anyone" (Siapa saja - agar semua perangkat siswa & guru dapat sinkron tanpa login Google)
 * 8. Klik "Deploy", lalu klik "Authorize access" ➔ Pilih Akun Google Anda ➔ Klik "Advanced" ➔ Klik "Go to EduCBT Cloud Database (unsafe)" ➔ Klik "Allow".
 * 9. Salin "Web app URL" (akhiran /exec) dan tempel ke menu "Integrasi Google Drive & Spreadsheet" di aplikasi EduCBT.
 */

export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * EduCBT Pro - Cloud Database Backend (Google Apps Script)
 * Versi: 2.5 (Full Firebase Replacement Edition)
 * Melayani: Siswa, Guru, Bank Soal, Sesi Ujian, Live Monitoring, dan Hasil Ujian
 */

const FOLDER_NAME = "EduCBT_Cloud_Database";
const SPREADSHEET_NAME = "EduCBT_Master_Database";

// Mendapatkan atau membuat folder khusus di Google Drive
function getOrCreateFolder(name) {
  var folders = DriveApp.getFoldersByName(name);
  if (folders.hasNext()) {
    return folders.next();
  }
  return DriveApp.createFolder(name);
}

// Mendapatkan atau membuat Spreadsheet master di Google Drive
function getOrCreateMasterSpreadsheet() {
  var folder = getOrCreateFolder(FOLDER_NAME);
  var files = folder.getFilesByName(SPREADSHEET_NAME);
  if (files.hasNext()) {
    return SpreadsheetApp.openById(files.next().getId());
  }
  
  var ss = SpreadsheetApp.create(SPREADSHEET_NAME);
  var file = DriveApp.getFileById(ss.getId());
  folder.addFile(file);
  DriveApp.getRootFolder().removeFile(file);
  
  setupAllSheets(ss);
  return ss;
}

// Menyiapkan seluruh lembar kerja (Sheets) dan header
function setupAllSheets(ss) {
  var requiredSheets = [
    "Students", 
    "Teachers", 
    "Classes", 
    "Subjects", 
    "Question_Banks", 
    "Sessions", 
    "Live_Monitoring", 
    "Submissions", 
    "School_Profile"
  ];
  
  requiredSheets.forEach(function(sName) {
    var sheet = ss.getSheetByName(sName);
    if (!sheet) {
      sheet = ss.insertSheet(sName);
    }
  });

  // Hapus sheet default "Sheet1" jika ada
  var defaultSheet = ss.getSheetByName("Sheet1") || ss.getSheetByName("Sheet 1");
  if (defaultSheet && ss.getSheets().length > 1) {
    try { ss.deleteSheet(defaultSheet); } catch(e) {}
  }

  // 1. Sheet Students
  var sSheet = ss.getSheetByName("Students");
  if (sSheet.getLastRow() === 0) {
    sSheet.appendRow(["ID Siswa", "NISN", "Nama Lengkap", "ID Kelas", "Jenis Kelamin", "Kata Sandi", "Terakhir Diperbarui"]);
    sSheet.getRange(1, 1, 1, 7).setFontWeight("bold").setBackground("#dbeafe");
    sSheet.setFrozenRows(1);
    // Tambahkan contoh siswa awal (termasuk NISN 1)
    sSheet.appendRow(["STD-000", "1", "Siswa Percobaan (NISN 1)", "CLS-12A", "L", "1234", new Date().toISOString()]);
    sSheet.appendRow(["STD-001", "0071234001", "Aditya Pratama Putra", "CLS-12A", "L", "1234", new Date().toISOString()]);
  }

  // 2. Sheet Teachers
  var tSheet = ss.getSheetByName("Teachers");
  if (tSheet.getLastRow() === 0) {
    tSheet.appendRow(["ID Guru", "Nama Lengkap", "NIP", "Email", "Role", "Mapel IDs (JSON)", "Kata Sandi", "Terakhir Diperbarui"]);
    tSheet.getRange(1, 1, 1, 8).setFontWeight("bold").setBackground("#fef3c7");
    tSheet.setFrozenRows(1);
    tSheet.appendRow(["T01", "Dr. Siti Nurhaliza, M.Pd.", "19750918 200212 2 001", "siti.nurhaliza@sman1prestasibangsa.sch.id", "admin", "[]", "1234", new Date().toISOString()]);
  }

  // 3. Sheet Classes
  var cSheet = ss.getSheetByName("Classes");
  if (cSheet.getLastRow() === 0) {
    cSheet.appendRow(["ID Kelas", "Nama Kelas / Rombel", "Tingkat"]);
    cSheet.getRange(1, 1, 1, 3).setFontWeight("bold").setBackground("#e0e7ff");
    cSheet.setFrozenRows(1);
    cSheet.appendRow(["CLS-10A", "X MIPA 1", "10"]);
    cSheet.appendRow(["CLS-11A", "XI MIPA 1", "11"]);
    cSheet.appendRow(["CLS-12A", "XII MIPA 1", "12"]);
  }

  // 4. Sheet Subjects
  var subSheet = ss.getSheetByName("Subjects");
  if (subSheet.getLastRow() === 0) {
    subSheet.appendRow(["ID Mapel", "Kode", "Nama Mata Pelajaran", "KKM", "Guru Pengampu"]);
    subSheet.getRange(1, 1, 1, 5).setFontWeight("bold").setBackground("#f3e8ff");
    subSheet.setFrozenRows(1);
    subSheet.appendRow(["SUB-01", "BIN", "Bahasa Indonesia", 75, "Dr. Siti Nurhaliza, M.Pd."]);
    subSheet.appendRow(["SUB-03", "MAT", "Matematika Wajib", 78, "Ahmad Fauzi, S.Pd., M.Si."]);
  }

  // 5. Sheet Question_Banks
  var qbSheet = ss.getSheetByName("Question_Banks");
  if (qbSheet.getLastRow() === 0) {
    qbSheet.appendRow(["ID Bank", "Judul", "ID Mapel", "Tingkat", "ID Guru", "Jumlah Soal", "Durasi (Menit)", "KKM", "Data Soal Lengkap (JSON)", "Terakhir Diperbarui"]);
    qbSheet.getRange(1, 1, 1, 10).setFontWeight("bold").setBackground("#ccfbf1");
    qbSheet.setFrozenRows(1);
  }

  // 6. Sheet Sessions
  var sesSheet = ss.getSheetByName("Sessions");
  if (sesSheet.getLastRow() === 0) {
    sesSheet.appendRow(["ID Sesi", "ID Bank", "Token Sesi", "Judul Ujian", "Target Kelas (JSON)", "Waktu Mulai", "Waktu Selesai", "Durasi", "Acak Soal", "Acak Opsi", "Anti Curang", "Status", "Terakhir Diperbarui"]);
    sesSheet.getRange(1, 1, 1, 13).setFontWeight("bold").setBackground("#fed7aa");
    sesSheet.setFrozenRows(1);
    sesSheet.appendRow(["SES-001", "BANK-001", "CBT-2026", "Simulasi Ujian Sumatif Sekolah", '["CLS-10A","CLS-11A","CLS-12A"]', new Date().toISOString(), "", 60, true, true, true, "active", new Date().toISOString()]);
  }

  // 7. Sheet Live_Monitoring (Realtime Device Tracker)
  var lmSheet = ss.getSheetByName("Live_Monitoring");
  if (lmSheet.getLastRow() === 0) {
    lmSheet.appendRow(["Token Sesi", "NISN", "Nama Siswa", "Kelas", "Soal Ke", "Terjawab", "Total Soal", "Pindah Tab (Pelanggaran)", "Gadget / Perangkat", "Baterai (%)", "Status", "Timestamp Ping", "Last Ping (Epoch ms)"]);
    lmSheet.getRange(1, 1, 1, 13).setFontWeight("bold").setBackground("#bbf7d0");
    lmSheet.setFrozenRows(1);
  }

  // 8. Sheet Submissions (Hasil Rekap Nilai Ujian)
  var submMast = ss.getSheetByName("Submissions");
  if (submMast.getLastRow() === 0) {
    submMast.appendRow([
      "Timestamp", "ID Submisi", "Token Sesi", "NISN", "Nama Siswa", 
      "Kelas", "Skor Total", "Skor Maksimal", "Persentase (%)", 
      "Status Kelulusan", "Pindah Tab", "Durasi (Detik)", "Jawaban Detail (JSON)"
    ]);
    submMast.getRange(1, 1, 1, 13).setFontWeight("bold").setBackground("#e2e8f0");
    submMast.setFrozenRows(1);
  }

  // 9. Sheet School_Profile
  var spSheet = ss.getSheetByName("School_Profile");
  if (spSheet.getLastRow() === 0) {
    spSheet.appendRow(["Key", "Value"]);
    spSheet.getRange(1, 1, 1, 2).setFontWeight("bold").setBackground("#e2e8f0");
    spSheet.appendRow(["name", "SMA Negeri 1 Prestasi Bangsa"]);
    spSheet.appendRow(["npsn", "20108922"]);
    spSheet.appendRow(["principalName", "Drs. H. Bambang Sugiarto, M.Pd."]);
    spSheet.appendRow(["principalNip", "19680512 199403 1 004"]);
    spSheet.appendRow(["academicYear", "2026/2027"]);
    spSheet.appendRow(["semester", "Ganjil"]);
  }
}

// HELPER: Output JSON atau JSONP
function createOutput(data, callback) {
  var jsonStr = JSON.stringify(data);
  if (callback) {
    return ContentService.createTextOutput(callback + "(" + jsonStr + ")")
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(jsonStr)
    .setMimeType(ContentService.MimeType.JSON);
}

// ==========================================
// API GET HANDLER
// ==========================================
function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || "ping";
  var callback = e && e.parameter && e.parameter.callback;
  var sessionCode = (e && e.parameter && e.parameter.sessionCode) || "";

  var ss = getOrCreateMasterSpreadsheet();

  // 1. Ping / Healthcheck
  if (action === "ping") {
    return createOutput({
      status: "success",
      message: "EduCBT Cloud Database (GAS) aktif & online!",
      spreadsheetUrl: ss.getUrl(),
      timestamp: new Date().toISOString()
    }, callback);
  }

  // 2. Tarik Seluruh Data Master (getAllData / pullData)
  if (action === "getAllData" || action === "pullData" || action === "pullAllData") {
    var result = {
      status: "success",
      schoolProfile: {},
      teachers: [],
      students: [],
      classes: [],
      subjects: [],
      questionBanks: [],
      examSessions: [],
      submissions: []
    };

    // Baca Profil Sekolah
    var spSheet = ss.getSheetByName("School_Profile");
    if (spSheet && spSheet.getLastRow() > 1) {
      var spData = spSheet.getRange(2, 1, spSheet.getLastRow() - 1, 2).getValues();
      spData.forEach(function(row) {
        if (row[0]) result.schoolProfile[row[0]] = row[1];
      });
    }

    // Baca Siswa
    var sSheet = ss.getSheetByName("Students");
    if (sSheet && sSheet.getLastRow() > 1) {
      var sRows = sSheet.getRange(2, 1, sSheet.getLastRow() - 1, 7).getValues();
      result.students = sRows.map(function(r) {
        return {
          id: String(r[0]),
          nisn: String(r[1]).trim(),
          name: String(r[2]),
          classId: String(r[3]),
          gender: String(r[4]) || "L",
          password: String(r[5]) || "1234"
        };
      }).filter(function(s) { return s.nisn; });
    }

    // Baca Guru
    var tSheet = ss.getSheetByName("Teachers");
    if (tSheet && tSheet.getLastRow() > 1) {
      var tRows = tSheet.getRange(2, 1, tSheet.getLastRow() - 1, 7).getValues();
      result.teachers = tRows.map(function(r) {
        var subjectIds = [];
        try { subjectIds = JSON.parse(r[5]); } catch(e) {}
        return {
          id: String(r[0]),
          name: String(r[1]),
          nip: String(r[2]),
          email: String(r[3]),
          role: String(r[4]) || "guru",
          subjectIds: Array.isArray(subjectIds) ? subjectIds : [],
          password: String(r[6]) || "1234"
        };
      });
    }

    // Baca Kelas
    var cSheet = ss.getSheetByName("Classes");
    if (cSheet && cSheet.getLastRow() > 1) {
      var cRows = cSheet.getRange(2, 1, cSheet.getLastRow() - 1, 3).getValues();
      result.classes = cRows.map(function(r) {
        return { id: String(r[0]), name: String(r[1]), gradeLevel: String(r[2]) };
      });
    }

    // Baca Mapel
    var subSheet = ss.getSheetByName("Subjects");
    if (subSheet && subSheet.getLastRow() > 1) {
      var subRows = subSheet.getRange(2, 1, subSheet.getLastRow() - 1, 5).getValues();
      result.subjects = subRows.map(function(r) {
        return { id: String(r[0]), code: String(r[1]), name: String(r[2]), kkm: Number(r[3]) || 75, teacherName: String(r[4]) };
      });
    }

    // Baca Bank Soal
    var qbSheet = ss.getSheetByName("Question_Banks");
    if (qbSheet && qbSheet.getLastRow() > 1) {
      var qbRows = qbSheet.getRange(2, 1, qbSheet.getLastRow() - 1, 10).getValues();
      result.questionBanks = qbRows.map(function(r) {
        var questions = [];
        try { questions = JSON.parse(r[8]); } catch(e) {}
        return {
          id: String(r[0]),
          title: String(r[1]),
          subjectId: String(r[2]),
          gradeLevel: String(r[3]),
          teacherId: String(r[4]),
          totalQuestions: Number(r[5]) || (Array.isArray(questions) ? questions.length : 0),
          durationMinutes: Number(r[6]) || 60,
          passingScore: Number(r[7]) || 75,
          questions: Array.isArray(questions) ? questions : []
        };
      });
    }

    // Baca Sesi Ujian
    var sesSheet = ss.getSheetByName("Sessions");
    if (sesSheet && sesSheet.getLastRow() > 1) {
      var sesRows = sesSheet.getRange(2, 1, sesSheet.getLastRow() - 1, 13).getValues();
      result.examSessions = sesRows.map(function(r) {
        var targetClassIds = [];
        try { targetClassIds = JSON.parse(r[4]); } catch(e) {}
        return {
          id: String(r[0]),
          bankId: String(r[1]),
          sessionCode: String(r[2]).trim().toUpperCase(),
          title: String(r[3]),
          targetClassIds: Array.isArray(targetClassIds) ? targetClassIds : [],
          startTime: String(r[5] || ""),
          endTime: String(r[6] || ""),
          durationMinutes: Number(r[7]) || 60,
          shuffleQuestions: Boolean(r[8]),
          shuffleOptions: Boolean(r[9]),
          antiCheatEnabled: Boolean(r[10]),
          status: String(r[11]) || "active"
        };
      });
    }

    return createOutput(result, callback);
  }

  // 3. Tarik Live Monitoring Devices
  if (action === "getLiveMonitoring") {
    var lmSheet = ss.getSheetByName("Live_Monitoring");
    var list = [];
    var nowMs = new Date().getTime();
    if (lmSheet && lmSheet.getLastRow() > 1) {
      var rows = lmSheet.getRange(2, 1, lmSheet.getLastRow() - 1, 13).getValues();
      list = rows.map(function(r) {
        var lastPingMs = Number(r[12]) || 0;
        var isOnline = (nowMs - lastPingMs) < 45000;
        return {
          sessionCode: String(r[0]).trim().toUpperCase(),
          studentId: String(r[1]).trim(),
          studentName: String(r[2]),
          classId: String(r[3]),
          currentQuestionIndex: Number(r[4]) || 1,
          answeredCount: Number(r[5]) || 0,
          totalQuestions: Number(r[6]) || 1,
          tabBlurCount: Number(r[7]) || 0,
          device: String(r[8]) || "Web",
          batteryLevel: r[9] ? Number(r[9]) : undefined,
          status: String(r[10]) || (isOnline ? "active" : "offline"),
          lastPing: lastPingMs,
          isOnline: isOnline
        };
      });

      if (sessionCode && sessionCode.toUpperCase() !== "ALL") {
        list = list.filter(function(x) { return x.sessionCode === sessionCode.trim().toUpperCase(); });
      }
    }

    return createOutput({ status: "success", liveList: list }, callback);
  }

  return createOutput({ status: "success", action: action, timestamp: new Date().toISOString() }, callback);
}

// ==========================================
// API POST HANDLER (Tulis & Sinkronkan Data)
// ==========================================
function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(15000);

  try {
    var data = {};
    if (e && e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (err) {
        data = {};
      }
    }

    var action = data.action || (e && e.parameter && e.parameter.action) || "ping";
    var ss = getOrCreateMasterSpreadsheet();

    // 1. Ping
    if (action === "ping") {
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        message: "Koneksi Google Apps Script berhasil terverifikasi!",
        timestamp: new Date().toISOString()
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 2. Realtime Proctor Heartbeat (Device Presence)
    if (action === "heartbeat" || action === "sendProctorHeartbeat") {
      var ping = data.payload || data.heartbeat || data;
      var sessionCode = String(ping.sessionCode || "").trim().toUpperCase();
      var studentId = String(ping.studentId || "").trim();
      var studentName = String(ping.studentName || "Siswa");
      var classId = String(ping.classId || "-");
      var nowMs = new Date().getTime();
      var nowIso = new Date().toISOString();

      if (sessionCode && studentId) {
        var lmSheet = ss.getSheetByName("Live_Monitoring");
        var foundRow = -1;
        var lastRow = lmSheet.getLastRow();
        if (lastRow > 1) {
          var codesAndIds = lmSheet.getRange(2, 1, lastRow - 1, 2).getValues();
          for (var i = 0; i < codesAndIds.length; i++) {
            if (String(codesAndIds[i][0]).trim().toUpperCase() === sessionCode &&
                String(codesAndIds[i][1]).trim() === studentId) {
              foundRow = i + 2;
              break;
            }
          }
        }

        var rowValues = [
          sessionCode,
          studentId,
          studentName,
          classId,
          Number(ping.currentQuestionIndex) || 1,
          Number(ping.answeredCount) || 0,
          Number(ping.totalQuestions) || 1,
          Number(ping.tabBlurCount) || 0,
          String(ping.device || "Web"),
          ping.batteryLevel !== undefined ? Number(ping.batteryLevel) : "-",
          String(ping.status || "active"),
          nowIso,
          nowMs
        ];

        if (foundRow > 0) {
          lmSheet.getRange(foundRow, 1, 1, 13).setValues([rowValues]);
        } else {
          lmSheet.appendRow(rowValues);
        }
      }

      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        message: "Heartbeat device tercatat secara realtime!"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 3. Simpan Hasil Ujian Siswa (recordSubmission)
    if (action === "recordSubmission") {
      var sub = data.submission || {};
      var subSheet = ss.getSheetByName("Submissions");
      
      subSheet.appendRow([
        new Date().toISOString(),
        sub.id || ("SUB-" + new Date().getTime()),
        String(sub.sessionCode || "-").trim().toUpperCase(),
        String(sub.studentId || "-").trim(),
        sub.studentName || "Siswa",
        sub.studentClass || "-",
        sub.totalScore || 0,
        sub.maxPossibleScore || 100,
        sub.scorePercentage || 0,
        sub.isPassed ? "TUNTAS" : "BELUM TUNTAS",
        sub.tabBlurCount || 0,
        sub.durationTakenSeconds || 0,
        JSON.stringify(sub.answers || {})
      ]);

      // Tandai juga status submitted di sheet Live_Monitoring
      var lmSheet = ss.getSheetByName("Live_Monitoring");
      var sCode = String(sub.sessionCode || "").trim().toUpperCase();
      var sId = String(sub.studentId || "").trim();
      if (lmSheet && sCode && sId && lmSheet.getLastRow() > 1) {
        var codesAndIds = lmSheet.getRange(2, 1, lmSheet.getLastRow() - 1, 2).getValues();
        for (var k = 0; k < codesAndIds.length; k++) {
          if (String(codesAndIds[k][0]).trim().toUpperCase() === sCode &&
              String(codesAndIds[k][1]).trim() === sId) {
            lmSheet.getRange(k + 2, 11).setValue("submitted");
            break;
          }
        }
      }
      
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        message: "Data submisi tersimpan permanen di Google Sheets!",
        submissionId: sub.id
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 4. Sinkronisasi Penuh Seluruh Database (syncAllData / backupAllData)
    if (action === "syncAllData" || action === "backupAllData") {
      var payload = data.payload || {};
      
      // Simpan backup file JSON di Google Drive Folder
      var folder = getOrCreateFolder(FOLDER_NAME);
      folder.createFile("Backup_EduCBT_Latest.json", JSON.stringify(payload, null, 2), MimeType.PLAIN_TEXT);

      // Sinkronkan data siswa ke Sheet Students jika dikirimkan
      if (Array.isArray(payload.students) && payload.students.length > 0) {
        var sSheet = ss.getSheetByName("Students");
        if (sSheet) {
          if (sSheet.getLastRow() > 1) {
            sSheet.deleteRows(2, sSheet.getLastRow() - 1);
          }
          var sRows = payload.students.map(function(s) {
            return [
              s.id || ("STD-" + new Date().getTime()),
              String(s.nisn || "").trim(),
              s.name || "",
              s.classId || "",
              s.gender || "L",
              s.password || "1234",
              new Date().toISOString()
            ];
          });
          if (sRows.length > 0) {
            sSheet.getRange(2, 1, sRows.length, 7).setValues(sRows);
          }
        }
      }

      // Sinkronkan data guru
      if (Array.isArray(payload.teachers) && payload.teachers.length > 0) {
        var tSheet = ss.getSheetByName("Teachers");
        if (tSheet) {
          if (tSheet.getLastRow() > 1) tSheet.deleteRows(2, tSheet.getLastRow() - 1);
          var tRows = payload.teachers.map(function(t) {
            return [
              t.id || "",
              t.name || "",
              t.nip || "-",
              t.email || "",
              t.role || "guru",
              JSON.stringify(t.subjectIds || []),
              t.password || "1234",
              new Date().toISOString()
            ];
          });
          if (tRows.length > 0) tSheet.getRange(2, 1, tRows.length, 8).setValues(tRows);
        }
      }

      // Sinkronkan Bank Soal
      if (Array.isArray(payload.questionBanks) && payload.questionBanks.length > 0) {
        var qbSheet = ss.getSheetByName("Question_Banks");
        if (qbSheet) {
          if (qbSheet.getLastRow() > 1) qbSheet.deleteRows(2, qbSheet.getLastRow() - 1);
          var qbRows = payload.questionBanks.map(function(b) {
            return [
              b.id || "",
              b.title || "",
              b.subjectId || "",
              b.gradeLevel || "",
              b.teacherId || "",
              b.totalQuestions || (Array.isArray(b.questions) ? b.questions.length : 0),
              b.durationMinutes || 60,
              b.passingScore || 75,
              JSON.stringify(b.questions || []),
              new Date().toISOString()
            ];
          });
          if (qbRows.length > 0) qbSheet.getRange(2, 1, qbRows.length, 10).setValues(qbRows);
        }
      }

      // Sinkronkan Sesi Ujian
      if (Array.isArray(payload.examSessions) && payload.examSessions.length > 0) {
        var sesSheet = ss.getSheetByName("Sessions");
        if (sesSheet) {
          if (sesSheet.getLastRow() > 1) sesSheet.deleteRows(2, sesSheet.getLastRow() - 1);
          var sesRows = payload.examSessions.map(function(s) {
            return [
              s.id || "",
              s.bankId || "",
              String(s.sessionCode || "").trim().toUpperCase(),
              s.title || "",
              JSON.stringify(s.targetClassIds || []),
              s.startTime || "",
              s.endTime || "",
              s.durationMinutes || 60,
              s.shuffleQuestions ? 1 : 0,
              s.shuffleOptions ? 1 : 0,
              s.antiCheatEnabled ? 1 : 0,
              s.status || "active",
              new Date().toISOString()
            ];
          });
          if (sesRows.length > 0) sesSheet.getRange(2, 1, sesRows.length, 13).setValues(sesRows);
        }
      }

      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        message: "Seluruh database berhasil disinkronkan ke Google Sheets & Drive!"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      action: action,
      timestamp: new Date().toISOString()
    })).setMimeType(ContentService.MimeType.JSON);

  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}
`;
