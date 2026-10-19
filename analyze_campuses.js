import XLSX from 'xlsx';

const wb = XLSX.readFile('./18.8.Danh sách CBGVNV Trường THNT NH 26-27.xlsx');

for (const sname of ['hợp đồng GV,NV', 'hợp đồng LCBV', 'CBGVNV biên chế ']) {
  console.log(`\n=== CHECKING SHEET [${sname}] ===`);
  const sheet = wb.Sheets[sname];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  for (let r = 6; r < rows.length; r++) {
    const row = rows[r];
    if (!row || !row[1]) continue;
    const tt = row[0];
    const name = row[1];
    const pos = String(row[11] || '');
    const task = String(row[12] || '');
    const concur = String(row[13] || '');
    const note = String(row[14] || '');
    const text = (pos + ' | ' + task + ' | ' + concur + ' | ' + note).toLowerCase();
    if (text.includes('phân hiệu') || text.includes('trường chính') || text.includes('điểm trường')) {
      console.log(`  TT ${tt} ${name}: [${pos}] [${task}] [${concur}] [${note}]`);
    }
  }
}
