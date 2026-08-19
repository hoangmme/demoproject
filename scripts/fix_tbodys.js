const fs = require('fs');

let content = fs.readFileSync('index.html', 'utf8');

// Function to replace tbody inside a specific view
function replaceTbodyInView(html, viewName, newTbody) {
    const viewRegex = new RegExp(`(<div x-show="currentView === '${viewName}'"[\\s\\S]*?<table[\\s\\S]*?)(<tbody[\\s\\S]*?<\\/tbody>)([\\s\\S]*?<\\/div>)`);
    return html.replace(viewRegex, (match, p1, p2, p3) => {
        return p1 + newTbody + p3;
    });
}

const tbodyCanBo = `<tbody class="divide-y divide-gray-100">
                            <template x-for="person in filteredPersonnel" :key="person.id">
                                <tr class="hover:bg-blue-50/50 transition-colors cursor-pointer group" @click="openPanel(person)">
                                    <td class="py-3 px-6 text-sm text-gray-500 font-medium" x-text="person.code || 'N/A'"></td>
                                    <td class="py-3 px-6 text-sm font-semibold text-gray-800" x-text="person.name"></td>
                                    <td class="py-3 px-6 text-sm text-gray-600" x-text="person.birthYear"></td>
                                    <td class="py-3 px-6 text-sm text-gray-600">
                                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#447f28]/10 text-[#447f28]" x-text="getDepartmentName(person.departmentId)"></span>
                                    </td>
                                    <td class="py-3 px-6 text-sm text-gray-600" x-text="person.cccd"></td>
                                    <td class="py-3 px-6 text-right">
                                        <button class="text-gray-400 hover:text-[#447f28] p-2 transition-colors">
                                            Sửa
                                        </button>
                                    </td>
                                </tr>
                            </template>
                        </tbody>`;

// 37 columns in PL1
const tbodyPL1 = `<tbody>
                            <template x-for="(p, i) in personnel" :key="p.id">
                                <template x-if="p.trips && p.trips.length > 0">
                                    <template x-for="(tr, j) in p.trips" :key="tr.id">
                                        <tr class="hover:bg-blue-50/50">
                                            <!-- Col 1 to 15 (cá nhân) only show on first trip -->
                                            <td class="border border-gray-300 px-2 py-2" x-text="j === 0 ? (i+1) : ''"></td>
                                            <td class="border border-gray-300 px-2 py-2 text-left font-medium" x-text="j === 0 ? p.name : ''"></td>
                                            <td class="border border-gray-300 px-2 py-2" x-text="j === 0 ? p.birthYear : ''"></td>
                                            <td class="border border-gray-300 px-2 py-2" x-text="j === 0 ? p.cccd : ''"></td>
                                            <td class="border border-gray-300 px-2 py-2" x-text="j === 0 ? p.hktt : ''"></td>
                                            <td class="border border-gray-300 px-2 py-2" x-text="j === 0 ? p.currentAddress : ''"></td>
                                            <td class="border border-gray-300 px-2 py-2" x-text="j === 0 ? p.passportPersonal : ''"></td>
                                            <td class="border border-gray-300 px-2 py-2" x-text="j === 0 ? p.passportOfficial : ''"></td>
                                            <td class="border border-gray-300 px-2 py-2" x-text="j === 0 ? p.position : ''"></td>
                                            <td class="border border-gray-300 px-2 py-2" x-text="j === 0 ? getDepartmentName(p.departmentId) : ''"></td>
                                            <td class="border border-gray-300 px-2 py-2"></td>
                                            <td class="border border-gray-300 px-2 py-2"></td>
                                            <td class="border border-gray-300 px-2 py-2"></td>
                                            <td class="border border-gray-300 px-2 py-2" x-text="j === 0 ? p.tcctResult : ''"></td>
                                            
                                            <!-- Col 16 to 30 (Trip Info) -->
                                            <td class="border border-gray-300 px-2 py-2" x-text="tr.qd"></td>
                                            <td class="border border-gray-300 px-2 py-2" x-text="tr.qdDate"></td>
                                            <td class="border border-gray-300 px-2 py-2" x-text="tr.agency"></td>
                                            <td class="border border-gray-300 px-2 py-2" x-text="tr.exit"></td>
                                            <td class="border border-gray-300 px-2 py-2" x-text="tr.enter"></td>
                                            <td class="border border-gray-300 px-2 py-2 font-semibold" x-text="tr.country"></td>
                                            <td class="border border-gray-300 px-2 py-2" x-text="tr.times"></td>
                                            <td class="border border-gray-300 px-2 py-2 text-center" x-text="tr.purpose === 'Công tác' ? 'X' : ''"></td>
                                            <td class="border border-gray-300 px-2 py-2 text-center" x-text="tr.purpose === 'Học tập' ? 'X' : ''"></td>
                                            <td class="border border-gray-300 px-2 py-2 text-center" x-text="tr.purpose === 'Việc riêng' ? 'X' : ''"></td>
                                            
                                            <!-- Funding (26-29) -->
                                            <td class="border border-gray-300 px-2 py-2 text-center" x-text="tr.funding === 'Ngân sách NN' ? 'X' : ''"></td>
                                            <td class="border border-gray-300 px-2 py-2 text-center" x-text="tr.funding === 'Tự túc' ? 'X' : ''"></td>
                                            <td class="border border-gray-300 px-2 py-2"></td>
                                            <td class="border border-gray-300 px-2 py-2"></td>
                                            
                                            <!-- Reports (30-31) -->
                                            <td class="border border-gray-300 px-2 py-2 text-center font-bold text-green-600" x-text="tr.submittedPassport"></td>
                                            <td class="border border-gray-300 px-2 py-2 text-center font-bold text-green-600" x-text="tr.submittedReport"></td>
                                            
                                            <!-- Flags (32-37) show only on first trip row -->
                                            <td class="border border-gray-300 px-2 py-2 text-center text-red-500 font-bold" x-text="j === 0 ? p.flags.noPermission : ''"></td>
                                            <td class="border border-gray-300 px-2 py-2 text-center text-red-500 font-bold" x-text="j === 0 ? p.flags.lawViolation : ''"></td>
                                            <td class="border border-gray-300 px-2 py-2 text-center text-red-500 font-bold" x-text="j === 0 ? p.flags.overstay : ''"></td>
                                            <td class="border border-gray-300 px-2 py-2 text-center text-red-500 font-bold" x-text="j === 0 ? p.flags.partyDiscipline : ''"></td>
                                            <td class="border border-gray-300 px-2 py-2 text-center text-red-500 font-bold" x-text="j === 0 ? p.flags.govDiscipline : ''"></td>
                                            <td class="border border-gray-300 px-2 py-2 text-center text-red-500 font-bold" x-text="j === 0 ? p.flags.foreignLaw : ''"></td>
                                            <td class="border border-gray-300 px-2 py-2 text-center text-red-500 font-bold" x-text="j === 0 ? p.flags.vnLaw : ''"></td>
                                        </tr>
                                    </template>
                                </template>
                            </template>
                        </tbody>`;

