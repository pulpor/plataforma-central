import type {
  ExecutionDetail,
  ExecutionSummary,
  Stats,
  SystemDetail,
  SystemSummary,
} from "./types";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.detail || `Erro ${response.status} ao chamar a API.`);
  }

  return response.json() as Promise<T>;
}

export const api = {
  listSystems: () => request<SystemSummary[]>("/api/systems"),
  getSystem: (id: string) => request<SystemDetail>(`/api/systems/${id}`),
  runSystem: (id: string) =>
    request<{ execution_id: string; status: string }>(`/api/systems/${id}/run`, {
      method: "POST",
    }),
  toggleFavorite: (id: string) =>
    request<{ favorite: boolean }>(`/api/systems/${id}/favorite`, { method: "POST" }),
  getExecution: (id: string) => request<ExecutionDetail>(`/api/executions/${id}`),
  listExecutions: (systemId?: string) =>
    request<ExecutionSummary[]>(
      `/api/executions${systemId ? `?system_id=${encodeURIComponent(systemId)}` : ""}`
    ),
  getStats: () => request<Stats>("/api/stats"),
  exportUrl: (systemId: string, executionId?: string) =>
    `${API_BASE}/api/systems/${systemId}/export${
      executionId ? `?execution_id=${encodeURIComponent(executionId)}` : ""
    }`,
  streamUrl: (executionId: string) => `${API_BASE}/api/executions/${executionId}/stream`,
};
