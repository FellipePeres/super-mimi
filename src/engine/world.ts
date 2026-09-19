import {
  DIRECTION_VECTORS,
  isBlocking,
  TILE_SENSOR_NAMES,
  turnDirection,
  vectorToDirection,
  type Direction,
  type GameEvent,
  type TileType,
  type Vec2,
  type WorldState,
} from './types'

export interface WorldConfig {
  width: number
  height: number
  /**
   * Desenho do mapa, uma string por linha, **de cima para baixo** (como se lê).
   * O construtor inverte para o eixo Y cartesiano, então quem escreve uma fase
   * desenha o rio do jeito que ele aparece na tela.
   *
   *   `.` água   `~` correnteza   `#` pedra   `=` tronco
   *   `|` junco  `o` vitória régia   `*` vitória régia florida (alvo)
   */
  map: string[]
  start: Vec2
  facing?: Direction
  seeds?: Vec2[]
  /** Se omitido, usa a posição da `*` no mapa. Nulo explícito = Modo Livre. */
  goal?: Vec2 | null
  currents?: Array<{ x: number; y: number; dir: Direction }>
}

const CHAR_TO_TILE: Record<string, TileType> = {
  '.': 'water',
  ' ': 'water',
  '~': 'current',
  '#': 'rock',
  '=': 'log',
  '|': 'reed',
  o: 'lily',
  '*': 'lilyFlower',
}

const key = (x: number, y: number) => `${x},${y}`

/**
 * Regras do jogo. Não sabe nada sobre desenho nem sobre a linguagem: recebe
 * ações, devolve eventos. É essa fronteira que deixa o motor testável sem DOM.
 */
export class World {
  state: WorldState
  private readonly config: WorldConfig

  constructor(config: WorldConfig) {
    this.config = config
    this.state = World.build(config)
  }

  private static build(config: WorldConfig): WorldState {
    const { width, height, map } = config

    // O mapa vem de cima para baixo; o grid guarda y=0 embaixo.
    const rows = [...map].reverse()
    const tiles: TileType[][] = []
    let goalFromMap: Vec2 | null = null

    for (let y = 0; y < height; y++) {
      const row: TileType[] = []
      const line = rows[y] ?? ''
      for (let x = 0; x < width; x++) {
        const char = line[x] ?? '.'
        const tile = CHAR_TO_TILE[char] ?? 'water'
        if (tile === 'lilyFlower') goalFromMap = { x, y }
        row.push(tile)
      }
      tiles.push(row)
    }

    const currents = new Map<string, Direction>()
    for (const c of config.currents ?? []) {
      currents.set(key(c.x, c.y), c.dir)
    }

    return {
      width,
      height,
      tiles,
      currents,
      turtle: {
        pos: { ...config.start },
        facing: config.facing ?? 'east',
      },
      seeds: (config.seeds ?? []).map((s) => ({ ...s })),
      collected: 0,
      goal: config.goal === undefined ? goalFromMap : config.goal,
      won: false,
      steps: 0,
    }
  }

  reset(): void {
    this.state = World.build(this.config)
  }

  // ------------------------------------------------------------- consultas

  inBounds(x: number, y: number): boolean {
    return x >= 0 && x < this.state.width && y >= 0 && y < this.state.height
  }

  tileAt(x: number, y: number): TileType {
    if (!this.inBounds(x, y)) return 'edge'
    return this.state.tiles[y]?.[x] ?? 'edge'
  }

  /** Nome em inglês que os sensores devolvem ao aluno. */
  sensorNameAt(x: number, y: number): string {
    return TILE_SENSOR_NAMES[this.tileAt(x, y)]
  }

  canEnter(x: number, y: number): boolean {
    return !isBlocking(this.tileAt(x, y))
  }

  /** O que a tartaruga vê à frente, à esquerda ou à direita dela. */
  look(side: 'front' | 'left' | 'right'): string {
    const { pos, facing } = this.state.turtle
    const dir =
      side === 'front' ? facing : turnDirection(facing, side === 'left' ? 'left' : 'right')
    const v = DIRECTION_VECTORS[dir]
    return this.sensorNameAt(pos.x + v.x, pos.y + v.y)
  }

  onLily(): boolean {
    const t = this.tileAt(this.state.turtle.pos.x, this.state.turtle.pos.y)
    return t === 'lily' || t === 'lilyFlower'
  }

