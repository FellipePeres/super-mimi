/// <reference types="vite/client" />
import { Assets, Container, Graphics, Rectangle, Sprite, Texture } from 'pixi.js'
import type { Direction } from '../engine/types'
import { PALETTE } from './palette'
import { softCircleTexture } from './textures'
import { easeOutBack, linear, tween, type TweenHandle } from './tween'

export type CharacterId = 'mimi' | 'pipe'

export interface CharacterLook {
  shell: number
  shellDark: number
  belly: number
  skin: number
  skinDark: number
  accessory: 'bow' | 'glasses'
}

export const CHARACTER_LOOKS: Record<CharacterId, CharacterLook> = {
  mimi: {
    shell: PALETTE.mimiShell,
    shellDark: PALETTE.mimiShellDark,
    belly: PALETTE.mimiBelly,
    skin: 0xb8d96a,
    skinDark: 0x94b84c,
    accessory: 'bow',
  },
  pipe: {
    shell: PALETTE.pipeShell,
    shellDark: PALETTE.pipeShellDark,
    belly: PALETTE.pipeBelly,
    skin: 0x87a86b,
    skinDark: 0x6b8a52,
    accessory: 'glasses',
  },
}

/** Rotação do desenho vetorial por direção. A pose base olha para leste. */
const FACING_ROTATION: Record<Direction, number> = {
  east: 0,
  south: Math.PI / 2,
  west: Math.PI,
  north: -Math.PI / 2,
}

/**
 * A tartaruga.
 *
 * Duas fontes de arte, escolhidas em tempo de carga:
 *
 *  - **PNG** em `public/sprites/` (mimi-south/north/east + portrait). Como a
 *    arte é 3/4 vista de cima, cada direção precisa da sua imagem; `west` é o
 *    espelho de `east`. Se a imagem vier com proporção ~2:1, ela é tratada
 *    como tira de 2 frames e a remada alterna entre eles.
 *  - **Placeholder vetorial**, desenhado aqui em Graphics, usado enquanto a
 *    arte não existe. Como é top-down de verdade, uma única pose rotacionada
 *    cobre as quatro direções — e os membros são peças separadas, então as
 *    perninhas e os bracinhos remam de verdade.
 *
 * O resto do jogo não sabe qual das duas está ativa.
 */
export class TurtleSprite {
  readonly container = new Container()

  private readonly shadow: Sprite
  private readonly art = new Container()

  /** Peças do placeholder; vazias quando o PNG está em uso. */
  private limbs: Container[] = []
  private vectorRig: Container | null = null

  /** Sprite do PNG; nulo quando o placeholder está em uso. */
  private photoSprite: Sprite | null = null
  private textures: Partial<Record<Direction, Texture[]>> = {}

  private facing: Direction = 'east'
  private look: CharacterLook
  private elapsed = 0
  private paddle = 0
  private frameIndex = 0

  constructor(
    private character: CharacterId,
    private size: number,
  ) {
    this.look = CHARACTER_LOOKS[character]

    this.shadow = new Sprite(softCircleTexture(128, 0.8))
    this.shadow.anchor.set(0.5)
    this.shadow.tint = PALETTE.shadow
    this.shadow.alpha = 0.32
    this.container.addChild(this.shadow)

    this.container.addChild(this.art)

    this.buildVector()
    this.applySize()
    this.setFacing('east')
  }

  // ------------------------------------------------------------------- arte

  /**
   * Tenta trocar o placeholder pelos PNGs. Falha em silêncio de propósito: o
   * jogo precisa funcionar inteiro antes de a arte existir.
   */
  async loadArt(): Promise<boolean> {
    const dirs: Direction[] = ['south', 'north', 'east']
    const loaded: Partial<Record<Direction, Texture[]>> = {}

    for (const dir of dirs) {
      // BASE_URL, e não `/`: em GitHub Pages o app vive num subdiretório
      const url = `${import.meta.env.BASE_URL}sprites/${this.character}-${dir}.png`
      try {
        const texture = await Assets.load<Texture>(url)
        if (!texture) return false
        loaded[dir] = sliceFrames(texture)
      } catch {
        return false
      }
    }

    this.textures = loaded
    // `west` reaproveita `east`; o espelho é aplicado na escala
    this.textures.west = loaded.east

    this.vectorRig?.destroy({ children: true })
    this.vectorRig = null
    this.limbs = []
    this.art.removeChildren()

    this.photoSprite = new Sprite(loaded.south?.[0])
    this.photoSprite.anchor.set(0.5)
    this.art.addChild(this.photoSprite)

    this.applySize()
    this.setFacing(this.facing)
    return true
  }

  get usingPhotoArt(): boolean {
    return this.photoSprite !== null
  }

