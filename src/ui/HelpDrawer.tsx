import { useEffect } from 'react'
import { CATEGORY_LABELS, COMMANDS, type CommandCategory } from '../lang/commands'

interface HelpDrawerProps {
  open: boolean
  onClose: () => void
  /** Ids liberados; os demais aparecem apagados como "ainda vem por aí". */
  allowed: string[]
}

const ORDER: CommandCategory[] = ['movimento', 'acao', 'sensor', 'controle']

/**
 * Referência completa da linguagem.
 *
 * Mostra também os comandos que a fase ainda não liberou, apagados: saber que
 * existe mais adiante é motivação, desde que fique claro que não é para agora.
 */
export function HelpDrawer({ open, onClose, allowed }: HelpDrawerProps) {
  const unlocked = new Set(allowed)

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <>
      <div className="sm-drawer-backdrop" onClick={onClose} aria-hidden="true" />
      <aside className="sm-drawer" role="dialog" aria-label="Guia de comandos">
        <header className="sm-drawer__header">
          <div>
            <h2>Guia de comandos</h2>
            <p>Tudo que a Mimi entende, com exemplos.</p>
          </div>
          <button type="button" className="sm-btn sm-btn--icon" onClick={onClose}
            aria-label="Fechar guia">
            ✕
          </button>
        </header>

        <div className="sm-drawer__body">
          <section className="sm-help-note">
            <h3>Como o rio funciona</h3>
            <p>
              O rio é um <strong>plano cartesiano</strong>. A casa do canto de baixo à
              esquerda é <code>(0, 0)</code>. O primeiro número é o <strong>X</strong>, que
              cresce para a direita. O segundo é o <strong>Y</strong>, que cresce para cima.
            </p>
            <p>
              Os comandos de movimento falam em <em>quantas casas andar</em>, e não para onde
              ir: <code>swim(2, -1)</code> anda duas casas para a direita e uma para baixo.
            </p>
          </section>

          {ORDER.map((category) => (
            <section className="sm-help-group" key={category}>
              <h3>{CATEGORY_LABELS[category]}</h3>
              <ul>
                {COMMANDS.filter((command) => command.category === category).map((command) => (
                  <li
                    key={command.id}
                    className={unlocked.has(command.id) ? '' : 'is-locked'}
                  >
                    <div className="sm-help-item__head">
                      <code className="sm-help-item__signature">{command.signature}</code>
                      <span className="sm-help-item__pt">{command.labelPt}</span>
                      {!unlocked.has(command.id) && (
                        <span className="sm-help-item__soon">ainda vem por aí</span>
                      )}
                    </div>
                    <p>{command.description}</p>
                    <code className="sm-help-item__example">{command.example}</code>
                  </li>
                ))}
              </ul>
            </section>
          ))}

          <section className="sm-help-note">
            <h3>Comparações</h3>
            <p>
              Use <code>==</code> para perguntar se dois valores são iguais, e{' '}
              <code>!=</code> para perguntar se são diferentes. Um <code>=</code> sozinho
              não compara: ele <em>guarda</em> um valor numa variável.
            </p>
            <p>
              Também dá para usar <code>&lt;</code>, <code>&gt;</code>, <code>&lt;=</code> e{' '}
              <code>&gt;=</code>, e juntar duas perguntas com <code>&amp;&amp;</code> (e) ou{' '}
              <code>||</code> (ou).
            </p>
          </section>
        </div>
      </aside>
    </>
  )
}
