import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import { formatDate } from './formatters';

/**
 * Chuẩn hóa dữ liệu của một cán bộ thành dictionary để khớp với các Tag trong Word
 * @param {Object} person - Đối tượng Cán bộ
 * @param {Number} index - Số thứ tự trong danh sách (0-indexed)
 * @param {Object} personnelStore - Pinia store chứa danh mục & cấu hình cột
 * @returns {Object} Context data cho docxtemplater
 */
export function preparePersonnelDocxData(person, index = 0, personnelStore = null, currentUser = null) {
  if (!person) return {};

  const cd = person.custom_data || {};
  const today = new Date();
  const dayStr = String(today.getDate()).padStart(2, '0');
  const monthStr = String(today.getMonth() + 1).padStart(2, '0');
  const yearStr = String(today.getFullYear());

  const exporterName = currentUser?.name || currentUser?.fullName || currentUser?.first_name || currentUser?.email || 'Quản trị viên';

  const data = {
    // 1. Hệ thống & Người xuất & Ngày tháng
    stt: index + 1,
    ho_ten_nguoi_xuat: exporterName,
    current_date: `${dayStr}/${monthStr}/${yearStr}`,
    ngay_hien_tai: `${dayStr}/${monthStr}/${yearStr}`,
    ngay: dayStr,
    thang: monthStr,
    nam: yearStr,

    // 2. Thông tin cơ bản
    code: person.code || '',
    ma_can_bo: person.code || '',
    name: person.name || '',
    ho_ten: person.name || '',
    otherName: person.otherName || '',
    ten_khac: person.otherName || '',
    birthYear: formatDate(person.birthYear || cd.birthYear),
    nam_sinh: formatDate(person.birthYear || cd.birthYear),
    ngay_sinh: formatDate(person.birthYear || cd.birthYear),
    gender: person.gender || cd.gender || '',
    gioi_tinh: person.gender || cd.gender || '',
    ethnicity: person.ethnicity || cd.ethnicity || 'Kinh',
    dan_toc: person.ethnicity || cd.ethnicity || 'Kinh',
    religion: person.religion || cd.religion || 'Không',
    ton_giao: person.religion || cd.religion || 'Không',
    hometown: person.hometown || cd.hometown || '',
    que_quan: person.hometown || cd.hometown || '',

    // 3. Đơn vị & Chức vụ
    departmentName: person.departmentName || (person.departmentId && personnelStore ? personnelStore.getDepartmentName(person.departmentId) : '') || cd.departmentName || '',
    don_vi: person.departmentName || (person.departmentId && personnelStore ? personnelStore.getDepartmentName(person.departmentId) : '') || cd.departmentName || '',
    positionName: person.positionName || person.position || cd.positionName || cd.position || '',
    chuc_vu: person.positionName || person.position || cd.positionName || cd.position || '',

    // 4. Cư trú & Giấy tờ
    thuongTru: person.thuongTru || cd.thuongTru || '',
    thuong_tru: person.thuongTru || cd.thuongTru || '',
    tamTru: person.tamTru || cd.tamTru || '',
    tam_tru: person.tamTru || cd.tamTru || '',
    cccdparent: person.cccdparent || cd.cccdparent || '',
    passportPersonal: person.passportPersonal || person.hcCaNhan || cd.passportPersonal || cd.hcCaNhan || '',
    ho_chieu_ca_nhan: person.passportPersonal || person.hcCaNhan || cd.passportPersonal || cd.hcCaNhan || '',
    passportOfficial: person.passportOfficial || person.hcCongVu || cd.passportOfficial || cd.hcCongVu || '',
    ho_chieu_cong_vu: person.passportOfficial || person.hcCongVu || cd.passportOfficial || cd.hcCongVu || '',
    tcctResult: person.tcctResult || person.kqThamTra || cd.tcctResult || cd.kqThamTra || '',
    ket_qua_tham_tra: person.tcctResult || person.kqThamTra || cd.tcctResult || cd.kqThamTra || '',
  };

  const generateSlug = (str) => {
    if (!str) return '';
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, 'd')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  };

  // 5. Làm phẳng toàn bộ custom_data & các cột tùy chỉnh
  Object.entries(cd).forEach(([key, val]) => {
    if (val !== undefined && val !== null) {
      if (Array.isArray(val)) {
        // Nếu là mảng table_loop dạng [{ col0, col1... }]
        data[key] = val.map((row, rIdx) => {
          if (typeof row === 'object' && row !== null) {
            return { stt: rIdx + 1, ...row };
          }
          return { stt: rIdx + 1, val: row };
        });
      } else if (typeof val === 'object' && val instanceof Date) {
        data[key] = formatDate(val);
      } else {
        const str = String(val).trim();
        if (/^\d{4}-\d{2}-\d{2}/.test(str) || str.includes('GMT') || str.includes('T00:')) {
          data[key] = formatDate(str);
        } else {
          data[key] = str;
        }

        // Tự động phân rã trường Hộp kiểm + Nhập Text (checkbox_text) và Hộp kiểm (checkbox)
        if (str.includes(':') || str.includes(';') || str.includes(',')) {
          const parts = str.split(/[,;]/);
          parts.forEach((p) => {
            const trimmed = p.trim();
            if (trimmed) {
              const colon = trimmed.indexOf(':');
              if (colon !== -1) {
                const optName = trimmed.substring(0, colon).trim();
                const optDetail = trimmed.substring(colon + 1).trim();
                const optSlug = generateSlug(optName);
                if (optSlug) {
                  data[`${key}_${optSlug}`] = optDetail || optName;
                  data[`is_${key}_${optSlug}`] = 'X';
                  data[`check_${key}_${optSlug}`] = '☑';
                }
              } else {
                const optSlug = generateSlug(trimmed);
                if (optSlug) {
                  data[`${key}_${optSlug}`] = trimmed;
                  data[`is_${key}_${optSlug}`] = 'X';
                  data[`check_${key}_${optSlug}`] = '☑';
                }
              }
            }
          });
        }
      }
    }
  });

  // 6. Danh sách Thân nhân (Loop {#than_nhan} / {#relatives})
  const rawRelatives = Array.isArray(person.relatives) ? person.relatives : (cd.relatives || []);
  const processedRelatives = rawRelatives.map((rel, rIdx) => {
    const rcd = rel.custom_data || {};
    const relObj = {
      stt: rIdx + 1,
      code: rel.code || `TN-${String(rIdx + 1).padStart(4, '0')}`,
      ma_than_nhan: rel.code || `TN-${String(rIdx + 1).padStart(4, '0')}`,
      relativeName: rel.relativeName || rel.name || '',
      ho_ten_tn: rel.relativeName || rel.name || '',
      ho_ten: rel.relativeName || rel.name || '',
      tn_ho_ten: rel.relativeName || rel.name || '',
      relationshipName: rel.relationshipName || rel.relationship || '',
      quan_he: rel.relationshipName || rel.relationship || '',
      tn_quan_he: rel.relationshipName || rel.relationship || '',
      birthYear: formatDate(rel.birthYear || rcd.birthYear),
      nam_sinh: formatDate(rel.birthYear || rcd.birthYear),
      ngay_sinh: formatDate(rel.birthYear || rcd.birthYear),
      tn_nam_sinh: formatDate(rel.birthYear || rcd.birthYear),
      tn_ngay_sinh: formatDate(rel.birthYear || rcd.birthYear),
      gender: rel.gender || rcd.gender || '',
      gioi_tinh: rel.gender || rcd.gender || '',
      tn_gioi_tinh: rel.gender || rcd.gender || '',
      countryName: rel.countryName || rel.country || '',
      quoc_gia: rel.countryName || rel.country || '',
      tn_quoc_gia: rel.countryName || rel.country || '',
      quoc_tich: rel.nationality || rcd.nationality || rel.countryName || '',
      nationality: rel.nationality || rcd.nationality || rel.countryName || '',
      residenceStatus: rel.residenceStatus || rcd.residenceStatus || '',
      tinh_trang_cu_tru: rel.residenceStatus || rcd.residenceStatus || '',
      job: rel.job || rcd.job || '',
      nghe_nghiep: rel.job || rcd.job || '',
      tn_nghe_nghiep: rel.job || rcd.job || '',
      workplace: rel.workplace || rcd.workplace || '',
      noi_lam_viec: rel.workplace || rcd.workplace || '',
      address: rel.address || rcd.address || '',
      dia_chi: rel.address || rcd.address || '',
      tn_dia_chi: rel.address || rcd.address || '',
      cccdparent: rel.cccdparent || rcd.cccdparent || person.cccdparent || '',
      cccdthannhan: rel.cccdthannhan || rcd.cccdthannhan || rel.cccd || '',
      tn_cccd: rel.cccdthannhan || rcd.cccdthannhan || rel.cccd || '',
    };

    // Đẩy các cột custom của thân nhân vào (với cả key gốc và key có prefix tn_)
    Object.entries(rcd).forEach(([k, v]) => {
      if (v !== undefined && v !== null) {
        const cleanV = typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v) ? formatDate(v) : v;
        relObj[k] = cleanV;
        relObj[`tn_${k}`] = cleanV;
      }
    });
    return relObj;
  });

  data.than_nhan = processedRelatives;
  data.relatives = processedRelatives;
  data.so_luong_than_nhan = processedRelatives.length;
  data.total_relatives = processedRelatives.length;

  // Flatten top 10 thân nhân ra ngoài root context để dùng được ngay cả khi mẫu Word không dùng thẻ lặp
  processedRelatives.forEach((relItem, idx) => {
    const num = idx + 1;
    data[`tn_${num}_ho_ten`] = relItem.ho_ten;
    data[`tn_${num}_quan_he`] = relItem.quan_he;
    data[`tn_${num}_nam_sinh`] = relItem.nam_sinh;
    data[`tn_${num}_nghe_nghiep`] = relItem.nghe_nghiep;
    data[`tn_${num}_quoc_gia`] = relItem.quoc_gia;
    data[`tn_${num}_dia_chi`] = relItem.dia_chi;
    data[`tn_${num}_cccd`] = relItem.cccdthannhan;
  });

  // 7. Danh sách Chuyến đi Nước ngoài (Loop {#chuyen_di} / {#trips})
  const rawTrips = Array.isArray(person.trips) ? person.trips : (cd.trips || []);
  const processedTrips = rawTrips.map((trip, tIdx) => {
    const tcd = trip.custom_data || {};
    const tripObj = {
      stt: tIdx + 1,
      countryName: trip.countryName || trip.country || '',
      quoc_gia_den: trip.countryName || trip.country || '',
      purpose: trip.purpose || '',
      muc_dich: trip.purpose || '',
      departureDate: formatDate(trip.departureDate || trip.approvedDepartureDate),
      ngay_di: formatDate(trip.departureDate || trip.approvedDepartureDate),
      arrivalDate: formatDate(trip.arrivalDate || trip.approvedArrivalDate),
      ngay_ve: formatDate(trip.arrivalDate || trip.approvedArrivalDate),
      approvedDepartureDate: formatDate(trip.approvedDepartureDate || trip.departureDate),
      ngay_di_duoc_duyet: formatDate(trip.approvedDepartureDate || trip.departureDate),
      approvedArrivalDate: formatDate(trip.approvedArrivalDate || trip.arrivalDate),
      ngay_ve_duoc_duyet: formatDate(trip.approvedArrivalDate || trip.arrivalDate),
      approvedExtensionDate: formatDate(trip.approvedExtensionDate),
      ngay_gia_han: formatDate(trip.approvedExtensionDate),
      decisionNumber: trip.decisionNumber || trip.decision || '',
      so_quyet_dinh: trip.decisionNumber || trip.decision || '',
      fundingName: trip.fundingName || trip.funding || '',
      kinh_phi: trip.fundingName || trip.funding || '',
      destinationDetails: trip.destinationDetails || '',
      dia_diem_cu_the: trip.destinationDetails || '',
      status: trip.status || '',
      trang_thai: trip.status || '',
    };

    Object.entries(tcd).forEach(([k, v]) => {
      if (v !== undefined && v !== null) {
        tripObj[k] = typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v) ? formatDate(v) : v;
      }
    });
    return tripObj;
  });

  data.chuyen_di = processedTrips;
  data.trips = processedTrips;
  data.so_luong_chuyen_di = processedTrips.length;
  data.total_trips = processedTrips.length;

  return data;
}

