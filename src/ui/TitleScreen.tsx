import { useStore, totalStars } from '../app/store'
import { LEVELS } from '../levels'
import { SoundControls } from './SoundControls'
import { TurtlePortrait } from './TurtlePortrait'

/**
 * Tela inicial.
 *
 * Primeira impressão do app, então ela carrega o peso estético: título
 * grande, os dois personagens boiando e as duas portas de entrada do jogo.
 */
export function TitleScreen() {
  const goTo = useStore((state) => state.goTo)
  const progress = useStore((state) => state.progress)
  const stars = totalStars(progress)
  const maxStars = LEVELS.length * 3

  return (
    <div className="sm-title">
      <div className="sm-title__water" aria-hidden="true">
        {/* Bolhas decorativas: posições fixas para não dançarem a cada render */}
        {BUBBLES.map((bubble, index) => (
          <span
            key={index}
            className="sm-title__bubble"
            style={{
              left: `${bubble.left}%`,
              width: bubble.size,
              height: bubble.size,
              animationDelay: `${bubble.delay}s`,
              animationDuration: `${bubble.duration}s`,
            }}
          />
        ))}
      </div>

      <div className="sm-title__corner">
        <SoundControls />
      </div>

      <div className="sm-title__content">
        <header className="sm-title__header">
          <p className="sm-title__eyebrow">Aprenda lógica de programação nadando</p>
          <h1 className="sm-title__logo">
            <span>Super</span>
            <span className="sm-title__logo-accent">Mimi</span>
          </h1>
          <p className="sm-title__tagline">
            Escreva comandos de verdade e leve a tartaruga pelo rio até as vitórias régias.
          </p>
        </header>

        <div className="sm-title__cast" aria-hidden="true">
          <TurtlePortrait character="mimi" size={190} />
          <TurtlePortrait character="pipe" size={190} />
        </div>

        <div className="sm-title__actions">
          <button
            type="button"
            className="sm-btn sm-btn--primary sm-btn--big"
            onClick={() => goTo('character')}
          >
            Jogar as fases
          </button>
          <button
            type="button"
            className="sm-btn sm-btn--big"
            onClick={() => {
              useStore.getState().goTo('free')
            }}
          >
            Modo livre
          </button>
        </div>

        <footer className="sm-title__footer">
          <span className="sm-title__stars">
            <span aria-hidden="true">⭐</span> {stars} de {maxStars} estrelas
          </span>
          <span className="sm-title__dot" aria-hidden="true">•</span>
          <span>{LEVELS.length} fases em 4 mundos</span>
        </footer>
      </div>
    </div>
  )
}

const BUBBLES = [
  { left: 6, size: 14, delay: 0, duration: 13 },
  { left: 18, size: 9, delay: 2.4, duration: 16 },
  { left: 29, size: 20, delay: 5.1, duration: 11 },
  { left: 41, size: 11, delay: 1.2, duration: 18 },
  { left: 54, size: 16, delay: 6.8, duration: 14 },
  { left: 67, size: 8, delay: 3.6, duration: 19 },
  { left: 78, size: 22, delay: 8.2, duration: 12 },
  { left: 88, size: 12, delay: 4.4, duration: 17 },
  { left: 95, size: 10, delay: 7.1, duration: 15 },
]
