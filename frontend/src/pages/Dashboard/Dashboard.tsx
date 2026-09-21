import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/client";
import CategoryFilter from "../../components/CategoryFilter/CategoryFilter";
import EmptyState from "../../components/EmptyState/EmptyState";
import ExecutionOverlay from "../../components/ExecutionOverlay/ExecutionOverlay";
import SystemCard from "../../components/SystemCard/SystemCard";
import { useExecution } from "../../hooks/useExecution";
import { useSystems } from "../../hooks/useSystems";
import styles from "./Dashboard.module.css";

const TERMINAL_STATUSES = new Set(["completed", "failed", "cancelled"]);

interface DashboardProps {
  search: string;
}

export default function Dashboard({ search }: DashboardProps) {
  const { systems, loading, error, refresh } = useSystems();
  const [category, setCategory] = useState("Todos");
  const [activeExecutionId, setActiveExecutionId] = useState<string | null>(null);
  const [activeSystemId, setActiveSystemId] = useState<string | null>(null);
  const [runningIds, setRunningIds] = useState<Set<string>>(new Set());
  const navigate = useNavigate();

  const execution = useExecution(activeExecutionId);

  const categories = useMemo(
    () => Array.from(new Set(systems.map((system) => system.category))).sort(),
    [systems]
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return systems
      .filter((system) => category === "Todos" || system.category === category)
      .filter(
        (system) =>
          !term ||
          system.name.toLowerCase().includes(term) ||
          system.description.toLowerCase().includes(term)
      )
      .sort((a, b) => Number(b.favorite) - Number(a.favorite));
  }, [systems, category, search]);

  useEffect(() => {
    if (!execution || !activeSystemId) return;
    if (TERMINAL_STATUSES.has(execution.status)) {
      setRunningIds((prev) => {
        if (!prev.has(activeSystemId)) return prev;
        const next = new Set(prev);
        next.delete(activeSystemId);
        return next;
      });
      refresh();
    }
  }, [execution?.status, activeSystemId, refresh]);

  async function handleRun(systemId: string) {
    setRunningIds((prev) => new Set(prev).add(systemId));
    try {
      const { execution_id } = await api.runSystem(systemId);
      setActiveSystemId(systemId);
      setActiveExecutionId(execution_id);
    } catch (err) {
      setRunningIds((prev) => {
        const next = new Set(prev);
        next.delete(systemId);
        return next;
      });
      window.alert(err instanceof Error ? err.message : "Erro ao iniciar execução.");
    }
  }

  async function handleToggleFavorite(systemId: string) {
    await api.toggleFavorite(systemId);
    refresh();
  }

  function handleCloseOverlay() {
    setActiveExecutionId(null);
    setActiveSystemId(null);
  }

  function handleViewResults() {
    if (activeSystemId && activeExecutionId) {
      const systemId = activeSystemId;
      const executionId = activeExecutionId;
      handleCloseOverlay();
      navigate(`/sistemas/${systemId}?execution=${executionId}`);
    }
  }

  const activeSystem = systems.find((system) => system.id === activeSystemId);

  return (
    <div className="page">
      <div className={styles.sectionHeader}>
        <h2>Sistemas</h2>
        <span className={styles.total}>{filtered.length} de {systems.length}</span>
      </div>

      <CategoryFilter categories={categories} active={category} onChange={setCategory} />

      {loading && <p className={styles.status}>Carregando sistemas...</p>}
      {error && <p className={styles.errorStatus}>{error}</p>}

      {!loading && !error && filtered.length === 0 && (
        <EmptyState
          icon="🔍"
          title="Nenhum sistema encontrado"
          description="Ajuste a busca ou o filtro de categoria."
        />
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className={styles.grid}>
          {filtered.map((system) => (
            <SystemCard
              key={system.id}
              system={system}
              onRun={handleRun}
              onToggleFavorite={handleToggleFavorite}
              isRunning={runningIds.has(system.id)}
            />
          ))}
        </div>
      )}

      {activeExecutionId && (
        <ExecutionOverlay
          systemName={activeSystem?.name ?? "Sistema"}
          execution={execution}
          onClose={handleCloseOverlay}
          onViewResults={handleViewResults}
        />
      )}
    </div>
  );
}
