const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Fix fetchData() to ensure p.relatives and p.trips are arrays
html = html.replace(
    'p.trips = p.trips || [];',
    'p.trips = Array.isArray(p.trips) ? p.trips : [];'
);
html = html.replace(
    'p.relatives = p.relatives || [];',
    'p.relatives = Array.isArray(p.relatives) ? p.relatives : [];'
);

// 2. Inject importState into appData
const importState = `isImportModalOpen: false,
                importStep: 1,
                importPasteText: '',
                importHeaders: [],
                importRows: [],
                importMapping: {},
                isImporting: false,
                systemFields: [
                    { key: 'name', label: 'Họ và Tên' },
                    { key: 'id', label: 'Số CCCD / ID' },
                    { key: 'biDanh', label: 'Bí danh' },
                    { key: 'tenGoiKhac', label: 'Tên gọi khác' },
                    { key: 'gioiTinh', label: 'Giới tính (Nam/Nữ)' },
                    { key: 'trinhDoGiaoDucPhoThong', label: 'Trình độ GDPT' },
                    { key: 'trinhDoChuyenMon', label: 'Trình độ chuyên môn' },
                    { key: 'chucVu', label: 'Chức vụ / Chức danh' },
                    { key: 'ngachCongChuc', label: 'Ngạch công chức' },
                    { key: 'email', label: 'Email' },
                    { key: 'sdt', label: 'Số điện thoại' }
                ],
                
                openImportModal() {
                    this.isImportModalOpen = true;
                    this.importStep = 1;
                    this.importPasteText = '';
                    this.importHeaders = [];
                    this.importRows = [];
                    this.importMapping = {};
                },
                
                processPastedData() {
                    if(!this.importPasteText.trim()) return;
                    
                    const rows = this.importPasteText.trim().split('\\n').map(r => r.split('\\t'));
                    if (rows.length < 2) return; // need headers and at least 1 row of data
                    
                    this.importHeaders = rows[0].map(h => h.trim());
                    this.importRows = rows.slice(1);
                    
                    // Auto mapping (basic guessing based on exact or partial match)
                    this.importMapping = {};
                    this.importHeaders.forEach((h, index) => {
                        const hl = h.toLowerCase();
                        let match = this.systemFields.find(f => hl.includes(f.label.toLowerCase()) || f.label.toLowerCase().includes(hl));
                        if(hl.includes('họ tên') || hl.includes('name')) match = { key: 'name' };
                        if(hl.includes('cccd') || hl.includes('mã')) match = { key: 'id' };
                        
                        this.importMapping[index] = match ? match.key : "";
                    });
                    
                    this.importStep = 2;
                },
                
                async executeImport() {
                    this.isImporting = true;
                    try {
                        const payloads = [];
                        for (let r of this.importRows) {
                            const payload = {};
                            let hasData = false;
                            for (let i = 0; i < this.importHeaders.length; i++) {
                                const fieldKey = this.importMapping[i];
                                if (fieldKey) {
                                    payload[fieldKey] = r[i]?.trim() || null;
                                    if(payload[fieldKey]) hasData = true;
                                }
                            }
                            if (hasData) {
                                if (!payload.id) payload.id = 'CB' + Date.now() + Math.floor(Math.random()*1000); // Generate ID if missing
                                payloads.push(payload);
                            }
                        }
                        
                        if(payloads.length === 0) {
                            alert("Không có dữ liệu hợp lệ để lưu!");
                            this.isImporting = false;
                            return;
                        }
                        
                        const res = await fetch(\`\${API_URL}/items/personnels\`, {
                            method: 'POST',
                            headers: { 
                                'Content-Type': 'application/json',
                                'Authorization': 'Bearer mvp-static-token-999'
                            },
                            body: JSON.stringify(payloads)
                        });
                        
                        if (res.ok) {
                            alert(\`Đã lưu thành công \${payloads.length} dòng dữ liệu!\`);
                            this.isImportModalOpen = false;
                            await this.fetchData();
                        } else {
                            const err = await res.json();
                            console.error(err);
                            alert("Có lỗi xảy ra: " + (err.errors?.[0]?.message || 'Unknown error'));
                        }
                    } catch(e) {
                        alert("Lỗi kết nối Server: " + e.message);
                    } finally {
                        this.isImporting = false;
                    }
                },
`;

if (!html.includes('processPastedData()')) {
    html = html.replace('openCreateUser() {', importState + '\n                openCreateUser() {');
}

// 3. Hide Administrator from Roles UI
html = html.replace(
    '<template x-for="r in roles" :key="r.id">',
    '<template x-for="r in roles.filter(role => role.name !== \'Administrator\')" :key="r.id">'
);

// 4. Add Password field to Create User Modal
const passwordHtml = `
                <div class="mt-4">
                    <label class="block text-sm font-semibold text-gray-700 mb-1">Mật khẩu (Password)</label>
                    <input type="password" x-model="newUserForm.password" class="w-full border border-gray-200 rounded-lg px-3 py-2" placeholder="Nhập mật khẩu (ít nhất 6 ký tự)">
                    <p class="text-xs text-gray-500 mt-1" x-show="newUserForm.id">Chỉ nhập nếu muốn đổi mật khẩu mới.</p>
                </div>
`;
if (!html.includes('x-model="newUserForm.password"')) {
    html = html.replace(
        '</select>\n                </div>\n                \n            </div>\n            <div class="mt-6',
        '</select>\n                </div>' + passwordHtml + '\n            </div>\n            <div class="mt-6'
    );
}

fs.writeFileSync('index.html', html);
console.log("Bugfixes applied successfully!");
