const systemFields = [
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
    { key: 'email', label: 'Email' }
];

const headers = [
    "Cột 1(Chưa dùng)",
    "Cột 2 (Họ Tên)"
];

headers.forEach((h, index) => {
    const hl = h.toLowerCase();
    let match = systemFields.find(f => {
        const fl = f.label.toLowerCase();
        const cleanHl = hl.replace(/cột \d+/g, '').replace(/[()]/g, '').trim();
        const cleanFl = fl.replace(/cột \d+/g, '').replace(/[()]/g, '').trim();
        console.log(`Comparing [${cleanHl}] with [${cleanFl}]`);
        return cleanHl.includes(cleanFl) || cleanFl.includes(cleanHl);
    });
    console.log(`${h} -> ${match ? match.key : 'none'}`);
});
