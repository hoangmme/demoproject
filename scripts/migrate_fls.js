const API_URL = 'http://localhost:8055';
const TOKEN = 'mvp-static-token-999';

async function api(path, method = 'GET', body = null) {
    const res = await fetch(`${API_URL}${path}`, {
        method,
        headers: {
            'Authorization': `Bearer ${TOKEN}`,
            'Content-Type': 'application/json'
        },
        body: body ? JSON.stringify(body) : null
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`API Error ${res.status} on ${method} ${path}: ${text}`);
    }
    return res.json();
}

async function run() {
    try {
        console.log("Adding column_permissions to directus_roles...");
        await api('/fields/directus_roles', 'POST', {
            field: 'column_permissions',
            type: 'json',
            schema: { is_nullable: true },
            meta: {
                interface: 'input-code',
                options: { language: 'json' },
                note: 'Field-Level Security Matrix for this role'
            }
        });
        console.log("Success: column_permissions added to directus_roles!");
    } catch(e) {
        if (!e.message.includes('already exists')) {
            console.log("Error adding field to roles:", e.message);
        } else {
            console.log("Field already exists on directus_roles.");
        }
    }
    
    // We don't really need to strictly delete it from directus_users right now
    // as it won't break anything, but let's try.
    try {
        console.log("Deleting column_permissions from directus_users...");
        await api('/fields/directus_users/column_permissions', 'DELETE');
        console.log("Success: column_permissions deleted from directus_users!");
    } catch(e) {
        console.log("Could not delete from directus_users (maybe already deleted):", e.message);
    }
}

run();
