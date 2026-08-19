const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Fix navigation in Import Modal (remove auto input, add Tiếp tục button)
html = html.replace(
    /<textarea x-model="importPasteText" @input="processPastedData\(\)"/g,
    '<textarea x-model="importPasteText"'
);

const footerNavOld = `<button x-show="importStep === 2" type="button" @click="importStep = 1" class="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors">Quay lại</button>`;
const footerNavNew = `<button x-show="importStep === 2" type="button" @click="importStep = 1" class="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors">Quay lại</button>
                <button x-show="importStep === 1" type="button" @click="processPastedData()" class="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-md transition-colors">Tiếp tục (Khớp cột)</button>`;
html = html.replace(footerNavOld, footerNavNew);

// 2. Expand system fields significantly
const oldSystemFields = `get systemFields() {
                    if (this.importType === 'relative') {
                        return [
                            { key: 'relation', label: 'Quan hệ' },
                            { key: 'name', label: 'Họ và tên người thân' },
                            { key: 'birthYear', label: 'Năm sinh' },
                            { key: 'currentAddress', label: 'Nơi cư trú' },
                            { key: 'job', label: 'Nghề nghiệp/Nơi làm việc' },
                            { key: 'country', label: 'Quốc gia (Yếu tố NN)' },
                            { key: 'time', label: 'Thời gian ở NN' },
                            { key: 'unit', label: 'Cơ quan/Tổ chức NN' },
                            { key: 'funding', label: 'Nguồn kinh phí' }
                        ];
                    }
                    return [
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
                    ];
                },`;

const newSystemFields = `get systemFields() {
                    if (this.importType === 'relative') {
                        return [
                            { key: 'relation', label: 'Quan hệ' },
                            { key: 'name', label: 'Họ và tên người thân' },
                            { key: 'birthYear', label: 'Năm sinh' },
                            { key: 'currentAddress', label: 'Nơi cư trú' },
                            { key: 'job', label: 'Nghề nghiệp/Nơi làm việc' },
                            { key: 'country', label: 'Quốc gia (Yếu tố NN)' },
                            { key: 'time', label: 'Thời gian ở NN' },
                            { key: 'unit', label: 'Cơ quan/Tổ chức NN' },
                            { key: 'funding', label: 'Nguồn kinh phí' },
                            { key: 'currentWork', label: 'Công việc hiện tại (NN)' },
                            { key: 'married', label: 'Kết hôn với người NN' },
                            { key: 'fdi', label: 'Làm việc cho FDI' }
                        ];
                    }
                    return [
                        { key: 'name', label: 'Họ và Tên' },
                        { key: 'otherName', label: 'Tên khác' },
                        { key: 'birthYear', label: 'Năm sinh' },
                        { key: 'ethnicity', label: 'Dân tộc' },
                        { key: 'religion', label: 'Tôn giáo' },
                        { key: 'hometown', label: 'Quê quán' },
                        { key: 'position', label: 'Chức vụ' },
                        { key: 'hktt', label: 'Nơi ĐKHK thường trú' },
                        { key: 'currentAddress', label: 'Nơi ở hiện nay' },
                        { key: 'cccd', label: 'Số CCCD' },
                        { key: 'passportPersonal', label: 'Hộ chiếu cá nhân' },
                        { key: 'passportOfficial', label: 'Hộ chiếu công vụ' },
                        { key: 'tcctResult', label: 'Kết quả thẩm tra TCCT' },
                        { key: 'departmentId', label: 'Phòng ban' },
                        { key: 'email', label: 'Email' },
                        { key: 'id', label: 'Mã Cán bộ' },
                        { key: 'politicalIssue', label: 'Vấn đề TCCT (Tự diễn biến)' },
                        { key: 'investigating', label: 'Đang bị điều tra' },
                        { key: 'otherIssue', label: 'Vấn đề khác về lý lịch' },
                        { key: 'partyDiscipline', label: 'Kỷ luật Đảng' },
                        { key: 'govDiscipline', label: 'Kỷ luật Chính quyền' },
                        { key: 'noPermission', label: 'Đi NN không phép' },
                        { key: 'lawViolation', label: 'Vi phạm PL ở NN' },
                        { key: 'overstay', label: 'Ở lại NN quá hạn' },
                        { key: 'gift', label: 'Được tặng quà >50tr' },
                        { key: 'rent', label: 'Cho thuê nhà/đất' },
                        { key: 'fdi', label: 'Làm tại cty FDI' },
                        { key: 'marriedToForeigner', label: 'Kết hôn với người NN' },
                        { key: 'otherFlags', label: 'Lưu ý khác' }
                    ];
                },`;
html = html.replace(oldSystemFields, newSystemFields);


