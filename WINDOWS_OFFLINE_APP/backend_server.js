const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.API_PORT || 8055;
const DB_FILE = path.join(__dirname, 'database', 'db.json');
const UPLOADS_DIR = path.join(__dirname, 'uploads');

if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// Load DB into memory
let db = {};
function loadDB() {
  try {
    if (fs.existsSync(DB_FILE)) {
      db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    }
  } catch (e) {
    console.error('Error loading db.json:', e);
  }
  if (!db.departments) db.departments = [];
  if (!db.personnels) db.personnels = [];
  if (!db.appendix1) db.appendix1 = [];
  if (!db.appendix2) db.appendix2 = [];
  if (!db.appendix3) db.appendix3 = [];
  if (!db.app_settings) db.app_settings = [];
  if (!db.audit_logs) db.audit_logs = [];
  if (!db.files) db.files = [];
  if (!db.directus_users) {
    db.directus_users = [{
      id: 'admin-1',
      first_name: 'Quản trị viên',
      last_name: '',
      email: 'admin@demo.com',
      role: 'admin',
      status: 'active'
    }];
  }
}

function saveDB() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
  } catch (e) {
    console.error('Error saving db.json:', e);
  }
}

loadDB();

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Range, X-Requested-With',
    'Access-Control-Expose-Headers': 'Content-Range',
  });
  res.end(JSON.stringify(data));
}

function parseBody(req) {
  return new Promise((resolve) => {
    let body = [];
    req.on('data', chunk => body.push(chunk));
    req.on('end', () => {
      const buffer = Buffer.concat(body);
      const str = buffer.toString('utf8');
      try {
        resolve({ json: JSON.parse(str), raw: buffer });
      } catch (e) {
        resolve({ json: null, raw: buffer });
      }
    });
  });
}

function normalizeCollectionName(name) {
  if (name === 'personnel') return 'personnels';
  return name;
}

