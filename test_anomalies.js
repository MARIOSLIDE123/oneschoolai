import XLSX from 'xlsx';

const wb = XLSX.readFile('./18.8.Danh sách CBGVNV Trường THNT NH 26-27.xlsx');

console.log('--- TOÀN TRƯỜNG ANOMALIES ---');
const sheet = wb.Sheets['Toàn trường'];
const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false });
const rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true });

for (let r = 6; r < rows.length; r++) {
  const row = rows[r];
  const rawRow = rawRows[r];
  if (!row || !row[1]) continue;
  const tt = row[0];
  const name = String(row[1]).trim();
  const dobFormatted = row[2];
  const dobRaw = rawRow[2];
  const gender = row[3];
  const type = row[4];
  const age = row[5];
  const phone = row[6];
  
  const issues = [];
  if (dobRaw === undefined || dobRaw === null || String(dobRaw).includes('#NAME') || String(dobFormatted).includes('#NAME') || String(dobRaw).trim() === '') {
    issues.push('DOB invalid/missing: ' + dobRaw);
  }
  if (!phone || String(phone).trim() === '') {
    issues.push('Phone missing');
  }
  if (!gender) {
    issues.push('Gender missing');
  }
  if (issues.length > 0) {
    console.log(`Row index ${r} (TT: ${tt}, Name: ${name}): ${issues.join(' | ')} (Raw DOB: ${dobRaw}, Formatted DOB: ${dobFormatted})`);
  }
}

console.log('\n--- CROSS-CHECK WITH OTHER SHEETS ---');
// Let's check sheet 'DS SỐ ĐIỆN THOẠI'
const phoneSheet = wb.Sheets['DS SỐ ĐIỆN THOẠI'];
const phoneRows = XLSX.utils.sheet_to_json(phoneSheet, { header: 1, raw: true });
console.log('Phone rows count:', phoneRows.length);

// Let's check sheet 'CBGVNV biên chế '
const bcSheet = wb.Sheets['CBGVNV biên chế '];
const bcRows = XLSX.utils.sheet_to_json(bcSheet, { header: 1, raw: true });
console.log('Biên chế rows count:', bcRows.length);

// Let's check sheet 'hợp đồng GV,NV'
const hdgvSheet = wb.Sheets['hợp đồng GV,NV'];
const hdgvRows = XLSX.utils.sheet_to_json(hdgvSheet, { header: 1, raw: true });
console.log('HĐ GV,NV rows count:', hdgvRows.length);

// Let's check sheet 'hợp đồng LCBV'
const hdlcSheet = wb.Sheets['hợp đồng LCBV'];
const hdlcRows = XLSX.utils.sheet_to_json(hdlcSheet, { header: 1, raw: true });
console.log('HĐ LCBV rows count:', hdlcRows.length);

// Let's check sheet 'DANH SÁCH BAN TRUNG TÂM'
const bttSheet = wb.Sheets['DANH SÁCH BAN TRUNG TÂM'];
const bttRows = XLSX.utils.sheet_to_json(bttSheet, { header: 1, raw: true });
console.log('Ban trung tâm rows count:', bttRows.length);
