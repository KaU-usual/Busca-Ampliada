import { useState } from 'react'

type Star = { name: string; ra: number; dec: number; mag: number }
type Edge = readonly [string, string]

const catalog = [
  {
    name: 'Ursa Maior',
    note: 'O Grande Carro: Dubhe, Merak, Phecda, Megrez, Alioth, Mizar e Alkaid.',
    position: [65, 65] as const,
    stars: [
      { name: 'Dubhe', ra: 11.062, dec: 61.75, mag: 1.79 },
      { name: 'Merak', ra: 11.031, dec: 56.38, mag: 2.37 },
      { name: 'Phecda', ra: 11.898, dec: 53.69, mag: 2.44 },
      { name: 'Megrez', ra: 12.257, dec: 57.03, mag: 3.31 },
      { name: 'Alioth', ra: 12.9, dec: 55.96, mag: 1.77 },
      { name: 'Mizar', ra: 13.399, dec: 54.93, mag: 2.27 },
      { name: 'Alkaid', ra: 13.793, dec: 49.31, mag: 1.86 },
    ],
    edges: [
      ['Dubhe', 'Merak'], ['Merak', 'Phecda'], ['Phecda', 'Megrez'],
      ['Megrez', 'Dubhe'], ['Megrez', 'Alioth'], ['Alioth', 'Mizar'],
      ['Mizar', 'Alkaid'],
    ] as Edge[],
  },
  {
    name: 'Órion',
    note: 'O caçador, marcado pelas estrelas Betelgeuse, Rigel e o cinturão.',
    position: [570, 55] as const,
    stars: [
      { name: 'Betelgeuse', ra: 5.92, dec: 7.41, mag: 0.42 },
      { name: 'Rigel', ra: 5.242, dec: -8.2, mag: 0.13 },
      { name: 'Bellatrix', ra: 5.419, dec: 6.35, mag: 1.64 },
      { name: 'Mintaka', ra: 5.533, dec: -0.3, mag: 2.23 },
      { name: 'Alnilam', ra: 5.604, dec: -1.2, mag: 1.69 },
      { name: 'Alnitak', ra: 5.679, dec: -1.94, mag: 1.77 },
      { name: 'Saiph', ra: 5.796, dec: -9.67, mag: 2.09 },
    ],
    edges: [
      ['Betelgeuse', 'Bellatrix'], ['Betelgeuse', 'Alnitak'],
      ['Bellatrix', 'Mintaka'], ['Alnitak', 'Alnilam'],
      ['Alnilam', 'Mintaka'], ['Alnitak', 'Saiph'],
      ['Mintaka', 'Rigel'],
    ] as Edge[],
  },
  {
    name: 'Cassiopeia',
    note: 'As cinco estrelas principais formam o conhecido desenho em W.',
    position: [340, 275] as const,
    stars: [
      { name: 'Schedar', ra: 0.675, dec: 56.54, mag: 2.23 },
      { name: 'Caph', ra: 0.153, dec: 59.15, mag: 2.27 },
      { name: 'Tsih', ra: 0.945, dec: 60.72, mag: 2.47 },
      { name: 'Ruchbah', ra: 1.43, dec: 60.24, mag: 2.68 },
      { name: 'Segin', ra: 1.907, dec: 63.67, mag: 3.37 },
    ],
    edges: [
      ['Caph', 'Schedar'], ['Schedar', 'Tsih'],
      ['Tsih', 'Ruchbah'], ['Ruchbah', 'Segin'],
    ] as Edge[],
  },
  {
    name: 'Escorpião',
    note: 'Antares marca o corpo do escorpião, cuja cauda segue em direção a Shaula.',
    position: [700, 325] as const,
    stars: [
      { name: 'Antares', ra: 16.49, dec: -26.43, mag: 0.96 },
      { name: 'Shaula', ra: 17.56, dec: -37.1, mag: 1.63 },
      { name: 'Dschubba', ra: 16.006, dec: -22.62, mag: 2.32 },
      { name: 'Acrab', ra: 16.091, dec: -19.81, mag: 2.62 },
      { name: 'Larawag', ra: 16.836, dec: -34.29, mag: 2.29 },
    ],
    edges: [
      ['Acrab', 'Dschubba'], ['Dschubba', 'Antares'],
      ['Antares', 'Larawag'], ['Larawag', 'Shaula'],
    ] as Edge[],
  },
  {
    name: 'Cruzeiro do Sul',
    note: 'Crux: Acrux e Gacrux formam o eixo maior; Mimosa e Imai, o braço transversal.',
    position: [120, 470] as const,
    stars: [
      { name: 'Acrux', ra: 12.443, dec: -63.1, mag: 0.76 },
      { name: 'Mimosa', ra: 12.795, dec: -59.69, mag: 1.25 },
      { name: 'Gacrux', ra: 12.519, dec: -57.11, mag: 1.63 },
      { name: 'Imai', ra: 12.252, dec: -58.75, mag: 2.8 },
    ],
    edges: [
      ['Acrux', 'Gacrux'], ['Mimosa', 'Imai'],
    ] as Edge[],
  },
  {
    name: 'Leão',
    note: 'A cabeça forma uma foice; Regulus, Algieba, Zosma e Denebola marcam o corpo.',
    position: [420, 495] as const,
    stars: [
      { name: 'Regulus', ra: 10.14, dec: 11.97, mag: 1.35 },
      { name: 'Algieba', ra: 10.333, dec: 19.84, mag: 2.28 },
      { name: 'Zosma', ra: 11.235, dec: 20.52, mag: 2.56 },
      { name: 'Denebola', ra: 11.818, dec: 14.57, mag: 2.14 },
    ],
    edges: [
      ['Regulus', 'Algieba'], ['Algieba', 'Zosma'],
      ['Zosma', 'Denebola'], ['Regulus', 'Denebola'],
    ] as Edge[],
  },
]

