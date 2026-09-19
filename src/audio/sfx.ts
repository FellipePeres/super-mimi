/// <reference types="vite/client" />
import type { GameEvent } from '../engine/types'

/**
 * Camada de som.
 *
 * ---------------------------------------------------------------------------
 * COMO ADICIONAR OS SONS
 * ---------------------------------------------------------------------------
 * Coloque os arquivos em `src/audio/files/` usando exatamente estes nomes:
 *
 *   splash   collect   win     click    ambient
 *   bump     hop       star    select
 *   dive     error
 *
 * Extensões aceitas: .mp3, .ogg, .wav, .m4a  (ex.: `splash.mp3`)
 *
 * Não é preciso editar código: o `import.meta.glob` abaixo encontra os
 * arquivos em tempo de build e liga cada um ao momento certo do jogo. Arquivo
 * que não existir simplesmente não toca.
 *
 * **Apare o silêncio do começo do arquivo.** É a causa número um de som que
 * parece atrasado — meio segundo de nada no início vira meio segundo de
 * atraso percebido, e nenhum código corrige isso.
 *
 * Veja `src/audio/files/LEIA-ME.md` para o que cada som representa.
 * ---------------------------------------------------------------------------
 *
 * Por que Web Audio e não `<audio>`
 * ---------------------------------------------------------------------------
 * `HTMLAudioElement.play()` é assíncrono: ele devolve uma promessa e o som sai
 * alguns quadros depois, com atraso variável. Para um clique de interface isso
 * é percebido como lentidão.
 *
 * Aqui os arquivos são decodificados uma vez, na carga, e guardados como
 * `AudioBuffer`. Disparar vira `start()` num nó novo — imediato e sem alocar
 * nada pesado. De quebra, o loop da trilha fica sem emenda, o que o elemento
 * `<audio>` também não garante.
 */

export type SoundId =
  | 'splash'      // braçada
  | 'bump'        // bateu em obstáculo
  | 'dive'        // mergulho
  | 'collect'     // pegou semente
  | 'hop'         // pulou na vitória régia
  | 'win'         // venceu a fase
  | 'star'        // ganhou estrela
  | 'error'       // erro no código
  | 'click'       // botão da interface
  | 'select'      // escolheu personagem
  | 'ambient'     // trilha do rio, em loop

const VALID_IDS = new Set<string>([
  'splash', 'bump', 'dive', 'collect', 'hop',
  'win', 'star', 'error', 'click', 'select', 'ambient',
])

/**
 * Descoberta automática dos arquivos.
 *
 * O Vite resolve este glob em tempo de build, então só entra no bundle o que
 * existe de verdade — sem 404 quando a pasta está vazia.
 */
