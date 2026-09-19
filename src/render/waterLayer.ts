import { Container, DisplacementFilter, Sprite, TilingSprite } from 'pixi.js'
import { PALETTE } from './palette'
import { causticsTexture, depthGradientTexture, noiseTexture } from './textures'

/**
 * A água.
 *
 * Três camadas empilhadas fazem o rio parecer rio:
 *   1. gradiente de profundidade — a cor base, parada;
 *   2. duas camadas de caustics deslizando em velocidades e direções
 *      diferentes — é o cruzamento delas que lê como "luz na água";
 *   3. um `DisplacementFilter` sobre o conjunto, empurrado por ruído
 *      tileável que também desliza — é o que ondula tudo.
 *
 * Nenhuma delas depende do estado do jogo: a água se move sozinha, inclusive
 * com o jogo parado. É isso que separa uma tela viva de um print.
 */
export class WaterLayer {
  readonly container = new Container()

  private readonly base: Sprite
  private readonly causticsFar: TilingSprite
  private readonly causticsNear: TilingSprite
  private readonly displacement: Sprite
  private readonly filter: DisplacementFilter

  private elapsed = 0

  constructor(width: number, height: number) {
    // 1 — cor base por profundidade
    this.base = new Sprite(depthGradientTexture(512))
    this.base.width = width
    this.base.height = height
    this.container.addChild(this.base)

    // 2 — caustics: duas camadas com escalas diferentes evitam padrão óbvio
    const caustics = causticsTexture(512)
    caustics.source.wrapMode = 'repeat'

    this.causticsFar = new TilingSprite({ texture: caustics, width, height })
    this.causticsFar.tileScale.set(1.35)
    this.causticsFar.alpha = 0.1
    this.causticsFar.blendMode = 'add'
    this.causticsFar.tint = PALETTE.waterShallow
    this.container.addChild(this.causticsFar)

    this.causticsNear = new TilingSprite({ texture: caustics, width, height })
    this.causticsNear.tileScale.set(0.75)
    this.causticsNear.alpha = 0.14
    this.causticsNear.blendMode = 'add'
    this.causticsNear.tint = PALETTE.waterFoam
    this.container.addChild(this.causticsNear)

    // 3 — ondulação
    const noise = noiseTexture(256, 4)
    noise.source.wrapMode = 'repeat'

    this.displacement = new Sprite(noise)
    this.displacement.texture.source.wrapMode = 'repeat'
    this.displacement.scale.set(2.4)

    this.filter = new DisplacementFilter({
      sprite: this.displacement,
      scale: 14,
    })
    this.container.filters = [this.filter]
    this.container.addChild(this.displacement)
  }

  resize(width: number, height: number): void {
    this.base.width = width
    this.base.height = height
    this.causticsFar.width = width
    this.causticsFar.height = height
    this.causticsNear.width = width
    this.causticsNear.height = height
  }

  /**
   * As três camadas andam em direções diferentes de propósito: se andassem
   * juntas, o olho leria a água como uma imagem sendo arrastada.
   */
  update(deltaMs: number): void {
    this.elapsed += deltaMs
    const t = this.elapsed / 1000

    this.causticsFar.tilePosition.x = t * 7
    this.causticsFar.tilePosition.y = t * 4

    this.causticsNear.tilePosition.x = -t * 11
    this.causticsNear.tilePosition.y = t * 6

    this.displacement.x = Math.sin(t * 0.18) * 90 + t * 16
    this.displacement.y = Math.cos(t * 0.13) * 70 + t * 9

    // Respiração lenta da intensidade — evita ondulação metronômica
    this.filter.scale.x = 13 + Math.sin(t * 0.37) * 4
    this.filter.scale.y = 11 + Math.cos(t * 0.29) * 4
  }

  destroy(): void {
    this.container.filters = []
    this.container.destroy({ children: true })
  }
}
