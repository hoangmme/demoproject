const http = require('http');

async function run() {
    const resAuth = await fetch('http://localhost:8055/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@demo.com', password: '321456' })
    });
    const auth = await resAuth.json();
    const token = auth.data.access_token;
    
    const resCol = await fetch('http://localhost:8055/collections', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            collection: 'test_col',
            schema: {},
            fields: [
                {
                    field: 'id',
                    type: 'string',
                    schema: { is_primary_key: true, length: 255 }
                }
            ]
        })
    });
    console.log(await resCol.json());
}
run();
