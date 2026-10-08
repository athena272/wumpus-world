import { SCORING_RULES, WIN_GOAL } from './labels';
import styles from './GameGoal.module.css';

/** How to win and how the score works, shown before and during the game. */
export function GameGoal() {
  return (
    <div className={styles.goal}>
      <p>
        <strong className={styles.title}>Como vencer:</strong> {WIN_GOAL}
      </p>
      <p className={styles.scoring}>{SCORING_RULES}</p>
    </div>
  );
}
