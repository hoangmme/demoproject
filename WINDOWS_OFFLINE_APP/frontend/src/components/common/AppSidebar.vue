<template>
  <aside
    class="app-sidebar"
    style="position: relative; overflow: hidden;"
    :style="{
      backgroundColor: sidebarCustomColor || '#889962',
      '--sidebar-bg': sidebarCustomColor || '#889962',
      '--sidebar-text-color': sidebarCustomTextColor || '#000000',
      '--sidebar-heading-color': sidebarCustomTextColor || '#1a2e05',
    }"
  >
    <!-- Lớp phủ ảnh nền tùy biến cover với độ trong suốt tùy chỉnh -->
    <div
      v-if="sidebarCustomBg"
      class="sidebar-bg-layer"
      :style="{
        backgroundImage: `url(${sidebarCustomBg})`,
        opacity: Number(sidebarBgOpacity) / 100
      }"
    ></div>

    <div class="app-sidebar-header" style="position: relative; z-index: 1; padding: 1.15rem 0.5rem; text-align: center;">
      <img
        :src="systemBranding.logoUrl || '/bo-cong-an-logo.png'"
        alt="Logo"
        style="width: 85px; height: 85px; object-fit: contain; margin-bottom: 8px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));"
      />
      <!-- Khối 1: Phiên hiệu đơn vị (2 dòng gắn kết chặt chẽ thành 1 khối) -->
      <div class="sidebar-header-org" style="display: flex; flex-direction: column; gap: 2px; margin: 0; padding: 0;">
        <div
          style="font-size: 0.76rem; font-weight: 800; text-transform: uppercase; line-height: 1.15; white-space: nowrap; margin: 0; padding: 0;"
          :style="{ color: sidebarOrgTextColor || sidebarCustomTextColor || '#000000' }"
        >
          {{ systemBranding.orgNameLine1 || 'CÔNG AN THÀNH PHỐ HỒ CHÍ MINH' }}
        </div>
        <div
          style="font-size: 0.76rem; font-weight: 800; line-height: 1.15; white-space: nowrap; margin: 0; padding: 0;"
          :style="{ color: sidebarOrgTextColor || sidebarCustomTextColor || '#000000' }"
        >
          {{ systemBranding.orgNameLine2 || 'PHÒNG AN NINH CHÍNH TRỊ NỘI BỘ' }}
        </div>
      </div>
    </div>

    <nav class="app-sidebar-nav" style="position: relative; z-index: 1;">
      <!-- THỐNG KÊ (DASHBOARDS) -->
      <div class="sidebar-item-row">
        <router-link to="/dashboard" class="app-nav-item" :title="systemBranding.menuLabelDashboard || 'Thống kê'">
          <i class="pi pi-chart-pie"></i>
          <span>{{ systemBranding.menuLabelDashboard || 'Thống kê' }}</span>
        </router-link>
        <button
          type="button"
          class="sidebar-item-action-btn"
          @click.stop="openRenameDashboardDialog"
          title="Đổi tên menu Thống kê"
        >
          <i class="pi pi-ellipsis-v"></i>
        </button>
      </div>

      <!-- Danh sách các Trang Thống kê tự tạo (Custom Dashboards) -->
      <template v-if="customDashboardPages.length > 0">
        <div
          v-for="dash in customDashboardPages"
          :key="dash.id"
          class="sidebar-item-row"
        >
          <router-link
            :to="`/dashboard/${dash.id}`"
            class="app-nav-item"
            :title="dash.title"
          >
            <i :class="dash.icon ? `pi ${dash.icon}` : 'pi pi-chart-pie'" style="color: #0284c7;"></i>
            <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
              {{ dash.title }}
            </span>
          </router-link>
          <div class="sidebar-item-actions">
            <button
              type="button"
              class="sidebar-item-action-btn"
              @click.stop="openEditDashboardPageDialog(dash)"
              title="Đổi tên trang thống kê này"
            >
              <i class="pi pi-pencil"></i>
            </button>
            <button
              type="button"
              class="sidebar-item-action-btn action-btn-danger"
              @click.stop="confirmDeleteDashboardPage(dash)"
              title="Xóa trang thống kê này"
            >
              <i class="pi pi-trash"></i>
            </button>
          </div>
        </div>
      </template>

      <!-- TIÊU ĐỀ BẢNG DỮ LIỆU & NÚT + TÙY CHỌN -->
      <div class="app-nav-heading" style="display: flex; justify-content: space-between; align-items: center; padding-right: 12px;">
        <span>{{ systemBranding.sectionLabelTopics || 'Bảng dữ liệu (Tables)' }}</span>
        <button
          type="button"
          class="btn-heading-add"
          @click.stop="isAddChooserDialogOpen = true"
          title="Tạo Bảng mới hoặc Thống kê mới"
        >
          <i class="pi pi-plus" style="font-weight: 800;"></i>
        </button>
      </div>

      <!-- Bảng 1: Cán bộ (Table 1 trong Base) -->
      <div class="sidebar-item-row">
        <router-link to="/personnel" class="app-nav-item" :title="systemBranding.menuLabelPersonnel || 'Cán bộ'">
          <i class="pi pi-table" style="color: #0284c7;"></i>
          <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            {{ systemBranding.menuLabelPersonnel || 'Cán bộ' }} ({{ personnelStore.personnelList.length }})
          </span>
        </router-link>
        <div class="sidebar-item-actions">
          <button
            type="button"
            class="sidebar-item-action-btn"
            @click.stop="openRenameFixedTableDialog('personnel')"
            title="Đổi tên bảng Cán bộ"
          >
            <i class="pi pi-pencil"></i>
          </button>
          <button
            type="button"
            class="sidebar-item-action-btn action-btn-danger"
            @click.stop="confirmDeleteFixedTable('personnel')"
            title="Xóa toàn bộ dữ liệu Cán bộ"
          >
            <i class="pi pi-trash"></i>
          </button>
        </div>
      </div>

      <!-- Bảng 2: Thân nhân (Table 2 độc lập) -->
      <div
        v-if="personnelStore.relativesList.length > 0 || systemBranding.showSecondaryInputs"
        class="sidebar-item-row"
      >
        <router-link
          to="/relatives"
          class="app-nav-item"
          :title="systemBranding.menuLabelRelatives || 'Thân nhân'"
        >
          <i class="pi pi-users" style="color: #a855f7;"></i>
          <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            {{ systemBranding.menuLabelRelatives || 'Thân nhân' }} ({{ personnelStore.relativesList.length }})
          </span>
        </router-link>
        <div class="sidebar-item-actions">
          <button
            type="button"
            class="sidebar-item-action-btn"
            @click.stop="openRenameFixedTableDialog('relatives')"
            title="Đổi tên bảng Thân nhân"
          >
            <i class="pi pi-pencil"></i>
          </button>
          <button
            type="button"
            class="sidebar-item-action-btn action-btn-danger"
            @click.stop="confirmDeleteFixedTable('relatives')"
            title="Xóa toàn bộ dữ liệu Thân nhân"
          >
            <i class="pi pi-trash"></i>
          </button>
        </div>
      </div>

      <!-- Bảng 3: Chuyến đi (Table 3 độc lập) -->
      <div class="sidebar-item-row">
        <router-link
          to="/trips"
          class="app-nav-item"
          :title="systemBranding.menuLabelTrips || 'Chuyến đi'"
        >
          <i class="pi pi-send" style="color: #10b981;"></i>
          <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            {{ systemBranding.menuLabelTrips || 'Chuyến đi' }} ({{ totalTripsCount }})
          </span>
        </router-link>
        <div class="sidebar-item-actions">
          <button
            type="button"
            class="sidebar-item-action-btn"
            @click.stop="openRenameFixedTableDialog('trips')"
            title="Đổi tên bảng Chuyến đi"
          >
            <i class="pi pi-pencil"></i>
          </button>
          <button
            type="button"
            class="sidebar-item-action-btn action-btn-danger"
            @click.stop="confirmDeleteFixedTable('trips')"
            title="Xóa toàn bộ dữ liệu Chuyến đi"
          >
            <i class="pi pi-trash"></i>
          </button>
        </div>
      </div>

      <!-- Các Bảng tùy chỉnh (Custom Tables) -->
      <div
        v-for="dash in topicDashboards"
        :key="dash.id"
        class="sidebar-item-row"
      >
        <router-link
          :to="getDashboardRoute(dash)"
          class="app-nav-item"
          :title="dash.title"
        >
          <i :class="dash.icon ? `pi ${dash.icon}` : 'pi pi-table'"></i>
          <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            {{ dash.title }}
          </span>
        </router-link>
        <div class="sidebar-item-actions">
          <button
            type="button"
            class="sidebar-item-action-btn"
            @click.stop="openEditTableDialog(dash)"
            title="Đổi tên bảng"
          >
            <i class="pi pi-pencil"></i>
          </button>
          <button
            type="button"
            class="sidebar-item-action-btn action-btn-danger"
            @click.stop="confirmDeleteTable(dash)"
            title="Xóa bảng này"
          >
            <i class="pi pi-trash"></i>
          </button>
        </div>
      </div>

      <!-- KHỐI NHẬP LIỆU (TINH GỌN & ĐỒNG BỘ ĐA BẢNG) -->
      <div class="app-nav-heading" style="display: flex; align-items: center; justify-content: space-between; padding-right: 12px;">
        <span>Nhập liệu</span>
        <button
          type="button"
          class="btn-sidebar-add-record"
          @click="isDynamicDataEntryOpen = true"
          title="Nhập liệu bản ghi mới (Chọn bảng & liên kết)"
        >
          <i class="pi pi-plus" style="font-size: 0.65rem;"></i>
        </button>
      </div>

      <a class="app-nav-item" href="javascript:void(0)" @click="isDynamicDataEntryOpen = true" title="Nhập liệu bản ghi mới cho bất kỳ bảng nào trong hệ thống">
        <i class="pi pi-plus-circle" style="color: #0284c7;"></i>
        <span>+ Nhập liệu mới</span>
      </a>

      <div class="app-nav-heading" v-if="appendixDashboards.length > 0">Báo cáo phụ lục</div>

      <router-link
        v-for="pl in appendixDashboards"
        :key="pl.id"
        :to="getAppendixRoute(pl)"
        class="app-nav-item"
        :title="pl.title"
      >
        <i :class="pl.icon ? `pi ${pl.icon}` : 'pi pi-table'"></i>
        <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
          {{ pl.title }}
        </span>
      </router-link>

      <template v-if="authStore.isAdmin">
        <div class="app-nav-heading">Hệ thống</div>

        <router-link to="/users" class="app-nav-item">
          <i class="pi pi-user-plus"></i>
          <span>Quản lý người dùng</span>
        </router-link>

        <router-link to="/audit" class="app-nav-item">
          <i class="pi pi-history"></i>
          <span>Nhật ký hệ thống</span>
        </router-link>

        <router-link to="/settings-import" class="app-nav-item" title="Cài đặt chung & Cấu hình cột">
          <i class="pi pi-cog"></i>
          <span>Cài đặt chung (Cấu hình)</span>
        </router-link>
      </template>
    </nav>

    <!-- Dialog 1: Chọn Cán bộ để Thêm Thân nhân mới -->
    <Dialog
      v-model:visible="isRelativeSelectOpen"
      modal
      header="Thêm Thân nhân mới"
      :style="{ width: '500px' }"
    >
      <div style="display: flex; flex-direction: column; gap: 12px; padding: 4px 0;">
        <p style="font-size: 0.82rem; color: #475569; margin: 0;">
          Vui lòng chọn {{ systemBranding.menuLabelPersonnel || 'Cán bộ' }} để thêm thân nhân mới vào hồ sơ:
        </p>

        <div>
          <label style="font-size: 0.78rem; font-weight: 700; color: #334155; display: block; margin-bottom: 4px;">
            Chọn {{ systemBranding.menuLabelPersonnel || 'Cán bộ' }} liên quan: <span style="color: red;">*</span>
          </label>
          <select
            v-model="selectedParentCccdForRelative"
            style="width: 100%; font-size: 0.82rem; padding: 7px 10px; border-radius: 6px; border: 1px solid #cbd5e1; outline: none;"
          >
            <option value="">-- Chọn {{ systemBranding.menuLabelPersonnel || 'Cán bộ' }} từ danh sách --</option>
            <option
              v-for="p in personnelStore.personnelList"
              :key="p.id"
              :value="p.cccd || p.cccdparent || p.id"
            >
              {{ p.name }} - {{ p.positionName || p.position || 'Cán bộ' }} (CCCD: {{ p.cccd || p.cccdparent || '-' }})
            </option>
          </select>
        </div>
      </div>

      <template #footer>
        <Button label="Hủy" severity="secondary" text size="small" @click="isRelativeSelectOpen = false" />
        <Button
          :label="'Tiến hành Nhập ' + (systemBranding.menuLabelRelatives || 'thân nhân')"
          icon="pi pi-arrow-right"
          severity="primary"
          size="small"
          :disabled="!selectedParentCccdForRelative"
          @click="confirmRelativeNavigate"
        />
      </template>
    </Dialog>

    <!-- Dialog 2: Chọn đối tượng để Thêm Chuyến đi Nước ngoài -->
    <Dialog
      v-model:visible="isQuickTripSelectOpen"
      modal
      :header="'Thêm ' + (systemBranding.menuLabelTrips || 'Chuyến đi Nước ngoài')"
      :style="{ width: '520px' }"
    >
      <div style="display: flex; flex-direction: column; gap: 14px; padding: 4px 0;">
        <div>
          <label style="font-size: 0.78rem; font-weight: 700; color: #475569; display: block; margin-bottom: 6px;">
            1. ĐỐI TƯỢNG:
          </label>
          <div style="display: flex; gap: 18px; align-items: center; background: #f8fafc; padding: 8px 12px; border-radius: 6px; border: 1px solid #e2e8f0;">
            <label style="display: flex; align-items: center; gap: 6px; font-size: 0.82rem; cursor: pointer; font-weight: 600; color: #2563eb;">
              <input type="radio" value="personnel" v-model="quickTripType" style="accent-color: #2563eb;" />
              <span>👤 {{ systemBranding.menuLabelPersonnel || 'Cán bộ' }} (Cá nhân)</span>
            </label>
            <label style="display: flex; align-items: center; gap: 6px; font-size: 0.82rem; cursor: pointer; font-weight: 600; color: #7c3aed;">
              <input type="radio" value="relative" v-model="quickTripType" style="accent-color: #7c3aed;" />
              <span>👥 {{ systemBranding.menuLabelRelatives || 'Thân nhân' }} của {{ systemBranding.menuLabelPersonnel || 'Cán bộ' }}</span>
            </label>
          </div>
        </div>

        <div>
          <label style="font-size: 0.78rem; font-weight: 700; color: #475569; display: block; margin-bottom: 4px;">
            2. CHỌN {{ quickTripType === 'personnel' ? (systemBranding.menuLabelPersonnel || 'CÁN BỘ').toUpperCase() : (systemBranding.menuLabelRelatives || 'THÂN NHÂN').toUpperCase() }} LIÊN QUAN: <span style="color: red;">*</span>
          </label>
          
          <select v-if="quickTripType === 'personnel'" v-model="selectedQuickTripTargetKey" style="width: 100%; font-size: 0.82rem; padding: 7px 10px; border-radius: 6px; border: 1px solid #cbd5e1; outline: none;">
            <option value="">-- Chọn {{ systemBranding.menuLabelPersonnel || 'Cán bộ' }} từ danh sách --</option>
            <option v-for="p in personnelStore.personnelList" :key="p.id" :value="p.cccd || p.cccdparent || p.id">
              {{ p.name }} - {{ p.positionName || p.position || 'Cán bộ' }} (CCCD: {{ p.cccd || p.cccdparent || '-' }})
            </option>
          </select>

          <select v-else v-model="selectedQuickTripTargetKey" style="width: 100%; font-size: 0.82rem; padding: 7px 10px; border-radius: 6px; border: 1px solid #cbd5e1; outline: none;">
            <option value="">-- Chọn {{ systemBranding.menuLabelRelatives || 'Thân nhân' }} từ danh sách --</option>
            <option v-for="r in personnelStore.relativesList" :key="r.id || r.code" :value="r.code || r.id">
              {{ r.relativeName || r.name }} ({{ r.relationshipName }} của {{ r.parentName || r.parentPersonnelName }}) - CCCD: {{ r.cccd || r.cccdthannhan || '-' }}
            </option>
          </select>
        </div>
      </div>

      <template #footer>
        <Button label="Hủy" severity="secondary" text size="small" @click="isQuickTripSelectOpen = false" />
        <Button
          :label="'Tiến hành Nhập ' + (systemBranding.menuLabelTrips || 'chuyến đi')"
          icon="pi pi-arrow-right"
          severity="primary"
          size="small"
          :disabled="!selectedQuickTripTargetKey"
          @click="confirmQuickTripNavigate"
        />
      </template>
    </Dialog>

    <!-- Dialog Thêm Bảng / Chuyên đề mới từ Sidebar -->
    <Dialog
      v-model:visible="isAddTableDialogOpen"
      modal
      header="Thêm Bảng / Chuyên đề Mới"
      :style="{ width: '480px' }"
    >
      <div style="display: flex; flex-direction: column; gap: 14px; padding: 8px 0;">
        <div class="field-item">
          <label style="font-size: 0.8rem; font-weight: 700; color: #1e293b; display: block; margin-bottom: 4px;">
            Tên Bảng / Chuyên đề <span style="color: #ef4444;">*</span>
          </label>
          <InputText
            v-model="newTableForm.title"
            placeholder="VD: Danh sách Học sinh giỏi, Giáo viên chủ nhiệm..."
            style="width: 100%; font-size: 0.85rem;"
            autofocus
            @keyup.enter="saveNewTable"
          />
        </div>

        <div class="field-item">
          <label style="font-size: 0.8rem; font-weight: 700; color: #1e293b; display: block; margin-bottom: 4px;">
            Loại Bảng dữ liệu:
          </label>
          <select v-model="newTableForm.source" class="settings-select" style="width: 100%; font-size: 0.82rem; height: 36px; padding: 4px 8px; border: 1px solid #cbd5e1; border-radius: 6px; background: #fff;">
            <option value="blank">📋 Bảng trống mới (Chuẩn Lark Base - Vài cột mẫu, không có dữ liệu cũ)</option>
            <option value="personnel">👤 Kế thừa dữ liệu Cán bộ</option>
            <option value="trips">✈️ Kế thừa dữ liệu Chuyến đi</option>
            <option value="relatives">👥 Kế thừa dữ liệu Thân nhân</option>
          </select>
          <span style="font-size: 0.72rem; color: #64748b; margin-top: 4px; display: block;">
            💡 Chọn "Bảng trống mới" để bắt đầu bảng trắng với các cột tượng trưng và tự do thêm dữ liệu riêng.
          </span>
        </div>

        <div class="field-item">
          <label style="font-size: 0.8rem; font-weight: 700; color: #1e293b; display: block; margin-bottom: 4px;">
            Biểu tượng (Icon):
          </label>
          <select v-model="newTableForm.icon" class="settings-select" style="width: 100%; font-size: 0.82rem; height: 36px; padding: 4px 8px; border: 1px solid #cbd5e1; border-radius: 6px; background: #fff;">
            <option value="pi-table">📋 Bảng dữ liệu (pi-table)</option>
            <option value="pi-folder">📁 Thư mục / Chuyên đề (pi-folder)</option>
            <option value="pi-users">👥 Danh sách người dùng (pi-users)</option>
            <option value="pi-bookmark">🔖 Dấu trang quan trọng (pi-bookmark)</option>
            <option value="pi-star">⭐ Danh sách nổi bật (pi-star)</option>
            <option value="pi-chart-bar">📊 Thống kê / Báo cáo (pi-chart-bar)</option>
            <option value="pi-tag">🏷️ Phân loại / Thẻ (pi-tag)</option>
            <option value="pi-send">✈️ Sự kiện / Chuyến đi (pi-send)</option>
          </select>
        </div>

        <div class="field-item">
          <label style="font-size: 0.8rem; font-weight: 700; color: #1e293b; display: block; margin-bottom: 4px;">
            Mô tả / Ghi chú (Tùy chọn):
          </label>
          <InputText
            v-model="newTableForm.description"
            placeholder="Ghi chú về mục đích sử dụng bảng này..."
            style="width: 100%; font-size: 0.85rem;"
          />
        </div>
      </div>

      <template #footer>
        <div style="display: flex; justify-content: flex-end; gap: 8px; width: 100%;">
          <Button label="Hủy" severity="secondary" text size="small" @click="isAddTableDialogOpen = false" />
          <Button label="Tạo Bảng" icon="pi pi-check" severity="success" size="small" @click="saveNewTable" />
        </div>
      </template>
    </Dialog>

    <!-- Dialog Đổi tên Bảng / Thống kê chung -->
    <Dialog
      v-model:visible="isRenameDialogOpen"
      modal
      :header="getRenameModalTitle()"
      :style="{ width: '440px' }"
    >
      <div style="display: flex; flex-direction: column; gap: 12px; padding: 6px 0;">
        <label style="font-size: 0.8rem; font-weight: 700; color: #1e293b;">
          Tên hiển thị mới: <span style="color: red;">*</span>
        </label>
        <InputText
          v-model="renameForm.newTitle"
          placeholder="Nhập tên mới..."
          style="width: 100%; font-size: 0.85rem;"
          autofocus
          @keyup.enter="saveRename"
        />
      </div>
      <template #footer>
        <Button label="Hủy" severity="secondary" text size="small" @click="isRenameDialogOpen = false" />
        <Button label="Lưu thay đổi" icon="pi pi-check" severity="primary" size="small" @click="saveRename" />
      </template>
    </Dialog>

    <!-- Dialog Cảnh Báo Nguy Hiểm: Xóa Dữ Liệu Bảng Chính -->
    <Dialog
      v-model:visible="isDeleteFixedTableDialogOpen"
      modal
      header="⚠️ CẢNH BÁO NGUY HIỂM: XÓA TOÀN BỘ BẢNG"
      :style="{ width: '480px' }"
    >
      <div style="display: flex; flex-direction: column; gap: 12px; padding: 6px 0;">
        <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 12px; display: flex; gap: 10px; align-items: flex-start;">
          <i class="pi pi-exclamation-triangle" style="color: #dc2626; font-size: 1.25rem; margin-top: 2px;"></i>
          <div style="font-size: 0.8rem; color: #991b1b; line-height: 1.45;">
            <strong>Hành động này không thể hoàn tác!</strong><br />
            Bạn đang chuẩn bị xóa toàn bộ dữ liệu của bảng <strong>"{{ deleteFixedTableTargetName }}"</strong> 
            (Bao gồm <span style="font-weight: 700; text-decoration: underline;">{{ deleteFixedTableCount }} bản ghi</span>).
          </div>
        </div>

        <p style="font-size: 0.8rem; color: #475569; margin: 0;">
          Để xác nhận, vui lòng gõ chính xác chữ <strong style="color: #dc2626; letter-spacing: 1px;">XOA</strong> vào ô bên dưới:
        </p>

        <InputText
          v-model="deleteFixedTableConfirmText"
          placeholder="Nhập chữ XOA để xác nhận..."
          style="width: 100%; font-size: 0.85rem; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;"
          autofocus
        />
      </div>
      <template #footer>
        <Button label="Hủy bỏ" severity="secondary" text size="small" @click="isDeleteFixedTableDialogOpen = false" />
        <Button
          :disabled="deleteFixedTableConfirmText !== 'XOA' || isDeletingFixedTable"
          :loading="isDeletingFixedTable"
          label="Xác nhận XÓA VĨNH VIỄN"
          icon="pi pi-trash"
          severity="danger"
          size="small"
          @click="executeDeleteFixedTable"
        />
      </template>
    </Dialog>

    <!-- Dialog Thêm Trang Thống Kê Mới từ Sidebar -->
    <Dialog
      v-model:visible="isAddDashboardPageDialogOpen"
      modal
      header="Tạo Trang Thống kê Mới (Dashboard)"
      :style="{ width: '480px' }"
    >
      <div style="display: flex; flex-direction: column; gap: 14px; padding: 8px 0;">
        <div class="field-item">
          <label style="font-size: 0.8rem; font-weight: 700; color: #1e293b; display: block; margin-bottom: 4px;">
            Tên Trang Thống kê <span style="color: #ef4444;">*</span>
          </label>
          <InputText
            v-model="newDashboardPageForm.title"
            placeholder="VD: Thống kê Đảng & Đoàn thể, Thống kê Quý III..."
            style="width: 100%; font-size: 0.85rem;"
            autofocus
            @keyup.enter="saveNewDashboardPage"
          />
        </div>
        <div class="field-item">
          <label style="font-size: 0.8rem; font-weight: 700; color: #1e293b; display: block; margin-bottom: 4px;">
            Mô tả tóm tắt (Tùy chọn):
          </label>
          <InputText
            v-model="newDashboardPageForm.description"
            placeholder="Mô tả mục đích của trang thống kê..."
            style="width: 100%; font-size: 0.85rem;"
          />
        </div>
      </div>
      <template #footer>
        <div style="display: flex; justify-content: flex-end; gap: 8px; width: 100%;">
          <Button label="Hủy" severity="secondary" text size="small" @click="isAddDashboardPageDialogOpen = false" />
          <Button label="Tạo Trang Thống kê" icon="pi pi-check" severity="primary" size="small" @click="saveNewDashboardPage" />
        </div>
      </template>
    </Dialog>

    <!-- Dialog Lựa chọn Tạo mới (Bảng dữ liệu vs Khối Thống kê) -->
    <Dialog
      v-model:visible="isAddChooserDialogOpen"
      modal
      header="Tạo mới trong Không gian làm việc"
      :style="{ width: '440px' }"
    >
      <div style="display: flex; flex-direction: column; gap: 10px; padding: 6px 0;">
        <div
          class="create-choice-card"
          @click="isAddChooserDialogOpen = false; openAddTableDialog();"
        >
          <div class="choice-icon-box" style="background: #ecfdf5; color: #059669;">
            <i class="pi pi-table" style="font-size: 1.25rem;"></i>
          </div>
          <div style="flex: 1;">
            <div style="font-weight: 700; font-size: 0.9rem; color: #0f172a; margin-bottom: 2px;">
              Bảng dữ liệu mới (Table)
            </div>
            <div style="font-size: 0.76rem; color: #64748b; line-height: 1.35;">
              Tạo bảng dữ liệu dạng lưới Grid để quản lý danh sách hồ sơ, cán bộ, dữ liệu
            </div>
          </div>
          <i class="pi pi-chevron-right" style="color: #94a3b8; font-size: 0.8rem;"></i>
        </div>

        <div
          class="create-choice-card"
          @click="isAddChooserDialogOpen = false; openAddDashboardPageDialog();"
        >
          <div class="choice-icon-box" style="background: #eff6ff; color: #2563eb;">
            <i class="pi pi-chart-pie" style="font-size: 1.25rem;"></i>
          </div>
          <div style="flex: 1;">
            <div style="font-weight: 700; font-size: 0.9rem; color: #0f172a; margin-bottom: 2px;">
              Trang Thống kê mới (Dashboard)
            </div>
            <div style="font-size: 0.76rem; color: #64748b; line-height: 1.35;">
              Tạo trang biểu đồ, thẻ chỉ số KPI tổng hợp và phân tích dữ liệu trực quan
            </div>
          </div>
          <i class="pi pi-chevron-right" style="color: #94a3b8; font-size: 0.8rem;"></i>
        </div>
      </div>
    </Dialog>

    <!-- Dialog Nhập Liệu Bản Ghi Mới Đa Năng -->
    <TableDataEntryDialog v-model="isDynamicDataEntryOpen" />
  </aside>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import TableDataEntryDialog from '@/components/common/TableDataEntryDialog.vue';
