import { useMemo, useState } from "react";
import { api } from "../../api/client";
import type { ColumnConfig } from "../../api/types";
import { downloadCsv } from "../../utils/csvExport";
import { formatCurrency, formatDate, formatPercent } from "../../utils/format";
import styles from "./ResultsTable.module.css";

interface ResultsTableProps {
  columns: ColumnConfig[];
  rows: Record<string, unknown>[];
  systemId: string;
  filenamePrefix: string;
  executionId?: string;
  onRefresh?: () => void;
}

type SortDirection = "asc" | "desc";

const PAGE_SIZES = [10, 25, 50];

export default function ResultsTable({
  columns,
  rows,
  systemId,
  filenamePrefix,
  executionId,
  onRefresh,
}: ResultsTableProps) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [pageSize, setPageSize] = useState(PAGE_SIZES[1]);
  const [page, setPage] = useState(1);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const term = search.trim().toLowerCase();
    return rows.filter((row) =>
      columns.some((column) => String(row[column.key] ?? "").toLowerCase().includes(term))
    );
  }, [rows, search, columns]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    const copy = [...filtered];
    copy.sort((a, b) => {
      const va = a[sortKey];
      const vb = b[sortKey];
      const na = Number(va);
      const nb = Number(vb);
      let comparison: number;
      if (va !== "" && vb !== "" && !Number.isNaN(na) && !Number.isNaN(nb)) {
        comparison = na - nb;
      } else {
        comparison = String(va ?? "").localeCompare(String(vb ?? ""), "pt-BR");
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });
    return copy;
  }, [filtered, sortKey, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginated = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  function toggleSort(key: string) {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  }

  function renderCell(column: ColumnConfig, row: Record<string, unknown>) {
    const value = row[column.key];
    switch (column.type) {
      case "currency":
        return formatCurrency(value);
      case "percent":
        return formatPercent(value);
      case "date":
        return formatDate(value);
      case "url":
        return value ? (
          <a href={String(value)} target="_blank" rel="noreferrer" className={styles.link}>
            Abrir ↗
          </a>
        ) : (
          "-"
        );
      default:
        return String(value ?? "-");
    }
  }

  async function copyRow(row: Record<string, unknown>, index: number) {
    const text = columns.map((column) => `${column.label}: ${row[column.key] ?? ""}`).join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      window.setTimeout(() => setCopiedIndex((current) => (current === index ? null : current)), 1500);
    } catch {
      // Clipboard API unavailable in this context - ignore silently.
    }
  }

  function exportCsv() {
    downloadCsv(`${filenamePrefix}-${new Date().toISOString().slice(0, 10)}.csv`, columns, sorted);
  }

  function exportExcel() {
    window.open(api.exportUrl(systemId, executionId), "_blank");
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.toolbar}>
        <div className={styles.search}>
          <span>⌕</span>
          <input
            type="text"
            placeholder="Pesquisar nos resultados..."
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />
        </div>

        <span className={styles.count}>
          {sorted.length} resultado{sorted.length === 1 ? "" : "s"}
        </span>

        <div className={styles.toolbarActions}>
          {onRefresh && (
            <button type="button" className="btn" onClick={onRefresh}>
              ↻ Atualizar
            </button>
          )}
          <button type="button" className="btn" onClick={exportCsv} disabled={!rows.length}>
            Exportar CSV
          </button>
          <button type="button" className="btn btn-primary" onClick={exportExcel} disabled={!rows.length}>
            📊 Exportar Excel
          </button>
        </div>
      </div>

      <div className={styles.tableScroll}>
        <table className={styles.table}>
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key} onClick={() => toggleSort(column.key)}>
                  {column.label}
                  {sortKey === column.key && (
                    <span className={styles.sortIcon}>{sortDirection === "asc" ? "▲" : "▼"}</span>
                  )}
                </th>
              ))}
              <th className={styles.actionsHeader} />
            </tr>
          </thead>
          <tbody>
            {paginated.map((row, index) => (
              <tr key={index}>
                {columns.map((column) => (
                  <td key={column.key}>{renderCell(column, row)}</td>
                ))}
                <td className={styles.rowActions}>
                  <button
                    type="button"
                    className={styles.iconButton}
                    onClick={() => copyRow(row, index)}
                    title="Copiar linha"
                  >
                    {copiedIndex === index ? "✓" : "⧉"}
                  </button>
                </td>
              </tr>
            ))}
            {paginated.length === 0 && (
              <tr>
                <td colSpan={columns.length + 1} className={styles.emptyRow}>
                  Nenhum resultado encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className={styles.pagination}>
        <select
          value={pageSize}
          onChange={(event) => {
            setPageSize(Number(event.target.value));
            setPage(1);
          }}
        >
          {PAGE_SIZES.map((size) => (
            <option key={size} value={size}>
              {size} por página
            </option>
          ))}
        </select>

        <div className={styles.pageControls}>
          <button type="button" className="btn" disabled={currentPage <= 1} onClick={() => setPage((p) => p - 1)}>
            ← Anterior
          </button>
          <span>
            Página {currentPage} de {totalPages}
          </span>
          <button
            type="button"
            className="btn"
            disabled={currentPage >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Próxima →
          </button>
        </div>
      </div>
    </div>
  );
}