  seedHere(): number {
    const { pos } = this.state.turtle
    return this.state.seeds.findIndex((s) => s.x === pos.x && s.y === pos.y)
  }

  // ---------------------------------------------------------------- ações

  /**
   * Um passo de uma casa. Devolve o evento de movimento ou de bloqueio.
   * Movimentos maiores são fatiados em passos unitários pelo interpretador,
   * para que cada casa percorrida vire um quadro de animação.
   */
  stepOnce(dir: Direction, line: number): GameEvent {
    const { pos } = this.state.turtle
    const v = DIRECTION_VECTORS[dir]
    const target = { x: pos.x + v.x, y: pos.y + v.y }

    this.state.turtle.facing = dir

    if (!this.canEnter(target.x, target.y)) {
      return {
        type: 'blocked',
        at: { ...pos },
        against: target,
        obstacle: this.tileAt(target.x, target.y),
        line,
      }
    }

    const from = { ...pos }
    this.state.turtle.pos = target
    this.state.steps++

    return { type: 'swim', from, to: { ...target }, facing: dir, line }
  }

  /** Empurrão da correnteza, se a casa de chegada tiver uma. */
  currentPush(line: number): GameEvent | null {
    const { pos } = this.state.turtle
    const dir = this.state.currents.get(key(pos.x, pos.y))
    if (!dir) return null

    const v = DIRECTION_VECTORS[dir]
    const target = { x: pos.x + v.x, y: pos.y + v.y }
    if (!this.canEnter(target.x, target.y)) return null

    const from = { ...pos }
    this.state.turtle.pos = target
    return { type: 'swim', from, to: { ...target }, facing: this.state.turtle.facing, line }
  }

  turn(side: 'left' | 'right', line: number): GameEvent {
    const from = this.state.turtle.facing
    const to = turnDirection(from, side)
    this.state.turtle.facing = to
    return { type: 'turn', from, to, line }
  }

  face(dir: Direction, line: number): GameEvent {
    const from = this.state.turtle.facing
    this.state.turtle.facing = dir
    return { type: 'turn', from, to: dir, line }
  }

  /** Mergulha para passar por baixo de um tronco. */
  dive(line: number): GameEvent {
    const { pos, facing } = this.state.turtle
    const v = DIRECTION_VECTORS[facing]
    const over = { x: pos.x + v.x, y: pos.y + v.y }
    const beyond = { x: pos.x + v.x * 2, y: pos.y + v.y * 2 }

    const canDive =
      this.tileAt(over.x, over.y) === 'log' && this.canEnter(beyond.x, beyond.y)

    if (!canDive) {
      return {
        type: 'blocked',
        at: { ...pos },
        against: over,
        obstacle: this.tileAt(over.x, over.y),
        line,
      }
    }

    const from = { ...pos }
    this.state.turtle.pos = beyond
    this.state.steps++
    return { type: 'dive', from, to: { ...beyond }, line }
  }

  collect(line: number): GameEvent {
    const idx = this.seedHere()
    const { pos } = this.state.turtle
    if (idx === -1) {
      return { type: 'rest', at: { ...pos }, line }
    }
    this.state.seeds.splice(idx, 1)
    this.state.collected++
    return { type: 'collect', at: { ...pos }, remaining: this.state.seeds.length, line }
  }

  hop(line: number): GameEvent {
    const { pos } = this.state.turtle
    if (!this.onLily()) {
      return { type: 'rest', at: { ...pos }, line }
    }
    return { type: 'hop', at: { ...pos }, line }
  }

  rest(line: number): GameEvent {
    return { type: 'rest', at: { ...this.state.turtle.pos }, line }
  }

  /** Chamado após cada ação: a fase termina ao pisar na vitória régia florida. */
  checkWin(line: number): GameEvent | null {
    const { goal, turtle, won } = this.state
    if (won || !goal) return null
    if (turtle.pos.x === goal.x && turtle.pos.y === goal.y) {
      this.state.won = true
      return { type: 'win', at: { ...turtle.pos }, line }
    }
    return null
  }

  // ------------------------------------------------------------ utilidades

  /** Usado pelo Modo Livre para o usuário pintar o mapa. */
  setTile(x: number, y: number, tile: TileType): void {
    if (!this.inBounds(x, y)) return
    const row = this.state.tiles[y]
    if (row) row[x] = tile
  }

  directionOf(dx: number, dy: number): Direction | null {
    return vectorToDirection(dx, dy)
  }
}
