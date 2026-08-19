const fs = require('fs');
const file = 'index.html';
let content = fs.readFileSync(file, 'utf8');

const canhanRegex = /<!-- TAB 1: CÁ NHÂN \(52 Fields\) -->[\s\S]*?(?=<!-- TAB 2: THÂN NHÂN \(26 Fields\) -->)/;
const thannhanRegex = /<!-- TAB 2: THÂN NHÂN \(26 Fields\) -->[\s\S]*?(?=<\/div>\s*<!-- Panel Footer -->)/;

const newCaNhan = `<!-- TAB 1: CÁ NHÂN (52 Fields) -->
                                    <div x-show="activeTab === 'canhan'" class="space-y-10">
                                        <!-- Khối A: Thông tin cá nhân cơ bản -->
                                        <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                            <h3 class="text-lg font-bold text-[#447f28] mb-4 flex items-center gap-2">Khối A: Thông tin cơ bản</h3>
                                            <div class="grid grid-cols-4 gap-4">
                                                <div class="col-span-2"><label class="block text-xs font-medium text-gray-700">Họ và Tên <span x-show="showColumns" class="text-blue-600">[Cột 2]</span></label><input type="text" class="w-full border rounded px-2 py-1"></div>
                                                <div class="col-span-2"><label class="block text-xs font-medium text-gray-700">Tên khác <span x-show="showColumns" class="text-blue-600">[Cột 3]</span></label><input type="text" class="w-full border rounded px-2 py-1"></div>
                                                <div class="col-span-1"><label class="block text-xs font-medium text-gray-700">Ngày sinh <span x-show="showColumns" class="text-blue-600">[Cột 4]</span></label><input type="date" class="w-full border rounded px-2 py-1"></div>
                                                <div class="col-span-1"><label class="block text-xs font-medium text-gray-700">Dân tộc <span x-show="showColumns" class="text-blue-600">[Cột 5]</span></label><input type="text" class="w-full border rounded px-2 py-1"></div>
                                                <div class="col-span-2"><label class="block text-xs font-medium text-gray-700">Tôn giáo <span x-show="showColumns" class="text-blue-600">[Cột 6]</span></label><input type="text" class="w-full border rounded px-2 py-1"></div>
                                                
                                                <div class="col-span-4"><label class="block text-xs font-medium text-gray-700">Quê quán <span x-show="showColumns" class="text-blue-600">[Cột 7]</span></label><input type="text" class="w-full border rounded px-2 py-1"></div>
                                                <div class="col-span-2"><label class="block text-xs font-medium text-gray-700">Đơn vị công tác <span x-show="showColumns" class="text-blue-600">[Cột 8]</span></label><input type="text" class="w-full border rounded px-2 py-1"></div>
                                                <div class="col-span-2"><label class="block text-xs font-medium text-gray-700">Chức vụ <span x-show="showColumns" class="text-blue-600">[Cột 9]</span></label><input type="text" class="w-full border rounded px-2 py-1"></div>
                                                
                                                <div class="col-span-4"><label class="block text-xs font-medium text-gray-700">Nơi ĐKHK thường trú <span x-show="showColumns" class="text-blue-600">[Cột 10]</span></label><input type="text" class="w-full border rounded px-2 py-1"></div>
                                                <div class="col-span-4"><label class="block text-xs font-medium text-gray-700">Nơi ở hiện nay <span x-show="showColumns" class="text-blue-600">[Cột 11]</span></label><input type="text" class="w-full border rounded px-2 py-1"></div>
                                                
                                                <div class="col-span-2"><label class="block text-xs font-medium text-gray-700">Số CCCD <span x-show="showColumns" class="text-blue-600">[Cột 12]</span></label><input type="text" class="w-full border rounded px-2 py-1"></div>
                                                <div class="col-span-1"><label class="block text-xs font-medium text-gray-700">Hộ chiếu cá nhân <span x-show="showColumns" class="text-blue-600">[Cột 13]</span></label><input type="text" class="w-full border rounded px-2 py-1"></div>
                                                <div class="col-span-1"><label class="block text-xs font-medium text-gray-700">Hộ chiếu công vụ <span x-show="showColumns" class="text-blue-600">[Cột 14]</span></label><input type="text" class="w-full border rounded px-2 py-1"></div>
                                                
                                                <div class="col-span-4"><label class="block text-xs font-medium text-gray-700">Kết quả thẩm tra TCCT <span x-show="showColumns" class="text-blue-600">[Cột 15]</span></label><textarea rows="2" class="w-full border rounded px-2 py-1"></textarea></div>
                                            </div>
                                        </div>

                                        <!-- Khối B: Lịch sử Đi nước ngoài -->
                                        <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                            <div class="flex justify-between items-center mb-4">
                                                <h3 class="text-lg font-bold text-[#447f28]">Khối B: Lịch sử Đi nước ngoài</h3>
                                            </div>
                                            <div class="grid grid-cols-4 gap-4">
                                                <div class="col-span-1"><label class="block text-xs font-medium text-gray-700">Số Quyết định <span x-show="showColumns" class="text-blue-600">[Cột 16]</span></label><input type="text" class="w-full border rounded px-2 py-1"></div>
                                                <div class="col-span-1"><label class="block text-xs font-medium text-gray-700">Ngày ban hành <span x-show="showColumns" class="text-blue-600">[Cột 17]</span></label><input type="date" class="w-full border rounded px-2 py-1"></div>
                                                <div class="col-span-2"><label class="block text-xs font-medium text-gray-700">Cơ quan ban hành <span x-show="showColumns" class="text-blue-600">[Cột 18]</span></label><input type="text" class="w-full border rounded px-2 py-1"></div>
                                                
                                                <div class="col-span-1"><label class="block text-xs font-medium text-gray-700">Ngày Xuất cảnh <span x-show="showColumns" class="text-blue-600">[Cột 19]</span></label><input type="date" class="w-full border rounded px-2 py-1"></div>
                                                <div class="col-span-1"><label class="block text-xs font-medium text-gray-700">Ngày Nhập cảnh <span x-show="showColumns" class="text-blue-600">[Cột 20]</span></label><input type="date" class="w-full border rounded px-2 py-1"></div>
                                                <div class="col-span-1"><label class="block text-xs font-medium text-gray-700">Quốc Gia <span x-show="showColumns" class="text-blue-600">[Cột 21]</span></label><input type="text" class="w-full border rounded px-2 py-1"></div>
                                                <div class="col-span-1"><label class="block text-xs font-medium text-gray-700">Số lần <span x-show="showColumns" class="text-blue-600">[Cột 22]</span></label><input type="number" class="w-full border rounded px-2 py-1"></div>
                                                
                                                <div class="col-span-4"><label class="block text-xs font-medium text-gray-700 mb-1">Mục đích <span x-show="showColumns" class="text-blue-600">[Cột 23,24,25]</span></label>
                                                    <div class="flex gap-4">
                                                        <label><input type="checkbox"> Công tác [Cột 23]</label>
                                                        <label><input type="checkbox"> Học tập [Cột 24]</label>
                                                        <label><input type="checkbox"> Việc riêng [Cột 25]</label>
                                                    </div>
                                                </div>
                                                
                                                <div class="col-span-1"><label class="block text-xs font-medium text-gray-700">Diện đào tạo <span x-show="showColumns" class="text-blue-600">[Cột 26]</span></label><input type="text" class="w-full border rounded px-2 py-1"></div>
                                                <div class="col-span-1"><label class="block text-xs font-medium text-gray-700">Nơi đào tạo <span x-show="showColumns" class="text-blue-600">[Cột 27]</span></label><input type="text" class="w-full border rounded px-2 py-1"></div>
                                                <div class="col-span-1"><label class="block text-xs font-medium text-gray-700">Vai trò <span x-show="showColumns" class="text-blue-600">[Cột 28]</span></label><input type="text" class="w-full border rounded px-2 py-1"></div>
                                                <div class="col-span-1"><label class="block text-xs font-medium text-gray-700">Đơn vị cử <span x-show="showColumns" class="text-blue-600">[Cột 29]</span></label><input type="text" class="w-full border rounded px-2 py-1"></div>
                                                <div class="col-span-2"><label class="block text-xs font-medium text-gray-700">Kinh phí học tập <span x-show="showColumns" class="text-blue-600">[Cột 30]</span></label><input type="text" class="w-full border rounded px-2 py-1"></div>
                                                <div class="col-span-2"><label class="block text-xs font-medium text-gray-700">Thời gian đào tạo <span x-show="showColumns" class="text-blue-600">[Cột 31]</span></label><input type="text" class="w-full border rounded px-2 py-1"></div>
                                                
                                                <div class="col-span-1"><label class="block text-xs font-medium text-gray-700">Trưởng đoàn <span x-show="showColumns" class="text-blue-600">[Cột 32]</span></label><input type="text" class="w-full border rounded px-2 py-1"></div>
                                                <div class="col-span-2"><label class="block text-xs font-medium text-gray-700">Thành phần đoàn <span x-show="showColumns" class="text-blue-600">[Cột 33]</span></label><input type="text" class="w-full border rounded px-2 py-1"></div>
                                                <div class="col-span-1"><label class="block text-xs font-medium text-gray-700">Số lượng <span x-show="showColumns" class="text-blue-600">[Cột 34]</span></label><input type="number" class="w-full border rounded px-2 py-1"></div>
                                                
                                                <div class="col-span-4"><label class="block text-xs font-medium text-gray-700 mb-1">Nguồn kinh phí chuyến đi <span x-show="showColumns" class="text-blue-600">[Cột 35,36,37]</span></label>
                                                    <div class="flex gap-4">
                                                        <label><input type="checkbox"> Ngân sách NN [Cột 35]</label>
                                                        <label><input type="checkbox"> Nước sở tại [Cột 36]</label>
                                                        <label><input type="checkbox"> Tự túc [Cột 37]</label>
                                                    </div>
                                                </div>
                                                
                                                <div class="col-span-2"><label class="flex items-center gap-2"><input type="checkbox"> Đã nộp hộ chiếu <span x-show="showColumns" class="text-blue-600 text-xs">[Cột 38]</span></label></div>
                                                <div class="col-span-2"><label class="flex items-center gap-2"><input type="checkbox"> Đã báo cáo <span x-show="showColumns" class="text-blue-600 text-xs">[Cột 39]</span></label></div>
                                            </div>
                                        </div>

                                        <!-- Khối C: Lưu ý & Vi phạm -->
                                        <div class="bg-red-50 p-6 rounded-xl border border-red-100 shadow-sm">
                                            <h3 class="text-lg font-bold text-red-600 mb-4">Khối C: Vấn đề cần lưu ý</h3>
                                            <div class="grid grid-cols-2 gap-4">
                                                <div class="col-span-2"><label class="block text-xs font-medium text-gray-700">Vấn đề TCCT (Tự diễn biến) <span x-show="showColumns" class="text-blue-600">[Cột 40]</span></label><textarea rows="1" class="w-full border rounded px-2 py-1"></textarea></div>
                                                <div class="col-span-2"><label class="block text-xs font-medium text-gray-700">Đang bị điều tra <span x-show="showColumns" class="text-blue-600">[Cột 41]</span></label><textarea rows="1" class="w-full border rounded px-2 py-1"></textarea></div>
                                                <div class="col-span-2"><label class="block text-xs font-medium text-gray-700">Vấn đề khác về lý lịch <span x-show="showColumns" class="text-blue-600">[Cột 42]</span></label><textarea rows="1" class="w-full border rounded px-2 py-1"></textarea></div>
                                                
                                                <div class="col-span-1"><label><input type="checkbox"> Có vấn đề TCCT <span x-show="showColumns" class="text-blue-600 text-xs">[Cột 43]</span></label></div>
                                                <div class="col-span-1"><label><input type="checkbox"> Kỷ luật Đảng/CQ <span x-show="showColumns" class="text-blue-600 text-xs">[Cột 44]</span></label></div>
                                                <div class="col-span-1"><label><input type="checkbox"> Đi NN không phép <span x-show="showColumns" class="text-blue-600 text-xs">[Cột 45]</span></label></div>
                                                <div class="col-span-1"><label><input type="checkbox"> Vi phạm PL ở NN <span x-show="showColumns" class="text-blue-600 text-xs">[Cột 46]</span></label></div>
                                                <div class="col-span-1"><label><input type="checkbox"> Ở lại NN quá hạn <span x-show="showColumns" class="text-blue-600 text-xs">[Cột 47]</span></label></div>
                                                <div class="col-span-1"><label><input type="checkbox"> Thuộc diện quản lý <span x-show="showColumns" class="text-blue-600 text-xs">[Cột 48]</span></label></div>
                                                
                                                <div class="col-span-1"><label class="block text-xs font-medium text-gray-700">Được tặng quà >50tr <span x-show="showColumns" class="text-blue-600">[Cột 49]</span></label><input type="text" class="w-full border rounded px-2 py-1"></div>
                                                <div class="col-span-1"><label class="block text-xs font-medium text-gray-700">Cho thuê nhà/đất <span x-show="showColumns" class="text-blue-600">[Cột 50]</span></label><input type="text" class="w-full border rounded px-2 py-1"></div>
                                                <div class="col-span-1"><label class="block text-xs font-medium text-gray-700">Làm tại cty FDI <span x-show="showColumns" class="text-blue-600">[Cột 51]</span></label><input type="text" class="w-full border rounded px-2 py-1"></div>
                                            </div>
                                        </div>
                                    </div>
                                    
`;

