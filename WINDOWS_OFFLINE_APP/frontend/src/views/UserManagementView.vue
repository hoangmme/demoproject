<template>
  <div class="app-content">
    <!-- Top Header Card -->
    <div class="app-card" style="margin-bottom: 1.5rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <div style="width: 38px; height: 38px; border-radius: 10px; background: #e8f5e9; color: #2e7d32; display: flex; align-items: center; justify-content: center;">
            <i class="pi pi-users" style="font-size: 1.25rem;"></i>
          </div>
          <div>
            <h2 style="font-size: 1.05rem; font-weight: 700; color: #1e293b; margin: 0;">
              Quản lý Người dùng & Phân quyền Chi tiết theo Cột
            </h2>
            <span style="font-size: 0.76rem; color: #64748b;">
              Tự tạo vai trò (Role), cấp quyền xem/sửa từng số cột cụ thể và quyền Import/Export
            </span>
          </div>
        </div>

        <div style="display: flex; gap: 8px;">
          <Button
            label="Quản lý & Cấu hình Vai trò (Roles)"
            icon="pi pi-shield"
            severity="secondary"
            outlined
            size="small"
            @click="openRolesConfigDialog"
            style="font-size: 0.8rem;"
          />
          <Button
            label="Tạo Người dùng mới"
            icon="pi pi-user-plus"
            severity="success"
            size="small"
            @click="openCreateUserModal"
            style="font-size: 0.8rem;"
          />
        </div>
      </div>
    </div>

    <!-- Users DataTable -->
    <div class="app-card">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
        <span style="font-size: 0.85rem; font-weight: 700; color: #334155;">
          Danh sách Tài khoản ({{ users.length }} người dùng)
        </span>
        <Button
          icon="pi pi-refresh"
          severity="secondary"
          size="small"
          text
          rounded
          :loading="loading"
          @click="loadUsers"
          v-tooltip.top="'Tải lại danh sách'"
        />
      </div>

      <DataTable
        :value="users"
        :loading="loading"
        paginator
        :rows="10"
        responsiveLayout="scroll"
        stripedRows
        class="p-datatable-sm"
      >
        <Column field="first_name" header="Họ và tên" sortable>
          <template #body="{ data }">
            <strong>{{ data.first_name || data.email }}</strong>
            <div v-if="data.description" style="font-size: 0.72rem; color: #64748b;">{{ data.description }}</div>
          </template>
        </Column>
        <Column field="email" header="Email Đăng nhập" sortable />
        <Column field="role" header="Vai trò (Role)" sortable>
          <template #body="{ data }">
            <span
              class="badge-pill"
              :style="{
                background: getRoleColorBg(getUserRoleName(data)),
                color: getRoleColorText(getUserRoleName(data))
              }"
            >
              {{ getUserRoleLabel(data) }}
            </span>
          </template>
        </Column>
        <Column field="status" header="Trạng thái" sortable>
          <template #body="{ data }">
            <span class="badge-pill badge-green" v-if="data.status === 'active' || !data.status">Hoạt động</span>
            <span class="badge-pill badge-red" v-else>{{ data.status }}</span>
          </template>
        </Column>
        <Column header="Thao tác" headerStyle="width: 8rem; text-align: right;" bodyStyle="text-align: right;">
          <template #body="{ data }">
            <div style="display: flex; justify-content: flex-end; gap: 4px;">
              <Button
                icon="pi pi-pencil"
                severity="secondary"
                text
                size="small"
                @click="openEditUserModal(data)"
                v-tooltip.top="'Chỉnh sửa thông tin & vai trò'"
              />
              <Button
                v-if="data.email !== 'admin@demo.com'"
                icon="pi pi-trash"
                severity="danger"
                text
                size="small"
                @click="handleDeleteUser(data)"
                v-tooltip.top="'Xóa tài khoản'"
              />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- ========================================================= -->
    <!-- 1. CREATE / EDIT USER DIALOG                              -->
    <!-- ========================================================= -->
    <Dialog
      v-model:visible="isUserDialogOpen"
      modal
      :header="editingUser ? `Chỉnh sửa Tài khoản: ${editingUser.email}` : 'Tạo Người dùng mới'"
      :style="{ width: '520px', maxWidth: '96vw' }"
    >
      <div class="form-grid" style="padding-top: 8px;">
        <div class="field-item col-12">
          <label class="field-label">Họ và tên <span style="color: #ef4444;">*</span></label>
          <InputText v-model="userForm.first_name" placeholder="Nguyễn Văn A" size="small" />
        </div>
        <div class="field-item col-12">
          <label class="field-label">Email đăng nhập <span style="color: #ef4444;">*</span></label>
          <InputText v-model="userForm.email" placeholder="user@example.com" size="small" :disabled="Boolean(editingUser)" />
        </div>
        <div class="field-item col-12">
          <label class="field-label">{{ editingUser ? 'Mật khẩu mới (Để trống nếu không đổi)' : 'Mật khẩu' }}</label>
          <InputText v-model="userForm.password" type="password" placeholder="••••••••" size="small" />
        </div>
        <div class="field-item col-12">
          <label class="field-label">Gán Vai trò (Role)</label>
          <select v-model="userForm.role" class="settings-select" style="width: 100%; max-width: 100%;">
            <option v-for="r in rolesList" :key="r.id" :value="r.id">
              {{ r.name }} {{ r.isSystem ? '(Mặc định hệ thống)' : '(Tùy chỉnh)' }}
            </option>
          </select>
        </div>
        <div class="field-item col-12">
          <label class="field-label">Ghi chú / Đơn vị công tác</label>
          <InputText v-model="userForm.description" placeholder="Phòng Tổ chức cán bộ..." size="small" />
        </div>
      </div>
      <template #footer>
        <Button label="Hủy" severity="secondary" text size="small" @click="isUserDialogOpen = false" />
        <Button
          :label="editingUser ? 'Lưu Thay Đổi' : 'Tạo Tài Khoản'"
          severity="success"
          size="small"
          :loading="savingUser"
          @click="submitSaveUser"
        />
      </template>
    </Dialog>

    <!-- ========================================================= -->
    <!-- 2. ROLES MANAGEMENT & COLUMN PERMISSIONS DIALOG          -->
    <!-- ========================================================= -->
    <Dialog
      v-model:visible="isRolesConfigOpen"
      modal
      header="Quản lý Vai trò & Phân quyền Chi tiết theo Cột"
      :style="{ width: '1050px', maxWidth: '96vw' }"
    >
      <div style="display: flex; gap: 16px; padding-top: 8px; min-height: 520px;">
        <!-- Left: Roles List Navigation -->
        <div style="width: 260px; border-right: 1px solid #e2e8f0; padding-right: 14px; display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
              <span style="font-size: 0.82rem; font-weight: 700; color: #1e293b;">Danh sách Vai trò</span>
              <Button
                icon="pi pi-plus"
                label="Thêm Role"
                size="small"
                severity="success"
                text
                @click="openAddNewRole"
                style="font-size: 0.75rem; padding: 2px 6px;"
              />
            </div>

            <div style="display: flex; flex-direction: column; gap: 6px;">
              <button
                v-for="r in rolesList"
                :key="r.id"
                type="button"
                class="role-item-btn"
                :class="{ 'role-item-active': selectedRole?.id === r.id }"
                @click="selectRole(r)"
              >
                <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                  <span style="font-weight: 600; font-size: 0.8rem;">{{ r.name }}</span>
                  <button
                    v-if="!r.isSystem"
                    type="button"
                    class="btn-delete-role"
                    @click.stop="deleteRole(r)"
                    title="Xóa vai trò này"
                  >
                    <i class="pi pi-times"></i>
                  </button>
                </div>
                <span style="font-size: 0.7rem; color: #64748b; margin-top: 2px;">
                  {{ r.isSystem ? 'Vai trò hệ thống' : (r.description || 'Vai trò tùy chỉnh') }}
                </span>
              </button>
            </div>
          </div>

          <div style="font-size: 0.72rem; color: #94a3b8; padding-top: 10px; border-top: 1px dashed #e2e8f0;">
            Mẹo: Bạn có thể chọn bất kỳ vai trò nào để cấu hình cột được xem, được sửa và quyền Import/Export.
          </div>
        </div>

        <!-- Right: Permissions Matrix for Selected Role -->
        <div v-if="selectedRole" style="flex: 1; display: flex; flex-direction: column; gap: 14px; max-height: 520px; overflow-y: auto; padding-right: 6px;">
          <!-- Role Name & Actions Settings -->
          <div style="background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-weight: 700; font-size: 0.9rem; color: #1e293b;">Cấu hình cho: {{ selectedRole.name }}</span>
                <span v-if="selectedRole.isSystem" class="badge-pill badge-neutral" style="font-size: 0.68rem;">Hệ thống</span>
              </div>
              <div v-if="!selectedRole.isSystem" style="width: 220px;">
                <InputText v-model="selectedRole.name" placeholder="Tên vai trò" size="small" style="font-size: 0.8rem;" />
              </div>
            </div>

            <!-- General Action Permissions (Import, Export, Delete, Config) -->
            <div style="display: flex; flex-wrap: wrap; gap: 16px; font-size: 0.78rem; color: #334155; margin-top: 8px; padding-top: 8px; border-top: 1px solid #e2e8f0;">
              <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
                <input type="checkbox" v-model="selectedRole.canImport" :disabled="selectedRole.id === 'Admin'" />
                <b>Cho phép Import Excel</b>
              </label>
              <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
                <input type="checkbox" v-model="selectedRole.canExport" :disabled="selectedRole.id === 'Admin'" />
                <b>Cho phép Xuất Excel</b>
              </label>
              <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
                <input type="checkbox" v-model="selectedRole.canDelete" :disabled="selectedRole.id === 'Admin'" />
                <b>Cho phép Xóa Hồ sơ</b>
              </label>
              <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
                <input type="checkbox" v-model="selectedRole.canConfig" :disabled="selectedRole.id === 'Admin'" />
                <b>Cho phép Cấu hình Hệ thống</b>
              </label>
            </div>
          </div>

          <!-- Column Permissions Section -->
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; flex-wrap: wrap; gap: 8px;">
              <div>
                <span style="font-weight: 700; font-size: 0.86rem; color: #1e293b;">
                  Phân quyền theo Cột (Cá nhân, Chuyến đi & Thân nhân)
                </span>
                <div style="font-size: 0.72rem; color: #64748b;">
                  Hiển thị {{ filteredSystemColumnsList.length }} / {{ allSystemColumnsList.length }} cột
                </div>
              </div>
              <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                <Button
                  label="Cho phép Sửa"
                  size="small"
                  severity="success"
                  text
                  @click="setFilteredColumnsForRole('edit')"
                  style="font-size: 0.72rem; padding: 2px 6px;"
                />
                <Button
                  label="Chỉ Xem"
                  size="small"
                  severity="secondary"
                  text
                  @click="setFilteredColumnsForRole('view')"
                  style="font-size: 0.72rem; padding: 2px 6px;"
                />
                <Button
                  label="Ẩn tất cả"
                  size="small"
                  severity="danger"
                  text
                  @click="setFilteredColumnsForRole('none')"
                  style="font-size: 0.72rem; padding: 2px 6px;"
                />
              </div>
            </div>

            <!-- Block Selector Tabs & Search Filter -->
            <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-bottom: 8px; flex-wrap: wrap;">
              <div style="display: flex; gap: 4px; background: #f1f5f9; padding: 2px; border-radius: 6px;">
                <button
                  type="button"
                  class="col-tab-btn"
                  :class="{ 'col-tab-btn-active': activeColSourceTab === 'all' }"
                  @click="activeColSourceTab = 'all'"
                >
                  Tất cả ({{ allSystemColumnsList.length }})
                </button>
                <button
                  type="button"
                  class="col-tab-btn"
                  :class="{ 'col-tab-btn-active': activeColSourceTab === 'personnel' }"
                  @click="activeColSourceTab = 'personnel'"
                >
                  1. Cá nhân ({{ personnelColumnsCount }})
                </button>
                <button
                  type="button"
                  class="col-tab-btn"
                  :class="{ 'col-tab-btn-active': activeColSourceTab === 'trips' }"
                  @click="activeColSourceTab = 'trips'"
                >
                  2. Chuyến đi ({{ tripsColumnsCount }})
                </button>
                <button
                  type="button"
                  class="col-tab-btn"
                  :class="{ 'col-tab-btn-active': activeColSourceTab === 'relative' }"
                  @click="activeColSourceTab = 'relative'"
                >
                  3. Thân nhân ({{ relativeColumnsCount }})
                </button>
              </div>

              <div style="position: relative; width: 180px;">
                <InputText
                  v-model="colSearchQuery"
                  placeholder="Tìm tên/mã cột..."
                  size="small"
                  style="font-size: 0.75rem; width: 100%; height: 28px; padding: 4px 8px;"
                />
              </div>
            </div>

            <!-- Table of Columns -->
            <table class="col-perm-table">
              <thead>
                <tr>
                  <th style="width: 70px;">Số Cột</th>
                  <th>Tên Cột / Trường thông tin</th>
                  <th style="width: 140px;">Khối dữ liệu</th>
                  <th style="width: 150px; text-align: center;">Quyền thao tác</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="col in filteredSystemColumnsList" :key="col.id + '_' + col.source">
                  <td style="font-weight: 700; color: #0284c7;">{{ col.colNumStr }}</td>
                  <td>
                    <strong>{{ col.label }}</strong>
                    <span style="font-size: 0.7rem; color: #94a3b8; margin-left: 6px; font-family: monospace;">({{ col.id }})</span>
                  </td>
                  <td>
                    <span
                      class="badge-pill"
                      :class="col.source === 'personnel' ? 'badge-blue' : col.source === 'trips' ? 'badge-green' : 'badge-purple'"
                      style="font-size: 0.68rem;"
                    >
                      {{ col.sourceLabel }} · {{ col.groupName }}
                    </span>
                  </td>
                  <td style="text-align: center;">
                    <select
                      v-model="selectedRole.columnPermissions[col.id]"
                      class="perm-select"
                      :disabled="selectedRole.id === 'Admin'"
                    >
                      <option value="edit">✏️ Xem & Sửa</option>
                      <option value="view">👁️ Chỉ Xem</option>
                      <option value="none">🚫 Ẩn (Không xem)</option>
                    </select>
                  </td>
                </tr>
                <tr v-if="filteredSystemColumnsList.length === 0">
                  <td colspan="4" style="text-align: center; color: #94a3b8; padding: 18px;">
                    Không tìm thấy cột nào phù hợp với bộ lọc
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <template #footer>
        <div style="display: flex; justify-content: flex-end; gap: 8px; width: 100%;">
          <Button label="Hủy" severity="secondary" text size="small" @click="isRolesConfigOpen = false" />
          <Button label="Lưu Toàn bộ Cấu hình Vai trò & Cột" icon="pi pi-check" severity="success" size="small" :loading="savingRoles" @click="saveAllRolesMatrix" />
        </div>
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import { getUsers, createUser, updateUser, deleteUser } from '@/api/users';
import { getAppSettings, saveAppSettings } from '@/api/settings';
import { logActivity } from '@/api/audit';
import { usePersonnelStore } from '@/stores/personnel';
import { computeColumnIndexMap } from '@/utils/formatters';

