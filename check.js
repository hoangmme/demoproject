        const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
            ? 'http://localhost:8055' 
            : '/api';
        document.addEventListener('alpine:init', () => {
            Alpine.data('appData', () => ({
                
                personnel: [
                    {
                        id: 'CB01',
                        code: 'NV001',
                        name: 'Nguyễn Văn A',
                        otherName: 'Bảy A',
                        birthYear: '1980-05-12',
                        ethnicity: 'Kinh',
                        religion: 'Không',
                        hometown: 'Thanh Hóa',
                        departmentId: 'D1',
                        cccd: '001080123456',
                        hktt: 'Ba Đình, Hà Nội',
                        currentAddress: 'Đống Đa, Hà Nội',
                        passportPersonal: 'B1234567',
                        passportOfficial: 'C7654321',
                        position: 'Trưởng phòng',
                        tcctResult: 'Đủ điều kiện tiêu chuẩn chính trị (Theo KL số 123 ngày 01/01/2023)',
                        
                        // Lịch sử chuyến đi
                        trips: [
                            {
                                id: 'TR01',
                                qd: '123/QĐ-UBND',
                                qdDate: '2023-01-10',
                                agency: 'UBND TP Hà Nội',
                                exit: '2023-02-01',
                                enter: '2023-02-15',
                                country: 'Nhật Bản',
                                times: 1,
                                purpose: 'Công tác',
                                funding: 'Ngân sách NN',
                                submittedPassport: 'X',
                                submittedReport: 'X',
                                trainType: 'Bồi dưỡng ngắn hạn',
                                trainLoc: 'Đại học Tokyo',
                                trainRole: 'Học viên',
                                trainAgency: 'Sở Nội vụ',
                                trainTime: '01/02/2023 - 15/02/2023',
                                leader: 'Nguyễn Văn A',
                                members: 'Trần Thị B, Lê Văn C',
                                count: 3
                            }
                        ],
                        
                        // Cờ vi phạm & lưu ý
                        auditLogs: [
                            { id: 1, user: 'Sếp Tổng (Admin)', role: 'Admin', time: '10/08/2026 15:30', field: 'Quê quán [Cột 7]', oldValue: 'Hà Nội', newValue: 'Thanh Hóa' },
                            { id: 2, user: 'Nhân viên Nhập liệu', role: 'Editor Khối A', time: '09/08/2026 09:15', field: 'Số CCCD [Cột 12]', oldValue: '001080111111', newValue: '001080123456' },
                            { id: 3, user: 'Sếp Tổng (Admin)', role: 'Admin', time: '01/08/2026 14:00', field: 'Tôn giáo [Cột 6]', oldValue: 'Phật giáo', newValue: 'Không' }
                        ],
                        flags: {
                            politicalIssue: 'Không có biểu hiện tự diễn biến',
                            investigating: 'Không',
                            otherIssue: 'Lý lịch rõ ràng',
                            noPermission: 'Không',
                            lawViolation: 'Không',
                            overstay: 'Không',
                            partyDiscipline: 'Cảnh cáo (2022)',
                            govDiscipline: 'Khiển trách (2022)',
                            foreignLaw: 'Không',
                            vnLaw: 'Không',
                            gift: 'Nhận quà 100tr từ đối tác, đã nộp lại',
                            rent: 'Đang cho thuê 1 căn hộ tại Cầu Giấy',
                            fdi: 'Không'
                        },

                        // Thân nhân
                        relatives: [
                            {
                                id: 'TN01',
                                relation: 'Con ruột',
                                name: 'Nguyễn Văn B',
                                otherName: 'Tí',
                                birthYear: '2005-08-20',
                                hometown: 'Thanh Hóa',
                                hktt: 'Ba Đình, Hà Nội',
                                currentAddress: 'Sydney, Úc',
                                job: 'Sinh viên',
                                cccd: '001205123456',
                                nationality: 'Việt Nam',
                                content: 'Học đại học tại Úc',
                                hasForeignElement: true,
                                foreignInfo: {
                                    time: 'Từ T8/2023 đến nay',
                                    unit: 'Đại học Sydney',
                                    country: 'Úc',
                                    funding: 'Học bổng chính phủ Úc',
                                    currentWork: 'Làm thêm tại nhà hàng Úc',
                                    married: 'Chưa',
                                    fdi: 'Không',
                                    punishVN: 'Không',
                                    punishForeign: 'Bị phạt giao thông ở Úc (2024)'
                                }
                            },
                            {
                                id: 'TN02',
                                relation: 'Vợ',
                                name: 'Phạm Thị D',
                                otherName: 'Nữ',
                                birthYear: '1982-10-10',
                                hometown: 'Nghệ An',
                                hktt: 'Ba Đình, Hà Nội',
                                currentAddress: 'Đống Đa, Hà Nội',
                                job: 'Giám đốc nhân sự',
                                cccd: '001182123456',
                                nationality: 'Việt Nam',
                                content: 'Làm việc tại tập đoàn nước ngoài',
                                hasForeignElement: true,
                                foreignInfo: {
                                    time: 'Từ 2020 đến nay',
                                    unit: 'Công ty TNHH Samsung',
                                    country: 'Hàn Quốc (FDI)',
                                    funding: 'Tự túc',
                                    currentWork: 'Giám đốc nhân sự',
                                    married: 'Đã kết hôn',
                                    fdi: 'Làm việc tại cty FDI (Samsung)',
                                    punishVN: 'Không',
                                    punishForeign: 'Không'
                                }
                            }
                        ]
                    },
                    {
                        id: 'CB02',
                        code: 'NV002',
                        name: 'Trần Thị C',
                        otherName: '',
                        birthYear: '1985-11-30',
                        ethnicity: 'Tày',
                        religion: 'Phật giáo',
                        hometown: 'Đà Nẵng',
                        departmentId: 'D2',
                        cccd: '030185123456',
                        hktt: 'Hải Châu, Đà Nẵng',
                        currentAddress: 'Hải Châu, Đà Nẵng',
                        passportPersonal: 'C999888',
                        passportOfficial: 'Không có',
                        position: 'Chuyên viên',
                        tcctResult: 'Chưa thẩm tra TCCT',
                        trips: [
                            {
                                id: 'TR03',
                                qd: 'Không có',
                                qdDate: '',
                                agency: '',
                                exit: '2023-08-01',
                                enter: '2023-08-10',
                                country: 'Thái Lan',
                                times: 1,
                                purpose: 'Việc riêng',
                                funding: 'Tự túc',
                                submittedPassport: '',
                                submittedReport: '',
                                trainType: '',
                                trainLoc: '',
                                trainRole: '',
                                trainAgency: '',
                                trainTime: '',
                                leader: '',
                                members: '',
                                count: 1
                            }
                        ],
                        flags: {
                            politicalIssue: 'Không',
                            investigating: 'Đang bị thanh tra nội bộ',
                            otherIssue: 'Không',
                            noPermission: 'Đi Thái Lan tự túc không báo cáo (2023)',
                            lawViolation: 'Không',
                            overstay: 'Quá hạn 2 ngày ở Thái Lan',
                            partyDiscipline: 'Không',
                            govDiscipline: 'Không',
                            foreignLaw: 'Không',
                            vnLaw: 'Không',
                            gift: 'Không',
                            rent: 'Không',
                            fdi: 'Không'
                        },
                        relatives: []
                    }
                ],
                departments: [{id: 'D1', name: 'Phòng Kế hoạch'}, {id: 'D2', name: 'Phòng Tổ chức'}],

                departments: [],
                searchQuery: '',
                loading: true,
                
                // View state
                currentView: 'canbo',
                currentUser: null,
                loginForm: { email: '' },
                isCreateUserModalOpen: false,
                newUserForm: { name: '', email: '', role: 'editor_a' },
                users: [
                    { id: 1, name: 'Sếp Tổng (Admin)', email: 'admin@system', role: 'admin' },
                    { id: 2, name: 'Nhân viên Nhập liệu', email: 'editor@system', role: 'editor_a' },
                    { id: 3, name: 'Chuyên viên Báo cáo', email: 'viewer@system', role: 'viewer' }
                ],
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
                    if (!this.currentUser) return false;
                    return this.permissions[this.currentUser.role]?.[block] === true;
                },
                
                // Panel state
                isPanelOpen: false,
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
                        'canbo': 'Danh sách Cán bộ (Lõi)',
                        'pl1': 'Phụ lục 1: Cán bộ đi nước ngoài',
                        'pl2': 'Phụ lục 2: Thân nhân ở nước ngoài',
                        'pl3': 'Phụ lục 3: Lịch sử tiếp xúc & Lưu ý'
                    };
                    return titles[this.currentView] || titles['canbo'];
                },
                
                init() {
                    // this.fetchData(); this.fetchLogs(); // Use mock data for now
                },
                
                async fetchData() {
                    try {
                        const res = await fetch(`${API_URL}/items/personnels?limit=100`, {
                            headers: { 'Authorization': 'Bearer mvp-static-token-999' }
                        });
                        const json = await res.json();
                        if (json.data) {
                            this.personnel = json.data.map(p => {
                                p.trips = p.trips || [];
                                p.flags = p.flags || {};
                                p.relatives = p.relatives || [];
                                return p;
                            });
                        }
                    } catch (e) {
                        console.error("Lỗi kết nối DB:", e);
                    }
                },
                async fetchLogs() {
                    try {
                        const res = await fetch(`${API_URL}/activity?sort=-timestamp&limit=50&fields=*,user.first_name,user.email`, {
                            headers: { 'Authorization': 'Bearer mvp-static-token-999' }
                        });
                        const json = await res.json();
                        if (json.data) {
                            this.globalAuditLogs = json.data
                                .filter(log => log.collection === 'personnels')
                                .map(log => ({
                                    id: log.id,
                                    time: new Date(log.timestamp).toLocaleString('vi-VN'),
                                    user: log.user ? log.user.first_name : 'System Admin',
                                    role: log.user ? log.user.email : 'admin@system.com',
                                    action: log.action === 'create' ? 'THÊM MỚI' : (log.action === 'update' ? 'CẬP NHẬT' : 'XÓA'),
                                    entity: 'Hồ sơ ID: ' + log.item,
                                    field: 'Dữ liệu',
                                    oldValue: '',
                                    newValue: '',
                                    details: 'Directus Activity Track'
                                }));
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
                    if (!this.formData.relatives) this.formData.relatives = [];
                    // Ensure relatives have foreignInfo
                    this.formData.relatives.forEach(r => {
                        if (!r.foreignInfo) r.foreignInfo = {};
                    });
                    
                    this.activeTab = 'canhan';
                    this.isPanelOpen = true;
                },
                
                closePanel() {
                    this.isPanelOpen = false;
                },
                
                async saveData() {
                    try {
                        const method = this.selectedPerson ? 'PATCH' : 'POST';
                        const url = this.selectedPerson 
                            ? `${API_URL}/items/personnels/${this.selectedPerson.id}` 
                            : `${API_URL}/items/personnels`;
                        
                        // Xóa các trường trống hoặc không hợp lệ khỏi JSON
                        const payload = JSON.parse(JSON.stringify(this.formData));
                        
                        const res = await fetch(url, {
                            method: method,
                            headers: { 
                                'Content-Type': 'application/json',
                                'Authorization': 'Bearer mvp-static-token-999'
                            },
                            body: JSON.stringify(payload)
                        });
                        
                        if(res.ok) {
                            this.closePanel();
                            await this.fetchData();
                            await this.fetchLogs(); 
                            alert("Đã lưu thành công vào Database thật!");
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
