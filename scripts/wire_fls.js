const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// Replace openFlsModal with editRole
html = html.replace(
    /openFlsModal\(user\) \{[\s\S]*?this\.flsUser = user;/,
    `editRole(role) {
                    this.flsRole = role;`
);

// In editRole, replace user.column_permissions with role.column_permissions
html = html.replace(
    /if \(user\.column_permissions\) \{[\s\S]*?perms = typeof user\.column_permissions === 'string' \? JSON\.parse\(user\.column_permissions\) : user\.column_permissions;[\s\S]*?\}/,
    `if (role.column_permissions) {
                            perms = typeof role.column_permissions === 'string' ? JSON.parse(role.column_permissions) : role.column_permissions;
                        }`
);

// Update saveFls() to use flsRole and save to roles endpoint
html = html.replace(
    /async saveFls\(\) \{[\s\S]*?if \(!this\.flsUser\) return;[\s\S]*?try \{[\s\S]*?const res = await fetch\(\`\\\$\\{API_URL\\}\/users\/\\\$\\{this\.flsUser\.id\\}\`, \{[\s\S]*?method: 'PATCH',/,
    `async saveFls() {
                    if (!this.flsRole) return;
                    try {
                        const res = await fetch(\`\${API_URL}/roles/\${this.flsRole.id}\`, {
                            method: 'PATCH',`
);

// Fix "Tạo Cán bộ" bug where it uses newRoleForm? No, they asked to add password to Create User. (Already did that in previous script).

// Update Modal Title from "User: flsUser.name" to "Role: flsRole.name"
html = html.replace(
    /Phân quyền Cột \(FLS\) cho User: <span x-text="flsUser\?\.name \|\| flsUser\?\.email"><\/span>/,
    `Phân quyền Cột (FLS) cho Vai trò: <span x-text="flsRole?.name"></span>`
);

// Let's also update the "canReadColumn" and "canWriteColumn" methods to read from user.role.column_permissions instead of user.column_permissions!
html = html.replace(
    /if \(this\.currentUser && this\.currentUser\.column_permissions && this\.currentUser\.column_permissions\[colId\]\) \{[\s\S]*?return this\.currentUser\.column_permissions\[colId\]\.read !== false;[\s\S]*?\}/,
    `if (this.currentUser && this.availableRoles) {
                        const role = this.availableRoles.find(r => r.id === this.currentUser.roleId);
                        if (role && role.column_permissions && role.column_permissions[colId]) {
                            return role.column_permissions[colId].read !== false;
                        }
                    }`
);
html = html.replace(
    /if \(this\.currentUser && this\.currentUser\.column_permissions && this\.currentUser\.column_permissions\[colId\]\) \{[\s\S]*?return this\.currentUser\.column_permissions\[colId\]\.write === true;[\s\S]*?\}/,
    `if (this.currentUser && this.availableRoles) {
                        const role = this.availableRoles.find(r => r.id === this.currentUser.roleId);
                        if (role && role.column_permissions && role.column_permissions[colId]) {
                            return role.column_permissions[colId].write === true;
                        }
                    }`
);

fs.writeFileSync('index.html', html);
console.log("Replaced FLS logic to target Roles instead of Users");
