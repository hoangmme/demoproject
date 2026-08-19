const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

// 1. Generate the allColumns array
const columns = [
    // Personnel Base
    { id: 'name', label: 'Họ và tên khai sinh [Cột 2]', group: 'Khối A (Cá nhân)' },
    { id: 'otherName', label: 'Tên gọi khác [Cột 3]', group: 'Khối A (Cá nhân)' },
    { id: 'birthYear', label: 'Năm sinh [Cột 4]', group: 'Khối A (Cá nhân)' },
    { id: 'ethnicity', label: 'Dân tộc [Cột 5]', group: 'Khối A (Cá nhân)' },
    { id: 'religion', label: 'Tôn giáo [Cột 6]', group: 'Khối A (Cá nhân)' },
    { id: 'hometown', label: 'Quê quán [Cột 7]', group: 'Khối A (Cá nhân)' },
    { id: 'position', label: 'Chức vụ [Cột 9]', group: 'Khối A (Cá nhân)' },
    { id: 'hktt', label: 'Nơi ĐKHK thường trú [Cột 10]', group: 'Khối A (Cá nhân)' },
    { id: 'currentAddress', label: 'Nơi ở hiện nay [Cột 11]', group: 'Khối A (Cá nhân)' },
    { id: 'cccd', label: 'Số CCCD [Cột 12]', group: 'Khối A (Cá nhân)' },
    { id: 'passportPersonal', label: 'Hộ chiếu cá nhân [Cột 13]', group: 'Khối A (Cá nhân)' },
    { id: 'passportOfficial', label: 'Hộ chiếu công vụ [Cột 14]', group: 'Khối A (Cá nhân)' },
    { id: 'tcctResult', label: 'Kết quả thẩm tra TCCT [Cột 15]', group: 'Khối A (Cá nhân)' },
    { id: 'departmentId', label: 'Phòng ban [Cột 16]', group: 'Khối A (Cá nhân)' },
    { id: 'email', label: 'Email [Cột 17]', group: 'Khối A (Cá nhân)' },

    // Trips (16-29 mapped to 18-31) Let's just group trips by their fields
    { id: 'trips.country', label: 'Chuyến đi: Nước đến [Cột 18]', group: 'Khối B (Chuyến đi)' },
    { id: 'trips.purpose', label: 'Chuyến đi: Mục đích [Cột 19]', group: 'Khối B (Chuyến đi)' },
    { id: 'trips.duration', label: 'Chuyến đi: Thời gian [Cột 20]', group: 'Khối B (Chuyến đi)' },
    { id: 'trips.funding', label: 'Chuyến đi: Nguồn kinh phí [Cột 21]', group: 'Khối B (Chuyến đi)' },
    
    // Flags
    { id: 'flags.politicalIssue', label: 'Lưu ý: Vấn đề TCCT [Cột 40]', group: 'Khối C (Lưu ý)' },
    { id: 'flags.investigating', label: 'Lưu ý: Đang bị điều tra [Cột 41]', group: 'Khối C (Lưu ý)' },
    { id: 'flags.otherIssue', label: 'Lưu ý: Vấn đề khác [Cột 42]', group: 'Khối C (Lưu ý)' },
    { id: 'flags.partyDiscipline', label: 'Lưu ý: Kỷ luật Đảng [Cột 43]', group: 'Khối C (Lưu ý)' },
    { id: 'flags.govDiscipline', label: 'Lưu ý: Kỷ luật Chính quyền [Cột 44]', group: 'Khối C (Lưu ý)' },
    { id: 'flags.noPermission', label: 'Lưu ý: Đi NN không phép [Cột 45]', group: 'Khối C (Lưu ý)' },
    { id: 'flags.lawViolation', label: 'Lưu ý: Vi phạm PL ở NN [Cột 46]', group: 'Khối C (Lưu ý)' },
    { id: 'flags.overstay', label: 'Lưu ý: Ở lại NN quá hạn [Cột 47]', group: 'Khối C (Lưu ý)' },
    { id: 'flags.gift', label: 'Lưu ý: Được tặng quà >50tr [Cột 49]', group: 'Khối C (Lưu ý)' },
    { id: 'flags.rent', label: 'Lưu ý: Cho thuê nhà/đất [Cột 50]', group: 'Khối C (Lưu ý)' },
    { id: 'flags.fdi', label: 'Lưu ý: Làm tại cty FDI [Cột 51]', group: 'Khối C (Lưu ý)' },
    { id: 'flags.marriedToForeigner', label: 'Lưu ý: Kết hôn với người NN [Cột 52]', group: 'Khối C (Lưu ý)' },
    
    // Relatives
    { id: 'relatives.relation', label: 'Thân nhân: Quan hệ', group: 'Thân nhân' },
    { id: 'relatives.name', label: 'Thân nhân: Họ và tên', group: 'Thân nhân' },
    { id: 'relatives.birthYear', label: 'Thân nhân: Năm sinh', group: 'Thân nhân' },
    { id: 'relatives.currentAddress', label: 'Thân nhân: Nơi cư trú', group: 'Thân nhân' },
    { id: 'relatives.job', label: 'Thân nhân: Nghề nghiệp', group: 'Thân nhân' },
    { id: 'relatives.country', label: 'Thân nhân: Quốc gia (Yếu tố NN)', group: 'Thân nhân' },
    { id: 'relatives.time', label: 'Thân nhân: Thời gian ở NN', group: 'Thân nhân' },
    { id: 'relatives.unit', label: 'Thân nhân: Cơ quan/Tổ chức NN', group: 'Thân nhân' },
    { id: 'relatives.funding', label: 'Thân nhân: Nguồn kinh phí', group: 'Thân nhân' },
    { id: 'relatives.currentWork', label: 'Thân nhân: Công việc hiện tại (NN)', group: 'Thân nhân' },
    { id: 'relatives.married', label: 'Thân nhân: Kết hôn với người NN', group: 'Thân nhân' },
    { id: 'relatives.fdi', label: 'Thân nhân: Làm việc cho FDI', group: 'Thân nhân' }
];

const allColumnsStr = 'allColumns: ' + JSON.stringify(columns, null, 20).replace(/"([^"]+)":/g, '$1:') + ',';

// Replace allColumns array in HTML
html = html.replace(/allColumns:\s*\[[\s\S]*?\],/m, allColumnsStr);

// 2. Fix the initial matrix keys
const initialMatrixKeys = columns.map(c => `'${c.id}': {}`).join(', ');
html = html.replace(/flsMatrix:\s*\{[\s\S]*?\},/m, `flsMatrix: {\n                    ${initialMatrixKeys}\n                },`);

// 3. Update HTML tags for trips and relatives
// For trips: replace `:disabled="!canEdit('trips')"` with specific `trips.fieldId` based on x-model
html = html.replace(/(<(input|select|textarea)[^>]*?x-model="trip\.([a-zA-Z0-9_]+)"[^>]*?:disabled=")!canEdit\('trips'\)(")/g, (match, prefix, tag, fieldId, suffix) => {
    return `${prefix}!canEdit('trips.${fieldId}')${suffix}`;
});

// For relatives: replace `:disabled="!canEdit('relatives')"` with specific `relatives.fieldId`
html = html.replace(/(<(input|select|textarea)[^>]*?x-model="relative\.([a-zA-Z0-9_]+)"[^>]*?:disabled=")!canEdit\('relatives'\)(")/g, (match, prefix, tag, fieldId, suffix) => {
    return `${prefix}!canEdit('relatives.${fieldId}')${suffix}`;
});

fs.writeFileSync('index.html', html);
console.log('FLS Expanded Successfully!');
