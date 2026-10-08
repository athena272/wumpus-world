import type { ReactNode } from 'react';
import styles from './Banner.module.css';

interface BannerProps {
  readonly tone: 'error' | 'info';
  readonly children: ReactNode;
  readonly actions?: ReactNode;
}

export function Banner({ tone, children, actions }: BannerProps) {
  return (
    <div
      className={`${styles.banner} ${styles[tone]}`}
      role={tone === 'error' ? 'alert' : 'status'}
    >
      <p className={styles.message}>{children}</p>
      {actions && <div className={styles.actions}>{actions}</div>}
    </div>
  );
}