const discovered = import.meta.glob('./files/*.{mp3,ogg,wav,m4a}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

const SOUND_FILES: Partial<Record<SoundId, string>> = {}

for (const [path, url] of Object.entries(discovered)) {
  const name = path.split('/').pop()?.replace(/\.[^.]+$/, '')
  if (name && VALID_IDS.has(name)) SOUND_FILES[name as SoundId] = url
}

/**
 * Sons que reaproveitam o arquivo de outro.
 *
 * O clique da interface e a confirmação de personagem são o mesmo efeito, com
 * presenças diferentes — não vale duplicar bytes por isso. Um arquivo próprio
 * com o nome do som tem precedência sobre o apelido.
 */
const ALIASES: Partial<Record<SoundId, SoundId>> = {
  select: 'click',
}

/** Eventos do jogo mapeados para o som que deve tocar. */
const EVENT_SOUNDS: Record<GameEvent['type'], SoundId | null> = {
  swim: 'splash',
  dive: 'dive',
  blocked: 'bump',
  turn: null,
  collect: 'collect',
  hop: 'hop',
  rest: null,
  say: null,
  win: 'win',
}

/**
 * Ajuste fino de volume, por cima do volume geral.
 *
 * O grosso do equilíbrio está nos próprios arquivos, normalizados por papel.
 * Isto é só o retoque — mexa aqui antes de reeditar um arquivo.
 */
const MIX: Partial<Record<SoundId, number>> = {
  // Dispara a cada casa percorrida: num `repeat(20)` toca vinte vezes
  splash: 0.85,
  // Mesmo arquivo do clique, com mais presença por ser uma confirmação
  select: 1.45,
}

/**
 * Volumes padrão.
 *
 * A trilha entra bem mais baixa que os efeitos de propósito: ela toca o tempo
 * todo e só precisa estar presente, não audível. Quem quiser mais sobe no
 * controle de som.
 */
export const DEFAULT_VOLUME_AMBIENT = 0.3
export const DEFAULT_VOLUME_EFFECTS = 0.7

const clamp01 = (v: number) =>
  typeof v === 'number' && !Number.isNaN(v) ? Math.max(0, Math.min(1, v)) : 0

type AudioContextCtor = typeof AudioContext

class SfxPlayer {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private buffers = new Map<SoundId, AudioBuffer>()

  /**
   * Dois barramentos separados.
   *
   * A trilha e os efeitos têm papéis diferentes — uma preenche o fundo, os
   * outros respondem a uma ação — e por isso volumes independentes. Somar tudo
   * num controle só obrigaria a escolher entre não ouvir o acerto e ter a
   * música por cima dele.
   */
  private effectsBus: GainNode | null = null
  private ambientBus: GainNode | null = null

  private ambientSource: AudioBufferSourceNode | null = null

  private _muted = false
  private _volumeEffects = DEFAULT_VOLUME_EFFECTS
  private _volumeAmbient = DEFAULT_VOLUME_AMBIENT
  private started = false

  get muted(): boolean {
    return this._muted
  }

  /** True quando existe pelo menos um arquivo de som no projeto. */
  get hasSounds(): boolean {
    return Object.keys(SOUND_FILES).length > 0
  }

  setMuted(muted: boolean): void {
    this._muted = muted
    if (muted) this.stopAmbient()
    else this.startAmbient()
  }

  get volumeEffects(): number {
    return this._volumeEffects
  }

  get volumeAmbient(): number {
    return this._volumeAmbient
  }

  setVolumeEffects(volume: number): void {
    this._volumeEffects = clamp01(volume)
    this.rampBus(this.effectsBus, this._volumeEffects)
  }

  setVolumeAmbient(volume: number): void {
    this._volumeAmbient = clamp01(volume)
    this.rampBus(this.ambientBus, this._volumeAmbient)
  }

  /** Sobe ou desce em rampa curta: mudar ganho de uma vez estala. */
  private rampBus(bus: GainNode | null, value: number): void {
    if (!bus || !this.ctx) return
    bus.gain.setTargetAtTime(value, this.ctx.currentTime, 0.03)
  }

  /** Ajuste relativo do som dentro do barramento de efeitos. */
  private gainOf(id: SoundId): number {
    return MIX[id] ?? 1
  }

  private bufferOf(id: SoundId): AudioBuffer | undefined {
    return this.buffers.get(id) ?? this.buffers.get(ALIASES[id] ?? id)
  }

  // ------------------------------------------------------------------ carga

  /**
   * Cria o contexto e decodifica todos os arquivos.
   *
   * O contexto nasce suspenso — os navegadores só liberam áudio depois de um
   * gesto do usuário — mas a decodificação acontece mesmo assim. Quando o
   * primeiro clique chegar, os buffers já estão prontos e o som sai na hora.
   */
  preload(): void {
    if (this.started || !this.hasSounds) return
    this.started = true

    const Ctor: AudioContextCtor | undefined =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: AudioContextCtor }).webkitAudioContext

    if (!Ctor) return // navegador sem Web Audio: o jogo segue mudo

    this.ctx = new Ctor()

    this.master = this.ctx.createGain()
    this.master.gain.value = 1
    this.master.connect(this.ctx.destination)

    this.effectsBus = this.ctx.createGain()
    this.effectsBus.gain.value = this._volumeEffects
    this.effectsBus.connect(this.master)

    this.ambientBus = this.ctx.createGain()
    this.ambientBus.gain.value = 0
    this.ambientBus.connect(this.master)

    for (const [id, url] of Object.entries(SOUND_FILES)) {
      void this.load(id as SoundId, url)
    }
  }

  private async load(id: SoundId, url: string): Promise<void> {
    const ctx = this.ctx
    if (!ctx) return

    try {
      const response = await fetch(url)
      const data = await response.arrayBuffer()
      this.buffers.set(id, await ctx.decodeAudioData(data))

      // A trilha pode ter ficado pronta depois do primeiro clique
      if (id === 'ambient') this.startAmbient()
    } catch {
      /* arquivo corrompido ou formato não suportado: esse som fica mudo */
    }
  }

  /**
   * Libera o áudio após o primeiro gesto do usuário.
   *
   * Sem isto o contexto fica suspenso e nada toca — é regra dos navegadores,
   * não um detalhe de implementação.
   */
  unlock(): void {
    if (this.ctx?.state === 'suspended') void this.ctx.resume()
    this.startAmbient()
  }

  // --------------------------------------------------------------- disparo

  play(id: SoundId): void {
    if (this._muted) return

    const ctx = this.ctx
    const buffer = this.bufferOf(id)
    if (!ctx || !this.effectsBus || !buffer) return

    // Safari volta a suspender o contexto sozinho; retomar aqui é barato
    if (ctx.state === 'suspended') void ctx.resume()

    const source = ctx.createBufferSource()
    source.buffer = buffer

    const gain = ctx.createGain()
    gain.gain.value = this.gainOf(id)

    source.connect(gain)
    gain.connect(this.effectsBus)

    // Sem atraso: o nó começa no instante corrente do contexto
    source.start()

    // Nós são descartáveis; soltar as referências evita vazamento
    source.onended = () => {
      source.disconnect()
      gain.disconnect()
    }
  }

  /** Traduz um evento do jogo no som correspondente, se houver. */
  playForEvent(event: GameEvent): void {
    const id = EVENT_SOUNDS[event.type]
    if (id) this.play(id)
  }

  // ---------------------------------------------------------------- trilha

  startAmbient(): void {
    if (this._muted || this.ambientSource) return

    const ctx = this.ctx
    const buffer = this.bufferOf('ambient')
    if (!ctx || !this.ambientBus || !buffer || ctx.state === 'suspended') return

    const source = ctx.createBufferSource()
    source.buffer = buffer
    source.loop = true
    source.connect(this.ambientBus)
    source.start()

    this.ambientSource = source

    // Entra suave: começar a trilha num corte seco chama atenção para ela
    this.ambientBus.gain.cancelScheduledValues(ctx.currentTime)
    this.ambientBus.gain.setValueAtTime(0, ctx.currentTime)
    this.ambientBus.gain.setTargetAtTime(this._volumeAmbient, ctx.currentTime, 0.6)
  }

  stopAmbient(): void {
    const ctx = this.ctx
    const source = this.ambientSource
    this.ambientSource = null

    if (!ctx || !source) return

    // Desce o volume antes de parar, senão o corte estala
    this.ambientBus?.gain.cancelScheduledValues(ctx.currentTime)
    this.ambientBus?.gain.setTargetAtTime(0, ctx.currentTime, 0.08)

    window.setTimeout(() => {
      source.stop()
      source.disconnect()
    }, 320)
  }
}

export const sfx = new SfxPlayer()