const personnelStore = usePersonnelStore();

const users = ref([]);
const loading = ref(false);
const isUserDialogOpen = ref(false);
const editingUser = ref(null);
const savingUser = ref(false);

const userForm = ref({
  first_name: '',
  email: '',
  password: '',
  role: 'Editor',
  description: '',
});

// =========================================================================
// ROLES & COLUMN PERMISSIONS MATRIX
// =========================================================================
const isRolesConfigOpen = ref(false);
const savingRoles = ref(false);
const selectedRole = ref(null);

const DEFAULT_ROLES = [
  {
    id: 'Admin',
    name: 'Quản trị viên (Admin)',
    description: 'Toàn quyền truy cập và quản trị toàn bộ hệ thống',
    isSystem: true,
    canImport: true,
    canExport: true,
    canDelete: true,
    canConfig: true,
    columnPermissions: {},
  },
  {
    id: 'Editor',
    name: 'Chuyên viên Biên tập (Editor)',
    description: 'Có quyền xem và chỉnh sửa hồ sơ cán bộ & thân nhân',
    isSystem: true,
    canImport: true,
    canExport: true,
    canDelete: false,
    canConfig: false,
    columnPermissions: {},
  },
  {
    id: 'Viewer',
    name: 'Cán bộ Tra cứu (Viewer)',
    description: 'Chỉ có quyền tra cứu, xem và xuất báo cáo',
    isSystem: true,
    canImport: false,
    canExport: true,
    canDelete: false,
    canConfig: false,
    columnPermissions: {},
  },
];

