const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');

// 1. Fix hasPermission function
const hasPermRegex = /hasPermission\(permission\) \{[\s\S]*?return this\.permissions\[this\.currentUser\.role\] \? this\.permissions\[this\.currentUser\.role\]\[permission\] : false;\s*\}/;
const newHasPerm = `hasPermission(permission) {
                    if (!this.currentUser || !this.currentUser.role) return false;
                    const roleName = this.currentUser.role.toLowerCase();
                    if (this.currentUser.email === 'admin@demo.com' || roleName.includes('admin')) return true;
                    if (roleName.includes('editor khối a') && permission === 'editKhoiA') return true;
                    if (roleName.includes('editor khối b') && permission === 'editKhoiB') return true;
                    if (roleName.includes('editor khối c') && permission === 'editKhoiC') return true;
                    if (roleName.includes('thân nhân') && permission === 'editThanNhan') return true;
                    return false;
                }`;
content = content.replace(hasPermRegex, newHasPerm);

// 2. Fix sidebar and header visibility checks (x-show)
// Currently they use: x-show="currentUser && currentUser.role === 'admin'"
// Let's replace this globally with a simpler check that calls a new function isAdmin()
const showAdminRegex = /currentUser\.role === 'admin'/g;
content = content.replace(showAdminRegex, `isAdmin()`);

// 3. Add isAdmin() to Alpine data
const isAdminFunc = `
                isAdmin() {
                    if (!this.currentUser || !this.currentUser.role) return false;
                    return this.currentUser.email === 'admin@demo.com' || this.currentUser.role.toLowerCase().includes('admin');
                },`;
content = content.replace(/init\(\) \{/, `${isAdminFunc}\n                init() {`);

// 4. In the Login modal, fix the display of role
// Ensure we don't have the hardcoded check
const loginOptionRegex = /u\.name \+ ' \(' \+ \(u\.role === 'admin'\?'Full Quyền':\(u\.role==='editor_a'\?'Chỉ sửa Khối A':'Chỉ xem'\)\) \+ '\)'/;
content = content.replace(loginOptionRegex, `u.name + ' (' + u.role + ')'`);

// Also fix the role display in the User Management Table
const tdRoleRegex = /<span x-text="u\.role === 'admin' \? 'Full Quyền' : \(u\.role === 'editor' \? 'Editor' : 'Chỉ xem'\)"/;
const newTdRole = `<span x-text="u.role"`;
content = content.replace(tdRoleRegex, newTdRole);


fs.writeFileSync('index.html', content);
console.log("Fixed Admin Role Checks!");
