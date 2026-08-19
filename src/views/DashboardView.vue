<template>
  <div class="app-content">
    <!-- Top Filter Bar & Dashboard Settings Header -->
    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 1.25rem; background: #ffffff; padding: 12px 16px; border-radius: 12px; border: 1px solid #e5e7eb; box-shadow: 0 1px 3px rgba(0,0,0,0.03);">
      <div style="display: flex; align-items: center; gap: 10px;">
        <div style="width: 36px; height: 36px; border-radius: 10px; background: #e8f5e9; color: #2e7d32; display: flex; align-items: center; justify-content: center;">
          <i class="pi pi-chart-bar" style="font-size: 1.2rem;"></i>
        </div>
        <div>
          <h2 style="font-size: 1.05rem; font-weight: 700; color: #1e293b; margin: 0;">Bảng Thống kê & Giám sát</h2>
          <span style="font-size: 0.76rem; color: #64748b;">Tổng quan tình hình cán bộ, xuất nhập cảnh & thân nhân</span>
        </div>
      </div>

      <!-- Time Filter Selector -->
      <div style="display: flex; align-items: center; flex-wrap: wrap; gap: 8px;">
        <div class="time-filter-group" style="display: inline-flex; background: #f1f5f9; padding: 3px; border-radius: 8px; border: 1px solid #e2e8f0;">
          <button
            type="button"
            class="time-btn"
            :class="{ 'time-btn-active': timeFilterMode === 'all' }"
            @click="setTimeFilter('all')"
          >
            Tất cả
          </button>
          <button
            type="button"
            class="time-btn"
            :class="{ 'time-btn-active': timeFilterMode === 'week' }"
            @click="setTimeFilter('week')"
          >
            Tuần này
          </button>
          <button
            type="button"
            class="time-btn"
            :class="{ 'time-btn-active': timeFilterMode === 'month' }"
            @click="setTimeFilter('month')"
          >
            Tháng này
          </button>
          <button
            type="button"
            class="time-btn"
            :class="{ 'time-btn-active': timeFilterMode === 'year' }"
            @click="setTimeFilter('year')"
          >
            Năm nay
          </button>
          <button
            type="button"
            class="time-btn"
            :class="{ 'time-btn-active': timeFilterMode === 'custom' }"
            @click="setTimeFilter('custom')"
          >
            <i class="pi pi-calendar" style="font-size: 0.75rem;"></i> Tùy chỉnh
          </button>
        </div>

        <!-- Custom Date Range Inputs -->
        <div v-if="timeFilterMode === 'custom'" style="display: flex; align-items: center; gap: 6px;">
          <div style="width: 130px;">
            <AppDatePicker v-model="customStartDate" placeholder="Từ ngày" />
          </div>
          <span style="font-size: 0.8rem; color: #64748b;">-</span>
          <div style="width: 130px;">
            <AppDatePicker v-model="customEndDate" placeholder="Đến ngày" />
          </div>
        </div>

        <!-- Dashboard Settings Button -->
        <Button
          icon="pi pi-cog"
          label="Cài đặt cột"
          severity="secondary"
          size="small"
          outlined
          @click="isSettingsOpen = true"
          v-tooltip.top="'Tùy chỉnh ID các cột thống kê'"
          style="font-size: 0.8rem;"
        />
        <Button
          icon="pi pi-refresh"
          severity="secondary"
          size="small"
          text
          rounded
          :loading="personnelStore.loading"
          @click="refreshData"
          v-tooltip.top="'Tải lại dữ liệu'"
        />
      </div>
    </div>

    <!-- 1. Top Stat Cards (Clickable for Drill-down) -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
      <!-- Total Personnel -->
      <div class="stat-card" style="border-left: 4px solid #2e7d32;" @click="openDrilldown('all_personnel', 'Danh sách Toàn bộ Cán bộ')">
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <span class="stat-label">Tổng số Cán bộ</span>
          <i class="pi pi-users" style="color: #2e7d32; font-size: 1.1rem;"></i>
        </div>
        <div class="stat-value" style="color: #1f2937;">{{ stats.totalPersonnel }}</div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px;">
          <span class="stat-sub" style="color: #2e7d32;">Hồ sơ trong hệ thống</span>
          <span class="view-more-tag">Xem danh sách <i class="pi pi-arrow-right"></i></span>
        </div>
      </div>

      <!-- Total Trips -->
      <div class="stat-card" style="border-left: 4px solid #0284c7;" @click="openDrilldown('all_trips', 'Danh sách Lượt đi Nước ngoài')">
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <span class="stat-label">Lượt đi Nước ngoài</span>
          <i class="pi pi-send" style="color: #0284c7; font-size: 1.1rem;"></i>
        </div>
        <div class="stat-value" style="color: #0369a1;">{{ stats.filteredTrips.length }}</div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px;">
          <span class="stat-sub" style="color: #0284c7;">{{ getTimeFilterLabel() }}</span>
          <span class="view-more-tag">Xem danh sách <i class="pi pi-arrow-right"></i></span>
        </div>
      </div>

      <!-- Total Relatives -->
      <div class="stat-card" style="border-left: 4px solid #7c3aed;" @click="openDrilldown('all_relatives', 'Danh sách Thân nhân ở Nước ngoài')">
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <span class="stat-label">Thân nhân ở Nước ngoài</span>
          <i class="pi pi-globe" style="color: #7c3aed; font-size: 1.1rem;"></i>
        </div>
        <div class="stat-value" style="color: #6d28d9;">{{ stats.totalRelatives }}</div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px;">
          <span class="stat-sub" style="color: #7c3aed;">Định cư / Học tập / Làm việc</span>
          <span class="view-more-tag">Xem danh sách <i class="pi pi-arrow-right"></i></span>
        </div>
      </div>

      <!-- Missing Decision Warning Card (Configurable) -->
      <div class="stat-card stat-card-warning" style="border-left: 4px solid #dc2626;" @click="openDrilldown('missing_decision', 'Danh sách Chuyến đi Chưa có Quyết định')">
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div style="display: flex; align-items: center; gap: 4px;">
            <span class="stat-label" style="color: #991b1b; font-weight: 700;">Chưa thêm Quyết định</span>
            <button type="button" class="btn-card-setting" @click.stop="openSingleSetting('decision')" title="Cài đặt cột Số Quyết định">
              <i class="pi pi-cog"></i>
            </button>
          </div>
          <i class="pi pi-exclamation-triangle" style="color: #dc2626; font-size: 1.1rem;"></i>
        </div>
        <div class="stat-value" style="color: #dc2626;">{{ stats.missingDecisionTrips.length }}</div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px;">
          <span class="stat-sub" style="color: #b91c1c;">Cột ID: <b>{{ colConfig.decision }}</b></span>
          <span class="view-more-tag" style="color: #dc2626;">Kiểm tra <i class="pi pi-arrow-right"></i></span>
        </div>
      </div>

      <!-- Departure/Arrival Schedule Warnings Card (Configurable) -->
      <div class="stat-card" style="border-left: 4px solid #ea580c;" @click="openDrilldown('schedule_warnings', 'Cảnh báo Tiến độ Duyệt Đi / Duyệt Về / Gia Hạn')">
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div style="display: flex; align-items: center; gap: 4px;">
            <span class="stat-label" style="color: #9a3412; font-weight: 700;">Cảnh báo Duyệt Đi/Về</span>
            <button type="button" class="btn-card-setting" @click.stop="openSingleSetting('schedule')" title="Cài đặt cột Duyệt Đi/Về/Gia Hạn">
              <i class="pi pi-cog"></i>
            </button>
          </div>
          <i class="pi pi-clock" style="color: #ea580c; font-size: 1.1rem;"></i>
        </div>
        <div style="display: flex; align-items: baseline; gap: 8px; margin-top: 4px;">
          <div class="stat-value" style="color: #ea580c; font-size: 1.5rem;">
            {{ stats.extendedTrips.length + stats.overdueTrips.length }}
          </div>
          <span style="font-size: 0.72rem; color: #9a3412;">lượt cần chú ý</span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px; font-size: 0.72rem;">
          <span style="color: #b45309;">{{ stats.extendedTrips.length }} gia hạn | {{ stats.overdueTrips.length }} quá hạn</span>
          <span class="view-more-tag" style="color: #ea580c;">Chi tiết <i class="pi pi-arrow-right"></i></span>
        </div>
      </div>
    </div>

    <!-- 2. Detailed Breakdown Grid (Full Countries & Full Fundings) -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(420px, 1fr)); gap: 1.25rem; margin-bottom: 1.5rem;">
      <!-- FULL COUNTRIES CARD -->
      <div class="app-card">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.85rem; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px;">
          <div style="display: flex; align-items: center; gap: 6px;">
            <i class="pi pi-map-marker" style="color: #16a34a; font-size: 1.05rem;"></i>
            <h3 style="font-size: 0.92rem; font-weight: 700; color: #1e293b; margin: 0;">
              Thống kê Toàn bộ Quốc gia ({{ stats.countryList.length }} quốc gia)
            </h3>
            <button type="button" class="btn-card-setting" @click="openSingleSetting('country')" title="Cài đặt cột Quốc gia">
              <i class="pi pi-cog"></i>
            </button>
          </div>
          <div style="display: flex; align-items: center; gap: 6px;">
            <InputText
              v-model="countrySearch"
              placeholder="Tìm quốc gia..."
              style="font-size: 0.75rem; padding: 4px 8px; width: 140px; height: 28px;"
            />
          </div>
        </div>

        <div style="max-height: 380px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; padding-right: 4px;">
          <div
            v-for="(item, idx) in filteredCountryList"
            :key="idx"
            class="breakdown-row"
            @click="openDrilldown('country', `Danh sách Cán bộ đi: ${item.name}`, { countryName: item.name })"
          >
            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem; margin-bottom: 3px;">
              <span style="font-weight: 600; color: #334155; display: flex; align-items: center; gap: 6px;">
                <span class="badge-num">#{{ idx + 1 }}</span> {{ item.name }}
              </span>
              <div style="display: flex; align-items: center; gap: 6px;">
                <strong style="color: #16a34a;">{{ item.count }} lượt</strong>
                <i class="pi pi-chevron-right" style="font-size: 0.7rem; color: #94a3b8;"></i>
              </div>
            </div>
            <div style="height: 6px; background: #f1f5f9; border-radius: 4px; overflow: hidden;">
              <div
                :style="{ width: `${(item.count / (stats.maxCountry || 1)) * 100}%`, height: '100%', background: 'linear-gradient(90deg, #22c55e, #16a34a)', borderRadius: '4px' }"
              ></div>
            </div>
          </div>

          <div v-if="filteredCountryList.length === 0" style="text-align: center; color: #94a3b8; font-size: 0.8rem; padding: 2rem;">
            <i class="pi pi-inbox" style="font-size: 1.5rem; margin-bottom: 6px; display: block;"></i>
            Không có dữ liệu quốc gia phù hợp
          </div>
        </div>
      </div>

      <!-- FULL FUNDINGS CARD -->
      <div class="app-card">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.85rem; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px;">
          <div style="display: flex; align-items: center; gap: 6px;">
            <i class="pi pi-wallet" style="color: #7c3aed; font-size: 1.05rem;"></i>
            <h3 style="font-size: 0.92rem; font-weight: 700; color: #1e293b; margin: 0;">
              Thống kê Toàn bộ Nguồn kinh phí ({{ stats.fundingList.length }} nguồn)
            </h3>
            <button type="button" class="btn-card-setting" @click="openSingleSetting('funding')" title="Cài đặt cột Nguồn kinh phí">
              <i class="pi pi-cog"></i>
            </button>
          </div>
          <div style="display: flex; align-items: center; gap: 6px;">
            <InputText
              v-model="fundingSearch"
              placeholder="Tìm nguồn kinh phí..."
              style="font-size: 0.75rem; padding: 4px 8px; width: 150px; height: 28px;"
            />
          </div>
        </div>

        <div style="max-height: 380px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; padding-right: 4px;">
          <div
            v-for="(item, idx) in filteredFundingList"
            :key="idx"
            class="breakdown-row"
            @click="openDrilldown('funding', `Danh sách Cán bộ theo Nguồn kinh phí: ${item.name}`, { fundingName: item.name })"
          >
            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem; margin-bottom: 3px;">
              <span style="font-weight: 600; color: #334155; display: flex; align-items: center; gap: 6px;">
                <span class="badge-num" style="background: #ede9fe; color: #6d28d9;">#{{ idx + 1 }}</span> {{ item.name }}
              </span>
              <div style="display: flex; align-items: center; gap: 6px;">
                <strong style="color: #7c3aed;">{{ item.count }} lượt</strong>
                <i class="pi pi-chevron-right" style="font-size: 0.7rem; color: #94a3b8;"></i>
              </div>
            </div>
            <div style="height: 6px; background: #f1f5f9; border-radius: 4px; overflow: hidden;">
              <div
                :style="{ width: `${(item.count / (stats.maxFunding || 1)) * 100}%`, height: '100%', background: 'linear-gradient(90deg, #a855f7, #7c3aed)', borderRadius: '4px' }"
              ></div>
            </div>
          </div>

          <div v-if="filteredFundingList.length === 0" style="text-align: center; color: #94a3b8; font-size: 0.8rem; padding: 2rem;">
            <i class="pi pi-inbox" style="font-size: 1.5rem; margin-bottom: 6px; display: block;"></i>
            Không có dữ liệu nguồn kinh phí phù hợp
          </div>
        </div>
      </div>
    </div>

    <!-- 3. TRAVEL TIMELINE WARNINGS SECTION -->
    <div class="app-card" style="margin-bottom: 1.5rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.85rem; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px;">
        <div style="display: flex; align-items: center; gap: 6px;">
          <i class="pi pi-bell" style="color: #ea580c; font-size: 1.05rem;"></i>
          <h3 style="font-size: 0.92rem; font-weight: 700; color: #1e293b; margin: 0;">
            Giám sát Tiến độ Chuyến đi: Duyệt Đi - Duyệt Về - Gia Hạn
          </h3>
          <button type="button" class="btn-card-setting" @click="openSingleSetting('schedule')" title="Cài đặt cột Thời gian duyệt">
            <i class="pi pi-cog"></i>
          </button>
        </div>
        <span style="font-size: 0.76rem; color: #64748b;">
          Cột: Duyệt đi (<b>{{ colConfig.approvedDeparture }}</b>) | Duyệt về (<b>{{ colConfig.approvedArrival }}</b>) | Gia hạn (<b>{{ colConfig.approvedExtension }}</b>)
        </span>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem;">
        <!-- Card 1: Có duyệt gia hạn -->
        <div
          class="schedule-box"
          style="border-color: #fde047; background: #fefce8;"
          @click="openDrilldown('schedule_extended', 'Danh sách Chuyến đi Có Duyệt Gia Hạn')"
        >
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 0.82rem; font-weight: 700; color: #854d0e;">Được Duyệt Gia Hạn</span>
            <span class="badge-pill" style="background: #fef08a; color: #713f12; font-size: 0.75rem;">
              {{ stats.extendedTrips.length }} chuyến
            </span>
          </div>
          <p style="font-size: 0.75rem; color: #a16207; margin: 6px 0 0 0;">
            Chuyến đi có điền ngày duyệt gia hạn hoặc có ghi nhận thời gian kéo dài.
          </p>
        </div>

        <!-- Card 2: Quá hạn duyệt về -->
        <div
          class="schedule-box"
          style="border-color: #fca5a5; background: #fef2f2;"
          @click="openDrilldown('schedule_overdue', 'Danh sách Chuyến đi Quá Hạn Duyệt Về')"
        >
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 0.82rem; font-weight: 700; color: #991b1b;">Quá Hạn Duyệt Về</span>
            <span class="badge-pill" style="background: #fee2e2; color: #991b1b; font-size: 0.75rem;">
              {{ stats.overdueTrips.length }} chuyến
            </span>
          </div>
          <p style="font-size: 0.75rem; color: #b91c1c; margin: 6px 0 0 0;">
            Ngày về thực tế muộn hơn ngày duyệt về mà không có duyệt gia hạn tương ứng.
          </p>
        </div>

        <!-- Card 3: Đi về đúng hạn -->
        <div
          class="schedule-box"
          style="border-color: #bbf7d0; background: #f0fdf4;"
          @click="openDrilldown('schedule_ontime', 'Danh sách Chuyến đi Hoàn thành Đúng Hạn')"
        >
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 0.82rem; font-weight: 700; color: #166534;">Hoàn thành Đúng Hạn</span>
            <span class="badge-pill" style="background: #dcfce7; color: #15803d; font-size: 0.75rem;">
              {{ stats.onTimeTrips.length }} chuyến
            </span>
          </div>
          <p style="font-size: 0.75rem; color: #15803d; margin: 6px 0 0 0;">
            Thời gian xuất nhập cảnh khớp hoặc nằm trong khoảng thời gian đã được duyệt.
          </p>
        </div>
      </div>
    </div>

    <!-- ========================================================= -->
    <!-- 4. INTERACTIVE DRILL-DOWN POPUP MODAL                     -->
    <!-- ========================================================= -->
    <Dialog
      v-model:visible="isDrilldownOpen"
      modal
      :header="drilldownTitle"
      :style="{ width: '1000px', maxWidth: '95vw' }"
    >
      <div style="display: flex; flex-direction: column; gap: 10px; padding-top: 6px;">
        <!-- Modal Toolbar -->
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 0.82rem; color: #64748b;">
              Tìm thấy <strong style="color: #0f172a;">{{ filteredDrilldownData.length }}</strong> kết quả
            </span>
            <span class="badge-pill badge-green" style="font-size: 0.72rem;">
              {{ getTimeFilterLabel() }}
            </span>
          </div>

          <div style="display: flex; gap: 8px;">
            <InputText
              v-model="drilldownSearch"
              placeholder="Tìm kiếm trong danh sách..."
              style="font-size: 0.78rem; padding: 4px 8px; width: 220px;"
            />
            <Button
              icon="pi pi-download"
              label="Xuất Excel"
              severity="secondary"
              size="small"
              outlined
              @click="exportDrilldownExcel"
            />
          </div>
        </div>

        <!-- DataTable inside Popup -->
        <div style="border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; max-height: 480px; overflow-y: auto;">
          <!-- 1. Table for Personnel -->
          <table v-if="drilldownType === 'all_personnel'" class="drilldown-table">
            <thead>
              <tr>
                <th style="width: 40px; text-align: center;">STT</th>
                <th>Mã CB</th>
                <th>Họ và tên</th>
                <th>Số CCCD</th>
                <th>Chức vụ</th>
                <th>Đơn vị</th>
                <th>Số chuyến đi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(p, idx) in filteredDrilldownData" :key="p.id || idx">
                <td style="text-align: center; color: #64748b; font-weight: 600;">{{ idx + 1 }}</td>
                <td><span class="code-badge">{{ p.code || p.id }}</span></td>
                <td style="font-weight: 600; color: #1e293b;">{{ p.name }}</td>
                <td>{{ p.cccdparent || p.cccd || '-' }}</td>
                <td>{{ p.positionName || p.position || '-' }}</td>
                <td>{{ p.departmentName || '-' }}</td>
                <td><span class="badge-pill badge-green">{{ (p.trips || []).length }} chuyến</span></td>
              </tr>
            </tbody>
          </table>

          <!-- 2. Table for Relatives -->
          <table v-else-if="drilldownType === 'all_relatives'" class="drilldown-table">
            <thead>
              <tr>
                <th style="width: 40px; text-align: center;">STT</th>
                <th>Cán bộ liên quan</th>
                <th>Họ tên Thân nhân</th>
                <th>Quan hệ</th>
                <th>Quốc gia cư trú</th>
                <th>Nghề nghiệp / Tình trạng</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(r, idx) in filteredDrilldownData" :key="r.id || idx">
                <td style="text-align: center; color: #64748b; font-weight: 600;">{{ idx + 1 }}</td>
                <td style="font-weight: 600; color: #1e293b;">{{ r.parentName || r.parentPersonnelName || '-' }}</td>
                <td style="font-weight: 600; color: #6d28d9;">{{ r.relativeName || r.name || '-' }}</td>
                <td><span class="badge-pill badge-neutral">{{ r.relationship || r.relationshipName || '-' }}</span></td>
                <td>{{ r.countryName || r.country || '-' }}</td>
                <td>{{ r.job || r.status || '-' }}</td>
              </tr>
            </tbody>
          </table>

          <!-- 3. Table for Trips (All trips, missing decision, country, funding, schedule warnings) -->
          <table v-else class="drilldown-table">
            <thead>
              <tr>
                <th style="width: 40px; text-align: center;">STT</th>
                <th>Tên Cán bộ</th>
                <th>Số Quyết định</th>
                <th>Quốc gia</th>
                <th>Ngày Xuất cảnh</th>
                <th>Ngày Nhập cảnh</th>
                <th>Duyệt Đi - Về</th>
                <th>Duyệt Gia hạn</th>
                <th>Nguồn kinh phí</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(t, idx) in filteredDrilldownData" :key="t.id || idx">
                <td style="text-align: center; color: #64748b; font-weight: 600;">{{ idx + 1 }}</td>
                <td style="font-weight: 600; color: #1e293b;">
                  {{ t.personnelName || '-' }}
                  <div style="font-size: 0.7rem; color: #64748b;">{{ t.personnelCode || '' }}</div>
                </td>
                <td>
                  <span v-if="t.decisionNumber" class="badge-pill badge-neutral">{{ t.decisionNumber }}</span>
                  <span v-else class="badge-pill badge-red"><i class="pi pi-times-circle"></i> Chưa có QĐ</span>
                </td>
                <td style="font-weight: 600; color: #16a34a;">{{ t.countryName || '-' }}</td>
                <td>{{ t.departureDate || '-' }}</td>
                <td>{{ t.arrivalDate || '-' }}</td>
                <td>
                  <div style="font-size: 0.72rem; color: #334155;">
                    <div>Đi: <b>{{ t.approvedDepartureDate || t.departureDate || '-' }}</b></div>
                    <div>Về: <b>{{ t.approvedArrivalDate || t.arrivalDate || '-' }}</b></div>
                  </div>
                </td>
                <td>
                  <span v-if="t.approvedExtensionDate" class="badge-pill badge-yellow">
                    {{ t.approvedExtensionDate }}
                  </span>
                  <span v-else style="color: #cbd5e1;">-</span>
                </td>
                <td><span class="badge-pill badge-purple">{{ t.fundingName || '-' }}</span></td>
              </tr>
            </tbody>
          </table>

          <div v-if="filteredDrilldownData.length === 0" style="text-align: center; color: #94a3b8; font-size: 0.82rem; padding: 2rem;">
            Không tìm thấy bản ghi nào
          </div>
        </div>
      </div>

      <template #footer>
        <div style="display: flex; justify-content: flex-end;">
          <Button label="Đóng" severity="secondary" size="small" @click="isDrilldownOpen = false" />
        </div>
      </template>
    </Dialog>

    <!-- ========================================================= -->
    <!-- 5. DASHBOARD COLUMN SETTINGS MODAL                        -->
    <!-- ========================================================= -->
    <Dialog
      v-model:visible="isSettingsOpen"
      modal
      header="Cài đặt Mã Cột cho Dashboard"
      :style="{ width: '580px', maxWidth: '95vw' }"
    >
      <div style="display: flex; flex-direction: column; gap: 14px; padding-top: 8px;">
        <div style="padding: 8px 12px; background: #f0fdf4; border-radius: 8px; border-left: 4px solid #16a34a; font-size: 0.78rem; color: #166534;">
          Bạn có thể tự gõ ID cột hoặc chọn từ danh sách cột có sẵn trong hệ thống để Dashboard thống kê chính xác 100%.
        </div>

        <!-- Setting 1: Decision ID -->
        <div>
          <label style="font-size: 0.8rem; font-weight: 700; color: #334155; display: block; margin-bottom: 4px;">
            1. ID Cột Số Quyết định (Kiểm tra chưa có Quyết định):
          </label>
          <div style="display: flex; gap: 8px;">
            <InputText v-model="tempConfig.decision" placeholder="Ví dụ: decisionNumber" style="flex: 1; font-size: 0.8rem;" />
            <select class="settings-select" @change="tempConfig.decision = $event.target.value">
              <option value="">-- Chọn cột mẫu --</option>
              <option v-for="c in allAvailableColumns" :key="c.id" :value="c.id">{{ c.label }} ({{ c.id }})</option>
            </select>
          </div>
        </div>

        <!-- Setting 2: Country ID -->
        <div>
          <label style="font-size: 0.8rem; font-weight: 700; color: #334155; display: block; margin-bottom: 4px;">
            2. ID Cột Quốc gia (Đếm toàn bộ Quốc gia):
          </label>
          <div style="display: flex; gap: 8px;">
            <InputText v-model="tempConfig.country" placeholder="Ví dụ: countryName" style="flex: 1; font-size: 0.8rem;" />
            <select class="settings-select" @change="tempConfig.country = $event.target.value">
              <option value="">-- Chọn cột mẫu --</option>
              <option v-for="c in allAvailableColumns" :key="c.id" :value="c.id">{{ c.label }} ({{ c.id }})</option>
            </select>
          </div>
        </div>

        <!-- Setting 3: Funding ID -->
        <div>
          <label style="font-size: 0.8rem; font-weight: 700; color: #334155; display: block; margin-bottom: 4px;">
            3. ID Cột Nguồn kinh phí (Đếm toàn bộ Kinh phí):
          </label>
          <div style="display: flex; gap: 8px;">
            <InputText v-model="tempConfig.funding" placeholder="Ví dụ: fundingName" style="flex: 1; font-size: 0.8rem;" />
            <select class="settings-select" @change="tempConfig.funding = $event.target.value">
              <option value="">-- Chọn cột mẫu --</option>
              <option v-for="c in allAvailableColumns" :key="c.id" :value="c.id">{{ c.label }} ({{ c.id }})</option>
            </select>
          </div>
        </div>

        <!-- Setting 4: Approved Departure Date ID -->
        <div>
          <label style="font-size: 0.8rem; font-weight: 700; color: #334155; display: block; margin-bottom: 4px;">
            4. [Cột 43] Thời gian duyệt đi:
          </label>
          <div style="display: flex; gap: 8px;">
            <InputText v-model="tempConfig.approvedDeparture" placeholder="Ví dụ: approvedDepartureDate" style="flex: 1; font-size: 0.8rem;" />
            <select class="settings-select" @change="tempConfig.approvedDeparture = $event.target.value">
              <option value="">-- Chọn cột mẫu --</option>
              <option v-for="c in allAvailableColumns" :key="c.id" :value="c.id">{{ c.label }} ({{ c.id }})</option>
            </select>
          </div>
        </div>

        <!-- Setting 5: Approved Arrival Date ID -->
        <div>
          <label style="font-size: 0.8rem; font-weight: 700; color: #334155; display: block; margin-bottom: 4px;">
            5. [Cột 44] Thời gian duyệt về:
          </label>
          <div style="display: flex; gap: 8px;">
            <InputText v-model="tempConfig.approvedArrival" placeholder="Ví dụ: approvedArrivalDate" style="flex: 1; font-size: 0.8rem;" />
            <select class="settings-select" @change="tempConfig.approvedArrival = $event.target.value">
              <option value="">-- Chọn cột mẫu --</option>
              <option v-for="c in allAvailableColumns" :key="c.id" :value="c.id">{{ c.label }} ({{ c.id }})</option>
            </select>
          </div>
        </div>

        <!-- Setting 6: Approved Extension Date ID -->
        <div>
          <label style="font-size: 0.8rem; font-weight: 700; color: #334155; display: block; margin-bottom: 4px;">
            6. [Cột 45] Thời gian duyệt gia hạn:
          </label>
          <div style="display: flex; gap: 8px;">
            <InputText v-model="tempConfig.approvedExtension" placeholder="Ví dụ: approvedExtensionDate" style="flex: 1; font-size: 0.8rem;" />
            <select class="settings-select" @change="tempConfig.approvedExtension = $event.target.value">
              <option value="">-- Chọn cột mẫu --</option>
              <option v-for="c in allAvailableColumns" :key="c.id" :value="c.id">{{ c.label }} ({{ c.id }})</option>
            </select>
          </div>
        </div>
      </div>

      <template #footer>
        <div style="display: flex; justify-content: space-between; width: 100%; align-items: center;">
          <Button label="Khôi phục mặc định" severity="secondary" text size="small" @click="resetToDefaultSettings" />
          <div style="display: flex; gap: 8px;">
            <Button label="Hủy" severity="secondary" text size="small" @click="isSettingsOpen = false" />
            <Button label="Lưu Cấu Hình" icon="pi pi-check" severity="success" size="small" @click="saveDashboardSettings" />
          </div>
        </div>
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Dialog from 'primevue/dialog';
import AppDatePicker from '@/components/common/AppDatePicker.vue';
import { usePersonnelStore } from '@/stores/personnel';
import { exportToExcel } from '@/utils/excel';

