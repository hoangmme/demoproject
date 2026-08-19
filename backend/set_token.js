async function run() {
    const resAuth = await fetch('http://localhost:8055/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@demo.com', password: '321456' })
    });
    const auth = await resAuth.json();
    const token = auth.data.access_token;
    
    // Get current user id
    const resMe = await fetch('http://localhost:8055/users/me', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const me = await resMe.json();
    const userId = me.data.id;
    
    // Set static token
    const resPatch = await fetch(`http://localhost:8055/users/${userId}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ token: "mvp-static-token-999" })
    });
    console.log((await resPatch.json()).data.token);
}
run();
