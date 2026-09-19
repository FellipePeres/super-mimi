import type { LevelSpec } from './schema'
import { WORLD_1 } from './world1'
import { WORLD_2 } from './world2'
import { WORLD_3 } from './world3'
import { WORLD_4 } from './world4'

export * from './schema'

export const LEVELS: LevelSpec[] = [...WORLD_1, ...WORLD_2, ...WORLD_3, ...WORLD_4]

export const LEVELS_BY_ID = new Map(LEVELS.map((level) => [level.id, level]))

export function getLevel(id: string): LevelSpec | undefined {
  return LEVELS_BY_ID.get(id)
}

export function levelsOfWorld(world: number): LevelSpec[] {
  return LEVELS.filter((level) => level.world === world)
}

/** Fase seguinte na ordem do currículo, ou `undefined` se foi a última. */
export function nextLevel(id: string): LevelSpec | undefined {
  const index = LEVELS.findIndex((level) => level.id === id)
  if (index === -1) return undefined
  return LEVELS[index + 1]
}

export const FIRST_LEVEL_ID = LEVELS[0]?.id ?? '1-1'