  setCharacter(character: CharacterId): void {
    this.character = character
    this.look = CHARACTER_LOOKS[character]
    this.photoSprite?.destroy()
    this.photoSprite = null
    this.textures = {}
    this.art.removeChildren()
    this.buildVector()
    this.applySize()
    this.setFacing(this.facing)
  }

  setSize(size: number): void {
    this.size = size
    this.applySize()
  }

  private applySize(): void {
    this.shadow.width = this.size * 0.95
    this.shadow.height = this.size * 0.7
    this.shadow.position.set(this.size * 0.05, this.size * 0.2)

    if (this.photoSprite) {
      this.photoSprite.width = this.size * 1.12
      this.photoSprite.height = this.size * 1.12
    } else if (this.vectorRig) {
      this.vectorRig.scale.set(this.size / 100)
    }
  }

  // -------------------------------------------------- placeholder vetorial

  /**
   * Tartaruga cartoon vista de cima, apontando para leste, desenhada numa
   * caixa de 100×100 e escalada depois.
   *
   * Ordem de empilhamento importa: membros e cabeça vão por baixo, o casco
   * por cima — é assim que uma tartaruga se lê de cima.
   */
  private buildVector(): void {
    const rig = new Container()
    const { shell, shellDark, belly, skin, skinDark, accessory } = this.look

    // ---- membros: cada um é um Container com pivô na junta, para remar
    const limbSpecs: Array<{ x: number; y: number; angle: number; phase: number }> = [
      { x: 23, y: -24, angle: -0.55, phase: 0 },        // dianteiro esquerdo
      { x: 23, y: 24, angle: 0.55, phase: Math.PI },    // dianteiro direito
      { x: -24, y: -24, angle: -2.35, phase: Math.PI }, // traseiro esquerdo
      { x: -24, y: 24, angle: 2.35, phase: 0 },         // traseiro direito
    ]

    this.limbs = []
    for (const spec of limbSpecs) {
      const joint = new Container()
      joint.position.set(spec.x, spec.y)
      joint.rotation = spec.angle
      ;(joint as Container & { basePhase: number; baseAngle: number }).basePhase = spec.phase
      ;(joint as Container & { basePhase: number; baseAngle: number }).baseAngle = spec.angle

      const limb = new Graphics()
      // Braço: uma cápsula saindo da junta. Curto de propósito — membros
      // longos demais roubavam a leitura do casco, que é o que identifica
      // a tartaruga à distância de um tile.
      limb.roundRect(0, -6, 21, 12, 6).fill({ color: skin })
      limb.roundRect(0, -6, 21, 12, 6).stroke({ width: 3, color: PALETTE.outline, alpha: 0.7 })
      // Pata na ponta, um pouco mais larga
      limb.ellipse(22, 0, 8.5, 8).fill({ color: skinDark })
      limb.ellipse(22, 0, 8.5, 8).stroke({ width: 3, color: PALETTE.outline, alpha: 0.7 })
      // Dedinhos
      for (let i = -1; i <= 1; i++) {
        limb.circle(27, i * 4.2, 2.3).fill({ color: skin })
      }

      joint.addChild(limb)
      rig.addChild(joint)
      this.limbs.push(joint)
    }

    // ---- cauda
    const tail = new Graphics()
    tail.poly([-38, 0, -49, -6, -49, 6]).fill({ color: skinDark })
    tail.poly([-38, 0, -49, -6, -49, 6]).stroke({ width: 3, color: PALETTE.outline, alpha: 0.6 })
    rig.addChild(tail)

    // ---- cabeça
    const head = new Container()
    head.position.set(41, 0)

    const headShape = new Graphics()
    headShape.ellipse(0, 0, 22, 19).fill({ color: skin })
    headShape.ellipse(0, 0, 22, 19).stroke({ width: 4, color: PALETTE.outline, alpha: 0.75 })
    head.addChild(headShape)

    // Olhos: vistos de cima, ficam nas laterais do focinho
    const eyes = new Graphics()
    for (const side of [-1, 1]) {
      eyes.ellipse(7, side * 8.5, 5.4, 6).fill({ color: PALETTE.white })
      eyes.ellipse(7, side * 8.5, 5.4, 6).stroke({ width: 2, color: PALETTE.outline, alpha: 0.7 })
      eyes.circle(8.6, side * 8.5, 3).fill({ color: PALETTE.outline })
      eyes.circle(9.8, side * 8.5 - 1.2, 1.2).fill({ color: PALETTE.white })
    }
    head.addChild(eyes)

    // Sorriso
    const smile = new Graphics()
    smile.moveTo(15, -4).quadraticCurveTo(18.5, 0, 15, 4)
    smile.stroke({ width: 2.4, color: PALETTE.outline, alpha: 0.75, cap: 'round' })
    head.addChild(smile)

    if (accessory === 'bow') {
      head.addChild(this.buildBow())
    } else {
      head.addChild(this.buildGlasses())
    }

    rig.addChild(head)

    // ---- casco, por cima de tudo
    const shellShape = new Graphics()
    shellShape.ellipse(0, 0, 40, 34).fill({ color: shell })
    shellShape.ellipse(0, 0, 40, 34).stroke({ width: 4, color: PALETTE.outline, alpha: 0.75 })

    // Borda do casco (o "aro" mais claro que contorna as placas)
    shellShape.ellipse(0, 0, 33, 27).stroke({ width: 3, color: shellDark, alpha: 0.9 })

    // Placas hexagonais: uma central e seis ao redor
    const plate = (cx: number, cy: number, r: number) => {
      const pts: number[] = []
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + Math.PI / 6
        pts.push(cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.86)
      }
      shellShape.poly(pts).fill({ color: belly, alpha: 0.45 })
      shellShape.poly(pts).stroke({ width: 2, color: shellDark, alpha: 0.75 })
    }

