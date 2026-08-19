<template>
  <div class="app-content">
    <div class="app-card">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
        <h3 style="font-size: 1rem; font-weight: 700; color: #1f2937;">
          Nhật ký Hoạt động Hệ thống (Audit Logs)
        </h3>
        <Button
          label="Làm mới"
          icon="pi pi-refresh"
          severity="secondary"
          size="small"
          :loading="loading"
          @click="loadLogs"
          style="font-size: 0.8rem;"
        />
      </div>

      <DataTable
        :value="logs"
        :loading="loading"
        paginator
        :rows="15"
        :rowsPerPageOptions="[10, 15, 25, 50]"
        responsiveLayout="scroll"
        stripedRows
        class="p-datatable-sm"
      >
        <Column field="timestamp" header="Thời gian" sortable headerStyle="width: 12rem;">
          <template #body="{ data }">
            <span style="font-size: 0.75rem; color: #6b7280; font-family: monospace;">
              {{ formatTimestamp(data.timestamp) }}
            </span>
          </template>
        </Column>
        <Column field="action" header="Hành động" sortable headerStyle="width: 14rem;">
          <template #body="{ data }">
            <span class="badge-pill badge-blue">{{ data.action }}</span>
          </template>
        </Column>
        <Column field="details" header="Chi tiết nội dung" />
        <Column field="user_email" header="Tài khoản thực hiện" sortable headerStyle="width: 12rem;">
          <template #body="{ data }">
            <span style="font-weight: 600; color: #374151;">{{ data.user_email || 'Hệ thống' }}</span>
          </template>
        </Column>
      </DataTable>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import { getAuditLogs } from '@/api/audit';

const logs = ref([]);
const loading = ref(false);

const loadLogs = async () => {
  loading.value = true;
  try {
    logs.value = await getAuditLogs();
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadLogs();
});

const formatTimestamp = (val) => {
  if (!val) return '-';
  try {
    const d = new Date(val);
    return d.toLocaleString('vi-VN');
  } catch (e) {
    return val;
  }
};
</script>
