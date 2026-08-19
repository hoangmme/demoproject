const API_URL = 'http://localhost:8055';
const ADMIN_TOKEN = 'mvp-static-token-999';

async function addCustomUserField() {
    console.log("Checking if column_permissions exists in directus_users...");
    
    try {
        const checkRes = await fetch(`${API_URL}/fields/directus_users`, {
            headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
        });
        const fields = await checkRes.json();
        const exists = fields.data.some(f => f.field === 'column_permissions');
        
        if (exists) {
            console.log("Field 'column_permissions' already exists!");
            return;
        }
        
        console.log("Adding 'column_permissions' field to directus_users...");
        const addRes = await fetch(`${API_URL}/fields/directus_users`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${ADMIN_TOKEN}` 
            },
            body: JSON.stringify({
                field: 'column_permissions',
                type: 'json',
                meta: {
                    interface: 'list',
                    special: ['cast-json'],
                    note: 'Custom Field-Level Security matrix for this user',
                    hidden: true
                }
            })
        });
        
        const data = await addRes.json();
        if (addRes.ok) {
            console.log("Field added successfully!");
        } else {
            console.error("Failed to add field:", data);
        }
    } catch(e) {
        console.error("Error:", e);
    }
}

addCustomUserField();
