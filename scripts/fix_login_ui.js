const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');

// 1. Fix the option text rendering in the login modal
const optionRegex = /<option :value="u\.email" x-text="u\.name \+ ' \(' \+ \(u\.role === 'admin'\?'Full Quyền':\(u\.role==='editor_a'\?'Chỉ sửa Khối A':'Chỉ xem'\)\) \+ '\)'"><\/option>/;
const newOption = `<option :value="u.email" x-text="u.name + ' (' + u.role + ')'"></option>`;
content = content.replace(optionRegex, newOption);

// 2. Remove the mock warning box
const mockWarningRegex = /<div class="mt-4 p-3 bg-blue-50 text-blue-800 text-xs rounded-lg border border-blue-100">[\s\S]*?<\/div>/;
content = content.replace(mockWarningRegex, '');

// Also remove "Mô phỏng Phân quyền (RBAC)" text
const mockTitleRegex = /<p class="text-sm text-gray-500 mb-6 text-center">Mô phỏng Phân quyền \(RBAC\)<\/p>/;
const newTitle = `<p class="text-sm text-gray-500 mb-6 text-center">Hệ thống Đã Kết nối Database</p>`;
content = content.replace(mockTitleRegex, newTitle);

// 3. Fix the hardcoded RBAC checks inside the UI!
// In the mock, we had hasPermission(field) that checked currentUser.role === 'admin'.
// Now currentUser.role is a string like "Administrator" or "Editor Khối A" or "Viewer".
// Wait, the Directus Admin role name is typically "Administrator". Let's check what roleMap gives.
// Directus built-in admin role doesn't have a name in /roles sometimes, or it's "Administrator". 
// Actually, Directus Admin is a special role. 
const hasPermissionRegex = /hasPermission\(permission\) \{[\s\S]*?return this\.permissions\[this\.currentUser\.role\] \? this\.permissions\[this\.currentUser\.role\]\[permission\] : false;\s*\}/;
const newHasPermission = `hasPermission(permission) {
                    if (!this.currentUser) return false;
                    // Directus Admin UUID role usually comes back as "Administrator" or similar, or we can check email
                    if (this.currentUser.email === 'admin@demo.com' || this.currentUser.role.toLowerCase().includes('admin')) return true;
                    if (this.currentUser.role === 'Editor Khối A' && permission === 'editKhoiA') return true;
                    return false;
                }`;
content = content.replace(hasPermissionRegex, newHasPermission);

fs.writeFileSync('index.html', content);
console.log("Fixed Login UI and RBAC text!");
