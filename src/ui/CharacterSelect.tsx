import { useStore } from '../app/store'
import type { CharacterId } from '../render/turtleSprite'
import { sfx } from '../audio/sfx'
import { SoundControls } from './SoundControls'
import { TurtlePortrait } from './TurtlePortrait'

interface CharacterOption {
  id: CharacterId
  name: string
  tagline: string
  detail: string
  accent: string
}

const OPTIONS: CharacterOption[] = [
  {
    id: 'mimi',
    name: 'Mimi',
    tagline: 'A tartaruga do laço rosa',
    detail: 'Curiosa e sorridente, nada rápido e adora colher sementes pelo caminho.',
    accent: '#ff7eb3',
  },
  {
    id: 'pipe',
    name: 'Pipe',
    tagline: 'O tartaruga dos óculos escuros',
    detail: 'Tranquilão, encara qualquer correnteza sem tirar os óculos do rosto.',
    accent: '#6fc4e8',
  },
]

/**
 * Escolha do personagem.
 *
 * A escolha é puramente estética — os dois nadam igual — e é assumidamente
 * assim: o que ela faz é dar ao jogador algo que é dele antes de a primeira
 * fase começar.
 */
export function CharacterSelect() {
  const character = useStore((state) => state.character)
  const setCharacter = useStore((state) => state.setCharacter)
  const goTo = useStore((state) => state.goTo)

  return (
    <div className="sm-select">
      <div className="sm-title__corner">
        <SoundControls />
      </div>

      <header className="sm-select__header">
        <button type="button" className="sm-btn sm-btn--ghost sm-select__back"
          onClick={() => goTo('title')}>
          ← Voltar
        </button>
        <h1>Quem vai nadar hoje?</h1>
        <p>Você pode trocar de personagem quando quiser, sem perder o progresso.</p>
      </header>

      <div className="sm-select__cards">
        {OPTIONS.map((option) => {
          const selected = character === option.id
          return (
            <button
              key={option.id}
              type="button"
              className={`sm-card ${selected ? 'is-selected' : ''}`}
              style={{ '--card-accent': option.accent } as React.CSSProperties}
              // Toca o som de confirmação em vez do clique genérico
              data-sfx="off"
              onClick={() => {
                setCharacter(option.id)
                sfx.play('select')
              }}
              aria-pressed={selected}
            >
              <div className="sm-card__glow" aria-hidden="true" />
              <TurtlePortrait character={option.id} size={190} animated={selected} />
              <h2 className="sm-card__name">{option.name}</h2>
              <p className="sm-card__tagline">{option.tagline}</p>
              <p className="sm-card__detail">{option.detail}</p>
              <span className="sm-card__badge" aria-hidden="true">
                {selected ? 'Escolhido' : 'Escolher'}
              </span>
            </button>
          )
        })}
      </div>

      <div className="sm-select__actions">
        <button
          type="button"
          className="sm-btn sm-btn--primary sm-btn--big"
          onClick={() => goTo('levelMap')}
        >
          Continuar
        </button>
      </div>
    </div>
  )
}
