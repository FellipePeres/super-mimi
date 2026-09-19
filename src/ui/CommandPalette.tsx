import { useState } from 'react'
import {
  CATEGORY_LABELS, commandsFor, type CommandCategory, type CommandSpec,
} from '../lang/commands'

interface CommandPaletteProps {
  /** Ids liberados na fase atual. */
  allowed: string[]
  onInsert: (insert: string) => void
}

const CATEGORY_ORDER: CommandCategory[] = ['movimento', 'acao', 'sensor', 'controle']

/**
 * A barra de moldes do topo.
 *
 * É o apoio permanente pedido no desenho do app: o aluno não precisa decorar
 * a sintaxe, clica no molde e ele entra no editor com o cursor já no lugar
 * que ele precisa preencher.
 *
 * Mostra só o que a fase liberou — a progressão do currículo também é a
 * progressão desta barra.
 */
export function CommandPalette({ allowed, onInsert }: CommandPaletteProps) {
  const [hovered, setHovered] = useState<CommandSpec | null>(null)
  const commands = commandsFor(allowed)

  const groups = CATEGORY_ORDER.map((category) => ({
    category,
    items: commands.filter((command) => command.category === category),
  })).filter((group) => group.items.length > 0)

  return (
    <div className="sm-palette">
      <div className="sm-palette__groups">
        {groups.map((group) => (
          <div className="sm-palette__group" key={group.category}>
            <span className="sm-palette__group-label">{CATEGORY_LABELS[group.category]}</span>
            <div className="sm-palette__chips">
              {group.items.map((command) => (
                <button
                  key={command.id}
                  type="button"
                  className={`sm-chip sm-chip--${command.category}`}
                  onClick={() => onInsert(command.insert)}
                  onMouseEnter={() => setHovered(command)}
                  onMouseLeave={() => setHovered((c) => (c === command ? null : c))}
                  onFocus={() => setHovered(command)}
                  onBlur={() => setHovered((c) => (c === command ? null : c))}
                  title={`${command.labelPt} — ${command.description}`}
                >
                  <code>{command.signature}</code>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Área fixa: sem ela a barra saltaria de altura a cada hover */}
      <div className="sm-palette__hint" role="status">
        {hovered ? (
          <>
            <strong>{hovered.labelPt}</strong>
            <span>{hovered.description}</span>
            <code>{hovered.example}</code>
          </>
        ) : (
          <span className="sm-palette__hint-idle">
            Passe o mouse num comando para ver o que ele faz, ou clique para inserir no código.
          </span>
        )}
      </div>
    </div>
  )
}
