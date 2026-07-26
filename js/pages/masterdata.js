// js/pages/masterdata.js
import { AppService } from '../services/appService.js';
import { MasterDataService } from '../services/masterDataService.js';
import { Toast } from '../components/toast.js';

export const MasterDataPage = {
    async render(container) {
        this.container = container;
        
        const tabs = [
            { id: 'departments', name: 'Đơn vị công tác', icon: 'fa-building' },
            { id: 'positions', name: 'Chức vụ', icon: 'fa-id-badge' },
            { id: 'countries', name: 'Quốc gia', icon: 'fa-globe-asia' },
            { id: 'purposes', name: 'Mục đích xuất cảnh', icon: 'fa-plane' },
            { id: 'fundings', name: 'Nguồn kinh phí', icon: 'fa-money-bill-wave' },
            { id: 'relationships', name: 'Mối quan hệ', icon: 'fa-user-friends' }
        ];
        
        const tabsHtml = tabs.map((tab, idx) => `
            <button class="md-tab ${idx === 0 ? 'active' : ''}" data-type="${tab.id}">
                <i class="fas ${tab.icon}"></i> ${tab.name}
            </button>
        `).join('');

        this.container.innerHTML = `
            <style>
                .md-container { display: flex; margin-top: 20px; background: white; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); min-height: 500px; }
                .md-sidebar { width: 250px; border-right: 1px solid #eee; padding: 15px 0; }
                .md-tab { display: block; width: 100%; text-align: left; padding: 12px 20px; border: none; background: transparent; cursor: pointer; font-size: 15px; color: #555; transition: all 0.2s; }
                .md-tab:hover { background: #f8f9fa; color: #3c8dbc; }
                .md-tab.active { background: #3c8dbc; color: white; border-left: 4px solid #285e8e; font-weight: bold; }
                .md-tab i { width: 25px; }
                
                .md-content { flex: 1; padding: 30px; }
                .md-title { font-size: 20px; font-weight: bold; margin-bottom: 20px; color: #333; border-bottom: 2px solid #3c8dbc; padding-bottom: 10px; display: inline-block; }
                
                .md-list { list-style: none; padding: 0; margin: 0; }
                .md-list-item { display: flex; justify-content: space-between; align-items: center; padding: 12px 15px; border-bottom: 1px solid #eee; transition: background 0.2s; }
                .md-list-item:hover { background: #f9f9f9; }
                .md-list-item-name { font-size: 15px; font-weight: 500; }
                .md-btn-del { color: #dc3545; cursor: pointer; border: none; background: transparent; padding: 5px; font-size: 16px; opacity: 0.6; }
                .md-btn-del:hover { opacity: 1; }
                
                .md-add-box { display: flex; margin-bottom: 25px; gap: 10px; }
                .md-add-input { flex: 1; padding: 10px 15px; border: 1px solid #ddd; border-radius: 4px; outline: none; }
                .md-add-input:focus { border-color: #3c8dbc; }
                .md-btn-add { background: #28a745; color: white; border: none; padding: 0 20px; border-radius: 4px; cursor: pointer; font-weight: bold; }
                .md-btn-add:hover { background: #218838; }
            </style>

            <div class="row">
                <div class="col-md-12">
                    <h3 style="margin-top:0"><i class="fas fa-cogs"></i> Quản lý Danh mục (Master Data)</h3>
                    <p class="text-muted">Thay đổi dữ liệu tại đây sẽ ảnh hưởng đến các lựa chọn trong toàn bộ hệ thống.</p>
                </div>
            </div>
            
            <div class="md-container">
                <div class="md-sidebar">
                    ${tabsHtml}
                </div>
                <div class="md-content" id="md-render-area">
                    <!-- Nơi render list -->
                </div>
            </div>
        `;

        this.currentType = tabs[0].id;
        this.currentTitle = tabs[0].name;
        
        const tabBtns = this.container.querySelectorAll('.md-tab');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                tabBtns.forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
                this.currentType = e.currentTarget.getAttribute('data-type');
                this.currentTitle = e.currentTarget.innerText.trim();
                this.renderList();
            });
        });

        await this.renderList();
    },

    async renderList() {
        const area = document.getElementById('md-render-area');
        area.innerHTML = '<p>Đang tải dữ liệu...</p>';
        
        try {
            // Force reload master data to get fresh data
            await AppService.loadMasterData();
            const md = AppService.getMasterData();
            const items = md[this.currentType] || [];
            
            let listHtml = '';
            if (items.length === 0) {
                listHtml = '<li class="md-list-item" style="color:#999; justify-content:center;">Chưa có dữ liệu</li>';
            } else {
                listHtml = items.map(item => `
                    <li class="md-list-item">
                        <span class="md-list-item-name">${item.name}</span>
                        <button class="md-btn-del" data-id="${item.id}" title="Xóa"><i class="fas fa-trash-alt"></i></button>
                    </li>
                `).join('');
            }

            area.innerHTML = `
                <div class="md-title">${this.currentTitle}</div>
                
                <div class="md-add-box">
                    <input type="text" id="md-input-add" class="md-add-input" placeholder="Nhập tên ${this.currentTitle.toLowerCase()} mới...">
                    <button id="md-btn-submit" class="md-btn-add"><i class="fas fa-plus"></i> Thêm mới</button>
                </div>
                
                <ul class="md-list">
                    ${listHtml}
                </ul>
            `;
            
            // Event Add
            document.getElementById('md-btn-submit').addEventListener('click', () => this.handleAddItem());
            document.getElementById('md-input-add').addEventListener('keypress', (e) => {
                if(e.key === 'Enter') this.handleAddItem();
            });
            
            // Event Delete
            area.querySelectorAll('.md-btn-del').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = e.currentTarget.getAttribute('data-id');
                    this.handleDeleteItem(id);
                });
            });

        } catch (e) {
            area.innerHTML = '<p style="color:red">Lỗi khi tải dữ liệu</p>';
        }
    },
    
    async handleAddItem() {
        const input = document.getElementById('md-input-add');
        const name = input.value.trim();
        if(!name) {
            Toast.error('Vui lòng nhập tên!');
            return;
        }
        
        // Generate random ID
        const newId = `md-${Date.now()}`;
        
        try {
            await MasterDataService.create(this.currentType, { id: newId, name: name });
            Toast.success('Đã thêm thành công!');
            this.renderList();
        } catch(e) {
            Toast.error('Lỗi khi thêm mới');
        }
    },
    
    async handleDeleteItem(id) {
        if(confirm('Bạn có chắc chắn muốn xóa mục này? (Có thể gây lỗi nếu đã được sử dụng ở hồ sơ cán bộ)')) {
            try {
                await MasterDataService.remove(this.currentType, id);
                Toast.success('Đã xóa thành công!');
                this.renderList();
            } catch(e) {
                Toast.error('Lỗi khi xóa');
            }
        }
    }
};
