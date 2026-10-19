import XLSX from 'xlsx';

const wb = XLSX.readFile('./18.8.Danh sách CBGVNV Trường THNT NH 26-27.xlsx');
console.log('Sheet Names:', wb.SheetNames);

for (const name of wb.SheetNames) {
  const sheet = wb.Sheets[name];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  console.log(`\n=================== SHEET: [${name}] (Rows: ${data.length}) ===================`);
  for (let i = 0; i < Math.min(10, data.length); i++) {
    console.log(`Row ${i}:`, data[i]);
  }
  // Print last 5 rows too
  if (data.length > 10) {
    console.log('--- Last 5 rows ---');
    for (let i = Math.max(10, data.length - 5); i < data.length; i++) {
      console.log(`Row ${i}:`, data[i]);
    }
  }
}
