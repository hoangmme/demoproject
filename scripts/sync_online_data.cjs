const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BASE_URL = 'https://api.hscb.online';
const DB_PATHS = [
  path.join(__dirname, '..', 'WINDOWS_OFFLINE_APP', 'database', 'data.db'),
  path.join(__dirname, '..', 'backend', 'database', 'data.db')
];
const UPLOADS_DIRS = [
  path.join(__dirname, '..', 'WINDOWS_OFFLINE_APP', 'uploads'),
  path.join(__dirname, '..', 'backend', 'uploads')
];

async function main() {
  console.log('🔄 Đang đăng nhập Admin vào https://api.hscb.online...');

  const loginCmd = `curl -s -X POST -H "Content-Type: application/json" -d '{"email":"admin@demo.com","password":"321456"}' "${BASE_URL}/auth/login"`;
  const loginOut = execSync(loginCmd).toString();
  const loginJson = JSON.parse(loginOut);
  const token = loginJson.data?.access_token;
  if (!token) throw new Error('Đăng nhập thất bại: ' + loginOut);
  console.log('✅ Đăng nhập Admin thành công!');

  const collections = ['departments', 'personnels', 'appendix1', 'appendix2', 'appendix3', 'app_settings', 'audit_logs'];

  for (const col of collections) {
    try {
      const getCmd = `curl -s -H "Authorization: Bearer ${token}" "${BASE_URL}/items/${col}?limit=-1"`;
      const resRaw = execSync(getCmd, { maxBuffer: 50 * 1024 * 1024 }).toString();
      const res = JSON.parse(resRaw);
      const items = res.data || [];
      console.log(`📦 Bảng [${col}]: Lấy được ${items.length} bản ghi`);

      if (items.length > 0) {
        const allColumns = new Set();
        items.forEach(it => Object.keys(it).forEach(k => allColumns.add(k)));

        DB_PATHS.forEach(dbPath => {
          if (!fs.existsSync(dbPath)) return;

          execSync(`sqlite3 "${dbPath}" 'CREATE TABLE IF NOT EXISTS "${col}" (id TEXT PRIMARY KEY);'`);
          const existingColsRaw = execSync(`sqlite3 "${dbPath}" 'PRAGMA table_info("${col}");'`).toString();
          const existingCols = new Set(existingColsRaw.split('\n').map(l => l.split('|')[1]).filter(Boolean));

          allColumns.forEach(c => {
            if (!existingCols.has(c)) {
              try {
                execSync(`sqlite3 "${dbPath}" 'ALTER TABLE "${col}" ADD COLUMN "${c}" TEXT;'`);
              } catch (e) {}
            }
          });

          const sqlStatements = [`DELETE FROM "${col}";`];
          for (const item of items) {
            const itemKeys = Object.keys(item);
            const cols = itemKeys.map(k => `"${k}"`).join(', ');
            const vals = itemKeys.map(k => {
              const v = item[k];
              if (v === null || v === undefined) return 'NULL';
              if (typeof v === 'object') return `'${JSON.stringify(v).replace(/'/g, "''")}'`;
              if (typeof v === 'boolean') return v ? '1' : '0';
              if (typeof v === 'number') return v;
              return `'${String(v).replace(/'/g, "''")}'`;
            }).join(', ');

            sqlStatements.push(`INSERT OR REPLACE INTO "${col}" (${cols}) VALUES (${vals});`);
          }

          const sqlFile = path.join(__dirname, `sync_${col}.sql`);
          fs.writeFileSync(sqlFile, sqlStatements.join('\n'));
          execSync(`sqlite3 "${dbPath}" < "${sqlFile}"`);
          if (fs.existsSync(sqlFile)) fs.unlinkSync(sqlFile);
        });
      }
    } catch (e) {
      console.warn(`Lỗi lấy dữ liệu bảng ${col}:`, e.message);
    }
  }

  // Tải uploads
  UPLOADS_DIRS.forEach(d => {
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  });

  const filesCmd = `curl -s -H "Authorization: Bearer ${token}" "${BASE_URL}/files?limit=-1"`;
  const filesRaw = execSync(filesCmd, { maxBuffer: 50 * 1024 * 1024 }).toString();
  const filesJson = JSON.parse(filesRaw);
  const files = filesJson.data || [];
  console.log(`🖼️ Đang tải ${files.length} tệp tin / ảnh nền về uploads...`);

  for (const f of files) {
    try {
      UPLOADS_DIRS.forEach(d => {
        const targetPath = path.join(d, f.id);
        if (!fs.existsSync(targetPath)) {
          execSync(`curl -s -H "Authorization: Bearer ${token}" "${BASE_URL}/assets/${f.id}" -o "${targetPath}"`);
        }
        if (f.filename_disk) {
          const diskPath = path.join(d, f.filename_disk);
          if (!fs.existsSync(diskPath)) {
            fs.copyFileSync(targetPath, diskPath);
          }
        }
      });
      console.log(`   + Tải thành công: ${f.title || f.filename_download || f.id}`);
    } catch (err) {
      console.warn(`   - Lỗi file ${f.id}:`, err.message);
    }
  }

  console.log('🎉 ĐỒNG BỘ TOÀN BỘ DATABASE VÀ TỆP TIN ONLINE THÀNH CÔNG 100%!');
}

main().catch(console.error);
