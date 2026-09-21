import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { api } from "../../api/client";
import type { ExecutionDetail, SystemDetail as SystemDetailType } from "../../api/types";
import EmptyState from "../../components/EmptyState/EmptyState";
import ExecutionOverlay from "../../components/ExecutionOverlay/ExecutionOverlay";
import HistoryTable from "../../components/HistoryTable/HistoryTable";
import ResultsTable from "../../components/ResultsTable/ResultsTable";
import StatusBadge from "../../components/StatusBadge/StatusBadge";
import { useExecution } from "../../hooks/useExecution";
import { formatDateTime } from "../../utils/format";
import styles from "./SystemDetail.module.css";

const TERMINAL_STATUSES = new Set(["completed", "failed", "cancelled"]);

export default function SystemDetail() {
  const { systemId } = useParams<{ systemId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [system, setSystem] = useState<SystemDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [viewedExecution, setViewedExecution] = useState<ExecutionDetail | null>(null);
  const [viewLoading, setViewLoading] = useState(false);

  const [activeExecutionId, setActiveExecutionId] = useState<string | null>(null);
  const liveExecution = useExecution(activeExecutionId);

  const executionIdFromQuery = searchParams.get("execution");

  async function loadSystem() {
    if (!systemId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await api.getSystem(systemId);
      setSystem(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar sistema.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSystem();
  }, [systemId]);

  async function loadExecution(executionId: string) {
    try {
      setViewLoading(true);
      const data = await api.getExecution(executionId);
      setViewedExecution(data);
    } catch {
      setViewedExecution(null);
    } finally {
      setViewLoading(false);
    }
  }

  useEffect(() => {
    if (executionIdFromQuery) {
      loadExecution(executionIdFromQuery);
    } else if (system?.last_execution) {
      loadExecution(system.last_execution.id);
    } else {
      setViewedExecution(null);
    }
  }, [executionIdFromQuery, system?.last_execution?.id]);

  useEffect(() => {
    if (!liveExecution || !activeExecutionId) return;
    if (TERMINAL_STATUSES.has(liveExecution.status)) {
      loadSystem();
    }
  }, [liveExecution?.status]);

  async function handleRun() {
    if (!systemId) return;
    try {
      const { execution_id } = await api.runSystem(systemId);
      setActiveExecutionId(execution_id);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Erro ao iniciar execução.");
    }
  }

  function handleCloseOverlay() {
    setActiveExecutionId(null);
  }

  function handleViewResults() {
    if (activeExecutionId) {
      setSearchParams({ execution: activeExecutionId });
      setActiveExecutionId(null);
    }
  }

  if (loading) {
    return (
      <div className="page">
        <p className={styles.status}>Carregando...</p>
      </div>
    );
  }

  if (error || !system) {
    return (
      <div className="page">
        <EmptyState icon="⚠️" title="Sistema não encontrado" description={error ?? undefined} />
      </div>
    );
  }

  const isComingSoon = system.status === "coming_soon";

  return (
    <div className="page">
      <Link to="/" className={styles.back}>
        ← Voltar ao dashboard
      </Link>

      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.icon}>{system.icon}</span>
          <div>
            <h1 className={styles.title}>{system.name}</h1>
            <p className={styles.description}>{system.description}</p>
            <div className={styles.metaRow}>
              <span className={styles.category}>{system.category}</span>
              <StatusBadge status={isComingSoon ? "coming_soon" : "ready"} />
              {system.repository && (
                <a href={system.repository} target="_blank" rel="noreferrer" className={styles.repoLink}>
                  Repositório ↗
                </a>
              )}
            </div>
          </div>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={handleRun}
          disabled={isComingSoon || !system.is_configured}
        >
          Executar
        </button>
      </div>

      {isComingSoon && (
        <EmptyState
          icon="🚧"
          title="Sistema ainda não configurado"
          description="Adicione um comando de execução em systems/<id>/config.json para ativar este card."
        />
      )}

      {!isComingSoon && (
        <>
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Resultados</h2>
            {viewLoading && <p className={styles.status}>Carregando resultados...</p>}
            {!viewLoading && viewedExecution && viewedExecution.status === "completed" && (
              <>
                <p className={styles.resultMeta}>
                  Execução de {formatDateTime(viewedExecution.started_at)} ·{" "}
                  {viewedExecution.result_count ?? 0} resultados
                </p>
                <ResultsTable
                  columns={system.columns}
                  rows={viewedExecution.results}
                  systemId={system.id}
                  filenamePrefix={system.id}
                  executionId={viewedExecution.id}
                  onRefresh={loadSystem}
                />
              </>
            )}
            {!viewLoading && viewedExecution && viewedExecution.status === "failed" && (
              <EmptyState
                icon="⚠️"
                title="Última execução falhou"
                description={viewedExecution.error ?? "Verifique os logs do sistema."}
              />
            )}
            {!viewLoading && !viewedExecution && (
              <EmptyState
                icon="▶️"
                title="Nenhum resultado ainda"
                description="Execute o sistema para ver os resultados aqui."
              />
            )}
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Histórico de execuções</h2>
            <HistoryTable executions={system.executions} systemNames={{ [system.id]: system.name }} />
          </section>
        </>
      )}

      {activeExecutionId && (
        <ExecutionOverlay
          systemName={system.name}
          execution={liveExecution}
          onClose={handleCloseOverlay}
          onViewResults={handleViewResults}
        />
      )}
    </div>
  );
}
