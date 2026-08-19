const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');

// Remove 'code' from allColumns in FLS
const codeRegex = /\{\s*id:\s*'code',\s*label:\s*'Số thẻ CB \[Cột 1\]',\s*group:\s*'Khối A \(Cá nhân\)'\s*\},\s*/;
content = content.replace(codeRegex, '');

fs.writeFileSync('index.html', content);
console.log("Removed 'code' column from FLS matrix!");
