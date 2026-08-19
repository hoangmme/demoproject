const fs = require('fs');
const file = 'index.html';
let content = fs.readFileSync(file, 'utf8');

const tabsRegex = /<!-- Tab 1: Hồ sơ nhân viên -->[\s\S]*?(?=<!-- Panel Footer -->)/;

const newTabs = `<!-- Tab 1: Hồ sơ nhân viên -->
                                    <div x-show="activeTab === 'hoso'" class="space-y-8">
                                        <!-- Phần A: Cá nhân -->
                                        <div class="space-y-4">
                                            <h3 class="text-lg font-medium text-gray-900 border-b pb-2">A. Thông tin cá nhân & Cư trú</h3>
                                            <div class="grid grid-cols-2 gap-6">
                                                <div><label class="block text-sm font-medium text-gray-700 mb-1">Mã CB</label>
                                                    <input type="text" x-model="formData.code" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-[#447f28] outline-none"></div>
                                                <div><label class="block text-sm font-medium text-gray-700 mb-1">Họ và Tên (*) <span x-show="showColumns" class="text-xs text-gray-400 ml-1 font-normal">[Cột 2]</span></label>
                                                    <input type="text" x-model="formData.name" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-[#447f28] outline-none"></div>
                                                <div><label class="block text-sm font-medium text-gray-700 mb-1">Tên khác <span x-show="showColumns" class="text-xs text-gray-400 ml-1 font-normal">[Cột 3]</span></label>
                                                    <input type="text" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-[#447f28] outline-none"></div>
                                                <div><label class="block text-sm font-medium text-gray-700 mb-1">Ngày, tháng, năm sinh <span x-show="showColumns" class="text-xs text-gray-400 ml-1 font-normal">[Cột 4]</span></label>
                                                    <input type="date" x-model="formData.birthYear" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-[#447f28] outline-none"></div>
                                                <div><label class="block text-sm font-medium text-gray-700 mb-1">Dân tộc <span x-show="showColumns" class="text-xs text-gray-400 ml-1 font-normal">[Cột 5]</span></label>
                                                    <input type="text" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-[#447f28] outline-none"></div>
                                                <div><label class="block text-sm font-medium text-gray-700 mb-1">Tôn giáo <span x-show="showColumns" class="text-xs text-gray-400 ml-1 font-normal">[Cột 6]</span></label>
                                                    <input type="text" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-[#447f28] outline-none"></div>
                                                <div class="col-span-2"><label class="block text-sm font-medium text-gray-700 mb-1">Quê quán <span x-show="showColumns" class="text-xs text-gray-400 ml-1 font-normal">[Cột 7]</span></label>
                                                    <input type="text" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-[#447f28] outline-none"></div>
                                                <div class="col-span-2"><label class="block text-sm font-medium text-gray-700 mb-1">Đơn vị công tác <span x-show="showColumns" class="text-xs text-gray-400 ml-1 font-normal">[Cột 8]</span></label>
                                                    <select x-model="formData.departmentId" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-[#447f28] outline-none bg-white">
                                                        <option value="">-- Chọn phòng ban --</option>
                                                        <template x-for="dept in departments" :key="dept.id"><option :value="dept.id" x-text="dept.name"></option></template>
                                                    </select></div>
                                                <div><label class="block text-sm font-medium text-gray-700 mb-1">Chức vụ <span x-show="showColumns" class="text-xs text-gray-400 ml-1 font-normal">[Cột 9]</span></label>
                                                    <input type="text" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-[#447f28] outline-none"></div>
                                                <div><label class="block text-sm font-medium text-gray-700 mb-1">Số Căn cước công dân <span x-show="showColumns" class="text-xs text-gray-400 ml-1 font-normal">[Cột 12]</span></label>
                                                    <input type="text" x-model="formData.cccd" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-[#447f28] outline-none"></div>
                                                <div class="col-span-2"><label class="block text-sm font-medium text-gray-700 mb-1">Nơi đăng ký hộ khẩu thường trú <span x-show="showColumns" class="text-xs text-gray-400 ml-1 font-normal">[Cột 10]</span></label>
                                                    <input type="text" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-[#447f28] outline-none"></div>
                                                <div class="col-span-2"><label class="block text-sm font-medium text-gray-700 mb-1">Nơi ở hiện nay <span x-show="showColumns" class="text-xs text-gray-400 ml-1 font-normal">[Cột 11]</span></label>
                                                    <input type="text" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-[#447f28] outline-none"></div>
                                                <div><label class="block text-sm font-medium text-gray-700 mb-1">Số hộ chiếu cá nhân <span x-show="showColumns" class="text-xs text-gray-400 ml-1 font-normal">[Cột 13]</span></label>
                                                    <input type="text" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-[#447f28] outline-none"></div>
                                                <div><label class="block text-sm font-medium text-gray-700 mb-1">Số Hộ chiếu công vụ <span x-show="showColumns" class="text-xs text-gray-400 ml-1 font-normal">[Cột 14]</span></label>
                                                    <input type="text" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-[#447f28] outline-none"></div>
                                                <div class="col-span-2"><label class="block text-sm font-medium text-gray-700 mb-1">Kết quả thẩm tra, xác minh TCCT <span x-show="showColumns" class="text-xs text-gray-400 ml-1 font-normal">[Cột 15]</span></label>
                                                    <textarea rows="2" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-[#447f28] outline-none"></textarea></div>
                                            </div>
                                        </div>

                                        <!-- Phần B: Thân nhân -->
                                        <div class="space-y-4 pt-4">
                                            <div class="flex justify-between items-center border-b pb-2">
                                                <h3 class="text-lg font-medium text-gray-900">B. Thông tin Thân nhân</h3>
                                                <button type="button" class="text-sm text-[#447f28] hover:text-[#015301] font-medium">+ Thêm thân nhân</button>
                                            </div>
                                            <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
                                                [Khu vực bảng danh sách thân nhân]. Các cột trong danh sách này sẽ tương ứng với Cột 5 -> 22 của File Thân nhân.csv.
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <!-- Tab 2: Phụ lục 1 -->
                                    <div x-show="activeTab === 'pl1'" class="space-y-8">
                                        <div class="flex justify-between items-center border-b pb-2">
                                            <h3 class="text-lg font-medium text-gray-900">Lịch sử đi nước ngoài</h3>
                                            <button type="button" class="text-sm text-[#447f28] hover:text-[#015301] font-medium">+ Thêm chuyến đi</button>
                                        </div>
                                        
                                        <div class="space-y-6 p-5 border border-gray-200 rounded-xl bg-gray-50/50">
                                            <h4 class="font-semibold text-gray-700 text-sm">Nhóm Quyết định</h4>
                                            <div class="grid grid-cols-2 gap-4">
                                                <div><label class="block text-sm font-medium text-gray-700 mb-1">Số Quyết định <span x-show="showColumns" class="text-xs text-gray-400 ml-1 font-normal">[Cột 16]</span></label>
                                                    <input type="text" class="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white"></div>
                                                <div><label class="block text-sm font-medium text-gray-700 mb-1">Ngày ban hành <span x-show="showColumns" class="text-xs text-gray-400 ml-1 font-normal">[Cột 17]</span></label>
                                                    <input type="date" class="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white"></div>
                                                <div class="col-span-2"><label class="block text-sm font-medium text-gray-700 mb-1">Cơ quan, người thẩm quyền ban hành <span x-show="showColumns" class="text-xs text-gray-400 ml-1 font-normal">[Cột 18]</span></label>
                                                    <input type="text" class="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white"></div>
                                            </div>

                                            <h4 class="font-semibold text-gray-700 text-sm mt-4">Thông tin xuất nhập cảnh</h4>
                                            <div class="grid grid-cols-2 gap-4">
                                                <div><label class="block text-sm font-medium text-gray-700 mb-1">Ngày Xuất cảnh <span x-show="showColumns" class="text-xs text-gray-400 ml-1 font-normal">[Cột 19]</span></label>
                                                    <input type="date" class="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white"></div>
                                                <div><label class="block text-sm font-medium text-gray-700 mb-1">Ngày Nhập cảnh <span x-show="showColumns" class="text-xs text-gray-400 ml-1 font-normal">[Cột 20]</span></label>
                                                    <input type="date" class="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white"></div>
                                                <div><label class="block text-sm font-medium text-gray-700 mb-1">Quốc Gia <span x-show="showColumns" class="text-xs text-gray-400 ml-1 font-normal">[Cột 21]</span></label>
                                                    <input type="text" class="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white"></div>
                                                <div><label class="block text-sm font-medium text-gray-700 mb-1">Số lần <span x-show="showColumns" class="text-xs text-gray-400 ml-1 font-normal">[Cột 22]</span></label>
                                                    <input type="number" class="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white"></div>
                                            </div>

                                            <h4 class="font-semibold text-gray-700 text-sm mt-4">Mục đích</h4>
                                            <div class="grid grid-cols-3 gap-4">
                                                <div><label class="flex items-center gap-2 text-sm"><input type="checkbox" class="rounded text-[#447f28] focus:ring-[#447f28]"> Công tác <span x-show="showColumns" class="text-xs text-gray-400">[Cột 23]</span></label></div>
                                                <div><label class="flex items-center gap-2 text-sm"><input type="checkbox" class="rounded text-[#447f28] focus:ring-[#447f28]"> Học tập <span x-show="showColumns" class="text-xs text-gray-400">[Cột 24]</span></label></div>
                                                <div><label class="flex items-center gap-2 text-sm"><input type="checkbox" class="rounded text-[#447f28] focus:ring-[#447f28]"> Việc riêng <span x-show="showColumns" class="text-xs text-gray-400">[Cột 25]</span></label></div>
                                            </div>

                                            <h4 class="font-semibold text-gray-700 text-sm mt-4">Quá trình học tập & Công tác (Nếu có)</h4>
                                            <div class="grid grid-cols-2 gap-4">
                                                <div><label class="block text-sm font-medium text-gray-700 mb-1">Nơi đào tạo <span x-show="showColumns" class="text-xs text-gray-400 ml-1 font-normal">[Cột 27]</span></label>
                                                    <input type="text" class="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white"></div>
                                                <div><label class="block text-sm font-medium text-gray-700 mb-1">Vai trò / Trưởng đoàn <span x-show="showColumns" class="text-xs text-gray-400 ml-1 font-normal">[Cột 28, 32]</span></label>
                                                    <input type="text" class="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white"></div>
                                                <div class="col-span-2"><label class="block text-sm font-medium text-gray-700 mb-1">Nguồn Kinh phí <span x-show="showColumns" class="text-xs text-gray-400 ml-1 font-normal">[Cột 30, 35, 36, 37]</span></label>
                                                    <input type="text" placeholder="Ngân sách NN / Tự túc / Nước sở tại..." class="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white"></div>
                                            </div>

                                            <h4 class="font-semibold text-gray-700 text-sm mt-4">Thủ tục sau khi đi</h4>
                                            <div class="grid grid-cols-2 gap-4">
                                                <div><label class="flex items-center gap-2 text-sm"><input type="checkbox" class="rounded text-[#447f28]"> Đã nộp hộ chiếu <span x-show="showColumns" class="text-xs text-gray-400">[Cột 38]</span></label></div>
                                                <div><label class="flex items-center gap-2 text-sm"><input type="checkbox" class="rounded text-[#447f28]"> Đã báo cáo <span x-show="showColumns" class="text-xs text-gray-400">[Cột 39]</span></label></div>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Tab 3: Phụ lục 3 & Lưu ý -->
                                    <div x-show="activeTab === 'pl3'" class="space-y-6">
                                        <h3 class="text-lg font-medium text-gray-900 border-b pb-2">Vấn đề cần lưu ý & Vi phạm</h3>
                                        <div class="space-y-6">
                                            
                                            <!-- Checkboxes -->
                                            <div class="space-y-3 bg-gray-50 p-5 rounded-xl border border-gray-200">
                                                <h4 class="font-semibold text-gray-700 text-sm mb-3">Các vi phạm (Tích chọn nếu có)</h4>
                                                <label class="flex items-start gap-3"><input type="checkbox" class="mt-1 rounded text-[#447f28] focus:ring-[#447f28]">
                                                    <div><span class="text-sm font-medium text-gray-800">Đi nước ngoài không xin phép</span> <span x-show="showColumns" class="text-xs text-gray-400 ml-1 font-normal">[Cột 45]</span></div>
                                                </label>
                                                <label class="flex items-start gap-3"><input type="checkbox" class="mt-1 rounded text-[#447f28] focus:ring-[#447f28]">
                                                    <div><span class="text-sm font-medium text-gray-800">Vi phạm pháp luật ở nước ngoài</span> <span x-show="showColumns" class="text-xs text-gray-400 ml-1 font-normal">[Cột 46]</span></div>
                                                </label>
                                                <label class="flex items-start gap-3"><input type="checkbox" class="mt-1 rounded text-[#447f28] focus:ring-[#447f28]">
                                                    <div><span class="text-sm font-medium text-gray-800">Ở lại nước ngoài quá thời gian quy định</span> <span x-show="showColumns" class="text-xs text-gray-400 ml-1 font-normal">[Cột 47]</span></div>
                                                </label>
                                                <label class="flex items-start gap-3"><input type="checkbox" class="mt-1 rounded text-[#447f28] focus:ring-[#447f28]">
                                                    <div><span class="text-sm font-medium text-gray-800">Cho người nước ngoài thuê nhà, đất</span> <span x-show="showColumns" class="text-xs text-gray-400 ml-1 font-normal">[Cột 50]</span></div>
                                                </label>
                                                <label class="flex items-start gap-3"><input type="checkbox" class="mt-1 rounded text-[#447f28] focus:ring-[#447f28]">
                                                    <div><span class="text-sm font-medium text-gray-800">Làm việc tại công ty có vốn đầu tư nước ngoài</span> <span x-show="showColumns" class="text-xs text-gray-400 ml-1 font-normal">[Cột 51]</span></div>
                                                </label>
                                            </div>

                                            <!-- Textareas -->
                                            <div class="space-y-4">
                                                <div><label class="block text-sm font-medium text-gray-700 mb-1">Bản thân có vấn đề tiêu chuẩn chính trị (tự diễn biến, tự chuyển hóa) <span x-show="showColumns" class="text-xs text-gray-400 ml-1 font-normal">[Cột 40]</span></label>
                                                    <textarea rows="2" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-[#447f28] outline-none"></textarea></div>
                                                
                                                <div><label class="block text-sm font-medium text-gray-700 mb-1">Bản thân và thân nhân đang trong quá trình điều tra, xem xét <span x-show="showColumns" class="text-xs text-gray-400 ml-1 font-normal">[Cột 41]</span></label>
                                                    <textarea rows="2" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-[#447f28] outline-none"></textarea></div>
                                                    
                                                <div><label class="block text-sm font-medium text-gray-700 mb-1">Kỷ luật Đảng / Kỷ luật Chính quyền <span x-show="showColumns" class="text-xs text-gray-400 ml-1 font-normal">[Cột 43, 44]</span></label>
                                                    <textarea rows="2" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-[#447f28] outline-none"></textarea></div>
                                                    
                                                <div><label class="block text-sm font-medium text-gray-700 mb-1">Được tặng tiền, hàng, hiện vật có giá trị >50 triệu <span x-show="showColumns" class="text-xs text-gray-400 ml-1 font-normal">[Cột 49]</span></label>
                                                    <input type="text" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-[#447f28] outline-none"></div>
                                            </div>

                                        </div>
                                    </div>

                                </div>
`;

content = content.replace(tabsRegex, newTabs);
fs.writeFileSync(file, content);
console.log("Injected all fields");
