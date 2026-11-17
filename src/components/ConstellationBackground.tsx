import { useEffect, useState } from 'react'
import { constellationCatalog } from '../data/constellation-data'
import type { Star } from '../data/constellation-data'

const catalog = constellationCatalog

function projectStars(stars: Star[]) {
  // Centro calculado com média circular da ascensão reta.
  const raRadians = stars.map(star => star.ra * Math.PI / 12)
  const centerRa = Math.atan2(
    raRadians.reduce((sum, value) => sum + Math.sin(value), 0),
    raRadians.reduce((sum, value) => sum + Math.cos(value), 0),
  )
  const centerDec = stars.reduce((sum, star) => sum + star.dec, 0) /
    stars.length * Math.PI / 180

  const sinDec0 = Math.sin(centerDec)
  const cosDec0 = Math.cos(centerDec)

  const raw = stars.map(star => {
    const ra = star.ra * Math.PI / 12
    const dec = star.dec * Math.PI / 180
    const deltaRa = Math.atan2(
      Math.sin(ra - centerRa),
      Math.cos(ra - centerRa),
    )
    const sinDec = Math.sin(dec)
    const cosDec = Math.cos(dec)
    const denominator =
      sinDec0 * sinDec + cosDec0 * cosDec * Math.cos(deltaRa)

    const safeDenominator = Math.max(denominator, 0.000001)
    const x = (cosDec * Math.sin(deltaRa)) / safeDenominator
    const y = (
      cosDec0 * sinDec -
      sinDec0 * cosDec * Math.cos(deltaRa)
    ) / safeDenominator

    return { ...star, x, y }
  })

  const minX = Math.min(...raw.map(star => star.x))
  const maxX = Math.max(...raw.map(star => star.x))
  const minY = Math.min(...raw.map(star => star.y))
  const maxY = Math.max(...raw.map(star => star.y))

  // Escala uniforme: preserva a proporção angular da figura.
  const width = Math.max(maxX - minX, 0.000001)
  const height = Math.max(maxY - minY, 0.000001)
  const scale = Math.min(190 / width, 150 / height)
  const offsetX = 12 + (190 - width * scale) / 2
  const offsetY = 12 + (150 - height * scale) / 2

  return raw.map(star => ({
    ...star,
    x: offsetX + (star.x - minX) * scale,
    y: offsetY + (maxY - star.y) * scale,
    radius: Math.max(1.35, Math.min(4.8, 5 - star.mag * 0.8)),
  }))
}

const constellations = catalog.map(item => {
  const stars = projectStars(item.stars)
  return {
    ...item,
    stars,
    points: stars.map(star => [star.x, star.y] as const),
  }
})

function createBackgroundStars() {
  let seed = 20261116

  const random = () => {
    seed = (seed * 16807) % 2147483647
    return (seed - 1) / 2147483646
  }

  const stars: {
    x: number
    y: number
    radius: number
    opacity: number
    delay: number
  }[] = []

  let attempts = 0

  while (stars.length < 100 && attempts < 5000) {
    attempts++
    const x = random() * 1000
    const y = random() * 760

    const tooClose = stars.some(star => {
      const dx = star.x - x
      const dy = star.y - y
      return Math.sqrt(dx * dx + dy * dy) < 32
    })

    if (tooClose) continue

    stars.push({
      x,
      y,
      radius: 0.55 + random() * 1.35,
      opacity: 0.3 + random() * 0.7,
      delay: random() * 12,
    })
  }

  return stars
}

const backgroundStars = createBackgroundStars()

type SpaceEvent = {
  id: number
  kind: 'ship' | 'rocket'
  model: 'xwing' | 'tie' | 'falcon' | 'interceptor' | 'destroyer' | 'ywing' | 'awing' | 'bomber' | 'shuttle' | 'bwing' | 'classic'
  x: number
  y: number
  angle: number
  duration: number
  scale: number
  path: string
  delay: number
  variant?: number
}

function wrapNote(note: string, limit = 48) {
  const words = note.split(' ')
  const lines: string[] = []
  let line = ''

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word
    if (candidate.length > limit && line) {
      lines.push(line)
      line = word
    } else {
      line = candidate
    }
  }

  if (line) lines.push(line)
  return lines.slice(0, 2)
}

