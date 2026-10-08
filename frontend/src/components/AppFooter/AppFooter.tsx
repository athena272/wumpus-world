import type { ComponentType } from 'react';
import {
  GitHubIcon,
  GlobeIcon,
  LinkedInIcon,
  WhatsAppIcon,
  type BrandIconProps,
} from './BrandIcons';
import {
  DEVELOPER_CONTACTS,
  DEVELOPER_PROFILE,
  formatRightsNotice,
  type DeveloperContactId,
} from './developerProfile';
import styles from './AppFooter.module.css';

const CONTACT_ICON_SIZE_PX = 32;

const CONTACT_ICONS: Record<DeveloperContactId, ComponentType<BrandIconProps>> = {
  whatsapp: WhatsAppIcon,
  linkedin: LinkedInIcon,
  github: GitHubIcon,
  portfolio: GlobeIcon,
};

interface AppFooterProps {
  readonly className?: string;
}

/** Developer credit, contact links and the rights notice, pinned to the bottom of the screen. */
export function AppFooter({ className }: AppFooterProps) {
  return (
    <footer className={[styles.footer, className].filter(Boolean).join(' ')}>
      <nav aria-label="Contato do desenvolvedor">
        <ul className={styles.links}>
          {DEVELOPER_CONTACTS.map(({ id, label, href, color }) => {
            const Icon = CONTACT_ICONS[id];
            return (
              <li key={id}>
                <a
                  className={styles.link}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={label}
                  style={{ color }}
                >
                  <Icon size={CONTACT_ICON_SIZE_PX} />
                  <span className="visually-hidden">{label} (abre em nova aba)</span>
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className={styles.text}>
        <p className={styles.credit}>
          Desenvolvido por <strong className={styles.name}>{DEVELOPER_PROFILE.name}</strong>
          <span aria-hidden="true"> · </span>
          <span className="visually-hidden">, </span>
          <span className={styles.role}>{DEVELOPER_PROFILE.role}</span>
        </p>
        <p className={styles.rights}>{formatRightsNotice()}</p>
      </div>
    </footer>
  );
}