function projectStars(stars: Star[]) {
  const meanDec = stars.reduce((sum, star) => sum + star.dec, 0) / stars.length
  const cosDec = Math.cos(meanDec * Math.PI / 180)
  const raw = stars.map(star => ({
    ...star,
    x: -star.ra * 15 * cosDec,
    y: -star.dec,
  }))

  const minX = Math.min(...raw.map(star => star.x))
  const maxX = Math.max(...raw.map(star => star.x))
  const minY = Math.min(...raw.map(star => star.y))
  const maxY = Math.max(...raw.map(star => star.y))
  const scale = Math.min(
    190 / Math.max(maxX - minX, 0.01),
    150 / Math.max(maxY - minY, 0.01),
  )

  return raw.map(star => ({
    ...star,
    x: 12 + (star.x - minX) * scale,
    y: 12 + (star.y - minY) * scale,
    radius: Math.max(2.2, Math.min(4.8, 5 - star.mag * 0.8)),
  }))
}

const constellations = catalog.map(item => {
  const stars = projectStars(item.stars)
  const indexByName = new Map(stars.map((star, index) => [star.name, index]))

  return {
    ...item,
    stars,
    points: stars.map(star => [star.x, star.y] as const),
    lines: item.edges.map(([a, b]) => [
      indexByName.get(a)!,
      indexByName.get(b)!,
    ] as const),
  }
})

const backgroundStars = Array.from({ length: 100 }, (_, index) => ({
  x: (index * 137.508) % 1000,
  y: (index * 83.71 + 29) % 760,
  radius: 0.8 + (index % 4) * 0.35,
}))

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
                {item.lines.map(([from, to], lineIndex) => (
                  <line
                    key={lineIndex}
                    x1={item.points[from][0]}
                    y1={item.points[from][1]}
                    x2={item.points[to][0]}
                    y2={item.points[to][1]}
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
