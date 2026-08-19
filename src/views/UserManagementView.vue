<template>
  <div class="app-content">
    <div class="app-card">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
        <h3 style="font-size: 1rem; font-weight: 700; color: #1f2937;">
          Quản lý Tài khoản Người dùng & Phân quyền ({{ users.length }} người dùng)
        </h3>
        <Button
          label="Tạo Người dùng mới"
          icon="pi pi-user-plus"
          severity="primary"
          size="small"
          @click="openCreateModal"
          style="font-size: 0.8rem;"
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
          </template>
        </Column>
        <Column field="email" header="Email Đăng nhập" sortable />
        <Column field="role" header="Vai trò (Role)" sortable>
          <template #body="{ data }">
            <span class="badge-pill badge-blue">
              {{ typeof data.role === 'object' ? (data.role?.name || 'User') : (data.role || 'User') }}
            </span>
          </template>
        </Column>
        <Column field="status" header="Trạng thái" sortable>
          <template #body="{ data }">
            <span class="badge-pill badge-green" v-if="data.status === 'active'">Hoạt động</span>
            <span class="badge-pill badge-red" v-else>{{ data.status || 'Active' }}</span>
          </template>
        </Column>
        <Column header="Thao tác" headerStyle="width: 6rem; text-align: right;" bodyStyle="text-align: right;">
          <template #body="{ data }">
            <Button
              v-if="data.email !== 'admin@demo.com'"
              icon="pi pi-trash"
              severity="danger"
              text
              size="small"
              @click="handleDeleteUser(data)"
            />
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Create User Dialog -->
    <Dialog v-model:visible="isCreateOpen" modal header="Tạo Người dùng mới" :style="{ width: '450px' }">
      <div class="form-grid" style="padding-top: 8px;">
        <div class="field-item col-12">
          <label class="field-label">Họ và tên</label>
          <InputText v-model="newUser.first_name" placeholder="Nguyễn Văn A" size="small" />
        </div>
        <div class="field-item col-12">
          <label class="field-label">Email đăng nhập</label>
          <InputText v-model="newUser.email" placeholder="user@example.com" size="small" />
        </div>
        <div class="field-item col-12">
          <label class="field-label">Mật khẩu</label>
          <InputText v-model="newUser.password" type="password" placeholder="Mật khẩu" size="small" />
        </div>
      </div>
      <template #footer>
        <Button label="Hủy" severity="secondary" text size="small" @click="isCreateOpen = false" />
        <Button label="Tạo tài khoản" severity="success" size="small" :loading="creating" @click="submitCreateUser" />
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
import { getUsers, createUser, deleteUser } from '@/api/users';

const users = ref([]);
const loading = ref(false);
const isCreateOpen = ref(false);
const creating = ref(false);

const newUser = ref({
  first_name: '',
  email: '',
  password: '',
});

const loadUsers = async () => {
  loading.value = true;
  try {
    users.value = await getUsers();
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadUsers();
});

const openCreateModal = () => {
  newUser.value = { first_name: '', email: '', password: '' };
  isCreateOpen.value = true;
};

const submitCreateUser = async () => {
  if (!newUser.value.email || !newUser.value.password) {
    alert('Vui lòng điền đầy đủ Email và Mật khẩu!');
    return;
  }
  creating.value = true;
  try {
    await createUser(newUser.value);
    alert('Tạo người dùng thành công!');
    isCreateOpen.value = false;
    await loadUsers();
  } catch (e) {
    alert('Lỗi tạo người dùng: ' + (e.message || e));
  } finally {
    creating.value = false;
  }
};

const handleDeleteUser = async (user) => {
  if (!confirm(`Bạn có chắc muốn xóa tài khoản: "${user.email}" không?`)) return;
  try {
    await deleteUser(user.id);
    await loadUsers();
  } catch (e) {
    alert('Lỗi xóa người dùng: ' + (e.message || e));
  }
};
</script>
