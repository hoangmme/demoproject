import apiClient from './client';

/**
 * Ánh xạ định dạng cột trong cấu hình sang kiểu dữ liệu Directus
 */
export const mapFormatToDirectusType = (format) => {
  switch (format) {
    case 'number':
    case 'integer':
      return {
        type: 'integer',
        schema: { data_type: 'int', is_nullable: true },
        meta: { interface: 'input' },
      };
    case 'date':
      return {
        type: 'date',
        schema: { data_type: 'date', is_nullable: true },
        meta: { interface: 'datetime' },
      };
    case 'textarea':
      return {
        type: 'text',
        schema: { data_type: 'text', is_nullable: true },
        meta: { interface: 'input-multiline' },
      };
    case 'file':
    case 'attachment':
    case 'json':
      return {
        type: 'json',
        schema: { data_type: 'json', is_nullable: true },
        meta: { interface: 'input-code' },
      };
    case 'boolean':
      return {
        type: 'boolean',
        schema: { data_type: 'boolean', is_nullable: true },
        meta: { interface: 'boolean' },
      };
    case 'dropdown':
      return {
        type: 'string',
        schema: { data_type: 'varchar', max_length: 255, is_nullable: true },
        meta: { interface: 'select-dropdown' },
      };
    default:
      return {
        type: 'string',
        schema: { data_type: 'varchar', max_length: 255, is_nullable: true },
        meta: { interface: 'input' },
      };
  }
};

/**
 * Lấy danh sách các cột vật lý hiện có của 1 collection trên Directus
 */
export const getCollectionFields = async (collection = 'personnels') => {
  try {
    const res = await apiClient.get(`/fields/${collection}`);
    return res.data?.data || [];
  } catch (e) {
    if (e?.response?.status === 403) return null;
    if (collection === 'personnels') {
      try {
        const res = await apiClient.get('/fields/personnel');
        return res.data?.data || [];
      } catch (err) {
        if (err?.response?.status === 403) return null;
        return [];
      }
    }
    return [];
  }
};

/**
 * Tạo mới 1 cột vật lý trên Directus
 */
export const createDirectusField = async (collection = 'personnels', colDef) => {
  if (!colDef?.id) return null;
  const fieldName = String(colDef.id).trim();
  const typeDef = mapFormatToDirectusType(colDef.format);

  const payload = {
    field: fieldName,
    type: typeDef.type,
    schema: typeDef.schema,
    meta: {
      ...typeDef.meta,
      note: colDef.label || fieldName,
      options: colDef.options
        ? {
            choices: String(colDef.options)
              .split(',')
              .map((opt) => opt.trim())
              .filter(Boolean)
              .map((opt) => ({ text: opt, value: opt })),
          }
        : null,
    },
  };

  try {
    const res = await apiClient.post(`/fields/${collection}`, payload);
    return res.data?.data;
  } catch (e) {
    if (collection === 'personnels') {
      try {
        const res = await apiClient.post('/fields/personnel', payload);
        return res.data?.data;
      } catch (err) {
        return null;
      }
    }
    return null;
  }
};

/**
 * Cập nhật thuộc tính của 1 cột trên Directus
 */
export const updateDirectusField = async (collection = 'personnels', fieldName, colDef) => {
  if (!fieldName) return null;
  const payload = {
    meta: {
      note: colDef.label || fieldName,
      options: colDef.options
        ? {
            choices: String(colDef.options)
              .split(',')
              .map((opt) => opt.trim())
              .filter(Boolean)
              .map((opt) => ({ text: opt, value: opt })),
          }
        : null,
    },
  };

  try {
    const res = await apiClient.patch(`/fields/${collection}/${fieldName}`, payload);
    return res.data?.data;
  } catch (e) {
    if (collection === 'personnels') {
      try {
        const res = await apiClient.patch(`/fields/personnel/${fieldName}`, payload);
        return res.data?.data;
      } catch (err) {
        return null;
      }
    }
    return null;
  }
};

/**
 * Xóa 1 cột vật lý trên Directus
 */
export const deleteDirectusField = async (collection = 'personnels', fieldName) => {
  if (!fieldName) return null;
  try {
    const res = await apiClient.delete(`/fields/${collection}/${fieldName}`);
    return res.data?.data;
  } catch (e) {
    if (collection === 'personnels') {
      try {
        const res = await apiClient.delete(`/fields/personnel/${fieldName}`);
        return res.data?.data;
      } catch (err) {
        return null;
      }
    }
    return null;
  }
};

/**
 * Đồng bộ danh sách cột giao diện với Directus (Tối ưu tốc độ: Chạy song song Promise.all, chỉ tạo cột mới chưa có)
 */
export const syncCollectionFields = async (collection = 'personnels', activeCols = []) => {
  const systemCols = new Set([
    'id',
    'code',
    'date_created',
    'date_updated',
    'user_created',
    'user_updated',
    'custom_data',
    'sort',
    'status',
    'stt',
  ]);

  try {
    const existingFields = await getCollectionFields(collection);
    // Nếu quyền bị 403 (không phải Admin Directus), bỏ qua đồng bộ schema vật lý (hệ thống lưu vào custom_data an toàn)
    if (existingFields === null) {
      return;
    }

    const existingFieldMap = {};
    existingFields.forEach((f) => {
      if (f.field) existingFieldMap[f.field] = f;
    });

    const activeFieldMap = {};
    activeCols.forEach((col) => {
      if (col.id && !systemCols.has(col.id)) {
        activeFieldMap[col.id] = col;
      }
    });

    // Chỉ tạo các cột MỚI chưa tồn tại trên Directus và gửi song song (Promise.all)
    const newColsToCreate = Object.entries(activeFieldMap)
      .filter(([colId]) => !existingFieldMap[colId])
      .map(([_, colDef]) => createDirectusField(collection, colDef));

    if (newColsToCreate.length > 0) {
      await Promise.all(newColsToCreate);
    }
  } catch (err) {
    console.warn(`[Directus Sync] Lỗi đồng bộ cấu trúc cột:`, err);
  }
};
