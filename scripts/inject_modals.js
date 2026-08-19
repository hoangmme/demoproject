const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Inject Role Modal HTML
const createRoleModalHtml = `
    <!-- Modal Thêm/Sửa Role -->
    <div x-cloak x-show="isRoleModalOpen" class="fixed inset-0 z-[110] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm" aria-labelledby="modal-title" role="dialog" aria-modal="true">
        <div class="bg-white p-8 rounded-2xl shadow-2xl w-[500px] border border-gray-100">
            <h3 class="text-xl leading-6 font-bold text-gray-900 mb-6 flex items-center gap-2">
                <svg class="w-6 h-6 text-[#447f28]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                Thêm mới Vai trò (Role)
            </h3>
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Tên Vai trò <span class="text-red-500">*</span></label>
                    <input type="text" x-model="roleForm.name" class="w-full border-gray-300 border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-[#447f28] focus:border-[#447f28] outline-none transition-shadow" placeholder="VD: Quản lý Nhân sự">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                    <textarea x-model="roleForm.description" rows="3" class="w-full border-gray-300 border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-[#447f28] focus:border-[#447f28] outline-none transition-shadow" placeholder="Mô tả chức năng của vai trò..."></textarea>
                </div>
            </div>
            <div class="mt-6 flex justify-end gap-3">
                <button type="button" @click="isRoleModalOpen = false" class="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors">Hủy</button>
                <button type="button" @click="saveRole()" class="px-5 py-2.5 bg-[#447f28] hover:bg-[#366620] text-white rounded-lg font-medium shadow-md transition-colors">Lưu Vai trò</button>
            </div>
        </div>
    </div>
`;
if (!html.includes('Modal Thêm/Sửa Role')) {
    html = html.replace('<!-- CREATE USER MODAL -->', createRoleModalHtml + '\n    <!-- CREATE USER MODAL -->');
}

// 2. Inject Import Modal HTML
const importModalHtml = `
    <!-- Modal Import Smart Paste -->
    <div x-cloak x-show="isImportModalOpen" class="fixed inset-0 z-[110] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm" aria-labelledby="modal-title" role="dialog" aria-modal="true">
        <div class="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-4xl border border-gray-100 max-h-[90vh] flex flex-col">
            <div class="flex justify-between items-center mb-6">
                <h3 class="text-xl leading-6 font-bold text-gray-900 flex items-center gap-2">
                    <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                    Import Dữ liệu từ Excel / Google Sheets
                </h3>
                <button @click="isImportModalOpen = false" class="text-gray-400 hover:text-gray-600"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
            </div>
            
            <div class="overflow-y-auto flex-1 pr-2">
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
            
            <div class="mt-6 flex justify-end gap-3 border-t pt-4">
                <button x-show="importStep === 2" type="button" @click="importStep = 1" class="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors">Quay lại</button>
                <button x-show="importStep === 2" type="button" @click="executeImport()" :disabled="isImporting" class="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-md transition-colors disabled:opacity-50 flex gap-2 items-center">
                    <span x-show="!isImporting">Lưu Dữ liệu (<span x-text="importRows.length"></span> dòng)</span>
                    <span x-show="isImporting">Đang lưu...</span>
                </button>
            </div>
        </div>
    </div>
`;
if (!html.includes('Modal Import Smart Paste')) {
    html = html.replace('<!-- CREATE USER MODAL -->', importModalHtml + '\n    <!-- CREATE USER MODAL -->');
}

// 3. Remove "Cấu hình Danh mục Phòng ban" from Sidebar
const deptLinkPattern = /<div class="mt-8 mb-4 px-4 text-xs font-bold text-white\/50 uppercase tracking-wider">Cấu hình<\/div>[\s\S]*?<a href="#" class="flex items-center gap-3 px-4 py-2 hover:bg-white\/10 rounded-lg transition-colors text-sm">[\s\S]*?Danh mục Phòng ban[\s\S]*?<\/a>/;
html = html.replace(deptLinkPattern, '');

fs.writeFileSync('index.html', html);
console.log("Injected Modals and removed old Sidebar link");
