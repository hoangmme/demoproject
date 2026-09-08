<template>
  <div class="app-content">
    <!-- Header -->
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
      <div>
        <h1 style="font-size: 1.35rem; font-weight: 700; color: #1f2937; margin: 0;">
          Cài đặt Chung & Khóa Liên kết
        </h1>
        <p style="font-size: 0.85rem; color: #6b7280; margin: 4px 0 0 0;">
          Cấu hình khóa định danh (CCCD), liên kết dữ liệu giữa các bảng, quản lý thẻ tag và nhận diện hệ thống.
        </p>
      </div>

      <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
        <!-- Nút Xuất toàn bộ dữ liệu web thực tế 3 sheet -->
        <Button
          label="Xuất Dữ Liệu Web (3 Sheet)"
          icon="pi pi-file-excel"
          severity="primary"
          size="small"
          @click="handleExportAllInOneData"
          style="font-size: 0.8rem; font-weight: 700;"
          title="Xuất toàn bộ dữ liệu thực tế đang có trên hệ thống ra 1 file Excel gồm 3 Sheet: Cán bộ, Thân nhân, Chuyến đi"
        />

        <!-- Nút Tải file mẫu Tổng hợp 3 Sheet -->
        <Button
          label="Tải Mẫu Tổng Hợp (3 Sheet)"
          icon="pi pi-download"
          severity="secondary"
          outlined
          size="small"
          @click="handleExportAllInOneTemplate"
          style="font-size: 0.8rem; font-weight: 600;"
        />

        <!-- Nút Mở Công cụ Nhập Bảng & List (/bang-tuy-chinh) -->
        <Button
          label="🛠️ Công cụ Nhập Bảng & List"
          icon="pi pi-external-link"
          severity="help"
          outlined
          size="small"
          @click="openTableHelper"
          style="font-size: 0.8rem; font-weight: 600;"
          title="Mở công cụ hỗ trợ cán bộ/đơn vị soạn thảo Bảng lặp và List dữ liệu để dán vào Excel"
        />

        <!-- Nút Lưu Cấu hình Duy nhất -->
        <Button
          label="Lưu Cấu hình"
          icon="pi pi-save"
          severity="success"
          size="small"
          :loading="saving"
          @click="saveConfig"
          style="font-size: 0.8rem; font-weight: 700;"
          title="Lưu cấu hình hệ thống"
        />
      </div>
    </div>

    <!-- Tabs Navigation (Segmented Pill Style) -->
    <div style="display: flex; gap: 6px; background: #f1f5f9; padding: 4px; border-radius: 8px; border: 1px solid #e2e8f0; width: fit-content; margin-bottom: 1.25rem; flex-wrap: wrap;">
      <button
        type="button"
        class="segmented-tab-btn"
        :class="{ 'tab-active': activeTab === 'keys' }"
        @click="activeTab = 'keys'"
      >
        <i class="pi pi-key"></i>
        <span>Khóa Định danh & Liên kết (CCCD)</span>
      </button>

      <button
        type="button"
        class="segmented-tab-btn"
        :class="{ 'tab-active': activeTab === 'general' }"
        @click="activeTab = 'general'"
      >
        <i class="pi pi-shield"></i>
        <span>Cài đặt Chung & Nhận diện</span>
      </button>
    </div>

    <!-- Main Content: Tab Khóa Định Danh & Khóa Liên Kết (CCCD) -->
    <div v-if="activeTab === 'keys'" class="app-card" style="padding: 1.5rem; display: flex; flex-direction: column; gap: 1.5rem;">
      <div style="border-bottom: 1px solid #e2e8f0; padding-bottom: 0.75rem;">
        <h3 style="font-size: 1rem; font-weight: 700; color: #1e293b; margin: 0; display: flex; align-items: center; gap: 8px;">
          <i class="pi pi-key" style="color: #dc2626; font-size: 1.15rem;"></i>
          Cấu hình Khóa Định Danh & Khóa Liên Kết giữa các Bảng dữ liệu
        </h3>
        <p style="font-size: 0.78rem; color: #64748b; margin: 4px 0 0 0;">
          Thiết lập cột khóa duy nhất (Primary Key) của Cán bộ và các cột khóa liên kết để tự động nối thân nhân, chuyến đi với cán bộ tương ứng qua số CCCD / Mã định danh.
        </p>
      </div>

      <!-- Khối 1: Bảng Cán bộ -->
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px;">
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; margin-bottom: 14px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 36px; height: 36px; border-radius: 8px; background: #fee2e2; display: flex; align-items: center; justify-content: center;">
              <i class="pi pi-user" style="color: #dc2626; font-size: 1.1rem;"></i>
            </div>
            <div>
              <div style="font-size: 0.88rem; font-weight: 700; color: #1e293b;">
                1. Bảng Cán bộ — Khóa Định danh Duy nhất (Primary Unique Key):
              </div>
              <div style="font-size: 0.73rem; color: #64748b; margin-top: 2px;">
                Dùng để định danh chống trùng lặp cán bộ và làm khóa móc nối liên kết với thân nhân và chuyến đi.
              </div>
            </div>
          </div>
          <div style="min-width: 280px;">
            <select v-model="personnelKeyField" class="custom-key-select">
              <option v-for="col in availablePersonnelCols" :key="col.id" :value="col.id">
                {{ col.label }} (mã: {{ col.id }})
              </option>
            </select>
          </div>
        </div>

        <!-- Vai trò cốt lõi: Họ tên, Chức vụ, Đơn vị -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; padding-top: 12px; border-top: 1px dashed #e2e8f0;">
          <div>
            <span style="font-size: 0.73rem; font-weight: 700; color: #334155; display: flex; align-items: center; gap: 4px;">
              <i class="pi pi-user" style="color: #2563eb;"></i> Cột Họ và tên chính:
            </span>
            <select v-model="personnelNameField" class="custom-key-select" style="margin-top: 4px; font-size: 0.78rem;">
              <option v-for="col in availablePersonnelCols" :key="col.id" :value="col.id">
                {{ col.label }} (mã: {{ col.id }})
              </option>
            </select>
          </div>

          <div>
            <span style="font-size: 0.73rem; font-weight: 700; color: #334155; display: flex; align-items: center; gap: 4px;">
              <i class="pi pi-briefcase" style="color: #059669;"></i> Cột Chức vụ (hiển thị kèm):
            </span>
            <select v-model="personnelPositionField" class="custom-key-select" style="margin-top: 4px; font-size: 0.78rem;">
              <option v-for="col in availablePersonnelCols" :key="col.id" :value="col.id">
                {{ col.label }} (mã: {{ col.id }})
              </option>
            </select>
          </div>

          <div>
            <span style="font-size: 0.73rem; font-weight: 700; color: #334155; display: flex; align-items: center; gap: 4px;">
              <i class="pi pi-building" style="color: #7c3aed;"></i> Cột Đơn vị công tác (hiển thị kèm):
            </span>
            <select v-model="personnelDepartmentField" class="custom-key-select" style="margin-top: 4px; font-size: 0.78rem;">
              <option v-for="col in availablePersonnelCols" :key="col.id" :value="col.id">
                {{ col.label }} (mã: {{ col.id }})
              </option>
            </select>
          </div>
        </div>
      </div>

      <!-- Khối 2: Bảng Thân nhân -->
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px;">
        <div style="font-size: 0.88rem; font-weight: 700; color: #1e293b; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
          <div style="width: 36px; height: 36px; border-radius: 8px; background: #e0f2fe; display: flex; align-items: center; justify-content: center;">
            <i class="pi pi-users" style="color: #0284c7; font-size: 1.1rem;"></i>
          </div>
          <div>
            <div>2. Bảng Thân nhân — Khóa Liên kết Cán bộ & Khóa Định danh Thân nhân:</div>
            <div style="font-size: 0.73rem; color: #64748b; font-weight: 400; margin-top: 2px;">
              Xác định quan hệ thân nhân trực thuộc cán bộ nào và mã định danh riêng của thân nhân.
            </div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem;">
          <div style="display: flex; flex-direction: column; gap: 6px;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <i class="pi pi-link" style="color: #0284c7; font-size: 0.95rem;"></i>
              <strong style="color: #1e293b; font-size: 0.82rem;">Cột Liên kết Cán bộ liên quan (Parent Link Key):</strong>
            </div>
            <select v-model="relativeParentKeyField" class="custom-key-select">
              <option v-for="col in availableRelativeCols" :key="col.id" :value="col.id">
                {{ col.label }} (mã: {{ col.id }})
              </option>
            </select>
            <span style="font-size: 0.7rem; color: #64748b;">(Cột chứa số CCCD / Mã định danh của Cán bộ cha/mẹ mà thân nhân trực thuộc)</span>
          </div>

          <div style="display: flex; flex-direction: column; gap: 6px;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <i class="pi pi-id-card" style="color: #16a34a; font-size: 0.95rem;"></i>
              <strong style="color: #1e293b; font-size: 0.82rem;">Cột Định danh riêng Thân nhân (Relative Unique Key):</strong>
            </div>
            <select v-model="relativeKeyField" class="custom-key-select">
              <option v-for="col in availableRelativeCols" :key="col.id" :value="col.id">
                {{ col.label }} (mã: {{ col.id }})
              </option>
            </select>
            <span style="font-size: 0.7rem; color: #64748b;">(Cột chứa số CCCD / Mã định danh riêng của từng Thân nhân)</span>
          </div>
        </div>
      </div>

      <!-- Khối 3: Bảng Chuyến đi -->
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px;">
        <div style="font-size: 0.88rem; font-weight: 700; color: #1e293b; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
          <div style="width: 36px; height: 36px; border-radius: 8px; background: #dcfce7; display: flex; align-items: center; justify-content: center;">
            <i class="pi pi-send" style="color: #16a34a; font-size: 1.1rem;"></i>
          </div>
          <div>
            <div>3. Bảng Chuyến đi — Cột Liên kết Đối tượng chuyến đi (Trip Link Key / CCCD người đi):</div>
            <div style="font-size: 0.73rem; color: #64748b; font-weight: 400; margin-top: 2px;">
              Hệ thống tự động liên kết chuyến đi vào Cán bộ nếu khớp CCCD Cán bộ, hoặc vào Thân nhân nếu khớp CCCD Thân nhân.
            </div>
          </div>
        </div>

        <div style="display: flex; flex-direction: column; gap: 6px; width: 100%;">
          <select v-model="tripKeyField" class="custom-key-select" style="max-width: 480px;">
            <option v-for="col in availableTripCols" :key="col.id" :value="col.id">
              {{ col.label }} (mã: {{ col.id }})
            </option>
          </select>
          <span style="font-size: 0.72rem; color: #64748b;">(Cột trong bảng Chuyến đi chứa số CCCD / Mã định danh của người đi. Tự động nhận diện vào Cán bộ hoặc Thân nhân)</span>
        </div>
      </div>
    </div>

    <!-- Tab: Cài đặt Chung, Nhận diện Hệ thống & Ảnh nền -->
    <div v-else-if="activeTab === 'general'" class="app-card" style="padding: 1.5rem; display: flex; flex-direction: column; gap: 1.75rem;">
      <!-- Khối 1: Tùy biến Nhận diện Logo, Đơn vị & Tên Menu -->
      <div style="border-bottom: 1px solid #e2e8f0; padding-bottom: 1.5rem;">
        <div style="border-bottom: 1px solid #e2e8f0; padding-bottom: 0.75rem; margin-bottom: 1.25rem;">
          <h3 style="font-size: 1rem; font-weight: 700; color: #1e293b; margin: 0; display: flex; align-items: center; gap: 8px;">
            <i class="pi pi-shield" style="color: #2563eb; font-size: 1.15rem;"></i>
            Tùy biến Logo, Tiêu đề Đơn vị & Tên Menu (System Branding)
          </h3>
          <p style="font-size: 0.78rem; color: #64748b; margin: 4px 0 0 0;">
            Tùy biến nhận diện hệ thống: đổi Logo cơ quan, 2 dòng tiêu đề ở thanh điều hướng bên trái và tên các Menu (Cán bộ, Thân nhân, Chuyến đi) phù hợp với mọi mô hình quản lý (Cán bộ, Sinh viên, Giáo viên...).
          </p>
        </div>

        <div style="display: grid; grid-template-columns: 260px 1fr; gap: 24px; align-items: start;">
          <!-- Cột 1: Preview & Đổi Logo -->
          <div style="display: flex; flex-direction: column; align-items: center; background: #f8fafc; padding: 16px; border-radius: 12px; border: 1px solid #e2e8f0; text-align: center;">
            <div style="font-size: 0.8rem; font-weight: 700; color: #334155; margin-bottom: 8px;">
              Logo Hiển thị (Sidebar):
            </div>
            <div style="width: 110px; height: 110px; border-radius: 12px; border: 2px dashed #cbd5e1; display: flex; align-items: center; justify-content: center; background: #ffffff; margin-bottom: 12px; overflow: hidden; padding: 6px;">
              <img
                :src="systemBranding.logoUrl || '/bo-cong-an-logo.png'"
                alt="Logo Preview"
                style="max-width: 100%; max-height: 100%; object-fit: contain;"
              />
            </div>
            <input
              type="file"
              ref="logoFileInputRef"
              accept="image/*"
              style="display: none;"
              @change="handleUploadLogo"
            />
            <div style="display: flex; flex-direction: column; gap: 6px; width: 100%;">
              <Button
                label="Tải lên Logo Mới"
                icon="pi pi-upload"
                severity="primary"
                size="small"
                @click="triggerUploadLogo"
                style="font-size: 0.78rem; width: 100%;"
              />
              <Button
                v-if="systemBranding.logoUrl"
                label="Dùng Logo Mặc định"
                icon="pi pi-refresh"
                severity="secondary"
                size="small"
                text
                @click="systemBranding.logoUrl = ''"
                style="font-size: 0.75rem; width: 100%;"
              />
            </div>
            <div style="font-size: 0.68rem; color: #94a3b8; margin-top: 8px; line-height: 1.3;">
              Khuyến nghị tệp PNG/SVG nền trong suốt để hiển thị hài hòa trên thanh bên.
            </div>
          </div>

          <!-- Cột 2: Cấu hình Tiêu đề Đơn vị & Tên Menu -->
          <div style="display: flex; flex-direction: column; gap: 14px;">
            <!-- Tiêu đề Đơn vị 2 dòng -->
            <div style="background: #f8fafc; padding: 14px; border-radius: 8px; border: 1px solid #e2e8f0; display: flex; flex-direction: column; gap: 10px;">
              <div style="font-size: 0.8rem; font-weight: 700; color: #1e293b; display: flex; align-items: center; gap: 6px;">
                <i class="pi pi-building" style="color: #0284c7;"></i>
                Tiêu đề Đơn vị (2 dòng hiển thị dưới Logo ở Sidebar):
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                <div>
                  <label style="font-size: 0.72rem; font-weight: 700; color: #475569; display: block; margin-bottom: 4px;">Dòng 1 (Cấp cơ quan chủ quản):</label>
                  <InputText
                    v-model="systemBranding.orgNameLine1"
                    placeholder="VD: CÔNG AN THÀNH PHỐ HỒ CHÍ MINH"
                    size="small"
                    style="width: 100%; font-size: 0.8rem;"
                  />
                </div>
                <div>
                  <label style="font-size: 0.72rem; font-weight: 700; color: #475569; display: block; margin-bottom: 4px;">Dòng 2 (Đơn vị cơ sở / Phòng ban):</label>
                  <InputText
                    v-model="systemBranding.orgNameLine2"
                    placeholder="VD: PHÒNG AN NINH CHÍNH TRỊ NỘI BỘ"
                    size="small"
                    style="width: 100%; font-size: 0.8rem;"
                  />
                </div>
              </div>
            </div>

            <!-- Tên hiển thị các Menu Thực thể -->
            <div style="background: #f8fafc; padding: 14px; border-radius: 8px; border: 1px solid #e2e8f0; display: flex; flex-direction: column; gap: 10px;">
              <div style="font-size: 0.8rem; font-weight: 700; color: #1e293b; display: flex; align-items: center; gap: 6px;">
                <i class="pi pi-bars" style="color: #7c3aed;"></i>
                Tùy biến Tên Menu & Tiêu đề Bảng Dữ liệu:
              </div>
              <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">
                <div>
                  <label style="font-size: 0.72rem; font-weight: 700; color: #475569; display: block; margin-bottom: 4px;">
                    Tên Bảng Cán bộ trên Menu (Mặc định: Cán bộ):
                  </label>
                  <InputText
                    v-model="systemBranding.menuLabelPersonnel"
                    placeholder="VD: Cán bộ / Hồ sơ học sinh / Nhân sự..."
                    size="small"
                    style="width: 100%; font-size: 0.8rem;"
                  />
                </div>
                <div>
                  <label style="font-size: 0.72rem; font-weight: 700; color: #475569; display: block; margin-bottom: 4px;">
                    Tiêu đề Mục Danh sách Bảng trên Sidebar (Mặc định: Chuyên đề):
                  </label>
                  <InputText
                    v-model="systemBranding.sectionLabelTopics"
                    placeholder="VD: Chuyên đề / Danh sách Bảng / Bảng dữ liệu..."
                    size="small"
                    style="width: 100%; font-size: 0.8rem;"
                  />
                </div>
              </div>

              <!-- Tùy chọn mở rộng: Quản lý Bảng Phụ & Bảng Sự kiện con -->
              <div style="margin-top: 6px; padding-top: 8px; border-top: 1px dashed #cbd5e1;">
                <label style="display: flex; align-items: center; gap: 8px; font-size: 0.75rem; color: #334155; font-weight: 600; cursor: pointer;">
                  <input type="checkbox" v-model="systemBranding.showSecondaryInputs" style="accent-color: #7c3aed; cursor: pointer;" />
                  <span>Bật quản lý Bảng Phụ (Thân nhân / Phụ huynh) và Bảng Sự kiện con (Chuyến đi / Hoạt động) trên menu</span>
                </label>
                <div v-if="systemBranding.showSecondaryInputs" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-top: 10px;">
                  <div>
                    <label style="font-size: 0.72rem; font-weight: 700; color: #475569; display: block; margin-bottom: 4px;">Tên Bảng Phụ liên kết (Mặc định: Thân nhân):</label>
                    <InputText
                      v-model="systemBranding.menuLabelRelatives"
                      placeholder="VD: Thân nhân / Phụ huynh"
                      size="small"
                      style="width: 100%; font-size: 0.8rem;"
                    />
                  </div>
                  <div>
                    <label style="font-size: 0.72rem; font-weight: 700; color: #475569; display: block; margin-bottom: 4px;">Tên Bảng Sự kiện / Hoạt động (Mặc định: Chuyến đi):</label>
                    <InputText
                      v-model="systemBranding.menuLabelTrips"
                      placeholder="VD: Chuyến đi / Khóa học / Điểm thi"
                      size="small"
                      style="width: 100%; font-size: 0.8rem;"
                    />
                  </div>
                </div>
              </div>
            </div>

            <!-- Nút Lưu & Khôi phục -->
            <div style="display: flex; justify-content: flex-end; align-items: center; gap: 10px; margin-top: 4px;">
              <Button
                label="Khôi phục Mặc định"
                icon="pi pi-refresh"
                severity="secondary"
                size="small"
                outlined
                @click="resetSystemBranding"
                style="font-size: 0.78rem;"
              />
              <Button
                label="Lưu Nhận diện & Tên Menu"
                icon="pi pi-check"
                severity="primary"
                size="small"
                @click="saveSystemBranding"
                :loading="isSavingBranding"
                style="font-size: 0.78rem;"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Khối 2: Tùy chỉnh Hình nền Trang Đăng nhập (Login Background) -->
      <div>
        <div style="border-bottom: 1px solid #e2e8f0; padding-bottom: 0.75rem; margin-bottom: 1.25rem;">
          <h3 style="font-size: 1rem; font-weight: 700; color: #1e293b; margin: 0; display: flex; align-items: center; gap: 8px;">
            <i class="pi pi-image" style="color: #ea580c; font-size: 1.15rem;"></i>
            Tùy chỉnh Hình nền Trang Đăng nhập (Login Background)
          </h3>
          <p style="font-size: 0.78rem; color: #64748b; margin: 4px 0 0 0;">
            Tải lên hình ảnh tùy biến để thay đổi giao diện màn hình Đăng nhập của Hệ thống.
          </p>
        </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; align-items: start;">
        <!-- Cột 1: Preview ảnh hiện tại -->
        <div>
          <div style="font-size: 0.8rem; font-weight: 700; color: #334155; margin-bottom: 8px;">
            Ảnh nền Đăng nhập đang áp dụng:
          </div>
          <div style="width: 100%; height: 230px; border-radius: 12px; overflow: hidden; border: 2px solid #cbd5e1; box-shadow: 0 4px 12px rgba(0,0,0,0.08); position: relative; background: #0f172a;">
            <img
              :src="currentLoginBg || '/login-bg.jpg'"
              alt="Login Background Preview"
              style="width: 100%; height: 100%; object-fit: cover;"
            />
            <div style="position: absolute; bottom: 8px; right: 8px; background: rgba(0,0,0,0.65); color: #ffffff; font-size: 0.7rem; padding: 2px 8px; border-radius: 4px; backdrop-filter: blur(4px);">
              {{ currentLoginBg ? 'Ảnh tùy biến người dùng' : 'Ảnh nền mặc định hệ thống' }}
            </div>
          </div>
        </div>

        <!-- Cột 2: Các nút thao tác tải lên / khôi phục -->
        <div style="display: flex; flex-direction: column; gap: 14px; background: #f8fafc; padding: 16px; border-radius: 10px; border: 1px solid #e2e8f0;">
          <div>
            <div style="font-size: 0.82rem; font-weight: 700; color: #1e293b; margin-bottom: 4px;">
              Tải lên Ảnh nền Mới:
            </div>
            <div style="font-size: 0.74rem; color: #64748b; line-height: 1.4; margin-bottom: 10px;">
              Hỗ trợ định dạng: JPG, PNG, WEBP (Khuyến nghị độ phân giải 1920x1080 hoặc tỷ lệ 16:9 để hiển thị đẹp nhất).
            </div>
            <input
              type="file"
              ref="loginBgFileInputRef"
              accept="image/jpeg,image/png,image/webp,image/jpg"
              style="display: none;"
              @change="handleUploadLoginBg"
            />
            <Button
              label="Chọn Tệp Ảnh & Lưu Ngay"
              icon="pi pi-upload"
              severity="warn"
              size="small"
              @click="triggerUploadLoginBg"
              style="font-size: 0.82rem;"
            />
          </div>

          <div style="border-top: 1px solid #e2e8f0; padding-top: 12px;">
            <div style="font-size: 0.82rem; font-weight: 700; color: #1e293b; margin-bottom: 4px;">
              Khôi phục Ảnh Mặc định:
            </div>
            <div style="font-size: 0.74rem; color: #64748b; margin-bottom: 10px;">
              Trở về ảnh nền gốc của Công An TP. Hồ Chí Minh.
            </div>
            <Button
              label="Khôi phục Ảnh Mặc định"
              icon="pi pi-refresh"
              severity="secondary"
              outlined
              size="small"
              @click="resetDefaultLoginBg"
              style="font-size: 0.82rem;"
            />
          </div>
        </div>
      </div>
    </div>

      <!-- Khối 3: Tùy chỉnh Hình nền Menu Bên Trái (Sidebar Background) -->
      <div style="border-top: 1px solid #e2e8f0; padding-top: 1.5rem;">
        <div style="border-bottom: 1px solid #e2e8f0; padding-bottom: 0.75rem; margin-bottom: 1.25rem;">
          <h3 style="font-size: 1rem; font-weight: 700; color: #1e293b; margin: 0; display: flex; align-items: center; gap: 8px;">
            <i class="pi pi-palette" style="color: #16a34a; font-size: 1.15rem;"></i>
            Tùy chỉnh Hình nền Menu Bên Trái (Sidebar Background)
          </h3>
          <p style="font-size: 0.78rem; color: #64748b; margin: 4px 0 0 0;">
            Tải lên hình ảnh tùy biến phủ lên nền rêu của thanh Menu chính bên trái (Cover mặc định) và chỉnh độ trong suốt.
          </p>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; align-items: start;">
          <!-- Cột 1: Preview Sidebar Background -->
          <div>
            <div style="font-size: 0.8rem; font-weight: 700; color: #334155; margin-bottom: 8px;">
              Xem trước Menu với Ảnh nền & Độ trong suốt:
            </div>
            <div style="width: 275px; height: 260px; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08); position: relative; border: 2px solid;" :style="{ background: sidebarCustomColor || '#889962', borderColor: sidebarCustomColor || '#889962' }">
              <!-- Background layer -->
              <div
                v-if="currentSidebarBg"
                style="position: absolute; inset: 0; background-size: cover; background-position: center; pointer-events: none;"
                :style="{ backgroundImage: `url(${currentSidebarBg})`, opacity: Number(sidebarBgOpacity) / 100 }"
              ></div>
              <!-- Mock sidebar content -->
              <div style="position: relative; z-index: 1; padding: 12px; display: flex; flex-direction: column; gap: 8px; height: 100%;">
                <div style="text-align: center; border-bottom: 1px solid rgba(0,0,0,0.15); padding-bottom: 8px;">
                  <!-- Khối 1: Phiên hiệu đơn vị (cách nhau 2px, line-height 1.15) -->
                  <div style="display: flex; flex-direction: column; gap: 2px;">
                    <div style="font-size: 0.7rem; font-weight: 800; text-transform: uppercase; line-height: 1.15;" :style="{ color: sidebarOrgTextColor || sidebarCustomTextColor || '#000000' }">CÔNG AN TP. HỒ CHÍ MINH</div>
                    <div style="font-size: 0.68rem; font-weight: 800; text-transform: uppercase; line-height: 1.15;" :style="{ color: sidebarOrgTextColor || sidebarCustomTextColor || '#000000' }">PHÒNG AN NINH CHÍNH TRỊ NỘI BỘ</div>
                  </div>
                </div>
                <div style="display: flex; flex-direction: column; gap: 4px; margin-top: 4px;">
                  <div style="padding: 6px 10px; background: rgba(0,0,0,0.15); border-radius: 6px; font-size: 0.78rem; font-weight: bold; display: flex; align-items: center; gap: 6px;" :style="{ color: sidebarCustomTextColor || '#000000' }">
                    <i class="pi pi-chart-pie" style="font-size: 0.85rem;" :style="{ color: sidebarCustomTextColor || '#000000' }"></i> Thống kê
                  </div>
                  <div style="padding: 6px 10px; border-radius: 6px; font-size: 0.78rem; font-weight: bold; display: flex; align-items: center; gap: 6px;" :style="{ color: sidebarCustomTextColor || '#000000' }">
                    <i class="pi pi-users" style="font-size: 0.85rem;" :style="{ color: sidebarCustomTextColor || '#000000' }"></i> Hồ sơ cán bộ
                  </div>
                </div>
                <div style="margin-top: auto; font-size: 0.68rem; text-align: center; background: rgba(255,255,255,0.6); border-radius: 4px; padding: 2px 4px; font-weight: 600; color: #0f172a;">
                  {{ currentSidebarBg ? `Độ trong suốt: ${sidebarBgOpacity}%` : `Màu nền: ${sidebarCustomColor || '#889962'}` }}
                </div>
              </div>
            </div>
          </div>

          <!-- Cột 2: Color, Upload, Slider, Reset -->
          <div style="display: flex; flex-direction: column; gap: 14px; background: #f8fafc; padding: 16px; border-radius: 10px; border: 1px solid #e2e8f0;">
            <!-- Chọn Màu nền Menu (Sidebar Background Color) -->
            <div>
              <div style="font-size: 0.82rem; font-weight: 700; color: #1e293b; margin-bottom: 4px;">
                Tùy chỉnh Màu nền Menu (Sidebar Color):
              </div>
              <div style="font-size: 0.74rem; color: #64748b; line-height: 1.4; margin-bottom: 8px;">
                Chọn màu tùy ý cho thanh Menu bên trái (mặc định là xanh rêu #889962).
              </div>
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                <input
                  type="color"
                  v-model="sidebarCustomColor"
                  @input="saveSidebarCustomColor(sidebarCustomColor)"
                  style="width: 40px; height: 32px; padding: 1px; border: 1px solid #cbd5e1; border-radius: 6px; cursor: pointer; background: #fff;"
                  title="Bấm để chọn màu"
                />
                <input
                  type="text"
                  v-model="sidebarCustomColor"
                  @change="saveSidebarCustomColor(sidebarCustomColor)"
                  placeholder="#889962"
                  style="width: 100px; height: 32px; padding: 3px 8px; font-size: 0.8rem; font-weight: 700; font-family: monospace; border: 1px solid #cbd5e1; border-radius: 6px; background: #fff; color: #0f172a;"
                />
                <Button
                  label="Lưu màu"
                  icon="pi pi-check"
                  size="small"
                  severity="success"
                  @click="saveSidebarCustomColor(sidebarCustomColor)"
                  style="font-size: 0.76rem; height: 32px;"
                />
              </div>

              <!-- Gợi ý các gam màu chuẩn -->
              <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                <span style="font-size: 0.7rem; color: #64748b; font-weight: 600;">Gợi ý:</span>
                <button
                  v-for="p in sidebarColorPresets"
                  :key="p.color"
                  type="button"
                  @click="saveSidebarCustomColor(p.color)"
                  style="display: inline-flex; align-items: center; gap: 4px; padding: 2px 7px; border-radius: 4px; font-size: 0.68rem; font-weight: 600; cursor: pointer; border: 1px solid #cbd5e1; background: #fff; color: #334155;"
                >
                  <span :style="{ background: p.color }" style="width: 10px; height: 10px; border-radius: 2px; display: inline-block; border: 1px solid rgba(0,0,0,0.15);"></span>
                  {{ p.label }}
                </button>
              </div>
            </div>

            <!-- Chọn Màu chữ Menu (Sidebar Text Color) -->
            <div style="border-top: 1px solid #e2e8f0; padding-top: 12px;">
              <div style="font-size: 0.82rem; font-weight: 700; color: #1e293b; margin-bottom: 4px;">
                Tùy chỉnh Màu chữ Menu (Sidebar Text Color):
              </div>
              <div style="font-size: 0.74rem; color: #64748b; line-height: 1.4; margin-bottom: 8px;">
                Chọn màu chữ hiển thị cho các mục menu (tiêu đề, tên mục, icon).
              </div>
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                <input
                  type="color"
                  v-model="sidebarCustomTextColor"
                  @input="saveSidebarCustomTextColor(sidebarCustomTextColor)"
                  style="width: 40px; height: 32px; padding: 1px; border: 1px solid #cbd5e1; border-radius: 6px; cursor: pointer; background: #fff;"
                  title="Bấm để chọn màu chữ"
                />
                <input
                  type="text"
                  v-model="sidebarCustomTextColor"
                  @change="saveSidebarCustomTextColor(sidebarCustomTextColor)"
                  placeholder="#000000"
                  style="width: 100px; height: 32px; padding: 3px 8px; font-size: 0.8rem; font-weight: 700; font-family: monospace; border: 1px solid #cbd5e1; border-radius: 6px; background: #fff; color: #0f172a;"
                />
                <Button
                  label="Lưu màu chữ"
                  icon="pi pi-check"
                  size="small"
                  severity="success"
                  @click="saveSidebarCustomTextColor(sidebarCustomTextColor)"
                  style="font-size: 0.76rem; height: 32px;"
                />
              </div>

              <!-- Gợi ý các gam màu chữ chuẩn -->
              <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                <span style="font-size: 0.7rem; color: #64748b; font-weight: 600;">Gợi ý:</span>
                <button
                  v-for="p in sidebarTextColorPresets"
                  :key="p.color"
                  type="button"
                  @click="saveSidebarCustomTextColor(p.color)"
                  style="display: inline-flex; align-items: center; gap: 4px; padding: 2px 7px; border-radius: 4px; font-size: 0.68rem; font-weight: 600; cursor: pointer; border: 1px solid #cbd5e1; background: #fff; color: #334155;"
                >
                  <span :style="{ background: p.color }" style="width: 10px; height: 10px; border-radius: 2px; display: inline-block; border: 1px solid rgba(0,0,0,0.15);"></span>
                  {{ p.label }}
                </button>
              </div>
            </div>

            <!-- Chọn Màu chữ Tên Đơn vị (2 dòng tiêu đề trên: CÔNG AN THÀNH PHỐ... / PHÒNG AN NINH...) -->
            <div style="border-top: 1px solid #e2e8f0; padding-top: 12px;">
              <div style="font-size: 0.82rem; font-weight: 700; color: #1e293b; margin-bottom: 4px;">
                Tùy chỉnh Màu chữ Tên Đơn vị (CÔNG AN TP... / PHÒNG AN NINH...):
              </div>
              <div style="font-size: 0.74rem; color: #64748b; line-height: 1.4; margin-bottom: 8px;">
                Chọn màu chữ riêng cho 2 dòng tên cơ quan ở đầu Menu.
              </div>
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                <input
                  type="color"
                  v-model="sidebarOrgTextColor"
                  @input="saveSidebarOrgTextColor(sidebarOrgTextColor)"
                  style="width: 40px; height: 32px; padding: 1px; border: 1px solid #cbd5e1; border-radius: 6px; cursor: pointer; background: #fff;"
                  title="Bấm để chọn màu"
                />
                <input
                  type="text"
                  v-model="sidebarOrgTextColor"
                  @change="saveSidebarOrgTextColor(sidebarOrgTextColor)"
                  placeholder="#000000"
                  style="width: 100px; height: 32px; padding: 3px 8px; font-size: 0.8rem; font-weight: 700; font-family: monospace; border: 1px solid #cbd5e1; border-radius: 6px; background: #fff; color: #0f172a;"
                />
                <Button
                  label="Lưu màu"
                  icon="pi pi-check"
                  size="small"
                  severity="success"
                  @click="saveSidebarOrgTextColor(sidebarOrgTextColor)"
                  style="font-size: 0.76rem; height: 32px;"
                />
              </div>

              <!-- Gợi ý màu -->
              <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                <span style="font-size: 0.7rem; color: #64748b; font-weight: 600;">Gợi ý:</span>
                <button
                  v-for="p in sidebarOrgColorPresets"
                  :key="p.color"
                  type="button"
                  @click="saveSidebarOrgTextColor(p.color)"
                  style="display: inline-flex; align-items: center; gap: 4px; padding: 2px 7px; border-radius: 4px; font-size: 0.68rem; font-weight: 600; cursor: pointer; border: 1px solid #cbd5e1; background: #fff; color: #334155;"
                >
                  <span :style="{ background: p.color }" style="width: 10px; height: 10px; border-radius: 2px; display: inline-block; border: 1px solid rgba(0,0,0,0.15);"></span>
                  {{ p.label }}
                </button>
              </div>
            </div>

            <!-- Tải lên ảnh nền -->
            <div style="border-top: 1px solid #e2e8f0; padding-top: 12px;">
              <div style="font-size: 0.82rem; font-weight: 700; color: #1e293b; margin-bottom: 4px;">
                Tải lên Ảnh nền Menu Mới:
              </div>
              <div style="font-size: 0.74rem; color: #64748b; line-height: 1.4; margin-bottom: 10px;">
                Tải ảnh tùy ý (tự động căn Cover). Hỗ trợ JPG, PNG, WEBP.
              </div>
              <input
                type="file"
                ref="sidebarBgFileInputRef"
                accept="image/jpeg,image/png,image/webp,image/jpg"
                style="display: none;"
                @change="handleUploadSidebarBg"
              />
              <Button
                label="Chọn Tệp Ảnh & Lưu Ngay"
                icon="pi pi-upload"
                severity="success"
                size="small"
                @click="triggerUploadSidebarBg"
                style="font-size: 0.82rem;"
              />
            </div>

            <!-- Opacity Slider -->
            <div style="border-top: 1px solid #e2e8f0; padding-top: 12px;" v-if="currentSidebarBg">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <label style="font-size: 0.82rem; font-weight: 700; color: #1e293b;">
                  Độ trong suốt ảnh nền (Opacity):
                </label>
                <span style="font-size: 0.82rem; font-weight: 800; color: #16a34a;">{{ sidebarBgOpacity }}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="100"
                step="5"
                v-model="sidebarBgOpacity"
                @change="saveSidebarBgOpacity"
                style="width: 100%; accent-color: #16a34a; cursor: pointer;"
              />
              <div style="display: flex; justify-content: space-between; font-size: 0.68rem; color: #94a3b8; margin-top: 2px;">
                <span>5% (Rất mờ, hiện rõ rêu)</span>
                <span>50% (Hòa trộn vừa)</span>
                <span>100% (Hiện rõ ảnh)</span>
              </div>
            </div>

            <div style="border-top: 1px solid #e2e8f0; padding-top: 12px;">
              <div style="font-size: 0.82rem; font-weight: 700; color: #1e293b; margin-bottom: 4px;">
                Khôi phục Menu Mặc định:
              </div>
              <div style="font-size: 0.74rem; color: #64748b; margin-bottom: 10px;">
                Xóa ảnh nền tùy biến và trở về màu xanh rêu nguyên bản (#889962).
              </div>
              <Button
                label="Khôi phục Menu Mặc định"
                icon="pi pi-refresh"
                severity="secondary"
                outlined
                size="small"
                @click="resetDefaultSidebarBg"
                style="font-size: 0.82rem;"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Dialog Thêm / Sửa Nhóm Dashboard -->
    <Dialog
      v-model:visible="isDashGroupDialogOpen"
      modal
      :header="editingDashGroup ? 'Chỉnh sửa Nhóm Thống kê Dashboard' : 'Thêm Nhóm Thống kê Dashboard Mới'"
      :style="{ width: '480px' }"
    >
      <div style="display: flex; flex-direction: column; gap: 1rem; padding: 4px 0;">
        <div>
          <label style="font-size: 0.8rem; font-weight: 700; color: #334155; margin-bottom: 4px; display: block;">
            Tên nhóm thống kê: <span style="color: red;">*</span>
          </label>
          <InputText
            v-model="dashGroupForm.title"
            placeholder="VD: Thống kê Đi Nước Ngoài Trọng Điểm, Nhóm Theo Dõi..."
            style="width: 100%; font-size: 0.85rem;"
          />
        </div>

        <div>
          <label style="font-size: 0.8rem; font-weight: 700; color: #334155; margin-bottom: 4px; display: block;">
            Mô tả phụ (tùy chọn):
          </label>
          <InputText
            v-model="dashGroupForm.description"
            placeholder="VD: Tổng hợp các chỉ số quan trọng cần lưu ý"
            style="width: 100%; font-size: 0.85rem;"
          />
        </div>

        <div>
          <label style="font-size: 0.8rem; font-weight: 700; color: #334155; margin-bottom: 4px; display: block;">
            Biểu tượng đại diện:
          </label>
          <select v-model="dashGroupForm.icon" class="custom-key-select">
            <option value="pi-folder">📁 pi-folder (Thư mục)</option>
            <option value="pi-chart-pie">📊 pi-chart-pie (Biểu đồ tròn)</option>
            <option value="pi-chart-bar">📈 pi-chart-bar (Biểu đồ cột)</option>
            <option value="pi-globe">🌐 pi-globe (Quốc tế / Toàn cầu)</option>
            <option value="pi-send">✈️ pi-send (Chuyến đi)</option>
            <option value="pi-users">👥 pi-users (Cán bộ)</option>
            <option value="pi-heart">❤️ pi-heart (Thân nhân)</option>
            <option value="pi-flag">🚩 pi-flag (Cờ / Trọng tâm)</option>
            <option value="pi-shield">🛡️ pi-shield (Bảo vệ / An ninh)</option>
          </select>
        </div>
      </div>

      <template #footer>
        <Button label="Hủy" severity="secondary" text size="small" @click="isDashGroupDialogOpen = false" />
        <Button label="Lưu Nhóm" severity="success" size="small" @click="saveDashGroup" />
      </template>
    </Dialog>

    <!-- Dialog Thêm / Sửa Khối Thống kê (Widget) -->
    <Dialog
      v-model:visible="isDashWidgetDialogOpen"
      modal
      :header="editingDashWidget ? 'Chỉnh sửa Khối Thống kê' : 'Thêm Khối Thống kê Mới vào Nhóm'"
      :style="{ width: '560px' }"
    >
      <div style="display: flex; flex-direction: column; gap: 1rem; padding: 4px 0;">
        <!-- 1. Nguồn dữ liệu -->
        <div>
          <label style="font-size: 0.8rem; font-weight: 700; color: #334155; margin-bottom: 4px; display: block;">
            1. Nguồn dữ liệu lấy số liệu: <span style="color: red;">*</span>
          </label>
          <select
            v-model="dashWidgetForm.source"
            class="custom-key-select"
            @change="dashWidgetForm.columnId = ''; dashWidgetForm.columnLabel = ''"
          >
            <option value="personnel">👤 Hồ sơ Cán bộ (Cá nhân)</option>
            <option value="relatives">👥 Hồ sơ Thân nhân</option>
            <option value="trips">✈️ Danh sách Chuyến đi xuất nhập cảnh</option>
            <option value="combined_country">🌐 Thống kê Toàn bộ Quốc gia (Cả CB & TN)</option>
          </select>
        </div>

        <!-- 2. Chọn Cột dữ liệu -->
        <div v-if="dashWidgetForm.source !== 'combined_country'">
          <label style="font-size: 0.8rem; font-weight: 700; color: #334155; margin-bottom: 4px; display: block;">
            2. Cột dữ liệu cần thống kê: <span style="color: red;">*</span>
          </label>
          <select
            v-model="dashWidgetForm.columnId"
            class="custom-key-select"
            @change="onWidgetColumnChange"
          >
            <option value="" disabled>-- Chọn cột cần tính toán số liệu --</option>
            <option v-for="col in availableSourceCols" :key="col.id" :value="col.id">
              {{ col.label }} (mã: {{ col.id }})
            </option>
          </select>
        </div>

        <!-- 3. Tiêu đề hiển thị -->
        <div>
          <label style="font-size: 0.8rem; font-weight: 700; color: #334155; margin-bottom: 4px; display: block;">
            3. Tiêu đề hiển thị trên thẻ / biểu đồ:
          </label>
          <InputText
            v-model="dashWidgetForm.title"
            placeholder="Tự động theo tên cột hoặc đặt tên tùy thích"
            style="width: 100%; font-size: 0.85rem;"
          />
        </div>

        <!-- 4. Kiểu hiển thị & Độ rộng -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div>
            <label style="font-size: 0.8rem; font-weight: 700; color: #334155; margin-bottom: 4px; display: block;">
              4. Dạng hiển thị:
            </label>
            <select v-model="dashWidgetForm.displayType" class="custom-key-select">
              <option value="count">🔢 Thẻ đếm số lượng (KPI Metric)</option>
              <option value="chart">📊 Biểu đồ phân bổ (Pie / Doughnut)</option>
            </select>
          </div>

          <div>
            <label style="font-size: 0.8rem; font-weight: 700; color: #334155; margin-bottom: 4px; display: block;">
              5. Độ rộng khối trên màn hình:
            </label>
            <select v-model="dashWidgetForm.widthPercent" class="custom-key-select">
              <option :value="25">25% (1/4 hàng - Thẻ nhỏ gọn)</option>
              <option :value="33">33% (1/3 hàng - Chuẩn)</option>
              <option :value="50">50% (1/2 hàng - Rộng)</option>
              <option :value="100">100% (Toàn hàng - Rộng nhất)</option>
            </select>
          </div>
        </div>

        <!-- 5. Tông màu sắc -->
        <div>
          <label style="font-size: 0.8rem; font-weight: 700; color: #334155; margin-bottom: 4px; display: block;">
            6. Tông màu chủ đạo:
          </label>
          <div style="display: flex; gap: 10px; align-items: center;">
            <input type="color" v-model="dashWidgetForm.color" style="width: 40px; height: 34px; border: 1px solid #cbd5e1; border-radius: 6px; cursor: pointer;" />
            <span style="font-size: 0.8rem; color: #64748b;">Mã màu: <b>{{ dashWidgetForm.color }}</b></span>
          </div>
        </div>
      </div>

      <template #footer>
        <Button label="Hủy" severity="secondary" text size="small" @click="isDashWidgetDialogOpen = false" />
        <Button label="Lưu Khối Thống kê" severity="success" size="small" @click="saveDashWidget" />
      </template>
    </Dialog>

    <!-- Excel Import Wizard (4 Steps) -->
    <ExcelImportWizard
      v-model:visible="isWizardOpen"
      :defaultTarget="wizardTarget"
      @imported="onWizardImported"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import ExcelImportWizard from '@/components/common/ExcelImportWizard.vue';
import { usePersonnelStore } from '@/stores/personnel';
import { getAppSettings, saveAppSettings } from '@/api/settings';
import { syncCollectionFields } from '@/api/fields';
import { uploadFile, getFileUrl } from '@/api/files';
import { computeColumnIndexMap, formatOptions } from '@/utils/formatters';
import { DEFAULT_UNIFIED_DASHBOARDS, ensureStandardDashboards } from '@/utils/tableRegistry';
import { createSampleDocxTemplateBlob } from '@/utils/docxExport';
import {
  exportFullPersonnelExcel,
  exportFullRelativesExcel,
  exportFullTripsExcel,
  downloadPersonnelTemplate,
  downloadRelativeTemplate,
  downloadTripsTemplate,
  downloadAllInOneTemplate,
  exportAllInOneDataExcel,
} from '@/utils/excel';
import { saveAs } from 'file-saver';

const route = useRoute();
const router = useRouter();
const personnelStore = usePersonnelStore();

const activeTab = ref('keys');
const saving = ref(false);

const isWizardOpen = ref(false);
const wizardTarget = ref('personnel');

const getTabName = (tab) => {
  if (tab === 'personnel') return 'Cán bộ';
  if (tab === 'relative') return 'Thân nhân';
  if (tab === 'trips') return 'Chuyến đi';
  return tab;
};

const openImportWizard = (tab) => {
  wizardTarget.value = tab || 'personnel';
  isWizardOpen.value = true;
};

const onWizardImported = async () => {
  await personnelStore.fetchPersonnel();
};

const handleExportAllInOneData = () => {
  const pList = personnelStore.personnelList || [];
  
  // Extract all relatives with their parent personnel info attached
  const allRelatives = [];
  pList.forEach((p) => {
    let custom = {};
    if (p.custom_data) {
      try {
        custom = typeof p.custom_data === 'string' ? JSON.parse(p.custom_data) : p.custom_data;
      } catch (e) {}
    }
    const personCccd = String(p.cccdparent || p.cccd || p.so_cccd || custom.cccdparent || custom.cccd || custom.so_cccd || '').trim();
    const rels = p.relatives || custom.relatives || [];
    if (Array.isArray(rels)) {
      rels.forEach((r) => {
        allRelatives.push({
          ...r,
          parentName: p.name || p.fullName || '',
          parentPersonnelName: p.name || p.fullName || '',
          cccdparent: personCccd,
          parentCccd: personCccd,
          parentPersonnelCccd: personCccd,
          parentPosition: p.position || p.positionName || custom.position || '',
          parentDepartment: p.departmentName || (p.departmentId ? personnelStore.getDepartmentName(p.departmentId) : '') || '',
          rawPerson: p,
        });
      });
    }
  });

  const rList = allRelatives.length > 0 ? allRelatives : (personnelStore.relativesList || []);

  const allTrips = [];
  pList.forEach((p) => {
    (p.trips || []).forEach((t) => {
      allTrips.push({
        ...t,
        personnelName: p.name || p.fullName || '',
        departmentName: p.departmentName || '',
        departmentId: p.departmentId || '',
        position: p.position || '',
        cccd: p.cccd || '',
        rawPerson: p,
      });
    });
  });

  rList.forEach((r) => {
    (r.trips || []).forEach((t) => {
      allTrips.push({
        ...t,
        personnelName: r.name || r.relativeName || '',
        departmentName: '',
        position: '',
        cccd: r.cccd || '',
        isRelative: true,
        parentName: r.parentName || '',
        rawPerson: r,
      });
    });
  });

  exportAllInOneDataExcel(
    pList,
    rList,
    allTrips,
    personnelGroups.value,
    relativeGroups.value,
    tripsGroups.value,
    (id) => personnelStore.getDepartmentName(id)
  );
};

const openTableHelper = () => {
  const routeData = router.resolve({ name: 'TableHelper' });
  window.open(routeData.href, '_blank');
};

const handleExportAllInOneTemplate = () => {
  downloadAllInOneTemplate(personnelGroups.value, relativeGroups.value, tripsGroups.value);
};

const handleExportCurrentTabExcel = (tab) => {
  if (tab === 'personnel') {
    downloadPersonnelTemplate(personnelGroups.value);
  } else if (tab === 'relative') {
    downloadRelativeTemplate(relativeGroups.value);
  } else if (tab === 'trips') {
    downloadTripsTemplate(tripsGroups.value);
  }
};

const personnelGroups = ref([]);
const relativeGroups = ref([]);
const tripsGroups = ref([]);

const personnelKeyField = ref('cccdparent');
const personnelNameField = ref('name');
const personnelPositionField = ref('position');
const personnelDepartmentField = ref('departmentName');
const relativeParentKeyField = ref('cccdparent');
const relativeKeyField = ref('cccdthannhan');
const tripKeyField = ref('cccdchuyendi');

const tagSearch = ref('');
const selectedCategory = ref('personnel');
const copiedTag = ref('');

const DEFAULT_BRANDING = {
  logoUrl: '',
  orgNameLine1: 'CÔNG AN THÀNH PHỐ HỒ CHÍ MINH',
  orgNameLine2: 'PHÒNG AN NINH CHÍNH TRỊ NỘI BỘ',
  menuLabelPersonnel: 'Cán bộ',
  sectionLabelTopics: 'Bảng dữ liệu (Tables)',
  menuLabelRelatives: 'Thân nhân',
  menuLabelTrips: 'Chuyến đi',
  showSecondaryInputs: false,
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
const isSavingBranding = ref(false);
const logoFileInputRef = ref(null);

const triggerUploadLogo = () => logoFileInputRef.value?.click();

const handleUploadLogo = async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  try {
    const uploaded = await uploadFile(file);
    if (uploaded && uploaded.id) {
      const url = getFileUrl(uploaded.id);
      systemBranding.value.logoUrl = url;
      return;
    }
    throw new Error('Không nhận được mã tệp');
  } catch (err) {
    try {
      const compressedBase64 = await compressImage(file, 400, 400, 0.9);
      systemBranding.value.logoUrl = compressedBase64;
    } catch (fallbackErr) {
      alert('Lỗi tải ảnh logo: ' + (err.message || fallbackErr.message));
    }
  } finally {
    event.target.value = '';
  }
};

const loadSystemBranding = async () => {
  try {
    const saved = await getAppSettings('system_branding_config', null);
    if (saved && typeof saved === 'object') {
      systemBranding.value = { ...DEFAULT_BRANDING, ...saved };
      localStorage.setItem('system_branding_config', JSON.stringify(systemBranding.value));
    }
  } catch (e) {
    console.warn('Failed to load branding settings:', e);
  }
};

const saveSystemBranding = async () => {
  try {
    isSavingBranding.value = true;
    const configToSave = { ...systemBranding.value };
    localStorage.setItem('system_branding_config', JSON.stringify(configToSave));
    await saveAppSettings('system_branding_config', configToSave);
    window.dispatchEvent(new CustomEvent('system-branding-updated', { detail: configToSave }));
    alert('Đã lưu cấu hình Nhận diện và Tên Menu thành công!');
  } catch (err) {
    alert('Lỗi lưu cấu hình: ' + (err.message || err));
  } finally {
    isSavingBranding.value = false;
  }
};

const resetSystemBranding = async () => {
  if (!confirm('Bạn có chắc muốn khôi phục lại nhận diện & tên menu mặc định?')) return;
  systemBranding.value = { ...DEFAULT_BRANDING };
  localStorage.setItem('system_branding_config', JSON.stringify(DEFAULT_BRANDING));
  await saveAppSettings('system_branding_config', DEFAULT_BRANDING);
  window.dispatchEvent(new CustomEvent('system-branding-updated', { detail: DEFAULT_BRANDING }));
  alert('Đã khôi phục nhận diện mặc định!');
};

// Cài đặt Ảnh nền Đăng nhập
const loginBgFileInputRef = ref(null);
const currentLoginBg = ref('');

const loadLoginBg = async () => {
  try {
    const bgData = await getAppSettings('custom_login_bg', null);
    if (bgData) {
      currentLoginBg.value = bgData;
      localStorage.setItem('custom_login_bg', bgData);
    }
  } catch (err) {
    console.warn('Failed to load login bg:', err);
  }
};

const triggerUploadLoginBg = () => loginBgFileInputRef.value?.click();

const compressImage = (file, maxWidth = 3840, maxHeight = 2160, quality = 0.95) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let w = img.width;
        let h = img.height;
        // Chỉ thu nhỏ nếu ảnh vượt quá chuẩn 4K UHD (3840x2160)
        if (w > maxWidth || h > maxHeight) {
          const ratio = Math.min(maxWidth / w, maxHeight / h);
          w = Math.round(w * ratio);
          h = Math.round(h * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Không thể xử lý tệp ảnh này'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('Không thể đọc tệp'));
    reader.readAsDataURL(file);
  });
};

const handleUploadLoginBg = async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  try {
    // 1. Tải tệp lên Directus File Storage để lưu trữ ảnh gốc 4K sắc nét tuyệt đối
    const uploaded = await uploadFile(file);
    if (uploaded && uploaded.id) {
      const bgUrl = getFileUrl(uploaded.id);
      currentLoginBg.value = bgUrl;
      localStorage.setItem('custom_login_bg', bgUrl);
      await saveAppSettings('custom_login_bg', bgUrl);
      alert('Đã tải lên và lưu ảnh nền đăng nhập độ nét cao (4K) thành công!');
      return;
    }
    throw new Error('Không nhận được mã tệp từ máy chủ');
  } catch (err) {
    console.warn('Lỗi tải tệp Directus Files, chuyển sang chế độ nén Canvas:', err);
    try {
      // Fallback: Nếu không upload được file, nén qua Canvas 1920x1080
      const compressedBase64 = await compressImage(file, 1920, 1080, 0.85);
      currentLoginBg.value = compressedBase64;
      localStorage.setItem('custom_login_bg', compressedBase64);
      await saveAppSettings('custom_login_bg', compressedBase64);
      alert('Đã lưu ảnh nền đăng nhập thành công!');
    } catch (fallbackErr) {
      alert('Lỗi lưu ảnh nền: ' + (err.response?.data?.errors?.[0]?.message || err.message || fallbackErr.message));
    }
  } finally {
    event.target.value = '';
  }
};

