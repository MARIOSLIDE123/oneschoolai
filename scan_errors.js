import XLSX from 'xlsx';

const wb = XLSX.readFile('./18.8.Danh sách CBGVNV Trường THNT NH 26-27.xlsx', { cellFormula: true, cellNF: true, cellText: true });
for (const sheetName of wb.SheetNames) {
  const sheet = wb.Sheets[sheetName];
  for (const cellAddress in sheet) {
    if (cellAddress.startsWith('!')) continue;
    const cell = sheet[cellAddress];
    if (cell && (cell.t === 'e' || (typeof cell.w === 'string' && cell.w.includes('#')) || (typeof cell.v === 'string' && cell.v.includes('#')))) {
      console.log('Error in ' + sheetName + ' ' + cellAddress + ':', cell.v, cell.w, cell.f);
    }
  }
}
console.log('Done scanning for cell errors');
