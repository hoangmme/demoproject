<template>
  <div class="app-content">
    <!-- Top Filter Bar & Dashboard Settings Header -->
    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 1.25rem; background: #ffffff; padding: 12px 16px; border-radius: 12px; border: 1px solid #e5e7eb; box-shadow: 0 1px 3px rgba(0,0,0,0.03);">
      <div style="display: flex; align-items: center; gap: 10px;">
        <div style="width: 36px; height: 36px; border-radius: 10px; background: #e8f5e9; color: #2e7d32; display: flex; align-items: center; justify-content: center;">
          <i class="pi pi-chart-bar" style="font-size: 1.2rem;"></i>
        </div>
        <div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <h2 style="font-size: 1.05rem; font-weight: 700; color: #1e293b; margin: 0;">{{ currentDashboardTitle }}</h2>
            <span v-if="dashboardId !== 'root'" style="font-size: 0.7rem; font-weight: 600; padding: 2px 8px; border-radius: 12px; background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd;">
              Trang tùy chỉnh
            </span>
          </div>
          <span style="font-size: 0.76rem; color: #64748b;">{{ currentDashboardDescription }}</span>
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

    <!-- Trạng thái trống khi Trang chưa có nhóm thống kê -->
    <div
      v-if="!customGroups || customGroups.length === 0"
      style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 48px 24px; background: #ffffff; border-radius: 12px; border: 2px dashed #cbd5e1; text-align: center; margin-bottom: 1.5rem;"
    >
      <div style="width: 56px; height: 56px; border-radius: 16px; background: #f0fdf4; color: #16a34a; display: flex; align-items: center; justify-content: center; margin-bottom: 12px;">
        <i class="pi pi-chart-pie" style="font-size: 1.75rem;"></i>
      </div>
      <h3 style="font-size: 1rem; font-weight: 700; color: #1e293b; margin: 0 0 6px 0;">Trang Thống kê này chưa có Nhóm thống kê nào</h3>
      <p style="font-size: 0.8rem; color: #64748b; max-width: 480px; margin: 0 0 16px 0; line-height: 1.45;">
        Hãy bấm nút bên dưới để tạo nhóm thống kê đầu tiên cho trang này (ví dụ: Thống kê tình hình xuất nhập cảnh, Thống kê Đảng viên...).
      </p>
      <Button
        icon="pi pi-plus"
        label="Thêm Nhóm Thống kê Mới"
        severity="success"
        size="small"
        @click="openAddGroupDialog"
      />
    </div>

    <!-- ========================================================= -->
    <!-- 1. CUSTOM DASHBOARD GROUPS (USER CONFIGURED - AT TOP)     -->
    <!-- ========================================================= -->
    <div v-else class="dashboard-groups-flex-container" style="display: flex; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.5rem; align-items: stretch; width: 100%;">
      <div
        v-for="(group, gIdx) in customGroups"
        :key="group.id || gIdx"
        class="app-card dashboard-group-card"
        :style="{
          flex: `0 0 ${getGroupFlexBasis(group)}`,
          width: getGroupFlexBasis(group),
          maxWidth: getGroupFlexBasis(group),
          marginBottom: '0',
          boxSizing: 'border-box',
          backgroundColor: group.bgColor || '#ffffff',
          borderColor: group.color && group.color !== '#1e293b' ? (group.color + '40') : undefined
        }"
      >
      <!-- Group Header (Inside App Card) -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <i :class="['pi', group.icon || 'pi-folder']" :style="{ color: group.color || '#2e7d32', fontSize: '1.1rem' }"></i>
          <div>
            <h3 :style="{ fontSize: '0.92rem', fontWeight: '700', color: group.color || '#1e293b', margin: 0 }">{{ group.title }}</h3>
            <span v-if="group.description && !group.description.includes('Đồng bộ số liệu từ Chuyên đề')" style="font-size: 0.74rem; color: #64748b;">{{ group.description }}</span>
            <span v-else style="font-size: 0.74rem; color: #64748b;">{{ (group.widgets || []).filter(w => !isWidgetHidden(w)).length }} khối thống kê</span>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 6px;">
          <!-- Move Group Up / Down -->
          <button
            type="button"
            class="btn-icon-square"
            :disabled="gIdx === 0"
            @click="moveCustomGroup(gIdx, -1)"
            title="Dời nhóm lên trên"
          >
            <i class="pi pi-arrow-up"></i>
          </button>
          <button
            type="button"
            class="btn-icon-square"
            :disabled="gIdx === customGroups.length - 1"
            @click="moveCustomGroup(gIdx, 1)"
            title="Dời nhóm xuống dưới"
          >
            <i class="pi pi-arrow-down"></i>
          </button>
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
          >
            <i class="pi pi-sort-alt" style="font-size: 0.78rem; color: #0284c7;"></i> Sắp xếp vị trí
          </button>
          <button
            type="button"
            class="btn-icon-square"
            @click="openEditGroupDialog(group)"
            title="Chỉnh sửa nhóm này"
          >
            <i class="pi pi-pencil"></i>
          </button>
          <button
            type="button"
            class="btn-icon-square"
            @click="duplicateCustomGroup(group)"
            title="Nhân bản nhóm thống kê này"
          >
            <i class="pi pi-clone" style="color: #10b981;"></i>
          </button>
          <button
            type="button"
            class="btn-icon-square btn-danger"
            @click="deleteGroup(group)"
            title="Xóa nhóm này"
          >
            <i class="pi pi-trash"></i>
          </button>
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
          v-show="!isWidgetHidden(widget)"
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
                  <!-- Nhân bản khối -->
                  <button type="button" class="btn-card-setting" @click.stop="duplicateWidget(group, widget)" title="Nhân bản khối thống kê này">
                    <i class="pi pi-clone" style="color: #10b981;"></i>
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
                Xem chi tiết <i class="pi pi-arrow-right"></i>
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
                    {{ widget.title }} ({{ getWidgetChartData(widget).list.length }} phân loại)
                  </h4>
                </div>
              </div>
              <div style="display: flex; align-items: center; gap: 4px;" @click.stop>
                <button type="button" class="btn-card-setting" @click.stop="duplicateWidget(group, widget)" title="Nhân bản khối thống kê này">
                  <i class="pi pi-clone" style="color: #10b981;"></i>
                </button>
                <button type="button" class="btn-card-setting" @click.stop="openEditWidgetDialog(group, widget)" title="Sửa biểu đồ này">
                  <i class="pi pi-pencil"></i>
                </button>
                <button type="button" class="btn-card-setting" @click.stop="deleteWidget(group, widget)" title="Xóa biểu đồ này" style="color: #ef4444;">
                  <i class="pi pi-trash"></i>
                </button>
              </div>
            </div>

            <!-- Vertical Columns Area -->
            <div style="height: 240px; overflow-x: auto; overflow-y: hidden; display: flex; align-items: flex-end; padding: 12px 6px 4px 6px; background: #fafafa; border: 1px solid #f1f5f9; border-radius: 8px;">
              <div v-if="getWidgetChartData(widget).list.length === 0" style="width: 100%; text-align: center; color: #94a3b8; padding: 3rem 0; font-size: 0.78rem;">
                Không có dữ liệu phân loại phù hợp.
              </div>
              <div
                v-else
                style="display: flex; align-items: flex-end; gap: 14px; min-width: 100%; height: 100%; padding-bottom: 2px;"
              >
                <div
                  v-for="(item, cIdx) in getWidgetChartData(widget).list"
                  :key="item.name"
                  class="country-column-item"
                  @click="handleChartItemClick(widget, item)"
                  :title="`${item.name}: ${item.count} kết quả\n(Bấm để xem danh sách chi tiết toàn bộ)`"
                  style="cursor: pointer;"
                >
                  <span class="column-top-total">{{ item.count }}</span>
                  <div class="column-bar-track">
                    <!-- Multi-series Stacked Segments -->
                    <template v-if="item.segments && item.segments.length > 0">
                      <div
                        v-for="seg in item.segments"
                        :key="seg.name"
                        class="column-segment-stacked"
                        @click.stop="handleChartSegmentClick(widget, item, seg)"
                        :title="`${item.name} • ${seg.name}: ${seg.count} (${seg.percent}%)\n(Bấm để xem danh sách chi tiết ${seg.name})`"
                        :style="{
                          height: `${(seg.count / (getWidgetChartData(widget).max || 1)) * 100}%`,
                          background: seg.color,
                        }"
                      >
                        <span v-if="seg.count >= 2" class="segment-label">{{ seg.count }}</span>
                      </div>
                    </template>
                    <!-- Fallback Single Segment -->
                    <div
                      v-else-if="item.count > 0"
                      class="column-segment-cb"
                      :style="{
                        height: `${(item.count / (getWidgetChartData(widget).max || 1)) * 100}%`,
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

            <!-- Series Legend for Stacked Bar -->
            <div
              v-if="getWidgetChartData(widget).seriesList && getWidgetChartData(widget).seriesList.length > 0"
              style="display: flex; flex-wrap: wrap; gap: 8px; align-items: center; justify-content: center; padding: 6px 8px 2px 8px; border-top: 1px dashed #e2e8f0; margin-top: 8px;"
            >
              <div
                v-for="s in getWidgetChartData(widget).seriesList"
                :key="s.name"
                style="display: flex; align-items: center; gap: 5px; font-size: 0.72rem; color: #475569; cursor: pointer; padding: 2px 6px; border-radius: 4px; background: #f8fafc; border: 1px solid #e2e8f0;"
                @click.stop="openDrilldownForWidget(widget, { field: getWidgetChartData(widget).subGroupField, operator: 'equals', value: s.name })"
                :title="`Bấm để lọc toàn bộ nhóm '${s.name}' (${s.total} lượt)`"
              >
                <span :style="{ background: s.color, width: '10px', height: '10px', borderRadius: '3px', display: 'inline-block' }"></span>
                <span style="font-weight: 600;">{{ s.name }}</span>
                <span style="color: #64748b; font-weight: 700;">({{ s.total }})</span>
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
                    {{ widget.title }} ({{ getWidgetChartData(widget).list.length }} phân loại)
                  </h4>
                </div>
              </div>
              <div style="display: flex; align-items: center; gap: 4px;" @click.stop>
                <button type="button" class="btn-card-setting" @click.stop="duplicateWidget(group, widget)" title="Nhân bản khối thống kê này">
                  <i class="pi pi-clone" style="color: #10b981;"></i>
                </button>
                <button type="button" class="btn-card-setting" @click.stop="openEditWidgetDialog(group, widget)" title="Sửa biểu đồ này">
                  <i class="pi pi-pencil"></i>
                </button>
                <button type="button" class="btn-card-setting" @click.stop="deleteWidget(group, widget)" title="Xóa biểu đồ này" style="color: #ef4444;">
                  <i class="pi pi-trash"></i>
                </button>
              </div>
            </div>

            <div style="max-height: 240px; overflow-y: auto; padding-right: 4px; flex: 1;">
              <div v-if="getWidgetChartData(widget).list.length === 0" style="text-align: center; color: #94a3b8; padding: 1.5rem 0; font-size: 0.78rem;">
                Không có dữ liệu phân loại phù hợp.
              </div>
              <div
                v-for="(item, cIdx) in getWidgetChartData(widget).list"
                :key="item.name"
                class="breakdown-row"
                @click="handleChartItemClick(widget, item)"
                :title="`${item.name}: ${item.count} kết quả\n(Bấm để xem danh sách chi tiết toàn bộ)`"
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
                      {{ item.count }} kết quả
                    </span>
                    <span style="font-size: 0.68rem; color: #94a3b8;">
                      ({{ getWidgetChartData(widget).total > 0 ? Math.round((item.count / getWidgetChartData(widget).total) * 100) : 0 }}%)
                    </span>
                  </div>
                </div>

                <!-- Sub-segments Breakdown Badges (if stacked) -->
                <div v-if="item.segments && item.segments.length > 1" style="display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 4px;">
                  <span
                    v-for="seg in item.segments"
                    :key="seg.name"
                    @click.stop="handleChartSegmentClick(widget, item, seg)"
                    :title="`Bấm để xem danh sách ${seg.name}`"
                    style="font-size: 0.67rem; padding: 1px 6px; border-radius: 4px; display: inline-flex; align-items: center; gap: 3px; cursor: pointer; color: #ffffff;"
                    :style="{ background: seg.color }"
                  >
                    <span>{{ seg.name }}:</span>
                    <strong style="color: #ffffff;">{{ seg.count }}</strong>
                  </span>
                </div>

                <div style="height: 8px; background: #f1f5f9; border-radius: 4px; overflow: hidden; display: flex;">
                  <!-- Multi-series Stacked Segments -->
                  <template v-if="item.segments && item.segments.length > 0">
                    <div
                      v-for="seg in item.segments"
                      :key="seg.name"
                      class="column-segment-stacked-h"
                      @click.stop="handleChartSegmentClick(widget, item, seg)"
                      :title="`${item.name} • ${seg.name}: ${seg.count} (${seg.percent}%)\n(Bấm để xem danh sách chi tiết ${seg.name})`"
                      :style="{
                        width: `${(seg.count / (getWidgetChartData(widget).max || 1)) * 100}%`,
                        background: seg.color,
                        height: '100%',
                        transition: 'width 0.4s ease',
                        cursor: 'pointer'
                      }"
                    ></div>
                  </template>
                  <div
                    v-else
                    style="height: 100%; border-radius: 4px; transition: width 0.4s ease;"
                    :style="{
                      width: `${(item.count / (getWidgetChartData(widget).max || 1)) * 100}%`,
                      background: widget.color || '#2e7d32'
                    }"
                  ></div>
                </div>
              </div>
            </div>

            <!-- Series Legend for Stacked Bar -->
            <div
              v-if="getWidgetChartData(widget).seriesList && getWidgetChartData(widget).seriesList.length > 0"
              style="display: flex; flex-wrap: wrap; gap: 8px; align-items: center; justify-content: center; padding: 6px 8px 2px 8px; border-top: 1px dashed #e2e8f0; margin-top: 8px;"
            >
              <div
                v-for="s in getWidgetChartData(widget).seriesList"
                :key="s.name"
                style="display: flex; align-items: center; gap: 5px; font-size: 0.72rem; color: #475569; cursor: pointer; padding: 2px 6px; border-radius: 4px; background: #f8fafc; border: 1px solid #e2e8f0;"
                @click.stop="openDrilldownForWidget(widget, { field: getWidgetChartData(widget).subGroupField, operator: 'equals', value: s.name })"
                :title="`Bấm để lọc toàn bộ nhóm '${s.name}' (${s.total} lượt)`"
              >
                <span :style="{ background: s.color, width: '10px', height: '10px', borderRadius: '3px', display: 'inline-block' }"></span>
                <span style="font-weight: 600;">{{ s.name }}</span>
                <span style="color: #64748b; font-weight: 700;">({{ s.total }})</span>
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
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
          <div class="field-item">
            <label class="field-label" style="font-weight: 700; color: #1e293b;">Màu tiêu đề & Icon</label>
            <select v-model="groupForm.color" class="settings-select" style="width: 100%; max-width: 100%;">
              <option value="#1e293b">Mặc định (Đen Slate - #1e293b)</option>
              <option value="#2e7d32">Xanh lá (Green - #2e7d32)</option>
              <option value="#0284c7">Xanh dương (Blue - #0284c7)</option>
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
            <select v-model="groupForm.bgColor" class="settings-select" style="width: 100%; max-width: 100%;">
              <option value="#ffffff">Trắng tiêu chuẩn (Mặc định)</option>
              <option value="#f0fdf4">Pastel Xanh Lá nhạt</option>
              <option value="#f0f9ff">Pastel Xanh Dương nhạt</option>
              <option value="#faf5ff">Pastel Tím nhạt</option>
              <option value="#fff7ed">Pastel Cam nhạt</option>
              <option value="#fef2f2">Pastel Đỏ nhạt</option>
              <option value="#f0fdfa">Pastel Teal nhạt</option>
              <option value="#fffbeb">Pastel Vàng nhạt</option>
              <option value="#fdf2f8">Pastel Hồng nhạt</option>
              <option value="#f8fafc">Pastel Xám nhạt</option>
            </select>
          </div>
        </div>
        <div class="field-item">
          <label class="field-label" style="font-weight: 700; color: #1e293b;">Độ rộng khối thống kê (Chiều ngang %)</label>
          <select v-model="groupForm.widthPercent" class="settings-select" style="width: 100%; max-width: 100%;">
            <option value="100">100% (Toàn hàng - Mặc định)</option>
            <option value="50">50% (1/2 hàng - 2 nhóm trên 1 hàng)</option>
            <option value="33.33">33.33% (1/3 hàng - 3 nhóm trên 1 hàng)</option>
            <option value="25">25% (1/4 hàng - 4 nhóm trên 1 hàng)</option>
            <option value="20">20% (1/5 hàng - 5 nhóm trên 1 hàng)</option>
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
    <!-- 8. CUSTOM WIDGET MODAL (QUERY CRITERIA BUILDER)          -->
    <!-- ========================================================= -->
    <Dialog
      v-model:visible="isWidgetDialogOpen"
      modal
      :header="editingWidget ? 'Chỉnh sửa Khối Thống kê' : 'Thêm Khối Thống kê Mới'"
      :style="{ width: '720px', maxWidth: '96vw' }"
    >
      <div style="display: flex; flex-direction: column; gap: 14px; padding-top: 6px;">
        <!-- 1. CHỌN NGUỒN DỮ LIỆU & DẠNG HIỂN THỊ -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div class="field-item">
            <label class="field-label" style="font-weight: 700; color: #1e293b;">1. Nguồn Dữ liệu Thống kê <span style="color: #ef4444;">*</span></label>
            <select v-model="widgetForm.source" class="settings-select" style="width: 100%; font-weight: 600;" @change="onWidgetSourceChange">
              <option v-for="t in allUnifiedTables" :key="t.id" :value="t.id">
                📋 {{ t.title }}
              </option>
            </select>
          </div>

          <div class="field-item">
            <label class="field-label" style="font-weight: 700; color: #1e293b;">2. Dạng Hiển thị trên Thống kê <span style="color: #ef4444;">*</span></label>
            <select v-model="widgetForm.displayType" class="settings-select" style="width: 100%; font-weight: 600;">
              <option value="count">🔢 Dạng Thẻ Số đếm (Metric Card)</option>
              <option value="vertical_bar">📊 Dạng Biểu đồ Cột dọc (Vertical Bar Chart)</option>
              <option value="horizontal_bar">📋 Dạng Danh sách Thanh ngang (Horizontal Bar Chart)</option>
            </select>
          </div>
        </div>

        <!-- 1b. CHỌN CHẾ ĐỘ XEM (VIEW) ÁP DỤNG THỨ TỰ CỘT -->
        <div class="field-item" style="background: #f0fdf4; padding: 10px 14px; border-radius: 8px; border: 1.5px solid #86efac; display: flex; flex-direction: column; gap: 6px;">
          <label class="field-label" style="font-weight: 700; color: #166534; display: flex; align-items: center; gap: 8px; font-size: 0.85rem; margin-bottom: 0;">
            <i class="pi pi-sliders-h" style="color: #16a34a; font-size: 1rem;"></i>
            Áp dụng thứ tự cột theo Chế độ xem (View): <span style="color: #ef4444;">*</span>
          </label>
          <select v-model="widgetForm.viewId" class="settings-select" style="width: 100%; font-weight: 700; color: #166534; background: #ffffff; border: 1px solid #86efac; padding: 6px 10px; font-size: 0.82rem;">
            <option v-for="v in availableViewsForWidgetSource" :key="v.id" :value="v.id">
              👁️ {{ v.label }}
            </option>
          </select>
          <span style="font-size: 0.74rem; color: #15803d; line-height: 1.35;">
            💡 <strong>Tự động áp dụng cột:</strong> Khi mở popup chi tiết của khối thống kê này, bảng sẽ tự động hiển thị danh sách và thứ tự cột theo Chế độ xem đã chọn.
          </span>
        </div>

        <!-- 1c. CỘT GOM NHÓM (KHI CHỌN BIỂU ĐỒ) -->
        <div v-if="widgetForm.displayType !== 'count'" class="field-item" style="background: #eff6ff; padding: 10px 12px; border-radius: 8px; border: 1px solid #bfdbfe; display: flex; flex-direction: column; gap: 10px;">
          <div>
            <label class="field-label" style="font-weight: 700; color: #1e40af;">
              <i class="pi pi-chart-bar" style="margin-right: 4px;"></i>
              Cột gom nhóm phân bổ chính (Trục ngang / Danh mục chính):
            </label>
            <select v-model="widgetForm.columnId" class="settings-select" style="width: 100%; font-weight: 600;">
              <option value="">-- Mặc định (theo Quốc gia / Đơn vị) --</option>
              <optgroup v-for="grp in allSearchableGroupsForWidget" :key="grp.name" :label="grp.name">
                <option v-for="c in grp.columns" :key="c.id" :value="c.id">
                  {{ c.label || c.id }}
                </option>
              </optgroup>
            </select>
            <span style="font-size: 0.72rem; color: #1e40af; margin-top: 3px; display: block;">
              💡 Biểu đồ sẽ tự động gom nhóm, đếm số lượt và xếp hạng theo từng giá trị của cột này.
            </span>
          </div>

          <!-- Cột phân loại phụ theo màu (Stacked Bar) -->
          <div style="padding-top: 8px; border-top: 1px dashed #bfdbfe;">
            <label class="field-label" style="font-weight: 700; color: #1e40af; font-size: 0.78rem;">
              <i class="pi pi-palette" style="margin-right: 4px;"></i>
              Cột phân loại phụ theo màu (Tùy chọn - Biểu đồ cột xếp chồng nhiều màu):
            </label>
            <select v-model="widgetForm.subColumnId" class="settings-select" style="width: 100%; font-weight: 600;">
              <option value="">-- Không phân loại màu (Đơn sắc) --</option>
              <optgroup v-for="grp in allSearchableGroupsForWidget" :key="grp.name" :label="grp.name">
                <option v-for="c in grp.columns" :key="c.id" :value="c.id">
                  {{ c.label || c.id }}
                </option>
              </optgroup>
            </select>
            <span style="font-size: 0.72rem; color: #1e40af; margin-top: 3px; display: block;">
              💡 Khi chọn thêm cột này (VD: Đối tượng 'isRelative' → Cán bộ / Thân nhân, hoặc Trạng thái, Phòng ban...), mỗi cột sẽ được chia thành nhiều đoạn màu xếp chồng (Stacked Bar) kèm chú giải màu. Bấm vào màu nào sẽ mở danh sách chi tiết của riêng loại đó.
            </span>
          </div>
        </div>

        <!-- 2. BỘ LỌC ĐIỀU KIỆN (QUERY CRITERIA BUILDER - GIỐNG HỆT LỌC NÂNG CAO) -->
        <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 10px; padding: 12px; display: flex; flex-direction: column; gap: 10px;">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="font-size: 0.84rem; font-weight: 700; color: #0f172a; display: flex; align-items: center; gap: 6px;">
                <i class="pi pi-filter" style="color: #2563eb;"></i>
                Điều kiện Lọc Dữ liệu (Bộ lọc nâng cao):
              </span>
            </div>

            <!-- Nối các điều kiện bằng VÀ / HOẶC -->
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="font-size: 0.75rem; color: #475569; font-weight: 600;">Nối bằng:</span>
              <div style="display: flex; border: 1px solid #cbd5e1; border-radius: 6px; overflow: hidden;">
                <button
                  type="button"
                  :style="widgetForm.logicOp === 'AND' ? 'background: #2563eb; color: #fff; font-weight: 700;' : 'background: #fff; color: #475569;'"
                  style="border: none; padding: 3px 10px; font-size: 0.72rem; cursor: pointer;"
                  @click="widgetForm.logicOp = 'AND'"
                >
                  VÀ (AND)
                </button>
                <button
                  type="button"
                  :style="widgetForm.logicOp === 'OR' ? 'background: #2563eb; color: #fff; font-weight: 700;' : 'background: #fff; color: #475569;'"
                  style="border: none; padding: 3px 10px; font-size: 0.72rem; cursor: pointer;"
                  @click="widgetForm.logicOp = 'OR'"
                >
                  HOẶC (OR)
                </button>
              </div>
            </div>
          </div>

          <!-- Danh sách các dòng điều kiện -->
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <div
              v-for="(crit, cIdx) in widgetForm.conditions"
              :key="crit.id || cIdx"
              style="display: grid; grid-template-columns: 2.2fr 1.6fr 2.2fr 34px; gap: 6px; align-items: center; background: #ffffff; padding: 6px 8px; border: 1px solid #e2e8f0; border-radius: 6px;"
            >
              <!-- Chọn Cột -->
              <div>
                <select v-model="crit.field" class="settings-select" style="width: 100%; font-size: 0.75rem; padding: 4px 6px;">
                  <option value="">-- Toàn bộ (Không lọc cột) --</option>
                  <optgroup v-for="grp in allSearchableGroupsForWidget" :key="grp.name" :label="grp.name">
                    <option v-for="c in grp.columns" :key="c.id" :value="c.id">
                      {{ c.label || c.id }}
                    </option>
                  </optgroup>
                </select>
              </div>

              <!-- Chọn Toán tử -->
              <div>
                <select v-model="crit.operator" class="settings-select" style="width: 100%; font-size: 0.75rem; padding: 4px 6px;">
                  <option value="equals">Là (khớp chính xác)</option>
                  <option value="not_equals">Khác</option>
                  <option value="contains">Chứa từ khóa</option>
                  <option value="not_contains">Không chứa</option>
                  <option value="has_value">Có dữ liệu (khác rỗng)</option>
                  <option value="empty">Để trống (chưa có)</option>
                  <option value="gte">Lớn hơn hoặc bằng (&ge;)</option>
                  <option value="lte">Nhỏ hơn hoặc bằng (&le;)</option>
                  <option value="gt">Lớn hơn (&gt;)</option>
                  <option value="lt">Nhỏ hơn (&lt;)</option>
                  <option value="before_date">Trước ngày</option>
                  <option value="after_date">Sau ngày</option>
                  <option value="count_gte">Số lần/lượt đi &ge;</option>
                  <option value="count_lte">Số lần/lượt đi &le;</option>
                </select>
              </div>

              <!-- Giá trị so sánh -->
              <div>
                <template v-if="crit.operator === 'empty' || crit.operator === 'has_value'">
                  <span style="font-size: 0.72rem; color: #94a3b8; font-style: italic;">(Không cần nhập giá trị)</span>
                </template>
                <template v-else-if="crit.operator === 'before_date' || crit.operator === 'after_date'">
                  <input
                    v-model="crit.value"
                    type="text"
                    placeholder="DD/MM/YYYY"
                    class="settings-select"
                    style="width: 100%; font-size: 0.75rem; padding: 4px 8px;"
                  />
                </template>
                <template v-else-if="crit.operator === 'gte' || crit.operator === 'lte' || crit.operator?.startsWith('count_') || crit.operator === 'gt' || crit.operator === 'lt'">
                  <input
                    v-model="crit.value"
                    type="number"
                    placeholder="Nhập số..."
                    class="settings-select"
                    style="width: 100%; font-size: 0.75rem; padding: 4px 8px;"
                  />
                </template>
                <template v-else>
                  <div style="display: flex; flex-direction: column; gap: 4px; width: 100%;">
                    <div style="display: flex; align-items: center; gap: 4px; width: 100%;">
                      <input
                        v-model="crit.value"
                        :list="'opts_crit_' + (crit.id || cIdx)"
                        type="text"
                        :placeholder="crit.operator === 'contains' || crit.operator === 'not_contains' ? 'Nhập từ khóa (hoặc chọn gợi ý, nhiều từ cách nhau dấu phẩy)...' : (getFieldOptionsForWidget(crit.field).length > 0 ? 'Nhập hoặc chọn gợi ý...' : 'Nhập giá trị so sánh...')"
                        class="settings-select"
                        style="flex: 1; font-size: 0.75rem; padding: 4px 8px;"
                      />
                      <datalist :id="'opts_crit_' + (crit.id || cIdx)">
                        <option v-for="opt in getFieldOptionsForWidget(crit.field)" :key="opt" :value="opt" />
                      </datalist>
                      <select
                        v-if="getFieldOptionsForWidget(crit.field).length > 0"
                        @change="(e) => { if (e.target.value) { crit.value = crit.value ? `${crit.value}, ${e.target.value}` : e.target.value; e.target.value = ''; } }"
                        class="settings-select"
                        style="width: 28px; height: 26px; padding: 0 4px; font-size: 0.75rem; text-align: center; cursor: pointer; color: #0284c7; flex-shrink: 0;"
                        title="Chọn thêm từ danh sách gợi ý để điền vào ô nhập"
                      >
                        <option value="" disabled selected>▾</option>
                        <option v-for="opt in getFieldOptionsForWidget(crit.field)" :key="opt" :value="opt">
                          + {{ opt }}
                        </option>
                      </select>
                    </div>
                    <!-- Các nút gợi ý nhanh nếu có options -->
                    <div
                      v-if="getFieldOptionsForWidget(crit.field).length > 0 && getFieldOptionsForWidget(crit.field).length <= 8"
                      style="display: flex; flex-wrap: wrap; gap: 4px; align-items: center;"
                    >
                      <span style="font-size: 0.66rem; color: #64748b; font-weight: 500;">Gợi ý:</span>
                      <button
                        v-for="opt in getFieldOptionsForWidget(crit.field)"
                        :key="opt"
                        type="button"
                        @click="crit.value = opt"
                        style="font-size: 0.68rem; padding: 1px 6px; border-radius: 4px; border: 1px solid #bae6fd; background: #f0f9ff; color: #0284c7; cursor: pointer; transition: all 0.15s;"
                        :style="crit.value === opt ? 'background: #0284c7; color: #fff; font-weight: 600; border-color: #0284c7;' : ''"
                        :title="`Bấm để chọn nhanh '${opt}'`"
                      >
                        {{ opt }}
                      </button>
                    </div>
                  </div>
                </template>
              </div>

              <!-- Nút Xóa Row -->
              <button
                type="button"
                @click="removeWidgetCondition(cIdx)"
                style="background: transparent; border: none; color: #ef4444; cursor: pointer; font-size: 0.85rem; display: flex; align-items: center; justify-content: center; height: 32px;"
                title="Xóa điều kiện này"
              >
                <i class="pi pi-trash"></i>
              </button>
            </div>
          </div>

          <!-- Nút thêm dòng điều kiện & Checkbox Unique -->
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px;">
            <button
              type="button"
              @click="addWidgetCondition"
              style="display: inline-flex; align-items: center; gap: 4px; background: #fff; border: 1px dashed #3b82f6; color: #2563eb; font-size: 0.75rem; font-weight: 600; padding: 4px 10px; border-radius: 6px; cursor: pointer;"
            >
              <i class="pi pi-plus" style="font-size: 0.7rem;"></i> Thêm điều kiện lọc
            </button>

            <!-- Checkbox Đếm duy nhất -->
            <label style="display: inline-flex; align-items: center; gap: 6px; font-size: 0.75rem; color: #334155; cursor: pointer; font-weight: 600;">
              <input type="checkbox" v-model="widgetForm.isUnique" style="accent-color: #2563eb; cursor: pointer;" />
              <span>Đếm số cá nhân duy nhất (Unique theo CCCD)</span>
            </label>
          </div>
        </div>

        <!-- 3. TIÊU ĐỀ KHỐI -->
        <div class="field-item">
          <label class="field-label" style="font-weight: 700; color: #1e293b;">3. Tiêu đề hiển thị của Khối Thống kê <span style="color: #ef4444;">*</span></label>
          <InputText v-model="widgetForm.title" placeholder="VD: Cán bộ xuất cảnh từ 2 lần trở lên / Cán bộ đang ở nước ngoài" style="width: 100%; font-size: 0.85rem;" />
        </div>

        <!-- 4. ĐỘ RỘNG, MÀU VIỀN & MÀU NỀN & THỨ TỰ -->
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px;">
          <div class="field-item">
            <label class="field-label" style="font-weight: 700; color: #1e293b;">Độ rộng</label>
            <select v-model="widgetForm.widthPercent" class="settings-select" style="width: 100%;">
              <option :value="0">Ẩn (0%)</option>
              <option :value="16.66">16.6% (6 thẻ/hàng)</option>
              <option :value="20">20% (5 thẻ/hàng)</option>
              <option :value="25">25% (4 thẻ/hàng)</option>
              <option :value="33">33% (3 thẻ/hàng)</option>
              <option :value="50">50% (2 thẻ/hàng)</option>
              <option :value="100">100% (Toàn hàng)</option>
            </select>
          </div>
          <div class="field-item">
            <label class="field-label" style="font-weight: 700; color: #1e293b;">Màu viền</label>
            <select v-model="widgetForm.color" class="settings-select" style="width: 100%;">
              <option value="#0284c7">Xanh dương (Blue)</option>
              <option value="#2e7d32">Xanh lá (Green)</option>
              <option value="#7c3aed">Tím (Purple)</option>
              <option value="#ea580c">Cam (Orange)</option>
              <option value="#dc2626">Đỏ (Red)</option>
              <option value="#0d9488">Xanh Teal</option>
              <option value="#e11d48">Hồng Đỏ</option>
              <option value="#d97706">Vàng Hổ Phách</option>
              <option value="#475569">Xám Slate</option>
            </select>
          </div>
          <div class="field-item">
            <label class="field-label" style="font-weight: 700; color: #1e293b;">Màu nền Pastel</label>
            <select v-model="widgetForm.bgColor" class="settings-select" style="width: 100%;">
              <option value="#ffffff">Trắng tiêu chuẩn</option>
              <option value="#f0f9ff">Pastel Xanh Dương</option>
              <option value="#f0fdf4">Pastel Xanh Lá</option>
              <option value="#faf5ff">Pastel Tím</option>
              <option value="#fff7ed">Pastel Cam</option>
              <option value="#fef2f2">Pastel Đỏ</option>
              <option value="#f0fdfa">Pastel Teal</option>
              <option value="#fffbeb">Pastel Vàng</option>
              <option value="#fdf2f8">Pastel Hồng</option>
              <option value="#f8fafc">Pastel Xám</option>
            </select>
          </div>
          <div class="field-item">
            <label class="field-label" style="font-weight: 700; color: #1e293b;">Vị trí thứ tự</label>
            <select v-model="widgetOrder" class="settings-select" style="width: 100%;">
              <option
                v-for="n in (editingWidget ? (activeGroupForWidget?.widgets?.length || 1) : ((activeGroupForWidget?.widgets?.length || 0) + 1))"
                :key="n"
                :value="n"
              >
                {{ n === 1 ? 'Vị trí 1 (Đầu)' : (n === (editingWidget ? activeGroupForWidget?.widgets?.length : (activeGroupForWidget?.widgets?.length + 1)) ? `Vị trí ${n} (Cuối)` : `Vị trí ${n}`) }}
              </option>
            </select>
          </div>
        </div>

        <!-- Preview Live Số lượng kết quả khớp -->
        <div style="font-size: 0.78rem; color: #15803d; background: #f0fdf4; border: 1px solid #bbf7d0; padding: 8px 12px; border-radius: 8px; display: flex; align-items: center; justify-content: space-between;">
          <span style="display: flex; align-items: center; gap: 6px; font-weight: 600;">
            <i class="pi pi-check-circle" style="color: #16a34a;"></i>
            Số liệu tính toán trực tiếp theo điều kiện hiện tại:
          </span>
          <span style="font-size: 1.1rem; font-weight: 800; color: #166534;">
            {{ previewLiveCount }} kết quả
          </span>
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
                <div style="display: flex; align-items: center; gap: 6px;">
                  <span style="font-size: 0.84rem; font-weight: 600; color: #1e293b; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">
                    {{ w.title }}
                  </span>
                  <span v-if="isWidgetHidden(w)" style="font-size: 0.68rem; background: #fee2e2; color: #dc2626; padding: 1px 6px; border-radius: 4px; font-weight: 700;">
                    Ẩn (0%)
                  </span>
                  <span v-else-if="w.widthPercent" style="font-size: 0.68rem; background: #e0f2fe; color: #0369a1; padding: 1px 6px; border-radius: 4px; font-weight: 600;">
                    {{ w.widthPercent }}%
                  </span>
                </div>
                <span style="font-size: 0.7rem; color: #64748b;">
                  {{ w.displayType === 'count' ? 'Thẻ đếm số lượng' : (w.displayType === 'vertical_bar' ? 'Biểu đồ cột dọc' : 'Biểu đồ thanh ngang') }}
                </span>
              </div>
            </div>

            <!-- Điều khiển vị trí & Thao tác -->
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

              <!-- Sửa & Xóa trực tiếp trong danh sách -->
              <button
                type="button"
                class="btn-card-setting"
                @click="isReorderWidgetsDialogOpen = false; openEditWidgetDialog(reorderingGroup, w)"
                title="Cài đặt khối này (độ rộng, màu sắc, tiêu đề)"
                style="padding: 4px 6px; height: 28px; margin-left: 4px;"
              >
                <i class="pi pi-pencil" style="font-size: 0.8rem; color: #0284c7;"></i>
              </button>
              <button
                type="button"
                class="btn-card-setting"
                @click="deleteWidget(reorderingGroup, w)"
                title="Xóa khối này"
                style="padding: 4px 6px; height: 28px; color: #ef4444;"
              >
                <i class="pi pi-trash" style="font-size: 0.8rem;"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <Button label="Xong" severity="primary" size="small" @click="isReorderWidgetsDialogOpen = false" />
      </template>
    </Dialog>

    <!-- POPUP XEM CHI TIẾT DỮ LIỆU THỐNG KÊ (DRILLDOWN FULL COLUMNS MODAL) -->
    <Dialog
      v-model:visible="isDrilldownModalOpen"
      modal
      :baseZIndex="10000"
      :style="{ width: '95vw', maxWidth: '1520px' }"
      :contentStyle="{ maxHeight: '82vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: '0 16px 16px 16px' }"
    >
      <template #header>
        <div style="display: flex; align-items: center; justify-content: space-between; width: 100%; padding-right: 12px; gap: 12px; flex-wrap: wrap;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 36px; height: 36px; border-radius: 8px; background: #e0f2fe; color: #0284c7; display: flex; align-items: center; justify-content: center;">
              <i class="pi pi-table" style="font-size: 1.15rem;"></i>
            </div>
            <div>
              <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                <h3 style="font-size: 0.98rem; font-weight: 700; color: #0f172a; margin: 0;">
                  {{ drilldownExtraTitle || drilldownWidget?.title || 'Dữ liệu Thống kê Chi tiết' }}
                </h3>
                <span style="font-size: 0.72rem; font-weight: 600; padding: 2px 8px; border-radius: 10px; background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0;">
                  {{ filteredDrilldownList.length }} kết quả
                </span>
                <span v-if="drilldownSelectedRows.length > 0" style="font-size: 0.72rem; font-weight: 700; padding: 2px 8px; border-radius: 10px; background: #dbeafe; color: #1d4ed8;">
                  Đã chọn: {{ drilldownSelectedRows.length }}
                </span>
              </div>
              <span style="font-size: 0.74rem; color: #64748b;">
                Nguồn dữ liệu: <strong>{{ getSourceLabel(drilldownSourceType) }}</strong>
              </span>
            </div>
          </div>

          <!-- Actions Toolbar inside Drilldown Header -->
          <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
            <!-- Dropdown chọn Chế độ xem (View) để áp dụng thứ tự cột -->
            <div style="display: flex; align-items: center; gap: 6px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 0 8px; height: 32px;">
              <i class="pi pi-sliders-h" style="font-size: 0.75rem; color: #2563eb;"></i>
              <span style="font-size: 0.74rem; font-weight: 600; color: #475569; white-space: nowrap;">Chế độ xem:</span>
              <select
                v-model="drilldownSelectedViewId"
                @change="onDrilldownViewChange"
                style="height: 26px; font-size: 0.75rem; font-weight: 600; border: none; background: transparent; outline: none; color: #1e293b; cursor: pointer; max-width: 170px;"
                title="Chọn Chế độ xem để áp dụng thứ tự và danh sách cột"
              >
                <option v-for="v in drilldownAvailableViews" :key="v.id" :value="v.id">
                  {{ v.label }}
                </option>
              </select>
            </div>

            <!-- Tìm kiếm nhanh -->
            <div style="position: relative; width: 220px;">
              <i class="pi pi-search" style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); font-size: 0.8rem; color: #94a3b8;"></i>
              <input
                v-model="drilldownSearchText"
                type="text"
                placeholder="Tìm trong danh sách..."
                style="width: 100%; height: 32px; padding: 4px 28px 4px 30px; font-size: 0.78rem; border: 1px solid #cbd5e1; border-radius: 6px; outline: none; background: #f8fafc;"
              />
              <i
                v-if="drilldownSearchText"
                class="pi pi-times"
                style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%); font-size: 0.75rem; color: #94a3b8; cursor: pointer;"
                @click="drilldownSearchText = ''"
              />
            </div>

            <!-- Menu Xuất / Nhập Dropdown chuẩn dùng chung ExportImportMenu -->
            <ExportImportMenu
              :tableTitle="drilldownExtraTitle || drilldownWidget?.title || 'Thống kê'"
              :selectedCount="drilldownSelectedRows.length"
              :showImport="false"
              @export-pdf="openDrilldownDocxExport"
              @export-excel="exportDrilldownExcel"
            />
          </div>
        </div>
      </template>

      <!-- Table Container with Horizontal and Vertical Scroll -->
      <div style="flex: 1; min-height: 0; display: flex; flex-direction: column; overflow: hidden; border: 1px solid #e2e8f0; border-radius: 8px;">
        <DataTable
          v-model:selection="drilldownSelectedRows"
          :value="filteredDrilldownList"
          dataKey="uniqueKey"
          paginator
          :rows="25"
          :rowsPerPageOptions="[15, 25, 50, 100]"
          :selectionPageOnly="true"
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown CurrentPageReport"
          currentPageReportTemplate="Hiển thị {first} đến {last} của {totalRecords} kết quả"
          responsiveLayout="scroll"
          stripedRows
          removableSort
          class="p-datatable-sm custom-datatable drilldown-clickable-table"
          :tableStyle="{ minWidth: 'max-content', width: '100%' }"
          @page="e => drilldownDtFirst = e.first"
          @row-click="e => handleDrilldownRowClick(e.data)"
          :rowHover="true"
          scrollable
          scrollHeight="flex"
        >
          <Column selectionMode="multiple" headerClass="col-center" bodyClass="col-center" :headerStyle="{ width: '46px', minWidth: '46px' }" :bodyStyle="{ width: '46px', minWidth: '46px' }" />

          <Column field="stt" header="STT" headerClass="col-center" bodyClass="col-center" :headerStyle="{ width: '55px', minWidth: '55px' }" :bodyStyle="{ width: '55px', minWidth: '55px' }">
            <template #body="{ index }">
              <span style="font-weight: 600; color: #4b5563; font-size: 1.12rem;">{{ drilldownDtFirst + index + 1 }}</span>
            </template>
          </Column>

          <!-- Dynamic Columns -->
          <Column
            v-for="col in drilldownColumns"
            :key="col.id"
            :field="col.id"
            :header="col.label"
            :headerStyle="{ width: (col.tableWidth ? col.tableWidth + 'px' : col.width) || '160px', minWidth: (col.tableWidth ? col.tableWidth + 'px' : col.width) || '160px' }"
            :bodyStyle="{ width: (col.tableWidth ? col.tableWidth + 'px' : col.width) || '160px', minWidth: (col.tableWidth ? col.tableWidth + 'px' : col.width) || '160px' }"
          >
            <template #body="{ data }">
              <!-- Trạng thái hiện diện -->
              <template v-if="col.id === 'presenceStatus' || col.id === '_presenceStatus' || col.id === 'trang_thai_hien_dien' || col.id === 'status' || col.format === 'presence'">
                <span
                  class="presence-badge"
                  :style="{
                    backgroundColor: getPresenceBadge(data).bgColor,
                    color: getPresenceBadge(data).color,
                    borderColor: getPresenceBadge(data).borderColor,
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    padding: '4px 10px',
                    borderRadius: '12px',
                    fontSize: '0.92rem',
                    fontWeight: '600',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    whiteSpace: 'nowrap',
                  }"
                >
                  <i :class="['pi', getPresenceBadge(data).icon]" style="font-size: 0.85rem;"></i>
                  {{ getPresenceBadge(data).text }}
                </span>
              </template>

              <!-- Họ tên Cán bộ / Bản ghi chính (dòng đậm) -->
              <template v-else-if="col.id === '_parentPersonnelName' || col.id === 'name' || col.id === 'ho_va_ten'">
                <strong style="color: #0284c7; font-weight: 700; font-size: 1.18rem;">
                  {{ getRowFieldValue(data, col.id, col) || '-' }}
                </strong>
              </template>

              <!-- Cột thông thường -->
              <template v-else>
                <span style="font-size: 1.15rem; color: #334155; line-height: 1.45; word-break: break-word;">
                  {{ getRowFieldValue(data, col.id, col) || '-' }}
                </span>
              </template>
            </template>
          </Column>

          <!-- Thao tác xem chi tiết & PDF của từng hàng -->
          <Column
            header="Thao tác"
            headerClass="col-center"
            bodyClass="col-center col-frozen-action"
            :headerStyle="{ width: '150px', minWidth: '150px', background: '#f8fafc !important', zIndex: 12 }"
            :bodyStyle="{ width: '150px', minWidth: '150px', background: '#ffffff !important', zIndex: 11, boxShadow: '-4px 0 8px rgba(0, 0, 0, 0.08)' }"
            frozen
            alignFrozen="right"
          >
            <template #body="{ data }">
              <div style="display: flex; align-items: center; justify-content: center; gap: 6px;">
                <Button
                  icon="pi pi-eye"
                  label="Chi tiết"
                  severity="info"
                  size="small"
                  outlined
                  @click.stop="handleDrilldownRowClick(data)"
                  style="font-size: 0.72rem; padding: 3px 7px;"
                  title="Xem chi tiết bản ghi này"
                />
                <Button
                  icon="pi pi-file-pdf"
                  label="PDF"
                  severity="danger"
                  size="small"
                  outlined
                  :loading="rowPreviewingKey === (data.uniqueKey || data.id)"
                  @click.stop="previewPdfForRow(data)"
                  style="font-size: 0.72rem; padding: 3px 7px;"
                  title="Xem trực tiếp PDF của hồ sơ này"
                />
              </div>
            </template>
          </Column>
        </DataTable>
      </div>

      <template #footer>
        <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; padding-top: 6px;">
          <span style="font-size: 0.75rem; color: #64748b;">
            Tổng cộng: <strong>{{ filteredDrilldownList.length }}</strong> kết quả (Bấm vào dòng để xem chi tiết)
          </span>
          <div style="display: flex; align-items: center; gap: 8px;">
            <Button label="Đóng" severity="secondary" size="small" @click="isDrilldownModalOpen = false" />
          </div>
        </div>
      </template>
    </Dialog>

    <!-- POPUP XEM CHI TIẾT BẢN GHI ĐA HÌNH (UNIFIED RECORD DETAIL MODAL) -->
    <Dialog
      v-model:visible="isDrilldownRecordDetailOpen"
      modal
      :style="{ width: '85vw', maxWidth: '1000px' }"
      :contentStyle="{ maxHeight: '78vh', overflowY: 'auto', padding: '16px' }"
    >
      <template #header>
        <div style="display: flex; align-items: center; justify-content: space-between; width: 100%; padding-right: 12px; gap: 12px; flex-wrap: wrap;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 38px; height: 38px; border-radius: 8px; background: #e0f2fe; color: #0284c7; display: flex; align-items: center; justify-content: center;">
              <i class="pi pi-id-card" style="font-size: 1.2rem;"></i>
            </div>
            <div>
              <h3 style="font-size: 1rem; font-weight: 700; color: #0f172a; margin: 0;">
                Chi tiết Bản ghi: {{ getRecordTitle(selectedDrilldownRow) }}
              </h3>
              <span style="font-size: 0.74rem; color: #64748b;">
                Bảng dữ liệu: <strong>{{ getSourceLabel(drilldownSourceType) }}</strong>
              </span>
            </div>
          </div>

          <!-- Nút Nhập liệu mới trong Popup Chi tiết -->
          <Button
            icon="pi pi-plus"
            label="Nhập liệu"
            severity="success"
            size="small"
            @click="isDynamicDataEntryOpen = true"
            title="Nhập liệu mới (Đồng bộ danh sách bảng như mục Nhập liệu ở menu)"
            style="font-size: 0.78rem; height: 32px; font-weight: 600; display: inline-flex; align-items: center; gap: 6px;"
          />
        </div>
      </template>

      <div v-if="selectedDrilldownRow" style="display: flex; flex-direction: column; gap: 14px;">
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px 16px;">
          <div class="form-grid">
            <div
              v-for="col in (drilldownColumns || []).filter(c => c.showInDetail !== false)"
              :key="col.id"
              class="field-item"
              :style="[
                getColItemStyle(col.width),
                {
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  padding: '8px 10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '3px',
                  boxSizing: 'border-box'
                }
              ]"
            >
              <span style="font-size: 0.7rem; color: #64748b; font-weight: 600;">
                {{ col.label }}
              </span>
              <div>
                <template v-if="col.id === 'presenceStatus' || col.id === '_presenceStatus' || col.format === 'presence'">
                  <span
                    class="presence-badge"
                    :style="{
                      backgroundColor: getPresenceBadge(selectedDrilldownRow).bgColor,
                      color: getPresenceBadge(selectedDrilldownRow).color,
                      borderColor: getPresenceBadge(selectedDrilldownRow).borderColor,
                      borderWidth: '1px',
                      borderStyle: 'solid',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '0.72rem',
                      fontWeight: '600',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }"
                  >
                    <i :class="['pi', getPresenceBadge(selectedDrilldownRow).icon]" style="font-size: 0.7rem;"></i>
                    {{ getPresenceBadge(selectedDrilldownRow).text }}
                  </span>
                </template>
                <template v-else>
                  <span style="font-size: 0.82rem; font-weight: 600; color: #0f172a; word-break: break-word;">
                    {{ getRowFieldValue(selectedDrilldownRow, col.id, col) || '-' }}
                  </span>
                </template>
              </div>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <Button
              v-if="selectedDrilldownRow"
              label="Chỉnh sửa hồ sơ"
              icon="pi pi-user-edit"
              severity="primary"
              size="small"
              @click="openPersonnelDetailFromRecord"
            />
            <Button
              icon="pi pi-plus"
              label="Nhập liệu"
              severity="success"
              size="small"
              @click="isDynamicDataEntryOpen = true"
              style="font-size: 0.78rem;"
            />
          </div>
          <Button label="Đóng" severity="secondary" size="small" @click="isDrilldownRecordDetailOpen = false" />
        </div>
      </template>
    </Dialog>

    <!-- Record Edit Dialog -->
    <PersonnelDialog
      v-model="isPersonDialogOpen"
      :personData="selectedPersonForDialog"
      :columns="selectedColumnsForDialog"
      @saved="onPersonSaved"
      @deleted="onPersonSaved"
    />

    <!-- Advanced DOCX Export Dialog for Dashboard -->
    <AdvancedDocxExportDialog
      v-model="isDocxExportOpen"
      :selectedPersonnel="drilldownSelectedPersonnel"
      :allPersonnel="drilldownAllPersonnel"
    />

    <!-- Popup Xem trước PDF trực tiếp của từng hàng -->
    <PdfPreviewDialog
      v-model="showRowPdfPreview"
      :pdf-blob="rowPreviewPdfBlob"
      :title="rowPreviewTitle"
      :filename="rowPreviewFileName"
    />

    <!-- Dialog Nhập liệu mới đa bảng đồng bộ với Sidebar menu -->
    <TableDataEntryDialog
      v-model="isDynamicDataEntryOpen"
      :activeSource="drilldownSourceType"
      @select-table="isDrilldownModalOpen = false; isDrilldownRecordDetailOpen = false;"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Dialog from 'primevue/dialog';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import AppDatePicker from '@/components/common/AppDatePicker.vue';
