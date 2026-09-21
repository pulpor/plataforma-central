import { useCallback, useEffect, useState } from "react";
import { api } from "../api/client";
import type { SystemSummary } from "../api/types";

export function useSystems() {
  const [systems, setSystems] = useState<SystemSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const data = await api.listSystems();
      setSystems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar sistemas.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { systems, loading, error, refresh };
}
