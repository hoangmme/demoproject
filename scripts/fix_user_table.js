const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');

// 1. Fix editUser parameter
content = content.replace(/@click="editUser\(user\)"/g, `@click="editUser(u)"`);

// 2. Add 'Tạo User Mới' button to the Users view header
const headerRegex = /<!-- Actions for Phụ lục views -->[\s\S]*?<\/div>/;
const newHeader = `<!-- Actions for Phụ lục views -->
                <div x-show="currentView === 'pl1' || currentView === 'pl2' || currentView === 'pl3'" class="flex items-center gap-4" x-cloak>
                    <button class="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg font-medium shadow-sm transition-colors flex items-center gap-2 text-sm">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                        Xuất Excel
                    </button>
                </div>

                <!-- Actions for Users view -->
                <div x-show="currentView === 'users'" class="flex items-center gap-4" x-cloak>
                    <button @click="openCreateUser()" class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-blue-700 flex items-center gap-2">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                        Tạo User mới
                    </button>
                </div>`;
content = content.replace(headerRegex, newHeader);

fs.writeFileSync('index.html', content);
console.log("Fixed editUser and added Create User button!");