import PersonnelDialog from '@/components/personnel/PersonnelDialog.vue';
import AdvancedDocxExportDialog from '@/components/common/AdvancedDocxExportDialog.vue';
import ExportImportMenu from '@/components/common/ExportImportMenu.vue';
import TableDataEntryDialog from '@/components/common/TableDataEntryDialog.vue';
import { usePersonnelStore } from '@/stores/personnel';
import { useAuthStore } from '@/stores/auth';
import PdfPreviewDialog from '@/components/common/PdfPreviewDialog.vue';
import { getEffectiveExportTemplateBuffer, generateSinglePersonnelPdfBlob } from '@/utils/docxExport';
import { exportToExcel, exportFullPersonnelExcel, exportFullRelativesExcel, getSubOptionsList } from '@/utils/excel';
import { computeColumnIndexMap, formatDate, parseDateValue, computePresenceStatus, computeOverdueStatus, computeTripPresence, evaluateFormula, evaluateLookup, evaluateRollup, computeDepartBeforeDecision, formatGenericCellValue, resolvePresence, isPresenceField, resolveVirtualColumnValue, getPresenceBadge, getColItemStyle } from '@/utils/formatters';
import { buildTopicSourceList, computeMetricCardCount, isSameCard, matchCardCondition as matchSharedCardCondition, isCardAllType as isSharedCardAllType, checkConditionMatch, normalizeFieldValueToText } from '@/utils/dashboardMetrics';
import { getAppSettings, saveAppSettings } from '@/api/settings';
import {
  getUnifiedTableDefinitions,
  getUnifiedTableRows,
  getUnifiedTableColumns,
  getUnifiedTableLabel,
  findUnifiedTable,
  ensureStandardDashboards,
} from '@/utils/tableRegistry';

