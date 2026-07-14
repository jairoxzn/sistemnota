// Exportación de reportes a Excel (.xlsx) con SheetJS.
// La librería xlsx se carga bajo demanda (import dinámico) para no pesar en la
// carga inicial de la app.
export async function exportToExcel(rows, filename = 'reporte.xlsx', sheetName = 'Datos') {
  const XLSX = await import('xlsx');
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, filename);
}
