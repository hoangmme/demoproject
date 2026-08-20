<template>
  <div class="app-content">
    <div class="app-card">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
        <h3 style="font-size: 1rem; font-weight: 700; color: #1f2937;">
          Phụ lục 2: Cán bộ có thân nhân ở nước ngoài ({{ relativeRows.length }} người)
        </h3>
        <Button
          label="Xuất Phụ lục 2 (Excel)"
          icon="pi pi-file-excel"
          severity="success"
          size="small"
          @click="handleExport"
          style="font-size: 0.8rem;"
        />
      </div>

      <DataTable
        :value="relativeRows"
        paginator
        :rows="15"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport"
        currentPageReportTemplate="Hiển thị {first} đến {last} của {totalRecords} bản ghi"
        responsiveLayout="scroll"
        stripedRows
        class="p-datatable-sm"
        tableStyle="min-width: 60rem"
      >
        <Column field="stt" header="STT" headerStyle="width: 3.5rem;" />
        <Column field="parentName" header="Cán bộ" sortable>
          <template #body="{ data }">
            <strong>{{ data.parentName }}</strong>
            <div style="font-size: 0.75rem; color: #6b7280;">{{ data.parentDepartment }}</div>
          </template>
        </Column>
        <Column field="relationshipName" header="Quan hệ" sortable>
          <template #body="{ data }">
            <span class="badge-pill badge-purple">{{ data.relationshipName || '-' }}</span>
          </template>
        </Column>
        <Column field="relativeName" header="Họ và tên thân nhân" sortable />
        <Column field="birthYear" header="Năm sinh" sortable />
        <Column field="countryName" header="Quốc gia ở NN" sortable />
        <Column field="timeAbroad" header="Thời gian ở NN" sortable />
        <Column field="unitAbroad" header="Cơ quan/Trường học NN" sortable />
        <Column field="occupation" header="Nghề nghiệp" sortable />
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
import { formatDate } from '@/utils/formatters';
import { exportToExcel } from '@/utils/excel';

const personnelStore = usePersonnelStore();

onMounted(async () => {
  if (personnelStore.personnelList.length === 0) {
    await personnelStore.init();
  }
});

const relativeRows = computed(() => {
  const rows = [];
  let stt = 1;
  personnelStore.personnelList.forEach((p) => {
    if (Array.isArray(p.relatives) && p.relatives.length > 0) {
      p.relatives.forEach((r) => {
        rows.push({
          stt: stt++,
          parentName: p.name,
          parentDepartment: personnelStore.getDepartmentName(p.departmentId),
          relationshipName: r.relationshipName || '-',
          relativeName: r.relativeName || '-',
          birthYear: formatDate(r.birthYear) || '-',
          countryName: r.countryName || '-',
          timeAbroad: r.timeAbroad || '-',
          unitAbroad: r.unitAbroad || '-',
          occupation: r.occupation || '-',
        });
      });
    }
  });
  return rows;
});

const handleExport = () => {
  exportToExcel(relativeRows.value, 'Phu_luc_2_Than_nhan_nuoc_ngoai', 'Phụ lục 2');
};
</script>
