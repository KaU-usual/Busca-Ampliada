import { useEffect, useState } from 'react'
import { constellationCatalog } from './constellation-data'
import type { Star } from './constellation-data'

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
  kind: 'meteor' | 'asteroid'
  x: number
  y: number
  angle: number
  duration: number
  scale: number
  path: string
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

export default function ConstellationBackground() {
  const [selected, setSelected] = useState<string | null>(null)
  const [hovered, setHovered] = useState<string | null>(null)
  const [spaceEvents, setSpaceEvents] = useState<SpaceEvent[]>([])

  useEffect(() => {
    let nextTimer = 0
    let endTimer = 0
    let cancelled = false

    const randomBetween = (min: number, max: number) =>
      Math.random() * (max - min) + min

    const scheduleNext = () => {
      nextTimer = window.setTimeout(() => {
        if (cancelled) return

        const isDark = document.documentElement.dataset.theme !== 'light'
        const reducedMotion = window.matchMedia(
          '(prefers-reduced-motion: reduce)'
        ).matches

        if (!isDark || reducedMotion) {
          scheduleNext()
          return
        }

        const roll = Math.random()
        const kind: SpaceEvent['kind'] =
          roll < 0.38 ? 'asteroid' : 'meteor'

        const duration =
          kind === 'meteor' ? randomBetween(1500, 2100)
          : randomBetween(2800, 4200)

        const travelX = randomBetween(380, 680)
        const travelY = randomBetween(-160, 160)
        const curve = randomBetween(-125, 125)
        const path =
          `M 0 0 C ${travelX * 0.24} ${curve} ` +
          `${travelX * 0.72} ${travelY - curve * 0.42} ` +
          `${travelX} ${travelY}`

        const event: SpaceEvent = {
          id: Date.now(),
          kind,
          x: randomBetween(-80, 420),
          y: randomBetween(90, 680),
          angle: randomBetween(-9, 9),
          duration,
          scale: randomBetween(0.75, 1.4),
          path,
        }

        setSpaceEvents([event])

        endTimer = window.setTimeout(() => {
          setSpaceEvents([])
          scheduleNext()
        }, duration + 180)
      }, randomBetween(2800, 5800))
    }

    scheduleNext()

    return () => {
      cancelled = true
      window.clearTimeout(nextTimer)
      window.clearTimeout(endTimer)
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
          <g
            key={event.id}
            className={`nexo-space-event ${event.kind}`}
            transform={`translate(${event.x} ${event.y}) rotate(${event.angle}) scale(${event.scale})`}
            style={{ animationDuration: `${event.duration}ms` }}
            aria-hidden="true"
          >
            {event.kind === 'meteor' && (
              <g className="nexo-meteor-streak">
                <path
                  d="M -118 25 Q -57 13 0 0"
                  className="nexo-meteor-tail"
                />
                <circle cx="0" cy="0" r="3.4" className="nexo-meteor-head" />
                <animateMotion
                  dur={`${event.duration}ms`}
                  path={event.path}
                  rotate="auto"
                  fill="freeze"
                />
              </g>
            )}

            {event.kind === 'asteroid' && (
              <g className="nexo-asteroid-body">
                <polygon
                  points="-24,-7 -19,-20 -5,-25 12,-20 25,-7 22,11 10,23 -9,22 -23,10"
                  className="nexo-asteroid-shape"
                />
                <polygon
                  points="-19,-8 -5,-22 3,-13 -4,2 -20,5"
                  className="nexo-asteroid-facet light"
                />
                <polygon
                  points="3,-13 12,-18 23,-7 13,2"
                  className="nexo-asteroid-facet dark"
                />
                <polygon
                  points="-4,2 13,2 10,20 -9,19"
                  className="nexo-asteroid-facet mid"
                />
                <circle cx="-11" cy="-5" r="4.2" className="nexo-asteroid-crater" />
                <circle cx="10" cy="9" r="5" className="nexo-asteroid-crater" />
                <circle cx="8" cy="-11" r="2.5" className="nexo-asteroid-crater" />
                <path d="M-17 12 L-7 8 L1 15 L13 13 M-16 -2 L-8 -10 L-1 -7 L4 -15 M5 4 L13 1 L18 8" className="nexo-asteroid-detail" />
                <path d="M-2 -21 L2 -14 M16 -3 L11 2 M-20 7 L-13 4" className="nexo-asteroid-highlight" />
              </g>
            )}


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
    </div>
  )
}
