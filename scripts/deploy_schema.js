const fs = require('fs');

async function api(path, method = 'GET', body = null) {
    const token = 'mvp-static-token-999';
    const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
    const options = { method, headers };
    if (body) options.body = JSON.stringify(body);
    
    try {
        const res = await fetch(`http://localhost:8055${path}`, options);
        if (res.status === 204) return null;
        const data = await res.json();
        if (!res.ok) throw new Error(data.errors[0].message);
        return data;
    } catch (e) {
        throw e;
    }
}

async function createField(collection, field, type) {
    try {
        await api(`/fields/${collection}`, 'POST', {
            field: field,
            type: type,
            schema: {}
        });
        console.log(`Created field: ${collection}.${field}`);
    } catch (e) {
        if (!e.message.includes('Field already exists')) {
            console.log(`Skip ${field}: ${e.message}`);
        }
    }
}

async function setupRolesAndUsers() {
    // 1. Create Roles if not exist
    let adminRoleId, editorRoleId, viewerRoleId;
    try {
        const rolesRes = await api('/roles');
        const roles = rolesRes.data;
        
        // Find existing custom roles
        let editorRole = roles.find(r => r.name === 'Editor Khối A');
        let viewerRole = roles.find(r => r.name === 'Viewer');
        
        if (!editorRole) {
            const res = await api('/roles', 'POST', { name: 'Editor Khối A', icon: 'edit' });
            editorRoleId = res.data.id;
            console.log("Created Role: Editor Khối A");
        } else editorRoleId = editorRole.id;
        
        if (!viewerRole) {
            const res = await api('/roles', 'POST', { name: 'Viewer', icon: 'visibility' });
            viewerRoleId = res.data.id;
            console.log("Created Role: Viewer");
        } else viewerRoleId = viewerRole.id;

        // Apply Permissions for Editor (Can only edit Khối A)
        // Edit personnels: name, cccd, birthYear... but NOT trips, flags, relatives
        await api('/permissions', 'POST', {
            role: editorRoleId,
            collection: 'personnels',
            action: 'update',
            fields: ['name', 'otherName', 'birthYear', 'ethnicity', 'religion', 'hometown', 'cccd', 'hktt', 'currentAddress', 'passportPersonal', 'passportOfficial', 'position', 'tcctResult']
        }).catch(e => {}); // Ignore if exists
        
        await api('/permissions', 'POST', { role: editorRoleId, collection: 'personnels', action: 'read', fields: ['*'] }).catch(e=>{});
        await api('/permissions', 'POST', { role: viewerRoleId, collection: 'personnels', action: 'read', fields: ['*'] }).catch(e=>{});
        
    } catch(e) {
        console.log("Role Setup Error:", e.message);
    }
}

async function run() {
    console.log('Connecting to Directus to deploy schema...');

    const fields = [
        // Khối A
        { name: 'otherName', type: 'string' },
        { name: 'ethnicity', type: 'string' },
        { name: 'religion', type: 'string' },
        { name: 'hometown', type: 'string' },
        { name: 'hktt', type: 'string' },
        { name: 'currentAddress', type: 'string' },
        { name: 'passportPersonal', type: 'string' },
        { name: 'passportOfficial', type: 'string' },
        { name: 'position', type: 'string' },
        { name: 'tcctResult', type: 'string' },
        // Block Data (JSON)
        { name: 'trips', type: 'json' },
        { name: 'flags', type: 'json' },
        { name: 'relatives', type: 'json' }
    ];

    for (const f of fields) {
        await createField('personnels', f.name, f.type);
    }

    // Attempt to turn on tracking revisions for personnels
    try {
        await api(`/collections/personnels`, 'PATCH', {
            meta: { accountability: 'all' }
        });
        console.log("Enabled Audit Tracking for personnels!");
    } catch(e) {}

    await setupRolesAndUsers();

    console.log('Database Schema Deployment Complete!');
}

run();