const resetDefaultLoginBg = async () => {
  if (!confirm('Bạn có chắc muốn khôi phục lại ảnh nền đăng nhập mặc định?')) return;
  currentLoginBg.value = '';
  localStorage.removeItem('custom_login_bg');
  await saveAppSettings('custom_login_bg', null);
  alert('Đã khôi phục ảnh nền đăng nhập mặc định!');
};

// Cài đặt Ảnh nền Menu Bên Trái (Sidebar)
const sidebarBgFileInputRef = ref(null);
const currentSidebarBg = ref('');
const sidebarBgOpacity = ref(40);
const sidebarCustomColor = ref('#889962');

const sidebarColorPresets = [
  { color: '#889962', label: 'Xanh rêu' },
  { color: '#1e3a8a', label: 'Xanh dương' },
  { color: '#0f172a', label: 'Xanh đen' },
  { color: '#14532d', label: 'Xanh lá' },
  { color: '#7f1d1d', label: 'Đỏ đô' },
  { color: '#312e81', label: 'Tím than' },
  { color: '#1f2937', label: 'Xám đen' },
];

const sidebarCustomTextColor = ref('');
const sidebarTextColorPresets = [
  { color: '#000000', label: 'Đen mặc định' },
  { color: '#ffffff', label: 'Trắng sáng' },
  { color: '#fef08a', label: 'Vàng nhạt' },
  { color: '#334155', label: 'Xám đậm' },
  { color: '#14532d', label: 'Xanh lục đậm' },
];

