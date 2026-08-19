const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const oldFetchLogs = `async fetchLogs() {
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

const newFetchLogs = `async fetchLogs() {
                    try {
                        const res = await fetch(\`\${API_URL}/activity?sort=-timestamp&limit=50&fields=*,user.first_name,user.email,revisions.*\`, {
                            headers: { 'Authorization': 'Bearer mvp-static-token-999' }
                        });
                        const json = await res.json();
                        if (json.data) {
                            const fieldMap = {};
                            this.systemFields.forEach(f => fieldMap[f.key] = f.label);
                            const relFields = [
                                { key: 'relation', label: 'Quan hệ' }, { key: 'name', label: 'Họ và tên' },
                                { key: 'birthYear', label: 'Năm sinh' }, { key: 'currentAddress', label: 'Nơi cư trú' },
                                { key: 'job', label: 'Nghề nghiệp/Nơi làm việc' }, { key: 'country', label: 'Quốc gia (Yếu tố NN)' },
                                { key: 'time', label: 'Thời gian ở NN' }, { key: 'unit', label: 'Cơ quan/Tổ chức NN' },
                                { key: 'funding', label: 'Nguồn kinh phí' }, { key: 'currentWork', label: 'Công việc hiện tại (NN)' },
                                { key: 'married', label: 'Kết hôn với người NN' }, { key: 'fdi', label: 'Làm việc cho FDI' }
                            ];
                            relFields.forEach(f => fieldMap[f.key] = f.label);

                            this.globalAuditLogs = json.data
                                .filter(log => log.collection === 'personnels' || log.collection === 'relatives')
                                .map(log => {
                                    let fieldTxt = '';
                                    let detailsTxt = '';
                                    
                                    if (log.revisions && log.revisions.length > 0 && log.revisions[0].delta) {
                                        const delta = log.revisions[0].delta;
                                        const fieldsUpdated = [];
                                        Object.keys(delta).forEach(k => {
                                            if (k !== 'id' && k !== 'flags' && k !== 'personnelId') {
                                                const label = fieldMap[k] || k;
                                                fieldsUpdated.push(label);
                                            }
                                        });
                                        if (fieldsUpdated.length > 0) {
                                            fieldTxt = fieldsUpdated.join(', ');
                                            detailsTxt = log.action === 'create' ? 'Nhập dữ liệu các trường: ' + fieldTxt : 'Cập nhật thay đổi các trường: ' + fieldTxt;
                                        }
                                        if (log.action === 'delete') {
                                            detailsTxt = 'Xóa hồ sơ khỏi hệ thống';
                                        }
                                    }
                                    
                                    return {
                                        id: log.id,
                                        time: new Date(log.timestamp).toLocaleString('vi-VN'),
                                        user: log.user && log.user.first_name ? log.user.first_name : (log.user && log.user.email ? log.user.email : 'System Admin'),
                                        role: log.user ? log.user.email : 'admin@system.com',
                                        action: log.action === 'create' ? 'THÊM MỚI' : (log.action === 'update' ? 'CẬP NHẬT' : 'XÓA'),
                                        entity: (log.collection === 'personnels' ? 'Cán bộ ' : 'Thân nhân ') + log.item,
                                        field: fieldTxt,
                                        oldValue: '',
                                        newValue: '',
                                        details: detailsTxt || 'Thay đổi dữ liệu hệ thống'
                                    };
                                });
                        }
                    } catch (e) {
                        console.error("Lỗi fetch Logs:", e);
                    }
                },`;

html = html.replace(oldFetchLogs, newFetchLogs);
fs.writeFileSync('index.html', html);
console.log('Fixed fetchLogs logic');
