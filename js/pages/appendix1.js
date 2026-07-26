// js/pages/appendix1.js
import { Appendix1Service } from '../services/appendix1Service.js';
import { PersonnelService } from '../services/personnelService.js';
import { AppService } from '../services/appService.js';
import { Toast } from '../components/toast.js';
import { Modal } from '../components/modal.js';

export const Appendix1Page = {
    async render(container) {
        this.container = container;
        
        // Render the wrapper and the giant table header
        this.container.innerHTML = `
            <div class="table-responsive">
                <div class="table-title">
                    PHỤ LỤC SỐ 1<br>
                    Cán bộ, đảng viên có yếu tố nước ngoài, đi học tập, làm việc, sinh sống ở nước ngoài
                </div>
                <div style="margin-bottom: 10px;">
                    <button class="btn btn-success" id="btn-add-appx1"><i class="fas fa-plus"></i> Thêm chuyến đi</button>
                    <span style="margin-left: 10px; font-style: italic; font-size: 12px; color: #666;">(Click vào bất kỳ hàng nào để xem hoặc sửa chi tiết)</span>
                </div>
                <table class="gov-table" id="table-appx1">
                    <thead>
                        <!-- Tầng 1 -->
                        <tr>
                            <th rowspan="4">STT</th>
                            <th colspan="12">Thông tin cá nhân, cư trú</th>
                            <th colspan="15">Thông tin đi nước ngoài</th>
                            <th colspan="2">Thủ tục sau khi đi nước ngoài về</th>
                            <th colspan="7">Những vấn đề đáng lưu ý</th>
                        </tr>
                        <!-- Tầng 2 -->
                        <tr>
                            <th rowspan="3">Họ và tên</th>
                            <th rowspan="3">Năm Sinh</th>
                            <th rowspan="3">Số CCCD</th>
                            <th colspan="2">Thông tin cư trú</th>
                            <th colspan="2">Số hộ chiếu</th>
                            <th colspan="5">Vị trí công tác</th>

                            <th rowspan="3">Kết quả thẩm tra...</th>
                            <th colspan="3">Quyết định</th>
                            <th colspan="4">Thông tin xuất nhập cảnh</th>
                            <th colspan="3">Mục đích</th>
                            <th colspan="4">Nguồn kinh phí</th>

                            <th rowspan="3">Nộp hộ chiếu CV</th>
                            <th rowspan="3">Báo cáo KQ</th>

                            <th colspan="3">Vi phạm...</th>
                            <th colspan="2">Hình thức kỷ luật</th>
                            <th colspan="2">Xử lý pháp luật</th>
                        </tr>
                        <!-- Tầng 3 -->
                        <tr>
                            <th rowspan="2">Thường trú</th>
                            <th rowspan="2">Tạm Trú</th>
                            <th rowspan="2">Cá nhân</th>
                            <th rowspan="2">Công vụ</th>
                            <th rowspan="2">Chức vụ</th>
                            <th rowspan="2">Đơn vị</th>
                            <th rowspan="2">Trọng yếu</th>
                            <th rowspan="2">Dễ tham nhũng</th>
                            <th rowspan="2">Dễ lôi kéo</th>

                            <th rowspan="2">Số Quyết định</th>
                            <th rowspan="2">Ngày ban hành</th>
                            <th rowspan="2">Cơ quan ban hành</th>
                            <th colspan="2">Xuất cảnh</th>
                            <th rowspan="2">Quốc Gia</th>
                            <th rowspan="2">Số lần</th>
                            <th rowspan="2">Công tác</th>
                            <th rowspan="2">Học tập</th>
                            <th rowspan="2">Việc riêng</th>
                            <th rowspan="2">Ngân sách NN</th>
                            <th rowspan="2">Tự túc</th>
                            <th colspan="2">Nguồn khác</th>

                            <th rowspan="2">Đi khi chưa phép</th>
                            <th rowspan="2">Vi phạm ở NN</th>
                            <th rowspan="2">Ở lại quá hạn</th>

                            <th rowspan="2">Đảng</th>
                            <th rowspan="2">CQ</th>

                            <th rowspan="2">Nước sở tại</th>
                            <th rowspan="2">PL Việt Nam</th>
                        </tr>
                        <!-- Tầng 4 -->
                        <tr>
                            <th>Ngày Xuất cảnh</th>
                            <th>Ngày nhập cảnh</th>
                            <th>Tài trợ</th>
                            <th>Học bổng</th>
                        </tr>
                        <!-- Tầng 5 (Hàng số) -->
                        <tr style="background:#e9ecef; font-size:11px;">
                            ${Array.from({length: 37}, (_, i) => `<th>(${i+1})</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody id="appx1-tbody">
                        <tr><td colspan="37">Đang tải dữ liệu...</td></tr>
                    </tbody>
                </table>
            </div>
        `;

        await this.loadData();

        document.getElementById('btn-add-appx1').addEventListener('click', () => this.openAddModal());
    },

    async loadData() {
        const tbody = document.getElementById('appx1-tbody');
        try {
            const data = await Appendix1Service.list();
            if (data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="37">Chưa có dữ liệu</td></tr>';
                return;
            }

            tbody.innerHTML = '';
            let stt = 1;
            // Render từng dòng
            data.forEach(item => {
                const tr = document.createElement('tr');
                tr.style.cursor = 'pointer';
                tr.innerHTML = `
                    <td>${stt++}</td>
                    <!-- 2-4: Info CB -->
                    <td style="font-weight:bold; color:#3c8dbc">${item.personnelName || ''}</td>
                    <td>${item.birthYear || ''}</td>
                    <td>${item.cccd || ''}</td>
                    
                    <!-- 5-8: Cư trú & HC -->
                    <td>${item.thuongTru || ''}</td>
                    <td>${item.tamTru || ''}</td>
                    <td>${item.hcCaNhan || ''}</td>
                    <td>${item.hcCongVu || ''}</td>
                    
                    <!-- 9-13: Công tác -->
                    <td>${item.positionName || ''}</td>
                    <td>${item.departmentName || ''}</td>
                    <td>${item.trongYeu || ''}</td>
                    <td>${item.thamNhung || ''}</td>
                    <td>${item.loiKeo || ''}</td>
                    
                    <!-- 14: Thẩm tra -->
                    <td>${item.kqThamTra || ''}</td>

                    <!-- 15-17: Quyết định -->
                    <td>${item.decisionNumber || ''}</td>
                    <td>${item.decisionDate || ''}</td>
                    <td>${item.decisionIssuer || ''}</td>
                    
                    <!-- 18-21: XNC -->
                    <td>${item.departureDate || ''}</td>
                    <td>${item.arrivalDate || ''}</td>
                    <td>${item.countryName || ''}</td>
                    <td>${item.tripCount || ''}</td>
                    
                    <!-- 22-24: Mục đích -->
                    <td>${item.purposeName === 'Công tác' ? 'x' : ''}</td>
                    <td>${item.purposeName === 'Học tập, tập huấn' ? 'x' : ''}</td>
                    <td>${item.purposeName === 'Du lịch' || item.purposeName === 'Thăm thân' ? 'x' : ''}</td>
                    
                    <!-- 25-28: Kinh phí -->
                    <td>${item.fundingName === 'Ngân sách nhà nước' ? 'x' : ''}</td>
                    <td>${item.fundingName === 'Tự túc' ? 'x' : ''}</td>
                    <td>${item.fundingName === 'Tài trợ' ? 'x' : ''}</td>
                    <td>${item.fundingName === 'Học bổng' ? 'x' : ''}</td>
                    
                    <!-- 29-30: Hậu kiểm -->
                    <td>${item.nopHC || ''}</td>
                    <td>${item.baoCao || ''}</td>

                    <!-- 31-33: Vi phạm -->
                    <td>${item.vpChuaPhep || ''}</td>
                    <td>${item.vpNuocNgoai || ''}</td>
                    <td>${item.vpQuaHan || ''}</td>
                    
                    <!-- 34-37: Xử lý -->
                    <td>${item.klDang || ''}</td>
                    <td>${item.klChinhQuyen || ''}</td>
                    <td>${item.xlplNuocSoTai || ''}</td>
                    <td>${item.xlplVietNam || ''}</td>
                `;
                
                tr.addEventListener('click', () => {
                    this.openEditModal(item);
                });
                
                tbody.appendChild(tr);
            });
        } catch(e) {
            tbody.innerHTML = '<tr><td colspan="37" style="color:red">Lỗi tải dữ liệu</td></tr>';
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
        const purposeOptions = md.purposes.map(c => `<option value="${c.id}" ${item && item.purposeId === c.id ? 'selected' : ''}>${c.name}</option>`).join('');
        const fundingOptions = md.fundings.map(c => `<option value="${c.id}" ${item && item.fundingId === c.id ? 'selected' : ''}>${c.name}</option>`).join('');

        // Helper to populate fields if editing
        const val = (field) => item && item[field] ? item[field] : '';
        const chk = (field) => item && item[field] === 'Có' ? 'checked' : '';
        const sel = (field, match) => item && item[field] === match ? 'selected' : '';

        return `
            <style>
                .section-title { font-weight: bold; color: #3c8dbc; border-bottom: 1px solid #ddd; padding-bottom: 5px; margin: 15px 0 10px 0; font-size: 14px; }
                .ro-field { background: #f4f6f9 !important; font-weight: bold; }
                .custom-cb { font-weight: normal; margin-right: 15px; cursor: pointer; }
            </style>
            <div id="form-add-appx1">
                <div class="section-title" style="margin-top:0"><i class="fas fa-user"></i> 1. Thông tin cá nhân, cư trú & Vị trí công tác</div>
                <div class="row">
                    <div class="col-md-3 form-group">
                        <label>(2) Chọn Cán bộ <span style="color:red">*</span></label>
                        <input list="cb-list" class="form-control" id="in-cb-search" value="${selectedCbValue}" ${item ? 'disabled' : ''} placeholder="Mã CB, CCCD, Tên...">
                        <datalist id="cb-list">${cbOptions}</datalist>
                        <input type="hidden" id="in-cb" value="${item ? item.personnelId : ''}">
                    </div>
                    <div class="col-md-3 form-group"><label>(3) Năm sinh</label><input type="text" class="form-control ro-field" id="ro-birth" disabled value="${val('birthYear')}"></div>
                    <div class="col-md-3 form-group"><label>(4) Số CCCD</label><input type="text" class="form-control ro-field" id="ro-cccd" disabled value="${val('cccd')}"></div>
                    <div class="col-md-3 form-group"><label>(5) Thường trú</label><input type="text" class="form-control" id="in-thuongtru" value="${val('thuongTru')}"></div>
                    <div class="col-md-3 form-group"><label>(6) Tạm trú</label><input type="text" class="form-control" id="in-tamtru" value="${val('tamTru')}"></div>
                    <div class="col-md-3 form-group"><label>(7) Số HC Cá nhân</label><input type="text" class="form-control" id="in-hc-cn" value="${val('hcCaNhan')}"></div>
                    <div class="col-md-3 form-group"><label>(8) Số HC Công vụ</label><input type="text" class="form-control" id="in-hc-cv" value="${val('hcCongVu')}"></div>
                    <div class="col-md-3 form-group"><label>(9) Chức vụ</label><input type="text" class="form-control ro-field" id="ro-pos" disabled value="${val('positionName')}"></div>
                    <div class="col-md-4 form-group"><label>(10) Đơn vị</label><input type="text" class="form-control ro-field" id="ro-dept" disabled value="${val('departmentName')}"></div>
                    <div class="col-md-8 form-group">
                        <label>Đặc thù công tác (11, 12, 13)</label><br>
                        <label class="custom-cb"><input type="checkbox" id="in-trongyeu" ${chk('trongYeu')}> Trọng yếu cơ mật</label>
                        <label class="custom-cb"><input type="checkbox" id="in-thamnhung" ${chk('thamNhung')}> Dễ tham nhũng</label>
                        <label class="custom-cb"><input type="checkbox" id="in-loikeo" ${chk('loiKeo')}> Dễ bị lôi kéo</label>
                    </div>
                </div>

                <div class="section-title"><i class="fas fa-plane"></i> 2. Quyết định & Thông tin xuất cảnh</div>
                <div class="row">
                    <div class="col-md-12 form-group"><label>(14) KQ Thẩm tra xác minh TCCT trước khi đi</label><input type="text" class="form-control" id="in-thamtra" value="${val('kqThamTra')}"></div>
                    <div class="col-md-4 form-group"><label>(15) Số Quyết định</label><input type="text" class="form-control" id="in-qd" value="${val('decisionNumber')}"></div>
                    <div class="col-md-4 form-group"><label>(16) Ngày ban hành</label><input type="date" class="form-control" id="in-qd-date" value="${val('decisionDate')}"></div>
                    <div class="col-md-4 form-group"><label>(17) Cơ quan ban hành</label><input type="text" class="form-control" id="in-qd-cq" value="${val('decisionIssuer')}"></div>
                    <div class="col-md-3 form-group"><label>(18) Ngày xuất cảnh</label><input type="date" class="form-control" id="in-xuat" value="${val('departureDate')}"></div>
                    <div class="col-md-3 form-group"><label>(19) Ngày nhập cảnh</label><input type="date" class="form-control" id="in-nhap" value="${val('arrivalDate')}"></div>
                    <div class="col-md-3 form-group"><label>(20) Quốc gia đến</label><select class="form-control" id="in-qg"><option value="">- Chọn -</option>${countryOptions}</select></div>
                    <div class="col-md-3 form-group"><label>(21) Số lần đi</label><input type="number" class="form-control" id="in-solan" value="${val('tripCount')}"></div>
                </div>

                <div class="section-title"><i class="fas fa-money-check-alt"></i> 3. Mục đích & Nguồn kinh phí</div>
                <div class="row">
                    <div class="col-md-6 form-group">
                        <label>Mục đích chuyến đi (22, 23, 24)</label><br>
                        <select class="form-control" id="in-mucdich"><option value="">- Chọn Mục đích -</option>${purposeOptions}</select>
                    </div>
                    <div class="col-md-6 form-group">
                        <label>Nguồn kinh phí (25, 26, 27, 28)</label><br>
                        <select class="form-control" id="in-kinhphi"><option value="">- Chọn Kinh phí -</option>${fundingOptions}</select>
                    </div>
                </div>

                <div class="section-title"><i class="fas fa-exclamation-triangle"></i> 4. Vấn đề đáng lưu ý (Sau chuyến đi)</div>
                <div class="row">
                    <div class="col-md-6 form-group"><label>(29) Nộp hộ chiếu CV?</label><select class="form-control" id="in-nophc"><option value="">- Chọn -</option><option ${sel('nopHC','Đã nộp')}>Đã nộp</option><option ${sel('nopHC','Chưa nộp')}>Chưa nộp</option></select></div>
                    <div class="col-md-6 form-group"><label>(30) Báo cáo KQ?</label><select class="form-control" id="in-baocao"><option value="">- Chọn -</option><option ${sel('baoCao','Đã báo cáo')}>Đã báo cáo</option><option ${sel('baoCao','Chưa báo cáo')}>Chưa báo cáo</option></select></div>
                    <div class="col-md-4 form-group"><label>(31) Đi khi chưa phép</label><input type="text" class="form-control" id="in-vipham1" placeholder="Ghi chú..." value="${val('vpChuaPhep')}"></div>
                    <div class="col-md-4 form-group"><label>(32) Vi phạm ở nước ngoài</label><input type="text" class="form-control" id="in-vipham2" placeholder="Ghi chú..." value="${val('vpNuocNgoai')}"></div>
                    <div class="col-md-4 form-group"><label>(33) Ở lại quá hạn</label><input type="text" class="form-control" id="in-vipham3" placeholder="Ghi chú..." value="${val('vpQuaHan')}"></div>
                    <div class="col-md-6 form-group"><label>(34) Hình thức kỷ luật Đảng</label><input type="text" class="form-control" id="in-kldang" value="${val('klDang')}"></div>
                    <div class="col-md-6 form-group"><label>(35) Hình thức kỷ luật CQ</label><input type="text" class="form-control" id="in-klcq" value="${val('klChinhQuyen')}"></div>
                    <div class="col-md-6 form-group"><label>(36) Xử lý PL Nước sở tại</label><input type="text" class="form-control" id="in-xl1" value="${val('xlplNuocSoTai')}"></div>
                    <div class="col-md-6 form-group"><label>(37) Xử lý PL Việt Nam</label><input type="text" class="form-control" id="in-xl2" value="${val('xlplVietNam')}"></div>
                </div>
            </div>
        `;
    },

    getPayload() {
        return {
            personnelId: document.getElementById('in-cb').value,
            thuongTru: document.getElementById('in-thuongtru').value,
            tamTru: document.getElementById('in-tamtru').value,
            hcCaNhan: document.getElementById('in-hc-cn').value,
            hcCongVu: document.getElementById('in-hc-cv').value,
            trongYeu: document.getElementById('in-trongyeu').checked ? 'Có' : '',
            thamNhung: document.getElementById('in-thamnhung').checked ? 'Có' : '',
            loiKeo: document.getElementById('in-loikeo').checked ? 'Có' : '',
            
            kqThamTra: document.getElementById('in-thamtra').value,
            decisionNumber: document.getElementById('in-qd').value,
            decisionDate: document.getElementById('in-qd-date').value,
            decisionIssuer: document.getElementById('in-qd-cq').value,
            departureDate: document.getElementById('in-xuat').value,
            arrivalDate: document.getElementById('in-nhap').value,
            countryId: document.getElementById('in-qg').value,
            tripCount: document.getElementById('in-solan').value,
            
            purposeId: document.getElementById('in-mucdich').value,
            fundingId: document.getElementById('in-kinhphi').value,
            
            nopHC: document.getElementById('in-nophc').value,
            baoCao: document.getElementById('in-baocao').value,
            vpChuaPhep: document.getElementById('in-vipham1').value,
            vpNuocNgoai: document.getElementById('in-vipham2').value,
            vpQuaHan: document.getElementById('in-vipham3').value,
            
            klDang: document.getElementById('in-kldang').value,
            klChinhQuyen: document.getElementById('in-klcq').value,
            xlplNuocSoTai: document.getElementById('in-xl1').value,
            xlplVietNam: document.getElementById('in-xl2').value
        };
    },

    async openAddModal() {
        const personnels = await PersonnelService.list();
        const md = AppService.getMasterData();

        const html = this.getFormHtml(personnels, md);

        Modal.show("Thêm Mới Chuyến Đi (Phụ Lục 1)", html, async (closeModal) => {
            const payload = this.getPayload();
            if(!payload.personnelId) {
                Toast.error("Vui lòng chọn cán bộ ở cột (2)!");
                return;
            }
            
            payload.id = `a1-new-${Date.now()}`;

            try {
                await Appendix1Service.create(payload);
                Toast.success("Lưu chuyến đi thành công!");
                closeModal();
                this.loadData();
            } catch(e) {
                Toast.error("Lỗi khi lưu.");
            }
        });

        // Setup auto-fill
        this.setupAutoFill(personnels);
    },

    async openEditModal(item) {
        const personnels = await PersonnelService.list();
        const md = AppService.getMasterData();

        const html = this.getFormHtml(personnels, md, item);

        Modal.show(`Cập nhật Phụ Lục 1 (ID: ${item.id})`, html, async (closeModal) => {
            const payload = this.getPayload();
            // preserve existing item properties not covered by payload (like ID)
            const updated = { ...item, ...payload };

            try {
                await Appendix1Service.update(item.id, updated);
                Toast.success("Đã cập nhật chuyến đi!");
                closeModal();
                this.loadData();
            } catch(e) {
                Toast.error("Lỗi khi cập nhật.");
            }
        });

        // Setup auto-fill
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
                    document.getElementById('ro-cccd').value = p.cccd || '';
                    document.getElementById('ro-dept').value = p.departmentName || '';
                    document.getElementById('ro-pos').value = p.positionName || '';
                    Toast.success(`Đã tự động điền thông tin của ${p.name}`);
                }
            } else {
                document.getElementById('ro-cccd').value = '';
                document.getElementById('ro-birth').value = '';
                document.getElementById('ro-dept').value = '';
                document.getElementById('ro-pos').value = '';
            }
        });
    }
};
