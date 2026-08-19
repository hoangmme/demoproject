
        document.addEventListener('alpine:init', () => {
            Alpine.data('appData', () => ({
                
                personnel: [],
                departments: [{id: 'D1', name: 'Phòng Kế hoạch'}, {id: 'D2', name: 'Phòng Tổ chức'}],

                departments: [],
                searchQuery: '',
                loading: true,
                
                // View state
                currentView: 'canbo',
                currentUser: null,
                loginForm: { email: '', password: '' },
                
                isFlsModalOpen: false,
                flsUser: null,
                flsMatrix: {
                    'name': {}, 'otherName': {}, 'birthYear': {}, 'ethnicity': {}, 'religion': {}, 'hometown': {}, 'unused_8': {}, 'position': {}, 'hktt': {}, 'currentAddress': {}, 'cccd': {}, 'passportPersonal': {}, 'passportOfficial': {}, 'tcctResult': {}, 'departmentId': {}, 'email': {}, 'trips.country': {}, 'trips.purpose': {}, 'trips.duration': {}, 'trips.funding': {}, 'unused_22': {}, 'unused_23': {}, 'unused_24': {}, 'unused_25': {}, 'unused_26': {}, 'unused_27': {}, 'unused_28': {}, 'unused_29': {}, 'unused_30': {}, 'unused_31': {}, 'unused_32': {}, 'unused_33': {}, 'unused_34': {}, 'unused_35': {}, 'unused_36': {}, 'unused_37': {}, 'unused_38': {}, 'unused_39': {}, 'flags.politicalIssue': {}, 'flags.investigating': {}, 'flags.otherIssue': {}, 'flags.partyDiscipline': {}, 'flags.govDiscipline': {}, 'flags.noPermission': {}, 'flags.lawViolation': {}, 'flags.overstay': {}, 'flags.managed': {}, 'flags.gift': {}, 'flags.rent': {}, 'flags.fdi': {}, 'flags.marriedToForeigner': {}, 'relatives.relation': {}, 'relatives.name': {}, 'relatives.birthYear': {}, 'relatives.currentAddress': {}, 'relatives.job': {}, 'relatives.country': {}, 'relatives.time': {}, 'relatives.unit': {}, 'relatives.funding': {}, 'relatives.currentWork': {}, 'relatives.married': {}, 'relatives.fdi': {}, 'unused_65': {}, 'unused_66': {}, 'unused_67': {}, 'unused_68': {}, 'unused_69': {}, 'unused_70': {}, 'unused_71': {}, 'unused_72': {}, 'unused_73': {}, 'unused_74': {}, 'unused_75': {}, 'unused_76': {}, 'unused_77': {}, 'unused_78': {}
                },
                allColumns: [
          {
                    id: "name",
                    label: "[Cột 2] Họ và Tên",
                    group: "Cán bộ (Cột 2-52)"
          },
          {
                    id: "otherName",
                    label: "[Cột 3] Tên khác",
                    group: "Cán bộ (Cột 2-52)"
          },
          {
                    id: "birthYear",
                    label: "[Cột 4] Năm sinh",
                    group: "Cán bộ (Cột 2-52)"
          },
          {
                    id: "ethnicity",
                    label: "[Cột 5] Dân tộc",
                    group: "Cán bộ (Cột 2-52)"
          },
          {
                    id: "religion",
                    label: "[Cột 6] Tôn giáo",
                    group: "Cán bộ (Cột 2-52)"
          },
          {
                    id: "hometown",
                    label: "[Cột 7] Quê quán",
                    group: "Cán bộ (Cột 2-52)"
          },
          {
                    id: "unused_8",
                    label: "[Cột 8] (Chưa dùng)",
                    group: "Cán bộ (Cột 2-52)"
          },
          {
                    id: "position",
                    label: "[Cột 9] Chức vụ",
                    group: "Cán bộ (Cột 2-52)"
          },
          {
                    id: "hktt",
                    label: "[Cột 10] Nơi ĐKHK thường trú",
                    group: "Cán bộ (Cột 2-52)"
          },
          {
                    id: "currentAddress",
                    label: "[Cột 11] Nơi ở hiện nay",
                    group: "Cán bộ (Cột 2-52)"
          },
          {
                    id: "cccd",
                    label: "[Cột 12] Số CCCD",
                    group: "Cán bộ (Cột 2-52)"
          },
          {
                    id: "passportPersonal",
                    label: "[Cột 13] Hộ chiếu cá nhân",
                    group: "Cán bộ (Cột 2-52)"
          },
          {
                    id: "passportOfficial",
                    label: "[Cột 14] Hộ chiếu công vụ",
                    group: "Cán bộ (Cột 2-52)"
          },
          {
                    id: "tcctResult",
                    label: "[Cột 15] Kết quả thẩm tra TCCT",
                    group: "Cán bộ (Cột 2-52)"
          },
          {
                    id: "departmentId",
                    label: "[Cột 16] Phòng ban",
                    group: "Cán bộ (Cột 2-52)"
          },
          {
                    id: "email",
                    label: "[Cột 17] Email",
                    group: "Cán bộ (Cột 2-52)"
          },
          {
                    id: "trips.country",
                    label: "[Cột 18] Chuyến đi: Nước đến",
                    group: "Cán bộ (Cột 2-52)"
          },
          {
                    id: "trips.purpose",
                    label: "[Cột 19] Chuyến đi: Mục đích",
                    group: "Cán bộ (Cột 2-52)"
          },
          {
                    id: "trips.duration",
                    label: "[Cột 20] Chuyến đi: Thời gian",
                    group: "Cán bộ (Cột 2-52)"
          },
          {
                    id: "trips.funding",
                    label: "[Cột 21] Chuyến đi: Nguồn kinh phí",
                    group: "Cán bộ (Cột 2-52)"
          },
          {
                    id: "unused_22",
                    label: "[Cột 22] (Chưa dùng)",
                    group: "Cán bộ (Cột 2-52)"
          },
          {
                    id: "unused_23",
                    label: "[Cột 23] (Chưa dùng)",
                    group: "Cán bộ (Cột 2-52)"
          },
          {
                    id: "unused_24",
                    label: "[Cột 24] (Chưa dùng)",
                    group: "Cán bộ (Cột 2-52)"
          },
          {
                    id: "unused_25",
                    label: "[Cột 25] (Chưa dùng)",
                    group: "Cán bộ (Cột 2-52)"
          },
          {
                    id: "unused_26",
                    label: "[Cột 26] (Chưa dùng)",
                    group: "Cán bộ (Cột 2-52)"
          },
          {
                    id: "unused_27",
                    label: "[Cột 27] (Chưa dùng)",
                    group: "Cán bộ (Cột 2-52)"
          },
          {
                    id: "unused_28",
                    label: "[Cột 28] (Chưa dùng)",
                    group: "Cán bộ (Cột 2-52)"
          },
          {
                    id: "unused_29",
                    label: "[Cột 29] (Chưa dùng)",
                    group: "Cán bộ (Cột 2-52)"
          },
          {
                    id: "unused_30",
                    label: "[Cột 30] (Chưa dùng)",
                    group: "Cán bộ (Cột 2-52)"
          },
          {
                    id: "unused_31",
                    label: "[Cột 31] (Chưa dùng)",
                    group: "Cán bộ (Cột 2-52)"
          },
          {
                    id: "unused_32",
                    label: "[Cột 32] (Chưa dùng)",
                    group: "Cán bộ (Cột 2-52)"
          },
          {
                    id: "unused_33",
                    label: "[Cột 33] (Chưa dùng)",
                    group: "Cán bộ (Cột 2-52)"
          },
          {
                    id: "unused_34",
                    label: "[Cột 34] (Chưa dùng)",
                    group: "Cán bộ (Cột 2-52)"
          },
          {
                    id: "unused_35",
                    label: "[Cột 35] (Chưa dùng)",
                    group: "Cán bộ (Cột 2-52)"
          },
          {
                    id: "unused_36",
                    label: "[Cột 36] (Chưa dùng)",
                    group: "Cán bộ (Cột 2-52)"
          },
          {
                    id: "unused_37",
                    label: "[Cột 37] (Chưa dùng)",
                    group: "Cán bộ (Cột 2-52)"
          },
          {
                    id: "unused_38",
                    label: "[Cột 38] (Chưa dùng)",
                    group: "Cán bộ (Cột 2-52)"
          },
          {
                    id: "unused_39",
                    label: "[Cột 39] (Chưa dùng)",
                    group: "Cán bộ (Cột 2-52)"
          },
          {
                    id: "flags.politicalIssue",
                    label: "[Cột 40] Lưu ý: Vấn đề TCCT (Tự diễn biến)",
                    group: "Cán bộ (Cột 2-52)"
          },
          {
                    id: "flags.investigating",
                    label: "[Cột 41] Lưu ý: Đang bị điều tra",
                    group: "Cán bộ (Cột 2-52)"
          },
          {
                    id: "flags.otherIssue",
                    label: "[Cột 42] Lưu ý: Vấn đề khác về lý lịch",
                    group: "Cán bộ (Cột 2-52)"
          },
          {
                    id: "flags.partyDiscipline",
                    label: "[Cột 43] Lưu ý: Kỷ luật Đảng",
                    group: "Cán bộ (Cột 2-52)"
          },
          {
                    id: "flags.govDiscipline",
                    label: "[Cột 44] Lưu ý: Kỷ luật Chính quyền",
                    group: "Cán bộ (Cột 2-52)"
          },
          {
                    id: "flags.noPermission",
                    label: "[Cột 45] Lưu ý: Đi NN không phép",
                    group: "Cán bộ (Cột 2-52)"
          },
          {
                    id: "flags.lawViolation",
                    label: "[Cột 46] Lưu ý: Vi phạm PL ở NN",
                    group: "Cán bộ (Cột 2-52)"
          },
          {
                    id: "flags.overstay",
                    label: "[Cột 47] Lưu ý: Ở lại NN quá hạn",
                    group: "Cán bộ (Cột 2-52)"
          },
          {
                    id: "flags.managed",
                    label: "[Cột 48] Lưu ý: Thuộc diện quản lý",
                    group: "Cán bộ (Cột 2-52)"
          },
          {
                    id: "flags.gift",
                    label: "[Cột 49] Lưu ý: Được tặng quà >50tr",
                    group: "Cán bộ (Cột 2-52)"
          },
          {
                    id: "flags.rent",
                    label: "[Cột 50] Lưu ý: Cho thuê nhà/đất",
                    group: "Cán bộ (Cột 2-52)"
          },
          {
                    id: "flags.fdi",
                    label: "[Cột 51] Lưu ý: Làm tại cty FDI",
                    group: "Cán bộ (Cột 2-52)"
          },
          {
                    id: "flags.marriedToForeigner",
                    label: "[Cột 52] Lưu ý: Kết hôn với người NN",
                    group: "Cán bộ (Cột 2-52)"
          },
          {
                    id: "relatives.relation",
                    label: "[Cột 53] Quan hệ",
                    group: "Thân nhân (Cột 53-78)"
          },
          {
                    id: "relatives.name",
                    label: "[Cột 54] Họ và tên",
                    group: "Thân nhân (Cột 53-78)"
          },
          {
                    id: "relatives.birthYear",
                    label: "[Cột 55] Năm sinh",
                    group: "Thân nhân (Cột 53-78)"
          },
          {
                    id: "relatives.currentAddress",
                    label: "[Cột 56] Nơi cư trú",
                    group: "Thân nhân (Cột 53-78)"
          },
          {
                    id: "relatives.job",
                    label: "[Cột 57] Nghề nghiệp",
                    group: "Thân nhân (Cột 53-78)"
          },
          {
                    id: "relatives.country",
                    label: "[Cột 58] Quốc gia (Yếu tố NN)",
                    group: "Thân nhân (Cột 53-78)"
          },
          {
                    id: "relatives.time",
                    label: "[Cột 59] Thời gian ở NN",
                    group: "Thân nhân (Cột 53-78)"
          },
          {
                    id: "relatives.unit",
                    label: "[Cột 60] Cơ quan/Tổ chức NN",
                    group: "Thân nhân (Cột 53-78)"
          },
          {
                    id: "relatives.funding",
                    label: "[Cột 61] Nguồn kinh phí",
                    group: "Thân nhân (Cột 53-78)"
          },
          {
                    id: "relatives.currentWork",
                    label: "[Cột 62] Công việc hiện tại (NN)",
                    group: "Thân nhân (Cột 53-78)"
          },
          {
                    id: "relatives.married",
                    label: "[Cột 63] Kết hôn với người NN",
                    group: "Thân nhân (Cột 53-78)"
          },
          {
                    id: "relatives.fdi",
                    label: "[Cột 64] Làm việc cho FDI",
                    group: "Thân nhân (Cột 53-78)"
          },
          {
                    id: "unused_65",
                    label: "[Cột 65] (Chưa dùng)",
                    group: "Thân nhân (Cột 53-78)"
          },
          {
                    id: "unused_66",
                    label: "[Cột 66] (Chưa dùng)",
                    group: "Thân nhân (Cột 53-78)"
          },
          {
                    id: "unused_67",
                    label: "[Cột 67] (Chưa dùng)",
                    group: "Thân nhân (Cột 53-78)"
          },
          {
                    id: "unused_68",
                    label: "[Cột 68] (Chưa dùng)",
                    group: "Thân nhân (Cột 53-78)"
          },
          {
                    id: "unused_69",
                    label: "[Cột 69] (Chưa dùng)",
                    group: "Thân nhân (Cột 53-78)"
          },
          {
                    id: "unused_70",
                    label: "[Cột 70] (Chưa dùng)",
                    group: "Thân nhân (Cột 53-78)"
          },
          {
                    id: "unused_71",
                    label: "[Cột 71] (Chưa dùng)",
                    group: "Thân nhân (Cột 53-78)"
          },
          {
                    id: "unused_72",
                    label: "[Cột 72] (Chưa dùng)",
                    group: "Thân nhân (Cột 53-78)"
          },
          {
                    id: "unused_73",
                    label: "[Cột 73] (Chưa dùng)",
                    group: "Thân nhân (Cột 53-78)"
          },
          {
                    id: "unused_74",
                    label: "[Cột 74] (Chưa dùng)",
                    group: "Thân nhân (Cột 53-78)"
          },
          {
                    id: "unused_75",
                    label: "[Cột 75] (Chưa dùng)",
                    group: "Thân nhân (Cột 53-78)"
          },
          {
                    id: "unused_76",
                    label: "[Cột 76] (Chưa dùng)",
                    group: "Thân nhân (Cột 53-78)"
          },
          {
                    id: "unused_77",
                    label: "[Cột 77] (Chưa dùng)",
                    group: "Thân nhân (Cột 53-78)"
          },
          {
                    id: "unused_78",
                    label: "[Cột 78] (Chưa dùng)",
                    group: "Thân nhân (Cột 53-78)"
          }
],
                editRole(role) {
                    this.flsRole = role;
                    // Initialize matrix with default true or existing user permissions
                    let perms = {};
                    try {
                        if (role.column_permissions) {
                            perms = typeof role.column_permissions === 'string' ? JSON.parse(role.column_permissions) : role.column_permissions;
                        }
                    } catch(e) {}
                    
                    this.allColumns.forEach(col => {
                        this.flsMatrix[col.id] = perms[col.id] || { read: true, write: true };
                    });
                    this.isFlsModalOpen = true;
                },
                async saveFls() {
                    if (!this.flsRole) return;
                    try {
                        const res = await fetch(`${API_URL}/roles/${this.flsRole.id}`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer mvp-static-token-999' },
                            body: JSON.stringify({ column_permissions: this.flsMatrix })
                        });
                        if(res.ok) {
                            this.isFlsModalOpen = false;
                            await this.fetchUsers(); // Refresh
                            alert('Đã lưu cấu hình Phân quyền Cột thành công!');
                        } else {
                            alert('Lỗi khi lưu cấu hình');
                        }
                    } catch(e) { alert('Lỗi kết nối'); }
                },
                isCreateUserModalOpen: false,
                newUserForm: { name: '', email: '', role: 'editor_a' },
                users: [],
                roles: [],
                isRoleModalOpen: false,
                roleForm: { name: "", description: "" },
                flsRole: null,
                availableRoles: [],
                globalAuditLogs: [
                    { id: 1, time: '10/08/2026 15:30', user: 'Sếp Tổng (Admin)', role: 'admin@system.com', action: 'CẬP NHẬT', entity: 'Nguyễn Văn A (NV001)', field: 'Quê quán [Cột 7]', oldValue: 'Hà Nội', newValue: 'Thanh Hóa', details: '' },
                    { id: 2, time: '10/08/2026 14:15', user: 'Nhân viên Nhập liệu', role: 'editor@system.com', action: 'THÊM MỚI', entity: 'Nguyễn Văn A (NV001)', field: '', oldValue: '', newValue: '', details: 'Tạo hồ sơ cán bộ mới' },
                    { id: 3, time: '09/08/2026 09:10', user: 'Sếp Tổng (Admin)', role: 'admin@system.com', action: 'CẬP NHẬT', entity: 'Trần Thị C (NV002)', field: 'Ngày sinh [Cột 4]', oldValue: '1985-01-01', newValue: '1985-11-30', details: '' },
                    { id: 4, time: '08/08/2026 16:20', user: 'Admin Hệ Thống', role: 'sys@admin.com', action: 'XÓA', entity: 'Lê Văn B (NV003)', field: '', oldValue: '', newValue: '', details: 'Đã xóa hồ sơ cán bộ' }
                ],
                permissions: {
                    'admin': { editKhoiA: true, editKhoiB: true, editKhoiC: true, editThanNhan: true },
                    'editor_a': { editKhoiA: true, editKhoiB: false, editKhoiC: false, editThanNhan: false },
                    'viewer': { editKhoiA: false, editKhoiB: false, editKhoiC: false, editThanNhan: false }
                },
                hasPermission(block) {
                    if (!this.currentUser || !this.currentUser.role) return false;
                    const roleName = this.currentUser.role.toLowerCase();
                    if (this.currentUser.email === 'admin@demo.com' || roleName.includes('admin')) return true;
                    if (roleName.includes('editor khối a') && block === 'editKhoiA') return true;
                    if (roleName.includes('editor khối b') && block === 'editKhoiB') return true;
                    if (roleName.includes('editor khối c') && block === 'editKhoiC') return true;
                    if (roleName.includes('thân nhân') && block === 'editThanNhan') return true;
                    return false;
                },
                
                // Panel state
                isPanelOpen: false,
                    selectedIds: [],
                activeTab: 'canhan',
                showColumns: true,
                selectedPerson: null,
                formData: {
                    trips: [{}],
                    flags: {},
                    relatives: []
                },
                
                tabs: [
                    { id: 'canhan', name: 'Cá nhân (52 Trường)' },
                    { id: 'thannhan', name: 'Thân nhân (26 Trường)' }
                ],
                
                getViewTitle() {
                    const titles = {
                        'dashboard': 'Dashboard Quản lý',
                        'canbo': 'Danh sách Cán bộ (Lõi)',
                        'pl1': 'Phụ lục 1: Cán bộ đi nước ngoài',
                        'pl2': 'Phụ lục 2: Thân nhân ở nước ngoài',
                        'pl3': 'Phụ lục 3: Lịch sử tiếp xúc & Lưu ý'
                    };
                    return titles[this.currentView] || titles['canbo'];
                },
                
                
                
                canReadColumn(colId) {
                    if (this.isAdmin()) return true;
                    if (!this.currentUser || !this.currentUser.column_permissions) return true; // Default allow if not configured
                    try {
                        let perms = typeof this.currentUser.column_permissions === 'string' ? JSON.parse(this.currentUser.column_permissions) : this.currentUser.column_permissions;
                        if (perms[colId] && perms[colId].read === false) return false;
                    } catch(e) {}
                    return true;
                },
                canWriteColumn(colId) {
                    if (this.isAdmin()) return true;
                    if (!this.currentUser || !this.currentUser.column_permissions) return true; 
                    try {
                        let perms = typeof this.currentUser.column_permissions === 'string' ? JSON.parse(this.currentUser.column_permissions) : this.currentUser.column_permissions;
                        if (perms[colId] && perms[colId].write === false) return false;
                    } catch(e) {}
                    return true;
                },
                isAdmin() {
                    if (!this.currentUser || !this.currentUser.role) return false;
                    return this.currentUser.email === 'admin@demo.com' || this.currentUser.role.toLowerCase().includes('admin');
                },
                
                canEdit(fieldId) {
                    if (!this.currentUser) return false;
                    if (this.isAdmin()) return true; // Admins can edit everything
                    const perms = this.currentUser.column_permissions;
                    if (perms && perms[fieldId] !== undefined) {
                        return perms[fieldId].write === true;
                    }
                    // If FLS not set for this role, default to false
                    return false;
                },
                canView(fieldId) {
                    if (!this.currentUser) return false;
                    if (this.isAdmin()) return true;
                    const perms = this.currentUser.column_permissions;
                    if (perms && perms[fieldId] !== undefined) {
                        return perms[fieldId].read === true;
                    }
                    return false;
                },
                toggleAllFls(type, checked) {
                    this.allColumns.forEach(col => {
                        this.flsMatrix[col.id][type] = checked;
                    });
                },
                // Dashboard
                dashboardDateFilter: new Date().toISOString().split('T')[0],
                dashboardStats: { total: 0, missingDecisions: 0, warnings: 0, purposeCount: {}, countryCount: {}, fundingCount: {} },
                
                init() {
                    const session = localStorage.getItem('mvp_session');
                    if (session) {
                        try {
                            this.currentUser = JSON.parse(session);
                            this.isLoggedIn = true;
                        } catch(e) {}
                    }
                    this.loadMappingConfig(); this.fetchData(); this.fetchLogs(); this.fetchUsers();
                },
                
                
                
                getLabel(id, isRelative = false) {
                    let mapArr = isRelative ? this.importMappingRelative : this.importMappingPersonnel;
                    if(!mapArr) return '';
                    for(let g of mapArr) {
                        let c = (g.columns||[]).find(col => col.id === id);
                        if(c) return c.label;
                    }
                    return '';
                },
                getColIndex(id, isRelative = false) {
                    let mapArr = isRelative ? this.importMappingRelative : this.importMappingPersonnel;
                    if(!mapArr) return -1;
                    let idx = 0;
                    for(let g of mapArr) {
                        for(let c of (g.columns||[])) {
                            if(c.id === 'stt') continue;
                            if(c.id === id) return idx;
                            idx++;
                        }
                    }
                    return -1;
                },
                getGlobalColIndex(gIndex, cIndex) {
                    let mapArr = this.activeSettingsTab === 'personnel' ? this.importMappingPersonnel : this.importMappingRelative;
                    let idx = 0;
                    for(let i=0; i<gIndex; i++) {
                        idx += (mapArr[i].columns || []).filter(c => c.id !== 'stt').length;
                    }
                    for(let i=0; i<cIndex; i++) {
                        if(mapArr[gIndex].columns[i].id !== 'stt') idx++;
                    }
                    return idx;
                },
                loadMappingConfig() {
                    const fetchConfig = (key, defaultArr) => {
                        return fetch(`${API_URL}/items/app_settings?filter[key][_eq]=${key}&_t=${Date.now()}`, {
                            headers: { 'Authorization': 'Bearer mvp-static-token-999' }
                        }).then(r => r.json()).then(data => {
                            if (data.data && data.data.length > 0 && data.data[0].value) {
                                let val = data.data[0].value;
                                return typeof val === 'string' ? JSON.parse(val) : val;
                                
                            }
                            return defaultArr;
                        }).catch(() => defaultArr);
                    };
                    
                    const pDef = [{group: "Khối A: Thông tin chung", columns: [{id: 'name', label: 'Họ và tên', format: 'text'}]}];
                    const rDef = [{group: "Thông tin chung", columns: [{id: 'relativeName', label: 'Tên thân nhân', format: 'text'}]}];
                    
                    Promise.all([
                        fetchConfig('dynamic_form_personnel', pDef),
                        fetchConfig('dynamic_form_relative', rDef)
                    ]).then(([pConfig, rConfig]) => {
                        this.importMappingPersonnel = pConfig;
                        this.importMappingRelative = rConfig;
                    });
                },
                async saveMappingConfig() {
                    try {
                        const saveConfig = async (key, val) => {
                            let getRes = await fetch(`${API_URL}/items/app_settings?filter[key][_eq]=${key}`, {
                                headers: { 'Authorization': 'Bearer mvp-static-token-999' }
                            });
                            let getData = await getRes.json();
                            if (getData.data && getData.data.length > 0) {
                                let id = getData.data[0].id;
                                return await fetch(`${API_URL}/items/app_settings/${id}`, {
                                    method: 'PATCH',
                                    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer mvp-static-token-999' },
                                    body: JSON.stringify({ value: JSON.stringify(val) })
                                });
                            } else {
                                return await fetch(`${API_URL}/items/app_settings`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer mvp-static-token-999' },
                                    body: JSON.stringify({ key: key, value: JSON.stringify(val) })
                                });
                            }
                        };
                        
                        await Promise.all([
                            saveConfig('dynamic_form_personnel', this.importMappingPersonnel),
                            saveConfig('dynamic_form_relative', this.importMappingRelative),
                            saveConfig('mapping_config_personnel', this.importMappingPersonnel),
                            saveConfig('mapping_config_relative', this.importMappingRelative)
                        ]);
                        alert("Đã lưu cấu hình cột Import thành công!");
                    } catch(e) {
                        alert("Lỗi mạng: " + e.message);
                    }
                },
                addGroup() {
                    let mapArr = this.activeSettingsTab === 'personnel' ? this.importMappingPersonnel : this.importMappingRelative;
                    mapArr.push({ group: "Nhóm mới", columns: [] });
                },
                removeGroup(gIndex) {
                    if(!confirm("Bạn có chắc chắn muốn xóa nhóm này và tất cả các cột bên trong?")) return;
                    let mapArr = this.activeSettingsTab === 'personnel' ? this.importMappingPersonnel : this.importMappingRelative;
                    mapArr.splice(gIndex, 1);
                },
                addColumn(gIndex) {
                    let mapArr = this.activeSettingsTab === 'personnel' ? this.importMappingPersonnel : this.importMappingRelative;
                    mapArr[gIndex].columns.push({ id: 'custom_' + Date.now(), label: 'Cột mới', format: 'text' });
                },
                removeColumn(gIndex, cIndex) {
                    let mapArr = this.activeSettingsTab === 'personnel' ? this.importMappingPersonnel : this.importMappingRelative;
                    mapArr[gIndex].columns.splice(cIndex, 1);
                },

                async fetchUsers() {
                    try {
                        const [usersRes, rolesRes] = await Promise.all([
                            fetch(`${API_URL}/users?fields=id,first_name,email,role,status`, { headers: { 'Authorization': 'Bearer mvp-static-token-999' } }),
                            fetch(`${API_URL}/roles?fields=id,name,column_permissions`, { headers: { 'Authorization': 'Bearer mvp-static-token-999' } })
                        ]);
                        
                        const usersData = await usersRes.json();
                        const rolesData = await rolesRes.json();
                        
                        this.availableRoles = rolesData.data || [];
                        this.roles = this.availableRoles;
                        const roleMap = {};
                        const rolePermsMap = {};
                        this.availableRoles.forEach(r => {
                            roleMap[r.id] = r.name;
                            let perms = r.column_permissions;
                            if (typeof perms === 'string') {
                                try { perms = JSON.parse(perms); } catch(e) { perms = null; }
                            }
                            rolePermsMap[r.id] = perms || {};
                            r.column_permissions = perms || {};
                        });

                        this.users = (usersData.data || []).map(u => ({
                            id: u.id,
                            name: u.first_name || 'Không tên',
                            email: u.email || 'Không có email',
                            roleId: u.role,
                            role: roleMap[u.role] || 'No Role',
                            column_permissions: rolePermsMap[u.role] || {},
                            status: u.status === 'active' ? 'Active' : 'Inactive'
                        }));
                    } catch(e) { console.error("Lỗi fetch Users", e); }
                },
                isImportModalOpen: false, importType: "personnel", importTargetPersonnelId: "",
                importStep: 1,
                importPasteText: '',
                importHeaders: [],
                importRows: [],
                importMappingPersonnel: [], importMappingRelative: [], activeSettingsTab: 'personnel',
                isImporting: false,
                
                defaultMapping54: ["stt", "name", "otherName", "birthYear", "ethnicity", "religion", "hometown", "departmentName", "positionName", "thuongTru", "tamTru", "cccd", "hcCaNhan", "hcCongVu", "kqThamTra", "decisionNumber", "decisionDate", "decisionIssuer", "departureDate", "arrivalDate", "countryName", "tripCount", "purpose_cong_tac", "purpose_hoc_tap", "purpose_viec_rieng", "trainingType", "trainingPlace", "trainingRole", "sponsorUnit", "fundingName", "trainingTime", "workRole", "workMembers", "workMemberCount", "funding_ngan_sach", "funding_tu_tuc", "funding_tai_tro", "funding_hoc_bong", "report", "nopHC", "trongYeu", "thamNhung", "loiKeo", "otherFlags", "kl_chung", "klDang", "klChinhQuyen", "vpChuaPhep", "vpNuocNgoai", "vpQuaHan", "receivedGiftOver50M", "rentHouseToForeigner", "workInForeignCompany", "dienQuanLy"],
                get systemFields() {
                    if (this.importType === 'relative') {
                        return [
                            { key: 'stt', label: 'Số thứ tự (STT)' },
                            { key: 'parentPersonnelCccd', label: 'CCCD Cán bộ (Dùng để khớp dữ liệu)' },
                            { key: 'parentPersonnelName', label: '[Thông tin Cán bộ] Họ và tên' },
                            { key: 'parentPosition', label: '[Thông tin Cán bộ] Chức vụ' },
                            { key: 'parentDepartment', label: '[Thông tin Cán bộ] Đơn vị' },
                            { key: 'relationshipName', label: 'Quan hệ' },
                            { key: 'relativeName', label: 'Họ và tên người thân' },
                            { key: 'birthYear', label: 'Năm sinh' },
                            { key: 'currentAddress', label: 'Nơi cư trú' },
                            { key: 'occupation', label: 'Nghề nghiệp/Nơi làm việc' },
                            { key: 'countryName', label: 'Quốc gia (Yếu tố NN)' },
                            { key: 'timeAbroad', label: 'Thời gian ở NN' },
                            { key: 'unitAbroad', label: 'Cơ quan/Tổ chức NN' },
                            { key: 'fundingName', label: 'Nguồn kinh phí' },
                            { key: 'currentUnit', label: 'Công việc hiện tại (NN)' },
                            { key: 'marriedToForeigner', label: 'Kết hôn với người NN' },
                            { key: 'workInForeignCompany', label: 'Làm việc cho FDI' },
                            { key: 'cccd', label: 'Số CCCD Thân nhân' },
                            { key: 'xlplNuocSoTai', label: 'Xử lý vi phạm NN (Nước sở tại)' },
                            { key: 'xlplVietNam', label: 'Xử lý vi phạm VN (Pháp luật Việt Nam)' },
                            { key: 'otherName', label: 'Tên khác' },
                            { key: 'hometown', label: 'Quê quán' },
                            { key: 'nationality', label: 'Quốc tịch' },
                            { key: 'hktt', label: 'Nơi đăng ký HKTT' },
                            { key: 'fileNumber', label: 'Số hồ sơ' },
                            { key: 'content', label: 'Nội Dung' }
                        ];
                    }
                    return [
                        { key: 'stt', label: 'Cột 1 (TT)' },
                        { key: 'name', label: 'Cột 2 (Họ và tên)' },
                        { key: 'otherName', label: 'Cột 3 (Tên khác)' },
                        { key: 'birthYear', label: 'Cột 4 (Ngày, tháng, năm sinh)' },
                        { key: 'ethnicity', label: 'Cột 5 (Dân tộc)' },
                        { key: 'religion', label: 'Cột 6 (Tôn giáo)' },
                        { key: 'hometown', label: 'Cột 7 (Quê quán)' },
                        { key: 'departmentName', label: 'Cột 8 (Đơn vị công tác)' },
                        { key: 'positionName', label: 'Cột 9 (Chức vụ)' },
                        { key: 'thuongTru', label: 'Cột 10 (Nơi ĐKHK thường trú)' },
                        { key: 'tamTru', label: 'Cột 11 (Nơi ở hiện nay)' },
                        { key: 'cccd', label: 'Cột 12 (Số CCCD)' },
                        { key: 'hcCaNhan', label: 'Cột 13 (Hộ chiếu cá nhân)' },
                        { key: 'hcCongVu', label: 'Cột 14 (Hộ chiếu công vụ)' },
                        { key: 'kqThamTra', label: 'Cột 15 (KQ thẩm tra)' },
                        { key: 'decisionNumber', label: 'Cột 16 (Số Quyết định)' },
                        { key: 'decisionDate', label: 'Cột 17 (Ngày ban hành)' },
                        { key: 'decisionIssuer', label: 'Cột 18 (Cơ quan ban hành)' },
                        { key: 'departureDate', label: 'Cột 19 (Ngày xuất cảnh)' },
                        { key: 'arrivalDate', label: 'Cột 20 (Ngày nhập cảnh)' },
                        { key: 'countryName', label: 'Cột 21 (Quốc Gia)' },
                        { key: 'tripCount', label: 'Cột 22 (Số lần)' },
                        { key: 'purposeName', label: 'Cột 23 (Mục đích chuyến đi)' },
                        { key: 'trainingType', label: 'Cột 24 (Diện đào tạo)' },
                        { key: 'trainingPlace', label: 'Cột 25 (Nơi đào tạo)' },
                        { key: 'trainingRole', label: 'Cột 26 (Vai trò đào tạo)' },
                        { key: 'sponsorUnit', label: 'Cột 27 (Đơn vị chọn cử)' },
                        { key: 'fundingName', label: 'Cột 28 (Nguồn Kinh phí)' },
                        { key: 'trainingTime', label: 'Cột 29 (Thời gian đào tạo)' },
                        { key: 'workRole', label: 'Cột 30 (Trưởng Đoàn)' },
                        { key: 'workMembers', label: 'Cột 31 (Thành phần Đoàn)' },
                        { key: 'workMemberCount', label: 'Cột 32 (Số lượng thành viên)' },
                        { key: 'groupFunding', label: 'Cột 33 (Nguồn Kinh phí Đoàn)' },
                        { key: 'report', label: 'Cột 34 (Báo cáo kết quả)' },
                        { key: 'nopHC', label: 'Nộp hộ chiếu' },
                        { key: 'purpose_cong_tac', label: '[Mục đích] Công tác' },
                        { key: 'purpose_hoc_tap', label: '[Mục đích] Học tập' },
                        { key: 'purpose_viec_rieng', label: '[Mục đích] Việc riêng' },
                        { key: 'funding_ngan_sach', label: '[Kinh phí] Ngân sách NN' },
                        { key: 'funding_tu_tuc', label: '[Kinh phí] Tự túc' },
                        { key: 'funding_tai_tro', label: '[Kinh phí] Tài trợ' },
                        { key: 'funding_hoc_bong', label: '[Kinh phí] Học bổng' },
                        { key: 'trongYeu', label: 'Vấn đề TCCT / Tự diễn biến' },
                        { key: 'thamNhung', label: 'Đang bị điều tra' },
                        { key: 'loiKeo', label: 'Khai man / Vấn đề lý lịch khác' },
                        { key: 'otherFlags', label: 'Có vấn đề TCCT (Khác)' },
                        { key: 'kl_chung', label: 'Kỷ luật (Chung)' },
                        { key: 'klDang', label: 'Kỷ luật Đảng' },
                        { key: 'klChinhQuyen', label: 'Kỷ luật Chính quyền' },
                        { key: 'vpChuaPhep', label: 'Đi NN không phép' },
                        { key: 'vpNuocNgoai', label: 'Vi phạm PL ở nước ngoài' },
                        { key: 'vpQuaHan', label: 'Ở lại NN quá hạn' },
                        { key: 'dienQuanLy', label: 'Diện quản lý' },
                        { key: 'receivedGiftOver50M', label: 'Được tặng quà >50tr' },
                        { key: 'rentHouseToForeigner', label: 'Cho thuê nhà/đất' },
                        { key: 'workInForeignCompany', label: 'Làm tại cty FDI' }
                    ];
                },
                
                async doLogin() {
                    try {
                        const res = await fetch(`${API_URL}/auth/login`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ email: this.loginForm.email, password: this.loginForm.password })
                        });
                        
                        if (!res.ok) {
                            alert('Tài khoản hoặc mật khẩu không chính xác!');
                            return;
                        }
                        
                        const user = this.users.find(u => u.email === this.loginForm.email);
                        if (user) {
                            this.currentUser = user;
                            this.isLoggedIn = true;
                            localStorage.setItem('mvp_session', JSON.stringify(user));
                        } else {
                            alert('Tài khoản không được cấp quyền trong hệ thống nội bộ!');
                        }
                    } catch (e) {
                        alert('Lỗi kết nối tới máy chủ!');
                    }
                },
                openImportModal(type = 'personnel') {
                    this.importType = type;
                    this.importTargetPersonnelId = '';
                    this.isImportModalOpen = true;
                    this.importStep = 1;
                    this.importPasteText = '';
                    this.importHeaders = [];
                    this.importRows = [];
                    
                },
                                                                loadSampleData() {
                    const maps = this.importTab === 'relative' ? this.importMappingRelative : this.importMappingPersonnel;
                    const headers = ['Cột 1 (STT)'];
                    let colIndex = 2;
                    for (let g of maps) {
                        for (let c of (g.columns||[])) {
                            if (c.id === 'stt') continue;
                            headers.push(`Cột ${colIndex} (${c.label})`);
                            colIndex++;
                        }
                    }
                    const headersStr = headers.join('	');
                    
                    const row1 = Array.from({length: headers.length}, () => '').join('	');
                    const text = headersStr + '\\n' + row1;
                    
                    const msg = this.importTab === 'relative' ? 'Thân nhân' : 'Cán bộ';
                    navigator.clipboard.writeText(text).then(() => {
                        alert(`Đã copy Template cấu hình ${msg} hiện tại vào Clipboard! Bạn hãy dán (Ctrl+V) vào Google Sheets.`);
                    }).catch(err => {
                        alert('Lỗi copy, trình duyệt không hỗ trợ. Dữ liệu đã được điền vào ô bên dưới.');
                        this.importPasteText = text;
                    });
                },
                
                handleTSVUpload(event) {
                    const file = event.target.files[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        const text = e.target.result;
                        // Auto-detect separator
                        let firstLine = text.split('\n')[0] || '';
                        let sep = ',';
                        if (firstLine.indexOf('\t') !== -1) sep = '\t';
                        else if (firstLine.indexOf(';') !== -1 && firstLine.indexOf(',') === -1) sep = ';';
                        else if (firstLine.split(';').length > firstLine.split(',').length) sep = ';';
                        
                        let p = '', row = [''], ret = [row], i = 0, r = 0, s = !0, l;
                        for (l of text) {
                            if ('"' === l) {
                                if (s && l === p) row[i] += l;
                                s = !s;
                            } else if (sep === l && s) l = row[++i] = '';
                            else if ('\n' === l && s) {
                                if ('\r' === p) row[i] = row[i].slice(0, -1);
                                row = ret[++r] = [l = '']; i = 0;
                            } else row[i] += l;
                            p = l;
                        }
                        if (ret.length > 0 && ret[ret.length-1].length === 1 && ret[ret.length-1][0] === '') ret.pop();
                        
                        this.importPasteText = ret.map(r => r.join('\t')).join('\n');
                        this.processPastedData();
                    };
                    reader.readAsText(file);
                    event.target.value = '';
                },

                
                processPastedData() {
                    if(!this.importPasteText.trim()) return;
                    
                    let text = this.importPasteText.trim();
                    let separator = '\t';
                    if (text.indexOf('\t') === -1 && text.indexOf(',') !== -1) {
                        separator = ',';
                    }
                    
                    // Simple parser that handles quotes for CSV
                    let rows = [];
                    if (separator === ',') {
                        let p = '', row = [''], i = 0, s = !0, l;
                        for (l of text) {
                            if ('"' === l) {
                                if (s && l === p) row[i] += l;
                                s = !s;
                            } else if (',' === l && s) l = row[++i] = '';
                            else if ('\n' === l && s) {
                                if ('\r' === p) row[i] = row[i].slice(0, -1);
                                rows.push(row); row = ['']; i = 0; l = '';
                            } else row[i] += l;
                            p = l;
                        }
                        if (row.length > 0 || row[0] !== '') rows.push(row);
                    } else {
                        rows = text.split('\n').map(r => r.replace(/\r$/, '').split('\t'));
                    }
                    
                    // Filter empty rows
                    rows = rows.filter(r => r.some(c => c && c.trim() !== ''));
                    
                    if (rows.length < 2) {
                        alert("Dữ liệu không hợp lệ. Vui lòng đảm bảo có ít nhất 1 dòng tiêu đề và 1 dòng dữ liệu.");
                        return;
                    }
                    
                    this.importHeaders = rows[0].map(h => h.trim());
                    this.importRows = rows.slice(1);
                    
                    const rawConfig = this.importType === 'relative' ? this.importMappingRelative : this.importMappingPersonnel; 
                    const mappingConfig = rawConfig.flatMap(g => g.columns);
                    
                    this.importMapping = [];
                    for(let i = 1; i < this.importHeaders.length; i++) {
                        let header = this.importHeaders[i] ? this.importHeaders[i].toLowerCase().trim() : '';
                        let matchedKey = '';
                        if (header && header !== '') {
                            let bestMatch = this.systemFields.find(f => {
                                let l = f.label.toLowerCase().trim();
                                let lClean = l.replace(/\[.*?\]/g, '').replace(/cột \d+/g, '').trim();
                                let hClean = header.replace(/\[.*?\]/g, '').replace(/cột \d+/g, '').trim();
                                return l === header || header.includes(l) || l.includes(header) ||
                                       (lClean.length > 3 && hClean.includes(lClean)) ||
                                       (hClean.length > 3 && lClean.includes(hClean));
                            });
                            if (bestMatch) matchedKey = bestMatch.key;
                        }
                        
                        if (!matchedKey && this.importType !== 'relative' && i < this.defaultMapping54.length) {
                            matchedKey = this.defaultMapping54[i];
                        }
                        
                        this.importMapping[i] = matchedKey || '';
                    }
                    
                    if (this.importHeaders.length - 1 !== mappingConfig.length) {
                        const proceed = confirm(`CẢNH BÁO: Dữ liệu bạn nhập có ${this.importHeaders.length - 1} cột (bỏ qua STT), nhưng hệ thống kỳ vọng ${mappingConfig.length} cột. 
Dữ liệu hiển thị có thể bị xô lệch hoặc thiếu sót. Bạn có muốn tiếp tục không?`);
                        if (!proceed) return;
                    }
                    
                    setTimeout(() => {
                        this.importStep = 2;
                    }, 50);
                },
                
                async executeImport() {
                    this.isImporting = true;
                    try {
                        const rawConfig = this.importType === 'relative' ? this.importMappingRelative : this.importMappingPersonnel; const mappingConfig = rawConfig.flatMap(g => g.columns);
                        const payloads = [];
                        const appendix3Payloads = [];
                        const appendix1Payloads = [];
                        const errorLogs = [];
                        let rowNum = 1;
                        
                        // Parser Utilities
                        const parseDate = (val) => {
                            if (!val) return null;
                            if (/^\d{4}$/.test(val)) return `${val}-01-01`;
                            const parts = val.split(/[-/]/);
                            if (parts.length === 3) {
                                return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                            }
                            return val;
                        };
                        const parseNumber = (val) => {
                            if (!val) return null;
                            const num = parseFloat(val.replace(/[^\d.-]/g, ''));
                            return isNaN(num) ? null : num;
                        };
                        const parseCheckbox = (val) => {
                            if (!val) return false;
                            const v = val.toLowerCase().trim();
                            return ['x', 'v', 'có', 'yes', 'true', '1'].includes(v);
                        };
                        const parseTextLoop = (val) => {
                            if (!val) return '';
                            return val.replace(/\n/g, ', ').trim();
                        };

                        for (let r of this.importRows) {
                            rowNum++;
                            let hasData = false;
                            let hasApp1Data = false;
                            
                            const payload = {};
                            const app3Payload = {};
                            const app1Payload = {};
                            let parentCccd = null;
                            
                            const virtualPurposes = [];
                            const virtualFundings = [];
                            
                            for (let i = 0; i < mappingConfig.length; i++) {
                                const config = mappingConfig[i];
                                if (!config || !config.id) continue;
                                
                                const fieldKey = config.id;
                                const format = config.format || 'text';
                                let rawVal = (r[i] !== undefined && r[i] !== null) ? String(r[i]).trim() : '';
                                
                                if (!rawVal && format !== 'checkbox') continue;
                                
                                let val = rawVal;
                                if (format === 'date') val = parseDate(rawVal);
                                else if (format === 'number') val = parseNumber(rawVal);
                                else if (format === 'checkbox') val = parseCheckbox(rawVal);
                                else if (format === 'text_loop') val = parseTextLoop(rawVal);
                                else val = rawVal; 
                                
                                if (val === null || val === '') continue;

                                if (this.importType === 'relative') {
                                    const ignoredFields = ['stt', 'parentPersonnelCccd', 'parentPersonnelName', 'parentPosition', 'parentDepartment', 'otherName', 'hometown', 'nationality', 'hktt', 'fileNumber', 'content'];
                                    if (ignoredFields.includes(fieldKey)) {
                                        if (fieldKey === 'parentPersonnelCccd') parentCccd = val;
                                        continue;
                                    }
                                    if (fieldKey.startsWith('custom_')) {
                                        if (!payload.custom_data) payload.custom_data = {};
                                        payload.custom_data[fieldKey] = val;
                                    } else {
                                        payload[fieldKey] = val;
                                    }
                                    hasData = true;
                                } else {
                                    const ignoredKeys = ['stt'];
                                    const flagKeys = ['trongYeu', 'thamNhung', 'loiKeo', 'klDang', 'klChinhQuyen', 'vpChuaPhep', 'vpNuocNgoai', 'vpQuaHan', 'dienQuanLy', 'receivedGiftOver50M', 'rentHouseToForeigner', 'workInForeignCompany', 'marriedToForeigner', 'otherFlags', 'kl_chung'];
                                    const tripKeys = ['decisionNumber', 'decisionDate', 'decisionIssuer', 'departureDate', 'arrivalDate', 'countryName', 'tripCount', 'purposeName', 'trainingType', 'trainingPlace', 'trainingRole', 'sponsorUnit', 'fundingName', 'trainingTime', 'workRole', 'workMembers', 'workMemberCount', 'groupFunding', 'report', 'nopHC'];
                                    
                                    if (ignoredKeys.includes(fieldKey)) continue;

                                    if (fieldKey.startsWith('purpose_') && val === true) {
                                        virtualPurposes.push(this.systemFields.find(f => f.key === fieldKey)?.label.replace('[Mục đích] ', '') || fieldKey);
                                        hasApp1Data = true;
                                    } else if (fieldKey.startsWith('funding_') && val === true) {
                                        virtualFundings.push(this.systemFields.find(f => f.key === fieldKey)?.label.replace('[Kinh phí] ', '') || fieldKey);
                                        hasApp1Data = true;
                                    } else if (flagKeys.includes(fieldKey)) {
                                        app3Payload[fieldKey] = val;
                                        hasData = true;
                                    } else if (tripKeys.includes(fieldKey)) {
                                        app1Payload[fieldKey] = val;
                                        hasApp1Data = true;
                                    } else {
                                        if (fieldKey.startsWith('custom_')) {
                                        if (!payload.custom_data) payload.custom_data = {};
                                        payload.custom_data[fieldKey] = val;
                                    } else {
                                        payload[fieldKey] = val;
                                    }
                                    hasData = true;
                                    }
                                }
                            }
                            
                            if (this.importType === 'relative') {
                                if (!parentCccd) {
                                    errorLogs.push(`Dòng ${rowNum}: Thiếu CCCD cán bộ để ghép nối!`);
                                    continue;
                                }
                                const targetPerson = this.personnels.find(p => p.cccd === parentCccd);
                                if (!targetPerson) {
                                    errorLogs.push(`Dòng ${rowNum}: Không tìm thấy cán bộ có CCCD ${parentCccd}`);
                                    continue;
                                }
                                payload.personnelId = targetPerson.id;
                                payload.id = 'rel_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
                                if (hasData) payloads.push(payload);
                            } else {
                                if (virtualPurposes.length > 0) app1Payload['purposeName'] = virtualPurposes.join(', ');
                                if (virtualFundings.length > 0) app1Payload['groupFunding'] = virtualFundings.join(', ');
                                if (hasData || hasApp1Data) {
                                    payloads.push(payload);
                                    appendix3Payloads.push(app3Payload);
                                    appendix1Payloads.push(app1Payload);
                                }
                            }
                        }
                        
                        if (payloads.length === 0 && appendix1Payloads.length === 0 && errorLogs.length > 0) {
                            alert('Không có dữ liệu hợp lệ để lưu!\n\n' + errorLogs.slice(0, 5).join('\n'));
                            this.isImporting = false;
                            return;
                        }

                        if (this.importType === 'relative') {
                            const res = await fetch(`${API_URL}/items/appendix2`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer mvp-static-token-999' },
                                body: JSON.stringify(payloads)
                            });
                            
                            if(res.ok) {
                                this.isImportModalOpen = false;
                                await this.fetchData();
                                let msg = `Đã import thành công ${payloads.length} thân nhân!`;
                                if(errorLogs.length > 0) {
                                    msg += `\nTuy nhiên có ${errorLogs.length} dòng bị lỗi:\n- ` + errorLogs.slice(0, 5).join('\n- ');
                                    if(errorLogs.length > 5) msg += `\n... và ${errorLogs.length - 5} lỗi khác.`;
                                }
                                alert(msg);
                            } else {
                                const err = await res.json();
                                alert("Lỗi khi import: " + (err.errors?.[0]?.message || 'Lỗi không xác định'));
                            }
                        } else {
                            const res = await fetch(`${API_URL}/items/personnels`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer mvp-static-token-999' },
                                body: JSON.stringify(payloads)
                            });
                            
                            if(res.ok) {
                                const result = await res.json();
                                const insertedPersonnels = result.data;
                                
                                const finalApp1 = [];
                                const finalApp3 = [];
                                
                                for(let i = 0; i < insertedPersonnels.length; i++) {
                                    const pId = insertedPersonnels[i].id;
                                    const a1 = appendix1Payloads[i];
                                    const a3 = appendix3Payloads[i];
                                    
                                    if(Object.keys(a1).length > 0) {
                                        a1.personnelId = pId;
                                        a1.id = 'app1_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
                                        finalApp1.push(a1);
                                    }
                                    if(Object.keys(a3).length > 0) {
                                        a3.personnelId = pId;
                                        a3.id = 'app3_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
                                        finalApp3.push(a3);
                                    }
                                }
                                
                                const reqs = [];
                                if(finalApp1.length > 0) {
                                    reqs.push(fetch(`${API_URL}/items/appendix1`, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer mvp-static-token-999' },
                                        body: JSON.stringify(finalApp1)
                                    }));
                                }
                                if(finalApp3.length > 0) {
                                    reqs.push(fetch(`${API_URL}/items/appendix3`, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer mvp-static-token-999' },
                                        body: JSON.stringify(finalApp3)
                                    }));
                                }
                                
                                if (reqs.length > 0) await Promise.all(reqs);
                                
                                this.isImportModalOpen = false;
                                await this.fetchData();
                                alert(`Đã import thành công ${payloads.length} Cán bộ và dữ liệu đính kèm!`);
                            } else {
                                const err = await res.json();
                                alert("Lỗi khi lưu Cán bộ: " + (err.errors?.[0]?.message || 'Lỗi không xác định'));
                            }
                        }
                    } catch (e) {
                        alert('Lỗi khi import: ' + e.message);
                    } finally {
                        this.isImporting = false;
                    }
                },

                openCreateUser() {
                    this.newUserForm = { id: null, name: '', email: '', role: '', password: '' };
                    this.isCreateUserModalOpen = true;
                },
                editUser(user) {
                    this.newUserForm = {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        role: user.roleId, // Map to Role ID
                        password: '' // Only if changing
                    };
                    this.isCreateUserModalOpen = true;
                },
                openRoleModal() {
                    this.roleForm = { name: "", description: "" };
                    this.isRoleModalOpen = true;
                },
                async deleteRole(r) {
                    if(!confirm('Bạn có chắc chắn muốn xóa vai trò "' + r.name + '"?')) return;
                    try {
                        const res = await fetch(`${API_URL}/roles/${r.id}`, {
                            method: 'DELETE',
                            headers: { 'Authorization': 'Bearer mvp-static-token-999' }
                        });
                        if (res.ok) {
                            alert('Đã xóa vai trò thành công!');
                            this.fetchUsers();
                        } else {
                            alert('Có lỗi xảy ra khi xóa!');
                        }
                    } catch(e) { console.error('Delete role error', e); }
                },
                async saveRole() {
                    if (!this.roleForm.name.trim()) {
                        alert("Vui lòng nhập tên Vai trò!");
                        return;
                    }
                    try {
                        const res = await fetch(`${API_URL}/roles`, {
                            method: 'POST',
                            headers: { 
                                'Content-Type': 'application/json',
                                'Authorization': 'Bearer mvp-static-token-999'
                            },
                            body: JSON.stringify({
                                name: this.roleForm.name,
                                description: this.roleForm.description,
                                icon: 'verified_user'
                            })
                        });
                        if (res.ok) {
                            alert("Thêm Vai trò thành công!");
                            this.isRoleModalOpen = false;
                            
                            // Tải lại danh sách roles
                            const rolesRes = await fetch(`${API_URL}/roles`, {
                                headers: { 'Authorization': 'Bearer mvp-static-token-999' }
                            });
                            if(rolesRes.ok) {
                                const data = await rolesRes.json();
                                this.roles = data.data;
                            }
                        } else {
                            alert("Có lỗi xảy ra khi lưu Vai trò!");
                        }
                    } catch(e) {
                        alert("Lỗi kết nối Server: " + e.message);
                    }
                },

                async saveUser() {
                    if (!this.newUserForm.email || !this.newUserForm.role) {
                        alert("Vui lòng điền đủ Email và Phân quyền!");
                        return;
                    }
                    try {
                        const payload = {
                            first_name: this.newUserForm.name,
                            email: this.newUserForm.email,
                            role: this.newUserForm.role
                        };
                        if (this.newUserForm.password) payload.password = this.newUserForm.password;
                        
                        const method = this.newUserForm.id ? 'PATCH' : 'POST';
                        const url = this.newUserForm.id ? `${API_URL}/users/${this.newUserForm.id}` : `${API_URL}/users`;
                        
                        const res = await fetch(url, {
                            method,
                            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer mvp-static-token-999' },
                            body: JSON.stringify(payload)
                        });
                        if(res.ok) {
                            this.isCreateUserModalOpen = false;
                            this.newUserForm = { id: null, name: '', email: '', role: 'editor', password: '' };
                            await this.fetchUsers();
                            alert(this.newUserForm.id ? "Đã sửa quyền thành công!" : "Tạo User thành công!");
                        } else {
                            const err = await res.json();
                            alert("Lỗi khi lưu User: " + (err.errors?.[0]?.message || 'Lỗi không xác định'));
                        }
                    } catch(e) {
                        alert("Lỗi kết nối");
                    }
                },
                                updateDashboard() {
                    let total = this.personnel.length;
                    let missingDecisions = 0;
                    let warnings = 0;
                    let purposeCount = {
                        'Hội nghị/Hội thảo': 0,
                        'Học tập/Nghiên cứu': 0,
                        'Công tác': 0,
                        'Việc riêng/Thăm thân': 0,
                        'Du lịch': 0
                    };
                    let countryCountMap = {
                        'Mỹ': 0,
                        'Trung Quốc': 0,
                        'Đài Loan': 0
                    };
                    let fundingCount = {
                        'Ngân sách nhà nước': 0,
                        'Cơ quan, tổ chức đài thọ': 0,
                        'Cá nhân tự túc': 0
                    };
                    
                    const todayStr = new Date().toISOString().split('T')[0];

                    this.personnel.forEach(p => {
                        if (p.trips) {
                            p.trips.forEach(t => {
                                // Missing decision (soQuyetDinh is empty)
                                if (!t.decisionNumber || t.decisionNumber.trim() === '') {
                                    missingDecisions++;
                                }
                                
                                // Return warning (arrivalDate <= today)
                                if (t.arrivalDate && t.arrivalDate <= todayStr) {
                                    warnings++;
                                }
                                
                                // Purpose Count
                                if (t.purposeName) {
                                    purposeCount[t.purposeName] = (purposeCount[t.purposeName] || 0) + 1;
                                }
                                
                                // Country Count
                                if (t.countryName) {
                                    countryCountMap[t.countryName] = (countryCountMap[t.countryName] || 0) + 1;
                                }
                                
                                // Funding Count
                                if (t.fundingName) {
                                    fundingCount[t.fundingName] = (fundingCount[t.fundingName] || 0) + 1;
                                }
                            });
                        }
                    });
                    
                    // Sort country count. Top 3 fixed: Mỹ, Trung Quốc, Đài Loan. Then the rest by count descending.
                    const top3 = ['Mỹ', 'Trung Quốc', 'Đài Loan'];
                    const sortedCountries = [];
                    
                    // Add top 3 if they exist or even if they are 0
                    top3.forEach(c => {
                        sortedCountries.push({ name: c, count: countryCountMap[c] || 0 });
                        delete countryCountMap[c];
                    });
                    
                    // Sort the rest
                    const restCountries = Object.keys(countryCountMap).map(k => ({ name: k, count: countryCountMap[k] }));
                    restCountries.sort((a, b) => b.count - a.count);
                    const finalCountryList = [...sortedCountries, ...restCountries];
                    
                    // Convert Purpose and Funding to array and sort by count descending
                    const purposeList = Object.keys(purposeCount).map(k => ({ name: k, count: purposeCount[k] })).sort((a,b) => b.count - a.count);
                    const fundingList = Object.keys(fundingCount).map(k => ({ name: k, count: fundingCount[k] })).sort((a,b) => b.count - a.count);

                    // To draw the chart, we need the max count
                    const maxPurpose = Math.max(1, ...purposeList.map(p => p.count));
                    const maxCountry = Math.max(1, ...finalCountryList.map(c => c.count));
                    const maxFunding = Math.max(1, ...fundingList.map(f => f.count));

                    this.dashboardStats = {
                        total,
                        missingDecisions,
                        warnings,
                        purposeList, maxPurpose,
                        countryList: finalCountryList, maxCountry,
                        fundingList, maxFunding
                    };
                },
                
                async fetchData() {
                    try {
                        const ts = Date.now();
                        const [resP, resA1, resA2, resA3] = await Promise.all([
                            fetch(`${API_URL}/items/personnels?limit=1000&_t=${ts}`, { headers: { 'Authorization': 'Bearer mvp-static-token-999' } }),
                            fetch(`${API_URL}/items/appendix1?limit=2000&_t=${ts}`, { headers: { 'Authorization': 'Bearer mvp-static-token-999' } }),
                            fetch(`${API_URL}/items/appendix2?limit=2000&_t=${ts}`, { headers: { 'Authorization': 'Bearer mvp-static-token-999' } }),
                            fetch(`${API_URL}/items/appendix3?limit=2000&_t=${ts}`, { headers: { 'Authorization': 'Bearer mvp-static-token-999' } })
                        ]);
                        
                        const [jsonP, jsonA1, jsonA2, jsonA3] = await Promise.all([
                            resP.json(), resA1.json(), resA2.json(), resA3.json()
                        ]);
                        
                        if (jsonP.data) {
                            this.personnel = jsonP.data.filter(p => !p.isDeleted).map(p => {
                                p.trips = jsonA1.data ? jsonA1.data.filter(a => a.personnelId === p.id) : [];
                                p.relatives = jsonA2.data ? jsonA2.data.filter(a => a.personnelId === p.id && !a.isDeleted) : [];
                                
                                const a3 = jsonA3.data ? jsonA3.data.filter(a => a.personnelId === p.id) : [];
                                p.flags = a3.length > 0 ? a3[0] : {};
                                
                                // Map old properties for legacy UI compatibility in pl1, pl2, pl3
                                if (p.trips.length > 0) {
                                    const t = p.trips[0];
                                    p.hktt = t.thuongTru || p.hktt;
                                    p.currentAddress = t.tamTru || p.currentAddress;
                                    p.passportPersonal = t.hcCaNhan || p.passportPersonal;
                                    p.passportOfficial = t.hcCongVu || p.passportOfficial;
                                    p.tcctResult = t.kqThamTra || p.tcctResult;
                                }
                                
                                p.flags.noPermission = p.flags.vpChuaPhep || p.flags.noPermission;
                                p.flags.partyDiscipline = p.flags.klDang || p.flags.partyDiscipline;
                                p.flags.govDiscipline = p.flags.klChinhQuyen || p.flags.govDiscipline;
                                p.flags.investigating = p.flags.thamNhung || p.flags.investigating; 
                                p.flags.politicalIssue = p.flags.trongYeu || p.flags.politicalIssue;
                                p.flags.otherIssue = p.flags.otherFlags || p.flags.otherIssue;
                                p.flags.lawViolation = p.flags.vpNuocNgoai || p.flags.lawViolation;
                                p.flags.overstay = p.flags.vpQuaHan || p.flags.overstay;
                                p.flags.managed = p.flags.dienQuanLy || p.flags.managed;
                                p.flags.gift = p.flags.receivedGiftOver50M || p.flags.gift;
                                p.flags.rent = p.flags.rentHouseToForeigner || p.flags.rent;
                                p.flags.fdi = p.flags.workInForeignCompany || p.flags.fdi;
                                
                                p.trips.forEach(tr => {
                                    // PL1 Mapping
                                    tr.soQuyetDinh = tr.decisionNumber || tr.soQuyetDinh;
                                    tr.soQuyetDinhDate = tr.decisionDate || tr.soQuyetDinhDate;
                                    tr.coQuanBanHanh = tr.decisionIssuer || tr.coQuanBanHanh;
                                    tr.ngayXuatCanh = tr.departureDate || tr.ngayXuatCanh;
                                    tr.ngayNhapCanh = tr.arrivalDate || tr.ngayNhapCanh;
                                    tr.quocGia = tr.countryName || tr.quocGia;
                                    tr.soLan = tr.tripCount || tr.soLan;
                                    tr.mucDich = tr.purposeName || tr.mucDich;
                                    tr.nguonKinhPhi = tr.fundingName || tr.nguonKinhPhi;
                                    tr.nopHoChieu = tr.nopHC || tr.nopHoChieu;
                                    tr.baoCaoKetQua = tr.report || tr.baoCaoKetQua;
                                    
                                    // Inject flags into trip for PL1 layout
                                    tr.vpChuaPhep = p.flags.vpChuaPhep || tr.vpChuaPhep;
                                    tr.vpNuocNgoai = p.flags.vpNuocNgoai || tr.vpNuocNgoai;
                                    tr.vpQuaHan = p.flags.vpQuaHan || tr.vpQuaHan;
                                    tr.klDang = p.flags.klDang || tr.klDang;
                                    tr.klChinhQuyen = p.flags.klChinhQuyen || tr.klChinhQuyen;
                                    tr.xlplNuocSoTai = p.flags.xlplNuocSoTai || tr.xlplNuocSoTai;
                                    tr.xlplVietNam = p.flags.xlplVietNam || tr.xlplVietNam;
                                    
                                    // PL3 Mapping
                                    tr.trainType = tr.trainingType || tr.trainType;
                                    tr.trainLoc = tr.trainingPlace || tr.trainLoc;
                                    tr.trainRole = tr.trainingRole || tr.trainRole;
                                    tr.trainAgency = tr.sponsorUnit || tr.trainAgency;
                                    tr.funding = tr.fundingName || tr.funding;
                                    tr.trainTime = tr.trainingTime || tr.trainTime;
                                    tr.leader = tr.workRole || tr.leader;
                                    tr.members = tr.workMembers || tr.members;
                                    tr.count = tr.workMemberCount || tr.count;
                                    tr.qd = tr.decisionNumber || tr.qd;
                                    tr.qdDate = tr.decisionDate || tr.qdDate;
                                    tr.agency = tr.decisionIssuer || tr.agency;
                                    tr.exit = tr.departureDate || tr.exit;
                                    tr.enter = tr.arrivalDate || tr.enter;
                                    tr.times = tr.tripCount || tr.times;
                                    tr.country = tr.countryName || tr.country;
                                    tr.purpose = tr.purposeName || tr.purpose;
                                });
                                
                                return p;
                            });
                            this.updateDashboard();
                        }
                    } catch (e) {
                        console.error("Lỗi kết nối DB:", e);
                    }
                },
                async fetchLogs() {
                    try {
                        const res = await fetch(`${API_URL}/activity?sort=-timestamp&limit=50&fields=*,user.first_name,user.email,revisions.*`, {
                            headers: { 'Authorization': 'Bearer mvp-static-token-999' }
                        });
                        const json = await res.json();
                        if (json.data) {
                            const fieldMap = {};
                            this.systemFields.forEach(f => fieldMap[f.key] = f.label);
                            const relFields = [
                                { key: 'relation', label: 'Quan hệ' }, { key: 'name', label: 'Họ và tên' },
                                { key: 'birthYear', label: 'Năm sinh' }, { key: 'currentAddress', label: 'Nơi cư trú' },
                                { key: 'job', label: 'Nghề nghiệp/Nơi làm việc' }, { key: 'country', label: 'Quốc gia (Yếu tố NN)' },
                                { key: 'time', label: 'Thời gian ở NN' }, { key: 'unit', label: 'Cơ quan/Tổ chức NN' },
                                { key: 'funding', label: 'Nguồn kinh phí' }, { key: 'currentWork', label: 'Công việc hiện tại (NN)' },
                                { key: 'married', label: 'Kết hôn với người NN' }, { key: 'fdi', label: 'Làm việc cho FDI' }
                            ];
                            relFields.forEach(f => fieldMap[f.key] = f.label);

                            this.globalAuditLogs = json.data
                                .filter(log => log.collection === 'personnels' || log.collection === 'relatives')
                                .map(log => {
                                    let fieldTxt = '';
                                    let detailsTxt = '';
                                    
                                    if (log.revisions && log.revisions.length > 0 && log.revisions[0].delta) {
                                        const delta = log.revisions[0].delta;
                                        const fieldsUpdated = [];
                                        Object.keys(delta).forEach(k => {
                                            if (k !== 'id' && k !== 'flags' && k !== 'personnelId') {
                                                const label = fieldMap[k] || k;
                                                fieldsUpdated.push(label);
                                            }
                                        });
                                        if (fieldsUpdated.length > 0) {
                                            fieldTxt = fieldsUpdated.join(', ');
                                            detailsTxt = log.action === 'create' ? 'Nhập dữ liệu các trường: ' + fieldTxt : 'Cập nhật thay đổi các trường: ' + fieldTxt;
                                        }
                                        if (log.action === 'delete') {
                                            detailsTxt = 'Xóa hồ sơ khỏi hệ thống';
                                        }
                                    }
                                    
                                    return {
                                        id: log.id,
                                        time: new Date(log.timestamp).toLocaleString('vi-VN'),
                                        user: log.user && log.user.first_name ? log.user.first_name : (log.user && log.user.email ? log.user.email : 'System Admin'),
                                        role: log.user ? log.user.email : 'admin@system.com',
                                        action: log.action === 'create' ? 'THÊM MỚI' : (log.action === 'update' ? 'CẬP NHẬT' : 'XÓA'),
                                        entity: (log.collection === 'personnels' ? 'Cán bộ ' : 'Thân nhân ') + log.item,
                                        field: fieldTxt,
                                        oldValue: '',
                                        newValue: '',
                                        details: detailsTxt || 'Thay đổi dữ liệu hệ thống'
                                    };
                                });
                        }
                    } catch (e) {
                        console.error("Lỗi fetch Logs:", e);
                    }
                },
                
                get filteredPersonnel() {
                    if (!this.searchQuery) return this.personnel;
                    const q = this.searchQuery.toLowerCase();
                    return this.personnel.filter(p => 
                        (p.name && p.name.toLowerCase().includes(q)) || 
                        (p.cccd && p.cccd.includes(q)) ||
                        (p.code && p.code.toLowerCase().includes(q))
                    );
                },
                
                getDepartmentName(id) {
                    if(!id) return 'Chưa phân bổ';
                    const dept = this.departments.find(d => d.id === id);
                    return dept ? dept.name : 'Chưa phân bổ';
                },
                
                generateNextId(prefix, existingIds) {
                    let maxNum = 0;
                    for (let id of existingIds) {
                        if (id && id.startsWith(prefix)) {
                            const numPart = id.substring(prefix.length);
                            const num = parseInt(numPart, 10);
                            if (!isNaN(num) && num > maxNum) {
                                maxNum = num;
                            }
                        }
                    }
                    const nextNum = maxNum + 1;
                    return prefix + String(nextNum).padStart(4, '0');
                },
                
                openPanel(person) {
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
                    if (!this.formData.custom_data) this.formData.custom_data = {};
                    if (!this.formData.relatives) this.formData.relatives = [];
                    // Flatten custom_data array fields
                    for(let k in this.formData.custom_data) {
                        if (Array.isArray(this.formData.custom_data[k])) {
                            this.formData[k] = this.formData.custom_data[k];
                        }
                    }
                    
                    // Initialize dynamic multiple groups
                    const allMaps = [...this.importMappingPersonnel, ...this.importMappingRelative];
                    for(let g of allMaps) {
                        if(g.isMultiple && g.group) {
                            if(!this.formData[g.group]) {
                                this.formData[g.group] = [];
                            }
                            if(this.formData[g.group].length === 0) {
                                this.formData[g.group].push({});
                            }
                        }
                    }
                    
                    // Flatten single custom fields
                    if (this.formData.custom_data) {
                        for (let k in this.formData.custom_data) {
                            if(!Array.isArray(this.formData.custom_data[k])) {
                                this.formData[k] = this.formData.custom_data[k];
                            }
                        }
                    }

                    // Ensure relatives have foreignInfo
                    this.formData.relatives.forEach(r => {
                        if (!r.foreignInfo) r.foreignInfo = {};
                        if (!r.custom_data) r.custom_data = {};
                        if (r.custom_data) {
                            for (let k in r.custom_data) r[k] = r.custom_data[k];
                        }
                    });
                    
                    // Ensure trips have flattened custom fields
                    this.formData.trips.forEach(t => {
                        if (!t.custom_data) t.custom_data = {};
                        if (t.custom_data) {
                            for (let k in t.custom_data) t[k] = t.custom_data[k];
                        }
                    });
                    
                    this.activeTab = 'canhan';
                    this.isPanelOpen = true;
                },
                
                closePanel() {
                    this.isPanelOpen = false;
                },
                
                
                async deleteCascade(personnelIds) {
                    try {
                        const coll = 'appendix2'; // Only soft delete relatives
                        const res = await fetch(`${API_URL}/items/${coll}?filter[personnelId][_in]=${personnelIds.join(',')}&fields=id`, {
                            headers: { 'Authorization': 'Bearer mvp-static-token-999' }
                        });
                        if(res.ok) {
                            const data = await res.json();
                            if(data.data && data.data.length > 0) {
                                const childIds = data.data.map(i => i.id);
                                await fetch(`${API_URL}/items/${coll}`, {
                                    method: 'PATCH',
                                    headers: { 
                                        'Authorization': 'Bearer mvp-static-token-999',
                                        'Content-Type': 'application/json'
                                    },
                                    body: JSON.stringify({ keys: childIds, data: { isDeleted: true } })
                                });
                            }
                        }
                    } catch(e) { console.error('Cascade error', e); }
                },
                async deleteSelected() {
                    if (!this.isAdmin()) return;
                    if (!confirm(`Bạn có chắc chắn muốn xóa ${this.selectedIds.length} cán bộ đã chọn? Các bản ghi phụ lục liên quan có thể sẽ không bị xóa hoàn toàn khỏi CSDL nhưng sẽ không hiển thị nữa.`)) return;
                    
                    try {
                        await this.deleteCascade(this.selectedIds);
                        const res = await fetch(`${API_URL}/items/personnels`, {
                            method: 'PATCH',
                            headers: { 
                                'Authorization': 'Bearer mvp-static-token-999',
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ keys: this.selectedIds, data: { isDeleted: true } })
                        });
                        
                        if (res.ok) {
                            alert('Xóa thành công!');
                            this.selectedIds = [];
                            await this.fetchData();
                        } else {
                            alert('Có lỗi xảy ra khi xóa!');
                        }
                    } catch(e) {
                        alert('Lỗi: ' + e.message);
                    }
                },
                async deleteData() {
                    if (!this.selectedPerson) return;
                    if (!confirm('Bạn có chắc chắn muốn xóa toàn bộ hồ sơ của cán bộ này?')) return;
                    
                    try {
                        await this.deleteCascade([this.selectedPerson.id]);
                        const res = await fetch(`${API_URL}/items/personnels/${this.selectedPerson.id}`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer mvp-static-token-999' },
                            body: JSON.stringify({ isDeleted: true })
                        });
                        
                        if (res.ok) {
                            alert('Xóa thành công!');
                            this.closePanel();
                            this.fetchData();
                        } else {
                            alert('Có lỗi xảy ra khi xóa!');
                        }
                    } catch(e) {
                        alert('Lỗi: ' + e.message);
                    }
                },
                async saveData() {
                    try {
                        const method = this.selectedPerson ? 'PATCH' : 'POST';
                        const url = this.selectedPerson 
                            ? `${API_URL}/items/personnels/${this.selectedPerson.id}` 
                            : `${API_URL}/items/personnels`;
                        
                        // Lấy riêng trips và flags trước khi gửi payload
                        const payload = JSON.parse(JSON.stringify(this.formData));
                        const trips = payload.trips || [];
                        const relatives = payload.relatives || [];
                        delete payload.trips;
                        delete payload.relatives;
                        
                        const appendix3Keys = ['trongYeu', 'thamNhung', 'otherFlags', 'klDang', 'klChinhQuyen', 'vpChuaPhep', 'vpNuocNgoai', 'vpQuaHan', 'dienQuanLy', 'receivedGiftOver50M', 'rentHouseToForeigner', 'workInForeignCompany', 'loiKeo', 'kl_chung', 'marriedToForeigner'];
                        const flags = payload.flags || {};
                        for(let k of appendix3Keys) {
                            if(payload[k] !== undefined) {
                                flags[k] = payload[k];
                                delete payload[k];
                            }
                        }
                        delete payload.flags;

                        // Regroup custom_data for personnel
                        payload.custom_data = {};
                        for (let g of this.importMappingPersonnel) {
                            if (g.isMultiple && payload[g.group]) {
                                payload.custom_data[g.group] = payload[g.group];
                                delete payload[g.group];
                            } else {
                                for (let c of g.columns) {
                                    if (c.id && c.id.startsWith('custom_')) {
                                        if (payload[c.id] !== undefined) {
                                            payload.custom_data[c.id] = payload[c.id];
                                            delete payload[c.id];
                                        }
                                    }
                                }
                            }
                        }
                        
                        // Regroup custom_data for trips
                        trips.forEach(t => {
                            t.custom_data = {};
                            for (let g of this.importMappingPersonnel) {
                                for (let c of g.columns) {
                                    if (c.id && c.id.startsWith('custom_') && t[c.id] !== undefined) {
                                        t.custom_data[c.id] = t[c.id];
                                        delete t[c.id];
                                    }
                                }
                            }
                        });
                        
                        // Regroup custom_data for relatives
                        relatives.forEach(r => {
                            r.custom_data = {};
                            for (let g of this.importMappingRelative) {
                                for (let c of g.columns) {
                                    if (c.id && c.id.startsWith('custom_') && r[c.id] !== undefined) {
                                        r.custom_data[c.id] = r[c.id];
                                        delete r[c.id];
                                    }
                                }
                            }
                        });
                        
// Xóa các trường trống hoặc không hợp lệ khỏi JSON
                        Object.keys(payload).forEach(k => {
                            if (payload[k] === "") payload[k] = null;
                        });
                        if (!this.selectedPerson && !payload.id) {
                            const resIds = await fetch(`${API_URL}/items/personnels?fields=id&limit=10000`, { headers: { 'Authorization': 'Bearer mvp-static-token-999' } });
                            const jsonIds = await resIds.json();
                            const allCbIds = jsonIds.data ? jsonIds.data.map(i => i.id) : [];
                            payload.id = this.generateNextId('CB_', allCbIds);
                        }
                        
                        const res = await fetch(url, {
                            method: method,
                            headers: { 
                                'Content-Type': 'application/json',
                                'Authorization': 'Bearer mvp-static-token-999'
                            },
                            body: JSON.stringify(payload)
                        });
                        
                        if(res.ok) {
                            // Xử lý lưu Trips (Phụ lục 1)
                            const originalTripIds = (this.selectedPerson && this.selectedPerson.trips) ? this.selectedPerson.trips.map(t => t.id) : [];
                            
                            const mappedTrips = trips.filter(t => t.countryName || t.country).map(t => {
                                const m = {
                                    id: t.id || ('trip_' + Date.now() + Math.floor(Math.random()*1000)),
                                    personnelId: payload.id,
                                    decisionNumber: t.decisionNumber || null,
                                    decisionDate: t.decisionDate || null,
                                    decisionIssuer: t.decisionIssuer || null,
                                    departureDate: t.departureDate || null,
                                    arrivalDate: t.arrivalDate || null,
                                    countryName: t.countryName || null,
                                    tripCount: t.tripCount ? parseInt(t.tripCount) : null,
                                    purposeName: t.purposeName || null,
                                    fundingName: t.fundingName || null,
                                    trainingType: t.trainingType || null,
                                    trainingPlace: t.trainingPlace || null,
                                    trainingRole: t.trainingRole || null,
                                    sponsorUnit: t.sponsorUnit || null,
                                    trainingTime: t.trainingTime || null,
                                    workRole: t.workRole || null,
                                    workMembers: t.workMembers || null,
                                    workMemberCount: t.workMemberCount ? parseInt(t.workMemberCount) : null,
                                    report: t.report || null,
                                    nopHC: t.nopHC || null,
                                    custom_data: t.custom_data || null
                                };
                                return m;
                            });
                            
                            const currentTripIds = mappedTrips.map(t => t.id).filter(id => id);
                            const deletedTripIds = originalTripIds.filter(id => !currentTripIds.includes(id));
                            
                            // Xóa trips đã xóa
                            for (const id of deletedTripIds) {
                                await fetch(`${API_URL}/items/appendix1/${id}`, {
                                    method: 'DELETE',
                                    headers: { 'Authorization': 'Bearer mvp-static-token-999' }
                                });
                            }
                            
                            // Thêm hoặc Cập nhật trips
                            for (const trip of mappedTrips) {
                                const m = trip.id && this.selectedPerson && this.selectedPerson.trips && this.selectedPerson.trips.some(t => t.id === trip.id) ? 'PATCH' : 'POST';
                                const u = m === 'PATCH' ? `${API_URL}/items/appendix1/${trip.id}` : `${API_URL}/items/appendix1`;
                                const r = await fetch(u, {
                                    method: m,
                                    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer mvp-static-token-999' },
                                    body: JSON.stringify(trip)
                                });
                                if (!r.ok) console.error("Lỗi lưu Phụ lục 1:", await r.text());
                            }
                            
                            // Xử lý lưu Flags (Phụ lục 3)
                            const mappedFlags = {
                                id: flags.id || ('a3_' + Date.now() + Math.floor(Math.random()*1000)),
                                personnelId: payload.id,
                                trongYeu: flags.trongYeu || null,
                                thamNhung: flags.thamNhung || null,
                                loiKeo: flags.loiKeo || null,
                                kl_chung: flags.kl_chung || null,
                                otherFlags: flags.otherFlags || null,
                                klDang: flags.klDang || null,
                                klChinhQuyen: flags.klChinhQuyen || null,
                                vpChuaPhep: flags.vpChuaPhep || null,
                                vpNuocNgoai: flags.vpNuocNgoai || null,
                                vpQuaHan: flags.vpQuaHan || null,
                                dienQuanLy: flags.dienQuanLy || null,
                                receivedGiftOver50M: flags.receivedGiftOver50M || null,
                                rentHouseToForeigner: flags.rentHouseToForeigner || null,
                                workInForeignCompany: flags.workInForeignCompany || null,
                                marriedToForeigner: flags.marriedToForeigner || null
                            };
                            
                            const isNewFlag = !(flags.id && this.selectedPerson && this.selectedPerson.flags && this.selectedPerson.flags.id);
                            if (!isNewFlag) {
                                const r = await fetch(`${API_URL}/items/appendix3/${flags.id}`, {
                                    method: 'PATCH',
                                    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer mvp-static-token-999' },
                                    body: JSON.stringify(mappedFlags)
                                });
                                if (!r.ok) console.error("Lỗi lưu Phụ lục 3:", await r.text());
                            } else {
                                if (Object.values(mappedFlags).some(v => v !== null && v !== payload.id && v !== mappedFlags.id)) {
                                    const r = await fetch(`${API_URL}/items/appendix3`, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer mvp-static-token-999' },
                                        body: JSON.stringify(mappedFlags)
                                    });
                                    if (!r.ok) console.error("Lỗi lưu Phụ lục 3:", await r.text());
                                }
                            }

                            // Xử lý lưu Thân nhân (Phụ lục 2)
                            const originalRelativeIds = (this.selectedPerson && this.selectedPerson.relatives) ? this.selectedPerson.relatives.map(t => t.id) : [];
                            
                            let allTnIds = [];
                            if (relatives.some(r => !r.id)) {
                                const resRelIds = await fetch(`${API_URL}/items/appendix2?fields=id&limit=10000`, { headers: { 'Authorization': 'Bearer mvp-static-token-999' } });
                                const jsonRelIds = await resRelIds.json();
                                allTnIds = jsonRelIds.data ? jsonRelIds.data.map(i => i.id) : [];
                            }

                            const mappedRelatives = relatives.filter(r => r.relativeName).map(r => {
                                const m = {
                                    id: r.id || ('rel_' + Date.now() + Math.floor(Math.random()*1000)),
                                    personnelId: payload.id,
                                    relationshipName: r.relationshipName || null,
                                    relativeName: r.relativeName || null,
                                    birthYear: r.birthYear || null,
                                    currentAddress: r.currentAddress || null,
                                    occupation: r.occupation || null,
                                    studyWorkAddress: r.studyWorkAddress || null,
                                    countryName: r.countryName || null,
                                    timeAbroad: r.timeAbroad || null,
                                    unitAbroad: r.unitAbroad || null,
                                    fundingName: r.fundingName || null,
                                    currentUnit: r.currentUnit || null,
                                    marriedToForeigner: r.marriedToForeigner || null,
                                    workInForeignCompany: r.workInForeignCompany || null,
                                    xlplNuocSoTai: r.xlplNuocSoTai || null,
                                    xlplVietNam: r.xlplVietNam || null,
                                    custom_data: r.custom_data || null
                                };
                                return m;
                            });
                            
                            const currentRelativeIds = mappedRelatives.map(r => r.id).filter(id => id);
                            const deletedRelativeIds = originalRelativeIds.filter(id => !currentRelativeIds.includes(id));
                            
                            for (const id of deletedRelativeIds) {
                                await fetch(`${API_URL}/items/appendix2/${id}`, {
                                    method: 'PATCH',
                                    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer mvp-static-token-999' },
                                    body: JSON.stringify({ isDeleted: true })
                                });
                            }
                            
                            for (const rel of mappedRelatives) {
                                const isNewRel = !(rel.id && this.selectedPerson && this.selectedPerson.relatives && this.selectedPerson.relatives.some(r => r.id === rel.id));
                                if (!isNewRel) {
                                    const r = await fetch(`${API_URL}/items/appendix2/${rel.id}`, {
                                        method: 'PATCH',
                                        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer mvp-static-token-999' },
                                        body: JSON.stringify(rel)
                                    });
                                    if (!r.ok) console.error("Lỗi lưu Phụ lục 2:", await r.text());
                                } else {
                                    if(rel.relativeName || rel.relationshipName) {
                                        const r = await fetch(`${API_URL}/items/appendix2`, {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer mvp-static-token-999' },
                                            body: JSON.stringify(rel)
                                        });
                                        if (!r.ok) console.error("Lỗi lưu Phụ lục 2:", await r.text());
                                    }
                                }
                            }

                            this.closePanel();
                            await this.fetchData();
                            await this.fetchLogs(); 
                            alert("Đã lưu thành công Cán bộ, Thân nhân, Chuyến đi và Thông tin lưu ý vào Database!");
                        } else {
                            const err = await res.json();
                            alert("Lỗi khi lưu dữ liệu: " + (err.errors?.[0]?.message || 'Lỗi không xác định'));
                        }
                    } catch (e) {
                        console.error(e);
                        alert("Lỗi kết nối tới Database");
                    }
                    // Optional alert to confirm success
                    // alert("Đã lưu thành công (Chế độ giả lập)! Vui lòng kiểm tra Nhật ký Hệ thống.");
                }
            }))
        })
    