const personnelStore = usePersonnelStore();

// =========================================================================
// 1. DASHBOARD COLUMN CONFIGURATION STATE (Persisted in localStorage)
// =========================================================================
const DEFAULT_CONFIG = {
  decision: 'decisionNumber',
  country: 'countryName',
  funding: 'fundingName',
  approvedDeparture: 'approvedDepartureDate',
  approvedArrival: 'approvedArrivalDate',
  approvedExtension: 'approvedExtensionDate',
};

const colConfig = ref({ ...DEFAULT_CONFIG });
const tempConfig = ref({ ...DEFAULT_CONFIG });
const isSettingsOpen = ref(false);

const loadDashboardSettings = () => {
  const saved = localStorage.getItem('dashboard_col_config');
  if (saved) {
    try {
      colConfig.value = { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
    } catch (e) {}
  }
  tempConfig.value = { ...colConfig.value };
};

const saveDashboardSettings = () => {
  colConfig.value = { ...tempConfig.value };
  localStorage.setItem('dashboard_col_config', JSON.stringify(colConfig.value));
  isSettingsOpen.value = false;
};

const resetToDefaultSettings = () => {
  tempConfig.value = { ...DEFAULT_CONFIG };
};

const openSingleSetting = (type) => {
  tempConfig.value = { ...colConfig.value };
  isSettingsOpen.value = true;
};

// =========================================================================
// 2. TIME FILTER STATE
// =========================================================================
const timeFilterMode = ref('all'); // 'all', 'week', 'month', 'year', 'custom'
const customStartDate = ref('');
const customEndDate = ref('');

const countrySearch = ref('');
const fundingSearch = ref('');

const setTimeFilter = (mode) => {
  timeFilterMode.value = mode;
};

const getTimeFilterLabel = () => {
  if (timeFilterMode.value === 'all') return 'Tất cả thời gian';
  if (timeFilterMode.value === 'week') return 'Trong tuần này';
  if (timeFilterMode.value === 'month') return 'Trong tháng này';
  if (timeFilterMode.value === 'year') return 'Trong năm nay';
  if (timeFilterMode.value === 'custom') {
    return `Từ ${customStartDate.value || '...'} đến ${customEndDate.value || '...'}`;
  }
  return 'Tất cả';
};

// Helper to parse date DD/MM/YYYY or YYYY-MM-DD
const parseDateObj = (str) => {
  if (!str) return null;
  if (str instanceof Date) return str;
  const s = String(str).trim();
  if (s.includes('/')) {
    const parts = s.split('/');
    if (parts.length === 3) {
      const d = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const y = parseInt(parts[2], 10);
      return new Date(y, m, d);
    }
  }
  const parsed = new Date(s);
  return isNaN(parsed.getTime()) ? null : parsed;
};

const isWithinTimeFilter = (dateStr) => {
  if (timeFilterMode.value === 'all') return true;
  if (!dateStr) return false;
  const d = parseDateObj(dateStr);
  if (!d) return false;

  const now = new Date();

  if (timeFilterMode.value === 'week') {
    const day = now.getDay() || 7; // get current day of week (1-7)
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day + 1, 0, 0, 0);
    const sunday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day + 7, 23, 59, 59);
    return d >= monday && d <= sunday;
  }

  if (timeFilterMode.value === 'month') {
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }

  if (timeFilterMode.value === 'year') {
    return d.getFullYear() === now.getFullYear();
  }

  if (timeFilterMode.value === 'custom') {
    const start = parseDateObj(customStartDate.value);
    const end = parseDateObj(customEndDate.value);
    if (start && d < start) return false;
    if (end) {
      const endInclusive = new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59);
      if (d > endInclusive) return false;
    }
    return true;
  }

  return true;
};

