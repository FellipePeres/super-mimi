/**
 * Catálogo dos comandos do MimiScript.
 *
 * Fonte única para três coisas que precisam concordar entre si: a barra de
 * moldes no topo, o autocompletar do editor e a gaveta de ajuda. Se um
 * comando aparece num lugar com uma explicação e noutro com outra, o aluno
 * acha que são comandos diferentes.
 *
 * `insert` usa `|` para marcar onde o cursor deve parar depois da inserção.
 */

export type CommandCategory = 'movimento' | 'acao' | 'sensor' | 'controle'

export interface CommandSpec {
  /** Chave usada em `LevelSpec.allowed`. */
  id: string
  category: CommandCategory
  /** Assinatura mostrada no botão. */
  signature: string
  /** Nome em português, para quem ainda não lê inglês. */
  labelPt: string
  /** Uma frase explicando o que faz. */
  description: string
  /** Texto inserido no editor; `|` marca a posição final do cursor. */
  insert: string
  example: string
}

export const CATEGORY_LABELS: Record<CommandCategory, string> = {
  movimento: 'Movimento',
  acao: 'Ações',
  sensor: 'Sensores',
  controle: 'Controle',
}

export const COMMANDS: CommandSpec[] = [
  // ------------------------------------------------------------- movimento
  {
    id: 'swim',
    category: 'movimento',
    signature: 'swim(x, y)',
    labelPt: 'nadar',
    description: 'Anda x casas para o lado e y casas para cima. Use números negativos para ir ao contrário.',
    insert: 'swim(|, 0)',
    example: 'swim(3, 0)  // três casas para a direita',
  },
  {
    id: 'swimTo',
    category: 'movimento',
    signature: 'swimTo(x, y)',
    labelPt: 'nadar até',
    description: 'Vai até a casa de endereço (x, y), não importa onde a Mimi esteja agora.',
    insert: 'swimTo(|, 0)',
    example: 'swimTo(5, 2)  // vai até a casa (5, 2)',
  },
  {
    id: 'forward',
    category: 'movimento',
    signature: 'forward(n)',
    labelPt: 'em frente',
    description: 'Anda n casas na direção para onde a Mimi está olhando.',
    insert: 'forward(|1)',
    example: 'forward(2)  // duas casas em frente',
  },
  {
    id: 'turn',
    category: 'movimento',
    signature: 'turn("left")',
    labelPt: 'virar',
    description: 'Gira a Mimi um quarto de volta, sem sair do lugar.',
    insert: 'turn("|right")',
    example: 'turn("right")  // vira à direita',
  },
  {
    id: 'face',
    category: 'movimento',
    signature: 'face("north")',
    labelPt: 'olhar para',
    description: 'Aponta a Mimi para um ponto fixo: north, south, east ou west.',
    insert: 'face("|north")',
    example: 'face("north")  // olha para cima',
  },
  {
    id: 'dive',
    category: 'movimento',
    signature: 'dive()',
    labelPt: 'mergulhar',
    description: 'Mergulha por baixo do tronco que está logo à frente.',
    insert: 'dive()|',
    example: 'dive()  // passa por baixo do tronco',
  },

  // ----------------------------------------------------------------- ações
  {
    id: 'collect',
    category: 'acao',
    signature: 'collect()',
    labelPt: 'coletar',
    description: 'Recolhe a semente da casa onde a Mimi está.',
    insert: 'collect()|',
    example: 'collect()  // pega a semente daqui',
  },
  {
    id: 'hop',
    category: 'acao',
    signature: 'hop()',
    labelPt: 'pular',
    description: 'Dá um pulinho em cima da vitória régia.',
    insert: 'hop()|',
    example: 'hop()',
  },
  {
    id: 'rest',
    category: 'acao',
    signature: 'rest()',
    labelPt: 'descansar',
    description: 'Espera um instante sem fazer nada.',
    insert: 'rest()|',
    example: 'rest()',
  },
  {
    id: 'say',
    category: 'acao',
    signature: 'say(texto)',
    labelPt: 'falar',
    description: 'Mostra um balãozinho. Serve para conferir o valor de uma variável.',
    insert: 'say(|"oi")',
    example: 'say(total)  // mostra quanto vale total',
  },

  // -------------------------------------------------------------- sensores
  {
    id: 'x',
    category: 'sensor',
    signature: 'x',
    labelPt: 'coluna atual',
    description: 'O número da coluna onde a Mimi está agora.',
    insert: 'x|',
    example: 'while (x < 5) { swim(1, 0) }',
  },
  {
    id: 'y',
    category: 'sensor',
    signature: 'y',
    labelPt: 'linha atual',
    description: 'O número da linha onde a Mimi está agora.',
    insert: 'y|',
    example: 'if (y == 0) { swim(0, 1) }',
  },
  {
    id: 'front',
    category: 'sensor',
    signature: 'front',
    labelPt: 'o que tem à frente',
    description: 'Diz o que está logo à frente: "water", "rock", "log", "lily" ou "edge".',
    insert: 'front|',
    example: 'if (front == "rock") { turn("left") }',
  },
  {
    id: 'left',
    category: 'sensor',
    signature: 'left',
    labelPt: 'o que tem à esquerda',
    description: 'O mesmo que front, mas olhando para a esquerda da Mimi.',
    insert: 'left|',
    example: 'if (left == "water") { turn("left") }',
  },
  {
    id: 'right',
    category: 'sensor',
    signature: 'right',
    labelPt: 'o que tem à direita',
    description: 'O mesmo que front, mas olhando para a direita da Mimi.',
    insert: 'right|',
    example: 'if (right == "water") { turn("right") }',
  },
  {
    id: 'canSwim',
    category: 'sensor',
    signature: 'canSwim(x, y)',
    labelPt: 'dá para nadar?',
    description: 'Responde true se dá para nadar naquela direção, e false se tem algo bloqueando.',
    insert: 'canSwim(|1, 0)',
    example: 'if (canSwim(1, 0)) { swim(1, 0) }',
  },
  {
    id: 'onLily',
    category: 'sensor',
    signature: 'onLily()',
    labelPt: 'está na vitória régia?',
    description: 'Responde true se a Mimi estiver em cima de uma vitória régia.',
    insert: 'onLily()|',
    example: 'if (onLily()) { hop() }',
  },

  // -------------------------------------------------------------- controle
  {
    id: 'repeat',
    category: 'controle',
    signature: 'repeat(n) { }',
    labelPt: 'repita n vezes',
    description: 'Repete os comandos de dentro das chaves um número fixo de vezes.',
    insert: 'repeat(|3) {\n  \n}',
    example: 'repeat(4) { swim(1, 0) }',
  },
  {
    id: 'while',
    category: 'controle',
    signature: 'while (cond) { }',
    labelPt: 'enquanto',
    description: 'Repete enquanto a condição for verdadeira. Use quando não souber o número de vezes.',
    insert: 'while (|x < 5) {\n  \n}',
    example: 'while (x < 5) { swim(1, 0) }',
  },
  {
    id: 'if',
    category: 'controle',
    signature: 'if (cond) { }',
    labelPt: 'se',
    description: 'Executa os comandos de dentro só quando a condição for verdadeira.',
    insert: 'if (|canSwim(1, 0)) {\n  \n}',
    example: 'if (canSwim(1, 0)) { swim(1, 0) }',
  },
  {
    id: 'else',
    category: 'controle',
    signature: 'if ... else { }',
    labelPt: 'senão',
    description: 'O caminho alternativo: roda quando a condição do if deu falso.',
    insert: 'if (|canSwim(1, 0)) {\n  swim(1, 0)\n} else {\n  swim(0, 1)\n}',
    example: 'if (canSwim(1, 0)) { swim(1, 0) } else { swim(0, 1) }',
  },
  {
    id: 'let',
    category: 'controle',
    signature: 'let nome = valor',
    labelPt: 'guardar valor',
    description: 'Cria uma caixinha com nome para guardar um número ou um texto.',
    insert: 'let |total = 0',
    example: 'let passos = 3',
  },
  {
    id: 'function',
    category: 'controle',
    signature: 'function nome() { }',
    labelPt: 'criar comando',
    description: 'Cria um comando novo, com o nome que você quiser.',
    insert: 'function |degrau() {\n  \n}',
    example: 'function degrau() { swim(1, 0) swim(0, 1) }',
  },
]

export const COMMANDS_BY_ID = new Map(COMMANDS.map((c) => [c.id, c]))

/** Comandos liberados numa fase, na ordem do catálogo. */
export function commandsFor(allowed: string[]): CommandSpec[] {
  const set = new Set(allowed)
  return COMMANDS.filter((command) => set.has(command.id))
}

/** Todos os comandos, usado no Modo Livre e na gaveta de ajuda. */
export const ALL_COMMAND_IDS = COMMANDS.map((c) => c.id)

/** Separa o texto a inserir da posição do cursor. */
export function parseInsert(insert: string): { text: string; cursor: number } {
  const index = insert.indexOf('|')
  if (index === -1) return { text: insert, cursor: insert.length }
  return { text: insert.slice(0, index) + insert.slice(index + 1), cursor: index }
}
