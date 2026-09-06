<template>
  <div class="app-content">
    <!-- Top Filter Bar & Dashboard Settings Header -->
    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 1.25rem; background: #ffffff; padding: 12px 16px; border-radius: 12px; border: 1px solid #e5e7eb; box-shadow: 0 1px 3px rgba(0,0,0,0.03);">
      <div style="display: flex; align-items: center; gap: 10px;">
        <div style="width: 36px; height: 36px; border-radius: 10px; background: #e8f5e9; color: #2e7d32; display: flex; align-items: center; justify-content: center;">
          <i class="pi pi-chart-bar" style="font-size: 1.2rem;"></i>
        </div>
        <div>
          <h2 style="font-size: 1.05rem; font-weight: 700; color: #1e293b; margin: 0;">Thống kê</h2>
          <span style="font-size: 0.76rem; color: #64748b;">Tổng quan tình hình cán bộ, xuất nhập cảnh, thân nhân & các chỉ số chuyên đề</span>
        </div>
      </div>

      <!-- Action Buttons -->
      <div style="display: flex; align-items: center; flex-wrap: wrap; gap: 8px;">
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
    <!-- 1. CUSTOM DASHBOARD GROUPS (USER CONFIGURED - AT TOP)     -->
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
          <!-- Move Group Up / Down -->
          <Button
            icon="pi pi-arrow-up"
            size="small"
            severity="secondary"
            text
            rounded
            :disabled="gIdx === 0"
            @click="moveCustomGroup(gIdx, -1)"
            v-tooltip.top="'Dời nhóm lên trên'"
          />
          <Button
            icon="pi pi-arrow-down"
            size="small"
            severity="secondary"
            text
            rounded
            :disabled="gIdx === customGroups.length - 1"
            @click="moveCustomGroup(gIdx, 1)"
            v-tooltip.top="'Dời nhóm xuống dưới'"
          />
          <button
            type="button"
            class="btn-add-widget-green"
            @click="openAddWidgetDialog(group)"
            title="Thêm thẻ đếm số lượng hoặc biểu đồ phân bổ vào nhóm này"
          >
            <i class="pi pi-plus" style="font-size: 0.75rem;"></i> Thêm Khối Thống kê
          </button>
          <button
            v-if="group.widgets && group.widgets.length > 1"
            type="button"
            class="btn-secondary-action"
            @click="openReorderWidgetsDialog(group)"
            title="Sắp xếp thứ tự các khối thống kê trong nhóm này (đưa lên đầu tiên, thứ 2, 3...)"
            style="display: inline-flex; align-items: center; gap: 5px; font-size: 0.75rem; padding: 4px 10px; border-radius: 6px; border: 1px solid #cbd5e1; background: #ffffff; color: #334155; font-weight: 600; cursor: pointer;"
          >
            <i class="pi pi-sort-alt" style="font-size: 0.75rem; color: #0284c7;"></i> Sắp xếp vị trí
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
          v-for="(widget, wIdx) in group.widgets"
          :key="widget.id"
          :style="getWidgetStyle(widget)"
        >
          <!-- 1. Dạng Đếm Số Lượng (Count Metric Card) -->
          <div
            v-if="widget.displayType === 'count'"
            class="stat-card"
            :style="{
              borderLeft: `4px solid ${widget.color || '#2e7d32'}`,
              backgroundColor: widget.bgColor || '#ffffff',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: '1rem 1.15rem'
            }"
            @click="handleWidgetClick(widget)"
            style="cursor: pointer;"
          >
            <div>
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                <div style="flex: 1; padding-right: 6px;">
                  <span class="stat-label" :style="{ color: widget.color || '#334155', fontSize: '0.88rem', fontWeight: '700', lineHeight: '1.35' }">{{ widget.title }}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 4px; flex-shrink: 0;" @click.stop>
                  <!-- Nút dời trái < (lên trước) -->
                  <button
                    v-if="wIdx > 0"
                    type="button"
                    class="btn-card-setting"
                    @click.stop="moveWidget(group, widget, -1)"
                    title="Dời thẻ sang trái (lên trước)"
                  >
                    <i class="pi pi-chevron-left" style="font-size: 0.72rem;"></i>
                  </button>
                  <!-- Nút dời phải > (về sau) -->
                  <button
                    v-if="wIdx < group.widgets.length - 1"
                    type="button"
                    class="btn-card-setting"
                    @click.stop="moveWidget(group, widget, 1)"
                    title="Dời thẻ sang phải (về sau)"
                  >
                    <i class="pi pi-chevron-right" style="font-size: 0.72rem;"></i>
                  </button>
                  <!-- Cài đặt khối -->
                  <button type="button" class="btn-card-setting" @click.stop="openEditWidgetDialog(group, widget)" title="Cài đặt khối này">
                    <i class="pi pi-pencil"></i>
                  </button>
                  <!-- Xóa -->
                  <button type="button" class="btn-card-setting" @click.stop="deleteWidget(group, widget)" title="Xóa khối này" style="color: #ef4444;">
                    <i class="pi pi-trash"></i>
                  </button>
                </div>
              </div>
              <div class="stat-value" :style="{ color: widget.color || '#1e293b', fontSize: '2.1rem', margin: '4px 0 0 0' }">
                {{ computeWidgetCount(widget) }}
              </div>
            </div>
            <div style="display: flex; justify-content: flex-end; align-items: center; margin-top: 6px;">
              <span class="view-more-tag" :style="{ color: widget.color || '#1e293b' }">
                {{ widget.topicId ? 'Mở Chuyên đề' : 'Xem chi tiết' }} <i class="pi pi-arrow-right"></i>
              </span>
            </div>
          </div>

          <!-- 2. Dạng Biểu đồ Cột dọc (Vertical Bar Chart) -->
          <div
            v-else-if="widget.displayType === 'vertical_bar'"
            style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 10px; padding: 12px; height: 100%; display: flex; flex-direction: column; justify-content: space-between;"
          >
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.85rem; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px;">
              <div style="display: flex; align-items: center; gap: 6px;">
                <i :class="['pi', widget.icon || 'pi-chart-bar']" :style="{ color: widget.color || '#2e7d32', fontSize: '1.05rem' }"></i>
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

            <!-- Vertical Columns Area -->
            <div style="height: 240px; overflow-x: auto; overflow-y: hidden; display: flex; align-items: flex-end; padding: 12px 6px 4px 6px; background: #fafafa; border: 1px solid #f1f5f9; border-radius: 8px;">
              <div v-if="getFilteredChartList(widget).length === 0" style="width: 100%; text-align: center; color: #94a3b8; padding: 3rem 0; font-size: 0.78rem;">
                Không có dữ liệu phân loại phù hợp.
              </div>
              <div
                v-else
                style="display: flex; align-items: flex-end; gap: 14px; min-width: 100%; height: 100%; padding-bottom: 2px;"
              >
                <div
                  v-for="(item, cIdx) in getFilteredChartList(widget)"
                  :key="item.name"
                  class="country-column-item"
                  @click="handleChartItemClick(widget, item.name)"
                  :title="`${item.name}\n- Số lượng: ${item.count} bản ghi`"
                  style="cursor: pointer;"
                >
                  <span class="column-top-total">{{ item.count }}</span>
                  <div class="column-bar-track">
                    <div
                      v-if="item.count > 0"
                      class="column-segment-cb"
                      :style="{
                        height: `${(item.count / (computeWidgetChartData(widget).max || 1)) * 100}%`,
                        background: widget.color || '#2e7d32'
                      }"
                    >
                      <span v-if="item.count >= 2" class="segment-label">{{ item.count }}</span>
                    </div>
                  </div>
                  <div class="column-label" :title="item.name">
                    {{ item.name }}
                  </div>
                  <div class="column-sub-badges">
                    <span :style="{ color: widget.color || '#2e7d32', fontWeight: '700' }">{{ item.count }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 3. Dạng Danh sách Cột ngang (Horizontal Progress Bar) -->
          <div
            v-else
            style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 10px; padding: 12px; height: 100%; display: flex; flex-direction: column; justify-content: space-between;"
          >
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.85rem; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px;">
              <div style="display: flex; align-items: center; gap: 6px;">
                <i :class="['pi', widget.icon || 'pi-bars']" :style="{ color: widget.color || '#2e7d32', fontSize: '1.05rem' }"></i>
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
                @click="handleChartItemClick(widget, item.name)"
                style="cursor: pointer;"
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
                      {{ item.count }} bản ghi
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
          Hệ thống tự động liên kết CCCD trong bảng Chuyến đi với Cán bộ hoặc Thân nhân để phân loại chính xác số lượt đi.
        </div>

        <!-- Setting 1: Country ID (Trip) -->
        <div>
          <label style="font-size: 0.8rem; font-weight: 700; color: #334155; display: block; margin-bottom: 4px;">
            1. Cài đặt Cột Quốc gia (Đếm & Biểu đồ Toàn bộ Quốc gia):
          </label>
          <div style="font-size: 0.72rem; color: #0284c7; background: #e0f2fe; padding: 6px 10px; border-radius: 6px; margin-bottom: 6px;">
            💡 Hệ thống tự động bóc tách và phân loại số lượt đi của Cán bộ (CB) hoặc Thân nhân (TN) dựa theo CCCD người đi.
          </div>
          <div style="display: flex; gap: 8px;">
            <InputText v-model="tempConfig.country" placeholder="Ví dụ: countryName" style="flex: 1; font-size: 0.8rem;" />
            <select class="settings-select" @change="tempConfig.country = $event.target.value">
              <option value="">-- Chọn cột Quốc gia (Chuyến đi) --</option>
              <option v-for="c in allAvailableTripColumns" :key="c.id" :value="c.id">{{ c.label }}</option>
            </select>
          </div>
        </div>

        <!-- Setting 2: Funding ID (Trip) -->
        <div>
          <label style="font-size: 0.8rem; font-weight: 700; color: #334155; display: block; margin-bottom: 4px;">
            2. Cài đặt Cột Nguồn kinh phí (Đếm toàn bộ Kinh phí & Biểu đồ):
          </label>
          <div style="font-size: 0.72rem; color: #0284c7; background: #e0f2fe; padding: 6px 10px; border-radius: 6px; margin-bottom: 6px;">
            💡 Hệ thống tự động so khớp CCCD chuyến đi với Cán bộ hoặc Thân nhân và gom vào 4 nhóm: Ngân sách nhà nước, Tài trợ, Tự túc, Khác.
          </div>
          <div style="display: flex; gap: 8px;">
            <InputText v-model="tempConfig.funding" placeholder="Ví dụ: fundingName" style="flex: 1; font-size: 0.8rem;" />
            <select class="settings-select" @change="tempConfig.funding = $event.target.value">
              <option value="">-- Chọn cột Nguồn kinh phí (Chuyến đi) --</option>
              <option v-for="c in allAvailableTripColumns" :key="c.id" :value="c.id">{{ c.label }}</option>
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
    <!-- ========================================================= -->
    <!-- 8. CUSTOM WIDGET MODAL (ADD / EDIT WIDGET)               -->
    <!-- ========================================================= -->
    <Dialog
      v-model:visible="isWidgetDialogOpen"
      modal
      :header="editingWidget ? 'Chỉnh sửa Khối Thống kê' : 'Thêm Khối Thống kê Mới'"
      :style="{ width: '560px', maxWidth: '96vw' }"
    >
      <div style="display: flex; flex-direction: column; gap: 14px; padding-top: 6px;">
        <!-- 1. CHỌN CHUYÊN ĐỀ NGUỒN -->
        <div class="field-item">
          <label class="field-label" style="font-weight: 700; color: #1e293b;">1. Chọn Chuyên đề nguồn <span style="color: #ef4444;">*</span></label>
          <select v-model="selectedWidgetTopicId" class="settings-select" style="width: 100%; max-width: 100%; font-weight: 600;" @change="onTopicSelectChange">
            <option v-for="t in availableTopicDashboards" :key="t.id" :value="t.id">
              📁 {{ t.title }} (Mã: {{ t.code || t.id }})
            </option>
          </select>
        </div>

        <!-- 2. CHỌN KHỐI THỐNG KÊ Ở CHUYÊN ĐỀ -->
        <div class="field-item">
          <label class="field-label" style="font-weight: 700; color: #1e293b;">2. Chọn Khối Thống kê (Metric Card) của Chuyên đề <span style="color: #ef4444;">*</span></label>
          <select v-model="selectedWidgetCardKey" class="settings-select" style="width: 100%; max-width: 100%; font-weight: 600;" @change="onTopicCardSelectChange">
            <option v-for="(card, cIdx) in availableCardsForSelectedTopic" :key="card.id || cIdx" :value="card.id || card.label || `card_${cIdx}`">
              🎯 {{ card.label }} (Đang có: {{ getCardMetricValueForTopic(card, selectedTopicObject) }} bản ghi)
            </option>
          </select>
        </div>

        <!-- 3. CHỌN DẠNG HIỂN THỊ (SỐ ĐẾM / CỘT DỌC / CỘT NGANG) -->
        <div class="field-item">
          <label class="field-label" style="font-weight: 700; color: #1e293b;">3. Chọn Dạng hiển thị trên Dashboard <span style="color: #ef4444;">*</span></label>
          <select v-model="widgetForm.displayType" class="settings-select" style="width: 100%; max-width: 100%; font-weight: 600;">
            <option value="count">🔢 Dạng Số đếm (Metric Card)</option>
            <option value="vertical_bar">📊 Dạng Cột dọc (Vertical Bar Chart)</option>
            <option value="horizontal_bar">📋 Dạng Danh sách cột ngang (Horizontal Progress Bar)</option>
          </select>
        </div>

        <!-- 4. TIÊU ĐỀ -->
        <div class="field-item">
          <label class="field-label" style="font-weight: 700; color: #1e293b;">4. Tiêu đề hiển thị trên Dashboard <span style="color: #ef4444;">*</span></label>
          <InputText v-model="widgetForm.title" placeholder="Tiêu đề khối" style="width: 100%;" />
        </div>

        <!-- 4. ĐỘ RỘNG, MÀU VIỀN & MÀU NỀN PASTEL -->
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px;">
          <div class="field-item">
            <label class="field-label" style="font-weight: 700; color: #1e293b;">Độ rộng của Khối</label>
            <select v-model="widgetForm.widthPercent" class="settings-select" style="width: 100%; max-width: 100%;">
              <option :value="16.66">16.66% (1/6 hàng - 6 khối/dòng)</option>
              <option :value="20">20% (1/5 hàng - 5 khối/dòng)</option>
              <option :value="25">25% (1/4 hàng - 4 khối/dòng)</option>
              <option :value="33">33% (1/3 hàng - 3 khối/dòng)</option>
              <option :value="50">50% (1/2 hàng - 2 khối/dòng)</option>
              <option :value="100">100% (Toàn hàng - 1 khối/dòng)</option>
            </select>
          </div>
          <div class="field-item">
            <label class="field-label" style="font-weight: 700; color: #1e293b;">Màu viền & Điểm nhấn</label>
            <select v-model="widgetForm.color" class="settings-select" style="width: 100%; max-width: 100%;">
              <option value="#0284c7">Xanh dương (Blue - #0284c7)</option>
              <option value="#2e7d32">Xanh lá (Green - #2e7d32)</option>
              <option value="#7c3aed">Tím (Purple - #7c3aed)</option>
              <option value="#ea580c">Cam (Orange - #ea580c)</option>
              <option value="#dc2626">Đỏ (Red - #dc2626)</option>
              <option value="#0d9488">Xanh Teal (#0d9488)</option>
              <option value="#e11d48">Hồng Đỏ (#e11d48)</option>
              <option value="#d97706">Vàng Hổ Phách (#d97706)</option>
              <option value="#475569">Xám Slate (#475569)</option>
            </select>
          </div>
          <div class="field-item">
            <label class="field-label" style="font-weight: 700; color: #1e293b;">Màu nền Pastel</label>
            <select v-model="widgetForm.bgColor" class="settings-select" style="width: 100%; max-width: 100%;">
              <option value="#ffffff">Trắng tiêu chuẩn (Mặc định)</option>
              <option value="#f0f9ff">Pastel Xanh Dương nhạt</option>
              <option value="#f0fdf4">Pastel Xanh Lá nhạt</option>
              <option value="#faf5ff">Pastel Tím nhạt</option>
              <option value="#fff7ed">Pastel Cam nhạt</option>
              <option value="#fef2f2">Pastel Đỏ nhạt</option>
              <option value="#f0fdfa">Pastel Teal nhạt</option>
              <option value="#fffbeb">Pastel Vàng nhạt</option>
              <option value="#fdf2f8">Pastel Hồng nhạt</option>
              <option value="#f8fafc">Pastel Xám nhạt</option>
            </select>
          </div>
          <div class="field-item">
            <label class="field-label" style="font-weight: 700; color: #1e293b;">Vị trí hiển thị (Thứ tự trong nhóm)</label>
            <select v-model="widgetOrder" class="settings-select" style="width: 100%; max-width: 100%;">
              <option
                v-for="n in (editingWidget ? (activeGroupForWidget?.widgets?.length || 1) : ((activeGroupForWidget?.widgets?.length || 0) + 1))"
                :key="n"
                :value="n"
              >
                {{ n === 1 ? 'Vị trí 1 (Đưa lên đầu tiên)' : (n === (editingWidget ? activeGroupForWidget?.widgets?.length : (activeGroupForWidget?.widgets?.length + 1)) ? `Vị trí ${n} (Cuối cùng)` : `Vị trí ${n}`) }}
              </option>
            </select>
          </div>
        </div>

        <div style="font-size: 0.76rem; color: #0369a1; background: #e0f2fe; border: 1px solid #bae6fd; padding: 10px 12px; border-radius: 8px; display: flex; align-items: center; gap: 8px; line-height: 1.4;">
          <i class="pi pi-info-circle" style="font-size: 1.1rem; flex-shrink: 0;"></i>
          <span>Khi người dùng bấm vào thẻ này trên Dashboard Thống kê, hệ thống sẽ tự động chuyển sang trang <b>{{ selectedTopicObject?.title }}</b> và kích hoạt bộ lọc tương ứng!</span>
        </div>
      </div>
      <template #footer>
        <div style="display: flex; justify-content: flex-end; gap: 8px; width: 100%;">
          <Button label="Hủy" severity="secondary" text size="small" @click="isWidgetDialogOpen = false" />
          <Button label="Lưu Khối Thống Kê" icon="pi pi-check" severity="success" size="small" @click="saveWidget" />
        </div>
      </template>
    </Dialog>

    <!-- Dialog Sắp xếp vị trí các khối thống kê trong nhóm -->
    <Dialog
      v-model:visible="isReorderWidgetsDialogOpen"
      modal
      header="Sắp xếp Thứ tự Khối Thống kê"
      :style="{ width: '580px' }"
    >
      <div v-if="reorderingGroup" style="display: flex; flex-direction: column; gap: 12px;">
        <div style="font-size: 0.82rem; color: #475569; background: #f1f5f9; padding: 8px 12px; border-radius: 6px;">
          Đang sắp xếp các thẻ của nhóm: <strong style="color: #0f172a;">{{ reorderingGroup.title }}</strong>. Bạn có thể chọn vị trí trực tiếp hoặc dùng nút mũi tên để dời thẻ lên/xuống:
        </div>
        <div style="display: flex; flex-direction: column; gap: 8px; max-height: 420px; overflow-y: auto; padding-right: 4px;">
          <div
            v-for="(w, idx) in reorderingGroup.widgets"
            :key="w.id"
            style="display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; gap: 10px; box-shadow: 0 1px 2px rgba(0,0,0,0.03);"
          >
            <div style="display: flex; align-items: center; gap: 10px; flex: 1; overflow: hidden;">
              <span style="font-size: 0.78rem; font-weight: 700; background: #0284c7; color: #fff; padding: 2px 8px; border-radius: 4px; min-width: 28px; text-align: center;">
                #{{ idx + 1 }}
              </span>
              <div style="display: flex; flex-direction: column; overflow: hidden;">
                <span style="font-size: 0.84rem; font-weight: 600; color: #1e293b; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">
                  {{ w.title }}
                </span>
                <span style="font-size: 0.7rem; color: #64748b;">
                  {{ w.displayType === 'count' ? 'Thẻ đếm số lượng' : (w.displayType === 'vertical_bar' ? 'Biểu đồ cột dọc' : 'Biểu đồ thanh ngang') }}
                </span>
              </div>
            </div>

            <!-- Điều khiển vị trí -->
            <div style="display: flex; align-items: center; gap: 4px;">
              <select
                :value="idx + 1"
                @change="e => setWidgetPosition(reorderingGroup, w, Number(e.target.value))"
                style="font-size: 0.75rem; height: 28px; padding: 2px 6px; border-radius: 4px; border: 1px solid #cbd5e1; background: #f8fafc; font-weight: 700; cursor: pointer;"
                title="Chọn vị trí trực tiếp"
              >
                <option v-for="n in reorderingGroup.widgets.length" :key="n" :value="n">
                  {{ n === 1 ? '1 (Đầu tiên)' : (n === reorderingGroup.widgets.length ? `${n} (Cuối)` : `Vị trí ${n}`) }}
                </option>
              </select>

              <button
                type="button"
                class="btn-card-setting"
                :disabled="idx === 0"
                @click="moveWidgetToTop(reorderingGroup, w)"
                title="Đưa lên đầu tiên"
                style="padding: 4px 6px; height: 28px;"
              >
                <i class="pi pi-angle-double-up" style="font-size: 0.8rem;"></i>
              </button>
              <button
                type="button"
                class="btn-card-setting"
                :disabled="idx === 0"
                @click="moveWidget(reorderingGroup, w, -1)"
                title="Lên 1 bậc"
                style="padding: 4px 6px; height: 28px;"
              >
                <i class="pi pi-chevron-up" style="font-size: 0.8rem;"></i>
              </button>
              <button
                type="button"
                class="btn-card-setting"
                :disabled="idx === reorderingGroup.widgets.length - 1"
                @click="moveWidget(reorderingGroup, w, 1)"
                title="Xuống 1 bậc"
                style="padding: 4px 6px; height: 28px;"
              >
                <i class="pi pi-chevron-down" style="font-size: 0.8rem;"></i>
              </button>
              <button
                type="button"
                class="btn-card-setting"
                :disabled="idx === reorderingGroup.widgets.length - 1"
                @click="moveWidgetToBottom(reorderingGroup, w)"
                title="Đưa về cuối cùng"
                style="padding: 4px 6px; height: 28px;"
              >
                <i class="pi pi-angle-double-down" style="font-size: 0.8rem;"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <Button label="Xong" severity="primary" size="small" @click="isReorderWidgetsDialogOpen = false" />
      </template>
    </Dialog>

    <!-- Detailed Personnel / Relative Dialog -->
    <PersonnelDialog
      v-model="isPersonDialogOpen"
      :personData="selectedPersonForDialog"
      :initialTab="dialogInitialTab"
      :targetRelativeCode="dialogTargetRelativeCode"
      @saved="onPersonSaved"
      @deleted="onPersonSaved"
    />

    <!-- Advanced DOCX Export Dialog for Dashboard -->
    <AdvancedDocxExportDialog
      v-model="isDocxExportOpen"
      :selectedPersonnel="drilldownSelectedPersonnel"
      :allPersonnel="drilldownAllPersonnel"
    />

    <!-- Dialog Tùy chọn Cột cho Drilldown Popup -->
    <Dialog
      v-model:visible="isDrilldownColDialogOpen"
      modal
      :header="`Tùy chọn Cột hiển thị: ${isRelativeView ? 'Thân nhân ở Nước ngoài' : 'Cán bộ / Chuyến đi'}`"
      :style="{ width: '580px', maxWidth: '96vw' }"
    >
      <div style="display: flex; flex-direction: column; gap: 12px; padding-top: 6px;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 6px;">
          <span style="font-size: 0.78rem; color: #64748b;">
            Tích chọn các cột bạn muốn hiển thị trong bảng chi tiết này:
          </span>
          <div style="display: flex; gap: 6px;">
            <Button label="Chọn tất cả" text size="small" style="font-size: 0.72rem; padding: 2px 6px;" @click="selectAllDrilldownCols" />
            <Button label="Mặc định" text severity="secondary" size="small" style="font-size: 0.72rem; padding: 2px 6px;" @click="resetDefaultDrilldownCols" />
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; max-height: 360px; overflow-y: auto; padding: 8px; border: 1px solid #e2e8f0; border-radius: 8px; background: #fafafa;">
          <label
            v-for="col in currentDrilldownAllAvailableCols"
            :key="col.id"
            style="display: flex; align-items: center; gap: 8px; font-size: 0.78rem; cursor: pointer; padding: 6px 8px; border-radius: 6px; background: #ffffff; border: 1px solid #f1f5f9;"
          >
            <input
              type="checkbox"
              :value="col.id"
              v-model="tempSelectedDrilldownCols"
              style="cursor: pointer; accent-color: #16a34a; width: 15px; height: 15px;"
            />
            <span style="color: #334155; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" :title="col.label">
              {{ col.label }}
            </span>
          </label>
        </div>
      </div>

      <template #footer>
        <div style="display: flex; justify-content: flex-end; gap: 8px; width: 100%;">
          <Button label="Hủy" severity="secondary" text size="small" @click="isDrilldownColDialogOpen = false" />
          <Button label="Lưu & Áp dụng" icon="pi pi-check" severity="success" size="small" @click="saveDrilldownCols" />
        </div>
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Dialog from 'primevue/dialog';
import AppDatePicker from '@/components/common/AppDatePicker.vue';
import PersonnelDialog from '@/components/personnel/PersonnelDialog.vue';
import AdvancedDocxExportDialog from '@/components/common/AdvancedDocxExportDialog.vue';
import { usePersonnelStore } from '@/stores/personnel';
import { exportToExcel, exportFullPersonnelExcel, exportFullRelativesExcel, getSubOptionsList } from '@/utils/excel';
import { computeColumnIndexMap, formatDate, parseDateValue, computePresenceStatus, computeOverdueStatus, computeTripPresence, evaluateFormula, computeDepartBeforeDecision, formatGenericCellValue, resolvePresence, isPresenceField, resolveVirtualColumnValue, getPresenceBadge } from '@/utils/formatters';
import { getAppSettings, saveAppSettings } from '@/api/settings';

const router = useRouter();
const personnelStore = usePersonnelStore();

// =========================================================================
// DRILLDOWN COLUMN CUSTOMIZATION & TARGET CRITERION HIGHLIGHT
// =========================================================================
const isDrilldownColDialogOpen = ref(false);
const tempSelectedDrilldownCols = ref([]);
const customDrilldownColsPersonnel = ref([]);
const customDrilldownColsRelatives = ref([]);
const drilldownTargetCriterion = ref(null);
const drilldownCategory = ref('personnel');
const drilldownHasDualTabs = ref(false);
const drilldownActiveTab = ref('personnel');

const loadDrilldownColSettings = async () => {
  try {
    const pCols = await getAppSettings('dashboard_drilldown_cols_personnel');
    if (pCols && Array.isArray(pCols)) customDrilldownColsPersonnel.value = pCols;
    const rCols = await getAppSettings('dashboard_drilldown_cols_relatives');
    if (rCols && Array.isArray(rCols)) customDrilldownColsRelatives.value = rCols;
  } catch (e) {
    console.error('Error loading drilldown col settings:', e);
  }
};
loadDrilldownColSettings();

const isRelativeView = computed(() => {
  return drilldownCategory.value === 'relatives' || (drilldownHasDualTabs.value && drilldownActiveTab.value === 'relatives');
});

const currentDrilldownAllAvailableCols = computed(() => {
  if (isRelativeView.value) {
    const baseList = [{ id: 'code', label: 'Mã Thân nhân' }, { id: 'cccd_can_bo', label: 'CCCD Cán bộ' }];
    (allAvailableRelativeColumns.value || []).forEach((c) => {
      if (!baseList.some((x) => x.id === c.id)) {
        baseList.push({ id: c.id, label: c.label.replace(/^\[Cột\s*[^\]]+\]\s*/i, '') });
      }
    });
    return baseList;
  }
  const baseList = [{ id: 'code', label: 'Mã Cán bộ' }, { id: 'name', label: 'Họ và tên' }];
  (allAvailableColumns.value || []).forEach((c) => {
    if (!baseList.some((x) => x.id === c.id)) {
      baseList.push({ id: c.id, label: c.label.replace(/^\[Cột\s*[^\]]+\]\s*/i, '') });
    }
  });
  return baseList;
});

const shouldShowDrilldownCriterion = computed(() => {
  if (!drilldownTargetCriterion.value || !drilldownTargetCriterion.value.columnId) return false;
  const colId = drilldownTargetCriterion.value.columnId;
  const cols = isRelativeView.value ? drilldownDisplayRelativeColumns.value : drilldownDisplayPersonnelColumns.value;
  return !cols.some((c) => c.id === colId);
});

const openDrilldownColDialog = () => {
  if (isRelativeView.value) {
    tempSelectedDrilldownCols.value = customDrilldownColsRelatives.value.length > 0
      ? [...customDrilldownColsRelatives.value]
      : (personnelStore.visibleRelativeColumns || []).filter(
          (id) => id !== 'parentName' && id !== 'parentPersonnelName' && id !== 'stt' && id !== 'code' && id !== 'cccd_can_bo'
        );
  } else {
    tempSelectedDrilldownCols.value = customDrilldownColsPersonnel.value.length > 0
      ? [...customDrilldownColsPersonnel.value]
      : (personnelStore.visibleColumns || []).filter((id) => id !== 'stt' && id !== 'code' && id !== 'name');
  }
  isDrilldownColDialogOpen.value = true;
};

const selectAllDrilldownCols = () => {
  tempSelectedDrilldownCols.value = currentDrilldownAllAvailableCols.value.map((c) => c.id);
};

const resetDefaultDrilldownCols = () => {
  if (isRelativeView.value) {
    tempSelectedDrilldownCols.value = (personnelStore.visibleRelativeColumns || []).filter(
      (id) => id !== 'parentName' && id !== 'parentPersonnelName' && id !== 'stt' && id !== 'code' && id !== 'cccd_can_bo'
    );
  } else {
    tempSelectedDrilldownCols.value = (personnelStore.visibleColumns || []).filter(
      (id) => id !== 'stt' && id !== 'code' && id !== 'name'
    );
  }
};

const saveDrilldownCols = async () => {
  if (isRelativeView.value) {
    customDrilldownColsRelatives.value = [...tempSelectedDrilldownCols.value];
    try {
      await saveAppSettings('dashboard_drilldown_cols_relatives', customDrilldownColsRelatives.value);
    } catch (e) {}
  } else {
    customDrilldownColsPersonnel.value = [...tempSelectedDrilldownCols.value];
    try {
      await saveAppSettings('dashboard_drilldown_cols_personnel', customDrilldownColsPersonnel.value);
    } catch (e) {}
  }
  isDrilldownColDialogOpen.value = false;
};

const drilldownDisplayPersonnelColumns = computed(() => {
  const map = {};
  (personnelStore.importMappingPersonnel || []).forEach((g) => {
    (g.columns || []).forEach((c) => {
      if (c.id) map[c.id] = c;
    });
  });

  const selectedIds = customDrilldownColsPersonnel.value.length > 0
    ? [...customDrilldownColsPersonnel.value]
    : (personnelStore.visibleColumns || []).filter((id) => id !== 'stt' && id !== 'code' && id !== 'name');

  const baseCols = selectedIds.map((id) => {
    if (id === 'code') return { id: 'code', label: 'Mã CB' };
    const cfg = map[id];
    if (cfg && cfg.label) return { ...cfg, id: cfg.id, label: cfg.label };
    const found = personnelStore.allAvailableColumns.find((c) => c.id === id);
    return found ? { ...found } : { id, label: id };
  });

  // Tự động đính kèm cột dữ liệu được bấm vào ở cuối bảng nếu chưa có (chỉ cho view Cán bộ không phải Trips)
  if (drilldownCategory.value === 'personnel' && drilldownTargetCriterion.value && drilldownTargetCriterion.value.columnId) {
    const targetId = drilldownTargetCriterion.value.columnId;
    const exists = baseCols.some((c) => c.id === targetId);
    if (!exists) {
      const cfg = map[targetId];
      baseCols.push({
        id: targetId,
        label: drilldownTargetCriterion.value.label || cfg?.label || targetId,
        isDynamicTargetCol: true,
      });
    }
  }

  return baseCols;
});

const drilldownDisplayRelativeColumns = computed(() => {
  const map = {};
  (personnelStore.importMappingRelative || []).forEach((g) => {
    (g.columns || []).forEach((c) => {
      if (c.id) map[c.id] = c;
    });
  });

  const selectedIds = customDrilldownColsRelatives.value.length > 0
    ? [...customDrilldownColsRelatives.value]
    : (personnelStore.visibleRelativeColumns || []).filter((id) => id !== 'parentName' && id !== 'parentPersonnelName' && id !== 'stt' && id !== 'code' && id !== 'cccd_can_bo');

  const baseCols = selectedIds.map((id) => {
    if (id === 'code') return { id: 'code', label: 'Mã TN' };
    if (id === 'cccd_can_bo') return { id: 'cccd_can_bo', label: 'CCCD Cán bộ' };
    const cfg = map[id];
    if (cfg && cfg.label) return { ...cfg, id: cfg.id, label: cfg.label };
    const found = personnelStore.allAvailableRelativeColumns.find((c) => c.id === id);
    return found ? { ...found } : { id, label: id };
  });

  // Tự động đính kèm cột dữ liệu được bấm vào ở cuối bảng nếu chưa có
  if (drilldownTargetCriterion.value && drilldownTargetCriterion.value.columnId) {
    const targetId = drilldownTargetCriterion.value.columnId;
    const exists = baseCols.some((c) => c.id === targetId);
    if (!exists) {
      const cfg = map[targetId];
      baseCols.push({
        id: targetId,
        label: drilldownTargetCriterion.value.label || cfg?.label || targetId,
        isDynamicTargetCol: true,
      });
    }
  }

  return baseCols;
});

const activePersonnelColumns = computed(() => {
  const map = {};
  (personnelStore.importMappingPersonnel || []).forEach((g) => {
    (g.columns || []).forEach((c) => {
      if (c.id) map[c.id] = c;
    });
  });

  return (personnelStore.visibleColumns || [])
    .filter((id) => id !== 'stt' && id !== 'code' && id !== 'name')
    .map((id) => {
      const cfg = map[id];
      if (cfg && cfg.label) {
        return { id: cfg.id, label: cfg.label };
      }
      const found = personnelStore.allAvailableColumns.find((c) => c.id === id);
      return found || { id, label: id };
    });
});

const activeRelativeColumns = computed(() => {
  const map = {};
  (personnelStore.importMappingRelative || []).forEach((g) => {
    (g.columns || []).forEach((c) => {
      if (c.id) map[c.id] = c;
    });
  });

  return (personnelStore.visibleRelativeColumns || [])
    .filter((id) => id !== 'parentName' && id !== 'parentPersonnelName' && id !== 'stt' && id !== 'code' && id !== 'cccd_can_bo')
    .map((id) => {
      const cfg = map[id];
      if (cfg && cfg.label) {
        return { id: cfg.id, label: cfg.label };
      }
      const found = personnelStore.allAvailableRelativeColumns.find((c) => c.id === id);
      return found || { id, label: id };
    });
});

const getDisplayValue = (row, colId) => {
  if (!row || !colId) return '-';

  // Check if column is a Formula Column
  const allMap = {};
  (personnelStore.importMappingPersonnel || []).forEach((g) => {
    (g.columns || []).forEach((c) => { if (c.id) allMap[c.id] = c; });
  });
  (personnelStore.importMappingRelative || []).forEach((g) => {
    (g.columns || []).forEach((c) => { if (c.id) allMap[c.id] = c; });
  });

  const colDef = allMap[colId];
  if (colDef && colDef.format === 'formula') {
    const result = evaluateFormula(row, colDef);
    return result?.label || result?.shortLabel || '-';
  }

  const val = getRowFieldValue(row, colId);
  if (val === undefined || val === null || val === '') return '-';
  if (typeof val === 'object') {
    if (val instanceof Date) {
      return formatDate(val);
    }
    if (Array.isArray(val)) {
      return val
        .map((x) => {
          if (typeof x === 'object' && x !== null) {
            if (x.col1 !== undefined || x.col2 !== undefined) {
              return `${x.col1 || ''}: ${x.col2 || ''}`.trim().replace(/^:\s*/, '');
            }
            return x.name || JSON.stringify(x);
          }
          return x;
        })
        .filter(Boolean)
        .join('; ') || '-';
    }
    return val.name || JSON.stringify(val) || '-';
  }

  const cLower = String(colId || '').toLowerCase();
  const str = String(val).trim();
  if (
    cLower.includes('birth') ||
    cLower.includes('date') ||
    cLower.includes('ngay') ||
    cLower.includes('nam_sinh') ||
    cLower.includes('departure') ||
    cLower.includes('arrival') ||
    str.includes('GMT') ||
    str.includes('T00:') ||
    /^\d{4}-\d{2}-\d{2}/.test(str)
  ) {
    return formatDate(str);
  }
  return str;
};

const getPersonnelForTrip = (t) => {
  if (!t) return {};
  if (t.personnel) return t.personnel;
  return personnelStore.personnelList.find((p) => p.id === t.personnelId || (t.personnelCode && p.code === t.personnelCode)) || {};
};

// Dialog state for personnel & relative detail
const isPersonDialogOpen = ref(false);
const selectedPersonForDialog = ref(null);
const dialogInitialTab = ref(0);
const dialogTargetRelativeCode = ref('');

const openPersonnelDetail = (p) => {
  if (!p) return;
  const target = (personnelStore.personnelList || []).find(
    (x) => x.id === p.id || x.code === p.code || (p.cccdparent && (x.cccdparent === p.cccdparent || x.cccd === p.cccdparent))
  ) || p;
  selectedPersonForDialog.value = target;
  dialogInitialTab.value = 0;
  dialogTargetRelativeCode.value = '';
  isPersonDialogOpen.value = true;
};

const openTripDetail = (t) => {
  if (!t) return;
  const p = (personnelStore.personnelList || []).find(
    (x) => x.id === t.personnelId || x.code === t.personnelId || x.code === t.personnelCode || x.name === t.personnelName
  );
  if (p) {
    selectedPersonForDialog.value = p;
    dialogInitialTab.value = 2; // Tab 3: Chuyến đi
    dialogTargetRelativeCode.value = '';
    isPersonDialogOpen.value = true;
  }
};

const openRelativeDetail = (r) => {
  if (!r) return;
  let parent = r.rawPerson || null;
  if (!parent && (r.cccd_can_bo || r.cccdparent || r.parentCccd)) {
    const targetCccd = String(r.cccd_can_bo || r.cccdparent || r.parentCccd).trim();
    parent = (personnelStore.personnelList || []).find(
      (p) => String(p.cccdparent || p.cccd || p.custom_data?.cccdparent || p.custom_data?.cccd || '').trim() === targetCccd
    );
  }
  if (!parent && r.personnelId) {
    parent = (personnelStore.personnelList || []).find((p) => p.id === r.personnelId || p.code === r.personnelId);
  }
  const relCode = r.code || ('TN-' + String(r.id || '').slice(-5).padStart(5, '0'));

  if (parent) {
    selectedPersonForDialog.value = parent;
    dialogInitialTab.value = 1; // Tab 2: Thân nhân
    dialogTargetRelativeCode.value = relCode;
    isPersonDialogOpen.value = true;
  } else {
    selectedPersonForDialog.value = {
      name: r.parentName || 'Cán bộ liên quan',
      relatives: [r],
    };
    dialogInitialTab.value = 1;
    dialogTargetRelativeCode.value = relCode;
    isPersonDialogOpen.value = true;
  }
};

const onPersonSaved = async () => {
  await personnelStore.fetchPersonnel();
};

// =========================================================================
// 1. DEFAULT DASHBOARD COLUMN CONFIGURATION STATE (Persisted in Directus DB)
// =========================================================================
const DEFAULT_CONFIG = {
  country: 'quoc_gia_xuat_canh',
  funding: 'nguon_kinh_phi',
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
const isReorderWidgetsDialogOpen = ref(false);
const reorderingGroup = ref(null);
const widgetOrder = ref(1);
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
    }
  } catch (e) {
    console.error('Error loading custom groups:', e);
  }
};

const saveCustomGroupsToDb = async () => {
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

const isSavingGroup = ref(false);
const isSavingWidget = ref(false);

const moveCustomGroup = async (gIdx, direction) => {
  const targetIdx = gIdx + direction;
  if (targetIdx < 0 || targetIdx >= customGroups.value.length) return;
  const temp = customGroups.value[gIdx];
  customGroups.value[gIdx] = customGroups.value[targetIdx];
  customGroups.value[targetIdx] = temp;
  await saveCustomGroupsToDb();
};

const saveGroup = async () => {
  if (isSavingGroup.value) return;
  if (!groupForm.value.title.trim()) {
    alert('Vui lòng nhập Tên Nhóm thống kê!');
    return;
  }
  isSavingGroup.value = true;
  isGroupDialogOpen.value = false;
  try {
    if (editingGroup.value) {
      const idx = customGroups.value.findIndex((g) => g.id === editingGroup.value.id);
      if (idx !== -1) {
        customGroups.value[idx] = { ...customGroups.value[idx], ...groupForm.value };
      }
    } else {
      customGroups.value.push({ ...groupForm.value, id: 'g_' + Date.now() });
    }
    await saveCustomGroupsToDb();
  } catch (e) {
    console.error('Error saving group:', e);
  } finally {
    isSavingGroup.value = false;
  }
};

const deleteGroup = async (group) => {
  if (!confirm(`Bạn có chắc muốn xóa nhóm "${group.title}" và toàn bộ khối thống kê bên trong?`)) return;
  customGroups.value = customGroups.value.filter((g) => g.id !== group.id);
  await saveCustomGroupsToDb();
};

// Topic Dashboards Integration for Custom Widgets
const widgetCreateMode = ref('topic'); // 'topic' | 'custom'
const selectedWidgetTopicId = ref('trips');
const selectedWidgetCardKey = ref('all');
const availableTopicDashboards = ref([]);

const DEFAULT_TOPIC_DASHBOARDS = [
  {
    id: 'trips',
    code: 'CD-03',
    title: 'Danh sách Chuyến đi',
    source: 'trips',
    icon: 'pi-send',
    metricCards: [
      { id: 'all', label: 'Toàn bộ', condition: 'all', color: 'blue' },
      { id: 'completed', label: 'Đã về nước', condition: 'completed', color: 'green' },
      { id: 'abroad', label: 'Đang ở nước ngoài', condition: 'abroad', color: 'amber' },
      { id: 'overdue', label: 'Quá hạn chưa về', condition: 'overdue', color: 'red' },
    ],
  },
];

const loadTopicDashboards = async () => {
  try {
    const saved = await getAppSettings('custom_dashboards_config', null);
    if (saved && Array.isArray(saved) && saved.length > 0) {
      availableTopicDashboards.value = saved;
    } else {
      availableTopicDashboards.value = DEFAULT_TOPIC_DASHBOARDS;
    }
  } catch (e) {
    availableTopicDashboards.value = DEFAULT_TOPIC_DASHBOARDS;
  }
};

const selectedTopicObject = computed(() => {
  return availableTopicDashboards.value.find((t) => t.id === selectedWidgetTopicId.value) || availableTopicDashboards.value[0] || DEFAULT_TOPIC_DASHBOARDS[0];
});

const availableCardsForSelectedTopic = computed(() => {
  const t = selectedTopicObject.value;
  if (t && t.metricCards && t.metricCards.length > 0) {
    return t.metricCards;
  }
  return DEFAULT_TOPIC_DASHBOARDS[0].metricCards;
});

const parseDateObj = (str) => {
  if (!str) return null;
  if (str instanceof Date) return isNaN(str.getTime()) ? null : str;
  const s = String(str).trim();
  if (!s || s === '-' || s === 'Chưa rõ') return null;

  if (s.includes('/') || (s.includes('-') && s.split('-')[0].length <= 2)) {
    const sep = s.includes('/') ? '/' : '-';
    const parts = s.split(sep);
    if (parts.length === 3) {
      const d = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const y = parseInt(parts[2], 10);
      if (!isNaN(d) && !isNaN(m) && !isNaN(y)) {
        return new Date(y, m, d);
      }
    }
  }

  const parsed = new Date(s);
  return isNaN(parsed.getTime()) ? null : parsed;
};

// Sử dụng resolvePresence làm chuẩn chung từ formatters.js
const getTripPresence = (t) => resolvePresence(t);

const unifiedTripsList = computed(() => {
  const list = [];
  const pList = personnelStore.personnelList || [];
  const now = new Date();
  const processedTripKeys = new Set();
  const isInternalId = (val) => !val || String(val).startsWith('cd_') || String(val).startsWith('trip_') || String(val).startsWith('rel_') || String(val).startsWith('p_');
  const pKeyField = personnelStore.getPersonnelKeyField();
  const tKeyField = personnelStore.getTripKeyField();
  const rKeyField = personnelStore.getRelativeKeyField();

  pList.forEach((p) => {
    // 1. Chuyến đi của Cán bộ (p.trips)
    (p.trips || []).forEach((t, tIdx) => {
      let custom = {};
      if (t.custom_data) {
        try {
          custom = typeof t.custom_data === 'string' ? JSON.parse(t.custom_data) : t.custom_data;
        } catch (e) {}
      }

      const cName = t.countryName || custom.countryName || t.country || custom.quoc_gia_xuat_canh || '';
      const depDate = t.departureDate || custom.departureDate || t.approvedDepartureDate || t.ngay_xuat_canh || custom.ngay_xuat_canh || t.ngayDi || custom.ngayDi || '';
      const arrDate = t.arrivalDate || custom.arrivalDate || t.ngay_nhap_canh || custom.ngay_nhap_canh || t.ngayVe || custom.ngayVe || '';
      const appArrDate = t.approvedArrivalDate || custom.approvedArrivalDate || t.thoi_gian_duyet_ve || custom.thoi_gian_duyet_ve || t.thoiGianDuyetVe || '';
      const extDate = t.approvedExtensionDate || custom.approvedExtensionDate || t.gia_han_den_ngay || custom.gia_han_den_ngay || '';
      const dNum = t.decisionNumber || custom.decisionNumber || t.decision || '';
      const fName = t.fundingName || t.funding || t.nguon_kinh_phi || t.kinh_phi || t.nguonKinhPhi || t.kinhPhi || custom.fundingName || custom.funding || custom.nguon_kinh_phi || custom.kinh_phi || '';
      const purpose = t.purpose || custom.purpose || '';

      // Skip empty/dummy placeholder trip objects that have no real data
      if (!cName && !depDate && !arrDate && !dNum && !purpose) {
        return;
      }

      const isRel = Boolean(
        t.isRelative === true ||
        t.isRelative === 'true' ||
        (t.relativeName && String(t.relativeName).trim() !== '' && String(t.relativeName).trim() !== '-' && String(t.relativeName).trim() !== 'Chưa rõ') ||
        (t.cccdthannhan && String(t.cccdthannhan).trim() !== '' && String(t.cccdthannhan).trim() !== '-' && !String(t.cccdthannhan).startsWith('cd_'))
      );
      const presence = getTripPresence({
        departureDate: depDate,
        arrivalDate: arrDate,
        approvedArrivalDate: appArrDate,
        approvedExtensionDate: extDate,
        custom_data: custom,
      });

      const uniqueKey = t.id || `trip_${p.id}_${tIdx}`;
      if (processedTripKeys.has(uniqueKey)) return;
      processedTripKeys.add(uniqueKey);

      const canBoCccd = String(p[pKeyField] ?? p.custom_data?.[pKeyField] ?? '').trim();
      const relCccd = String(t[rKeyField] ?? (isRel && !isInternalId(t.cccd) ? t.cccd : '')).trim();
      const relName = t.relativeName || (isRel ? 'Thân nhân' : p.name);
      const relShip = t.relationshipName || (isRel ? 'Thân nhân' : '');
      const directTripCccd = t[tKeyField] ?? t.cccdchuyendi;
      const travelerCccd = !isInternalId(directTripCccd) ? directTripCccd : (isRel ? relCccd : canBoCccd);

      list.push({
        ...custom,
        ...t,
        uniqueKey,
        isRelative: isRel,
        personnelId: p.id,
        personnelCode: p.code || '',
        personnelName: isRel ? relName : p.name,
        name: isRel ? relName : p.name,
        relativeName: isRel ? relName : '',
        relationshipName: relShip,
        parentName: p.name,
        parentPersonnelName: p.name,
        parentCccd: canBoCccd,
        cccdthannhan: relCccd,
        cccdparent: canBoCccd,
        cccdchuyendi: travelerCccd,
        cccd: travelerCccd || canBoCccd,
        position: isRel ? `${relShip || 'Thân nhân'} của: ${p.name}` : (p.position || p.positionName || p.chuc_vu || p.chucVu || custom.position || custom.chuc_vu || ''),
        positionName: isRel ? `${relShip || 'Thân nhân'} của: ${p.name}` : (p.position || p.positionName || p.chuc_vu || p.chucVu || custom.position || custom.chuc_vu || ''),
        chuc_vu: isRel ? `${relShip || 'Thân nhân'} của: ${p.name}` : (p.position || p.positionName || p.chuc_vu || p.chucVu || custom.position || custom.chuc_vu || ''),
        chucVu: isRel ? `${relShip || 'Thân nhân'} của: ${p.name}` : (p.position || p.positionName || p.chuc_vu || p.chucVu || custom.position || custom.chuc_vu || ''),
        departmentName: personnelStore.getDepartmentName(p.departmentId) || p.departmentName || '',
        countryName: cName,
        departureDate: depDate,
        arrivalDate: arrDate,
        approvedDepartureDate: t.approvedDepartureDate || custom.approvedDepartureDate || depDate,
        approvedArrivalDate: appArrDate,
        approvedExtensionDate: extDate,
        decisionNumber: dNum,
        fundingName: fName,
        purpose,
        passportNumber: t.passportNumber || custom.passportNumber || '',
        isAbroad: presence.isAbroad,
        isOverdue: presence.isOverdue,
        overdueDays: presence.overdueDays,
        presenceStatus: presence.shortLabel,
        presenceLabel: presence.label,
        _presenceStatus: presence.shortLabel,
        rawTrip: t,
        rawPerson: p,
        custom_data: custom,
      });
    });

    // 2. Chuyến đi của Thân nhân (p.relatives[].trips)
    (p.relatives || []).forEach((r, rIdx) => {
      (r.trips || []).forEach((rt, rtIdx) => {
        let custom = {};
        if (rt.custom_data) {
          try {
            custom = typeof rt.custom_data === 'string' ? JSON.parse(rt.custom_data) : rt.custom_data;
          } catch (e) {}
        }

        const cName = rt.countryName || custom.countryName || rt.country || r.countryName || '';
        const depDate = rt.departureDate || custom.departureDate || rt.ngay_xuat_canh || custom.ngay_xuat_canh || rt.ngayDi || custom.ngayDi || '';
        const arrDate = rt.arrivalDate || custom.arrivalDate || rt.ngay_nhap_canh || custom.ngay_nhap_canh || rt.ngayVe || custom.ngayVe || '';
        const appArrDate = rt.approvedArrivalDate || custom.approvedArrivalDate || rt.thoi_gian_duyet_ve || custom.thoi_gian_duyet_ve || rt.thoiGianDuyetVe || '';
        const extDate = rt.approvedExtensionDate || custom.approvedExtensionDate || rt.gia_han_den_ngay || custom.gia_han_den_ngay || '';
        const dNum = rt.decisionNumber || custom.decisionNumber || '';
        const fName = rt.fundingName || rt.funding || rt.nguon_kinh_phi || rt.kinh_phi || rt.nguonKinhPhi || rt.kinhPhi || custom.fundingName || custom.funding || custom.nguon_kinh_phi || custom.kinh_phi || '';
        const purpose = rt.purpose || custom.purpose || '';

        // Skip empty/dummy placeholder trip objects
        if (!cName && !depDate && !arrDate && !dNum && !purpose) {
          return;
        }

        const presence = getTripPresence({
          departureDate: depDate,
          arrivalDate: arrDate,
          approvedArrivalDate: appArrDate,
          approvedExtensionDate: extDate,
          custom_data: custom,
        });

        const uniqueKey = rt.id || `rel_trip_${p.id}_${rIdx}_${rtIdx}`;
        if (processedTripKeys.has(uniqueKey)) return;
        processedTripKeys.add(uniqueKey);

        const rCccd = !isInternalId(r[rKeyField] ?? r.cccdthannhan) ? String(r[rKeyField] ?? r.cccdthannhan).trim() : '';
        const canBoCccd = String(p[pKeyField] ?? p.custom_data?.[pKeyField] ?? '').trim();
        const tripCccd = !isInternalId(rt[tKeyField] ?? rt.cccdchuyendi) ? String(rt[tKeyField] ?? rt.cccdchuyendi).trim() : rCccd;
        const relName = r.relativeName || r.name || custom.relativeName || 'Thân nhân';
        const relShip = r.relationshipName || r.relationship || custom.relationshipName || 'Thân nhân';
        const travelerCccd = tripCccd || rCccd;

        list.push({
          ...custom,
          ...rt,
          uniqueKey,
          isRelative: true,
          personnelId: p.id,
          personnelCode: p.code || '',
          personnelName: relName,
          name: relName,
          relativeName: relName,
          relationshipName: relShip,
          parentName: p.name,
          parentPersonnelName: p.name,
          parentCccd: canBoCccd,
          cccdthannhan: travelerCccd,
          cccdparent: canBoCccd,
          cccdchuyendi: travelerCccd,
          cccd: travelerCccd || canBoCccd,
          position: `${relShip} của: ${p.name}`,
          positionName: `${relShip} của: ${p.name}`,
          chuc_vu: `${relShip} của: ${p.name}`,
          chucVu: `${relShip} của: ${p.name}`,
          departmentName: personnelStore.getDepartmentName(p.departmentId) || p.departmentName || '',
          countryName: cName,
          departureDate: depDate,
          arrivalDate: arrDate,
          approvedDepartureDate: rt.approvedDepartureDate || depDate,
          approvedArrivalDate: appArrDate,
          approvedExtensionDate: extDate,
          decisionNumber: dNum,
          fundingName: fName,
          purpose: rt.purpose || custom.purpose || '',
          passportNumber: rt.passportNumber || custom.passportNumber || '',
          isAbroad: presence.isAbroad,
          isOverdue: presence.isOverdue,
          overdueDays: presence.overdueDays,
          presenceStatus: presence.shortLabel,
          presenceLabel: presence.label,
          _presenceStatus: presence.shortLabel,
          rawTrip: rt,
          rawRelative: r,
          rawPerson: p,
          custom_data: custom,
        });
      });
    });
  });

  return list;
});

const getRowFieldValue = (row, colId) => {
  if (!row || !colId) return '';

  // 0. Phân giải Cột ảo (Trạng thái hiện diện, Đối tượng, Thông tin Cán bộ liên quan...)
  const vVal = resolveVirtualColumnValue(row, colId);
  if (vVal !== undefined) {
    return vVal;
  }

  // Xử lý các cột CCCD / Định danh
  const isInternalId = (val) => !val || String(val).startsWith('cd_') || String(val).startsWith('trip_') || String(val).startsWith('rel_') || String(val).startsWith('p_');
  const pKeyField = personnelStore.getPersonnelKeyField();
  const tKeyField = personnelStore.getTripKeyField();
  const rKeyField = personnelStore.getRelativeKeyField();

  if (colId === tKeyField || colId === 'cccdchuyendi' || colId === 'cccd_chuyen_di' || colId === 'cccd_nguoi_di') {
    const directVal = row[tKeyField] ?? row.cccdchuyendi ?? row.rawTrip?.[tKeyField] ?? row.rawTrip?.cccdchuyendi ?? row[colId];
    if (!isInternalId(directVal)) return String(directVal).trim();
    if (row.isRelative) {
      const rCccd = row[rKeyField] ?? row.cccdthannhan ?? row.rawRelative?.[rKeyField] ?? row.rawRelative?.cccdthannhan;
      if (!isInternalId(rCccd)) return String(rCccd).trim();
    }
    const canBoCccd = row.rawPerson?.[pKeyField] ?? row.rawPerson?.custom_data?.[pKeyField] ?? row.parentCccd ?? row.cccdparent;
    if (!isInternalId(canBoCccd)) return String(canBoCccd).trim();
    return '-';
  }
  if (colId === pKeyField || colId === 'cccdparent' || colId === 'cccd_can_bo') {
    const canBoCccd = row.parentCccd ?? row.cccdparent ?? row.rawPerson?.[pKeyField] ?? row.rawPerson?.custom_data?.[pKeyField];
    if (!isInternalId(canBoCccd)) return String(canBoCccd).trim();
    return '-';
  }
  if (colId === rKeyField || colId === 'cccdthannhan' || colId === 'cccd_than_nhan') {
    const rCccd = row[rKeyField] ?? row.cccdthannhan ?? row.rawRelative?.[rKeyField] ?? row.rawRelative?.cccdthannhan;
    if (!isInternalId(rCccd)) return String(rCccd).trim();
    return '-';
  }

  // 1. Check formula column from mapping (Khớp 100% ChildDashboardView)
  const allMap = {};
  (personnelStore.importMappingTrips || []).forEach((g) => {
    (g.columns || []).forEach((c) => { if (c.id) allMap[c.id] = c; });
  });
  (personnelStore.importMappingPersonnel || []).forEach((g) => {
    (g.columns || []).forEach((c) => { if (c.id) allMap[c.id] = c; });
  });
  (personnelStore.importMappingRelative || []).forEach((g) => {
    (g.columns || []).forEach((c) => { if (c.id) allMap[c.id] = c; });
  });

  const colDef = allMap[colId];
  if (colDef && colDef.format === 'formula') {
    if (colDef.formulaType === 'presence_status') {
      const p = resolvePresence(row);
      return p.label || '-';
    }
    const res = evaluateFormula(row, colDef);
    return res?.label || res?.shortLabel || '';
  }

  if (colId === '_presenceStatus' || colId === 'presenceStatus' || colId === 'status' || colId === 'tripStatus' || colId === 'trang_thai_hien_dien' || colId === 'trangThaiHienDien') {
    const p = resolvePresence(row);
    return p.label || '-';
  }

  if (colId === 'isRelative' || colId === '_doiTuong' || colId === 'doi_tuong') {
    return row.isRelative ? 'Thân nhân' : 'Cán bộ';
  }

  // 2. Identify column origin strictly from import mappings
  const tripColIds = (personnelStore.importMappingTrips || []).flatMap((g) => (g.columns || []).map((c) => c.id));
  const relColIds = (personnelStore.importMappingRelative || []).flatMap((g) => (g.columns || []).map((c) => c.id));
  const perColIds = (personnelStore.importMappingPersonnel || []).flatMap((g) => (g.columns || []).map((c) => c.id));

  let raw = undefined;

  if (tripColIds.includes(colId)) {
    // Cột thuộc Bảng Chuyến đi
    if (row.isRelative || row.rawRelative) {
      // Đối tượng là Thân nhân -> đọc từ chuyến đi mới nhất theo departureDate
      const trips = Array.isArray(row.trips) ? row.trips : [];
      let latestTrip = null;
      let latestDep = -Infinity;
      for (const t of trips) {
        const tCustom = typeof t.custom_data === 'string' ? JSON.parse(t.custom_data || '{}') : (t.custom_data || {});
        const depRaw = t.departureDate || tCustom.departureDate || t.ngay_xuat_canh || tCustom.ngay_xuat_canh || '';
        const dep = parseDateValue(depRaw);
        const time = dep ? dep.getTime() : 0;
        if (time >= latestDep) {
          latestDep = time;
          latestTrip = { ...tCustom, ...t };
        }
      }
      if (latestTrip) {
        raw = latestTrip[colId];
      }
    } else if (row.trips && Array.isArray(row.trips) && !row.departureDate && !row.countryName) {
      // Đối tượng là Cán bộ có mảng chuyến đi -> đọc từ chuyến đi mới nhất
      let latestTrip = null;
      let latestDep = -Infinity;
      for (const t of row.trips) {
        const tCustom = typeof t.custom_data === 'string' ? JSON.parse(t.custom_data || '{}') : (t.custom_data || {});
        const depRaw = t.departureDate || tCustom.departureDate || t.ngay_xuat_canh || tCustom.ngay_xuat_canh || '';
        const dep = parseDateValue(depRaw);
        const time = dep ? dep.getTime() : 0;
        if (time >= latestDep) {
          latestDep = time;
          latestTrip = { ...tCustom, ...t };
        }
      }
      if (latestTrip) {
        raw = latestTrip[colId];
      }
    } else {
      // Bản ghi là Chuyến đi
      const rcd = typeof row.custom_data === 'string' ? JSON.parse(row.custom_data || '{}') : (row.custom_data || {});
      const rtcd = typeof row.rawTrip?.custom_data === 'string' ? JSON.parse(row.rawTrip.custom_data || '{}') : (row.rawTrip?.custom_data || {});
      raw = row[colId] !== undefined ? row[colId] : (rcd[colId] ?? row.rawTrip?.[colId] ?? rtcd[colId]);
    }
  } else if (relColIds.includes(colId)) {
    // Cột thuộc Bảng Thân nhân
    const rcd = typeof row.custom_data === 'string' ? JSON.parse(row.custom_data || '{}') : (row.custom_data || {});
    const rrcd = typeof row.rawRelative?.custom_data === 'string' ? JSON.parse(row.rawRelative.custom_data || '{}') : (row.rawRelative?.custom_data || {});
    if (row.isRelative || row.rawRelative) {
      raw = row[colId] !== undefined ? row[colId] : (rcd[colId] ?? row.rawRelative?.[colId] ?? rrcd[colId]);
    } else if (row.rawRelative) {
      raw = row.rawRelative[colId] !== undefined ? row.rawRelative[colId] : (rrcd[colId]);
    }
  } else if (perColIds.includes(colId)) {
    // Cột thuộc Bảng Cán bộ
    const p = row.rawPerson || row;
    const pcd = typeof p.custom_data === 'string' ? JSON.parse(p.custom_data || '{}') : (p.custom_data || {});
    const rcd = typeof row.custom_data === 'string' ? JSON.parse(row.custom_data || '{}') : (row.custom_data || {});
    raw = p[colId] !== undefined ? p[colId] : (pcd[colId] ?? row[colId] ?? rcd[colId]);
  } else {
    // Cột trực tiếp
    const rcd = typeof row.custom_data === 'string' ? JSON.parse(row.custom_data || '{}') : (row.custom_data || {});
    const rtcd = typeof row.rawTrip?.custom_data === 'string' ? JSON.parse(row.rawTrip.custom_data || '{}') : (row.rawTrip?.custom_data || {});
    const rrcd = typeof row.rawRelative?.custom_data === 'string' ? JSON.parse(row.rawRelative.custom_data || '{}') : (row.rawRelative?.custom_data || {});
    const p = row.rawPerson;
    const pcd = typeof p?.custom_data === 'string' ? JSON.parse(p.custom_data || '{}') : (p?.custom_data || {});
    raw = row[colId] !== undefined ? row[colId] : (rcd[colId] ?? row.rawTrip?.[colId] ?? rtcd[colId] ?? row.rawRelative?.[colId] ?? rrcd[colId] ?? p?.[colId] ?? pcd[colId]);
  }

  return formatGenericCellValue(raw, colDef || { id: colId });
};

const getSourceList = (source) => {
  if (source === 'relatives' || source === 'relative') {
    return (personnelStore.relativesList || []).map((r, idx) => {
      let rCustom = {};
      if (r.custom_data) {
        try {
          rCustom = typeof r.custom_data === 'string' ? JSON.parse(r.custom_data) : r.custom_data;
        } catch (e) {}
      }
      const presence = resolvePresence(r);
      return {
        ...rCustom,
        ...r,
        uniqueKey: r.id || `rel_${idx}`,
        isRelative: true,
        trips: Array.isArray(r.trips) ? r.trips : [],
        personnelName: r.relativeName || r.name || 'Thân nhân',
        personnelCode: r.code || `TN-${String(idx + 1).padStart(5, '0')}`,
        relativeName: r.relativeName || r.name || 'Thân nhân',
        relationshipName: r.relationshipName || r.relationship || '',
        rawPerson: r.parentPersonnel || (r.cccdparent ? personnelStore.findPersonByCccd(r.cccdparent) : null) || r,
        rawRelative: r,
        custom_data: rCustom,
        isAbroad: presence.isAbroad,
        isOverdue: presence.isOverdue,
        overdueDays: presence.overdueDays || 0,
        presenceStatus: presence.shortLabel,
        presenceLabel: presence.label,
        _presenceStatus: presence.shortLabel,
      };
    });
  }
  if (source === 'trips' || source === 'trip') {
    return unifiedTripsList.value || [];
  }
  return (personnelStore.personnelList || []).map((p) => {
    let pCustom = {};
    if (p.custom_data) {
      try {
        pCustom = typeof p.custom_data === 'string' ? JSON.parse(p.custom_data) : p.custom_data;
      } catch (e) {}
    }
    const presence = resolvePresence(p);
    return {
      ...pCustom,
      ...p,
      uniqueKey: p.id || p.code,
      personnelName: p.name,
      personnelCode: p.code,
      departmentName: personnelStore.getDepartmentName(p.departmentId) || p.departmentName || '',
      position: p.positionName || p.position || '',
      rawPerson: p,
      custom_data: pCustom,
      isAbroad: presence.isAbroad,
      isOverdue: presence.isOverdue,
      overdueDays: presence.overdueDays || 0,
      presenceStatus: presence.shortLabel,
      presenceLabel: presence.label,
      _presenceStatus: presence.shortLabel,
    };
  });
};

const matchSingleCondition = (item, cond) => {
  if (!cond || !cond.field || String(cond.field).trim() === '') return true;

  const field = cond.field;
  const op = cond.operator || 'has_value';
  const target = String(cond.value || '').trim().toLowerCase();

  // 1a. Đối tượng Thân nhân / Cán bộ
  if (field === 'isRelative' || field === '_doiTuong' || field === 'doi_tuong') {
    const isRel = !!item.isRelative;
    const objType = isRel ? 'thân nhân' : 'cán bộ';
    if (op === 'equals') {
      if (target === 'true' || target.includes('thân nhân') || target === '1') return isRel === true;
      if (target === 'false' || target.includes('cán bộ') || target === '0') return isRel === false;
      return objType === target;
    }
    if (op === 'not_equals') {
      if (target === 'true' || target.includes('thân nhân') || target === '1') return isRel === false;
      if (target === 'false' || target.includes('cán bộ') || target === '0') return isRel === true;
      return objType !== target;
    }
    if (op === 'contains') {
      if (target.includes('thân nhân')) return isRel === true;
      if (target.includes('cán bộ')) return isRel === false;
      return objType.includes(target);
    }
    if (op === 'not_contains') {
      if (target.includes('thân nhân')) return isRel === false;
      if (target.includes('cán bộ')) return isRel === true;
      return !objType.includes(target);
    }
    if (op === 'has_value') {
      if (target.includes('thân nhân')) return isRel === true;
      return isRel === false;
    }
    if (op === 'empty') {
      return isRel === true;
    }
    return isRel;
  }

  // 1b. Special Formula Fields & Điều kiện đếm
  if (op.startsWith('count_') || field === 'dieu_kien_dem' || field === '_tripCount') {
    // Ưu tiên đọc giá trị trực tiếp từ cột nếu đã có (như cột công thức đếm số lần xuất cảnh)
    const rawVal = getRowFieldValue(item, field);
    let count = NaN;
    if (rawVal !== undefined && rawVal !== null && rawVal !== '' && rawVal !== '-') {
      const parsedNum = parseFloat(String(rawVal).replace(/[^0-9.-]+/g, ''));
      if (!isNaN(parsedNum)) {
        count = parsedNum;
      }
    }

    if (isNaN(count)) {
      const pKeyField = personnelStore.getPersonnelKeyField ? personnelStore.getPersonnelKeyField() : 'cccdparent';
      const canBoCccd = String(item[pKeyField] ?? item.cccdparent ?? item.parentCccd ?? item.rawPerson?.[pKeyField] ?? item.rawPerson?.custom_data?.[pKeyField] ?? '').trim();
      const p = canBoCccd ? (personnelStore.personnelList || []).find((x) => String(x[pKeyField] ?? x.custom_data?.[pKeyField] ?? x.cccdparent ?? '').trim() === canBoCccd) : null;
      const personTrips = Array.isArray(item.rawPerson?.trips) ? item.rawPerson.trips : (Array.isArray(item.trips) ? item.trips : (Array.isArray(p?.trips) ? p.trips : []));
      
      if (field && !['cccdparent', 'parentCccd', 'personnelId', 'name', 'dieu_kien_dem', '_tripCount'].includes(field)) {
        const targetVal = String(item[field] ?? item.custom_data?.[field] ?? '').trim().toLowerCase();
        if (targetVal && targetVal !== '-') {
          const sameFieldTrips = personTrips.filter(t => String(t[field] ?? t.custom_data?.[field] ?? '').trim().toLowerCase() === targetVal);
          count = sameFieldTrips.length > 0 ? sameFieldTrips.length : personTrips.length;
        } else {
          count = personTrips.length;
        }
      } else {
        count = personTrips.length;
      }
      if (count === 0 && personTrips.length === 0) count = 1;
    }

    const numTarget = parseFloat(target.replace(/[^0-9.-]+/g, ''));
    if (isNaN(numTarget)) return true;

    if (op === 'count_gt' || op === 'gt') return count > numTarget;
    if (op === 'count_gte' || op === 'gte') return count >= numTarget;
    if (op === 'count_lt' || op === 'lt') return count < numTarget;
    if (op === 'count_lte' || op === 'lte') return count <= numTarget;
    if (op === 'count_eq' || op === 'equals') return count === numTarget;
    if (op === 'not_equals') return count !== numTarget;
    return count >= numTarget;
  }

  if (field === 'di_truoc_khi_co_quyet_dinh') {
    const res = computeDepartBeforeDecision(item, { formulaColDep: 'ngay_xuat_canh', formulaColDecDate: 'ngay_ban_hanh' });
    return res.isWarning;
  }

  // 1b-2. Trạng thái hiện diện (Trong nước / Nước ngoài / Quá hạn)
  // 1b-2. Trạng thái hiện diện (Trong nước / Nước ngoài / Quá hạn)
  if (isPresenceField(field)) {
    const pVal = resolveVirtualColumnValue(item, field) || item.presenceStatus || item._presenceStatus || '';
    const strPVal = String(pVal).toLowerCase().trim();
    if (op === 'equals') {
      if (strPVal === target) return true;
      if ((target.includes('nước ngoài') || target === 'abroad') && strPVal.includes('nước ngoài')) return true;
      if ((target.includes('quá hạn') || target === 'overdue') && (strPVal.includes('quá hạn') || strPVal.includes('chưa về'))) return true;
      if ((target.includes('trong nước') || target.includes('về nước') || target === 'completed') && (strPVal.includes('trong nước') || strPVal.includes('đã về') || strPVal.includes('về nước'))) return true;
      return false;
    }
    if (op === 'not_equals') {
      if ((target.includes('nước ngoài') || target === 'abroad') && strPVal.includes('nước ngoài')) return false;
      if ((target.includes('quá hạn') || target === 'overdue') && (strPVal.includes('quá hạn') || strPVal.includes('chưa về'))) return false;
      if ((target.includes('trong nước') || target.includes('về nước') || target === 'completed') && (strPVal.includes('trong nước') || strPVal.includes('đã về') || strPVal.includes('về nước'))) return false;
      return strPVal !== target;
    }
    if (op === 'contains') {
      if (strPVal.includes(target) || target.includes(strPVal)) return true;
      if ((target.includes('nước ngoài') || target === 'abroad') && strPVal.includes('nước ngoài')) return true;
      if ((target.includes('quá hạn') || target === 'overdue') && (strPVal.includes('quá hạn') || strPVal.includes('chưa về'))) return true;
      if ((target.includes('trong nước') || target.includes('về nước') || target === 'completed') && (strPVal.includes('trong nước') || strPVal.includes('đã về') || strPVal.includes('về nước'))) return true;
      return false;
    }
    if (op === 'not_contains') {
      if ((target.includes('nước ngoài') || target === 'abroad') && strPVal.includes('nước ngoài')) return false;
      if ((target.includes('quá hạn') || target === 'overdue') && (strPVal.includes('quá hạn') || strPVal.includes('chưa về'))) return false;
      if ((target.includes('trong nước') || target.includes('về nước') || target === 'completed') && (strPVal.includes('trong nước') || strPVal.includes('đã về') || strPVal.includes('về nước'))) return false;
      return !strPVal.includes(target);
    }
    if (op === 'has_value') return !!strPVal && strPVal !== '-';
    if (op === 'empty') return !strPVal || strPVal === '-';
    return true;
  }

  // 1c. Dynamic Field Condition (Áp dụng chuẩn toán tử cho TẤT CẢ các cột và công thức)
  const rawVal = getRowFieldValue(item, field);
  const fieldVal = (rawVal !== undefined && rawVal !== null && rawVal !== '-')
    ? String(rawVal).trim()
    : '';

  if (op === 'has_value') {
    return !!fieldVal && fieldVal !== 'Chưa rõ' && fieldVal !== '-';
  }
  if (op === 'empty') {
    return !fieldVal || fieldVal === 'Chưa rõ' || fieldVal === '-';
  }

  const strVal = fieldVal.toLowerCase().replace(/\s+/g, ' ');
  const rawTarget = String(cond.value || '').trim();
  const strTarget = rawTarget.toLowerCase().replace(/\s+/g, ' ');

  if (op === 'equals') {
    if (strVal === strTarget) return true;
    const subKeywords = strTarget.split(/[,;\n]/).map((k) => k.trim()).filter(Boolean);
    if (subKeywords.length > 1) {
      if (subKeywords.some((k) => strVal === k)) return true;
    }
    if ((strTarget.includes('nước ngoài') || strTarget === 'abroad') && strVal.includes('nước ngoài')) return true;
    if ((strTarget.includes('quá hạn') || strTarget === 'overdue') && (strVal.includes('quá hạn') || strVal.includes('chưa về'))) return true;
    if ((strTarget.includes('trong nước') || strTarget.includes('về nước') || strTarget === 'completed') && (strVal.includes('trong nước') || strVal.includes('về nước') || strVal.includes('đã về'))) return true;
    return false;
  }
  if (op === 'not_equals') {
    if ((strTarget.includes('nước ngoài') || strTarget === 'abroad') && strVal.includes('nước ngoài')) return false;
    if ((strTarget.includes('quá hạn') || strTarget === 'overdue') && (strVal.includes('quá hạn') || strVal.includes('chưa về'))) return false;
    if ((strTarget.includes('trong nước') || strTarget.includes('về nước') || strTarget === 'completed') && (strVal.includes('trong nước') || strVal.includes('về nước') || strVal.includes('đã về'))) return false;
    const subKeywords = strTarget.split(/[,;\n]/).map((k) => k.trim()).filter(Boolean);
    if (subKeywords.length > 1) {
      return !subKeywords.some((k) => strVal === k) && strVal !== strTarget;
    }
    return strVal !== strTarget;
  }
  if (op === 'contains') {
    if (strVal.includes(strTarget)) return true;
    if ((strTarget.includes('nước ngoài') || strTarget === 'abroad') && strVal.includes('nước ngoài')) return true;
    if ((strTarget.includes('quá hạn') || strTarget === 'overdue') && (strVal.includes('quá hạn') || strVal.includes('chưa về'))) return true;
    if ((strTarget.includes('trong nước') || strTarget.includes('về nước') || strTarget === 'completed') && (strVal.includes('trong nước') || strVal.includes('về nước') || strVal.includes('đã về'))) return true;
    const subKeywords = strTarget.split(/[,;\n]/).map((k) => k.trim()).filter(Boolean);
    if (subKeywords.length > 1) {
      return subKeywords.some((k) => strVal.includes(k));
    }
    return strVal.includes(strTarget);
  }
  if (op === 'not_contains') {
    if ((strTarget.includes('nước ngoài') || strTarget === 'abroad') && strVal.includes('nước ngoài')) return false;
    if ((strTarget.includes('quá hạn') || strTarget === 'overdue') && (strVal.includes('quá hạn') || strVal.includes('chưa về'))) return false;
    if ((strTarget.includes('trong nước') || strTarget.includes('về nước') || strTarget === 'completed') && (strVal.includes('trong nước') || strVal.includes('về nước') || strVal.includes('đã về'))) return false;
    const subKeywords = strTarget.split(/[,;\n]/).map((k) => k.trim()).filter(Boolean);
    if (subKeywords.length > 1) {
      return !subKeywords.some((k) => strVal.includes(k));
    }
    return !strVal.includes(strTarget);
  }

  if (op === 'before' || op === 'after') {
    const dVal = new Date(rawVal).getTime();
    const dTarget = new Date(cond.value).getTime();
    if (isNaN(dVal) || isNaN(dTarget)) return false;
    return op === 'before' ? dVal < dTarget : dVal > dTarget;
  }

  if (op === 'gte' || op === 'lte' || op === 'gt' || op === 'lt') {
    const numVal = parseFloat(strVal.replace(/[^0-9.-]+/g, ''));
    const numTarget = parseFloat(strTarget.replace(/[^0-9.-]+/g, ''));
    if (isNaN(numVal) || isNaN(numTarget)) return false;
    if (op === 'gt') return numVal > numTarget;
    if (op === 'gte') return numVal >= numTarget;
    if (op === 'lt') return numVal < numTarget;
    if (op === 'lte') return numVal <= numTarget;
  }

  return true;
};

const matchCardCondition = (item, card) => {
  if (!card) return true;

  // 1. Kiểm tra danh sách điều kiện (hỗ trợ cả conditions[] mới và card.field cũ)
  const rawConds = Array.isArray(card.conditions) && card.conditions.length > 0
    ? card.conditions
    : (card.field ? [{ field: card.field, operator: card.operator || 'has_value', value: card.value || '' }] : []);

  const activeConds = rawConds.filter((c) => c && c.field && String(c.field).trim() !== '');

  if (activeConds.length > 0) {
    const logicOp = (card.logicOp || 'AND').toUpperCase();
    if (logicOp === 'OR') {
      return activeConds.some((cond) => matchSingleCondition(item, cond));
    }
    return activeConds.every((cond) => matchSingleCondition(item, cond));
  }

  // 2. Không có card.field / conditions -> Kiểm tra Preset condition
  const cond = card.condition || card.id || '';
  if (cond === 'completed') {
    const presence = getTripPresence(item);
    return presence.status === 'completed' && !presence.isOverdue;
  }
  if (cond === 'abroad') {
    const presence = getTripPresence(item);
    return presence.status === 'abroad';
  }
  if (cond === 'overdue') {
    const presence = getTripPresence(item);
    return presence.status === 'overdue' || (presence.status === 'completed' && presence.isOverdue);
  }

  // 3. Mặc định không chọn cột lọc gì -> Toàn bộ danh sách của bảng
  return true;
};

const isCardAllType = (card) => {
  if (!card) return false;
  const rawConds = Array.isArray(card.conditions) && card.conditions.length > 0
    ? card.conditions
    : (card.field ? [{ field: card.field, operator: card.operator || 'has_value', value: card.value || '' }] : []);
  const activeConds = rawConds.filter((c) => c && c.field && String(c.field).trim() !== '');
  if (activeConds.length > 0) return false;
  if (card.condition && card.condition !== 'all') return false;
  return true;
};

const getCardMetricValueForTopic = (card, topic) => {
  if (!card) return 0;
  // Resolve actual card definition from topic if card is a widget reference
  const topicCards = topic?.metricCards || [];
  const cardIdToMatch = card.cardId || card.id || card.cardCondition || card.condition;
  const cardLabelToMatch = card.cardLabel || card.label || card.title;
  const actualCard = topicCards.find((c, idx) =>
    (c.id && (c.id === cardIdToMatch || c.condition === cardIdToMatch)) ||
    (c.label && (c.label === cardLabelToMatch)) ||
    `card_${idx}` === cardIdToMatch
  ) || card;

  let src = topic?.source || actualCard.source || card.source;
  if (!src) {
    const str = `${card.topicTitle || ''} ${card.title || ''} ${topic?.title || ''}`.toLowerCase();
    if (str.includes('thân nhân')) src = 'relatives';
    else if (str.includes('cán bộ')) src = 'personnel';
    else src = 'trips';
  }
  const fullList = getSourceList(src);

  // Xác định tập dữ liệu cơ sở của Chuyên đề (Baseline List dựa trên thẻ đầu tiên)
  const firstCard = topicCards[0];
  let baselineList = fullList;
  if (firstCard && !isCardAllType(firstCard)) {
    baselineList = fullList.filter((item) => matchCardCondition(item, firstCard));
  }

  const isUnique = !!(actualCard.isUnique || card.isUnique);
  if (isUnique) {
    const pKeyField = personnelStore.getPersonnelKeyField ? personnelStore.getPersonnelKeyField() : 'cccdparent';
    const uniqueSet = new Set();
    const targetItems = (actualCard === firstCard || isCardAllType(actualCard))
      ? baselineList
      : baselineList.filter((item) => matchCardCondition(item, actualCard));
    targetItems.forEach((item) => {
      const keyVal = item[pKeyField] ?? item.cccdparent ?? item.parentCccd ?? item.rawPerson?.[pKeyField] ?? item.rawPerson?.custom_data?.[pKeyField] ?? item.personnelId ?? item.id;
      if (keyVal && String(keyVal).trim() !== '' && String(keyVal).trim() !== '-') {
        uniqueSet.add(String(keyVal).trim());
      }
    });
    return uniqueSet.size;
  }

  // Nếu là thẻ đầu tiên (Toàn bộ) -> trả về độ dài tập cơ sở
  if (actualCard === firstCard || isCardAllType(actualCard)) {
    return baselineList.length;
  }

  // Các thẻ con luôn lọc TRÊN TẬP CƠ SỞ (baselineList)
  return baselineList.filter((item) => matchCardCondition(item, actualCard)).length;
};

const onTopicCardSelectChange = () => {
  const topic = selectedTopicObject.value;
  const cards = availableCardsForSelectedTopic.value;
  const card = cards.find((c, idx) => (c.id || c.label || `card_${idx}`) === selectedWidgetCardKey.value) || cards[0];
  if (!card || !topic) return;

  const colorMap = {
    blue: '#0284c7',
    green: '#2e7d32',
    amber: '#ea580c',
    red: '#dc2626',
    purple: '#7c3aed',
    teal: '#0d9488',
  };

  const cardConds = (card.conditions && card.conditions.length > 0) ? card.conditions : (card.field ? [{ field: card.field }] : []);
  const primaryField = cardConds.length > 0 ? cardConds[0].field : '';

  widgetForm.value = {
    ...widgetForm.value,
    title: card.label === 'Toàn bộ' ? `Tổng số ${topic.title}` : `${topic.title} - ${card.label}`,
    topicId: topic.id,
    topicTitle: topic.title,
    cardId: card.id || card.label,
    cardCondition: card.condition || card.id,
    field: primaryField,
    columnId: primaryField,
    conditions: card.conditions || (card.field ? [{ field: card.field, operator: card.operator || 'has_value', value: card.value || '' }] : []),
    operator: card.operator || 'has_value',
    value: card.value || '',
    source: topic.source || 'trips',
    displayType: widgetForm.value.displayType || 'count',
    color: colorMap[card.color] || card.color || '#2e7d32',
    icon: topic.icon ? `pi ${topic.icon}` : 'pi-send',
  };
};

const onTopicSelectChange = () => {
  const cards = availableCardsForSelectedTopic.value;
  if (cards.length > 0) {
    selectedWidgetCardKey.value = cards[0].id || cards[0].label || 'card_0';
    onTopicCardSelectChange();
  }
};

// Widget CRUD
const openAddWidgetDialog = (group) => {
  activeGroupForWidget.value = group;
  editingWidget.value = null;
  widgetCreateMode.value = 'topic';
  if (availableTopicDashboards.value.length > 0) {
    selectedWidgetTopicId.value = availableTopicDashboards.value[0].id;
  } else {
    selectedWidgetTopicId.value = 'trips';
  }
  widgetForm.value = {
    id: 'w_' + Date.now(),
    title: '',
    source: 'trips',
    columnId: '',
    columnLabel: '',
    displayType: 'count',
    widthPercent: 33,
    countCondition: 'not_empty',
    countValue: '',
    color: '#2e7d32',
    icon: 'pi-chart-line',
    topicId: selectedWidgetTopicId.value,
    topicTitle: '',
    cardId: '',
    cardCondition: '',
  };
  widgetOrder.value = (group.widgets || []).length + 1;
  onTopicSelectChange();
  isWidgetDialogOpen.value = true;
};

const openEditWidgetDialog = (group, widget) => {
  activeGroupForWidget.value = group;
  editingWidget.value = widget;
  widgetCreateMode.value = widget.topicId ? 'topic' : 'custom';
  if (widget.topicId) {
    selectedWidgetTopicId.value = widget.topicId;
    selectedWidgetCardKey.value = widget.cardId || widget.cardCondition || 'all';
  }
  const curIdx = (group.widgets || []).findIndex((w) => w.id === widget.id);
  widgetOrder.value = curIdx !== -1 ? curIdx + 1 : (group.widgets || []).length;
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
  if (isSavingWidget.value) return;
  if (!widgetForm.value.title.trim()) {
    alert('Vui lòng nhập Tiêu đề cho Khối thống kê!');
    return;
  }
  if (widgetCreateMode.value === 'custom' && !widgetForm.value.columnId) {
    alert('Vui lòng chọn Cột dữ liệu cần thống kê!');
    return;
  }
  const group = activeGroupForWidget.value;
  if (!group) return;
  if (!group.widgets) group.widgets = [];

  isSavingWidget.value = true;
  isWidgetDialogOpen.value = false;

  try {
    const payload = {
      ...widgetForm.value,
      widthPercent: Number(widgetForm.value.widthPercent) || 33,
    };

    if (editingWidget.value) {
      const oldIdx = group.widgets.findIndex((w) => w.id === editingWidget.value.id);
      if (oldIdx !== -1) {
        group.widgets.splice(oldIdx, 1);
        const targetIdx = Math.max(0, Math.min(Number(widgetOrder.value) - 1, group.widgets.length));
        group.widgets.splice(targetIdx, 0, payload);
      } else {
        group.widgets.push(payload);
      }
    } else {
      const targetIdx = Math.max(0, Math.min(Number(widgetOrder.value) - 1, group.widgets.length));
      group.widgets.splice(targetIdx, 0, payload);
    }

    await saveCustomGroupsToDb();
  } catch (e) {
    console.error('Error saving widget:', e);
  } finally {
    isSavingWidget.value = false;
  }
};

const openReorderWidgetsDialog = (group) => {
  reorderingGroup.value = group;
  isReorderWidgetsDialogOpen.value = true;
};

const moveWidget = async (group, widget, direction) => {
  if (!group?.widgets) return;
  const idx = group.widgets.findIndex((w) => w.id === widget.id);
  if (idx === -1) return;
  const newIdx = idx + direction;
  if (newIdx < 0 || newIdx >= group.widgets.length) return;
  const item = group.widgets.splice(idx, 1)[0];
  group.widgets.splice(newIdx, 0, item);
  await saveCustomGroupsToDb();
};

const moveWidgetToTop = async (group, widget) => {
  if (!group?.widgets) return;
  const idx = group.widgets.findIndex((w) => w.id === widget.id);
  if (idx <= 0) return;
  const item = group.widgets.splice(idx, 1)[0];
  group.widgets.unshift(item);
  await saveCustomGroupsToDb();
};

const moveWidgetToBottom = async (group, widget) => {
  if (!group?.widgets) return;
  const idx = group.widgets.findIndex((w) => w.id === widget.id);
  if (idx === -1 || idx === group.widgets.length - 1) return;
  const item = group.widgets.splice(idx, 1)[0];
  group.widgets.push(item);
  await saveCustomGroupsToDb();
};

const setWidgetPosition = async (group, widget, targetPos1Based) => {
  if (!group?.widgets) return;
  const idx = group.widgets.findIndex((w) => w.id === widget.id);
  if (idx === -1) return;
  const targetIdx = Math.max(0, Math.min(targetPos1Based - 1, group.widgets.length - 1));
  if (targetIdx === idx) return;
  const item = group.widgets.splice(idx, 1)[0];
  group.widgets.splice(targetIdx, 0, item);
  await saveCustomGroupsToDb();
};

const getWidgetStyle = (widget) => {
  const wp = Number(widget.widthPercent) || 33;
  if (wp === 100) {
    return {
      flex: '1 1 100%',
      width: '100%',
      maxWidth: '100%',
    };
  }
  if (wp === 50) {
    return {
      flex: '1 1 calc(50% - 0.5rem)',
      width: 'calc(50% - 0.5rem)',
      maxWidth: 'calc(50% - 0.5rem)',
      minWidth: '320px',
    };
  }
  if (wp === 25) {
    return {
      flex: '1 1 calc(25% - 0.75rem)',
      width: 'calc(25% - 0.75rem)',
      maxWidth: 'calc(25% - 0.75rem)',
      minWidth: '220px',
    };
  }
  if (wp === 20) {
    return {
      flex: '1 1 calc(20% - 0.8rem)',
      width: 'calc(20% - 0.8rem)',
      maxWidth: 'calc(20% - 0.8rem)',
      minWidth: '180px',
    };
  }
  if (wp === 16.66 || wp === 16 || wp === 17 || Math.abs(wp - 16.66) < 1) {
    return {
      flex: '1 1 calc(16.666% - 0.85rem)',
      width: 'calc(16.666% - 0.85rem)',
      maxWidth: 'calc(16.666% - 0.85rem)',
      minWidth: '150px',
    };
  }
  // Default 33.333%
  return {
    flex: '1 1 calc(33.333% - 0.67rem)',
    width: 'calc(33.333% - 0.67rem)',
    maxWidth: 'calc(33.333% - 0.67rem)',
    minWidth: '260px',
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

const computeWidgetCount = (widget) => {
  if (widget.topicId) {
    const topic = availableTopicDashboards.value.find((t) => t.id === widget.topicId);
    return getCardMetricValueForTopic(widget, topic);
  }

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

const handleWidgetClick = (widget) => {
  if (widget.topicId) {
    const targetPath = widget.topicId === 'trips' ? '/trips' : `/dashboard-topic/${widget.topicId}`;
    const cardParam = widget.cardId || widget.cardCondition || widget.id;
    router.push({ path: targetPath, query: { card: cardParam, filterField: widget.columnId || '', filterValue: widget.countValue || '' } });
    return;
  }
  const isRel = widget.source === 'relatives';
  const targetPath = widget.source === 'personnel' ? '/personnel' : (isRel ? '/personnel' : '/trips');
  const query = {};
  if (isRel) query.tab = 'thannhan';
  if (widget.columnId) {
    query.filterField = widget.columnId;
    query.filterValue = widget.countValue || '';
  }
  router.push({ path: targetPath, query });
};

const computeWidgetChartData = (widget) => {
  const topic = availableTopicDashboards.value.find((t) => t.id === widget.topicId);
  const source = widget.source || topic?.source || 'trips';
  const list = getSourceList(source);

  // Tìm Metric Card tương ứng trong Chuyên đề
  const card = (topic?.metricCards || []).find((c) => (c.id && c.id === widget.cardId) || c.label === widget.cardId || c.label === widget.title) || widget;

  // Lọc danh sách bản ghi theo điều kiện của Metric Card
  const matchedList = list.filter((row) => matchCardCondition(row, card));

  // Xác định Cột cần Gom nhóm (Group by Field)
  const cardConds = (card.conditions && card.conditions.length > 0)
    ? card.conditions
    : (card.field ? [{ field: card.field }] : []);

  let groupField = widget.columnId;
  if (!groupField && cardConds.length > 0 && cardConds[0].field) {
    groupField = cardConds[0].field;
  }
  if (!groupField) {
    groupField = source === 'trips' ? 'countryName' : (source === 'relatives' ? 'countryName' : 'departmentName');
  }

  const counts = {};
  let total = 0;

  matchedList.forEach((row) => {
    const val = getRowFieldValue(row, groupField);
    if (val === undefined || val === null) return;
    const strVal = String(val).trim();
    if (!strVal || strVal === '-') return;

    counts[strVal] = (counts[strVal] || 0) + 1;
    total++;
  });

  const chartList = Object.entries(counts)
    .map(([name, count]) => ({ name, count, field: groupField }))
    .sort((a, b) => b.count - a.count);

  const max = chartList.length > 0 ? chartList[0].count : 1;
  return { list: chartList, max, total, groupField };
};

const getFilteredChartList = (widget) => {
  const data = computeWidgetChartData(widget).list;
  const q = (customChartSearches.value[widget.id] || '').toLowerCase().trim();
  if (!q) return data;
  return data.filter((item) => item.name.toLowerCase().includes(q));
};

const availableColumnsForWidgetSource = computed(() => {
  const source = widgetForm.value.source;
  if (source === 'trips') return allAvailableTripColumns.value;
  const mapping = source === 'relatives' ? personnelStore.importMappingRelative : personnelStore.importMappingPersonnel;
  const colMap = computeColumnIndexMap(mapping);
  const list = [];

  // Thêm các cột ảo hệ thống (Trạng thái hiện diện, Đối tượng)
  list.push({
    id: 'presenceStatus',
    rawLabel: 'Trạng thái hiện diện',
    label: '⚡ [Bộ lọc] Trạng thái hiện diện (Trong nước / Nước ngoài / Quá hạn)',
  });
  list.push({
    id: 'isRelative',
    rawLabel: 'Đối tượng (Cán bộ / Thân nhân)',
    label: '⚡ [Bộ lọc] Đối tượng (Cán bộ hay Thân nhân)',
  });

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

const allAvailableRelativeColumns = computed(() => {
  const list = [];
  let currentColIdx = 0;

  (personnelStore.importMappingRelative || []).forEach((g) => {
    (g.columns || []).forEach((c) => {
      currentColIdx++;
      const grp = g.group ? `[${g.group}] ` : '';
      const subOpts = getSubOptionsList(c);

      if (subOpts.length > 1) {
        const start = currentColIdx;
        const end = currentColIdx + subOpts.length - 1;
        list.push({
          id: c.id,
          label: `[Cột ${start} - ${end}] ${grp}${c.label || c.id} (${c.id})`,
        });
        subOpts.forEach((opt, sIdx) => {
          const colNum = start + sIdx;
          list.push({
            id: c.id,
            subOpt: opt,
            label: `  └─ [Cột ${colNum}] ${grp}${c.label || c.id}: ${opt}`,
          });
        });
        currentColIdx = end;
      } else {
        list.push({
          id: c.id,
          label: `[Cột ${currentColIdx}] ${grp}${c.label || c.id} (${c.id})`,
        });
      }
    });
  });
  return list;
});

const allAvailablePersonnelColumns = computed(() => {
  const list = [];
  let currentColIdx = 0;

  (personnelStore.importMappingPersonnel || []).forEach((g) => {
    (g.columns || []).forEach((c) => {
      currentColIdx++;
      const grp = g.group ? `[${g.group}] ` : '';
      const subOpts = getSubOptionsList(c);

      if (subOpts.length > 1) {
        const start = currentColIdx;
        const end = currentColIdx + subOpts.length - 1;
        list.push({
          id: c.id,
          label: `[Cột ${start} - ${end}] ${grp}${c.label || c.id} (${c.id})`,
        });
        subOpts.forEach((opt, sIdx) => {
          const colNum = start + sIdx;
          list.push({
            id: c.id,
            subOpt: opt,
            label: `  └─ [Cột ${colNum}] ${grp}${c.label || c.id}: ${opt}`,
          });
        });
        currentColIdx = end;
      } else {
        list.push({
          id: c.id,
          label: `[Cột ${currentColIdx}] ${grp}${c.label || c.id} (${c.id})`,
        });
      }
    });
  });
  return list;
});

const allAvailableTripColumns = computed(() => {
  const list = [];
  let currentColIdx = 0;

  (personnelStore.importMappingTrips || []).forEach((g) => {
    (g.columns || []).forEach((c) => {
      currentColIdx++;
      const grp = g.group ? `[${g.group}] ` : '';
      const subOpts = getSubOptionsList(c);

      if (subOpts.length > 1) {
        const start = currentColIdx;
        const end = currentColIdx + subOpts.length - 1;
        list.push({
          id: c.id,
          label: `[Cột ${start} - ${end}] ${grp}${c.label || c.id} (${c.id})`,
        });
        subOpts.forEach((opt, sIdx) => {
          const colNum = start + sIdx;
          list.push({
            id: c.id,
            subOpt: opt,
            label: `  └─ [Cột ${colNum}] ${grp}${c.label || c.id}: ${opt}`,
          });
        });
        currentColIdx = end;
      } else {
        list.push({
          id: c.id,
          label: `[Cột ${currentColIdx}] ${grp}${c.label || c.id} (${c.id})`,
        });
      }
    });
  });

  if (list.length === 0) {
    return [
      { id: 'cccdchuyendi', label: 'CCCD / Định danh người đi (cccdchuyendi)' },
      { id: 'countryName', label: 'Quốc gia / Nơi đến (countryName)' },
      { id: 'departureDate', label: 'Ngày xuất cảnh (departureDate)' },
      { id: 'arrivalDate', label: 'Ngày nhập cảnh (arrivalDate)' },
      { id: 'decisionNumber', label: 'Số quyết định duyệt (decisionNumber)' },
      { id: 'decisionDate', label: 'Ngày quyết định (decisionDate)' },
      { id: 'fundingName', label: 'Nguồn kinh phí (fundingName)' },
      { id: 'purpose', label: 'Mục đích chuyến đi (purpose)' },
      { id: 'passportNumber', label: 'Số Hộ chiếu (passportNumber)' },
      { id: 'approvedDepartureDate', label: 'Ngày đi duyệt (approvedDepartureDate)' },
      { id: 'approvedArrivalDate', label: 'Ngày về duyệt (approvedArrivalDate)' },
      { id: 'approvedExtensionDate', label: 'Ngày gia hạn duyệt (approvedExtensionDate)' },
    ];
  }
  return list;
});

// =========================================================================
// 3. STAT COMPUTATION
// =========================================================================
const countrySearch = ref('');
const fundingSearch = ref('');

const getTripValue = (trip, colId) => {
  if (!trip || !colId) return '';
  let raw = trip[colId];
  if (raw === undefined || raw === null || raw === '') {
    if (trip.custom_data) {
      try {
        const cd = typeof trip.custom_data === 'string' ? JSON.parse(trip.custom_data) : trip.custom_data;
        if (cd) raw = cd[colId];
      } catch (e) {}
    }
  }
  if (raw === undefined || raw === null || raw === '') return '';
  if (typeof raw === 'object') {
    if (Array.isArray(raw)) {
      return raw
        .map((x) => (typeof x === 'object' && x !== null ? (x.name || x.label || x.col1 || x.value || JSON.stringify(x)) : x))
        .filter(Boolean)
        .join(', ');
    }
    return raw.name || raw.label || raw.value || JSON.stringify(raw);
  }
  return String(raw).trim();
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

  const countries = {}; // { [key]: { trips: 0, relatives: 0, total: 0 } }
  const fundings = {};  // { [key]: { trips: 0, relatives: 0, total: 0 } }

  const countryColId = colConfig.value.country || 'quoc_gia_xuat_canh';
  const fundingColId = colConfig.value.funding || 'nguon_kinh_phi';

  // Lấy danh sách chuyến đi của Cán bộ (không lấy thân nhân) theo cột đã chọn trong Setting
  const allTrips = (unifiedTripsList.value || []).filter((t) => !t.isRelative && !t.isRelativeTrip);

  allTrips.forEach((t) => {
    const cName = String(getTripValue(t, countryColId) || t[countryColId] || t.countryName || '').trim();
    const fName = String(getTripValue(t, fundingColId) || t[fundingColId] || t.fundingName || '').trim();

    const enrichedTrip = {
      ...t,
      countryName: cName || '-',
      fundingName: fName || '-',
      isRelativeTrip: false,
    };

    filteredTrips.push(enrichedTrip);

    if (!enrichedTrip.decisionNumber && !enrichedTrip.so_quyet_dinh) {
      missingDecisionTrips.push(enrichedTrip);
    }

    if (enrichedTrip.approvedExtensionDate || enrichedTrip.gia_han_den_ngay) {
      extendedTrips.push(enrichedTrip);
    } else {
      const arr = parseDateObj(enrichedTrip.arrivalDate || enrichedTrip.ngay_nhap_canh);
      const appArrObj = parseDateObj(enrichedTrip.approvedArrivalDate || enrichedTrip.thoi_gian_duyet_ve);
      if (arr && appArrObj && arr > appArrObj) {
        overdueTrips.push(enrichedTrip);
      } else {
        onTimeTrips.push(enrichedTrip);
      }
    }

    // 1. Đếm trực tiếp theo cột Quốc gia đã cài đặt trong Setting (Chỉ Cán bộ)
    if (cName && cName !== '-' && cName !== 'Chưa rõ') {
      if (!countries[cName]) countries[cName] = { trips: 0, count: 0 };
      countries[cName].trips += 1;
      countries[cName].count += 1;
    }

    // 2. Đếm trực tiếp theo cột Nguồn kinh phí đã cài đặt trong Setting (Chỉ Cán bộ)
    if (fName && fName !== '-' && fName !== 'Chưa rõ') {
      if (!fundings[fName]) fundings[fName] = { trips: 0, count: 0 };
      fundings[fName].trips += 1;
      fundings[fName].count += 1;
    }
  });

  const countryList = Object.entries(countries)
    .map(([name, data]) => ({
      name,
      count: data.count || data.trips,
      tripsCount: data.trips || data.count,
      relativesCount: 0,
    }))
    .sort((a, b) => b.count - a.count);

  const fundingList = Object.entries(fundings)
    .map(([name, data]) => ({
      name,
      count: data.count || data.trips,
      tripsCount: data.trips || data.count,
      relativesCount: 0,
    }))
    .sort((a, b) => b.count - a.count);

  const abroadPersonnelSet = new Set();
  const abroadPersonnelList = [];

  pList.forEach((p) => {
    let hasAbroad = false;
    if (Array.isArray(p.trips) && p.trips.length > 0) {
      hasAbroad = p.trips.some((t) => {
        const c = getTripValue(t, colConfig.value.country) || t.countryName || t.country;
        return c && String(c).trim() !== '' && String(c).trim() !== '-' && String(c).trim() !== 'Chưa rõ';
      });
    }
    if (hasAbroad) {
      const key = String(p.id || p.code || p.name);
      if (!abroadPersonnelSet.has(key)) {
        abroadPersonnelSet.add(key);
        abroadPersonnelList.push(p);
      }
    }
  });

  filteredTrips.forEach((t) => {
    const c = getTripValue(t, colConfig.value.country) || t.countryName;
    if (c && String(c).trim() !== '' && String(c).trim() !== '-' && String(c).trim() !== 'Chưa rõ') {
      const key = String(t.personnelId || t.personnelCode || (t.personnel && (t.personnel.id || t.personnel.code)) || t.personnelName || '');
      if (key && !abroadPersonnelSet.has(key)) {
        abroadPersonnelSet.add(key);
        const matched = pList.find((p) => String(p.id) === key || String(p.code) === key);
        if (matched) {
          abroadPersonnelList.push(matched);
        } else {
          abroadPersonnelList.push(t.personnel || { name: t.personnelName, trips: [t] });
        }
      }
    }
  });

  const totalAbroadPersonnel = abroadPersonnelSet.size;

  const maxCountry = countryList.length > 0 ? countryList[0].count : 1;
  const maxFunding = fundingList.length > 0 ? fundingList[0].count : 1;

  return {
    totalPersonnel: pList.length,
    totalAbroadPersonnel,
    abroadPersonnelList,
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
// 4. CHART ITEM CLICK & NAVIGATION
// =========================================================================
const handleChartItemClick = (widget, itemName) => {
  const targetPath = widget.topicId === 'trips' || !widget.topicId
    ? (widget.source === 'personnel' ? '/personnel' : (widget.source === 'relatives' ? '/personnel' : '/trips'))
    : `/dashboard-topic/${widget.topicId}`;

  const cardParam = widget.cardId || widget.id;
  const topic = availableTopicDashboards.value.find((t) => t.id === widget.topicId);
  const card = (topic?.metricCards || []).find((c) => (c.id && c.id === widget.cardId) || c.label === widget.cardId || c.label === widget.title) || widget;
  const cardConds = (card.conditions && card.conditions.length > 0) ? card.conditions : (card.field ? [{ field: card.field }] : []);
  const field = widget.columnId || (cardConds.length > 0 ? cardConds[0].field : '') || 'countryName';

  if (field === 'countryName' || field === 'quoc_gia_xuat_canh' || field === 'country') {
    router.push({ path: targetPath, query: { card: cardParam, country: itemName } });
  } else if (field === 'fundingName' || field === 'nguon_kinh_phi' || field === 'funding') {
    router.push({ path: targetPath, query: { card: cardParam, funding: itemName } });
  } else if (field === 'departmentId' || field === 'departmentName') {
    router.push({ path: targetPath, query: { card: cardParam, department: itemName } });
  } else {
    router.push({ path: targetPath, query: { card: cardParam, filterField: field, filterValue: itemName } });
  }
};

const onDisplayTypeChange = () => {
  if (widgetForm.value.displayType === 'count') {
    if (!widgetForm.value.cardId && availableCardsForSelectedTopic.value.length > 0) {
      selectedWidgetCardKey.value = availableCardsForSelectedTopic.value[0].id || availableCardsForSelectedTopic.value[0].label || 'card_0';
      onTopicCardSelectChange();
    }
  } else {
    if (!widgetForm.value.columnId && availableColumnsForWidgetSource.value.length > 0) {
      widgetForm.value.columnId = availableColumnsForWidgetSource.value[0].id;
      onWidgetColumnSelect();
    }
  }
};

const refreshData = async () => {
  await personnelStore.fetchPersonnel();
};

onMounted(async () => {
  await personnelStore.loadSettings();
  await personnelStore.fetchPersonnel();
  await loadDashboardSettings();
  await loadTopicDashboards();
  await loadCustomGroups();
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

.clickable-row {
  cursor: pointer;
  transition: all 0.15s ease;
}

/* Vertical Stacked Column Chart styles */
.country-column-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 58px;
  min-width: 58px;
  height: 100%;
  justify-content: flex-end;
  cursor: pointer;
  transition: transform 0.2s ease, background-color 0.2s ease;
  padding: 4px 2px;
  border-radius: 6px;
}

.country-column-item:hover {
  transform: translateY(-4px);
  background-color: rgba(226, 232, 240, 0.6);
}

.column-top-total {
  font-size: 0.72rem;
  font-weight: 800;
  color: #1e293b;
  margin-bottom: 4px;
}

.column-bar-track {
  width: 28px;
  height: 155px;
  background: #f1f5f9;
  border-radius: 6px 6px 2px 2px;
  overflow: hidden;
  display: flex;
  flex-direction: column-reverse;
  border: 1px solid #e2e8f0;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.05);
}

.column-segment-cb {
  background: linear-gradient(180deg, #22c55e 0%, #16a34a 100%);
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: height 0.4s ease;
}

.column-segment-tn {
  background: linear-gradient(180deg, #9333ea 0%, #7c3aed 100%);
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: height 0.4s ease;
}

.segment-label {
  font-size: 0.62rem;
  font-weight: 700;
  color: #ffffff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
}

.column-label {
  font-size: 0.72rem;
  font-weight: 600;
  color: #334155;
  margin-top: 6px;
  text-align: center;
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.column-sub-badges {
  font-size: 0.63rem;
  margin-top: 2px;
  display: flex;
  align-items: center;
  gap: 2px;
}

.clickable-row:hover {
  background-color: #f0fdf4 !important;
}

.clickable-row:hover td {
  color: #0f172a;
}

.match-reasons-wrapper {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}
.match-reason-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: #fff7ed;
  color: #c2410c;
  border: 1px solid #ffedd5;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 0.72rem;
  font-weight: 600;
}
</style>
