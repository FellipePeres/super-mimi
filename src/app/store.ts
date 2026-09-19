import { create } from 'zustand'
import type { RunnerStatus } from '../engine/runner'
import type { MimiError } from '../lang/errors'
import type { CharacterId } from '../render/turtleSprite'
import { FIRST_LEVEL_ID, LEVELS, type LevelStars } from '../levels'
import { DEFAULT_VOLUME_AMBIENT, DEFAULT_VOLUME_EFFECTS } from '../audio/sfx'

export type Screen = 'title' | 'character' | 'levelMap' | 'level' | 'free'

export interface ConsoleLine {
  id: number
  kind: 'info' | 'say' | 'success' | 'error' | 'hint'
  text: string
  /** Segunda linha, mostrada com o ícone de dica. */
  hint?: string
}

function clampVolume(value: unknown, fallback: number): number {
  if (typeof value !== 'number' || Number.isNaN(value)) return fallback
  return Math.max(0, Math.min(1, value))
}

const STORAGE_KEY = 'super-mimi:save:v1'

interface SaveData {
  character: CharacterId
  progress: Record<string, LevelStars>
  freeCode: string
  muted: boolean
  volumeAmbient: number
  volumeEffects: number
}

function loadSave(): SaveData {
  const fallback: SaveData = {
    character: 'mimi',
    progress: {},
    freeCode: DEFAULT_FREE_CODE,
    muted: false,
    volumeAmbient: DEFAULT_VOLUME_AMBIENT,
    volumeEffects: DEFAULT_VOLUME_EFFECTS,
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return fallback
    const parsed = JSON.parse(raw) as Partial<SaveData>
    return {
      character: parsed.character === 'pipe' ? 'pipe' : 'mimi',
      progress: parsed.progress ?? {},
      freeCode: typeof parsed.freeCode === 'string' ? parsed.freeCode : DEFAULT_FREE_CODE,
      muted: parsed.muted === true,
      volumeAmbient: clampVolume(parsed.volumeAmbient, DEFAULT_VOLUME_AMBIENT),
      volumeEffects: clampVolume(parsed.volumeEffects, DEFAULT_VOLUME_EFFECTS),
    }
  } catch {
    // Armazenamento bloqueado ou corrompido: seguir com o jogo zerado é melhor
    // do que travar na tela inicial.
    return fallback
  }
}

function persist(data: SaveData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    /* modo privado ou cota cheia: o jogo continua, só não lembra */
  }
}

export const DEFAULT_FREE_CODE = `// Bem-vindo ao Modo Livre!
// Aqui não tem objetivo: escreva o que quiser e veja a Mimi nadar.

repeat(4) {
  swim(2, 0)
  turn("left")
}
`

interface AppState {
  // ---- navegação
  screen: Screen
  character: CharacterId
  levelId: string
  showBriefing: boolean
  /** Quantas dicas da fase já foram reveladas: 0, 1 ou 2. */
  hintLevel: number

  // ---- editor e execução
  code: string
  freeCode: string
  status: RunnerStatus
  activeLine: number | null
  error: MimiError | null
  speed: number
  console: ConsoleLine[]

  // ---- resultado
  progress: Record<string, LevelStars>
  lastResult: { levelId: string; stars: LevelStars } | null

  // ---- preferências
  muted: boolean
  volumeAmbient: number
  volumeEffects: number

  // ---- ações
  goTo: (screen: Screen) => void
  setCharacter: (character: CharacterId) => void
  openLevel: (levelId: string) => void
  setCode: (code: string) => void
  setStatus: (status: RunnerStatus) => void
  setActiveLine: (line: number | null) => void
  setError: (error: MimiError | null) => void
  setSpeed: (speed: number) => void
  pushConsole: (line: Omit<ConsoleLine, 'id'>) => void
  clearConsole: () => void
  setShowBriefing: (show: boolean) => void
  revealNextHint: () => void
  recordResult: (levelId: string, stars: LevelStars) => void
  dismissResult: () => void
  toggleMuted: () => void
  setVolumeAmbient: (volume: number) => void
  setVolumeEffects: (volume: number) => void
  resetProgress: () => void
}

let consoleId = 0

const saved = loadSave()

