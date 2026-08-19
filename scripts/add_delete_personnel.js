const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const newButtons = `<button x-show="isAdmin() && selectedPerson" type="button" @click="deleteData()" class="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-red-700 mr-auto">Xóa Cán bộ</button>
                                    <button type="button" @click="closePanel()"`;

html = html.replace(`<button type="button" @click="closePanel()"`, newButtons);

const deleteDataLogic = `async deleteData() {
                    if (!this.selectedPerson) return;
                    if (!confirm('Bạn có chắc chắn muốn xóa toàn bộ hồ sơ của cán bộ này?')) return;
                    
                    try {
                        const res = await fetch(\`\${API_URL}/items/personnels/\${this.selectedPerson.id}\`, {
                            method: 'DELETE',
                            headers: { 'Authorization': 'Bearer mvp-static-token-999' }
                        });
                        
                        if (res.ok) {
                            alert('Xóa thành công!');
                            this.closePanel();
                            this.fetchData();
                        } else {
                            alert('Có lỗi xảy ra khi xóa!');
                        }
                    } catch(e) {
                        alert('Lỗi: ' + e.message);
                    }
                },
                async saveData() {`;

html = html.replace(`async saveData() {`, deleteDataLogic);

fs.writeFileSync('index.html', html);
console.log('Added Delete Personnel button and logic.');