import { useAuthStore } from '@/stores/auth';
import { usePersonnelStore } from '@/stores/personnel';
import { getAppSettings, saveAppSettings } from '@/api/settings';
import { buildTopicSourceList } from '@/utils/dashboardMetrics';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const personnelStore = usePersonnelStore();

// Dialog Nhập liệu mới đa hình
const isDynamicDataEntryOpen = ref(false);

// Dialog lựa chọn Tạo mới (Bảng vs Thống kê)
const isAddChooserDialogOpen = ref(false);

// Tổng số chuyến đi hiển thị trên Sidebar
const totalTripsCount = computed(() => {
  if (personnelStore.tripsList && personnelStore.tripsList.length > 0) {
    return personnelStore.tripsList.length;
  }
  return buildTopicSourceList('trips', personnelStore).length;
});

// Quản lý các Trang Thống kê tự tạo trên Sidebar (Custom Dashboards)
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

// Quản lý Tạo Trang Thống kê mới từ Sidebar
const isAddDashboardPageDialogOpen = ref(false);
const newDashboardPageForm = ref({
  title: '',
  description: '',
});

const openAddDashboardPageDialog = () => {
  newDashboardPageForm.value = {
    title: '',
    description: '',
  };
  isAddDashboardPageDialogOpen.value = true;
};

