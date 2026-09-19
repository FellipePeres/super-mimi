import { useState } from 'react'
import { KEYWORDS } from '../lang/tokenizer'
import { COMMANDS_BY_ID } from '../lang/commands'

interface CodeBlockProps {
  code: string
  copyable?: boolean
}

/**
 * Bloco de código colorido, para as dicas.
 *
 * Usa um destaque próprio e bem simples em vez do CodeMirror: aqui o código é
 * só leitura, e montar um editor inteiro para exibir seis linhas seria peso
 * morto. As cores são as mesmas do editor de verdade, que é o que importa —
 * o aluno precisa reconhecer `repeat` na dica pela mesma cor que vê ao
 * digitar.
 */
export function CodeBlock({ code, copyable = false }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      /* sem permissão de área de transferência: o aluno digita, que é melhor */
    }
  }

  return (
    <div className="sm-code">
      <pre>
        <code>
          {code.split('\n').map((line, index) => (
            <span className="sm-code__line" key={index}>
              {highlight(line)}
            </span>
          ))}
        </code>
      </pre>

      {copyable && (
        <button
          type="button"
          className={`sm-code__copy ${copied ? 'is-copied' : ''}`}
          onClick={copy}
          data-sfx="off"
        >
          {copied ? 'Copiado!' : 'Copiar'}
        </button>
      )}
    </div>
  )
}

/**
 * Tokeniza a linha em pedaços coloridos.
 *
 * A ordem do regex importa: comentário primeiro (engole o resto da linha),
 * depois texto entre aspas, depois números e palavras.
 */
function highlight(line: string): React.ReactNode[] {
  const out: React.ReactNode[] = []
  const pattern = /(\/\/.*$)|("[^"]*"|'[^']*')|(\b\d+\b)|([A-Za-z_][A-Za-z0-9_]*)|(\?)/g

  let last = 0
  let match: RegExpExecArray | null
  let key = 0

  while ((match = pattern.exec(line)) !== null) {
    if (match.index > last) out.push(line.slice(last, match.index))

    const [text, comment, string, number, word, gap] = match

    if (comment) {
      out.push(<span key={key++} className="tok-comment">{text}</span>)
    } else if (string) {
      out.push(<span key={key++} className="tok-string">{text}</span>)
    } else if (number) {
      out.push(<span key={key++} className="tok-number">{text}</span>)
    } else if (gap) {
      // A lacuna é o ponto de ação da dica: precisa saltar aos olhos
      out.push(<span key={key++} className="tok-gap">{text}</span>)
    } else if (word) {
      const cls = KEYWORDS.has(word)
        ? 'tok-keyword'
        : COMMANDS_BY_ID.has(word)
          ? 'tok-builtin'
          : 'tok-name'
      out.push(<span key={key++} className={cls}>{text}</span>)
    }

    last = match.index + text.length
  }

  if (last < line.length) out.push(line.slice(last))
  return out
}
