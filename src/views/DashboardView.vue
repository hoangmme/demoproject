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
          <span style="font-size: 0.76rem; color: #64748b;">Tổng quan tình hình cán bộ, xuất nhập cảnh, thân nhân & các chỉ số tùy chỉnh</span>
        </div>
      </div>

      <!-- Time Filter Selector & Action Buttons -->
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

        <!-- Add Custom Group Button -->
        <Button
          icon="pi pi-plus"
          label="Thêm Nhóm Thống kê"
          severity="success"
          size="small"
          @click="openAddGroupDialog"
          style="font-size: 0.8rem;"
        />

        <!-- Dashboard Settings Button -->
        <Button
          icon="pi pi-cog"
          label="Cài đặt cột hệ thống"
          severity="secondary"
          size="small"
          outlined
          @click="openSettingsDialog"
          v-tooltip.top="'Tùy chỉnh ID các cột thống kê mặc định'"
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

    <!-- ========================================================= -->
    <!-- 1. DEFAULT TOP STAT CARDS                                -->
    <!-- ========================================================= -->
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

      <!-- Missing Decision Warning Card -->
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

      <!-- Departure/Arrival Schedule Warnings Card -->
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

    <!-- ========================================================= -->
    <!-- 2. DEFAULT BREAKDOWN GRIDS (QUỐC GIA & KINH PHÍ)          -->
    <!-- ========================================================= -->
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

        <div style="max-height: 280px; overflow-y: auto; padding-right: 4px;">
          <div v-if="filteredCountryList.length === 0" style="text-align: center; color: #94a3b8; padding: 2rem 0; font-size: 0.8rem;">
            Không tìm thấy quốc gia phù hợp.
          </div>
          <div
            v-for="(item, idx) in filteredCountryList"
            :key="item.name"
            class="breakdown-row"
            @click="openDrilldown('country', `Danh sách Cán bộ đi: ${item.name}`, { countryName: item.name })"
          >
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span class="badge-num">#{{ idx + 1 }}</span>
                <span style="font-size: 0.82rem; font-weight: 600; color: #334155;">{{ item.name }}</span>
              </div>
              <div style="display: flex; align-items: center; gap: 6px;">
                <span style="font-size: 0.8rem; font-weight: 700; color: #16a34a;">{{ item.count }} lượt</span>
                <span style="font-size: 0.7rem; color: #94a3b8;">
                  ({{ stats.filteredTrips.length > 0 ? Math.round((item.count / stats.filteredTrips.length) * 100) : 0 }}%)
                </span>
              </div>
            </div>
            <div style="height: 6px; background: #f1f5f9; border-radius: 4px; overflow: hidden;">
              <div
                style="height: 100%; background: linear-gradient(90deg, #22c55e, #16a34a); border-radius: 4px; transition: width 0.4s ease;"
                :style="{ width: `${(item.count / stats.maxCountry) * 100}%` }"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <!-- FULL FUNDING SOURCES CARD -->
      <div class="app-card">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.85rem; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px;">
          <div style="display: flex; align-items: center; gap: 6px;">
            <i class="pi pi-wallet" style="color: #0284c7; font-size: 1.05rem;"></i>
            <h3 style="font-size: 0.92rem; font-weight: 700; color: #1e293b; margin: 0;">
              Thống kê Toàn bộ Nguồn Kinh phí ({{ stats.fundingList.length }} nguồn)
            </h3>
            <button type="button" class="btn-card-setting" @click="openSingleSetting('funding')" title="Cài đặt cột Nguồn kinh phí">
              <i class="pi pi-cog"></i>
            </button>
          </div>
          <div style="display: flex; align-items: center; gap: 6px;">
            <InputText
              v-model="fundingSearch"
              placeholder="Tìm nguồn kinh phí..."
              style="font-size: 0.75rem; padding: 4px 8px; width: 140px; height: 28px;"
            />
          </div>
        </div>

        <div style="max-height: 280px; overflow-y: auto; padding-right: 4px;">
          <div v-if="filteredFundingList.length === 0" style="text-align: center; color: #94a3b8; padding: 2rem 0; font-size: 0.8rem;">
            Không tìm thấy nguồn kinh phí phù hợp.
          </div>
          <div
            v-for="(item, idx) in filteredFundingList"
            :key="item.name"
            class="breakdown-row"
            @click="openDrilldown('funding', `Danh sách Cán bộ theo Kinh phí: ${item.name}`, { fundingName: item.name })"
          >
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span class="badge-num" style="background: #e0f2fe; color: #0369a1;">#{{ idx + 1 }}</span>
                <span style="font-size: 0.82rem; font-weight: 600; color: #334155;">{{ item.name }}</span>
              </div>
              <div style="display: flex; align-items: center; gap: 6px;">
                <span style="font-size: 0.8rem; font-weight: 700; color: #0284c7;">{{ item.count }} lượt</span>
                <span style="font-size: 0.7rem; color: #94a3b8;">
                  ({{ stats.filteredTrips.length > 0 ? Math.round((item.count / stats.filteredTrips.length) * 100) : 0 }}%)
                </span>
              </div>
            </div>
            <div style="height: 6px; background: #f1f5f9; border-radius: 4px; overflow: hidden;">
              <div
                style="height: 100%; background: linear-gradient(90deg, #38bdf8, #0284c7); border-radius: 4px; transition: width 0.4s ease;"
                :style="{ width: `${(item.count / stats.maxFunding) * 100}%` }"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ========================================================= -->
    <!-- 3. CUSTOM DASHBOARD GROUPS (USER CONFIGURED)              -->
    <!-- ========================================================= -->
    <div v-for="(group, gIdx) in customGroups" :key="group.id || gIdx" class="app-card" style="margin-bottom: 1.5rem;">
      <!-- Group Header (Inside App Card) -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <i :class="['pi', group.icon || 'pi-folder']" style="color: #2e7d32; font-size: 1.1rem;"></i>
          <div>
            <h3 style="font-size: 0.92rem; font-weight: 700; color: #1e293b; margin: 0;">{{ group.title }}</h3>
            <span v-if="group.description" style="font-size: 0.74rem; color: #64748b;">{{ group.description }}</span>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 6px;">
          <button
            type="button"
            class="btn-add-widget-green"
            @click="openAddWidgetDialog(group)"
            title="Thêm thẻ đếm số lượng hoặc biểu đồ phân bổ vào nhóm này"
          >
            <i class="pi pi-plus" style="font-size: 0.75rem;"></i> Thêm Khối Thống kê
          </button>
          <Button
            icon="pi pi-pencil"
            size="small"
            severity="secondary"
            text
            rounded
            @click="openEditGroupDialog(group)"
            v-tooltip.top="'Chỉnh sửa nhóm này'"
          />
          <Button
            icon="pi pi-trash"
            size="small"
            severity="danger"
            text
            rounded
            @click="deleteGroup(group)"
            v-tooltip.top="'Xóa nhóm này'"
          />
        </div>
      </div>

      <!-- Group Widgets Container -->
      <div v-if="!group.widgets || group.widgets.length === 0" style="background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 10px; padding: 1.5rem; text-align: center; color: #64748b; font-size: 0.82rem;">
        Chưa có khối thống kê nào trong nhóm này. Bấm 
        <button type="button" class="btn-add-widget-green" style="display: inline-flex; margin-left: 6px;" @click="openAddWidgetDialog(group)">
          <i class="pi pi-plus" style="font-size: 0.75rem;"></i> Thêm Khối Thống kê
        </button>
      </div>

      <!-- Unified Flexible Grid for Group Widgets -->
      <div v-else style="display: flex; flex-wrap: wrap; gap: 1rem; align-items: stretch;">
        <div
          v-for="widget in group.widgets"
          :key="widget.id"
          :style="getWidgetStyle(widget)"
        >
          <!-- 1. Dạng Đếm Số Lượng (Count Metric Card) -->
          <div
            v-if="widget.displayType === 'count'"
            class="stat-card"
            :style="{ borderLeft: `4px solid ${widget.color || '#2e7d32'}`, height: '100%' }"
            @click="openCustomWidgetDrilldown(widget)"
          >
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
              <span class="stat-label" :style="{ color: widget.color || '#334155' }">{{ widget.title }}</span>
              <div style="display: flex; align-items: center; gap: 4px;">
                <button type="button" class="btn-card-setting" @click.stop="openEditWidgetDialog(group, widget)" title="Sửa khối này">
                  <i class="pi pi-pencil"></i>
                </button>
                <button type="button" class="btn-card-setting" @click.stop="deleteWidget(group, widget)" title="Xóa khối này" style="color: #ef4444;">
                  <i class="pi pi-trash"></i>
                </button>
                <i :class="['pi', widget.icon || 'pi-chart-line']" :style="{ color: widget.color || '#2e7d32', fontSize: '1.1rem', marginLeft: '4px' }"></i>
              </div>
            </div>
            <div class="stat-value" :style="{ color: widget.color || '#1e293b' }">
              {{ computeWidgetCount(widget) }}
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px;">
              <span class="stat-sub" style="color: #64748b;">
                {{ getSourceLabel(widget.source) }} | Cột: <b>{{ widget.columnLabel || widget.columnId }}</b>
              </span>
              <span class="view-more-tag" :style="{ color: widget.color || '#1e293b' }">Xem <i class="pi pi-arrow-right"></i></span>
            </div>
          </div>

          <!-- 2. Dạng Biểu đồ Phân bổ (Breakdown Chart Card) -->
          <div
            v-else
            style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 10px; padding: 12px; height: 100%; display: flex; flex-direction: column; justify-content: space-between;"
          >
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.85rem; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px;">
              <div style="display: flex; align-items: center; gap: 6px;">
                <i :class="['pi', widget.icon || 'pi-chart-pie']" :style="{ color: widget.color || '#2e7d32', fontSize: '1.05rem' }"></i>
                <div>
                  <h4 style="font-size: 0.88rem; font-weight: 700; color: #1e293b; margin: 0;">
                    {{ widget.title }} ({{ computeWidgetChartData(widget).list.length }} phân loại)
                  </h4>
                  <span style="font-size: 0.7rem; color: #64748b;">
                    {{ getSourceLabel(widget.source) }} - Cột: <b>{{ widget.columnLabel || widget.columnId }}</b>
                  </span>
                </div>
              </div>
              <div style="display: flex; align-items: center; gap: 4px;">
                <InputText
                  v-model="customChartSearches[widget.id]"
                  placeholder="Tìm..."
                  style="font-size: 0.72rem; padding: 2px 6px; width: 100px; height: 26px;"
                />
                <button type="button" class="btn-card-setting" @click="openEditWidgetDialog(group, widget)" title="Sửa biểu đồ này">
                  <i class="pi pi-pencil"></i>
                </button>
                <button type="button" class="btn-card-setting" @click="deleteWidget(group, widget)" title="Xóa biểu đồ này" style="color: #ef4444;">
                  <i class="pi pi-trash"></i>
                </button>
              </div>
            </div>

            <div style="max-height: 240px; overflow-y: auto; padding-right: 4px; flex: 1;">
              <div v-if="getFilteredChartList(widget).length === 0" style="text-align: center; color: #94a3b8; padding: 1.5rem 0; font-size: 0.78rem;">
                Không có dữ liệu phân loại phù hợp.
              </div>
              <div
                v-for="(item, cIdx) in getFilteredChartList(widget)"
                :key="item.name"
                class="breakdown-row"
                @click="openCustomChartItemDrilldown(widget, item.name)"
              >
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span class="badge-num" :style="{ background: getLightColor(widget.color), color: widget.color || '#2e7d32' }">
                      #{{ cIdx + 1 }}
                    </span>
                    <span style="font-size: 0.8rem; font-weight: 600; color: #334155;">{{ item.name }}</span>
                  </div>
                  <div style="display: flex; align-items: center; gap: 6px;">
                    <span style="font-size: 0.78rem; font-weight: 700;" :style="{ color: widget.color || '#2e7d32' }">
                      {{ item.count }} hồ sơ
                    </span>
                    <span style="font-size: 0.68rem; color: #94a3b8;">
                      ({{ computeWidgetChartData(widget).total > 0 ? Math.round((item.count / computeWidgetChartData(widget).total) * 100) : 0 }}%)
                    </span>
                  </div>
                </div>
                <div style="height: 5px; background: #f1f5f9; border-radius: 4px; overflow: hidden;">
                  <div
                    style="height: 100%; border-radius: 4px; transition: width 0.4s ease;"
                    :style="{
                      width: `${(item.count / (computeWidgetChartData(widget).max || 1)) * 100}%`,
                      background: widget.color || '#2e7d32'
                    }"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ========================================================= -->
    <!-- 4. SCHEDULE STATUS SUMMARY SECTION                        -->
    <!-- ========================================================= -->
    <div class="app-card" style="margin-bottom: 1.5rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <i class="pi pi-calendar-times" style="color: #ea580c; font-size: 1.1rem;"></i>
          <div>
            <h3 style="font-size: 0.92rem; font-weight: 700; color: #1e293b; margin: 0;">
              Theo dõi Tiến độ Đi - Về & Gia Hạn
            </h3>
            <span style="font-size: 0.74rem; color: #64748b;">
              Kiểm tra tình trạng duyệt thời gian xuất nhập cảnh của cán bộ
            </span>
          </div>
        </div>
        <button type="button" class="btn-card-setting" @click="openSingleSetting('schedule')" title="Cài đặt cột Duyệt Đi/Về/Gia Hạn">
          <i class="pi pi-cog"></i> Cài đặt cột tiến độ
        </button>
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
    <!-- 5. INTERACTIVE DRILL-DOWN POPUP MODAL                     -->
    <!-- ========================================================= -->
    <Dialog
      v-model:visible="isDrilldownOpen"
      modal
      :header="drilldownTitle"
      :style="{ width: '1000px', maxWidth: '95vw' }"
    >
      <div style="display: flex; flex-direction: column; gap: 10px; padding-top: 6px;">
        <!-- Dual Tabs Switcher (Cán bộ & Thân nhân) -->
        <div v-if="drilldownHasDualTabs" style="display: flex; gap: 8px; background: #f1f5f9; padding: 4px; border-radius: 8px; border: 1px solid #e2e8f0; width: fit-content;">
          <button
            type="button"
            class="time-btn"
            :class="{ 'time-btn-active': drilldownActiveTab === 'trips' }"
            @click="drilldownActiveTab = 'trips'"
          >
            <i class="pi pi-send"></i> Cán bộ đi nước ngoài ({{ drilldownTripsList.length }})
          </button>
          <button
            type="button"
            class="time-btn"
            :class="{ 'time-btn-active': drilldownActiveTab === 'relatives' }"
            @click="drilldownActiveTab = 'relatives'"
          >
            <i class="pi pi-globe"></i> Thân nhân ở nước ngoài ({{ drilldownRelativesList.length }})
          </button>
        </div>

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
          <table v-if="drilldownCategory === 'personnel'" class="drilldown-table">
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
          <table v-else-if="drilldownCategory === 'relatives' || (drilldownHasDualTabs && drilldownActiveTab === 'relatives')" class="drilldown-table">
            <thead>
              <tr>
                <th style="width: 40px; text-align: center;">STT</th>
                <th>Cán bộ liên quan</th>
                <th>Họ tên Thân nhân</th>
                <th>Quan hệ</th>
                <th>Quốc gia cư trú</th>
                <th>Nguồn kinh phí / Học bổng</th>
                <th>Nghề nghiệp / Tình trạng</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(r, idx) in filteredDrilldownData" :key="r.id || idx">
                <td style="text-align: center; color: #64748b; font-weight: 600;">{{ idx + 1 }}</td>
                <td style="font-weight: 600; color: #1e293b;">{{ r.parentName || r.parentPersonnelName || '-' }}</td>
                <td style="font-weight: 600; color: #6d28d9;">{{ r.relativeName || r.name || '-' }}</td>
                <td><span class="badge-pill badge-neutral">{{ r.relationship || r.relationshipName || '-' }}</span></td>
                <td><span class="badge-pill badge-green">{{ r.countryName || r.country || '-' }}</span></td>
                <td>{{ r.fundingName || r.funding || '-' }}</td>
                <td>{{ r.occupation || r.job || r.status || '-' }}</td>
              </tr>
            </tbody>
          </table>

          <!-- 3. Table for Trips -->
          <table v-else class="drilldown-table">
            <thead>
              <tr>
                <th style="width: 40px; text-align: center;">STT</th>
                <th>Tên Cán bộ</th>
                <th>Số Quyết định</th>
                <th>Quốc gia đến</th>
                <th>Nguồn Kinh phí</th>
                <th>Ngày đi</th>
                <th>Ngày về</th>
                <th>Duyệt Gia hạn</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(t, idx) in filteredDrilldownData" :key="t.id || idx">
                <td style="text-align: center; color: #64748b; font-weight: 600;">{{ idx + 1 }}</td>
                <td style="font-weight: 600; color: #1e293b;">{{ t.personnelName || '-' }}</td>
                <td>
                  <span v-if="t.decisionNumber" class="code-badge">{{ t.decisionNumber }}</span>
                  <span v-else class="badge-pill badge-red">Chưa có</span>
                </td>
                <td><span class="badge-pill badge-green">{{ t.countryName || '-' }}</span></td>
                <td>{{ t.fundingName || '-' }}</td>
                <td>{{ t.departureDate || t.approvedDepartureDate || '-' }}</td>
                <td>{{ t.arrivalDate || t.approvedArrivalDate || '-' }}</td>
                <td>
                  <span v-if="t.approvedExtensionDate" class="badge-pill badge-yellow">
                    {{ t.approvedExtensionDate }}
                  </span>
                  <span v-else style="color: #94a3b8;">-</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <template #footer>
        <Button label="Đóng" severity="secondary" text size="small" @click="isDrilldownOpen = false" />
      </template>
    </Dialog>

    <!-- ========================================================= -->
    <!-- 6. DASHBOARD DEFAULT COLUMN SETTINGS MODAL                -->
    <!-- ========================================================= -->
    <Dialog
      v-model:visible="isSettingsOpen"
      modal
      header="Cài đặt Mã Cột Hệ thống cho Dashboard (Gộp Cán bộ & Thân nhân)"
      :style="{ width: '820px', maxWidth: '96vw' }"
    >
      <div style="display: flex; flex-direction: column; gap: 14px; padding-top: 8px;">
        <div style="padding: 8px 12px; background: #f0fdf4; border-radius: 8px; border-left: 4px solid #16a34a; font-size: 0.78rem; color: #166534;">
          Hệ thống tự động gộp dữ liệu từ các cột của Cán bộ và Thân nhân để tính toán thống kê và biểu đồ phân bổ.
        </div>

        <!-- Setting 1: Decision ID -->
        <div>
          <label style="font-size: 0.8rem; font-weight: 700; color: #334155; display: block; margin-bottom: 4px;">
            1. ID Cột Số Quyết định (Kiểm tra chưa có Quyết định):
          </label>
          <div style="display: flex; gap: 8px;">
            <InputText v-model="tempConfig.decision" placeholder="Ví dụ: decisionNumber" style="flex: 1; font-size: 0.8rem;" />
            <select class="settings-select" @change="tempConfig.decision = $event.target.value">
              <option value="">-- Chọn cột mẫu Cán bộ --</option>
              <option v-for="c in allAvailablePersonnelColumns" :key="c.id" :value="c.id">{{ c.label }}</option>
            </select>
          </div>
        </div>

        <!-- Setting 2: Country ID (Personnel & Relatives) -->
        <div style="background: #f8fafc; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0; display: flex; flex-direction: column; gap: 8px;">
          <label style="font-size: 0.8rem; font-weight: 700; color: #334155; display: block;">
            2. Cài đặt Cột Quốc gia (Đếm & Biểu đồ Toàn bộ Quốc gia):
          </label>
          <div>
            <span style="font-size: 0.72rem; color: #64748b;">a) Cột Quốc gia của Cán bộ (Chuyến đi):</span>
            <div style="display: flex; gap: 8px; margin-top: 2px;">
              <InputText v-model="tempConfig.country" placeholder="Ví dụ: countryName" style="flex: 1; font-size: 0.78rem;" />
              <select class="settings-select" @change="tempConfig.country = $event.target.value">
                <option value="">-- Chọn cột Cán bộ --</option>
                <option v-for="c in allAvailablePersonnelColumns" :key="c.id" :value="c.id">{{ c.label }}</option>
              </select>
            </div>
          </div>
          <div>
            <span style="font-size: 0.72rem; color: #64748b;">b) Cột Quốc gia của Thân nhân:</span>
            <div style="display: flex; gap: 8px; margin-top: 2px;">
              <InputText v-model="tempConfig.countryRelative" placeholder="Ví dụ: countryName" style="flex: 1; font-size: 0.78rem;" />
              <select class="settings-select" @change="tempConfig.countryRelative = $event.target.value">
                <option value="">-- Chọn cột Thân nhân --</option>
                <option v-for="c in allAvailableRelativeColumns" :key="c.id" :value="c.id">{{ c.label }}</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Setting 3: Funding ID & Sub-columns (Personnel & Relatives) -->
        <div style="background: #f8fafc; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0; display: flex; flex-direction: column; gap: 10px;">
          <label style="font-size: 0.8rem; font-weight: 700; color: #334155; display: block;">
            3. Cài đặt Cột Nguồn kinh phí (Đếm toàn bộ Kinh phí & Biểu đồ):
          </label>

          <!-- A. Cán bộ (Chuyến đi) -->
          <div style="border-left: 3px solid #0284c7; padding-left: 8px;">
            <span style="font-size: 0.76rem; font-weight: 700; color: #0369a1;">A. Nguồn Kinh phí Cán bộ (Chuyến đi):</span>
            <div style="display: flex; gap: 8px; margin-top: 4px;">
              <InputText v-model="tempConfig.funding" placeholder="Cột chung (Ví dụ: fundingName)" style="flex: 1; font-size: 0.78rem;" />
              <select class="settings-select" @change="tempConfig.funding = $event.target.value">
                <option value="">-- Chọn cột Cán bộ --</option>
                <option v-for="c in allAvailablePersonnelColumns" :key="c.id" :value="c.id">{{ c.label }}</option>
              </select>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-top: 6px;">
              <div>
                <span style="font-size: 0.7rem; color: #64748b;">Ngân sách nhà nước:</span>
                <InputText v-model="tempConfig.fundingBudget" placeholder="fundingBudget" style="width: 100%; font-size: 0.75rem;" />
              </div>
              <div>
                <span style="font-size: 0.7rem; color: #64748b;">Tài trợ:</span>
                <InputText v-model="tempConfig.fundingSponsor" placeholder="fundingSponsor" style="width: 100%; font-size: 0.75rem;" />
              </div>
              <div>
                <span style="font-size: 0.7rem; color: #64748b;">Tự túc:</span>
                <InputText v-model="tempConfig.fundingSelf" placeholder="fundingSelf" style="width: 100%; font-size: 0.75rem;" />
              </div>
              <div>
                <span style="font-size: 0.7rem; color: #64748b;">Khác:</span>
                <InputText v-model="tempConfig.fundingOther" placeholder="fundingOther" style="width: 100%; font-size: 0.75rem;" />
              </div>
            </div>
          </div>

          <!-- B. Thân nhân ở Nước ngoài -->
          <div style="border-left: 3px solid #7c3aed; padding-left: 8px; padding-top: 6px; border-top: 1px dashed #e2e8f0;">
            <span style="font-size: 0.76rem; font-weight: 700; color: #6d28d9;">B. Nguồn Kinh phí / Học bổng Thân nhân:</span>
            <div style="display: flex; gap: 8px; margin-top: 4px;">
              <InputText v-model="tempConfig.fundingRelative" placeholder="Cột chung (Ví dụ: fundingName)" style="flex: 1; font-size: 0.78rem;" />
              <select class="settings-select" @change="tempConfig.fundingRelative = $event.target.value">
                <option value="">-- Chọn cột Thân nhân --</option>
                <option v-for="c in allAvailableRelativeColumns" :key="c.id" :value="c.id">{{ c.label }}</option>
              </select>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-top: 6px;">
              <div>
                <span style="font-size: 0.7rem; color: #64748b;">Học bổng / Ngân sách:</span>
                <InputText v-model="tempConfig.fundingRelativeBudget" placeholder="fundingRelativeBudget" style="width: 100%; font-size: 0.75rem;" />
              </div>
              <div>
                <span style="font-size: 0.7rem; color: #64748b;">Tài trợ:</span>
                <InputText v-model="tempConfig.fundingRelativeSponsor" placeholder="fundingRelativeSponsor" style="width: 100%; font-size: 0.75rem;" />
              </div>
              <div>
                <span style="font-size: 0.7rem; color: #64748b;">Tự túc:</span>
                <InputText v-model="tempConfig.fundingRelativeSelf" placeholder="fundingRelativeSelf" style="width: 100%; font-size: 0.75rem;" />
              </div>
              <div>
                <span style="font-size: 0.7rem; color: #64748b;">Khác:</span>
                <InputText v-model="tempConfig.fundingRelativeOther" placeholder="fundingRelativeOther" style="width: 100%; font-size: 0.75rem;" />
              </div>
            </div>
          </div>
        </div>

        <!-- Setting 4: Approved Departure Date ID -->
        <div>
          <label style="font-size: 0.8rem; font-weight: 700; color: #334155; display: block; margin-bottom: 4px;">
            4. Thời gian duyệt đi:
          </label>
          <div style="display: flex; gap: 8px;">
            <InputText v-model="tempConfig.approvedDeparture" placeholder="Ví dụ: approvedDepartureDate" style="flex: 1; font-size: 0.8rem;" />
            <select class="settings-select" @change="tempConfig.approvedDeparture = $event.target.value">
              <option value="">-- Chọn cột mẫu --</option>
              <option v-for="c in allAvailablePersonnelColumns" :key="c.id" :value="c.id">{{ c.label }}</option>
            </select>
          </div>
        </div>

        <!-- Setting 5: Approved Arrival Date ID -->
        <div>
          <label style="font-size: 0.8rem; font-weight: 700; color: #334155; display: block; margin-bottom: 4px;">
            5. Thời gian duyệt về:
          </label>
          <div style="display: flex; gap: 8px;">
            <InputText v-model="tempConfig.approvedArrival" placeholder="Ví dụ: approvedArrivalDate" style="flex: 1; font-size: 0.8rem;" />
            <select class="settings-select" @change="tempConfig.approvedArrival = $event.target.value">
              <option value="">-- Chọn cột mẫu --</option>
              <option v-for="c in allAvailablePersonnelColumns" :key="c.id" :value="c.id">{{ c.label }}</option>
            </select>
          </div>
        </div>

        <!-- Setting 6: Approved Extension Date ID -->
        <div>
          <label style="font-size: 0.8rem; font-weight: 700; color: #334155; display: block; margin-bottom: 4px;">
            6. Thời gian duyệt gia hạn:
          </label>
          <div style="display: flex; gap: 8px;">
            <InputText v-model="tempConfig.approvedExtension" placeholder="Ví dụ: approvedExtensionDate" style="flex: 1; font-size: 0.8rem;" />
            <select class="settings-select" @change="tempConfig.approvedExtension = $event.target.value">
              <option value="">-- Chọn cột mẫu --</option>
              <option v-for="c in allAvailablePersonnelColumns" :key="c.id" :value="c.id">{{ c.label }}</option>
            </select>
          </div>
        </div>
      </div>

      <template #footer>
        <div style="display: flex; justify-content: space-between; width: 100%; align-items: center;">
          <Button label="Khôi phục mặc định" severity="secondary" text size="small" @click="resetToDefaultSettings" />
          <div style="display: flex; gap: 8px;">
            <Button label="Hủy" severity="secondary" text size="small" @click="isSettingsOpen = false" />
            <Button label="Lưu Cấu Hình vào CSDL" icon="pi pi-check" severity="success" size="small" :loading="savingConfig" @click="saveDashboardSettings" />
          </div>
        </div>
      </template>
    </Dialog>

    <!-- ========================================================= -->
    <!-- 7. CUSTOM GROUP MODAL (ADD / EDIT GROUP)                 -->
    <!-- ========================================================= -->
    <Dialog
      v-model:visible="isGroupDialogOpen"
      modal
      :header="editingGroup ? 'Chỉnh sửa Nhóm Thống kê' : 'Tạo Nhóm Thống kê Mới'"
      :style="{ width: '480px', maxWidth: '96vw' }"
    >
      <div style="display: flex; flex-direction: column; gap: 12px; padding-top: 8px;">
        <div class="field-item">
          <label class="field-label">Tên Nhóm thống kê <span style="color: #ef4444;">*</span></label>
          <InputText v-model="groupForm.title" placeholder="Ví dụ: Thống kê Đảng viên & Chính trị" style="width: 100%;" />
        </div>
        <div class="field-item">
          <label class="field-label">Mô tả tóm tắt</label>
          <InputText v-model="groupForm.description" placeholder="Ví dụ: Theo dõi tỉ lệ kết nạp Đảng & Phân loại" style="width: 100%;" />
        </div>
        <div class="field-item">
          <label class="field-label">Biểu tượng (Icon)</label>
          <select v-model="groupForm.icon" class="settings-select" style="width: 100%; max-width: 100%;">
            <option value="pi-folder">📁 Thư mục (pi-folder)</option>
            <option value="pi-flag">🚩 Cờ Đảng / Chính trị (pi-flag)</option>
            <option value="pi-building">🏢 Tòa nhà / Phòng ban (pi-building)</option>
            <option value="pi-user">👤 Nhân sự / Cán bộ (pi-user)</option>
            <option value="pi-users">👥 Thân nhân (pi-users)</option>
            <option value="pi-globe">🌐 Nước ngoài (pi-globe)</option>
            <option value="pi-shield">🛡️ An ninh / Thẩm tra (pi-shield)</option>
            <option value="pi-chart-pie">📊 Biểu đồ (pi-chart-pie)</option>
          </select>
        </div>
      </div>
      <template #footer>
        <div style="display: flex; justify-content: flex-end; gap: 8px; width: 100%;">
          <Button label="Hủy" severity="secondary" text size="small" @click="isGroupDialogOpen = false" />
          <Button label="Lưu Nhóm" icon="pi pi-check" severity="success" size="small" @click="saveGroup" />
        </div>
      </template>
    </Dialog>

    <!-- ========================================================= -->
    <!-- 8. CUSTOM WIDGET MODAL (ADD / EDIT WIDGET)               -->
    <!-- ========================================================= -->
    <Dialog
      v-model:visible="isWidgetDialogOpen"
      modal
      :header="editingWidget ? 'Chỉnh sửa Khối Thống kê' : 'Thêm Khối Thống kê Mới'"
      :style="{ width: '560px', maxWidth: '96vw' }"
    >
      <div style="display: flex; flex-direction: column; gap: 12px; padding-top: 8px;">
        <div class="field-item">
          <label class="field-label">Tiêu đề Khối Thống kê <span style="color: #ef4444;">*</span></label>
          <InputText v-model="widgetForm.title" placeholder="Ví dụ: Phân bổ theo Dân tộc, hoặc Tổng số Đảng viên" style="width: 100%;" />
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
          <div class="field-item">
            <label class="field-label">Nguồn dữ liệu</label>
            <select v-model="widgetForm.source" class="settings-select" style="width: 100%; max-width: 100%;">
              <option value="personnel">Hồ sơ Cán bộ (Cá nhân)</option>
              <option value="relatives">Danh sách Thân nhân</option>
              <option value="trips">Lượt đi Nước ngoài (Phụ lục 1)</option>
              <option value="combined_country">🌐 Tổng hợp Quốc gia (Cả Cán bộ & Thân nhân)</option>
              <option value="combined_funding">💰 Tổng hợp Kinh phí (4 Cột & Chung)</option>
            </select>
          </div>

          <div class="field-item">
            <label class="field-label">Kiểu hiển thị <span style="color: #ef4444;">*</span></label>
            <select v-model="widgetForm.displayType" class="settings-select" style="width: 100%; max-width: 100%;">
              <option value="count">🔢 Đếm số lượng (Thẻ chỉ số)</option>
              <option value="chart">📊 Biểu đồ phân bổ & Bảng xếp hạng</option>
            </select>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 10px;">
          <div class="field-item">
            <label class="field-label">Cột dữ liệu cần Thống kê / Đếm <span style="color: #ef4444;">*</span></label>
            <select v-model="widgetForm.columnId" class="settings-select" style="width: 100%; max-width: 100%;" @change="onWidgetColumnSelect">
              <option value="">-- Nhấp để chọn Cột trong hệ thống --</option>
              <option v-for="c in availableColumnsForWidgetSource" :key="c.id" :value="c.id">
                {{ c.label }}
              </option>
            </select>
          </div>

          <div class="field-item">
            <label class="field-label">Độ rộng của Khối</label>
            <select v-model="widgetForm.widthPercent" class="settings-select" style="width: 100%; max-width: 100%;">
              <option :value="25">25% (1/4 hàng)</option>
              <option :value="33">33% (1/3 hàng)</option>
              <option :value="50">50% (1/2 hàng)</option>
              <option :value="100">100% (Toàn hàng)</option>
            </select>
          </div>
        </div>

        <!-- Extra settings for COUNT type -->
        <div v-if="widgetForm.displayType === 'count'" style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; display: flex; flex-direction: column; gap: 8px;">
          <label class="field-label" style="font-size: 0.78rem; font-weight: 700; color: #1e293b;">Điều kiện đếm:</label>
          <div style="display: flex; gap: 12px; font-size: 0.8rem;">
            <label style="display: flex; align-items: center; gap: 4px; cursor: pointer;">
              <input type="radio" v-model="widgetForm.countCondition" value="not_empty" />
              Có dữ liệu (Không để trống)
            </label>
            <label style="display: flex; align-items: center; gap: 4px; cursor: pointer;">
              <input type="radio" v-model="widgetForm.countCondition" value="equals" />
              Khớp giá trị cụ thể
            </label>
          </div>
          <div v-if="widgetForm.countCondition === 'equals'">
            <InputText v-model="widgetForm.countValue" placeholder="Ví dụ: Có, Đảng viên, Hoàn thành, v.v." style="width: 100%; font-size: 0.8rem;" />
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
          <div class="field-item">
            <label class="field-label">Màu sắc chủ đạo</label>
            <select v-model="widgetForm.color" class="settings-select" style="width: 100%; max-width: 100%;">
              <option value="#2e7d32">Xanh lá (Green - #2e7d32)</option>
              <option value="#0284c7">Xanh dương (Blue - #0284c7)</option>
              <option value="#7c3aed">Tím (Purple - #7c3aed)</option>
              <option value="#ea580c">Cam (Orange - #ea580c)</option>
              <option value="#dc2626">Đỏ (Red - #dc2626)</option>
              <option value="#0d9488">Xanh mòng két (Teal - #0d9488)</option>
              <option value="#475569">Xám đậm (Slate - #475569)</option>
            </select>
          </div>

          <div class="field-item">
            <label class="field-label">Biểu tượng (Icon)</label>
            <select v-model="widgetForm.icon" class="settings-select" style="width: 100%; max-width: 100%;">
              <option value="pi-chart-line">📈 Biểu đồ đường (pi-chart-line)</option>
              <option value="pi-chart-pie">🥧 Biểu đồ tròn (pi-chart-pie)</option>
              <option value="pi-chart-bar">📊 Biểu đồ cột (pi-chart-bar)</option>
              <option value="pi-user">👤 Cán bộ (pi-user)</option>
              <option value="pi-users">👥 Nhóm người (pi-users)</option>
              <option value="pi-building">🏢 Đơn vị / Phòng ban (pi-building)</option>
              <option value="pi-flag">🚩 Cờ / Danh hiệu (pi-flag)</option>
              <option value="pi-id-card">🪪 Thẻ CCCD / Hồ sơ (pi-id-card)</option>
              <option value="pi-globe">🌐 Quốc gia / Nước ngoài (pi-globe)</option>
              <option value="pi-shield">🛡️ Thẩm tra / Bảo vệ (pi-shield)</option>
              <option value="pi-check-circle">✅ Hoàn thành / Tích chọn (pi-check-circle)</option>
              <option value="pi-wallet">💰 Kinh phí (pi-wallet)</option>
            </select>
          </div>
        </div>
      </div>
      <template #footer>
        <div style="display: flex; justify-content: flex-end; gap: 8px; width: 100%;">
          <Button label="Hủy" severity="secondary" text size="small" @click="isWidgetDialogOpen = false" />
          <Button label="Lưu Khối Thống Kê" icon="pi pi-check" severity="success" size="small" @click="saveWidget" />
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
import { computeColumnIndexMap } from '@/utils/formatters';
import { getAppSettings, saveAppSettings } from '@/api/settings';

const personnelStore = usePersonnelStore();

// =========================================================================
// 1. DEFAULT DASHBOARD COLUMN CONFIGURATION STATE (Persisted in Directus DB)
// =========================================================================
const DEFAULT_CONFIG = {
  decision: 'decisionNumber',
  country: 'countryName',
  countryRelative: 'countryName',
  funding: 'fundingName',
  fundingBudget: 'fundingBudget',
  fundingSponsor: 'fundingSponsor',
  fundingSelf: 'fundingSelf',
  fundingOther: 'fundingOther',
  fundingRelative: 'fundingName',
  fundingRelativeBudget: 'fundingRelativeBudget',
  fundingRelativeSponsor: 'fundingRelativeSponsor',
  fundingRelativeSelf: 'fundingRelativeSelf',
  fundingRelativeOther: 'fundingRelativeOther',
  approvedDeparture: 'approvedDepartureDate',
  approvedArrival: 'approvedArrivalDate',
  approvedExtension: 'approvedExtensionDate',
};

const colConfig = ref({ ...DEFAULT_CONFIG });
const tempConfig = ref({ ...DEFAULT_CONFIG });
const isSettingsOpen = ref(false);
const savingConfig = ref(false);

const loadDashboardSettings = async () => {
  try {
    const dbConfig = await getAppSettings('dashboard_col_config');
    if (dbConfig && typeof dbConfig === 'object') {
      colConfig.value = { ...DEFAULT_CONFIG, ...dbConfig };
      localStorage.setItem('dashboard_col_config', JSON.stringify(colConfig.value));
    } else {
      const saved = localStorage.getItem('dashboard_col_config');
      if (saved) {
        try {
          colConfig.value = { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
        } catch (e) {}
      }
    }
  } catch (e) {
    console.error('Error loading dashboard column settings:', e);
  }
  tempConfig.value = { ...colConfig.value };
};

const saveDashboardSettings = async () => {
  savingConfig.value = true;
  try {
    colConfig.value = { ...tempConfig.value };
    localStorage.setItem('dashboard_col_config', JSON.stringify(colConfig.value));
    await saveAppSettings('dashboard_col_config', colConfig.value);
    isSettingsOpen.value = false;
  } catch (e) {
    alert('Lưu cấu hình thất bại: ' + e.message);
  } finally {
    savingConfig.value = false;
  }
};

const resetToDefaultSettings = () => {
  tempConfig.value = { ...DEFAULT_CONFIG };
};

const openSettingsDialog = () => {
  tempConfig.value = { ...colConfig.value };
  isSettingsOpen.value = true;
};

const openSingleSetting = (type) => {
  tempConfig.value = { ...colConfig.value };
  isSettingsOpen.value = true;
};

// =========================================================================
// 2. CUSTOM DASHBOARD GROUPS & DYNAMIC WIDGETS
// =========================================================================
const customGroups = ref([]);
const customChartSearches = ref({});

const isGroupDialogOpen = ref(false);
const editingGroup = ref(null);
const groupForm = ref({
  id: '',
  title: '',
  description: '',
  icon: 'pi-folder',
  widgets: [],
});

const isWidgetDialogOpen = ref(false);
const activeGroupForWidget = ref(null);
const editingWidget = ref(null);
const widgetForm = ref({
  id: '',
  title: '',
  source: 'personnel',
  columnId: '',
  columnLabel: '',
  displayType: 'count',
  widthPercent: 33,
  countCondition: 'not_empty',
  countValue: '',
  color: '#2e7d32',
  icon: 'pi-chart-line',
});

const loadCustomGroups = async () => {
  try {
    const dbGroups = await getAppSettings('dashboard_custom_groups');
    if (dbGroups && Array.isArray(dbGroups)) {
      customGroups.value = dbGroups;
      localStorage.setItem('dashboard_custom_groups', JSON.stringify(dbGroups));
    } else {
      const local = localStorage.getItem('dashboard_custom_groups');
      if (local) {
        customGroups.value = JSON.parse(local);
      }
    }
  } catch (e) {
    console.error('Error loading custom groups:', e);
  }
};

const saveCustomGroupsToDb = async () => {
  localStorage.setItem('dashboard_custom_groups', JSON.stringify(customGroups.value));
  try {
    await saveAppSettings('dashboard_custom_groups', customGroups.value);
  } catch (e) {
    console.error('Error saving custom groups to DB:', e);
  }
};

// Group CRUD
const openAddGroupDialog = () => {
  editingGroup.value = null;
  groupForm.value = {
    id: 'grp_' + Date.now(),
    title: '',
    description: '',
    icon: 'pi-folder',
    widgets: [],
  };
  isGroupDialogOpen.value = true;
};

const openEditGroupDialog = (group) => {
  editingGroup.value = group;
  groupForm.value = JSON.parse(JSON.stringify(group));
  isGroupDialogOpen.value = true;
};

const saveGroup = async () => {
  if (!groupForm.value.title.trim()) {
    alert('Vui lòng nhập Tên Nhóm thống kê!');
    return;
  }
  if (editingGroup.value) {
    const idx = customGroups.value.findIndex((g) => g.id === editingGroup.value.id);
    if (idx !== -1) {
      customGroups.value[idx] = { ...customGroups.value[idx], ...groupForm.value };
    }
  } else {
    customGroups.value.push({ ...groupForm.value });
  }
  await saveCustomGroupsToDb();
  isGroupDialogOpen.value = false;
};

const deleteGroup = async (group) => {
  if (!confirm(`Bạn có chắc muốn xóa nhóm "${group.title}" và toàn bộ khối thống kê bên trong?`)) return;
  customGroups.value = customGroups.value.filter((g) => g.id !== group.id);
  await saveCustomGroupsToDb();
};

// Widget CRUD
const openAddWidgetDialog = (group) => {
  activeGroupForWidget.value = group;
  editingWidget.value = null;
  widgetForm.value = {
    id: 'w_' + Date.now(),
    title: '',
    source: 'personnel',
    columnId: '',
    columnLabel: '',
    displayType: 'count',
    widthPercent: 33,
    countCondition: 'not_empty',
    countValue: '',
    color: '#2e7d32',
    icon: 'pi-chart-line',
  };
  isWidgetDialogOpen.value = true;
};

const openEditWidgetDialog = (group, widget) => {
  activeGroupForWidget.value = group;
  editingWidget.value = widget;
  widgetForm.value = {
    widthPercent: 33,
    ...JSON.parse(JSON.stringify(widget)),
  };
  isWidgetDialogOpen.value = true;
};

const onWidgetColumnSelect = () => {
  const selected = availableColumnsForWidgetSource.value.find((c) => c.id === widgetForm.value.columnId);
  if (selected) {
    widgetForm.value.columnLabel = selected.rawLabel || selected.label;
    if (!widgetForm.value.title) {
      widgetForm.value.title = widgetForm.value.displayType === 'count'
        ? `Tổng số ${widgetForm.value.columnLabel}`
        : `Phân bổ theo ${widgetForm.value.columnLabel}`;
    }
  }
};

const saveWidget = async () => {
  if (!widgetForm.value.title.trim() || !widgetForm.value.columnId) {
    alert('Vui lòng nhập Tiêu đề và chọn Cột dữ liệu cần thống kê!');
    return;
  }
  const group = activeGroupForWidget.value;
  if (!group) return;
  if (!group.widgets) group.widgets = [];

  const payload = {
    ...widgetForm.value,
    widthPercent: Number(widgetForm.value.widthPercent) || 33,
  };

  if (editingWidget.value) {
    const idx = group.widgets.findIndex((w) => w.id === editingWidget.value.id);
    if (idx !== -1) {
      group.widgets[idx] = payload;
    }
  } else {
    group.widgets.push(payload);
  }

  await saveCustomGroupsToDb();
  isWidgetDialogOpen.value = false;
};

const getWidgetStyle = (widget) => {
  const wp = Number(widget.widthPercent) || 33;
  if (wp === 100) {
    return {
      flex: '0 0 100%',
      width: '100%',
      maxWidth: '100%',
    };
  }
  if (wp === 50) {
    return {
      flex: '0 0 calc(50% - 0.5rem)',
      width: 'calc(50% - 0.5rem)',
      maxWidth: 'calc(50% - 0.5rem)',
      minWidth: '280px',
    };
  }
  if (wp === 25) {
    return {
      flex: '0 0 calc(25% - 0.75rem)',
      width: 'calc(25% - 0.75rem)',
      maxWidth: 'calc(25% - 0.75rem)',
      minWidth: '200px',
    };
  }
  // Default 33.333%
  return {
    flex: '0 0 calc(33.333% - 0.67rem)',
    width: 'calc(33.333% - 0.67rem)',
    maxWidth: 'calc(33.333% - 0.67rem)',
    minWidth: '240px',
  };
};

const deleteWidget = async (group, widget) => {
  if (!confirm(`Bạn có chắc muốn xóa khối thống kê "${widget.title}"?`)) return;
  group.widgets = group.widgets.filter((w) => w.id !== widget.id);
  await saveCustomGroupsToDb();
};

const getCountWidgets = (group) => {
  return (group.widgets || []).filter((w) => w.displayType === 'count');
};

const getChartWidgets = (group) => {
  return (group.widgets || []).filter((w) => w.displayType === 'chart');
};

const getSourceLabel = (source) => {
  if (source === 'personnel') return 'Cán bộ';
  if (source === 'relatives') return 'Thân nhân';
  if (source === 'trips') return 'Chuyến đi';
  return 'Dữ liệu';
};

const getLightColor = (hex = '#2e7d32') => {
  if (hex === '#2e7d32') return '#dcfce7';
  if (hex === '#0284c7') return '#e0f2fe';
  if (hex === '#7c3aed') return '#f3e8ff';
  if (hex === '#ea580c') return '#ffedd5';
  if (hex === '#dc2626') return '#fee2e2';
  if (hex === '#0d9488') return '#ccfbf1';
  return '#f1f5f9';
};

// Dynamic Computation of Custom Widgets
const getRowFieldValue = (row, colId) => {
  if (!row) return '';
  if (row[colId] !== undefined && row[colId] !== null) return row[colId];
  if (row.custom_data && row.custom_data[colId] !== undefined && row.custom_data[colId] !== null) {
    return row.custom_data[colId];
  }
  return '';
};

const getSourceList = (source) => {
  if (source === 'relatives') return personnelStore.relativesList || [];
  if (source === 'trips') return stats.value.filteredTrips || [];
  return personnelStore.personnelList || [];
};

const computeWidgetCount = (widget) => {
  const list = getSourceList(widget.source);
  if (!widget.columnId) return 0;

  return list.filter((row) => {
    const val = getRowFieldValue(row, widget.columnId);
    if (val === undefined || val === null || String(val).trim() === '' || String(val).trim() === '-') return false;

    if (widget.countCondition === 'equals' && widget.countValue) {
      const target = String(widget.countValue).toLowerCase().trim();
      const actual = String(val).toLowerCase().trim();
      return actual === target || actual.includes(target);
    }
    return true;
  }).length;
};

const computeWidgetChartData = (widget) => {
  if (widget.source === 'combined_country') {
    const counts = {};
    let total = 0;
    (stats.value.filteredTrips || []).forEach((t) => {
      const c = t.countryName || getTripValue(t, colConfig.value.country);
      if (c && c !== 'Chưa rõ' && c !== '-') {
        counts[c] = (counts[c] || 0) + 1;
        total++;
      }
    });
    (personnelStore.relativesList || []).forEach((r) => {
      const c = r.countryName || r.country || getRowFieldValue(r, 'countryName') || getRowFieldValue(r, 'country');
      if (c && c !== 'Chưa rõ' && c !== '-') {
        counts[c] = (counts[c] || 0) + 1;
        total++;
      }
    });
    const chartList = Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
    const max = chartList.length > 0 ? chartList[0].count : 1;
    return { list: chartList, max, total };
  }

  if (widget.source === 'combined_funding') {
    return {
      list: stats.value.fundingList || [],
      max: stats.value.maxFunding || 1,
      total: (stats.value.fundingList || []).reduce((sum, item) => sum + item.count, 0),
    };
  }

  const list = getSourceList(widget.source);
  if (!widget.columnId) return { list: [], max: 1, total: 0 };

  const counts = {};
  let total = 0;

  list.forEach((row) => {
    const val = getRowFieldValue(row, widget.columnId);
    if (val === undefined || val === null) return;
    const strVal = String(val).trim();
    if (!strVal || strVal === '-') return;

    counts[strVal] = (counts[strVal] || 0) + 1;
    total++;
  });

  const chartList = Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const max = chartList.length > 0 ? chartList[0].count : 1;
  return { list: chartList, max, total };
};

const getFilteredChartList = (widget) => {
  const data = computeWidgetChartData(widget).list;
  const q = (customChartSearches.value[widget.id] || '').toLowerCase().trim();
  if (!q) return data;
  return data.filter((item) => item.name.toLowerCase().includes(q));
};

const availableColumnsForWidgetSource = computed(() => {
  const source = widgetForm.value.source;
  const mapping = source === 'relatives' ? personnelStore.importMappingRelative : personnelStore.importMappingPersonnel;
  const colMap = computeColumnIndexMap(mapping);
  const list = [];

  (mapping || []).forEach((g) => {
    (g.columns || []).forEach((c) => {
      if (c.id && c.label) {
        const colNum = colMap[c.id] ? `[${colMap[c.id]}] ` : '';
        const grp = g.group ? `[${g.group}] ` : '';
        list.push({
          id: c.id,
          rawLabel: c.label,
          label: `${colNum}${grp}${c.label} (${c.id})`,
        });
      }
    });
  });
  return list;
});

// All Available Relative Columns from Settings for Dropdown selection
const allAvailableRelativeColumns = computed(() => {
  const colMap = computeColumnIndexMap(personnelStore.importMappingRelative);
  const list = [];
  (personnelStore.importMappingRelative || []).forEach((g) => {
    (g.columns || []).forEach((c) => {
      if (c.id && c.label) {
        const colNum = colMap[c.id] ? `[${colMap[c.id]}] ` : '';
        const grp = g.group ? `[${g.group}] ` : '';
        list.push({
          id: c.id,
          label: `${colNum}${grp}${c.label} (${c.id})`,
        });
      }
    });
  });
  return list;
});

const allAvailablePersonnelColumns = computed(() => {
  const colMap = computeColumnIndexMap(personnelStore.importMappingPersonnel);
  const list = [];
  (personnelStore.importMappingPersonnel || []).forEach((g) => {
    (g.columns || []).forEach((c) => {
      if (c.id && c.label) {
        const colNum = colMap[c.id] ? `[${colMap[c.id]}] ` : '';
        const grp = g.group ? `[${g.group}] ` : '';
        list.push({
          id: c.id,
          label: `${colNum}${grp}${c.label} (${c.id})`,
        });
      }
    });
  });
  return list;
});

// =========================================================================
// 3. TIME FILTER STATE & STAT COMPUTATION
// =========================================================================
const timeFilterMode = ref('all');
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
    const day = now.getDay() || 7;
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - day + 1);
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    return d >= startOfWeek && d <= endOfWeek;
  }

  if (timeFilterMode.value === 'month') {
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }

  if (timeFilterMode.value === 'year') {
    return d.getFullYear() === now.getFullYear();
  }

  if (timeFilterMode.value === 'custom') {
    const start = customStartDate.value ? parseDateObj(customStartDate.value) : null;
    const end = customEndDate.value ? parseDateObj(customEndDate.value) : null;
    if (start && end) return d >= start && d <= end;
    if (start) return d >= start;
    if (end) return d <= end;
    return true;
  }

  return true;
};

const getTripValue = (trip, colId) => {
  if (!trip || !colId) return '';
  if (trip[colId] !== undefined && trip[colId] !== null && String(trip[colId]).trim() !== '') {
    return String(trip[colId]).trim();
  }
  if (trip.custom_data) {
    try {
      const cd = typeof trip.custom_data === 'string' ? JSON.parse(trip.custom_data) : trip.custom_data;
      if (cd && cd[colId] !== undefined && cd[colId] !== null && String(cd[colId]).trim() !== '') {
        return String(cd[colId]).trim();
      }
    } catch (e) {}
  }
  return '';
};

const stats = computed(() => {
  const pList = personnelStore.personnelList || [];
  const rList = personnelStore.relativesList || [];
  const totalRelatives = rList.length;

  const filteredTrips = [];
  const missingDecisionTrips = [];
  const extendedTrips = [];
  const overdueTrips = [];
  const onTimeTrips = [];

  const countries = {};
  const fundings = {};

  // Build unified list of trips from both personnel.trips and store.tripsList
  const allTripsToProcess = [];
  const processedTripIds = new Set();

  pList.forEach((p) => {
    (p.trips || []).forEach((t) => {
      const tid = t.id || `${p.id}_${t.departureDate}_${t.countryName || t.country || ''}`;
      if (!processedTripIds.has(tid)) {
        processedTripIds.add(tid);
        allTripsToProcess.push({
          ...t,
          personnelId: p.id,
          personnelCode: p.code || p.id,
          personnelName: p.name,
        });
      }
    });
  });

  (personnelStore.tripsList || []).forEach((t) => {
    const tid = t.id || `${t.personnelId}_${t.departureDate}_${t.countryName || t.country || ''}`;
    if (!processedTripIds.has(tid)) {
      processedTripIds.add(tid);
      const matchedP = pList.find((p) => p.id === t.personnelId || p.code === t.personnelId || p.code === t.personnelCode);
      allTripsToProcess.push({
        ...t,
        personnelId: matchedP?.id || t.personnelId || '',
        personnelCode: matchedP?.code || t.personnelCode || t.personnelId || '',
        personnelName: matchedP?.name || t.personnelName || 'Cán bộ',
      });
    }
  });

  allTripsToProcess.forEach((t) => {
    const depDate = t.departureDate || t.approvedDepartureDate;
    if (!isWithinTimeFilter(depDate)) {
      return;
    }

    const cName = getTripValue(t, colConfig.value.country) || 'Chưa rõ';
    const fName = getTripValue(t, colConfig.value.funding) || 'Chưa rõ';
    const dNum = getTripValue(t, colConfig.value.decision) || '';
    const appDep = getTripValue(t, colConfig.value.approvedDeparture) || t.departureDate || '';
    const appArr = getTripValue(t, colConfig.value.approvedArrival) || t.arrivalDate || '';
    const appExt = getTripValue(t, colConfig.value.approvedExtension) || '';

    const enrichedTrip = {
      ...t,
      countryName: cName,
      fundingName: fName,
      decisionNumber: dNum,
      approvedDepartureDate: appDep,
      approvedArrivalDate: appArr,
      approvedExtensionDate: appExt,
    };

    filteredTrips.push(enrichedTrip);

    if (!enrichedTrip.decisionNumber) {
      missingDecisionTrips.push(enrichedTrip);
    }

    if (enrichedTrip.approvedExtensionDate) {
      extendedTrips.push(enrichedTrip);
    } else {
      const arr = parseDateObj(enrichedTrip.arrivalDate);
      const appArrObj = parseDateObj(enrichedTrip.approvedArrivalDate);
      if (arr && appArrObj && arr > appArrObj) {
        overdueTrips.push(enrichedTrip);
      } else {
        onTimeTrips.push(enrichedTrip);
      }
    }

    if (cName && cName !== 'Chưa rõ') {
      countries[cName] = (countries[cName] || 0) + 1;
    }

    // 4. Funding aggregation (Personnel)
    if (fName && fName !== 'Chưa rõ' && fName !== '-') {
      fundings[fName] = (fundings[fName] || 0) + 1;
    }

    const budgetVal = getTripValue(t, colConfig.value.fundingBudget);
    const sponsorVal = getTripValue(t, colConfig.value.fundingSponsor);
    const selfVal = getTripValue(t, colConfig.value.fundingSelf);
    const otherVal = getTripValue(t, colConfig.value.fundingOther);

    if (budgetVal && String(budgetVal).trim() && String(budgetVal).trim() !== '-') {
      fundings['Ngân sách nhà nước'] = (fundings['Ngân sách nhà nước'] || 0) + 1;
    }
    if (sponsorVal && String(sponsorVal).trim() && String(sponsorVal).trim() !== '-') {
      const spLabel = (String(sponsorVal).toLowerCase() === 'x' || String(sponsorVal).toLowerCase() === 'có' || String(sponsorVal).trim() === '1')
        ? 'Cơ quan / Tổ chức tài trợ'
        : `Tài trợ (${sponsorVal})`;
      fundings[spLabel] = (fundings[spLabel] || 0) + 1;
    }
    if (selfVal && String(selfVal).trim() && String(selfVal).trim() !== '-') {
      fundings['Tự túc'] = (fundings['Tự túc'] || 0) + 1;
    }
    if (otherVal && String(otherVal).trim() && String(otherVal).trim() !== '-') {
      const othLabel = (String(otherVal).toLowerCase() === 'x' || String(otherVal).toLowerCase() === 'có' || String(otherVal).trim() === '1')
        ? 'Nguồn khác'
        : `Khác (${otherVal})`;
      fundings[othLabel] = (fundings[othLabel] || 0) + 1;
    }
  });

  // Also aggregate Relatives Country & Funding strictly by configured columns
  rList.forEach((r) => {
    const rc = getRowFieldValue(r, colConfig.value.countryRelative);
    if (rc && String(rc).trim() && String(rc).trim() !== '-' && String(rc).trim() !== 'Chưa rõ') {
      const cleanRc = String(rc).trim();
      countries[cleanRc] = (countries[cleanRc] || 0) + 1;
    }

    const rf = getRowFieldValue(r, colConfig.value.fundingRelative);
    if (rf && String(rf).trim() && String(rf).trim() !== '-' && String(rf).trim() !== 'Chưa rõ') {
      fundings[String(rf).trim()] = (fundings[String(rf).trim()] || 0) + 1;
    }

    const rBudget = getRowFieldValue(r, colConfig.value.fundingRelativeBudget);
    const rSponsor = getRowFieldValue(r, colConfig.value.fundingRelativeSponsor);
    const rSelf = getRowFieldValue(r, colConfig.value.fundingRelativeSelf);
    const rOther = getRowFieldValue(r, colConfig.value.fundingRelativeOther);

    if (rBudget && String(rBudget).trim() && String(rBudget).trim() !== '-') {
      fundings['Học bổng / Ngân sách (Thân nhân)'] = (fundings['Học bổng / Ngân sách (Thân nhân)'] || 0) + 1;
    }
    if (rSponsor && String(rSponsor).trim() && String(rSponsor).trim() !== '-') {
      const spLabel = (String(rSponsor).toLowerCase() === 'x' || String(rSponsor).toLowerCase() === 'có' || String(rSponsor).trim() === '1')
        ? 'Tài trợ (Thân nhân)'
        : `Tài trợ Thân nhân (${rSponsor})`;
      fundings[spLabel] = (fundings[spLabel] || 0) + 1;
    }
    if (rSelf && String(rSelf).trim() && String(rSelf).trim() !== '-') {
      fundings['Tự túc (Thân nhân)'] = (fundings['Tự túc (Thân nhân)'] || 0) + 1;
    }
    if (rOther && String(rOther).trim() && String(rOther).trim() !== '-') {
      const othLabel = (String(rOther).toLowerCase() === 'x' || String(rOther).toLowerCase() === 'có' || String(rOther).trim() === '1')
        ? 'Nguồn khác (Thân nhân)'
        : `Khác (${rOther})`;
      fundings[othLabel] = (fundings[othLabel] || 0) + 1;
    }
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

// =========================================================================
// 4. DRILL-DOWN POPUP MODAL LOGIC
// =========================================================================
const isDrilldownOpen = ref(false);
const drilldownTitle = ref('');
const drilldownType = ref('');
const drilldownCategory = ref('trips'); // 'personnel' | 'relatives' | 'trips'
const drilldownData = ref([]);
const drilldownSearch = ref('');
const drilldownHasDualTabs = ref(false);
const drilldownActiveTab = ref('trips'); // 'trips' | 'relatives'
const drilldownTripsList = ref([]);
const drilldownRelativesList = ref([]);

const openDrilldown = (type, title, filterContext = {}) => {
  drilldownType.value = type;
  drilldownTitle.value = title;
  drilldownSearch.value = '';
  drilldownHasDualTabs.value = false;
  drilldownTripsList.value = [];
  drilldownRelativesList.value = [];

  if (type === 'all_personnel') {
    drilldownCategory.value = 'personnel';
    drilldownData.value = [...(personnelStore.personnelList || [])];
  } else if (type === 'all_trips') {
    drilldownCategory.value = 'trips';
    drilldownData.value = [...stats.value.filteredTrips];
  } else if (type === 'all_relatives') {
    drilldownCategory.value = 'relatives';
    drilldownData.value = [...(personnelStore.relativesList || [])];
  } else if (type === 'missing_decision') {
    drilldownCategory.value = 'trips';
    drilldownData.value = [...stats.value.missingDecisionTrips];
  } else if (type === 'schedule_warnings') {
    drilldownCategory.value = 'trips';
    drilldownData.value = [...stats.value.extendedTrips, ...stats.value.overdueTrips];
  } else if (type === 'schedule_extended') {
    drilldownCategory.value = 'trips';
    drilldownData.value = [...stats.value.extendedTrips];
  } else if (type === 'schedule_overdue') {
    drilldownCategory.value = 'trips';
    drilldownData.value = [...stats.value.overdueTrips];
  } else if (type === 'schedule_ontime') {
    drilldownCategory.value = 'trips';
    drilldownData.value = [...stats.value.onTimeTrips];
  } else if (type === 'country' && filterContext.countryName) {
    const cTarget = String(filterContext.countryName).toLowerCase().trim();
    drilldownTripsList.value = stats.value.filteredTrips.filter((t) => {
      const c = String(getTripValue(t, colConfig.value.country)).toLowerCase().trim();
      return c === cTarget;
    });
    drilldownRelativesList.value = (personnelStore.relativesList || []).filter((r) => {
      const rc = String(getRowFieldValue(r, colConfig.value.countryRelative)).toLowerCase().trim();
      return rc === cTarget;
    });
    drilldownHasDualTabs.value = true;
    drilldownActiveTab.value = drilldownTripsList.value.length > 0 ? 'trips' : 'relatives';
    drilldownCategory.value = drilldownActiveTab.value;
  } else if (type === 'funding' && filterContext.fundingName) {
    const fTarget = String(filterContext.fundingName).toLowerCase().trim();
    drilldownTripsList.value = stats.value.filteredTrips.filter((t) => {
      const f = String(getTripValue(t, colConfig.value.funding)).toLowerCase().trim();
      return f === fTarget;
    });
    drilldownRelativesList.value = (personnelStore.relativesList || []).filter((r) => {
      const rf = String(getRowFieldValue(r, colConfig.value.fundingRelative)).toLowerCase().trim();
      return rf === fTarget;
    });
    drilldownHasDualTabs.value = true;
    drilldownActiveTab.value = drilldownTripsList.value.length > 0 ? 'trips' : 'relatives';
    drilldownCategory.value = drilldownActiveTab.value;
  } else {
    drilldownCategory.value = 'trips';
    drilldownData.value = [];
  }

  isDrilldownOpen.value = true;
};

// Custom Widget Drilldown
const openCustomWidgetDrilldown = (widget) => {
  drilldownType.value = widget.id;
  drilldownTitle.value = `${widget.title} (Cột: ${widget.columnLabel || widget.columnId})`;
  drilldownCategory.value = widget.source;
  drilldownSearch.value = '';
  drilldownHasDualTabs.value = false;

  const list = getSourceList(widget.source);
  drilldownData.value = list.filter((row) => {
    const val = getRowFieldValue(row, widget.columnId);
    if (val === undefined || val === null || String(val).trim() === '' || String(val).trim() === '-') return false;
    if (widget.countCondition === 'equals' && widget.countValue) {
      const target = String(widget.countValue).toLowerCase().trim();
      const actual = String(val).toLowerCase().trim();
      return actual === target || actual.includes(target);
    }
    return true;
  });

  isDrilldownOpen.value = true;
};

const openCustomChartItemDrilldown = (widget, itemName) => {
  drilldownType.value = `${widget.id}_${itemName}`;
  drilldownTitle.value = `${widget.title}: ${itemName}`;
  drilldownCategory.value = widget.source;
  drilldownSearch.value = '';

  if (widget.source === 'combined_country') {
    const cTarget = String(itemName).toLowerCase().trim();
    drilldownTripsList.value = stats.value.filteredTrips.filter(
      (t) => (t.countryName || '').toLowerCase().trim() === cTarget
    );
    drilldownRelativesList.value = (personnelStore.relativesList || []).filter((r) => {
      const rc = getRowFieldValue(r, colConfig.value.countryRelative) || r.countryName || r.country || '';
      return String(rc).toLowerCase().trim() === cTarget;
    });
    drilldownHasDualTabs.value = true;
    drilldownActiveTab.value = drilldownTripsList.value.length > 0 ? 'trips' : 'relatives';
  } else {
    drilldownHasDualTabs.value = false;
    const list = getSourceList(widget.source);
    drilldownData.value = list.filter((row) => {
      const val = getRowFieldValue(row, widget.columnId);
      return String(val || '').trim().toLowerCase() === String(itemName).trim().toLowerCase();
    });
  }

  isDrilldownOpen.value = true;
};

const currentDrilldownList = computed(() => {
  if (drilldownHasDualTabs.value) {
    return drilldownActiveTab.value === 'trips' ? drilldownTripsList.value : drilldownRelativesList.value;
  }
  return drilldownData.value;
});

const filteredDrilldownData = computed(() => {
  const q = (drilldownSearch.value || '').toLowerCase().trim();
  const raw = currentDrilldownList.value;
  if (!q) return raw;
  return raw.filter((row) => {
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
  const tabSuffix = drilldownHasDualTabs.value ? `_${drilldownActiveTab.value}` : '';
  const fileName = `Thong_Ke_${drilldownType.value}${tabSuffix}_${new Date().toISOString().slice(0, 10)}`;
  exportToExcel(filteredDrilldownData.value, fileName, 'Thống kê');
};

const refreshData = async () => {
  await personnelStore.fetchPersonnel();
};

onMounted(async () => {
  await loadDashboardSettings();
  await loadCustomGroups();
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
  padding: 6px 10px;
  font-size: 0.78rem;
  color: #334155;
  background: #ffffff;
  max-width: 320px;
  font-weight: 500;
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

.btn-add-widget-green {
  background: #2e7d32;
  color: #ffffff;
  border: none;
  border-radius: 6px;
  padding: 5px 12px;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  transition: all 0.15s ease;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.btn-add-widget-green:hover {
  background: #1b5e20;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
</style>
