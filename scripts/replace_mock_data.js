const fs = require('fs');

let content = fs.readFileSync('index.html', 'utf8');

const fullMockData = `personnel: [
                    {
                        id: 'CB01',
                        code: 'NV001',
                        name: 'Nguyễn Văn A',
                        otherName: 'Bảy A',
                        birthYear: '1980-05-12',
                        ethnicity: 'Kinh',
                        religion: 'Không',
                        departmentId: 'D1',
                        cccd: '001080123456',
                        hktt: 'Ba Đình, Hà Nội',
                        currentAddress: 'Đống Đa, Hà Nội',
                        passportPersonal: 'B1234567',
                        passportOfficial: 'C7654321',
                        position: 'Trưởng phòng',
                        tcctResult: 'Đủ điều kiện tiêu chuẩn chính trị (Theo KL số 123 ngày 01/01/2023)',
                        
                        // Lịch sử chuyến đi
                        trips: [
                            {
                                id: 'TR01',
                                qd: '123/QĐ-UBND',
                                qdDate: '2023-01-10',
                                agency: 'UBND TP Hà Nội',
                                exit: '2023-02-01',
                                enter: '2023-02-15',
                                country: 'Nhật Bản',
                                times: 1,
                                purpose: 'Công tác',
                                funding: 'Ngân sách NN',
                                submittedPassport: 'X',
                                submittedReport: 'X',
                                // Học tập
                                trainType: 'Bồi dưỡng ngắn hạn',
                                trainLoc: 'Đại học Tokyo',
                                trainRole: 'Học viên',
                                trainAgency: 'Sở Nội vụ',
                                trainTime: '01/02/2023 - 15/02/2023',
                                // Nhóm
                                leader: 'Nguyễn Văn A',
                                members: 'Trần Thị B, Lê Văn C',
                                count: 3
                            },
                            {
                                id: 'TR02',
                                qd: '456/QĐ-UBND',
                                qdDate: '2024-05-20',
                                agency: 'UBND TP Hà Nội',
                                exit: '2024-06-01',
                                enter: '2024-06-10',
                                country: 'Singapore',
                                times: 2,
                                purpose: 'Việc riêng',
                                funding: 'Tự túc',
                                submittedPassport: 'X',
                                submittedReport: 'X',
                                trainType: '', trainLoc: '', trainRole: '', trainAgency: '', trainTime: '',
                                leader: '', members: '', count: 1
                            }
                        ],
                        
                        // Cờ vi phạm & lưu ý
                        flags: {
                            politicalIssue: 'Không có biểu hiện tự diễn biến',
                            investigating: 'Không',
                            otherIssue: 'Lý lịch rõ ràng',
                            noPermission: '',
                            lawViolation: '',
                            overstay: '',
                            partyDiscipline: 'Cảnh cáo (2022)',
                            govDiscipline: 'Khiển trách (2022)',
                            foreignLaw: '',
                            vnLaw: '',
                            gift: 'Nhận quà 100tr từ đối tác, đã nộp lại',
                            rent: 'Đang cho thuê 1 căn hộ tại Cầu Giấy',
                            fdi: ''
                        },

                        // Thân nhân
                        relatives: [
                            {
                                id: 'TN01',
                                relation: 'Con ruột',
                                name: 'Nguyễn Văn B',
                                otherName: 'Tí',
                                birthYear: '2005-08-20',
                                hktt: 'Ba Đình, Hà Nội',
                                currentAddress: 'Sydney, Úc',
                                job: 'Sinh viên',
                                cccd: '001205123456',
                                nationality: 'Việt Nam',
                                hasForeignElement: true,
                                foreignInfo: {
                                    time: 'Từ T8/2023 đến nay',
                                    unit: 'Đại học Sydney',
                                    country: 'Úc',
                                    funding: 'Học bổng chính phủ Úc',
                                    currentWork: 'Làm thêm tại nhà hàng Úc',
                                    married: '',
                                    fdi: '',
                                    punishVN: '',
                                    punishForeign: 'Bị phạt giao thông ở Úc (2024)'
                                }
                            },
                            {
                                id: 'TN02',
                                relation: 'Vợ',
                                name: 'Phạm Thị D',
                                otherName: '',
                                birthYear: '1982-10-10',
                                hktt: 'Ba Đình, Hà Nội',
                                currentAddress: 'Đống Đa, Hà Nội',
                                job: 'Giám đốc nhân sự',
                                cccd: '001182123456',
                                nationality: 'Việt Nam',
                                hasForeignElement: true,
                                foreignInfo: {
                                    time: 'Từ 2020 đến nay',
                                    unit: 'Công ty TNHH Samsung',
                                    country: 'Hàn Quốc (FDI)',
                                    funding: '',
                                    currentWork: 'Giám đốc nhân sự',
                                    married: '',
                                    fdi: 'Làm việc tại cty FDI (Samsung)',
                                    punishVN: '',
                                    punishForeign: ''
                                }
                            }
                        ]
                    },
                    {
                        id: 'CB02',
                        code: 'NV002',
                        name: 'Trần Thị C',
                        otherName: '',
                        birthYear: '1985-11-30',
                        ethnicity: 'Tày',
                        religion: 'Phật giáo',
                        departmentId: 'D2',
                        cccd: '030185123456',
                        hktt: 'Hải Châu, Đà Nẵng',
                        currentAddress: 'Hải Châu, Đà Nẵng',
                        passportPersonal: 'C999888',
                        passportOfficial: '',
                        position: 'Chuyên viên',
                        tcctResult: 'Chưa thẩm tra TCCT',
                        trips: [],
                        flags: {
                            politicalIssue: '',
                            investigating: 'Đang bị thanh tra nội bộ',
                            otherIssue: '',
                            noPermission: 'Đi Thái Lan tự túc không báo cáo (2023)',
                            lawViolation: '',
                            overstay: 'Quá hạn 2 ngày ở Thái Lan',
                            partyDiscipline: '',
                            govDiscipline: '',
                            foreignLaw: '',
                            vnLaw: '',
                            gift: '',
                            rent: '',
                            fdi: ''
                        },
                        relatives: []
                    }
                ],
                departments`;

