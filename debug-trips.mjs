// Debug script: test computeTripPresence on real data
// Run from project root: node src/debug-trips.mjs

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { readFileSync } from 'fs';

// Read firebase config
let firebaseConfig;
try {
  const mainContent = readFileSync('src/firebase.js', 'utf-8');
  const match = mainContent.match(/const firebaseConfig\s*=\s*(\{[\s\S]*?\})/);
  if (match) firebaseConfig = eval('(' + match[1] + ')');
} catch(e) { console.error('Could not read firebase config:', e.message); process.exit(1); }

console.log('Project:', firebaseConfig?.projectId);
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const parseDateValue = (val) => {
  if (val === undefined || val === null || val === '') return null;
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
  if (typeof val === 'number' || (!isNaN(val) && Number(val) > 1000 && !String(val).includes('/') && !String(val).includes('-'))) {
    const num = Number(val);
    if (num > 10000 && num < 100000) return new Date(Math.round((num - 25569) * 86400 * 1000));
  }
  const str = String(val).trim();
  if (!str || str === '-') return null;
  if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(str)) {
    const p = str.split(/[\/\-]/);
    return new Date(parseInt(p[2]), parseInt(p[1]) - 1, parseInt(p[0]));
  }
  if (/^\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}$/.test(str)) {
    const p = str.split(/[\/\-]/);
    return new Date(parseInt(p[0]), parseInt(p[1]) - 1, parseInt(p[2]));
  }
  try { const d = new Date(str); return isNaN(d.getTime()) ? null : d; } catch(e) { return null; }
};

const computeTripPresence = (t) => {
  if (!t) return { status: 'domestic', isAbroad: false, isOverdue: false };
  const today = new Date(); today.setHours(0,0,0,0);
  const depRaw = t.departureDate || t.approvedDepartureDate || t.custom_data?.departureDate;
  const arrRaw = t.arrivalDate || t.custom_data?.arrivalDate;
  const appArrRaw = t.approvedExtensionDate || t.approvedArrivalDate || t.custom_data?.approvedArrivalDate;
  const depDate = parseDateValue(depRaw);
  const arrDate = parseDateValue(arrRaw);
  const appArrDate = parseDateValue(appArrRaw);
  if (!depDate && !arrDate) return { status: 'domestic', isAbroad: false, isOverdue: false };
  if (depDate) { const dn = new Date(depDate); dn.setHours(0,0,0,0); if (today < dn) return { status: 'upcoming', isAbroad: false, isOverdue: false }; }
  if (arrDate) { const an = new Date(arrDate); an.setHours(23,59,59,999); if (today > an) { let iso=false,od=0; if(appArrDate){const aan=new Date(appArrDate);aan.setHours(23,59,59,999);if(an>aan){iso=true;}} return { status: iso?'overdue':'completed', isAbroad: false, isOverdue: iso }; } }
  let iso=false; if(appArrDate){const aan=new Date(appArrDate);aan.setHours(23,59,59,999);if(today>aan){iso=true;}}
  return { status: iso?'overdue':'abroad', isAbroad: true, isOverdue: iso };
};

async function main() {
  const snap = await getDocs(collection(db, 'personnel'));
  let allTrips = [];
  
  snap.forEach(doc => {
    const p = doc.data();
    (p.trips || []).forEach(t => {
      let custom = {};
      try { custom = typeof t.custom_data === 'string' ? JSON.parse(t.custom_data) : (t.custom_data || {}); } catch(e){}
      
      const depDate = t.departureDate || custom.departureDate || t.approvedDepartureDate || '';
      const arrDate = t.arrivalDate || custom.arrivalDate || '';
      const appArrDate = t.approvedArrivalDate || custom.approvedArrivalDate || '';
      const extDate = t.approvedExtensionDate || custom.approvedExtensionDate || '';
      const cName = t.countryName || custom.countryName || t.country || '';
      const dNum = t.decisionNumber || custom.decisionNumber || '';
      const purpose = t.purpose || custom.purpose || '';
      
      if (!cName && !depDate && !arrDate && !dNum && !purpose) return;
      
      const item = { departureDate: depDate, arrivalDate: arrDate, approvedArrivalDate: appArrDate, approvedExtensionDate: extDate, custom_data: custom };
      const presence = computeTripPresence(item);
      allTrips.push({ name: p.name, depDate, arrDate, appArrDate, ...presence, rawKeys: Object.keys(t).join(','), customKeys: Object.keys(custom).join(',') });
    });
    
    (p.relatives || []).forEach(r => {
      (r.trips || []).forEach(rt => {
        let custom = {};
        try { custom = typeof rt.custom_data === 'string' ? JSON.parse(rt.custom_data) : (rt.custom_data || {}); } catch(e){}
        const depDate = rt.departureDate || custom.departureDate || '';
        const arrDate = rt.arrivalDate || custom.arrivalDate || '';
        const appArrDate = rt.approvedArrivalDate || custom.approvedArrivalDate || '';
        const extDate = rt.approvedExtensionDate || custom.approvedExtensionDate || '';
        const cName = rt.countryName || custom.countryName || '';
        const dNum = rt.decisionNumber || custom.decisionNumber || '';
        if (!cName && !depDate && !arrDate && !dNum) return;
        const item = { departureDate: depDate, arrivalDate: arrDate, approvedArrivalDate: appArrDate, approvedExtensionDate: extDate, custom_data: custom };
        const presence = computeTripPresence(item);
        allTrips.push({ name: `TN:${r.name} of ${p.name}`, depDate, arrDate, appArrDate, ...presence, rawKeys: Object.keys(rt).join(','), customKeys: Object.keys(custom).join(',') });
      });
    });
  });
  
  console.log(`\nTotal trips: ${allTrips.length}`);
  const counts = {};
  allTrips.forEach(t => { counts[t.status] = (counts[t.status] || 0) + 1; });
  console.log('By status:', JSON.stringify(counts));
  console.log(`Đã về nước (!isOverdue && !isAbroad): ${allTrips.filter(t => !t.isOverdue && !t.isAbroad).length}`);
  console.log(`Đang ở nước ngoài (isAbroad && !isOverdue): ${allTrips.filter(t => t.isAbroad && !t.isOverdue).length}`);
  console.log(`Quá hạn (isOverdue): ${allTrips.filter(t => t.isOverdue).length}`);
  
  console.log('\n--- ALL TRIPS ---');
  allTrips.forEach((t, i) => {
    console.log(`${i+1}. ${t.name} | dep=${t.depDate||'EMPTY'} | arr=${t.arrDate||'EMPTY'} | appArr=${t.appArrDate||'EMPTY'} | → ${t.status} | rawKeys: ${t.rawKeys}`);
  });
  
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