const rolesList = ref([...DEFAULT_ROLES]);

const colSearchQuery = ref('');
const activeColSourceTab = ref('all'); // 'all' | 'personnel' | 'trips' | 'relative'

// Computed list of ALL columns from 3 Blocks: Personnel (A), Trips (B), Relatives (C)
const allSystemColumnsList = computed(() => {
  const list = [];
  
  // 1. Khối A: Personnel columns (Cá nhân / Cán bộ)
  const pMap = computeColumnIndexMap(personnelStore.importMappingPersonnel);
  (personnelStore.importMappingPersonnel || []).forEach((g) => {
    (g.columns || []).forEach((c) => {
      if (c.id && c.label) {
        list.push({
          id: c.id,
          label: c.label,
          colNumStr: pMap[c.id] || '-',
          groupName: g.group || 'Cán bộ',
          source: 'personnel',
          sourceLabel: 'Khối A (Cá nhân)',
        });
      }
    });
  });

  // 2. Khối B: Trips columns (Chuyến đi nước ngoài)
  const tMap = computeColumnIndexMap(personnelStore.importMappingTrips);
  (personnelStore.importMappingTrips || []).forEach((g) => {
    (g.columns || []).forEach((c) => {
      if (c.id && c.label) {
        list.push({
          id: c.id,
          label: c.label,
          colNumStr: tMap[c.id] || '-',
          groupName: g.group || 'Chuyến đi',
          source: 'trips',
          sourceLabel: 'Khối B (Chuyến đi)',
        });
      }
    });
  });

  // 3. Khối C: Relative columns (Thân nhân & Gia đình)
  const rMap = computeColumnIndexMap(personnelStore.importMappingRelative);
  (personnelStore.importMappingRelative || []).forEach((g) => {
    (g.columns || []).forEach((c) => {
      if (c.id && c.label) {
        list.push({
          id: c.id,
          label: c.label,
          colNumStr: rMap[c.id] || '-',
          groupName: g.group || 'Thân nhân',
          source: 'relative',
          sourceLabel: 'Khối C (Thân nhân)',
        });
      }
    });
  });

  return list;
});

