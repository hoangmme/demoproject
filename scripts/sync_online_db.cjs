/**
 * SYNC ONLINE DATABASE & ASSETS TO WINDOWS_OFFLINE_APP
 * Fetches all collections and files from online Directus server (https://api.hscb.online)
 * and writes directly to WINDOWS_OFFLINE_APP/database/db.json & WINDOWS_OFFLINE_APP/uploads/
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const ONLINE_API_URL = process.env.ONLINE_API_URL || 'https://api.hscb.online';
const STATIC_TOKEN = process.env.STATIC_TOKEN || 'mvp-static-token-999';

const OFFLINE_DIR = path.resolve(__dirname, '..', 'WINDOWS_OFFLINE_APP');
const DB_FILE = path.join(OFFLINE_DIR, 'database', 'db.json');
const UPLOADS_DIR = path.join(OFFLINE_DIR, 'uploads');

if (!fs.existsSync(path.join(OFFLINE_DIR, 'database'))) {
  fs.mkdirSync(path.join(OFFLINE_DIR, 'database'), { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

function fetchJson(url) {
  return new Promise((resolve) => {
    const isHttps = url.startsWith('https');
    const client = isHttps ? https : http;
    const req = client.get(
      url,
      {
        headers: {
          Authorization: `Bearer ${STATIC_TOKEN}`,
          'User-Agent': 'Offline-Sync-Tool/1.0',
        },
        timeout: 15000,
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed.data)) {
              resolve(parsed.data);
            } else if (Array.isArray(parsed)) {
              resolve(parsed);
            } else if (parsed && typeof parsed === 'object' && !parsed.errors) {
              resolve(parsed.data || parsed);
            } else {
              resolve([]);
            }
          } catch (e) {
            console.warn(`[WARN] Failed to parse JSON from ${url}:`, e.message);
            resolve([]);
          }
        });
      }
    );
    req.on('error', (err) => {
      console.warn(`[WARN] Request error from ${url}:`, err.message);
      resolve([]);
    });
    req.on('timeout', () => {
      req.destroy();
      console.warn(`[WARN] Timeout requesting ${url}`);
      resolve([]);
    });
  });
}

function downloadFile(url, destPath) {
  return new Promise((resolve) => {
    if (fs.existsSync(destPath) && fs.statSync(destPath).size > 0) {
      return resolve(true);
    }
    const isHttps = url.startsWith('https');
    const client = isHttps ? https : http;
    const req = client.get(
      url,
      {
        headers: {
          Authorization: `Bearer ${STATIC_TOKEN}`,
        },
        timeout: 20000,
      },
      (res) => {
        if (res.statusCode !== 200) {
          return resolve(false);
        }
        const fileStream = fs.createWriteStream(destPath);
        res.pipe(fileStream);
        fileStream.on('finish', () => {
          fileStream.close();
          resolve(true);
        });
        fileStream.on('error', () => resolve(false));
      }
    );
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function syncAll() {
  console.log('============================================================');
  console.log(`🌐 ĐANG KẾT NỐI SERVER ONLINE: ${ONLINE_API_URL}`);
  console.log('============================================================');

  // 1. Tải Departments
  console.log('📥 [1/8] Đang tải danh mục Phòng ban / Đơn vị (departments)...');
  const departments = await fetchJson(`${ONLINE_API_URL}/items/departments?limit=-1`);
  console.log(`   -> Tìm thấy ${Array.isArray(departments) ? departments.length : 0} phòng ban.`);

  // 2. Tải Personnel
  console.log('📥 [2/8] Đang tải Danh sách Hồ sơ Cán bộ & Thân nhân & Chuyến đi (personnels)...');
  let personnels = await fetchJson(`${ONLINE_API_URL}/items/personnels?limit=-1`);
  if (!Array.isArray(personnels) || personnels.length === 0) {
    personnels = await fetchJson(`${ONLINE_API_URL}/items/personnel?limit=-1`);
  }
  console.log(`   -> Tìm thấy ${Array.isArray(personnels) ? personnels.length : 0} hồ sơ cán bộ.`);

  // 3. Tải Phụ lục 1, 2, 3
  console.log('📥 [3/8] Đang tải dữ liệu Báo cáo Phụ lục (appendix1, appendix2, appendix3)...');
  const appendix1 = await fetchJson(`${ONLINE_API_URL}/items/appendix1?limit=-1`);
  const appendix2 = await fetchJson(`${ONLINE_API_URL}/items/appendix2?limit=-1`);
  const appendix3 = await fetchJson(`${ONLINE_API_URL}/items/appendix3?limit=-1`);
  console.log(`   -> Phụ lục 1: ${appendix1.length}, Phụ lục 2: ${appendix2.length}, Phụ lục 3: ${appendix3.length}`);

  // 4. Tải Cấu hình hệ thống App Settings
  console.log('📥 [4/8] Đang tải Cấu hình Cột, Dashboard, Mẫu Docx (app_settings)...');
  const appSettings = await fetchJson(`${ONLINE_API_URL}/items/app_settings?limit=-1`);
  console.log(`   -> Tìm thấy ${appSettings.length} mục cấu hình hệ thống.`);

  // 5. Tải Nhật ký Hệ thống Audit Logs
  console.log('📥 [5/8] Đang tải Nhật ký hoạt động (audit_logs)...');
  const auditLogs = await fetchJson(`${ONLINE_API_URL}/items/audit_logs?limit=500&sort=-timestamp`);
  console.log(`   -> Tìm thấy ${auditLogs.length} dòng nhật ký.`);

  // 6. Tải Người dùng Directus Users
  console.log('📥 [6/8] Đang tải Danh sách Người dùng (users)...');
  const users = await fetchJson(`${ONLINE_API_URL}/users?limit=-1`);
  console.log(`   -> Tìm thấy ${users.length} tài khoản người dùng.`);

  // 7. Tải Danh sách Tệp đính kèm (files)
  console.log('📥 [7/8] Đang tải Danh mục Tệp đính kèm (files)...');
  const files = await fetchJson(`${ONLINE_API_URL}/files?limit=-1`);
  console.log(`   -> Tìm thấy ${files.length} tệp đính kèm.`);

  // 8. Tải Tệp thực tế về thư mục uploads/
  if (files.length > 0) {
    console.log(`📁 [8/8] Đang tải các tệp đính kèm về thư mục WINDOWS_OFFLINE_APP/uploads/...`);
    let downloadedCount = 0;
    for (const f of files) {
      const fId = f.id;
      if (fId) {
        const dest = path.join(UPLOADS_DIR, fId);
        const ok = await downloadFile(`${ONLINE_API_URL}/assets/${fId}`, dest);
        if (ok) downloadedCount++;
      }
    }
    console.log(`   -> Đã tải thành công ${downloadedCount}/${files.length} tệp.`);
  }

  // Ghi vào db.json
  const offlineDB = {
    departments: Array.isArray(departments) ? departments : [],
    personnels: Array.isArray(personnels) ? personnels : [],
    appendix1: Array.isArray(appendix1) ? appendix1 : [],
    appendix2: Array.isArray(appendix2) ? appendix2 : [],
    appendix3: Array.isArray(appendix3) ? appendix3 : [],
    app_settings: Array.isArray(appSettings) ? appSettings : [],
    audit_logs: Array.isArray(auditLogs) ? auditLogs : [],
    files: Array.isArray(files) ? files : [],
    directus_users: Array.isArray(users) && users.length > 0 ? users : [
      {
        id: 'admin-1',
        first_name: 'Quản trị viên',
        last_name: '',
        email: 'admin@demo.com',
        role: 'admin',
        status: 'active',
      },
    ],
  };

  fs.writeFileSync(DB_FILE, JSON.stringify(offlineDB, null, 2), 'utf8');
  console.log('============================================================');
  console.log(`✅ ĐÃ LƯU DATABASE HOÀN CHỈNH VÀO: ${DB_FILE}`);
  console.log('============================================================');
}

syncAll().catch((err) => {
  console.error('❌ Lỗi đồng bộ DB:', err);
  process.exit(1);
});
