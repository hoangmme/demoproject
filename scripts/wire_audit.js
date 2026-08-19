const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');

const fetchLogsRegex = /async fetchData\(\) \{[\s\S]*?\},/;
const newFetchMethod = `async fetchData() {
                    try {
                        const res = await fetch(\`\${API_URL}/items/personnels?limit=100\`, {
                            headers: { 'Authorization': 'Bearer mvp-static-token-999' }
                        });
                        const json = await res.json();
                        if (json.data) {
                            this.personnel = json.data.map(p => {
                                p.trips = p.trips || [];
                                p.flags = p.flags || {};
                                p.relatives = p.relatives || [];
                                return p;
                            });
                        }
                    } catch (e) {
                        console.error("Lỗi kết nối DB:", e);
                    }
                },
                async fetchLogs() {
                    try {
                        const res = await fetch(\`\${API_URL}/activity?sort=-timestamp&limit=50&fields=*,user.first_name,user.email\`, {
                            headers: { 'Authorization': 'Bearer mvp-static-token-999' }
                        });
                        const json = await res.json();
                        if (json.data) {
                            this.globalAuditLogs = json.data
                                .filter(log => log.collection === 'personnels')
                                .map(log => ({
                                    id: log.id,
                                    time: new Date(log.timestamp).toLocaleString('vi-VN'),
                                    user: log.user ? log.user.first_name : 'System Admin',
                                    role: log.user ? log.user.email : 'admin@system.com',
                                    action: log.action === 'create' ? 'THÊM MỚI' : (log.action === 'update' ? 'CẬP NHẬT' : 'XÓA'),
                                    entity: 'Hồ sơ ID: ' + log.item,
                                    field: 'Dữ liệu',
                                    oldValue: '',
                                    newValue: '',
                                    details: 'Directus Activity Track'
                                }));
                        }
                    } catch (e) {
                        console.error("Lỗi fetch Logs:", e);
                    }
                },`;
content = content.replace(fetchLogsRegex, newFetchMethod);

// Add fetchLogs to init()
const initRegex = /this\.fetchData\(\);/;
const newInit = `this.fetchData(); this.fetchLogs();`;
content = content.replace(initRegex, newInit);

// Add fetchLogs after save
const saveSuccessRegex = /this\.closePanel\(\);\s*await this\.fetchData\(\);/;
const newSaveSuccess = `this.closePanel();\n                            await this.fetchData();\n                            await this.fetchLogs();`;
content = content.replace(saveSuccessRegex, newSaveSuccess);

fs.writeFileSync('index.html', content);
console.log("Wired up Real Directus Audit Log!");
