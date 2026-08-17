/**
 * GOOGLE APPS SCRIPT BACKEND FOR UKD QUEST GAME
 * ID Google Sheet: 1jc5nOgZOQg0BV-KzQikKFcJ3-s2CiukfJGtjWg221FM
 * 
 * Instruksi Deployment:
 * 1. Buka Google Sheet (ID: 1jc5nOgZOQg0BV-KzQikKFcJ3-s2CiukfJGtjWg221FM)
 * 2. Klik Ekstensi > Apps Script
 * 3. Hapus kode bawaan, lalu salin & tempel kode di bawah ini
 * 4. Klik "Terapkan" (Deploy) > "Terapkan sebagai Web App" (New deployment)
 * 5. Setel "Jalankan sebagai": Saya (Execute as me)
 * 6. Setel "Siapa yang memiliki akses": Siapa saja (Anyone)
 * 7. Salin URL Web App yang dihasilkan dan tempelkan ke menu "Integrasi Google Sheet" di aplikasi web.
 */

const SPREADSHEET_ID = "1jc5nOgZOQg0BV-KzQikKFcJ3-s2CiukfJGtjWg221FM";
const TAB_SISWA = "SISWA";
const TAB_PRA_BAB2 = "Pra Bab 2";

/**
 * Memproses permintaan GET dari Web App (misal: mengambil data siswa)
 */
function doGet(e) {
  try {
    const action = e && e.parameter ? e.parameter.action : "";

    // Permintaan data siswa dari tab SISWA
    if (action === "getSiswa") {
      const siswaData = getSiswaData();
      return createJsonResponse({
        status: "success",
        data: siswaData
      });
    }

    // Default response jika diakses melalui browser
    return HtmlService.createHtmlOutput(
      "<h2>Backend Google Apps Script UKD Quest Berjalan Aktif!</h2>" +
      "<p>Spreadsheet ID: <code>" + SPREADSHEET_ID + "</code></p>" +
      "<p>Gunakan URL Web App ini sebagai Webhook pada aplikasi Game UKD Quest.</p>"
    ).setTitle("UKD Quest Backend API");

  } catch (error) {
    return createJsonResponse({
      status: "error",
      message: error.toString()
    });
  }
}

/**
 * Memproses permintaan POST untuk menyimpan hasil kegiatan siswa ke tab 'Pra Bab 2'
 */
function doPost(e) {
  try {
    let payload = {};

    // Parse data JSON dari body permintaan
    if (e && e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    } else if (e && e.parameter) {
      payload = e.parameter;
    }

    // Simpan data hasil kegiatan ke tab 'Pra Bab 2'
    const result = appendResultToSheet(payload);

    return createJsonResponse({
      status: "success",
      message: "Data hasil kegiatan berhasil disimpan ke tab 'Pra Bab 2'",
      details: result
    });

  } catch (error) {
    return createJsonResponse({
      status: "error",
      message: error.toString()
    });
  }
}

/**
 * Membaca data siswa dari tab 'SISWA'
 */
function getSiswaData() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(TAB_SISWA);

  if (!sheet) {
    throw new Error("Tab '" + TAB_SISWA + "' tidak ditemukan pada Google Sheet!");
  }

  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];

  // Lewati baris pertama (Header)
  const siswaList = [];
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    const nis = row[0] ? String(row[0]).trim() : "";
    const nama = row[1] ? String(row[1]).trim() : "";
    const kelas = row[2] ? String(row[2]).trim() : "";
    const noAbsen = row[3] ? parseInt(row[3]) : i;

    if (nis || nama) {
      siswaList.push({
        nis: nis,
        nama: nama,
        kelas: kelas || "TIK",
        noAbsen: noAbsen
      });
    }
  }

  return siswaList;
}

/**
 * Menambahkan baris hasil kegiatan ke tab 'Pra Bab 2'
 */
function appendResultToSheet(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(TAB_PRA_BAB2);

  // Buat tab 'Pra Bab 2' jika belum ada
  if (!sheet) {
    sheet = ss.insertSheet(TAB_PRA_BAB2);
    // Buat Header Otomatis
    sheet.appendRow([
      "Tanggal & Waktu",
      "NIS",
      "Nama Siswa",
      "Kelas",
      "Mode Permainan",
      "Skor Akhir",
      "Akurasi",
      "Jawaban Benar",
      "Rata-rata Waktu",
      "Status Selesai"
    ]);

    // Format header
    const headerRange = sheet.getRange(1, 1, 1, 10);
    headerRange.setBackground("#1e293b");
    headerRange.setFontColor("#f8fafc");
    headerRange.setFontWeight("bold");
  }

  const timestamp = data.tanggal || new Date().toLocaleString("id-ID");
  const nis = data.nis || "-";
  const nama = data.nama || "Anonim";
  const kelas = data.kelas || "TIK";
  const mode = data.mode || "Game UKD";
  const skor = data.skor !== undefined ? data.skor : 0;
  const akurasi = data.akurasi || "0%";
  const benar = data.benar || "0";
  const waktuRataRata = data.waktuRataRata || "0s";

  // Tambahkan baris data baru
  sheet.appendRow([
    timestamp,
    nis,
    nama,
    kelas,
    mode,
    skor,
    akurasi,
    benar,
    waktuRataRata,
    "Selesai"
  ]);

  return {
    nis: nis,
    nama: nama,
    skor: skor
  };
}

/**
 * Helper untuk memformat output JSON dengan header CORS
 */
function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