// =========================================================================
// 3. STATS COMPUTATION & EXTRACTOR
// =========================================================================
const getTripValue = (trip, colId) => {
  if (!trip || !colId) return '';
  if (trip[colId] !== undefined && trip[colId] !== null && String(trip[colId]).trim() !== '') {
    return String(trip[colId]).trim();
  }
  if (colId === 'countryName' && (trip.country || trip.quocGia || trip.quoc_gia)) {
    return String(trip.country || trip.quocGia || trip.quoc_gia).trim();
  }
  if (colId === 'fundingName' && (trip.funding || trip.nguonKinhPhi || trip.nguon_kinh_phi)) {
    return String(trip.funding || trip.nguonKinhPhi || trip.nguon_kinh_phi).trim();
  }
  if (colId === 'decisionNumber' && (trip.decision || trip.soQuyetDinh || trip.so_quyet_dinh)) {
    return String(trip.decision || trip.soQuyetDinh || trip.so_quyet_dinh).trim();
  }
  if (colId === 'approvedDepartureDate' && (trip.departureDate || trip.ngayXuatCanh || trip.ngay_xuat_canh)) {
    return String(trip.departureDate || trip.ngayXuatCanh || trip.ngay_xuat_canh).trim();
  }
  if (colId === 'approvedArrivalDate' && (trip.arrivalDate || trip.ngayNhapCanh || trip.ngay_nhap_canh)) {
    return String(trip.arrivalDate || trip.ngayNhapCanh || trip.ngay_nhap_canh).trim();
  }
  if (colId === 'approvedExtensionDate' && (trip.extensionDate || trip.ngayGiaHan || trip.ngay_gia_han)) {
    return String(trip.extensionDate || trip.ngayGiaHan || trip.ngay_gia_han).trim();
  }
  return '';
};

