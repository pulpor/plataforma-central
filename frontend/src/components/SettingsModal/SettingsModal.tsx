import type { SystemSummary } from "../../api/types";
import styles from "./SettingsModal.module.css";

interface SettingsModalProps {
  systems: SystemSummary[];
  onClose: () => void;
}

export default function SettingsModal({ systems, onClose }: SettingsModalProps) {
  return (
    <div className={styles.backdrop} role="dialog" aria-modal="true" onClick={onClose}>
      <div className={styles.panel} onClick={(event) => event.stopPropagation()}>
        <div className={styles.header}>
          <h2>Configurações</h2>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Fechar">
            ✕
          </button>
        </div>

        <p className={styles.hint}>
          Cada sistema é configurado por um arquivo <code>config.json</code> dentro de{" "}
          <code>systems/&lt;id&gt;/</code>. Para conectar um repositório GitHub real, defina o campo{" "}
          <code>repository</code> e ajuste <code>command</code> para apontar ao script real. Reinicie o
          backend após alterar um arquivo de configuração.
        </p>

        <ul className={styles.list}>
          {systems.map((system) => (
            <li key={system.id} className={styles.item}>
              <span className={styles.itemIcon}>{system.icon}</span>
              <div className={styles.itemBody}>
                <strong>{system.name}</strong>
                <span className={styles.itemMeta}>
                  systems/{system.id}/config.json ·{" "}
                  {system.repository ? system.repository : "repositório não configurado"}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
