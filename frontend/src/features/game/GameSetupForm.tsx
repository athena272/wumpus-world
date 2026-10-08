import { useId, useState, type FormEvent } from 'react';
import type { BreezeMode, GameConfig, Preset } from '../../api/types';
import { Button } from '../../components/Button/Button';
import {
  BREEZE_MODES,
  MAX_BOARD_SIZE,
  MAX_SEED,
  MIN_BOARD_SIZE,
  PIT_PROBABILITIES,
  PRESETS,
  randomSeed,
  SLIDES_BOARD_SIZE,
} from './constants';
import { BREEZE_MODE_LABELS, PRESET_LABELS } from './labels';
import styles from './GameSetupForm.module.css';

const PRESET_HINTS: Record<Preset, string> = {
  random: 'Uma caverna nova, do tamanho e com a dificuldade que você escolher.',
  slides: 'O mapa 4×4 usado em aula, para acompanhar o exemplo dos slides.',
};

const BREEZE_MODE_HINTS: Record<BreezeMode, string> = {
  classic: 'Brisa só diz que há pelo menos um poço vizinho, como no livro.',
  intensity: 'Brisa ×k diz que há exatamente k poços vizinhos.',
};

const SIZES = Array.from(
  { length: MAX_BOARD_SIZE - MIN_BOARD_SIZE + 1 },
  (_, index) => MIN_BOARD_SIZE + index,
);
const SEED_RANGE = `de 0 a ${MAX_SEED.toLocaleString('pt-BR')}`;
const SEED_HINT = `Número inteiro ${SEED_RANGE}. Use o mesmo código para repetir uma caverna; vazio = sorteado.`;
const SEED_OUT_OF_RANGE = `O código deve ser um número inteiro ${SEED_RANGE}.`;
const SEED_NOT_DIGITS = `${SEED_OUT_OF_RANGE} Use só algarismos, sem sinal, espaço, ponto ou vírgula.`;

type SeedResult = { readonly seed: number } | { readonly error: string };

function parseSeed(text: string): SeedResult {
  const trimmed = text.trim();
  if (trimmed === '') return { seed: randomSeed() };
  if (!/^[0-9]+$/.test(trimmed)) return { error: SEED_NOT_DIGITS };
  const seed = Number(trimmed);
  return seed <= MAX_SEED ? { seed } : { error: SEED_OUT_OF_RANGE };
}

interface ChoiceProps {
  readonly name: string;
  readonly value: string;
  readonly label: string;
  readonly hint: string;
  readonly checked: boolean;
  readonly onSelect: () => void;
}

function Choice({ name, value, label, hint, checked, onSelect }: ChoiceProps) {
  const inputId = useId();
  const hintId = useId();
  return (
    <div className={styles.choice}>
      <input
        id={inputId}
        type="radio"
        name={name}
        value={value}
        checked={checked}
        aria-describedby={hintId}
        onChange={onSelect}
      />
      <div className={styles.choiceText}>
        <label htmlFor={inputId}>{label}</label>
        <small id={hintId} className={styles.hint}>
          {hint}
        </small>
      </div>
    </div>
  );
}

interface GameSetupFormProps {
  readonly initial: GameConfig;
  readonly onSubmit: (config: GameConfig) => void;
  /** Shows a "Cancelar" button; omit it when there is no game to go back to. */
  readonly onCancel?: () => void;
}

export function GameSetupForm({ initial, onSubmit, onCancel }: GameSetupFormProps) {
  const seedHintId = useId();
  const seedErrorId = useId();
  const [preset, setPreset] = useState<Preset>(initial.preset);
  const [size, setSize] = useState(initial.size);
  const [breezeMode, setBreezeMode] = useState<BreezeMode>(initial.breezeMode);
  const [pitProbability, setPitProbability] = useState(initial.pitProbability);
  const [seedText, setSeedText] = useState('');
  const [seedError, setSeedError] = useState<string | null>(null);
  const isSlides = preset === 'slides';

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSlides) {
      onSubmit({ size: SLIDES_BOARD_SIZE, seed: 0, pitProbability, breezeMode, preset });
      return;
    }
    const result = parseSeed(seedText);
    if ('error' in result) {
      setSeedError(result.error);
      return;
    }
    onSubmit({ size, seed: result.seed, pitProbability, breezeMode, preset });
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <fieldset className={styles.fieldset}>
        <legend>Mapa</legend>
        {PRESETS.map((option) => (
          <Choice
            key={option}
            name="preset"
            value={option}
            label={PRESET_LABELS[option]}
            hint={PRESET_HINTS[option]}
            checked={preset === option}
            onSelect={() => {
              setPreset(option);
            }}
          />
        ))}
      </fieldset>

      <fieldset className={styles.fieldset}>
        <legend>Brisa</legend>
        {BREEZE_MODES.map((option) => (
          <Choice
            key={option}
            name="breezeMode"
            value={option}
            label={BREEZE_MODE_LABELS[option]}
            hint={BREEZE_MODE_HINTS[option]}
            checked={breezeMode === option}
            onSelect={() => {
              setBreezeMode(option);
            }}
          />
        ))}
      </fieldset>

      <div className={styles.row}>
        <label className={styles.field}>
          <span>Tamanho</span>
          <select
            value={isSlides ? SLIDES_BOARD_SIZE : size}
            disabled={isSlides}
            onChange={(event) => {
              setSize(Number(event.target.value));
            }}
          >
            {SIZES.map((option) => (
              <option key={option} value={option}>
                {option}×{option}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.field}>
          <span>Chance de poço</span>
          <select
            value={pitProbability}
            disabled={isSlides}
            onChange={(event) => {
              setPitProbability(Number(event.target.value));
            }}
          >
            {PIT_PROBABILITIES.map((option) => (
              <option key={option} value={option}>
                {Math.round(option * 100)}%
              </option>
            ))}
          </select>
        </label>

        <label className={styles.field}>
          <span>
            Código do mapa <span className={styles.optional}>(opcional)</span>
          </span>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="off"
            placeholder="sorteado"
            value={isSlides ? '' : seedText}
            disabled={isSlides}
            aria-invalid={seedError !== null}
            aria-describedby={seedError ? `${seedHintId} ${seedErrorId}` : seedHintId}
            onChange={(event) => {
              setSeedText(event.target.value);
              setSeedError(null);
            }}
          />
        </label>
      </div>
      <p id={seedHintId} className={styles.hint}>
        {isSlides ? 'O mapa dos slides é sempre 4×4 e fixo.' : SEED_HINT}
      </p>
      {seedError && (
        <p id={seedErrorId} className={styles.error} role="alert">
          {seedError}
        </p>
      )}

      <div className={styles.footer}>
        {onCancel && (
          <Button variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit">Começar</Button>
      </div>
    </form>
  );
}