    plate(0, 0, 11)
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2
      plate(Math.cos(a) * 20, Math.sin(a) * 17, 8)
    }

    // Brilho úmido no alto à esquerda, na direção da luz
    shellShape.ellipse(-12, -13, 15, 8).fill({ color: PALETTE.white, alpha: 0.22 })

    rig.addChild(shellShape)

    this.vectorRig = rig
    this.art.addChild(rig)
  }

  /** Laço da Mimi: fica no alto da cabeça e precisa ser lido de qualquer ângulo. */
  private buildBow(): Graphics {
    const bow = new Graphics()
    const cx = -6
    const cy = -15

    for (const side of [-1, 1]) {
      bow.ellipse(cx, cy + side * 9, 8, 7).fill({ color: PALETTE.mimiBow })
      bow.ellipse(cx, cy + side * 9, 8, 7).stroke({ width: 2.4, color: PALETTE.mimiBowDark })
      bow.ellipse(cx, cy + side * 9, 3.4, 3).fill({ color: PALETTE.mimiBowDark, alpha: 0.5 })
    }

    bow.circle(cx, cy, 4.6).fill({ color: PALETTE.flowerLight })
    bow.circle(cx, cy, 4.6).stroke({ width: 2.2, color: PALETTE.mimiBowDark })
    return bow
  }

  /** Óculos do Pipe: escuros, com o reflexo azul que dá a leitura de vidro. */
  private buildGlasses(): Graphics {
    const glasses = new Graphics()

    for (const side of [-1, 1]) {
      glasses.roundRect(2, side * 8.5 - 6.5, 12, 13, 5).fill({ color: PALETTE.pipeGlasses })
      glasses
        .roundRect(2, side * 8.5 - 6.5, 12, 13, 5)
        .stroke({ width: 2.2, color: PALETTE.outline })
      // Reflexo na diagonal
      glasses.ellipse(5.5, side * 8.5 - 2.5, 3.2, 2).fill({ color: 0x6fc4e8, alpha: 0.8 })
    }

    // Ponte entre as lentes
    glasses.roundRect(4, -3, 8, 6, 3).fill({ color: PALETTE.pipeGlasses })
    // Hastes, que continuam visíveis de costas
    for (const side of [-1, 1]) {
      glasses.roundRect(-14, side * 13 - 2, 18, 4, 2).fill({ color: PALETTE.pipeGlasses })
    }
    return glasses
  }

  // -------------------------------------------------------------- direção

  setFacing(direction: Direction): void {
    this.facing = direction

    if (this.photoSprite) {
      const frames = this.textures[direction]
      if (frames?.length) {
        this.photoSprite.texture = frames[this.frameIndex % frames.length] as Texture
      }
      // `west` é `east` espelhado
      this.photoSprite.scale.x = Math.abs(this.photoSprite.scale.x) * (direction === 'west' ? -1 : 1)
      this.art.rotation = 0
      return
    }

    this.art.rotation = FACING_ROTATION[direction]
  }

  get currentFacing(): Direction {
    return this.facing
  }

  /**
   * Vira com animação.
   *
   * No rig vetorial a tartaruga gira de verdade, sempre pelo caminho mais
   * curto — girar 270° para ir de norte a leste ficaria cômico. Com PNG não
   * há rotação possível, então a troca de pose é mascarada por um squash,
   * que é o truque clássico para esconder um corte de sprite.
   */
  turnTo(direction: Direction, duration: number): TweenHandle {
    if (this.photoSprite) {
      let swapped = false
      return tween({
        duration,
        easing: linear,
        onUpdate: (t) => {
          const squash = Math.sin(t * Math.PI)
          this.art.scale.x = 1 - squash * 0.55
          this.art.scale.y = 1 + squash * 0.12

          if (!swapped && t >= 0.5) {
            swapped = true
            this.setFacing(direction)
          }
        },
        onComplete: () => {
          this.setFacing(direction)
          this.art.scale.set(1)
        },
      })
    }

    const from = this.art.rotation
    const target = FACING_ROTATION[direction]

    // Caminho mais curto no círculo
    let diff = target - from
    while (diff > Math.PI) diff -= Math.PI * 2
    while (diff < -Math.PI) diff += Math.PI * 2

    this.facing = direction

    return tween({
      duration,
      easing: easeOutBack,
      onUpdate: (t) => {
        this.art.rotation = from + diff * t
        // Inclina para dentro da curva, como quem faz a volta nadando
        this.setTilt(Math.sin(t * Math.PI) * Math.sign(diff) * 0.16)
      },
      onComplete: () => {
        this.art.rotation = target
        this.setTilt(0)
      },
    })
  }

  // ------------------------------------------------------------ animação

  /** Intensidade da remada: 0 parado, 1 nadando. */
  setPaddle(amount: number): void {
    this.paddle = Math.max(0, Math.min(1, amount))
  }

  /**
   * Respiração e remada, chamadas a cada quadro.
   *
   * Mesmo parada a tartaruga sobe e desce e mexe os membros de leve — é o que
   * a faz parecer viva boiando, e não colada na água.
   */
  update(deltaMs: number): void {
    this.elapsed += deltaMs
    const t = this.elapsed / 1000

    // Flutuação: a arte sobe e desce, a sombra responde ao contrário
    const bob = Math.sin(t * 2.1) * (this.size * 0.022)
    this.art.y = bob
    this.shadow.alpha = 0.32 - bob / (this.size * 0.5) * 0.12
    this.shadow.scale.set(1 - bob / (this.size * 0.6) * 0.08)

    if (this.photoSprite) {
      // Sem membros separados: o balanço faz o trabalho de "estar nadando"
      this.art.rotation =
        (this.facing === 'west' ? -1 : 1) * Math.sin(t * 3.4) * 0.03 * (0.4 + this.paddle)

      const frames = this.textures[this.facing]
      if (frames && frames.length > 1) {
        // Troca de frame no ritmo da remada
        const next = Math.floor(t * (3 + this.paddle * 5)) % frames.length
        if (next !== this.frameIndex) {
          this.frameIndex = next
          this.photoSprite.texture = frames[next] as Texture
        }
      }
      return
    }

    // Remada do rig vetorial: diagonais alternadas, como um quadrúpede
    const speed = 3.2 + this.paddle * 5.5
    const amplitude = 0.14 + this.paddle * 0.4

    for (const joint of this.limbs) {
      const meta = joint as Container & { basePhase: number; baseAngle: number }
      joint.rotation = meta.baseAngle + Math.sin(t * speed + meta.basePhase) * amplitude
    }
  }

  /** Squash & stretch no eixo do movimento, no impulso de cada braçada. */
  applyStretch(progress: number, strength = 0.14): void {
    const pulse = Math.sin(progress * Math.PI)
    this.art.scale.x = 1 + pulse * strength
    this.art.scale.y = 1 - pulse * strength * 0.65
  }

  resetStretch(): void {
    this.art.scale.set(1)
  }

  /** Inclinação lateral, usada ao virar e ao ser empurrado pela correnteza. */
  setTilt(amount: number): void {
    if (this.photoSprite) return
    this.art.skew.y = amount
  }

  setPosition(x: number, y: number): void {
    this.container.position.set(x, y)
  }

  get position(): { x: number; y: number } {
    return { x: this.container.x, y: this.container.y }
  }

  destroy(): void {
    this.container.destroy({ children: true })
  }
}

/**
 * Aceita o "upgrade de 2 frames" descrito no guia de arte: se a imagem for
 * cerca de duas vezes mais larga que alta, ela é uma tira de dois quadros e
 * vira duas texturas. Caso contrário, é uma pose única.
 */
function sliceFrames(texture: Texture): Texture[] {
  const { width, height } = texture
  const ratio = width / height

  if (ratio < 1.6) return [texture]

  const frameCount = Math.round(ratio)
  const frameWidth = width / frameCount
  const frames: Texture[] = []

  for (let i = 0; i < frameCount; i++) {
    frames.push(
      new Texture({
        source: texture.source,
        frame: new Rectangle(i * frameWidth, 0, frameWidth, height),
      }),
    )
  }
  return frames
}