const saveNewDashboardPage = async () => {
  if (!newDashboardPageForm.value.title?.trim()) {
    alert('Vui lòng nhập tên Trang Thống kê!');
    return;
  }
  const newId = 'dash_' + Date.now();
  const newPage = {
    id: newId,
    title: newDashboardPageForm.value.title.trim(),
    description: newDashboardPageForm.value.description || '',
    icon: 'pi-chart-pie',
    createdAt: new Date().toISOString(),
  };
  const list = [...customDashboardPages.value, newPage];
  customDashboardPages.value = list;
  try { localStorage.setItem('custom_dashboard_pages', JSON.stringify(list)); } catch (e) {}
  await saveAppSettings('custom_dashboard_pages', list);
  window.dispatchEvent(new CustomEvent('custom-dashboard-pages-updated', { detail: list }));
  isAddDashboardPageDialogOpen.value = false;
  router.push(`/dashboard/${newId}`);
};

// Quản lý Đổi tên & Xóa Bảng / Thống kê
const isRenameDialogOpen = ref(false);
const renameForm = ref({
  type: '',
  targetId: '',
  currentTitle: '',
  newTitle: '',
});

const getRenameModalTitle = () => {
  const { type, currentTitle } = renameForm.value;
  if (type === 'fixed_personnel' || type === 'fixed_relatives' || type === 'fixed_trips' || type === 'custom_table') {
    return `Đổi tên Bảng "${currentTitle}"`;
  }
  if (type === 'fixed_dashboard') {
    return `Đổi tên Menu Thống kê`;
  }
  if (type === 'custom_dashboard_page') {
    return `Đổi tên Trang Thống kê "${currentTitle}"`;
  }
  return 'Đổi tên';
};

