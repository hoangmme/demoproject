// js/pages/appendix3.js
import { Appendix3Service } from '../services/appendix3Service.js';
import { PersonnelService } from '../services/personnelService.js';
import { AppService } from '../services/appService.js';
import { Toast } from '../components/toast.js';
import { Modal } from '../components/modal.js';

export const Appendix3Page = {
    async render(container) {
        this.container = container;
        
        this.container.innerHTML = `
            <div class="table-responsive">
                <div class="table-title">
                    PHỤ LỤC SỐ 3<br>
                    Thông tin cán bộ, đảng viên có lịch sử bản thân đi nước ngoài và quan hệ tiếp xúc, làm việc các cá nhân, tổ chức nước ngoài
                </div>
                <div style="margin-bottom: 10px;">
                    <button class="btn btn-success" id="btn-add-appx3"><i class="fas fa-plus"></i> Thêm Lịch sử đi nước ngoài</button>
                    <span style="margin-left: 10px; font-style: italic; font-size: 12px; color: #666;">(Click vào bất kỳ hàng nào để xem hoặc sửa chi tiết)</span>
                </div>
                <table class="gov-table" id="table-appx3">
                    <thead>
                        <!-- Tầng 1 -->
                        <tr>
                            <th rowspan="3">STT</th>
                            <th colspan="7">Thông tin cá nhân</th>
                            <th colspan="20">Lịch sử bản thân đi nước ngoài và quan hệ tiếp xúc, làm việc các cá nhân, tổ chức nước ngoài</th>
                        </tr>
                        <!-- Tầng 2 -->
                        <tr>
                            <th rowspan="2">Họ và tên</th>
                            <th rowspan="2">Năm Sinh</th>
                            <th rowspan="2">Chức vụ</th>
                            <th rowspan="2">Đơn vị</th>
                            <th colspan="3">Vị trí công tác</th>

                            <th colspan="6">Quá trình học tập tại nước ngoài của cán bộ</th>
                            <th colspan="3">Công tác</th>
                            <th colspan="6">Việc riêng (du lịch, thăm thân, chữa bệnh...)</th>
                            <th rowspan="2">Quốc gia</th>
                            <th colspan="4">Liên quan yếu tố nước ngoài của bản thân</th>
                        </tr>
                        <!-- Tầng 3 -->
                        <tr>
                            <!-- Của Vị trí công tác -->
                            <th>Trọng yếu cơ mật</th>
                            <th>Dễ phát sinh tham nhũng, tiêu cực</th>
                            <th>Dễ tác động, mua chuộc, lôi kéo</th>

                            <!-- Của Quá trình học tập -->
                            <th>Diện đào tạo</th>
                            <th>Nơi đào tạo</th>
                            <th>Vai trò khi tham gia đào tạo tại nước ngoài</th>
                            <th>Đơn vị chọn cử</th>
                            <th>Nguồn Kinh phí (tự túc, học bổng, tài trợ...)</th>
                            <th>Thời gian đào tạo</th>

                            <!-- Của Công tác -->
                            <th>- Trưởng Đoàn<br>- Chức vụ công tác<br>- Đơn vị công tác</th>
                            <th>Thành phần Đoàn</th>
                            <th>Số lượng thành viên Đoàn</th>

                            <!-- Của Việc riêng -->
                            <th>Quyết định</th>
                            <th>Ngày ban hành</th>
                            <th>Cơ quan ban hành</th>
                            <th>Ngày Xuất cảnh</th>
                            <th>Ngày nhập cảnh</th>
                            <th>Số lần</th>

                            <!-- Của Liên quan yếu tố nước ngoài -->
                            <th>Kết hôn với người nước ngoài</th>
                            <th>Được tặng tiền, hàng trị giá từ 50tr trở lên</th>
                            <th>Cho người nước ngoài thuê nhà, đất</th>
                            <th>Làm việc tại công ty có vốn nước ngoài</th>
                        </tr>
                        <!-- Tầng 4 (Hàng số) -->
                        <tr style="background:#e9ecef; font-size:11px;">
                            ${Array.from({length: 28}, (_, i) => `<th>(${i+1})</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody id="appx3-tbody">
                        <tr><td colspan="28">Đang tải dữ liệu...</td></tr>
                    </tbody>
                </table>
            </div>
        `;

        await this.loadData();
        document.getElementById('btn-add-appx3').addEventListener('click', () => this.openAddModal());
    },

    async loadData() {
        const tbody = document.getElementById('appx3-tbody');
        try {
            const data = await Appendix3Service.list();
            if (data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="28">Chưa có dữ liệu</td></tr>';
                return;
            }

            tbody.innerHTML = '';
            let stt = 1;
            data.forEach(item => {
                const tr = document.createElement('tr');
                tr.style.cursor = 'pointer';
                tr.innerHTML = `
                    <td>${stt++}</td>
                    <!-- Info CB (2-8) -->
                    <td style="font-weight:bold; color:#3c8dbc">${item.personnelName || ''}</td>
                    <td>${item.personnelBirthYear || ''}</td>
                    <td>${item.positionName || ''}</td>
                    <td>${item.departmentName || ''}</td>
                    <td>${item.trongYeu || ''}</td>
                    <td>${item.thamNhung || ''}</td>
                    <td>${item.loiKeo || ''}</td>
                    
                    <!-- Quá trình học tập (9-14) -->
                    <td>${item.trainingType || ''}</td>
                    <td>${item.trainingPlace || ''}</td>
                    <td>${item.trainingRole || ''}</td>
                    <td>${item.sponsorUnit || ''}</td>
                    <td>${item.fundingName || ''}</td>
                    <td>${item.trainingTime || ''}</td>
                    
                    <!-- Công tác (15-17) -->
                    <td>${item.workRole || ''}</td>
                    <td>${item.workMembers || ''}</td>
                    <td>${item.workMemberCount || ''}</td>

                    <!-- Việc riêng (18-23) -->
                    <td>${item.decisionNumber || ''}</td>
                    <td>${item.decisionDate || ''}</td>
                    <td>${item.decisionIssuer || ''}</td>
                    <td>${item.departureDate || ''}</td>
                    <td>${item.arrivalDate || ''}</td>
                    <td>${item.tripCount || ''}</td>
                    
                    <!-- Quốc gia (24) -->
                    <td>${item.countryName || ''}</td>

                    <!-- Liên quan yếu tố NN (25-28) -->
                    <td>${item.marriedToForeigner ? 'Có' : ''}</td>
                    <td>${item.receivedGiftOver50M ? 'Có' : ''}</td>
                    <td>${item.rentHouseToForeigner ? 'Có' : ''}</td>
                    <td>${item.workInForeignCompany ? 'Có' : ''}</td>
                `;
                
                tr.addEventListener('click', () => {
                    this.openEditModal(item);
                });
                
                tbody.appendChild(tr);
            });
        } catch(e) {
            tbody.innerHTML = '<tr><td colspan="28" style="color:red">Lỗi tải dữ liệu</td></tr>';
        }
    },

    getFormHtml(personnels, md, item = null) {
        const cbOptions = personnels.map(p => `<option data-id="${p.id}" value="${p.code} - ${p.cccd} - ${p.name}"></option>`).join('');
        
        let selectedCbValue = '';
        if (item && item.personnelId) {
            const p = personnels.find(x => x.id === item.personnelId);
            if (p) selectedCbValue = `${p.code} - ${p.cccd} - ${p.name}`;
        }
        
        const countryOptions = md.countries.map(c => `<option value="${c.id}" ${item && item.countryId === c.id ? 'selected' : ''}>${c.name}</option>`).join('');
        const fundingOptions = md.fundings.map(c => `<option value="${c.id}" ${item && item.fundingId === c.id ? 'selected' : ''}>${c.name}</option>`).join('');

        const val = (field) => item && item[field] ? item[field] : '';
        const chk = (field, match) => {
            if (match !== undefined) return item && item[field] === match ? 'checked' : '';
            return item && item[field] === true ? 'checked' : '';
        };

        return `
            <style>
                .section-title { font-weight: bold; color: #3c8dbc; border-bottom: 1px solid #ddd; padding-bottom: 5px; margin: 15px 0 10px 0; font-size: 14px; }
                .ro-field { background: #f4f6f9 !important; font-weight: bold; }
                .custom-cb { font-weight: normal; margin-right: 15px; cursor: pointer; }
            </style>
            <div id="form-add-appx3">
                <div class="section-title" style="margin-top:0"><i class="fas fa-user"></i> 1. Thông tin Cán bộ</div>
                <div class="row">
                    <div class="col-md-3 form-group">
                        <label>(2) Chọn Cán bộ <span style="color:red">*</span></label>
                        <input list="cb-list" class="form-control" id="in-cb-search" value="${selectedCbValue}" ${item ? 'disabled' : ''} placeholder="Mã CB, CCCD, Tên...">
                        <datalist id="cb-list">${cbOptions}</datalist>
                        <input type="hidden" id="in-cb" value="${item ? item.personnelId : ''}">
                    </div>
                    <div class="col-md-3 form-group"><label>(3) Năm sinh</label><input type="text" class="form-control ro-field" id="ro-birth" disabled value="${val('personnelBirthYear')}"></div>
                    <div class="col-md-3 form-group"><label>(4) Chức vụ</label><input type="text" class="form-control ro-field" id="ro-pos" disabled value="${val('positionName')}"></div>
                    <div class="col-md-3 form-group"><label>(5) Đơn vị</label><input type="text" class="form-control ro-field" id="ro-dept" disabled value="${val('departmentName')}"></div>
                    
                    <div class="col-md-12 form-group" style="margin-top: 5px;">
                        <label>Đặc thù công tác (6, 7, 8)</label><br>
                        <label class="custom-cb"><input type="checkbox" id="in-trongyeu" ${chk('trongYeu', 'Có')}> (6) Trọng yếu cơ mật</label>
                        <label class="custom-cb"><input type="checkbox" id="in-thamnhung" ${chk('thamNhung', 'Có')}> (7) Dễ tham nhũng</label>
                        <label class="custom-cb"><input type="checkbox" id="in-loikeo" ${chk('loiKeo', 'Có')}> (8) Dễ bị lôi kéo</label>
                    </div>
                </div>

                <div class="section-title"><i class="fas fa-graduation-cap"></i> 2. Quá trình học tập tại nước ngoài</div>
                <div class="row">
                    <div class="col-md-4 form-group"><label>(9) Diện đào tạo</label><input type="text" class="form-control" id="in-ttype" value="${val('trainingType')}"></div>
                    <div class="col-md-4 form-group"><label>(10) Nơi đào tạo</label><input type="text" class="form-control" id="in-tplace" value="${val('trainingPlace')}"></div>
                    <div class="col-md-4 form-group"><label>(11) Vai trò khi tham gia</label><input type="text" class="form-control" id="in-trole" value="${val('trainingRole')}"></div>
                    <div class="col-md-4 form-group"><label>(12) Đơn vị chọn cử</label><input type="text" class="form-control" id="in-sunit" value="${val('sponsorUnit')}"></div>
                    <div class="col-md-4 form-group"><label>(13) Nguồn kinh phí</label><select class="form-control" id="in-funding"><option value="">- Chọn -</option>${fundingOptions}</select></div>
                    <div class="col-md-4 form-group"><label>(14) Thời gian đào tạo</label><input type="text" class="form-control" id="in-ttime" value="${val('trainingTime')}"></div>
                </div>

                <div class="section-title"><i class="fas fa-briefcase"></i> 3. Công tác tại nước ngoài</div>
                <div class="row">
                    <div class="col-md-12 form-group"><label>(15) Trưởng đoàn / Chức vụ / Đơn vị công tác</label><input type="text" class="form-control" id="in-wrole" value="${val('workRole')}"></div>
                    <div class="col-md-8 form-group"><label>(16) Thành phần Đoàn</label><input type="text" class="form-control" id="in-wmem" value="${val('workMembers')}"></div>
                    <div class="col-md-4 form-group"><label>(17) Số lượng thành viên</label><input type="number" class="form-control" id="in-wcount" value="${val('workMemberCount')}"></div>
                </div>

                <div class="section-title"><i class="fas fa-plane"></i> 4. Việc riêng (du lịch, thăm thân...) & Quốc gia</div>
                <div class="row">
                    <div class="col-md-4 form-group"><label>(18) Quyết định</label><input type="text" class="form-control" id="in-qd" value="${val('decisionNumber')}"></div>
                    <div class="col-md-4 form-group"><label>(19) Ngày ban hành</label><input type="date" class="form-control" id="in-qd-date" value="${val('decisionDate')}"></div>
                    <div class="col-md-4 form-group"><label>(20) Cơ quan ban hành</label><input type="text" class="form-control" id="in-qd-cq" value="${val('decisionIssuer')}"></div>
                    <div class="col-md-3 form-group"><label>(21) Ngày xuất cảnh</label><input type="date" class="form-control" id="in-xuat" value="${val('departureDate')}"></div>
                    <div class="col-md-3 form-group"><label>(22) Ngày nhập cảnh</label><input type="date" class="form-control" id="in-nhap" value="${val('arrivalDate')}"></div>
                    <div class="col-md-2 form-group"><label>(23) Số lần</label><input type="number" class="form-control" id="in-solan" value="${val('tripCount')}"></div>
                    <div class="col-md-4 form-group"><label>(24) Quốc gia</label><select class="form-control" id="in-qg"><option value="">- Chọn -</option>${countryOptions}</select></div>
                </div>

                <div class="section-title"><i class="fas fa-exclamation-circle"></i> 5. Liên quan yếu tố nước ngoài của bản thân</div>
                <div class="row">
                    <div class="col-md-6 form-group">
                        <label style="font-weight:normal; cursor:pointer;"><input type="checkbox" id="in-cb25" ${chk('marriedToForeigner')}> (25) Kết hôn với người NN</label>
                    </div>
                    <div class="col-md-6 form-group">
                        <label style="font-weight:normal; cursor:pointer;"><input type="checkbox" id="in-cb26" ${chk('receivedGiftOver50M')}> (26) Nhận quà tặng >= 50tr</label>
                    </div>
                    <div class="col-md-6 form-group">
                        <label style="font-weight:normal; cursor:pointer;"><input type="checkbox" id="in-cb27" ${chk('rentHouseToForeigner')}> (27) Cho người NN thuê nhà/đất</label>
                    </div>
                    <div class="col-md-6 form-group">
                        <label style="font-weight:normal; cursor:pointer;"><input type="checkbox" id="in-cb28" ${chk('workInForeignCompany')}> (28) Làm việc cho công ty vốn NN</label>
                    </div>
                </div>
            </div>
        `;
    },

    getPayload() {
        return {
            personnelId: document.getElementById('in-cb').value,
            trongYeu: document.getElementById('in-trongyeu').checked ? 'Có' : '',
            thamNhung: document.getElementById('in-thamnhung').checked ? 'Có' : '',
            loiKeo: document.getElementById('in-loikeo').checked ? 'Có' : '',
            
            trainingType: document.getElementById('in-ttype').value,
            trainingPlace: document.getElementById('in-tplace').value,
            trainingRole: document.getElementById('in-trole').value,
            sponsorUnit: document.getElementById('in-sunit').value,
            fundingId: document.getElementById('in-funding').value,
            trainingTime: document.getElementById('in-ttime').value,

            workRole: document.getElementById('in-wrole').value,
            workMembers: document.getElementById('in-wmem').value,
            workMemberCount: document.getElementById('in-wcount').value,

            decisionNumber: document.getElementById('in-qd').value,
            decisionDate: document.getElementById('in-qd-date').value,
            decisionIssuer: document.getElementById('in-qd-cq').value,
            departureDate: document.getElementById('in-xuat').value,
            arrivalDate: document.getElementById('in-nhap').value,
            tripCount: document.getElementById('in-solan').value,
            countryId: document.getElementById('in-qg').value,

            marriedToForeigner: document.getElementById('in-cb25').checked,
            receivedGiftOver50M: document.getElementById('in-cb26').checked,
            rentHouseToForeigner: document.getElementById('in-cb27').checked,
            workInForeignCompany: document.getElementById('in-cb28').checked
        };
    },

    async openAddModal() {
        const personnels = await PersonnelService.list();
        const md = AppService.getMasterData();

        const html = this.getFormHtml(personnels, md);

        Modal.show("Thêm Lịch sử đi nước ngoài (Phụ Lục 3)", html, async (closeModal) => {
            const payload = this.getPayload();
            if(!payload.personnelId) {
                Toast.error("Vui lòng điền các trường bắt buộc (*)");
                return;
            }
            
            payload.id = `a3-new-${Date.now()}`;

            try {
                await Appendix3Service.create(payload);
                Toast.success("Đã lưu lịch sử!");
                closeModal();
                this.loadData();
            } catch(e) {
                Toast.error("Lỗi khi lưu.");
            }
        });

        this.setupAutoFill(personnels);
    },

    async openEditModal(item) {
        const personnels = await PersonnelService.list();
        const md = AppService.getMasterData();

        const html = this.getFormHtml(personnels, md, item);

        Modal.show(`Cập nhật Phụ Lục 3 (ID: ${item.id})`, html, async (closeModal) => {
            const payload = this.getPayload();
            const updated = { ...item, ...payload };

            try {
                await Appendix3Service.update(item.id, updated);
                Toast.success("Đã cập nhật lịch sử!");
                closeModal();
                this.loadData();
            } catch(e) {
                Toast.error("Lỗi khi cập nhật.");
            }
        });

        this.setupAutoFill(personnels);
    },

    setupAutoFill(personnels) {
        const searchInput = document.getElementById('in-cb-search');
        const hiddenInput = document.getElementById('in-cb');
        if (!searchInput) return;
        
        searchInput.addEventListener('input', (e) => {
            const val = e.target.value;
            const options = document.getElementById('cb-list').options;
            let foundId = '';
            for(let i=0; i<options.length; i++) {
                if(options[i].value === val) {
                    foundId = options[i].getAttribute('data-id');
                    break;
                }
            }
            
            if(foundId) {
                hiddenInput.value = foundId;
                const p = personnels.find(x => x.id === foundId);
                if(p) {
                    document.getElementById('ro-birth').value = p.birthYear || '';
                    document.getElementById('ro-dept').value = p.departmentName || '';
                    document.getElementById('ro-pos').value = p.positionName || '';
                    Toast.success(`Đã tự động điền thông tin của ${p.name}`);
                }
            } else {
                hiddenInput.value = '';
                document.getElementById('ro-birth').value = '';
                document.getElementById('ro-dept').value = '';
                document.getElementById('ro-pos').value = '';
            }
        });
    }
};
