const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Add "Thêm Vai trò" Button to Roles View
const rolesViewHeader = `<h3 class="text-lg font-bold text-gray-800 mb-4">Danh sách Vai trò (Roles)</h3>`;
const rolesViewHeaderWithBtn = `<div class="flex justify-between items-center mb-4">
                        <h3 class="text-lg font-bold text-gray-800">Danh sách Vai trò (Roles)</h3>
                        <button @click="openRoleModal()" class="bg-[#447f28] hover:bg-[#366620] text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 shadow-sm">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                            Thêm Vai trò
                        </button>
                    </div>`;
if (!html.includes('openRoleModal()')) {
    html = html.replace(rolesViewHeader, rolesViewHeaderWithBtn);
}

// 2. Add Role Modal HTML
const createRoleModalHtml = `
    <!-- Modal Thêm/Sửa Role -->
    <div x-cloak x-show="isRoleModalOpen" class="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
        <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div x-show="isRoleModalOpen" x-transition.opacity class="fixed inset-0 bg-gray-900 bg-opacity-50 transition-opacity" @click="isRoleModalOpen = false"></div>
            <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div x-show="isRoleModalOpen" 
                 x-transition:enter="ease-out duration-300" x-transition:enter-start="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95" x-transition:enter-end="opacity-100 translate-y-0 sm:scale-100" 
                 x-transition:leave="ease-in duration-200" x-transition:leave-start="opacity-100 translate-y-0 sm:scale-100" x-transition:leave-end="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95" 
                 class="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full border border-gray-100">
                <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
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
                </div>
                <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-gray-100">
                    <button type="button" @click="saveRole()" class="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-[#447f28] text-base font-medium text-white hover:bg-[#366620] focus:outline-none sm:ml-3 sm:w-auto sm:text-sm">
                        Lưu Vai trò
                    </button>
                    <button type="button" @click="isRoleModalOpen = false" class="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
                        Hủy
                    </button>
                </div>
            </div>
        </div>
    </div>
`;
if (!html.includes('isRoleModalOpen')) {
    html = html.replace('<!-- Modal Thêm User -->', createRoleModalHtml + '\n    <!-- Modal Thêm User -->');
}

// 3. Add JS state
if (!html.includes('isRoleModalOpen: false,')) {
    html = html.replace('roles: [],', 'roles: [],\n                isRoleModalOpen: false,\n                roleForm: { name: "", description: "" },');
}

// 4. Add openRoleModal() and saveRole()
const saveRoleFunc = `
                openRoleModal() {
                    this.roleForm = { name: "", description: "" };
                    this.isRoleModalOpen = true;
                },
                async saveRole() {
                    if (!this.roleForm.name.trim()) {
                        alert("Vui lòng nhập tên Vai trò!");
                        return;
                    }
                    try {
                        const res = await fetch(\`\${API_URL}/roles\`, {
                            method: 'POST',
                            headers: { 
                                'Content-Type': 'application/json',
                                'Authorization': 'Bearer mvp-static-token-999'
                            },
                            body: JSON.stringify({
                                name: this.roleForm.name,
                                description: this.roleForm.description,
                                icon: 'verified_user'
                            })
                        });
                        if (res.ok) {
                            alert("Thêm Vai trò thành công!");
                            this.isRoleModalOpen = false;
                            
                            // Tải lại danh sách roles
                            const rolesRes = await fetch(\`\${API_URL}/roles\`, {
                                headers: { 'Authorization': 'Bearer mvp-static-token-999' }
                            });
                            if(rolesRes.ok) {
                                const data = await rolesRes.json();
                                this.roles = data.data;
                            }
                        } else {
                            alert("Có lỗi xảy ra khi lưu Vai trò!");
                        }
                    } catch(e) {
                        alert("Lỗi kết nối Server: " + e.message);
                    }
                },
`;
if (!html.includes('openRoleModal() {')) {
    html = html.replace('saveUser() {', saveRoleFunc + '\n                saveUser() {');
}

fs.writeFileSync('index.html', html);
console.log("Added Create Role UI and Logic");
