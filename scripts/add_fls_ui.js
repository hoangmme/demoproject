const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');

// 1. Add column list to Alpine data
const columnList = [
    { id: 'code', label: 'Số thẻ CB' },
    { id: 'name', label: 'Họ và tên khai sinh' },
    { id: 'otherName', label: 'Tên gọi khác' },
    { id: 'birthYear', label: 'Năm sinh' },
    { id: 'ethnicity', label: 'Dân tộc' },
    { id: 'religion', label: 'Tôn giáo' },
    { id: 'hometown', label: 'Quê quán' },
    { id: 'cccd', label: 'Số CCCD' },
    { id: 'hktt', label: 'HKTT' },
    { id: 'currentAddress', label: 'Nơi ở hiện tại' },
    { id: 'passportPersonal', label: 'Hộ chiếu cá nhân' },
    { id: 'passportOfficial', label: 'Hộ chiếu công vụ' },
    { id: 'position', label: 'Chức vụ' },
    { id: 'tcctResult', label: 'Kết luận TCCT' },
    { id: 'trips', label: 'Lịch sử chuyến đi' },
    { id: 'relatives', label: 'Thân nhân' }
    // Note: I will map all 78 columns dynamically or explicitly. For this demo, I'll provide an explicit list.
];

const newAlpineData = `
                isFlsModalOpen: false,
                flsUser: null,
                flsMatrix: {},
                allColumns: [
                    { id: 'code', label: 'Số thẻ CB' },
                    { id: 'name', label: 'Họ và tên khai sinh' },
                    { id: 'otherName', label: 'Tên gọi khác' },
                    { id: 'birthYear', label: 'Năm sinh' },
                    { id: 'ethnicity', label: 'Dân tộc' },
                    { id: 'religion', label: 'Tôn giáo' },
                    { id: 'hometown', label: 'Quê quán' },
                    { id: 'cccd', label: 'Số CCCD' },
                    { id: 'hktt', label: 'HKTT' },
                    { id: 'currentAddress', label: 'Nơi ở hiện tại' },
                    { id: 'passportPersonal', label: 'Hộ chiếu cá nhân' },
                    { id: 'passportOfficial', label: 'Hộ chiếu công vụ' },
                    { id: 'position', label: 'Chức vụ' },
                    { id: 'tcctResult', label: 'Kết luận TCCT' },
                    { id: 'trips', label: 'Lịch sử chuyến đi' },
                    { id: 'relatives', label: 'Thân nhân' }
                ],
                openFlsModal(user) {
                    this.flsUser = user;
                    // Initialize matrix with default true or existing user permissions
                    let perms = {};
                    try {
                        if (user.column_permissions) {
                            perms = typeof user.column_permissions === 'string' ? JSON.parse(user.column_permissions) : user.column_permissions;
                        }
                    } catch(e) {}
                    
                    this.allColumns.forEach(col => {
                        this.flsMatrix[col.id] = perms[col.id] || { read: true, write: true };
                    });
                    this.isFlsModalOpen = true;
                },
                async saveFls() {
                    if (!this.flsUser) return;
                    try {
                        const res = await fetch(\`\${API_URL}/users/\${this.flsUser.id}\`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer mvp-static-token-999' },
                            body: JSON.stringify({ column_permissions: this.flsMatrix })
                        });
                        if(res.ok) {
                            this.isFlsModalOpen = false;
                            await this.fetchUsers(); // Refresh
                            alert('Đã lưu cấu hình Phân quyền Cột thành công!');
                        } else {
                            alert('Lỗi khi lưu cấu hình');
                        }
                    } catch(e) { alert('Lỗi kết nối'); }
                },`;

content = content.replace(/isCreateUserModalOpen: false,/, newAlpineData + '\n                isCreateUserModalOpen: false,');

// 2. Fetch column_permissions in fetchUsers
const fetchUsersRegex = /fetch\(\`\\\$\\{API_URL\\}\/users\?fields=id,first_name,email,role,status\`/;
content = content.replace(fetchUsersRegex, `fetch(\`\${API_URL}/users?fields=id,first_name,email,role,status,column_permissions\``);

const userMapRegex = /role: roleMap\[u\.role\] \|\| 'No Role',/g;
content = content.replace(userMapRegex, `role: roleMap[u.role] || 'No Role',\n                            column_permissions: u.column_permissions,`);


// 3. Add FLS button to User table
const userActionRegex = /<td class="py-3 px-6 text-blue-600 hover:underline cursor-pointer" @click="editUser\(u\)">Sửa quyền<\/td>/;
const newUserAction = `<td class="py-3 px-6 flex gap-3">
                                        <span class="text-blue-600 hover:underline cursor-pointer font-medium" @click="editUser(u)">Sửa Info/Role</span>
                                        <span class="text-purple-600 hover:underline cursor-pointer font-medium flex items-center gap-1" @click="openFlsModal(u)">
                                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                                            Phân quyền Cột
                                        </span>
                                    </td>`;
content = content.replace(userActionRegex, newUserAction);

// 4. Add the FLS Modal HTML
const flsModalHtml = `
    <!-- FLS MATRIX MODAL -->
    <div x-show="isFlsModalOpen" class="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm" x-cloak>
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden" @click.away="isFlsModalOpen = false">
            <div class="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <div>
                    <h3 class="text-xl font-bold text-gray-800">Ma trận Phân quyền Cột (Field-Level Security)</h3>
                    <p class="text-sm text-gray-500 mt-1" x-text="'Cấu hình quyền cho User: ' + (flsUser ? flsUser.name : '')"></p>
                </div>
                <button @click="isFlsModalOpen = false" class="text-gray-400 hover:text-gray-600"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
            </div>
            
            <div class="flex-1 overflow-auto p-6">
                <table class="w-full text-left text-sm text-gray-600">
                    <thead class="bg-gray-50 sticky top-0 z-10 shadow-sm">
                        <tr>
                            <th class="py-3 px-4 font-bold text-gray-700">Tên Cột (Trường dữ liệu)</th>
                            <th class="py-3 px-4 font-bold text-center text-blue-600">Cho phép XEM (Read)</th>
                            <th class="py-3 px-4 font-bold text-center text-green-600">Cho phép SỬA (Write)</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100">
                        <template x-for="col in allColumns" :key="col.id">
                            <tr class="hover:bg-gray-50 transition-colors">
                                <td class="py-3 px-4 font-medium text-gray-800" x-text="col.label"></td>
                                <td class="py-3 px-4 text-center">
                                    <input type="checkbox" x-model="flsMatrix[col.id].read" class="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer">
                                </td>
                                <td class="py-3 px-4 text-center">
                                    <input type="checkbox" x-model="flsMatrix[col.id].write" class="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer">
                                </td>
                            </tr>
                        </template>
                    </tbody>
                </table>
            </div>
            
            <div class="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                <button type="button" @click="isFlsModalOpen = false" class="px-6 py-2.5 rounded-lg font-semibold text-gray-700 hover:bg-gray-200 transition-colors">Hủy</button>
                <button type="button" @click="saveFls()" class="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold shadow-md transition-all active:scale-95 flex items-center gap-2">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                    Lưu Cấu Hình Cột
                </button>
            </div>
        </div>
    </div>
`;
content = content.replace('<!-- CREATE USER MODAL -->', flsModalHtml + '\n    <!-- CREATE USER MODAL -->');

fs.writeFileSync('index.html', content);
console.log("Added FLS Modal UI!");
