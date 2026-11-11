
import { useState, type FormEvent } from 'react'
import './App.css'

type SearchResult = {
  title: string
  authors: string[]
  description: string
  year: string | number
  source: string
  type: string
  access: string
  link: string
  cover: string
  relevance: string
  relevanceScore: number
}

type SourceStatus = {
  name: string
  status: string
}

const categories = [
  { icon: '📚', name: 'Livros', description: 'Explore obras e autores' },
  { icon: '🎓', name: 'Pesquisas', description: 'Artigos e conhecimento científico' },
  { icon: '🎬', name: 'Filmes', description: 'Histórias e produções' },
  { icon: '📺', name: 'Séries', description: 'Universos para descobrir' },
  { icon: '🌍', name: 'Documentários', description: 'Conheça o mundo' },
  { icon: '🚀', name: 'Descobertas', description: 'Assuntos e novidades' },
]

function App() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [sources, setSources] = useState<SourceStatus[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [searched, setSearched] = useState(false)

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (query.trim().length < 3) {
      setMessage('Digite pelo menos 3 caracteres.')
      return
    }

    setLoading(true)
    setSearched(false)
    setResults([])
    setSources([])
    setMessage('Pesquisando em fontes de conhecimento...')

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim() }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Não foi possível pesquisar.')
      }

      const uniqueResults: SearchResult[] = []
      const seen = new Set<string>()

      for (const item of data.results || []) {
        if (!item.title?.trim()) continue

        const key = item.title.trim().toLowerCase()

        if (!seen.has(key)) {
          seen.add(key)
          uniqueResults.push(item)
        }
      }

      uniqueResults.sort((a, b) => {
  const relevanceOrder = b.relevanceScore - a.relevanceScore

  if (relevanceOrder !== 0) {
    return relevanceOrder
  }

  const freeA = a.access === 'Gratuito' ? 1 : 0
  const freeB = b.access === 'Gratuito' ? 1 : 0

  return freeB - freeA
})

      setResults(uniqueResults)
      setSources(data.sources || [])
      setMessage(
        uniqueResults.length > 0
          ? `${uniqueResults.length} resultados encontrados para sua pesquisa.`
          : 'Nenhum resultado com título válido foi encontrado.'
      )
      setSearched(true)
    } catch {
      setMessage('Não foi possível conectar ao servidor. Verifique se o backend está ligado.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="site">
      <header className="topbar">
        <a className="brand" href="#">
          <span className="brand-symbol">N</span>
          <span>nexo<span className="brand-dot">.</span></span>
        </a>

        <nav>
          <a href="#explorar">Explorar</a>
          <a href="#categorias">Categorias</a>
          <a href="#novidades">Novidades</a>
        </nav>

        <button className="access-button">Acessar</button>
      </header>

      <section className="hero">
        <div className="hero-content">
          <span className="eyebrow">CONHECIMENTO SEM FRONTEIRAS</span>
          <h1>O mundo é vasto.<br />
            <span>Descubra mais.</span>
          </h1>
          <p>
            Encontre livros, pesquisas, filmes e ideias.
            Explore qualquer assunto e descubra novas perspectivas.
          </p>

          <form className="search-box" onSubmit={handleSearch}>
            <span>⌕</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="O que você gostaria de descobrir?"
              aria-label="Sua pesquisa"
            />
            <button type="submit" disabled={loading}>
              {loading ? 'Pesquisando...' : 'Pesquisar →'}
            </button>
          </form>

          {message && (
            <p role="status" aria-live="polite">{message}</p>
          )}

          <div className="search-hint">
            <span>Experimente:</span>
            {['História antiga', 'Inteligência artificial', 'Astronomia'].map((term) => (
              <button
                type="button"
                key={term}
                onClick={() => setQuery(term)}
              >
                {term}
              </button>
            ))}
          </div>
        </div>

        <div className="hero-art" aria-hidden="true">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="glow" />
          <div className="core">N</div>
          <span className="floating-item item-one">📖</span>
          <span className="floating-item item-two">✦</span>
          <span className="floating-item item-three">◈</span>
        </div>
      </section>

      {searched && (
        <section className="results-section" id="resultados">
          <div className="section-heading">
            <div>
              <span className="eyebrow">SUA DESCOBERTA COMEÇA AQUI</span>
              <h2>Resultados da pesquisa</h2>
            </div>
            <span className="section-note">{results.length} resultados</span>
          </div>

          <div className="sources-list">
            {sources.map((source) => (
              <span className="source-tag" key={source.name}>
                {source.status === 'consultada' ? '●' : '○'} {source.name}
              </span>
            ))}
          </div>

          <div className="results-grid">
            {results.map((item, index) => (
              <article className="result-card" key={`${item.source}-${item.title}-${index}`}>
                {item.cover ? (
                  <img
                    className="result-cover"
                    src={item.cover}
                    alt={`Capa de ${item.title}`}
                    loading="lazy"
                  />
                ) : (
                  <div className="result-cover result-cover-empty">📖</div>
                )}

                <div className="result-content">
                  <span className={`result-relevance ${
  item.relevance === 'Diretamente relacionado'
    ? 'relevance-direct'
    : item.relevance === 'Aprofundamento'
      ? 'relevance-deep'
      : 'relevance-complementary'
}`}>
  {item.relevance}
</span>

<span className="result-type">{item.type}</span>
                  <h3>{item.title}</h3>

                  {item.authors.length > 0 && (
                    <p className="result-author">
                      {item.authors.filter(Boolean).join(', ')}
                    </p>
                  )}

                  {item.year && (
                    <span className="result-year">{item.year}</span>
                  )}

                  <div className="result-meta">
                    <span className="result-source">{item.source}</span>
                    <span className={item.access === 'Gratuito' ? 'access-free' : 'access-check'}>
                      {item.access}
                    </span>
                  </div>

                  {item.link && (
                    <a
                      className="result-link"
                      href={item.link}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Consultar conteúdo ↗
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="discovery" id="explorar">
        <div className="section-heading">
          <div>
            <span className="eyebrow">UM UNIVERSO DE POSSIBILIDADES</span>
            <h2>Explore o conhecimento</h2>
          </div>
          <span className="section-note">Descubra por onde começar ↗</span>
        </div>

        <div className="category-grid" id="categorias">
          {categories.map((category) => (
            <button className="category-card" key={category.name}>
              <span className="category-icon">{category.icon}</span>
              <strong>{category.name}</strong>
              <small>{category.description}</small>
              <span className="card-arrow">↗</span>
            </button>
          ))}
        </div>
      </section>

      <footer id="novidades">
        <span className="footer-brand">nexo.</span>
        <span>Conhecimento conecta possibilidades.</span>
      </footer>
    </main>
  )
}

export default App
