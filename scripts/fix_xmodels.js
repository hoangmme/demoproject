const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');

// 1. Fix the blank rows in PL2 and PL1 by removing the `j === 0 ? ... : ''` logic
content = content.replace(/j === 0 \? \(i\+1\) : ''/g, 'i+1');
content = content.replace(/j === 0 \? p\.name : ''/g, 'p.name');
content = content.replace(/j === 0 \? p\.birthYear : ''/g, 'p.birthYear');
content = content.replace(/j === 0 \? p\.position : ''/g, 'p.position');
content = content.replace(/j === 0 \? p\.cccd : ''/g, 'p.cccd');
content = content.replace(/j === 0 \? p\.hktt : ''/g, 'p.hktt');
content = content.replace(/j === 0 \? p\.currentAddress : ''/g, 'p.currentAddress');
content = content.replace(/j === 0 \? p\.passportPersonal : ''/g, 'p.passportPersonal');
content = content.replace(/j === 0 \? p\.passportOfficial : ''/g, 'p.passportOfficial');
content = content.replace(/j === 0 \? p\.tcctResult : ''/g, 'p.tcctResult');
content = content.replace(/j === 0 \? getDepartmentName\(p\.departmentId\) : ''/g, 'getDepartmentName(p.departmentId)');

// Also fix flags in PL1 (they were only showing on j === 0)
content = content.replace(/j === 0 \? p\.flags\.noPermission : ''/g, 'p.flags.noPermission');
content = content.replace(/j === 0 \? p\.flags\.lawViolation : ''/g, 'p.flags.lawViolation');
content = content.replace(/j === 0 \? p\.flags\.overstay : ''/g, 'p.flags.overstay');
content = content.replace(/j === 0 \? p\.flags\.partyDiscipline : ''/g, 'p.flags.partyDiscipline');
content = content.replace(/j === 0 \? p\.flags\.govDiscipline : ''/g, 'p.flags.govDiscipline');
content = content.replace(/j === 0 \? p\.flags\.foreignLaw : ''/g, 'p.flags.foreignLaw');
content = content.replace(/j === 0 \? p\.flags\.vnLaw : ''/g, 'p.flags.vnLaw');

// 2. Rewrite the TAB 1 and TAB 2 html to include x-model
const tabsRegex = /<!-- TAB 1: CÁ NHÂN \(52 Fields\) -->[\s\S]*?(?=<!-- Panel Footer -->)/;

