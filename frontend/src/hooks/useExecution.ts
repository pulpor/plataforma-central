import { useEffect, useRef, useState } from "react";
import { api } from "../api/client";
import type { ExecutionDetail } from "../api/types";

const TERMINAL_STATUSES = new Set(["completed", "failed", "cancelled"]);

/** Tracks a running execution in real time via SSE, falling back to polling. */
export function useExecution(executionId: string | null) {
  const [execution, setExecution] = useState<ExecutionDetail | null>(null);
  const pollRef = useRef<number | null>(null);

  useEffect(() => {
    if (!executionId) {
      setExecution(null);
      return;
    }

    let cancelled = false;
    let source: EventSource | null = null;

    const stopPolling = () => {
      if (pollRef.current !== null) {
        window.clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };

    const startPolling = () => {
      stopPolling();
      pollRef.current = window.setInterval(async () => {
        try {
          const data = await api.getExecution(executionId);
          if (cancelled) return;
          setExecution(data);
          if (TERMINAL_STATUSES.has(data.status)) {
            stopPolling();
          }
        } catch {
          stopPolling();
        }
      }, 1500);
    };

    try {
      source = new EventSource(api.streamUrl(executionId));
      source.onmessage = (event) => {
        if (cancelled) return;
        const data = JSON.parse(event.data) as ExecutionDetail;
        setExecution(data);
        if (TERMINAL_STATUSES.has(data.status)) {
          source?.close();
        }
      };
      source.onerror = () => {
        source?.close();
        if (!cancelled) startPolling();
      };
    } catch {
      startPolling();
    }

    return () => {
      cancelled = true;
      source?.close();
      stopPolling();
    };
  }, [executionId]);

  return execution;
}
