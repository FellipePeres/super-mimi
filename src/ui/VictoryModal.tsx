import { useEffect, useState } from 'react'
import { useStore } from '../app/store'
import { getLevel, nextLevel, type LevelStars } from '../levels'
import { sfx } from '../audio/sfx'

/**
 * Tela de vitória.
 *
 * As três estrelas entram uma de cada vez, com um respiro entre elas. O
 * escalonamento é o que transforma "você ganhou" em uma pequena celebração —
 * e dá tempo de ler por que cada estrela foi (ou não foi) conquistada.
 */
export function VictoryModal() {
  const result = useStore((state) => state.lastResult)
  const dismiss = useStore((state) => state.dismissResult)
  const openLevel = useStore((state) => state.openLevel)
  const goTo = useStore((state) => state.goTo)

  const [revealed, setRevealed] = useState(0)

  const level = result ? getLevel(result.levelId) : undefined
  const following = result ? nextLevel(result.levelId) : undefined

  useEffect(() => {
    if (!result) {
      setRevealed(0)
      return
    }

    const timers: number[] = []
    const criteria = criteriaOf(result.stars)

    criteria.forEach((earned, index) => {
      timers.push(
        window.setTimeout(() => {
          setRevealed(index + 1)
          if (earned) sfx.play('star')
        }, 380 + index * 460),
      )
    })

    return () => timers.forEach(window.clearTimeout)
  }, [result])

  if (!result || !level) return null

  const criteria = criteriaOf(result.stars)
  const earnedCount = criteria.filter(Boolean).length

  const LABELS = [
    'Chegou na vitória régia',
    `Usou no máximo ${level.parLines} ${level.parLines === 1 ? 'linha' : 'linhas'}`,
    'Coletou todas as sementes',
  ]

  return (
    <div className="sm-modal-backdrop" role="dialog" aria-modal="true" aria-label="Fase concluída">
      <div className="sm-modal sm-victory">
        <div className="sm-victory__burst" aria-hidden="true" />

        <p className="sm-victory__eyebrow">Fase {level.id} concluída</p>
        <h2 className="sm-victory__title">{level.title}</h2>

        <div className="sm-victory__stars" aria-label={`${earnedCount} de 3 estrelas`}>
          {criteria.map((earned, index) => (
            <span
              key={index}
              className={`sm-victory__star ${index < revealed ? 'is-revealed' : ''} ${
                earned ? 'is-earned' : 'is-missed'
              }`}
              aria-hidden="true"
            >
              ★
            </span>
          ))}
        </div>

        <ul className="sm-victory__criteria">
          {criteria.map((earned, index) => (
            <li
              key={index}
              className={`${earned ? 'is-earned' : ''} ${index < revealed ? 'is-shown' : ''}`}
            >
              <span aria-hidden="true">{earned ? '★' : '☆'}</span>
              {LABELS[index]}
            </li>
          ))}
        </ul>

        <div className="sm-victory__actions">
          {following ? (
            <button
              type="button"
              className="sm-btn sm-btn--primary sm-btn--big"
              onClick={() => {
                dismiss()
                openLevel(following.id)
              }}
            >
              Próxima fase →
            </button>
          ) : (
            <button
              type="button"
              className="sm-btn sm-btn--primary sm-btn--big"
              onClick={() => {
                dismiss()
                goTo('levelMap')
              }}
            >
              Você terminou o rio inteiro! 🎉
            </button>
          )}

          {earnedCount < 3 && (
            <button
              type="button"
              className="sm-btn"
              onClick={() => {
                dismiss()
                openLevel(level.id)
              }}
            >
              Tentar as 3 estrelas
            </button>
          )}

          <button
            type="button"
            className="sm-btn sm-btn--ghost"
            onClick={() => {
              dismiss()
              goTo('levelMap')
            }}
          >
            Voltar ao mapa
          </button>
        </div>
      </div>
    </div>
  )
}

function criteriaOf(stars: LevelStars): boolean[] {
  return [stars.finished, stars.concise, stars.collectedAll]
}
