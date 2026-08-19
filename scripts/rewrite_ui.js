const fs = require('fs');
const file = 'index.html';
let content = fs.readFileSync(file, 'utf8');

const panelRegex = /<!-- Slide-over Panel \(Edit\/Add\) -->[\s\S]*?(?=<\/main>)/;

const newPanel = `<!-- Slide-over Panel (Edit/Add) -->
            <div x-cloak x-show="isPanelOpen" class="fixed inset-0 z-50 overflow-hidden" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
                <div class="absolute inset-0 overflow-hidden">
                    <!-- Backdrop -->
                    <div x-show="isPanelOpen" x-transition.opacity class="absolute inset-0 bg-gray-900 bg-opacity-30 transition-opacity" @click="closePanel()"></div>
                    
                    <div class="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                        <div x-show="isPanelOpen" 
                             x-transition:enter="transform transition ease-in-out duration-300" 
                             x-transition:enter-start="translate-x-full" 
                             x-transition:enter-end="translate-x-0" 
                             x-transition:leave="transform transition ease-in-out duration-300" 
                             x-transition:leave-start="translate-x-0" 
                             x-transition:leave-end="translate-x-full" 
                             class="pointer-events-auto w-screen max-w-4xl">
                            
                            <div class="flex h-full flex-col bg-white shadow-2xl">
                                <!-- Panel Header -->
                                <div class="bg-[linear-gradient(118deg,#447f28_32.46%,#015301_91.42%)] px-6 py-6 sm:px-8">
                                    <div class="flex items-center justify-between">
                                        <h2 class="text-xl font-semibold text-white" id="slide-over-title" x-text="selectedPerson ? 'Chi tiết Hồ sơ Cán bộ' : 'Thêm mới Cán bộ'"></h2>
                                        <div class="flex items-center gap-4">
                                            <label class="flex items-center gap-2 text-white/90 text-sm cursor-pointer">
                                                <input type="checkbox" x-model="showColumns" class="rounded text-[#447f28] focus:ring-[#447f28]">
                                                Hiện số cột [Cột X]
                                            </label>
                                            <button type="button" class="text-white/70 hover:text-white transition-colors ml-2" @click="closePanel()">
                                                <span class="sr-only">Đóng panel</span>
                                                <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Tabs Navigation -->
                                <div class="border-b border-gray-200 bg-gray-50 px-6 sm:px-8 pt-4">
                                    <nav class="-mb-px flex space-x-8">
                                        <template x-for="tab in tabs" :key="tab.id">
                                            <button @click="activeTab = tab.id" 
                                                    :class="activeTab === tab.id ? 'border-[#447f28] text-[#447f28]' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'"
                                                    class="whitespace-nowrap border-b-2 py-4 px-1 font-medium text-sm transition-colors"
                                                    x-text="tab.name"></button>
                                        </template>
                                    </nav>
                                </div>

                                <!-- Tab Contents -->
                                <div class="flex-1 overflow-y-auto px-6 sm:px-8 py-6">
                                    
                                    <!-- Tab 1: Hồ sơ nhân viên -->
                                    <div x-show="activeTab === 'hoso'" class="space-y-8">
                                        <!-- Phần A: Cá nhân -->
                                        <div class="space-y-4">
                                            <h3 class="text-lg font-medium text-gray-900 border-b pb-2">A. Thông tin cá nhân</h3>
                                            <div class="grid grid-cols-2 gap-6">
                                                <div>
                                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                                        Mã CB <span x-show="showColumns" class="text-xs text-gray-400 ml-1 font-normal">[Cột 1]</span>
                                                    </label>
                                                    <input type="text" x-model="formData.code" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-[#447f28] focus:border-[#447f28] outline-none">
                                                </div>
                                                <div>
                                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                                        Họ và Tên (*) <span x-show="showColumns" class="text-xs text-gray-400 ml-1 font-normal">[Cột 2]</span>
                                                    </label>
                                                    <input type="text" x-model="formData.name" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-[#447f28] focus:border-[#447f28] outline-none">
                                                </div>
                                                <div>
                                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                                        Năm sinh <span x-show="showColumns" class="text-xs text-gray-400 ml-1 font-normal">[Cột 4]</span>
                                                    </label>
                                                    <input type="number" x-model="formData.birthYear" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-[#447f28] focus:border-[#447f28] outline-none">
                                                </div>
                                                <div>
                                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                                        CCCD <span x-show="showColumns" class="text-xs text-gray-400 ml-1 font-normal">[Cột 12]</span>
                                                    </label>
                                                    <input type="text" x-model="formData.cccd" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-[#447f28] focus:border-[#447f28] outline-none">
                                                </div>
                                                <div class="col-span-2">
                                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                                        Phòng ban/Đơn vị <span x-show="showColumns" class="text-xs text-gray-400 ml-1 font-normal">[Cột 8]</span>
                                                    </label>
                                                    <select x-model="formData.departmentId" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-[#447f28] focus:border-[#447f28] outline-none bg-white">
                                                        <option value="">-- Chọn phòng ban --</option>
                                                        <template x-for="dept in departments" :key="dept.id">
                                                            <option :value="dept.id" x-text="dept.name"></option>
                                                        </template>
                                                    </select>
                                                </div>
                                                <!-- Added fields based on bangoc.html -->
                                                <div>
                                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                                        Quê quán <span x-show="showColumns" class="text-xs text-gray-400 ml-1 font-normal">[Cột 7]</span>
                                                    </label>
                                                    <input type="text" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-[#447f28] focus:border-[#447f28] outline-none">
                                                </div>
                                                <div>
                                                    <label class="block text-sm font-medium text-gray-700 mb-1">
                                                        Chức vụ <span x-show="showColumns" class="text-xs text-gray-400 ml-1 font-normal">[Cột 9]</span>
                                                    </label>
                                                    <input type="text" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-[#447f28] focus:border-[#447f28] outline-none">
                                                </div>
                                            </div>
                                        </div>

                                        <!-- Phần B: Thân nhân -->
                                        <div class="space-y-4 pt-4">
                                            <div class="flex justify-between items-center border-b pb-2">
                                                <h3 class="text-lg font-medium text-gray-900">B. Thông tin Thân nhân</h3>
                                                <button type="button" class="text-sm text-[#447f28] hover:text-[#015301] font-medium">+ Thêm thân nhân</button>
                                            </div>
                                            <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
                                                Bảng danh sách thân nhân sẽ hiển thị ở đây. Các thân nhân có tích chọn "Yếu tố nước ngoài" sẽ tự động được đưa vào báo cáo Phụ lục 2.
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <!-- Tab 2: Phụ lục 1 -->
                                    <div x-show="activeTab === 'pl1'" class="space-y-6">
                                        <div class="flex justify-between items-center border-b pb-2">
                                            <h3 class="text-lg font-medium text-gray-900">Lịch sử đi nước ngoài</h3>
                                            <button type="button" class="text-sm text-[#447f28] hover:text-[#015301] font-medium">+ Thêm chuyến đi</button>
                                        </div>
                                        
                                        <div class="grid grid-cols-2 gap-6 p-4 border border-gray-200 rounded-lg bg-gray-50/50">
                                            <div class="col-span-2"><p class="text-sm text-gray-500 italic">Form mẫu nhập liệu chuyến đi:</p></div>
                                            <div>
                                                <label class="block text-sm font-medium text-gray-700 mb-1">
                                                    Số Quyết định <span x-show="showColumns" class="text-xs text-gray-400 ml-1 font-normal">[Cột 16]</span>
                                                </label>
                                                <input type="text" class="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white">
                                            </div>
                                            <div>
                                                <label class="block text-sm font-medium text-gray-700 mb-1">
                                                    Quốc gia <span x-show="showColumns" class="text-xs text-gray-400 ml-1 font-normal">[Cột 21]</span>
                                                </label>
                                                <input type="text" class="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white">
                                            </div>
                                            <div class="col-span-2">
                                                <label class="block text-sm font-medium text-gray-700 mb-1">
                                                    Mục đích <span x-show="showColumns" class="text-xs text-gray-400 ml-1 font-normal">[Cột 23,24,25]</span>
                                                </label>
                                                <select class="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white">
                                                    <option>Công tác</option>
                                                    <option>Học tập, tập huấn</option>
                                                    <option>Việc riêng (du lịch, thăm thân...)</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Tab 3: Phụ lục 3 & Lưu ý -->
                                    <div x-show="activeTab === 'pl3'" class="space-y-6">
                                        <h3 class="text-lg font-medium text-gray-900 border-b pb-2">Vấn đề cần lưu ý & Vi phạm</h3>
                                        <div class="space-y-4">
                                            <label class="flex items-start gap-3">
                                                <input type="checkbox" class="mt-1 rounded text-[#447f28] focus:ring-[#447f28]">
                                                <div>
                                                    <span class="text-sm font-medium text-gray-800">Đi nước ngoài khi chưa được phép</span>
                                                    <span x-show="showColumns" class="text-xs text-gray-400 ml-1 font-normal">[Cột 30]</span>
                                                </div>
                                            </label>
                                            <label class="flex items-start gap-3">
                                                <input type="checkbox" class="mt-1 rounded text-[#447f28] focus:ring-[#447f28]">
                                                <div>
                                                    <span class="text-sm font-medium text-gray-800">Vi phạm pháp luật ở nước ngoài</span>
                                                    <span x-show="showColumns" class="text-xs text-gray-400 ml-1 font-normal">[Cột 31]</span>
                                                </div>
                                            </label>
                                            <label class="flex items-start gap-3">
                                                <input type="checkbox" class="mt-1 rounded text-[#447f28] focus:ring-[#447f28]">
                                                <div>
                                                    <span class="text-sm font-medium text-gray-800">Làm việc tại công ty có vốn đầu tư nước ngoài</span>
                                                    <span x-show="showColumns" class="text-xs text-gray-400 ml-1 font-normal">[Cột 37 - PL1 / Cột 28 - PL3]</span>
                                                </div>
                                            </label>
                                        </div>
                                    </div>

                                </div>

                                <!-- Panel Footer -->
                                <div class="flex flex-shrink-0 justify-end gap-3 px-6 sm:px-8 py-4 border-t border-gray-200 bg-gray-50">
                                    <button type="button" @click="closePanel()" class="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm border border-gray-300 hover:bg-gray-50">Hủy</button>
                                    <button type="button" @click="saveData()" class="rounded-lg bg-[#447f28] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#015301]">Lưu thông tin</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            `;

content = content.replace(panelRegex, newPanel);

// Now update Alpine JS part
const scriptRegex = /activeTab: 'chung',[\s\S]*?tabs: \[[\s\S]*?\],/;
const newScript = `activeTab: 'hoso',
                showColumns: true,
                selectedPerson: null,
                formData: {},
                
                tabs: [
                    { id: 'hoso', name: 'Hồ sơ nhân viên' },
                    { id: 'pl1', name: 'Phụ lục 1' },
                    { id: 'pl3', name: 'Phụ lục 3 & Lưu ý' }
                ],`;

content = content.replace(scriptRegex, newScript);

// Also replace openPanel initial state 
content = content.replace(/this\.activeTab = 'chung';/, "this.activeTab = 'hoso';");

fs.writeFileSync(file, content);
console.log("Updated index.html");
