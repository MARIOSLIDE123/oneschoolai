import XLSX from 'xlsx';

const wb = XLSX.readFile('./18.8.Danh sách CBGVNV Trường THNT NH 26-27.xlsx');
const sheet = wb.Sheets['Toàn trường'];
const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

const depts = new Set();
const positions = new Set();
for (let r = 6; r < rows.length; r++) {
  const row = rows[r];
  if (!row || !row[1]) continue;
  const pos = row[11];
  const task = row[12];
  const concur = row[13];
  if (pos) positions.add(pos);
  if (concur) {
    if (concur.includes('Tổ')) depts.add(concur);
  }
}

console.log('Positions in Toàn trường:', Array.from(positions));
console.log('Depts/Tổ mentioned in Toàn trường:', Array.from(depts));

const bttSheet = wb.Sheets['DANH SÁCH BAN TRUNG TÂM'];
const bttRows = XLSX.utils.sheet_to_json(bttSheet, { header: 1 });
console.log('\nBan Trung Tâm rows:');
for (let r = 5; r < bttRows.length; r++) {
  const row = bttRows[r];
  if (!row || !row[1]) continue;
  console.log(`TT ${row[0]} - ${row[1]} | Chức vụ: ${row[5]} | Nhiệm vụ: ${row[6]} | Kiêm nhiệm: ${row[7]}`);
}
