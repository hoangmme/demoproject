const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Remove ID from systemFields
html = html.replace("{ key: 'id', label: 'Mã Cán bộ' },", "");

// 2. Update Sample Data headers to perfectly match system labels
const newSampleDataScript = `loadSampleData() {
                    if (this.importType === 'relative') {
                        // 26 columns
                        const headers = Array.from({length: 26}, (_, i) => {
                            const map = {
                                1: 'Quan hệ', 2: 'Họ và tên người thân', 3: 'Năm sinh', 4: 'Nơi cư trú', 5: 'Nghề nghiệp/Nơi làm việc',
                                6: 'Quốc gia (Yếu tố NN)', 7: 'Thời gian ở NN', 8: 'Cơ quan/Tổ chức NN', 9: 'Nguồn kinh phí', 10: 'Công việc hiện tại (NN)',
                                11: 'Kết hôn với người NN', 12: 'Làm việc cho FDI'
                            };
                            return map[i+1] ? \`Cột \${i+53} (\${map[i+1]})\` : \`Cột \${i+53} (Chưa dùng)\`;
                        }).join('\\t');
                        const row1 = Array.from({length: 26}, (_, i) => {
                            const map = {1: 'Vợ', 2: 'Trần Thị Vợ', 3: '1988', 4: 'Hà Nội', 5: 'Giáo viên', 6: 'Úc', 7: '2020-nay', 8: 'ĐH Sydney', 9: 'Tự túc', 10: 'Nghiên cứu sinh', 11: 'Không', 12: 'Không'};
                            return map[i+1] || \`\`;
                        }).join('\\t');
                        const row2 = Array.from({length: 26}, (_, i) => {
                            const map = {1: 'Con trai', 2: 'Nguyễn Văn Con', 3: '2015', 4: 'Hà Nội', 5: 'Học sinh'};
                            return map[i+1] || \`\`;
                        }).join('\\t');
                        this.importPasteText = headers + '\\n' + row1 + '\\n' + row2;
                    } else {
                        // 52 columns
                        const headers = Array.from({length: 52}, (_, i) => {
                            const map = {
                                2: 'Họ và Tên', 3: 'Tên khác', 4: 'Năm sinh', 5: 'Dân tộc', 6: 'Tôn giáo',
                                7: 'Quê quán', 9: 'Chức vụ', 10: 'Nơi ĐKHK thường trú', 11: 'Nơi ở hiện nay', 12: 'Số CCCD',
                                13: 'Hộ chiếu cá nhân', 14: 'Hộ chiếu công vụ', 15: 'Kết quả thẩm tra TCCT', 16: 'Phòng ban', 17: 'Email',
                                40: 'Vấn đề TCCT (Tự diễn biến)', 41: 'Đang bị điều tra', 42: 'Vấn đề khác về lý lịch', 43: 'Kỷ luật Đảng', 44: 'Kỷ luật Chính quyền',
                                45: 'Đi NN không phép', 46: 'Vi phạm PL ở NN', 47: 'Ở lại NN quá hạn', 49: 'Được tặng quà >50tr', 50: 'Cho thuê nhà/đất',
                                51: 'Làm tại cty FDI', 52: 'Kết hôn với người NN'
                            };
                            return map[i+1] ? \`Cột \${i+1} (\${map[i+1]})\` : \`Cột \${i+1} (Chưa dùng)\`;
                        }).join('\\t');
                        const row1 = Array.from({length: 52}, (_, i) => {
                            const map = {2: 'Nguyễn Văn Mẫu', 3: 'Tèo', 4: '1985', 5: 'Kinh', 6: 'Không', 7: 'Hà Nội', 9: 'Trưởng phòng', 10: 'Hà Nội', 11: 'Hà Nội', 12: '001085123456', 13: 'B123', 14: 'C123', 15: 'Sạch', 16: 'D1', 17: 'mau@vn.com'};
                            return map[i+1] || \`\`;
                        }).join('\\t');
                        const row2 = Array.from({length: 52}, (_, i) => {
                            const map = {2: 'Trần Thị Test', 3: 'Mít', 4: '1990', 5: 'Kinh', 6: 'Không', 7: 'Đà Nẵng', 9: 'Nhân viên', 10: 'Đà Nẵng', 11: 'Đà Nẵng', 12: '001090987654', 16: 'D2'};
                            return map[i+1] || \`\`;
                        }).join('\\t');
                        this.importPasteText = headers + '\\n' + row1 + '\\n' + row2;
                    }
                    this.importStep = 2; // Jump to step 2 automatically if loading sample data
                    this.processPastedData();
                },`;

html = html.replace(/loadSampleData\(\) \{[\s\S]*?this\.processPastedData\(\);\s*\},/m, sampleDataScript);

// 3. Improve auto mapping in processPastedData to be super robust
const processDataOld = `this.importMapping = {};
                    this.importHeaders.forEach((h, index) => {
                        const hl = h.toLowerCase();
                        let match = this.systemFields.find(f => hl.includes(f.label.toLowerCase()) || f.label.toLowerCase().includes(hl));
                        if(hl.includes('họ tên') || hl.includes('name')) match = { key: 'name' };
                        if(hl.includes('cccd') || hl.includes('mã')) match = { key: 'id' };
                        
                        this.importMapping[index] = match ? match.key : "";
                    });`;

const processDataNew = `this.importMapping = {};
                    this.importHeaders.forEach((h, index) => {
                        const hl = h.toLowerCase();
                        let match = this.systemFields.find(f => {
                            const fl = f.label.toLowerCase();
                            // Exact match after removing (Cột X)
                            const cleanHl = hl.replace(/cột \d+/g, '').replace(/[()]/g, '').trim();
                            const cleanFl = fl.replace(/cột \d+/g, '').replace(/[()]/g, '').trim();
                            return cleanHl.includes(cleanFl) || cleanFl.includes(cleanHl);
                        });
                        
                        // Hardcode fallbacks if no match
                        if (!match) {
                            if(hl.includes('họ tên') || hl.includes('họ và tên')) match = { key: 'name' };
                            if(hl.includes('cccd')) match = { key: 'cccd' };
                        }
                        
                        this.importMapping[index] = match ? match.key : "";
                    });`;

html = html.replace(processDataOld, processDataNew);

fs.writeFileSync('index.html', html);
console.log('Fixed auto mapping and removed id column');
