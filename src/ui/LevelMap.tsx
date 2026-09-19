import { isLevelUnlocked, totalStars, useStore } from '../app/store'
import { LEVELS, WORLDS, countStars, levelsOfWorld, type LevelStars } from '../levels'
import { SoundControls } from './SoundControls'
import { TurtlePortrait } from './TurtlePortrait'

/**
 * Mapa de fases.
 *
 * Os mundos aparecem como trechos do rio, e cada fase é um nó. Fase trancada
 * continua visível de propósito: ver o que vem adiante é parte do convite.
 */
export function LevelMap() {
  const progress = useStore((state) => state.progress)
  const character = useStore((state) => state.character)
  const goTo = useStore((state) => state.goTo)
  const openLevel = useStore((state) => state.openLevel)

  const stars = totalStars(progress)

  return (
    <div className="sm-map">
      <header className="sm-map__header">
        <button type="button" className="sm-btn sm-btn--ghost" onClick={() => goTo('title')}>
          ← Início
        </button>

        <div className="sm-map__title">
          <h1>Mapa do rio</h1>
          <p>
            <span aria-hidden="true">⭐</span> {stars} de {LEVELS.length * 3} estrelas
          </p>
        </div>

        <div className="sm-map__actions">
          <SoundControls />
          <button
            type="button"
            className="sm-btn sm-map__character"
            onClick={() => goTo('character')}
            title="Trocar de personagem"
          >
            <TurtlePortrait character={character} size={34} animated={false} />
            Trocar
          </button>
        </div>
      </header>

      <div className="sm-map__worlds">
        {WORLDS.map((world) => {
          const levels = levelsOfWorld(world.id)
          const worldStars = levels.reduce(
            (sum, level) => sum + countStars(progress[level.id] ?? EMPTY_STARS),
            0,
          )

          return (
            <section
              className="sm-world"
              key={world.id}
              style={{ '--world-accent': world.accent } as React.CSSProperties}
            >
              <div className="sm-world__header">
                <span className="sm-world__number">Mundo {world.id}</span>
                <h2 className="sm-world__name">{world.name}</h2>
                <p className="sm-world__subtitle">{world.subtitle}</p>
                <span className="sm-world__stars">
                  <span aria-hidden="true">⭐</span> {worldStars}/{levels.length * 3}
                </span>
              </div>

              <ol className="sm-world__levels">
                {levels.map((level) => {
                  const unlocked = isLevelUnlocked(level.id, progress)
                  const earned = progress[level.id] ?? EMPTY_STARS
                  const count = countStars(earned)

                  return (
                    <li key={level.id}>
                      <button
                        type="button"
                        className={`sm-node ${unlocked ? '' : 'is-locked'} ${
                          count === 3 ? 'is-perfect' : ''
                        }`}
                        disabled={!unlocked}
                        onClick={() => openLevel(level.id)}
                        title={unlocked ? level.goal : 'Termine a fase anterior para liberar'}
                      >
                        <span className="sm-node__index">{level.index}</span>
                        <span className="sm-node__body">
                          <span className="sm-node__title">{level.title}</span>
                          <span className="sm-node__teaches">{level.teaches}</span>
                        </span>
                        <span className="sm-node__stars" aria-label={`${count} de 3 estrelas`}>
                          {[0, 1, 2].map((index) => (
                            <span
                              key={index}
                              className={`sm-star ${index < count ? 'is-on' : ''}`}
                              aria-hidden="true"
                            >
                              ★
                            </span>
                          ))}
                        </span>
                        {!unlocked && (
                          <span className="sm-node__lock" aria-hidden="true">
                            🔒
                          </span>
                        )}
                      </button>
                    </li>
                  )
                })}
              </ol>
            </section>
          )
        })}
      </div>

      <footer className="sm-map__footer">
        <button type="button" className="sm-btn" onClick={() => goTo('free')}>
          Ir para o Modo Livre
        </button>
      </footer>
    </div>
  )
}

const EMPTY_STARS: LevelStars = { finished: false, concise: false, collectedAll: false }