const stats = computed(() => {
  const pList = personnelStore.personnelList || [];
  let totalRelatives = 0;
  const filteredTrips = [];
  const missingDecisionTrips = [];
  const extendedTrips = [];
  const overdueTrips = [];
  const onTimeTrips = [];

  const countries = {};
  const fundings = {};

  pList.forEach((p) => {
    if (Array.isArray(p.relatives)) {
      totalRelatives += p.relatives.length;
    }

    const pTrips = Array.isArray(p.trips) ? p.trips : [];
    pTrips.forEach((t) => {
      // Check date filter by departureDate or arrivalDate
      const depDate = t.departureDate || t.decisionDate || '';
      if (!isWithinTimeFilter(depDate) && !isWithinTimeFilter(t.arrivalDate)) {
        return;
      }

      const enrichedTrip = {
        ...t,
        personnelId: p.id,
        personnelCode: p.code || p.id,
        personnelName: p.name,
        countryName: getTripValue(t, colConfig.value.country) || 'Chưa rõ',
        fundingName: getTripValue(t, colConfig.value.funding) || 'Chưa rõ',
        decisionNumber: getTripValue(t, colConfig.value.decision) || '',
        approvedDepartureDate: getTripValue(t, colConfig.value.approvedDeparture) || t.departureDate || '',
        approvedArrivalDate: getTripValue(t, colConfig.value.approvedArrival) || t.arrivalDate || '',
        approvedExtensionDate: getTripValue(t, colConfig.value.approvedExtension) || '',
      };

      filteredTrips.push(enrichedTrip);

      // 1. Missing Decision Warning
      if (!enrichedTrip.decisionNumber) {
        missingDecisionTrips.push(enrichedTrip);
      }

      // 2. Schedule Warnings
      if (enrichedTrip.approvedExtensionDate) {
        extendedTrips.push(enrichedTrip);
      } else {
        const arr = parseDateObj(enrichedTrip.arrivalDate);
        const appArr = parseDateObj(enrichedTrip.approvedArrivalDate);
        if (arr && appArr && arr > appArr) {
          overdueTrips.push(enrichedTrip);
        } else {
          onTimeTrips.push(enrichedTrip);
        }
      }

      // 3. Country aggregation
      const c = enrichedTrip.countryName;
      if (c && c !== 'Chưa rõ') {
        countries[c] = (countries[c] || 0) + 1;
      }

      // 4. Funding aggregation
      const f = enrichedTrip.fundingName;
      if (f && f !== 'Chưa rõ') {
        fundings[f] = (fundings[f] || 0) + 1;
      }
    });
  });

  const countryList = Object.entries(countries)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const fundingList = Object.entries(fundings)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const maxCountry = countryList.length > 0 ? countryList[0].count : 1;
  const maxFunding = fundingList.length > 0 ? fundingList[0].count : 1;

  return {
    totalPersonnel: pList.length,
    totalRelatives,
    filteredTrips,
    missingDecisionTrips,
    extendedTrips,
    overdueTrips,
    onTimeTrips,
    countryList,
    fundingList,
    maxCountry,
    maxFunding,
  };
});