const personnelColumnsCount = computed(() => allSystemColumnsList.value.filter((c) => c.source === 'personnel').length);
const tripsColumnsCount = computed(() => allSystemColumnsList.value.filter((c) => c.source === 'trips').length);
const relativeColumnsCount = computed(() => allSystemColumnsList.value.filter((c) => c.source === 'relative').length);

const filteredSystemColumnsList = computed(() => {
  let list = allSystemColumnsList.value;

  if (activeColSourceTab.value !== 'all') {
    list = list.filter((c) => c.source === activeColSourceTab.value);
  }

  const q = colSearchQuery.value.toLowerCase().trim();
  if (!q) return list;

  return list.filter((c) => {
    return (
      (c.label && c.label.toLowerCase().includes(q)) ||
      (c.id && c.id.toLowerCase().includes(q)) ||
      (c.groupName && c.groupName.toLowerCase().includes(q)) ||
      (c.colNumStr && String(c.colNumStr).toLowerCase().includes(q))
    );
  });
});

const loadUsers = async () => {
  loading.value = true;
  try {
    users.value = await getUsers();
  } finally {
    loading.value = false;
  }
};

const loadRolesMatrix = async () => {
  try {
    const saved = await getAppSettings('custom_roles_matrix');
    if (saved && Array.isArray(saved) && saved.length > 0) {
      rolesList.value = saved;
    } else {
      // Initialize column permissions defaults
      rolesList.value = DEFAULT_ROLES.map((r) => {
        const perms = {};
        allSystemColumnsList.value.forEach((col) => {
          perms[col.id] = r.id === 'Admin' ? 'edit' : (r.id === 'Editor' ? 'edit' : 'view');
        });
        return { ...r, columnPermissions: perms };
      });
    }
  } catch (e) {
    console.error('Error loading roles matrix:', e);
  }
  if (rolesList.value.length > 0 && !selectedRole.value) {
    selectedRole.value = rolesList.value[0];
  }
};

