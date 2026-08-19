const fs = require('fs');

const file = 'index.html';
let content = fs.readFileSync(file, 'utf8');

const mockData = `
                personnel: [
                    {
                        id: 'CB01',
                        code: 'NV001',
                        name: 'Nguyễn Văn A',
                        birthYear: '1980-05-12',
                        departmentId: 'D1',
                        cccd: '001080123456',
                        hktt: 'Ba Đình, Hà Nội',
                        currentAddress: 'Đống Đa, Hà Nội',
                        passportPersonal: 'B1234567',
                        passportOfficial: 'C7654321',
                        position: 'Trưởng phòng',
                        tcctResult: 'Đủ điều kiện',
                        
                        // Lịch sử chuyến đi
                        trips: [
                            {
                                id: 'TR01',
                                qd: '123/QĐ-UBND',
                                qdDate: '2023-01-10',
                                agency: 'UBND TP',
                                exit: '2023-02-01',
                                enter: '2023-02-15',
                                country: 'Nhật Bản',
                                times: 1,
                                purpose: 'Công tác',
                                funding: 'Ngân sách NN',
                                submittedPassport: 'X',
                                submittedReport: 'X',
                                // Học tập
                                trainType: '', trainLoc: '', trainRole: '', trainAgency: '', trainTime: '',
                                // Nhóm
                                leader: 'Nguyễn Văn A', members: 'Trần Thị B', count: 2
                            }
                        ],
                        
                        // Cờ vi phạm
                        flags: {
                            noPermission: '',
                            lawViolation: '',
                            overstay: '',
                            partyDiscipline: '',
                            govDiscipline: '',
                            foreignLaw: '',
                            vnLaw: '',
                            politicalIssue: '',
                            investigating: '',
                            gift: '',
                            rent: '',
                            fdi: ''
                        },

                        // Thân nhân
                        relatives: [
                            {
                                id: 'TN01',
                                relation: 'Con ruột',
                                name: 'Nguyễn Văn B',
                                birthYear: '2005-08-20',
                                hktt: 'Ba Đình, Hà Nội',
                                currentAddress: 'Sydney, Úc',
                                job: 'Sinh viên',
                                cccd: '001205123456',
                                nationality: 'Việt Nam',
                                hasForeignElement: true,
                                foreignInfo: {
                                    time: 'Từ 2023 đến nay',
                                    unit: 'Đại học Sydney',
                                    country: 'Úc',
                                    funding: 'Tự túc',
                                    currentWork: '',
                                    married: '',
                                    fdi: '',
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
                        birthYear: '1985-11-30',
                        departmentId: 'D2',
                        cccd: '030185123456',
                        hktt: 'Hải Châu, Đà Nẵng',
                        currentAddress: 'Hải Châu, Đà Nẵng',
                        passportPersonal: 'C999888',
                        passportOfficial: '',
                        position: 'Chuyên viên',
                        tcctResult: 'Chưa thẩm tra',
                        trips: [],
                        flags: {
                            noPermission: 'X',
                            lawViolation: '',
                            overstay: '',
                            partyDiscipline: 'Khiển trách',
                            govDiscipline: '',
                            foreignLaw: '',
                            vnLaw: '',
                            politicalIssue: '',
                            investigating: '',
                            gift: '',
                            rent: '',
                            fdi: ''
                        },
                        relatives: []
                    }
                ],
                departments: [{id: 'D1', name: 'Phòng Kế hoạch'}, {id: 'D2', name: 'Phòng Tổ chức'}],
`;

// Replace personnel initialization
content = content.replace(/personnel: \[\],/, mockData);
// Disable fetchData replacing mock data
content = content.replace(/this\.fetchData\(\);/, '// this.fetchData(); // Use mock data for now');

