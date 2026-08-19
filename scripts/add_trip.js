const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');

const regex = /id: 'CB02',[\s\S]*?trips: \[\],/m;
const newCb02Trips = `id: 'CB02',
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
                        trips: [
                            {
                                id: 'TR03',
                                qd: 'Không có',
                                qdDate: '',
                                agency: '',
                                exit: '2023-08-01',
                                enter: '2023-08-10',
                                country: 'Thái Lan',
                                times: 1,
                                purpose: 'Việc riêng',
                                funding: 'Tự túc',
                                submittedPassport: '',
                                submittedReport: '',
                                trainType: '',
                                trainLoc: '',
                                trainRole: '',
                                trainAgency: '',
                                trainTime: '',
                                leader: '',
                                members: '',
                                count: 1
                            }
                        ],`;

content = content.replace(regex, newCb02Trips);

// Also let's double check if PL1 is rendering multiple trips for A.
// The template in PL1 is: <template x-for="(tr, j) in p.trips" :key="tr.id">
// This means Nguyễn Văn A (who has 2 trips) should appear as TWO rows in PL1.
// Let's make sure that's correct.

fs.writeFileSync('index.html', content);
console.log("Added Thailand trip to CB02 so she appears in PL1");