const oldLoadSampleData = `loadSampleData() {
                    if (this.importType === 'relative') {
                        this.importPasteText = \`Quan hệ\tHọ và tên người thân\tNăm sinh\tNơi cư trú\tNghề nghiệp/Nơi làm việc\tQuốc gia (Yếu tố NN)\tThời gian ở NN
Vợ\tTrần Thị Vợ\t1988\tHà Nội\tGiáo viên\tÚc\t2020-nay
Con trai\tNguyễn Văn Con\t2015\tHà Nội\tHọc sinh\t\t\`;
                    } else {
                        this.importPasteText = \`Họ và Tên [Cột 2]\tTên khác [Cột 3]\tNăm sinh [Cột 4]\tDân tộc [Cột 5]\tTôn giáo [Cột 6]\tQuê quán [Cột 7]\tChức vụ [Cột 9]\tNơi ĐKHK thường trú [Cột 10]\tNơi ở hiện nay [Cột 11]\tSố CCCD [Cột 12]\tHộ chiếu cá nhân [Cột 13]\tHộ chiếu công vụ [Cột 14]\tKết quả thẩm tra TCCT [Cột 15]\tTên người thân (Thân nhân)\tQuan hệ\tNăm sinh người thân\tNghề nghiệp người thân\tThông tin nước ngoài (Thân nhân)
Nguyễn Văn Mẫu\tTèo\t1985\tKinh\tKhông\tHà Nội\tTrưởng phòng\tBa Đình, Hà Nội\tCầu Giấy, Hà Nội\t001085123456\tB1234567\tC9876543\tKhông có vấn đề\tTrần Thị Vợ\tVợ\t1988\tGiáo viên\tĐang du học Úc
Trần Thị Test\tMít\t1990\tKinh\tKhông\tĐà Nẵng\tNhân viên\tHải Châu, Đà Nẵng\tThanh Khê, Đà Nẵng\t001090987654\tB9999999\t\t\tNguyễn Văn Con\tCon trai\t2015\tHọc sinh\t\`;
                    }
                    this.processPastedData();
                },`;

const newLoadSampleData = `loadSampleData() {
                    if (this.importType === 'relative') {
                        this.importPasteText = \`Quan hệ\tHọ và tên người thân\tNăm sinh\tNơi cư trú\tNghề nghiệp/Nơi làm việc\tQuốc gia (Yếu tố NN)\tThời gian ở NN\tCơ quan/Tổ chức NN\tNguồn kinh phí\tCông việc hiện tại (NN)\tKết hôn với người NN\tLàm việc cho FDI
Vợ\tTrần Thị Vợ\t1988\tHà Nội\tGiáo viên\tÚc\t2020-nay\tĐại học Sydney\tTự túc\tNghiên cứu sinh\tKhông\tKhông
Con trai\tNguyễn Văn Con\t2015\tHà Nội\tHọc sinh\t\t\t\t\t\t\t\`;
                    } else {
                        this.importPasteText = \`Họ và Tên\tTên khác\tNăm sinh\tDân tộc\tTôn giáo\tQuê quán\tChức vụ\tNơi ĐKHK thường trú\tNơi ở hiện nay\tSố CCCD\tHộ chiếu cá nhân\tHộ chiếu công vụ\tKết quả thẩm tra TCCT\tPhòng ban\tEmail\tVấn đề TCCT (Tự diễn biến)\tĐang bị điều tra\tVấn đề khác về lý lịch\tKỷ luật Đảng\tKỷ luật Chính quyền\tĐi NN không phép\tVi phạm PL ở NN\tỞ lại NN quá hạn\tĐược tặng quà >50tr\tCho thuê nhà/đất\tLàm tại cty FDI\tKết hôn với người NN\tLưu ý khác
Nguyễn Văn Mẫu\tTèo\t1985\tKinh\tKhông\tHà Nội\tTrưởng phòng\tBa Đình, Hà Nội\tCầu Giấy, Hà Nội\t001085123456\tB1234567\tC9876543\tKhông có vấn đề\tPhòng IT\tmau.nv@mail.com\tKhông\tKhông\tKhông\tKhông\tKhông\tKhông\tKhông\tKhông\tKhông\tKhông\tKhông\tKhông\tKhông
Trần Thị Test\tMít\t1990\tKinh\tKhông\tĐà Nẵng\tNhân viên\tHải Châu, Đà Nẵng\tThanh Khê, Đà Nẵng\t001090987654\tB9999999\t\t\tPhòng NS\ttest.tt@mail.com\tKhông\tKhông\tKhông\tKhông\tKhông\tKhông\tKhông\tKhông\tKhông\tKhông\tKhông\tKhông\tKhông\`;
                    }
                    this.processPastedData();
                },`;
html = html.replace(oldLoadSampleData, newLoadSampleData);

// also ensure flags are nested correctly when parsing payloads for personnel
const parseFlagsLogicOld = `const payload = {};
                            let hasData = false;
                            for (let i = 0; i < this.importHeaders.length; i++) {
                                const fieldKey = this.importMapping[i];
                                if (fieldKey) {
                                    payload[fieldKey] = r[i]?.trim() || null;
                                    if(payload[fieldKey]) hasData = true;
                                }
                            }`;
const parseFlagsLogicNew = `const payload = { flags: {} };
                            let hasData = false;
                            const flagKeys = ['politicalIssue', 'investigating', 'otherIssue', 'partyDiscipline', 'govDiscipline', 'noPermission', 'lawViolation', 'overstay', 'gift', 'rent', 'fdi', 'marriedToForeigner', 'otherFlags'];
                            for (let i = 0; i < this.importHeaders.length; i++) {
                                const fieldKey = this.importMapping[i];
                                if (fieldKey) {
                                    const val = r[i]?.trim() || null;
                                    if(val) hasData = true;
                                    if(flagKeys.includes(fieldKey)) {
                                        payload.flags[fieldKey] = val;
                                    } else {
                                        payload[fieldKey] = val;
                                    }
                                }
                            }`;
html = html.replace(parseFlagsLogicOld, parseFlagsLogicNew);

fs.writeFileSync('index.html', html);
console.log('Fixed navigation and expanded sample data.');