const filteredCountryList = computed(() => {
  const q = (countrySearch.value || '').toLowerCase().trim();
  if (!q) return stats.value.countryList;
  return stats.value.countryList.filter((item) => item.name.toLowerCase().includes(q));
});

const filteredFundingList = computed(() => {
  const q = (fundingSearch.value || '').toLowerCase().trim();
  if (!q) return stats.value.fundingList;
  return stats.value.fundingList.filter((item) => item.name.toLowerCase().includes(q));
});

// All Available Columns from Settings for Dropdown selection
const allAvailableColumns = computed(() => {
  const list = [];
  (personnelStore.importMappingPersonnel || []).forEach((g) => {
    (g.columns || []).forEach((c) => {
      if (c.id && c.label) {
        list.push({ id: c.id, label: `[${g.group || ''}] ${c.label}` });
      }
    });
  });
  return list;
});

// =========================================================================
// 4. DRILL-DOWN POPUP MODAL LOGIC
// =========================================================================
const isDrilldownOpen = ref(false);
const drilldownTitle = ref('');
const drilldownType = ref('');
const drilldownData = ref([]);
const drilldownSearch = ref('');

const openDrilldown = (type, title, filterContext = {}) => {
  drilldownType.value = type;
  drilldownTitle.value = title;
  drilldownSearch.value = '';

  if (type === 'all_personnel') {
    drilldownData.value = [...(personnelStore.personnelList || [])];
  } else if (type === 'all_trips') {
    drilldownData.value = [...stats.value.filteredTrips];
  } else if (type === 'all_relatives') {
    drilldownData.value = [...(personnelStore.relativesList || [])];
  } else if (type === 'missing_decision') {
    drilldownData.value = [...stats.value.missingDecisionTrips];
  } else if (type === 'schedule_warnings') {
    drilldownData.value = [...stats.value.extendedTrips, ...stats.value.overdueTrips];
  } else if (type === 'schedule_extended') {
    drilldownData.value = [...stats.value.extendedTrips];
  } else if (type === 'schedule_overdue') {
    drilldownData.value = [...stats.value.overdueTrips];
  } else if (type === 'schedule_ontime') {
    drilldownData.value = [...stats.value.onTimeTrips];
  } else if (type === 'country' && filterContext.countryName) {
    drilldownData.value = stats.value.filteredTrips.filter(
      (t) => t.countryName.toLowerCase() === filterContext.countryName.toLowerCase()
    );
  } else if (type === 'funding' && filterContext.fundingName) {
    drilldownData.value = stats.value.filteredTrips.filter(
      (t) => t.fundingName.toLowerCase() === filterContext.fundingName.toLowerCase()
    );
  } else {
    drilldownData.value = [];
  }

  isDrilldownOpen.value = true;
};

