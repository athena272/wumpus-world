import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildWhatsAppUrl, DEVELOPER_CONTACTS, formatRightsNotice } from './developerProfile';

describe('buildWhatsAppUrl', () => {
  it('keeps only the digits of the masked phone and country code', () => {
    expect(buildWhatsAppUrl('(79) 99900-7075', '+55')).toBe('https://wa.me/5579999007075');
  });

  it('accepts a phone that is already unmasked', () => {
    expect(buildWhatsAppUrl('79999007075', '55')).toBe('https://wa.me/5579999007075');
  });
});

describe('formatRightsNotice', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('reserves the rights for the given year', () => {
    expect(formatRightsNotice(2026)).toBe('© 2026 Todos os direitos reservados.');
  });

  it('uses the current year by default', () => {
    vi.useFakeTimers({ now: new Date(2030, 5, 1), toFake: ['Date'] });

    expect(formatRightsNotice()).toBe('© 2030 Todos os direitos reservados.');
  });
});

describe('DEVELOPER_CONTACTS', () => {
  it('points to the developer profiles over HTTPS', () => {
    expect(DEVELOPER_CONTACTS.map(({ label, href }) => [label, href])).toEqual([
      ['WhatsApp', 'https://wa.me/5579999007075'],
      ['LinkedIn', 'https://www.linkedin.com/in/guigorosario/'],
      ['GitHub', 'https://github.com/athena272'],
      ['Portfólio', 'https://athena272portfolio.vercel.app'],
    ]);
  });
});
