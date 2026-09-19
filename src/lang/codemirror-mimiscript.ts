import { HighlightStyle, StreamLanguage, syntaxHighlighting } from '@codemirror/language'
import { EditorView } from '@codemirror/view'
import { tags } from '@lezer/highlight'
import type { CompletionContext, CompletionResult } from '@codemirror/autocomplete'
import { COMMANDS, parseInsert } from './commands'
import { KEYWORDS } from './tokenizer'

/**
 * Suporte a MimiScript no CodeMirror.
 *
 * O destaque usa um tokenizer por stream em vez de uma gramática Lezer: a
 * linguagem tem uma dúzia de formas e um parser incremental completo seria
 * peso morto. O que importa aqui é que as cores batam com as do jogo.
 */

const ACTION_NAMES = new Set(COMMANDS.map((c) => c.id))

export const mimiscriptLanguage = StreamLanguage.define<{ inBlockComment: boolean }>({
  name: 'mimiscript',

  startState: () => ({ inBlockComment: false }),

  token(stream, state) {
    // Comentário de bloco atravessa linhas
    if (state.inBlockComment) {
      if (stream.match(/.*?\*\//)) state.inBlockComment = false
      else stream.skipToEnd()
      return 'comment'
    }

    if (stream.eatSpace()) return null

    if (stream.match('//')) {
      stream.skipToEnd()
      return 'comment'
    }

    if (stream.match('/*')) {
      state.inBlockComment = true
      return 'comment'
    }

    // Textos
    const quote = stream.peek()
    if (quote === '"' || quote === "'") {
      stream.next()
      let escaped = false
      let ch: string | void
      while ((ch = stream.next()) != null) {
        if (ch === quote && !escaped) break
        escaped = !escaped && ch === '\\'
      }
      return 'string'
    }

    if (stream.match(/^\d+(\.\d+)?/)) return 'number'

    const word = stream.match(/^[A-Za-z_][A-Za-z0-9_]*/) as RegExpMatchArray | null
    if (word) {
      const name = word[0]
      if (name === 'true' || name === 'false') return 'bool'
      if (KEYWORDS.has(name)) return 'keyword'
      // Comando embutido seguido de `(` ou sensor sem parênteses
      if (ACTION_NAMES.has(name)) return 'builtin'
      return 'variableName'
    }

    if (stream.match(/^(==|!=|<=|>=|&&|\|\|)/)) return 'operator'
    if (stream.match(/^[+\-*/%<>!=]/)) return 'operator'
    if (stream.match(/^[(){},;]/)) return 'punctuation'

    stream.next()
    return null
  },

  languageData: {
    commentTokens: { line: '//', block: { open: '/*', close: '*/' } },
    closeBrackets: { brackets: ['(', '{', '"', "'"] },
    indentOnInput: /^\s*\}$/,
  },
})

/** Cores do editor, tiradas da mesma paleta do rio. */
export const mimiHighlight = HighlightStyle.define([
  { tag: tags.comment, color: '#6e97a3', fontStyle: 'italic' },
  { tag: tags.keyword, color: '#ffb84d', fontWeight: '700' },
  { tag: tags.bool, color: '#ffb84d' },
  { tag: tags.string, color: '#ffd6e8' },
  { tag: tags.number, color: '#7fd8e0' },
  { tag: tags.operator, color: '#9dc2cc' },
  { tag: tags.punctuation, color: '#9dc2cc' },
  { tag: tags.variableName, color: '#dcf1f5' },
  { tag: tags.standard(tags.variableName), color: '#6ed08c', fontWeight: '600' },
])

export const mimiTheme = EditorView.theme(
  {
    '&': {
      color: '#dcf1f5',
      backgroundColor: 'transparent',
      fontSize: '15px',
      height: '100%',
    },
    '.cm-content': {
      fontFamily: "'JetBrains Mono', Consolas, monospace",
      padding: '14px 0 60px',
      lineHeight: '1.65',
      caretColor: '#ffb84d',
    },
    '.cm-line': { padding: '0 16px' },
    '&.cm-focused': { outline: 'none' },
    '.cm-gutters': {
      backgroundColor: 'transparent',
      color: '#4f7b88',
      border: 'none',
      paddingRight: '4px',
    },
    '.cm-activeLineGutter': { backgroundColor: 'transparent', color: '#9dc2cc' },
    '.cm-activeLine': { backgroundColor: 'rgba(255, 255, 255, 0.035)' },
    '.cm-cursor, .cm-dropCursor': { borderLeftColor: '#ffb84d', borderLeftWidth: '2px' },
    '.cm-selectionBackground, &.cm-focused .cm-selectionBackground, ::selection': {
      backgroundColor: 'rgba(255, 184, 77, 0.22)',
    },
    '.cm-matchingBracket, &.cm-focused .cm-matchingBracket': {
      backgroundColor: 'rgba(255, 184, 77, 0.24)',
      outline: 'none',
      borderRadius: '3px',
    },
    '.cm-tooltip': {
      backgroundColor: '#11495a',
      border: '1px solid rgba(255,255,255,0.18)',
      borderRadius: '12px',
      boxShadow: '0 12px 32px rgba(4,30,38,0.4)',
      overflow: 'hidden',
    },
    '.cm-tooltip-autocomplete ul li': {
      fontFamily: "'JetBrains Mono', monospace",
      padding: '6px 12px',
    },
    '.cm-tooltip-autocomplete ul li[aria-selected]': {
      backgroundColor: 'rgba(255, 184, 77, 0.22)',
      color: '#f4fdff',
    },
    // Linha que está executando agora
    '.cm-line.sm-active-line': {
      backgroundColor: 'rgba(255, 184, 77, 0.16)',
      boxShadow: 'inset 3px 0 0 #ffb84d',
    },
    // Linha onde está o erro
    '.cm-line.sm-error-line': {
      backgroundColor: 'rgba(255, 107, 107, 0.18)',
      boxShadow: 'inset 3px 0 0 #ff6b6b',
    },
  },
  { dark: true },
)

/**
 * Autocompletar.
 *
 * Só sugere o que a fase liberou: ver `while` na primeira fase confundiria
 * mais do que ajudaria.
 */
export function mimiCompletions(allowed: Set<string>) {
  return (context: CompletionContext): CompletionResult | null => {
    const word = context.matchBefore(/[A-Za-z_][A-Za-z0-9_]*/)
    if (!word || (word.from === word.to && !context.explicit)) return null

    const options = COMMANDS.filter((command) => allowed.has(command.id)).map((command) => {
      const { text, cursor } = parseInsert(command.insert)
      return {
        label: command.id,
        detail: command.labelPt,
        info: `${command.description}\n\n${command.example}`,
        type: command.category === 'controle' ? 'keyword' : 'function',
        apply: (view: EditorView, _completion: unknown, from: number, to: number) => {
          view.dispatch({
            changes: { from, to, insert: text },
            selection: { anchor: from + cursor },
          })
        },
      }
    })

    return { from: word.from, options, validFor: /^[A-Za-z_][A-Za-z0-9_]*$/ }
  }
}

export const mimiSyntaxHighlighting = syntaxHighlighting(mimiHighlight)
