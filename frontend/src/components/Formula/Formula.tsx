import type { ReactNode } from 'react';
import styles from './Formula.module.css';

const TOKEN = /WumpusVivo|[PWBSG]\[\d+,\d+\]|[¬∧∨⇒⇔⊨⊭□]/g;

const SYMBOL_CLASSES: Record<string, string | undefined> = {
  P: styles.pit,
  W: styles.wumpus,
  B: styles.breeze,
  S: styles.stench,
  G: styles.glitter,
};

function tokenClass(token: string): string | undefined {
  if (token === 'WumpusVivo') return styles.wumpus;
  if (token === '⊨') return styles.entails;
  if (token === '⊭') return styles.notEntails;
  if (token.length > 1) return SYMBOL_CLASSES[token.charAt(0)];
  return styles.operator;
}

function highlight(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  let cursor = 0;
  for (const match of text.matchAll(TOKEN)) {
    const [token] = match;
    if (match.index > cursor) parts.push(text.slice(cursor, match.index));
    parts.push(
      <span key={match.index} className={`${styles.token} ${tokenClass(token) ?? ''}`}>
        {token}
      </span>,
    );
    cursor = match.index + token.length;
  }
  if (cursor < text.length) parts.push(text.slice(cursor));
  return parts;
}

interface FormulaProps {
  readonly text: string;
  /** `prose` keeps the reading font and only switches the logic tokens to monospace. */
  readonly variant?: 'formula' | 'prose';
  readonly className?: string;
}

/** Propositional sentence with symbols colored like the board (P, W, B, S, G) and highlighted operators. */
export function Formula({ text, variant = 'formula', className }: FormulaProps) {
  const classes = [variant === 'formula' ? styles.formula : styles.prose, className]
    .filter(Boolean)
    .join(' ');
  return variant === 'formula' ? (
    <code className={classes}>{highlight(text)}</code>
  ) : (
    <span className={classes}>{highlight(text)}</span>
  );
}
