const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');

// 1. Fix Khối B (Trips) to use x-for instead of hardcoded trips[0]
const khoiBRegex = /<div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm" >[\s\S]*?<\/fieldset>/;
const newKhoiB = `<div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm" >
                                            <div class="flex justify-between items-center mb-4">
                                                <h3 class="text-lg font-bold text-[#447f28]">Khối B: Lịch sử Đi nước ngoài</h3>
                                                <button type="button" @click="formData.trips.push({})" class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium shadow-sm flex items-center gap-1"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg> Thêm Chuyến đi</button>
                                            </div>
                                            <template x-for="(trip, index) in formData.trips" :key="index">
                                                <div class="grid grid-cols-4 gap-4 mb-6 pb-6 border-b border-gray-100 relative">
                                                    <button type="button" @click="formData.trips.splice(index, 1)" class="absolute -right-2 -top-2 text-red-500 hover:bg-red-50 rounded-full p-1"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
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
                                                    <div class="col-span-2"><label class="block text-xs font-medium text-gray-700 mb-1">Kinh phí <span x-show="showColumns" class="text-blue-600">[Cột 26]</span></label>
                                                        <select x-model="trip.funding" class="w-full border rounded px-2 py-1">
                                                            <option>NSNN</option>
                                                            <option>Cơ quan đài thọ</option>
                                                            <option>Cá nhân</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </template>
                                            <div x-show="formData.trips.length === 0" class="text-center py-4 text-gray-500 italic text-sm">Chưa có chuyến đi nào.</div>
                                        </div>
                                        </fieldset>`;
content = content.replace(khoiBRegex, newKhoiB);

// 2. Add 'Thêm Thân Nhân' button to Thân nhân tab
const thanNhanHeaderRegex = /<h3 class="text-lg font-bold text-gray-800">Danh sách Thân nhân<\/h3>\s*<p class="text-sm text-gray-500">Chứa 26 trường thông tin liên quan đến thân nhân\.<\/p>\s*<\/div>\s*<\/div>/;
const newThanNhanHeader = `<h3 class="text-lg font-bold text-gray-800">Danh sách Thân nhân</h3>
                                                <p class="text-sm text-gray-500">Chứa 26 trường thông tin liên quan đến thân nhân.</p>
                                            </div>
                                            <button type="button" @click="formData.relatives.push({})" class="bg-[#447f28] hover:bg-[#015301] text-white px-4 py-2 rounded-lg font-medium shadow-sm flex items-center gap-2"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg> Thêm Thân nhân</button>
                                        </div>
                                        <div x-show="formData.relatives.length === 0" class="text-center py-10 bg-white rounded-xl border border-dashed border-gray-300 text-gray-500 italic">Chưa có danh sách thân nhân.</div>`;
content = content.replace(thanNhanHeaderRegex, newThanNhanHeader);

// Add a delete button inside each relative row
const relRowRegex = /<h4 class="font-bold text-\[#447f28\] mb-4">Thân nhân #<span x-text="index\+1"><\/span> \(Cột 5 -> 26\)<\/h4>/;
const newRelRow = `<div class="flex justify-between items-center mb-4">
                                                    <h4 class="font-bold text-[#447f28]">Thân nhân #<span x-text="index+1"></span> (Cột 5 -> 26)</h4>
                                                    <button type="button" @click="formData.relatives.splice(index, 1)" class="text-red-500 hover:text-red-700 text-sm font-medium flex items-center gap-1"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg> Xóa</button>
                                                </div>`;
content = content.replace(relRowRegex, newRelRow);

fs.writeFileSync('index.html', content);
console.log("Fixed arrays logic for Relatives and Trips!");
