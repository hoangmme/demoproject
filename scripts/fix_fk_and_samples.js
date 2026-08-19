const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Generate massive sample data string
const sampleDataScript = `loadSampleData() {
                    if (this.importType === 'relative') {
                        // 26 columns
                        const headers = Array.from({length: 26}, (_, i) => {
                            const map = {
                                1: 'Cột 53 (Quan hệ)', 2: 'Cột 54 (Họ Tên)', 3: 'Cột 55 (Năm sinh)', 4: 'Cột 56 (Nơi cư trú)', 5: 'Cột 57 (Nghề nghiệp)',
                                6: 'Cột 58 (Quốc gia)', 7: 'Cột 59 (Thời gian)', 8: 'Cột 60 (Cơ quan NN)', 9: 'Cột 61 (Kinh phí)', 10: 'Cột 62 (Công việc NN)',
                                11: 'Cột 63 (Kết hôn NN)', 12: 'Cột 64 (Làm FDI)'
                            };
                            return map[i+1] || \`Cột \${i+53} (Chưa dùng)\`;
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
                                2: 'Cột 2 (Họ Tên)', 3: 'Cột 3 (Tên khác)', 4: 'Cột 4 (Năm sinh)', 5: 'Cột 5 (Dân tộc)', 6: 'Cột 6 (Tôn giáo)',
                                7: 'Cột 7 (Quê quán)', 9: 'Cột 9 (Chức vụ)', 10: 'Cột 10 (HKTT)', 11: 'Cột 11 (Nơi ở)', 12: 'Cột 12 (CCCD)',
                                13: 'Cột 13 (HC Cá nhân)', 14: 'Cột 14 (HC Công vụ)', 15: 'Cột 15 (TCCT)', 16: 'Cột 16 (Phòng ban)', 17: 'Cột 17 (Email)',
                                40: 'Cột 40 (Tự diễn biến)', 41: 'Cột 41 (Điều tra)', 42: 'Cột 42 (Lý lịch)', 43: 'Cột 43 (KL Đảng)', 44: 'Cột 44 (KL CQ)',
                                45: 'Cột 45 (Đi NN ko phép)', 46: 'Cột 46 (Vi phạm NN)', 47: 'Cột 47 (Quá hạn)', 49: 'Cột 49 (Tặng quà)', 50: 'Cột 50 (Cho thuê)',
                                51: 'Cột 51 (FDI)', 52: 'Cột 52 (Kết hôn NN)'
                            };
                            return map[i+1] || \`Cột \${i+1} (Chưa dùng)\`;
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
                    this.processPastedData();
                },`;

html = html.replace(/loadSampleData\(\) \{[\s\S]*?this\.processPastedData\(\);\s*\},/m, sampleDataScript);

// 2. Fix invalid foreign key in executeImport
const parseFlagsLogicOld = `if(flagKeys.includes(fieldKey)) {
                                        payload.flags[fieldKey] = val;
                                    } else {
                                        payload[fieldKey] = val;
                                    }`;
const parseFlagsLogicNew = `if (fieldKey === 'departmentId' && val) {
                                        const validIds = this.departments ? this.departments.map(d => String(d.id)) : ['D1', 'D2', 'D3', 'D4', 'D5'];
                                        if (!validIds.includes(String(val))) {
                                            val = null; // Prevent invalid foreign key
                                        }
                                    }
                                    if(flagKeys.includes(fieldKey)) {
                                        payload.flags[fieldKey] = val;
                                    } else {
                                        if (val !== null) payload[fieldKey] = val;
                                    }`;
html = html.replace(parseFlagsLogicOld, parseFlagsLogicNew);

fs.writeFileSync('index.html', html);
console.log('Fixed foreign key and expanded sample data to exact columns.');
