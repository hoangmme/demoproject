const fs = require('fs');

let content = fs.readFileSync('index.html', 'utf8');

// 1. Add Sidebar Menu Item for Users
const sidebarMenuRegex = /<a href="#" @click="currentView = 'pl3'"[\s\S]*?<\/svg>\s*Phụ lục 3\s*<\/a>/;
const newSidebarMenuItem = `<a href="#" @click="currentView = 'pl3'" :class="currentView === 'pl3' ? 'bg-[#447f28] text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'" class="flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                    Phụ lục 3
                </a>
                
                <!-- Separator -->
                <div class="pt-4 mt-4 border-t border-gray-200">
                    <div class="px-4 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Hệ thống</div>
                    <a href="#" x-show="currentUser && currentUser.role === 'admin'" @click="currentView = 'users'" :class="currentView === 'users' ? 'bg-[#447f28] text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'" class="flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                        Quản lý Người dùng
                    </a>
                </div>`;
content = content.replace(sidebarMenuRegex, newSidebarMenuItem);

// 2. Add Top Navbar User Info
const headerRegex = /<header class="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">[\s\S]*?<\/header>/;
const newHeader = `<header class="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
                <div class="flex items-center justify-between px-8 py-4">
                    <h2 class="text-2xl font-bold text-gray-800" x-text="
                        currentView === 'canbo' ? 'Danh sách Cán bộ, Đảng viên' : 
                        currentView === 'users' ? 'Quản lý Người dùng' :
                        currentView === 'pl1' ? 'Phụ lục 1: Yếu tố nước ngoài' : 
                        currentView === 'pl2' ? 'Phụ lục 2: Thân nhân nước ngoài' : 'Phụ lục 3: Lịch sử tiếp xúc'
                    "></h2>
                    <div class="flex items-center gap-4">
                        <div class="text-sm text-right" x-show="currentUser">
                            <p class="font-bold text-gray-800" x-text="currentUser?.name"></p>
                            <p class="text-xs text-gray-500" x-text="currentUser?.role === 'admin' ? 'Quản trị viên' : (currentUser?.role === 'editor_a' ? 'Biên tập Khối A' : 'Chỉ xem')"></p>
                        </div>
                        <button @click="currentUser = null" x-show="currentUser" class="text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors">Đăng xuất</button>
                        <button class="bg-[#447f28] hover:bg-[#366620] text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors shadow-sm">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                            Thêm Cán Bộ
                        </button>
                    </div>
                </div>
            </header>`;
content = content.replace(headerRegex, newHeader);

// 3. Add Users View
const pl3ViewRegex = /<!-- ================= VIEW: PHỤ LỤC 3 ================= -->[\s\S]*?<\/div>\s*<\/div>/;
const usersView = `
            <!-- ================= VIEW: USERS ================= -->
            <div x-show="currentView === 'users'" class="flex-1 overflow-auto p-4 sm:p-8" x-cloak>
                <div class="bg-white rounded-xl shadow-sm border border-gray-200">
                    <table class="w-full text-left border-collapse">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Tên người dùng</th>
                                <th class="py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Email</th>
                                <th class="py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Vai trò (Role)</th>
                                <th class="py-3 px-6 text-xs font-semibold text-gray-600 uppercase">Hành động</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-100">
                            <template x-for="u in users" :key="u.id">
                                <tr>
                                    <td class="py-3 px-6 font-medium text-gray-800" x-text="u.name"></td>
                                    <td class="py-3 px-6 text-gray-600" x-text="u.email"></td>
                                    <td class="py-3 px-6">
                                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" 
                                              :class="u.role === 'admin' ? 'bg-red-100 text-red-800' : (u.role === 'editor_a' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800')"
                                              x-text="u.role === 'admin' ? 'Admin' : (u.role === 'editor_a' ? 'Editor Khối A' : 'Viewer')">
                                        </span>
                                    </td>
                                    <td class="py-3 px-6 text-blue-600 hover:underline cursor-pointer">Sửa quyền</td>
                                </tr>
                            </template>
                        </tbody>
                    </table>
                </div>
            </div>`;
content = content.replace(pl3ViewRegex, match => match + '\n' + usersView);

