import type { GameStatus, GameView } from '../../api/types';
import { Button } from '../../components/Button/Button';
import styles from './GameOverBanner.module.css';

const MESSAGES: Record<Exclude<GameStatus, 'playing'>, { title: string; text: string }> = {
  won: { title: 'Vitória!', text: 'Você saiu da caverna com o ouro.' },
  escaped: { title: 'Saiu com vida', text: 'Você escapou, mas deixou o ouro para trás.' },
  dead: { title: 'Fim de jogo', text: 'A caverna venceu desta vez.' },
};

interface GameOverBannerProps {
  readonly view: GameView;
  readonly onNewGame: () => void;
}

export function GameOverBanner({ view, onNewGame }: GameOverBannerProps) {
  if (view.status === 'playing') return null;
  const message = MESSAGES[view.status];
  return (
    <div className={`${styles.banner} ${styles[view.status]}`} role="status">
      <div>
        <p className={styles.title}>{message.title}</p>
        <p className={styles.text}>
          {message.text} Pontuação final: <strong>{view.score}</strong>. O mundo real foi revelado
          no tabuleiro.
        </p>
      </div>
      <Button onClick={onNewGame}>Jogar de novo</Button>
    </div>
  );
}
