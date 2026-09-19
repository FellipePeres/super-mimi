/// <reference types="vite/client" />
import type { CharacterId } from '../render/turtleSprite'
import { spriteUrl } from '../render/sprites'

interface TurtlePortraitProps {
  character: CharacterId
  size?: number
  /** Anima a pose de aceno e o balanço de espera. */
  animated?: boolean
  className?: string
}

interface Skin {
  shell: string
  shellDark: string
  shellLight: string
  belly: string
  skin: string
  skinDark: string
  name: string
}

const SKINS: Record<CharacterId, Skin> = {
  mimi: {
    shell: '#8cc63f',
    shellDark: '#6aa62c',
    shellLight: '#a8dc5e',
    belly: '#f5e3b3',
    skin: '#b8d96a',
    skinDark: '#94b84c',
    name: 'Mimi',
  },
  pipe: {
    shell: '#5b8c4a',
    shellDark: '#446b37',
    shellLight: '#74a860',
    belly: '#e6d3a3',
    skin: '#87a86b',
    skinDark: '#6b8a52',
    name: 'Pipe',
  },
}

/**
 * Retrato do personagem para as telas de menu.
 *
 * Usa `mimi-portrait.png` / `pipe-portrait.png` quando existirem em
 * `src/render/sprites/`; enquanto não existirem, desenha a tartaruga em SVG aqui
 * mesmo. O app inteiro precisa ficar apresentável antes de a arte chegar.
 */
