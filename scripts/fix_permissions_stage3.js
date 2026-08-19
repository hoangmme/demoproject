const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// Fix flags: change `canEdit('politicalIssue')` to `canEdit('flags.politicalIssue')`
html = html.replace(/x-model="formData\.flags\.([a-zA-Z0-9_]+)"[^>]*?:disabled="!canEdit\('([a-zA-Z0-9_]+)'\)"/g, (match, fieldId, wrongId) => {
    return match.replace(`canEdit('${wrongId}')`, `canEdit('flags.${fieldId}')`);
});

// Fix relatives: change `canEdit('name')` to `canEdit('relatives')` for relative fields
html = html.replace(/x-model="relative\.([a-zA-Z0-9_]+)"[^>]*?:disabled="!canEdit\('([a-zA-Z0-9_]+)'\)"/g, (match, fieldId, wrongId) => {
    return match.replace(`canEdit('${wrongId}')`, `canEdit('relatives')`);
});

// Fix trips: x-model="trip.xxx" doesn't have disabled yet?
// Wait, trips are in a loop `x-for="trip in formData.trips"`
html = html.replace(/(<(input|select|textarea)[^>]*?x-model="trip\.([a-zA-Z0-9_]+)"[^>]*?)>/g, (match, tagStart, tagName, fieldId) => {
    if (tagStart.includes(':disabled="')) {
        return match;
    }
    return tagStart + ` :disabled="!canEdit('trips')">`;
});

// Remove leftover `disabled` on relatives fieldset
html = html.replace(/<fieldset :disabled="!hasPermission\('editThanNhan'\)" class="disabled:opacity-75 relative min-h-\[300px\]">/g, '<fieldset class="relative min-h-[300px]">');
html = html.replace(/<div x-show="!hasPermission\('editThanNhan'\)" class="absolute top-2 right-2 bg-gray-800 text-white text-xs px-2 py-1 rounded shadow z-10 flex items-center gap-1">[\s\S]*?<\/div>/g, '');

fs.writeFileSync('index.html', html);
console.log('Fixed permissions script stage 3 done.');
