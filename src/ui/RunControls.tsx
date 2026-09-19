import type { RunnerStatus } from '../engine/runner'

interface RunControlsProps {
  status: RunnerStatus
  speed: number
  onRun: () => void
  onPause: () => void
  onStep: () => void
  onStop: () => void
  onSpeed: (speed: number) => void
}

const SPEEDS = [
  { value: 0.5, label: '0,5×', title: 'Devagar, para acompanhar cada movimento' },
  { value: 1, label: '1×', title: 'Velocidade normal' },
  { value: 2, label: '2×', title: 'Rápido' },
  { value: 4, label: '4×', title: 'Muito rápido, para conferir o resultado' },
]

/**
 * Controles de execução.
 *
 * O passo a passo tem o mesmo peso visual do Executar de propósito: é a
 * ferramenta que transforma um erro em aprendizado, porque mostra a linha
 * rodando ao lado do movimento que ela causa.
 */
export function RunControls({
  status, speed, onRun, onPause, onStep, onStop, onSpeed,
}: RunControlsProps) {
  const running = status === 'running'
  const paused = status === 'paused'
  const busy = running || paused

  return (
    <div className="sm-run">
      <div className="sm-run__main">
        {running ? (
          <button type="button" className="sm-btn sm-btn--primary" onClick={onPause}>
            <IconPause /> Pausar
          </button>
        ) : (
          <button
            type="button"
            className="sm-btn sm-btn--primary"
            onClick={paused ? onRun : onRun}
          >
            <IconPlay /> {paused ? 'Continuar' : 'Executar'}
          </button>
        )}

        <button
          type="button"
          className="sm-btn"
          onClick={onStep}
          disabled={running}
          title="Executa um movimento e pausa, destacando a linha no código"
        >
          <IconStep /> Passo a passo
        </button>

        <button
          type="button"
          className="sm-btn sm-btn--ghost"
          onClick={onStop}
          disabled={!busy && status !== 'finished' && status !== 'error'}
          title="Volta a Mimi para o começo"
        >
          <IconReset /> Recomeçar
        </button>
      </div>

      <div className="sm-run__speed" role="group" aria-label="Velocidade">
        <span className="sm-run__speed-label">Velocidade</span>
        <div className="sm-run__speed-buttons">
          {SPEEDS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`sm-speed ${speed === option.value ? 'is-active' : ''}`}
              onClick={() => onSpeed(option.value)}
              title={option.title}
              aria-pressed={speed === option.value}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// --------------------------------------------------------------------- ícones

function IconPlay() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M4.5 2.7c0-.6.7-1 1.2-.7l7 5.3c.4.3.4 1 0 1.3l-7 5.3c-.5.4-1.2 0-1.2-.6V2.7Z" />
    </svg>
  )
}

function IconPause() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <rect x="3.5" y="2.5" width="3.5" height="11" rx="1.2" />
      <rect x="9" y="2.5" width="3.5" height="11" rx="1.2" />
    </svg>
  )
}

function IconStep() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M3.5 2.7c0-.6.7-1 1.2-.7l6 4.6c.4.3.4 1 0 1.3l-6 4.6c-.5.4-1.2 0-1.2-.6V2.7Z" />
      <rect x="11.5" y="2.5" width="2.6" height="11" rx="1.1" />
    </svg>
  )
}

function IconReset() {
  return (
    <svg
      width="15" height="15" viewBox="0 0 16 16" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"
    >
      <path d="M13.5 8a5.5 5.5 0 1 1-1.9-4.2" />
      <path d="M13.8 1.8v3.4h-3.4" />
    </svg>
  )
}
