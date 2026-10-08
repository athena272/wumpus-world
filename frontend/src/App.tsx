import { useCallback, useState } from 'react';
import type { Action, GameConfig, Position } from './api/types';
import { AppFooter } from './components/AppFooter/AppFooter';
import { Banner } from './components/Banner/Banner';
import { Button } from './components/Button/Button';
import { LoadingIndicator } from './components/LoadingIndicator/LoadingIndicator';
import { Sprite } from './components/Sprite/Sprite';
import { Board, BoardSkeleton } from './features/board/Board';
import { Legend } from './features/board/Legend';
import { ActionControls } from './features/controls/ActionControls';
import { AgentControls } from './features/controls/AgentControls';
import { createDefaultGameConfig } from './features/game/constants';
import { GameOverBanner } from './features/game/GameOverBanner';
import { GameSetup } from './features/game/GameSetup';
import { describeConfig, PENDING_LABELS, SLOW_REQUEST_HINT } from './features/game/labels';
import { NewGameDialog } from './features/game/NewGameDialog';
import { useAgentAutoplay } from './features/game/useAgentAutoplay';
import { useWumpusGame } from './features/game/useWumpusGame';
import { PerceptPanel } from './features/hud/PerceptPanel';
import { ScorePanel } from './features/hud/ScorePanel';
import { InferencePanel } from './features/inference/InferencePanel';
import { ModelsView } from './features/inference/ModelsView';
import { KnowledgeBasePanel } from './features/knowledge/KnowledgeBasePanel';
import styles from './App.module.css';

export function App() {
  const game = useWumpusGame();
  const { view, pending, canAct } = game;
  const autoplay = useAgentAutoplay({ canAct, step: view?.step ?? 0, agentStep: game.agentStep });
  const [selected, setSelected] = useState<Position | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { pause } = autoplay;
  const { act, newGame } = game;

  const handleAction = useCallback(
    (action: Action) => {
      pause();
      void act(action);
    },
    [act, pause],
  );

  const handleNewGame = (config: GameConfig) => {
    pause();
    setSelected(null);
    setDialogOpen(false);
    void newGame(config);
  };

  const pendingStatus = pending && (
    <LoadingIndicator
      inline={view !== null}
      label={PENDING_LABELS[pending]}
      hint={game.isSlow ? SLOW_REQUEST_HINT : null}
    />
  );

  return (
    <div className={styles.page}>
      <div className={styles.app}>
        <header className={styles.header}>
          <div className={styles.brand}>
            <span className={styles.logo}>
              <Sprite name="wumpus" />
            </span>
            <div>
              <h1 className={styles.title}>Mundo de Wumpus</h1>
              <p className={styles.tagline}>Agente lógico com a base de conhecimento à vista</p>
            </div>
          </div>
          <div className={styles.headerActions}>
            {view && pendingStatus}
            {view && (
              <>
                <span className={styles.configChip}>{describeConfig(view.config)}</span>
                <Button
                  onClick={() => {
                    setDialogOpen(true);
                  }}
                >
                  Novo jogo
                </Button>
              </>
            )}
          </div>
        </header>

        {game.notice && (
          <Banner
            tone="info"
            actions={
              <Button size="sm" variant="ghost" onClick={game.dismissNotice}>
                Fechar
              </Button>
            }
          >
            {game.notice}
          </Banner>
        )}
        {game.error && view && (
          <Banner
            tone="error"
            actions={
              <>
                <Button size="sm" onClick={game.retry}>
                  Tentar novamente
                </Button>
                <Button size="sm" variant="ghost" onClick={game.dismissError}>
                  Fechar
                </Button>
              </>
            }
          >
            {game.error}
          </Banner>
        )}

        <main className={styles.layout}>
          {game.phase === 'idle' ? (
            <GameSetup
              className={styles.setup}
              initial={createDefaultGameConfig()}
              onSubmit={handleNewGame}
            />
          ) : (
            <section className={styles.boardColumn} aria-label="Caverna">
              {view ? (
                <>
                  <GameOverBanner
                    view={view}
                    onNewGame={() => {
                      setDialogOpen(true);
                    }}
                  />
                  <Board view={view} selected={selected} onSelect={setSelected} />
                  <Legend />
                </>
              ) : (
                <div className={styles.placeholder}>
                  <BoardSkeleton />
                  <div className={styles.placeholderStatus}>
                    {game.error ? (
                      <Banner
                        tone="error"
                        actions={
                          <>
                            <Button size="sm" onClick={game.retry}>
                              Tentar novamente
                            </Button>
                            <Button size="sm" variant="ghost" onClick={game.dismissError}>
                              Mudar configurações
                            </Button>
                          </>
                        }
                      >
                        {game.error}
                      </Banner>
                    ) : (
                      pendingStatus
                    )}
                  </div>
                </div>
              )}
            </section>
          )}

          {view && (
            <aside className={styles.sideColumn} aria-label="Controles">
              <ScorePanel view={view} />
              <PerceptPanel view={view} />
              <ActionControls
                canAct={canAct}
                hasArrow={view.agent.hasArrow}
                shortcutsEnabled={!dialogOpen}
                onAction={handleAction}
              />
              <AgentControls
                canAct={canAct}
                isPlaying={autoplay.isPlaying}
                speed={autoplay.speed}
                decision={game.lastDecision}
                onStep={() => {
                  void game.agentStep();
                }}
                onPlay={autoplay.play}
                onPause={autoplay.pause}
                onSpeedChange={autoplay.setSpeed}
              />
            </aside>
          )}

          {view && (
            <div className={styles.knowledgeRow}>
              <KnowledgeBasePanel view={view} actions={game.actions} />
              <div className={styles.inferenceColumn}>
                <InferencePanel view={view} selected={selected} />
                <ModelsView pitModels={view.pitModels} selected={selected} />
              </div>
            </div>
          )}
        </main>

        <p className={styles.courseNote}>
          Fundamentos de Inteligência Artificial · baseado no capítulo 7 do AIMA (agentes lógicos)
        </p>

        {dialogOpen && (
          <NewGameDialog
            current={view?.config ?? createDefaultGameConfig()}
            onSubmit={handleNewGame}
            onCancel={() => {
              setDialogOpen(false);
            }}
          />
        )}
      </div>
      <AppFooter />
    </div>
  );
}
