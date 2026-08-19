const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Two Import Buttons
const oldImportBtn = `<button @click="openImportModal()" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium shadow-md transition-colors flex items-center gap-2">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                        Import (Paste)
                    </button>`;
const newImportBtns = `<div class="relative" x-data="{ openImportDropdown: false }">
                        <button @click="openImportDropdown = !openImportDropdown" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium shadow-md transition-colors flex items-center gap-2">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                            Import Dữ liệu
                            <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                        </button>
                        <div x-show="openImportDropdown" @click.away="openImportDropdown = false" class="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-100 z-50 overflow-hidden" x-cloak>
                            <button @click="openImportModal('personnel'); openImportDropdown = false" class="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 font-medium border-b border-gray-50">Import Cán bộ</button>
                            <button @click="openImportModal('relative'); openImportDropdown = false" class="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 font-medium">Import Thân nhân</button>
                        </div>
                    </div>`;
html = html.replace(oldImportBtn, newImportBtns);

// 2. Add properties to import state in appData
html = html.replace('isImportModalOpen: false,', 'isImportModalOpen: false, importType: "personnel", importTargetPersonnelId: "",');

// 3. Update openImportModal to take type
const oldOpenImportModal = `openImportModal() {
                    this.isImportModalOpen = true;
                    this.importStep = 1;`;
const newOpenImportModal = `openImportModal(type = 'personnel') {
                    this.importType = type;
                    this.importTargetPersonnelId = '';
                    this.isImportModalOpen = true;
                    this.importStep = 1;`;
html = html.replace(oldOpenImportModal, newOpenImportModal);

// 4. Modify System Fields to have Relative fields if type is relative
const systemFieldsStr = `systemFields: [`;
const systemFieldsLogic = `get systemFields() {
                    if (this.importType === 'relative') {
                        return [
                            { key: 'relation', label: 'Quan hệ' },
                            { key: 'name', label: 'Họ và tên người thân' },
                            { key: 'birthYear', label: 'Năm sinh' },
                            { key: 'currentAddress', label: 'Nơi cư trú' },
                            { key: 'job', label: 'Nghề nghiệp/Nơi làm việc' },
                            { key: 'country', label: 'Quốc gia (Yếu tố NN)' },
                            { key: 'time', label: 'Thời gian ở NN' },
                            { key: 'unit', label: 'Cơ quan/Tổ chức NN' },
                            { key: 'funding', label: 'Nguồn kinh phí' }
                        ];
                    }
                    return [`;
html = html.replace(systemFieldsStr, systemFieldsLogic);

// Close the getter
const closeSystemFields = `{ key: 'id', label: 'Mã Cán bộ' }
                ],`;
const newCloseSystemFields = `{ key: 'id', label: 'Mã Cán bộ' }
                    ];
                },`;
html = html.replace(closeSystemFields, newCloseSystemFields);

// 5. Add Personnel Select in Step 1 of Modal
const oldImportStep1 = `<div x-show="importStep === 1">`;
const newImportStep1 = `<div x-show="importStep === 1">
                    <div x-show="importType === 'relative'" class="mb-4 bg-blue-50 p-4 rounded-lg border border-blue-100">
                        <label class="block text-sm font-semibold text-blue-900 mb-2">Chọn Cán bộ để thêm thân nhân <span class="text-red-500">*</span></label>
                        <select x-model="importTargetPersonnelId" class="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2">
                            <option value="">-- Chọn Cán bộ --</option>
                            <template x-for="p in personnel" :key="p.id">
                                <option :value="p.id" x-text="p.name + ' - ' + (p.cccd || p.id)"></option>
                            </template>
                        </select>
                        <p x-show="!importTargetPersonnelId && importPasteText.trim() !== ''" class="text-xs text-red-500 mt-1 mt-2">Vui lòng chọn cán bộ trước khi tiếp tục!</p>
                    </div>`;
html = html.replace(oldImportStep1, newImportStep1);

// Prevent processPastedData if relative and no personnel selected
const oldProcess = `processPastedData() {
                    if(!this.importPasteText.trim()) return;`;
const newProcess = `processPastedData() {
                    if(!this.importPasteText.trim()) return;
                    if(this.importType === 'relative' && !this.importTargetPersonnelId) return;`;
html = html.replace(oldProcess, newProcess);