function tooltipPosition(item: typeof constellations[number]) {
  const xs = item.points.map(point => point[0])
  const ys = item.points.map(point => point[1])
  const minX = item.position[0] + Math.min(...xs)
  const maxY = item.position[1] + Math.max(...ys)
  const minY = item.position[1] + Math.min(...ys)
  const width = 270
  const height = 64
  const margin = 14

  const globalX = Math.max(
    margin,
    Math.min(1000 - width - margin, minX + (Math.max(...xs) - Math.min(...xs)) / 2 - width / 2 + item.position[0]),
  )

  const below = maxY + 22
  const globalY = below + height <= 760 - margin
    ? below
    : Math.max(margin, minY - height - 18)

  return { x: globalX - item.position[0], y: globalY - item.position[1] }
}

// NEXO: painel mobile e eventos celestes naturais
export default function ConstellationBackground() {
  const [selected, setSelected] = useState<string | null>(null)
  const [hovered, setHovered] = useState<string | null>(null)
  const [spaceEvents, setSpaceEvents] = useState<SpaceEvent[]>([])
  const selectedConstellation = constellations.find(
    item => item.name === selected
  )

  useEffect(() => {
    let cancelled = false
    const cleanupTimers: number[] = []

    const randomBetween = (min: number, max: number) =>
      Math.random() * (max - min) + min

    const createVehicleEvent = (): SpaceEvent => {
      const direction = Math.random() < 0.5 ? 1 : -1
      const kind: SpaceEvent['kind'] = Math.random() < 0.88 ? 'ship' : 'rocket'
      const shipModels: SpaceEvent['model'][] = ['xwing', 'tie', 'falcon', 'interceptor', 'destroyer', 'ywing', 'awing', 'bomber', 'shuttle', 'bwing']
      const model = kind === 'rocket' ? 'classic' : shipModels[Math.floor(Math.random() * shipModels.length)]
      const travel = direction * 1600
      const curve = randomBetween(-85, 85)
      const duration = randomBetween(9500, 13500)
      const x = direction === 1 ? -190 : 1190
      const y = randomBetween(110, 650)

      return {
        id: Date.now() + Math.random() * 100000,
        kind,
        model,
        x,
        y,
        angle: direction === 1 ? 0 : 180,
        duration,
        scale: kind === 'rocket' ? randomBetween(1.18, 1.42) : randomBetween(1.45, 1.9),
        path: `M ${x} ${y} C ${x + travel * 0.28} ${y + curve} ${x + travel * 0.7} ${y - curve * 0.25} ${x + travel} ${y}`,
        delay: 0,
        variant: Math.floor(Math.random() * 8),
      }
    }

    const scheduleVehicle = () => {
      const timer = window.setTimeout(() => {
        if (cancelled) return

        const isDark = document.querySelector<HTMLElement>('.site')?.dataset.theme !== 'light'
        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

        if (isDark && !reducedMotion) {
          // Cada passagem traz uma pequena formação, em vez de uma nave isolada.
          const waveSize = Math.random() < 0.35 ? 3 : 2
          for (let index = 0; index < waveSize; index++) {
            const launch = window.setTimeout(() => {
              if (cancelled) return
              const vehicle = createVehicleEvent()
              setSpaceEvents(current => [...current, vehicle])
              const cleanup = window.setTimeout(() => {
                setSpaceEvents(current => current.filter(item => item.id !== vehicle.id))
              }, vehicle.duration + 500)
              cleanupTimers.push(cleanup)
            }, index * 1350)
            cleanupTimers.push(launch)
          }
        }

        scheduleVehicle()
      }, randomBetween(10000, 15000))
      cleanupTimers.push(timer)
    }

    const demoTimer = window.setTimeout(() => {
      const isDark =
        document.querySelector<HTMLElement>('.site')?.dataset.theme !== 'light'
      const reducedMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)'
      ).matches

      if (cancelled || !isDark || reducedMotion) return

      const demoEvents: SpaceEvent[] = [
        // Uma nave atravessa a tela logo no início para validar o deslocamento.
        createVehicleEvent(),
      ]

      setSpaceEvents(current => [...current, ...demoEvents])

      demoEvents.forEach(event => {
        const timer = window.setTimeout(() => {
          setSpaceEvents(current =>
            current.filter(item => item.id !== event.id)
          )
        }, event.duration + 400)

        cleanupTimers.push(timer)
      })
    }, 1000)

    scheduleVehicle()

    return () => {
      cancelled = true
      window.clearTimeout(demoTimer)
      cleanupTimers.forEach(timer => window.clearTimeout(timer))
    }
  }, [])

  return (
    <>
      <div className="nexo-space-layer" aria-hidden="true">
        <svg viewBox="0 0 1000 760" preserveAspectRatio="xMidYMid meet">
        {spaceEvents.map(event => (
          <g key={event.id} aria-hidden="true">
            <animateMotion
              begin="0s"
              dur={`${event.duration}ms`}
              path={event.path}
              rotate="0"
              calcMode="linear"
              fill="freeze"
            />
            <g transform={`rotate(${event.angle}) scale(${event.scale})`}>
              <g
                className={`nexo-space-event ${event.kind}`}
                style={{ animationDuration: `${event.duration}ms`, opacity: 1 }}
              >


              {(event.kind === 'ship' || event.kind === 'rocket') && (
                <>
                <g className={'nexo-vehicle-art ' + event.kind + ' variant-' + (event.variant ?? 0)}>
                  <path className="nexo-vehicle-engine-glow" d="M -22 0 Q -58 -17 -104 0 Q -58 17 -22 0 Z" />
                  <path className="nexo-vehicle-engine-flame" d="M -22 0 Q -54 -8 -86 0 Q -54 8 -22 0 Z" />
                  {event.kind === 'ship' && (
                    <g className={`nexo-ship-hull nexo-model-${event.model}`}>
                      {event.model === 'xwing' && (
                        <>
                          <path d="M -42 0 L -24 -7 L 26 -5 L 48 0 L 26 5 L -24 7 Z" />
                          <path d="M -12 -5 L 3 -34 L 19 -31 L 12 -5 Z M -12 5 L 3 34 L 19 31 L 12 5 Z" />
                          <path d="M -12 -5 L 3 -34 L 19 -31 L 12 -5 Z M -12 5 L 3 34 L 19 31 L 12 5 Z" className="nexo-ship-armor" />
                          <path d="M 8 -29 L 30 -39 L 33 -35 L 17 -24 M 8 29 L 30 39 L 33 35 L 17 24" className="nexo-model-cannon" />
                          <path d="M 18 -4 L 35 0 L 18 4 Z" className="nexo-ship-cockpit" />
                        </>
                      )}
                      {event.model === 'tie' && (
                        <>
                          <path d="M -25 -5 L -42 -30 L -26 -39 L -10 -30 L -10 30 L -26 39 L -42 30 L -25 5 Z" />
                          <path d="M 25 -5 L 42 -30 L 26 -39 L 10 -30 L 10 30 L 26 39 L 42 30 L 25 5 Z" />
                          <path d="M -12 -5 L 8 -8 L 19 0 L 8 8 L -12 5 Z" />
                          <circle cx="2" cy="0" r="12" className="nexo-ship-cockpit" />
                          <path d="M -37 -29 L -22 -35 L -16 -28 L -16 28 L -22 35 L -37 29 Z M 37 -29 L 22 -35 L 16 -28 L 16 28 L 22 35 L 37 29 Z" className="nexo-ship-armor" />
                        </>
                      )}
                      {event.model === 'falcon' && (
                        <>
                          <path d="M -35 -23 Q -12 -34 22 -23 L 40 -10 L 29 -2 L 48 0 L 29 2 L 40 10 L 22 23 Q -12 34 -35 23 L -43 8 L -43 -8 Z" />
                          <path d="M -25 -18 Q 0 -27 25 -15 L 30 0 L 25 15 Q 0 27 -25 18 L -34 0 Z" className="nexo-ship-armor" />
                          <path d="M -2 -14 L 20 -11 L 30 0 L 20 11 L -2 14 L -15 0 Z" />
                          <path d="M -15 -6 L -4 -6 L -4 6 L -15 6 Z" className="nexo-ship-cockpit" />
                          <circle cx="7" cy="0" r="7" className="nexo-model-dish" />
                          <path d="M 28 -5 L 43 -5 M 28 5 L 43 5" className="nexo-model-cannon" />
                        </>
                      )}
                      {event.model === 'interceptor' && (
                        <>
                          <path d="M -38 0 L -19 -8 L 26 -6 L 46 0 L 26 6 L -19 8 Z" />
                          <path d="M -12 -6 L 2 -36 L 16 -31 L 11 -5 Z M -12 6 L 2 36 L 16 31 L 11 5 Z" />
                          <path d="M -7 -7 L 4 -28 L 10 -25 L 7 -7 Z M -7 7 L 4 28 L 10 25 L 7 7 Z" className="nexo-ship-armor" />
                          <path d="M 9 -4 L 29 0 L 9 4 Z" className="nexo-ship-cockpit" />
                        </>
                      )}
                      {event.model === 'destroyer' && (
                        <>
                          <path d="M -48 -25 L 48 0 L -48 25 L -30 0 Z" />
                          <path d="M -30 -16 L 30 0 L -30 16 L -18 0 Z" className="nexo-ship-armor" />
                          <path d="M -17 -7 L 4 -3 L 4 3 L -17 7 Z" />
                          <path d="M -24 -4 L -7 -4 L -7 4 L -24 4 Z" className="nexo-ship-cockpit" />
                          <path d="M -42 -17 L -30 -14 M -42 17 L -30 14" className="nexo-model-cannon" />
                        </>
                      )}
                      {event.model === 'ywing' && (
                        <>
                          <path d="M -43 -7 L 18 -7 L 43 -3 L 43 3 L 18 7 L -43 7 Z" />
                          <path d="M -27 -7 L -34 -20 L 16 -20 L 24 -7 Z M -27 7 L -34 20 L 16 20 L 24 7 Z" className="nexo-ship-armor" />
                          <path d="M -34 -20 L -45 -20 L -49 -16 L -49 -10 L -34 -10 Z M -34 20 L -45 20 L -49 16 L -49 10 L -34 10 Z" />
                          <path d="M 7 -5 L 29 -3 L 29 3 L 7 5 Z" className="nexo-ship-cockpit" />
                          <path d="M -46 -15 L -46 -10 M -46 15 L -46 10" className="nexo-model-cannon" />
                        </>
                      )}
                      {event.model === 'awing' && (
                        <>
                          <path d="M -42 0 L 34 -8 L 49 0 L 34 8 Z" />
                          <path d="M -25 -5 L -7 -18 L 18 -7 L 18 -3 Z M -25 5 L -7 18 L 18 7 L 18 3 Z" className="nexo-ship-armor" />
                          <path d="M 4 -3 L 28 0 L 4 3 Z" className="nexo-ship-cockpit" />
                          <path d="M -38 -2 L -20 -2 M -38 2 L -20 2" className="nexo-model-cannon" />
                        </>
                      )}
                      {event.model === 'bomber' && (
                        <>
                          <path d="M -34 -8 L 26 -8 L 43 0 L 26 8 L -34 8 Z" />
                          <path d="M -21 -8 L -30 -28 L 8 -28 L 18 -8 Z M -21 8 L -30 28 L 8 28 L 18 8 Z" className="nexo-ship-armor" />
                          <path d="M -27 -22 L 4 -22 M -27 22 L 4 22" className="nexo-model-cannon" />
                          <circle cx="16" cy="0" r="7" className="nexo-ship-cockpit" />
                        </>
                      )}
                      {event.model === 'shuttle' && (
                        <>
                          <path d="M -32 -7 L 23 -7 L 43 0 L 23 7 L -32 7 Z" />
                          <path d="M -13 -7 L -2 -38 L 9 -35 L 4 -7 Z M -13 7 L -2 38 L 9 35 L 4 7 Z" className="nexo-ship-armor" />
                          <path d="M 7 -4 L 29 0 L 7 4 Z" className="nexo-ship-cockpit" />
                          <path d="M -4 -30 L 3 -30 M -4 30 L 3 30" className="nexo-model-cannon" />
                        </>
                      )}
                      {event.model === 'bwing' && (
                        <>
                          <path d="M -38 -5 L 28 -5 L 46 0 L 28 5 L -38 5 Z" />
                          <path d="M -4 -5 L 2 -36 L 13 -40 L 17 -5 Z M -4 5 L 2 36 L 13 40 L 17 5 Z" className="nexo-ship-armor" />
                          <path d="M -25 -4 L -18 -17 L -10 -17 L -8 -4 Z M -25 4 L -18 17 L -10 17 L -8 4 Z" />
                          <path d="M 12 -3 L 34 0 L 12 3 Z" className="nexo-ship-cockpit" />
                        </>
                      )}
                      {event.model === 'classic' && (
                        <>
                          <path d="M -38 0 L -20 -8 L 17 -7 L 39 0 L 17 7 L -20 8 Z" />
                          <path d="M -13 -7 L -2 -19 L 13 -8 Z M -13 7 L -2 19 L 13 8 Z" />
                          <path d="M -23 -5 L -8 -17 L 2 -8 Z M -23 5 L -8 17 L 2 8 Z" />
                          <path d="M -18 -3 L 17 -3 L 29 0 L 17 3 L -18 3 Z" className="nexo-ship-armor" />
                          <path d="M 13 -3.5 L 27 0 L 13 3.5 Z" className="nexo-ship-cockpit" />
                        </>
                      )}
                      {event.model !== 'classic' && <path className="nexo-ship-highlight" d="M -22 -3 L 7 -5 L 20 -2" />}
                    </g>
                  )}
                  {event.kind === 'rocket' && (
                    <g className="nexo-rocket-hull">
                      <path d="M -24 -7 L 7 -8 Q 30 -7 39 0 Q 30 7 7 8 L -24 7 Z" />
                      <path d="M -12 -7 L -23 -17 L -19 -5 Z M -12 7 L -23 17 L -19 5 Z" />
                      <path d="M 3 -8 L 10 -15 L 18 -8 Z M 3 8 L 10 15 L 18 8 Z" />
                      <circle className="nexo-rocket-window" cx="20" cy="0" r="3.2" />
                    </g>
                  )}

                </g>
                </>
              )}
              </g>
            </g>
          </g>
        ))}
        </svg>
      </div>
      <div className="constellation-layer" aria-label="Constelações animadas">
        <svg
          viewBox="0 0 1000 760"
          preserveAspectRatio="xMidYMid meet"
          role="group"
          aria-label="Constelações desenhadas a partir das coordenadas das estrelas."
        >
        <g className="background-stars" aria-hidden="true">
          {backgroundStars.map((star, index) => (
            <circle
              key={index}
              cx={star.x}
              cy={star.y}
              r={star.radius}
              style={{ animationDelay: `${(index % 11) * 0.37}s` }}
            />
          ))}
        </g>

        {constellations.map((item, index) => {
          const delay = `${index * -12}s`
          const active = selected === item.name || hovered === item.name
          const tooltip = tooltipPosition(item)
          const noteLines = wrapNote(item.note)

          return (
            <g
              key={item.name}
              className={`constellation-group${active ? ' is-selected' : ''}`}
              transform={`translate(${item.position[0]} ${item.position[1]})`}
              style={{ animationDelay: delay }}
              role="button"
              tabIndex={0}
              aria-label={`${item.name}. ${item.note}`}
              aria-pressed={selected === item.name}
              onMouseEnter={() => setHovered(item.name)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setHovered(item.name)}
              onBlur={() => setHovered(null)}
              onClick={() => setSelected(current => current === item.name ? null : item.name)}
              onKeyDown={event => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  setSelected(current => current === item.name ? null : item.name)
                }
                if (event.key === 'Escape') setSelected(null)
              }}
            >
              <g className="constellation-lines">
                {item.lines.map((line, lineIndex) => (
                  <line
                    key={`${line.from}-${line.to}-${lineIndex}`}
                    className={`constellation-line${line.thin ? ' is-secondary' : ''}`}
                    x1={item.points[line.from][0]}
                    y1={item.points[line.from][1]}
                    x2={item.points[line.to][0]}
                    y2={item.points[line.to][1]}
                    style={{ animationDelay: `calc(${delay} + ${lineIndex * 0.42}s)` }}
                  />
                ))}
              </g>

              <g className="constellation-stars">
                {item.stars.map((star, starIndex) => (
                  <circle
                    key={star.name}
                    cx={star.x}
                    cy={star.y}
                    r={star.radius}
                    className="constellation-star"
                    style={{ animationDelay: `calc(${delay} + ${starIndex * 0.28}s)` }}
                  />
                ))}
              </g>

              {active && (
                <g
                  className="constellation-tooltip"
                  transform={`translate(${tooltip.x} ${tooltip.y})`}
                >
                  <rect width="270" height="64" rx="10" />
                  <text x="12" y="21" className="tooltip-name">{item.name}</text>
                  <text x="12" y="40" className="tooltip-note">
                    {noteLines.map((line, lineIndex) => (
                      <tspan key={lineIndex} x="12" dy={lineIndex === 0 ? 0 : 11}>
                        {line}
                      </tspan>
                    ))}
                  </text>
                </g>
              )}
            </g>
          )
        })}
      </svg>

      {selectedConstellation && (
        <section
          className="constellation-info-card"
          aria-live="polite"
          aria-label={`Informações sobre ${selectedConstellation.name}`}
        >
          <button
            type="button"
            className="constellation-info-close"
            onClick={() => setSelected(null)}
            aria-label="Fechar informações da constelação"
          >
            ×
          </button>
          <span className="constellation-info-eyebrow">
            CONSTELAÇÃO
          </span>
          <h3>{selectedConstellation.name}</h3>
          <p>{selectedConstellation.note}</p>
        </section>
      )}
      </div>
    </>
  )
}
