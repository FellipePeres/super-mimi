import type { Pos } from './ast'

/**
 * Erros do MimiScript são material didático, não diagnóstico de compilador.
 *
 * Cada erro carrega três coisas: ONDE (linha/coluna), O QUE aconteceu em
 * português simples, e uma DICA que ensina a regra por trás do problema. A UI
 * mostra a dica com um 💡 logo abaixo da mensagem.
 */
export class MimiError extends Error {
  readonly line: number
  readonly col: number
  readonly hint: string
  /** 'sintaxe' aponta o editor; 'execução' aponta a linha que estava rodando. */
  readonly phase: 'sintaxe' | 'execução'

  constructor(
    message: string,
    pos: Pos,
    hint: string,
    phase: 'sintaxe' | 'execução' = 'sintaxe',
  ) {
    super(message)
    this.name = 'MimiError'
    this.line = pos.line
    this.col = pos.col
    this.hint = hint
    this.phase = phase
  }

  /** Cabeçalho pronto para o console do jogo. */
  get headline(): string {
    return `Linha ${this.line} — ${this.message}`
  }
}

export function syntaxError(pos: Pos, message: string, hint: string): MimiError {
  return new MimiError(message, pos, hint, 'sintaxe')
}

export function runtimeError(pos: Pos, message: string, hint: string): MimiError {
  return new MimiError(message, pos, hint, 'execução')
}

/**
 * Dicas reaproveitadas. Ficam num só lugar para que a mesma regra seja sempre
 * explicada com as mesmas palavras — repetir a formulação ajuda a fixar.
 */
export const HINTS = {
  closeBrace:
    'Toda chave `{` que você abre precisa de uma `}` para fechar. Confira se não esqueceu nenhuma.',
  closeParen:
    'Todo parêntese `(` que você abre precisa de um `)` para fechar.',
  condition:
    'A condição fica sempre entre parênteses, assim: `if (x > 3) { ... }`.',
  comparison:
    'Para comparar dois valores use `==` (igual), e não `=`. Um `=` sozinho serve para guardar um valor numa variável.',
  unknownCommand:
    'Confira a escrita do comando — a linguagem diferencia maiúsculas de minúsculas. A barra de comandos no topo tem todos eles prontos.',
  argCount:
    'Confira quantos valores o comando espera dentro dos parênteses.',
  declareFirst:
    'Antes de usar uma variável, crie ela com `let`. Por exemplo: `let passos = 0`.',
  infiniteLoop:
    'Dentro de um `while`, alguma coisa precisa mudar para que a condição um dia fique falsa — senão ele nunca termina.',
  numberExpected:
    'Esse comando só funciona com números. Textos ficam entre aspas e não servem para contas.',
  boolExpected:
    'A condição precisa resultar em verdadeiro ou falso. Use uma comparação como `x > 3` ou `canSwim(1, 0)`.',
} as const
