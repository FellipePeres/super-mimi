import { Texture } from 'pixi.js'
import { cssRgb, PALETTE } from './palette'

/**
 * Texturas geradas em canvas 2D e entregues ao Pixi.
 *
 * Nada aqui vem de arquivo: o rio inteiro — ondulação, caustics, brilho — é
 * desenhado em tempo de carga. Isso mantém o bundle leve e deixa a estética
 * ajustável por número, não por reexportar imagem.
 */

const cache = new Map<string, Texture>()

function makeCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  return canvas
}

function cached(key: string, build: () => HTMLCanvasElement): Texture {
  const hit = cache.get(key)
  if (hit) return hit
  const texture = Texture.from(build())
  cache.set(key, texture)
  return texture
}

// --------------------------------------------------------------- value noise

/** Hash determinístico: a mesma semente sempre gera a mesma água. */
function hash2(x: number, y: number, seed: number): number {
  let h = x * 374761393 + y * 668265263 + seed * 1442695040888963407
  h = (h ^ (h >> 13)) * 1274126177
  return ((h ^ (h >> 16)) >>> 0) / 4294967295
}

const smoothstep = (t: number) => t * t * (3 - 2 * t)

function valueNoise(x: number, y: number, seed: number): number {
  const x0 = Math.floor(x)
  const y0 = Math.floor(y)
  const fx = smoothstep(x - x0)
  const fy = smoothstep(y - y0)

  const a = hash2(x0, y0, seed)
  const b = hash2(x0 + 1, y0, seed)
  const c = hash2(x0, y0 + 1, seed)
  const d = hash2(x0 + 1, y0 + 1, seed)

  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy
}

/** Soma de oitavas — o que dá à água a textura "orgânica". */
function fbm(x: number, y: number, seed: number, octaves = 4): number {
  let value = 0
  let amplitude = 0.5
  let frequency = 1
  let total = 0

  for (let i = 0; i < octaves; i++) {
    value += valueNoise(x * frequency, y * frequency, seed + i * 37) * amplitude
    total += amplitude
    amplitude *= 0.5
    frequency *= 2
  }
  return value / total
}

// ------------------------------------------------------------------ texturas

/**
 * Mapa de deslocamento do `DisplacementFilter`.
 *
 * O canal vermelho empurra em X e o verde em Y, então o ruído precisa ser
 * *tileável* — senão a emenda aparece como uma costura parada na água.
 */
export function noiseTexture(size = 256, scale = 4): Texture {
  return cached(`noise-${size}-${scale}`, () => {
    const canvas = makeCanvas(size, size)
    const ctx = canvas.getContext('2d')!
    const image = ctx.createImageData(size, size)

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const u = (x / size) * scale
        const v = (y / size) * scale

        // Interpolação com as bordas opostas deixa a textura tileável
        const fu = x / size
        const fv = y / size
        const n =
          fbm(u, v, 1) * (1 - fu) * (1 - fv) +
          fbm(u - scale, v, 1) * fu * (1 - fv) +
          fbm(u, v - scale, 1) * (1 - fu) * fv +
          fbm(u - scale, v - scale, 1) * fu * fv

        const m =
          fbm(u + 11.3, v + 7.7, 2) * (1 - fu) * (1 - fv) +
          fbm(u - scale + 11.3, v + 7.7, 2) * fu * (1 - fv) +
          fbm(u + 11.3, v - scale + 7.7, 2) * (1 - fu) * fv +
          fbm(u - scale + 11.3, v - scale + 7.7, 2) * fu * fv

        const i = (y * size + x) * 4
        image.data[i] = Math.floor(n * 255)
        image.data[i + 1] = Math.floor(m * 255)
        image.data[i + 2] = 128
        image.data[i + 3] = 255
      }
    }

    ctx.putImageData(image, 0, 0)
    return canvas
  })
}

/**
 * Caustics: a renda de luz que o sol faz no fundo do rio.
 *
 * O truque é somar ondas senoidais em direções diferentes e manter só as
 * cristas (`pow` alto), o que produz as linhas finas em vez de manchas.
 */