const sidebarOrgTextColor = ref('');
const sidebarOrgColorPresets = [
  { color: '#000000', label: 'Đen mặc định' },
  { color: '#ffffff', label: 'Trắng sáng' },
  { color: '#fef08a', label: 'Vàng nhạt' },
  { color: '#1e3a8a', label: 'Xanh đậm' },
  { color: '#991b1b', label: 'Đỏ cờ' },
];

const sidebarSubtitleTextColor = ref('');
const sidebarSubtitleColorPresets = [
  { color: '#fde047', label: 'Vàng rực mặc định' },
  { color: '#ffffff', label: 'Trắng sáng' },
  { color: '#86efac', label: 'Xanh lá sáng' },
  { color: '#38bdf8', label: 'Xanh da trời' },
  { color: '#fed7aa', label: 'Cam nhạt' },
];

const loadSidebarBgSettings = async () => {
  try {
    const bgData = await getAppSettings('sidebar_custom_bg', null);
    if (bgData) currentSidebarBg.value = typeof bgData === 'string' ? bgData : (bgData.value || '');
    else currentSidebarBg.value = '';
    const op = await getAppSettings('sidebar_bg_opacity', null);
    if (op !== null && op !== undefined && op !== '') {
      sidebarBgOpacity.value = Number(op);
    } else {
      sidebarBgOpacity.value = 40;
    }
    const colorData = await getAppSettings('sidebar_custom_color', null);
    if (colorData) {
      sidebarCustomColor.value = typeof colorData === 'string' ? colorData : (colorData.value || '#889962');
    } else {
      sidebarCustomColor.value = '#889962';
    }
    const txtColorData = await getAppSettings('sidebar_custom_text_color', null);
    if (txtColorData) {
      sidebarCustomTextColor.value = typeof txtColorData === 'string' ? txtColorData : (txtColorData.value || '');
    } else {
      sidebarCustomTextColor.value = '';
    }
    const orgTxtColorData = await getAppSettings('sidebar_org_text_color', null);
    if (orgTxtColorData) {
      sidebarOrgTextColor.value = typeof orgTxtColorData === 'string' ? orgTxtColorData : (orgTxtColorData.value || '');
    } else {
      sidebarOrgTextColor.value = '';
    }
    const subTxtColorData = await getAppSettings('sidebar_subtitle_text_color', null);
    if (subTxtColorData) {
      sidebarSubtitleTextColor.value = typeof subTxtColorData === 'string' ? subTxtColorData : (subTxtColorData.value || '');
    } else {
      sidebarSubtitleTextColor.value = '';
    }
  } catch (err) {
    console.warn('Failed to load sidebar bg:', err);
  }
};