// Create Table Rows for PL1
const tbodyPL1 = `<tbody>
                            <template x-for="(p, i) in personnel" :key="p.id">
                                <template x-if="p.trips && p.trips.length > 0">
                                    <tr class="hover:bg-blue-50/50">
                                        <td class="border border-gray-300 px-2 py-2" x-text="i+1"></td>
                                        <td class="border border-gray-300 px-2 py-2 text-left font-medium" x-text="p.name"></td>
                                        <td class="border border-gray-300 px-2 py-2" x-text="p.birthYear"></td>
                                        <td class="border border-gray-300 px-2 py-2" x-text="p.cccd"></td>
                                        <td class="border border-gray-300 px-2 py-2" x-text="p.hktt"></td>
                                        <td class="border border-gray-300 px-2 py-2" x-text="p.currentAddress"></td>
                                        <td class="border border-gray-300 px-2 py-2" x-text="p.passportPersonal"></td>
                                        <td class="border border-gray-300 px-2 py-2" x-text="p.passportOfficial"></td>
                                        <td class="border border-gray-300 px-2 py-2" x-text="p.position"></td>
                                        <td class="border border-gray-300 px-2 py-2" x-text="getDepartmentName(p.departmentId)"></td>
                                        <td class="border border-gray-300 px-2 py-2"></td>
                                        <td class="border border-gray-300 px-2 py-2"></td>
                                        <td class="border border-gray-300 px-2 py-2"></td>
                                        <td class="border border-gray-300 px-2 py-2" x-text="p.tcctResult"></td>
                                        
                                        <!-- Trip Info (Using first trip for mockup) -->
                                        <td class="border border-gray-300 px-2 py-2" x-text="p.trips[0].qd"></td>
                                        <td class="border border-gray-300 px-2 py-2" x-text="p.trips[0].qdDate"></td>
                                        <td class="border border-gray-300 px-2 py-2" x-text="p.trips[0].agency"></td>
                                        <td class="border border-gray-300 px-2 py-2" x-text="p.trips[0].exit"></td>
                                        <td class="border border-gray-300 px-2 py-2" x-text="p.trips[0].enter"></td>
                                        <td class="border border-gray-300 px-2 py-2" x-text="p.trips[0].country"></td>
                                        <td class="border border-gray-300 px-2 py-2" x-text="p.trips[0].times"></td>
                                        <td class="border border-gray-300 px-2 py-2 text-center" x-text="p.trips[0].purpose === 'Công tác' ? 'X' : ''"></td>
                                        <td class="border border-gray-300 px-2 py-2 text-center" x-text="p.trips[0].purpose === 'Học tập' ? 'X' : ''"></td>
                                        <td class="border border-gray-300 px-2 py-2 text-center" x-text="p.trips[0].purpose === 'Việc riêng' ? 'X' : ''"></td>
                                        
                                        <td class="border border-gray-300 px-2 py-2 text-center" x-text="p.trips[0].funding === 'Ngân sách NN' ? 'X' : ''"></td>
                                        <td class="border border-gray-300 px-2 py-2 text-center" x-text="p.trips[0].funding === 'Tự túc' ? 'X' : ''"></td>
                                        <td class="border border-gray-300 px-2 py-2"></td>
                                        <td class="border border-gray-300 px-2 py-2"></td>
                                        
                                        <td class="border border-gray-300 px-2 py-2 text-center" x-text="p.trips[0].submittedPassport"></td>
                                        <td class="border border-gray-300 px-2 py-2 text-center" x-text="p.trips[0].submittedReport"></td>
                                        
                                        <!-- Flags -->
                                        <td class="border border-gray-300 px-2 py-2 text-center text-red-500 font-bold" x-text="p.flags.noPermission"></td>
                                        <td class="border border-gray-300 px-2 py-2 text-center text-red-500 font-bold" x-text="p.flags.lawViolation"></td>
                                        <td class="border border-gray-300 px-2 py-2 text-center text-red-500 font-bold" x-text="p.flags.overstay"></td>
                                        
                                        <td class="border border-gray-300 px-2 py-2 text-center text-red-500 font-bold" x-text="p.flags.partyDiscipline"></td>
                                        <td class="border border-gray-300 px-2 py-2 text-center text-red-500 font-bold" x-text="p.flags.govDiscipline"></td>
                                        <td class="border border-gray-300 px-2 py-2 text-center text-red-500 font-bold" x-text="p.flags.foreignLaw"></td>
                                        <td class="border border-gray-300 px-2 py-2 text-center text-red-500 font-bold" x-text="p.flags.vnLaw"></td>
                                    </tr>
                                </template>
                            </template>
                        </tbody>`;

