import { statusLabel } from "../../utils/format";
import styles from "./StatusBadge.module.css";

interface StatusBadgeProps {
  status: string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={styles.badge} data-status={status}>
      <span className={styles.dot} />
      {statusLabel(status)}
    </span>
  );
}
