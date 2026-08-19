const fs = require('fs');

let content = fs.readFileSync('index.html', 'utf8');

const saveDataRegex = /async saveData\(\) \{[\s\S]*?alert\("Lỗi hệ thống"\);\s*\}\s*\}/;

const mockSaveData = `saveData() {
                    // MOCK SAVE FUNCTION
                    if (!this.currentUser) {
                        alert("Vui lòng Đăng nhập trước khi lưu!");
                        return;
                    }
                    
                    if (this.selectedPerson) {
                        // Update
                        const idx = this.personnel.findIndex(p => p.id === this.selectedPerson.id);
                        if (idx !== -1) {
                            this.personnel[idx] = JSON.parse(JSON.stringify(this.formData));
                            // Add mock global audit log
                            this.globalAuditLogs.unshift({
                                id: Date.now(),
                                time: new Date().toLocaleString('vi-VN'),
                                user: this.currentUser.name,
                                role: this.currentUser.email,
                                action: 'CẬP NHẬT',
                                entity: this.formData.name || 'Cán bộ không tên',
                                field: 'Nhiều trường',
                                oldValue: 'Dữ liệu cũ',
                                newValue: 'Dữ liệu mới',
                                details: 'Cập nhật qua giao diện'
                            });
                        }
                    } else {
                        // Create
                        const newPerson = JSON.parse(JSON.stringify(this.formData));
                        newPerson.id = 'CB' + Date.now();
                        if (!newPerson.name) newPerson.name = 'Cán bộ Mới ' + Math.floor(Math.random() * 100);
                        this.personnel.push(newPerson);
                        
                        // Add mock global audit log
                        this.globalAuditLogs.unshift({
                            id: Date.now(),
                            time: new Date().toLocaleString('vi-VN'),
                            user: this.currentUser.name,
                            role: this.currentUser.email,
                            action: 'THÊM MỚI',
                            entity: newPerson.name,
                            field: '',
                            oldValue: '',
                            newValue: '',
                            details: 'Tạo hồ sơ cán bộ mới'
                        });
                    }
                    
                    this.closePanel();
                    // Optional alert to confirm success
                    // alert("Đã lưu thành công (Chế độ giả lập)! Vui lòng kiểm tra Nhật ký Hệ thống.");
                }`;

content = content.replace(saveDataRegex, mockSaveData);

fs.writeFileSync('index.html', content);
console.log("Mocked saveData function for testing!");
