<template>
  <div>
    <label v-if="showLabel" class="field-label">{{ label }}</label>
    
    <!-- File List Display -->
    <div v-if="filesList.length > 0" style="display: flex; flex-direction: column; gap: 6px; margin-bottom: 8px;">
      <div
        v-for="(f, idx) in filesList"
        :key="idx"
        style="display: flex; align-items: center; justify-content: space-between; padding: 6px 10px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 0.8rem;"
      >
        <div style="display: flex; align-items: center; gap: 6px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
          <i class="pi pi-file" style="color: #2e7d32; font-size: 0.9rem;"></i>
          <span style="color: #374151; font-weight: 500;">{{ f.name || 'Tệp đính kèm' }}</span>
        </div>
        <div style="display: flex; align-items: center; gap: 4px; flex-shrink: 0;">
          <a :href="f.url" target="_blank" style="text-decoration: none;">
            <Button label="Xem" size="small" text severity="info" style="padding: 2px 6px; font-size: 0.75rem;" />
          </a>
          <Button
            label="Xóa"
            size="small"
            text
            severity="danger"
            @click="removeFile(idx)"
            style="padding: 2px 6px; font-size: 0.75rem;"
          />
        </div>
      </div>
    </div>

    <!-- Upload Button -->
    <div>
      <input
        type="file"
        ref="fileInput"
        multiple
        @change="handleUpload"
        style="display: none;"
      />
      <Button
        :label="filesList.length > 0 ? '+ Đính thêm tệp khác' : 'Chọn tệp đính kèm'"
        icon="pi pi-paperclip"
        size="small"
        outlined
        severity="secondary"
        :loading="uploading"
        @click="$refs.fileInput.click()"
        style="font-size: 0.8rem;"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import Button from 'primevue/button';
import { uploadFile, getFileUrl } from '@/api/files';

const props = defineProps({
  modelValue: {
    type: [Array, Object, String],
    default: () => [],
  },
  label: {
    type: String,
    default: 'Tệp đính kèm',
  },
  showLabel: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['update:modelValue']);
const uploading = ref(false);
const fileInput = ref(null);

const filesList = computed(() => {
  const val = props.modelValue;
  if (!val) return [];
  let raw = val;
  if (typeof raw === 'string') {
    try {
      raw = JSON.parse(raw);
    } catch (e) {
      if (raw.startsWith('http') || raw.startsWith('data:') || raw.includes('/assets/')) {
        raw = [{ name: 'Tệp đính kèm', url: getFileUrl(raw) }];
      } else {
        return [];
      }
    }
  }
  if (!Array.isArray(raw)) raw = [raw];
  return raw.map((item) => {
    if (typeof item === 'string') {
      return { name: 'Tệp đính kèm', url: getFileUrl(item) };
    }
    return {
      id: item.id || null,
      name: item.name || 'Tệp đính kèm',
      type: item.type || '',
      url: item.url ? getFileUrl(item.url) : (item.id ? getFileUrl(item.id) : ''),
    };
  }).filter((x) => Boolean(x.url));
});

const handleUpload = async (event) => {
  const files = event.target.files;
  if (!files || files.length === 0) return;
  uploading.value = true;
  const current = [...filesList.value];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    try {
      const res = await uploadFile(file);
      if (res?.id) {
        current.push({
          id: res.id,
          name: res.filename_download || file.name,
          type: file.type,
          url: getFileUrl(res.id),
        });
      }
    } catch (err) {
      // Fallback base64
      const b64 = await toBase64(file);
      current.push({
        name: file.name,
        type: file.type,
        url: b64,
      });
    }
  }
  emit('update:modelValue', current);
  uploading.value = false;
  if (fileInput.value) fileInput.value.value = '';
};

const removeFile = (index) => {
  const current = [...filesList.value];
  current.splice(index, 1);
  emit('update:modelValue', current);
};

const toBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
</script>