// 6. Update executeImport logic for Relatives
const oldExecuteImport = `async executeImport() {
                    this.isImporting = true;
                    try {
                        const payloads = [];
                        for (let r of this.importRows) {`;
const newExecuteImport = `async executeImport() {
                    if (this.importType === 'relative' && !this.importTargetPersonnelId) {
                        alert('Vui lòng chọn Cán bộ trước khi import thân nhân!');
                        return;
                    }
                    this.isImporting = true;
                    try {
                        if (this.importType === 'relative') {
                            // Import Relatives Logic
                            const targetPerson = this.personnel.find(p => p.id === this.importTargetPersonnelId);
                            if (!targetPerson) throw new Error('Không tìm thấy cán bộ hợp lệ');
                            
                            const newRelatives = [];
                            for (let r of this.importRows) {
                                const rel = {
                                    id: 'R' + Date.now() + Math.floor(Math.random()*1000),
                                    hasForeignElement: false,
                                    foreignInfo: {}
                                };
                                let hasData = false;
                                for (let i = 0; i < this.importHeaders.length; i++) {
                                    const fieldKey = this.importMapping[i];
                                    const val = r[i]?.trim();
                                    if (fieldKey && val) {
                                        hasData = true;
                                        if (['country', 'time', 'unit', 'funding'].includes(fieldKey)) {
                                            rel.foreignInfo[fieldKey] = val;
                                            rel.hasForeignElement = true;
                                        } else {
                                            rel[fieldKey] = val;
                                        }
                                    }
                                }
                                if (hasData) newRelatives.push(rel);
                            }
                            
                            if (newRelatives.length === 0) {
                                alert("Không có dữ liệu hợp lệ!");
                                this.isImporting = false;
                                return;
                            }
                            
                            const updatedRelatives = [...targetPerson.relatives, ...newRelatives];
                            const res = await fetch(\`\${API_URL}/items/personnels/\${targetPerson.id}\`, {
                                method: 'PATCH',
                                headers: { 
                                    'Content-Type': 'application/json',
                                    'Authorization': 'Bearer mvp-static-token-999'
                                },
                                body: JSON.stringify({ relatives: updatedRelatives })
                            });
                            
                            if (res.ok) {
                                alert(\`Đã thêm thành công \${newRelatives.length} thân nhân!\`);
                                this.isImportModalOpen = false;
                                await this.fetchData();
                            } else {
                                alert("Có lỗi xảy ra khi lưu thân nhân!");
                            }
                            
                            this.isImporting = false;
                            return;
                        }

                        // Original Personnel Import Logic
                        const payloads = [];
                        for (let r of this.importRows) {`;
html = html.replace(oldExecuteImport, newExecuteImport);

// 7. Update Modal Title
const oldModalTitle = `<h2 class="text-xl font-bold text-gray-800" id="modal-title">Import Dữ liệu từ Excel</h2>`;
const newModalTitle = `<h2 class="text-xl font-bold text-gray-800" id="modal-title" x-text="'Import ' + (importType === 'relative' ? 'Thân nhân' : 'Cán bộ') + ' từ Excel'"></h2>`;
html = html.replace(oldModalTitle, newModalTitle);

// 8. Update Sample Data to be contextual
const oldLoadSampleData = `loadSampleData() {
                    this.importPasteText = \`Họ và Tên`;
const newLoadSampleData = `loadSampleData() {
                    if (this.importType === 'relative') {
                        this.importPasteText = \`Quan hệ\tHọ và tên người thân\tNăm sinh\tNơi cư trú\tNghề nghiệp/Nơi làm việc\tQuốc gia (Yếu tố NN)\tThời gian ở NN
Vợ\tTrần Thị Vợ\t1988\tHà Nội\tGiáo viên\tÚc\t2020-nay
Con trai\tNguyễn Văn Con\t2015\tHà Nội\tHọc sinh\t\t\`;
                    } else {
                        this.importPasteText = \`Họ và Tên`;
html = html.replace(oldLoadSampleData, newLoadSampleData);
html = html.replace(`Nguyễn Văn Con\tCon trai\t2015\tHọc sinh\t\`;`, `Nguyễn Văn Con\tCon trai\t2015\tHọc sinh\t\`;\n                    }`);

fs.writeFileSync('index.html', html);
console.log('Done splitting import functionality.');
