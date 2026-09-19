import type {
  AssignStmt, Block, Expr, ForStmt, FunctionDecl, IfStmt,
  LetStmt, Program, Stmt, BinaryOp,
} from './ast'
import { syntaxError, HINTS } from './errors'
import { tokenize, type Token } from './tokenizer'

/**
 * Parser recursivo-descendente.
 *
 * Precedência, do mais fraco ao mais forte:
 *   ||  ->  &&  ->  == !=  ->  < > <= >=  ->  + -  ->  * / %  ->  unário  ->  primário
 */
export function parse(source: string): Program {
  const tokens = tokenize(source)
  let pos = 0

  // ------------------------------------------------------------- utilidades

  const peek = (offset = 0): Token => {
    const t = tokens[Math.min(pos + offset, tokens.length - 1)]
    return t as Token
  }

  const at = (type: Token['type'], value?: string): boolean => {
    const t = peek()
    return t.type === type && (value === undefined || t.value === value)
  }

  const advance = (): Token => {
    const t = peek()
    if (t.type !== 'eof') pos++
    return t
  }

  const match = (type: Token['type'], value?: string): boolean => {
    if (at(type, value)) {
      advance()
      return true
    }
    return false
  }

  /** Nomeia o token atual do jeito que um aluno o chamaria. */
  const describe = (t: Token): string => {
    if (t.type === 'eof') return 'o fim do seu código'
    if (t.type === 'string') return `o texto "${t.value}"`
    if (t.type === 'number') return `o número ${t.value}`
    return `\`${t.value}\``
  }

  const expect = (
    type: Token['type'],
    value: string,
    message: string,
    hint: string,
  ): Token => {
    if (at(type, value)) return advance()
    const t = peek()
    throw syntaxError(t, `${message}, mas encontrei ${describe(t)}`, hint)
  }

  /** Ponto e vírgula é opcional no MimiScript — aceita quem vem do JS. */
  const skipSemicolons = () => {
    while (match('punct', ';')) {
      /* consome */
    }
  }

  // ------------------------------------------------------------- expressões

  const parseExpression = (): Expr => parseOr()

  const parseOr = (): Expr => {
    let left = parseAnd()
    while (at('operator', '||')) {
      const op = advance()
      const right = parseAnd()
      left = { kind: 'Logical', op: '||', left, right, line: op.line, col: op.col }
    }
    return left
  }

  const parseAnd = (): Expr => {
    let left = parseEquality()
    while (at('operator', '&&')) {
      const op = advance()
      const right = parseEquality()
      left = { kind: 'Logical', op: '&&', left, right, line: op.line, col: op.col }
    }
    return left
  }

  const parseBinaryLevel = (ops: string[], next: () => Expr): Expr => {
    let left = next()
    while (peek().type === 'operator' && ops.includes(peek().value)) {
      const op = advance()
      const right = next()
      left = {
        kind: 'Binary',
        op: op.value as BinaryOp,
        left,
        right,
        line: op.line,
        col: op.col,
      }
    }
    return left
  }

  const parseEquality = (): Expr => parseBinaryLevel(['==', '!='], parseComparison)
  const parseComparison = (): Expr => parseBinaryLevel(['<', '>', '<=', '>='], parseTerm)
  const parseTerm = (): Expr => parseBinaryLevel(['+', '-'], parseFactor)
  const parseFactor = (): Expr => parseBinaryLevel(['*', '/', '%'], parseUnary)

  const parseUnary = (): Expr => {
    if (at('operator', '-') || at('operator', '!')) {
      const op = advance()
      const arg = parseUnary()
      return {
        kind: 'Unary',
        op: op.value as '-' | '!',
        arg,
        line: op.line,
        col: op.col,
      }
    }
    return parsePrimary()
  }

  const parsePrimary = (): Expr => {
    const t = peek()

    if (t.type === 'number') {
      advance()
      return { kind: 'Number', value: Number(t.value), line: t.line, col: t.col }
    }

    if (t.type === 'string') {
      advance()
      return { kind: 'String', value: t.value, line: t.line, col: t.col }
    }

    if (at('keyword', 'true') || at('keyword', 'false')) {
      advance()
      return { kind: 'Bool', value: t.value === 'true', line: t.line, col: t.col }
    }

    if (t.type === 'identifier') {
      advance()
      // Chamada de comando: nome seguido de `(`
      if (at('punct', '(')) {
        advance()
        const args: Expr[] = []
        if (!at('punct', ')')) {
          do {
            args.push(parseExpression())
          } while (match('punct', ','))
        }
        expect(
          'punct', ')',
          `esperava um \`)\` para fechar a chamada de \`${t.value}\``,
          HINTS.closeParen,
        )
        return { kind: 'Call', callee: t.value, args, line: t.line, col: t.col }
      }
      return { kind: 'Identifier', name: t.value, line: t.line, col: t.col }
    }

    if (at('punct', '(')) {
      advance()
      const inner = parseExpression()
      expect('punct', ')', 'esperava um `)` para fechar', HINTS.closeParen)
      return inner
    }

    // Um `{` onde se esperava um valor quase sempre é condição sem parênteses
    if (at('punct', '{')) {
      throw syntaxError(
        t,
        'esperava um valor aqui, mas encontrei o começo de um bloco `{`',
        HINTS.condition,
      )
    }

    throw syntaxError(
      t,
      `esperava um valor aqui, mas encontrei ${describe(t)}`,
      'Um valor pode ser um número (`3`), um texto (`"right"`), uma variável ' +
        'ou um comando como `canSwim(1, 0)`.',
    )
  }

  // --------------------------------------------------------------- comandos

  const parseBlock = (owner: string): Block => {
    const open = expect(
      'punct', '{',
      `esperava um \`{\` para abrir o bloco do \`${owner}\``,
      HINTS.closeBrace,
    )
    const body: Stmt[] = []
    while (!at('punct', '}')) {
      if (at('eof')) {
        throw syntaxError(
          open,
          `esse bloco do \`${owner}\` foi aberto com \`{\` mas nunca foi fechado`,
          HINTS.closeBrace,
        )
      }
      body.push(parseStatement())
    }
    advance() // }
    return { kind: 'Block', body, line: open.line, col: open.col }
  }

  /** Condição entre parênteses, com erro dedicado quando faltam. */
  const parseCondition = (owner: string): Expr => {
    if (!at('punct', '(')) {
      throw syntaxError(
        peek(),
        `a condição do \`${owner}\` precisa vir entre parênteses`,
        HINTS.condition,
      )
    }
    advance()
    const test = parseExpression()

    // `if (x = 3)` — confusão clássica entre atribuição e comparação
    if (at('operator', '=')) {
      throw syntaxError(
        peek(),
        'usei `=` para comparar, mas `=` serve para guardar um valor',
        HINTS.comparison,
      )
    }

    expect(
      'punct', ')',
      `esperava um \`)\` para fechar a condição do \`${owner}\``,
      HINTS.closeParen,
    )
    return test
  }

  const parseIf = (): IfStmt => {
    const kw = advance() // if
    const test = parseCondition('if')
    const consequent = parseBlock('if')

    let alternate: Block | IfStmt | null = null
    if (at('keyword', 'else')) {
      advance()
      alternate = at('keyword', 'if') ? parseIf() : parseBlock('else')
    }

    return { kind: 'If', test, consequent, alternate, line: kw.line, col: kw.col }
  }

  const parseLet = (): LetStmt => {
    const kw = advance() // let
    const name = peek()
    if (name.type !== 'identifier') {
      throw syntaxError(
        name,
        `esperava o nome da variável depois de \`let\`, mas encontrei ${describe(name)}`,
        'Nomes de variável começam com letra, por exemplo: `let passos = 0`.',
      )
    }
    advance()
    expect(
      'operator', '=',
      `a variável \`${name.value}\` precisa começar com um valor`,
      'Escreva assim: `let passos = 0`.',
    )
    const init = parseExpression()
    skipSemicolons()
    return { kind: 'Let', name: name.value, init, line: kw.line, col: kw.col }
  }

  const parseAssignFrom = (nameToken: Token): AssignStmt => {
    advance() // =
    const value = parseExpression()
    return {
      kind: 'Assign',
      name: nameToken.value,
      value,
      line: nameToken.line,
      col: nameToken.col,
    }
  }

  const parseFor = (): ForStmt => {
    const kw = advance() // for
    expect('punct', '(', 'o `for` precisa de um `(` depois do nome', HINTS.closeParen)

    let init: LetStmt | AssignStmt | null = null
    if (!at('punct', ';')) {
      if (at('keyword', 'let')) {
        init = parseLet()
      } else {
        const name = advance()
        init = parseAssignFrom(name)
      }
    }
    skipSemicolons()

    const test = at('punct', ';') ? null : parseExpression()
    skipSemicolons()

    let update: AssignStmt | null = null
    if (!at('punct', ')')) {
      const name = advance()
      update = parseAssignFrom(name)
    }
    expect('punct', ')', 'esperava um `)` para fechar o `for`', HINTS.closeParen)

    const body = parseBlock('for')
    return { kind: 'For', init, test, update, body, line: kw.line, col: kw.col }
  }

  const parseFunction = (): FunctionDecl => {
    const kw = advance() // function
    const name = peek()
    if (name.type !== 'identifier') {
      throw syntaxError(
        name,
        `esperava o nome da função depois de \`function\`, mas encontrei ${describe(name)}`,
        'Escreva assim: `function contornarPedra() { ... }`.',
      )
    }
    advance()
    expect(
      'punct', '(',
      `a função \`${name.value}\` precisa de \`(\` depois do nome`,
      HINTS.closeParen,
    )

    const params: string[] = []
    if (!at('punct', ')')) {
      do {
        const p = peek()
        if (p.type !== 'identifier') {
          throw syntaxError(
            p,
            `esperava o nome de um parâmetro, mas encontrei ${describe(p)}`,
            'Parâmetros são nomes separados por vírgula: `function andar(passos) { ... }`.',
          )
        }
        advance()
        params.push(p.value)
      } while (match('punct', ','))
    }
    expect('punct', ')', 'esperava um `)` para fechar a lista de parâmetros', HINTS.closeParen)

    const body = parseBlock('function')
    return { kind: 'Function', name: name.value, params, body, line: kw.line, col: kw.col }
  }

  const parseStatement = (): Stmt => {
    skipSemicolons()
    const t = peek()

    if (at('keyword', 'if')) return parseIf()
    if (at('keyword', 'let')) return parseLet()
    if (at('keyword', 'for')) return parseFor()
    if (at('keyword', 'function')) return parseFunction()

    if (at('keyword', 'while')) {
      const kw = advance()
      const test = parseCondition('while')
      const body = parseBlock('while')
      skipSemicolons()
      return { kind: 'While', test, body, line: kw.line, col: kw.col }
    }

    if (at('keyword', 'repeat')) {
      const kw = advance()
      if (!at('punct', '(')) {
        throw syntaxError(
          peek(),
          'o `repeat` precisa dizer quantas vezes repetir, entre parênteses',
          'Escreva assim: `repeat(3) { swim(1, 0) }` para repetir três vezes.',
        )
      }
      advance()
      const count = parseExpression()
      expect('punct', ')', 'esperava um `)` para fechar o `repeat`', HINTS.closeParen)
      const body = parseBlock('repeat')
      skipSemicolons()
      return { kind: 'Repeat', count, body, line: kw.line, col: kw.col }
    }

    if (at('keyword', 'return')) {
      const kw = advance()
      const value =
        at('punct', '}') || at('punct', ';') || at('eof') ? null : parseExpression()
      skipSemicolons()
      return { kind: 'Return', value, line: kw.line, col: kw.col }
    }

    if (at('keyword', 'else')) {
      throw syntaxError(
        t,
        'encontrei um `else` que não pertence a nenhum `if`',
        'Todo `else` vem logo depois da `}` que fecha o bloco de um `if`.',
      )
    }

    if (at('punct', '{')) return parseBlock('bloco')

    // Atribuição a variável existente: `nome = valor`
    if (t.type === 'identifier' && peek(1).type === 'operator' && peek(1).value === '=') {
      const name = advance()
      const stmt = parseAssignFrom(name)
      skipSemicolons()
      return stmt
    }

    const expr = parseExpression()
    skipSemicolons()
    return { kind: 'ExprStmt', expr, line: expr.line, col: expr.col }
  }

  // ----------------------------------------------------------------- início

  const body: Stmt[] = []
  skipSemicolons()
  while (!at('eof')) {
    if (at('punct', '}')) {
      throw syntaxError(
        peek(),
        'encontrei uma `}` sobrando, sem um `{` que combine com ela',
        HINTS.closeBrace,
      )
    }
    body.push(parseStatement())
    skipSemicolons()
  }

  return { kind: 'Program', body }
}
