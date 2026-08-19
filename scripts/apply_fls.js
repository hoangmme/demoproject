const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');

// 1. Add FLS check functions
const funcsRegex = /isAdmin\(\) \{/;
const newFuncs = `
                canReadColumn(colId) {
                    if (this.isAdmin()) return true;
                    if (!this.currentUser || !this.currentUser.column_permissions) return true; // Default allow if not configured
                    try {
                        let perms = typeof this.currentUser.column_permissions === 'string' ? JSON.parse(this.currentUser.column_permissions) : this.currentUser.column_permissions;
                        if (perms[colId] && perms[colId].read === false) return false;
                    } catch(e) {}
                    return true;
                },
                canWriteColumn(colId) {
                    if (this.isAdmin()) return true;
                    if (!this.currentUser || !this.currentUser.column_permissions) return true; 
                    try {
                        let perms = typeof this.currentUser.column_permissions === 'string' ? JSON.parse(this.currentUser.column_permissions) : this.currentUser.column_permissions;
                        if (perms[colId] && perms[colId].write === false) return false;
                    } catch(e) {}
                    return true;
                },
                isAdmin() {`;
content = content.replace(funcsRegex, newFuncs);

// 2. Apply to Table columns in Can Bo view
const tdCccdRegex = /<td class="py-3 px-4" x-text="p\.cccd"><\/td>/;
content = content.replace(tdCccdRegex, `<td class="py-3 px-4">
                                        <span x-show="canReadColumn('cccd')" x-text="p.cccd"></span>
                                        <span x-show="!canReadColumn('cccd')" class="text-gray-400 italic">***</span>
                                    </td>`);
                                    
const tdHometownRegex = /<td class="py-3 px-4" x-text="p\.hometown"><\/td>/;
content = content.replace(tdHometownRegex, `<td class="py-3 px-4">
                                        <span x-show="canReadColumn('hometown')" x-text="p.hometown"></span>
                                        <span x-show="!canReadColumn('hometown')" class="text-gray-400 italic">***</span>
                                    </td>`);

// 3. Apply to Form Inputs in Edit Panel
const inputCccdRegex = /<input type="text" x-model="formData\.cccd" class="w-full rounded-md border border-gray-300 p-2 focus:border-\[#447f28\] focus:ring-\[#447f28\] focus:outline-none" :readonly="!hasPermission\('editKhoiA'\)">/;
content = content.replace(inputCccdRegex, `<input type="text" x-show="canReadColumn('cccd')" x-model="formData.cccd" class="w-full rounded-md border border-gray-300 p-2 focus:border-[#447f28] focus:ring-[#447f28] focus:outline-none" :readonly="!canWriteColumn('cccd') || !hasPermission('editKhoiA')">
                                            <div x-show="!canReadColumn('cccd')" class="w-full rounded-md border border-gray-300 bg-gray-100 p-2 text-gray-400 italic">Không có quyền xem</div>`);
                                            
const inputHometownRegex = /<input type="text" x-model="formData\.hometown" class="w-full rounded-md border border-gray-300 p-2 focus:border-\[#447f28\] focus:ring-\[#447f28\] focus:outline-none" :readonly="!hasPermission\('editKhoiA'\)">/;
content = content.replace(inputHometownRegex, `<input type="text" x-show="canReadColumn('hometown')" x-model="formData.hometown" class="w-full rounded-md border border-gray-300 p-2 focus:border-[#447f28] focus:ring-[#447f28] focus:outline-none" :readonly="!canWriteColumn('hometown') || !hasPermission('editKhoiA')">
                                            <div x-show="!canReadColumn('hometown')" class="w-full rounded-md border border-gray-300 bg-gray-100 p-2 text-gray-400 italic">Không có quyền xem</div>`);

fs.writeFileSync('index.html', content);
console.log("Applied FLS logic to Table and Form!");
