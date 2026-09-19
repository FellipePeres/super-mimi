import type { Vec2 } from '../engine/types'

/**
 * Geometria da grade na tela.
 *
 * Este é o ÚNICO lugar do código que inverte o eixo Y. O mundo inteiro pensa
 * em cartesiano (Y para cima); a tela pensa em pixels (Y para baixo). Toda a
 * tradução acontece aqui para que nenhuma outra parte precise saber disso.
 */
export interface GridGeometry {
  tileSize: number
  /** Canto superior esquerdo da grade, em pixels. */
  originX: number
  originY: number
  cols: number
  rows: number
}

/** Centro do tile (x, y) cartesiano, em pixels de tela. */
export function tileCenter(geo: GridGeometry, x: number, y: number): Vec2 {
  return {
    x: geo.originX + x * geo.tileSize + geo.tileSize / 2,
    y: geo.originY + (geo.rows - 1 - y) * geo.tileSize + geo.tileSize / 2,
  }
}

/** Canto superior esquerdo do tile, em pixels. */
export function tileTopLeft(geo: GridGeometry, x: number, y: number): Vec2 {
  return {
    x: geo.originX + x * geo.tileSize,
    y: geo.originY + (geo.rows - 1 - y) * geo.tileSize,
  }
}

/** Pixel da tela para coordenada cartesiana. Usado pelo pincel do Modo Livre. */
export function screenToTile(geo: GridGeometry, px: number, py: number): Vec2 {
  return {
    x: Math.floor((px - geo.originX) / geo.tileSize),
    y: geo.rows - 1 - Math.floor((py - geo.originY) / geo.tileSize),
  }
}

/**
 * Calcula a geometria que encaixa a grade na área disponível, centralizada,
 * deixando margem para as réguas numeradas dos eixos.
 */
export function fitGrid(
  areaWidth: number,
  areaHeight: number,
  cols: number,
  rows: number,
  options: { gutter?: number; maxTile?: number; minTile?: number } = {},
): GridGeometry {
  const gutter = options.gutter ?? 34
  // Teto alto de propósito: as primeiras fases têm grades pequenas (6×5) e,
  // com um teto baixo, sobrava metade da tela de água vazia em volta.
  const maxTile = options.maxTile ?? 150
  const minTile = options.minTile ?? 28

  const usableW = Math.max(0, areaWidth - gutter * 2)
  const usableH = Math.max(0, areaHeight - gutter * 2)

  const tileSize = Math.max(
    minTile,
    Math.min(maxTile, Math.floor(Math.min(usableW / cols, usableH / rows))),
  )

  const gridW = tileSize * cols
  const gridH = tileSize * rows

  return {
    tileSize,
    originX: Math.round((areaWidth - gridW) / 2),
    originY: Math.round((areaHeight - gridH) / 2),
    cols,
    rows,
  }
}

/** Hash estável por casa: a mesma pedra sempre tem o mesmo formato. */
export function tileSeed(x: number, y: number): number {
  const h = Math.sin(x * 127.1 + y * 311.7) * 43758.5453
  return h - Math.floor(h)
}
