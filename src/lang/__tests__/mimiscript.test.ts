import { describe, expect, it } from 'vitest'
import { parse } from '../parser'
import { interpret } from '../interpreter'
import { MimiError } from '../errors'
import { World, type WorldConfig } from '../../engine/world'
import type { GameEvent, Vec2 } from '../../engine/types'

// ---------------------------------------------------------------- utilidades

/** Rio 5x5 de água livre, tartaruga em (0,0) olhando para leste. */
function openWorld(overrides: Partial<WorldConfig> = {}): World {
  return new World({
    width: 5,
    height: 5,
    map: ['.....', '.....', '.....', '.....', '.....'],
    start: { x: 0, y: 0 },
    facing: 'east',
    goal: null,
    ...overrides,
  })
}

function run(source: string, world: World): GameEvent[] {
  const events: GameEvent[] = []
  for (const event of interpret(parse(source), world)) events.push(event)
  return events
}

function posOf(world: World): Vec2 {
  return world.state.turtle.pos
}

/** Captura o MimiError lançado, para poder inspecionar linha e dica. */
function catchError(source: string, world = openWorld()): MimiError {
  try {
    run(source, world)
  } catch (e) {
    if (e instanceof MimiError) return e
    throw e
  }
  throw new Error('esperava um MimiError, mas o código rodou sem erro')
}

// ------------------------------------------------------------------- sintaxe

describe('sintaxe', () => {
  it('lê comentários de linha e de bloco', () => {
    const world = openWorld()
    run('// sobe\nswim(1, 0) /* e para */', world)
    expect(posOf(world)).toEqual({ x: 1, y: 0 })
  })

  it('aceita ponto e vírgula opcional', () => {
    const world = openWorld()
    run('swim(1, 0); swim(1, 0);', world)
    expect(posOf(world)).toEqual({ x: 2, y: 0 })
  })

  it('respeita a precedência dos operadores', () => {
    const world = openWorld()
    run('swim(1 + 2 * 1, 0)', world)
    expect(posOf(world).x).toBe(3)
  })

  it('respeita parênteses contra a precedência', () => {
    const world = openWorld()
    run('swim((1 + 1) * 2, 0)', world)
    expect(posOf(world).x).toBe(4)
  })
})

// ---------------------------------------------------------------- movimento

describe('movimento', () => {
  it('swim move no eixo X e depois no Y, uma casa por evento', () => {
    const world = openWorld()
    const events = run('swim(2, 1)', world)
    const swims = events.filter((e) => e.type === 'swim')

    expect(swims).toHaveLength(3)
    expect(posOf(world)).toEqual({ x: 2, y: 1 })
  })

  it('Y cresce para cima, como no plano cartesiano', () => {
    const world = openWorld({ start: { x: 2, y: 2 } })
    run('swim(0, 1)', world)
    expect(posOf(world)).toEqual({ x: 2, y: 3 })
  })

  it('aceita deslocamento negativo', () => {
    const world = openWorld({ start: { x: 3, y: 3 } })
    run('swim(-1, -2)', world)
    expect(posOf(world)).toEqual({ x: 2, y: 1 })
  })

  it('swimTo usa coordenada absoluta', () => {
    const world = openWorld({ start: { x: 0, y: 0 } })
    run('swimTo(3, 2)', world)
    expect(posOf(world)).toEqual({ x: 3, y: 2 })
  })

  it('turn gira no sentido horário', () => {
    const world = openWorld()
    run('turn("right")', world)
    expect(world.state.turtle.facing).toBe('south')
  })

  it('forward anda na direção que a tartaruga encara', () => {
    const world = openWorld()
    run('face("north") forward(2)', world)
    expect(posOf(world)).toEqual({ x: 0, y: 2 })
  })

  it('para ao bater numa pedra, sem interromper o programa', () => {
    const world = openWorld({
      map: ['.....', '.....', '.....', '.....', '.#...'],
      start: { x: 0, y: 0 },
    })
    const events = run('swim(3, 0) swim(0, 1)', world)

    expect(events.some((e) => e.type === 'blocked')).toBe(true)
    // Parou em x=0 (pedra em x=1), mas o segundo comando ainda rodou
    expect(posOf(world)).toEqual({ x: 0, y: 1 })
  })

  it('trata sair do rio como erro, porque nunca é intenção', () => {
    const error = catchError('swim(0, -1)')
    expect(error.phase).toBe('execução')
    expect(error.message).toContain('sair do rio')
  })
})

// ------------------------------------------------------------------ laços

describe('laços', () => {
  it('repeat executa o bloco n vezes', () => {
    const world = openWorld()
    run('repeat(3) { swim(1, 0) }', world)
    expect(posOf(world).x).toBe(3)
  })

  it('repeat(0) não executa nada', () => {
    const world = openWorld()
    run('repeat(0) { swim(1, 0) }', world)
    expect(posOf(world).x).toBe(0)
  })

  it('while roda enquanto a condição for verdadeira', () => {
    const world = openWorld()
    run('while (x < 4) { swim(1, 0) }', world)
    expect(posOf(world).x).toBe(4)
  })

  it('for com contador funciona', () => {
    const world = openWorld()
    run('for (let i = 0; i < 3; i = i + 1) { swim(1, 0) }', world)
    expect(posOf(world).x).toBe(3)
  })

  it('interrompe laço infinito com mensagem clara em vez de travar', () => {
    const error = catchError('while (true) { rest() }')
    expect(error.phase).toBe('execução')
    expect(error.hint).toContain('while')
  })
})

