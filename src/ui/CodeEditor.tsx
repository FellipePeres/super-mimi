import { useEffect, useMemo, useRef } from 'react'
import { EditorState, StateEffect, StateField, type Extension } from '@codemirror/state'
import {
  Decoration, EditorView, drawSelection, highlightActiveLine,
  highlightActiveLineGutter, keymap, lineNumbers, type DecorationSet,
} from '@codemirror/view'
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands'
import {
  autocompletion, closeBrackets, closeBracketsKeymap, completionKeymap,
} from '@codemirror/autocomplete'
import { bracketMatching, indentUnit } from '@codemirror/language'
import {
  mimiCompletions, mimiscriptLanguage, mimiSyntaxHighlighting, mimiTheme,
} from '../lang/codemirror-mimiscript'
import { parseInsert } from '../lang/commands'

/** Efeito que marca qual linha está executando e qual tem erro. */
const setMarkers = StateEffect.define<{ active: number | null; error: number | null }>()

const activeLineDecoration = Decoration.line({ class: 'sm-active-line' })
const errorLineDecoration = Decoration.line({ class: 'sm-error-line' })

const markerField = StateField.define<DecorationSet>({
  create: () => Decoration.none,

  update(decorations, transaction) {
    let next = decorations.map(transaction.changes)

    for (const effect of transaction.effects) {
      if (!effect.is(setMarkers)) continue

      const marks = []
      const { active, error } = effect.value
      const total = transaction.state.doc.lines

      // A linha de erro tem prioridade: se as duas coincidem, mostra o erro
      if (error !== null && error >= 1 && error <= total) {
        marks.push(errorLineDecoration.range(transaction.state.doc.line(error).from))
      } else if (active !== null && active >= 1 && active <= total) {
        marks.push(activeLineDecoration.range(transaction.state.doc.line(active).from))
      }

      next = Decoration.set(marks)
    }

    return next
  },

  provide: (field) => EditorView.decorations.from(field),
})

export interface CodeEditorHandle {
  /** Insere um molde de comando na posição do cursor. */
  insert: (snippet: string) => void
  focus: () => void
}

interface CodeEditorProps {
  value: string
  onChange: (value: string) => void
  /** Ids de comando liberados, para filtrar o autocompletar. */
  allowed: string[]
  activeLine: number | null
  errorLine: number | null
  readOnly?: boolean
  editorRef?: (handle: CodeEditorHandle | null) => void
}

export function CodeEditor({
  value,
  onChange,
  allowed,
  activeLine,
  errorLine,
  readOnly = false,
  editorRef,
}: CodeEditorProps) {
  const host = useRef<HTMLDivElement>(null)
  const view = useRef<EditorView | null>(null)
  // Mantido num ref para o listener não precisar ser recriado a cada tecla
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  const allowedKey = allowed.join(',')

  const extensions = useMemo<Extension[]>(
    () => [
      lineNumbers(),
      history(),
      drawSelection(),
      highlightActiveLine(),
      highlightActiveLineGutter(),
      bracketMatching(),
      closeBrackets(),
      indentUnit.of('  '),
      autocompletion({
        override: [mimiCompletions(new Set(allowedKey.split(',')))],
        activateOnTyping: true,
        icons: false,
      }),
      keymap.of([
        ...closeBracketsKeymap,
        ...defaultKeymap,
        ...historyKeymap,
        ...completionKeymap,
        indentWithTab,
      ]),
      mimiscriptLanguage,
      mimiSyntaxHighlighting,
      mimiTheme,
      markerField,
      EditorView.lineWrapping,
      EditorState.readOnly.of(readOnly),
      EditorView.updateListener.of((update) => {
        if (update.docChanged) onChangeRef.current(update.state.doc.toString())
      }),
    ],
    [allowedKey, readOnly],
  )

  // Cria o editor uma vez; trocar extensões recria, o que é raro
  useEffect(() => {
    if (!host.current) return

    const instance = new EditorView({
      state: EditorState.create({ doc: value, extensions }),
      parent: host.current,
    })
    view.current = instance

    editorRef?.({
      insert: (snippet: string) => {
        const { text, cursor } = parseInsert(snippet)
        const { from, to } = instance.state.selection.main

        // Se o cursor está no meio de uma linha com código, quebra antes
        const line = instance.state.doc.lineAt(from)
        const before = instance.state.doc.sliceString(line.from, from).trim()
        const indent = /^\s*/.exec(line.text)?.[0] ?? ''
        const prefix = before.length > 0 ? `\n${indent}` : ''

        instance.dispatch({
          changes: { from, to, insert: prefix + text },
          selection: { anchor: from + prefix.length + cursor },
          scrollIntoView: true,
        })
        instance.focus()
      },
      focus: () => instance.focus(),
    })

    return () => {
      editorRef?.(null)
      instance.destroy()
      view.current = null
    }
    // `value` entra só como conteúdo inicial: a sincronização vive no efeito abaixo
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [extensions])

  // Sincroniza mudanças vindas de fora (trocar de fase, resetar código)
  useEffect(() => {
    const instance = view.current
    if (!instance) return
    const current = instance.state.doc.toString()
    if (current === value) return

    instance.dispatch({
      changes: { from: 0, to: current.length, insert: value },
    })
  }, [value])

  useEffect(() => {
    view.current?.dispatch({
      effects: setMarkers.of({ active: activeLine, error: errorLine }),
    })
  }, [activeLine, errorLine])

  return <div className="sm-editor" ref={host} />
}
