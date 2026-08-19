const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');

const previewRegex = /<div class="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">[\s\S]*?<\/div>\s*<\/div>/;
content = content.replace(previewRegex, '');

fs.writeFileSync('index.html', content);
console.log("Removed hardcoded permissions preview to fix crash!");
