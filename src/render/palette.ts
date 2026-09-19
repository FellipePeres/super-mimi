/**
 * Espelho numérico de `styles/tokens.css`, porque o Pixi quer cores como
 * número e o CSS as quer como texto.
 *
 * Se mudar uma cor aqui, mude lá também — estes dois arquivos são a mesma
 * paleta vista de dois lados.
 */

export const PALETTE = {
  waterAbyss: 0x0d4d5e,
  waterDeep: 0x14657a,
  waterMid: 0x2ba3b8,
  waterShallow: 0x7fd8e0,
  waterFoam: 0xe8fbfc,

  lilyLight: 0x6ed08c,
  lily: 0x4caf6d,
  lilyDark: 0x2e7d4f,
  lilyVein: 0x3d9460,
  reed: 0x4e8c5a,
  reedDark: 0x3a6b44,
  flower: 0xf4a6c8,
  flowerLight: 0xffd6e8,
  flowerCore: 0xffe9a8,

  sand: 0xf2d9a8,
  sandDark: 0xd9b97e,
  rock: 0x8494a0,
  rockDark: 0x5d6b76,
  rockLight: 0xa8b6c0,
  log: 0xa1734a,
  logDark: 0x7a5433,
  logLight: 0xbe8e63,

  mimiShell: 0x8cc63f,
  mimiShellDark: 0x6aa62c,
  mimiBelly: 0xf5e3b3,
  mimiBow: 0xff7eb3,
  mimiBowDark: 0xe85f97,
  pipeShell: 0x5b8c4a,
  pipeShellDark: 0x446b37,
  pipeBelly: 0xe6d3a3,
  pipeGlasses: 0x2b3440,

  action: 0xffb84d,
  danger: 0xff6b6b,
  success: 0x4caf6d,
  star: 0xffd24d,

  outline: 0x123a45,
  white: 0xffffff,
  shadow: 0x041e26,
} as const

/** Converte 0xRRGGBB para os componentes 0..1 usados em interpolação. */
export function toRgb(color: number): [number, number, number] {
  return [
    ((color >> 16) & 0xff) / 255,
    ((color >> 8) & 0xff) / 255,
    (color & 0xff) / 255,
  ]
}

export function fromRgb(r: number, g: number, b: number): number {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v * 255)))
  return (clamp(r) << 16) | (clamp(g) << 8) | clamp(b)
}

/** Mistura duas cores. `t` = 0 devolve `a`, `t` = 1 devolve `b`. */
export function mixColor(a: number, b: number, t: number): number {
  const [ar, ag, ab] = toRgb(a)
  const [br, bg, bb] = toRgb(b)
  return fromRgb(ar + (br - ar) * t, ag + (bg - ag) * t, ab + (bb - ab) * t)
}

export function cssRgb(color: number, alpha = 1): string {
  const r = (color >> 16) & 0xff
  const g = (color >> 8) & 0xff
  const b = color & 0xff
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}
