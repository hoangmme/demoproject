/**
 * Script quét và di chuyển dữ liệu khóa định danh chính cũ sang cột mới được người dùng cấu hình
 * Lấy động target key từ app_settings (system_key_config), không hardcode
 */
const axios = require("axios");
const token = process.env.VITE_STATIC_TOKEN || "CooAJKTu9_NLEgtaq3qULrswZGLFfsAw";
const baseUrl = "https://api.hscb.online";

async function run() {
  try {
    const configRes = await axios.get(`${baseUrl}/items/app_settings?filter[key][_eq]=system_key_config`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const configVal = typeof configRes.data.data[0].value === "string" 
      ? JSON.parse(configRes.data.data[0].value) 
      : configRes.data.data[0].value;
    const targetKey = configVal.personnelKeyField || "cccdparent";
    console.log("Target Primary Key Field for Personnel:", targetKey);

    const res = await axios.get(`${baseUrl}/items/personnels?limit=-1`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const list = res.data.data || [];
    console.log(`Tổng số bản ghi personnels: ${list.length}`);

    let updatedCount = 0;
    for (const p of list) {
      let customData = {};
      if (p.custom_data) {
        try {
          customData = typeof p.custom_data === "string" ? JSON.parse(p.custom_data) : p.custom_data;
        } catch (e) {
          customData = {};
        }
      }

      const existingTargetVal = p[targetKey] || customData[targetKey];
      const sourceVal = p.cccd || customData.cccd || p.so_cccd || customData.so_cccd;

      if ((!existingTargetVal || String(existingTargetVal).trim() === "" || String(existingTargetVal).trim() === "-") && sourceVal) {
        console.log(`Di chuyển CCCD cho ID ${p.id} (${p.name || p.code}): "${sourceVal}" -> ${targetKey}`);
        customData[targetKey] = sourceVal;
        const patchPayload = {
          [targetKey]: sourceVal,
          custom_data: JSON.stringify(customData)
        };

        await axios.patch(`${baseUrl}/items/personnels/${p.id}`, patchPayload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        updatedCount++;
      }
    }

    console.log(`Hoàn thành! Đã cập nhật ${updatedCount} bản ghi sang cột "${targetKey}".`);
  } catch (err) {
    console.error("Lỗi:", err.response?.data || err.message);
  }
}

run();