// Replace PL1 tbody
content = content.replace(/<tbody>[\s\S]*?<\/tbody>/, tbodyPL1); // 1st occurrence is PL1

const tbodyPL2 = `<tbody>
                            <template x-for="(p, i) in personnel" :key="'p2'+p.id">
                                <template x-for="(t, j) in p.relatives.filter(r => r.hasForeignElement)" :key="t.id">
                                    <tr class="hover:bg-blue-50/50">
                                        <td class="border border-gray-300 px-2 py-2" x-text="j === 0 ? (i+1) : ''"></td>
                                        <td class="border border-gray-300 px-2 py-2 text-left font-medium" x-text="j === 0 ? p.name : ''"></td>
                                        <td class="border border-gray-300 px-2 py-2" x-text="j === 0 ? p.birthYear : ''"></td>
                                        <td class="border border-gray-300 px-2 py-2" x-text="j === 0 ? p.position : ''"></td>
                                        <td class="border border-gray-300 px-2 py-2" x-text="j === 0 ? getDepartmentName(p.departmentId) : ''"></td>
                                        <td class="border border-gray-300 px-2 py-2"></td>
                                        <td class="border border-gray-300 px-2 py-2"></td>
                                        <td class="border border-gray-300 px-2 py-2"></td>
                                        
                                        <!-- Relative Info -->
                                        <td class="border border-gray-300 px-2 py-2" x-text="t.relation"></td>
                                        <td class="border border-gray-300 px-2 py-2" x-text="t.name"></td>
                                        <td class="border border-gray-300 px-2 py-2" x-text="t.birthYear"></td>
                                        <td class="border border-gray-300 px-2 py-2" x-text="t.currentAddress"></td>
                                        <td class="border border-gray-300 px-2 py-2" x-text="t.job"></td>
                                        <td class="border border-gray-300 px-2 py-2" x-text="t.foreignInfo.unit"></td>
                                        
                                        <td class="border border-gray-300 px-2 py-2" x-text="t.foreignInfo.time"></td>
                                        <td class="border border-gray-300 px-2 py-2" x-text="t.foreignInfo.unit"></td>
                                        <td class="border border-gray-300 px-2 py-2 font-semibold" x-text="t.foreignInfo.country"></td>
                                        <td class="border border-gray-300 px-2 py-2" x-text="t.foreignInfo.funding"></td>
                                        <td class="border border-gray-300 px-2 py-2" x-text="t.foreignInfo.currentWork"></td>
                                        <td class="border border-gray-300 px-2 py-2 text-center text-red-500 font-bold" x-text="t.foreignInfo.married"></td>
                                        <td class="border border-gray-300 px-2 py-2 text-center text-red-500 font-bold" x-text="t.foreignInfo.fdi"></td>
                                        <td class="border border-gray-300 px-2 py-2 text-center text-red-500 font-bold" x-text="t.foreignInfo.punishVN"></td>
                                        <td class="border border-gray-300 px-2 py-2 text-center text-red-500 font-bold" x-text="t.foreignInfo.punishForeign"></td>
                                    </tr>
                                </template>
                            </template>
                        </tbody>`;

content = content.replace(/<tbody>[\s\S]*?<\/tbody>/, tbodyPL2); // Next is PL2

