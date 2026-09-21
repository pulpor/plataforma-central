import { useEffect, useState } from "react";
import type { ExecutionDetail } from "../../api/types";
import styles from "./ExecutionOverlay.module.css";

interface ExecutionOverlayProps {
  systemName: string;
  execution: ExecutionDetail | null;
  onClose: () => void;
  onViewResults: () => void;
}

export default function ExecutionOverlay({
  systemName,
  execution,
  onClose,
  onViewResults,
}: ExecutionOverlayProps) {
  const [timeline, setTimeline] = useState<string[]>([]);

  useEffect(() => {
    setTimeline([]);
  }, [execution?.id]);

  useEffect(() => {
    if (!execution?.message) return;
    setTimeline((prev) =>
      prev[prev.length - 1] === execution.message ? prev : [...prev, execution.message as string]
    );
  }, [execution?.message]);

  if (!execution) return null;

  const isRunning = execution.status === "queued" || execution.status === "running";
  const isFailed = execution.status === "failed";

  return (
    <div className={styles.backdrop} role="dialog" aria-modal="true">
      <div className={styles.panel}>
        <button type="button" className={styles.close} onClick={onClose} aria-label="Fechar">
          ✕
        </button>

        <h2 className={styles.title}>{systemName}</h2>
        <p className={styles.subtitle}>
          {isRunning ? "Executando sistema..." : isFailed ? "Execução falhou" : "Execução concluída"}
        </p>

        <div className={styles.progressTrack}>
          <div
            className={styles.progressFill}
            data-status={execution.status}
            style={{ width: `${execution.progress}%` }}
          />
        </div>
        <div className={styles.progressLabel}>{execution.progress}%</div>

        <ul className={styles.timeline}>
          {timeline.map((entry, index) => (
            <li key={`${index}-${entry}`}>
              <span className={styles.timelineMarker}>›</span> {entry}
            </li>
          ))}
        </ul>

        {isFailed && execution.error && <pre className={styles.error}>{execution.error}</pre>}

        <div className={styles.footer}>
          {execution.status === "completed" && (
            <>
              <p className={styles.resultSummary}>
                {execution.result_count ?? 0} resultados encontrados.
              </p>
              <button type="button" className="btn btn-primary" onClick={onViewResults}>
                Ver resultados
              </button>
            </>
          )}
          {isFailed && (
            <button type="button" className="btn" onClick={onClose}>
              Fechar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