const saveSidebarCustomColor = async (color) => {
  if (color) sidebarCustomColor.value = color;
  try {
    localStorage.setItem('sidebar_custom_color', sidebarCustomColor.value);
    await saveAppSettings('sidebar_custom_color', sidebarCustomColor.value);
    window.dispatchEvent(new CustomEvent('sidebar-bg-updated'));
  } catch (e) {}
};

const saveSidebarCustomTextColor = async (color) => {
  if (color !== undefined) sidebarCustomTextColor.value = color;
  try {
    localStorage.setItem('sidebar_custom_text_color', sidebarCustomTextColor.value);
    await saveAppSettings('sidebar_custom_text_color', sidebarCustomTextColor.value);
    window.dispatchEvent(new CustomEvent('sidebar-bg-updated'));
  } catch (e) {}
};

const saveSidebarOrgTextColor = async (color) => {
  if (color !== undefined) sidebarOrgTextColor.value = color;
  try {
    localStorage.setItem('sidebar_org_text_color', sidebarOrgTextColor.value);
    await saveAppSettings('sidebar_org_text_color', sidebarOrgTextColor.value);
    window.dispatchEvent(new CustomEvent('sidebar-bg-updated'));
  } catch (e) {}
};

const saveSidebarSubtitleTextColor = async (color) => {
  if (color !== undefined) sidebarSubtitleTextColor.value = color;
  try {
    localStorage.setItem('sidebar_subtitle_text_color', sidebarSubtitleTextColor.value);
    await saveAppSettings('sidebar_subtitle_text_color', sidebarSubtitleTextColor.value);
    window.dispatchEvent(new CustomEvent('sidebar-bg-updated'));
  } catch (e) {}
};