const server = http.createServer(async (req, res) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Range, X-Requested-With',
    });
    res.end();
    return;
  }

  const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost:8055'}`);
  const pathname = urlObj.pathname.replace(/\/+$/, '') || '/';
  const searchParams = urlObj.searchParams;

  console.log(`[${new Date().toLocaleTimeString()}] [API] ${req.method} ${pathname}`);

  // 0. Server Health & Ping & Root info
  if (pathname === '/' && req.method === 'GET') {
    return sendJson(res, 200, {
      status: 'ok',
      message: 'Directus Offline API Server is running successfully!',
      port: PORT,
      collections: Object.keys(db).map(k => `${k} (${db[k]?.length || 0} records)`),
    });
  }

  if (pathname === '/server/ping') {
    res.writeHead(200, { 'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*' });
    return res.end('pong');
  }

  if (pathname === '/server/info' || pathname === '/server/health') {
    return sendJson(res, 200, {
      data: {
        version: '11.1.1',
        directus: true,
        project: { name: 'HSCB Offline' },
      }
    });
  }

  if (pathname === '/collections' && req.method === 'GET') {
    return sendJson(res, 200, {
      data: Object.keys(db).map(k => ({ collection: k, schema: { name: k } }))
    });
  }

  if (pathname.startsWith('/fields') && req.method === 'GET') {
    return sendJson(res, 200, { data: [] });
  }

  if (pathname.startsWith('/permissions') && req.method === 'GET') {
    return sendJson(res, 200, { data: [] });
  }

  if (pathname.startsWith('/activity') && req.method === 'GET') {
    return sendJson(res, 200, { data: [] });
  }

  // 1. Auth Login / Refresh / Logout
  if (pathname === '/auth/login' && req.method === 'POST') {
    const { json } = await parseBody(req);
    const user = db.directus_users[0] || {
      id: 'admin-1',
      first_name: 'Quản trị viên',
      email: json?.email || 'admin@demo.com',
      role: 'admin',
    };
    return sendJson(res, 200, {
      data: {
        access_token: 'mvp-static-token-999',
        expires: 86400000,
        refresh_token: 'refresh-token-999',
        user: user,
      }
    });
  }

  if (pathname === '/auth/refresh' && req.method === 'POST') {
    return sendJson(res, 200, {
      data: {
        access_token: 'mvp-static-token-999',
        expires: 86400000,
        refresh_token: 'refresh-token-999',
      }
    });
  }

  if (pathname === '/auth/logout') {
    return sendJson(res, 200, { data: null });
  }

  // 2. Users / Current User
  if (pathname === '/users/me' && req.method === 'GET') {
    return sendJson(res, 200, { data: db.directus_users[0] });
  }

  if (pathname === '/users' && req.method === 'GET') {
    return sendJson(res, 200, { data: db.directus_users });
  }

  if (pathname.startsWith('/users/') && req.method === 'PATCH') {
    const uid = pathname.replace('/users/', '');
    const { json } = await parseBody(req);
    const idx = db.directus_users.findIndex(u => String(u.id) === String(uid));
    if (idx !== -1) {
      db.directus_users[idx] = { ...db.directus_users[idx], ...json };
      saveDB();
      return sendJson(res, 200, { data: db.directus_users[idx] });
    }
    return sendJson(res, 200, { data: db.directus_users[0] });
  }

  if (pathname === '/roles' && req.method === 'GET') {
    return sendJson(res, 200, {
      data: [{ id: 'admin', name: 'Administrator', admin_access: true }]
    });
  }

  // 3. Asset Serving / Assets download
  if (pathname.startsWith('/assets/')) {
    const parts = pathname.replace('/assets/', '').split('/');
    const fileId = parts[0];
    let filePath = path.join(UPLOADS_DIR, fileId);

    if (!fs.existsSync(filePath)) {
      try {
        const files = fs.readdirSync(UPLOADS_DIR);
        const matched = files.find(f => f.startsWith(fileId));
        if (matched) filePath = path.join(UPLOADS_DIR, matched);
      } catch (e) {}
    }

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      res.writeHead(200, {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
      });
      return fs.createReadStream(filePath).pipe(res);
    } else {
      res.writeHead(404, { 'Access-Control-Allow-Origin': '*' });
      return res.end('File Not Found');
    }
  }

  // 4. File Upload (/files)
  if (pathname === '/files' && req.method === 'POST') {
    const { json, raw } = await parseBody(req);
    const fileId = crypto.randomUUID();
    let filename = `upload_${Date.now()}`;
    let filesize = raw.length;
    let type = 'application/octet-stream';

    const targetPath = path.join(UPLOADS_DIR, fileId);
    fs.writeFileSync(targetPath, raw);

    const fileMeta = {
      id: fileId,
      storage: 'local',
      filename_disk: fileId,
      filename_download: filename,
      title: filename,
      type: type,
      filesize: filesize,
      uploaded_on: new Date().toISOString(),
    };
    db.files.push(fileMeta);
    saveDB();
    return sendJson(res, 200, { data: fileMeta });
  }

  if (pathname === '/files' && req.method === 'GET') {
    return sendJson(res, 200, { data: db.files || [] });
  }

  if (pathname.startsWith('/files/') && req.method === 'DELETE') {
    const fileId = pathname.replace('/files/', '');
    db.files = (db.files || []).filter(f => f.id !== fileId);
    saveDB();
    return sendJson(res, 200, { data: null });
  }

  // 5. Items Collections CRUD (/items/:collection)
  if (pathname.startsWith('/items/')) {
    const segs = pathname.replace('/items/', '').split('/');
    const rawColName = segs[0];
    const colName = normalizeCollectionName(rawColName);
    const itemId = segs[1];

    if (!db[colName]) db[colName] = [];
    const list = db[colName];

    // GET /items/:collection/:id
    if (itemId && req.method === 'GET') {
      const item = list.find(x => String(x.id) === String(itemId) || String(x.code) === String(itemId));
      if (!item) return sendJson(res, 404, { errors: [{ message: 'Not found' }] });
      return sendJson(res, 200, { data: item });
    }

    // PATCH /items/:collection/:id
    if (itemId && req.method === 'PATCH') {
      const { json } = await parseBody(req);
      const idx = list.findIndex(x => String(x.id) === String(itemId) || String(x.code) === String(itemId));
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...json, id: list[idx].id };
        saveDB();
        return sendJson(res, 200, { data: list[idx] });
      }
      return sendJson(res, 404, { errors: [{ message: 'Not found' }] });
    }

    // DELETE /items/:collection/:id
    if (itemId && req.method === 'DELETE') {
      db[colName] = list.filter(x => String(x.id) !== String(itemId) && String(x.code) !== String(itemId));
      saveDB();
      return sendJson(res, 200, { data: null });
    }

    // DELETE /items/:collection (bulk delete)
    if (!itemId && req.method === 'DELETE') {
      const { json } = await parseBody(req);
      const deleteIds = Array.isArray(json?.data) ? json.data : (Array.isArray(json) ? json : []);
      if (deleteIds.length > 0) {
        const idSet = new Set(deleteIds.map(String));
        db[colName] = list.filter(x => !idSet.has(String(x.id)) && !idSet.has(String(x.code)));
        saveDB();
      }
      return sendJson(res, 200, { data: null });
    }

    // POST /items/:collection (create item)
    if (!itemId && req.method === 'POST') {
      const { json } = await parseBody(req);
      const payload = json || {};
      const newId = payload.id || (colName === 'app_settings' || colName === 'departments' ? list.length + 1 : `p_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`);
      const newItem = { id: newId, ...payload };
      list.push(newItem);
      saveDB();
      return sendJson(res, 200, { data: newItem });
    }

    // GET /items/:collection (list with filtering & sorting)
    if (!itemId && req.method === 'GET') {
      let result = [...list];

      // Handle Directus key filter e.g. filter[key][_eq]=...
      for (const [paramKey, paramVal] of searchParams.entries()) {
        if (paramKey.includes('filter[') && paramKey.includes('][_eq]')) {
          const field = paramKey.replace('filter[', '').replace('][_eq]', '');
          result = result.filter(item => String(item[field] || '') === String(paramVal));
        }
      }

      // Handle JSON filter query if passed as filter JSON
      const filterJsonStr = searchParams.get('filter');
      if (filterJsonStr) {
        try {
          const fObj = JSON.parse(filterJsonStr);
          Object.entries(fObj).forEach(([k, cond]) => {
            if (cond && typeof cond === 'object' && cond._eq !== undefined) {
              result = result.filter(item => String(item[k] || '') === String(cond._eq));
            }
          });
        } catch (e) {}
      }

      // Sort
      const sort = searchParams.get('sort');
      if (sort) {
        const isDesc = sort.startsWith('-');
        const field = isDesc ? sort.slice(1) : sort;
        result.sort((a, b) => {
          const valA = a[field] ?? '';
          const valB = b[field] ?? '';
          if (valA < valB) return isDesc ? 1 : -1;
          if (valA > valB) return isDesc ? -1 : 1;
          return 0;
        });
      }

      return sendJson(res, 200, { data: result });
    }
  }

  // Default Fallback
  return sendJson(res, 404, { errors: [{ message: `Endpoint not found: ${req.method} ${pathname}` }] });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('====================================================');
  console.log(`📡 DIRECTUS API SERVER DANG CHAY TAI: http://localhost:${PORT}`);
  console.log('====================================================');
});
