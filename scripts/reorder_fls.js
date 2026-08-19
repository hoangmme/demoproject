const fs = require('fs');

const cols = [];

// Cán bộ 2-52
const cbMap = {
    2: { id: 'name', label: 'Họ và Tên' },
    3: { id: 'otherName', label: 'Tên khác' },
    4: { id: 'birthYear', label: 'Năm sinh' },
    5: { id: 'ethnicity', label: 'Dân tộc' },
    6: { id: 'religion', label: 'Tôn giáo' },
    7: { id: 'hometown', label: 'Quê quán' },
    9: { id: 'position', label: 'Chức vụ' },
    10: { id: 'hktt', label: 'Nơi ĐKHK thường trú' },
    11: { id: 'currentAddress', label: 'Nơi ở hiện nay' },
    12: { id: 'cccd', label: 'Số CCCD' },
    13: { id: 'passportPersonal', label: 'Hộ chiếu cá nhân' },
    14: { id: 'passportOfficial', label: 'Hộ chiếu công vụ' },
    15: { id: 'tcctResult', label: 'Kết quả thẩm tra TCCT' },
    16: { id: 'departmentId', label: 'Phòng ban' },
    17: { id: 'email', label: 'Email' },
    18: { id: 'trips.country', label: 'Chuyến đi: Nước đến' },
    19: { id: 'trips.purpose', label: 'Chuyến đi: Mục đích' },
    20: { id: 'trips.duration', label: 'Chuyến đi: Thời gian' },
    21: { id: 'trips.funding', label: 'Chuyến đi: Nguồn kinh phí' },
    40: { id: 'flags.politicalIssue', label: 'Lưu ý: Vấn đề TCCT (Tự diễn biến)' },
    41: { id: 'flags.investigating', label: 'Lưu ý: Đang bị điều tra' },
    42: { id: 'flags.otherIssue', label: 'Lưu ý: Vấn đề khác về lý lịch' },
    43: { id: 'flags.partyDiscipline', label: 'Lưu ý: Kỷ luật Đảng' },
    44: { id: 'flags.govDiscipline', label: 'Lưu ý: Kỷ luật Chính quyền' },
    45: { id: 'flags.noPermission', label: 'Lưu ý: Đi NN không phép' },
    46: { id: 'flags.lawViolation', label: 'Lưu ý: Vi phạm PL ở NN' },
    47: { id: 'flags.overstay', label: 'Lưu ý: Ở lại NN quá hạn' },
    48: { id: 'flags.managed', label: 'Lưu ý: Thuộc diện quản lý' },
    49: { id: 'flags.gift', label: 'Lưu ý: Được tặng quà >50tr' },
    50: { id: 'flags.rent', label: 'Lưu ý: Cho thuê nhà/đất' },
    51: { id: 'flags.fdi', label: 'Lưu ý: Làm tại cty FDI' },
    52: { id: 'flags.marriedToForeigner', label: 'Lưu ý: Kết hôn với người NN' }
};

for (let i = 2; i <= 52; i++) {
    if (cbMap[i]) {
        cols.push({ id: cbMap[i].id, label: `[Cột ${i}] ` + cbMap[i].label, group: 'Cán bộ (Cột 2-52)' });
    } else {
        cols.push({ id: `unused_${i}`, label: `[Cột ${i}] (Chưa dùng)`, group: 'Cán bộ (Cột 2-52)' });
    }
}

// Thân nhân 53-78
const tnMap = {
    53: { id: 'relatives.relation', label: 'Quan hệ' },
    54: { id: 'relatives.name', label: 'Họ và tên' },
    55: { id: 'relatives.birthYear', label: 'Năm sinh' },
    56: { id: 'relatives.currentAddress', label: 'Nơi cư trú' },
    57: { id: 'relatives.job', label: 'Nghề nghiệp' },
    58: { id: 'relatives.country', label: 'Quốc gia (Yếu tố NN)' },
    59: { id: 'relatives.time', label: 'Thời gian ở NN' },
    60: { id: 'relatives.unit', label: 'Cơ quan/Tổ chức NN' },
    61: { id: 'relatives.funding', label: 'Nguồn kinh phí' },
    62: { id: 'relatives.currentWork', label: 'Công việc hiện tại (NN)' },
    63: { id: 'relatives.married', label: 'Kết hôn với người NN' },
    64: { id: 'relatives.fdi', label: 'Làm việc cho FDI' }
};

for (let i = 53; i <= 78; i++) {
    if (tnMap[i]) {
        cols.push({ id: tnMap[i].id, label: `[Cột ${i}] ` + tnMap[i].label, group: 'Thân nhân (Cột 53-78)' });
    } else {
        cols.push({ id: `unused_${i}`, label: `[Cột ${i}] (Chưa dùng)`, group: 'Thân nhân (Cột 53-78)' });
    }
}

let html = fs.readFileSync('index.html', 'utf8');

const allColumnsStr = 'allColumns: ' + JSON.stringify(cols, null, 20).replace(/"([^"]+)":/g, '$1:') + ',';
html = html.replace(/allColumns:\s*\[[\s\S]*?\],/m, allColumnsStr);

// Also update initialMatrixKeys
const initialMatrixKeys = cols.map(c => `'${c.id}': {}`).join(', ');
html = html.replace(/flsMatrix:\s*\{[\s\S]*?\},/m, `flsMatrix: {\n                    ${initialMatrixKeys}\n                },`);

fs.writeFileSync('index.html', html);
console.log('Reordered allColumns and updated matrix successfully!');