/**
 * Tạo 1 file DOCX Blob từ template ArrayBuffer và dữ liệu cán bộ
 * @param {ArrayBuffer} templateBuffer
 * @param {Object} contextData
 * @returns {Blob}
 */
export function generateDocxBlob(templateBuffer, contextData) {
  try {
    const zip = new PizZip(templateBuffer);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      nullGetter: () => '', // Tránh hiện undefined nếu thẻ tag trống
    });

    doc.render(contextData);

    const out = doc.getZip().generate({
      type: 'blob',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });

    return out;
  } catch (error) {
    console.error('Docxtemplater rendering error:', error);
    if (error.properties && error.properties.errors instanceof Array) {
      const errorMessages = error.properties.errors
        .map((e) => e.message || JSON.stringify(e))
        .join('\n');
      throw new Error(`Lỗi cú pháp mẫu Word:\n${errorMessages}`);
    }
    throw error;
  }
}

import { renderAsync } from 'docx-preview';
import html2pdf from 'html2pdf.js';

/**
 * Chuyển đổi một DOCX Blob thành PDF Blob chất lượng cao
 * @param {Blob} docxBlob
 * @returns {Promise<Blob>}
 */
export async function convertDocxBlobToPdfBlob(docxBlob) {
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '794px'; // Khổ A4 ở 96 DPI
  container.style.background = '#ffffff';
  container.style.color = '#000000';
  container.style.padding = '20px';
  document.body.appendChild(container);

  try {
    await renderAsync(docxBlob, container, null, {
      inWrapper: false,
      ignoreWidth: false,
      ignoreHeight: false,
      renderHeaders: true,
      renderFooters: true,
      renderFootnotes: true,
      renderEndnotes: true,
    });

    const opt = {
      margin: [10, 10, 10, 10],
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    };

    const pdfBlob = await html2pdf().set(opt).from(container).outputPdf('blob');
    return pdfBlob;
  } finally {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
}

/**
 * Xuất 1 file Word hoặc PDF cho 1 cán bộ và tải về máy
 */
export async function exportSinglePersonnelDocx(templateBuffer, person, filename, personnelStore, outputFormat = 'docx', currentUser = null) {
  const contextData = preparePersonnelDocxData(person, 0, personnelStore, currentUser);
  const docxBlob = generateDocxBlob(templateBuffer, contextData);
  const baseName = `Ho_so_${(person.name || 'Can_bo').replace(/[^a-zA-Z0-9_\u00C0-\u1EF9]/g, '_')}`;

  if (outputFormat === 'pdf') {
    const pdfBlob = await convertDocxBlobToPdfBlob(docxBlob);
    saveAs(pdfBlob, `${baseName}.pdf`);
  } else {
    saveAs(docxBlob, `${baseName}.docx`);
  }
}

/**
 * Xuất nhiều cán bộ và đóng gói thành tệp .ZIP (chứa các file DOCX hoặc PDF)
 */
export async function exportMultiplePersonnelZip(templateBuffer, personnelList, zipName, personnelStore, onProgress, outputFormat = 'docx', currentUser = null) {
  const zip = new JSZip();
  const total = personnelList.length;

  for (let i = 0; i < total; i++) {
    const person = personnelList[i];
    const contextData = preparePersonnelDocxData(person, i, personnelStore, currentUser);
    const docxBlob = generateDocxBlob(templateBuffer, contextData);

    const safePersonName = (person.name || `Can_bo_${i + 1}`).replace(/[^a-zA-Z0-9_\u00C0-\u1EF9]/g, '_');
    const ext = outputFormat === 'pdf' ? 'pdf' : 'docx';
    const fileName = `${String(i + 1).padStart(3, '0')}_${safePersonName}_${person.code || 'CB'}.${ext}`;

    if (outputFormat === 'pdf') {
      const pdfBlob = await convertDocxBlobToPdfBlob(docxBlob);
      zip.file(fileName, pdfBlob);
    } else {
      zip.file(fileName, docxBlob);
    }

    if (typeof onProgress === 'function') {
      onProgress(i + 1, total);
    }
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const extLabel = outputFormat === 'pdf' ? 'PDF' : 'Word';
  const finalZipName = zipName || `Danh_sach_Ho_so_${total}_can_bo_${extLabel}.zip`;
  saveAs(zipBlob, finalZipName);
}

/**
 * Tạo một file Word (.docx) mẫu chuẩn hoàn chỉnh với các thẻ Tag và Bảng lặp
 * @returns {Promise<Blob>}
 */
export async function createSampleDocxTemplateBlob() {
  const zip = new JSZip();

  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

  const rootRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <!-- Header -->
    <w:p>
      <w:pPr><w:jc w:val="center"/></w:pPr>
      <w:r><w:rPr><w:b/><w:sz w:val="28"/><w:color w:val="1E293B"/></w:rPr><w:t>SƠ YẾU LÝ LỊCH TRÍCH NGANG CÁN BỘ</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:jc w:val="center"/></w:pPr>
      <w:r><w:rPr><w:i/><w:sz w:val="20"/><w:color w:val="64748B"/></w:rPr><w:t>(Dữ liệu xuất tự động từ hệ thống - Ngày: {ngay_hien_tai})</w:t></w:r>
    </w:p>
    <w:p/>

    <!-- Section A -->
    <w:p><w:r><w:rPr><w:b/><w:sz w:val="24"/><w:color w:val="0369A1"/></w:rPr><w:t>I. THÔNG TIN CƠ BẢN</w:t></w:r></w:p>
    <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>1. Họ và tên: </w:t></w:r><w:r><w:rPr><w:b/><w:color w:val="DC2626"/></w:rPr><w:t>{ho_ten}</w:t></w:r><w:r><w:t> (Tên gọi khác: {ten_khac})</w:t></w:r></w:p>
    <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>2. Mã cán bộ: </w:t></w:r><w:r><w:t>{ma_can_bo}  |  </w:t></w:r><w:r><w:rPr><w:b/></w:rPr><w:t>Năm sinh: </w:t></w:r><w:r><w:t>{nam_sinh}  |  </w:t></w:r><w:r><w:rPr><w:b/></w:rPr><w:t>Dân tộc: </w:t></w:r><w:r><w:t>{dan_toc}  |  </w:t></w:r><w:r><w:rPr><w:b/></w:rPr><w:t>Tôn giáo: </w:t></w:r><w:r><w:t>{ton_giao}</w:t></w:r></w:p>
    <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>3. Quê quán: </w:t></w:r><w:r><w:t>{que_quan}</w:t></w:r></w:p>
    <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>4. Đơn vị công tác: </w:t></w:r><w:r><w:rPr><w:b/></w:rPr><w:t>{don_vi}</w:t></w:r><w:r><w:t>  |  </w:t></w:r><w:r><w:rPr><w:b/></w:rPr><w:t>Chức vụ: </w:t></w:r><w:r><w:t>{chuc_vu}</w:t></w:r></w:p>
    <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>5. Số CCCD: </w:t></w:r><w:r><w:t>{so_cccd}</w:t></w:r></w:p>
    <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>6. Nơi thường trú: </w:t></w:r><w:r><w:t>{thuong_tru}</w:t></w:r></w:p>
    <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>7. Hộ chiếu cá nhân: </w:t></w:r><w:r><w:t>{ho_chieu_ca_nhan}</w:t></w:r><w:r><w:t>  |  </w:t></w:r><w:r><w:rPr><w:b/></w:rPr><w:t>Hộ chiếu công vụ: </w:t></w:r><w:r><w:t>{ho_chieu_cong_vu}</w:t></w:r></w:p>
    <w:p/>

    <!-- Section B -->
    <w:p><w:r><w:rPr><w:b/><w:sz w:val="24"/><w:color w:val="0369A1"/></w:rPr><w:t>II. LỊCH SỬ ĐI NƯỚC NGOÀI ({so_luong_chuyen_di} chuyến)</w:t></w:r></w:p>
    <w:p><w:r><w:t>{#chuyen_di}</w:t></w:r></w:p>
    <w:p><w:r><w:t>- Chuyến {stt}: Quốc gia đến: </w:t></w:r><w:r><w:rPr><w:b/></w:rPr><w:t>{quoc_gia_den}</w:t></w:r><w:r><w:t> | Mục đích: {muc_dich} | Xuất cảnh: {ngay_di} | Nhập cảnh: {ngay_ve} | Kinh phí: {kinh_phi} | Số QĐ: {so_quyet_dinh}</w:t></w:r></w:p>
    <w:p><w:r><w:t>{/chuyen_di}</w:t></w:r></w:p>
    <w:p/>

    <!-- Section C -->
    <w:p><w:r><w:rPr><w:b/><w:sz w:val="24"/><w:color w:val="0369A1"/></w:rPr><w:t>III. DANH SÁCH THÂN NHÂN LIÊN QUAN ({so_luong_than_nhan} người)</w:t></w:r></w:p>
    <w:p><w:r><w:t>{#than_nhan}</w:t></w:r></w:p>
    <w:p><w:r><w:t>- Thân nhân {stt}: </w:t></w:r><w:r><w:rPr><w:b/></w:rPr><w:t>{ho_ten_tn}</w:t></w:r><w:r><w:t> | Quan hệ: {quan_he} | Năm sinh: {nam_sinh} | Quốc gia cư trú: {quoc_gia} | Nghề nghiệp: {nghe_nghiep}</w:t></w:r></w:p>
    <w:p><w:r><w:t>{/than_nhan}</w:t></w:r></w:p>
    <w:p/>

    <!-- Footer -->
    <w:p>
      <w:pPr><w:jc w:val="right"/></w:pPr>
      <w:r><w:rPr><w:i/></w:rPr><w:t>Hồ Chí Minh, ngày {ngay} tháng {thang} năm {nam}</w:t></w:r>
    </w:p>
  </w:body>
</w:document>`;

  zip.file('[Content_Types].xml', contentTypesXml);
  zip.file('_rels/.rels', rootRelsXml);
  zip.file('word/document.xml', documentXml);

  const blob = await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });

  return blob;
}
