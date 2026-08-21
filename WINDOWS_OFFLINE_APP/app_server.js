// COMBINED OFFLINE RUNNER: Frontend (Port 80/3000) + Directus API (Port 8055)
const { fork } = require('child_process');
const path = require('path');

console.log('============================================================');
console.log('🚀 ĐANG KHỞI CHẠY HỆ THỐNG QUẢN LÝ HỒ SƠ CÁN BỘ (OFFLINE)...');
console.log('============================================================');

// 1. Chạy Backend API (Port 8055)
require('./backend_server.js');

// 2. Chạy Frontend Web Server (Port 80 / 3000)
require('./frontend_server.js');
