import { useEffect, useRef } from 'react'
import type { ConsoleLine } from '../app/store'

interface ConsolePanelProps {
  lines: ConsoleLine[]
  placeholder?: string
}

const ICONS: Record<ConsoleLine['kind'], string> = {
  info: '•',
  say: '💬',
  success: '✨',
  error: '⚠️',
  hint: '💡',
}

/**
 * O diário de bordo da execução.
 *
 * Mostra em português o que foi acontecendo — inclusive quando a tartaruga
 * bate em algo, que não é erro, é informação. Os erros aparecem com a dica
 * logo abaixo, porque é a dica que ensina, não a mensagem.
 */
export function ConsolePanel({ lines, placeholder }: ConsolePanelProps) {
  const scroller = useRef<HTMLDivElement>(null)

  // Segue a última linha, como um terminal
  useEffect(() => {
    const element = scroller.current
    if (element) element.scrollTop = element.scrollHeight
  }, [lines])

  return (
    <div className="sm-console" ref={scroller} role="log" aria-live="polite">
      {lines.length === 0 ? (
        <p className="sm-console__empty">
          {placeholder ?? 'Aperte Executar para a Mimi começar a nadar.'}
        </p>
      ) : (
        <ul className="sm-console__list">
          {lines.map((line) => (
            <li key={line.id} className={`sm-console__line sm-console__line--${line.kind}`}>
              <span className="sm-console__icon" aria-hidden="true">
                {ICONS[line.kind]}
              </span>
              <span className="sm-console__body">
                <span className="sm-console__text">{line.text}</span>
                {line.hint && (
                  <span className="sm-console__hint">
                    <span aria-hidden="true">💡</span> {line.hint}
                  </span>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
