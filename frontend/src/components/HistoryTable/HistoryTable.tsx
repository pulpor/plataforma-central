import { Link } from "react-router-dom";
import type { ExecutionSummary } from "../../api/types";
import { formatDateTime, formatDuration } from "../../utils/format";
import StatusBadge from "../StatusBadge/StatusBadge";
import styles from "./HistoryTable.module.css";

interface HistoryTableProps {
  executions: ExecutionSummary[];
  systemNames: Record<string, string>;
}

export default function HistoryTable({ executions, systemNames }: HistoryTableProps) {
  return (
    <div className={styles.wrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Sistema</th>
            <th>Data</th>
            <th>Duração</th>
            <th>Resultados</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {executions.map((execution) => (
            <tr key={execution.id}>
              <td>
                <Link
                  to={`/sistemas/${execution.system_id}?execution=${execution.id}`}
                  className={styles.link}
                >
                  {systemNames[execution.system_id] ?? execution.system_id}
                </Link>
              </td>
              <td>{formatDateTime(execution.started_at)}</td>
              <td>{formatDuration(execution.duration_seconds)}</td>
              <td>{execution.result_count ?? "-"}</td>
              <td>
                <StatusBadge status={execution.status} />
              </td>
            </tr>
          ))}
          {executions.length === 0 && (
            <tr>
              <td colSpan={5} className={styles.emptyRow}>
                Nenhuma execução registrada ainda.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