// 4. Add Login Modal and Alpine auth state
const bodyEndRegex = /<\/body>/;
const loginModal = `
    <!-- LOGIN MODAL -->
    <div x-show="!currentUser" class="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm" x-cloak>
        <div class="bg-white p-8 rounded-2xl shadow-2xl w-96 border border-gray-100">
            <div class="flex justify-center mb-6">
                <div class="w-16 h-16 bg-[#447f28]/10 rounded-full flex items-center justify-center text-[#447f28]">
                    <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4"></path></svg>
                </div>
            </div>
            <h2 class="text-2xl font-bold text-gray-800 mb-2 text-center">Đăng nhập Hệ thống</h2>
            <p class="text-sm text-gray-500 mb-6 text-center">Mô phỏng Phân quyền (RBAC)</p>
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-1">Chọn tài khoản</label>
                    <select x-model="loginForm.email" class="w-full border-2 border-gray-200 rounded-lg px-3 py-2.5 focus:border-[#447f28] focus:ring-0 transition-colors">
                        <option value="">-- Click để chọn --</option>
                        <template x-for="u in users">
                            <option :value="u.email" x-text="u.name + ' (' + (u.role === 'admin'?'Full Quyền':(u.role==='editor_a'?'Chỉ sửa Khối A':'Chỉ xem')) + ')'"></option>
                        </template>
                    </select>
                </div>
                <button @click="if(loginForm.email) currentUser = users.find(u => u.email === loginForm.email)" class="w-full bg-[#447f28] hover:bg-[#366620] text-white py-3 rounded-lg font-bold shadow-md transition-all active:scale-95">ĐĂNG NHẬP</button>
            </div>
            <div class="mt-4 p-3 bg-blue-50 text-blue-800 text-xs rounded-lg border border-blue-100">
                <strong>Lưu ý:</strong> Chức năng này giả lập việc lấy Token từ Directus để phân quyền Field-Level Security.
            </div>
        </div>
    </div>\n</body>`;
content = content.replace(bodyEndRegex, loginModal);

// 5. Update appData()
const appDataRegex = /currentView: 'canbo',/;
const newAppData = `currentView: 'canbo',
                currentUser: null,
                loginForm: { email: '' },
                users: [
                    { id: 1, name: 'Sếp Tổng (Admin)', email: 'admin@system', role: 'admin' },
                    { id: 2, name: 'Nhân viên Nhập liệu', email: 'editor@system', role: 'editor_a' },
                    { id: 3, name: 'Chuyên viên Báo cáo', email: 'viewer@system', role: 'viewer' }
                ],
                permissions: {
                    'admin': { editKhoiA: true, editKhoiB: true, editKhoiC: true, editThanNhan: true },
                    'editor_a': { editKhoiA: true, editKhoiB: false, editKhoiC: false, editThanNhan: false },
                    'viewer': { editKhoiA: false, editKhoiB: false, editKhoiC: false, editThanNhan: false }
                },
                hasPermission(block) {
                    if (!this.currentUser) return false;
                    return this.permissions[this.currentUser.role]?.[block] === true;
                },`;
content = content.replace(appDataRegex, newAppData);

// 6. Slide-over Panel: Tabs & Fieldsets
// Add Audit Log tab button
const tabButtonsRegex = /<button @click="activeTab = 'thannhan'".*?<\/button>/;
const auditTabButton = `<button @click="activeTab = 'thannhan'" :class="activeTab === 'thannhan' ? 'text-[#447f28] border-b-2 border-[#447f28]' : 'text-gray-500 hover:text-gray-700'" class="px-4 py-3 font-semibold transition-colors">Thân nhân (26 trường)</button>
                                <button @click="activeTab = 'audit'" :class="activeTab === 'audit' ? 'text-[#447f28] border-b-2 border-[#447f28]' : 'text-gray-500 hover:text-gray-700'" class="px-4 py-3 font-semibold transition-colors flex items-center gap-2">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                    Lịch sử chỉnh sửa
                                </button>`;
content = content.replace(tabButtonsRegex, auditTabButton);

// Audit Tab Content & Fieldset wrappings
const canhanTabRegex = /<div x-show="activeTab === 'canhan'" class="space-y-10">([\s\S]*?)<!-- Khối B:/;
const canhanTabReplace = `<div x-show="activeTab === 'canhan'" class="space-y-10">
                                        <!-- Khối A: Thông tin cá nhân cơ bản -->
                                        <fieldset :disabled="!hasPermission('editKhoiA')" class="disabled:opacity-75 relative group">
                                            <div x-show="!hasPermission('editKhoiA')" class="absolute top-2 right-2 bg-gray-800 text-white text-xs px-2 py-1 rounded shadow z-10 flex items-center gap-1">
                                                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg> Read Only
                                            </div>
                                            $1
                                        </fieldset>
                                        <!-- Khối B:`;
content = content.replace(canhanTabRegex, canhanTabReplace);

const khoiBRegex = /<!-- Khối B: Lịch sử Đi nước ngoài -->([\s\S]*?)<!-- Khối C:/;
const khoiBReplace = `<!-- Khối B: Lịch sử Đi nước ngoài -->
                                        <fieldset :disabled="!hasPermission('editKhoiB')" class="disabled:opacity-75 relative">
                                            <div x-show="!hasPermission('editKhoiB')" class="absolute top-2 right-2 bg-gray-800 text-white text-xs px-2 py-1 rounded shadow z-10 flex items-center gap-1">
                                                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg> Read Only
                                            </div>
$1</fieldset>
                                        <!-- Khối C:`;
content = content.replace(khoiBRegex, khoiBReplace);

