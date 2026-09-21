import { NavLink } from "react-router-dom";
import type { Stats } from "../../api/types";
import styles from "./Header.module.css";

interface HeaderProps {
  search: string;
  onSearchChange: (value: string) => void;
  stats: Stats | null;
  onOpenSettings: () => void;
}

export default function Header({ search, onSearchChange, stats, onOpenSettings }: HeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <span className={styles.logo}>&gt;_</span>
          <div>
            <h1 className={styles.title}>Python Hub</h1>
            <p className={styles.subtitle}>Central de automações e sistemas pessoais</p>
          </div>
        </div>

        <nav className={styles.nav}>
          <NavLink
            to="/"
            end
            className={({ isActive }) => (isActive ? `${styles.navLink} ${styles.active}` : styles.navLink)}
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/historico"
            className={({ isActive }) => (isActive ? `${styles.navLink} ${styles.active}` : styles.navLink)}
          >
            Histórico
          </NavLink>
        </nav>

        <div className={styles.actions}>
          <div className={styles.search}>
            <span className={styles.searchIcon}>⌕</span>
            <input
              type="text"
              placeholder="Buscar sistema..."
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
            />
          </div>

          <div className={styles.indicator} title="Sistemas disponíveis">
            <span className={styles.indicatorDot} data-variant="ready" />
            {stats ? stats.ready_systems : "-"} disponíveis
          </div>

          <div className={styles.indicator} title="Sistemas em execução">
            <span className={styles.indicatorDot} data-variant="running" />
            {stats ? stats.running_executions : "-"} executando
          </div>

          <button type="button" className="btn btn-ghost" onClick={onOpenSettings} aria-label="Configurações">
            ⚙︎
          </button>
        </div>
      </div>
    </header>
  );
}
