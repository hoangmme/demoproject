const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Add Sidebar Link
const usersLink = `                <a href="#" x-show="currentUser && isAdmin()" @click.prevent="currentView = 'users'" :class="currentView === 'users' ? 'bg-white/20 font-semibold' : 'hover:bg-white/10'" class="flex items-center gap-3 px-4 py-2 rounded-lg transition-colors text-sm">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                    Quản lý Người dùng
                </a>`;
const rolesLink = `
                <a href="#" x-show="currentUser && isAdmin()" @click.prevent="currentView = 'roles'" :class="currentView === 'roles' ? 'bg-white/20 font-semibold' : 'hover:bg-white/10'" class="flex items-center gap-3 px-4 py-2 rounded-lg transition-colors text-sm">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                    Quản lý Vai trò (Roles)
                </a>`;
if (!html.includes("currentView = 'roles'")) {
    html = html.replace(usersLink, usersLink + rolesLink);
}

// 2. Add Roles View Section
const usersViewStart = `            <div x-show="currentView === 'users'" class="flex-1 overflow-auto p-4 sm:p-8" x-cloak>`;
const rolesViewHtml = `
            <!-- ROLES VIEW -->
            <div x-show="currentView === 'roles'" class="flex-1 overflow-auto p-4 sm:p-8" x-cloak>
                <div class="max-w-7xl mx-auto bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 class="text-lg font-bold text-gray-800 mb-4">Danh sách Vai trò (Roles)</h3>
                    <div class="overflow-x-auto">
                        <table class="w-full text-left border-collapse text-sm">
                            <thead>
                                <tr class="bg-gray-50 border-b border-gray-200">
                                    <th class="py-3 px-4 font-semibold text-gray-600">Tên Role</th>
                                    <th class="py-3 px-4 font-semibold text-gray-600">ID Directus</th>
                                    <th class="py-3 px-4 font-semibold text-gray-600">Mô tả</th>
                                    <th class="py-3 px-4 font-semibold text-gray-600 w-32">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                <template x-for="r in roles" :key="r.id">
                                    <tr class="border-b border-gray-100 hover:bg-gray-50">
                                        <td class="py-3 px-4 font-medium text-gray-800" x-text="r.name"></td>
                                        <td class="py-3 px-4 font-mono text-xs text-gray-500" x-text="r.id"></td>
                                        <td class="py-3 px-4 text-gray-600" x-text="r.description || 'Không có mô tả'"></td>
                                        <td class="py-3 px-4 text-blue-600 hover:underline cursor-pointer" @click="editRole(r)">
                                            <div class="flex items-center gap-1">
                                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                                                Phân quyền Cột
                                            </div>
                                        </td>
                                    </tr>
                                </template>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
`;
if (!html.includes("ROLES VIEW")) {
    html = html.replace(usersViewStart, rolesViewHtml + usersViewStart);
}

fs.writeFileSync('index.html', html);
console.log("Added Roles UI");
