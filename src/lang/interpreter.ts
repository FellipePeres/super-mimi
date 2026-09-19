import type {
  Block, Expr, FunctionDecl, Program, Stmt,
} from './ast'
import { runtimeError, HINTS, MimiError } from './errors'
import type { World } from '../engine/world'
import {
  DIRECTION_LABELS,
  TILE_LABELS_PT,
  type Direction,
  type GameEvent,
} from '../engine/types'

export type MimiValue = number | string | boolean | null

/** Teto de operações. Um `while` sem saída bate aqui em vez de travar a aba. */
const MAX_OPERATIONS = 200_000
/** Teto de ações animáveis, para o aluno não esperar minutos por um engano. */
const MAX_ACTIONS = 3_000

/** Sinal interno de `return` — nunca escapa para a UI. */
class ReturnSignal {
  constructor(readonly value: MimiValue) {}
}

class Scope {
  private readonly vars = new Map<string, MimiValue>()

  constructor(private readonly parent: Scope | null = null) {}

  has(name: string): boolean {
    return this.vars.has(name) || (this.parent?.has(name) ?? false)
  }

  get(name: string): MimiValue | undefined {
    if (this.vars.has(name)) return this.vars.get(name)
    return this.parent?.get(name)
  }

  declare(name: string, value: MimiValue): void {
    this.vars.set(name, value)
  }

  /** Atribui na declaração mais próxima; devolve false se a variável não existe. */
  set(name: string, value: MimiValue): boolean {
    if (this.vars.has(name)) {
      this.vars.set(name, value)
      return true
    }
    return this.parent?.set(name, value) ?? false
  }
}

/** Sensores lidos sem parênteses, como se fossem variáveis do mundo. */
const BARE_SENSORS = ['x', 'y', 'front', 'left', 'right', 'steps'] as const

/** Comandos que movem ou agem. Usado só para mensagens de erro. */
const ACTION_NAMES = [
  'swim', 'swimTo', 'forward', 'turn', 'face',
  'dive', 'collect', 'hop', 'rest', 'say',
]

const SENSOR_NAMES = ['canSwim', 'onLily', 'random', 'abs']

const DIRECTION_WORDS: Record<string, Direction> = {
  north: 'north',
  south: 'south',
  east: 'east',
  west: 'west',
  up: 'north',
  down: 'south',
}

export interface RunOptions {
  /** Chamado quando o programa usa `say(...)`. */
  onSay?: (text: string) => void
}

/**
 * Executa o programa como um generator de eventos.
 *
 * O interpretador nunca toca no desenho: quem consome os eventos decide o
 * ritmo. É isso que permite play, pause, passo-a-passo e troca de velocidade
 * sem nenhum código extra aqui dentro.
 */