const openRenameFixedTableDialog = (type) => {
  let title = 'Cán bộ';
  if (type === 'relatives') title = systemBranding.value.menuLabelRelatives || 'Thân nhân';
  else if (type === 'trips') title = systemBranding.value.menuLabelTrips || 'Chuyến đi';
  else if (type === 'personnel') title = systemBranding.value.menuLabelPersonnel || 'Cán bộ';

  renameForm.value = {
    type: `fixed_${type}`,
    targetId: type,
    currentTitle: title,
    newTitle: title,
  };
  isRenameDialogOpen.value = true;
};

const openRenameDashboardDialog = () => {
  const title = systemBranding.value.menuLabelDashboard || 'Thống kê';
  renameForm.value = {
    type: 'fixed_dashboard',
    targetId: 'dashboard',
    currentTitle: title,
    newTitle: title,
  };
  isRenameDialogOpen.value = true;
};

const openEditTableDialog = (dash) => {
  renameForm.value = {
    type: 'custom_table',
    targetId: dash.id,
    currentTitle: dash.title,
    newTitle: dash.title,
  };
  isRenameDialogOpen.value = true;
};

const openEditDashboardPageDialog = (dash) => {
  renameForm.value = {
    type: 'custom_dashboard_page',
    targetId: dash.id,
    currentTitle: dash.title,
    newTitle: dash.title,
  };
  isRenameDialogOpen.value = true;
};

