const fs = require('fs');

let content = fs.readFileSync('index.html', 'utf8');

// The issue is my previous scripts failed to match the exact DOM structure 
// of the Sidebar and Header because I misjudged the existing classes in the user's base code.
// I need to inject the "Hệ thống" section into the sidebar right after "Danh mục Phòng ban"

const sidebarRegex = /Danh mục Phòng ban\s*<\/a>/;
const sidebarReplacement = `Danh mục Phòng ban
                </a>
                
                <div class="pt-4 pb-2 px-2 text-xs font-semibold text-white/50 uppercase tracking-wider" x-show="currentUser && currentUser.role === 'admin'">Hệ thống</div>
                <a href="#" x-show="currentUser && currentUser.role === 'admin'" @click.prevent="currentView = 'users'" :class="currentView === 'users' ? 'bg-white/20 font-semibold' : 'hover:bg-white/10'" class="flex items-center gap-3 px-4 py-2 rounded-lg transition-colors text-sm">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                    Quản lý Người dùng
                </a>
                <a href="#" x-show="currentUser && currentUser.role === 'admin'" @click.prevent="currentView = 'audit_global'" :class="currentView === 'audit_global' ? 'bg-white/20 font-semibold' : 'hover:bg-white/10'" class="flex items-center gap-3 px-4 py-2 rounded-lg transition-colors text-sm">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    Nhật ký Hệ thống
                </a>`;

content = content.replace(sidebarRegex, sidebarReplacement);

fs.writeFileSync('index.html', content);
console.log("Fixed Sidebar Menus for Users and Audit!");