// 23 columns in PL2
const tbodyPL2 = `<tbody>
                            <template x-for="(p, i) in personnel" :key="'p2'+p.id">
                                <template x-for="(t, j) in p.relatives.filter(r => r.hasForeignElement)" :key="t.id">
                                    <tr class="hover:bg-blue-50/50">
                                        <!-- Col 1 to 7 (Cá nhân) -->
                                        <td class="border border-gray-300 px-2 py-2" x-text="j === 0 ? (i+1) : ''"></td>
                                        <td class="border border-gray-300 px-2 py-2 text-left font-medium" x-text="j === 0 ? p.name : ''"></td>
                                        <td class="border border-gray-300 px-2 py-2" x-text="j === 0 ? p.birthYear : ''"></td>
                                        <td class="border border-gray-300 px-2 py-2" x-text="j === 0 ? p.position : ''"></td>
                                        <td class="border border-gray-300 px-2 py-2" x-text="j === 0 ? getDepartmentName(p.departmentId) : ''"></td>
                                        <td class="border border-gray-300 px-2 py-2"></td>
                                        <td class="border border-gray-300 px-2 py-2"></td>
                                        <td class="border border-gray-300 px-2 py-2"></td>
                                        
                                        <!-- Col 8 to 13 (Relative) -->
                                        <td class="border border-gray-300 px-2 py-2 text-center font-bold" x-text="t.relation"></td>
                                        <td class="border border-gray-300 px-2 py-2 text-left" x-text="t.name"></td>
                                        <td class="border border-gray-300 px-2 py-2" x-text="t.birthYear"></td>
                                        <td class="border border-gray-300 px-2 py-2" x-text="t.currentAddress"></td>
                                        <td class="border border-gray-300 px-2 py-2" x-text="t.job"></td>
                                        <td class="border border-gray-300 px-2 py-2" x-text="t.foreignInfo.unit"></td>
                                        
                                        <!-- Col 14 to 23 (Foreign Element & Law) -->
                                        <td class="border border-gray-300 px-2 py-2" x-text="t.foreignInfo.time"></td>
                                        <td class="border border-gray-300 px-2 py-2" x-text="t.foreignInfo.unit"></td>
                                        <td class="border border-gray-300 px-2 py-2 font-semibold text-blue-700" x-text="t.foreignInfo.country"></td>
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

// 28 columns in PL3
const tbodyPL3 = `<tbody>
                            <template x-for="(p, i) in personnel.filter(p => p.flags.noPermission || p.flags.partyDiscipline || p.flags.govDiscipline || p.flags.investigating || p.trips.length > 0)" :key="'p3'+p.id">
                                    <tr class="hover:bg-blue-50/50">
                                        <!-- Col 1 to 8 -->
                                        <td class="border border-gray-300 px-2 py-2" x-text="i+1"></td>
                                        <td class="border border-gray-300 px-2 py-2 text-left font-medium" x-text="p.name"></td>
                                        <td class="border border-gray-300 px-2 py-2" x-text="p.birthYear"></td>
                                        <td class="border border-gray-300 px-2 py-2" x-text="p.position"></td>
                                        <td class="border border-gray-300 px-2 py-2" x-text="getDepartmentName(p.departmentId)"></td>
                                        <td class="border border-gray-300 px-2 py-2"></td>
                                        <td class="border border-gray-300 px-2 py-2"></td>
                                        <td class="border border-gray-300 px-2 py-2"></td>
                                        
                                        <!-- Col 9 to 14 (Training) -->
                                        <td class="border border-gray-300 px-2 py-2" x-text="p.trips.length > 0 ? p.trips[0].trainType : ''"></td>
                                        <td class="border border-gray-300 px-2 py-2" x-text="p.trips.length > 0 ? p.trips[0].trainLoc : ''"></td>
                                        <td class="border border-gray-300 px-2 py-2" x-text="p.trips.length > 0 ? p.trips[0].trainRole : ''"></td>
                                        <td class="border border-gray-300 px-2 py-2" x-text="p.trips.length > 0 ? p.trips[0].trainAgency : ''"></td>
                                        <td class="border border-gray-300 px-2 py-2" x-text="p.trips.length > 0 ? p.trips[0].funding : ''"></td>
                                        <td class="border border-gray-300 px-2 py-2" x-text="p.trips.length > 0 ? p.trips[0].trainTime : ''"></td>
                                        
                                        <!-- Col 15 to 17 (Group) -->
                                        <td class="border border-gray-300 px-2 py-2" x-text="p.trips.length > 0 ? p.trips[0].leader : ''"></td>
                                        <td class="border border-gray-300 px-2 py-2" x-text="p.trips.length > 0 ? p.trips[0].members : ''"></td>
                                        <td class="border border-gray-300 px-2 py-2" x-text="p.trips.length > 0 ? p.trips[0].count : ''"></td>
                                        
                                        <!-- Col 18 to 24 (Trips) -->
                                        <td class="border border-gray-300 px-2 py-2" x-text="p.trips.length > 0 ? p.trips[0].qd : ''"></td>
                                        <td class="border border-gray-300 px-2 py-2" x-text="p.trips.length > 0 ? p.trips[0].qdDate : ''"></td>
                                        <td class="border border-gray-300 px-2 py-2" x-text="p.trips.length > 0 ? p.trips[0].agency : ''"></td>
                                        <td class="border border-gray-300 px-2 py-2" x-text="p.trips.length > 0 ? p.trips[0].exit : ''"></td>
                                        <td class="border border-gray-300 px-2 py-2" x-text="p.trips.length > 0 ? p.trips[0].enter : ''"></td>
                                        <td class="border border-gray-300 px-2 py-2" x-text="p.trips.length > 0 ? p.trips[0].times : ''"></td>
                                        <td class="border border-gray-300 px-2 py-2 font-semibold" x-text="p.trips.length > 0 ? p.trips[0].country : ''"></td>
                                        
                                        <!-- Col 25 to 28 (Flags) -->
                                        <td class="border border-gray-300 px-2 py-2 text-left" x-text="p.flags.noPermission ? 'Không phép: '+p.flags.noPermission : ''"></td>
                                        <td class="border border-gray-300 px-2 py-2 text-left" x-text="p.flags.gift"></td>
                                        <td class="border border-gray-300 px-2 py-2 text-left" x-text="p.flags.rent"></td>
                                        <td class="border border-gray-300 px-2 py-2 text-left" x-text="p.flags.fdi"></td>
                                    </tr>
                            </template>
                        </tbody>`;

content = replaceTbodyInView(content, 'canbo', tbodyCanBo);
content = replaceTbodyInView(content, 'pl1', tbodyPL1);
content = replaceTbodyInView(content, 'pl2', tbodyPL2);
content = replaceTbodyInView(content, 'pl3', tbodyPL3);

fs.writeFileSync('index.html', content);
console.log("Fixed Tbody replacements for all tables!");
