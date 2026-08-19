const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');

// 1. Fix the x-data reactivity issue by using direct bindings
// Khối B
content = content.replace(/x-data="\{ trip: formData\.trips\[0\] \}"/g, '');
content = content.replace(/x-model="trip\./g, 'x-model="formData.trips[0].');

// Khối C
content = content.replace(/x-data="\{ flags: formData\.flags \}"/g, '');
content = content.replace(/x-model="flags\./g, 'x-model="formData.flags.');

// 2. Add missing fields to mockData in index.html to ensure 100% full
// I will use regex to find the personnel array and replace it with an even richer one

const fullMockData = `personnel: [
                    {
                        id: 'CB01',
                        code: 'NV001',
                        name: 'Nguyễn Văn A',
                        otherName: 'Bảy A',
                        birthYear: '1980-05-12',
                        ethnicity: 'Kinh',
                        religion: 'Không',
                        hometown: 'Thanh Hóa',
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
                                trainType: 'Bồi dưỡng ngắn hạn',
                                trainLoc: 'Đại học Tokyo',
                                trainRole: 'Học viên',
                                trainAgency: 'Sở Nội vụ',
                                trainTime: '01/02/2023 - 15/02/2023',
                                leader: 'Nguyễn Văn A',
                                members: 'Trần Thị B, Lê Văn C',
                                count: 3
                            }
                        ],
                        
                        // Cờ vi phạm & lưu ý
                        flags: {
                            politicalIssue: 'Không có biểu hiện tự diễn biến',
                            investigating: 'Không',
                            otherIssue: 'Lý lịch rõ ràng',
                            noPermission: 'Không',
                            lawViolation: 'Không',
                            overstay: 'Không',
                            partyDiscipline: 'Cảnh cáo (2022)',
                            govDiscipline: 'Khiển trách (2022)',
                            foreignLaw: 'Không',
                            vnLaw: 'Không',
                            gift: 'Nhận quà 100tr từ đối tác, đã nộp lại',
                            rent: 'Đang cho thuê 1 căn hộ tại Cầu Giấy',
                            fdi: 'Không'
                        },

                        // Thân nhân
                        relatives: [
                            {
                                id: 'TN01',
                                relation: 'Con ruột',
                                name: 'Nguyễn Văn B',
                                otherName: 'Tí',
                                birthYear: '2005-08-20',
                                hometown: 'Thanh Hóa',
                                hktt: 'Ba Đình, Hà Nội',
                                currentAddress: 'Sydney, Úc',
                                job: 'Sinh viên',
                                cccd: '001205123456',
                                nationality: 'Việt Nam',
                                content: 'Học đại học tại Úc',
                                hasForeignElement: true,
                                foreignInfo: {
                                    time: 'Từ T8/2023 đến nay',
                                    unit: 'Đại học Sydney',
                                    country: 'Úc',
                                    funding: 'Học bổng chính phủ Úc',
                                    currentWork: 'Làm thêm tại nhà hàng Úc',
                                    married: 'Chưa',
                                    fdi: 'Không',
                                    punishVN: 'Không',
                                    punishForeign: 'Bị phạt giao thông ở Úc (2024)'
                                }
                            },
                            {
                                id: 'TN02',
                                relation: 'Vợ',
                                name: 'Phạm Thị D',
                                otherName: 'Nữ',
                                birthYear: '1982-10-10',
                                hometown: 'Nghệ An',
                                hktt: 'Ba Đình, Hà Nội',
                                currentAddress: 'Đống Đa, Hà Nội',
                                job: 'Giám đốc nhân sự',
                                cccd: '001182123456',
                                nationality: 'Việt Nam',
                                content: 'Làm việc tại tập đoàn nước ngoài',
                                hasForeignElement: true,
                                foreignInfo: {
                                    time: 'Từ 2020 đến nay',
                                    unit: 'Công ty TNHH Samsung',
                                    country: 'Hàn Quốc (FDI)',
                                    funding: 'Tự túc',
                                    currentWork: 'Giám đốc nhân sự',
                                    married: 'Đã kết hôn',
                                    fdi: 'Làm việc tại cty FDI (Samsung)',
                                    punishVN: 'Không',
                                    punishForeign: 'Không'
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
                        hometown: 'Đà Nẵng',
                        departmentId: 'D2',
                        cccd: '030185123456',
                        hktt: 'Hải Châu, Đà Nẵng',
                        currentAddress: 'Hải Châu, Đà Nẵng',
                        passportPersonal: 'C999888',
                        passportOfficial: 'Không có',
                        position: 'Chuyên viên',
                        tcctResult: 'Chưa thẩm tra TCCT',
                        trips: [],
                        flags: {
                            politicalIssue: 'Không',
                            investigating: 'Đang bị thanh tra nội bộ',
                            otherIssue: 'Không',
                            noPermission: 'Đi Thái Lan tự túc không báo cáo (2023)',
                            lawViolation: 'Không',
                            overstay: 'Quá hạn 2 ngày ở Thái Lan',
                            partyDiscipline: 'Không',
                            govDiscipline: 'Không',
                            foreignLaw: 'Không',
                            vnLaw: 'Không',
                            gift: 'Không',
                            rent: 'Không',
                            fdi: 'Không'
                        },
                        relatives: []
                    }
                ],
                departments`;

const regex = /personnel: \[[\s\S]*?\],\s*departments/m;
content = content.replace(regex, fullMockData);

fs.writeFileSync('index.html', content);
console.log("Fixed x-data bindings and populated empty mock data fields!");