const route = useRoute();
const router = useRouter();
const personnelStore = usePersonnelStore();
const authStore = useAuthStore();

// =========================================================================
// QUẢN LÝ NHẬN DIỆN HỆ THỐNG & BRANDING
// =========================================================================
const systemBranding = ref({
  menuLabelDashboard: 'Thống kê',
});

const loadSystemBranding = async () => {
  try {
    const local = localStorage.getItem('system_branding_config');
    if (local) {
      const parsed = JSON.parse(local);
      if (parsed) systemBranding.value = { ...systemBranding.value, ...parsed };
    }
    const saved = await getAppSettings('system_branding_config', null);
    if (saved && typeof saved === 'object') {
      systemBranding.value = { ...systemBranding.value, ...saved };
    }
  } catch (e) {}
};

const onSystemBrandingUpdated = (e) => {
  if (e && e.detail) {
    systemBranding.value = { ...systemBranding.value, ...e.detail };
  } else {
    loadSystemBranding();
  }
};

// =========================================================================
// QUẢN LÝ CÁC TRANG DASHBOARD & ROUTE PARAM (:id)
// =========================================================================
const customDashboardPages = ref([]);

const loadCustomDashboardPages = async () => {
  try {
    const local = localStorage.getItem('custom_dashboard_pages');
    if (local) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed)) customDashboardPages.value = parsed;
    }
    const db = await getAppSettings('custom_dashboard_pages', null);
    if (db && Array.isArray(db)) {
      customDashboardPages.value = db;
      try { localStorage.setItem('custom_dashboard_pages', JSON.stringify(db)); } catch (e) {}
    }
  } catch (e) {}
};

