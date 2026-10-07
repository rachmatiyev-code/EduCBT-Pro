export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * EduCBT Pro - Google Apps Script (GAS) Backend Connector
 * Penyimpanan Data Terpusat di Google Drive & Google Sheets
 * 
 * CARA DEPLOY:
 * 1. Buka https://script.google.com/ lalu buat Proyek Baru ("EduCBT Pro Cloud")
 * 2. Hapus seluruh isi kode bawaan, lalu paste (tempel) seluruh kode ini.
 * 3. Klik tombol "Deploy" (Terapkan) di kanan atas -> Pilih "New deployment" (Deployment baru).
 * 4. Pilih tipe: "Web app" (Aplikasi Web).
 * 5. Pengaturan:
 *    - Description: EduCBT Webhook
 *    - Execute as: "Me" (Email Google Anda)
 *    - Who has access: "Anyone" (Siapa saja - agar aplikasi ujian siswa dapat mengirim data)
 * 6. Klik "Deploy", izinkan hak akses Google Drive & Spreadsheet.
 * 7. Salin "Web app URL" (akhiran /exec) dan tempelkan ke menu "Integrasi GDrive & Sheets" di aplikasi EduCBT.
 */

const FOLDER_NAME = "EduCBT_Cloud_Database";
const MEDIA_FOLDER_NAME = "EduCBT_Media_Assets";
const SPREADSHEET_NAME = "EduCBT_Master_Database";

// Mendapatkan atau membuat folder khusus terpusat di Google Drive
function getOrCreateFolder(name, parentFolder) {
  var folders = parentFolder ? parentFolder.getFoldersByName(name) : DriveApp.getFoldersByName(name);
  if (folders.hasNext()) {
    return folders.next();
  }
  return parentFolder ? parentFolder.createFolder(name) : DriveApp.createFolder(name);
}

// Mendapatkan atau membuat Spreadsheet master di dalam folder khusus
function getOrCreateMasterSpreadsheet() {
  var folder = getOrCreateFolder(FOLDER_NAME);
  var files = folder.getFilesByName(SPREADSHEET_NAME);
  if (files.hasNext()) {
    var file = files.next();
    return SpreadsheetApp.openById(file.getId());
  }
  
  var ss = SpreadsheetApp.create(SPREADSHEET_NAME);
  var file = DriveApp.getFileById(ss.getId());
  folder.addFile(file);
  DriveApp.getRootFolder().removeFile(file);
  
  // Siapkan sheet
  setupInitialSheets(ss);
  return ss;
}

function setupInitialSheets(ss) {
  var sheets = ["Submissions", "Question_Banks", "Sessions", "Live_Monitoring", "School_Profile"];
  sheets.forEach(function(sName) {
    var sheet = ss.getSheetByName(sName);
    if (!sheet) {
      sheet = ss.insertSheet(sName);
    }
  });
  
  // Format header Submissions
  var subSheet = ss.getSheetByName("Submissions");
  if (subSheet.getLastRow() === 0) {
    subSheet.appendRow([
      "Timestamp", "ID Submisi", "Token Sesi", "NISN", "Nama Siswa", 
      "Kelas", "Skor Total", "Skor Maksimal", "Persentase (%)", 
      "Status Kelulusan", "Pindah Tab (Pelanggaran)", "Durasi (Detik)", "Jawaban Detail (JSON)"
    ]);
    subSheet.getRange(1, 1, 1, 13).setFontWeight("bold").setBackground("#e2e8f0");
  }
}

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || "ping";
  
  if (action === "ping") {
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "EduCBT GAS Backend is connected and online!",
      timestamp: new Date().toISOString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  return ContentService.createTextOutput(JSON.stringify({ status: "success", action: action }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);
  
  try {
    var data = JSON.parse(e.postData.contents);
    var action = data.action;
    var ss = getOrCreateMasterSpreadsheet();
    
    if (action === "recordSubmission") {
      var sub = data.submission;
      var subSheet = ss.getSheetByName("Submissions");
      
      subSheet.appendRow([
        new Date().toISOString(),
        sub.id || "",
        sub.sessionCode || "",
        sub.studentId || "",
        sub.studentName || "",
        sub.studentClass || "",
        sub.totalScore || 0,
        sub.maxPossibleScore || 100,
        sub.scorePercentage || 0,
        sub.isPassed ? "TUNTAS" : "BELUM TUNTAS",
        sub.tabBlurCount || 0,
        sub.durationTakenSeconds || 0,
        JSON.stringify(sub.answers || {})
      ]);
      
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        message: "Data ujian siswa berhasil tersimpan di Google Sheets dan Google Drive!",
        submissionId: sub.id
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    if (action === "backupAllData") {
      var folder = getOrCreateFolder(FOLDER_NAME);
      var backupFileName = "Backup_EduCBT_" + new Date().getTime() + ".json";
      folder.createFile(backupFileName, JSON.stringify(data.payload, null, 2), MimeType.PLAIN_TEXT);
      
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        message: "Backup lengkap berhasil disimpan di folder EduCBT_Cloud_Database di GDrive."
      })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ status: "ok" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}
`;
