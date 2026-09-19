import type { LevelSpec } from '../levels'

interface BriefingModalProps {
  level: LevelSpec
  onStart: () => void
}

/**
 * A explicação antes da fase.
 *
 * É onde o conceito novo é ensinado — a fase em si só confirma. O texto usa
 * `**negrito**` e crases para marcar termos e código, formatados aqui mesmo
 * para não precisar de uma dependência de Markdown por três marcações.
 */
export function BriefingModal({ level, onStart }: BriefingModalProps) {
  return (
    <div className="sm-modal-backdrop" role="dialog" aria-modal="true"
      aria-label={`Fase ${level.id}: ${level.title}`}>
      <div className="sm-modal sm-briefing">
        <span className="sm-briefing__badge">{level.teaches}</span>
        <p className="sm-briefing__eyebrow">Mundo {level.world} · Fase {level.index}</p>
        <h2 className="sm-briefing__title">{level.title}</h2>

        <div className="sm-briefing__body">
          {level.briefing.map((paragraph, index) => (
            <p key={index}>{formatRichText(paragraph)}</p>
          ))}
        </div>

        <div className="sm-briefing__goal">
          <span className="sm-briefing__goal-label">Objetivo</span>
          <span>{level.goal}</span>
        </div>

        <button type="button" className="sm-btn sm-btn--primary sm-btn--big" onClick={onStart}>
          Começar
        </button>
      </div>
    </div>
  )
}

/**
 * Converte `**negrito**` e `` `código` `` em elementos.
 *
 * Mínimo proposital: qualquer coisa além disso nos textos das fases é sinal
 * de que o texto está complicado demais para quem está aprendendo.
 */
export function formatRichText(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g)

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={index}>{part.slice(1, -1)}</code>
    }
    return <span key={index}>{part}</span>
  })
}
