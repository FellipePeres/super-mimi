import { Container, Graphics, Text, TextStyle } from 'pixi.js'
import { PALETTE } from './palette'
import { tileCenter, tileTopLeft, type GridGeometry } from './coords'

/**
 * A grade e os eixos numerados.
 *
 * Isto não é enfeite: é o material didático do jogo. O aluno escreve
 * `swim(2, 1)` e precisa conseguir contar duas casas para a direita e uma
 * para cima olhando para a tela. Por isso os eixos X e Y são destacados,
 * numerados e rotulados — e por isso Y cresce para cima.
 */
export class CartesianGrid {
  readonly container = new Container()

  private readonly lines = new Graphics()
  private readonly axes = new Graphics()
  private readonly highlight = new Graphics()
  private readonly labels = new Container()

  private geo: GridGeometry

  constructor(geo: GridGeometry) {
    this.geo = geo
    this.container.addChild(this.lines, this.highlight, this.axes, this.labels)
    this.draw()
  }

  setGeometry(geo: GridGeometry): void {
    this.geo = geo
    this.draw()
  }

  /**
   * Os números ficam sobre água que vai de turquesa claro a azul escuro, e
   * ondula. Só a cor não garante leitura, então eles levam sombra: branco com
   * contorno escuro funciona em qualquer profundidade.
   */
  private labelStyle(size: number, bold: boolean): TextStyle {
    return new TextStyle({
      fontFamily: 'Fredoka, Nunito, sans-serif',
      fontSize: size,
      fontWeight: bold ? '700' : '600',
      fill: PALETTE.waterFoam,
      dropShadow: {
        color: 0x04212b,
        alpha: 0.85,
        blur: 3,
        distance: 1,
        angle: Math.PI / 2,
      },
    })
  }

  private draw(): void {
    const { tileSize, originX, originY, cols, rows } = this.geo
    const width = tileSize * cols
    const height = tileSize * rows

    this.lines.clear()
    this.axes.clear()
    this.labels.removeChildren().forEach((c) => c.destroy())

    // ---- grade interna, bem discreta: orienta sem competir com a água
    for (let c = 0; c <= cols; c++) {
      const px = originX + c * tileSize
      this.lines.moveTo(px, originY).lineTo(px, originY + height)
    }
    for (let r = 0; r <= rows; r++) {
      const py = originY + r * tileSize
      this.lines.moveTo(originX, py).lineTo(originX + width, py)
    }
    this.lines.stroke({ width: 1, color: PALETTE.waterFoam, alpha: 0.13 })

    // ---- moldura do rio
    this.axes
      .roundRect(originX - 2, originY - 2, width + 4, height + 4, 10)
      .stroke({ width: 2, color: PALETTE.waterFoam, alpha: 0.3 })

    // ---- eixos X e Y, ancorados na origem (0, 0) no canto inferior esquerdo
    const axisY = originY + height
    this.axes.moveTo(originX, axisY).lineTo(originX + width, axisY)
    this.axes.moveTo(originX, axisY).lineTo(originX, originY)
    this.axes.stroke({ width: 3, color: PALETTE.waterFoam, alpha: 0.55 })

    const arrow = Math.max(7, tileSize * 0.12)

    // Ponta do eixo X, apontando para a direita
    this.axes
      .poly([
        originX + width + arrow * 1.4, axisY,
        originX + width - arrow * 0.2, axisY - arrow * 0.62,
        originX + width - arrow * 0.2, axisY + arrow * 0.62,
      ])
      .fill({ color: PALETTE.waterFoam, alpha: 0.7 })

    // Ponta do eixo Y, apontando para cima
    this.axes
      .poly([
        originX, originY - arrow * 1.4,
        originX - arrow * 0.62, originY + arrow * 0.2,
        originX + arrow * 0.62, originY + arrow * 0.2,
      ])
      .fill({ color: PALETTE.waterFoam, alpha: 0.7 })

    // ---- números das réguas
    const fontSize = Math.max(10, Math.min(15, tileSize * 0.24))

    for (let x = 0; x < cols; x++) {
      const center = tileCenter(this.geo, x, 0)
      const label = new Text({ text: String(x), style: this.labelStyle(fontSize, false) })
      label.anchor.set(0.5, 0)
      label.position.set(center.x, axisY + 9)
      label.alpha = 0.95
      this.labels.addChild(label)
    }

    for (let y = 0; y < rows; y++) {
      const center = tileCenter(this.geo, 0, y)
      const label = new Text({ text: String(y), style: this.labelStyle(fontSize, false) })
      label.anchor.set(1, 0.5)
      label.position.set(originX - 10, center.y)
      label.alpha = 0.95
      this.labels.addChild(label)
    }

    // ---- nomes dos eixos
    const axisFont = Math.max(13, Math.min(19, tileSize * 0.3))

    const labelX = new Text({ text: 'X', style: this.labelStyle(axisFont, true) })
    labelX.anchor.set(0, 0.5)
    labelX.position.set(originX + width + arrow * 2.2, axisY)
    this.labels.addChild(labelX)

    const labelY = new Text({ text: 'Y', style: this.labelStyle(axisFont, true) })
    labelY.anchor.set(0.5, 1)
    labelY.position.set(originX, originY - arrow * 2.2)
    this.labels.addChild(labelY)
  }

  /**
   * Destaca a casa onde a tartaruga está, com as coordenadas reforçadas na
   * régua. É o que fecha o laço entre `swim(2, 1)` e "estou em (2, 1)".
   */
  setCursor(x: number, y: number): void {
    const { tileSize } = this.geo
    const corner = tileTopLeft(this.geo, x, y)

    this.highlight.clear()

    // Cantinhos em vez de moldura fechada: marcam a casa sem desenhar uma
    // caixa em volta da tartaruga, que competiria com ela.
    const inset = 2
    const arm = tileSize * 0.26
    const left = corner.x + inset
    const right = corner.x + tileSize - inset
    const top = corner.y + inset
    const bottom = corner.y + tileSize - inset

    this.highlight.moveTo(left, top + arm).lineTo(left, top).lineTo(left + arm, top)
    this.highlight.moveTo(right - arm, top).lineTo(right, top).lineTo(right, top + arm)
    this.highlight.moveTo(right, bottom - arm).lineTo(right, bottom).lineTo(right - arm, bottom)
    this.highlight.moveTo(left + arm, bottom).lineTo(left, bottom).lineTo(left, bottom - arm)
    this.highlight.stroke({ width: 2.5, color: PALETTE.action, alpha: 0.75, cap: 'round' })

    // Guias finas até os eixos, para o olho contar as casas
    const center = tileCenter(this.geo, x, y)
    const axisY = this.geo.originY + tileSize * this.geo.rows

    this.highlight.moveTo(center.x, center.y).lineTo(center.x, axisY)
    this.highlight.moveTo(center.x, center.y).lineTo(this.geo.originX, center.y)
    this.highlight.stroke({ width: 1.5, color: PALETTE.action, alpha: 0.28 })
  }

  destroy(): void {
    this.container.destroy({ children: true })
  }
}