const openRolesConfigDialog = () => {
  if (rolesList.value.length > 0 && !selectedRole.value) {
    selectedRole.value = rolesList.value[0];
  }
  isRolesConfigOpen.value = true;
};

const selectRole = (r) => {
  selectedRole.value = r;
  if (!selectedRole.value.columnPermissions) {
    selectedRole.value.columnPermissions = {};
  }
  allSystemColumnsList.value.forEach((col) => {
    if (!selectedRole.value.columnPermissions[col.id]) {
      selectedRole.value.columnPermissions[col.id] = selectedRole.value.id === 'Admin' ? 'edit' : 'view';
    }
  });
};

const openAddNewRole = () => {
  const newId = 'role_' + Date.now();
  const perms = {};
  allSystemColumnsList.value.forEach((col) => {
    perms[col.id] = 'view';
  });

  const newRoleObj = {
    id: newId,
    name: 'Vai trò mới ' + (rolesList.value.length + 1),
    description: 'Vai trò tùy chỉnh phân quyền theo cột',
    isSystem: false,
    canImport: false,
    canExport: true,
    canDelete: false,
    canConfig: false,
    columnPermissions: perms,
  };

  rolesList.value.push(newRoleObj);
  selectedRole.value = newRoleObj;
};

const deleteRole = (r) => {
  if (r.isSystem) return;
  if (!confirm(`Bạn có chắc muốn xóa vai trò "${r.name}"?`)) return;
  rolesList.value = rolesList.value.filter((item) => item.id !== r.id);
  if (selectedRole.value?.id === r.id) {
    selectedRole.value = rolesList.value[0] || null;
  }
};

