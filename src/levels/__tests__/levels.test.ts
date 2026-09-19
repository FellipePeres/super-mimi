import { describe, expect, it } from 'vitest'
import { LEVELS, levelToWorldConfig } from '../index'
import { World } from '../../engine/world'
import { isBlocking, type Vec2 } from '../../engine/types'

/**
 * Validação estrutural das fases.
 *
 * Fase quebrada é um bug invisível: o aluno trava achando que o erro é dele.
 * Estes testes garantem que todo mapa é consistente e que a flor é realmente
 * alcançável a partir da posição inicial — verificado por busca em largura,
 * não pelo olho de quem desenhou.
 */

/** Busca em largura pelas casas atingíveis a pé, sem mergulho. */
function reachable(world: World, from: Vec2): Set<string> {
  const seen = new Set<string>([`${from.x},${from.y}`])
  const queue: Vec2[] = [from]

  while (queue.length > 0) {
    const current = queue.shift() as Vec2
    const neighbours: Vec2[] = [
      { x: current.x + 1, y: current.y },
      { x: current.x - 1, y: current.y },
      { x: current.x, y: current.y + 1 },
      { x: current.x, y: current.y - 1 },
    ]

    for (const next of neighbours) {
      const key = `${next.x},${next.y}`
      if (seen.has(key)) continue
      if (!world.inBounds(next.x, next.y)) continue
      if (isBlocking(world.tileAt(next.x, next.y))) continue
      seen.add(key)
      queue.push(next)
    }
  }

  return seen
}

describe('catálogo de fases', () => {
  it('tem 24 fases em 4 mundos', () => {
    expect(LEVELS).toHaveLength(24)
    for (const world of [1, 2, 3, 4]) {
      expect(LEVELS.filter((l) => l.world === world)).toHaveLength(6)
    }
  })

  it('não repete id', () => {
    const ids = LEVELS.map((l) => l.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe.each(LEVELS.map((level) => [level.id, level] as const))(
  'fase %s',
  (_id, level) => {
    it('tem o mapa com as dimensões declaradas', () => {
      expect(level.map).toHaveLength(level.height)
      for (const row of level.map) {
        expect(row).toHaveLength(level.width)
      }
    })

    it('usa só caracteres conhecidos', () => {
      for (const row of level.map) {
        expect(row).toMatch(/^[.~#=|o*]+$/)
      }
    })

    it('tem exatamente uma flor de chegada', () => {
      const flowers = level.map.join('').split('').filter((c) => c === '*')
      expect(flowers).toHaveLength(1)
    })

    it('começa numa casa onde dá para estar', () => {
      const world = new World(levelToWorldConfig(level))
      const { x, y } = level.start

      expect(world.inBounds(x, y)).toBe(true)
      expect(isBlocking(world.tileAt(x, y))).toBe(false)
    })

    it('tem a flor alcançável a partir do início', () => {
      const world = new World(levelToWorldConfig(level))
      const goal = world.state.goal

      expect(goal).not.toBeNull()
      const reach = reachable(world, level.start)
      expect(reach.has(`${goal?.x},${goal?.y}`)).toBe(true)
    })

    it('tem todas as sementes alcançáveis', () => {
      if (!level.seeds?.length) return
      const world = new World(levelToWorldConfig(level))
      const reach = reachable(world, level.start)

      for (const seed of level.seeds) {
        expect(
          reach.has(`${seed.x},${seed.y}`),
          `semente (${seed.x}, ${seed.y}) está isolada`,
        ).toBe(true)
      }
    })

    it('tem as correntezas em casas de água navegável', () => {
      if (!level.currents?.length) return
      const world = new World(levelToWorldConfig(level))

      for (const current of level.currents) {
        expect(world.inBounds(current.x, current.y)).toBe(true)
        expect(isBlocking(world.tileAt(current.x, current.y))).toBe(false)
      }
    })

    it('tem textos de apoio preenchidos', () => {
      expect(level.title.length).toBeGreaterThan(0)
      expect(level.goal.length).toBeGreaterThan(0)
      expect(level.briefing.length).toBeGreaterThanOrEqual(2)
      expect(level.hints).toHaveLength(2)
      expect(level.allowed.length).toBeGreaterThan(0)
      expect(level.parLines).toBeGreaterThan(0)
    })
  },
)
