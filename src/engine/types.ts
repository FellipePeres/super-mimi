/**
 * Convenção de coordenadas
 * ------------------------
 * X cresce para a DIREITA e Y cresce para CIMA — plano cartesiano de verdade,
 * igual ao da aula de matemática. `swim(0, 1)` sobe na tela.
 *
 * O renderizador é o único lugar que inverte Y para coordenada de tela. Se
 * essa regra vazar para o resto do código, o aluno vê um eixo Y que mente.
 */

export interface Vec2 {
  x: number
  y: number
}

export type Direction = 'north' | 'south' | 'east' | 'west'

/** Vetor unitário de cada direção, no espaço cartesiano do jogo. */
export const DIRECTION_VECTORS: Record<Direction, Vec2> = {
  north: { x: 0, y: 1 },
  south: { x: 0, y: -1 },
  east: { x: 1, y: 0 },
  west: { x: -1, y: 0 },
}

/** Nomes em PT-BR para mensagens de console e tooltips. */
export const DIRECTION_LABELS: Record<Direction, string> = {
  north: 'norte (cima)',
  south: 'sul (baixo)',
  east: 'leste (direita)',
  west: 'oeste (esquerda)',
}

export const CLOCKWISE: Direction[] = ['north', 'east', 'south', 'west']

export function turnDirection(facing: Direction, side: 'left' | 'right'): Direction {
  const i = CLOCKWISE.indexOf(facing)
  const next = side === 'right' ? (i + 1) % 4 : (i + 3) % 4
  return CLOCKWISE[next] as Direction
}

export function vectorToDirection(dx: number, dy: number): Direction | null {
  if (dx > 0 && dy === 0) return 'east'
  if (dx < 0 && dy === 0) return 'west'
  if (dy > 0 && dx === 0) return 'north'
  if (dy < 0 && dx === 0) return 'south'
  return null
}

// ------------------------------------------------------------------ terreno

export type TileType =
  /** Água livre: dá para nadar. */
  | 'water'
  /** Correnteza: nada normalmente, mas empurra na direção `flow`. */
  | 'current'
  /** Pedra: bloqueia. */
  | 'rock'
  /** Tronco: bloqueia na superfície, mas dá para passar com `dive()`. */
  | 'log'
  /** Junco de margem: bloqueia, decorativo nas bordas. */
  | 'reed'
  /** Vitória régia: dá para nadar por cima e é onde se faz `hop()`. */
  | 'lily'
  /** Vitória régia florida: o alvo final da fase. */
  | 'lilyFlower'
  /** Fora do mapa. Nunca aparece no grid, só como resposta de sensor. */
  | 'edge'

/** Nomes que o sensor devolve ao aluno — em inglês, como as palavras-chave. */
export const TILE_SENSOR_NAMES: Record<TileType, string> = {
  water: 'water',
  current: 'current',
  rock: 'rock',
  log: 'log',
  reed: 'reed',
  lily: 'lily',
  lilyFlower: 'lily',
  edge: 'edge',
}

export const TILE_LABELS_PT: Record<TileType, string> = {
  water: 'água',
  current: 'correnteza',
  rock: 'pedra',
  log: 'tronco',
  reed: 'junco',
  lily: 'vitória régia',
  lilyFlower: 'vitória régia florida',
  edge: 'a beira do mapa',
}

export function isBlocking(tile: TileType): boolean {
  return tile === 'rock' || tile === 'reed' || tile === 'log' || tile === 'edge'
}

// ------------------------------------------------------------------- eventos

/**
 * O interpretador nunca desenha. Ele emite estes eventos e o runner os consome
 * no ritmo da animação — é isso que dá play/pause/passo-a-passo de graça.
 */
export type GameEvent =
  | { type: 'swim'; from: Vec2; to: Vec2; facing: Direction; line: number }
  | { type: 'blocked'; at: Vec2; against: Vec2; obstacle: TileType; line: number }
  | { type: 'turn'; from: Direction; to: Direction; line: number }
  | { type: 'dive'; from: Vec2; to: Vec2; line: number }
  | { type: 'collect'; at: Vec2; remaining: number; line: number }
  | { type: 'hop'; at: Vec2; line: number }
  | { type: 'rest'; at: Vec2; line: number }
  | { type: 'say'; text: string; line: number }
  | { type: 'win'; at: Vec2; line: number }

/** Estado vivo do mundo. O renderizador lê isto, nunca escreve. */
export interface WorldState {
  width: number
  height: number
  /** Indexado por [y][x], com y=0 na LINHA DE BAIXO (cartesiano). */
  tiles: TileType[][]
  /** Direção do empurrão de cada tile `current`, na chave `"x,y"`. */
  currents: Map<string, Direction>
  turtle: { pos: Vec2; facing: Direction }
  /** Sementes coletáveis, para a terceira estrela. */
  seeds: Vec2[]
  collected: number
  /** Onde a fase é vencida. Vazio no Modo Livre. */
  goal: Vec2 | null
  won: boolean
  steps: number
}
