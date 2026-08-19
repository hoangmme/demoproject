const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');

// 1. Remove the misplaced 'Tạo User mới' button from the Users View
const usersViewBtnRegex = /<button @click="isCreateUserModalOpen = true"[\s\S]*?Tạo User mới\s*<\/button>/;
content = content.replace(usersViewBtnRegex, '');

// 2. Update the Header buttons to be context-aware
// Current header button:
// <button class="bg-[#447f28] hover:bg-[#366620] text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors shadow-sm">
//      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
//      Thêm Cán Bộ
// </button>
const headerBtnRegex = /<button class="bg-\[#447f28\] hover:bg-\[#366620\] text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors shadow-sm">[\s\S]*?Thêm Cán Bộ\s*<\/button>/;

const newHeaderBtns = `
                        <!-- Nút Thêm Cán Bộ (Chỉ hiện ở màn hình Quản lý Cán bộ) -->
                        <button x-show="currentView === 'canbo'" @click="openPanel(null)" class="bg-[#447f28] hover:bg-[#366620] text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors shadow-sm">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                            Thêm Cán Bộ
                        </button>
                        
                        <!-- Nút Tạo User (Chỉ hiện ở màn hình Quản lý Người dùng) -->
                        <button x-show="currentView === 'users'" @click="isCreateUserModalOpen = true" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors shadow-sm">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path></svg>
                            Tạo User mới
                        </button>
                        
                        <!-- Nút Xuất Báo cáo (Chỉ hiện ở các màn hình Phụ lục và Lịch sử) -->
                        <button x-show="['pl1', 'pl2', 'pl3', 'audit_global'].includes(currentView)" class="bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors shadow-sm">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                            Xuất Excel
                        </button>`;
content = content.replace(headerBtnRegex, newHeaderBtns);

fs.writeFileSync('index.html', content);
console.log("Fixed Header Button Context!");
