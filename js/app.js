// js/app.js
import { AppService } from './services/appService.js';
import { Toast } from './components/toast.js';
// Import pages later

const App = {
    async init() {
        try {
            // 1. Load Master Data
            await AppService.loadMasterData();
            
            // 2. Setup navigation
            this.setupNavigation();
            
            // 3. Load default page based on Hash
            const hash = window.location.hash.replace('#', '') || 'dashboard';
            this.navigateTo(hash);
            
            // 4. Listen to hash changes
            window.addEventListener('hashchange', () => {
                const newHash = window.location.hash.replace('#', '') || 'dashboard';
                this.navigateTo(newHash);
            });
            
        } catch(e) {
            console.error("Khởi tạo ứng dụng thất bại", e);
            document.getElementById('page-container').innerHTML = `
                <div style="text-align: center; margin-top: 50px; color: red;">
                    <h3>Lỗi khởi tạo hệ thống!</h3>
                    <p>Vui lòng kiểm tra xem json-server đã chạy chưa.</p>
                </div>
            `;
        }
    },

    setupNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const target = item.getAttribute('data-target');
                window.location.hash = target;
            });
        });
    },

    async navigateTo(page) {
        // Update active class
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(nav => nav.classList.remove('active'));
        const activeNav = document.querySelector(`.nav-item[data-target="${page}"]`);
        if (activeNav) activeNav.classList.add('active');

        const container = document.getElementById('page-container');
        container.innerHTML = ''; // clear

        switch(page) {
            case 'dashboard':
                await this.renderDashboard(container);
                break;
            case 'personnel':
                // Lazy load personnel page
                import('./pages/personnel.js').then(m => m.PersonnelPage.render(container));
                break;
            case 'appendix1':
                import('./pages/appendix1.js').then(m => m.Appendix1Page.render(container));
                break;
            case 'appendix2':
                import('./pages/appendix2.js').then(m => m.Appendix2Page.render(container));
                break;
            case 'appendix3':
                import('./pages/appendix3.js').then(m => m.Appendix3Page.render(container));
                break;
            case 'masterdata':
                import('./pages/masterdata.js').then(m => m.MasterDataPage.render(container));
                break;
            default:
                container.innerHTML = '<h3>Page not found</h3>';
        }
    },

    async renderDashboard(container) {
        container.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 20px;">
                <h2 style="margin:0;"><i class="fas fa-chart-pie"></i> Bảng điều khiển (Dashboard)</h2>
                <div style="color: #666; font-style: italic;">Cập nhật lần cuối: ${new Date().toLocaleTimeString('vi-VN')}</div>
            </div>
            <div id="dash-content">Đang tải dữ liệu...</div>
        `;

        try {
            const stats = await AppService.getDashboardStats();
            
            const dashContent = document.getElementById('dash-content');
            dashContent.innerHTML = `
                <style>
                    .stat-card { background: white; border-radius: 8px; padding: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); display: flex; align-items: center; gap: 20px; transition: transform 0.2s; }
                    .stat-card:hover { transform: translateY(-5px); box-shadow: 0 6px 12px rgba(0,0,0,0.1); }
                    .stat-icon { width: 60px; height: 60px; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 24px; color: white; }
                    .stat-info { flex: 1; }
                    .stat-num { font-size: 28px; font-weight: bold; margin: 0; color: #333; }
                    .stat-label { font-size: 14px; color: #666; margin: 0; text-transform: uppercase; letter-spacing: 0.5px; }
                    
                    .c-blue { background: linear-gradient(135deg, #36b9cc 0%, #1e8596 100%); }
                    .c-green { background: linear-gradient(135deg, #1cc88a 0%, #13855c 100%); }
                    .c-yellow { background: linear-gradient(135deg, #f6c23e 0%, #dda20a 100%); }
                    .c-purple { background: linear-gradient(135deg, #6f42c1 0%, #4e2d8b 100%); }

                    .chart-container { background: white; border-radius: 8px; padding: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); margin-top: 30px; }
                    .chart-title { font-size: 16px; font-weight: bold; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-bottom: 20px; }
                    
                    .bar-row { display: flex; align-items: center; margin-bottom: 15px; }
                    .bar-label { width: 200px; font-weight: 500; font-size: 14px; }
                    .bar-track { flex: 1; background: #eee; height: 20px; border-radius: 10px; overflow: hidden; }
                    .bar-fill { height: 100%; display: flex; align-items: center; justify-content: flex-end; padding-right: 10px; color: white; font-size: 12px; font-weight: bold; transition: width 1s; }
                </style>

                <div class="row">
                    <div class="col-md-3">
                        <div class="stat-card">
                            <div class="stat-icon c-blue"><i class="fas fa-users"></i></div>
                            <div class="stat-info">
                                <p class="stat-label">Tổng Cán Bộ</p>
                                <p class="stat-num">${stats.totalPersonnel}</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="stat-card">
                            <div class="stat-icon c-green"><i class="fas fa-plane-departure"></i></div>
                            <div class="stat-info">
                                <p class="stat-label">Đã đi NN (Người)</p>
                                <p class="stat-num">${stats.wentAbroad}</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="stat-card">
                            <div class="stat-icon c-yellow"><i class="fas fa-user-friends"></i></div>
                            <div class="stat-info">
                                <p class="stat-label">Có TN Nước ngoài</p>
                                <p class="stat-num">${stats.hasRelativesAbroad}</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="stat-card">
                            <div class="stat-icon c-purple"><i class="fas fa-passport"></i></div>
                            <div class="stat-info">
                                <p class="stat-label">Tổng chuyến đi</p>
                                <p class="stat-num">${stats.totalTrips}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="row">
                    <div class="col-md-6">
                        <div class="chart-container">
                            <div class="chart-title">Tỷ lệ Cán bộ có yếu tố nước ngoài</div>
                            <div class="bar-row">
                                <div class="bar-label">Đã đi nước ngoài</div>
                                <div class="bar-track">
                                    <div class="bar-fill c-green" style="width: ${Math.round((stats.wentAbroad / Math.max(1, stats.totalPersonnel)) * 100)}%">${Math.round((stats.wentAbroad / Math.max(1, stats.totalPersonnel)) * 100)}%</div>
                                </div>
                            </div>
                            <div class="bar-row">
                                <div class="bar-label">Có thân nhân ở NN</div>
                                <div class="bar-track">
                                    <div class="bar-fill c-yellow" style="width: ${Math.round((stats.hasRelativesAbroad / Math.max(1, stats.totalPersonnel)) * 100)}%">${Math.round((stats.hasRelativesAbroad / Math.max(1, stats.totalPersonnel)) * 100)}%</div>
                                </div>
                            </div>
                            <div class="bar-row">
                                <div class="bar-label">Chưa có yếu tố NN</div>
                                <div class="bar-track">
                                    <div class="bar-fill" style="background: #999; width: ${Math.round(((stats.totalPersonnel - stats.wentAbroad) / Math.max(1, stats.totalPersonnel)) * 100)}%">${Math.round(((stats.totalPersonnel - stats.wentAbroad) / Math.max(1, stats.totalPersonnel)) * 100)}%</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="chart-container" style="min-height: 200px; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; color: #666;">
                            <i class="fas fa-chart-line" style="font-size: 40px; color: #ddd; margin-bottom: 15px;"></i>
                            <p>Đồ thị nâng cao sẽ được cập nhật<br>trong các phiên bản tiếp theo.</p>
                        </div>
                    </div>
                </div>
            `;
        } catch(e) {
            document.getElementById('dash-content').innerHTML = '<p style="color:red">Không thể tải dữ liệu thống kê.</p>';
        }
    }
};

// Khởi chạy app khi DOM ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

export { App };