const dashboardId = computed(() => route.params.id || 'root');
const groupsStorageKey = computed(() => dashboardId.value === 'root' ? 'dashboard_custom_groups' : `dashboard_custom_groups_${dashboardId.value}`);

const currentCustomDashboardPage = computed(() => {
  if (dashboardId.value === 'root') return null;
  return (customDashboardPages.value || []).find((p) => p.id === dashboardId.value);
});

const currentDashboardTitle = computed(() => {
  if (dashboardId.value === 'root') {
    return systemBranding.value.menuLabelDashboard || 'Thống kê';
  }
  return currentCustomDashboardPage.value?.title || 'Trang Thống kê';
});

const currentDashboardDescription = computed(() => {
  if (dashboardId.value === 'root') {
    return 'Tổng quan tình hình cán bộ, xuất nhập cảnh, thân nhân & các chỉ số chuyên đề';
  }
  return currentCustomDashboardPage.value?.description || 'Báo cáo thống kê trực quan và phân tích dữ liệu';
});

// =========================================================================
// REGISTRY TOÀN BỘ CÁC BẢNG TRONG HỆ THỐNG (UNIFIED TABLE REGISTRY)
// =========================================================================
const allUnifiedTables = computed(() => {
  return getUnifiedTableDefinitions({
    personnelStore,
    customDashboards: availableTopicDashboards.value,
    systemBranding: systemBranding.value,
  });
});

// =========================================================================
// POPUP DIALOG CHI TIẾT DỮ LIỆU THỐNG KÊ (DRILLDOWN POPUP MODAL)
// =========================================================================
const isDrilldownModalOpen = ref(false);
const isDynamicDataEntryOpen = ref(false);
const drilldownWidget = ref(null);
const drilldownExtraTitle = ref('');
const drilldownSourceType = ref('trips');
const drilldownRawList = ref([]);
const drilldownSearchText = ref('');
const drilldownDtFirst = ref(0);
const drilldownSelectedRows = ref([]);
const isDocxExportOpen = ref(false);
const drilldownSavedColIds = ref(null);
const drilldownSelectedViewId = ref('all');

const drilldownAvailableViews = computed(() => {
  const tid = drilldownWidget.value?.topicId || drilldownSourceType.value || 'trips';
  const allDashboards = ensureStandardDashboards(availableTopicDashboards.value);
  const topic = allDashboards.find((t) => t.id === tid);
  const views = [];
  if (topic && Array.isArray(topic.metricCards) && topic.metricCards.length > 0) {
    topic.metricCards.forEach((c, idx) => {
      const cId = c.id || (idx === 0 ? 'all' : `card_${idx}`);
      views.push({
        id: cId,
        label: c.label || c.title || (idx === 0 ? 'Toàn bộ (Mặc định)' : `Chế độ xem ${idx}`),
      });
    });
  }
  if (views.length === 0) {
    views.push({ id: 'all', label: 'Toàn bộ (Mặc định)' });
  }
  return views;
});

const getSetupColumnIdsForTable = (tableId, cardId = null) => {
  const sanitizeRelCols = (cols) => {
    if (tableId === 'relatives' && Array.isArray(cols)) {
      return cols.map((id) => (id === 'countryName' ? 'countryNameTN' : id));
    }
    return cols;
  };

  const allDashboards = ensureStandardDashboards(availableTopicDashboards.value);

  // 1. Nếu có cardId cụ thể, kiểm tra cấu hình riêng của card đó
  if (cardId) {
    try {
      const cardLocal = localStorage.getItem(`child_dashboard_cols_${tableId}_${cardId}`);
      if (cardLocal) {
        const parsed = JSON.parse(cardLocal);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return sanitizeRelCols(parsed.filter((id) => id !== 'status' && id !== 'tripStatus' && id !== '_primaryKey'));
        }
      }
    } catch (e) {}

    const topic = allDashboards.find((t) => t.id === tableId);
    if (topic && Array.isArray(topic.metricCards)) {
      const card = topic.metricCards.find((c) => c.id === cardId);
      if (card?.columns && Array.isArray(card.columns) && card.columns.length > 0) {
        return sanitizeRelCols(card.columns.filter((id) => id !== 'status' && id !== 'tripStatus' && id !== '_primaryKey'));
      }
    }
  }

  // 2. Kiểm tra child_dashboard_cols_${tableId}
  try {
    const tableLocal = localStorage.getItem(`child_dashboard_cols_${tableId}`);
    if (tableLocal) {
      const parsed = JSON.parse(tableLocal);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return sanitizeRelCols(parsed.filter((id) => id !== 'status' && id !== 'tripStatus' && id !== '_primaryKey'));
      }
    }
  } catch (e) {}

  // 3. Fallback theo bảng chuẩn
  let fallbackKey = null;
  if (tableId === 'trips') fallbackKey = 'trips_dashboard_columns';
  else if (tableId === 'personnel') fallbackKey = 'personnel_active_columns';
  else if (tableId === 'relatives') fallbackKey = 'relative_active_columns';

  if (fallbackKey) {
    try {
      const fbLocal = localStorage.getItem(fallbackKey);
      if (fbLocal) {
        const parsed = JSON.parse(fbLocal);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return sanitizeRelCols(parsed.filter((id) => id !== 'status' && id !== 'tripStatus' && id !== '_primaryKey'));
        }
      }
    } catch (e) {}
  }

  // 4. Nếu là chuyên đề/bảng tùy biến, kiểm tra topic.columns
  const topic = allDashboards.find((t) => t.id === tableId);
  if (topic?.columns && Array.isArray(topic.columns) && topic.columns.length > 0) {
    return sanitizeRelCols(topic.columns.filter((id) => id !== 'status' && id !== 'tripStatus' && id !== '_primaryKey'));
  }
  if (topic?.customColumns && Array.isArray(topic.customColumns) && topic.customColumns.length > 0) {
    return sanitizeRelCols(topic.customColumns.map((c) => c.id).filter((id) => id && id !== 'status' && id !== 'tripStatus' && id !== '_primaryKey'));
  }

  return null;
};

const onDrilldownViewChange = async () => {
  const tid = drilldownWidget.value?.topicId || drilldownSourceType.value || 'trips';
  const vId = drilldownSelectedViewId.value || 'all';
  drilldownDtFirst.value = 0;
  drilldownSelectedRows.value = [];

  let loadedCols = null;
  try {
    const local = localStorage.getItem(`child_dashboard_cols_${tid}_${vId}`);
    if (local) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed) && parsed.length > 0) {
        loadedCols = parsed.filter((id) => id !== 'status' && id !== 'tripStatus' && id !== '_primaryKey');
      }
    }
  } catch (e) {}

  if (!loadedCols) {
    const allDashboards = ensureStandardDashboards(availableTopicDashboards.value);
    const topic = allDashboards.find((t) => t.id === tid);
    const card = topic?.metricCards?.find((c) => c.id === vId);
    if (card?.columns && Array.isArray(card.columns) && card.columns.length > 0) {
      loadedCols = card.columns.filter((id) => id !== 'status' && id !== 'tripStatus' && id !== '_primaryKey');
    }
  }

  if (!loadedCols) {
    loadedCols = getSetupColumnIdsForTable(tid, vId);
  }

  drilldownSavedColIds.value = loadedCols;

  try {
    const keysToCheck = [`child_dashboard_cols_${tid}_${vId}`];
    if (vId === 'all') {
      keysToCheck.push(`child_dashboard_cols_${tid}`);
      if (tid === 'trips') keysToCheck.push('trips_dashboard_columns');
      else if (tid === 'personnel') keysToCheck.push('personnel_active_columns');
      else if (tid === 'relatives') keysToCheck.push('relative_active_columns');
    }
    for (const k of keysToCheck) {
      const dbVal = await getAppSettings(k, null);
      if (Array.isArray(dbVal) && dbVal.length > 0) {
        const sanitized = dbVal.filter((id) => id !== 'status' && id !== 'tripStatus' && id !== '_primaryKey');
        if (sanitized.length > 0) {
          drilldownSavedColIds.value = sanitized;
          break;
        }
      }
    }
  } catch (e) {}
};

const drilldownColumns = computed(() => {
  const src = drilldownSourceType.value || 'trips';
  const tid = drilldownWidget.value?.topicId || src;

  // Lấy toàn bộ các cột khả dụng của bảng nguồn
  const allCols = getUnifiedTableColumns(src, {
    personnelStore,
    customDashboards: availableTopicDashboards.value,
    systemBranding: systemBranding.value,
  });

  const colMap = new Map();
  allCols.forEach((c) => {
    if (c.id && c.id !== 'status' && c.id !== 'tripStatus' && c.id !== '_primaryKey') {
      colMap.set(c.id, c);
    }
  });

  // Ưu tiên thứ tự các cột mà người dùng đã setup trên view được chọn
  const activeViewId = drilldownSelectedViewId.value || drilldownWidget.value?.viewId || drilldownWidget.value?.cardId || 'all';
  const setupColIds = drilldownSavedColIds.value || getSetupColumnIdsForTable(tid, activeViewId);

  if (setupColIds && Array.isArray(setupColIds) && setupColIds.length > 0) {
    const orderedCols = [];
    setupColIds.forEach((id) => {
      let targetCol = colMap.get(id);
      if (!targetCol && src === 'relatives') {
        if (id === 'countryNameTN') targetCol = colMap.get('countryName');
        else if (id === 'countryName') targetCol = colMap.get('countryNameTN');
      }
      if (targetCol) {
        orderedCols.push(targetCol);
      }
    });

    if (orderedCols.length > 0) {
      return orderedCols;
    }
  }

  // Fallback: Nếu bảng chưa từng tùy biến sắp xếp cột, hiển thị theo đúng thứ tự cấu hình cột (importMapping / customColumns)
  return allCols.filter((c) => c.id && c.id !== 'status' && c.id !== 'tripStatus' && c.id !== '_primaryKey');
});

const filteredDrilldownList = computed(() => {
  const list = drilldownRawList.value || [];
  const q = drilldownSearchText.value?.trim().toLowerCase();
  if (!q) return list;

  const cols = drilldownColumns.value;
  return list.filter((row) => {
    return cols.some((col) => {
      const val = getRowFieldValue(row, col.id, col);
      return val && String(val).toLowerCase().includes(q);
    });
  });
});

const drilldownSelectedPersonnel = computed(() => {
  const selected = drilldownSelectedRows.value || [];
  const list = selected.length > 0 ? selected : filteredDrilldownList.value;
  const personMap = new Map();
  const pKeyField = personnelStore.getPersonnelKeyField();

  list.forEach((r) => {
    let p = r.rawPerson;
    if (!p) {
      const pKey = r[pKeyField] || r.parentCccd || r.cccdparent || r.cccd || r.id;
      p = (personnelStore.personnelList || []).find(
        (x) => (pKey && (x[pKeyField] === pKey || x.cccdparent === pKey || x.cccd === pKey || x.id === pKey)) ||
               (r.personnelId && x.id === r.personnelId) ||
               (r.personnelCode && x.code === r.personnelCode)
      );
    }
    if (p && p.id && !personMap.has(p.id)) {
      personMap.set(p.id, p);
    }
  });

  return Array.from(personMap.values());
});

const showRowPdfPreview = ref(false);
const rowPreviewPdfBlob = ref(null);
const rowPreviewTitle = ref('');
const rowPreviewFileName = ref('');
const rowPreviewingKey = ref(null);

