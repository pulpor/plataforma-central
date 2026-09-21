import styles from "./CategoryFilter.module.css";

interface CategoryFilterProps {
  categories: string[];
  active: string;
  onChange: (category: string) => void;
}

export default function CategoryFilter({ categories, active, onChange }: CategoryFilterProps) {
  return (
    <div className={styles.filter}>
      {["Todos", ...categories].map((category) => (
        <button
          key={category}
          type="button"
          className={active === category ? `${styles.chip} ${styles.active}` : styles.chip}
          onClick={() => onChange(category)}
        >
          {category}
        </button>
      ))}
    </div>
  );
}