export const useStore = create<AppState>((set, get) => ({
  screen: 'title',
  character: saved.character,
  levelId: FIRST_LEVEL_ID,
  showBriefing: true,
  hintLevel: 0,

  code: '',
  freeCode: saved.freeCode,
  status: 'idle',
  activeLine: null,
  error: null,
  speed: 1,
  console: [],

  progress: saved.progress,
  lastResult: null,

  muted: saved.muted,
  volumeAmbient: saved.volumeAmbient,
  volumeEffects: saved.volumeEffects,

  goTo: (screen) => set({ screen }),

  setCharacter: (character) => {
    set({ character })
    persist({ ...snapshot(get()), character })
  },

  openLevel: (levelId) =>
    set({
      levelId,
      screen: 'level',
      showBriefing: true,
      hintLevel: 0,
      error: null,
      activeLine: null,
      status: 'idle',
      console: [],
      lastResult: null,
    }),

  setCode: (code) => {
    const { screen } = get()
    if (screen === 'free') {
      set({ code, freeCode: code })
      persist({ ...snapshot(get()), freeCode: code })
    } else {
      set({ code })
    }
  },

  setStatus: (status) => set({ status }),
  setActiveLine: (activeLine) => set({ activeLine }),
  setError: (error) => set({ error }),
  setSpeed: (speed) => set({ speed }),

  pushConsole: (line) =>
    set((state) => ({
      // Limite de 80 linhas: o console é para acompanhar, não para arquivar
      console: [...state.console, { ...line, id: ++consoleId }].slice(-80),
    })),

  clearConsole: () => set({ console: [] }),

  setShowBriefing: (showBriefing) => set({ showBriefing }),

  // Uma dica de cada vez, e sem voltar atrás: o aluno decide quanto quer saber
  revealNextHint: () => set((state) => ({ hintLevel: Math.min(2, state.hintLevel + 1) })),

  recordResult: (levelId, stars) => {
    const previous = get().progress[levelId]
    // Nunca rebaixa: uma estrela conquistada fica conquistada
    const merged: LevelStars = {
      finished: stars.finished || previous?.finished || false,
      concise: stars.concise || previous?.concise || false,
      collectedAll: stars.collectedAll || previous?.collectedAll || false,
    }

    const progress = { ...get().progress, [levelId]: merged }
    set({ progress, lastResult: { levelId, stars } })
    persist({ ...snapshot(get()), progress })
  },

  dismissResult: () => set({ lastResult: null }),

  toggleMuted: () => {
    const muted = !get().muted
    set({ muted })
    persist({ ...snapshot(get()), muted })
  },

  setVolumeAmbient: (volume) => {
    const volumeAmbient = clampVolume(volume, DEFAULT_VOLUME_AMBIENT)
    set({ volumeAmbient })
    persist({ ...snapshot(get()), volumeAmbient })
  },

  setVolumeEffects: (volume) => {
    const volumeEffects = clampVolume(volume, DEFAULT_VOLUME_EFFECTS)
    set({ volumeEffects })
    persist({ ...snapshot(get()), volumeEffects })
  },

  resetProgress: () => {
    set({ progress: {}, lastResult: null })
    persist({ ...snapshot(get()), progress: {} })
  },
}))

function snapshot(state: AppState): SaveData {
  return {
    character: state.character,
    progress: state.progress,
    freeCode: state.freeCode,
    muted: state.muted,
    volumeAmbient: state.volumeAmbient,
    volumeEffects: state.volumeEffects,
  }
}

// ------------------------------------------------------------------ seletores

/** Uma fase está liberada se é a primeira ou se a anterior foi concluída. */
export function isLevelUnlocked(
  levelId: string,
  progress: Record<string, LevelStars>,
): boolean {
  const index = LEVELS.findIndex((level) => level.id === levelId)
  if (index <= 0) return true
  const previous = LEVELS[index - 1]
  return previous ? progress[previous.id]?.finished === true : false
}

export function totalStars(progress: Record<string, LevelStars>): number {
  return Object.values(progress).reduce(
    (sum, stars) =>
      sum + Number(stars.finished) + Number(stars.concise) + Number(stars.collectedAll),
    0,
  )
}
