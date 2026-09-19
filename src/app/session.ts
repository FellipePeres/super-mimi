import { Runner } from '../engine/runner'
import type { GameEvent } from '../engine/types'
import { World, type WorldConfig } from '../engine/world'
import { MimiError } from '../lang/errors'
import { describeBlocked } from '../lang/interpreter'
import { parse } from '../lang/parser'
import { GameStage } from '../render/GameStage'
import type { CharacterId } from '../render/turtleSprite'
import { countCodeLines, levelToWorldConfig, type LevelSpec, type LevelStars } from '../levels'
import { sfx } from '../audio/sfx'
import { useStore } from './store'

/** Rio do Modo Livre: largo, aberto e com alguns pontos de referência. */
export const FREE_WORLD: WorldConfig = {
  width: 16,
  height: 11,
  map: [
    '||............||',
    '|..............|',
    '.....o..........',
    '................',
    '.......#........',
    '..o.............',
    '................',
    '..........o.....',
    '....#...........',
    '|..............|',
    '||............||',
  ],
  start: { x: 2, y: 5 },
  facing: 'east',
  goal: null,
}

/**
 * Cola entre o motor, o desenho e a interface.
 *
 * Existe porque `World`, `Runner` e `GameStage` são objetos imperativos e de
 * vida longa: colocá-los dentro do estado do React faria a árvore inteira
 * re-renderizar a cada braçada. Aqui eles vivem fora do React e só empurram
 * para o store o que a interface precisa mostrar.
 */
class GameSession {
  private world: World | null = null
  private runner: Runner | null = null
  private stage: GameStage | null = null
  private level: LevelSpec | null = null
  private mode: 'level' | 'free' = 'level'
  private pendingConfig: WorldConfig | null = null

  // ------------------------------------------------------------- ciclo de vida

  async attach(element: HTMLElement): Promise<void> {
    if (this.stage) this.detach()

    // Os efeitos dos filhos rodam antes dos do pai, então este `attach` começa
    // antes de a tela chamar `loadLevel` — e, como ele é assíncrono, o mundo
    // pode ser trocado no meio da criação do palco. Por isso o mundo é lido de
    // novo no fim, em vez de capturado aqui.
    if (!this.world) this.world = new World(this.pendingConfig ?? FREE_WORLD)

    const { character } = useStore.getState()
    const stage = await GameStage.create(element, this.world, character)

    this.stage = stage
    stage.setWorld(this.world)
    this.buildRunner()
  }

  detach(): void {
    this.runner?.stop()
    this.stage?.destroy()
    this.stage = null
    this.runner = null
  }

  private buildRunner(): void {
    if (!this.world) return

    const store = useStore.getState()

    this.runner = new Runner(this.world, {
      onEvent: async (event, duration) => {
        sfx.playForEvent(event)
        this.reportEvent(event)
        await this.stage?.playEvent(event, duration)
      },
      onLine: (line) => useStore.getState().setActiveLine(line),
      onStatus: (status) => useStore.getState().setStatus(status),
      onError: (error) => this.reportError(error),
      onFinish: () => this.finish(),
    })

    this.runner.setSpeed(store.speed)
  }

  // ------------------------------------------------------------------ carregar

  /** Prepara uma fase. Se o palco já existe, troca o mundo sem recriá-lo. */
  loadLevel(level: LevelSpec): void {
    this.level = level
    this.mode = 'level'
    this.swapWorld(levelToWorldConfig(level))
  }

  loadFree(): void {
    this.level = null
    this.mode = 'free'
    this.swapWorld(FREE_WORLD)
  }

  private swapWorld(config: WorldConfig): void {
    this.pendingConfig = config
    this.runner?.stop()
    this.stage?.stop()

    this.world = new World(config)

    if (this.stage) {
      this.stage.setWorld(this.world)
      this.buildRunner()
    }

    const store = useStore.getState()
    store.clearConsole()
    store.setActiveLine(null)
    store.setError(null)
  }

  setCharacter(character: CharacterId): void {
    this.stage?.setCharacter(character)
  }

  setSpeed(speed: number): void {
    this.runner?.setSpeed(speed)
  }

  // ------------------------------------------------------------------ execução

  /**
   * Compila e roda. Erros de sintaxe param aqui e nunca chegam ao runner —
   * o aluno recebe a mensagem antes de a tartaruga se mexer.
   */
  run(code: string): void {
    const store = useStore.getState()
    store.clearConsole()
    store.setError(null)

    if (!this.runner || !this.world) return

    let program
    try {
      program = parse(code)
    } catch (error) {
      if (error instanceof MimiError) {
        this.reportError(error)
        return
      }
      throw error
    }

    this.stage?.reset()
    this.runner.load(program, (text) => {
      store.pushConsole({ kind: 'say', text })
    })
    this.runner.setSpeed(store.speed)
    this.runner.play()
  }

  play(): void {
    this.runner?.play()
  }

  pause(): void {
    this.runner?.pause()
  }

  /** Passo a passo: compila na primeira chamada, depois só avança. */
  stepThrough(code: string): void {
    if (!this.runner) return

    if (this.runner.status === 'idle' || this.runner.status === 'finished') {
      const store = useStore.getState()
      store.clearConsole()
      store.setError(null)

      let program
      try {
        program = parse(code)
      } catch (error) {
        if (error instanceof MimiError) {
          this.reportError(error)
          return
        }
        throw error
      }

      this.stage?.reset()
      this.runner.load(program, (text) => store.pushConsole({ kind: 'say', text }))
      this.runner.setSpeed(store.speed)
    }

    this.runner.step()
  }

  stop(): void {
    this.runner?.stop()
    this.stage?.stop()
    this.reset()
  }

  reset(): void {
    this.world?.reset()
    this.stage?.reset()

    const store = useStore.getState()
    store.setActiveLine(null)
    store.setStatus('idle')
  }

  // -------------------------------------------------------------- relatórios

  private reportEvent(event: GameEvent): void {
    const store = useStore.getState()

    if (event.type === 'blocked') {
      store.pushConsole({ kind: 'info', text: describeBlocked(event) })
    } else if (event.type === 'collect') {
      store.pushConsole({
        kind: 'success',
        text:
          event.remaining === 0
            ? 'Semente recolhida! Essa era a última.'
            : `Semente recolhida! Faltam ${event.remaining}.`,
      })
    }
  }

  private reportError(error: MimiError): void {
    const store = useStore.getState()
    sfx.play('error')

    store.setError(error)
    store.setActiveLine(error.line)
    store.setStatus('error')
    store.pushConsole({ kind: 'error', text: error.headline, hint: error.hint })
  }

  /** Fim natural do programa: é aqui que a fase é ganha ou não. */
  private finish(): void {
    const store = useStore.getState()
    store.setActiveLine(null)

    if (!this.world) return

    if (this.mode === 'free') {
      store.pushConsole({ kind: 'info', text: 'Programa terminado.' })
      return
    }

    const level = this.level
    if (!level) return

    if (!this.world.state.won) {
      store.pushConsole({
        kind: 'info',
        text: 'O programa terminou, mas a Mimi não chegou na flor.',
        hint: 'Confira as coordenadas do objetivo e tente de novo.',
      })
      return
    }

    const stars: LevelStars = {
      finished: true,
      concise: countCodeLines(store.code) <= level.parLines,
      collectedAll: this.world.state.seeds.length === 0,
    }

    // O som das estrelas é da tela de vitória, que as revela uma a uma. Tocar
    // aqui também soava como uma quarta estrela fora do ritmo.
    store.recordResult(level.id, stars)
  }
}

export const session = new GameSession()