const setFilteredColumnsForRole = (permType) => {
  if (!selectedRole.value || selectedRole.value.id === 'Admin') return;
  if (!selectedRole.value.columnPermissions) selectedRole.value.columnPermissions = {};
  filteredSystemColumnsList.value.forEach((col) => {
    selectedRole.value.columnPermissions[col.id] = permType;
  });
};

const setAllColumnsForRole = (permType) => {
  if (!selectedRole.value || selectedRole.value.id === 'Admin') return;
  if (!selectedRole.value.columnPermissions) selectedRole.value.columnPermissions = {};
  allSystemColumnsList.value.forEach((col) => {
    selectedRole.value.columnPermissions[col.id] = permType;
  });
};

const saveAllRolesMatrix = async () => {
  savingRoles.value = true;
  try {
    await saveAppSettings('custom_roles_matrix', rolesList.value);
    await logActivity('Cấu hình Vai trò & Cột', 'Cập nhật danh sách vai trò và phân quyền chi tiết từng cột');
    alert('Lưu cấu hình vai trò & phân quyền cột thành công!');
    isRolesConfigOpen.value = false;
  } catch (e) {
    alert('Lỗi lưu cấu hình: ' + e.message);
  } finally {
    savingRoles.value = false;
  }
};

const getUserRoleName = (user) => {
  if (typeof user.role === 'object') return user.role?.name || user.role?.id || 'User';
  return user.role || 'User';
};

const getUserRoleLabel = (user) => {
  const rId = getUserRoleName(user);
  const matched = rolesList.value.find((r) => r.id === rId || r.name === rId);
  return matched ? matched.name : rId;
};

const getRoleColorBg = (roleName) => {
  if (roleName === 'Admin' || roleName === 'Administrator') return '#dcfce7';
  if (roleName === 'Editor') return '#e0f2fe';
  if (roleName === 'Viewer') return '#f1f5f9';
  return '#f3e8ff';
};

const getRoleColorText = (roleName) => {
  if (roleName === 'Admin' || roleName === 'Administrator') return '#15803d';
  if (roleName === 'Editor') return '#0369a1';
  if (roleName === 'Viewer') return '#475569';
  return '#7e22ce';
};

const openCreateUserModal = () => {
  editingUser.value = null;
  userForm.value = { first_name: '', email: '', password: '', role: rolesList.value[1]?.id || 'Editor', description: '' };
  isUserDialogOpen.value = true;
};

