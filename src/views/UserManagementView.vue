<template>
  <div class="app-content">
    <div class="app-card">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 8px;">
        <div>
          <h3 style="font-size: 1rem; font-weight: 700; color: #1f2937; margin: 0;">
            Quản lý Tài khoản & Phân quyền Người dùng ({{ users.length }} tài khoản)
          </h3>
          <span style="font-size: 0.76rem; color: #64748b;">
            Thiết lập vai trò và phân quyền xem / sửa theo từng khối cột dữ liệu
          </span>
        </div>
        <div style="display: flex; gap: 8px;">
          <Button
            label="Cấu hình Quyền theo Vai trò"
            icon="pi pi-shield"
            severity="secondary"
            outlined
            size="small"
            @click="isRoleMatrixOpen = true"
            style="font-size: 0.8rem;"
          />
          <Button
            label="Tạo Người dùng mới"
            icon="pi pi-user-plus"
            severity="primary"
            size="small"
            @click="openCreateModal"
            style="font-size: 0.8rem;"
          />
        </div>
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
          </template>
        </Column>
        <Column field="email" header="Email Đăng nhập" sortable />
        <Column field="role" header="Vai trò (Role)" sortable>
          <template #body="{ data }">
            <span
              class="badge-pill"
              :class="{
                'badge-green': getUserRoleName(data) === 'Admin',
                'badge-blue': getUserRoleName(data) === 'Editor',
                'badge-neutral': getUserRoleName(data) === 'Viewer'
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
                @click="openEditModal(data)"
                v-tooltip.top="'Chỉnh sửa thông tin & quyền'"
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

    <!-- Create / Edit User Dialog -->
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
          <label class="field-label">Vai trò (Role)</label>
          <select v-model="userForm.role" class="settings-select" style="width: 100%; max-width: 100%;">
            <option value="Admin">Quản trị viên (Admin) - Toàn quyền hệ thống</option>
            <option value="Editor">Chuyên viên Biên tập (Editor) - Xem & sửa hồ sơ</option>
            <option value="Viewer">Cán bộ Tra cứu (Viewer) - Chỉ xem & xuất báo cáo</option>
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
          :loading="saving"
          @click="submitSaveUser"
        />
      </template>
    </Dialog>

    <!-- Role Permissions Matrix Dialog -->
    <Dialog
      v-model:visible="isRoleMatrixOpen"
      modal
      header="Cấu hình Phân quyền Xem / Sửa theo Vai trò & Khối Cột"
      :style="{ width: '750px', maxWidth: '96vw' }"
    >
      <div style="display: flex; flex-direction: column; gap: 14px; padding-top: 8px;">
        <div style="padding: 8px 12px; background: #f0fdf4; border-radius: 8px; border-left: 4px solid #16a34a; font-size: 0.78rem; color: #166534;">
          Bạn có thể tùy chỉnh quyền hạn của từng nhóm người dùng (Xem hoặc Sửa) đối với từng khối cột dữ liệu.
        </div>

        <table class="perm-table">
          <thead>
            <tr>
              <th>Khối Dữ liệu / Phân hệ</th>
              <th style="text-align: center; width: 140px;">Admin (Quản trị)</th>
              <th style="text-align: center; width: 140px;">Editor (Biên tập)</th>
              <th style="text-align: center; width: 140px;">Viewer (Tra cứu)</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="block in permissionBlocks" :key="block.id">
              <td>
                <strong>{{ block.title }}</strong>
                <div style="font-size: 0.72rem; color: #64748b;">{{ block.description }}</div>
              </td>
              <td style="text-align: center;">
                <span class="badge-pill badge-green">Xem & Sửa</span>
              </td>
              <td style="text-align: center;">
                <select v-model="rolePermissions.Editor[block.id]" class="perm-select">
                  <option value="edit">Xem & Sửa</option>
                  <option value="view">Chỉ Xem</option>
                  <option value="none">Ẩn (Không xem)</option>
                </select>
              </td>
              <td style="text-align: center;">
                <select v-model="rolePermissions.Viewer[block.id]" class="perm-select">
                  <option value="view">Chỉ Xem</option>
                  <option value="none">Ẩn (Không xem)</option>
                </select>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <template #footer>
        <div style="display: flex; justify-content: flex-end; gap: 8px; width: 100%;">
          <Button label="Hủy" severity="secondary" text size="small" @click="isRoleMatrixOpen = false" />
          <Button label="Lưu Cấu Hình Phân Quyền" icon="pi pi-check" severity="success" size="small" :loading="savingPerms" @click="saveRolePermissions" />
        </div>
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import { getUsers, createUser, updateUser, deleteUser } from '@/api/users';
import { getAppSettings, saveAppSettings } from '@/api/settings';
import { logActivity } from '@/api/audit';