const saveRename = async () => {
  const newName = renameForm.value.newTitle?.trim();
  if (!newName) {
    alert('Vui lòng nhập tên mới!');
    return;
  }
  const { type, targetId } = renameForm.value;

  if (type === 'fixed_personnel') {
    systemBranding.value.menuLabelPersonnel = newName;
    await saveSystemBranding();
  } else if (type === 'fixed_relatives') {
    systemBranding.value.menuLabelRelatives = newName;
    await saveSystemBranding();
  } else if (type === 'fixed_trips') {
    systemBranding.value.menuLabelTrips = newName;
    await saveSystemBranding();
  } else if (type === 'fixed_dashboard') {
    systemBranding.value.menuLabelDashboard = newName;
    await saveSystemBranding();
  } else if (type === 'custom_table') {
    const list = [...dynamicDashboards.value];
    const idx = list.findIndex((d) => d.id === targetId);
    if (idx !== -1) {
      list[idx] = { ...list[idx], title: newName };
      dynamicDashboards.value = list;
      try { localStorage.setItem('custom_dashboards_config', JSON.stringify(list)); } catch (e) {}
      await saveAppSettings('custom_dashboards_config', list);
      window.dispatchEvent(new CustomEvent('custom-dashboards-updated', { detail: list }));
    }
  } else if (type === 'custom_dashboard_page') {
    const list = [...customDashboardPages.value];
    const idx = list.findIndex((d) => d.id === targetId);
    if (idx !== -1) {
      list[idx] = { ...list[idx], title: newName };
      customDashboardPages.value = list;
      try { localStorage.setItem('custom_dashboard_pages', JSON.stringify(list)); } catch (e) {}
      await saveAppSettings('custom_dashboard_pages', list);
      window.dispatchEvent(new CustomEvent('custom-dashboard-pages-updated', { detail: list }));
    }
  }

  isRenameDialogOpen.value = false;
};

const saveSystemBranding = async () => {
  try {
    localStorage.setItem('system_branding_config', JSON.stringify(systemBranding.value));
  } catch (e) {}
  try {
    await saveAppSettings('system_branding_config', systemBranding.value);
  } catch (e) {}
  window.dispatchEvent(new CustomEvent('system-branding-updated', { detail: systemBranding.value }));
};

