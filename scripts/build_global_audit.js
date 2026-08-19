const fs = require('fs');

let content = fs.readFileSync('index.html', 'utf8');

// 1. Sidebar: Add "Nhật ký hệ thống" under "Quản lý Người dùng"
const sidebarRegex = /<a href="#" x-show="currentUser && currentUser\.role === 'admin'" @click="currentView = 'users'"([\s\S]*?)<\/a>/;
const sidebarReplacement = `<a href="#" x-show="currentUser && currentUser.role === 'admin'" @click="currentView = 'users'"$1</a>
                    <a href="#" x-show="currentUser && currentUser.role === 'admin'" @click="currentView = 'audit_global'" :class="currentView === 'audit_global' ? 'bg-[#447f28] text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'" class="flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        Nhật ký Hệ thống
                    </a>`;
content = content.replace(sidebarRegex, sidebarReplacement);

// 2. Navbar: Update title logic
const navbarRegex = /currentView === 'users' \? 'Quản lý Người dùng' :/;
const navbarReplacement = `currentView === 'users' ? 'Quản lý Người dùng' :
                        currentView === 'audit_global' ? 'Nhật ký Hệ thống (Audit Log)' :`;
content = content.replace(navbarRegex, navbarReplacement);

// 3. Remove local Audit Log Tab button
const auditTabRegex = /<button @click="activeTab = 'audit'"[\s\S]*?Lịch sử chỉnh sửa\s*<\/button>/;
content = content.replace(auditTabRegex, '');

// 4. Remove local Audit Log Content
const auditContentRegex = /<!-- TAB 3: LỊCH SỬ CHỈNH SỬA \(AUDIT LOG\) -->[\s\S]*?(?=<!-- Panel Footer -->)/;
content = content.replace(auditContentRegex, '');

// 5. Add Global Audit Log View
const usersViewRegex = /<!-- ================= VIEW: USERS ================= -->[\s\S]*?<\/div>\s*<\/div>/;
const globalAuditView = `
            <!-- ================= VIEW: GLOBAL AUDIT LOG ================= -->
            <div x-show="currentView === 'audit_global'" class="flex-1 overflow-auto p-4 sm:p-8" x-cloak>
                <div class="bg-white rounded-xl shadow-sm border border-gray-200">
                    <div class="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between rounded-t-xl">
                        <h3 class="font-bold text-gray-800">Hoạt động hệ thống (System Activity Log)</h3>
                        <div class="flex gap-2">
                            <input type="text" placeholder="Tìm kiếm nhật ký..." class="border border-gray-200 rounded-lg px-3 py-1.5 text-sm w-64">
                            <button class="bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg text-sm hover:bg-gray-50 flex items-center gap-2">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path></svg>
                                Lọc
                            </button>
                        </div>
                    </div>
                    <div class="overflow-x-auto">
                        <table class="w-full text-left border-collapse min-w-[800px]">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Thời gian</th>
                                    <th class="py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Tài khoản thao tác</th>
                                    <th class="py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Hành động</th>
                                    <th class="py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Đối tượng (Hồ sơ)</th>
                                    <th class="py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Chi tiết</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-100">
                                <template x-for="log in globalAuditLogs" :key="log.id">
                                    <tr class="hover:bg-blue-50/50 transition-colors">
                                        <td class="py-3 px-6 text-sm text-gray-500 font-medium whitespace-nowrap" x-text="log.time"></td>
                                        <td class="py-3 px-6 text-sm">
                                            <div class="flex items-center gap-2">
                                                <div class="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs" x-text="log.user.charAt(0)"></div>
                                                <span class="font-semibold text-gray-800" x-text="log.user"></span>
                                            </div>
                                            <p class="text-xs text-gray-500 ml-8" x-text="log.role"></p>
                                        </td>
                                        <td class="py-3 px-6">
                                            <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold"
                                                :class="log.action === 'THÊM MỚI' ? 'bg-green-100 text-green-700' : (log.action === 'CẬP NHẬT' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700')"
                                                x-text="log.action"></span>
                                        </td>
                                        <td class="py-3 px-6 text-sm font-medium text-gray-700" x-text="log.entity"></td>
                                        <td class="py-3 px-6 text-sm text-gray-600">
                                            <p x-show="log.action === 'CẬP NHẬT'">
                                                Đổi <span class="font-bold text-[#447f28]" x-text="log.field"></span>: 
                                                <span class="line-through text-red-400 mx-1" x-text="log.oldValue"></span>
                                                <svg class="w-3 h-3 inline text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                                                <span class="text-green-600 font-bold mx-1" x-text="log.newValue"></span>
                                            </p>
                                            <p x-show="log.action !== 'CẬP NHẬT'" x-text="log.details"></p>
                                        </td>
                                    </tr>
                                </template>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>`;
content = content.replace(usersViewRegex, match => match + '\n' + globalAuditView);

// 6. Inject Mock Global Audit Logs
const mockInjectionRegex = /permissions: \{/;
const mockLogs = `globalAuditLogs: [
                    { id: 1, time: '10/08/2026 15:30', user: 'Sếp Tổng (Admin)', role: 'admin@system.com', action: 'CẬP NHẬT', entity: 'Nguyễn Văn A (NV001)', field: 'Quê quán [Cột 7]', oldValue: 'Hà Nội', newValue: 'Thanh Hóa', details: '' },
                    { id: 2, time: '10/08/2026 14:15', user: 'Nhân viên Nhập liệu', role: 'editor@system.com', action: 'THÊM MỚI', entity: 'Nguyễn Văn A (NV001)', field: '', oldValue: '', newValue: '', details: 'Tạo hồ sơ cán bộ mới' },
                    { id: 3, time: '09/08/2026 09:10', user: 'Sếp Tổng (Admin)', role: 'admin@system.com', action: 'CẬP NHẬT', entity: 'Trần Thị C (NV002)', field: 'Ngày sinh [Cột 4]', oldValue: '1985-01-01', newValue: '1985-11-30', details: '' },
                    { id: 4, time: '08/08/2026 16:20', user: 'Admin Hệ Thống', role: 'sys@admin.com', action: 'XÓA', entity: 'Lê Văn B (NV003)', field: '', oldValue: '', newValue: '', details: 'Đã xóa hồ sơ cán bộ' }
                ],
                permissions: {`;
content = content.replace(mockInjectionRegex, mockLogs);

fs.writeFileSync('index.html', content);
console.log("Built Global Audit Log UI!");
