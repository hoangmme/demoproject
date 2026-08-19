const fs = require('fs');
const https = require('https');
const path = require('path');

const fontsDir = path.join(__dirname, '../fonts');
if (!fs.existsSync(fontsDir)) {
    fs.mkdirSync(fontsDir);
}

const fontUrl = 'https://fonts.googleapis.com/css2?family=Barlow:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap';

https.get(fontUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (res) => {
    let css = '';
    res.on('data', d => css += d);
    res.on('end', async () => {
        const urls = [...css.matchAll(/url\((.*?)\)/g)].map(m => m[1]);
        
        for (let i = 0; i < urls.length; i++) {
            const url = urls[i];
            const ext = url.split('.').pop();
            const filename = `barlow-${i}.${ext}`;
            const filepath = path.join(fontsDir, filename);
            
            await new Promise((resolve, reject) => {
                https.get(url, (fontRes) => {
                    const file = fs.createWriteStream(filepath);
                    fontRes.pipe(file);
                    file.on('finish', () => { file.close(); resolve(); });
                }).on('error', reject);
            });
            
            css = css.replace(url, `../fonts/${filename}`);
        }
        
        fs.writeFileSync(path.join(fontsDir, 'fonts.css'), css);
        console.log('Fonts downloaded successfully.');
    });
});