const newTabs = `<!-- TAB 1: CÁ NHÂN (52 Fields) -->
                                    <div x-show="activeTab === 'canhan'" class="space-y-10">
                                        <!-- Khối A: Thông tin cá nhân cơ bản -->
                                        <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                            <h3 class="text-lg font-bold text-[#447f28] mb-4 flex items-center gap-2">Khối A: Thông tin cơ bản</h3>
                                            <div class="grid grid-cols-4 gap-4">
                                                <div class="col-span-2"><label class="block text-xs font-medium text-gray-700">Họ và Tên <span x-show="showColumns" class="text-blue-600">[Cột 2]</span></label><input type="text" x-model="formData.name" class="w-full border rounded px-2 py-1"></div>
                                                <div class="col-span-2"><label class="block text-xs font-medium text-gray-700">Tên khác <span x-show="showColumns" class="text-blue-600">[Cột 3]</span></label><input type="text" x-model="formData.otherName" class="w-full border rounded px-2 py-1"></div>
                                                <div class="col-span-1"><label class="block text-xs font-medium text-gray-700">Ngày sinh <span x-show="showColumns" class="text-blue-600">[Cột 4]</span></label><input type="date" x-model="formData.birthYear" class="w-full border rounded px-2 py-1"></div>
                                                <div class="col-span-1"><label class="block text-xs font-medium text-gray-700">Dân tộc <span x-show="showColumns" class="text-blue-600">[Cột 5]</span></label><input type="text" x-model="formData.ethnicity" class="w-full border rounded px-2 py-1"></div>
                                                <div class="col-span-2"><label class="block text-xs font-medium text-gray-700">Tôn giáo <span x-show="showColumns" class="text-blue-600">[Cột 6]</span></label><input type="text" x-model="formData.religion" class="w-full border rounded px-2 py-1"></div>
                                                
                                                <div class="col-span-4"><label class="block text-xs font-medium text-gray-700">Quê quán <span x-show="showColumns" class="text-blue-600">[Cột 7]</span></label><input type="text" x-model="formData.hometown" class="w-full border rounded px-2 py-1"></div>
                                                <div class="col-span-2"><label class="block text-xs font-medium text-gray-700">Đơn vị công tác <span x-show="showColumns" class="text-blue-600">[Cột 8]</span></label>
                                                    <select x-model="formData.departmentId" class="w-full border rounded px-2 py-1 bg-white">
                                                        <option value="">-- Chọn phòng ban --</option>
                                                        <template x-for="dept in departments" :key="dept.id"><option :value="dept.id" x-text="dept.name"></option></template>
                                                    </select>
                                                </div>
                                                <div class="col-span-2"><label class="block text-xs font-medium text-gray-700">Chức vụ <span x-show="showColumns" class="text-blue-600">[Cột 9]</span></label><input type="text" x-model="formData.position" class="w-full border rounded px-2 py-1"></div>
                                                
                                                <div class="col-span-4"><label class="block text-xs font-medium text-gray-700">Nơi ĐKHK thường trú <span x-show="showColumns" class="text-blue-600">[Cột 10]</span></label><input type="text" x-model="formData.hktt" class="w-full border rounded px-2 py-1"></div>
                                                <div class="col-span-4"><label class="block text-xs font-medium text-gray-700">Nơi ở hiện nay <span x-show="showColumns" class="text-blue-600">[Cột 11]</span></label><input type="text" x-model="formData.currentAddress" class="w-full border rounded px-2 py-1"></div>
                                                
                                                <div class="col-span-2"><label class="block text-xs font-medium text-gray-700">Số CCCD <span x-show="showColumns" class="text-blue-600">[Cột 12]</span></label><input type="text" x-model="formData.cccd" class="w-full border rounded px-2 py-1"></div>
                                                <div class="col-span-1"><label class="block text-xs font-medium text-gray-700">Hộ chiếu cá nhân <span x-show="showColumns" class="text-blue-600">[Cột 13]</span></label><input type="text" x-model="formData.passportPersonal" class="w-full border rounded px-2 py-1"></div>
                                                <div class="col-span-1"><label class="block text-xs font-medium text-gray-700">Hộ chiếu công vụ <span x-show="showColumns" class="text-blue-600">[Cột 14]</span></label><input type="text" x-model="formData.passportOfficial" class="w-full border rounded px-2 py-1"></div>
                                                
                                                <div class="col-span-4"><label class="block text-xs font-medium text-gray-700">Kết quả thẩm tra TCCT <span x-show="showColumns" class="text-blue-600">[Cột 15]</span></label><textarea rows="2" x-model="formData.tcctResult" class="w-full border rounded px-2 py-1"></textarea></div>
                                            </div>
                                        </div>

                                        <!-- Khối B: Lịch sử Đi nước ngoài -->
                                        <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm" x-data="{ trip: formData.trips[0] }">
                                            <div class="flex justify-between items-center mb-4">
                                                <h3 class="text-lg font-bold text-[#447f28]">Khối B: Lịch sử Đi nước ngoài</h3>
                                            </div>
                                            <div class="grid grid-cols-4 gap-4">
                                                <div class="col-span-1"><label class="block text-xs font-medium text-gray-700">Số Quyết định <span x-show="showColumns" class="text-blue-600">[Cột 16]</span></label><input type="text" x-model="trip.qd" class="w-full border rounded px-2 py-1"></div>
                                                <div class="col-span-1"><label class="block text-xs font-medium text-gray-700">Ngày ban hành <span x-show="showColumns" class="text-blue-600">[Cột 17]</span></label><input type="date" x-model="trip.qdDate" class="w-full border rounded px-2 py-1"></div>
                                                <div class="col-span-2"><label class="block text-xs font-medium text-gray-700">Cơ quan ban hành <span x-show="showColumns" class="text-blue-600">[Cột 18]</span></label><input type="text" x-model="trip.agency" class="w-full border rounded px-2 py-1"></div>
                                                
                                                <div class="col-span-1"><label class="block text-xs font-medium text-gray-700">Ngày Xuất cảnh <span x-show="showColumns" class="text-blue-600">[Cột 19]</span></label><input type="date" x-model="trip.exit" class="w-full border rounded px-2 py-1"></div>
                                                <div class="col-span-1"><label class="block text-xs font-medium text-gray-700">Ngày Nhập cảnh <span x-show="showColumns" class="text-blue-600">[Cột 20]</span></label><input type="date" x-model="trip.enter" class="w-full border rounded px-2 py-1"></div>
                                                <div class="col-span-1"><label class="block text-xs font-medium text-gray-700">Quốc Gia <span x-show="showColumns" class="text-blue-600">[Cột 21]</span></label><input type="text" x-model="trip.country" class="w-full border rounded px-2 py-1"></div>
                                                <div class="col-span-1"><label class="block text-xs font-medium text-gray-700">Số lần <span x-show="showColumns" class="text-blue-600">[Cột 22]</span></label><input type="number" x-model="trip.times" class="w-full border rounded px-2 py-1"></div>
                                                
                                                <div class="col-span-4"><label class="block text-xs font-medium text-gray-700 mb-1">Mục đích (Ghi rõ mục đích) <span x-show="showColumns" class="text-blue-600">[Cột 23,24,25]</span></label>
                                                    <input type="text" x-model="trip.purpose" placeholder="Công tác / Học tập / Việc riêng..." class="w-full border rounded px-2 py-1">
                                                </div>
                                                
                                                <div class="col-span-1"><label class="block text-xs font-medium text-gray-700">Diện đào tạo <span x-show="showColumns" class="text-blue-600">[Cột 26]</span></label><input type="text" x-model="trip.trainType" class="w-full border rounded px-2 py-1"></div>
                                                <div class="col-span-1"><label class="block text-xs font-medium text-gray-700">Nơi đào tạo <span x-show="showColumns" class="text-blue-600">[Cột 27]</span></label><input type="text" x-model="trip.trainLoc" class="w-full border rounded px-2 py-1"></div>
                                                <div class="col-span-1"><label class="block text-xs font-medium text-gray-700">Vai trò <span x-show="showColumns" class="text-blue-600">[Cột 28]</span></label><input type="text" x-model="trip.trainRole" class="w-full border rounded px-2 py-1"></div>
                                                <div class="col-span-1"><label class="block text-xs font-medium text-gray-700">Đơn vị cử <span x-show="showColumns" class="text-blue-600">[Cột 29]</span></label><input type="text" x-model="trip.trainAgency" class="w-full border rounded px-2 py-1"></div>
                                                <div class="col-span-4"><label class="block text-xs font-medium text-gray-700">Thời gian đào tạo <span x-show="showColumns" class="text-blue-600">[Cột 31]</span></label><input type="text" x-model="trip.trainTime" class="w-full border rounded px-2 py-1"></div>
                                                
                                                <div class="col-span-1"><label class="block text-xs font-medium text-gray-700">Trưởng đoàn <span x-show="showColumns" class="text-blue-600">[Cột 32]</span></label><input type="text" x-model="trip.leader" class="w-full border rounded px-2 py-1"></div>
                                                <div class="col-span-2"><label class="block text-xs font-medium text-gray-700">Thành phần đoàn <span x-show="showColumns" class="text-blue-600">[Cột 33]</span></label><input type="text" x-model="trip.members" class="w-full border rounded px-2 py-1"></div>
                                                <div class="col-span-1"><label class="block text-xs font-medium text-gray-700">Số lượng <span x-show="showColumns" class="text-blue-600">[Cột 34]</span></label><input type="number" x-model="trip.count" class="w-full border rounded px-2 py-1"></div>
                                                
                                                <div class="col-span-4"><label class="block text-xs font-medium text-gray-700 mb-1">Nguồn kinh phí chuyến đi (Ghi rõ) <span x-show="showColumns" class="text-blue-600">[Cột 35,36,37, 30]</span></label>
                                                    <input type="text" x-model="trip.funding" placeholder="Ngân sách NN / Nước sở tại / Tự túc..." class="w-full border rounded px-2 py-1">
                                                </div>
                                                
                                                <div class="col-span-2"><label class="block text-xs font-medium text-gray-700">Nộp hộ chiếu <span x-show="showColumns" class="text-blue-600 text-xs">[Cột 38]</span></label><input type="text" x-model="trip.submittedPassport" class="w-full border rounded px-2 py-1" placeholder="X"></div>
                                                <div class="col-span-2"><label class="block text-xs font-medium text-gray-700">Báo cáo <span x-show="showColumns" class="text-blue-600 text-xs">[Cột 39]</span></label><input type="text" x-model="trip.submittedReport" class="w-full border rounded px-2 py-1" placeholder="X"></div>
                                            </div>
                                        </div>

                                        <!-- Khối C: Lưu ý & Vi phạm -->
                                        <div class="bg-red-50 p-6 rounded-xl border border-red-100 shadow-sm" x-data="{ flags: formData.flags }">
                                            <h3 class="text-lg font-bold text-red-600 mb-4">Khối C: Vấn đề cần lưu ý</h3>
                                            <div class="grid grid-cols-2 gap-4">
                                                <div class="col-span-2"><label class="block text-xs font-medium text-gray-700">Vấn đề TCCT (Tự diễn biến) <span x-show="showColumns" class="text-blue-600">[Cột 40]</span></label><textarea rows="1" x-model="flags.politicalIssue" class="w-full border rounded px-2 py-1"></textarea></div>
                                                <div class="col-span-2"><label class="block text-xs font-medium text-gray-700">Đang bị điều tra <span x-show="showColumns" class="text-blue-600">[Cột 41]</span></label><textarea rows="1" x-model="flags.investigating" class="w-full border rounded px-2 py-1"></textarea></div>
                                                <div class="col-span-2"><label class="block text-xs font-medium text-gray-700">Vấn đề khác về lý lịch <span x-show="showColumns" class="text-blue-600">[Cột 42]</span></label><textarea rows="1" x-model="flags.otherIssue" class="w-full border rounded px-2 py-1"></textarea></div>
                                                
                                                <div class="col-span-1"><label class="block text-xs font-medium text-gray-700">Kỷ luật Đảng <span x-show="showColumns" class="text-blue-600 text-xs">[Cột 43, 44]</span></label><input type="text" x-model="flags.partyDiscipline" class="w-full border rounded px-2 py-1"></div>
                                                <div class="col-span-1"><label class="block text-xs font-medium text-gray-700">Kỷ luật Chính quyền <span x-show="showColumns" class="text-blue-600 text-xs">[Cột 44]</span></label><input type="text" x-model="flags.govDiscipline" class="w-full border rounded px-2 py-1"></div>
                                                
                                                <div class="col-span-1"><label class="block text-xs font-medium text-gray-700">Đi NN không phép <span x-show="showColumns" class="text-blue-600 text-xs">[Cột 45]</span></label><input type="text" x-model="flags.noPermission" class="w-full border rounded px-2 py-1"></div>
                                                <div class="col-span-1"><label class="block text-xs font-medium text-gray-700">Vi phạm PL ở NN <span x-show="showColumns" class="text-blue-600 text-xs">[Cột 46]</span></label><input type="text" x-model="flags.lawViolation" class="w-full border rounded px-2 py-1"></div>
                                                <div class="col-span-1"><label class="block text-xs font-medium text-gray-700">Ở lại NN quá hạn <span x-show="showColumns" class="text-blue-600 text-xs">[Cột 47]</span></label><input type="text" x-model="flags.overstay" class="w-full border rounded px-2 py-1"></div>
                                                <div class="col-span-1"><label class="block text-xs font-medium text-gray-700">Thuộc diện quản lý <span x-show="showColumns" class="text-blue-600 text-xs">[Cột 48]</span></label><input type="text" class="w-full border rounded px-2 py-1"></div>
                                                
                                                <div class="col-span-1"><label class="block text-xs font-medium text-gray-700">Được tặng quà >50tr <span x-show="showColumns" class="text-blue-600">[Cột 49]</span></label><input type="text" x-model="flags.gift" class="w-full border rounded px-2 py-1"></div>
                                                <div class="col-span-1"><label class="block text-xs font-medium text-gray-700">Cho thuê nhà/đất <span x-show="showColumns" class="text-blue-600">[Cột 50]</span></label><input type="text" x-model="flags.rent" class="w-full border rounded px-2 py-1"></div>
                                                <div class="col-span-2"><label class="block text-xs font-medium text-gray-700">Làm tại cty FDI <span x-show="showColumns" class="text-blue-600">[Cột 51]</span></label><input type="text" x-model="flags.fdi" class="w-full border rounded px-2 py-1"></div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <!-- TAB 2: THÂN NHÂN (26 Fields) -->
                                    <div x-show="activeTab === 'thannhan'" class="space-y-6">
                                        <div class="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                                            <div>
                                                <h3 class="text-lg font-bold text-gray-800">Danh sách Thân nhân</h3>
                                                <p class="text-sm text-gray-500">Chứa 26 trường thông tin liên quan đến thân nhân.</p>
                                            </div>
                                        </div>
                                        
                                        <!-- Form Thân Nhân -->
                                        <template x-for="(rel, index) in formData.relatives" :key="index">
                                            <div class="p-6 border border-gray-200 rounded-xl bg-white shadow-sm mb-4">
                                                <h4 class="font-bold text-[#447f28] mb-4">Thân nhân #<span x-text="index+1"></span> (Cột 5 -> 26)</h4>
                                                <div class="grid grid-cols-4 gap-4">
                                                    <div class="col-span-1"><label class="block text-xs font-medium text-gray-700">Mối quan hệ <span x-show="showColumns" class="text-blue-600">[Cột 5]</span></label><input type="text" x-model="rel.relation" class="w-full border rounded px-2 py-1"></div>
                                                    <div class="col-span-2"><label class="block text-xs font-medium text-gray-700">Họ và tên thân nhân <span x-show="showColumns" class="text-blue-600">[Cột 6]</span></label><input type="text" x-model="rel.name" class="w-full border rounded px-2 py-1"></div>
                                                    <div class="col-span-1"><label class="block text-xs font-medium text-gray-700">Tên khác <span x-show="showColumns" class="text-blue-600">[Cột 7]</span></label><input type="text" x-model="rel.otherName" class="w-full border rounded px-2 py-1"></div>
                                                    
                                                    <div class="col-span-1"><label class="block text-xs font-medium text-gray-700">Ngày sinh <span x-show="showColumns" class="text-blue-600">[Cột 8]</span></label><input type="date" x-model="rel.birthYear" class="w-full border rounded px-2 py-1"></div>
                                                    <div class="col-span-3"><label class="block text-xs font-medium text-gray-700">Quê quán <span x-show="showColumns" class="text-blue-600">[Cột 9]</span></label><input type="text" x-model="rel.hometown" class="w-full border rounded px-2 py-1"></div>
                                                    
                                                    <div class="col-span-1"><label class="block text-xs font-medium text-gray-700">Quốc tịch <span x-show="showColumns" class="text-blue-600">[Cột 10]</span></label><input type="text" x-model="rel.nationality" class="w-full border rounded px-2 py-1"></div>
                                                    <div class="col-span-1"><label class="block text-xs font-medium text-gray-700">CCCD <span x-show="showColumns" class="text-blue-600">[Cột 11]</span></label><input type="text" x-model="rel.cccd" class="w-full border rounded px-2 py-1"></div>
                                                    <div class="col-span-2"><label class="block text-xs font-medium text-gray-700">Nghề nghiệp <span x-show="showColumns" class="text-blue-600">[Cột 12]</span></label><input type="text" x-model="rel.job" class="w-full border rounded px-2 py-1"></div>
                                                    
                                                    <div class="col-span-4"><label class="block text-xs font-medium text-gray-700">Nơi ĐKHKTT <span x-show="showColumns" class="text-blue-600">[Cột 13]</span></label><input type="text" x-model="rel.hktt" class="w-full border rounded px-2 py-1"></div>
                                                    <div class="col-span-4"><label class="block text-xs font-medium text-gray-700">Nơi ở hiện nay <span x-show="showColumns" class="text-blue-600">[Cột 14]</span></label><input type="text" x-model="rel.currentAddress" class="w-full border rounded px-2 py-1"></div>
                                                    
                                                    <div class="col-span-4"><label class="block text-xs font-medium text-gray-700">Nội dung <span x-show="showColumns" class="text-blue-600">[Cột 17]</span></label><textarea rows="1" x-model="rel.content" class="w-full border rounded px-2 py-1"></textarea></div>
                                                    
                                                    <div class="col-span-4 mt-4 mb-2 flex items-center justify-between">
                                                        <h4 class="font-semibold text-gray-700 border-b pb-1 w-full flex items-center justify-between">
                                                            Yếu tố nước ngoài
                                                            <label class="flex items-center gap-2 font-normal text-sm bg-yellow-50 px-3 py-1 rounded text-yellow-800 border border-yellow-200">
                                                                <input type="checkbox" x-model="rel.hasForeignElement" class="rounded text-[#447f28]"> Có yếu tố nước ngoài (Sẽ lên Phụ lục 2)
                                                            </label>
                                                        </h4>
                                                    </div>
                                                    
                                                    <div class="col-span-2"><label class="block text-xs font-medium text-gray-700">Đơn vị học tập/làm việc ở NN <span x-show="showColumns" class="text-blue-600">[Cột 18]</span></label><input type="text" x-model="rel.foreignInfo.unit" class="w-full border rounded px-2 py-1"></div>
                                                    <div class="col-span-1"><label class="block text-xs font-medium text-gray-700">Quốc gia <span x-show="showColumns" class="text-blue-600">[Cột 19]</span></label><input type="text" x-model="rel.foreignInfo.country" class="w-full border rounded px-2 py-1"></div>
                                                    <div class="col-span-1"><label class="block text-xs font-medium text-gray-700">Thời gian <span x-show="showColumns" class="text-blue-600">[Cột 20]</span></label><input type="text" x-model="rel.foreignInfo.time" class="w-full border rounded px-2 py-1"></div>
                                                    
                                                    <div class="col-span-2"><label class="block text-xs font-medium text-gray-700">Nguồn kinh phí <span x-show="showColumns" class="text-blue-600">[Cột 21]</span></label><input type="text" x-model="rel.foreignInfo.funding" class="w-full border rounded px-2 py-1"></div>
                                                    <div class="col-span-2"><label class="block text-xs font-medium text-gray-700">Đơn vị công tác hiện nay <span x-show="showColumns" class="text-blue-600">[Cột 22]</span></label><input type="text" x-model="rel.foreignInfo.currentWork" class="w-full border rounded px-2 py-1"></div>
                                                    
                                                    <div class="col-span-2"><label class="block text-xs font-medium text-gray-700">Kết hôn với người NN <span x-show="showColumns" class="text-blue-600">[Cột 23]</span></label><input type="text" x-model="rel.foreignInfo.married" class="w-full border rounded px-2 py-1"></div>
                                                    <div class="col-span-2"><label class="block text-xs font-medium text-gray-700">Làm cty FDI <span x-show="showColumns" class="text-blue-600">[Cột 24]</span></label><input type="text" x-model="rel.foreignInfo.fdi" class="w-full border rounded px-2 py-1"></div>
                                                    
                                                    <div class="col-span-2"><label class="block text-xs font-medium text-gray-700">Xử lý PL: Của nước sở tại <span x-show="showColumns" class="text-blue-600">[Cột 25]</span></label><input type="text" x-model="rel.foreignInfo.punishForeign" class="w-full border rounded px-2 py-1"></div>
                                                    <div class="col-span-2"><label class="block text-xs font-medium text-gray-700">Xử lý PL: Của PL Việt Nam <span x-show="showColumns" class="text-blue-600">[Cột 26]</span></label><input type="text" x-model="rel.foreignInfo.punishVN" class="w-full border rounded px-2 py-1"></div>
                                                </div>
                                            </div>
                                        </template>
                                    </div>
`;

content = content.replace(tabsRegex, newTabs);

// Update openPanel in JS to init trips, flags, relatives
const openPanelRegex = /openPanel\(person\) {[\s\S]*?this\.isPanelOpen = true;/;
const newOpenPanel = `openPanel(person) {
                    this.selectedPerson = person;
                    if (person) {
                        this.formData = JSON.parse(JSON.stringify(person));
                    } else {
                        this.formData = { 
                            name: '', code: '', cccd: '', birthYear: '', departmentId: ''
                        };
                    }
                    if (!this.formData.trips) this.formData.trips = [{}];
                    if (this.formData.trips.length === 0) this.formData.trips.push({});
                    if (!this.formData.flags) this.formData.flags = {};
                    if (!this.formData.relatives) this.formData.relatives = [];
                    // Ensure relatives have foreignInfo
                    this.formData.relatives.forEach(r => {
                        if (!r.foreignInfo) r.foreignInfo = {};
                    });
                    
                    this.activeTab = 'canhan';
                    this.isPanelOpen = true;`;

content = content.replace(openPanelRegex, newOpenPanel);

fs.writeFileSync('index.html', content);
console.log("Fixed x-model bindings and blank row logic!");