const khoiCRegex = /<!-- Khối C: Lưu ý & Vi phạm -->([\s\S]*?)<\/div>\s*<!-- TAB 2:/;
const khoiCReplace = `<!-- Khối C: Lưu ý & Vi phạm -->
                                        <fieldset :disabled="!hasPermission('editKhoiC')" class="disabled:opacity-75 relative">
                                            <div x-show="!hasPermission('editKhoiC')" class="absolute top-2 right-2 bg-gray-800 text-white text-xs px-2 py-1 rounded shadow z-10 flex items-center gap-1">
                                                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg> Read Only
                                            </div>
$1</fieldset>
                                    </div>
                                    <!-- TAB 2:`;
content = content.replace(khoiCRegex, khoiCReplace);

const thannhanTabRegex = /<!-- TAB 2: THÂN NHÂN \(26 Fields\) -->([\s\S]*?)<\/div>\s*<!-- Panel Footer -->/;
const thannhanTabReplace = `<!-- TAB 2: THÂN NHÂN (26 Fields) -->
                                    <div x-show="activeTab === 'thannhan'" class="space-y-6">
                                        <fieldset :disabled="!hasPermission('editThanNhan')" class="disabled:opacity-75 relative min-h-[300px]">
                                            <div x-show="!hasPermission('editThanNhan')" class="absolute top-2 right-2 bg-gray-800 text-white text-xs px-2 py-1 rounded shadow z-10 flex items-center gap-1">
                                                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg> Read Only
                                            </div>
$1</fieldset>
                                    </div>
                                    
                                    <!-- TAB 3: LỊCH SỬ CHỈNH SỬA (AUDIT LOG) -->
                                    <div x-show="activeTab === 'audit'" class="space-y-6">
                                        <div class="bg-gray-50 border border-gray-200 rounded-xl p-6">
                                            <h3 class="font-bold text-gray-800 mb-6 flex items-center gap-2">
                                                <svg class="w-5 h-5 text-[#447f28]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                                Lịch sử thay đổi hồ sơ (Directus Revisions)
                                            </h3>
                                            
                                            <div class="relative border-l-2 border-gray-200 ml-4 space-y-8">
                                                <template x-for="log in formData.auditLogs" :key="log.id">
                                                    <div class="relative pl-6">
                                                        <!-- Timeline Dot -->
                                                        <div class="absolute w-4 h-4 bg-[#447f28] rounded-full -left-[9px] top-1 border-4 border-white shadow"></div>
                                                        
                                                        <div class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                                                            <div class="flex justify-between items-start mb-2">
                                                                <div class="flex items-center gap-2">
                                                                    <div class="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs" x-text="log.user.charAt(0)"></div>
                                                                    <div>
                                                                        <p class="font-bold text-sm text-gray-800" x-text="log.user"></p>
                                                                        <p class="text-xs text-gray-500" x-text="log.role"></p>
                                                                    </div>
                                                                </div>
                                                                <span class="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded" x-text="log.time"></span>
                                                            </div>
                                                            <div class="mt-3">
                                                                <p class="text-sm text-gray-700">Đã cập nhật <span class="font-bold text-[#447f28] bg-[#447f28]/10 px-1 rounded" x-text="log.field"></span></p>
                                                                <div class="mt-2 flex items-center gap-3 text-sm bg-gray-50 p-2 rounded border border-gray-100">
                                                                    <span class="line-through text-red-400" x-text="log.oldValue"></span>
                                                                    <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                                                                    <span class="text-green-600 font-bold" x-text="log.newValue"></span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </template>
                                                
                                                <!-- Fallback if no logs -->
                                                <div x-show="!formData.auditLogs || formData.auditLogs.length === 0" class="pl-6 text-sm text-gray-500 italic">
                                                    Chưa có lịch sử chỉnh sửa nào.
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <!-- Panel Footer -->`;
content = content.replace(thannhanTabRegex, thannhanTabReplace);

// 7. Inject Audit Logs into mockData (CB01)
const mockDataLogRegex = /flags: \{/;
const mockDataLogInjection = `auditLogs: [
                            { id: 1, user: 'Sếp Tổng (Admin)', role: 'Admin', time: '10/08/2026 15:30', field: 'Quê quán [Cột 7]', oldValue: 'Hà Nội', newValue: 'Thanh Hóa' },
                            { id: 2, user: 'Nhân viên Nhập liệu', role: 'Editor Khối A', time: '09/08/2026 09:15', field: 'Số CCCD [Cột 12]', oldValue: '001080111111', newValue: '001080123456' },
                            { id: 3, user: 'Sếp Tổng (Admin)', role: 'Admin', time: '01/08/2026 14:00', field: 'Tôn giáo [Cột 6]', oldValue: 'Phật giáo', newValue: 'Không' }
                        ],
                        flags: {`;
content = content.replace(mockDataLogRegex, mockDataLogInjection);

fs.writeFileSync('index.html', content);
console.log("Injected User Management, Login, FLS, and Audit Log UI!");