const triggerUploadSidebarBg = () => sidebarBgFileInputRef.value?.click();

const handleUploadSidebarBg = async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  try {
    const uploaded = await uploadFile(file);
    if (uploaded && uploaded.id) {
      const bgUrl = getFileUrl(uploaded.id);
      currentSidebarBg.value = bgUrl;
      localStorage.setItem('sidebar_custom_bg', bgUrl);
      await saveAppSettings('sidebar_custom_bg', bgUrl);
      window.dispatchEvent(new CustomEvent('sidebar-bg-updated'));
      alert('Đã tải lên và lưu ảnh nền Menu bên trái thành công!');
      return;
    }
    throw new Error('Không nhận được mã tệp');
  } catch (err) {
    try {
      const compressedBase64 = await compressImage(file, 1920, 1080, 0.85);
      currentSidebarBg.value = compressedBase64;
      localStorage.setItem('sidebar_custom_bg', compressedBase64);
      await saveAppSettings('sidebar_custom_bg', compressedBase64);
      window.dispatchEvent(new CustomEvent('sidebar-bg-updated'));
      alert('Đã lưu ảnh nền Menu bên trái thành công!');
    } catch (fallbackErr) {
      alert('Lỗi lưu ảnh: ' + (fallbackErr.message || err.message));
    }
  } finally {
    event.target.value = '';
  }
};

const saveSidebarBgOpacity = async () => {
  try {
    localStorage.setItem('sidebar_bg_opacity', String(sidebarBgOpacity.value));
    await saveAppSettings('sidebar_bg_opacity', Number(sidebarBgOpacity.value));
    window.dispatchEvent(new CustomEvent('sidebar-bg-updated'));
  } catch (e) {}
};

const resetDefaultSidebarBg = async () => {
  if (!confirm('Bạn có chắc muốn khôi phục lại nền Menu mặc định (xanh rêu #889962)?')) return;
  currentSidebarBg.value = '';
  sidebarBgOpacity.value = 40;
  sidebarCustomColor.value = '#889962';
  sidebarCustomTextColor.value = '';
  sidebarOrgTextColor.value = '';
  sidebarSubtitleTextColor.value = '';
  try {
    localStorage.removeItem('sidebar_custom_bg');
    localStorage.setItem('sidebar_bg_opacity', '40');
    localStorage.setItem('sidebar_custom_color', '#889962');
    localStorage.removeItem('sidebar_custom_text_color');
    localStorage.removeItem('sidebar_org_text_color');
    localStorage.removeItem('sidebar_subtitle_text_color');
  } catch (e) {}
  await saveAppSettings('sidebar_custom_bg', null);
  await saveAppSettings('sidebar_bg_opacity', 40);
  await saveAppSettings('sidebar_custom_color', '#889962');
  await saveAppSettings('sidebar_custom_text_color', '');
  await saveAppSettings('sidebar_org_text_color', '');
  await saveAppSettings('sidebar_subtitle_text_color', '');
  window.dispatchEvent(new CustomEvent('sidebar-bg-updated'));
  alert('Đã khôi phục nền Menu mặc định!');
};

// Quản lý Danh sách Mẫu Word (.docx)
const tplFileInputRef = ref(null);
const docxTemplates = ref([]);

const hasCustomDefaultTemplate = computed(() => {
  return docxTemplates.value.some((t) => t.isDefault);
});

const loadDocxTemplates = async () => {
  try {
    const saved = await getAppSettings('system_docx_templates', []);
    if (Array.isArray(saved)) {
      docxTemplates.value = saved;
    }
  } catch (err) {
    console.error('Error loading docx templates:', err);
  }
};

const handleUploadDocxTemplate = async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const base64 = e.target.result.split(',')[1];
      const newTpl = {
        id: 'tpl_' + Date.now(),
        name: file.name,
        size: file.size,
        base64: base64,
        isDefault: docxTemplates.value.length === 0,
        uploadedAt: new Date().toLocaleString('vi-VN'),
      };
      const updated = [...docxTemplates.value, newTpl];
      docxTemplates.value = updated;
      await saveAppSettings('system_docx_templates', updated);
      alert(`Đã tải lên tệp mẫu "${file.name}" thành công!`);
    } catch (err) {
      alert('Lỗi lưu mẫu: ' + err.message);
    }
  };
  reader.readAsDataURL(file);
  event.target.value = '';
};

const setAsDefaultTemplate = async (templateId) => {
  const updated = docxTemplates.value.map((t) => ({
    ...t,
    isDefault: t.id === templateId,
  }));
  docxTemplates.value = updated;
  await saveAppSettings('system_docx_templates', updated);
};

const setSystemAsDefault = async () => {
  const updated = docxTemplates.value.map((t) => ({
    ...t,
    isDefault: false,
  }));
  docxTemplates.value = updated;
  await saveAppSettings('system_docx_templates', updated);
};

const deleteSavedTemplate = async (templateId) => {
  const tpl = docxTemplates.value.find((t) => t.id === templateId);
  const name = tpl?.name || 'mẫu này';
  if (!confirm(`Bạn có chắc chắn muốn xóa tệp mẫu "${name}" khỏi hệ thống không?`)) return;
  const updated = docxTemplates.value.filter((t) => t.id !== templateId);
  docxTemplates.value = updated;
  await saveAppSettings('system_docx_templates', updated);
  await saveAppSettings('custom_docx_template', null);
  alert(`Đã xóa tệp mẫu "${name}" thành công!`);
};

const downloadSavedTemplate = (tpl) => {
  if (!tpl.base64) return;
  const byteCharacters = atob(tpl.base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
  saveAs(blob, tpl.name || 'Mau_Word.docx');
};

const availablePersonnelCols = computed(() => {
  const cols = [];
  let idx = 0;
  (personnelGroups.value || []).forEach((g) => {
    (g.columns || []).forEach((c) => {
      idx++;
      if (c.id && c.id !== 'stt') {
        cols.push({ id: c.id, label: c.label || c.id, colIndex: idx });
      }
    });
  });
  return cols;
});

const availableRelativeCols = computed(() => {
  const cols = [];
  let idx = 0;
  (relativeGroups.value || []).forEach((g) => {
    (g.columns || []).forEach((c) => {
      idx++;
      if (c.id && c.id !== 'stt') {
        cols.push({ id: c.id, label: c.label || c.id, colIndex: idx });
      }
    });
  });
  return cols;
});

const availableTripCols = computed(() => {
  const cols = [];
  let idx = 0;
  (tripsGroups.value || []).forEach((g) => {
    (g.columns || []).forEach((c) => {
      idx++;
      if (c.id && c.id !== 'stt') {
        cols.push({ id: c.id, label: c.label || c.id, colIndex: idx });
      }
    });
  });
  return cols;
});

const currentActiveFormulaCols = computed(() => {
  if (activeTab.value === 'personnel') return availablePersonnelCols.value;
  if (activeTab.value === 'trips') return availableTripCols.value;
  return availableRelativeCols.value;
});

const DEFAULT_RELATIVE_MAPPING = [
  {
    group: 'Thông tin Thân nhân',
    isMultiple: true,
    columns: [
      { id: 'parentName', label: 'Họ tên Cán bộ', width: '25', format: 'text' },
      { id: 'cccdparent', label: 'CCCD Cán bộ liên quan', width: '25', format: 'text' },
      { id: 'relationshipName', label: 'Mối quan hệ', width: '25', format: 'dropdown', options: 'Bố, Mẹ, Vợ, Chồng, Con đẻ, Con nuôi, Anh, Chị, Em ruột, Bố chồng/vợ, Mẹ chồng/vợ' },
      { id: 'relativeName', label: 'Họ và tên thân nhân', width: '25', format: 'text' },
      { id: 'cccdthannhan', label: 'CCCD thân nhân', width: '25', format: 'text' },
      { id: 'birthYear', label: 'Năm sinh', width: '25', format: 'number' },
      { id: 'currentAddress', label: 'Nơi ở hiện nay', width: '50', format: 'text' },
      { id: 'occupation', label: 'Nghề nghiệp / Nơi làm việc', width: '50', format: 'text' },
      { id: 'countryName', label: 'Quốc gia định cư / lưu trú', width: '33', format: 'text' },
      { id: 'passportNumber', label: 'Số Hộ chiếu thân nhân', width: '25', format: 'text' },
      { id: 'notes', label: 'Ghi chú', width: '50', format: 'text' },
    ],
  },
];

const DEFAULT_TRIPS_MAPPING = [
  {
    group: 'Chuyến đi',
    isMultiple: false,
    columns: [
      { id: 'cccdchuyendi', label: 'CCCD / Định danh người đi (cccdchuyendi)', width: '25', format: 'text', placeholder: 'Nhập CCCD Cán bộ hoặc Thân nhân' },
      { id: 'countryName', label: 'Quốc gia / Nơi đến', width: '33', format: 'text', placeholder: 'Nhập quốc gia' },
      { id: 'departureDate', label: 'Ngày xuất cảnh', width: '25', format: 'date', placeholder: 'DD/MM/YYYY' },
      { id: 'arrivalDate', label: 'Ngày nhập cảnh', width: '25', format: 'date', placeholder: 'DD/MM/YYYY' },
      { id: 'decisionNumber', label: 'Số quyết định duyệt', width: '33', format: 'text', placeholder: 'VD: 1234/QĐ-UBND' },
      { id: 'decisionDate', label: 'Ngày quyết định', width: '25', format: 'date', placeholder: 'DD/MM/YYYY' },
      { id: 'fundingName', label: 'Nguồn kinh phí', width: '33', format: 'dropdown', options: 'Ngân sách nhà nước, Tài trợ, Tự túc, Khác' },
      { id: 'purpose', label: 'Mục đích chuyến đi', width: '50', format: 'text', placeholder: 'Công tác, Du lịch, Thăm thân...' },
      { id: 'passportNumber', label: 'Số Hộ chiếu', width: '25', format: 'text' },
      { id: 'approvedDepartureDate', label: 'Ngày đi duyệt', width: '25', format: 'date' },
      { id: 'approvedArrivalDate', label: 'Ngày về duyệt', width: '25', format: 'date' },
      { id: 'approvedExtensionDate', label: 'Ngày gia hạn duyệt', width: '25', format: 'date' },
    ],
  },
];


const widthOptions = [
  { label: 'Rộng: 25%', value: '25' },
  { label: 'Rộng: 33%', value: '33' },
  { label: 'Rộng: 50%', value: '50' },
  { label: 'Rộng: 75%', value: '75' },
  { label: 'Rộng: 100%', value: '100' },
];

const generateSlug = (str) => {
  if (!str) return 'cot_' + Date.now();
  const slug = str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return slug || 'cot_' + Date.now();
};

const getSubOptions = (col) => {
  if (col.format === 'checkbox_text' && col.options) {
    return String(col.options)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
};

const normalizeGroupColumns = (groups) => {
  (groups || []).forEach((g) => {
    (g.columns || []).forEach((c) => {
      if (!c.width) c.width = '25';
      if (c.id && c.id.startsWith('custom_') && c.label) {
        const cleanSlug = generateSlug(c.label);
        if (cleanSlug) c.id = cleanSlug;
      }
    });
  });
  return groups;
};

// =========================================================================
// QUẢN LÝ DASHBOARD CHUYÊN ĐỀ (DYNAMIC TOPIC DASHBOARDS)
// =========================================================================
const DEFAULT_TOPIC_DASHBOARDS_CONFIG = DEFAULT_UNIFIED_DASHBOARDS;

const getInitialCustomDashboards = () => {
  try {
    const local = localStorage.getItem('custom_dashboards_config');
    if (local) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed) && parsed.length > 0) return ensureStandardDashboards(parsed);
    }
  } catch (e) {}
  return ensureStandardDashboards([...DEFAULT_UNIFIED_DASHBOARDS]);
};

