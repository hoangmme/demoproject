const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');

// Replace the buggy button in Create User modal
const buggyBtnRegex = /<button @click="[\s\S]*?users\.push\(\{ id: Date\.now\(\), name: newUserForm\.name[\s\S]*?TẠO TÀI KHOẢN<\/button>/;
const newBtn = `<button @click="saveUser()" class="w-full bg-[#447f28] hover:bg-[#366620] text-white py-3 rounded-lg font-bold shadow-md transition-colors mt-6">TẠO TÀI KHOẢN / CẬP NHẬT</button>`;
content = content.replace(buggyBtnRegex, newBtn);

fs.writeFileSync('index.html', content);
console.log("Fixed Create User button!");
