const fs = require('fs');
const http = require('http');

async function api(path, method = 'GET', body = null, token = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json'
        }
    };
    if (token) options.headers['Authorization'] = `Bearer ${token}`;
    
    const res = await fetch(`http://localhost:8055${path}`, options.body = body ? JSON.stringify(body) : undefined ? { ...options, body: JSON.stringify(body) } : options);
    const data = await res.json();
    if (!res.ok) {
        console.error(`Error on ${method} ${path}:`, data);
    }
    return data;
}

async function run() {
    console.log('Logging in...');
    const auth = await api('/auth/login', 'POST', { email: 'admin@demo.com', password: 'password' });
    const token = auth.data.access_token;
    console.log('Token acquired.');
}
run();
