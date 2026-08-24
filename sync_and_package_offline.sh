#!/bin/bash

# ==============================================================================
# TỰ ĐỘNG ĐỒNG BỘ DATABASE ONLINE VỀ WINDOWS_OFFLINE_APP & NÉN ZIP ĐÓNG GÓI
# ==============================================================================

set -e

echo ""
echo "========================================================================"
echo "🚀 BẮT ĐẦU QUY TRÌNH ĐỒNG BỘ DỮ LIỆU & ĐÓNG GÓI WINDOWS OFFLINE APP..."
echo "========================================================================"
echo ""

# 1. Đồng bộ Database & Uploads từ Server Online (api.hscb.online)
echo "📦 [BƯỚC 1/3] Đang tải Database & Tệp đính kèm từ Server Online..."
node scripts/sync_online_db.cjs

# 2. Build Frontend mới nhất và cập nhật vào WINDOWS_OFFLINE_APP
echo ""
echo "🔨 [BƯỚC 2/3] Đang biên dịch Frontend (Vite Build) và cập nhật giao diện..."
npm run build
rm -rf WINDOWS_OFFLINE_APP/frontend
cp -r dist WINDOWS_OFFLINE_APP/frontend

# 3. Nén thư mục WINDOWS_OFFLINE_APP thành file ZIP
echo ""
echo "🗜️  [BƯỚC 3/3] Đang nén toàn bộ gói WINDOWS_OFFLINE_APP.zip..."
rm -f WINDOWS_OFFLINE_APP.zip
zip -r -q WINDOWS_OFFLINE_APP.zip WINDOWS_OFFLINE_APP/ -x "*.DS_Store" "*__MACOSX*"

ZIP_SIZE=$(du -h WINDOWS_OFFLINE_APP.zip | cut -f1)

echo ""
echo "========================================================================"
echo "🎉 HOÀN TẤT ĐÓNG GÓI THÀNH CÔNG!"
echo "========================================================================"
echo "📁 Tệp cài đặt hoàn chỉnh: WINDOWS_OFFLINE_APP.zip ($ZIP_SIZE)"
echo "📍 Đường dẫn: $(pwd)/WINDOWS_OFFLINE_APP.zip"
echo ""
echo "👉 HƯỚNG DẪN SỬ DỤNG TRÊN MÁY WINDOWS:"
echo "   1. Tải tệp 'WINDOWS_OFFLINE_APP.zip' về máy tính Windows và Giải nén."
echo "   2. Nếu máy chưa có Node.js: Chạy file '1_CAI_DAT_NODEJS.bat'."
echo "   3. Khởi động phần mềm: Nhấp đúp file '2_KHOI_DONG_HE_THONG.bat'."
echo "========================================================================"
echo ""
