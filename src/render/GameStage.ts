import { Application, Container, Graphics, Text, TextStyle } from 'pixi.js'
import type { GameEvent } from '../engine/types'
import type { World } from '../engine/world'
import { CartesianGrid } from './cartesianGrid'
import { fitGrid, tileCenter, type GridGeometry } from './coords'
import { PALETTE } from './palette'
import { ParticleLayer } from './particles'
import { TileLayer } from './tileLayer'
import { TurtleSprite, type CharacterId } from './turtleSprite'
import { WaterLayer } from './waterLayer'
import {
  arc, delay, easeInOutCubic, easeOutBack, easeOutCubic,
  prefersReducedMotion, tween, type TweenHandle,
} from './tween'

/**
 * Tamanho da tartaruga em fração do tile. Perto de 1 para ela ser lida como
 * personagem e não como peça de tabuleiro; abaixo de 1 para sobrar respiro
 * entre ela e a linha da grade.
 */
const TURTLE_SCALE = 0.98

/**
 * O palco.
 *
 * Junta as camadas e traduz cada `GameEvent` numa animação. É a única peça
 * que conhece ao mesmo tempo o motor e o desenho — de propósito: mantendo
 * essa tradução num lugar só, o interpretador continua testável sem DOM e as
 * camadas de desenho continuam ignorantes das regras do jogo.
 */
export class GameStage {
  readonly app: Application

  private water!: WaterLayer
  private grid!: CartesianGrid
  private tiles!: TileLayer
  private turtle!: TurtleSprite
  private particles!: ParticleLayer
  private overlay = new Container()

  private geo: GridGeometry
  private running: TweenHandle[] = []
  private speech: Container | null = null
  private observer: ResizeObserver | null = null
  private destroyed = false

  private constructor(
    app: Application,
    private world: World,
    private character: CharacterId,
  ) {
    this.app = app
    this.geo = fitGrid(
      app.screen.width,
      app.screen.height,
      world.state.width,
      world.state.height,
    )
  }

  static async create(
    parent: HTMLElement,
    world: World,
    character: CharacterId,
  ): Promise<GameStage> {
    const app = new Application()
    await app.init({
      backgroundAlpha: 0,
      antialias: true,
      resolution: Math.min(2, window.devicePixelRatio || 1),
      autoDensity: true,
      resizeTo: parent,
      preference: 'webgl',
    })
    parent.appendChild(app.canvas)

    const stage = new GameStage(app, world, character)
    await stage.build(parent)
    return stage
  }

  private async build(parent: HTMLElement): Promise<void> {
    const w = this.app.screen.width
    const h = this.app.screen.height

    this.water = new WaterLayer(w, h)
    this.grid = new CartesianGrid(this.geo)
    this.tiles = new TileLayer(this.world, this.geo)
    this.particles = new ParticleLayer(w, h)
    this.turtle = new TurtleSprite(this.character, this.geo.tileSize * TURTLE_SCALE)

    this.app.stage.addChild(
      this.water.container,
      this.grid.container,
      this.tiles.container,
      this.turtle.container,
      this.particles.container,
      this.overlay,
    )

    this.syncTurtleToWorld()
    // Troca o placeholder pela arte final assim que ela existir na pasta
    void this.turtle.loadArt()

    this.app.ticker.add((ticker) => {
      const dt = ticker.deltaMS
      this.water.update(dt)
      this.tiles.update(dt)
      this.turtle.update(dt)
      this.particles.update(dt)
    })

    this.observer = new ResizeObserver(() => this.resize())
    this.observer.observe(parent)
  }

  // ------------------------------------------------------------------ setup

