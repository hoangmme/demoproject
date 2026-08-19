const fs = require('fs');

let content = fs.readFileSync('index.html', 'utf8');

// 1. Add 'Tạo User' button to Users View
const usersHeaderRegex = /<table class="w-full text-left border-collapse">/;
const createBtn = `<div class="p-4 flex justify-between items-center border-b border-gray-100">
                        <h3 class="font-bold text-gray-800">Danh sách tài khoản hệ thống</h3>
                        <button @click="isCreateUserModalOpen = true" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-colors flex items-center gap-2">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                            Tạo User mới
                        </button>
                    </div>\n                    <table class="w-full text-left border-collapse">`;
content = content.replace(usersHeaderRegex, createBtn);

// 2. Add `isCreateUserModalOpen` and `newUserForm` to Alpine state
const appDataRegex = /users: \[/;
const alpineStateInjection = `isCreateUserModalOpen: false,
                newUserForm: { name: '', email: '', role: 'editor_a' },\n                users: [`;
content = content.replace(appDataRegex, alpineStateInjection);

// 3. Add the Create User Modal HTML right before </body>
const bodyEndRegex = /<\/body>/;
const createUserModalHTML = `
    <!-- CREATE USER MODAL -->
    <div x-show="isCreateUserModalOpen" class="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm" x-cloak>
        <div class="bg-white p-8 rounded-2xl shadow-2xl w-[500px] border border-gray-100">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-xl font-bold text-gray-800">Tạo tài khoản mới</h2>
                <button @click="isCreateUserModalOpen = false" class="text-gray-400 hover:text-gray-600"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
            </div>
            
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-1">Họ và tên</label>
                    <input type="text" x-model="newUserForm.name" class="w-full border border-gray-200 rounded-lg px-3 py-2" placeholder="Ví dụ: Nguyễn Văn X">
                </div>
                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-1">Email đăng nhập</label>
                    <input type="email" x-model="newUserForm.email" class="w-full border border-gray-200 rounded-lg px-3 py-2" placeholder="user@system.com">
                </div>
                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-1">Phân quyền (Role)</label>
                    <select x-model="newUserForm.role" class="w-full border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 font-medium text-[#447f28]">
                        <option value="admin">Sếp Tổng (Admin) - Toàn quyền</option>
                        <option value="editor_a">Nhân viên Nhập liệu - Chỉ sửa Khối A</option>
                        <option value="viewer">Chuyên viên Báo cáo - Chỉ Xem</option>
                    </select>
                </div>
                
                <!-- Display Permissions Preview based on selected role -->
                <div class="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-lg">
                    <p class="text-sm font-bold text-blue-800 mb-2">Chi tiết quyền hạn (Preview):</p>
                    <div class="grid grid-cols-2 gap-2 text-sm">
                        <div class="flex justify-between"><span>Khối A (Cơ bản):</span> <span class="font-bold" :class="permissions[newUserForm.role].editKhoiA ? 'text-green-600' : 'text-red-500'" x-text="permissions[newUserForm.role].editKhoiA ? 'Được sửa' : 'Chỉ xem'"></span></div>
                        <div class="flex justify-between"><span>Khối B (Chuyến đi):</span> <span class="font-bold" :class="permissions[newUserForm.role].editKhoiB ? 'text-green-600' : 'text-red-500'" x-text="permissions[newUserForm.role].editKhoiB ? 'Được sửa' : 'Chỉ xem'"></span></div>
                        <div class="flex justify-between"><span>Khối C (Lưu ý):</span> <span class="font-bold" :class="permissions[newUserForm.role].editKhoiC ? 'text-green-600' : 'text-red-500'" x-text="permissions[newUserForm.role].editKhoiC ? 'Được sửa' : 'Chỉ xem'"></span></div>
                        <div class="flex justify-between"><span>Thân nhân:</span> <span class="font-bold" :class="permissions[newUserForm.role].editThanNhan ? 'text-green-600' : 'text-red-500'" x-text="permissions[newUserForm.role].editThanNhan ? 'Được sửa' : 'Chỉ xem'"></span></div>
                    </div>
                </div>

                <button @click="
                    users.push({ id: Date.now(), name: newUserForm.name, email: newUserForm.email, role: newUserForm.role });
                    isCreateUserModalOpen = false;
                    newUserForm = { name: '', email: '', role: 'editor_a' };
                " class="w-full bg-[#447f28] hover:bg-[#366620] text-white py-3 rounded-lg font-bold shadow-md transition-colors mt-6">TẠO TÀI KHOẢN</button>
            </div>
        </div>
    </div>\n</body>`;
content = content.replace(bodyEndRegex, createUserModalHTML);

fs.writeFileSync('index.html', content);
console.log("Added Create User Modal to UI!");
