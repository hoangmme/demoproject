const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Remove `<fieldset :disabled="!hasPermission(...)">`
html = html.replace(/<fieldset :disabled="!hasPermission\('[^']+'\)" class="disabled:opacity-75 relative( group)?">/g, '<fieldset class="relative">');

// 2. Remove the `<div x-show="!hasPermission(...)">` badges
html = html.replace(/<div x-show="!hasPermission\('[^']+'\)" class="absolute top-2 right-2 bg-gray-800 text-white text-xs px-2 py-1 rounded shadow z-10 flex items-center gap-1">[\s\S]*?<\/div>/g, '');

// 3. Inject `:disabled="!canEdit('fieldId')"` into elements with x-model="formData.fieldId"
// Only do this if they don't already have a :disabled
html = html.replace(/(<(input|select|textarea)[^>]*?x-model="formData\.([a-zA-Z0-9_]+)"[^>]*?)>/g, (match, tagStart, tagName, fieldId) => {
    if (tagStart.includes(':disabled="')) {
        return match; // skip if already disabled logic exists
    }
    return tagStart + ` :disabled="!canEdit('${fieldId}')">`;
});

// Do the same for relatives x-model="relative.fieldId"
html = html.replace(/(<(input|select|textarea)[^>]*?x-model="relative\.([a-zA-Z0-9_]+)"[^>]*?)>/g, (match, tagStart, tagName, fieldId) => {
    if (tagStart.includes(':disabled="')) {
        return match;
    }
    return tagStart + ` :disabled="!canEdit('${fieldId}')">`;
});

fs.writeFileSync('index.html', html);
console.log('Fixed permissions script stage 2 done.');
