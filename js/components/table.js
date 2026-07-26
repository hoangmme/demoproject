// js/components/table.js
export const Table = {
    /**
     * Render a table
     * @param {Array} columns - [{ key: 'name', label: 'Họ tên', render: (val, row) => html }]
     * @param {Array} data - Array of objects
     * @returns {string} HTML string
     */
    render(columns, data) {
        if (!data || data.length === 0) {
            return `
                <div style="text-align: center; padding: 30px; color: #999;">
                    <i class="fas fa-folder-open fa-3x" style="margin-bottom: 15px;"></i>
                    <p>Không có dữ liệu</p>
                </div>
            `;
        }

        let html = '<table class="table table-bordered table-striped">';
        
        // Thead
        html += '<thead><tr>';
        columns.forEach(col => {
            html += `<th>${col.label}</th>`;
        });
        html += '</tr></thead>';

        // Tbody
        html += '<tbody>';
        data.forEach(row => {
            html += '<tr>';
            columns.forEach(col => {
                const val = row[col.key];
                const cellHtml = col.render ? col.render(val, row) : (val !== undefined ? val : '');
                html += `<td>${cellHtml}</td>`;
            });
            html += '</tr>';
        });
        html += '</tbody></table>';

        return html;
    }
};
