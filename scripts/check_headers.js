const fs = require('fs');

function parseHeaders(file) {
    const lines = fs.readFileSync(file, 'utf8').split('\n');
    let l7 = lines[7].split(','); // Line 7 (0-indexed) is row 8 (sub-headers)
    let l8 = lines[8].split(','); // Line 8 is row 9 (sub-sub-headers)
    
    // Some headers in row 8 might be empty, so we look at row 7.
    // Actually, in the previous `head` output:
    // Line 7: TT,Thông tin cá nhân,,,,,,,,,,,,,Thông tin đi nước ngoài...
    // Line 8: ,Họ và tên,Tên khác,"Ngày, tháng, năm sinh",Dân tộc,Tôn giáo,Quê quán,Đơn vị công tác,Chức vụ,Nơi đăng ký hộ khẩu thường trú,Nơi ở hiện nay,Số Căn cước công dân,Thông tin hộ chiếu,,"Kết quả thẩm tra...
    
    // CSV parsing needs a proper parser to handle quotes. Let's write a simple one.
    function parseCSVRow(str) {
        let result = [];
        let cur = '';
        let inQuote = false;
        for (let i = 0; i < (str ? str.length : 0); i++) {
            if (str[i] === '"') {
                inQuote = !inQuote;
            } else if (str[i] === ',' && !inQuote) {
                result.push(cur);
                cur = '';
            } else {
                cur += str[i];
            }
        }
        result.push(cur);
        return result;
    }
    
    let row8 = parseCSVRow(lines[7]);
    let row9 = parseCSVRow(lines[8]);
    let row10 = parseCSVRow(lines[9]);
    
    console.log(`--- ${file} ---`);
    for (let i = 0; i < Math.max(row8.length, row9.length); i++) {
        let name = [row8[i], row9[i], row10[i]].filter(x => x && x.trim() !== '').join(' - ').replace(/\n/g, ' ');
        console.log(`Cột ${i + 1}: ${name}`);
    }
}

parseHeaders('Thong tin can bo gui tan (1) - Cá nhân.csv');
parseHeaders('Thong tin can bo gui tan (1) - Thân nhân.csv');
