const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Fix fetchUsers roles fetch
html = html.replace(
    /fetch\(\`\$\{API_URL\}\/roles\?fields=id,name\`,/g,
    "fetch(`${API_URL}/roles?fields=id,name,column_permissions`,"
);

// 2. Parse column_permissions in fetchUsers
const oldRoleMap = `                        const roleMap = {};
                        this.availableRoles.forEach(r => roleMap[r.id] = r.name);`;
const newRoleMap = `                        const roleMap = {};
                        const rolePermsMap = {};
                        this.availableRoles.forEach(r => {
                            roleMap[r.id] = r.name;
                            let perms = r.column_permissions;
                            if (typeof perms === 'string') {
                                try { perms = JSON.parse(perms); } catch(e) { perms = null; }
                            }
                            rolePermsMap[r.id] = perms || {};
                            r.column_permissions = perms || {};
                        });`;
html = html.replace(oldRoleMap, newRoleMap);

const oldUsersMap = `roleId: u.role,
                            role: roleMap[u.role] || 'No Role',
                            column_permissions: u.column_permissions,`;
const newUsersMap = `roleId: u.role,
                            role: roleMap[u.role] || 'No Role',
                            column_permissions: rolePermsMap[u.role] || {},`;
html = html.replace(oldUsersMap, newUsersMap);

// 3. Update isAdmin to set current user properly during login
// (The current doLogin only matches email, let's make sure currentUser gets the column_permissions)
const oldInit = `init() {`;
const newInit = `
                canEdit(fieldId) {
                    if (!this.currentUser) return false;
                    if (this.isAdmin()) return true; // Admins can edit everything
                    const perms = this.currentUser.column_permissions;
                    if (perms && perms[fieldId] !== undefined) {
                        return perms[fieldId].write === true;
                    }
                    // If FLS not set for this role, default to false
                    return false;
                },
                canView(fieldId) {
                    if (!this.currentUser) return false;
                    if (this.isAdmin()) return true;
                    const perms = this.currentUser.column_permissions;
                    if (perms && perms[fieldId] !== undefined) {
                        return perms[fieldId].read === true;
                    }
                    return false;
                },
                toggleAllFls(type, checked) {
                    this.allColumns.forEach(col => {
                        this.flsMatrix[col.id][type] = checked;
                    });
                },
                init() {`;
html = html.replace(oldInit, newInit);

// 4. Update FLS Modal headers with Select All checkboxes
const oldThead = `<th class="py-3 px-4 font-bold text-center text-blue-600">Cho phép XEM (Read)</th>
                            <th class="py-3 px-4 font-bold text-center text-green-600">Cho phép SỬA (Write)</th>`;
const newThead = `<th class="py-3 px-4 font-bold text-center text-blue-600">
                                <div class="flex items-center justify-center gap-2">
                                    <input type="checkbox" @change="toggleAllFls('read', $event.target.checked)" class="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer">
                                    Cho phép XEM (Read)
                                </div>
                            </th>
                            <th class="py-3 px-4 font-bold text-center text-green-600">
                                <div class="flex items-center justify-center gap-2">
                                    <input type="checkbox" @change="toggleAllFls('write', $event.target.checked)" class="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer">
                                    Cho phép SỬA (Write)
                                </div>
                            </th>`;
html = html.replace(oldThead, newThead);

fs.writeFileSync('index.html', html);
console.log('Fixed permissions script stage 1 done.');
