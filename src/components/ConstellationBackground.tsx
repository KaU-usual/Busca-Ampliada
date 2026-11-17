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
      const kind: SpaceEvent['kind'] = Math.random() < 0.78 ? 'ship' : 'rocket'
      const travel = direction * 1600
      const curve = randomBetween(-85, 85)
      const duration = randomBetween(9500, 13500)
      const x = direction === 1 ? -190 : 1190
      const y = randomBetween(110, 650)

      return {
        id: Date.now() + Math.random() * 100000,
        kind,
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
          const vehicle = createVehicleEvent()
          setSpaceEvents(current => [...current, vehicle])
          const cleanup = window.setTimeout(() => {
            setSpaceEvents(current => current.filter(item => item.id !== vehicle.id))
          }, vehicle.duration + 500)
          cleanupTimers.push(cleanup)
        }

        scheduleVehicle()
      }, randomBetween(15000, 25000))
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
                    <g className="nexo-ship-hull">
                      {event.variant === 0 && <>
                        <path d="M -38 0 L -20 -8 L 17 -7 L 39 0 L 17 7 L -20 8 Z" />
                        <path d="M -13 -7 L -2 -19 L 13 -8 Z M -13 7 L -2 19 L 13 8 Z" />
                        <path d="M -23 -5 L -8 -17 L 2 -8 Z M -23 5 L -8 17 L 2 8 Z" />
                        <path d="M -18 -3 L 17 -3 L 29 0 L 17 3 L -18 3 Z" className="nexo-ship-armor" />
                      </>}
                      {event.variant === 1 && <>
                        <path d="M -38 -6 L 9 -10 L 39 0 L 9 10 L -38 6 L -23 0 Z" />
                        <path d="M -18 -7 L -6 -23 L 8 -10 L 8 10 L -6 23 L -18 7 Z" />
                        <path d="M -28 -5 L -18 -19 L -9 -8 Z M -28 5 L -18 19 L -9 8 Z" />
                        <path d="M -7 -4 L 23 -2 L 32 0 L 23 2 L -7 4 Z" className="nexo-ship-armor" />
                      </>}
                      {event.variant === 2 && <>
                        <path d="M -38 0 L -17 -8 L 9 -7 L 30 -17 L 23 0 L 30 17 L 9 7 L -17 8 Z" />
                        <path d="M -14 -6 L -3 -18 L 13 -8 L 13 8 L -3 18 L -14 6 Z" />
                        <path d="M -30 -3 L -21 -15 L -10 -7 Z M -30 3 L -21 15 L -10 7 Z" />
                        <path d="M -9 -3 L 20 -2 L 30 0 L 20 2 L -9 3 Z" className="nexo-ship-armor" />
                      </>}
                      {event.variant === 3 && <>
                        <path d="M -34 0 L -16 -12 L 15 -9 L 40 0 L 15 9 L -16 12 Z" />
                        <path d="M -5 -9 L 4 -22 L 18 -9 Z M -5 9 L 4 22 L 18 9 Z" />
                        <path d="M -25 -7 L -12 -20 L -2 -10 Z M -25 7 L -12 20 L -2 10 Z" />
                        <path d="M -12 -3 L 20 -3 L 31 0 L 20 3 L -12 3 Z" className="nexo-ship-armor" />
                      </>}
                      {event.variant === 4 && <>
                        <path d="M -42 0 L -25 -7 L 25 -7 L 43 0 L 25 7 L -25 7 Z" />
                        <path d="M -18 -6 L -8 -29 L 3 -8 Z M -18 6 L -8 29 L 3 8 Z" />
                        <path d="M 0 -6 L 13 -17 L 22 -6 L 22 6 L 13 17 L 0 6 Z" />
                        <path d="M -30 -3 L 30 -3 L 39 0 L 30 3 L -30 3 Z" className="nexo-ship-armor" />
                      </>}
                      {event.variant === 5 && <>
                        <path d="M -43 0 L -20 -9 L 26 -6 L 40 0 L 26 6 L -20 9 Z" />
                        <path d="M -17 -7 L -35 -25 L 4 -10 Z M -17 7 L -35 25 L 4 10 Z" />
                        <path d="M 1 -6 L 12 -15 L 24 -6 L 24 6 L 12 15 L 1 6 Z" />
                        <path d="M -22 -3 L 25 -3 L 34 0 L 25 3 L -22 3 Z" className="nexo-ship-armor" />
                      </>}
                      {event.variant === 6 && <>
                        <path d="M -40 0 L -20 -8 L 12 -8 L 42 0 L 12 8 L -20 8 Z" />
                        <path d="M -18 -7 L -8 -27 L 7 -8 Z M -18 7 L -8 27 L 7 8 Z" />
                        <path d="M -30 -5 L -42 -17 L -11 -9 Z M -30 5 L -42 17 L -11 9 Z" />
                        <path d="M -12 -3 L 25 -3 L 35 0 L 25 3 L -12 3 Z" className="nexo-ship-armor" />
                      </>}
                      {event.variant === 7 && <>
                        <path d="M -38 0 L -17 -10 L 19 -7 L 43 0 L 19 7 L -17 10 Z" />
                        <path d="M -8 -8 L 0 -30 L 16 -9 Z M -8 8 L 0 30 L 16 9 Z" />
                        <path d="M -25 -5 L -34 -18 L -8 -9 Z M -25 5 L -34 18 L -8 9 Z" />
                        <path d="M -14 -3 L 28 -3 L 38 0 L 28 3 L -14 3 Z" className="nexo-ship-armor" />
                      </>}
                      <path className="nexo-ship-cockpit" d="M 13 -3.5 L 27 0 L 13 3.5 Z" />
                      <path className="nexo-ship-highlight" d="M -22 -3 L 7 -5 L 20 -2" />
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
  )
}
