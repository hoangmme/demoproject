const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');

// 1. Remove mock API and restore Real API in saveData
const mockSaveRegex = /\/\/ MOCK SAVE FUNCTION[\s\S]*?\}\s*\n                    \n                    this\.closePanel\(\);/m;
const realSaveCode = `try {
                        const method = this.selectedPerson ? 'PATCH' : 'POST';
                        const url = this.selectedPerson 
                            ? \`\${API_URL}/items/personnels/\${this.selectedPerson.id}\` 
                            : \`\${API_URL}/items/personnels\`;
                        
                        // Xóa các trường trống hoặc không hợp lệ khỏi JSON
                        const payload = JSON.parse(JSON.stringify(this.formData));
                        
                        const res = await fetch(url, {
                            method: method,
                            headers: { 
                                'Content-Type': 'application/json',
                                'Authorization': 'Bearer mvp-static-token-999'
                            },
                            body: JSON.stringify(payload)
                        });
                        
                        if(res.ok) {
                            this.closePanel();
                            await this.fetchData(); 
                            alert("Đã lưu thành công vào Database thật!");
                        } else {
                            const err = await res.json();
                            alert("Lỗi khi lưu dữ liệu: " + (err.errors?.[0]?.message || 'Lỗi không xác định'));
                        }
                    } catch (e) {
                        console.error(e);
                        alert("Lỗi kết nối tới Database");
                    }`;
content = content.replace(mockSaveRegex, realSaveCode);

// 2. Fix fetchData to pull from real DB
const mockFetchRegex = /async fetchData\(\) \{[\s\S]*?\}\s*\},/m;
const realFetchCode = `async fetchData() {
                    try {
                        const res = await fetch(\`\${API_URL}/items/personnels\`, {
                            headers: { 'Authorization': 'Bearer mvp-static-token-999' }
                        });
                        const json = await res.json();
                        if (json.data) {
                            // Ensure JSON fields are parsed if they come back as strings, though Directus usually returns objects for JSON fields
                            this.personnel = json.data.map(p => {
                                p.trips = p.trips || [];
                                p.flags = p.flags || {};
                                p.relatives = p.relatives || [];
                                return p;
                            });
                        }
                    } catch (e) {
                        console.error("Lỗi kết nối DB:", e);
                    }
                },`;
content = content.replace(mockFetchRegex, realFetchCode);

// 3. Define API_URL globally if it doesn't exist
if (!content.includes("const API_URL")) {
    content = content.replace(/<script>/, "<script>\n        const API_URL = 'http://localhost:8055';");
}

fs.writeFileSync('index.html', content);
console.log("Wired up Real Database Fetch and Save!");