const users = ref([]);
const loading = ref(false);
const isUserDialogOpen = ref(false);
const editingUser = ref(null);
const saving = ref(false);

const isRoleMatrixOpen = ref(false);
const savingPerms = ref(false);

const userForm = ref({
  first_name: '',
  email: '',
  password: '',
  role: 'Editor',
  description: '',
});

const permissionBlocks = [
  { id: 'block_basic', title: 'Khối A: Thông tin chung & Cư trú', description: 'Họ tên, CCCD, Ngày sinh, Đơn vị, Chức vụ, Nơi ở' },
  { id: 'block_travel', title: 'Khối B: Đi nước ngoài (Phụ lục 1)', description: 'Chuyến đi, Nước đến, Kinh phí, Quyết định, Lịch duyệt đi/về' },
  { id: 'block_relatives', title: 'Khối Thân nhân ở Nước ngoài (Phụ lục 2)', description: 'Danh sách người thân, Quan hệ, Quốc gia, Nghề nghiệp' },
  { id: 'block_notes', title: 'Khối C: Kỷ luật & Lưu ý Chính trị (Phụ lục 3)', description: 'Hồ sơ thẩm tra, Kỷ luật Đảng/chính quyền, Quà tặng >50tr' },
  { id: 'block_import', title: 'Nhập / Xuất Excel & Cấu hình Cột', description: 'Quyền nạp dữ liệu Excel hàng loạt và chỉnh sửa mẫu cột' },
];

const rolePermissions = ref({
  Editor: {
    block_basic: 'edit',
    block_travel: 'edit',
    block_relatives: 'edit',
    block_notes: 'view',
    block_import: 'edit',
  },
  Viewer: {
    block_basic: 'view',
    block_travel: 'view',
    block_relatives: 'view',
    block_notes: 'none',
    block_import: 'none',
  },
});

const loadUsers = async () => {
  loading.value = true;
  try {
    users.value = await getUsers();
  } finally {
    loading.value = false;
  }
};

const loadPermissions = async () => {
  try {
    const saved = await getAppSettings('role_permissions_matrix');
    if (saved && typeof saved === 'object') {
      rolePermissions.value = { ...rolePermissions.value, ...saved };
    }
  } catch (e) {}
};

const saveRolePermissions = async () => {
  savingPerms.value = true;
  try {
    await saveAppSettings('role_permissions_matrix', rolePermissions.value);
    await logActivity('Cấu hình Phân quyền', 'Cập nhật ma trận phân quyền theo vai trò (Roles)');
    alert('Lưu cấu hình phân quyền thành công!');
    isRoleMatrixOpen.value = false;
  } catch (e) {
    alert('Lỗi lưu phân quyền: ' + e.message);
  } finally {
    savingPerms.value = false;
  }
};

const getUserRoleName = (user) => {
  if (typeof user.role === 'object') return user.role?.name || 'User';
  return user.role || 'User';
};

const getUserRoleLabel = (user) => {
  const r = getUserRoleName(user);
  if (r === 'Admin' || r === 'Administrator') return 'Quản trị viên (Admin)';
  if (r === 'Editor') return 'Biên tập viên (Editor)';
  if (r === 'Viewer') return 'Cán bộ Tra cứu (Viewer)';
  return r;
};

const openCreateModal = () => {
  editingUser.value = null;
  userForm.value = { first_name: '', email: '', password: '', role: 'Editor', description: '' };
  isUserDialogOpen.value = true;
};

const openEditModal = (user) => {
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
  saving.value = true;
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
    saving.value = false;
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
  await loadUsers();
  await loadPermissions();
});
</script>

<style scoped>
.perm-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8rem;
}

.perm-table th {
  background: #f8fafc;
  padding: 8px 10px;
  border-bottom: 2px solid #e2e8f0;
  color: #334155;
  font-weight: 700;
  text-align: left;
}

.perm-table td {
  padding: 10px 10px;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}

.perm-select {
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 0.75rem;
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

.badge-neutral {
  background: #f1f5f9;
  color: #475569;
}
</style>
