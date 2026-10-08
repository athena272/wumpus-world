import { useState, type ReactElement } from 'react';
import agentUrl from '../../assets/agent.webp';
import breezeUrl from '../../assets/breeze.webp';
import goldUrl from '../../assets/gold.webp';
import pitUrl from '../../assets/pit.webp';
import stenchUrl from '../../assets/stench.webp';
import wumpusUrl from '../../assets/wumpus.webp';
import styles from './Sprite.module.css';

export type SpriteName = 'agent' | 'wumpus' | 'pit' | 'gold' | 'stench' | 'breeze';

const SOURCES: Record<SpriteName, string> = {
  agent: agentUrl,
  wumpus: wumpusUrl,
  pit: pitUrl,
  gold: goldUrl,
  stench: stenchUrl,
  breeze: breezeUrl,
};

const FALLBACKS: Record<SpriteName, ReactElement> = {
  agent: (
    <>
      <circle cx="16" cy="9" r="5" fill="#f4c095" />
      <path d="M8 29v-9a8 8 0 0 1 16 0v9z" fill="#14b8a6" />
    </>
  ),
  wumpus: (
    <>
      <circle cx="16" cy="17" r="12" fill="#6b3f6e" />
      <circle cx="11.5" cy="14" r="2.5" fill="#fde047" />
      <circle cx="20.5" cy="14" r="2.5" fill="#fde047" />
      <path d="M10 21h12l-2 3h-8z" fill="#f8fafc" />
    </>
  ),
  pit: (
    <>
      <ellipse cx="16" cy="17" rx="13" ry="10" fill="#57534e" />
      <ellipse cx="16" cy="17" rx="9" ry="6.5" fill="#020617" />
    </>
  ),
  gold: (
    <>
      <path d="M5 25l3-8h16l3 8z" fill="#facc15" />
      <path d="M10 17l2-6h8l2 6z" fill="#eab308" />
    </>
  ),
  stench: (
    <>
      <circle cx="11" cy="20" r="6" fill="#84cc16" />
      <circle cx="19" cy="19" r="7" fill="#65a30d" />
      <path
        d="M12 10q2-3 0-6M17 11q2-3 0-6M22 10q2-3 0-6"
        stroke="#84cc16"
        strokeWidth="2"
        fill="none"
      />
    </>
  ),
  breeze: (
    <path
      d="M4 12h16a4 4 0 1 0-4-4M4 18h20a4 4 0 1 1-4 4M4 24h10"
      stroke="#38bdf8"
      strokeWidth="2.5"
      strokeLinecap="round"
      fill="none"
    />
  ),
};

interface SpriteProps {
  readonly name: SpriteName;
  readonly className?: string;
  /** Empty for decorative sprites; the surrounding element should describe the square. */
  readonly label?: string;
}

/** AI-generated image, with a simple vector drawing if the image fails to load. */
export function Sprite({ name, className, label = '' }: SpriteProps) {
  const [failed, setFailed] = useState(false);
  const classes = [styles.sprite, className].filter(Boolean).join(' ');

  if (failed) {
    return (
      <svg
        className={classes}
        viewBox="0 0 32 32"
        role={label ? 'img' : undefined}
        aria-label={label || undefined}
        aria-hidden={label ? undefined : true}
        data-sprite={name}
        data-fallback="true"
      >
        {FALLBACKS[name]}
      </svg>
    );
  }
  return (
    <img
      className={classes}
      src={SOURCES[name]}
      alt={label}
      draggable={false}
      data-sprite={name}
      onError={() => {
        setFailed(true);
      }}
    />
  );
}