const newThanNhan = `<!-- TAB 2: THÂN NHÂN (26 Fields) -->
                                    <div x-show="activeTab === 'thannhan'" class="space-y-6">
                                        <div class="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                                            <div>
                                                <h3 class="text-lg font-bold text-gray-800">Danh sách Thân nhân</h3>
                                                <p class="text-sm text-gray-500">Chứa 26 trường thông tin liên quan đến thân nhân.</p>
                                            </div>
                                            <button type="button" class="bg-[#447f28] hover:bg-[#015301] text-white text-sm font-medium px-4 py-2 rounded-lg shadow-sm">+ Thêm thân nhân</button>
                                        </div>
                                        
                                        <!-- Form Thân Nhân -->
                                        <div class="p-6 border border-gray-200 rounded-xl bg-white shadow-sm">
                                            <h4 class="font-bold text-[#447f28] mb-4">Thông tin Thân nhân (Cột 5 -> 26)</h4>
                                            <div class="grid grid-cols-4 gap-4">
                                                <div class="col-span-1"><label class="block text-xs font-medium text-gray-700">Mối quan hệ <span x-show="showColumns" class="text-blue-600">[Cột 5]</span></label><input type="text" class="w-full border rounded px-2 py-1"></div>
                                                <div class="col-span-2"><label class="block text-xs font-medium text-gray-700">Họ và tên thân nhân <span x-show="showColumns" class="text-blue-600">[Cột 6]</span></label><input type="text" class="w-full border rounded px-2 py-1"></div>
                                                <div class="col-span-1"><label class="block text-xs font-medium text-gray-700">Tên khác <span x-show="showColumns" class="text-blue-600">[Cột 7]</span></label><input type="text" class="w-full border rounded px-2 py-1"></div>
                                                
                                                <div class="col-span-1"><label class="block text-xs font-medium text-gray-700">Ngày sinh <span x-show="showColumns" class="text-blue-600">[Cột 8]</span></label><input type="date" class="w-full border rounded px-2 py-1"></div>
                                                <div class="col-span-3"><label class="block text-xs font-medium text-gray-700">Quê quán <span x-show="showColumns" class="text-blue-600">[Cột 9]</span></label><input type="text" class="w-full border rounded px-2 py-1"></div>
                                                
                                                <div class="col-span-1"><label class="block text-xs font-medium text-gray-700">Quốc tịch <span x-show="showColumns" class="text-blue-600">[Cột 10]</span></label><input type="text" class="w-full border rounded px-2 py-1"></div>
                                                <div class="col-span-1"><label class="block text-xs font-medium text-gray-700">CCCD <span x-show="showColumns" class="text-blue-600">[Cột 11]</span></label><input type="text" class="w-full border rounded px-2 py-1"></div>
                                                <div class="col-span-2"><label class="block text-xs font-medium text-gray-700">Nghề nghiệp <span x-show="showColumns" class="text-blue-600">[Cột 12]</span></label><input type="text" class="w-full border rounded px-2 py-1"></div>
                                                
                                                <div class="col-span-4"><label class="block text-xs font-medium text-gray-700">Nơi ĐKHKTT <span x-show="showColumns" class="text-blue-600">[Cột 13]</span></label><input type="text" class="w-full border rounded px-2 py-1"></div>
                                                <div class="col-span-4"><label class="block text-xs font-medium text-gray-700">Nơi ở hiện nay <span x-show="showColumns" class="text-blue-600">[Cột 14]</span></label><input type="text" class="w-full border rounded px-2 py-1"></div>
                                                
                                                <div class="col-span-2"><label class="block text-xs font-medium text-gray-700">Số CCCD (Dự phòng) <span x-show="showColumns" class="text-blue-600">[Cột 15]</span></label><input type="text" class="w-full border rounded px-2 py-1"></div>
                                                <div class="col-span-2"><label class="block text-xs font-medium text-gray-700">Số hồ sơ <span x-show="showColumns" class="text-blue-600">[Cột 16]</span></label><input type="text" class="w-full border rounded px-2 py-1"></div>
                                                
                                                <div class="col-span-4"><label class="block text-xs font-medium text-gray-700">Nội dung <span x-show="showColumns" class="text-blue-600">[Cột 17]</span></label><textarea rows="1" class="w-full border rounded px-2 py-1"></textarea></div>
                                                
                                                <div class="col-span-4 mt-4 mb-2"><h4 class="font-semibold text-gray-700 border-b pb-1">Yếu tố nước ngoài</h4></div>
                                                
                                                <div class="col-span-2"><label class="block text-xs font-medium text-gray-700">Đơn vị học tập/làm việc ở NN <span x-show="showColumns" class="text-blue-600">[Cột 18]</span></label><input type="text" class="w-full border rounded px-2 py-1"></div>
                                                <div class="col-span-1"><label class="block text-xs font-medium text-gray-700">Quốc gia <span x-show="showColumns" class="text-blue-600">[Cột 19]</span></label><input type="text" class="w-full border rounded px-2 py-1"></div>
                                                <div class="col-span-1"><label class="block text-xs font-medium text-gray-700">Thời gian <span x-show="showColumns" class="text-blue-600">[Cột 20]</span></label><input type="text" class="w-full border rounded px-2 py-1"></div>
                                                
                                                <div class="col-span-2"><label class="block text-xs font-medium text-gray-700">Nguồn kinh phí <span x-show="showColumns" class="text-blue-600">[Cột 21]</span></label><input type="text" class="w-full border rounded px-2 py-1"></div>
                                                <div class="col-span-2"><label class="block text-xs font-medium text-gray-700">Đơn vị công tác hiện nay <span x-show="showColumns" class="text-blue-600">[Cột 22]</span></label><input type="text" class="w-full border rounded px-2 py-1"></div>
                                                
                                                <div class="col-span-2"><label><input type="checkbox"> Kết hôn với người NN <span x-show="showColumns" class="text-blue-600 text-xs">[Cột 23]</span></label></div>
                                                <div class="col-span-2"><label><input type="checkbox"> Làm cty FDI <span x-show="showColumns" class="text-blue-600 text-xs">[Cột 24]</span></label></div>
                                                
                                                <div class="col-span-2"><label class="block text-xs font-medium text-gray-700">Xử lý PL: Của nước sở tại <span x-show="showColumns" class="text-blue-600">[Cột 25]</span></label><input type="text" class="w-full border rounded px-2 py-1"></div>
                                                <div class="col-span-2"><label class="block text-xs font-medium text-gray-700">Xử lý PL: Của PL Việt Nam <span x-show="showColumns" class="text-blue-600">[Cột 26]</span></label><input type="text" class="w-full border rounded px-2 py-1"></div>
                                            </div>
                                        </div>
                                    </div>
`;

content = content.replace(canhanRegex, newCaNhan);
content = content.replace(thannhanRegex, newThanNhan);
fs.writeFileSync(file, content);
console.log("Fixed field mapping and injected all 52 + 26 fields.");
