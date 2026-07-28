// js/config.js
export const CONFIG = {
    API_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:3000' : '/api',
    PAGE_SIZE: 10,
    APP_NAME: 'Quản Lý Cán Bộ',
    VERSION: '1.0.0'
};
