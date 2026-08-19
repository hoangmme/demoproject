const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const newSystemFields = `systemFields: [
                    { key: 'name', label: 'Họ và Tên [Cột 2]' },
                    { key: 'otherName', label: 'Tên khác [Cột 3]' },
                    { key: 'birthYear', label: 'Năm sinh [Cột 4]' },
                    { key: 'ethnicity', label: 'Dân tộc [Cột 5]' },
                    { key: 'religion', label: 'Tôn giáo [Cột 6]' },
                    { key: 'hometown', label: 'Quê quán [Cột 7]' },
                    { key: 'position', label: 'Chức vụ [Cột 9]' },
                    { key: 'hktt', label: 'Nơi ĐKHK thường trú [Cột 10]' },
                    { key: 'currentAddress', label: 'Nơi ở hiện nay [Cột 11]' },
                    { key: 'cccd', label: 'Số CCCD [Cột 12]' },
                    { key: 'passportPersonal', label: 'Hộ chiếu cá nhân [Cột 13]' },
                    { key: 'passportOfficial', label: 'Hộ chiếu công vụ [Cột 14]' },
                    { key: 'tcctResult', label: 'Kết quả thẩm tra TCCT [Cột 15]' },
                    { key: 'departmentId', label: 'Phòng ban' },
                    { key: 'email', label: 'Email' },
                    { key: 'id', label: 'Mã Cán bộ' }
                ],`;

html = html.replace(/systemFields: \[[\s\S]*?\],/, newSystemFields);

const newLoadSampleData = `loadSampleData() {
                    this.importPasteText = \`Họ và Tên [Cột 2]\tTên khác [Cột 3]\tNăm sinh [Cột 4]\tDân tộc [Cột 5]\tTôn giáo [Cột 6]\tQuê quán [Cột 7]\tChức vụ [Cột 9]\tNơi ĐKHK thường trú [Cột 10]\tNơi ở hiện nay [Cột 11]\tSố CCCD [Cột 12]\tHộ chiếu cá nhân [Cột 13]\tHộ chiếu công vụ [Cột 14]\tKết quả thẩm tra TCCT [Cột 15]\tTên người thân (Thân nhân)\tQuan hệ\tNăm sinh người thân\tNghề nghiệp người thân\tThông tin nước ngoài (Thân nhân)
Nguyễn Văn Mẫu\tTèo\t1985\tKinh\tKhông\tHà Nội\tTrưởng phòng\tBa Đình, Hà Nội\tCầu Giấy, Hà Nội\t001085123456\tB1234567\tC9876543\tKhông có vấn đề\tTrần Thị Vợ\tVợ\t1988\tGiáo viên\tĐang du học Úc
Trần Thị Test\tMít\t1990\tKinh\tKhông\tĐà Nẵng\tNhân viên\tHải Châu, Đà Nẵng\tThanh Khê, Đà Nẵng\t001090987654\tB9999999\t\t\tNguyễn Văn Con\tCon trai\t2015\tHọc sinh\t\`;
                    this.processPastedData();
                },`;

html = html.replace(/loadSampleData\(\) \{[\s\S]*?\},/, newLoadSampleData);

fs.writeFileSync('index.html', html);
console.log('Expanded systemFields and sample data.');