const previewPdfForRow = async (row) => {
  if (!row) return;
  const rowKey = row.uniqueKey || row.id;
  rowPreviewingKey.value = rowKey;

  try {
    const pKeyField = personnelStore.getPersonnelKeyField();
    let p = row.rawPerson;
    if (!p) {
      const pKey = row[pKeyField] || row.parentCccd || row.cccdparent || row.cccd || row.id;
      p = (personnelStore.personnelList || []).find(
        (x) => (pKey && (x[pKeyField] === pKey || x.cccdparent === pKey || x.cccd === pKey || x.id === pKey)) ||
               (row.personnelId && x.id === row.personnelId) ||
               (row.personnelCode && x.code === row.personnelCode)
      );
    }
    if (!p) {
      if (row.name || row.ho_ten || row.code) {
        p = row;
      } else {
        alert('Không tìm thấy thông tin hồ sơ cán bộ tương ứng.');
        return;
      }
    }

    const exportOpts = {
      includeRelatives: true,
      includeTrips: true,
      showColumnNumbers: false,
    };
    const tplBuffer = await getEffectiveExportTemplateBuffer(exportOpts, personnelStore);
    const blob = await generateSinglePersonnelPdfBlob(tplBuffer, p, personnelStore, authStore.currentUser, exportOpts);

    rowPreviewPdfBlob.value = blob;
    rowPreviewTitle.value = `Hồ sơ: ${p.name || p.ho_ten || 'Cán bộ'}`;
    rowPreviewFileName.value = `Ho_so_${(p.name || p.ho_ten || 'Can_bo').replace(/[^a-zA-Z0-9_\u00C0-\u1EF9]/g, '_')}.pdf`;
    showRowPdfPreview.value = true;
  } catch (err) {
    console.error('Lỗi khi xem PDF:', err);
    alert('Không thể tạo file xem trước PDF: ' + (err.message || 'Lỗi không xác định'));
  } finally {
    rowPreviewingKey.value = null;
  }
};

const drilldownAllPersonnel = computed(() => {
  return personnelStore.personnelList || [];
});

const openDrilldownDocxExport = () => {
  isDocxExportOpen.value = true;
};

const exportDrilldownExcel = () => {
  const selected = drilldownSelectedRows.value || [];
  const list = selected.length > 0 ? selected : (filteredDrilldownList.value || []);
  const cols = drilldownColumns.value || [];
  const title = drilldownExtraTitle.value || drilldownWidget.value?.title || 'Thong_ke_chi_tiet';
  const cleanTitle = title.replace(/[^a-zA-Z0-9_\u00C0-\u1EF9]/g, '_');

  const rows = list.map((item, idx) => {
    const obj = { 'STT': idx + 1 };
    cols.forEach((col) => {
      if (col.id === 'presenceStatus' || col.id === '_presenceStatus' || col.id === 'trang_thai_hien_dien' || col.id === 'status' || col.format === 'presence') {
        obj[col.label || col.id] = getPresenceBadge(item).text;
      } else {
        obj[col.label || col.id] = getDisplayValue(item, col.id);
      }
    });
    return obj;
  });

  exportToExcel(rows, `${cleanTitle}_${new Date().toISOString().slice(0, 10)}`, title);
};

const selectedDrilldownRow = ref(null);
const isDrilldownRecordDetailOpen = ref(false);

const handleDrilldownRowClick = (row) => {
  if (!row) return;
  selectedDrilldownRow.value = row;
  isDrilldownRecordDetailOpen.value = true;
};

const getRecordTitle = (row) => {
  if (!row) return 'Bản ghi';
  const pNameField = personnelStore.getPersonnelNameField ? personnelStore.getPersonnelNameField() : 'name';
  return row[pNameField] || row.name || row.fullName || row.ho_va_ten || row._parentPersonnelName || row.id || 'Bản ghi';
};

const drilldownDetailGroups = computed(() => {
  const cols = drilldownColumns.value || [];
  const groupsMap = new Map();
  cols.forEach((col) => {
    const grpName = col.group || 'Thông tin chi tiết';
    if (!groupsMap.has(grpName)) {
      groupsMap.set(grpName, []);
    }
    groupsMap.get(grpName).push(col);
  });
  return Array.from(groupsMap.entries()).map(([name, columns]) => ({
    name,
    columns,
  }));
});

const openPersonnelDetailFromRecord = () => {
  if (!selectedDrilldownRow.value) return;
  const row = selectedDrilldownRow.value;
  isDrilldownRecordDetailOpen.value = false;
  selectedPersonForDialog.value = row;
  selectedColumnsForDialog.value = (drilldownColumns.value || []).filter((c) => !c.isVirtual && c.id !== 'stt' && c.showInDetail !== false);
  isPersonDialogOpen.value = true;
};

const getDisplayValue = (row, colId, depth = 0) => {
  if (!row || !colId || depth > 3) return '-';

  // Check if column is a Formula / Lookup / Rollup Column
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

  const colDef = drilldownColumns.value?.find((c) => c.id === colId) || allMap[colId];
  if (colDef && colDef.format === 'formula') {
    const configWithResolver = {
      ...colDef,
      columns: Object.values(allMap),
      cellResolver: (targetColId) => {
        if (!targetColId || targetColId === colId) return '';
        const cell = getDisplayValue(row, targetColId, depth + 1);
        return cell !== '-' ? cell : '';
      },
    };
    const result = evaluateFormula(row, configWithResolver);
    return result?.label || result?.shortLabel || '-';
  }
  if (colDef && colDef.format === 'lookup') {
    return evaluateLookup(row, colDef, personnelStore);
  }
  if (colDef && colDef.format === 'rollup') {
    return evaluateRollup(row, colDef, personnelStore);
  }

  const val = getRowFieldValue(row, colId, colDef);
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

// Dialog state for editing records
const isPersonDialogOpen = ref(false);
const selectedPersonForDialog = ref(null);
const selectedColumnsForDialog = ref([]);

const openPersonnelDetail = (p) => {
  if (!p) return;
  selectedPersonForDialog.value = p;
  selectedColumnsForDialog.value = (drilldownColumns.value || []).filter((c) => !c.isVirtual && c.id !== 'stt' && c.showInDetail !== false);
  isPersonDialogOpen.value = true;
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


const isGroupDialogOpen = ref(false);
const editingGroup = ref(null);
const groupForm = ref({
  id: '',
  title: '',
  description: '',
  icon: 'pi-folder',
  color: '#1e293b',
  bgColor: '#ffffff',
  widthPercent: '100',
  widgets: [],
});

const getGroupFlexBasis = (group) => {
  const w = parseFloat(group?.widthPercent) || 100;
  if (w <= 20) return 'calc(20% - 0.8rem)';
  if (w <= 25) return 'calc(25% - 0.75rem)';
  if (w <= 35) return 'calc(33.333% - 0.67rem)';
  if (w <= 55) return 'calc(50% - 0.5rem)';
  return '100%';
};

const isWidgetDialogOpen = ref(false);
const isReorderWidgetsDialogOpen = ref(false);
const reorderingGroup = ref(null);
const widgetOrder = ref(1);
const activeGroupForWidget = ref(null);
const editingWidget = ref(null);
const widgetForm = ref({
  id: '',
  title: '',
  source: 'trips',
  viewId: 'all',
  columnId: '',
  columnLabel: '',
  subColumnId: '',
  subColumnLabel: '',
  displayType: 'count',
  widthPercent: 25,
  logicOp: 'AND',
  conditions: [],
  isUnique: false,
  color: '#0284c7',
  bgColor: '#ffffff',
  icon: 'pi-chart-line',
});

const deletedTopicGroupIds = ref([]);

const loadDeletedTopicGroupIds = async () => {
  try {
    const local = localStorage.getItem('dashboard_deleted_topic_group_ids');
    if (local) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed)) {
        deletedTopicGroupIds.value = parsed;
      }
    }
    const dbDeleted = await getAppSettings('dashboard_deleted_topic_group_ids');
    if (dbDeleted && Array.isArray(dbDeleted)) {
      deletedTopicGroupIds.value = dbDeleted;
    }
  } catch (e) {
    console.error('Error loading deletedTopicGroupIds:', e);
  }
};

const loadCustomGroups = async () => {
  try {
    const storageKey = groupsStorageKey.value;
    const local = localStorage.getItem(storageKey);
    if (local !== null && local !== undefined) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed)) {
        customGroups.value = parsed;
      }
    } else {
      customGroups.value = [];
    }
    const dbGroups = await getAppSettings(storageKey);
    if (dbGroups !== null && dbGroups !== undefined && Array.isArray(dbGroups)) {
      customGroups.value = dbGroups;
      try {
        localStorage.setItem(storageKey, JSON.stringify(dbGroups));
      } catch (e) {}
    }

    // Tự động chuẩn hóa điều kiện lọc cho tất cả các khối thống kê
    (customGroups.value || []).forEach((grp) => {
      (grp.widgets || []).forEach((w) => {
        const hydrated = hydrateWidgetConditions(w, grp);
        Object.assign(w, hydrated);
      });
    });
  } catch (e) {
    console.error('Error loading custom groups:', e);
  }
};

const saveCustomGroupsToDb = async () => {
  try {
    const storageKey = groupsStorageKey.value;
    localStorage.setItem(storageKey, JSON.stringify(customGroups.value));
  } catch (e) {}
  try {
    const storageKey = groupsStorageKey.value;
    await saveAppSettings(storageKey, customGroups.value);
  } catch (e) {
    console.error('Error saving custom groups to DB:', e);
  }
};

const reconcileGroupsWithTopics = async (silent = true, targetGroupIdentifier = null, forceSyncFromTopic = false) => {
  if (!availableTopicDashboards.value || availableTopicDashboards.value.length === 0) {
    if (!silent) alert('Không tìm thấy cấu hình Chuyên đề nào!');
    return;
  }

  const colorMap = {
    blue: '#0284c7',
    green: '#2e7d32',
    amber: '#ea580c',
    red: '#dc2626',
    purple: '#7c3aed',
    teal: '#0d9488',
  };

  let hasChanges = false;
  const currentGroups = JSON.parse(JSON.stringify(customGroups.value || []));

  availableTopicDashboards.value.forEach((topic, tIdx) => {
    let existingGroup = currentGroups.find((g) => (topic.id && g.topicId === topic.id) || g.title === topic.title);
    
    // Nếu gọi đồng bộ cho một nhóm cụ thể mà không khớp nhóm này thì bỏ qua
    if (targetGroupIdentifier) {
      const matchExisting = existingGroup && (existingGroup.id === targetGroupIdentifier || existingGroup.title === targetGroupIdentifier || existingGroup.topicId === targetGroupIdentifier);
      const matchTopic = topic.id === targetGroupIdentifier || topic.title === targetGroupIdentifier;
      if (!matchExisting && !matchTopic) return;
    }

    const cards = topic.metricCards || [];
    const visibleCards = cards.filter((c) => {
      if (c.hidden === true) return false;
      if (c.widthPercent === 0 || c.widthPercent === '0') return false;
      return true;
    });
    const widthPerCard = visibleCards.length <= 2 ? 50 : (visibleCards.length === 3 ? 33 : 25);

    if (!existingGroup) {
      // Nếu nhóm này đã bị người dùng xóa trên Dashboard -> Không tự ý tạo lại (trừ khi forceSyncFromTopic)
      if (!forceSyncFromTopic && (deletedTopicGroupIds.value || []).includes(topic.id)) {
        return;
      }

      // Nếu nhóm này chưa có trên Dashboard chính -> Tạo nhóm mới với các thẻ tương ứng
      const widgets = cards.map((card, cIdx) => {
        const cardConds = (card.conditions && card.conditions.length > 0) ? card.conditions : (card.field ? [{ field: card.field }] : []);
        const primaryField = cardConds.length > 0 ? cardConds[0].field : '';
        const isCardHidden = !!card.hidden || (card.widthPercent !== '' && card.widthPercent !== undefined && card.widthPercent !== null && (Number(card.widthPercent) === 0 || card.widthPercent === '0'));

        return {
          id: `w_topic_${topic.id}_${card.id || cIdx}_${Date.now()}_${cIdx}`,
          cardIndex: cIdx,
          title: card.label || `Thẻ ${cIdx + 1}`,
          topicId: topic.id,
          topicTitle: topic.title,
          cardId: card.id || card.label || `card_${cIdx}`,
          cardCondition: card.condition || card.id,
          field: primaryField,
          columnId: primaryField,
          conditions: card.conditions || (card.field ? [{ field: card.field, operator: card.operator || 'has_value', value: card.value || '' }] : []),
          operator: card.operator || 'has_value',
          value: card.value || '',
          source: topic.source || 'trips',
          displayType: 'count',
          widthPercent: isCardHidden ? 0 : ((card.widthPercent !== '' && card.widthPercent !== undefined && card.widthPercent !== null && Number(card.widthPercent) > 0) ? Number(card.widthPercent) : widthPerCard),
          hidden: isCardHidden,
          color: colorMap[card.color] || card.color || '#2e7d32',
          icon: topic.icon ? `pi ${topic.icon}` : 'pi-chart-bar',
          isUnique: !!card.isUnique,
          inheritBaseline: card.inheritBaseline !== false,
        };
      });

      currentGroups.push({
        id: `grp_topic_${topic.id || tIdx}_${Date.now()}`,
        topicId: topic.id,
        title: topic.title,
        description: `Đồng bộ số liệu từ Chuyên đề: ${topic.title} (${visibleCards.length} chỉ số)`,
        icon: topic.icon ? `pi ${topic.icon}` : 'pi-folder',
        widgets,
      });
      hasChanges = true;
      return;
    }

    // Luôn liên kết chuẩn topicId cho nhóm
    if (!existingGroup.topicId && topic.id) {
      existingGroup.topicId = topic.id;
      hasChanges = true;
    }

    // Nhóm đã tồn tại -> Smart Reconcile từng thẻ widget (BẢO TỒN 100% STYLE VÀ CẤU HÌNH CỦA NGƯỜI DÙNG)
    const existingWidgets = existingGroup.widgets || [];
    const updatedWidgets = [];
    const matchedWidgetIds = new Set();

    cards.forEach((card, cIdx) => {
      const cardConds = (card.conditions && card.conditions.length > 0) ? card.conditions : (card.field ? [{ field: card.field }] : []);
      const primaryField = cardConds.length > 0 ? cardConds[0].field : '';

      // Kiểm tra xem thẻ này có bị người dùng xóa khỏi nhóm không
      const isCardDeletedByUser = (existingGroup.deletedCardKeys || []).some((k) =>
        k === card.id ||
        k === card.label ||
        k === `card_${cIdx}` ||
        k === `idx_${cIdx}` ||
        k === `title_${card.label}` ||
        k === `${topic.id}_${card.id}`
      );
      if (isCardDeletedByUser && !forceSyncFromTopic) {
        return; // Không phục hồi thẻ người dùng đã chủ động xóa
      }

      // Tìm widget tương ứng đã có trong nhóm (chưa được match với thẻ khác)
      let existingWidget = existingWidgets.find(
        (w) => !matchedWidgetIds.has(w.id) && (
          (w.cardIndex !== undefined && w.cardIndex === cIdx) ||
          (w.cardId && (w.cardId === card.id || w.cardId === card.label || w.cardId === `card_${cIdx}` || w.cardId === `card_${topic.id}_${cIdx}`)) ||
          w.title === card.label ||
          (card.id && w.id && w.id.includes(card.id))
        )
      );
      if (!existingWidget && existingWidgets[cIdx] && !matchedWidgetIds.has(existingWidgets[cIdx].id)) {
        existingWidget = existingWidgets[cIdx];
      }

      // SỬA LỖI CỐT LÕI: Chỉ ẩn khi explicit hidden === true hoặc widthPercent === 0 / '0'. Tuyệt đối không Number('') === 0!
      const isCardHidden = !!card.hidden || (card.widthPercent !== '' && card.widthPercent !== undefined && card.widthPercent !== null && (Number(card.widthPercent) === 0 || card.widthPercent === '0'));

      if (existingWidget) {
        matchedWidgetIds.add(existingWidget.id);

        // XÁC ĐỊNH ĐỘ RỘNG HỢP LỆ:
        // 1. Nếu thẻ bị ẩn từ Topic -> width = 0
        // 2. Nếu người dùng đã tùy chỉnh trên Dashboard (userCustomizedWidth hoặc existingWidget.widthPercent) -> ƯU TIÊN GIỮ NGUYÊN (trừ khi forceSyncFromTopic)
        // 3. Nếu không, lấy theo card.widthPercent từ Chuyên đề
        // 4. Mặc định theo widthPerCard
        let targetWp;
        if (isCardHidden) {
          targetWp = 0;
        } else if (!forceSyncFromTopic && (existingWidget.userCustomizedWidth || (existingWidget.widthPercent !== undefined && existingWidget.widthPercent !== null && existingWidget.widthPercent !== '' && Number(existingWidget.widthPercent) >= 0))) {
          targetWp = Number(existingWidget.widthPercent);
        } else if (card.widthPercent !== '' && card.widthPercent !== undefined && card.widthPercent !== null && Number(card.widthPercent) > 0) {
          targetWp = Number(card.widthPercent);
        } else if (existingWidget.widthPercent !== undefined && existingWidget.widthPercent !== null && Number(existingWidget.widthPercent) > 0) {
          targetWp = Number(existingWidget.widthPercent);
        } else {
          targetWp = widthPerCard;
        }

        updatedWidgets.push({
          ...existingWidget,
          cardIndex: cIdx,
          title: existingWidget.userCustomizedTitle ? existingWidget.title : (card.label || existingWidget.title),
          topicId: topic.id,
          topicTitle: topic.title,
          cardId: card.id || card.label || `card_${cIdx}`,
          cardCondition: card.condition || card.id,
          field: primaryField,
          columnId: primaryField,
          conditions: card.conditions || (card.field ? [{ field: card.field, operator: card.operator || 'has_value', value: card.value || '' }] : []),
          operator: card.operator || 'has_value',
          value: card.value || '',
          source: topic.source || 'trips',
          isUnique: !!card.isUnique,
          inheritBaseline: card.inheritBaseline !== false,
          hidden: targetWp === 0,
          widthPercent: targetWp,
          userCustomizedWidth: existingWidget.userCustomizedWidth || false,
          userCustomizedTitle: existingWidget.userCustomizedTitle || false,
        });
      } else {
        // Thẻ mới được thêm ở Child Dashboard -> Tạo widget mới trong nhóm
        const newWidgetId = `w_topic_${topic.id}_${card.id || cIdx}_${Date.now()}_${cIdx}`;
        matchedWidgetIds.add(newWidgetId);
        updatedWidgets.push({
          id: newWidgetId,
          cardIndex: cIdx,
          title: card.label || `Thẻ ${cIdx + 1}`,
          topicId: topic.id,
          topicTitle: topic.title,
          cardId: card.id || card.label || `card_${cIdx}`,
          cardCondition: card.condition || card.id,
          field: primaryField,
          columnId: primaryField,
          conditions: card.conditions || (card.field ? [{ field: card.field, operator: card.operator || 'has_value', value: card.value || '' }] : []),
          operator: card.operator || 'has_value',
          value: card.value || '',
          source: topic.source || 'trips',
          displayType: 'count',
          widthPercent: isCardHidden ? 0 : ((card.widthPercent !== '' && card.widthPercent !== undefined && card.widthPercent !== null && Number(card.widthPercent) > 0) ? Number(card.widthPercent) : widthPerCard),
          hidden: isCardHidden,
          color: colorMap[card.color] || card.color || '#2e7d32',
          icon: topic.icon ? `pi ${topic.icon}` : 'pi-chart-bar',
          isUnique: !!card.isUnique,
          inheritBaseline: card.inheritBaseline !== false,
        });
        hasChanges = true;
      }
    });

    // Cập nhật phụ đề của nhóm phản ánh đúng số lượng chỉ số đang hiển thị
    const expectedDesc = `Đồng bộ số liệu từ Chuyên đề: ${topic.title} (${visibleCards.length} chỉ số)`;
    if (existingGroup.description !== expectedDesc) {
      existingGroup.description = expectedDesc;
      hasChanges = true;
    }

    // Giữ lại các widget tùy biến thủ công không thuộc thẻ của topic này
    const nonTopicWidgets = existingWidgets.filter((w) => !w.topicId && !w.cardId);
    nonTopicWidgets.forEach((w) => updatedWidgets.push(w));

    // Kiểm tra xem có widget nào thay đổi thuộc tính quan trọng không
    if (JSON.stringify(existingWidgets.map((w) => ({ id: w.id, h: w.hidden, wp: w.widthPercent, t: w.title }))) !== JSON.stringify(updatedWidgets.map((w) => ({ id: w.id, h: w.hidden, wp: w.widthPercent, t: w.title })))) {
      hasChanges = true;
    }

    existingGroup.widgets = updatedWidgets;
  });

  if (hasChanges) {
    customGroups.value = currentGroups;
    await saveCustomGroupsToDb();
  }

  if (!silent) {
    alert('Đã đồng bộ thông minh tất cả thẻ thống kê từ Chuyên đề (bảo tồn 100% màu sắc và định dạng đã thiết lập)!');
  }
};

