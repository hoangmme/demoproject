const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');

// 1. Remove mock users array and mock permissions array and replace with empty arrays
const usersMockRegex = /users: \[[^\]]*\],/;
content = content.replace(usersMockRegex, `users: [],\n                availableRoles: [],`);

// 2. Fix 'Sửa quyền' button
const editBtnRegex = /@click="alert\('Chức năng Sửa quyền đang được hoàn thiện[^']+'\)"/g;
content = content.replace(editBtnRegex, `@click="editUser(user)"`);

// 3. Add editUser() and fetchUsers() and saveUser() functions
const funcsRegex = /async fetchData\(\) \{/;
const newFuncs = `
                async fetchUsers() {
                    try {
                        const [usersRes, rolesRes] = await Promise.all([
                            fetch(\`\${API_URL}/users?fields=id,first_name,email,role,status\`, { headers: { 'Authorization': 'Bearer mvp-static-token-999' } }),
                            fetch(\`\${API_URL}/roles?fields=id,name\`, { headers: { 'Authorization': 'Bearer mvp-static-token-999' } })
                        ]);
                        
                        const usersData = await usersRes.json();
                        const rolesData = await rolesRes.json();
                        
                        this.availableRoles = rolesData.data || [];
                        const roleMap = {};
                        this.availableRoles.forEach(r => roleMap[r.id] = r.name);

                        this.users = (usersData.data || []).map(u => ({
                            id: u.id,
                            name: u.first_name || 'Không tên',
                            email: u.email || 'Không có email',
                            roleId: u.role,
                            role: roleMap[u.role] || 'No Role',
                            status: u.status === 'active' ? 'Active' : 'Inactive'
                        }));
                    } catch(e) { console.error("Lỗi fetch Users", e); }
                },
                editUser(user) {
                    this.newUserForm = {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        role: user.roleId, // Map to Role ID
                        password: '' // Only if changing
                    };
                    this.isCreateUserModalOpen = true;
                },
                async saveUser() {
                    if (!this.newUserForm.email || !this.newUserForm.role) {
                        alert("Vui lòng điền đủ Email và Phân quyền!");
                        return;
                    }
                    try {
                        const payload = {
                            first_name: this.newUserForm.name,
                            email: this.newUserForm.email,
                            role: this.newUserForm.role
                        };
                        if (this.newUserForm.password) payload.password = this.newUserForm.password;
                        
                        const method = this.newUserForm.id ? 'PATCH' : 'POST';
                        const url = this.newUserForm.id ? \`\${API_URL}/users/\${this.newUserForm.id}\` : \`\${API_URL}/users\`;
                        
                        const res = await fetch(url, {
                            method,
                            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer mvp-static-token-999' },
                            body: JSON.stringify(payload)
                        });
                        if(res.ok) {
                            this.isCreateUserModalOpen = false;
                            this.newUserForm = { id: null, name: '', email: '', role: 'editor', password: '' };
                            await this.fetchUsers();
                            alert(this.newUserForm.id ? "Đã sửa quyền thành công!" : "Tạo User thành công!");
                        } else {
                            const err = await res.json();
                            alert("Lỗi khi lưu User: " + (err.errors?.[0]?.message || 'Lỗi không xác định'));
                        }
                    } catch(e) {
                        alert("Lỗi kết nối");
                    }
                },
                async fetchData() {`;
content = content.replace(funcsRegex, newFuncs);

// 4. Update the Select dropdown in Create User Modal to use availableRoles
const roleSelectRegex = /<select x-model="newUserForm\.role"[\s\S]*?<\/select>/;
const newRoleSelect = `<select x-model="newUserForm.role" class="w-full rounded-md border border-gray-300 p-2 focus:border-[#447f28] focus:ring-[#447f28] focus:outline-none">
                                        <template x-for="r in availableRoles" :key="r.id">
                                            <option :value="r.id" x-text="r.name"></option>
                                        </template>
                                    </select>`;
content = content.replace(roleSelectRegex, newRoleSelect);

// 5. Update the "Lưu" button in the modal to use saveUser() instead of pushing to array
const modalSaveRegex = /<button type="button" @click=".*?users\.push.*?"/;
const newModalSave = `<button type="button" @click="saveUser()"`;
content = content.replace(modalSaveRegex, newModalSave);

// 6. Ensure fetchUsers is called on init
const initRegex = /this\.fetchLogs\(\);/;
const newInit = `this.fetchLogs(); this.fetchUsers();`;
content = content.replace(initRegex, newInit);


fs.writeFileSync('index.html', content);
console.log("Wired up User Management!");