const regex = /personnel: \[[\s\S]*?\],\s*departments/m;
content = content.replace(regex, fullMockData);


// Now I need to update the TR template in PL3 to also show the textareas/text inputs from Khối C!
const tbodyPL3Regex = /<td class="border border-gray-300 px-2 py-2 text-center text-red-500 font-bold"><\/td>\s*<td class="border border-gray-300 px-2 py-2 text-center text-red-500 font-bold" x-text="p.flags.gift"><\/td>\s*<td class="border border-gray-300 px-2 py-2 text-center text-red-500 font-bold" x-text="p.flags.rent"><\/td>\s*<td class="border border-gray-300 px-2 py-2 text-center text-red-500 font-bold" x-text="p.flags.fdi"><\/td>/m;

const pl3Replacement = `<!-- Flags (Liên quan yếu tố nước ngoài) -->
                                        <td class="border border-gray-300 px-2 py-2 text-left" x-text="(p.flags.partyDiscipline ? 'Đảng: ' + p.flags.partyDiscipline + '; ' : '') + (p.flags.govDiscipline ? 'CQ: ' + p.flags.govDiscipline : '')"></td>
                                        <td class="border border-gray-300 px-2 py-2 text-left" x-text="p.flags.gift"></td>
                                        <td class="border border-gray-300 px-2 py-2 text-left" x-text="p.flags.rent"></td>
                                        <td class="border border-gray-300 px-2 py-2 text-left" x-text="p.flags.fdi"></td>`;

content = content.replace(tbodyPL3Regex, pl3Replacement);

fs.writeFileSync('index.html', content);
console.log("Updated mock data with complete fields");
