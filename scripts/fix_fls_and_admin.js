const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');

// 1. Fix hasPermission(block)
const hasPermRegex = /hasPermission\(block\) \{[\s\S]*?return this\.permissions\[this\.currentUser\.role\]\?\.\[block\] === true;\s*\}/;
const newHasPerm = `hasPermission(block) {
                    if (!this.currentUser || !this.currentUser.role) return false;
                    const roleName = this.currentUser.role.toLowerCase();
                    if (this.currentUser.email === 'admin@demo.com' || roleName.includes('admin')) return true;
                    if (roleName.includes('editor khối a') && block === 'editKhoiA') return true;
                    if (roleName.includes('editor khối b') && block === 'editKhoiB') return true;
                    if (roleName.includes('editor khối c') && block === 'editKhoiC') return true;
                    if (roleName.includes('thân nhân') && block === 'editThanNhan') return true;
                    return false;
                }`;
content = content.replace(hasPermRegex, newHasPerm);

// 2. Update allColumns in FLS matrix to include groups and column numbers
const allColsRegex = /allColumns: \[[^\]]*\]/;
const newAllCols = `allColumns: [
                    { id: 'code', label: 'Số thẻ CB [Cột 1]', group: 'Khối A (Cá nhân)' },
                    { id: 'name', label: 'Họ và tên khai sinh [Cột 2]', group: 'Khối A (Cá nhân)' },
                    { id: 'otherName', label: 'Tên gọi khác [Cột 3]', group: 'Khối A (Cá nhân)' },
                    { id: 'birthYear', label: 'Năm sinh [Cột 4]', group: 'Khối A (Cá nhân)' },
                    { id: 'ethnicity', label: 'Dân tộc [Cột 5]', group: 'Khối A (Cá nhân)' },
                    { id: 'religion', label: 'Tôn giáo [Cột 6]', group: 'Khối A (Cá nhân)' },
                    { id: 'hometown', label: 'Quê quán [Cột 7]', group: 'Khối A (Cá nhân)' },
                    { id: 'cccd', label: 'Số CCCD [Cột 12]', group: 'Khối A (Cá nhân)' },
                    { id: 'hktt', label: 'HKTT [Cột 10]', group: 'Khối A (Cá nhân)' },
                    { id: 'currentAddress', label: 'Nơi ở hiện tại [Cột 11]', group: 'Khối A (Cá nhân)' },
                    { id: 'passportPersonal', label: 'Hộ chiếu cá nhân [Cột 13]', group: 'Khối A (Cá nhân)' },
                    { id: 'passportOfficial', label: 'Hộ chiếu công vụ [Cột 14]', group: 'Khối A (Cá nhân)' },
                    { id: 'position', label: 'Chức vụ [Cột 9]', group: 'Khối A (Cá nhân)' },
                    { id: 'tcctResult', label: 'Kết luận TCCT [Cột 15]', group: 'Khối A (Cá nhân)' },
                    { id: 'trips', label: 'Lịch sử chuyến đi [Cột 16-29]', group: 'Khối B (Chuyến đi)' },
                    { id: 'relatives', label: 'Thân nhân [Cột 53-78]', group: 'Thân nhân' }
                ]`;
content = content.replace(allColsRegex, newAllCols);

// 3. Update the FLS Matrix UI to display the Group
const trRegex = /<tr class="hover:bg-gray-50 transition-colors">[\s\S]*?<td class="py-3 px-4 font-medium text-gray-800" x-text="col\.label"><\/td>/;
const newTr = `<tr class="hover:bg-gray-50 transition-colors">
                                <td class="py-3 px-4">
                                    <div class="font-medium text-gray-800" x-text="col.label"></div>
                                    <div class="text-xs text-gray-500" x-text="col.group"></div>
                                </td>`;
content = content.replace(trRegex, newTr);

fs.writeFileSync('index.html', content);
console.log("Fixed Admin readonly and enhanced FLS Matrix!");