const filteredDrilldownData = computed(() => {
  const q = (drilldownSearch.value || '').toLowerCase().trim();
  if (!q) return drilldownData.value;
  return drilldownData.value.filter((row) => {
    return Object.values(row).some((val) => {
      if (typeof val === 'string' || typeof val === 'number') {
        return String(val).toLowerCase().includes(q);
      }
      return false;
    });
  });
});

const exportDrilldownExcel = () => {
  if (filteredDrilldownData.value.length === 0) return;
  const fileName = `Thong_Ke_${drilldownType.value}_${new Date().toISOString().slice(0, 10)}`;
  exportToExcel(filteredDrilldownData.value, fileName, 'Thống kê');
};

const refreshData = async () => {
  await personnelStore.fetchPersonnel();
};

onMounted(async () => {
  loadDashboardSettings();
  if (personnelStore.personnelList.length === 0) {
    await personnelStore.init();
  }
});
</script>

<style scoped>
.stat-card {
  background: #ffffff;
  padding: 1.1rem 1.25rem;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
  border-color: #cbd5e1;
}

.stat-card-warning:hover {
  border-color: #fca5a5;
  background: #fffafa;
}

.stat-label {
  font-size: 0.8rem;
  color: #64748b;
  font-weight: 600;
}

.stat-value {
  font-size: 1.85rem;
  font-weight: 800;
  margin-top: 4px;
  line-height: 1.1;
  letter-spacing: -0.02em;
}

