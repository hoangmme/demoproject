const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Remove "Cấu hình Danh mục Phòng ban"
const dsPhongBanPattern = /<div class="pt-4 pb-2 px-2 text-xs font-semibold text-white\/50 uppercase tracking-wider">Cấu hình<\/div>\s*<a href="#" class="flex items-center gap-3 px-4 py-2 hover:bg-white\/10 rounded-lg transition-colors text-sm">\s*<svg[^>]*>.*?<\/svg>\s*Danh mục Phòng ban\s*<\/a>/s;
html = html.replace(dsPhongBanPattern, '');

// 2. Add Delete Role button and function
const roleActionsHtml = `<div class="flex items-center gap-4">
                                            <div class="text-blue-600 hover:underline cursor-pointer flex items-center gap-1" @click="editRole(r)">
                                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                                                Phân quyền Cột
                                            </div>
                                            <div class="text-red-500 hover:underline cursor-pointer flex items-center gap-1" @click="deleteRole(r)">
                                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                                Xóa
                                            </div>
                                        </div>`;
html = html.replace(
    /<td class="py-3 px-4 text-blue-600 hover:underline cursor-pointer" @click="editRole\(r\)">[\s\S]*?Phân quyền Cột[\s\S]*?<\/td>/,
    `<td class="py-3 px-4">
                                        ${roleActionsHtml}
                                        </td>`
);

const deleteRoleJS = `async saveRole() {`;
const deleteRoleLogic = `async deleteRole(r) {
                    if(!confirm('Bạn có chắc chắn muốn xóa vai trò "' + r.name + '"?')) return;
                    try {
                        const res = await fetch(\`\${API_URL}/roles/\${r.id}\`, {
                            method: 'DELETE',
                            headers: { 'Authorization': 'Bearer mvp-static-token-999' }
                        });
                        if (res.ok) {
                            alert('Đã xóa vai trò thành công!');
                            this.fetchUsers();
                        } else {
                            alert('Có lỗi xảy ra khi xóa!');
                        }
                    } catch(e) { console.error('Delete role error', e); }
                },
                async saveRole() {`;
html = html.replace(deleteRoleJS, deleteRoleLogic);

// 3. Add Import Button next to Thêm Cán bộ
const importBtnHtml = `<button @click="openImportModal()" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium shadow-md transition-colors flex items-center gap-2">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                        Import (Paste)
                    </button>`;
html = html.replace(
    /<button @click="openPanel\(null\)" class="bg-\[\#447f28\].*?Thêm Cán bộ\s*<\/button>/s,
    `$& \n                    ${importBtnHtml}`
);

fs.writeFileSync('index.html', html);
console.log("Applied final fixes.");
