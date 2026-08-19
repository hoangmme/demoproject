<template>
  <div class="app-content">
    <div class="app-card">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
        <h3 style="font-size: 1rem; font-weight: 700; color: #1f2937;">
          Phụ lục 3: Danh sách Cán bộ có vấn đề cần lưu ý, vi phạm, kỷ luật ({{ warningRows.length }} cán bộ)
        </h3>
        <Button
          label="Xuất Phụ lục 3 (Excel)"
          icon="pi pi-file-excel"
          severity="success"
          size="small"
          @click="handleExport"
          style="font-size: 0.8rem;"
        />
      </div>

      <DataTable
        :value="warningRows"
        paginator
        :rows="15"
        :rowsPerPageOptions="[10, 15, 25, 50]"
        responsiveLayout="scroll"
        stripedRows
        class="p-datatable-sm"
        tableStyle="min-width: 60rem"
      >
        <Column field="stt" header="STT" headerStyle="width: 3.5rem;" />
        <Column field="personCode" header="Mã CB" sortable />
        <Column field="personName" header="Họ và tên" sortable>
          <template #body="{ data }">
            <strong>{{ data.personName }}</strong>
          </template>
        </Column>
        <Column field="departmentName" header="Phòng ban" sortable />
        <Column field="partyDiscipline" header="Kỷ luật Đảng" sortable>
          <template #body="{ data }">
            <span v-if="data.partyDiscipline !== '-'" class="badge-pill badge-red">{{ data.partyDiscipline }}</span>
            <span v-else>-</span>
          </template>
        </Column>
        <Column field="govDiscipline" header="Kỷ luật Chính quyền" sortable>
          <template #body="{ data }">
            <span v-if="data.govDiscipline !== '-'" class="badge-pill badge-red">{{ data.govDiscipline }}</span>
            <span v-else>-</span>
          </template>
        </Column>
        <Column field="politicalIssue" header="Vấn đề chính trị" sortable />
        <Column field="lawViolation" header="Vi phạm pháp luật" sortable />
        <Column field="otherIssue" header="Lưu ý khác" sortable />
      </DataTable>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import { usePersonnelStore } from '@/stores/personnel';
import { formatPersonnelCode } from '@/utils/formatters';
import { exportToExcel } from '@/utils/excel';

const personnelStore = usePersonnelStore();

onMounted(async () => {
  if (personnelStore.personnelList.length === 0) {
    await personnelStore.init();
  }
});

const warningRows = computed(() => {
  const rows = [];
  let stt = 1;
  personnelStore.personnelList.forEach((p) => {
    const f = p.flags || {};
    const hasWarning = f.partyDiscipline || f.govDiscipline || f.politicalIssue || f.lawViolation || f.investigating || f.noPermission || f.overstay || f.otherIssue;
    if (hasWarning) {
      rows.push({
        stt: stt++,
        personCode: p.code || formatPersonnelCode(p.id),
        personName: p.name,
        departmentName: personnelStore.getDepartmentName(p.departmentId),
        partyDiscipline: f.partyDiscipline || '-',
        govDiscipline: f.govDiscipline || '-',
        politicalIssue: f.politicalIssue || '-',
        lawViolation: f.lawViolation || '-',
        otherIssue: f.otherIssue || '-',
      });
    }
  });
  return rows;
});

const handleExport = () => {
  exportToExcel(warningRows.value, 'Phu_luc_3_Luu_y_va_Ky_luat', 'Phụ lục 3');
};
</script>
