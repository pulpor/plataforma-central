export type SystemStatus = "ready" | "coming_soon";
export type ExecutionStatus = "queued" | "running" | "completed" | "failed" | "cancelled";
export type ColumnType = "text" | "number" | "currency" | "percent" | "date" | "url";

export interface ColumnConfig {
  key: string;
  label: string;
  type: ColumnType;
}

export interface ExecutionSummary {
  id: string;
  system_id: string;
  status: ExecutionStatus;
  progress: number;
  message: string | null;
  started_at: string;
  completed_at: string | null;
  duration_seconds: number | null;
  result_count: number | null;
  error: string | null;
}

export interface ExecutionDetail extends ExecutionSummary {
  results: Record<string, unknown>[];
  logs: string[];
}

export interface SystemSummary {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  status: SystemStatus;
  repository: string;
  is_configured: boolean;
  favorite: boolean;
  last_execution: ExecutionSummary | null;
}

export interface SystemDetail extends SystemSummary {
  columns: ColumnConfig[];
  executions: ExecutionSummary[];
}

export interface Stats {
  total_systems: number;
  ready_systems: number;
  running_executions: number;
}
