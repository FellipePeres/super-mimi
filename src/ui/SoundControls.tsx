import { useEffect, useId, useRef, useState } from 'react'
import { useStore } from '../app/store'
import { sfx } from '../audio/sfx'

/**
 * Controle de som.
 *
 * O botão abre um popover com dois volumes independentes, porque a trilha e os
 * efeitos cumprem papéis diferentes: uma preenche o fundo o tempo todo, os
 * outros respondem a uma ação. Um controle só obrigaria a escolher entre não
 * ouvir o acerto e ter a música por cima dele.
 *
 * Só aparece quando existe pelo menos um arquivo em `src/audio/files/` — um
 * controle de som num jogo mudo é um controle que mente.
 */
export function SoundControls() {
  const muted = useStore((state) => state.muted)
  const toggleMuted = useStore((state) => state.toggleMuted)
  const volumeAmbient = useStore((state) => state.volumeAmbient)
  const volumeEffects = useStore((state) => state.volumeEffects)
  const setVolumeAmbient = useStore((state) => state.setVolumeAmbient)
  const setVolumeEffects = useStore((state) => state.setVolumeEffects)

  const [open, setOpen] = useState(false)
  const wrapper = useRef<HTMLDivElement>(null)
  const lastSample = useRef(0)
  const titleId = useId()

  // Fecha ao clicar fora ou apertar Esc
  useEffect(() => {
    if (!open) return

    const onPointerDown = (event: PointerEvent) => {
      if (!wrapper.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  if (!sfx.hasSounds) return null

  const silent = muted || (volumeAmbient === 0 && volumeEffects === 0)

  /**
   * Toca uma amostra ao mexer no volume dos efeitos.
   *
   * Sem isso o ajuste é às cegas: o slider da trilha se ouve na hora, porque
   * ela já está tocando, mas o dos efeitos não teria retorno nenhum.
   */
  const previewEffects = () => {
    const now = performance.now()
    if (now - lastSample.current < 220) return
    lastSample.current = now
    sfx.play('collect')
  }

  return (
    <div className="sm-sound" ref={wrapper}>
      <button
        type="button"
        className={`sm-btn sm-btn--icon ${open ? 'is-open' : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
        title="Ajustar o som"
        aria-label="Ajustar o som"
        // O popover já dá retorno visual; um clique sonoro aqui competiria
        // com a amostra dos sliders
        data-sfx="off"
      >
        {silent ? <IconMuted /> : <IconSound />}
      </button>

      {open && (
        <div className="sm-sound__pop" role="dialog" aria-labelledby={titleId}>
          <div className="sm-sound__head">
            <h3 id={titleId}>Som</h3>
            <button
              type="button"
              className={`sm-sound__switch ${muted ? '' : 'is-on'}`}
              onClick={toggleMuted}
              role="switch"
              aria-checked={!muted}
              data-sfx="off"
            >
              <span className="sm-sound__switch-track">
                <span className="sm-sound__switch-knob" />
              </span>
              {muted ? 'Desligado' : 'Ligado'}
            </button>
          </div>

          <VolumeSlider
            label="Música do rio"
            hint="Toca o tempo todo, ao fundo"
            value={volumeAmbient}
            disabled={muted}
            onChange={setVolumeAmbient}
          />

          <VolumeSlider
            label="Efeitos"
            hint="Braçadas, sementes, vitória"
            value={volumeEffects}
            disabled={muted}
            onChange={(value) => {
              setVolumeEffects(value)
              if (value > 0) previewEffects()
            }}
          />
        </div>
      )}
    </div>
  )
}

interface VolumeSliderProps {
  label: string
  hint: string
  value: number
  disabled: boolean
  onChange: (value: number) => void
}

function VolumeSlider({ label, hint, value, disabled, onChange }: VolumeSliderProps) {
  const id = useId()
  const percent = Math.round(value * 100)

  return (
    <div className={`sm-volume ${disabled ? 'is-disabled' : ''}`}>
      <div className="sm-volume__head">
        <label htmlFor={id}>{label}</label>
        <span className="sm-volume__value">{percent}%</span>
      </div>

      <input
        id={id}
        type="range"
        min={0}
        max={100}
        step={1}
        value={percent}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value) / 100)}
        // Pinta a parte preenchida da trilha
        style={{ '--fill': `${percent}%` } as React.CSSProperties}
      />

      <span className="sm-volume__hint">{hint}</span>
    </div>
  )
}

// --------------------------------------------------------------------- ícones

function IconSound() {
  return (
    <svg
      width="17" height="17" viewBox="0 0 18 18" fill="none" stroke="currentColor"
      strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
    >
      <path d="M8.5 3 5 6H2.5v6H5l3.5 3V3Z" fill="currentColor" />
      <path d="M11.8 6.4a3.6 3.6 0 0 1 0 5.2" />
      <path d="M14 4.2a6.8 6.8 0 0 1 0 9.6" />
    </svg>
  )
}

function IconMuted() {
  return (
    <svg
      width="17" height="17" viewBox="0 0 18 18" fill="none" stroke="currentColor"
      strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
    >
      <path d="M8.5 3 5 6H2.5v6H5l3.5 3V3Z" fill="currentColor" />
      <path d="m12 7 4 4M16 7l-4 4" />
    </svg>
  )
}