const confirmDeleteTable = async (dash) => {
  if (!confirm(`Bạn có chắc chắn muốn xóa Bảng "${dash.title}" không?`)) return;
  const list = dynamicDashboards.value.filter((d) => d.id !== dash.id);
  dynamicDashboards.value = list;
  try { localStorage.setItem('custom_dashboards_config', JSON.stringify(list)); } catch (e) {}
  await saveAppSettings('custom_dashboards_config', list);
  window.dispatchEvent(new CustomEvent('custom-dashboards-updated', { detail: list }));

  if (route.params.id === dash.id) {
    router.push('/personnel');
  }
};

const confirmDeleteDashboardPage = async (dash) => {
  if (!confirm(`Bạn có chắc chắn muốn xóa trang thống kê "${dash.title}" không?`)) return;
  const list = customDashboardPages.value.filter((d) => d.id !== dash.id);
  customDashboardPages.value = list;
  try { localStorage.setItem('custom_dashboard_pages', JSON.stringify(list)); } catch (e) {}
  await saveAppSettings('custom_dashboard_pages', list);
  try { localStorage.removeItem(`dashboard_custom_groups_${dash.id}`); } catch (e) {}
  window.dispatchEvent(new CustomEvent('custom-dashboard-pages-updated', { detail: list }));

  if (route.params.id === dash.id) {
    router.push('/dashboard');
  }
};

// Quản lý Xóa 3 Bảng chính (Cán bộ, Thân nhân, Chuyến đi)
const isDeleteFixedTableDialogOpen = ref(false);
const deleteFixedTableType = ref('');
const deleteFixedTableTargetName = ref('');
const deleteFixedTableCount = ref(0);
const deleteFixedTableConfirmText = ref('');
const isDeletingFixedTable = ref(false);

const confirmDeleteFixedTable = (type) => {
  deleteFixedTableType.value = type;
  deleteFixedTableConfirmText.value = '';

  if (type === 'personnel') {
    deleteFixedTableTargetName.value = systemBranding.value.menuLabelPersonnel || 'Cán bộ';
    deleteFixedTableCount.value = personnelStore.personnelList.length;
  } else if (type === 'relatives') {
    deleteFixedTableTargetName.value = systemBranding.value.menuLabelRelatives || 'Thân nhân';
    deleteFixedTableCount.value = personnelStore.relativesList.length;
  } else if (type === 'trips') {
    deleteFixedTableTargetName.value = systemBranding.value.menuLabelTrips || 'Chuyến đi';
    deleteFixedTableCount.value = totalTripsCount.value;
  }

  isDeleteFixedTableDialogOpen.value = true;
};

const executeDeleteFixedTable = async () => {
  if (deleteFixedTableConfirmText.value !== 'XOA') return;
  isDeletingFixedTable.value = true;

  try {
    const type = deleteFixedTableType.value;
    if (type === 'personnel') {
      const allIds = (personnelStore.personnelList || []).map((p) => p.id).filter(Boolean);
      if (allIds.length > 0) {
        await personnelStore.deleteMultiple(allIds);
      }
      alert('Đã xóa toàn bộ dữ liệu Cán bộ thành công!');
    } else if (type === 'relatives') {
      const allRelIds = (personnelStore.relativesList || []).map((r) => r.id || r.code).filter(Boolean);
      if (allRelIds.length > 0) {
        await personnelStore.deleteMultipleRelatives(allRelIds);
      }
      // Dọn sạch mảng relatives trong từng hồ sơ cán bộ nếu còn sót
      for (const p of personnelStore.personnelList) {
        if (p.relatives && p.relatives.length > 0) {
          const up = JSON.parse(JSON.stringify(p));
          up.relatives = [];
          if (up.custom_data) {
            try {
              const c = typeof up.custom_data === 'string' ? JSON.parse(up.custom_data) : up.custom_data;
              c.relatives = [];
              up.custom_data = c;
            } catch (e) {}
          }
          await personnelStore.savePerson(up);
        }
      }
      await personnelStore.fetchPersonnel();
      alert('Đã xóa toàn bộ dữ liệu Thân nhân thành công!');
    } else if (type === 'trips') {
      // Dọn sạch toàn bộ trips của cán bộ và thân nhân
      for (const p of personnelStore.personnelList) {
        let hasTrips = (p.trips && p.trips.length > 0);
        let custom = {};
        if (p.custom_data) {
          try {
            custom = typeof p.custom_data === 'string' ? JSON.parse(p.custom_data) : p.custom_data;
            if (custom.trips && custom.trips.length > 0) hasTrips = true;
            if (custom['Khối B: Chuyến đi nước ngoài']) hasTrips = true;
          } catch (e) {}
        }
        if (Array.isArray(p.relatives)) {
          p.relatives.forEach(r => {
            if (r.trips && r.trips.length > 0) hasTrips = true;
          });
        }

        if (hasTrips) {
          const up = JSON.parse(JSON.stringify(p));
          up.trips = [];
          if (Array.isArray(up.relatives)) {
            up.relatives.forEach(r => {
              r.trips = [];
            });
          }
          if (up.custom_data) {
            try {
              const c = typeof up.custom_data === 'string' ? JSON.parse(up.custom_data) : up.custom_data;
              c.trips = [];
              delete c['Khối B: Chuyến đi nước ngoài'];
              if (Array.isArray(c.relatives)) {
                c.relatives.forEach(r => { r.trips = []; });
              }
              up.custom_data = c;
            } catch (e) {}
          }
          await personnelStore.savePerson(up);
        }
      }
      await personnelStore.fetchPersonnel();
      alert('Đã xóa toàn bộ dữ liệu Chuyến đi thành công!');
    }

    isDeleteFixedTableDialogOpen.value = false;
    if (route.path === `/${type}`) {
      router.push('/personnel');
    }
  } catch (err) {
    console.error('Lỗi khi xóa bảng chính:', err);
    alert('Lỗi khi xóa bảng: ' + (err.message || err));
  } finally {
    isDeletingFixedTable.value = false;
  }
};

const isAddTableDialogOpen = ref(false);
const newTableForm = ref({
  title: '',
  source: 'personnel',
  icon: 'pi-table',
  description: '',
});

const openAddTableDialog = () => {
  newTableForm.value = {
    title: '',
    source: 'blank',
    icon: 'pi-table',
    description: '',
  };
  isAddTableDialogOpen.value = true;
};

