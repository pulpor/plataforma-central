import { useEffect, useMemo, useState } from "react";
import { api } from "../../api/client";
import type { ExecutionSummary, SystemSummary } from "../../api/types";
import EmptyState from "../../components/EmptyState/EmptyState";
import HistoryTable from "../../components/HistoryTable/HistoryTable";
import styles from "./History.module.css";

export default function History() {
  const [executions, setExecutions] = useState<ExecutionSummary[]>([]);
  const [systems, setSystems] = useState<SystemSummary[]>([]);
  const [systemFilter, setSystemFilter] = useState("Todos");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [executionsData, systemsData] = await Promise.all([
        api.listExecutions(),
        api.listSystems(),
      ]);
      setExecutions(executionsData);
      setSystems(systemsData);
      setLoading(false);
    }
    load();
  }, []);

  const systemNames = useMemo(
    () => Object.fromEntries(systems.map((system) => [system.id, system.name])),
    [systems]
  );

  const filtered = useMemo(
    () =>
      systemFilter === "Todos" ? executions : executions.filter((execution) => execution.system_id === systemFilter),
    [executions, systemFilter]
  );

  return (
    <div className="page">
      <div className={styles.sectionHeader}>
        <h2>Histórico de execuções</h2>
        <select
          className={styles.select}
          value={systemFilter}
          onChange={(event) => setSystemFilter(event.target.value)}
        >
          <option value="Todos">Todos os sistemas</option>
          {systems.map((system) => (
            <option key={system.id} value={system.id}>
              {system.name}
            </option>
          ))}
        </select>
      </div>

      {loading && <p className={styles.status}>Carregando histórico...</p>}

      {!loading && filtered.length === 0 && (
        <EmptyState
          icon="🕘"
          title="Nenhuma execução registrada"
          description="Execute um sistema no dashboard para começar a construir seu histórico."
        />
      )}

      {!loading && filtered.length > 0 && <HistoryTable executions={filtered} systemNames={systemNames} />}
    </div>
  );
}
