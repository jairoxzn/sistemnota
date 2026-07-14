// Exportación de reportes a Excel (.xlsx) con SheetJS.
import * as XLSX from 'xlsx';

export function exportToExcel(rows, filename = 'reporte.xlsx', sheetName = 'Datos') {
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, filename);
}