const customDashboards = ref(getInitialCustomDashboards());
const selectedDashboardIdx = ref(0);
const dashboardSaveStatus = ref(''); // '', 'saving', 'saved'
let isDashboardLoaded = false;
let autoSaveTimer = null;
let lastSavedDashboardsJson = '';

const currentSelectedDashboard = computed(() => {
  return customDashboards.value[selectedDashboardIdx.value] || customDashboards.value[0] || null;
});

const loadCustomDashboards = async () => {
  try {
    const saved = await getAppSettings('custom_dashboards_config', null);
    if (saved && Array.isArray(saved) && saved.length > 0) {
      customDashboards.value = ensureStandardDashboards(saved);
      localStorage.setItem('custom_dashboards_config', JSON.stringify(customDashboards.value));
    } else {
      const local = localStorage.getItem('custom_dashboards_config');
      if (local && (!customDashboards.value || customDashboards.value.length === 0)) {
        customDashboards.value = ensureStandardDashboards(JSON.parse(local));
      } else {
        customDashboards.value = ensureStandardDashboards(customDashboards.value);
      }
    }
    // Sanitize card IDs: đảm bảo các thẻ con không bị trùng id: 'all' với thẻ gốc
    customDashboards.value.forEach((dash) => {
      (dash.metricCards || []).forEach((c, idx) => {
        if (idx > 0 && (!c.id || c.id === 'all')) {
          c.id = 'card_' + (dash.id || 'dash') + '_' + idx;
        }
      });
    });
  } catch (e) {
    console.error('Error loading custom dashboards:', e);
  } finally {
    setTimeout(() => {
      lastSavedDashboardsJson = JSON.stringify(customDashboards.value);
      isDashboardLoaded = true;
    }, 150);
  }
};

const debouncedAutoSaveDashboards = () => {
  if (!isDashboardLoaded) return;
  const currentJson = JSON.stringify(customDashboards.value);
  if (currentJson === lastSavedDashboardsJson) return;

  dashboardSaveStatus.value = 'saving';
  try {
    localStorage.setItem('custom_dashboards_config', currentJson);
  } catch (e) {}

  if (autoSaveTimer) clearTimeout(autoSaveTimer);
  autoSaveTimer = setTimeout(async () => {
    try {
      await saveAppSettings('custom_dashboards_config', customDashboards.value);
      lastSavedDashboardsJson = JSON.stringify(customDashboards.value);
      dashboardSaveStatus.value = 'saved';
      console.log('Auto-saved custom dashboards config to DB.');
      setTimeout(() => {
        if (dashboardSaveStatus.value === 'saved') dashboardSaveStatus.value = '';
      }, 2500);
    } catch (e) {
      console.error('Error auto-saving custom dashboards:', e);
      dashboardSaveStatus.value = '';
    }
  }, 600);
};

watch(
  customDashboards,
  () => {
    debouncedAutoSaveDashboards();
  },
  { deep: true }
);

const saveDashboardsConfig = async () => {
  if (autoSaveTimer) clearTimeout(autoSaveTimer);
  try {
    // Sanitize card IDs trước khi lưu
    customDashboards.value.forEach((dash) => {
      (dash.metricCards || []).forEach((c, idx) => {
        if (idx > 0 && (!c.id || c.id === 'all')) {
          c.id = 'card_' + (dash.id || 'dash') + '_' + idx;
        }
      });
    });
    const currentJson = JSON.stringify(customDashboards.value);
    localStorage.setItem('custom_dashboards_config', currentJson);
    await saveAppSettings('custom_dashboards_config', customDashboards.value);
    lastSavedDashboardsJson = currentJson;
    dashboardSaveStatus.value = 'saved';
    alert('Đã lưu cấu hình Dashboard thành công! Thanh menu và trang Dashboard đã được cập nhật.');
  } catch (e) {
    console.error('Error saving custom dashboards:', e);
    alert('Đã lưu cục bộ thành công!');
  }
};

const resetDefaultDashboards = async () => {
  if (!confirm('Bạn có chắc muốn khôi phục danh sách Dashboard về mặc định ban đầu không?')) return;
  customDashboards.value = JSON.parse(JSON.stringify(DEFAULT_TOPIC_DASHBOARDS_CONFIG));
  selectedDashboardIdx.value = 0;
  await saveDashboardsConfig();
};

const addNewDashboard = () => {
  const newId = 'dash_' + Date.now();
  const newDash = {
    id: newId,
    code: 'DB-' + (customDashboards.value.length + 1),
    title: 'Dashboard Mới ' + (customDashboards.value.length + 1),
    description: '',
    source: 'trips',
    icon: 'pi-chart-pie',
    metricCards: [
      { id: 'all', label: 'Toàn bộ', condition: 'all', color: 'blue' },
    ],
    columns: [], // Để trống = Mặc định hiển thị đầy đủ toàn bộ cột khả dụng của chuyên đề
  };
  customDashboards.value.push(newDash);
  selectedDashboardIdx.value = customDashboards.value.length - 1;
};

const moveDashboardUp = async (idx) => {
  if (idx <= 0) return;
  const temp = customDashboards.value[idx];
  customDashboards.value[idx] = customDashboards.value[idx - 1];
  customDashboards.value[idx - 1] = temp;
  selectedDashboardIdx.value = idx - 1;
  debouncedAutoSaveDashboards();
};

const moveDashboardDown = async (idx) => {
  if (idx >= customDashboards.value.length - 1) return;
  const temp = customDashboards.value[idx];
  customDashboards.value[idx] = customDashboards.value[idx + 1];
  customDashboards.value[idx + 1] = temp;
  selectedDashboardIdx.value = idx + 1;
  debouncedAutoSaveDashboards();
};

const removeDashboard = async (idx) => {
  const d = customDashboards.value[idx];
  if (!confirm(`Bạn có chắc chắn muốn xóa Dashboard "${d.title}" không?`)) return;
  customDashboards.value.splice(idx, 1);
  if (selectedDashboardIdx.value >= customDashboards.value.length) {
    selectedDashboardIdx.value = Math.max(0, customDashboards.value.length - 1);
  }
  await saveDashboardsConfig();
};

const addMetricCardToDashboard = (dash) => {
  if (!dash.metricCards) dash.metricCards = [];
  dash.metricCards.push({
    id: 'card_' + Date.now(),
    label: 'Chỉ số ' + (dash.metricCards.length + 1),
    condition: 'all',
    color: 'blue',
    widthPercent: '',
    showCompareCol: false,
    logicOp: 'AND',
    conditions: [
      { id: 'cond_' + Date.now(), field: '', operator: 'has_value', value: '' }
    ],
  });
};

const getCardConditions = (card) => {
  if (!card) return [];
  if (!card.conditions || !Array.isArray(card.conditions)) {
    if (card.field) {
      card.conditions = [
        { id: 'cond_1', field: card.field, operator: card.operator || 'has_value', value: card.value || '' }
      ];
    } else {
      card.conditions = [
        { id: 'cond_1', field: '', operator: 'has_value', value: '' }
      ];
    }
  }
  // Tự động chuẩn hoá điều kiện đối tượng (isRelative) sang operator 'equals' và value 'Cán bộ'
  card.conditions.forEach((cond) => {
    if (cond.field === 'isRelative' || cond.field === '_doiTuong' || cond.field === 'doi_tuong') {
      if (!cond.operator || cond.operator === 'has_value') {
        cond.operator = 'equals';
      }
      if (!cond.value || cond.value === '') {
        cond.value = 'Cán bộ';
      }
    }
    if (cond.field === 'presenceStatus' || cond.field === '_presenceStatus') {
      if (!cond.operator || cond.operator === 'has_value') {
        cond.operator = 'equals';
      }
      if (!cond.value || cond.value === '') {
        cond.value = 'Đang ở nước ngoài';
      }
    }
  });
  if (!card.logicOp) {
    card.logicOp = (card.conditions && card.conditions.length > 1) ? 'OR' : 'AND';
  }
  return card.conditions;
};

const onCardConditionFieldChange = (cond) => {
  if (!cond) return;
  if (cond.field === 'isRelative' || cond.field === '_doiTuong' || cond.field === 'doi_tuong') {
    cond.operator = 'equals';
    if (!cond.value || cond.value === '') {
      cond.value = 'Cán bộ';
    }
  } else if (cond.field === 'presenceStatus' || cond.field === '_presenceStatus') {
    cond.operator = 'equals';
    if (!cond.value || cond.value === '') {
      cond.value = 'Đang ở nước ngoài';
    }
  } else if (!cond.operator) {
    cond.operator = 'has_value';
  }
};

const addConditionToCard = (card) => {
  const conds = getCardConditions(card);
  conds.push({
    id: 'cond_' + Date.now(),
    field: '',
    operator: 'has_value',
    value: ''
  });
};

const removeConditionFromCard = (card, condIdx) => {
  const conds = getCardConditions(card);
  if (conds.length <= 1) {
    conds[0].field = '';
    conds[0].operator = 'has_value';
    conds[0].value = '';
    card.field = '';
  } else {
    conds.splice(condIdx, 1);
  }
};

const removeMetricCard = (dash, cIdx) => {
  dash.metricCards.splice(cIdx, 1);
  debouncedAutoSaveDashboards();
};

const moveMetricCard = (dash, cIdx, direction) => {
  const targetIdx = cIdx + direction;
  if (!dash || !dash.metricCards || targetIdx < 0 || targetIdx >= dash.metricCards.length) return;
  const temp = dash.metricCards[cIdx];
  dash.metricCards[cIdx] = dash.metricCards[targetIdx];
  dash.metricCards[targetIdx] = temp;
  debouncedAutoSaveDashboards();
};

const isCardHidden = (card) => {
  if (!card) return false;
  if (card.hidden === true) return true;
  if (card.widthPercent === 0 || card.widthPercent === '0') return true;
  return false;
};

const toggleCardHidden = (card) => {
  if (!card) return;
  if (isCardHidden(card)) {
    card.hidden = false;
    card.widthPercent = '';
  } else {
    card.hidden = true;
    card.widthPercent = 0;
  }
  debouncedAutoSaveDashboards();
};

const onCardWidthChange = (card, val) => {
  if (!card) return;
  if (val === '0' || val === 0 || Number(val) === 0) {
    card.widthPercent = 0;
    card.hidden = true;
  } else {
    card.hidden = false;
    card.widthPercent = val === '' ? '' : Number(val);
  }
  debouncedAutoSaveDashboards();
};

const getCardColorTheme = (color, isHidden = false) => {
  if (isHidden) {
    return {
      cardBg: '#f8fafc',
      cardBorder: '#cbd5e1',
      titleBg: '#f1f5f9',
      titleColor: '#1e293b',
      titleBorder: '#cbd5e1',
      dot: '#94a3b8',
      cardOpacity: '0.92',
    };
  }
  switch (color) {
    case 'green':
      return {
        cardBg: '#fafffd',
        cardBorder: '#bbf7d0',
        titleBg: '#dcfce7',
        titleColor: '#166534',
        titleBorder: '#86efac',
        dot: '#16a34a',
        cardOpacity: '1',
      };
    case 'amber':
      return {
        cardBg: '#fffdfa',
        cardBorder: '#fde68a',
        titleBg: '#fef3c7',
        titleColor: '#92400e',
        titleBorder: '#fcd34d',
        dot: '#d97706',
        cardOpacity: '1',
      };
    case 'red':
      return {
        cardBg: '#fffafa',
        cardBorder: '#fecaca',
        titleBg: '#fee2e2',
        titleColor: '#991b1b',
        titleBorder: '#fca5a5',
        dot: '#dc2626',
        cardOpacity: '1',
      };
    case 'purple':
      return {
        cardBg: '#fdfaff',
        cardBorder: '#e9d5ff',
        titleBg: '#f3e8ff',
        titleColor: '#6b21a8',
        titleBorder: '#d8b4fe',
        dot: '#9333ea',
        cardOpacity: '1',
      };
    case 'blue':
    default:
      return {
        cardBg: '#faffff',
        cardBorder: '#bae6fd',
        titleBg: '#e0f2fe',
        titleColor: '#075985',
        titleBorder: '#7dd3fc',
        dot: '#0284c7',
        cardOpacity: '1',
      };
  }
};