export function* interpret(
  program: Program,
  world: World,
  options: RunOptions = {},
): Generator<GameEvent, void, undefined> {
  const globals = new Scope()
  const functions = new Map<string, FunctionDecl>()
  let operations = 0
  let actions = 0

  // ---------------------------------------------------------------- guardas

  const tick = (node: { line: number; col: number }) => {
    if (++operations > MAX_OPERATIONS) {
      throw runtimeError(
        node,
        'seu programa rodou tempo demais e foi interrompido',
        HINTS.infiniteLoop,
      )
    }
  }

  const countAction = (node: { line: number; col: number }) => {
    if (++actions > MAX_ACTIONS) {
      throw runtimeError(
        node,
        `a Mimi já fez ${MAX_ACTIONS} movimentos e o programa foi interrompido`,
        'Isso quase sempre é um laço que nunca termina. ' + HINTS.infiniteLoop,
      )
    }
  }

  // -------------------------------------------------------- conversões

  const asNumber = (
    value: MimiValue,
    node: { line: number; col: number },
    what: string,
  ): number => {
    if (typeof value === 'number' && Number.isFinite(value)) return value
    throw runtimeError(
      node,
      `${what} precisa ser um número, mas recebi ${describeValue(value)}`,
      HINTS.numberExpected,
    )
  }

  const asInt = (
    value: MimiValue,
    node: { line: number; col: number },
    what: string,
  ): number => Math.trunc(asNumber(value, node, what))

  const truthy = (value: MimiValue): boolean => {
    if (typeof value === 'boolean') return value
    if (typeof value === 'number') return value !== 0
    if (typeof value === 'string') return value.length > 0
    return false
  }

  // ------------------------------------------------------------- expressões

  function* evalExpr(node: Expr, scope: Scope): Generator<GameEvent, MimiValue, undefined> {
    tick(node)

    switch (node.kind) {
      case 'Number':
        return node.value
      case 'String':
        return node.value
      case 'Bool':
        return node.value

      case 'Identifier': {
        if (scope.has(node.name)) return scope.get(node.name) ?? null
        const sensor = readBareSensor(node.name)
        if (sensor !== undefined) return sensor
        throw runtimeError(
          node,
          `não conheço \`${node.name}\``,
          scope.has(node.name.toLowerCase())
            ? 'Confira maiúsculas e minúsculas — para a linguagem são letras diferentes.'
            : HINTS.declareFirst,
        )
      }

      case 'Unary': {
        const value = yield* evalExpr(node.arg, scope)
        if (node.op === '-') return -asNumber(value, node, 'o valor depois do sinal `-`')
        return !truthy(value)
      }

      case 'Logical': {
        const left = yield* evalExpr(node.left, scope)
        // Curto-circuito: `canSwim(1,0) && swim(1,0)` não deve nadar se bloqueado
        if (node.op === '&&' && !truthy(left)) return false
        if (node.op === '||' && truthy(left)) return true
        return truthy(yield* evalExpr(node.right, scope))
      }

      case 'Binary': {
        const left = yield* evalExpr(node.left, scope)
        const right = yield* evalExpr(node.right, scope)
        return applyBinary(node.op, left, right, node)
      }

      case 'Call':
        return yield* callFunction(node.callee, node, scope)
    }
  }

  const applyBinary = (
    op: string,
    left: MimiValue,
    right: MimiValue,
    node: { line: number; col: number },
  ): MimiValue => {
    // Comparações valem para qualquer tipo
    if (op === '==') return left === right
    if (op === '!=') return left !== right

    // `+` também junta textos, que é o esperado por quem vem de outras linguagens
    if (op === '+' && (typeof left === 'string' || typeof right === 'string')) {
      return String(left) + String(right)
    }

    const a = asNumber(left, node, `o valor à esquerda de \`${op}\``)
    const b = asNumber(right, node, `o valor à direita de \`${op}\``)

    switch (op) {
      case '+': return a + b
      case '-': return a - b
      case '*': return a * b
      case '/':
        if (b === 0) {
          throw runtimeError(
            node,
            'tentei dividir por zero',
            'Dividir por zero não tem resultado. Confira o valor do lado direito da `/`.',
          )
        }
        return a / b
      case '%':
        if (b === 0) {
          throw runtimeError(
            node,
            'tentei tirar o resto de uma divisão por zero',
            'O número à direita do `%` não pode ser zero.',
          )
        }
        return a % b
      case '<': return a < b
      case '>': return a > b
      case '<=': return a <= b
      case '>=': return a >= b
      default:
        throw runtimeError(node, `não sei usar o operador \`${op}\``, HINTS.unknownCommand)
    }
  }

  const readBareSensor = (name: string): MimiValue | undefined => {
    switch (name) {
      case 'x': return world.state.turtle.pos.x
      case 'y': return world.state.turtle.pos.y
      case 'steps': return world.state.steps
      case 'front': return world.look('front')
      case 'left': return world.look('left')
      case 'right': return world.look('right')
      default: return undefined
    }
  }

  // ---------------------------------------------------------------- chamadas

  function* callFunction(
    name: string,
    node: { line: number; col: number; args: Expr[] },
    scope: Scope,
  ): Generator<GameEvent, MimiValue, undefined> {
    // Função declarada pelo aluno tem prioridade sobre nada — builtins são fixos
    const userFn = functions.get(name)
    if (userFn) {
      const args: MimiValue[] = []
      for (const arg of node.args) args.push(yield* evalExpr(arg, scope))

      if (args.length !== userFn.params.length) {
        throw runtimeError(
          node,
          `a função \`${name}\` espera ${userFn.params.length} valor(es), ` +
            `mas recebeu ${args.length}`,
          HINTS.argCount,
        )
      }

      const local = new Scope(globals)
      userFn.params.forEach((p, i) => local.declare(p, args[i] ?? null))

      try {
        yield* execBlock(userFn.body, local)
      } catch (e) {
        if (e instanceof ReturnSignal) return e.value
        throw e
      }
      return null
    }

    return yield* callBuiltin(name, node, scope)
  }

  function* callBuiltin(
    name: string,
    node: { line: number; col: number; args: Expr[] },
    scope: Scope,
  ): Generator<GameEvent, MimiValue, undefined> {
    const args: MimiValue[] = []
    for (const arg of node.args) args.push(yield* evalExpr(arg, scope))

    const expect = (count: number) => {
      if (args.length !== count) {
        throw runtimeError(
          node,
          `\`${name}\` espera ${count} valor(es) entre parênteses, ` +
            `mas recebeu ${args.length}`,
          HINTS.argCount,
        )
      }
    }

    switch (name) {
      // ------------------------------------------------------ movimento
      case 'swim': {
        expect(2)
        const dx = asInt(args[0] ?? null, node, 'o primeiro valor de `swim`')
        const dy = asInt(args[1] ?? null, node, 'o segundo valor de `swim`')
        yield* moveBy(dx, dy, node)
        return null
      }

      case 'swimTo': {
        expect(2)
        const tx = asInt(args[0] ?? null, node, 'o primeiro valor de `swimTo`')
        const ty = asInt(args[1] ?? null, node, 'o segundo valor de `swimTo`')
        const { pos } = world.state.turtle
        yield* moveBy(tx - pos.x, ty - pos.y, node)
        return null
      }

      case 'forward': {
        const count = args.length === 0
          ? 1
          : asInt(args[0] ?? null, node, 'o valor de `forward`')
        if (count < 0) {
          throw runtimeError(
            node,
            '`forward` não aceita um número negativo',
            'Para andar de costas, use `turn("left")` duas vezes antes, ' +
              'ou use `swim` com o sinal que você quer.',
          )
        }
        const dir = world.state.turtle.facing
        for (let i = 0; i < count; i++) {
          if (!(yield* stepAndSettle(dir, node))) break
        }
        return null
      }

      case 'turn': {
        expect(1)
        const side = String(args[0] ?? '')
        if (side !== 'left' && side !== 'right') {
          throw runtimeError(
            node,
            `\`turn\` só entende "left" ou "right", mas recebeu ${describeValue(args[0] ?? null)}`,
            'Escreva assim: `turn("right")` para virar à direita.',
          )
        }
        countAction(node)
        yield world.turn(side, node.line)
        return null
      }

      case 'face': {
        expect(1)
        const word = String(args[0] ?? '')
        const dir = DIRECTION_WORDS[word]
        if (!dir) {
          throw runtimeError(
            node,
            `\`face\` não conhece a direção ${describeValue(args[0] ?? null)}`,
            'As direções são "north" (cima), "south" (baixo), ' +
              '"east" (direita) e "west" (esquerda).',
          )
        }
        countAction(node)
        yield world.face(dir, node.line)
        return null
      }

      case 'dive': {
        expect(0)
        countAction(node)
        const event = world.dive(node.line)
        yield event
        if (event.type === 'blocked') reportBlocked(event, node)
        yield* settle(node)
        return null
      }

      // --------------------------------------------------------- ações
      case 'collect': {
        expect(0)
        countAction(node)
        yield world.collect(node.line)
        return null
      }

      case 'hop': {
        expect(0)
        countAction(node)
        yield world.hop(node.line)
        return null
      }

      case 'rest': {
        expect(0)
        countAction(node)
        yield world.rest(node.line)
        return null
      }

      case 'say': {
        expect(1)
        const text = String(args[0] ?? '')
        options.onSay?.(text)
        yield { type: 'say', text, line: node.line }
        return null
      }

      // ------------------------------------------------------- sensores
      case 'canSwim': {
        expect(2)
        const dx = asInt(args[0] ?? null, node, 'o primeiro valor de `canSwim`')
        const dy = asInt(args[1] ?? null, node, 'o segundo valor de `canSwim`')
        const { pos } = world.state.turtle
        return world.canEnter(pos.x + dx, pos.y + dy)
      }

      case 'onLily':
        expect(0)
        return world.onLily()

      case 'abs':
        expect(1)
        return Math.abs(asNumber(args[0] ?? null, node, 'o valor de `abs`'))

      case 'random': {
        expect(2)
        const lo = asInt(args[0] ?? null, node, 'o primeiro valor de `random`')
        const hi = asInt(args[1] ?? null, node, 'o segundo valor de `random`')
        return lo + Math.floor(Math.random() * (hi - lo + 1))
      }

      default:
        throw runtimeError(node, `não conheço o comando \`${name}\``, suggestFor(name))
    }
  }

  /** Erro de comando desconhecido, com sugestão do nome mais parecido. */
  const suggestFor = (name: string): string => {
    const all = [...ACTION_NAMES, ...SENSOR_NAMES, ...BARE_SENSORS, ...functions.keys()]
    const lower = name.toLowerCase()
    const near = all.find((n) => n.toLowerCase() === lower)
    if (near) {
      return `Você quis dizer \`${near}\`? A linguagem diferencia maiúsculas de minúsculas.`
    }
    return HINTS.unknownCommand
  }

  // ------------------------------------------------------------- movimento

  /** Um passo + correnteza + checagem de vitória. Devolve false se bloqueou. */
  function* stepAndSettle(
    dir: Direction,
    node: { line: number; col: number },
  ): Generator<GameEvent, boolean, undefined> {
    countAction(node)
    const event = world.stepOnce(dir, node.line)
    yield event

    if (event.type === 'blocked') {
      reportBlocked(event, node)
      return false
    }

    yield* settle(node)
    return true
  }

  /** Efeitos que acontecem depois de chegar numa casa. */
  function* settle(node: { line: number; col: number }): Generator<GameEvent, void, undefined> {
    const push = world.currentPush(node.line)
    if (push) yield push

    const win = world.checkWin(node.line)
    if (win) yield win
  }

  /**
   * `swim(dx, dy)` percorre primeiro o eixo X e depois o Y, uma casa por vez,
   * para que cada casa vire um quadro de animação — e para que o aluno veja o
   * deslocamento acontecer em dois movimentos separados, como num vetor.
   */
  function* moveBy(
    dx: number,
    dy: number,
    node: { line: number; col: number },
  ): Generator<GameEvent, void, undefined> {
    if (dx === 0 && dy === 0) {
      countAction(node)
      yield world.rest(node.line)
      return
    }

    const stepX: Direction = dx > 0 ? 'east' : 'west'
    for (let i = 0; i < Math.abs(dx); i++) {
      if (!(yield* stepAndSettle(stepX, node))) return
    }

    const stepY: Direction = dy > 0 ? 'north' : 'south'
    for (let i = 0; i < Math.abs(dy); i++) {
      if (!(yield* stepAndSettle(stepY, node))) return
    }
  }

  /**
   * Bater num obstáculo não é erro fatal: a tartaruga bate e o programa segue.
   * Só a beira do mapa é tratada como erro, porque sair do rio nunca é intenção.
   */
  const reportBlocked = (
    event: Extract<GameEvent, { type: 'blocked' }>,
    node: { line: number; col: number },
  ) => {
    if (event.obstacle === 'edge') {
      throw runtimeError(
        node,
        `a Mimi tentou sair do rio em (${event.against.x}, ${event.against.y})`,
        'O rio tem bordas. Confira as coordenadas: o canto de baixo à esquerda é (0, 0).',
      )
    }
  }

  // --------------------------------------------------------------- comandos

  function* execBlock(block: Block, parent: Scope): Generator<GameEvent, void, undefined> {
    const scope = new Scope(parent)
    for (const stmt of block.body) {
      yield* execStmt(stmt, scope)
    }
  }

  function* execStmt(node: Stmt, scope: Scope): Generator<GameEvent, void, undefined> {
    tick(node)

    switch (node.kind) {
      case 'ExprStmt':
        yield* evalExpr(node.expr, scope)
        return

      case 'Let': {
        const value = yield* evalExpr(node.init, scope)
        scope.declare(node.name, value)
        return
      }

      case 'Assign': {
        const value = yield* evalExpr(node.value, scope)
        if (!scope.set(node.name, value)) {
          throw runtimeError(
            node,
            `a variável \`${node.name}\` ainda não existe`,
            HINTS.declareFirst,
          )
        }
        return
      }

      case 'Block':
        yield* execBlock(node, scope)
        return

      case 'If': {
        const test = yield* evalExpr(node.test, scope)
        if (truthy(test)) {
          yield* execBlock(node.consequent, scope)
        } else if (node.alternate) {
          if (node.alternate.kind === 'Block') {
            yield* execBlock(node.alternate, scope)
          } else {
            yield* execStmt(node.alternate, scope)
          }
        }
        return
      }

      case 'While': {
        while (truthy(yield* evalExpr(node.test, scope))) {
          tick(node)
          yield* execBlock(node.body, scope)
        }
        return
      }

      case 'Repeat': {
        const raw = yield* evalExpr(node.count, scope)
        const count = asInt(raw, node, 'o número de repetições do `repeat`')
        if (count < 0) {
          throw runtimeError(
            node,
            '`repeat` não aceita um número negativo de repetições',
            'Use zero ou mais: `repeat(3) { ... }`.',
          )
        }
        for (let i = 0; i < count; i++) {
          tick(node)
          yield* execBlock(node.body, scope)
        }
        return
      }

      case 'For': {
        const loopScope = new Scope(scope)
        if (node.init) yield* execStmt(node.init, loopScope)
        while (node.test === null || truthy(yield* evalExpr(node.test, loopScope))) {
          tick(node)
          yield* execBlock(node.body, loopScope)
          if (node.update) yield* execStmt(node.update, loopScope)
        }
        return
      }

      case 'Function':
        // Declarações já foram içadas antes da execução; nada a fazer aqui.
        return

      case 'Return': {
        const value = node.value ? yield* evalExpr(node.value, scope) : null
        throw new ReturnSignal(value)
      }
    }
  }

  // ----------------------------------------------------------------- início

  // Içamento: funções ficam visíveis mesmo se declaradas no fim do arquivo.
  const hoist = (stmts: Stmt[]) => {
    for (const s of stmts) {
      if (s.kind === 'Function') functions.set(s.name, s)
    }
  }
  hoist(program.body)

  try {
    for (const stmt of program.body) {
      yield* execStmt(stmt, globals)
    }
  } catch (e) {
    if (e instanceof ReturnSignal) return
    throw e
  }
}

// ------------------------------------------------------------------ auxiliar

function describeValue(value: MimiValue): string {
  if (value === null) return 'nada'
  if (typeof value === 'string') return `o texto "${value}"`
  if (typeof value === 'boolean') return value ? '`true`' : '`false`'
  return `o número ${value}`
}

/** Frase em PT-BR para o console quando a tartaruga bate em algo. */
export function describeBlocked(event: Extract<GameEvent, { type: 'blocked' }>): string {
  return (
    `A Mimi bateu em ${TILE_LABELS_PT[event.obstacle]} em ` +
    `(${event.against.x}, ${event.against.y}) e parou.`
  )
}

export function describeTurn(event: Extract<GameEvent, { type: 'turn' }>): string {
  return `Agora a Mimi está olhando para ${DIRECTION_LABELS[event.to]}.`
}

export { MimiError }
