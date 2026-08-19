const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');

const cleanupRegex = /\/\/ Xóa các trường trống hoặc không hợp lệ khỏi JSON\s*const payload = JSON\.parse\(JSON\.stringify\(this\.formData\)\);/;
const newCleanup = `// Xóa các trường trống hoặc không hợp lệ khỏi JSON
                        const payload = JSON.parse(JSON.stringify(this.formData));
                        Object.keys(payload).forEach(k => {
                            if (payload[k] === "") payload[k] = null;
                        });`;
content = content.replace(cleanupRegex, newCleanup);

fs.writeFileSync('index.html', content);
console.log("Fixed saveData to replace empty strings with null!");
