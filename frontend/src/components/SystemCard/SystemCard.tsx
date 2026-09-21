import { Link } from "react-router-dom";
import type { SystemSummary } from "../../api/types";
import { formatDateTime } from "../../utils/format";
import StatusBadge from "../StatusBadge/StatusBadge";
import styles from "./SystemCard.module.css";

interface SystemCardProps {
  system: SystemSummary;
  onRun: (systemId: string) => void;
  onToggleFavorite: (systemId: string) => void;
  isRunning: boolean;
}

export default function SystemCard({ system, onRun, onToggleFavorite, isRunning }: SystemCardProps) {
  const disabled = system.status !== "ready" || !system.is_configured;
  const effectiveStatus = isRunning ? "running" : system.status === "coming_soon" ? "coming_soon" : "ready";

  return (
    <article className={styles.card} data-disabled={disabled}>
      <button
        type="button"
        className={styles.favorite}
        data-active={system.favorite}
        onClick={() => onToggleFavorite(system.id)}
        aria-label="Marcar como favorito"
      >
        {system.favorite ? "★" : "☆"}
      </button>

      <div className={styles.iconWrap}>{system.icon}</div>

      <h3 className={styles.name}>{system.name}</h3>
      <p className={styles.description}>{system.description}</p>
      <span className={styles.category}>{system.category}</span>

      <div className={styles.meta}>
        <StatusBadge status={effectiveStatus} />
        {system.last_execution && (
          <>
            <span className={styles.metaItem}>
              Última execução: {formatDateTime(system.last_execution.started_at)}
            </span>
            <span className={styles.metaItem}>
              Resultados: {system.last_execution.result_count ?? "-"}
            </span>
          </>
        )}
        {!system.last_execution && system.status === "ready" && (
          <span className={styles.metaItem}>Ainda não executado</span>
        )}
      </div>

      <div className={styles.actions}>
        <button
          type="button"
          className="btn btn-primary"
          disabled={disabled || isRunning}
          onClick={() => onRun(system.id)}
        >
          {isRunning ? "Executando..." : "Executar"}
        </button>
        <Link
          to={`/sistemas/${system.id}`}
          className="btn"
          aria-disabled={system.status === "coming_soon"}
          onClick={(event) => {
            if (system.status === "coming_soon") event.preventDefault();
          }}
        >
          Abrir
        </Link>
      </div>
    </article>
  );
}
