import type { Direction, Vec2 } from '../engine/types'
import type { WorldConfig } from '../engine/world'

export interface LevelHint {
  /** Frase curta que enquadra o código, sem entregar os números. */
  text: string
  /** Esqueleto na primeira dica, solução completa na segunda. */
  code: string
}

/**
 * Uma fase.
 *
 * O campo `allowed` é o que faz a progressão funcionar: a barra de comandos
 * só mostra o que a fase liberou, então o aluno nunca encara vinte comandos
 * na primeira tela. É uma decisão de currículo, não de interface.
 */
export interface LevelSpec {
  id: string
  world: number
  /** Posição dentro do mundo, começando em 1. */
  index: number
  title: string
  /** Objetivo em uma linha, mostrado no topo do jogo. */
  goal: string
  /** Conceito novo desta fase, em duas ou três palavras. */
  teaches: string
  /** Explicação mostrada antes de começar. Um parágrafo por item. */
  briefing: string[]
  /**
   * As duas dicas da fase, liberadas uma de cada vez.
   *
   * A primeira mostra a **forma** da solução com lacunas, para o aluno
   * preencher; a segunda entrega o código pronto. Separar em dois níveis é o
   * que permite destravar quem está perdido sem tirar a descoberta de quem só
   * precisava de um empurrão.
   */
  hints: [LevelHint, LevelHint]

  width: number
  height: number
  map: string[]
  start: Vec2
  facing?: Direction
  seeds?: Vec2[]
  currents?: Array<{ x: number; y: number; dir: Direction }>

  /** Comandos que aparecem na barra nesta fase. */
  allowed: string[]
  /** Limite de linhas para ganhar a segunda estrela. */
  parLines: number
  /** Código que já vem escrito no editor. */
  starterCode: string
}

export function levelToWorldConfig(level: LevelSpec): WorldConfig {
  return {
    width: level.width,
    height: level.height,
    map: level.map,
    start: level.start,
    facing: level.facing ?? 'east',
    seeds: level.seeds,
    currents: level.currents,
  }
}

/** Conta só as linhas que têm código — comentários e vazias não penalizam. */
export function countCodeLines(source: string): number {
  return source
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('//'))
    .filter((line) => line !== '}' && line !== '{')
    .length
}

export interface LevelStars {
  /** Chegou na vitória régia florida. */
  finished: boolean
  /** Usou no máximo `parLines` linhas. */
  concise: boolean
  /** Coletou todas as sementes. */
  collectedAll: boolean
}

export function countStars(stars: LevelStars): number {
  return Number(stars.finished) + Number(stars.concise) + Number(stars.collectedAll)
}

export interface WorldInfo {
  id: number
  name: string
  subtitle: string
  /** Cor de destaque do mundo no mapa de fases. */
  accent: string
}

export const WORLDS: WorldInfo[] = [
  {
    id: 1,
    name: 'Riacho Calmo',
    subtitle: 'Dê os primeiros comandos e aprenda a ler o plano cartesiano.',
    accent: '#7fd8e0',
  },
  {
    id: 2,
    name: 'Corredeira',
    subtitle: 'Repita comandos sem reescrever tudo.',
    accent: '#4caf6d',
  },
  {
    id: 3,
    name: 'Brejo das Sombras',
    subtitle: 'Faça a Mimi decidir sozinha o que fazer.',
    accent: '#ffb84d',
  },
  {
    id: 4,
    name: 'Foz Grande',
    subtitle: 'Guarde valores e crie seus próprios comandos.',
    accent: '#f4a6c8',
  },
]
