// js/pages/appendix2.js
import { Appendix2Service } from '../services/appendix2Service.js';
import { PersonnelService } from '../services/personnelService.js';
import { AppService } from '../services/appService.js';
import { Toast } from '../components/toast.js';
import { Modal } from '../components/modal.js';

export const Appendix2Page = {
    async render(container) {
        this.container = container;
        
        this.container.innerHTML = `
            <div class="table-responsive">
                <div class="table-title">
                    PHỤ LỤC SỐ 2<br>
                    Thân nhân của cán bộ, đảng viên đã và đang sinh sống ở nước ngoài
                </div>
                <div style="margin-bottom: 10px;">
                    <button class="btn btn-success" id="btn-add-appx2"><i class="fas fa-plus"></i> Thêm Thân nhân</button>
                    <span style="margin-left: 10px; font-style: italic; font-size: 12px; color: #666;">(Click vào bất kỳ hàng nào để xem hoặc sửa chi tiết)</span>
                </div>
                <table class="gov-table" id="table-appx2">
                    <thead>
                        <!-- Tầng 1 -->
                        <tr>
                            <th rowspan="2">STT</th>
                            <th colspan="7">Thông tin cá nhân</th>
                            <th colspan="6">Thông tin thân nhân</th>
                            <th colspan="7">Yếu tố nước ngoài</th>
                            <th colspan="2">Hình thức xử lý về pháp luật</th>
                        </tr>

                        <!-- Tầng 2 -->
                        <tr>
                            <!-- Của Thông tin cá nhân -->
                            <th>Họ và tên</th>
                            <th>Năm Sinh</th>
                            <th>Chức vụ</th>
                            <th>Đơn vị</th>
                            <th>Trọng yếu cơ mật</th>
                            <th>Dễ phát sinh tham nhũng, tiêu cực</th>
                            <th>Dễ tác động, mua chuộc, lôi kéo</th>

                            <!-- Của Thông tin thân nhân -->
                            <th>Mối quan hệ</th>
                            <th>Họ và tên</th>
                            <th>Năm sinh</th>
                            <th>Chỗ ở hiện nay</th>
                            <th>Nghề nghiệp hiện tại</th>
                            <th>Địa chỉ nơi làm việc, học tập</th>

                            <!-- Của Yếu tố nước ngoài -->
                            <th>Thời gian học tập, làm việc, sinh sống ở nước ngoài</th>
                            <th>Đơn vị học tập, làm việc, sinh sống ở nước ngoài</th>
                            <th>Quốc gia</th>
                            <th>Nguồn kinh phí (Tự túc; học bổng; tài trợ)</th>
                            <th>Đơn vị công tác hiện nay</th>
                            <th>Kết hôn với người nước ngoài</th>
                            <th>Làm việc tại công ty có vốn đầu tư nước ngoài</th>

                            <!-- Của Hình thức xử lý về pháp luật -->
                            <th>Của pháp luật Việt Nam (Hiệp định tương trợ tư pháp về hình sự và dẫn độ)</th>
                            <th>Của nước sở tại</th>
                        </tr>

                        <!-- Tầng 3 (Hàng số) -->
                        <tr style="background:#e9ecef; font-size:11px;">
                            ${Array.from({length: 23}, (_, i) => `<th>(${i+1})</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody id="appx2-tbody">
                        <tr><td colspan="23">Đang tải dữ liệu...</td></tr>
                    </tbody>
                </table>
            </div>
        `;

        await this.loadData();
        document.getElementById('btn-add-appx2').addEventListener('click', () => this.openAddModal());
    },

    async loadData() {
        const tbody = document.getElementById('appx2-tbody');
        try {
            const data = await Appendix2Service.list();
            if (data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="23">Chưa có dữ liệu</td></tr>';
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
                    
                    <!-- Info TN (9-14) -->
                    <td>${item.relationshipName || ''}</td>
                    <td>${item.relativeName || ''}</td>
                    <td>${item.birthYear || ''}</td>
                    <td>${item.currentAddress || ''}</td>
                    <td>${item.occupation || ''}</td>
                    <td>${item.studyWorkAddress || ''}</td>
                    
                    <!-- Yếu tố nước ngoài (15-21) -->
                    <td>${item.timeAbroad || ''}</td>
                    <td>${item.unitAbroad || ''}</td>
                    <td>${item.countryName || ''}</td>
                    <td>${item.fundingName || ''}</td>
                    <td>${item.currentUnit || ''}</td>
                    <td>${item.marriedToForeigner ? 'Có' : ''}</td>
                    <td>${item.workInForeignCompany ? 'Có' : ''}</td>
                    
                    <!-- PL (22-23) -->
                    <td>${item.xlplVietNam || ''}</td>
                    <td>${item.xlplNuocSoTai || ''}</td>
                `;
                
                tr.addEventListener('click', () => {
                    this.openEditModal(item);
                });
                
                tbody.appendChild(tr);
            });
        } catch(e) {
            tbody.innerHTML = '<tr><td colspan="23" style="color:red">Lỗi tải dữ liệu</td></tr>';
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
        const relOptions = md.relationships.map(c => `<option value="${c.id}" ${item && item.relationshipId === c.id ? 'selected' : ''}>${c.name}</option>`).join('');
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
            <div id="form-add-appx2">
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

                <div class="section-title"><i class="fas fa-user-friends"></i> 2. Thông tin Thân nhân</div>
                <div class="row">
                    <div class="col-md-3 form-group"><label>(9) Mối quan hệ <span style="color:red">*</span></label><select class="form-control" id="in-rel"><option value="">- Chọn -</option>${relOptions}</select></div>
                    <div class="col-md-5 form-group"><label>(10) Họ và tên thân nhân <span style="color:red">*</span></label><input type="text" class="form-control" id="in-name" value="${val('relativeName')}"></div>
                    <div class="col-md-4 form-group"><label>(11) Năm sinh</label><input type="number" class="form-control" id="in-tbirth" value="${val('birthYear')}"></div>
                    
                    <div class="col-md-6 form-group"><label>(12) Chỗ ở hiện nay</label><input type="text" class="form-control" id="in-address" value="${val('currentAddress')}"></div>
                    <div class="col-md-6 form-group"><label>(13) Nghề nghiệp hiện tại</label><input type="text" class="form-control" id="in-occ" value="${val('occupation')}"></div>
                    <div class="col-md-12 form-group"><label>(14) Địa chỉ nơi làm việc, học tập</label><input type="text" class="form-control" id="in-sw" value="${val('studyWorkAddress')}"></div>
                </div>

                <div class="section-title"><i class="fas fa-globe"></i> 3. Yếu tố nước ngoài</div>
                <div class="row">
                    <div class="col-md-6 form-group"><label>(15) Thời gian học tập, làm việc, sinh sống ở NN</label><input type="text" class="form-control" id="in-time" value="${val('timeAbroad')}"></div>
                    <div class="col-md-6 form-group"><label>(16) Đơn vị ở NN</label><input type="text" class="form-control" id="in-unit" value="${val('unitAbroad')}"></div>
                    <div class="col-md-4 form-group"><label>(17) Quốc gia <span style="color:red">*</span></label><select class="form-control" id="in-qg"><option value="">- Chọn -</option>${countryOptions}</select></div>
                    <div class="col-md-4 form-group"><label>(18) Nguồn kinh phí</label><select class="form-control" id="in-kinhphi"><option value="">- Chọn -</option>${fundingOptions}</select></div>
                    <div class="col-md-4 form-group"><label>(19) ĐV công tác hiện nay</label><input type="text" class="form-control" id="in-cunit" value="${val('currentUnit')}"></div>
                    
                    <div class="col-md-12 form-group" style="margin-top: 5px;">
                        <label class="custom-cb"><input type="checkbox" id="in-married" ${chk('marriedToForeigner')}> (20) Kết hôn với người nước ngoài</label>
                        <label class="custom-cb"><input type="checkbox" id="in-work" ${chk('workInForeignCompany')}> (21) Làm việc tại CTY có vốn nước ngoài</label>
                    </div>
                </div>

                <div class="section-title"><i class="fas fa-gavel"></i> 4. Hình thức xử lý về pháp luật</div>
                <div class="row">
                    <div class="col-md-6 form-group"><label>(22) Của pháp luật Việt Nam</label><input type="text" class="form-control" id="in-xlvn" value="${val('xlplVietNam')}"></div>
                    <div class="col-md-6 form-group"><label>(23) Của nước sở tại</label><input type="text" class="form-control" id="in-xlnn" value="${val('xlplNuocSoTai')}"></div>
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
            
            relationshipId: document.getElementById('in-rel').value,
            relativeName: document.getElementById('in-name').value,
            birthYear: parseInt(document.getElementById('in-tbirth').value) || null,
            currentAddress: document.getElementById('in-address').value,
            occupation: document.getElementById('in-occ').value,
            studyWorkAddress: document.getElementById('in-sw').value,
            
            timeAbroad: document.getElementById('in-time').value,
            unitAbroad: document.getElementById('in-unit').value,
            countryId: document.getElementById('in-qg').value,
            fundingId: document.getElementById('in-kinhphi').value,
            currentUnit: document.getElementById('in-cunit').value,
            marriedToForeigner: document.getElementById('in-married').checked,
            workInForeignCompany: document.getElementById('in-work').checked,
            
            xlplVietNam: document.getElementById('in-xlvn').value,
            xlplNuocSoTai: document.getElementById('in-xlnn').value
        };
    },

    async openAddModal() {
        const personnels = await PersonnelService.list();
        const md = AppService.getMasterData();

        const html = this.getFormHtml(personnels, md);

        Modal.show("Thêm Thông tin Thân nhân (Phụ Lục 2)", html, async (closeModal) => {
            const payload = this.getPayload();
            if(!payload.personnelId || !payload.relationshipId || !payload.relativeName || !payload.countryId) {
                Toast.error("Vui lòng điền các trường bắt buộc (*)");
                return;
            }
            
            payload.id = `a2-new-${Date.now()}`;

            try {
                await Appendix2Service.create(payload);
                Toast.success("Đã lưu thông tin thân nhân!");
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

        Modal.show(`Cập nhật Phụ Lục 2 (ID: ${item.id})`, html, async (closeModal) => {
            const payload = this.getPayload();
            const updated = { ...item, ...payload };

            try {
                await Appendix2Service.update(item.id, updated);
                Toast.success("Đã cập nhật thân nhân!");
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