const tbodyPL3 = `<tbody>
                            <template x-for="(p, i) in personnel.filter(p => p.flags.noPermission || p.flags.lawViolation || p.trips.length > 0)" :key="'p3'+p.id">
                                    <tr class="hover:bg-blue-50/50">
                                        <td class="border border-gray-300 px-2 py-2" x-text="i+1"></td>
                                        <td class="border border-gray-300 px-2 py-2 text-left font-medium" x-text="p.name"></td>
                                        <td class="border border-gray-300 px-2 py-2" x-text="p.birthYear"></td>
                                        <td class="border border-gray-300 px-2 py-2" x-text="p.position"></td>
                                        <td class="border border-gray-300 px-2 py-2" x-text="getDepartmentName(p.departmentId)"></td>
                                        <td class="border border-gray-300 px-2 py-2"></td>
                                        <td class="border border-gray-300 px-2 py-2"></td>
                                        <td class="border border-gray-300 px-2 py-2"></td>
                                        
                                        <!-- Training / Trips -->
                                        <td class="border border-gray-300 px-2 py-2" x-text="p.trips.length > 0 ? p.trips[0].trainType : ''"></td>
                                        <td class="border border-gray-300 px-2 py-2" x-text="p.trips.length > 0 ? p.trips[0].trainLoc : ''"></td>
                                        <td class="border border-gray-300 px-2 py-2" x-text="p.trips.length > 0 ? p.trips[0].trainRole : ''"></td>
                                        <td class="border border-gray-300 px-2 py-2" x-text="p.trips.length > 0 ? p.trips[0].trainAgency : ''"></td>
                                        <td class="border border-gray-300 px-2 py-2" x-text="p.trips.length > 0 ? p.trips[0].funding : ''"></td>
                                        <td class="border border-gray-300 px-2 py-2" x-text="p.trips.length > 0 ? p.trips[0].trainTime : ''"></td>
                                        
                                        <td class="border border-gray-300 px-2 py-2" x-text="p.trips.length > 0 ? p.trips[0].leader : ''"></td>
                                        <td class="border border-gray-300 px-2 py-2" x-text="p.trips.length > 0 ? p.trips[0].members : ''"></td>
                                        <td class="border border-gray-300 px-2 py-2" x-text="p.trips.length > 0 ? p.trips[0].count : ''"></td>
                                        
                                        <td class="border border-gray-300 px-2 py-2" x-text="p.trips.length > 0 ? p.trips[0].qd : ''"></td>
                                        <td class="border border-gray-300 px-2 py-2" x-text="p.trips.length > 0 ? p.trips[0].qdDate : ''"></td>
                                        <td class="border border-gray-300 px-2 py-2" x-text="p.trips.length > 0 ? p.trips[0].agency : ''"></td>
                                        <td class="border border-gray-300 px-2 py-2" x-text="p.trips.length > 0 ? p.trips[0].exit : ''"></td>
                                        <td class="border border-gray-300 px-2 py-2" x-text="p.trips.length > 0 ? p.trips[0].enter : ''"></td>
                                        <td class="border border-gray-300 px-2 py-2" x-text="p.trips.length > 0 ? p.trips[0].times : ''"></td>
                                        <td class="border border-gray-300 px-2 py-2 font-semibold" x-text="p.trips.length > 0 ? p.trips[0].country : ''"></td>
                                        
                                        <!-- Flags -->
                                        <td class="border border-gray-300 px-2 py-2 text-center text-red-500 font-bold"></td>
                                        <td class="border border-gray-300 px-2 py-2 text-center text-red-500 font-bold" x-text="p.flags.gift"></td>
                                        <td class="border border-gray-300 px-2 py-2 text-center text-red-500 font-bold" x-text="p.flags.rent"></td>
                                        <td class="border border-gray-300 px-2 py-2 text-center text-red-500 font-bold" x-text="p.flags.fdi"></td>
                                    </tr>
                            </template>
                        </tbody>`;

content = content.replace(/<tbody>[\s\S]*?<\/tbody>/, tbodyPL3);

fs.writeFileSync(file, content);
console.log("Mock data injected!");
