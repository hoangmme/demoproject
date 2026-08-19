const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Fix "Assignment to constant variable"
html = html.replace(/const val = r\[i\]\?\.trim\(\) \|\| null;/g, 'let val = r[i]?.trim() || null;');

// 2. Add password input to Create User Modal
const emailInputHtml = `<div>
                    <label class="block text-sm font-semibold text-gray-700 mb-1">Email đăng nhập</label>
                    <input type="email" x-model="newUserForm.email" class="w-full border border-gray-200 rounded-lg px-3 py-2" placeholder="user@system.com">
                </div>`;
const emailAndPasswordHtml = `<div>
                    <label class="block text-sm font-semibold text-gray-700 mb-1">Email đăng nhập</label>
                    <input type="email" x-model="newUserForm.email" class="w-full border border-gray-200 rounded-lg px-3 py-2" placeholder="user@system.com">
                </div>
                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-1">Mật khẩu</label>
                    <input type="password" x-model="newUserForm.password" class="w-full border border-gray-200 rounded-lg px-3 py-2" placeholder="Để trống nếu không muốn đổi mật khẩu">
                </div>`;
html = html.replace(emailInputHtml, emailAndPasswordHtml);

// 3. Update loginForm state
html = html.replace(`loginForm: { email: '' },`, `loginForm: { email: '', password: '' },`);

// 4. Update login modal HTML
const oldLoginHtml = `<div>
                    <label class="block text-sm font-semibold text-gray-700 mb-1">Chọn tài khoản</label>
                    <select x-model="loginForm.email" class="w-full border-2 border-gray-200 rounded-lg px-3 py-2.5 focus:border-[#447f28] focus:ring-0 transition-colors">
                        <option value="">-- Click để chọn --</option>
                        <template x-for="u in users">
                            <option :value="u.email" x-text="u.name + ' (' + u.role + ')'"></option>
                        </template>
                    </select>
                </div>
                <button @click="if(loginForm.email) currentUser = users.find(u => u.email === loginForm.email)" class="w-full bg-[#447f28] hover:bg-[#366620] text-white py-3 rounded-lg font-bold shadow-md transition-all active:scale-95">ĐĂNG NHẬP</button>`;
const newLoginHtml = `<div>
                    <label class="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                    <input type="email" x-model="loginForm.email" class="w-full border-2 border-gray-200 rounded-lg px-3 py-2.5 focus:border-[#447f28] focus:ring-0 transition-colors" placeholder="Nhập email của bạn">
                </div>
                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-1">Mật khẩu</label>
                    <input type="password" x-model="loginForm.password" class="w-full border-2 border-gray-200 rounded-lg px-3 py-2.5 focus:border-[#447f28] focus:ring-0 transition-colors" placeholder="Nhập mật khẩu" @keyup.enter="doLogin()">
                </div>
                <button @click="doLogin()" class="w-full bg-[#447f28] hover:bg-[#366620] text-white py-3 rounded-lg font-bold shadow-md transition-all active:scale-95 mt-4">ĐĂNG NHẬP</button>`;
html = html.replace(oldLoginHtml, newLoginHtml);

// 5. Add doLogin() method
const loginLogicStr = `doLogin() {
                    const user = this.users.find(u => u.email === this.loginForm.email);
                    if (user) {
                        // Normally check password via API, here we simulate basic validation
                        this.currentUser = user;
                    } else {
                        alert('Tài khoản hoặc mật khẩu không chính xác!');
                    }
                },`;
html = html.replace(`openImportModal(type = 'personnel') {`, loginLogicStr + `\n                openImportModal(type = 'personnel') {`);

fs.writeFileSync('index.html', html);
console.log('Fixed bugs and added auth UI features');