const saveNewTable = async () => {
  if (!newTableForm.value.title?.trim()) {
    alert('Vui lòng nhập Tên Bảng / Chuyên đề!');
    return;
  }
  const newId = 'topic_' + Date.now();
  const isBlank = (newTableForm.value.source || 'blank') === 'blank';
  const newTable = {
    id: newId,
    code: `TB-${String((dynamicDashboards.value || []).length + 1).padStart(2, '0')}`,
    title: newTableForm.value.title.trim(),
    source: isBlank ? 'blank' : newTableForm.value.source,
    icon: newTableForm.value.icon || 'pi-table',
    description: newTableForm.value.description || '',
    metricCards: [
      { id: 'all', label: 'Toàn bộ', condition: 'all', color: 'blue' }
    ],
    scopeConditions: [],
    customColumns: isBlank ? [
      { id: 'title', label: 'Tiêu đề / Tên', format: 'text', width: '240px' },
      { id: 'status', label: 'Trạng thái', format: 'dropdown', options: ['Mới tạo', 'Đang xử lý', 'Hoàn thành'], width: '160px' },
      { id: 'notes', label: 'Ghi chú', format: 'text', width: '260px' },
      { id: 'createdAt', label: 'Ngày tạo', format: 'date', width: '140px' },
    ] : [],
  };

  const updatedList = [...(dynamicDashboards.value || []), newTable];
  dynamicDashboards.value = updatedList;

  try {
    localStorage.setItem('custom_dashboards_config', JSON.stringify(updatedList));
  } catch (e) {}

  try {
    await saveAppSettings('custom_dashboards_config', updatedList);
  } catch (e) {
    console.error('Error saving new table to DB:', e);
  }

  window.dispatchEvent(new CustomEvent('custom-dashboards-updated', { detail: updatedList }));

  isAddTableDialogOpen.value = false;
  router.push(`/dashboard-topic/${newId}`);
};

const isInputMenuOpen = ref(false);
const isRelativeSelectOpen = ref(false);
const selectedParentCccdForRelative = ref('');

const isQuickTripSelectOpen = ref(false);
const quickTripType = ref('personnel');
const selectedQuickTripTargetKey = ref('');

const DEFAULT_DASHBOARDS = [
  {
    id: 'trips',
    code: 'CD-03',
    title: 'Danh sách Chuyến đi',
    icon: 'pi-send',
    source: 'trips',
  },
];

// Cấu hình Nhận diện Hệ thống & Tên Menu (System Branding)
const DEFAULT_BRANDING = {
  logoUrl: '',
  orgNameLine1: 'CÔNG AN THÀNH PHỐ HỒ CHÍ MINH',
  orgNameLine2: 'PHÒNG AN NINH CHÍNH TRỊ NỘI BỘ',
  menuLabelDashboard: 'Thống kê',
  menuLabelPersonnel: 'Cán bộ',
  menuLabelRelatives: 'Thân nhân',
  menuLabelTrips: 'Chuyến đi',
};

const getInitialBranding = () => {
  try {
    const local = localStorage.getItem('system_branding_config');
    if (local) {
      const parsed = JSON.parse(local);
      if (parsed.menuLabelPersonnel === 'Bảng dữ liệu chính') {
        parsed.menuLabelPersonnel = 'Cán bộ';
      }
      return { ...DEFAULT_BRANDING, ...parsed };
    }
  } catch (e) {}
  return { ...DEFAULT_BRANDING };
};

const systemBranding = ref(getInitialBranding());

const loadSystemBranding = async () => {
  try {
    const saved = await getAppSettings('system_branding_config', null);
    if (saved && typeof saved === 'object') {
      if (saved.menuLabelPersonnel === 'Bảng dữ liệu chính') {
        saved.menuLabelPersonnel = 'Cán bộ';
      }
      systemBranding.value = { ...DEFAULT_BRANDING, ...saved };
      try { localStorage.setItem('system_branding_config', JSON.stringify(systemBranding.value)); } catch (e) {}
    }
  } catch (e) {
    console.warn('Error loading system branding in sidebar:', e);
  }
};

const onSystemBrandingUpdated = (e) => {
  if (e && e.detail) {
    systemBranding.value = { ...DEFAULT_BRANDING, ...e.detail };
  } else {
    loadSystemBranding();
  }
};

