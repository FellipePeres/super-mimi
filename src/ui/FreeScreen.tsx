import { useEffect, useRef, useState } from 'react'
import { session } from '../app/session'
import { DEFAULT_FREE_CODE, useStore } from '../app/store'
import { ALL_COMMAND_IDS } from '../lang/commands'
import { CodeEditor, type CodeEditorHandle } from './CodeEditor'
import { CommandPalette } from './CommandPalette'
import { ConsolePanel } from './ConsolePanel'
import { HelpDrawer } from './HelpDrawer'
import { PixiStage } from './PixiStage'
import { RunControls } from './RunControls'
import { SoundControls } from './SoundControls'

/**
 * Modo Livre.
 *
 * Sem objetivo, sem estrelas, sem limite de linhas — e com todos os comandos
 * liberados desde o primeiro segundo. É o lugar para experimentar sem o
 * currículo no caminho, e o código fica salvo entre uma visita e outra.
 */
export function FreeScreen() {
  const freeCode = useStore((state) => state.freeCode)
  const code = useStore((state) => state.code)
  const setCode = useStore((state) => state.setCode)
  const status = useStore((state) => state.status)
  const speed = useStore((state) => state.speed)
  const setSpeed = useStore((state) => state.setSpeed)
  const activeLine = useStore((state) => state.activeLine)
  const error = useStore((state) => state.error)
  const consoleLines = useStore((state) => state.console)
  const goTo = useStore((state) => state.goTo)

  const [helpOpen, setHelpOpen] = useState(false)
  const editor = useRef<CodeEditorHandle | null>(null)

  // Retoma o código salvo da última visita
  useEffect(() => {
    session.loadFree()
    useStore.setState({ code: freeCode })
    // Só na montagem: depois disso o editor é a fonte da verdade
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="sm-play sm-play--free">
      <header className="sm-topbar">
        <div className="sm-topbar__left">
          <button type="button" className="sm-btn sm-btn--ghost" onClick={() => goTo('title')}>
            ← Início
          </button>
          <div className="sm-topbar__identity">
            <span className="sm-topbar__eyebrow">Sem objetivo, sem pressa</span>
            <h1 className="sm-topbar__title">Modo Livre</h1>
          </div>
        </div>

        <p className="sm-topbar__goal">
          <span className="sm-topbar__goal-label">Dica</span>
          O rio vai de (0, 0) embaixo à esquerda até (15, 10) em cima à direita.
        </p>

        <div className="sm-topbar__right">
          <button
            type="button"
            className="sm-btn"
            onClick={() => {
              setCode(DEFAULT_FREE_CODE)
              session.stop()
            }}
            title="Volta ao exemplo inicial"
          >
            Recomeçar do exemplo
          </button>
          <button type="button" className="sm-btn" onClick={() => setHelpOpen(true)}>
            Guia de comandos
          </button>
          <button type="button" className="sm-btn" onClick={() => goTo('levelMap')}>
            Jogar as fases
          </button>
          <SoundControls />
        </div>
      </header>

      <CommandPalette
        allowed={ALL_COMMAND_IDS}
        onInsert={(snippet) => editor.current?.insert(snippet)}
      />

      <main className="sm-play__body">
        <section className="sm-play__stage">
          <PixiStage />
        </section>

        <section className="sm-play__code">
          <div className="sm-play__editor sm-panel">
            <header className="sm-play__editor-head">
              <h2>Seu código</h2>
              <span className="sm-play__par">salvo automaticamente</span>
            </header>

            <CodeEditor
              value={code}
              onChange={setCode}
              allowed={ALL_COMMAND_IDS}
              activeLine={activeLine}
              errorLine={error?.line ?? null}
              editorRef={(handle) => {
                editor.current = handle
              }}
            />
          </div>

          <RunControls
            status={status}
            speed={speed}
            onRun={() => (status === 'paused' ? session.play() : session.run(code))}
            onPause={() => session.pause()}
            onStep={() => session.stepThrough(code)}
            onStop={() => session.stop()}
            onSpeed={(value) => {
              setSpeed(value)
              session.setSpeed(value)
            }}
          />

          <div className="sm-play__console sm-panel">
            <header className="sm-play__console-head">
              <h2>O que aconteceu</h2>
            </header>
            <ConsolePanel
              lines={consoleLines}
              placeholder="Escreva um comando e aperte Executar. Nada aqui dá errado — é para experimentar."
            />
          </div>
        </section>
      </main>

      <HelpDrawer open={helpOpen} onClose={() => setHelpOpen(false)} allowed={ALL_COMMAND_IDS} />
    </div>
  )
}
