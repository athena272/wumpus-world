import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AppFooter } from './AppFooter';

const EXPECTED_LINKS = [
  { name: 'WhatsApp (abre em nova aba)', href: 'https://wa.me/5579999007075' },
  { name: 'LinkedIn (abre em nova aba)', href: 'https://www.linkedin.com/in/guigorosario/' },
  { name: 'GitHub (abre em nova aba)', href: 'https://github.com/athena272' },
  { name: 'Portfólio (abre em nova aba)', href: 'https://athena272portfolio.vercel.app' },
];

describe('AppFooter', () => {
  it('groups the contact links in a labelled navigation landmark', () => {
    render(<AppFooter />);

    const nav = screen.getByRole('navigation', { name: 'Contato do desenvolvedor' });
    const links = within(nav).getAllByRole('link');

    expect(links.map((link) => link.getAttribute('href'))).toEqual(
      EXPECTED_LINKS.map(({ href }) => href),
    );
  });

  it.each(EXPECTED_LINKS)('opens $name safely in a new tab', ({ name, href }) => {
    render(<AppFooter />);

    const link = screen.getByRole('link', { name });

    expect(link).toHaveAttribute('href', href);
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(link.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('credits the developer with the separator hidden from screen readers', () => {
    render(<AppFooter />);

    const name = screen.getByText('Guilherme R. Alves');

    expect(name.tagName).toBe('STRONG');
    expect(name.closest('p')).toHaveTextContent(
      'Desenvolvido por Guilherme R. Alves · , Engenheiro de Software',
    );
    expect(screen.getByText('·')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByText(',')).toHaveClass('visually-hidden');
  });

  it('reserves the rights for the current year', () => {
    render(<AppFooter />);

    expect(
      screen.getByText(`© ${new Date().getFullYear()} Todos os direitos reservados.`),
    ).toBeInTheDocument();
  });

  it('is the page footer and keeps the class given by the layout', () => {
    render(<AppFooter className="extra" />);

    expect(screen.getByRole('contentinfo')).toHaveClass('extra');
  });
});