  resize(): void {
    // O ResizeObserver dispara uma última vez enquanto o elemento é removido
    // do DOM, quando o Application já foi destruído e `screen` é nulo.
    if (this.destroyed) return

    const w = this.app.screen.width
    const h = this.app.screen.height
    if (w === 0 || h === 0) return

    this.geo = fitGrid(w, h, this.world.state.width, this.world.state.height)

    this.water.resize(w, h)
    this.particles.resize(w, h)
    this.grid.setGeometry(this.geo)
    this.tiles.setGeometry(this.geo)
    this.turtle.setSize(this.geo.tileSize * TURTLE_SCALE)
    this.syncTurtleToWorld()
  }

  setWorld(world: World): void {
    if (this.destroyed) return

    this.world = world
    this.geo = fitGrid(
      this.app.screen.width,
      this.app.screen.height,
      world.state.width,
      world.state.height,
    )
    this.grid.setGeometry(this.geo)
    this.tiles.setWorld(world)
    this.tiles.setGeometry(this.geo)
    this.turtle.setSize(this.geo.tileSize * TURTLE_SCALE)
    this.particles.clear()
    this.syncTurtleToWorld()
  }

  setCharacter(character: CharacterId): void {
    this.character = character
    this.turtle.setCharacter(character)
    void this.turtle.loadArt()
  }

  /** Volta tudo ao estado inicial da fase, sem recriar o palco. */
  reset(): void {
    this.cancelAnimations()
    this.clearSpeech()
    this.particles.clear()
    this.tiles.rebuild()
    this.syncTurtleToWorld()
  }

  private syncTurtleToWorld(): void {
    const { pos, facing } = this.world.state.turtle
    const center = tileCenter(this.geo, pos.x, pos.y)
    this.turtle.setPosition(center.x, center.y)
    this.turtle.setFacing(facing)
    this.turtle.setPaddle(0)
    this.turtle.resetStretch()
    this.grid.setCursor(pos.x, pos.y)
  }

  private cancelAnimations(): void {
    for (const handle of this.running) handle.cancel()
    this.running = []
  }

  /** Registra o tween para que um "parar" no meio do movimento o cancele. */
  private async track(handle: TweenHandle): Promise<void> {
    this.running.push(handle)
    await handle.promise
    this.running = this.running.filter((h) => h !== handle)
  }

  // ---------------------------------------------------------------- eventos

  /**
   * Anima um evento. O runner só avança quando esta promessa resolve, então é
   * a duração daqui que controla o ritmo do jogo.
   */
  async playEvent(event: GameEvent, duration: number): Promise<void> {
    const d = prefersReducedMotion() ? Math.min(duration, 60) : duration

    switch (event.type) {
      case 'swim':
        return this.animateSwim(event, d)
      case 'dive':
        return this.animateDive(event, d)
      case 'blocked':
        return this.animateBlocked(event, d)
      case 'turn':
        return this.animateTurn(event, d)
      case 'collect':
        return this.animateCollect(event, d)
      case 'hop':
        return this.animateHop(event, d)
      case 'rest':
        return this.animateRest(d)
      case 'say':
        return this.animateSay(event.text, d)
      case 'win':
        return this.animateWin(event, d)
    }
  }

  private async animateSwim(
    event: Extract<GameEvent, { type: 'swim' }>,
    duration: number,
  ): Promise<void> {
    const from = tileCenter(this.geo, event.from.x, event.from.y)
    const to = tileCenter(this.geo, event.to.x, event.to.y)
    const scale = this.geo.tileSize / 64

    this.turtle.setFacing(event.facing)
    this.turtle.setPaddle(1)

    const dx = Math.sign(to.x - from.x)
    const dy = Math.sign(to.y - from.y)
    let lastWake = 0

    await this.track(
      tween({
        duration,
        easing: easeInOutCubic,
        onUpdate: (t) => {
          const x = from.x + (to.x - from.x) * t
          const y = from.y + (to.y - from.y) * t
          this.turtle.setPosition(x, y)
          this.turtle.applyStretch(t)

          // Espuma em três pontos do trajeto, não a cada quadro
          if (t - lastWake > 0.3) {
            lastWake = t
            this.particles.wake(x, y, dx, dy, scale)
          }
        },
        onComplete: () => {
          this.turtle.setPaddle(0)
          this.turtle.resetStretch()
          this.particles.bubbles(to.x, to.y, 3, scale)
          this.grid.setCursor(event.to.x, event.to.y)
        },
      }),
    )
  }

