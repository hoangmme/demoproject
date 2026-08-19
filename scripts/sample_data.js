const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Wrap Trips delete button in isAdmin()
const oldTripDeleteBtn = `<button type="button" @click="formData.trips.splice(index, 1)" class="absolute -right-2 -top-2 text-red-500 hover:bg-red-50 rounded-full p-1">`;
const newTripDeleteBtn = `<button x-show="isAdmin()" type="button" @click="formData.trips.splice(index, 1)" class="absolute -right-2 -top-2 text-red-500 hover:bg-red-50 rounded-full p-1">`;
html = html.replace(oldTripDeleteBtn, newTripDeleteBtn);

// 2. Wrap Relatives delete button in isAdmin()
const oldRelativeDeleteBtn = `<button type="button" @click="formData.relatives.splice(index, 1)" class="text-red-500 hover:text-red-700 text-sm font-medium flex items-center gap-1">`;
const newRelativeDeleteBtn = `<button x-show="isAdmin()" type="button" @click="formData.relatives.splice(index, 1)" class="text-red-500 hover:text-red-700 text-sm font-medium flex items-center gap-1">`;
html = html.replace(oldRelativeDeleteBtn, newRelativeDeleteBtn);

// 3. Add loadSampleData function
const openImportModalHtml = `openImportModal() {
                    this.isImportModalOpen = true;
                    this.importStep = 1;
                    this.importPasteText = '';
                    this.importHeaders = [];
                    this.importRows = [];
                    this.importMapping = {};
                },`;
const loadSampleDataHtml = `openImportModal() {
                    this.isImportModalOpen = true;
                    this.importStep = 1;
                    this.importPasteText = '';
                    this.importHeaders = [];
                    this.importRows = [];
                    this.importMapping = {};
                },
                loadSampleData() {
                    this.importPasteText = \`Họ và tên\tSố CCCD\tGiới tính\tEmail\tChức vụ
Nguyễn Văn Mẫu\t001080123456\tNam\tmau.nv@system.com\tTrưởng phòng
Trần Thị Test\t001080987654\tNữ\ttest.tt@system.com\tNhân viên\`;
                    this.processPastedData();
                },`;
html = html.replace(openImportModalHtml, loadSampleDataHtml);

// 4. Update the Import UI to add the button
const oldImportText = `<p class="text-sm text-gray-600 mb-4">Copy dữ liệu bảng từ Excel hoặc Google Sheets (bao gồm cả dòng tiêu đề) và Dán (Ctrl+V) vào ô dưới đây:</p>`;
const newImportText = `<div class="flex justify-between items-center mb-4">
                        <p class="text-sm text-gray-600">Copy dữ liệu bảng từ Excel hoặc Google Sheets (bao gồm cả dòng tiêu đề) và Dán (Ctrl+V) vào ô dưới đây:</p>
                        <button type="button" @click="loadSampleData()" class="text-xs text-blue-600 underline hover:text-blue-800 font-medium">Điền dữ liệu mẫu</button>
                    </div>`;
html = html.replace(oldImportText, newImportText);

fs.writeFileSync('index.html', html);
console.log("Applied minor feature updates.");
