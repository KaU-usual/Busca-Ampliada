import type { SearchResponse } from '../types/search'
import { categories, celestialBodies } from '../data/home'
import { isCategoryBody } from '../types/home'

type HeroProps = {
  theme: 'dark' | 'light'
  query: string
  setQuery: (value: string) => void
  result: string
  data: SearchResponse | null
  loading: boolean
  handleSearch: (event: React.FormEvent<HTMLFormElement>) => void
  clearSearch: () => void
  searchFor: (term: string) => void
}

export default function Hero({
  theme, query, setQuery, result, data, loading,
  handleSearch, clearSearch, searchFor
}: HeroProps) {
  return (
    <section className="hero" id="explorar">
      <div className="hero-content">
        <span className="eyebrow">CONHECIMENTO SEM FRONTEIRAS</span>
        <h1 className="hero-title">Um universo <span>de possibilidades</span></h1>
        <p className="hero-intro">Pesquise, explore e descubra novas perspectivas.</p>

        <form className="search-box" onSubmit={handleSearch}>
          <span>⌕</span>
          <input
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder="O que você gostaria de descobrir?"
            aria-label="Sua pesquisa"
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Pesquisando...' : 'Pesquisar →'}
          </button>
          {(query || result || data) && (
            <button type="button" className="search-clear" onClick={clearSearch}>
              Limpar pesquisa
            </button>
          )}
        </form>

        {result && <p role="status" aria-live="polite">{result}</p>}

        <div className="search-hint">
          <span>Experimente:</span>
          {['História antiga', 'Inteligência artificial', 'Astronomia'].map(term => (
            <button type="button" key={term} onClick={() => setQuery(term)}>
              {term}
            </button>
          ))}
        </div>
      </div>

      <div className="hero-art">
        <div className="atom-bouncer">
          <div className="atom-orbit orbit orbit-one" />
          <div className="atom-orbit orbit orbit-two" />
          <div className="atom-orbit orbit orbit-three" />
          <div className="glow" />
          <div className="atom-core" aria-hidden="true" />
          {(theme === 'light' ? celestialBodies : categories).map((body, index) => {
            const isCategory = isCategoryBody(body)
            const description = body.description

            return (
              <button
                type="button"
                key={body.name}
                className={`orbiting-category orbiting-category-${index + 1}`}
                aria-label={isCategory ? `${body.name}: ${description}. Pesquisar categoria.` : `Conhecer ${body.name}`}
                title={body.name}
                onClick={() => {
                  if (isCategory) searchFor(body.query)
                }}
              >
                <span className="category-icon">
                  {isCategory ? body.icon : <span className="planet-surface" aria-hidden="true" />}
                </span>
                {isCategory && (
                  <span className="category-name">
                    <strong>{body.name}</strong>
                    <small>{description}</small>
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}
