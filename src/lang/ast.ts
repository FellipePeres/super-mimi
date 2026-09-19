/**
 * AST do MimiScript.
 *
 * Todo nó carrega `line`/`col` da primeira palavra que o originou, porque as
 * mensagens de erro são conteúdo didático: o aluno precisa ver exatamente onde
 * o problema está, e não um stack trace.
 */

export interface Pos {
  line: number
  col: number
}

// ---------------------------------------------------------------- expressões

export type Expr =
  | NumberLit
  | StringLit
  | BoolLit
  | Identifier
  | Unary
  | Binary
  | Logical
  | Call

export interface NumberLit extends Pos {
  kind: 'Number'
  value: number
}

export interface StringLit extends Pos {
  kind: 'String'
  value: string
}

export interface BoolLit extends Pos {
  kind: 'Bool'
  value: boolean
}

/** Variável do usuário (`let n`) ou sensor embutido (`x`, `front`). */
export interface Identifier extends Pos {
  kind: 'Identifier'
  name: string
}

export type UnaryOp = '-' | '!'

export interface Unary extends Pos {
  kind: 'Unary'
  op: UnaryOp
  arg: Expr
}

export type BinaryOp =
  | '+' | '-' | '*' | '/' | '%'
  | '==' | '!=' | '<' | '>' | '<=' | '>='

export interface Binary extends Pos {
  kind: 'Binary'
  op: BinaryOp
  left: Expr
  right: Expr
}

/** Separado de Binary porque `&&` e `||` avaliam em curto-circuito. */
export interface Logical extends Pos {
  kind: 'Logical'
  op: '&&' | '||'
  left: Expr
  right: Expr
}

export interface Call extends Pos {
  kind: 'Call'
  callee: string
  args: Expr[]
}

// ---------------------------------------------------------------- comandos

export type Stmt =
  | ExprStmt
  | LetStmt
  | AssignStmt
  | IfStmt
  | WhileStmt
  | RepeatStmt
  | ForStmt
  | FunctionDecl
  | ReturnStmt
  | Block

export interface ExprStmt extends Pos {
  kind: 'ExprStmt'
  expr: Expr
}

export interface LetStmt extends Pos {
  kind: 'Let'
  name: string
  init: Expr
}

export interface AssignStmt extends Pos {
  kind: 'Assign'
  name: string
  value: Expr
}

export interface IfStmt extends Pos {
  kind: 'If'
  test: Expr
  consequent: Block
  /** `else if` vira um IfStmt aninhado aqui; `else` puro vira um Block. */
  alternate: Block | IfStmt | null
}

export interface WhileStmt extends Pos {
  kind: 'While'
  test: Expr
  body: Block
}

/** `repeat(n) { ... }` — o laço de entrada, antes de o aluno ver contadores. */
export interface RepeatStmt extends Pos {
  kind: 'Repeat'
  count: Expr
  body: Block
}

export interface ForStmt extends Pos {
  kind: 'For'
  init: LetStmt | AssignStmt | null
  test: Expr | null
  update: AssignStmt | null
  body: Block
}

export interface FunctionDecl extends Pos {
  kind: 'Function'
  name: string
  params: string[]
  body: Block
}

export interface ReturnStmt extends Pos {
  kind: 'Return'
  value: Expr | null
}

export interface Block extends Pos {
  kind: 'Block'
  body: Stmt[]
}

export interface Program {
  kind: 'Program'
  body: Stmt[]
}
