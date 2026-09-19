import { useEffect, useState } from 'react'
import { useStore } from '../app/store'
import type { LevelSpec } from '../levels'
import { CodeBlock } from './CodeBlock'
import { formatRichText } from './BriefingModal'

interface HintModalProps {
  level: LevelSpec
  onClose: () => void
}

/**
 * As dicas da fase, em dois degraus.
 *
 * A primeira mostra a **forma** da solução com lacunas marcadas por `?`; a
 * segunda entrega o código que resolve. O segundo degrau fica atrás de um
 * clique com aviso, porque ver a resposta é uma escolha do aluno, não algo
 * que acontece com ele por descuido.
 *
 * Uma vez revelada, a dica continua visível até o fim da fase — esconder de
 * novo só faria o aluno reabrir o modal.
 */
export function HintModal({ level, onClose }: HintModalProps) {
  const hintLevel = useStore((state) => state.hintLevel)
  const revealNextHint = useStore((state) => state.revealNextHint)
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const [structure, solution] = level.hints

  return (
    <div
      className="sm-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={`Dicas da fase ${level.title}`}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="sm-modal sm-hint">
        <header className="sm-hint__head">
          <span className="sm-hint__lamp" aria-hidden="true">
            <IconLamp />
          </span>
          <div>
            <h2>Dicas</h2>
            <p>{level.title}</p>
          </div>
          <button
            type="button"
            className="sm-btn sm-btn--icon sm-hint__close"
            onClick={onClose}
            aria-label="Fechar dicas"
          >
            ✕
          </button>
        </header>

        <div className="sm-hint__body">
          {/* ---- degrau 1: a forma da solução ---- */}
          {hintLevel === 0 ? (
            <div className="sm-hint__locked">
              <p>
                Travou? A primeira dica mostra o <strong>formato</strong> do código, com
                lacunas para você preencher.
              </p>
              <button
                type="button"
                className="sm-btn sm-btn--primary"
                onClick={() => revealNextHint()}
              >
                Ver a primeira dica
              </button>
            </div>
          ) : (
            <section className="sm-hint__step">
              <div className="sm-hint__step-head">
                <span className="sm-hint__badge">Dica 1</span>
                <span className="sm-hint__label">O formato do código</span>
              </div>
              <p>{formatRichText(structure.text)}</p>
              <CodeBlock code={structure.code} />
              <p className="sm-hint__note">
                Os <code>?</code> são os números que você precisa descobrir.
              </p>
            </section>
          )}

          {/* ---- degrau 2: a resposta ---- */}
          {hintLevel === 1 && (
            <div className="sm-hint__locked sm-hint__locked--second">
              {confirming ? (
                <>
                  <p>
                    A próxima dica mostra o <strong>código pronto</strong> que resolve a fase.
                    Tem certeza?
                  </p>
                  <div className="sm-hint__confirm">
                    <button
                      type="button"
                      className="sm-btn sm-btn--primary"
                      onClick={() => revealNextHint()}
                    >
                      Sim, mostrar a resposta
                    </button>
                    <button
                      type="button"
                      className="sm-btn sm-btn--ghost"
                      onClick={() => setConfirming(false)}
                    >
                      Deixa, vou tentar
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p>Ainda travado depois de tentar preencher as lacunas?</p>
                  <button
                    type="button"
                    className="sm-btn"
                    onClick={() => setConfirming(true)}
                  >
                    Ver a resposta
                  </button>
                </>
              )}
            </div>
          )}

          {hintLevel >= 2 && (
            <section className="sm-hint__step sm-hint__step--solution">
              <div className="sm-hint__step-head">
                <span className="sm-hint__badge sm-hint__badge--solution">Dica 2</span>
                <span className="sm-hint__label">O código que resolve</span>
              </div>
              <p>{formatRichText(solution.text)}</p>
              <CodeBlock code={solution.code} copyable />
              <p className="sm-hint__note">
                Vale mais digitar do que copiar: escrever o código é o que fixa o formato.
              </p>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}

export function IconLamp() {
  return (
    <svg
      width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor"
      strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
    >
      <path d="M10 2a5.5 5.5 0 0 0-3.2 9.98c.45.33.7.85.7 1.4v.12h5v-.12c0-.55.25-1.07.7-1.4A5.5 5.5 0 0 0 10 2Z" />
      <path d="M7.9 16.2h4.2M8.6 18.3h2.8" />
    </svg>
  )
}
