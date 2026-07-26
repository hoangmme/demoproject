// js/pages/personnel.js
import { PersonnelService } from '../services/personnelService.js';
import { Table } from '../components/table.js';
import { Toast } from '../components/toast.js';
import { AppService } from '../services/appService.js';
import { Modal } from '../components/modal.js';

export const PersonnelPage = {
    async render(container) {
        this.container = container;
        await this.renderList();
    },

    async renderList() {
        this.container.innerHTML = `
            <div class="box box-primary">
                <div class="box-header">
                    <h3 class="box-title">Danh sách Cán bộ</h3>
                    <div class="pull-right">
                        <button class="btn btn-success" id="btn-add-personnel"><i class="fas fa-plus"></i> Thêm mới</button>
                    </div>
                </div>
                <div class="box-body" id="personnel-list-content">
                    <!-- Table will be rendered here -->
                </div>
            </div>
        `;

        const listContent = document.getElementById('personnel-list-content');
        
        try {
            const data = await PersonnelService.list();
            
            const columns = [
                { key: 'code', label: 'Mã CB' },
                { key: 'name', label: 'Họ tên', render: (val, row) => `<a href="#" class="view-profile" data-id="${row.id}"><b>${val}</b></a>` },
                { key: 'cccd', label: 'CCCD' },
                { key: 'birthYear', label: 'Năm sinh' },
                { key: 'departmentName', label: 'Đơn vị' },
                { key: 'positionName', label: 'Chức vụ' },
                { key: 'actions', label: 'Thao tác', render: (val, row) => `
                    <button class="btn btn-primary btn-edit" data-id="${row.id}"><i class="fas fa-edit"></i></button>
                `}
            ];

            listContent.innerHTML = Table.render(columns, data);

            // Bind events
            listContent.querySelectorAll('.view-profile').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.renderProfile(btn.getAttribute('data-id'));
                });
            });

            listContent.querySelectorAll('.btn-edit').forEach(btn => {
                btn.addEventListener('click', () => {
                    this.openEditModal(btn.getAttribute('data-id'));
                });
            });

            document.getElementById('btn-add-personnel').addEventListener('click', () => {
                this.openAddModal();
            });

        } catch (e) {
            listContent.innerHTML = '<p style="color:red">Lỗi tải dữ liệu.</p>';
        }
    },

    async renderProfile(id) {
        try {
            const personnel = await PersonnelService.get(id);
            
            this.container.innerHTML = `
                <style>
                    .profile-card { background: white; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); overflow: hidden; margin-bottom: 20px; border: 1px solid #f0f0f0; }
                    .profile-header { background: linear-gradient(135deg, #3c8dbc 0%, #285e8e 100%); padding: 25px 20px; color: white; text-align: center; position: relative; }
                    .profile-avatar { width: 100px; height: 100px; border-radius: 50%; border: 4px solid rgba(255,255,255,0.3); background: white; margin: 0 auto 10px auto; display: flex; align-items: center; justify-content: center; font-size: 40px; color: #3c8dbc; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
                    .profile-name { font-size: 22px; font-weight: bold; margin: 0; }
                    .profile-code { font-size: 14px; opacity: 0.8; margin-top: 5px; }
                    .profile-body { padding: 20px; }
                    .profile-info-row { display: flex; border-bottom: 1px dashed #eee; padding: 12px 0; }
                    .profile-info-row:last-child { border-bottom: none; }
                    .profile-info-label { width: 100px; color: #777; font-size: 13px; font-weight: 500; }
                    .profile-info-value { flex: 1; color: #333; font-weight: bold; }
                    
                    .p-tabs { display: flex; border-bottom: 2px solid #eee; margin-bottom: 20px; }
                    .p-tab { padding: 12px 20px; cursor: pointer; font-weight: bold; color: #666; transition: all 0.3s; border-bottom: 2px solid transparent; margin-bottom: -2px; }
                    .p-tab:hover { color: #3c8dbc; }
                    .p-tab.active { color: #3c8dbc; border-bottom-color: #3c8dbc; }
                    
                    .mini-table { width: 100%; border-collapse: collapse; font-size: 13px; }
                    .mini-table th { background: #f8f9fa; padding: 10px; border: 1px solid #ddd; color: #555; }
                    .mini-table td { padding: 10px; border: 1px solid #ddd; }
                    .mini-table tr { cursor: pointer; transition: background 0.2s; }
                    .mini-table tr:hover { background: #f0f7fd; }
                </style>

                <div style="margin-bottom: 15px;">
                    <button class="btn btn-default" id="btn-back"><i class="fas fa-arrow-left"></i> Quay lại danh sách</button>
                </div>
                
                <div class="row">
                    <!-- Thông tin chung -->
                    <div class="col-md-4">
                        <div class="profile-card">
                            <div class="profile-header">
                                <button class="btn btn-sm btn-edit-profile" data-id="${personnel.id}" style="position: absolute; top: 15px; right: 15px; background: rgba(255,255,255,0.2); color: white; border: none;"><i class="fas fa-edit"></i> Sửa</button>
                                <div class="profile-avatar"><i class="fas fa-user-tie"></i></div>
                                <h3 class="profile-name">${personnel.name}</h3>
                                <div class="profile-code">Mã CB: ${personnel.code}</div>
                            </div>
                            <div class="profile-body">
                                <div class="profile-info-row">
                                    <div class="profile-info-label">CCCD</div>
                                    <div class="profile-info-value">${personnel.cccd || '---'}</div>
                                </div>
                                <div class="profile-info-row">
                                    <div class="profile-info-label">Năm sinh</div>
                                    <div class="profile-info-value">${personnel.birthYear || '---'}</div>
                                </div>
                                <div class="profile-info-row">
                                    <div class="profile-info-label">Đơn vị</div>
                                    <div class="profile-info-value"><span style="background:#e8f4f8; color:#3c8dbc; padding:3px 8px; border-radius:12px; font-size:12px;">${personnel.departmentName || '---'}</span></div>
                                </div>
                                <div class="profile-info-row">
                                    <div class="profile-info-label">Chức vụ</div>
                                    <div class="profile-info-value">${personnel.positionName || '---'}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Tabs Phụ lục -->
                    <div class="col-md-8">
                        <div class="profile-card" style="padding: 20px;">
                            <div class="p-tabs" id="profile-tabs">
                                <div class="p-tab active" data-target="tab-pl1">Phụ lục 1 (Xuất cảnh)</div>
                                <div class="p-tab" data-target="tab-pl2">Phụ lục 2 (Thân nhân)</div>
                                <div class="p-tab" data-target="tab-pl3">Phụ lục 3 (Lịch sử)</div>
                            </div>
                            
                            <div class="tab-content" style="min-height: 250px;">
                                <div class="tab-pane active" id="tab-pl1">Đang tải...</div>
                                <div class="tab-pane" id="tab-pl2">Đang tải...</div>
                                <div class="tab-pane" id="tab-pl3">Đang tải...</div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            document.getElementById('btn-back').addEventListener('click', () => this.renderList());
            document.querySelector('.btn-edit-profile').addEventListener('click', () => this.openEditModal(personnel.id));

            // Tab logic
            const tabLinks = document.querySelectorAll('.p-tab');
            tabLinks.forEach(link => {
                link.addEventListener('click', (e) => {
                    tabLinks.forEach(l => l.classList.remove('active'));
                    document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
                    
                    link.classList.add('active');
                    const targetId = link.getAttribute('data-target');
                    document.getElementById(targetId).classList.add('active');
                });
            });

            // Load all 3 Appendices
            this.loadAppx1ForProfile(personnel.id);
            this.loadAppx2ForProfile(personnel.id);
            this.loadAppx3ForProfile(personnel.id);

        } catch (e) {
            this.container.innerHTML = '<p style="color:red">Lỗi tải hồ sơ cán bộ.</p>';
        }
    },

    async loadAppx1ForProfile(personnelId) {
        const { Appendix1Service } = await import('../services/appendix1Service.js');
        const { Appendix1Page } = await import('./appendix1.js');
        const data = await Appendix1Service.list(`?personnelId=${personnelId}`);
        
        if (data.length === 0) {
            document.getElementById('tab-pl1').innerHTML = '<p style="color:#999; text-align:center; padding: 20px;">Chưa có dữ liệu Phụ lục 1</p>';
            return;
        }

        let html = '<table class="mini-table"><thead><tr><th>Số QĐ</th><th>Ngày đi</th><th>Quốc gia</th><th>Mục đích</th><th>Nguồn kinh phí</th></tr></thead><tbody>';
        data.forEach(item => {
            html += `<tr data-id="${item.id}">
                <td><b>${item.decisionNumber || ''}</b></td>
                <td>${item.departureDate || ''}</td>
                <td>${item.countryName || ''}</td>
                <td>${item.purposeName || ''}</td>
                <td>${item.fundingName || ''}</td>
            </tr>`;
        });
        html += '</tbody></table><p style="font-size:11px; color:#999; margin-top:5px; font-style:italic;">* Click vào hàng để sửa</p>';
        
        const tab = document.getElementById('tab-pl1');
        tab.innerHTML = html;
        
        tab.querySelectorAll('tr[data-id]').forEach(tr => {
            tr.addEventListener('click', () => {
                const item = data.find(x => x.id === tr.getAttribute('data-id'));
                Appendix1Page.openEditModal(item);
                // Listen to modal close to refresh? Optional.
            });
        });
    },

    async loadAppx2ForProfile(personnelId) {
        const { Appendix2Service } = await import('../services/appendix2Service.js');
        const { Appendix2Page } = await import('./appendix2.js');
        const data = await Appendix2Service.list(`?personnelId=${personnelId}`);
        
        if (data.length === 0) {
            document.getElementById('tab-pl2').innerHTML = '<p style="color:#999; text-align:center; padding: 20px;">Chưa có dữ liệu Phụ lục 2</p>';
            return;
        }

        let html = '<table class="mini-table"><thead><tr><th>Quan hệ</th><th>Họ tên Thân nhân</th><th>Năm sinh</th><th>Quốc gia cư trú</th><th>Nghề nghiệp</th></tr></thead><tbody>';
        data.forEach(item => {
            html += `<tr data-id="${item.id}">
                <td><span style="background:#f39c12; color:white; padding:2px 5px; border-radius:3px; font-size:11px;">${item.relationshipName || ''}</span></td>
                <td><b>${item.relativeName || ''}</b></td>
                <td>${item.birthYear || ''}</td>
                <td>${item.countryName || ''}</td>
                <td>${item.occupation || ''}</td>
            </tr>`;
        });
        html += '</tbody></table><p style="font-size:11px; color:#999; margin-top:5px; font-style:italic;">* Click vào hàng để sửa</p>';
        
        const tab = document.getElementById('tab-pl2');
        tab.innerHTML = html;
        
        tab.querySelectorAll('tr[data-id]').forEach(tr => {
            tr.addEventListener('click', () => {
                const item = data.find(x => x.id === tr.getAttribute('data-id'));
                Appendix2Page.openEditModal(item);
            });
        });
    },

    async loadAppx3ForProfile(personnelId) {
        const { Appendix3Service } = await import('../services/appendix3Service.js');
        const { Appendix3Page } = await import('./appendix3.js');
        const data = await Appendix3Service.list(`?personnelId=${personnelId}`);
        
        if (data.length === 0) {
            document.getElementById('tab-pl3').innerHTML = '<p style="color:#999; text-align:center; padding: 20px;">Chưa có dữ liệu Phụ lục 3</p>';
            return;
        }

        let html = '<table class="mini-table"><thead><tr><th>Loại</th><th>Địa điểm / Quốc gia</th><th>Thời gian / Ngày xuất cảnh</th><th>Vấn đề lưu ý</th></tr></thead><tbody>';
        data.forEach(item => {
            let type = item.trainingType ? 'Học tập' : (item.workRole ? 'Công tác' : 'Việc riêng');
            let location = item.trainingPlace || item.countryName || '';
            let time = item.trainingTime || item.departureDate || '';
            let note = [];
            if(item.marriedToForeigner) note.push('Kết hôn NN');
            if(item.receivedGiftOver50M) note.push('Nhận quà >50tr');
            if(item.rentHouseToForeigner) note.push('Cho thuê nhà');
            if(item.workInForeignCompany) note.push('Làm cho cty NN');
            
            html += `<tr data-id="${item.id}">
                <td><span style="background:#605ca8; color:white; padding:2px 5px; border-radius:3px; font-size:11px;">${type}</span></td>
                <td><b>${location}</b></td>
                <td>${time}</td>
                <td style="color:#e74c3c">${note.join(', ')}</td>
            </tr>`;
        });
        html += '</tbody></table><p style="font-size:11px; color:#999; margin-top:5px; font-style:italic;">* Click vào hàng để sửa</p>';
        
        const tab = document.getElementById('tab-pl3');
        tab.innerHTML = html;
        
        tab.querySelectorAll('tr[data-id]').forEach(tr => {
            tr.addEventListener('click', () => {
                const item = data.find(x => x.id === tr.getAttribute('data-id'));
                Appendix3Page.openEditModal(item);
            });
        });
    },

    async openAddModal() {
        const md = AppService.getMasterData();
        
        const deptOptions = md.departments.map(d => `<option value="${d.id}">${d.name}</option>`).join('');
        const posOptions = md.positions.map(pos => `<option value="${pos.id}">${pos.name}</option>`).join('');

        const html = `
            <div id="add-form">
                <div class="row">
                    <div class="col-md-12 form-group">
                        <label>Họ tên <span style="color:red">*</span></label>
                        <input type="text" class="form-control" id="add-name" placeholder="Nhập họ tên">
                    </div>
                    <div class="col-md-6 form-group">
                        <label>Số CCCD <span style="color:red">*</span></label>
                        <input type="text" class="form-control" id="add-cccd" placeholder="Nhập số CCCD">
                    </div>
                    <div class="col-md-6 form-group">
                        <label>Năm sinh <span style="color:red">*</span></label>
                        <input type="number" class="form-control" id="add-birth" placeholder="Nhập năm sinh">
                    </div>
                    <div class="col-md-6 form-group">
                        <label>Đơn vị</label>
                        <select class="form-control" id="add-dept">${deptOptions}</select>
                    </div>
                    <div class="col-md-6 form-group">
                        <label>Chức vụ</label>
                        <select class="form-control" id="add-pos">${posOptions}</select>
                    </div>
                </div>
            </div>
        `;

        Modal.show(`Thêm Cán bộ mới`, html, async (closeModal) => {
            const name = document.getElementById('add-name').value;
            const cccd = document.getElementById('add-cccd').value;
            const birthYear = document.getElementById('add-birth').value;
            const departmentId = document.getElementById('add-dept').value;
            const positionId = document.getElementById('add-pos').value;
            
            if(!name || !cccd || !birthYear) {
                Toast.error("Vui lòng nhập đầy đủ Họ tên, CCCD và Năm sinh!");
                return;
            }

            try {
                // Generate simple code and ID
                const id = `cb-${Date.now()}`;
                const code = `CB${Math.floor(Math.random() * 100000).toString().padStart(5, '0')}`;
                
                await PersonnelService.create({
                    id,
                    code,
                    name,
                    cccd,
                    birthYear: parseInt(birthYear),
                    departmentId,
                    positionId,
                    avatar: "https://via.placeholder.com/150"
                });
                
                Toast.success("Đã thêm cán bộ thành công!");
                closeModal();
                this.loadList(); // Reload list
            } catch(e) {
                Toast.error("Có lỗi xảy ra khi thêm mới.");
            }
        });
    },

    async openEditModal(id) {
        const p = await PersonnelService.get(id);
        const md = AppService.getMasterData();
        
        const deptOptions = md.departments.map(d => `<option value="${d.id}" ${d.id === p.departmentId ? 'selected' : ''}>${d.name}</option>`).join('');
        const posOptions = md.positions.map(pos => `<option value="${pos.id}" ${pos.id === p.positionId ? 'selected' : ''}>${pos.name}</option>`).join('');

        const html = `
            <div id="edit-form">
                <div class="form-group">
                    <label>Họ tên</label>
                    <input type="text" class="form-control" id="edit-name" value="${p.name}">
                </div>
                <div class="form-group">
                    <label>Đơn vị</label>
                    <select class="form-control" id="edit-dept">${deptOptions}</select>
                </div>
                <div class="form-group">
                    <label>Chức vụ</label>
                    <select class="form-control" id="edit-pos">${posOptions}</select>
                </div>
            </div>
            <p style="color:#666; font-size:12px; margin-top:10px;"><i class="fas fa-info-circle"></i> Sửa thông tin ở đây sẽ tự động đồng bộ sang tất cả Phụ lục.</p>
        `;

        Modal.show(`Sửa Cán bộ: ${p.code}`, html, async (closeModal) => {
            const newName = document.getElementById('edit-name').value;
            const newDept = document.getElementById('edit-dept').value;
            const newPos = document.getElementById('edit-pos').value;
            
            try {
                await PersonnelService.update(id, {
                    ...p, // keep other fields
                    name: newName,
                    departmentId: newDept,
                    positionId: newPos
                });
                Toast.success("Đã cập nhật thông tin. Đồng bộ thành công trên các phụ lục!");
                closeModal();
                
                // Refresh view if we are on profile or list
                if(document.getElementById('profile-general')) {
                    this.renderProfile(id); // reload profile
                } else {
                    this.renderList(); // reload list
                }
            } catch(e) {
                // error handled by api
            }
        });
    }
};
