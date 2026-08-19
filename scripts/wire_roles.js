const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// Add roles: [] to appData
if (!html.includes('roles: [],')) {
    html = html.replace('users: [],', 'users: [],\n                roles: [],\n                flsRole: null,');
}

// Fetch roles in fetchData()
const fetchRoles = `
                    // Fetch roles
                    try {
                        const rolesRes = await fetch(\`\${API_URL}/roles\`, {
                            headers: { 'Authorization': 'Bearer mvp-static-token-999' }
                        });
                        if(rolesRes.ok) {
                            const data = await rolesRes.json();
                            this.roles = data.data;
                        }
                    } catch(e) { console.error('Fetch roles error', e); }
`;
if (!html.includes('// Fetch roles')) {
    html = html.replace('// Lấy danh sách Users', fetchRoles + '\n                    // Lấy danh sách Users');
}

// Remove FLS button from Users table
const oldFlsBtn = `<td class="py-3 px-6 text-orange-600 hover:underline cursor-pointer" @click="editUserFls(user)">Sửa quyền FLS</td>`;
html = html.replace(oldFlsBtn, `<!-- FLS moved to roles -->`);

// Replace editUserFls with editRoleFls
const oldEditUserFls = `editUserFls(user) {
                    this.flsUser = user;
                    this.flsMatrix = user.column_permissions || {};`;
const newEditRoleFls = `editRole(role) {
                    this.flsRole = role;
                    this.flsMatrix = role.column_permissions || {};`;
html = html.replace(oldEditUserFls, newEditRoleFls);

const oldSaveFls = `async saveFls() {
                    try {
                        const res = await fetch(\`\${API_URL}/users/\${this.flsUser.id}\`, {
                            method: 'PATCH',
                            headers: { 
                                'Content-Type': 'application/json',
                                'Authorization': 'Bearer mvp-static-token-999'
                            },
                            body: JSON.stringify({
                                column_permissions: this.flsMatrix
                            })
                        });`;
const newSaveFls = `async saveFls() {
                    try {
                        const res = await fetch(\`\${API_URL}/roles/\${this.flsRole.id}\`, {
                            method: 'PATCH',
                            headers: { 
                                'Content-Type': 'application/json',
                                'Authorization': 'Bearer mvp-static-token-999'
                            },
                            body: JSON.stringify({
                                column_permissions: this.flsMatrix
                            })
                        });`;
html = html.replace(oldSaveFls, newSaveFls);

// Update Modal title
html = html.replace(`Phân quyền Cột (FLS) cho User: <span x-text="flsUser?.name || flsUser?.email"></span>`, `Phân quyền Cột (FLS) cho Role: <span x-text="flsRole?.name"></span>`);

// Update logic in canReadColumn and canWriteColumn
const oldCanRead = `if (this.currentUser && this.currentUser.column_permissions && this.currentUser.column_permissions[colId]) {
                        return this.currentUser.column_permissions[colId].read !== false;
                    }`;
const newCanRead = `if (this.currentUser && this.currentUser.role && this.currentUser.role.column_permissions && this.currentUser.role.column_permissions[colId]) {
                        return this.currentUser.role.column_permissions[colId].read !== false;
                    }`;
html = html.replace(oldCanRead, newCanRead);

const oldCanWrite = `if (this.currentUser && this.currentUser.column_permissions && this.currentUser.column_permissions[colId]) {
                        return this.currentUser.column_permissions[colId].write === true;
                    }`;
const newCanWrite = `if (this.currentUser && this.currentUser.role && this.currentUser.role.column_permissions && this.currentUser.role.column_permissions[colId]) {
                        return this.currentUser.role.column_permissions[colId].write === true;
                    }`;
html = html.replace(oldCanWrite, newCanWrite);

fs.writeFileSync('index.html', html);
console.log("Wired up Role FLS");