  private async animateDive(
    event: Extract<GameEvent, { type: 'dive' }>,
    duration: number,
  ): Promise<void> {
    const from = tileCenter(this.geo, event.from.x, event.from.y)
    const to = tileCenter(this.geo, event.to.x, event.to.y)
    const scale = this.geo.tileSize / 64

    this.particles.bubbles(from.x, from.y, 10, scale)
    this.turtle.setPaddle(1)

    await this.track(
      tween({
        duration,
        easing: easeInOutCubic,
        onUpdate: (t) => {
          this.turtle.setPosition(
            from.x + (to.x - from.x) * t,
            from.y + (to.y - from.y) * t,
          )
          // Afunda no meio do caminho e volta à superfície
          const depth = arc(t)
          this.turtle.container.alpha = 1 - depth * 0.55
          this.turtle.container.scale.set(1 - depth * 0.22)
        },
        onComplete: () => {
          this.turtle.container.alpha = 1
          this.turtle.container.scale.set(1)
          this.turtle.setPaddle(0)
          this.particles.bubbles(to.x, to.y, 8, scale)
          this.grid.setCursor(event.to.x, event.to.y)
        },
      }),
    )
  }

  /** Bater é informação: precisa ser visível sem ser punitivo. */
  private async animateBlocked(
    event: Extract<GameEvent, { type: 'blocked' }>,
    duration: number,
  ): Promise<void> {
    const at = tileCenter(this.geo, event.at.x, event.at.y)
    const towards = tileCenter(this.geo, event.against.x, event.against.y)
    const scale = this.geo.tileSize / 64

    const dx = Math.sign(towards.x - at.x)
    const dy = Math.sign(towards.y - at.y)
    const reach = this.geo.tileSize * 0.3

    this.particles.splash(
      at.x + dx * this.geo.tileSize * 0.4,
      at.y + dy * this.geo.tileSize * 0.4,
      dx,
      dy,
      scale,
    )

    await this.track(
      tween({
        duration,
        easing: easeOutCubic,
        onUpdate: (t) => {
          // Avança, bate e volta tremendo
          const push = arc(Math.min(1, t * 2))
          const shake = t > 0.5 ? Math.sin(t * 46) * (1 - t) * 5 : 0
          this.turtle.setPosition(
            at.x + dx * reach * push + (dy !== 0 ? shake : 0),
            at.y + dy * reach * push + (dx !== 0 ? shake : 0),
          )
        },
        onComplete: () => {
          this.turtle.setPosition(at.x, at.y)
        },
      }),
    )
  }

  private async animateTurn(
    event: Extract<GameEvent, { type: 'turn' }>,
    duration: number,
  ): Promise<void> {
    await this.track(this.turtle.turnTo(event.to, duration))
  }

  private async animateCollect(
    event: Extract<GameEvent, { type: 'collect' }>,
    duration: number,
  ): Promise<void> {
    const at = tileCenter(this.geo, event.at.x, event.at.y)
    const scale = this.geo.tileSize / 64

    this.tiles.popSeed(event.at)
    this.particles.sparkle(at.x, at.y, scale)

    await this.track(
      tween({
        duration,
        easing: easeOutBack,
        onUpdate: (t) => {
          this.turtle.container.scale.set(1 + arc(t) * 0.16)
        },
        onComplete: () => this.turtle.container.scale.set(1),
      }),
    )
  }

