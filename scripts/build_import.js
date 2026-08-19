const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Add Import Button
const createBtn = `<button @click="openCreateModal()" class="bg-[#447f28] hover:bg-[#366620] text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 shadow-sm whitespace-nowrap">`;
const importBtnHtml = `<button @click="openImportModal()" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 shadow-sm whitespace-nowrap">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                        Import (Paste)
                    </button>\n                    `;
if (!html.includes('openImportModal()')) {
    html = html.replace(createBtn, importBtnHtml + createBtn);
}

// 2. Add Import Modal HTML
const importModalHtml = `
    <!-- Modal Import Smart Paste -->
    <div x-cloak x-show="isImportModalOpen" class="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
        <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div x-show="isImportModalOpen" x-transition.opacity class="fixed inset-0 bg-gray-900 bg-opacity-50 transition-opacity" @click="isImportModalOpen = false"></div>
            <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div x-show="isImportModalOpen" 
                 x-transition:enter="ease-out duration-300" x-transition:enter-start="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95" x-transition:enter-end="opacity-100 translate-y-0 sm:scale-100" 
                 class="inline-block align-bottom bg-white rounded-xl text-left shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl w-full border border-gray-100 flex flex-col max-h-[90vh]">
                <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 flex-1 overflow-y-auto">
                    <h3 class="text-xl leading-6 font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                        Import Dữ liệu từ Excel / Google Sheets
                    </h3>
                    
                    <div x-show="importStep === 1">
                        <p class="text-sm text-gray-600 mb-4">Copy dữ liệu bảng từ Excel hoặc Google Sheets (bao gồm cả dòng tiêu đề) và Dán (Ctrl+V) vào ô dưới đây:</p>
                        <textarea x-model="importPasteText" @input="processPastedData()" class="w-full h-64 border-2 border-dashed border-gray-300 rounded-lg p-4 font-mono text-sm focus:border-blue-500 focus:ring-0 outline-none" placeholder="Dán dữ liệu vào đây..."></textarea>
                    </div>

                    <div x-show="importStep === 2">
                        <p class="text-sm font-medium text-gray-800 mb-2">Bước 2: Ghép Cột (Mapping)</p>
                        <p class="text-xs text-gray-500 mb-4">Hệ thống đã nhận diện được <span class="font-bold text-blue-600" x-text="importHeaders.length"></span> cột. Hãy chọn trường hệ thống tương ứng cho từng cột.</p>
                        
                        <div class="grid grid-cols-2 gap-4 mb-6">
                            <div class="font-bold text-sm text-gray-700 bg-gray-100 p-2 rounded">Cột từ Sheet (Dòng đầu)</div>
                            <div class="font-bold text-sm text-gray-700 bg-gray-100 p-2 rounded">Trường Hệ thống</div>
                            
                            <template x-for="(header, index) in importHeaders" :key="index">
                                <div class="contents">
                                    <div class="flex items-center text-sm font-medium text-gray-800" x-text="header"></div>
                                    <div>
                                        <select x-model="importMapping[index]" class="w-full border-gray-300 border rounded py-1 px-2 text-sm focus:ring-blue-500">
                                            <option value="">-- Bỏ qua cột này --</option>
                                            <template x-for="field in systemFields" :key="field.key">
                                                <option :value="field.key" x-text="field.label"></option>
                                            </template>
                                        </select>
                                    </div>
                                </div>
                            </template>
                        </div>
                        
                        <div class="mt-4 border-t pt-4">
                            <p class="text-sm font-bold text-gray-700 mb-2">Xem trước dữ liệu (5 dòng đầu)</p>
                            <div class="overflow-x-auto text-xs">
                                <table class="w-full border-collapse">
                                    <thead>
                                        <tr class="bg-gray-50">
                                            <template x-for="fieldKey in Object.values(importMapping).filter(Boolean)" :key="fieldKey">
                                                <th class="border p-2" x-text="systemFields.find(f => f.key === fieldKey)?.label || fieldKey"></th>
                                            </template>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <template x-for="(row, rIndex) in importRows.slice(0, 5)" :key="rIndex">
                                            <tr>
                                                <template x-for="(colIndex, mIndex) in Object.keys(importMapping).filter(k => importMapping[k])" :key="colIndex">
                                                    <td class="border p-2 text-gray-600" x-text="row[colIndex]"></td>
                                                </template>
                                            </tr>
                                        </template>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-gray-100">
                    <button x-show="importStep === 2" type="button" @click="executeImport()" :disabled="isImporting" class="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50">
                        <span x-show="!isImporting">Lưu Dữ liệu (<span x-text="importRows.length"></span> dòng)</span>
                        <span x-show="isImporting">Đang lưu...</span>
                    </button>
                    <button x-show="importStep === 2" type="button" @click="importStep = 1" class="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
                        Quay lại
                    </button>
                    <button type="button" @click="isImportModalOpen = false" class="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
                        Hủy
                    </button>
                </div>
            </div>
        </div>
    </div>
`;
if (!html.includes('isImportModalOpen')) {
    html = html.replace('<!-- Modal Thêm User -->', importModalHtml + '\n    <!-- Modal Thêm User -->');
}

// 3. Add JS state and Logic
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
    html = html.replace('openCreateModal() {', importState + '\n                openCreateModal() {');
}

fs.writeFileSync('index.html', html);
console.log("Added Smart Paste Import UI and Logic");
