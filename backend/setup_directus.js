const fs = require('fs');

async function api(path, method = 'GET', body = null, token = null) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    
    const options = { method, headers };
    if (body) options.body = JSON.stringify(body);
    
    const res = await fetch(`http://localhost:8055${path}`, options);
    
    // Directus 204 No Content
    if (res.status === 204) return null;

    const data = await res.json();
    if (!res.ok) {
        console.error(`[ERROR] ${method} ${path}:`, data.errors[0].message);
        throw new Error(data.errors[0].message);
    }
    return data;
}

async function createCollection(name, token) {
    try {
        await api('/collections', 'POST', {
            collection: name,
            schema: {},
            fields: [
                {
                    field: 'id',
                    type: 'string',
                    schema: { is_primary_key: true, length: 255 },
                    meta: { hidden: true }
                }
            ]
        }, token);
        console.log(`Created collection: ${name}`);
    } catch (e) {
        console.log(`Collection ${name} failed:`, e.message);
    }
}

async function createField(collection, field, type, token) {
    if (field === 'id') return; // Skip primary key
    try {
        await api(`/fields/${collection}`, 'POST', {
            field: field,
            type: type,
            schema: {}
        }, token);
        console.log(`Created field: ${collection}.${field}`);
    } catch (e) {
        // Field might exist
    }
}

async function createRelation(collection, field, relatedCollection, token) {
    try {
        await api('/relations', 'POST', {
            collection: collection,
            field: field,
            related_collection: relatedCollection
        }, token);
        console.log(`Created relation: ${collection}.${field} -> ${relatedCollection}`);
    } catch (e) {
        console.log(`Relation ${collection}.${field} failed:`, e.message);
    }
}

async function run() {
    console.log('Logging in...');
    const auth = await api('/auth/login', 'POST', { email: 'admin@demo.com', password: '321456' });
    const token = auth.data.access_token;
    console.log('Token acquired.');

    const rawData = JSON.parse(fs.readFileSync('../data/db.json', 'utf8'));
    const collections = ['departments', 'personnels', 'appendix1', 'appendix2', 'appendix3'];

    // 1. Create Collections
    for (const c of collections) {
        await createCollection(c, token);
    }

    // 2. Create Fields and detect types
    for (const c of collections) {
        const rows = rawData[c];
        if (!rows || rows.length === 0) continue;
        
        const firstRow = rows[0];
        for (const [key, value] of Object.entries(firstRow)) {
            let type = 'string';
            if (typeof value === 'number') {
                type = Number.isInteger(value) ? 'integer' : 'float';
            } else if (typeof value === 'boolean') {
                type = 'boolean';
            }
            await createField(c, key, type, token);
        }
    }

    // 3. Setup Relationships (M2O)
    // Note: Creating relation requires the field to exist first, which we just did above.
    await createRelation('personnels', 'departmentId', 'departments', token);
    await createRelation('appendix1', 'personnelId', 'personnels', token);
    await createRelation('appendix2', 'personnelId', 'personnels', token);
    await createRelation('appendix3', 'personnelId', 'personnels', token);

    // 4. Seed Data
    console.log('Seeding data...');
    for (const c of collections) {
        const rows = rawData[c];
        if (!rows || rows.length === 0) continue;
        
        try {
            await api(`/items/${c}`, 'POST', rows, token);
            console.log(`Inserted ${rows.length} rows into ${c}`);
        } catch (e) {
            console.error(`Failed to seed ${c}:`, e.message);
        }
    }

    console.log('Setup Complete!');
}

run();
