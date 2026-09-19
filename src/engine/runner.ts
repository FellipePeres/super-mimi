import type { Program } from '../lang/ast'
import { MimiError } from '../lang/errors'
import { interpret } from '../lang/interpreter'
import type { GameEvent } from './types'
import type { World } from './world'

export type RunnerStatus = 'idle' | 'running' | 'paused' | 'finished' | 'error'

/**
 * Duração base da animação de cada evento, em ms. A velocidade escolhida pelo
 * aluno divide estes valores.
 *
 * O ritmo é deliberadamente calmo: o aluno precisa conseguir acompanhar com o
 * olho a ligação entre a linha destacada no editor e o movimento na água. Quem
 * quiser só conferir o resultado tem os botões 2× e 4×.
 *
 * `say` e `win` ficam de fora dessa cadência — o primeiro é tempo de leitura
 * de um balão de texto, o segundo é uma animação de celebração fechada.
 */
const EVENT_DURATION: Record<GameEvent['type'], number> = {
  swim: 840,
  dive: 1240,
  turn: 480,
  blocked: 840,
  collect: 640,
  hop: 1040,
  rest: 520,
  say: 220,
  win: 950,
}

export interface RunnerCallbacks {
  /** Anima o evento. O runner só avança quando a promessa resolver. */
  onEvent: (event: GameEvent, durationMs: number) => Promise<void> | void
  /** Linha que está executando agora, para destacar no editor. */
  onLine?: (line: number) => void
  onStatus?: (status: RunnerStatus) => void
  onError?: (error: MimiError) => void
  onFinish?: () => void
}

/**
 * Consome o generator do interpretador no ritmo da animação.
 *
 * Toda a mecânica de play/pause/passo-a-passo vive aqui e em lugar nenhum
 * mais: o interpretador não sabe que existe tempo, e o renderizador não sabe
 * que existe código.
 */
export class Runner {
  private iterator: Generator<GameEvent, void, undefined> | null = null
  private _status: RunnerStatus = 'idle'
  private speed = 1
  private stepping = false
  private stopped = false
  private resume: (() => void) | null = null

  constructor(
    private readonly world: World,
    private readonly callbacks: RunnerCallbacks,
  ) {}

  get status(): RunnerStatus {
    return this._status
  }

  private setStatus(status: RunnerStatus) {
    this._status = status
    this.callbacks.onStatus?.(status)
  }

  /** 0.5 = devagar para observar, 4 = rápido para conferir o resultado. */
  setSpeed(speed: number): void {
    this.speed = Math.max(0.25, speed)
  }

  /** Carrega um programa novo e zera o mundo. */
  load(program: Program, onSay?: (text: string) => void): void {
    this.stop()
    this.world.reset()
    this.iterator = interpret(program, this.world, { onSay })
    this.stopped = false
    this.setStatus('idle')
  }

  play(): void {
    if (!this.iterator) return
    if (this._status === 'paused') {
      this.stepping = false
      this.setStatus('running')
      this.resume?.()
      this.resume = null
      return
    }
    if (this._status !== 'idle') return
    this.stepping = false
    this.setStatus('running')
    void this.loop()
  }

  pause(): void {
    if (this._status === 'running') this.setStatus('paused')
  }

  /** Executa exatamente um evento e volta a pausar. */
  step(): void {
    if (!this.iterator) return
    this.stepping = true
    if (this._status === 'paused') {
      this.setStatus('running')
      this.resume?.()
      this.resume = null
    } else if (this._status === 'idle') {
      this.setStatus('running')
      void this.loop()
    }
  }

  stop(): void {
    this.stopped = true
    this.iterator = null
    this.resume?.()
    this.resume = null
    this.setStatus('idle')
  }

  /** Espera enquanto pausado; resolve quando o play/step destravar. */
  private waitWhilePaused(): Promise<void> {
    if (this._status !== 'paused') return Promise.resolve()
    return new Promise<void>((resolve) => {
      this.resume = resolve
    })
  }

  private async loop(): Promise<void> {
    const iterator = this.iterator
    if (!iterator) return

    while (true) {
      await this.waitWhilePaused()
      if (this.stopped || this.iterator !== iterator) return

      let result: IteratorResult<GameEvent, void>
      try {
        result = iterator.next()
      } catch (error) {
        this.handleError(error)
        return
      }

      if (result.done) {
        this.setStatus('finished')
        this.callbacks.onFinish?.()
        return
      }

      const event = result.value
      this.callbacks.onLine?.(event.line)

      const duration = EVENT_DURATION[event.type] / this.speed
      try {
        await this.callbacks.onEvent(event, duration)
      } catch (error) {
        this.handleError(error)
        return
      }

      if (this.stopped || this.iterator !== iterator) return

      // Em passo-a-passo, cada evento devolve o controle ao aluno
      if (this.stepping) this.setStatus('paused')
    }
  }

  private handleError(error: unknown): void {
    this.setStatus('error')
    if (error instanceof MimiError) {
      this.callbacks.onError?.(error)
    } else {
      // Nunca deve acontecer; vira um MimiError genérico para não vazar stack
      this.callbacks.onError?.(
        new MimiError(
          'algo inesperado aconteceu ao rodar seu código',
          { line: 1, col: 1 },
          'Tente rodar de novo. Se continuar, simplifique o código para achar a parte que causa o problema.',
          'execução',
        ),
      )
    }
  }
}
