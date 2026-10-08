import styles from './LoadingIndicator.module.css';

interface LoadingIndicatorProps {
  readonly label: string;
  readonly hint?: string | null;
  readonly inline?: boolean;
}

export function LoadingIndicator({ label, hint = null, inline = false }: LoadingIndicatorProps) {
  return (
    <div className={inline ? styles.inline : styles.block} role="status" aria-live="polite">
      <span className={styles.spinner} aria-hidden="true" />
      <span className={styles.text}>
        <span>{label}</span>
        {hint && <span className={styles.hint}>{hint}</span>}
      </span>
    </div>
  );
}
