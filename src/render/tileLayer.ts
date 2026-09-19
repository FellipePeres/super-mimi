import { Container, Graphics, Sprite } from 'pixi.js'
import type { TileType, Vec2 } from '../engine/types'
import type { World } from '../engine/world'
import { mixColor, PALETTE } from './palette'
import { tileCenter, tileSeed, type GridGeometry } from './coords'
import { softCircleTexture } from './textures'

/**
 * Tudo que fica *sobre* a água: vitórias régias, pedras, troncos, juncos e
 * sementes.
 *
 * Cada peça é desenhada com Graphics e recebe uma semente estável por casa —
 * assim duas pedras vizinhas têm formatos diferentes, mas a mesma pedra nunca
 * muda de forma entre um replay e outro.
 */

interface AnimatedPiece {
  node: Container
  /** Fase inicial, para as peças não balançarem em uníssono. */
  phase: number
  baseY: number
  kind: TileType
}

export class TileLayer {
  readonly container = new Container()

  private pieces: AnimatedPiece[] = []
  private seedNodes = new Map<string, Container>()
  private elapsed = 0

  constructor(
    private world: World,
    private geo: GridGeometry,
  ) {
    this.rebuild()
  }

  setGeometry(geo: GridGeometry): void {
    this.geo = geo
    this.rebuild()
  }

  setWorld(world: World): void {
    this.world = world
    this.rebuild()
  }

