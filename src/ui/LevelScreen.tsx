import { useEffect, useRef, useState } from 'react'
import { session } from '../app/session'
import { useStore } from '../app/store'
import { getLevel } from '../levels'
import { BriefingModal } from './BriefingModal'
import { CodeEditor, type CodeEditorHandle } from './CodeEditor'
import { CommandPalette } from './CommandPalette'
import { ConsolePanel } from './ConsolePanel'
import { HelpDrawer } from './HelpDrawer'
import { HintModal, IconLamp } from './HintModal'
import { PixiStage } from './PixiStage'
import { RunControls } from './RunControls'
import { SoundControls } from './SoundControls'
import { VictoryModal } from './VictoryModal'

/**
 * Tela de uma fase.
 *
 * Layout em três faixas: a barra de moldes no topo (apoio permanente), o rio
 * à esquerda e o código à direita. O rio fica maior que o editor porque é
 * olhando para ele que o aluno entende o que o código fez.
 */
export function LevelScreen() {
  const levelId = useStore((state) => state.levelId)
  const code = useStore((state) => state.code)
  const setCode = useStore((state) => state.setCode)
  const status = useStore((state) => state.status)
  const speed = useStore((state) => state.speed)
  const setSpeed = useStore((state) => state.setSpeed)
  const activeLine = useStore((state) => state.activeLine)
  const error = useStore((state) => state.error)
  const consoleLines = useStore((state) => state.console)
  const showBriefing = useStore((state) => state.showBriefing)
  const setShowBriefing = useStore((state) => state.setShowBriefing)
  const hintLevel = useStore((state) => state.hintLevel)
  const goTo = useStore((state) => state.goTo)

  const [helpOpen, setHelpOpen] = useState(false)
  const [hintsOpen, setHintsOpen] = useState(false)
  const editor = useRef<CodeEditorHandle | null>(null)

  const level = getLevel(levelId)

  // Carrega a fase no motor e reseta o editor sempre que o id muda
  useEffect(() => {
    if (!level) return
    session.loadLevel(level)
    useStore.setState({ code: level.starterCode })
  }, [level])

  if (!level) {
    return (
      <div className="sm-play">
        <p>Fase não encontrada.</p>
      </div>
    )
  }

  return (
    <div className="sm-play">
      <header className="sm-topbar">
        <div className="sm-topbar__left">
          <button type="button" className="sm-btn sm-btn--ghost"
            onClick={() => goTo('levelMap')}>
            ← Mapa
          </button>
          <div className="sm-topbar__identity">
            <span className="sm-topbar__eyebrow">
              Mundo {level.world} · Fase {level.index}
            </span>
            <h1 className="sm-topbar__title">{level.title}</h1>
          </div>
        </div>

        <p className="sm-topbar__goal">
          <span className="sm-topbar__goal-label">Objetivo</span>
          {level.goal}
        </p>

        <div className="sm-topbar__right">
          <button type="button" className="sm-btn" onClick={() => setShowBriefing(true)}>
            Rever explicação
          </button>
          <button
            type="button"
            className={`sm-btn sm-hint-btn ${hintLevel > 0 ? 'is-used' : ''}`}
            onClick={() => setHintsOpen(true)}
            title="Ver as dicas desta fase"
          >
            <IconLamp />
            Dica
            <span className="sm-hint-btn__count">{hintLevel}/2</span>
          </button>
          <button type="button" className="sm-btn" onClick={() => setHelpOpen(true)}>
            Guia de comandos
          </button>
          <SoundControls />
        </div>
      </header>

      <CommandPalette
        allowed={level.allowed}
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
              <span className="sm-play__par" title="Limite de linhas para a segunda estrela">
                meta: até {level.parLines} linha{level.parLines > 1 ? 's' : ''}
              </span>
            </header>

            <CodeEditor
              value={code}
              onChange={setCode}
              allowed={level.allowed}
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
            // Pausado significa retomar de onde parou; qualquer outro estado
            // recompila e roda do começo.
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

            <ConsolePanel lines={consoleLines} />
          </div>
        </section>
      </main>

      <HelpDrawer open={helpOpen} onClose={() => setHelpOpen(false)} allowed={level.allowed} />

      {hintsOpen && <HintModal level={level} onClose={() => setHintsOpen(false)} />}

      {showBriefing && (
        <BriefingModal level={level} onStart={() => setShowBriefing(false)} />
      )}

      <VictoryModal />
    </div>
  )
}
