const fs = require('fs');

const bangoc = fs.readFileSync('bangoc.html', 'utf8');
const index = fs.readFileSync('index.html', 'utf8');

// Extract tables from bangoc.html
const pl1Match = bangoc.match(/PHỤ LỤC SỐ 1[\s\S]*?(<table[\s\S]*?<\/table>)/);
const pl2Match = bangoc.match(/PHỤ LỤC SỐ 2[\s\S]*?(<table[\s\S]*?<\/table>)/);
const pl3Match = bangoc.match(/PHỤ LỤC SỐ 3[\s\S]*?(<table[\s\S]*?<\/table>)/);

function styleTable(tableHtml) {
    // Add Tailwind classes to table elements
    let styled = tableHtml;
    styled = styled.replace(/<table.*?>/, '<table class="w-max min-w-full border-collapse text-xs text-center border border-gray-300">');
    styled = styled.replace(/<thead>/, '<thead class="bg-gray-100 text-gray-700">');
    styled = styled.replace(/<th(.*?)>/g, '<th$1 class="border border-gray-300 px-2 py-2 align-middle font-semibold whitespace-nowrap">');
    styled = styled.replace(/<td(.*?)>/g, '<td$1 class="border border-gray-300 px-2 py-2 whitespace-nowrap">');
    // Remove the empty tbody row to let Alpine handle it, or just keep one empty row for mockup
    styled = styled.replace(/<tbody>[\s\S]*?<\/tbody>/, `<tbody>
        <tr class="hover:bg-blue-50/50">
            <td colspan="50" class="border border-gray-300 px-4 py-8 text-gray-400 italic text-sm">Chưa có dữ liệu. Dữ liệu sẽ tự động được đồng bộ từ Hồ sơ Cán bộ.</td>
        </tr>
    </tbody>`);
    return styled;
}

const table1 = styleTable(pl1Match[1]);
const table2 = styleTable(pl2Match[1]);
const table3 = styleTable(pl3Match[1]);

const newViews = `
            <!-- ================= VIEW: PHỤ LỤC 1 ================= -->
            <div x-show="currentView === 'pl1'" class="flex-1 overflow-auto p-4 sm:p-8" x-cloak>
                <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-auto max-h-full">
                    ${table1}
                </div>
            </div>

            <!-- ================= VIEW: PHỤ LỤC 2 ================= -->
            <div x-show="currentView === 'pl2'" class="flex-1 overflow-auto p-4 sm:p-8" x-cloak>
                <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-auto max-h-full">
                    ${table2}
                </div>
            </div>

            <!-- ================= VIEW: PHỤ LỤC 3 ================= -->
            <div x-show="currentView === 'pl3'" class="flex-1 overflow-auto p-4 sm:p-8" x-cloak>
                <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-auto max-h-full">
                    ${table3}
                </div>
            </div>
`;

const placeholderRegex = /<!-- ================= VIEW: PHỤ LỤC \(Placeholders\) ================= -->[\s\S]*?(?=<!-- ================= SLIDE-OVER PANEL \(HỒ SƠ CÁN BỘ\) ================= -->)/;

const newIndex = index.replace(placeholderRegex, newViews);
fs.writeFileSync('index.html', newIndex);
console.log("Injected all 3 appendix tables.");