const openEditUserModal = (user) => {
  editingUser.value = user;
  userForm.value = {
    first_name: user.first_name || '',
    email: user.email || '',
    password: '',
    role: getUserRoleName(user) || 'Editor',
    description: user.description || '',
  };
  isUserDialogOpen.value = true;
};

const submitSaveUser = async () => {
  if (!userForm.value.first_name || !userForm.value.email) {
    alert('Vui lòng điền đầy đủ Họ tên và Email!');
    return;
  }
  if (!editingUser.value && !userForm.value.password) {
    alert('Vui lòng nhập Mật khẩu cho tài khoản mới!');
    return;
  }
  savingUser.value = true;
  try {
    if (editingUser.value) {
      const payload = {
        first_name: userForm.value.first_name,
        role: userForm.value.role,
        description: userForm.value.description,
      };
      if (userForm.value.password) {
        payload.password = userForm.value.password;
      }
      await updateUser(editingUser.value.id, payload);
      await logActivity('Cập nhật Người dùng', `Cập nhật tài khoản: ${userForm.value.email} (Vai trò: ${userForm.value.role})`);
      alert('Cập nhật tài khoản thành công!');
    } else {
      await createUser(userForm.value);
      await logActivity('Tạo Người dùng mới', `Tạo tài khoản: ${userForm.value.email} (Vai trò: ${userForm.value.role})`);
      alert('Tạo người dùng thành công!');
    }
    isUserDialogOpen.value = false;
    await loadUsers();
  } catch (e) {
    alert('Lỗi: ' + (e.message || e));
  } finally {
    savingUser.value = false;
  }
};

const handleDeleteUser = async (user) => {
  if (!confirm(`Bạn có chắc muốn xóa tài khoản: "${user.email}" không?`)) return;
  try {
    await deleteUser(user.id);
    await logActivity('Xóa Người dùng', `Đã xóa tài khoản: ${user.email}`);
    await loadUsers();
  } catch (e) {
    alert('Lỗi xóa người dùng: ' + (e.message || e));
  }
};

onMounted(async () => {
  if (personnelStore.personnelList.length === 0) {
    await personnelStore.init();
  }
  await loadUsers();
  await loadRolesMatrix();
});
</script>

<style scoped>
.role-item-btn {
  width: 100%;
  text-align: left;
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  background: #ffffff;
  cursor: pointer;
  transition: all 0.15s ease;
  display: flex;
  flex-direction: column;
}

.role-item-btn:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.role-item-active {
  background: #f0fdf4 !important;
  border-color: #2e7d32 !important;
  color: #166534 !important;
}

.btn-delete-role {
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 4px;
  font-size: 0.7rem;
}

.btn-delete-role:hover {
  color: #ef4444;
  background: #fee2e2;
}

.col-perm-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.78rem;
}

.col-perm-table th {
  background: #f8fafc;
  padding: 8px 10px;
  border-bottom: 2px solid #e2e8f0;
  color: #334155;
  font-weight: 700;
  text-align: left;
  position: sticky;
  top: 0;
  z-index: 1;
}

.col-perm-table td {
  padding: 6px 10px;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}

.col-perm-table tr:hover {
  background: #f8fafc;
}

.perm-select {
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 0.74rem;
  background: #ffffff;
  font-weight: 600;
  color: #1e293b;
}

.settings-select {
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 6px 10px;
  font-size: 0.8rem;
  background: #ffffff;
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

.badge-blue {
  background: #e0f2fe;
  color: #0369a1;
}

.badge-red {
  background: #fee2e2;
  color: #b91c1c;
}

.badge-purple {
  background: #f3e8ff;
  color: #7c3aed;
}

.badge-neutral {
  background: #f1f5f9;
  color: #475569;
}

.col-tab-btn {
  border: none;
  background: transparent;
  padding: 4px 10px;
  font-size: 0.72rem;
  font-weight: 600;
  color: #64748b;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.col-tab-btn:hover {
  color: #0f172a;
  background: #e2e8f0;
}

.col-tab-btn-active {
  background: #ffffff !important;
  color: #0284c7 !important;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}
</style>
