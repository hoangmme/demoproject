const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');

const initRegex = /\/\/ this\.fetchData\(\); this\.fetchLogs\(\); this\.fetchUsers\(\); \/\/ Use mock data for now/;
const newInit = `this.fetchData(); this.fetchLogs(); this.fetchUsers();`;

content = content.replace(initRegex, newInit);

fs.writeFileSync('index.html', content);
console.log("Uncommented init() functions!");