const syncSingleGroupFromTopic = async (group) => {
  await loadTopicDashboards();
  await loadCustomGroups();
  const currentGroup = (customGroups.value || []).find((g) => g.id === group.id || (group.topicId && g.topicId === group.topicId) || g.title === group.title);
  if (currentGroup) {
    currentGroup.deletedCardKeys = [];
  }
  const topic = availableTopicDashboards.value.find((t) => (group.topicId && t.id === group.topicId) || t.title === group.title);
  if (!topic) {
    alert('Không tìm thấy cấu hình Chuyên đề tương ứng với nhóm này để đồng bộ!');
    return;
  }
  await reconcileGroupsWithTopics(false, group.id || group.title, true);
};

const syncAllTopicDashboardsToWidgets = async () => {
  deletedTopicGroupIds.value = [];
  try {
    localStorage.removeItem('dashboard_deleted_topic_group_ids');
    await saveAppSettings('dashboard_deleted_topic_group_ids', []);
  } catch (e) {}
  await loadTopicDashboards();
  await loadCustomGroups();
  await reconcileGroupsWithTopics(false, null, true);
};

// Group CRUD
const openAddGroupDialog = () => {
  editingGroup.value = null;
  groupForm.value = {
    id: 'grp_' + Date.now(),
    title: '',
    description: '',
    icon: 'pi-folder',
    color: '#1e293b',
    bgColor: '#ffffff',
    widthPercent: '100',
    widgets: [],
  };
  isGroupDialogOpen.value = true;
};

const openEditGroupDialog = (group) => {
  editingGroup.value = group;
  groupForm.value = {
    color: '#1e293b',
    bgColor: '#ffffff',
    widthPercent: '100',
    ...JSON.parse(JSON.stringify(group)),
  };
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

  if (group.topicId) {
    if (!deletedTopicGroupIds.value) deletedTopicGroupIds.value = [];
    if (!deletedTopicGroupIds.value.includes(group.topicId)) {
      deletedTopicGroupIds.value.push(group.topicId);
      try {
        localStorage.setItem('dashboard_deleted_topic_group_ids', JSON.stringify(deletedTopicGroupIds.value));
        await saveAppSettings('dashboard_deleted_topic_group_ids', deletedTopicGroupIds.value);
      } catch (e) {}
    }
  }

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
    code: '',
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
    const local = localStorage.getItem('custom_dashboards_config');
    if (local) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed) && parsed.length > 0) {
        availableTopicDashboards.value = parsed;
      }
    }
    const saved = await getAppSettings('custom_dashboards_config', null);
    if (saved && Array.isArray(saved) && saved.length > 0) {
      availableTopicDashboards.value = saved;
      try {
        localStorage.setItem('custom_dashboards_config', JSON.stringify(saved));
      } catch (e) {}
    } else if (!availableTopicDashboards.value || availableTopicDashboards.value.length === 0) {
      availableTopicDashboards.value = DEFAULT_TOPIC_DASHBOARDS;
    }
    // Đảm bảo các thẻ con không bị rỗng ID hoặc trùng id: 'all'
    availableTopicDashboards.value.forEach((dash) => {
      (dash.metricCards || []).forEach((c, idx) => {
        if (idx > 0 && (!c.id || c.id === 'all')) {
          c.id = 'card_' + (dash.id || 'dash') + '_' + idx;
        }
      });
    });
    await loadAllCustomTablesData();
  } catch (e) {
    if (!availableTopicDashboards.value || availableTopicDashboards.value.length === 0) {
      availableTopicDashboards.value = DEFAULT_TOPIC_DASHBOARDS;
    }
  }
};

const customTablesList = computed(() => {
  return (availableTopicDashboards.value || []).filter(
    (d) => d && d.id && d.id !== 'trips' && d.id !== 'personnel' && d.id !== 'relatives'
  );
});

const customTableRowsMap = ref({});

const loadCustomTableRowsForDashboard = async (tableId) => {
  if (!tableId) return [];
  if (customTableRowsMap.value[tableId] && customTableRowsMap.value[tableId].length > 0) {
    return customTableRowsMap.value[tableId];
  }
  let rows = [];
  try {
    const local = localStorage.getItem(`custom_table_rows_${tableId}`);
    if (local) {
      rows = JSON.parse(local) || [];
    }
  } catch (e) {}

  try {
    const db = await getAppSettings(`custom_table_rows_${tableId}`, null);
    if (db && Array.isArray(db)) {
      rows = db;
      try { localStorage.setItem(`custom_table_rows_${tableId}`, JSON.stringify(db)); } catch (e) {}
    }
  } catch (e) {}

  const mapped = (rows || []).map((r, idx) => ({ ...r, uniqueKey: r.uniqueKey || r.id || `row_${idx}` }));
  customTableRowsMap.value[tableId] = mapped;
  return mapped;
};

const loadAllCustomTablesData = async () => {
  const tables = customTablesList.value.filter((t) => t.source === 'blank');
  for (const t of tables) {
    await loadCustomTableRowsForDashboard(t.id);
  }
};

const onWidgetSourceChange = () => {
  widgetForm.value.columnId = '';
  widgetForm.value.subColumnId = '';
  widgetForm.value.viewId = 'all';
  if (widgetForm.value.conditions && widgetForm.value.conditions.length > 0) {
    widgetForm.value.conditions.forEach((c) => {
      c.field = '';
      c.value = '';
    });
  }
};

const selectedTopicObject = computed(() => {
  return availableTopicDashboards.value.find((t) => t.id === selectedWidgetTopicId.value) || availableTopicDashboards.value[0] || DEFAULT_TOPIC_DASHBOARDS[0];
});

