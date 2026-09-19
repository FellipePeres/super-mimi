import { useEffect } from 'react'
import { useStore } from './app/store'
import { sfx } from './audio/sfx'
import { CharacterSelect } from './ui/CharacterSelect'
import { FreeScreen } from './ui/FreeScreen'
import { LevelMap } from './ui/LevelMap'
import { LevelScreen } from './ui/LevelScreen'
import { TitleScreen } from './ui/TitleScreen'

export default function App() {
  const screen = useStore((state) => state.screen)
  const levelId = useStore((state) => state.levelId)
  const muted = useStore((state) => state.muted)
  const volumeAmbient = useStore((state) => state.volumeAmbient)
  const volumeEffects = useStore((state) => state.volumeEffects)

  useEffect(() => {
    sfx.preload()

    // Navegadores mantêm o áudio suspenso até a primeira interação. O gesto
    // que libera precisa ser `pointerdown`, e não `click`: assim o contexto já
    // está ativo quando o `click` do mesmo toque disparar o som do botão.
    const unlock = () => sfx.unlock()
    window.addEventListener('pointerdown', unlock)

    /**
     * Som de clique para a interface inteira, num listener só.
     *
     * Espalhar `sfx.play('click')` por dezenas de `onClick` seria fácil de
     * esquecer num botão novo. Botões que já têm som próprio se marcam com
     * `data-sfx="off"` para não tocarem dois sons ao mesmo tempo.
     */
    const onClick = (event: MouseEvent) => {
      const button = (event.target as HTMLElement | null)?.closest('button')
      if (!button || button.disabled) return
      if (button.dataset.sfx === 'off') return
      sfx.play('click')
    }
    document.addEventListener('click', onClick)

    return () => {
      window.removeEventListener('pointerdown', unlock)
      document.removeEventListener('click', onClick)
    }
  }, [])

  useEffect(() => {
    sfx.setMuted(muted)
  }, [muted])

  useEffect(() => {
    sfx.setVolumeAmbient(volumeAmbient)
  }, [volumeAmbient])

  useEffect(() => {
    sfx.setVolumeEffects(volumeEffects)
  }, [volumeEffects])

  return (
    <div className="sm-app" data-screen={screen}>
      {screen === 'title' && <TitleScreen />}
      {screen === 'character' && <CharacterSelect />}
      {screen === 'levelMap' && <LevelMap />}
      {/* A chave força remontar ao trocar de fase, zerando o palco e o editor */}
      {screen === 'level' && <LevelScreen key={levelId} />}
      {screen === 'free' && <FreeScreen />}
    </div>
  )
}