const getInitialDashboards = () => {
  try {
    const local = localStorage.getItem('custom_dashboards_config');
    if (local) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  return [...DEFAULT_DASHBOARDS];
};

const dynamicDashboards = ref(getInitialDashboards());

const topicDashboards = computed(() => {
  return (dynamicDashboards.value || []).filter((d) => d.displayMode !== 'appendix' && d.id !== 'trips');
});

const appendixDashboards = computed(() => {
  return (dynamicDashboards.value || []).filter((d) => d.displayMode === 'appendix');
});

const loadSidebarData = async () => {
  try {
    const savedDash = await getAppSettings('custom_dashboards_config', null);
    if (savedDash && Array.isArray(savedDash) && savedDash.length > 0) {
      dynamicDashboards.value = savedDash;
      try {
        localStorage.setItem('custom_dashboards_config', JSON.stringify(savedDash));
      } catch (e) {}
    }
  } catch (e) {
    console.error('Error loading sidebar dashboards:', e);
  }
};

const getDashboardRoute = (dash) => {
  if (dash.id === 'trips') return '/trips';
  return `/dashboard-topic/${dash.id}`;
};

const getAppendixRoute = (pl) => {
  return `/dashboard-topic/${pl.id}`;
};

const handleInputClick = (action) => {
  isInputMenuOpen.value = false;
  router.push({ path: '/personnel', query: { action } });
};

const openQuickRelativeDialog = () => {
  isInputMenuOpen.value = false;
  selectedParentCccdForRelative.value = personnelStore.personnelList.length > 0 ? (personnelStore.personnelList[0].cccd || personnelStore.personnelList[0].id) : '';
  isRelativeSelectOpen.value = true;
};

const confirmRelativeNavigate = () => {
  if (!selectedParentCccdForRelative.value) return;
  isRelativeSelectOpen.value = false;
  router.push({
    path: '/relatives',
    query: {
      action: 'new_relative',
      targetCccd: selectedParentCccdForRelative.value,
    },
  });
};

const openQuickTripDialog = () => {
  isInputMenuOpen.value = false;
  quickTripType.value = 'personnel';
  selectedQuickTripTargetKey.value = personnelStore.personnelList.length > 0 ? (personnelStore.personnelList[0].cccd || personnelStore.personnelList[0].id) : '';
  isQuickTripSelectOpen.value = true;
};

const confirmQuickTripNavigate = () => {
  if (!selectedQuickTripTargetKey.value) return;
  isQuickTripSelectOpen.value = false;

  if (quickTripType.value === 'personnel') {
    router.push({
      path: '/personnel',
      query: { action: 'new_trip', targetCccd: selectedQuickTripTargetKey.value },
    });
  } else {
    const foundRel = personnelStore.relativesList.find((r) => r.code === selectedQuickTripTargetKey.value || r.id === selectedQuickTripTargetKey.value);
    const parentCccd = foundRel?.parentPersonnelCccd || foundRel?.cccdparent || (foundRel?.parentPersonnelId ? personnelStore.personnelList.find(p => p.id === foundRel.parentPersonnelId)?.cccd : '') || '';
    router.push({
      path: '/personnel',
      query: {
        action: 'new_trip',
        targetCccd: parentCccd || selectedQuickTripTargetKey.value,
        targetRelativeCode: foundRel?.code || selectedQuickTripTargetKey.value,
      },
    });
  }
};

const sidebarCustomBg = ref(localStorage.getItem('sidebar_custom_bg') || '');
const sidebarBgOpacity = ref(Number(localStorage.getItem('sidebar_bg_opacity')) || 40);
const sidebarCustomColor = ref(localStorage.getItem('sidebar_custom_color') || '#889962');
const sidebarCustomTextColor = ref(localStorage.getItem('sidebar_custom_text_color') || '');
const sidebarOrgTextColor = ref(localStorage.getItem('sidebar_org_text_color') || '');
const sidebarSubtitleTextColor = ref(localStorage.getItem('sidebar_subtitle_text_color') || '');

const loadSidebarBg = async () => {
  try {
    const [bgRes, opRes, colRes, txtColRes, orgTxtColRes, subTxtColRes] = await Promise.allSettled([
      getAppSettings('sidebar_custom_bg', null),
      getAppSettings('sidebar_bg_opacity', null),
      getAppSettings('sidebar_custom_color', null),
      getAppSettings('sidebar_custom_text_color', null),
      getAppSettings('sidebar_org_text_color', null),
      getAppSettings('sidebar_subtitle_text_color', null),
    ]);

    if (bgRes.status === 'fulfilled') {
      const bg = bgRes.value;
      const val = bg ? (typeof bg === 'string' ? bg : (bg.value || '')) : '';
      sidebarCustomBg.value = val;
      try { localStorage.setItem('sidebar_custom_bg', val); } catch (e) {}
    }
    if (opRes.status === 'fulfilled' && opRes.value !== null && opRes.value !== undefined && opRes.value !== '') {
      sidebarBgOpacity.value = Number(opRes.value);
      try { localStorage.setItem('sidebar_bg_opacity', String(opRes.value)); } catch (e) {}
    }
    if (colRes.status === 'fulfilled' && colRes.value) {
      const col = typeof colRes.value === 'string' ? colRes.value : (colRes.value.value || '#889962');
      sidebarCustomColor.value = col;
      try { localStorage.setItem('sidebar_custom_color', col); } catch (e) {}
    }
    if (txtColRes.status === 'fulfilled' && txtColRes.value) {
      const txtCol = typeof txtColRes.value === 'string' ? txtColRes.value : (txtColRes.value.value || '');
      sidebarCustomTextColor.value = txtCol;
      try { localStorage.setItem('sidebar_custom_text_color', txtCol); } catch (e) {}
    }
    if (orgTxtColRes.status === 'fulfilled' && orgTxtColRes.value) {
      const orgCol = typeof orgTxtColRes.value === 'string' ? orgTxtColRes.value : (orgTxtColRes.value.value || '');
      sidebarOrgTextColor.value = orgCol;
      try { localStorage.setItem('sidebar_org_text_color', orgCol); } catch (e) {}
    }
    if (subTxtColRes.status === 'fulfilled' && subTxtColRes.value) {
      const subCol = typeof subTxtColRes.value === 'string' ? subTxtColRes.value : (subTxtColRes.value.value || '');
      sidebarSubtitleTextColor.value = subCol;
      try { localStorage.setItem('sidebar_subtitle_text_color', subCol); } catch (e) {}
    }
  } catch (e) {
    console.warn('Error loading sidebar background settings:', e);
  }
};

onMounted(() => {
  loadSystemBranding();
  loadSidebarBg();
  loadSidebarData();
  loadCustomDashboardPages();
  window.addEventListener('sidebar-bg-updated', loadSidebarBg);
  window.addEventListener('custom-dashboards-updated', loadSidebarData);
  window.addEventListener('custom-dashboard-pages-updated', loadCustomDashboardPages);
  window.addEventListener('system-branding-updated', onSystemBrandingUpdated);
});

onUnmounted(() => {
  window.removeEventListener('sidebar-bg-updated', loadSidebarBg);
  window.removeEventListener('custom-dashboards-updated', loadSidebarData);
  window.removeEventListener('custom-dashboard-pages-updated', loadCustomDashboardPages);
  window.removeEventListener('system-branding-updated', onSystemBrandingUpdated);
});
</script>

<style scoped>
.sidebar-bg-layer {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  pointer-events: none;
  z-index: 0;
  transition: opacity 0.25s ease;
}

.sidebar-input-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 12px;
  background: rgba(34, 197, 94, 0.18);
  border: 1px solid rgba(74, 222, 128, 0.35);
  border-radius: 8px;
  color: #ffffff;
  cursor: pointer;
  transition: all 0.2s ease;
}

.sidebar-input-btn:hover {
  background: rgba(34, 197, 94, 0.3);
  border-color: rgba(74, 222, 128, 0.6);
}

.sidebar-flyout-menu {
  position: absolute;
  top: 0;
  left: calc(100% + 8px);
  width: 250px;
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.25), 0 8px 10px -6px rgba(0, 0, 0, 0.2);
  border: 1px solid #e2e8f0;
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  z-index: 1050;
}

.flyout-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.15s ease;
}

.flyout-item:hover {
  background: #f1f5f9;
}

.sidebar-item-row {
  position: relative;
  display: flex;
  align-items: center;
  border-radius: 0.5rem;
  transition: background-color 0.15s ease;
}

.sidebar-item-row:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.sidebar-item-row .app-nav-item {
  flex: 1;
  min-width: 0;
}

.sidebar-item-actions {
  display: flex;
  align-items: center;
  gap: 2px;
  padding-right: 6px;
  opacity: 0;
  transition: opacity 0.15s ease;
}

.sidebar-item-row:hover .sidebar-item-actions {
  opacity: 1;
}

.sidebar-item-action-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 3px 5px;
  border-radius: 4px;
  color: var(--sidebar-text-color, #000000);
  opacity: 0;
  transition: all 0.15s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
}

.sidebar-item-row:hover .sidebar-item-action-btn {
  opacity: 0.65;
}

.sidebar-item-action-btn:hover {
  opacity: 1 !important;
  background: rgba(0, 0, 0, 0.12);
}

.sidebar-item-action-btn.action-btn-danger:hover {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444 !important;
}

.create-choice-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  background: #ffffff;
  cursor: pointer;
  transition: all 0.2s ease;
}

.create-choice-card:hover {
  background: #f8fafc;
  border-color: #3b82f6;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transform: translateY(-1px);
}

.choice-icon-box {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.btn-add-table-inline {
  color: #059669 !important;
  opacity: 0.85;
  transition: all 0.15s ease;
  cursor: pointer;
  border: 1px dashed rgba(16, 185, 129, 0.35);
  margin: 2px 0 6px 0;
  padding: 0.45rem 0.75rem !important;
}

.btn-add-table-inline:hover {
  opacity: 1;
  background: rgba(16, 185, 129, 0.08) !important;
  border-color: #10b981;
}

.btn-heading-add {
  background: transparent;
  border: none;
  color: inherit;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  opacity: 0.85;
  transition: opacity 0.15s, background 0.15s;
}

.btn-heading-add:hover {
  opacity: 1;
  background: rgba(255, 255, 255, 0.12);
}

.btn-sidebar-add-record {
  background: none;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  color: #94a3b8;
  cursor: pointer;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  transition: all 0.15s ease;
}
.btn-sidebar-add-record:hover {
  background: rgba(255, 255, 255, 0.15);
  color: #ffffff;
  border-color: rgba(255, 255, 255, 0.4);
}
</style>