  private async animateHop(
    event: Extract<GameEvent, { type: 'hop' }>,
    duration: number,
  ): Promise<void> {
    const at = tileCenter(this.geo, event.at.x, event.at.y)
    const height = this.geo.tileSize * 0.42

    await this.track(
      tween({
        duration,
        easing: (t) => t,
        onUpdate: (t) => {
          const lift = arc(t)
          this.turtle.setPosition(at.x, at.y - lift * height)
          this.turtle.container.scale.set(1 + lift * 0.1)
        },
        onComplete: () => {
          this.turtle.setPosition(at.x, at.y)
          this.turtle.container.scale.set(1)
          this.particles.bubbles(at.x, at.y, 5, this.geo.tileSize / 64)
        },
      }),
    )
  }

  private async animateRest(duration: number): Promise<void> {
    await this.track(delay(duration))
  }

  private async animateSay(text: string, duration: number): Promise<void> {
    this.showSpeech(text)
    await this.track(delay(Math.max(duration, 900)))
    this.clearSpeech()
  }

  private async animateWin(
    event: Extract<GameEvent, { type: 'win' }>,
    duration: number,
  ): Promise<void> {
    const at = tileCenter(this.geo, event.at.x, event.at.y)
    const scale = this.geo.tileSize / 64

    this.particles.celebrate(at.x, at.y, scale)

    await this.track(
      tween({
        duration,
        easing: (t) => t,
        onUpdate: (t) => {
          // Dois pulos, o segundo menor
          const hop = Math.abs(Math.sin(t * Math.PI * 2)) * (1 - t * 0.45)
          this.turtle.setPosition(at.x, at.y - hop * this.geo.tileSize * 0.5)
          this.turtle.container.rotation = Math.sin(t * Math.PI * 4) * 0.14
          this.turtle.container.scale.set(1 + hop * 0.12)
        },
        onComplete: () => {
          this.turtle.setPosition(at.x, at.y)
          this.turtle.container.rotation = 0
          this.turtle.container.scale.set(1)
        },
      }),
    )
  }

  // ------------------------------------------------------------ balão de fala

  private showSpeech(text: string): void {
    this.clearSpeech()

    const bubble = new Container()
    const label = new Text({
      text,
      style: new TextStyle({
        fontFamily: 'Nunito, sans-serif',
        fontSize: Math.max(13, this.geo.tileSize * 0.26),
        fontWeight: '700',
        fill: PALETTE.outline,
        align: 'center',
        wordWrap: true,
        wordWrapWidth: 240,
      }),
    })
    label.anchor.set(0.5)

    const padX = 16
    const padY = 10
    const w = label.width + padX * 2
    const h = label.height + padY * 2

    const shape = new Graphics()
    shape.roundRect(-w / 2, -h / 2, w, h, 12).fill({ color: PALETTE.waterFoam, alpha: 0.96 })
    shape.poly([-8, h / 2, 8, h / 2, 0, h / 2 + 11]).fill({ color: PALETTE.waterFoam, alpha: 0.96 })

    bubble.addChild(shape, label)

    const pos = this.turtle.position
    bubble.position.set(pos.x, pos.y - this.geo.tileSize * 0.8 - h / 2)
    bubble.scale.set(0)

    this.overlay.addChild(bubble)
    this.speech = bubble

    void tween({
      duration: 260,
      easing: easeOutBack,
      onUpdate: (t) => bubble.scale.set(t),
    }).promise
  }

  private clearSpeech(): void {
    this.speech?.destroy({ children: true })
    this.speech = null
  }

  // ------------------------------------------------------------------ ciclo

  /** Redesenha o mapa depois de o Modo Livre pintar uma casa. */
  refreshTiles(): void {
    this.tiles.rebuild()
  }

  get geometry(): GridGeometry {
    return this.geo
  }

  stop(): void {
    this.cancelAnimations()
    this.clearSpeech()
  }

  destroy(): void {
    if (this.destroyed) return
    this.destroyed = true

    // Ordem importa: soltar o observador antes de destruir o Application,
    // senão ele dispara um último resize contra um palco que já não existe.
    this.observer?.disconnect()
    this.observer = null

    this.cancelAnimations()
    this.app.destroy(true, { children: true })
  }
}