.stat-sub {
  font-size: 0.72rem;
  font-weight: 600;
}

.view-more-tag {
  font-size: 0.7rem;
  color: #64748b;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  opacity: 0.8;
  transition: opacity 0.2s;
}

.stat-card:hover .view-more-tag {
  opacity: 1;
  color: #0f172a;
}

.btn-card-setting {
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 4px;
  font-size: 0.75rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}

.btn-card-setting:hover {
  color: #334155;
  background: #f1f5f9;
}

.time-btn {
  background: transparent;
  border: none;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 0.78rem;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  transition: all 0.15s ease;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.time-btn:hover {
  color: #1e293b;
}

.time-btn-active {
  background: #ffffff;
  color: #16a34a !important;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
}

.breakdown-row {
  padding: 6px 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s;
}

.breakdown-row:hover {
  background: #f8fafc;
}

.badge-num {
  font-size: 0.7rem;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
  background: #dcfce7;
  color: #15803d;
}

.schedule-box {
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  cursor: pointer;
  transition: all 0.2s;
}

.schedule-box:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.settings-select {
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 0.78rem;
  color: #334155;
  background: #ffffff;
  max-width: 220px;
}

/* Drilldown table */
.drilldown-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.76rem;
}

.drilldown-table th {
  background: #f8fafc;
  padding: 8px 10px;
  border-bottom: 1px solid #e2e8f0;
  color: #475569;
  font-weight: 700;
  text-align: left;
  white-space: nowrap;
  position: sticky;
  top: 0;
  z-index: 1;
}

.drilldown-table td {
  padding: 8px 10px;
  border-bottom: 1px solid #f1f5f9;
  color: #334155;
}

.drilldown-table tr:hover {
  background: #f8fafc;
}

.code-badge {
  font-family: monospace;
  font-weight: 700;
  font-size: 0.72rem;
  background: #f1f5f9;
  padding: 2px 6px;
  border-radius: 4px;
  color: #475569;
}

.badge-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.72rem;
  font-weight: 600;
}

.badge-green {
  background: #dcfce7;
  color: #15803d;
}

.badge-purple {
  background: #f3e8ff;
  color: #7e22ce;
}

.badge-yellow {
  background: #fef9c3;
  color: #854d0e;
}

.badge-red {
  background: #fee2e2;
  color: #b91c1c;
}

.badge-neutral {
  background: #f1f5f9;
  color: #475569;
}
</style>
