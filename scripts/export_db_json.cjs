const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'WINDOWS_OFFLINE_APP', 'database', 'data.db');
const targetJson = path.join(__dirname, '..', 'WINDOWS_OFFLINE_APP', 'database', 'db.json');

const tables = ['departments', 'personnels', 'appendix1', 'appendix2', 'appendix3', 'app_settings', 'audit_logs'];
const dbData = {};

tables.forEach(t => {
  try {
    const rawJson = execSync(`sqlite3 -json "${dbPath}" "SELECT * FROM \\"${t}\\";"`).toString();
    dbData[t] = JSON.parse(rawJson || '[]');
  } catch (e) {
    dbData[t] = [];
  }
});

// Also add default users
dbData['directus_users'] = [
  {
    id: 'admin-1',
    first_name: 'Quản trị viên',
    last_name: '',
    email: 'admin@demo.com',
    role: 'admin',
    status: 'active'
  }
];

fs.writeFileSync(targetJson, JSON.stringify(dbData, null, 2));
console.log('Exported db.json summary:');
Object.entries(dbData).forEach(([k, v]) => console.log(`  - ${k}: ${v.length} rows`));
