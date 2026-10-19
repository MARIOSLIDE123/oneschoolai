import { db } from './server/services/db.js';

console.log('Calling resetToCleanSchoolData...');
db.resetToCleanSchoolData({ uid: 'user-principal', name: 'Nguyễn Thanh Vân', role: 'principal' });
console.log('Store initialized successfully!');
console.log('Staff count:', db.getStaff().length);
console.log('School name:', db.getSettings().schoolName);
console.log('Campuses:', db.getCampuses().map(c => c.name));
