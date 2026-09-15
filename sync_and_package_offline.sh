#!/bin/bash

# ==============================================================================
# TỰ ĐỘNG BIÊN DỊCH, ĐỒNG BỘ & ĐÓNG GÓI ỨNG DỤNG OFFLINE WINDOWS
# - Gói 1: WINDOWS_OFFLINE_UPDATE.zip (CHỈ CODE: giải nén đè giữ nguyên 100% data)
# - Gói 2: WINDOWS_OFFLINE_APP.zip    (BẢN FULL: dành cho cài đặt máy mới lần đầu)
# ==============================================================================

set -e

MODE="both"
SYNC_ONLINE=false

# Đọc tham số dòng lệnh
for arg in "$@"; do
  case $arg in
    --update-only|--update|-u)
      MODE="update"
      SYNC_ONLINE=false
      ;;
    --sync-online)
      SYNC_ONLINE=true
      ;;
    --skip-sync|-s)
      SYNC_ONLINE=false
      ;;
    --full|-f)
      MODE="full"
      ;;
    --all|-a)
      MODE="both"
      ;;
  esac
done

echo ""
echo "========================================================================"
echo "🚀 BẮT ĐẦU ĐÓNG GÓI ỨNG DỤNG WINDOWS OFFLINE..."
echo "   Chế độ: $MODE | Đồng bộ Online: $SYNC_ONLINE"
echo "========================================================================"
echo ""

# 1. Đồng bộ Database & Uploads từ Server Online nếu được yêu cầu
if [ "$SYNC_ONLINE" = true ]; then
  echo "📦 [BƯỚC 1] Đang tải Database & Tệp đính kèm từ Server Online (api.hscb.online)..."
  node scripts/sync_online_db.cjs || {
    echo "⚠️ Không thể kết nối server online hoặc có lỗi mạng. Sử dụng database hiện có."
  }
else
  echo "⏭️  [BƯỚC 1] Bỏ qua tải Database Online (giữ nguyên database & uploads hiện có)."
fi

# 2. Build Frontend mới nhất và cập nhật vào WINDOWS_OFFLINE_APP
echo ""
echo "🔨 [BƯỚC 2] Đang biên dịch Frontend (Vite Build) mã nguồn mới nhất..."
npm run build

if [ ! -f dist/index.html ]; then
  echo "❌ Lỗi: Bản build Vite không tạo ra file dist/index.html!"
  exit 1
fi

rm -rf WINDOWS_OFFLINE_APP/frontend
mkdir -p WINDOWS_OFFLINE_APP/frontend
cp -r dist/* WINDOWS_OFFLINE_APP/frontend/
echo "✅ Đã cập nhật thư mục WINDOWS_OFFLINE_APP/frontend thành công."

# 3. Đóng gói bản CẬP NHẬT CODE (WINDOWS_OFFLINE_UPDATE.zip)
if [ "$MODE" = "update" ] || [ "$MODE" = "both" ]; then
  echo ""
  echo "🗜️  [BƯỚC 3.1] Đang đóng gói bản CẬP NHẬT CODE (WINDOWS_OFFLINE_UPDATE.zip)..."
  echo "    👉 Bản này CHỈ chứa code mới, TUYỆT ĐỐI KHÔNG chứa Database/Uploads."
  echo "    👉 Khi giải nén đè vào máy khách: Dữ liệu hồ sơ cũ được GIỮ NGUYÊN 100%!"

  rm -f WINDOWS_OFFLINE_UPDATE.zip
  
  # Nén các file code từ bên trong thư mục WINDOWS_OFFLINE_APP (giải nén đè thẳng vào thư mục app)
  (
    cd WINDOWS_OFFLINE_APP
    zip -r -q ../WINDOWS_OFFLINE_UPDATE.zip \
      frontend/ \
      app_server.js \
      backend_server.js \
      frontend_server.js \
      2_KHOI_DONG_HE_THONG.bat \
      package.json \
      HUONG_DAN_CAP_NHAT.txt \
      -x "*.DS_Store" "*__MACOSX*"
  )

  UPDATE_SIZE=$(du -h WINDOWS_OFFLINE_UPDATE.zip | cut -f1)
  echo "    ✅ Hoàn tất: WINDOWS_OFFLINE_UPDATE.zip ($UPDATE_SIZE) - Siêu nhẹ, an toàn dữ liệu!"
fi

# 4. Đóng gói bản CÀI ĐẶT MỚI ĐẦY ĐỦ (WINDOWS_OFFLINE_APP.zip)
if [ "$MODE" = "full" ] || [ "$MODE" = "both" ]; then
  echo ""
  echo "🗜️  [BƯỚC 3.2] Đang nén bản CÀI ĐẶT MỚI ĐẦY ĐỦ (WINDOWS_OFFLINE_APP.zip)..."
  echo "    👉 Bản này chứa cả bộ cài Node.js, Database mẫu và hình ảnh Uploads."

  rm -f WINDOWS_OFFLINE_APP.zip
  zip -r -q WINDOWS_OFFLINE_APP.zip WINDOWS_OFFLINE_APP/ \
    -x "*.DS_Store" "*__MACOSX*" "WINDOWS_OFFLINE_APP/CONTINUITY.md"

  FULL_SIZE=$(du -h WINDOWS_OFFLINE_APP.zip | cut -f1)
  echo "    ✅ Hoàn tất: WINDOWS_OFFLINE_APP.zip ($FULL_SIZE)"
fi

echo ""
echo "========================================================================"
echo "🎉 HOÀN TẤT ĐÓNG GÓI THÀNH CÔNG!"
echo "========================================================================"
if [ -f WINDOWS_OFFLINE_UPDATE.zip ]; then
  echo "🟢 [1] BẢN CẬP NHẬT CODE (ĐÈ KHÔNG MẤT DỮ LIỆU):"
  echo "    📁 File: WINDOWS_OFFLINE_UPDATE.zip ($UPDATE_SIZE)"
  echo "    👉 Dùng để update máy đang chạy: Giải nén đè thẳng vào thư mục ứng dụng."
  echo "    🔒 Đảm bảo dữ liệu cũ trong database/ và uploads/ KHÔNG BỊ ẢNH HƯỞNG."
  echo ""
fi
if [ -f WINDOWS_OFFLINE_APP.zip ]; then
  echo "🔵 [2] BẢN CÀI ĐẶT MỚI HOÀN CHỈNH (FULL SETUP):"
  echo "    📁 File: WINDOWS_OFFLINE_APP.zip ($FULL_SIZE)"
  echo "    👉 Dành cho máy tính mới chưa cài đặt bao giờ."
  echo ""
fi
echo "💡 Gợi ý lệnh nhanh:"
echo "   ./sync_and_package_offline.sh --update-only  # Chỉ tạo gói update code trong 10 giây"
echo "   ./sync_and_package_offline.sh --full         # Tải online và đóng gói bản cài full"
echo "========================================================================"
echo ""
