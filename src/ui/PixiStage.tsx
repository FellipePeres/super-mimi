import { useEffect, useRef } from 'react'
import { session } from '../app/session'
import { useStore } from '../app/store'

/**
 * Ponto de montagem do palco Pixi.
 *
 * O React só fornece a `div`: tudo que acontece dentro é desenhado pelo
 * `GameStage`, fora do ciclo de renderização. Um re-render deste componente
 * não deve recriar o palco — daí o efeito sem dependências.
 */
export function PixiStage() {
  const host = useRef<HTMLDivElement>(null)
  const character = useStore((state) => state.character)

  useEffect(() => {
    const element = host.current
    if (!element) return

    let disposed = false
    void session.attach(element).then(() => {
      // Desmontou antes de o Pixi terminar de inicializar
      if (disposed) session.detach()
    })

    return () => {
      disposed = true
      session.detach()
    }
  }, [])

  useEffect(() => {
    session.setCharacter(character)
  }, [character])

  return <div className="sm-stage" ref={host} aria-hidden="true" />
}
