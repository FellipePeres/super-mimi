import { Container, Sprite, type Texture } from 'pixi.js'
import { PALETTE } from './palette'
import { foamTexture, ringTexture, softCircleTexture } from './textures'

interface Particle {
  sprite: Sprite
  vx: number
  vy: number
  life: number
  maxLife: number
  spin: number
  /** Multiplicador de tamanho ao fim da vida: >1 cresce, <1 encolhe. */
  growth: number
  baseSize: number
  fadeFrom: number
}

/**
 * Bolhas, espuma e respingos.
 *
 * Mantém um pool próprio em vez de criar Sprites a cada evento: numa fase com
 * `repeat(20)` a tartaruga solta centenas de partículas, e alocar tudo isso em
 * tempo de animação aparece como engasgo.
 */
export class ParticleLayer {
  readonly container = new Container()

  private active: Particle[] = []
  private pool: Sprite[] = []
  private ambientTimer = 0

  private readonly circle: Texture
  private readonly foam: Texture
  private readonly ring: Texture

  constructor(
    private width: number,
    private height: number,
  ) {
    this.circle = softCircleTexture(128, 0.6)
    this.foam = foamTexture(96)
    this.ring = ringTexture(128, 0.1)
    this.container.eventMode = 'none'
  }

  resize(width: number, height: number): void {
    this.width = width
    this.height = height
  }

  private take(texture: Texture): Sprite {
    const sprite = this.pool.pop() ?? new Sprite()
    sprite.texture = texture
    sprite.anchor.set(0.5)
    sprite.rotation = 0
    sprite.blendMode = 'normal'
    sprite.visible = true
    this.container.addChild(sprite)
    return sprite
  }

  private release(particle: Particle): void {
    particle.sprite.visible = false
    this.container.removeChild(particle.sprite)
    this.pool.push(particle.sprite)
  }

  private emit(config: {
    texture: Texture
    x: number
    y: number
    size: number
    tint: number
    alpha: number
    vx: number
    vy: number
    life: number
    spin?: number
    growth?: number
    additive?: boolean
  }): void {
    const sprite = this.take(config.texture)
    sprite.position.set(config.x, config.y)
    sprite.width = config.size
    sprite.height = config.size
    sprite.tint = config.tint
    sprite.alpha = config.alpha
    if (config.additive) sprite.blendMode = 'add'

    this.active.push({
      sprite,
      vx: config.vx,
      vy: config.vy,
      life: 0,
      maxLife: config.life,
      spin: config.spin ?? 0,
      growth: config.growth ?? 1,
      baseSize: config.size,
      fadeFrom: config.alpha,
    })
  }

  // ------------------------------------------------------------- emissores

  /** Bolhas de ar subindo — o efeito que diz "isto é debaixo d'água". */
  bubbles(x: number, y: number, count = 6, scale = 1): void {
    for (let i = 0; i < count; i++) {
      const size = (5 + Math.random() * 11) * scale
      this.emit({
        texture: Math.random() > 0.45 ? this.circle : this.ring,
        x: x + (Math.random() - 0.5) * 34 * scale,
        y: y + (Math.random() - 0.5) * 24 * scale,
        size,
        tint: PALETTE.waterFoam,
        alpha: 0.28 + Math.random() * 0.32,
        vx: (Math.random() - 0.5) * 12,
        vy: -14 - Math.random() * 26,
        life: 900 + Math.random() * 800,
        growth: 1.25,
      })
    }
  }

  /** Esteira de espuma deixada para trás pela braçada. */
  wake(x: number, y: number, dirX: number, dirY: number, scale = 1): void {
    for (let i = 0; i < 4; i++) {
      this.emit({
        texture: this.foam,
        x: x - dirX * 14 * scale + (Math.random() - 0.5) * 18 * scale,
        y: y - dirY * 14 * scale + (Math.random() - 0.5) * 18 * scale,
        size: (20 + Math.random() * 22) * scale,
        tint: PALETTE.waterFoam,
        alpha: 0.2 + Math.random() * 0.2,
        vx: -dirX * (16 + Math.random() * 20) + (Math.random() - 0.5) * 12,
        vy: -dirY * (16 + Math.random() * 20) + (Math.random() - 0.5) * 12,
        life: 620 + Math.random() * 420,
        spin: (Math.random() - 0.5) * 2,
        growth: 1.7,
      })
    }
  }

