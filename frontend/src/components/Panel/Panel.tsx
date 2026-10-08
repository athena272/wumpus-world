import { useId, type ReactNode } from 'react';
import styles from './Panel.module.css';

export type PanelTone = 'gold' | 'breeze' | 'stench' | 'violet' | 'info' | 'safe' | 'danger';

interface PanelProps {
  readonly title: string;
  readonly subtitle?: ReactNode;
  /** A sprite or a short glyph (e.g. "KB", "⊨") shown in a tinted badge. */
  readonly icon?: ReactNode;
  readonly tone?: PanelTone;
  readonly actions?: ReactNode;
  readonly className?: string;
  readonly children: ReactNode;
}

export function Panel({
  title,
  subtitle,
  icon,
  tone = 'gold',
  actions,
  className,
  children,
}: PanelProps) {
  const headingId = useId();
  return (
    <section
      className={[styles.panel, styles[tone], className].filter(Boolean).join(' ')}
      aria-labelledby={headingId}
    >
      <header className={styles.header}>
        <div className={styles.heading}>
          {icon && (
            <span className={styles.icon} aria-hidden="true">
              {icon}
            </span>
          )}
          <div className={styles.titles}>
            <h2 id={headingId} className={styles.title}>
              {title}
            </h2>
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </div>
        </div>
        {actions && <div className={styles.actions}>{actions}</div>}
      </header>
      {children}
    </section>
  );
}