const availableCardsForSelectedTopic = computed(() => {
  const t = selectedTopicObject.value;
  const rawCards = (t && t.metricCards && t.metricCards.length > 0) ? t.metricCards : DEFAULT_TOPIC_DASHBOARDS[0].metricCards;
  return rawCards.map((c, idx) => {
    return {
      ...c,
      _rawIndex: idx,
      cardIndex: idx,
      id: c.id || (idx === 0 ? 'all' : `card_${t?.id || 't'}_${idx}`),
    };
  });
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

const unifiedTripsList = computed(() => buildTopicSourceList('trips', personnelStore));

const getRowFieldValue = (row, colId, colDefOverride = null) => {
  if (!row || !colId) return '';

  // 0. Phân giải Cột ảo (Trạng thái hiện diện, Đối tượng, Thông tin Cán bộ liên quan...)
  const vVal = resolveVirtualColumnValue(row, colId);
  if (vVal !== undefined) {
    return vVal;
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
  (availableTopicDashboards.value || []).forEach((topic) => {
    (topic.customColumns || topic.columns || []).forEach((c) => {
      if (c && c.id && !allMap[c.id]) allMap[c.id] = c;
    });
  });

  const colDef = colDefOverride || drilldownColumns.value?.find((c) => c.id === colId) || allMap[colId];
  if (colDef && colDef.format === 'formula') {
    if (colDef.formulaType === 'presence_status') {
      const p = resolvePresence(row);
      return p.label || '-';
    }
    const configWithResolver = {
      ...colDef,
      columns: Object.values(allMap),
      cellResolver: (targetColId) => {
        if (!targetColId || targetColId === colId) return '';
        const cell = getRowFieldValue(row, targetColId);
        return cell !== '-' ? cell : '';
      },
    };
    const res = evaluateFormula(row, configWithResolver);
    return res?.label || res?.shortLabel || '';
  }
  if (colDef && colDef.format === 'lookup') {
    const lkVal = evaluateLookup(row, colDef, personnelStore);
    return lkVal !== '-' && lkVal !== undefined && lkVal !== null ? lkVal : '';
  }
  if (colDef && colDef.format === 'rollup') {
    const rlVal = evaluateRollup(row, colDef, personnelStore);
    return rlVal !== '-' && rlVal !== undefined && rlVal !== null ? rlVal : '';
  }

  if (colId === '_presenceStatus' || colId === 'presenceStatus' || colId === 'status' || colId === 'tripStatus' || colId === 'trang_thai_hien_dien' || colId === 'trangThaiHienDien') {
    const p = resolvePresence(row);
    return p.label || '-';
  }

  if (colId === 'isRelative' || colId === '_doiTuong' || colId === 'doi_tuong') {
    return row.isRelative ? 'Thân nhân' : 'Cán bộ';
  }

  // 2. Direct property or in custom_data (KHÔNG fallback ngầm sang rawPerson)
  const rcd = typeof row.custom_data === 'string' ? JSON.parse(row.custom_data || '{}') : (row.custom_data || {});
  const raw = row[colId] !== undefined ? row[colId] : rcd[colId];
  return formatGenericCellValue(raw, colDef || { id: colId });
};

const cachedSourceTrips = computed(() => buildTopicSourceList('trips', personnelStore));
const cachedSourcePersonnel = computed(() => buildTopicSourceList('personnel', personnelStore));
const cachedSourceRelatives = computed(() => buildTopicSourceList('relatives', personnelStore));

const getSourceList = (source) => {
  const rows = getUnifiedTableRows(source, {
    personnelStore,
    customDashboards: availableTopicDashboards.value,
    customTableRowsMap: customTableRowsMap.value,
    systemBranding: systemBranding.value,
  });
  if (rows && rows.length > 0) return rows;

  // Nếu là bảng tự tạo (blank) chưa nạp vào RAM, gọi nạp bất đồng bộ
  const customTable = (availableTopicDashboards.value || []).find((d) => d && d.id === source);
  if (customTable && customTable.source === 'blank' && !customTableRowsMap.value[source]) {
    loadCustomTableRowsForDashboard(source);
  }
  return rows || [];
};




const matchCardCondition = (item, card) => matchSharedCardCondition(item, card, personnelStore);
const isCardAllType = (card) => isSharedCardAllType(card);

const getCardMetricValueForTopic = (card, topic) => {
  if (!card) return 0;
  const topicCards = topic?.metricCards || [];

  // Nếu card truyền vào đã là đối tượng thẻ trực tiếp từ topicCards hoặc có index/id/label
  let actualCard = card;
  const cardIndexInTopic = topicCards.indexOf(card);
  if (cardIndexInTopic >= 0) {
    actualCard = topicCards[cardIndexInTopic];
  } else if (card._rawIndex !== undefined && topicCards[card._rawIndex]) {
    actualCard = topicCards[card._rawIndex];
  } else if (card.cardIndex !== undefined && topicCards[card.cardIndex]) {
    actualCard = topicCards[card.cardIndex];
  } else if (card.cardId || card.cardCondition || card.id || card.label || card.title) {
    const cardIdToMatch = card.cardId || card.id || card.cardCondition || card.condition;
    const cardLabelToMatch = card.cardLabel || card.label || card.title;
    actualCard = topicCards.find((c, idx) => {
      if (cardLabelToMatch && c.label === cardLabelToMatch) return true;
      if (cardIdToMatch && c.id && c.id !== 'all' && (c.id === cardIdToMatch || c.condition === cardIdToMatch)) return true;
      if (cardIdToMatch === `card_${idx}` || cardIdToMatch === `card_${topic?.id}_${idx}`) return true;
      return false;
    }) || card;
  }

  let src = topic?.source || actualCard.source || card.source;
  if (!src) {
    const str = `${card.topicTitle || ''} ${card.title || ''} ${topic?.title || ''}`.toLowerCase();
    if (str.includes('thân nhân')) src = 'relatives';
    else if (str.includes('cán bộ')) src = 'personnel';
    else src = 'trips';
  }
  const fullList = getSourceList(src);
  const isTopicCardHidden = (c) => {
    if (!c) return false;
    if (c.hidden === true) return true;
    if (c.widthPercent === 0 || c.widthPercent === '0') return true;
    return false;
  };
  const firstCard = topicCards.find((c) => !isTopicCardHidden(c)) || topicCards[0];
  return computeMetricCardCount(actualCard, fullList, firstCard, personnelStore);
};

// Dynamic Searchable Groups for Query Criteria Builder (Unified Table Registry)
const allSearchableGroupsForWidget = computed(() => {
  const selectedSource = widgetForm.value.source || 'trips';
  const allTables = allUnifiedTables.value || [];

  // Tìm bảng đang chọn để ưu tiên hiển thị lên đầu
  const currentTable = allTables.find((t) => t.id === selectedSource || t.source === selectedSource);
  const otherTables = allTables.filter((t) => t !== currentTable);

  const groups = [];

  // 1. Nhóm cột của Bảng đang chọn
  if (currentTable && typeof currentTable.getSearchableGroups === 'function') {
    const activeGroups = currentTable.getSearchableGroups(personnelStore);
    activeGroups.forEach((g) => {
      groups.push({
        ...g,
        name: `🎯 Bảng đang chọn: ${g.name}`,
      });
    });
  }

  // 2. Nhóm cột của các Bảng khác trong hệ thống để tham chiếu chéo
  otherTables.forEach((t) => {
    if (typeof t.getSearchableGroups === 'function') {
      const tGroups = t.getSearchableGroups(personnelStore);
      tGroups.forEach((g) => {
        groups.push({
          ...g,
          name: `📋 ${g.name}`,
        });
      });
    }
  });

  return groups;
});

const getFieldOptionsForWidget = (fieldId) => {
  if (!fieldId) return [];
  for (const grp of allSearchableGroupsForWidget.value) {
    const col = grp.columns.find((c) => c.id === fieldId || c.rawId === fieldId);
    if (col) {
      if (col.format === 'formula' && col.formulaType === 'presence_status') {
        return ['Trong nước', 'Đang ở nước ngoài', 'Quá hạn chưa về'];
      }
      if (col.options) {
        if (Array.isArray(col.options)) return col.options;
        if (typeof col.options === 'string') {
          return col.options.split(',').map((s) => s.trim()).filter(Boolean);
        }
      }
    }
  }
  return [];
};

// Hydrate Widget Conditions from Topic / Field / Card config
function hydrateWidgetConditions(w, group) {
  if (!w) return w;
  const clone = { ...w };

  if (!clone.source) {
    clone.source = group?.defaultSource || 'trips';
  }
  if (!clone.logicOp) {
    clone.logicOp = clone.logicOperator || 'AND';
  }
  if (!clone.viewId) {
    clone.viewId = clone.cardId || 'all';
  }

  if (Array.isArray(clone.conditions) && clone.conditions.length > 0) {
    return clone;
  }
  if (Array.isArray(clone.criteria) && clone.criteria.length > 0) {
    clone.conditions = clone.criteria;
    return clone;
  }

  if (clone.topicId) {
    const topic = (availableTopicDashboards.value || []).find((t) => t.id === clone.topicId);
    if (topic) {
      if (topic.source && !clone.source) clone.source = topic.source;
      const topicCards = topic.metricCards || [];
      const card = topicCards.find((c, idx) => (c.id && c.id === clone.cardId) || c.label === clone.cardId || c.label === clone.title || `card_${idx}` === clone.cardId);
      if (card) {
        if (card.conditions && card.conditions.length > 0) {
          clone.conditions = JSON.parse(JSON.stringify(card.conditions));
          if (card.logicOp) clone.logicOp = card.logicOp;
          if (card.isUnique !== undefined) clone.isUnique = !!card.isUnique;
          return clone;
        }
        if (card.field) {
          clone.conditions = [{
            id: 'c_0',
            field: card.field,
            operator: card.operator || 'has_value',
            value: card.value !== undefined ? card.value : '',
          }];
          if (card.isUnique !== undefined) clone.isUnique = !!card.isUnique;
          return clone;
        }
        if (card.condition && card.condition !== 'all') {
          if (card.condition === 'completed') {
            clone.conditions = [{ id: 'c_0', field: 'trang_thai_hien_dien', operator: 'equals', value: 'Trong nước' }];
          } else if (card.condition === 'abroad') {
            clone.conditions = [{ id: 'c_0', field: 'trang_thai_hien_dien', operator: 'equals', value: 'Đang ở nước ngoài' }];
          } else if (card.condition === 'overdue') {
            clone.conditions = [{ id: 'c_0', field: 'isOverdue', operator: 'equals', value: 'true' }];
          }
          return clone;
        }
      }
    }
  }

  if (clone.columnId || clone.field) {
    clone.conditions = [{
      id: 'c_0',
      field: clone.columnId || clone.field,
      operator: clone.operator || clone.countCondition || 'has_value',
      value: clone.value !== undefined ? clone.value : (clone.countValue !== undefined ? clone.countValue : ''),
    }];
    return clone;
  }

  clone.conditions = [];
  return clone;
};

// Condition Management for Query Criteria Builder
const addWidgetCondition = () => {
  if (!widgetForm.value.conditions) widgetForm.value.conditions = [];
  widgetForm.value.conditions.push({
    id: 'c_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    field: '',
    operator: 'has_value',
    value: '',
  });
};

const removeWidgetCondition = (idx) => {
  if (widgetForm.value.conditions && widgetForm.value.conditions.length > idx) {
    widgetForm.value.conditions.splice(idx, 1);
  }
};

const previewLiveCount = computed(() => {
  try {
    return computeWidgetCount(widgetForm.value);
  } catch (e) {
    return 0;
  }
});

// Widget CRUD
const openAddWidgetDialog = async (group) => {
  activeGroupForWidget.value = group;
  editingWidget.value = null;
  await loadTopicDashboards();
  widgetForm.value = {
    id: 'w_' + Date.now(),
    title: '',
    source: group?.defaultSource || 'trips',
    viewId: 'all',
    columnId: '',
    columnLabel: '',
    subColumnId: '',
    subColumnLabel: '',
    displayType: 'count',
    widthPercent: 25,
    logicOp: 'AND',
    conditions: [
      {
        id: 'c_' + Date.now(),
        field: '',
        operator: 'has_value',
        value: '',
      }
    ],
    isUnique: false,
    color: '#0284c7',
    bgColor: '#ffffff',
    icon: 'pi-chart-line',
  };
  widgetOrder.value = (group.widgets || []).length + 1;
  isWidgetDialogOpen.value = true;
};

const openEditWidgetDialog = async (group, widget) => {
  activeGroupForWidget.value = group;
  editingWidget.value = widget;
  await loadTopicDashboards();

  const hydrated = hydrateWidgetConditions(widget, group);
  const curIdx = (group.widgets || []).findIndex((w) => w.id === widget.id);
  widgetOrder.value = curIdx !== -1 ? curIdx + 1 : (group.widgets || []).length;
  widgetForm.value = {
    ...JSON.parse(JSON.stringify(hydrated)),
    viewId: hydrated.viewId || hydrated.cardId || 'all',
    subColumnId: hydrated.subColumnId || '',
    subColumnLabel: hydrated.subColumnLabel || '',
    widthPercent: (hydrated.widthPercent !== undefined && hydrated.widthPercent !== null && hydrated.widthPercent !== '') ? Number(hydrated.widthPercent) : 33,
  };
  if (!widgetForm.value.conditions || widgetForm.value.conditions.length === 0) {
    widgetForm.value.conditions = [
      {
        id: 'c_' + Date.now(),
        field: '',
        operator: 'has_value',
        value: '',
      }
    ];
  }
  if (!widgetForm.value.logicOp) {
    widgetForm.value.logicOp = 'AND';
  }
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

const onWidgetSubColumnSelect = () => {
  const selected = availableColumnsForWidgetSource.value.find((c) => c.id === widgetForm.value.subColumnId);
  if (selected) {
    widgetForm.value.subColumnLabel = selected.rawLabel || selected.label;
  } else {
    widgetForm.value.subColumnLabel = '';
  }
};

const saveWidget = async () => {
  if (isSavingWidget.value) return;
  if (!widgetForm.value.title?.trim()) {
    alert('Vui lòng nhập Tiêu đề cho Khối thống kê!');
    return;
  }
  const group = activeGroupForWidget.value;
  if (!group) return;
  if (!group.widgets) group.widgets = [];

  isSavingWidget.value = true;
  isWidgetDialogOpen.value = false;

  try {
    const rawWp = widgetForm.value.widthPercent;
    const finalWp = (rawWp !== '' && rawWp !== undefined && rawWp !== null && !isNaN(Number(rawWp)))
      ? Number(rawWp)
      : 33;

    const cleanedConditions = (widgetForm.value.conditions || [])
      .filter((c) => c && c.field && String(c.field).trim() !== '')
      .map((c, idx) => ({
        id: c.id || `c_${Date.now()}_${idx}`,
        field: c.field,
        operator: c.operator || 'has_value',
        value: c.value !== undefined ? c.value : '',
      }));

    const payload = {
      ...widgetForm.value,
      subColumnId: widgetForm.value.subColumnId || '',
      subColumnLabel: widgetForm.value.subColumnLabel || '',
      conditions: cleanedConditions,
      widthPercent: finalWp,
      hidden: finalWp === 0,
      userCustomizedWidth: true,
      userCustomizedTitle: true,
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

const isWidgetHidden = (widget) => {
  if (!widget) return false;
  if (widget.hidden === true) return true;
  if (widget.widthPercent === 0 || widget.widthPercent === '0') return true;
  return false;
};

const getWidgetStyle = (widget) => {
  if (isWidgetHidden(widget)) {
    return {
      display: 'none',
    };
  }
  const wp = Number(widget.widthPercent);
  if (wp >= 95) {
    return {
      flex: '1 1 100%',
      width: '100%',
      maxWidth: '100%',
      boxSizing: 'border-box',
    };
  }
  if (wp === 50) {
    return {
      flex: '1 1 calc(50% - 0.5rem)',
      width: 'calc(50% - 0.5rem)',
      maxWidth: 'calc(50% - 0.5rem)',
      minWidth: '280px',
      boxSizing: 'border-box',
    };
  }
  if (wp === 25) {
    return {
      flex: '1 1 calc(25% - 0.75rem)',
      width: 'calc(25% - 0.75rem)',
      maxWidth: 'calc(25% - 0.75rem)',
      minWidth: '210px',
      boxSizing: 'border-box',
    };
  }
  if (wp === 20) {
    return {
      flex: '1 1 calc(20% - 0.8rem)',
      width: 'calc(20% - 0.8rem)',
      maxWidth: 'calc(20% - 0.8rem)',
      minWidth: '170px',
      boxSizing: 'border-box',
    };
  }
  if (wp === 16.66 || wp === 16 || wp === 17 || Math.abs(wp - 16.66) < 1) {
    return {
      flex: '1 1 calc(16.666% - 0.85rem)',
      width: 'calc(16.666% - 0.85rem)',
      maxWidth: 'calc(16.666% - 0.85rem)',
      minWidth: '140px',
      boxSizing: 'border-box',
    };
  }
  if (wp > 0 && wp < 95) {
    return {
      flex: `1 1 calc(${wp}% - 0.67rem)`,
      width: `calc(${wp}% - 0.67rem)`,
      maxWidth: `calc(${wp}% - 0.67rem)`,
      minWidth: wp <= 20 ? '160px' : (wp <= 25 ? '200px' : (wp <= 34 ? '240px' : '280px')),
      boxSizing: 'border-box',
    };
  }
  // Default 33.333%
  return {
    flex: '1 1 calc(33.333% - 0.67rem)',
    width: 'calc(33.333% - 0.67rem)',
    maxWidth: 'calc(33.333% - 0.67rem)',
    minWidth: '240px',
    boxSizing: 'border-box',
  };
};

const deleteWidget = async (group, widget) => {
  if (!confirm(`Bạn có chắc muốn xóa khối thống kê "${widget.title}"?`)) return;
  group.widgets = group.widgets.filter((w) => w.id !== widget.id);

  // Ghi nhận định danh của widget bị xóa để reconcileGroupsWithTopics không tự ý hồi sinh
  if (!group.deletedCardKeys) group.deletedCardKeys = [];
  const keys = [
    widget.id,
    widget.cardId,
    widget.cardIndex !== undefined ? `idx_${widget.cardIndex}` : null,
    widget.title ? `title_${widget.title}` : null,
    widget.topicId && widget.cardId ? `${widget.topicId}_${widget.cardId}` : null,
  ].filter(Boolean);
  keys.forEach((k) => {
    if (!group.deletedCardKeys.includes(k)) {
      group.deletedCardKeys.push(k);
    }
  });

  await saveCustomGroupsToDb();
};

const duplicateWidget = async (group, widget) => {
  if (!group || !widget) return;
  const newWidget = JSON.parse(JSON.stringify(widget));
  newWidget.id = 'w_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
  newWidget.title = (newWidget.title || 'Khối thống kê') + ' (Bản sao)';
  delete newWidget.cardId;
  delete newWidget.topicId;

  if (!Array.isArray(group.widgets)) group.widgets = [];
  const wIdx = group.widgets.findIndex((w) => w.id === widget.id);
  if (wIdx !== -1) {
    group.widgets.splice(wIdx + 1, 0, newWidget);
  } else {
    group.widgets.push(newWidget);
  }
  await saveCustomGroupsToDb();
};

const duplicateCustomGroup = async (group) => {
  if (!group) return;
  const newGroup = JSON.parse(JSON.stringify(group));
  newGroup.id = 'grp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
  newGroup.title = (newGroup.title || 'Nhóm thống kê') + ' (Bản sao)';
  if (Array.isArray(newGroup.widgets)) {
    newGroup.widgets = newGroup.widgets.map((w) => ({
      ...w,
      id: 'w_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      title: w.title,
    }));
  }
  const gIdx = customGroups.value.findIndex((g) => g.id === group.id);
  if (gIdx !== -1) {
    customGroups.value.splice(gIdx + 1, 0, newGroup);
  } else {
    customGroups.value.push(newGroup);
  }
  await saveCustomGroupsToDb();
};

const getCountWidgets = (group) => {
  return (group.widgets || []).filter((w) => w.displayType === 'count');
};

const getChartWidgets = (group) => {
  return (group.widgets || []).filter((w) => w.displayType === 'chart');
};

const getSourceLabel = (source) => {
  return getUnifiedTableLabel(source, {
    personnelStore,
    customDashboards: availableTopicDashboards.value,
    systemBranding: systemBranding.value,
  });
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

function computeWidgetCount(widget) {
  if (!widget) return 0;

  const source = widget.source || 'trips';
  const list = getSourceList(source);

  // Chuẩn hóa conditions của widget
  const conds = (Array.isArray(widget.conditions) && widget.conditions.length > 0)
    ? widget.conditions
    : (Array.isArray(widget.criteria) && widget.criteria.length > 0
        ? widget.criteria
        : (widget.field || widget.columnId
            ? [{ field: widget.field || widget.columnId, operator: widget.operator || widget.countCondition || 'has_value', value: widget.value || widget.countValue || '' }]
            : []));

  const activeConds = conds.filter((c) => c && c.field && String(c.field).trim() !== '');

  let filtered = list;
  if (activeConds.length > 0) {
    const cardLike = {
      ...widget,
      conditions: activeConds,
      logicOp: widget.logicOp || widget.logicOperator || 'AND',
    };
    filtered = list.filter((row) => matchSharedCardCondition(row, cardLike, personnelStore));
  } else if (widget.topicId) {
    const topic = (availableTopicDashboards.value || []).find((t) => t.id === widget.topicId);
    return getCardMetricValueForTopic(widget, topic);
  }

  if (widget.isUnique) {
    const seen = new Set();
    filtered.forEach((r) => {
      const cccd = r.cccd || r.rawPerson?.cccd || r.id || r.code || r.personnelCode || r.uniqueKey;
      if (cccd) seen.add(cccd);
    });
    return seen.size;
  }

  return filtered.length;
};

const DEFAULT_SERIES_COLORS = [
  '#0284c7', // Xanh dương (Cán bộ)
  '#8b5cf6', // Tím hoa cà (Thân nhân)
  '#f97316', // Cam
  '#10b981', // Xanh lá ngọc
  '#ec4899', // Hồng phấn
  '#eab308', // Vàng hổ phách
  '#06b6d4', // Xanh lơ
  '#6366f1', // Chàm
  '#14b8a6', // Xanh mòng két
  '#f43f5e', // Đỏ hồng
  '#84cc16', // Vôi chanh
  '#a855f7', // Tím đậm
];

const getSemanticColorForSubVal = (val, colorIdx) => {
  const str = String(val || '').trim().toLowerCase();
  if (str === 'cán bộ' || str === 'can bo' || str === 'cb') return '#0284c7';
  if (str === 'thân nhân' || str === 'than nhan' || str === 'tn') return '#8b5cf6';
  if (str.includes('đúng hạn') || str.includes('hoàn thành')) return '#10b981';
  if (str.includes('quá hạn') || str.includes('chưa về') || str.includes('cảnh báo')) return '#ef4444';
  if (str.includes('chờ') || str.includes('chưa')) return '#f59e0b';
  return DEFAULT_SERIES_COLORS[colorIdx % DEFAULT_SERIES_COLORS.length];
};

const openDrilldownForWidget = (widget, extraCondition = null) => {
  const source = widget.source || 'trips';
  let list = getSourceList(source);

  // Chuẩn hóa conditions của widget
  let conds = (Array.isArray(widget.conditions) && widget.conditions.length > 0)
    ? [...widget.conditions]
    : (Array.isArray(widget.criteria) && widget.criteria.length > 0
        ? [...widget.criteria]
        : (widget.field || widget.columnId
            ? [{ field: widget.field || widget.columnId, operator: widget.operator || widget.countCondition || 'has_value', value: widget.value || widget.countValue || '' }]
            : []));

  if (conds.length === 0 && widget.topicId) {
    const topic = (availableTopicDashboards.value || []).find((t) => t.id === widget.topicId);
    if (topic) {
      const topicCards = topic.metricCards || [];
      const topicCard = topicCards.find((c, idx) => (c.id && c.id === widget.cardId) || c.label === widget.cardId || c.label === widget.title || `card_${idx}` === widget.cardId);
      if (topicCard && topicCard.conditions && Array.isArray(topicCard.conditions)) {
        conds = [...topicCard.conditions];
      } else if (topicCard && topicCard.field) {
        conds = [{ field: topicCard.field, operator: topicCard.operator || 'has_value', value: topicCard.value || '' }];
      }
    }
  }

  if (extraCondition) {
    if (Array.isArray(extraCondition)) {
      conds.push(...extraCondition);
    } else {
      conds.push(extraCondition);
    }
  }

  const activeConds = conds.filter((c) => c && c.field && String(c.field).trim() !== '');

  let filtered = list;
  if (activeConds.length > 0) {
    const cardLike = {
      ...widget,
      conditions: activeConds,
      logicOp: widget.logicOp || widget.logicOperator || 'AND',
    };
    filtered = list.filter((row) => matchSharedCardCondition(row, cardLike, personnelStore));
  } else if (widget.topicId && !extraCondition) {
    const topic = (availableTopicDashboards.value || []).find((t) => t.id === widget.topicId);
    if (topic) {
      const topicCard = (topic.metricCards || []).find((c) => c.id === widget.cardId) || (topic.metricCards || [])[0];
      if (topicCard && topicCard.condition && topicCard.condition !== 'all') {
        filtered = list.filter((row) => matchSharedCardCondition(row, topicCard, personnelStore));
      }
    }
  }

  if (widget.isUnique) {
    const seen = new Set();
    const uniqueResult = [];
    filtered.forEach((r) => {
      const cccd = r.cccd || r.rawPerson?.cccd || r.id || r.code || r.personnelCode || r.uniqueKey;
      if (cccd && !seen.has(cccd)) {
        seen.add(cccd);
        uniqueResult.push(r);
      }
    });
    filtered = uniqueResult;
  }

  const tid = widget.topicId || source;
  const targetViewId = widget.viewId || widget.cardId || 'all';
  drilldownSelectedViewId.value = targetViewId;
  drilldownSavedColIds.value = getSetupColumnIdsForTable(tid, targetViewId);

  (async () => {
    try {
      const keysToCheck = [];
      if (targetViewId) keysToCheck.push(`child_dashboard_cols_${tid}_${targetViewId}`);
      keysToCheck.push(`child_dashboard_cols_${tid}`);
      if (tid === 'trips') keysToCheck.push('trips_dashboard_columns');
      else if (tid === 'personnel') keysToCheck.push('personnel_active_columns');
      else if (tid === 'relatives') keysToCheck.push('relative_active_columns');

      for (const k of keysToCheck) {
        const dbVal = await getAppSettings(k, null);
        if (Array.isArray(dbVal) && dbVal.length > 0) {
          const sanitized = dbVal.filter((id) => id !== 'status' && id !== 'tripStatus' && id !== '_primaryKey');
          if (sanitized.length > 0) {
            drilldownSavedColIds.value = sanitized;
            break;
          }
        }
      }
    } catch (e) {}
  })();

  drilldownWidget.value = widget;
  if (Array.isArray(extraCondition) && extraCondition.length > 0) {
    drilldownExtraTitle.value = `${widget.title || 'Thống kê'}: ${extraCondition.map((c) => `"${c.value}"`).join(' • ')}`;
  } else if (extraCondition && extraCondition.value) {
    drilldownExtraTitle.value = `${widget.title || 'Thống kê'}: "${extraCondition.value}"`;
  } else {
    drilldownExtraTitle.value = widget.title || 'Thống kê';
  }
  drilldownSourceType.value = source;
  drilldownRawList.value = filtered;
  drilldownSearchText.value = '';
  drilldownDtFirst.value = 0;
  drilldownSelectedRows.value = [];
  isDrilldownModalOpen.value = true;
};

const handleWidgetClick = (widget) => {
  openDrilldownForWidget(widget);
};

const handleChartItemClick = (widget, item) => {
  const groupField = item?.field || widget.columnId || (widget.source === 'personnel' ? 'departmentName' : 'countryName');
  const groupVal = item?.name || '';
  const extraCondition = (groupField && groupVal) ? {
    field: groupField,
    operator: 'equals',
    value: groupVal,
  } : null;
  openDrilldownForWidget(widget, extraCondition);
};

const handleChartSegmentClick = (widget, item, segment) => {
  if (!segment) {
    handleChartItemClick(widget, item);
    return;
  }
  const groupField = item?.field || widget.columnId || (widget.source === 'personnel' ? 'departmentName' : 'countryName');
  const groupVal = item?.name || '';
  const subField = segment?.field || widget.subColumnId || '';
  const subVal = segment?.name || '';

  const extraConditions = [];
  if (groupField && groupVal) {
    extraConditions.push({
      field: groupField,
      operator: 'equals',
      value: groupVal,
    });
  }
  if (subField && subVal && subVal !== 'Chưa phân loại') {
    extraConditions.push({
      field: subField,
      operator: 'equals',
      value: subVal,
    });
  }

  openDrilldownForWidget(widget, extraConditions);
};

const computeWidgetChartData = (widget) => {
  if (!widget) return { list: [], max: 1, total: 0, groupField: '', subGroupField: '', seriesList: [] };
  const source = widget.source || 'trips';
  const list = getSourceList(source);

  // Chuẩn hóa conditions của widget
  const conds = (Array.isArray(widget.conditions) && widget.conditions.length > 0)
    ? widget.conditions
    : (Array.isArray(widget.criteria) && widget.criteria.length > 0
        ? widget.criteria
        : (widget.field || widget.columnId
            ? [{ field: widget.field || widget.columnId, operator: widget.operator || widget.countCondition || 'has_value', value: widget.value || widget.countValue || '' }]
            : []));

  const activeConds = conds.filter((c) => c && c.field && String(c.field).trim() !== '');

  let matchedList = list;
  if (activeConds.length > 0) {
    const cardLike = {
      ...widget,
      conditions: activeConds,
      logicOp: widget.logicOp || widget.logicOperator || 'AND',
    };
    matchedList = list.filter((row) => matchSharedCardCondition(row, cardLike, personnelStore));
  } else if (widget.topicId) {
    const topic = (availableTopicDashboards.value || []).find((t) => t.id === widget.topicId);
    if (topic) {
      const topicCards = topic.metricCards || [];
      const card = topicCards.find((c, idx) => (c.id && c.id === widget.cardId) || c.label === widget.cardId || c.label === widget.title || `card_${idx}` === widget.cardId) || widget;
      matchedList = list.filter((row) => matchSharedCardCondition(row, card, personnelStore));
    }
  }

  // Xác định Cột cần Gom nhóm (Group by Field)
  let groupField = widget.columnId;
  if (!groupField && activeConds.length > 0 && activeConds[0].field) {
    groupField = activeConds[0].field;
  }
  if (!groupField) {
    groupField = source === 'trips' ? 'countryName' : (source === 'relatives' ? 'countryName' : 'departmentName');
  }

  const subGroupField = widget.subColumnId || '';

  const counts = {};
  const subValTotals = {};
  let total = 0;

  matchedList.forEach((row) => {
    const val = getRowFieldValue(row, groupField);
    if (val === undefined || val === null) return;
    const strVal = String(val).trim();
    if (!strVal || strVal === '-') return;

    if (!counts[strVal]) {
      counts[strVal] = { total: 0, subCounts: {} };
    }
    counts[strVal].total++;
    total++;

    if (subGroupField) {
      const sVal = getRowFieldValue(row, subGroupField);
      const subStrVal = (sVal !== undefined && sVal !== null && String(sVal).trim() !== '' && String(sVal).trim() !== '-')
        ? String(sVal).trim()
        : 'Chưa phân loại';
      counts[strVal].subCounts[subStrVal] = (counts[strVal].subCounts[subStrVal] || 0) + 1;
      subValTotals[subStrVal] = (subValTotals[subStrVal] || 0) + 1;
    }
  });

  // Xây dựng danh sách Series và Palette màu đồng bộ
  const seriesColorMap = {};
  const seriesList = [];
  if (subGroupField) {
    const sortedSubVals = Object.keys(subValTotals).sort((a, b) => subValTotals[b] - subValTotals[a]);
    sortedSubVals.forEach((sName, idx) => {
      const sColor = getSemanticColorForSubVal(sName, idx);
      seriesColorMap[sName] = sColor;
      seriesList.push({
        name: sName,
        color: sColor,
        total: subValTotals[sName],
        field: subGroupField,
      });
    });
  }

  const chartList = Object.entries(counts)
    .map(([name, data]) => {
      const segments = [];
      if (subGroupField && Object.keys(data.subCounts).length > 0) {
        seriesList.forEach((s) => {
          const cnt = data.subCounts[s.name] || 0;
          if (cnt > 0) {
            segments.push({
              name: s.name,
              count: cnt,
              color: s.color,
              percent: data.total > 0 ? Math.round((cnt / data.total) * 100) : 0,
              field: subGroupField,
            });
          }
        });
      } else {
        segments.push({
          name,
          count: data.total,
          color: widget.color || '#2e7d32',
          percent: 100,
          field: groupField,
        });
      }

      return {
        name,
        count: data.total,
        field: groupField,
        subField: subGroupField,
        segments,
      };
    })
    .sort((a, b) => b.count - a.count);

  const max = chartList.length > 0 ? chartList[0].count : 1;
  return { list: chartList, max, total, groupField, subGroupField, seriesList };
};

const chartDataCache = new Map();

watch(
  () => [personnelStore.personnelList, customGroups.value, availableTopicDashboards.value],
  () => {
    chartDataCache.clear();
  },
  { deep: false }
);

const getWidgetChartData = (widget) => {
  if (!widget?.id) return { list: [], max: 1, total: 0, groupField: '', subGroupField: '', seriesList: [] };
  const cacheKey = `${widget.id}_${widget.topicId || ''}_${widget.columnId || ''}_${widget.subColumnId || ''}_${widget.cardId || ''}`;
  if (chartDataCache.has(cacheKey)) {
    return chartDataCache.get(cacheKey);
  }
  const res = computeWidgetChartData(widget);
  chartDataCache.set(cacheKey, res);
  return res;
};



const availableColumnsForWidgetSource = computed(() => {
  const source = widgetForm.value.source;
  const cols = getUnifiedTableColumns(source, {
    personnelStore,
    customDashboards: availableTopicDashboards.value,
    systemBranding: systemBranding.value,
  });

  return cols.map((c, idx) => ({
    id: c.id,
    rawLabel: c.label || c.id,
    label: `[Cột ${idx + 1}] ${c.label || c.id} (${c.id})`,
  }));
});

const availableViewsForWidgetSource = computed(() => {
  const source = widgetForm.value.source || 'trips';
  const allDashboards = ensureStandardDashboards(availableTopicDashboards.value);
  const topic = allDashboards.find((t) => t.id === source);
  const views = [];
  if (topic && Array.isArray(topic.metricCards) && topic.metricCards.length > 0) {
    topic.metricCards.forEach((c, idx) => {
      const cId = c.id || (idx === 0 ? 'all' : `card_${idx}`);
      views.push({
        id: cId,
        label: c.label || c.title || (idx === 0 ? 'Toàn bộ (Mặc định)' : `Chế độ xem ${idx}`),
      });
    });
  }
  if (views.length === 0) {
    views.push({ id: 'all', label: 'Toàn bộ (Mặc định)' });
  }
  return views;
});

const allAvailableRelativeColumns = computed(() => {
  const list = [];
  let currentColIdx = 0;

  (personnelStore.importMappingRelative || []).forEach((g) => {
    (g.columns || []).forEach((c) => {
      currentColIdx++;
      const subOpts = getSubOptionsList(c);

      if (subOpts.length > 1) {
        const start = currentColIdx;
        const end = currentColIdx + subOpts.length - 1;
        list.push({
          id: c.id,
          label: `[Cột ${start} - ${end}] ${c.label || c.id} (${c.id})`,
        });
        subOpts.forEach((opt, sIdx) => {
          const colNum = start + sIdx;
          list.push({
            id: c.id,
            subOpt: opt,
            label: `  └─ [Cột ${colNum}] ${c.label || c.id}: ${opt}`,
          });
        });
        currentColIdx = end;
      } else {
        list.push({
          id: c.id,
          label: `[Cột ${currentColIdx}] ${c.label || c.id} (${c.id})`,
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
      const subOpts = getSubOptionsList(c);

      if (subOpts.length > 1) {
        const start = currentColIdx;
        const end = currentColIdx + subOpts.length - 1;
        list.push({
          id: c.id,
          label: `[Cột ${start} - ${end}] ${c.label || c.id} (${c.id})`,
        });
        subOpts.forEach((opt, sIdx) => {
          const colNum = start + sIdx;
          list.push({
            id: c.id,
            subOpt: opt,
            label: `  └─ [Cột ${colNum}] ${c.label || c.id}: ${opt}`,
          });
        });
        currentColIdx = end;
      } else {
        list.push({
          id: c.id,
          label: `[Cột ${currentColIdx}] ${c.label || c.id} (${c.id})`,
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
      const subOpts = getSubOptionsList(c);

      if (subOpts.length > 1) {
        const start = currentColIdx;
        const end = currentColIdx + subOpts.length - 1;
        list.push({
          id: c.id,
          label: `[Cột ${start} - ${end}] ${c.label || c.id} (${c.id})`,
        });
        subOpts.forEach((opt, sIdx) => {
          const colNum = start + sIdx;
          list.push({
            id: c.id,
            subOpt: opt,
            label: `  └─ [Cột ${colNum}] ${c.label || c.id}: ${opt}`,
          });
        });
        currentColIdx = end;
      } else {
        list.push({
          id: c.id,
          label: `[Cột ${currentColIdx}] ${c.label || c.id} (${c.id})`,
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

const handleCustomDashboardsUpdated = async (e) => {
  if (e?.detail && Array.isArray(e.detail)) {
    availableTopicDashboards.value = e.detail;
  } else {
    await loadTopicDashboards();
  }
  await personnelStore.loadSettings();
  await loadAllCustomTablesData();
};

watch(
  () => route.params.id,
  async () => {
    await loadCustomDashboardPages();
    await loadCustomGroups();
    if (dashboardId.value === 'root' && (!customGroups.value || customGroups.value.length === 0)) {
      await reconcileGroupsWithTopics(true);
    }
  }
);

onMounted(async () => {
  window.addEventListener('custom-dashboards-updated', handleCustomDashboardsUpdated);
  window.addEventListener('custom-dashboard-pages-updated', loadCustomDashboardPages);
  window.addEventListener('system-branding-updated', onSystemBrandingUpdated);
  loadSystemBranding();
  await loadCustomDashboardPages();
  await Promise.all([
    personnelStore.loadSettings(),
    personnelStore.fetchPersonnel(),
    loadDashboardSettings(),
    loadTopicDashboards(),
    loadCustomGroups(),
    loadDeletedTopicGroupIds(),
  ]);
  // Chỉ tự động khởi tạo nhóm ban đầu cho Dashboard chính nếu chưa từng có cấu hình nào
  if (dashboardId.value === 'root' && (!customGroups.value || customGroups.value.length === 0)) {
    await reconcileGroupsWithTopics(true);
  }
});

onUnmounted(() => {
  window.removeEventListener('custom-dashboards-updated', handleCustomDashboardsUpdated);
  window.removeEventListener('custom-dashboard-pages-updated', loadCustomDashboardPages);
  window.removeEventListener('system-branding-updated', onSystemBrandingUpdated);
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
  height: 32px;
  padding: 0 12px;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  box-sizing: border-box;
  white-space: nowrap;
  transition: all 0.15s ease;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.btn-add-widget-green:hover {
  background: #1b5e20;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.btn-secondary-action {
  background: #ffffff;
  color: #334155;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  height: 32px;
  padding: 0 10px;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  box-sizing: border-box;
  white-space: nowrap;
  transition: all 0.15s ease;
}

.btn-secondary-action:hover {
  background: #f8fafc;
  border-color: #94a3b8;
}

/* Nút icon vuông bo góc nhẹ đồng bộ chuẩn 32px x 32px */
.btn-icon-square {
  width: 32px;
  height: 32px;
  min-width: 32px;
  max-width: 32px;
  padding: 0;
  margin: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  color: #475569;
  cursor: pointer;
  box-sizing: border-box;
  transition: all 0.15s ease;
  flex-shrink: 0;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.btn-icon-square:hover:not(:disabled) {
  background: #f1f5f9;
  border-color: #94a3b8;
  color: #1e293b;
}

.btn-icon-square:disabled {
  opacity: 0.35;
  cursor: not-allowed;
  background: #f8fafc;
  border-color: #e2e8f0;
}

.btn-icon-square.btn-danger {
  border-color: #fecaca;
  background: #ffffff;
  color: #dc2626;
}

.btn-icon-square.btn-danger:hover:not(:disabled) {
  background: #fee2e2;
  border-color: #ef4444;
  color: #b91c1c;
}

.btn-icon-square i {
  font-size: 0.85rem;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  margin: 0;
  padding: 0;
  text-align: center;
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

.column-segment-stacked {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: height 0.4s ease, filter 0.2s ease;
  position: relative;
  cursor: pointer;
}

.column-segment-stacked:hover {
  filter: brightness(1.22);
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.35);
  z-index: 2;
}

.column-segment-stacked-h {
  transition: width 0.4s ease, filter 0.2s ease;
}

.column-segment-stacked-h:hover {
  filter: brightness(1.22);
  opacity: 0.92;
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
.drilldown-clickable-table :deep(tbody tr) {
  cursor: pointer;
  transition: background-color 0.12s ease;
}
.drilldown-clickable-table :deep(tbody tr:hover) {
  background-color: #f0fdf4 !important;
}
</style>