  /** Respingo da colisão: sai para os lados, não para cima. */
  splash(x: number, y: number, dirX: number, dirY: number, scale = 1): void {
    // Anel de impacto
    this.emit({
      texture: this.ring,
      x,
      y,
      size: 30 * scale,
      tint: PALETTE.waterFoam,
      alpha: 0.7,
      vx: 0,
      vy: 0,
      life: 480,
      growth: 3.4,
    })

    for (let i = 0; i < 12; i++) {
      const angle = Math.atan2(-dirY, -dirX) + (Math.random() - 0.5) * 2.4
      const speed = 60 + Math.random() * 130
      this.emit({
        texture: this.circle,
        x: x + dirX * 12 * scale,
        y: y + dirY * 12 * scale,
        size: (5 + Math.random() * 9) * scale,
        tint: PALETTE.waterFoam,
        alpha: 0.65,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 420 + Math.random() * 300,
        growth: 0.6,
      })
    }
  }

  /** Comemoração da vitória: pétalas e faíscas subindo em leque. */
  celebrate(x: number, y: number, scale = 1): void {
    const colors = [
      PALETTE.flower, PALETTE.flowerLight, PALETTE.star,
      PALETTE.lilyLight, PALETTE.waterFoam,
    ]

    this.emit({
      texture: this.ring,
      x,
      y,
      size: 40 * scale,
      tint: PALETTE.star,
      alpha: 0.85,
      vx: 0,
      vy: 0,
      life: 700,
      growth: 5,
      additive: true,
    })

    for (let i = 0; i < 46; i++) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 2.6
      const speed = 90 + Math.random() * 230
      this.emit({
        texture: Math.random() > 0.5 ? this.circle : this.foam,
        x: x + (Math.random() - 0.5) * 18,
        y: y + (Math.random() - 0.5) * 18,
        size: (7 + Math.random() * 15) * scale,
        tint: colors[Math.floor(Math.random() * colors.length)] as number,
        alpha: 0.95,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 900 + Math.random() * 700,
        spin: (Math.random() - 0.5) * 6,
        growth: 0.75,
      })
    }
  }

  /** Brilho de coleta da semente. */
  sparkle(x: number, y: number, scale = 1): void {
    for (let i = 0; i < 14; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 40 + Math.random() * 100
      this.emit({
        texture: this.circle,
        x,
        y,
        size: (4 + Math.random() * 8) * scale,
        tint: PALETTE.star,
        alpha: 0.9,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 30,
        life: 520 + Math.random() * 340,
        growth: 0.5,
        additive: true,
      })
    }
  }

  // ------------------------------------------------------------------ ciclo

  update(deltaMs: number): void {
    const dt = deltaMs / 1000

    // Bolhas espontâneas espalhadas pelo rio, para a cena nunca ficar estática
    this.ambientTimer += deltaMs
    if (this.ambientTimer > 420) {
      this.ambientTimer = 0
      if (this.width > 0 && this.height > 0) {
        this.bubbles(
          Math.random() * this.width,
          this.height * (0.25 + Math.random() * 0.75),
          1,
          0.55,
        )
      }
    }

    for (let i = this.active.length - 1; i >= 0; i--) {
      const p = this.active[i] as Particle
      p.life += deltaMs

      const t = p.life / p.maxLife
      if (t >= 1) {
        this.release(p)
        this.active.splice(i, 1)
        continue
      }

      p.sprite.x += p.vx * dt
      p.sprite.y += p.vy * dt
      p.sprite.rotation += p.spin * dt

      // Arrasto da água: as partículas perdem força rápido
      p.vx *= 1 - 1.6 * dt
      p.vy *= 1 - 1.6 * dt

      // Bolhas continuam empurradas para cima mesmo perdendo velocidade
      if (p.vy < 0) p.vy -= 12 * dt

      // Some acelerando no fim, em vez de piscar
      p.sprite.alpha = p.fadeFrom * (1 - t * t)

      const size = p.baseSize * (1 + (p.growth - 1) * t)
      p.sprite.width = size
      p.sprite.height = size
    }
  }

  clear(): void {
    for (const p of this.active) this.release(p)
    this.active = []
  }

  destroy(): void {
    this.clear()
    this.container.destroy({ children: true })
  }
}
