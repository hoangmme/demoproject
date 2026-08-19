const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const oldLogic = `let newMapping = {};
                    this.importHeaders.forEach((h, index) => {
                        const hl = h.toLowerCase();
                        let match = this.systemFields.find(f => {
                            const fl = f.label.toLowerCase();
                            // Exact match after removing (Cột X)
                            const cleanHl = hl.replace(/cột \\d+/g, '').replace(/[()]/g, '').trim();
                            const cleanFl = fl.replace(/cột \\d+/g, '').replace(/[()]/g, '').trim();
                            return cleanHl.includes(cleanFl) || cleanFl.includes(cleanHl);
                        });
                        
                        // Hardcode fallbacks if no match
                        if (!match) {
                            if(hl.includes('họ tên') || hl.includes('họ và tên')) match = { key: 'name' };
                            if(hl.includes('cccd')) match = { key: 'cccd' };
                        }
                        
                        newMapping[index] = match ? match.key : "";
                    });
                    
                    this.importMapping = newMapping;
                    this.importStep = 2;`;

const newLogic = `setTimeout(() => {
                        let newMapping = {};
                        this.importHeaders.forEach((h, index) => {
                            const hl = h.toLowerCase();
                            let match = this.systemFields.find(f => {
                                const fl = f.label.toLowerCase();
                                const cleanHl = hl.replace(/cột \\d+/g, '').replace(/[()]/g, '').trim();
                                const cleanFl = fl.replace(/cột \\d+/g, '').replace(/[()]/g, '').trim();
                                return cleanHl.includes(cleanFl) || cleanFl.includes(cleanHl);
                            });
                            if (!match) {
                                if(hl.includes('họ tên') || hl.includes('họ và tên')) match = { key: 'name' };
                                if(hl.includes('cccd')) match = { key: 'cccd' };
                            }
                            newMapping[index] = match ? match.key : "";
                        });
                        this.importMapping = newMapping;
                        this.importStep = 2;
                    }, 50);`;

html = html.replace(oldLogic, newLogic);
fs.writeFileSync('index.html', html);
console.log('Fixed Alpine race condition');
