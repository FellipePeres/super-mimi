import { describe, expect, it } from 'vitest'
import { LEVELS, getLevel, levelToWorldConfig, countCodeLines } from '../index'
import { World } from '../../engine/world'
import { parse } from '../../lang/parser'
import { interpret } from '../../lang/interpreter'
import { COMMANDS_BY_ID } from '../../lang/commands'
import type { GameEvent } from '../../engine/types'

/**
 * A segunda dica de cada fase é a solução mostrada ao aluno quando ele trava —
 * e é ela que roda aqui.
 *
 * Amarrar o teste à dica, em vez de manter uma cópia separada, garante que o
 * código exibido na tela sempre vence de verdade. Se alguém mexer num mapa e a
 * solução parar de funcionar, isto quebra antes de chegar no aluno.
 */

interface Outcome {
  won: boolean
  seedsLeft: number
  events: GameEvent[]
}

/** O código da segunda dica: a solução que a fase mostra ao aluno. */
function solutionOf(levelId: string): string {
  const level = getLevel(levelId)
  if (!level) throw new Error(`fase ${levelId} não existe`)
  return level.hints[1].code
}

function solve(levelId: string): Outcome {
  const level = getLevel(levelId)
  if (!level) throw new Error(`fase ${levelId} não existe`)

  const source = solutionOf(levelId)

  const world = new World(levelToWorldConfig(level))
  const events: GameEvent[] = []

  for (const event of interpret(parse(source), world)) events.push(event)

  return { won: world.state.won, seedsLeft: world.state.seeds.length, events }
}

/** Nomes usados na solução que precisam estar liberados na fase. */
function commandsUsed(source: string): string[] {
  const names = new Set<string>()
  for (const match of source.matchAll(/\b([A-Za-z_][A-Za-z0-9_]*)\b/g)) {
    const name = match[1] as string
    if (COMMANDS_BY_ID.has(name)) names.add(name)
  }
  return [...names]
}

const ids = LEVELS.map((level) => level.id)

describe('soluções mostradas ao aluno', () => {
  it('cobrem todas as 24 fases', () => {
    expect(ids).toHaveLength(24)
  })

  it('não deixam nenhuma dica em branco', () => {
    for (const level of LEVELS) {
      expect(level.hints, `fase ${level.id}`).toHaveLength(2)
      for (const hint of level.hints) {
        expect(hint.text.length, `texto da dica em ${level.id}`).toBeGreaterThan(0)
        expect(hint.code.length, `código da dica em ${level.id}`).toBeGreaterThan(0)
      }
    }
  })

  /**
   * A primeira dica é esqueleto: mostra a forma com lacunas. Se ela não tiver
   * nenhum `?`, está entregando a resposta cedo demais — e aí as duas dicas
   * viram a mesma coisa.
   */
  it('mantêm a primeira dica como esqueleto, não como resposta', () => {
    for (const level of LEVELS) {
      expect(level.hints[0].code, `fase ${level.id}`).toContain('?')
      expect(level.hints[0].code, `fase ${level.id}`).not.toBe(level.hints[1].code)
    }
  })

  it('não deixam lacunas na segunda dica', () => {
    for (const level of LEVELS) {
      expect(level.hints[1].code, `fase ${level.id}`).not.toContain('?')
    }
  })
})

describe.each(ids.map((id) => [id] as const))('fase %s', (id) => {
  it('vence a fase', () => {
    const outcome = solve(id)
    expect(outcome.won, `a fase ${id} não foi concluída`).toBe(true)
  })

  it('dispara o evento de vitória exatamente uma vez', () => {
    const outcome = solve(id)
    expect(outcome.events.filter((e) => e.type === 'win')).toHaveLength(1)
  })

  it('coleta todas as sementes, quando há', () => {
    const outcome = solve(id)
    expect(outcome.seedsLeft, `sobraram sementes na fase ${id}`).toBe(0)
  })

  it('cabe no limite de linhas da segunda estrela', () => {
    const level = getLevel(id)
    expect(countCodeLines(solutionOf(id))).toBeLessThanOrEqual(level?.parLines ?? 0)
  })

  it('usa apenas comandos liberados na fase', () => {
    const level = getLevel(id)
    const allowed = new Set(level?.allowed ?? [])
    const used = commandsUsed(solutionOf(id))

    const forbidden = used.filter((name) => !allowed.has(name))
    expect(forbidden, `fase ${id} usa comando não liberado`).toEqual([])
  })
})
