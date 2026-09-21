import type { ColumnConfig } from "../api/types";

function escapeCsvValue(value: unknown): string {
  const text = value === null || value === undefined ? "" : String(value);
  if (/[",\n;]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function downloadCsv(
  filename: string,
  columns: ColumnConfig[],
  rows: Record<string, unknown>[]
): void {
  const header = columns.map((column) => escapeCsvValue(column.label)).join(";");
  const lines = rows.map((row) =>
    columns.map((column) => escapeCsvValue(row[column.key])).join(";")
  );
  const csvContent = [header, ...lines].join("\n");

  const blob = new Blob([`\uFEFF${csvContent}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