const categorizedDashboardCols = computed(() => {
  const groups = [];

  // 0. Nhóm Thuộc tính hệ thống & Phân loại (Dùng cho Thẻ KPI & Bộ lọc cơ sở)
  groups.push({
    category: '⚡ Thuộc tính & Phân loại (Bộ lọc)',
    options: [
      { id: 'isRelative', label: 'Đối tượng: Cán bộ / Thân nhân', displayLabel: '⚡ Đối tượng (Cán bộ hay Thân nhân) - isRelative' },
      { id: 'presenceStatus', label: 'Trạng thái hiện diện (Trong nước / Nước ngoài / Quá hạn)', displayLabel: '⚡ Trạng thái hiện diện (Trong nước / Nước ngoài / Quá hạn) - presenceStatus' },
    ],
  });

  // 1. Nhóm Chuyến đi (Trips)
  const tripCols = (availableTripCols.value || []).map((c, idx) => ({
    ...c,
    displayLabel: `Cột ${c.colIndex || idx + 1}: ${c.label || c.id} (${c.id})`,
  }));
  if (tripCols.length > 0) {
    groups.push({ category: '✈️ Bảng Chuyến đi (Trips)', options: tripCols });
  }

  // 2. Nhóm Thân nhân (Relatives)
  const relCols = (availableRelativeCols.value || []).map((c, idx) => ({
    ...c,
    displayLabel: `Cột ${c.colIndex || idx + 1}: ${c.label || c.id} (${c.id})`,
  }));
  if (relCols.length > 0) {
    groups.push({ category: '👨‍👩‍👧 Bảng Thân nhân (Relatives)', options: relCols });
  }

  // 3. Nhóm Cán bộ (Personnel)
  const pCols = (availablePersonnelCols.value || []).map((c, idx) => ({
    ...c,
    displayLabel: `Cột ${c.colIndex || idx + 1}: ${c.label || c.id} (${c.id})`,
  }));
  if (pCols.length > 0) {
    groups.push({ category: '📌 Bảng Cán bộ (Personnel)', options: pCols });
  }

  return groups;
});

const availableDashboardCols = computed(() => {
  const all = [];
  categorizedDashboardCols.value.forEach((grp) => {
    all.push(...grp.options);
  });
  return all;
});

const currentDashboardSourceCols = computed(() => {
  if (!currentSelectedDashboard.value) return [];
  const src = currentSelectedDashboard.value.source || 'trips';
  if (src === 'personnel') {
    return availablePersonnelCols.value || [];
  } else if (src === 'relatives') {
    return availableRelativeCols.value || [];
  } else {
    return [
      ...(availableTripCols.value || []),
      { id: '_parentPersonnelName', label: 'CB liên quan (Tên)', colIndex: '★' },
      { id: '_parentPosition', label: 'CB liên quan (Chức vụ)', colIndex: '★' },
      { id: '_parentDepartment', label: 'CB liên quan (Đơn vị)', colIndex: '★' },
    ];
  }
});

const isDashboardColumnSelected = (colId) => {
  if (!currentSelectedDashboard.value) return false;
  const cols = currentSelectedDashboard.value.columns;
  if (!cols || !Array.isArray(cols) || cols.length === 0) {
    return true; // Mặc định không cấu hình = chọn tất cả
  }
  return cols.includes(colId);
};

const toggleDashboardColumn = (colId) => {
  if (!currentSelectedDashboard.value) return;
  if (!currentSelectedDashboard.value.columns || !Array.isArray(currentSelectedDashboard.value.columns) || currentSelectedDashboard.value.columns.length === 0) {
    currentSelectedDashboard.value.columns = currentDashboardSourceCols.value.map((c) => c.id);
  }
  const idx = currentSelectedDashboard.value.columns.indexOf(colId);
  if (idx > -1) {
    currentSelectedDashboard.value.columns.splice(idx, 1);
  } else {
    currentSelectedDashboard.value.columns.push(colId);
  }
  debouncedAutoSaveDashboards();
};

const selectAllDashboardColumns = () => {
  if (!currentSelectedDashboard.value) return;
  currentSelectedDashboard.value.columns = currentDashboardSourceCols.value.map((c) => c.id);
  debouncedAutoSaveDashboards();
};

const resetDashboardColumns = () => {
  if (!currentSelectedDashboard.value) return;
  currentSelectedDashboard.value.columns = []; // Để trống = Mặc định hiển thị toàn bộ
  debouncedAutoSaveDashboards();
};

const currentScopeConditions = computed(() => {
  if (!currentSelectedDashboard.value) return [];
  if (!currentSelectedDashboard.value.scopeConditions) {
    if (currentSelectedDashboard.value.metricCards && currentSelectedDashboard.value.metricCards.length > 0) {
      const c0 = currentSelectedDashboard.value.metricCards[0];
      if (Array.isArray(c0.conditions) && c0.conditions.length > 0) {
        currentSelectedDashboard.value.scopeConditions = JSON.parse(JSON.stringify(c0.conditions));
      } else if (c0.condition && c0.condition !== 'all') {
        currentSelectedDashboard.value.scopeConditions = [
          {
            id: 'sc_init_1',
            field: c0.conditionField || '',
            operator: c0.conditionOp || 'equals',
            value: c0.conditionVal || '',
          },
        ];
      } else {
        currentSelectedDashboard.value.scopeConditions = [];
      }
    } else {
      currentSelectedDashboard.value.scopeConditions = [];
    }
  }
  return currentSelectedDashboard.value.scopeConditions;
});

const syncScopeToMetricCards = () => {
  if (!currentSelectedDashboard.value) return;
  if (!currentSelectedDashboard.value.metricCards) {
    currentSelectedDashboard.value.metricCards = [];
  }
  if (currentSelectedDashboard.value.metricCards.length === 0) {
    currentSelectedDashboard.value.metricCards.push({
      id: 'all',
      label: currentSelectedDashboard.value.title || 'Tổng cộng',
      condition: 'all',
      color: 'blue',
    });
  }
  const c0 = currentSelectedDashboard.value.metricCards[0];
  c0.conditions = JSON.parse(JSON.stringify(currentSelectedDashboard.value.scopeConditions || []));
  c0.logicOp = currentSelectedDashboard.value.scopeLogicOp || 'AND';
  if (c0.conditions.length === 0) {
    c0.condition = 'all';
  } else {
    c0.condition = 'custom';
  }
  debouncedAutoSaveDashboards();
};

const addScopeCondition = () => {
  if (!currentSelectedDashboard.value) return;
  if (!currentSelectedDashboard.value.scopeConditions) {
    currentSelectedDashboard.value.scopeConditions = [];
  }
  currentSelectedDashboard.value.scopeConditions.push({
    id: 'sc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
    field: '',
    operator: 'equals',
    value: '',
  });
  syncScopeToMetricCards();
};

const removeScopeCondition = (idx) => {
  if (!currentSelectedDashboard.value || !currentSelectedDashboard.value.scopeConditions) return;
  currentSelectedDashboard.value.scopeConditions.splice(idx, 1);
  syncScopeToMetricCards();
};

const openTopicDashboard = (id) => {
  if (id === 'trips') router.push('/trips');
  else router.push(`/dashboard-topic/${id}`);
};

onMounted(async () => {
  if (route.query.tab) {
    activeTab.value = route.query.tab;
  }
  loadSystemBranding();
  await personnelStore.loadSettings();
  personnelGroups.value = normalizeGroupColumns(JSON.parse(JSON.stringify(personnelStore.importMappingPersonnel || [])));
  relativeGroups.value = normalizeGroupColumns(
    personnelStore.importMappingRelative && personnelStore.importMappingRelative.length > 0
      ? JSON.parse(JSON.stringify(personnelStore.importMappingRelative))
      : JSON.parse(JSON.stringify(DEFAULT_RELATIVE_MAPPING))
  );
  tripsGroups.value = normalizeGroupColumns(
    personnelStore.importMappingTrips && personnelStore.importMappingTrips.length > 0
      ? JSON.parse(JSON.stringify(personnelStore.importMappingTrips))
      : JSON.parse(JSON.stringify(DEFAULT_TRIPS_MAPPING))
  );
  personnelKeyField.value = personnelStore.getPersonnelKeyField();
  personnelNameField.value = personnelStore.getPersonnelNameField();
  personnelPositionField.value = personnelStore.getPersonnelPositionField();
  personnelDepartmentField.value = personnelStore.getPersonnelDepartmentField();
  relativeParentKeyField.value = personnelStore.getRelativeParentKeyField();
  relativeKeyField.value = personnelStore.getRelativeKeyField();
  tripKeyField.value = personnelStore.getTripKeyField();
  // Nạp song song đồng thời các tài nguyên nền, không gây đứng/lag giao diện Chuyên đề
  Promise.allSettled([
    loadCustomDashboards(),
    loadDocxTemplates(),
    loadLoginBg(),
    loadSidebarBgSettings(),
  ]);
});

const currentGroups = computed(() => {
  if (activeTab.value === 'personnel') return personnelGroups.value;
  if (activeTab.value === 'relative') return relativeGroups.value;
  if (activeTab.value === 'trips') return tripsGroups.value;
  return [];
});

const isSeedingData = ref(false);
const handleSeedTrips = async () => {
  if (!confirm('Hệ thống sẽ tạo 20 bản ghi chuyến đi mẫu (10 cho Cán bộ & 10 cho Thân nhân) với đầy đủ thông tin chuẩn hóa. Tiếp tục?')) return;
  isSeedingData.value = true;
  try {
    await personnelStore.seedSampleTripsData();
    alert('Đã tạo thành công 20 dữ liệu chuyến đi mẫu cho 10 cán bộ và 10 thân nhân!');
  } catch (e) {
    alert('Lỗi tạo dữ liệu mẫu: ' + (e.message || e));
  } finally {
    isSeedingData.value = false;
  }
};

// Tra cứu thẻ Tag (Tab 3)
const personnelColMap = computed(() => {
  return computeColumnIndexMap(personnelGroups.value || []);
});

const relativeColMap = computed(() => {
  return computeColumnIndexMap(relativeGroups.value || []);
});

const tripsColMap = computed(() => {
  return computeColumnIndexMap(tripsGroups.value || []);
});

const allAvailableTags = computed(() => {
  const tags = [];
  const pMap = personnelColMap.value;
  const rMap = relativeColMap.value;

  // 1. Cán bộ
  (personnelGroups.value || []).forEach((g) => {
    (g.columns || []).forEach((col) => {
      const colNum = pMap[col.id] || '';
      if (col.format === 'table_loop') {
        tags.push({
          label: `Bảng lặp: ${col.label}`,
          tag: `{#${col.id}}...{col0}, {col1}...{/${col.id}}`,
          category: 'personnel',
          colNum,
        });
      } else if ((col.format === 'checkbox_text' || col.format === 'checkbox') && col.options) {
        tags.push({
          label: `${col.label} (Toàn bộ tên + nội dung)`,
          tag: `{${col.id}}`,
          category: 'personnel',
          colNum,
        });
        tags.push({
          label: `${col.label} -> Tên mục đã tích chọn`,
          tag: `{label_${col.id}}`,
          category: 'personnel',
          colNum,
        });
        if (col.format === 'checkbox_text') {
          tags.push({
            label: `${col.label} -> Chi tiết Text đã nhập`,
            tag: `{detail_${col.id}}`,
            category: 'personnel',
            colNum,
          });
        }
        const opts = String(col.options).split(',').map((s) => s.trim()).filter(Boolean);
        opts.forEach((optName) => {
          const optSlug = generateSlug(optName);
          if (optSlug) {
            tags.push({
              label: `${col.label} -> [Tích X ${optName}]`,
              tag: `{is_${col.id}_${optSlug}}`,
              category: 'personnel',
              colNum,
            });
          }
        });
      } else {
        tags.push({
          label: col.label,
          tag: `{${col.id}}`,
          category: 'personnel',
          colNum,
        });
      }
    });
  });

  // 2. Thân nhân
  (relativeGroups.value || []).forEach((g) => {
    (g.columns || []).forEach((col) => {
      const colNum = rMap[col.id] || '';
      if ((col.format === 'checkbox_text' || col.format === 'checkbox') && col.options) {
        tags.push({
          label: `[Thân nhân] ${col.label} (Đầy đủ)`,
          tag: `{${col.id}}`,
          category: 'relatives',
          colNum,
        });
        tags.push({
          label: `[Thân nhân] ${col.label} -> Tên mục đã chọn`,
          tag: `{label_${col.id}}`,
          category: 'relatives',
          colNum,
        });
        if (col.format === 'checkbox_text') {
          tags.push({
            label: `[Thân nhân] ${col.label} -> Chi tiết`,
            tag: `{detail_${col.id}}`,
            category: 'relatives',
            colNum,
          });
        }
      } else {
        tags.push({
          label: `[Thân nhân] ${col.label}`,
          tag: `{${col.id}}`,
          category: 'relatives',
          colNum,
        });
      }
    });
  });

  // 3. Khối lặp Chuyến đi & Thân nhân
  tags.push(
    { label: 'Khối lặp Chuyến đi nước ngoài (Bắt đầu)', tag: '{#xuatnhapcanh}', category: 'trips', colNum: 'Chuyến đi' },
    { label: 'Khối lặp Chuyến đi nước ngoài (Kết thúc)', tag: '{/xuatnhapcanh}', category: 'trips', colNum: 'Chuyến đi' },
    { label: '[Chuyến đi] Quốc gia đến', tag: '{countryName}', category: 'trips', colNum: '' },
    { label: '[Chuyến đi] Mục đích chuyến đi', tag: '{label_purpose}', category: 'trips', colNum: '' },
    { label: '[Chuyến đi] Chi tiết mục đích', tag: '{detail_purpose}', category: 'trips', colNum: '' },
    { label: '[Chuyến đi] Ngày xuất cảnh', tag: '{departureDate}', category: 'trips', colNum: '' },
    { label: '[Chuyến đi] Ngày nhập cảnh', tag: '{arrivalDate}', category: 'trips', colNum: '' },
    { label: '[Chuyến đi] Nguồn kinh phí', tag: '{label_funding2}', category: 'trips', colNum: '' },
    { label: '[Chuyến đi] Số quyết định', tag: '{decisionNumber}', category: 'trips', colNum: '' },
    { label: '[Chuyến đi] Ngày ký quyết định', tag: '{decisionDate}', category: 'trips', colNum: '' },
    { label: 'Khối lặp Thân nhân (Bắt đầu)', tag: '{#than_nhan}', category: 'relatives', colNum: 'Thân nhân' },
    { label: 'Khối lặp Thân nhân (Kết thúc)', tag: '{/than_nhan}', category: 'relatives', colNum: 'Thân nhân' }
  );

  // 4. Hệ thống & Ngày giờ & Khối tổng hợp Group
  tags.push(
    { label: '🌟 TỔNG HỢP TOÀN BỘ CÁC GROUP (Tự động điền toàn bộ trường cán bộ & thân nhân theo khối)', tag: '{formgroup}', category: 'system', colNum: 'Auto Group' },
    { label: 'Ngày hiện tại dạng chữ (Ví dụ: ngày 21 tháng 08 năm 2026)', tag: '{ngay_hien_tai_text}', category: 'system', colNum: 'HT' },
    { label: 'Địa điểm & Ngày tháng đầy đủ (Ví dụ: Tp. Hồ Chí Minh, ngày 22 tháng 12 năm 2026)', tag: '{dia_diem_ngay_thang}', category: 'system', colNum: 'HT' },
    { label: 'Ngày hiện tại (DD/MM/YYYY)', tag: '{ngay_hien_tai}', category: 'system', colNum: 'HT' },
    { label: 'Ngày hiện tại (DD)', tag: '{ngay}', category: 'system', colNum: 'HT' },
    { label: 'Tháng hiện tại (MM)', tag: '{thang}', category: 'system', colNum: 'HT' },
    { label: 'Năm hiện tại (YYYY)', tag: '{nam}', category: 'system', colNum: 'HT' },
    { label: 'Giờ xuất file (HH)', tag: '{gio}', category: 'system', colNum: 'HT' },
    { label: 'Phút xuất file (mm)', tag: '{phut}', category: 'system', colNum: 'HT' },
    { label: 'Thời gian xuất (HH:mm)', tag: '{thoi_gian_xuat}', category: 'system', colNum: 'HT' },
    { label: 'Ngày giờ xuất đầy đủ (DD/MM/YYYY HH:mm)', tag: '{ngay_gio_xuat}', category: 'system', colNum: 'HT' },
    { label: 'Họ tên Người xuất file', tag: '{ho_ten_nguoi_xuat}', category: 'system', colNum: 'HT' },
    { label: 'Số thứ tự cán bộ', tag: '{stt}', category: 'system', colNum: 'HT' }
  );

  return tags;
});

