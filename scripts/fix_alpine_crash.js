const fs = require('fs');

let content = fs.readFileSync('index.html', 'utf8');

// The crash happens because formData is initialized as {}.
// We need to initialize it with the nested structures used by x-model.
const formDataRegex = /formData: \{\},/;
const safeFormData = `formData: {
                    trips: [{}],
                    flags: {},
                    relatives: []
                },`;
content = content.replace(formDataRegex, safeFormData);

// Also add a quick alert for "Sửa quyền" so the user knows it's a mock button
const suaQuyenRegex = /<td class="py-3 px-6 text-blue-600 hover:underline cursor-pointer">Sửa quyền<\/td>/g;
const safeSuaQuyen = `<td class="py-3 px-6 text-blue-600 hover:underline cursor-pointer" @click="alert('Chức năng Sửa quyền đang được hoàn thiện. Vui lòng tạo User mới để test các Rule khác nhau!')">Sửa quyền</td>`;
content = content.replace(suaQuyenRegex, safeSuaQuyen);

fs.writeFileSync('index.html', content);
console.log("Fixed Alpine crash on x-model undefined!");