export function causticsTexture(size = 512): Texture {
  return cached(`caustics-${size}`, () => {
    const canvas = makeCanvas(size, size)
    const ctx = canvas.getContext('2d')!
    const image = ctx.createImageData(size, size)

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const u = (x / size) * Math.PI * 2
        const v = (y / size) * Math.PI * 2

        // Três ondas em ângulos diferentes; múltiplos inteiros mantêm o tile
        const w1 = Math.sin(u * 3 + Math.cos(v * 2) * 1.6)
        const w2 = Math.sin(v * 4 - Math.sin(u * 3) * 1.2)
        const w3 = Math.sin((u + v) * 2.5)

        let intensity = (w1 + w2 + w3) / 3
        intensity = Math.pow(Math.max(0, intensity), 6)

        const i = (y * size + x) * 4
        image.data[i] = 255
        image.data[i + 1] = 255
        image.data[i + 2] = 255
        image.data[i + 3] = Math.floor(intensity * 190)
      }
    }

    ctx.putImageData(image, 0, 0)
    return canvas
  })
}

/** Gradiente vertical de profundidade: o fundo estático do rio. */
export function depthGradientTexture(height = 512): Texture {
  return cached(`depth-${height}`, () => {
    const canvas = makeCanvas(4, height)
    const ctx = canvas.getContext('2d')!

    const gradient = ctx.createLinearGradient(0, 0, 0, height)
    gradient.addColorStop(0, cssRgb(PALETTE.waterShallow))
    gradient.addColorStop(0.35, cssRgb(PALETTE.waterMid))
    gradient.addColorStop(0.78, cssRgb(PALETTE.waterDeep))
    gradient.addColorStop(1, cssRgb(PALETTE.waterAbyss))

    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 4, height)
    return canvas
  })
}

/** Disco com borda suave — serve de bolha, brilho e sombra. */
export function softCircleTexture(size = 128, softness = 0.55): Texture {
  return cached(`circle-${size}-${softness}`, () => {
    const canvas = makeCanvas(size, size)
    const ctx = canvas.getContext('2d')!
    const r = size / 2

    const gradient = ctx.createRadialGradient(r, r, 0, r, r, r)
    gradient.addColorStop(0, 'rgba(255,255,255,1)')
    gradient.addColorStop(Math.max(0, 1 - softness), 'rgba(255,255,255,0.92)')
    gradient.addColorStop(1, 'rgba(255,255,255,0)')

    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, size, size)
    return canvas
  })
}

/** Anel fino, usado na bolha de ar e no pulso de vitória. */
export function ringTexture(size = 128, thickness = 0.12): Texture {
  return cached(`ring-${size}-${thickness}`, () => {
    const canvas = makeCanvas(size, size)
    const ctx = canvas.getContext('2d')!
    const r = size / 2

    ctx.strokeStyle = 'rgba(255,255,255,0.95)'
    ctx.lineWidth = size * thickness
    ctx.beginPath()
    ctx.arc(r, r, r - (size * thickness) / 2 - 1, 0, Math.PI * 2)
    ctx.stroke()
    return canvas
  })
}

/** Textura de espuma irregular para a esteira da tartaruga. */
export function foamTexture(size = 96): Texture {
  return cached(`foam-${size}`, () => {
    const canvas = makeCanvas(size, size)
    const ctx = canvas.getContext('2d')!
    const image = ctx.createImageData(size, size)
    const center = size / 2

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const dx = (x - center) / center
        const dy = (y - center) / center
        const dist = Math.sqrt(dx * dx + dy * dy)

        const n = fbm((x / size) * 6, (y / size) * 6, 9, 3)
        const falloff = Math.max(0, 1 - dist)
        const alpha = Math.pow(falloff, 1.8) * (0.35 + n * 0.85)

        const i = (y * size + x) * 4
        image.data[i] = 255
        image.data[i + 1] = 255
        image.data[i + 2] = 255
        image.data[i + 3] = Math.floor(Math.min(1, alpha) * 255)
      }
    }

    ctx.putImageData(image, 0, 0)
    return canvas
  })
}

export function clearTextureCache(): void {
  cache.clear()
}
