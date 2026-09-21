export function formatCurrency(value: unknown): string {
  const num = Number(value);
  if (Number.isNaN(num)) return String(value ?? "");
  return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatPercent(value: unknown): string {
  const num = Number(value);
  if (Number.isNaN(num)) return String(value ?? "");
  return `${num}%`;
}

export function formatDate(value: unknown): string {
  if (!value) return "";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("pt-BR");
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDuration(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined) return "-";
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const minutes = Math.floor(seconds / 60);
  const rest = Math.round(seconds % 60);
  return `${minutes}m ${rest}s`;
}

export function statusLabel(status: string): string {
  switch (status) {
    case "queued":
      return "Na fila";
    case "running":
      return "Executando";
    case "completed":
      return "Concluído";
    case "failed":
      return "Falhou";
    case "cancelled":
      return "Cancelado";
    case "coming_soon":
      return "Em breve";
    case "ready":
      return "Pronto";
    default:
      return status;
  }
}
