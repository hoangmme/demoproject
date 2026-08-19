const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');

const savePayloadRegex = /const payload = JSON\.parse\(JSON\.stringify\(this\.formData\)\);/;
const fixedPayload = `const payload = JSON.parse(JSON.stringify(this.formData));
                        if (!this.selectedPerson && !payload.id) {
                            payload.id = 'CB' + Date.now();
                        }`;

content = content.replace(savePayloadRegex, fixedPayload);

fs.writeFileSync('index.html', content);
console.log("Fixed Missing ID issue!");