export function TurtlePortrait({
  character,
  size = 200,
  animated = true,
  className = '',
}: TurtlePortraitProps) {
  const skin = SKINS[character]

  // O retrato existe só se alguém tiver colocado o arquivo na pasta de arte;
  // caso contrário, o SVG abaixo é a versão oficial do personagem.
  const artUrl = spriteUrl(`${character}-portrait`)

  if (artUrl) {
    return (
      <img
        src={artUrl}
        alt={skin.name}
        width={size}
        height={size}
        className={`sm-portrait ${animated ? 'is-animated' : ''} ${className}`}
      />
    )
  }

  return (
    <svg
      viewBox="0 0 200 240"
      width={size}
      height={size * 1.2}
      className={`sm-portrait ${animated ? 'is-animated' : ''} ${className}`}
      role="img"
      aria-label={skin.name}
    >
      <defs>
        <radialGradient id={`shell-${character}`} cx="38%" cy="30%">
          <stop offset="0%" stopColor={skin.shellLight} />
          <stop offset="100%" stopColor={skin.shell} />
        </radialGradient>
        <linearGradient id={`belly-${character}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff8e2" />
          <stop offset="100%" stopColor={skin.belly} />
        </linearGradient>
      </defs>

      {/* sombra no chão */}
      <ellipse cx="100" cy="226" rx="52" ry="10" fill="#041e26" opacity="0.22" />

      {/* perna esquerda */}
      <g className="sm-portrait__leg-l">
        <rect x="70" y="182" width="24" height="32" rx="12" fill={skin.skinDark} />
        <ellipse cx="80" cy="214" rx="18" ry="11" fill={skin.skin} stroke="#123a45"
          strokeWidth="3" />
      </g>

      {/* perna direita */}
      <g className="sm-portrait__leg-r">
        <rect x="106" y="182" width="24" height="32" rx="12" fill={skin.skinDark} />
        <ellipse cx="120" cy="214" rx="18" ry="11" fill={skin.skin} stroke="#123a45"
          strokeWidth="3" />
      </g>

      {/* casco por trás, aparecendo nas laterais */}
      <ellipse cx="100" cy="140" rx="62" ry="54" fill={`url(#shell-${character})`}
        stroke="#123a45" strokeWidth="4" />

      {/* placas do casco */}
      <g opacity="0.55" stroke={skin.shellDark} strokeWidth="2.5" fill="none">
        <path d="M100 96 v88 M62 122 h76 M62 158 h76" />
        <path d="M74 100 l14 22 M126 100 l-14 22 M74 180 l14 -22 M126 180 l-14 -22" />
      </g>

      {/* barriga por cima do casco */}
      <ellipse cx="100" cy="148" rx="40" ry="42" fill={`url(#belly-${character})`}
        stroke="#123a45" strokeWidth="3.5" />

      {/* braço esquerdo, apoiado */}
      <g className="sm-portrait__arm-l">
        <rect x="34" y="128" width="34" height="19" rx="9.5" fill={skin.skin}
          stroke="#123a45" strokeWidth="3.5" />
        <circle cx="38" cy="138" r="12" fill={skin.skinDark} stroke="#123a45" strokeWidth="3.5" />
      </g>

      {/* braço direito, acenando */}
      <g className="sm-portrait__arm-r" style={{ transformOrigin: '140px 132px' }}>
        <rect x="132" y="104" width="19" height="40" rx="9.5" fill={skin.skin}
          stroke="#123a45" strokeWidth="3.5" />
        <circle cx="141" cy="100" r="13" fill={skin.skinDark} stroke="#123a45" strokeWidth="3.5" />
        <path d="M134 92 v-9 M141 89 v-11 M148 92 v-9" stroke="#123a45" strokeWidth="3"
          strokeLinecap="round" fill="none" />
      </g>

      {/* cabeça */}
      <g className="sm-portrait__head">
        <ellipse cx="100" cy="66" rx="46" ry="42" fill={skin.skin} stroke="#123a45"
          strokeWidth="4" />

        {/* bochechas */}
        {character === 'mimi' && (
          <>
            <ellipse cx="66" cy="78" rx="11" ry="7" fill="#ff9dc4" opacity="0.7" />
            <ellipse cx="134" cy="78" rx="11" ry="7" fill="#ff9dc4" opacity="0.7" />
          </>
        )}

        {character === 'pipe' ? (
          <>
            {/* óculos escuros */}
            <path d="M58 58 h84" stroke="#2b3440" strokeWidth="7" strokeLinecap="round" />
            <rect x="60" y="52" width="34" height="26" rx="11" fill="#2b3440" />
            <rect x="106" y="52" width="34" height="26" rx="11" fill="#2b3440" />
            <rect x="94" y="58" width="12" height="7" rx="3" fill="#2b3440" />
            <ellipse cx="72" cy="61" rx="7" ry="4" fill="#6fc4e8" opacity="0.85"
              transform="rotate(-18 72 61)" />
            <ellipse cx="118" cy="61" rx="7" ry="4" fill="#6fc4e8" opacity="0.85"
              transform="rotate(-18 118 61)" />
          </>
        ) : (
          <>
            {/* olhos grandes com cílios */}
            <ellipse cx="80" cy="62" rx="13" ry="15" fill="#fff" stroke="#123a45"
              strokeWidth="3" />
            <ellipse cx="120" cy="62" rx="13" ry="15" fill="#fff" stroke="#123a45"
              strokeWidth="3" />
            <circle cx="83" cy="64" r="7.5" fill="#123a45" />
            <circle cx="123" cy="64" r="7.5" fill="#123a45" />
            <circle cx="86" cy="60" r="3" fill="#fff" />
            <circle cx="126" cy="60" r="3" fill="#fff" />
            <path d="M67 50 l-8 -6 M73 45 l-4 -8 M133 50 l8 -6 M127 45 l4 -8"
              stroke="#123a45" strokeWidth="3" strokeLinecap="round" />
          </>
        )}

        {/* sorriso */}
        <path d="M86 86 q14 12 28 0" stroke="#123a45" strokeWidth="3.5" fill="none"
          strokeLinecap="round" />

        {character === 'mimi' && (
          /* laço rosa no alto da cabeça */
          <g className="sm-portrait__bow">
            <ellipse cx="74" cy="22" rx="19" ry="15" fill="#ff7eb3" stroke="#e85f97"
              strokeWidth="3" transform="rotate(-18 74 22)" />
            <ellipse cx="126" cy="22" rx="19" ry="15" fill="#ff7eb3" stroke="#e85f97"
              strokeWidth="3" transform="rotate(18 126 22)" />
            <ellipse cx="74" cy="22" rx="8" ry="6" fill="#e85f97" opacity="0.5"
              transform="rotate(-18 74 22)" />
            <ellipse cx="126" cy="22" rx="8" ry="6" fill="#e85f97" opacity="0.5"
              transform="rotate(18 126 22)" />
            <circle cx="100" cy="24" r="11" fill="#ffd6e8" stroke="#e85f97" strokeWidth="3" />
          </g>
        )}
      </g>
    </svg>
  )
}

export function characterName(character: CharacterId): string {
  return SKINS[character].name
}
