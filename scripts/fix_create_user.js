const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');

// 1. Add openCreateUser function
const funcsRegex = /editUser\(user\) \{/;
const newFuncs = `openCreateUser() {
                    this.newUserForm = { id: null, name: '', email: '', role: '', password: '' };
                    this.isCreateUserModalOpen = true;
                },
                editUser(user) {`;
content = content.replace(funcsRegex, newFuncs);

// 2. Change button click
content = content.replace(/@click="isCreateUserModalOpen = true"/g, `@click="openCreateUser()"`);

fs.writeFileSync('index.html', content);
console.log("Fixed Create User modal cleanup!");