// ------------------------------------------------------------- condicionais

describe('condicionais', () => {
  it('escolhe o ramo do if quando a condição é verdadeira', () => {
    const world = openWorld()
    run('if (x == 0) { swim(2, 0) } else { swim(0, 2) }', world)
    expect(posOf(world)).toEqual({ x: 2, y: 0 })
  })

  it('escolhe o else quando a condição é falsa', () => {
    const world = openWorld()
    run('if (x == 99) { swim(2, 0) } else { swim(0, 2) }', world)
    expect(posOf(world)).toEqual({ x: 0, y: 2 })
  })

  it('encadeia else if', () => {
    const world = openWorld({ start: { x: 2, y: 0 } })
    run(
      'if (x == 0) { swim(0, 1) } else if (x == 2) { swim(0, 2) } else { swim(0, 3) }',
      world,
    )
    expect(posOf(world).y).toBe(2)
  })

  it('desvia de obstáculo usando canSwim', () => {
    const world = openWorld({
      map: ['.....', '.....', '.....', '.....', '.#...'],
      start: { x: 0, y: 0 },
    })
    run('if (canSwim(1, 0)) { swim(1, 0) } else { swim(0, 1) }', world)
    expect(posOf(world)).toEqual({ x: 0, y: 1 })
  })

  it('curto-circuito do && não executa o lado direito', () => {
    const world = openWorld()
    run('if (false && canSwim(1, 0)) { swim(3, 0) }', world)
    expect(posOf(world).x).toBe(0)
  })
})

// ------------------------------------------------------- variáveis e funções

describe('variáveis e funções', () => {
  it('guarda e atualiza uma variável', () => {
    const world = openWorld()
    run('let n = 1\nn = n + 2\nswim(n, 0)', world)
    expect(posOf(world).x).toBe(3)
  })

  it('declara e chama uma função', () => {
    const world = openWorld()
    run('function ziguezague() { swim(1, 0) swim(0, 1) }\nziguezague()', world)
    expect(posOf(world)).toEqual({ x: 1, y: 1 })
  })

  it('passa parâmetros para a função', () => {
    const world = openWorld()
    run('function andar(n) { swim(n, 0) }\nandar(3)', world)
    expect(posOf(world).x).toBe(3)
  })

  it('devolve valor com return', () => {
    const world = openWorld()
    run('function dobro(n) { return n * 2 }\nswim(dobro(2), 0)', world)
    expect(posOf(world).x).toBe(4)
  })

  it('enxerga função declarada depois do uso', () => {
    const world = openWorld()
    run('avancar()\nfunction avancar() { swim(2, 0) }', world)
    expect(posOf(world).x).toBe(2)
  })

  it('o escopo do bloco não vaza para fora', () => {
    const error = catchError('if (true) { let secreto = 1 }\nswim(secreto, 0)')
    expect(error.message).toContain('secreto')
  })
})

// -------------------------------------------------------------- coletáveis

describe('objetivo e coletáveis', () => {
  it('vence ao chegar na vitória régia florida', () => {
    const world = new World({
      width: 5,
      height: 5,
      map: ['.....', '.....', '.....', '.....', '..*..'],
      start: { x: 0, y: 0 },
    })
    const events = run('swim(2, 0)', world)

    expect(events.some((e) => e.type === 'win')).toBe(true)
    expect(world.state.won).toBe(true)
  })

  it('collect recolhe a semente da casa atual', () => {
    const world = openWorld({ seeds: [{ x: 1, y: 0 }] })
    run('swim(1, 0) collect()', world)
    expect(world.state.collected).toBe(1)
    expect(world.state.seeds).toHaveLength(0)
  })
})

// ------------------------------------------------------- erros de sintaxe

describe('erros são didáticos', () => {
  it('aponta a chave que ficou aberta', () => {
    const error = catchError('if (x > 1) {\n  swim(1, 0)')
    expect(error.phase).toBe('sintaxe')
    expect(error.line).toBe(1)
    expect(error.hint).toContain('{')
  })

  it('avisa quando faltam parênteses na condição', () => {
    const error = catchError('if x > 1 { swim(1, 0) }')
    expect(error.message).toContain('parênteses')
  })

  it('explica a diferença entre = e ==', () => {
    const error = catchError('if (x = 1) { swim(1, 0) }')
    expect(error.hint).toContain('==')
  })

  it('sugere o nome certo quando a caixa está errada', () => {
    const error = catchError('Swim(1, 0)')
    expect(error.hint).toContain('swim')
  })

  it('cobra o número certo de argumentos', () => {
    const error = catchError('swim(1)')
    expect(error.message).toContain('2')
  })

  it('exige declarar a variável antes de usar', () => {
    const error = catchError('n = 5')
    expect(error.hint).toContain('let')
  })

  it('reclama de texto sem aspas de fechamento', () => {
    const error = catchError('turn("right)')
    expect(error.phase).toBe('sintaxe')
  })

  it('explica & sozinho', () => {
    const error = catchError('if (true & false) { rest() }')
    expect(error.hint).toContain('&&')
  })

  it('aponta a linha correta em programa de várias linhas', () => {
    const error = catchError('swim(1, 0)\nswim(1, 0)\nzzz()')
    expect(error.line).toBe(3)
  })
})