  /** Redesenha o mapa inteiro. Chamado ao trocar de fase ou pintar no Modo Livre. */
  rebuild(): void {
    this.container.removeChildren().forEach((c) => c.destroy({ children: true }))
    this.pieces = []
    this.seedNodes.clear()

    const { width, height } = this.world.state
    const size = this.geo.tileSize

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const tile = this.world.tileAt(x, y)
        if (tile === 'water' || tile === 'current' || tile === 'edge') continue

        const node = this.buildTile(tile, x, y, size)
        if (!node) continue

        const center = tileCenter(this.geo, x, y)
        node.position.set(center.x, center.y)
        this.container.addChild(node)
        this.pieces.push({
          node,
          phase: tileSeed(x, y) * Math.PI * 2,
          baseY: center.y,
          kind: tile,
        })
      }
    }

    // Sementes por cima de tudo, para nunca sumirem atrás de uma folha
    for (const seed of this.world.state.seeds) {
      const node = this.buildSeed(size)
      const center = tileCenter(this.geo, seed.x, seed.y)
      node.position.set(center.x, center.y)
      this.container.addChild(node)
      this.seedNodes.set(`${seed.x},${seed.y}`, node)
      this.pieces.push({
        node,
        phase: tileSeed(seed.x, seed.y) * Math.PI * 2,
        baseY: center.y,
        kind: 'water',
      })
    }
  }

  private buildTile(tile: TileType, x: number, y: number, size: number): Container | null {
    switch (tile) {
      case 'lily':
        return this.buildLily(size, tileSeed(x, y), false)
      case 'lilyFlower':
        return this.buildLily(size, tileSeed(x, y), true)
      case 'rock':
        return this.buildRock(size, tileSeed(x, y))
      case 'log':
        return this.buildLog(size, tileSeed(x, y))
      case 'reed':
        return this.buildReed(size, tileSeed(x, y))
      default:
        return null
    }
  }

  // --------------------------------------------------------- vitória régia

  private buildLily(size: number, seed: number, flowered: boolean): Container {
    const node = new Container()
    const r = size * 0.42
    const rotation = seed * Math.PI * 2

    // Sombra na água, deslocada para sugerir o sol vindo de cima à esquerda
    const shadow = new Sprite(softCircleTexture(128, 0.7))
    shadow.anchor.set(0.5)
    shadow.width = r * 2.3
    shadow.height = r * 1.9
    shadow.tint = PALETTE.waterAbyss
    shadow.alpha = 0.3
    shadow.position.set(size * 0.06, size * 0.09)
    node.addChild(shadow)

    const pad = new Graphics()

    // A folha é um disco com uma fatia removida — a marca da vitória régia
    const notch = 0.42
    const start = rotation + notch / 2
    const end = rotation + Math.PI * 2 - notch / 2

    pad.moveTo(0, 0)
    pad.arc(0, 0, r, start, end)
    pad.closePath()
    pad.fill({ color: mixColor(PALETTE.lily, PALETTE.lilyLight, seed * 0.5) })

    // Borda mais escura, levemente por dentro
    pad.moveTo(0, 0)
    pad.arc(0, 0, r, start, end)
    pad.closePath()
    pad.stroke({ width: Math.max(2, size * 0.035), color: PALETTE.lilyDark, alpha: 0.85 })

    // Veios saindo do centro
    const veins = 9
    for (let i = 0; i < veins; i++) {
      const a = start + ((end - start) * (i + 0.5)) / veins
      pad.moveTo(0, 0)
      pad.lineTo(Math.cos(a) * r * 0.86, Math.sin(a) * r * 0.86)
    }
    pad.stroke({ width: Math.max(1, size * 0.016), color: PALETTE.lilyVein, alpha: 0.6 })

    // Brilho úmido na parte de cima
    pad.ellipse(-r * 0.22, -r * 0.3, r * 0.42, r * 0.24)
    pad.fill({ color: PALETTE.lilyLight, alpha: 0.32 })

    node.addChild(pad)

    if (flowered) node.addChild(this.buildFlower(size))
    return node
  }

  /** A flor do alvo: precisa ser lida à distância como "é aqui". */
  private buildFlower(size: number): Container {
    const flower = new Container()
    const r = size * 0.2

    const glow = new Sprite(softCircleTexture(128, 0.85))
    glow.anchor.set(0.5)
    glow.width = size * 1.1
    glow.height = size * 1.1
    glow.tint = PALETTE.flowerLight
    glow.alpha = 0.28
    glow.blendMode = 'add'
    flower.addChild(glow)
    flower.label = 'glow'

    const petals = new Graphics()

    // Duas coroas de pétalas, a de baixo maior e mais escura
    for (const ring of [
      { count: 8, radius: r * 1.12, len: r * 0.98, color: PALETTE.flower, offset: 0 },
      { count: 6, radius: r * 0.72, len: r * 0.66, color: PALETTE.flowerLight, offset: 0.4 },
    ]) {
      for (let i = 0; i < ring.count; i++) {
        const a = (i / ring.count) * Math.PI * 2 + ring.offset
        const cx = Math.cos(a) * ring.radius * 0.45
        const cy = Math.sin(a) * ring.radius * 0.45
        petals.ellipse(cx, cy, ring.len * 0.52, ring.len * 0.3)
        petals.fill({ color: ring.color })
      }
    }

    petals.circle(0, 0, r * 0.42).fill({ color: PALETTE.flowerCore })
    petals.circle(0, 0, r * 0.42).stroke({ width: size * 0.018, color: 0xe8b86a, alpha: 0.7 })

    flower.addChild(petals)
    return flower
  }

  // ------------------------------------------------------------- obstáculos

  private buildRock(size: number, seed: number): Container {
    const node = new Container()
    const r = size * 0.38

    const shadow = new Sprite(softCircleTexture(128, 0.75))
    shadow.anchor.set(0.5)
    shadow.width = r * 2.5
    shadow.height = r * 2
    shadow.tint = PALETTE.waterAbyss
    shadow.alpha = 0.42
    shadow.position.set(size * 0.07, size * 0.11)
    node.addChild(shadow)

    // Polígono irregular: cada pedra tem sua própria silhueta
    const points: number[] = []
    const corners = 7
    for (let i = 0; i < corners; i++) {
      const a = (i / corners) * Math.PI * 2 + seed * 3
      const wobble = 0.72 + ((Math.sin(i * 12.9898 + seed * 78.233) + 1) / 2) * 0.42
      points.push(Math.cos(a) * r * wobble, Math.sin(a) * r * wobble * 0.92)
    }

    const rock = new Graphics()
    rock.poly(points).fill({ color: PALETTE.rock })
    rock.poly(points).stroke({ width: Math.max(2, size * 0.032), color: PALETTE.rockDark })

    // Face iluminada no alto à esquerda
    const lit = points.map((v, i) => (i % 2 === 0 ? v * 0.62 - r * 0.16 : v * 0.62 - r * 0.2))
    rock.poly(lit).fill({ color: PALETTE.rockLight, alpha: 0.75 })

    node.addChild(rock)
    return node
  }

  private buildLog(size: number, seed: number): Container {
    const node = new Container()
    const w = size * 0.92
    const h = size * 0.44
    const tilt = (seed - 0.5) * 0.35

    const shadow = new Sprite(softCircleTexture(128, 0.7))
    shadow.anchor.set(0.5)
    shadow.width = w * 1.15
    shadow.height = h * 1.5
    shadow.tint = PALETTE.waterAbyss
    shadow.alpha = 0.38
    shadow.position.set(size * 0.06, size * 0.1)
    node.addChild(shadow)

    const log = new Graphics()
    log.roundRect(-w / 2, -h / 2, w, h, h * 0.45).fill({ color: PALETTE.log })
    log
      .roundRect(-w / 2, -h / 2, w, h, h * 0.45)
      .stroke({ width: Math.max(2, size * 0.03), color: PALETTE.logDark })

    // Faixa clara no topo: o cilindro pegando luz
    log.roundRect(-w / 2 + h * 0.2, -h / 2 + h * 0.14, w - h * 0.4, h * 0.3, h * 0.15)
    log.fill({ color: PALETTE.logLight, alpha: 0.55 })

    // Anéis da ponta
    log.ellipse(-w / 2 + h * 0.3, 0, h * 0.2, h * 0.34).fill({ color: PALETTE.logDark })
    log.ellipse(-w / 2 + h * 0.3, 0, h * 0.1, h * 0.18).fill({ color: PALETTE.log })

    log.rotation = tilt
    node.addChild(log)
    return node
  }

  private buildReed(size: number, seed: number): Container {
    const node = new Container()
    const stalks = 4

    const reed = new Graphics()
    for (let i = 0; i < stalks; i++) {
      const offset = (i - (stalks - 1) / 2) * size * 0.16
      const lean = (seed - 0.5) * size * 0.2 + (i % 2 === 0 ? size * 0.05 : -size * 0.05)
      const height = size * (0.6 + ((i * 7 + seed * 31) % 10) / 34)

      reed.moveTo(offset, size * 0.42)
      reed.quadraticCurveTo(offset + lean * 0.5, size * 0.42 - height * 0.6, offset + lean, size * 0.42 - height)
      reed.stroke({
        width: Math.max(2, size * 0.055),
        color: i % 2 === 0 ? PALETTE.reed : PALETTE.reedDark,
        cap: 'round',
      })

      // Espiga na ponta
      reed.ellipse(offset + lean, size * 0.42 - height, size * 0.05, size * 0.1)
      reed.fill({ color: PALETTE.logDark, alpha: 0.85 })
    }

    node.addChild(reed)
    return node
  }

  // ---------------------------------------------------------------- semente

  private buildSeed(size: number): Container {
    const node = new Container()
    const r = size * 0.13

    const glow = new Sprite(softCircleTexture(128, 0.9))
    glow.anchor.set(0.5)
    glow.width = r * 6
    glow.height = r * 6
    glow.tint = PALETTE.star
    glow.alpha = 0.3
    glow.blendMode = 'add'
    node.addChild(glow)

    const seed = new Graphics()
    seed.circle(0, 0, r).fill({ color: PALETTE.star })
    seed.circle(0, 0, r).stroke({ width: size * 0.018, color: 0xd9a01f })
    seed.circle(-r * 0.3, -r * 0.34, r * 0.32).fill({ color: PALETTE.white, alpha: 0.85 })
    node.addChild(seed)

    return node
  }

  // ------------------------------------------------------------------ ciclo

  /** Remove a semente coletada com um pequeno pop. */
  popSeed(at: Vec2): void {
    const node = this.seedNodes.get(`${at.x},${at.y}`)
    if (!node) return
    this.seedNodes.delete(`${at.x},${at.y}`)

    const start = performance.now()
    const tick = () => {
      const t = Math.min(1, (performance.now() - start) / 280)
      node.scale.set(1 + t * 0.9)
      node.alpha = 1 - t
      node.y -= 0.6
      if (t < 1) requestAnimationFrame(tick)
      else node.destroy({ children: true })
    }
    requestAnimationFrame(tick)
  }

  /**
   * Balanço de repouso. Folhas e juncos se mexem de leve mesmo com o jogo
   * parado — água parada com folha parada lê como imagem congelada.
   */
  update(deltaMs: number): void {
    this.elapsed += deltaMs
    const t = this.elapsed / 1000

    for (const piece of this.pieces) {
      const wave = Math.sin(t * 1.1 + piece.phase)

      if (piece.kind === 'lily' || piece.kind === 'lilyFlower') {
        piece.node.y = piece.baseY + wave * 1.8
        piece.node.rotation = wave * 0.022
      } else if (piece.kind === 'reed') {
        piece.node.rotation = Math.sin(t * 1.7 + piece.phase) * 0.05
      } else if (piece.kind === 'log') {
        piece.node.y = piece.baseY + wave * 1.1
      } else {
        // sementes
        piece.node.y = piece.baseY + wave * 2.6
        piece.node.scale.set(1 + Math.sin(t * 2.4 + piece.phase) * 0.05)
      }
    }
  }

  destroy(): void {
    this.container.destroy({ children: true })
  }
}
