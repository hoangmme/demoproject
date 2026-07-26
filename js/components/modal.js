// js/components/modal.js
export const Modal = {
    show(title, contentHtml, onSave, width = '800px') {
        const container = document.getElementById('modal-container');
        
        const overlay = document.createElement('div');
        overlay.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1040; display: flex; justify-content: center; align-items: center;';
        
        const modal = document.createElement('div');
        modal.style.cssText = `background: white; border-radius: 4px; width: ${width}; max-width: 95%; box-shadow: 0 5px 15px rgba(0,0,0,0.5); z-index: 1050;`;
        
        modal.innerHTML = `
            <div style="padding: 10px 15px; border-bottom: 1px solid #e5e5e5; display: flex; justify-content: space-between; align-items: center; background: #3c8dbc; color: white; border-radius: 4px 4px 0 0;">
                <h4 style="margin: 0; font-size: 16px;">${title}</h4>
                <button type="button" class="close-btn" style="background: transparent; border: none; font-size: 20px; cursor: pointer; color: white;">&times;</button>
            </div>
            <div style="padding: 15px; max-height: 80vh; overflow-y: auto;">
                ${contentHtml}
            </div>
            <div style="padding: 15px; border-top: 1px solid #e5e5e5; text-align: right;">
                <button type="button" class="btn btn-default cancel-btn" style="margin-right: 10px; border: 1px solid #ccc; background: white;">Hủy</button>
                ${onSave ? '<button type="button" class="btn btn-primary save-btn">Lưu</button>' : ''}
            </div>
        `;

        overlay.appendChild(modal);
        container.appendChild(overlay);

        const close = () => {
            if(overlay.parentNode) overlay.parentNode.removeChild(overlay);
        };

        modal.querySelector('.close-btn').addEventListener('click', close);
        modal.querySelector('.cancel-btn').addEventListener('click', close);
        
        if (onSave) {
            modal.querySelector('.save-btn').addEventListener('click', () => {
                onSave(close, modal);
            });
        }
    }
};
