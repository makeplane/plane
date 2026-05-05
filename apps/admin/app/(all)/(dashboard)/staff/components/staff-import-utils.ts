// Template column order must match backend expected headers
const TEMPLATE_HEADERS = [
  "staff_id",
  "first_name",
  "last_name",
  "display_name",
  "department_code",
  "position",
  "job_grade",
  "phone",
  "date_of_joining",
];
const TEMPLATE_SAMPLE = ["EMP001", "John", "Doe", "Johnny", "DEPT01", "Engineer", "G5", "0901234567", "2025-01-15"];

export function downloadCsvTemplate(): void {
  const blob = new Blob([`${TEMPLATE_HEADERS.join(",")}\n${TEMPLATE_SAMPLE.join(",")}\n`], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "staff-import-template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export async function downloadXlsxTemplate(): Promise<void> {
  const XLSX = await import("xlsx");
  const ws = XLSX.utils.aoa_to_sheet([TEMPLATE_HEADERS, TEMPLATE_SAMPLE]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Staff");
  XLSX.writeFile(wb, "staff-import-template.xlsx");
}

/**
 * Detects file format by magic bytes (not extension).
 * Excel files (.xls, .xlsx, or any extension with Excel content) are parsed
 * client-side and converted to CSV for the existing backend endpoint.
 * Falls back to raw file for plain CSV.
 */
export async function toCSVFile(file: File): Promise<File> {
  try {
    const XLSX = await import("xlsx");
    const buffer = await file.arrayBuffer();
    const wb = XLSX.read(buffer, { type: "array" });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    if (!sheet) throw new Error("Empty workbook");
    const csv = XLSX.utils.sheet_to_csv(sheet);
    return new File([csv], "import.csv", { type: "text/csv" });
  } catch {
    // Not a valid Excel file — treat as CSV
    return file;
  }
}
