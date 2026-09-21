import { useEffect, useState } from "react";
import { Route, Routes } from "react-router-dom";
import { api } from "./api/client";
import type { Stats, SystemSummary } from "./api/types";
import Header from "./components/Header/Header";
import SettingsModal from "./components/SettingsModal/SettingsModal";
import Dashboard from "./pages/Dashboard/Dashboard";
import History from "./pages/History/History";
import SystemDetail from "./pages/SystemDetail/SystemDetail";

export default function App() {
  const [search, setSearch] = useState("");
  const [stats, setStats] = useState<Stats | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [systems, setSystems] = useState<SystemSummary[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const data = await api.getStats();
        if (!cancelled) setStats(data);
      } catch {
        // Backend may be temporarily unreachable - keep last known stats.
      }
    }

    poll();
    const interval = window.setInterval(poll, 5000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  async function openSettings() {
    try {
      const data = await api.listSystems();
      setSystems(data);
    } catch {
      setSystems([]);
    }
    setSettingsOpen(true);
  }

  return (
    <>
      <Header search={search} onSearchChange={setSearch} stats={stats} onOpenSettings={openSettings} />

      <Routes>
        <Route path="/" element={<Dashboard search={search} />} />
        <Route path="/sistemas/:systemId" element={<SystemDetail />} />
        <Route path="/historico" element={<History />} />
      </Routes>

      {settingsOpen && <SettingsModal systems={systems} onClose={() => setSettingsOpen(false)} />}
    </>
  );
}
