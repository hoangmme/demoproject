/**
 * CLEAN DATA ROWS - Xóa sạch dữ liệu hàng, giữ nguyên 100% cấu hình
 * 
 * Sử dụng: node scripts/clean_data_rows.cjs
 * 
 * Dùng sau khi sync_online_db.cjs đã tải cấu hình mới nhất từ server Online.
 * Script này sẽ:
 * - GIỮ NGUYÊN: app_settings, files, directus_users, departments (100% cấu hình)
 * - XÓA SẠCH: personnels, appendix1, appendix2, appendix3, audit_logs (0 bản ghi)
 */

const fs = require('fs');
const path = require('path');

const OFFLINE_DIR = path.resolve(__dirname, '..', 'WINDOWS_OFFLINE_APP');
const DB_FILE = path.join(OFFLINE_DIR, 'database', 'db.json');

if (!fs.existsSync(DB_FILE)) {
  console.error(`❌ Không tìm thấy file database: ${DB_FILE}`);
  console.error('   Vui lòng chạy sync_online_db.cjs trước!');
  process.exit(1);
}

try {
  const raw = fs.readFileSync(DB_FILE, 'utf8');
  const db = JSON.parse(raw);

  // Ghi nhận số liệu TRƯỚC khi xóa
  const before = {
    personnels: Array.isArray(db.personnels) ? db.personnels.length : 0,
    appendix1: Array.isArray(db.appendix1) ? db.appendix1.length : 0,
    appendix2: Array.isArray(db.appendix2) ? db.appendix2.length : 0,
    appendix3: Array.isArray(db.appendix3) ? db.appendix3.length : 0,
    audit_logs: Array.isArray(db.audit_logs) ? db.audit_logs.length : 0,
  };

  const kept = {
    app_settings: Array.isArray(db.app_settings) ? db.app_settings.length : 0,
    departments: Array.isArray(db.departments) ? db.departments.length : 0,
    files: Array.isArray(db.files) ? db.files.length : 0,
    directus_users: Array.isArray(db.directus_users) ? db.directus_users.length : 0,
  };

  console.log('============================================================');
  console.log('🧹 XÓA DỮ LIỆU HÀNG - GIỮ NGUYÊN CẤU HÌNH');
  console.log('============================================================');
  console.log('');
  console.log('📊 TRƯỚC KHI XÓA:');
  console.log(`   Cán bộ (personnels):     ${before.personnels} bản ghi`);
  console.log(`   Phụ lục 1 (appendix1):   ${before.appendix1} bản ghi`);
  console.log(`   Phụ lục 2 (appendix2):   ${before.appendix2} bản ghi`);
  console.log(`   Phụ lục 3 (appendix3):   ${before.appendix3} bản ghi`);
  console.log(`   Nhật ký (audit_logs):    ${before.audit_logs} dòng`);
  console.log('');

  // Xóa dữ liệu hàng
  db.personnels = [];
  db.appendix1 = [];
  db.appendix2 = [];
  db.appendix3 = [];
  db.audit_logs = [];

  // Ghi lại file
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');

  console.log('✅ SAU KHI XÓA:');
  console.log(`   Cán bộ (personnels):     0 bản ghi (đã xóa ${before.personnels})`);
  console.log(`   Phụ lục 1 (appendix1):   0 bản ghi (đã xóa ${before.appendix1})`);
  console.log(`   Phụ lục 2 (appendix2):   0 bản ghi (đã xóa ${before.appendix2})`);
  console.log(`   Phụ lục 3 (appendix3):   0 bản ghi (đã xóa ${before.appendix3})`);
  console.log(`   Nhật ký (audit_logs):    0 dòng (đã xóa ${before.audit_logs})`);
  console.log('');
  console.log('🔒 GIỮ NGUYÊN 100%:');
  console.log(`   Cấu hình hệ thống:      ${kept.app_settings} mục (cột, widget, branding, docx...)`);
  console.log(`   Phòng ban:               ${kept.departments} đơn vị`);
  console.log(`   Tệp đính kèm:           ${kept.files} tệp`);
  console.log(`   Tài khoản người dùng:    ${kept.directus_users} tài khoản`);
  console.log('============================================================');
} catch (err) {
  console.error('❌ Lỗi khi xử lý database:', err.message);
  process.exit(1);
}
