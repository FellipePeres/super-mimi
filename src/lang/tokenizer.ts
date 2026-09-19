import { syntaxError, HINTS } from './errors'

export type TokenType =
  | 'number'
  | 'string'
  | 'identifier'
  | 'keyword'
  | 'operator'
  | 'punct'
  | 'eof'

export interface Token {
  type: TokenType
  value: string
  line: number
  col: number
}

export const KEYWORDS = new Set([
  'if',
  'else',
  'while',
  'repeat',
  'for',
  'let',
  'function',
  'return',
  'true',
  'false',
])

/**
 * Ordem importa: os operadores de dois caracteres precisam ser testados antes
 * dos de um, senão `<=` seria lido como `<` seguido de `=`.
 */
const OPERATORS_2 = ['==', '!=', '<=', '>=', '&&', '||']
const OPERATORS_1 = ['+', '-', '*', '/', '%', '<', '>', '!', '=']
const PUNCT = ['(', ')', '{', '}', ',', ';']

const isDigit = (c: string) => c >= '0' && c <= '9'
const isIdentStart = (c: string) => /[A-Za-z_]/.test(c)
const isIdentPart = (c: string) => /[A-Za-z0-9_]/.test(c)

export function tokenize(source: string): Token[] {
  const tokens: Token[] = []
  let i = 0
  let line = 1
  let col = 1

  const peek = (offset = 0) => source[i + offset] ?? ''

  const advance = (count = 1) => {
    for (let n = 0; n < count; n++) {
      if (source[i] === '\n') {
        line++
        col = 1
      } else {
        col++
      }
      i++
    }
  }

  const push = (type: TokenType, value: string, startLine: number, startCol: number) => {
    tokens.push({ type, value, line: startLine, col: startCol })
  }

  while (i < source.length) {
    const c = peek()

    // Espaços e quebras de linha
    if (c === ' ' || c === '\t' || c === '\r' || c === '\n') {
      advance()
      continue
    }

    // Comentário de linha: // ...
    if (c === '/' && peek(1) === '/') {
      while (i < source.length && peek() !== '\n') advance()
      continue
    }

    // Comentário de bloco: /* ... */
    if (c === '/' && peek(1) === '*') {
      const startLine = line
      const startCol = col
      advance(2)
      let closed = false
      while (i < source.length) {
        if (peek() === '*' && peek(1) === '/') {
          advance(2)
          closed = true
          break
        }
        advance()
      }
      if (!closed) {
        throw syntaxError(
          { line: startLine, col: startCol },
          'esse comentário foi aberto com `/*` mas nunca foi fechado',
          'Comentários longos terminam com `*/`. Para comentar só uma linha, use `//`.',
        )
      }
      continue
    }

    const startLine = line
    const startCol = col

    // Números: 12, 3.5
    if (isDigit(c)) {
      let text = ''
      while (isDigit(peek())) {
        text += peek()
        advance()
      }
      if (peek() === '.' && isDigit(peek(1))) {
        text += peek()
        advance()
        while (isDigit(peek())) {
          text += peek()
          advance()
        }
      }
      push('number', text, startLine, startCol)
      continue
    }

    // Textos: "direita" ou 'direita'
    if (c === '"' || c === "'") {
      const quote = c
      advance()
      let text = ''
      while (i < source.length && peek() !== quote) {
        if (peek() === '\\') {
          throw syntaxError(
            { line: startLine, col: startCol },
            'esse texto foi aberto com aspas mas não foi fechado antes do fim da linha',
            'Textos ficam entre aspas na mesma linha, assim: `turn("right")`.',
          )
        }
        // Escapes suportados: aspas, barra invertida, quebra de linha e tab
        if (peek() === '\\') {
          const next = peek(1)
          if (next === 'n') text += '\n'
          else if (next === 't') text += '\t'
          else text += next
          advance(2)
          continue
        }
        text += peek()
        advance()
      }
      if (i >= source.length) {
        throw syntaxError(
          { line: startLine, col: startCol },
          'esse texto foi aberto com aspas mas nunca foi fechado',
          'Textos ficam entre aspas, assim: `turn("right")`.',
        )
      }
      advance() // aspas de fechamento
      push('string', text, startLine, startCol)
      continue
    }

    // Identificadores e palavras-chave
    if (isIdentStart(c)) {
      let text = ''
      while (isIdentPart(peek())) {
        text += peek()
        advance()
      }
      push(KEYWORDS.has(text) ? 'keyword' : 'identifier', text, startLine, startCol)
      continue
    }

    // Operadores de dois caracteres
    const two = c + peek(1)
    if (OPERATORS_2.includes(two)) {
      advance(2)
      push('operator', two, startLine, startCol)
      continue
    }

    // Um `&` ou `|` sozinho quase sempre é `&&`/`||` digitado pela metade
    if (c === '&' || c === '|') {
      throw syntaxError(
        { line: startLine, col: startCol },
        `o símbolo \`${c}\` sozinho não existe no MimiScript`,
        `Para juntar duas condições use \`${c}${c}\` (dois símbolos). ` +
          '`&&` quer dizer "e", `||` quer dizer "ou".',
      )
    }

    if (OPERATORS_1.includes(c)) {
      advance()
      push('operator', c, startLine, startCol)
      continue
    }

    if (PUNCT.includes(c)) {
      advance()
      push('punct', c, startLine, startCol)
      continue
    }

    // Erro de digitação comum: acento ou símbolo inesperado
    throw syntaxError(
      { line: startLine, col: startCol },
      `não reconheço o símbolo \`${c}\``,
      HINTS.unknownCommand,
    )
  }

  push('eof', '', line, col)
  return tokens
}
