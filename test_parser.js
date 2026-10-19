import XLSX from 'xlsx';

const wb = XLSX.readFile('./18.8.Danh sách CBGVNV Trường THNT NH 26-27.xlsx');

function excelSerialToDate(serial) {
  if (typeof serial === 'number') {
    const utcDays = Math.floor(serial - 25569);
    const utcValue = utcDays * 86400 * 1000;
    const dateInfo = new Date(utcValue);
    const year = dateInfo.getUTCFullYear();
    const month = String(dateInfo.getUTCMonth() + 1).padStart(2, '0');
    const day = String(dateInfo.getUTCDate()).padStart(2, '0');
    return { iso: `${year}-${month}-${day}`, year, formatted: `${day}/${month}/${year}` };
  }
  if (typeof serial === 'string') {
    const s = serial.trim();
    if (s.includes('#')) return null;
    // Format DD/MM/YYYY
    const dmy = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (dmy) {
      const day = dmy[1].padStart(2, '0');
      const month = dmy[2].padStart(2, '0');
      const year = parseInt(dmy[3], 10);
      return { iso: `${year}-${month}-${day}`, year, formatted: `${day}/${month}/${year}` };
    }
    // Format YYYY-MM-DD
    const ymd = s.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
    if (ymd) {
      const year = parseInt(ymd[1], 10);
      const month = ymd[2].padStart(2, '0');
      const day = ymd[3].padStart(2, '0');
      return { iso: `${year}-${month}-${day}`, year, formatted: `${day}/${month}/${year}` };
    }
  }
  return null;
}

function cleanGender(val) {
  if (!val) return 'Chưa xác định';
  const s = String(val).replace(/[,.\s]/g, '').toLowerCase();
  if (s === 'nam') return 'Nam';
  if (s === 'nữ' || s === 'nu') return 'Nữ';
  return String(val).trim();
}

// 1. Read sheet 'Toàn trường'
const ttSheet = wb.Sheets['Toàn trường'];
const ttData = XLSX.utils.sheet_to_json(ttSheet, { header: 1 });

// 2. Read auxiliary sheets for enrichment and cross-matching
const phoneSheet = wb.Sheets['DS SỐ ĐIỆN THOẠI'];
const phoneData = XLSX.utils.sheet_to_json(phoneSheet, { header: 1 });

const bcSheet = wb.Sheets['CBGVNV biên chế '];
const bcData = XLSX.utils.sheet_to_json(bcSheet, { header: 1 });

const hdgvSheet = wb.Sheets['hợp đồng GV,NV'];
const hdgvData = XLSX.utils.sheet_to_json(hdgvSheet, { header: 1 });

const hdlcSheet = wb.Sheets['hợp đồng LCBV'];
const hdlcData = XLSX.utils.sheet_to_json(hdlcSheet, { header: 1 });

const bttSheet = wb.Sheets['DANH SÁCH BAN TRUNG TÂM'];
const bttData = XLSX.utils.sheet_to_json(bttSheet, { header: 1 });

console.log('Read all 7 sheets successfully.');
