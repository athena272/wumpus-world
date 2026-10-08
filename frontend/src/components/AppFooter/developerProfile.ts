export const DEVELOPER_PROFILE = {
  name: 'Guilherme R. Alves',
  role: 'Engenheiro de Software',
  phone: '(79) 99900-7075',
  phoneCountryCode: '55',
  linkedinUrl: 'https://www.linkedin.com/in/guigorosario/',
  githubUrl: 'https://github.com/athena272',
  portfolioUrl: 'https://athena272portfolio.vercel.app',
} as const;

export type DeveloperContactId = 'whatsapp' | 'linkedin' | 'github' | 'portfolio';

export interface DeveloperContact {
  readonly id: DeveloperContactId;
  readonly label: string;
  readonly href: string;
  readonly color: string;
}

function digitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}

/** `wa.me` only accepts digits: country code, area code and number. */
export function buildWhatsAppUrl(maskedPhone: string, countryCode: string): string {
  return `https://wa.me/${digitsOnly(countryCode)}${digitsOnly(maskedPhone)}`;
}

export function formatRightsNotice(year: number = new Date().getFullYear()): string {
  return `© ${year} Todos os direitos reservados.`;
}

export const DEVELOPER_CONTACTS: readonly DeveloperContact[] = [
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    href: buildWhatsAppUrl(DEVELOPER_PROFILE.phone, DEVELOPER_PROFILE.phoneCountryCode),
    color: '#25D366',
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    href: DEVELOPER_PROFILE.linkedinUrl,
    color: '#0A66C2',
  },
  {
    id: 'github',
    label: 'GitHub',
    href: DEVELOPER_PROFILE.githubUrl,
    color: 'var(--color-text)',
  },
  {
    id: 'portfolio',
    label: 'Portfólio',
    href: DEVELOPER_PROFILE.portfolioUrl,
    // The brand violet (#7C3AED) lacks contrast on the dark background.
    color: 'var(--color-violet)',
  },
];
