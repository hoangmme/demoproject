const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');

const emptyMatrixRegex = /flsMatrix:\s*\{\},/;
const newMatrix = `flsMatrix: {
                    'name': {}, 'otherName': {}, 'birthYear': {}, 'ethnicity': {}, 'religion': {}, 'hometown': {}, 'cccd': {}, 'hktt': {}, 'currentAddress': {}, 'passportPersonal': {}, 'passportOfficial': {}, 'position': {}, 'tcctResult': {}, 'trips': {}, 'relatives': {}
                },`;
content = content.replace(emptyMatrixRegex, newMatrix);

fs.writeFileSync('index.html', content);
console.log("Fixed flsMatrix initialization to prevent Alpine crash!");