const personnelTagsCount = computed(() => {
  return allAvailableTags.value.filter((t) => t.category === 'personnel').length;
});

const relativeTagsCount = computed(() => {
  return allAvailableTags.value.filter((t) => t.category === 'relatives').length;
});

const systemTagsCount = computed(() => {
  return allAvailableTags.value.filter((t) => t.category === 'system').length;
});

const filteredTags = computed(() => {
  const q = (tagSearch.value || '').toLowerCase().trim();
  const cat = selectedCategory.value;

  return allAvailableTags.value.filter((item) => {
    let matchCat = false;
    if (cat === 'all') matchCat = true;
    else matchCat = item.category === cat;

    const matchQ =
      !q ||
      item.label.toLowerCase().includes(q) ||
      item.tag.toLowerCase().includes(q) ||
      (item.colNum && String(item.colNum).toLowerCase().includes(q));

    return matchCat && matchQ;
  });
});

const getCategoryLabel = (cat) => {
  switch (cat) {
    case 'personnel':
      return 'Cán bộ';
    case 'relatives':
      return 'Thân nhân';
    case 'trips':
      return 'Chuyến đi';
    case 'system':
      return 'Hệ thống';
    default:
      return 'Khác';
  }
};

const copyTag = (tag) => {
  navigator.clipboard.writeText(tag);
  copiedTag.value = tag;
  setTimeout(() => {
    if (copiedTag.value === tag) copiedTag.value = '';
  }, 2000);
};

const downloadSampleTemplate = async () => {
  try {
    const blob = await createSampleDocxTemplateBlob();
    saveAs(blob, 'Mau_Word_Trich_Ngang_Chuan.docx');
  } catch (e) {
    alert('Lỗi tạo mẫu Word: ' + e.message);
  }
};

const getColLabelBadge = (groupIndex, columnIndex) => {
  const groups = currentGroups.value;
  let count = 0;
  for (let i = 0; i < groupIndex; i++) {
    (groups[i]?.columns || []).forEach((c) => {
      const sub = getSubOptions(c);
      count += sub.length > 1 ? sub.length : 1;
    });
  }
  for (let j = 0; j < columnIndex; j++) {
    const prevCol = groups[groupIndex]?.columns?.[j];
    const sub = prevCol ? getSubOptions(prevCol) : [];
    count += sub.length > 1 ? sub.length : 1;
  }

  const currentCol = groups[groupIndex]?.columns?.[columnIndex];
  const currentSub = currentCol ? getSubOptions(currentCol) : [];
  const startCol = count + 1;

  if (currentSub.length > 1) {
    const endCol = count + currentSub.length;
    return `Cột ${startCol} - ${endCol} (${currentSub.length} cột)`;
  }
  return `Cột ${startCol}`;
};

const moveColumn = (gIdx, cIdx, direction) => {
  const groups = currentGroups.value;
  const currentGroup = groups[gIdx];
  if (!currentGroup || !currentGroup.columns) return;

  const targetIdx = cIdx + direction;

  // Move within the same group
  if (targetIdx >= 0 && targetIdx < currentGroup.columns.length) {
    const temp = currentGroup.columns[cIdx];
    currentGroup.columns[cIdx] = currentGroup.columns[targetIdx];
    currentGroup.columns[targetIdx] = temp;
    return;
  }

  // Move to previous group
  if (direction === -1 && gIdx > 0) {
    const col = currentGroup.columns.splice(cIdx, 1)[0];
    const prevGroup = groups[gIdx - 1];
    prevGroup.columns.push(col);
    return;
  }

  // Move to next group
  if (direction === 1 && gIdx < groups.length - 1) {
    const col = currentGroup.columns.splice(cIdx, 1)[0];
    const nextGroup = groups[gIdx + 1];
    nextGroup.columns.unshift(col);
    return;
  }
};

const onLabelBlur = (col) => {
  if (!col.id || col.id.startsWith('cot_') || col.id.startsWith('custom_')) {
    col.id = generateSlug(col.label);
  }
};

const addGroup = () => {
  currentGroups.value.push({
    group: 'Nhóm trường mới ' + (currentGroups.value.length + 1),
    isMultiple: false,
    columns: [],
  });
};

const removeGroup = (gIndex) => {
  if (!confirm(`Bạn có chắc muốn xóa nhóm "${currentGroups.value[gIndex]?.group}" cùng tất cả cột bên trong không?`)) return;
  currentGroups.value.splice(gIndex, 1);
};

const moveGroupUp = (gIndex) => {
  if (gIndex <= 0) return;
  const list = currentGroups.value;
  const temp = list[gIndex];
  list[gIndex] = list[gIndex - 1];
  list[gIndex - 1] = temp;
};

const moveGroupDown = (gIndex) => {
  const list = currentGroups.value;
  if (gIndex >= list.length - 1) return;
  const temp = list[gIndex];
  list[gIndex] = list[gIndex + 1];
  list[gIndex + 1] = temp;
};

const addColumn = (gIdx) => {
  const label = 'Cột mới ' + (currentGroups.value[gIdx].columns.length + 1);
  const slugId = generateSlug(label);
  currentGroups.value[gIdx].columns.push({
    id: slugId,
    label: label,
    format: 'text',
    width: '25',
    options: '',
  });
};

const removeColumn = (gIdx, cIdx) => {
  currentGroups.value[gIdx].columns.splice(cIdx, 1);
};

const validateUniqueIds = () => {
  const pSeen = new Map();
  for (const g of personnelGroups.value) {
    for (const c of (g.columns || [])) {
      if (c.id && c.id !== 'stt') {
        if (pSeen.has(c.id)) {
          return `Trong Cấu hình Cán bộ: Mã ID "${c.id}" (${c.label}) bị trùng với "${pSeen.get(c.id)}". Vui lòng đổi lại mã ID khác.`;
        }
        pSeen.set(c.id, c.label || c.id);
      }
    }
  }

  const rSeen = new Map();
  for (const g of relativeGroups.value) {
    for (const c of (g.columns || [])) {
      if (c.id && c.id !== 'stt') {
        if (rSeen.has(c.id)) {
          return `Trong Cấu hình Thân nhân: Mã ID "${c.id}" (${c.label}) bị trùng với "${rSeen.get(c.id)}". Vui lòng đổi lại mã ID khác.`;
        }
        rSeen.set(c.id, c.label || c.id);
      }
    }
  }

  const tSeen = new Map();
  for (const g of tripsGroups.value) {
    for (const c of (g.columns || [])) {
      if (c.id && c.id !== 'stt') {
        if (tSeen.has(c.id)) {
          return `Trong Cấu hình Chuyến đi: Mã ID "${c.id}" (${c.label}) bị trùng với "${tSeen.get(c.id)}". Vui lòng đổi lại mã ID khác.`;
        }
        tSeen.set(c.id, c.label || c.id);
      }
    }
  }

  // 3. Cảnh báo nếu trùng ID giữa Cán bộ và Thân nhân (trừ trường khóa liên kết cha mẹ)
  for (const [rId, rLabel] of rSeen.entries()) {
    if (pSeen.has(rId) && rId !== 'cccdparent' && rId !== relativeParentKeyField.value) {
      return `Mã ID "${rId}" đang tồn tại ở cả bảng Cán bộ (${pSeen.get(rId)}) và Thân nhân (${rLabel}). Vui lòng đặt mã khác nhau để xuất báo cáo không bị nhầm lẫn.`;
    }
  }

  return null;
};

const saveConfig = async () => {
  saving.value = true;
  try {
    if (activeTab.value === 'dashboard') {
      await saveDashboardsConfig();
      return;
    }

    const errorMsg = validateUniqueIds();
    if (errorMsg) {
      alert('⚠️ KHÔNG THỂ LƯU CẤU HÌNH:\n\n' + errorMsg);
      return;
    }
    const keyConfig = {
      personnelKeyField: personnelKeyField.value || 'cccdparent',
      personnelNameField: personnelNameField.value || 'name',
      personnelPositionField: personnelPositionField.value || 'position',
      personnelDepartmentField: personnelDepartmentField.value || 'departmentName',
      relativeParentKeyField: relativeParentKeyField.value || 'cccdparent',
      relativeKeyField: relativeKeyField.value || 'cccdthannhan',
      tripKeyField: tripKeyField.value || 'cccdchuyendi',
    };
    await saveAppSettings('system_key_config', keyConfig);
    personnelStore.systemKeyConfig = keyConfig;

    if (activeTab.value === 'keys') {
      alert('Đã lưu cấu hình Khóa định danh & Khóa liên kết thành công!');
      return;
    }

    if (activeTab.value === 'personnel') {
      const allActiveCols = (personnelGroups.value || []).flatMap((g) => g.columns || []).filter((c) => c.id && c.id !== 'stt');
      await Promise.all([
        syncCollectionFields('personnels', allActiveCols),
        saveAppSettings('mapping_config_personnel', personnelGroups.value),
        saveAppSettings('importMappingPersonnel', personnelGroups.value),
      ]);
      personnelStore.importMappingPersonnel = personnelGroups.value;
    } else if (activeTab.value === 'relative') {
      await Promise.all([
        saveAppSettings('mapping_config_relative', relativeGroups.value),
        saveAppSettings('importMappingRelative', relativeGroups.value),
      ]);
      personnelStore.importMappingRelative = relativeGroups.value;
    } else if (activeTab.value === 'trips') {
      await Promise.all([
        saveAppSettings('mapping_config_trips', tripsGroups.value),
        saveAppSettings('importMappingTrips', tripsGroups.value),
      ]);
      personnelStore.importMappingTrips = tripsGroups.value;
    }
    alert('Đã lưu cấu hình cột và đồng bộ trực tiếp vào cơ sở dữ liệu Directus thành công!');
  } catch (err) {
    alert('Lỗi lưu cấu hình: ' + (err.message || err));
  } finally {
    saving.value = false;
  }
};
</script>

<style scoped>
.custom-key-select {
  width: 100%;
  padding: 6px 10px;
  font-size: 0.82rem;
  font-weight: 700;
  color: #1e293b;
  background-color: #ffffff;
  border: 1.5px solid #cbd5e1;
  border-radius: 6px;
  outline: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.custom-key-select:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.15);
}

.btn-reorder {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 14px;
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  border-radius: 3px;
  color: #475569;
  cursor: pointer;
  padding: 0;
  transition: all 0.15s ease;
}

.btn-reorder:hover:not(:disabled) {
  background: #0284c7;
  color: #ffffff;
  border-color: #0284c7;
}

.btn-reorder:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.custom-col-select {
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 0.35rem 0.5rem;
  font-size: 0.78rem;
  background-color: #ffffff;
  color: #1f2937;
  outline: none;
  cursor: pointer;
  transition: border-color 0.15s ease;
}

.custom-col-select:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1);
}

.segmented-tab-btn {
  background: transparent;
  border: none;
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 0.82rem;
  font-weight: 600;
  color: #475569;
  cursor: pointer;
  transition: all 0.15s ease;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  user-select: none;
}

.segmented-tab-btn:hover {
  color: #1e293b;
}

.segmented-tab-btn.tab-active {
  background: #ffffff;
  color: #16a34a !important;
  font-weight: 700;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}
</style>
