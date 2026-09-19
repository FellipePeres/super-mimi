/**
 * Tweens mínimos sobre requestAnimationFrame.
 *
 * Não vale a pena uma biblioteca aqui: o jogo tem meia dúzia de animações e
 * todas precisam ser canceláveis quando o aluno aperta "parar" no meio de um
 * movimento.
 */

export type Easing = (t: number) => number

export const linear: Easing = (t) => t
export const easeOutCubic: Easing = (t) => 1 - Math.pow(1 - t, 3)
export const easeInOutCubic: Easing = (t) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2

/** Passa um pouco do alvo e volta — dá peso ao movimento. */
export const easeOutBack: Easing = (t) => {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

export const easeOutElastic: Easing = (t) => {
  if (t === 0 || t === 1) return t
  const c4 = (2 * Math.PI) / 3
  return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1
}

/** Sobe e desce: 0 → 1 → 0. Usado no arco do pulo e no squash. */
export const arc: Easing = (t) => Math.sin(t * Math.PI)

export interface TweenHandle {
  promise: Promise<void>
  cancel: () => void
}

export function tween(options: {
  duration: number
  onUpdate: (progress: number) => void
  easing?: Easing
  onComplete?: () => void
}): TweenHandle {
  const { duration, onUpdate, easing = easeOutCubic, onComplete } = options

  let cancelled = false
  let frame = 0

  const promise = new Promise<void>((resolve) => {
    // Duração zero (ou "movimento reduzido") aplica o estado final na hora
    if (duration <= 0) {
      onUpdate(1)
      onComplete?.()
      resolve()
      return
    }

    const start = performance.now()

    const step = (now: number) => {
      if (cancelled) {
        resolve()
        return
      }
      const raw = Math.min(1, (now - start) / duration)
      onUpdate(easing(raw))

      if (raw < 1) {
        frame = requestAnimationFrame(step)
      } else {
        onComplete?.()
        resolve()
      }
    }

    frame = requestAnimationFrame(step)
  })

  return {
    promise,
    cancel: () => {
      cancelled = true
      cancelAnimationFrame(frame)
    },
  }
}

/** Espera um tempo, cancelável do mesmo jeito que um tween. */
export function delay(ms: number): TweenHandle {
  return tween({ duration: ms, onUpdate: () => {}, easing: linear })
}

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
  )
}
