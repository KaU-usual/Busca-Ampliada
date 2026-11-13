import { useEffect, useRef, useState, type FormEvent } from 'react'
import './App.css'
import ConstellationBackground from './ConstellationBackground'

type SearchResult = {
  title: string
  authors?: string[]
  description?: string
  year?: string | number
  source: string
  type: string
  genre?: string
  access: string
  link: string
  cover?: string
  language?: string
  pdfLink?: string
  providers?: { name: string; logo: string; type: 'Assinatura' | 'Aluguel' | 'Compra' }[]
  providersLink?: string
  score: number
  relevance: string
  sources?: string[]
}

type SearchResponse = {
  status: string
  query: string
  total: number
  sources: { name: string; status: string }[]
  interpretation?: string[]
  results: SearchResult[]
  error?: string
}

const categories = [
  { icon: '📚', name: 'Livros', description: 'Explore obras e autores', query: 'livros' },
  { icon: '🎓', name: 'Pesquisas', description: 'Artigos e conhecimento científico', query: 'pesquisas acadêmicas' },
  { icon: '🎬', name: 'Filmes', description: 'Histórias e produções', query: 'filmes' },
  { icon: '📺', name: 'Séries', description: 'Universos para descobrir', query: 'séries' },
  { icon: '🌍', name: 'Documentários', description: 'Conheça o mundo', query: 'documentários' },
  { icon: '🚀', name: 'Descobertas', description: 'Assuntos e novidades', query: 'novidades e descobertas' },
]

const filters = ['Todos', 'Gratuitos', 'Livros', 'Pesquisas', 'Filmes', 'Séries', 'Documentários', 'Animações']

const discoveryTopics = [
  { icon: '🤖', title: 'Inteligência artificial', group: 'TECNOLOGIA', query: 'inteligência artificial' },
  { icon: '🏛️', title: 'Civilizações antigas', group: 'HISTÓRIA', query: 'civilizações antigas' },
  { icon: '🌌', title: 'Mistérios do universo', group: 'CIÊNCIA', query: 'astronomia e universo' },
  { icon: '🧠', title: 'Como funciona o cérebro', group: 'CONHECIMENTO', query: 'neurociência cérebro humano' },
  { icon: '🌱', title: 'Mudanças climáticas', group: 'MEIO AMBIENTE', query: 'mudanças climáticas' },
  { icon: '🎨', title: 'Arte e criatividade', group: 'CULTURA', query: 'história da arte criatividade' },
]


function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return localStorage.getItem('nexo-theme') === 'light' ? 'light' : 'dark'
  })

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('nexo-theme', theme)

    const favicon = document.querySelector<HTMLLinkElement>('#app-favicon')
    if (favicon) {
      favicon.href = theme === 'dark' ? '/favicon-dark.svg' : '/favicon-light.svg'
    }
  }, [theme])

  const [query, setQuery] = useState('')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<SearchResponse | null>(null)
  const [filter, setFilter] = useState('Todos')
  const [currentPage, setCurrentPage] = useState(1)
  const searchRequestId = useRef(0)

  async function searchFor(term: string) {
    const requestId = ++searchRequestId.current
    const normalized = term.trim()
    setQuery(normalized)

    if (normalized.length < 3) {
      setResult('Digite pelo menos 3 caracteres.')
      return
    }

    setLoading(true)
    setResult('Pesquisando nas fontes disponíveis...')
    setData(null)
    setFilter('Todos')
    setCurrentPage(1)

    try {
      const response = await fetch('https://busca-ampliada-api.dry-king-9d7d.workers.dev/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: normalized }),
      })

      const responseData: SearchResponse = await response.json()
      if (requestId !== searchRequestId.current) return

      if (!response.ok) {
        throw new Error(responseData.error || 'Não foi possível pesquisar.')
      }

      setData(responseData)
      setResult(responseData.total
        ? `${responseData.total} resultado(s) encontrados.`
        : 'Nenhum resultado encontrado. Tente outro termo.')
    } catch (error) {
      if (requestId !== searchRequestId.current) return
      setResult(error instanceof Error
        ? error.message
        : 'Não foi possível conectar ao servidor. Verifique se o backend está ligado.')
    } finally {
      if (requestId === searchRequestId.current) setLoading(false)
    }
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void searchFor(query)
  }

  function clearSearch() {
    searchRequestId.current++
    setQuery('')
    setResult('')
    setData(null)
    setFilter('Todos')
    setCurrentPage(1)
    setLoading(false)
    document.getElementById('explorar')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const visibleResults = (data?.results || []).filter(item => {
    if (filter === 'Todos') return true
    if (filter === 'Gratuitos') return item.access.toLowerCase().includes('gratuito')
    if (filter === 'Livros') return /livro/i.test(item.type)
    if (filter === 'Pesquisas') return /acadêmica|pesquisa/i.test(item.type)
    if (filter === 'Filmes') return /filme/i.test(item.type)
    if (filter === 'Séries') return /^série$/i.test(item.type)
    if (filter === 'Documentários') return /documentário/i.test(item.type)
    if (filter === 'Animações') return /animação/i.test(item.type)
    return true
  })


  const pageSize = 20
  const totalPages = Math.max(1, Math.ceil(visibleResults.length / pageSize))
  const paginatedResults = visibleResults.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  return (
    <main className="site" data-theme={theme}>
      <ConstellationBackground />
      <header className="topbar">
        <a className="brand" href="#" aria-label="Nexo, início">
          <span className="brand-symbol">N</span>
          <span>nexo<span className="brand-dot">.</span></span>
        </a>
        <nav aria-label="Navegação principal">
          <a href="#explorar">Explorar</a>
          <a href="#categorias">Categorias</a>
          <a href="#resultados">Resultados</a>
        </nav>
        <a className="access-button" href="#explorar">Descobrir</a>
        <button
          type="button"
          className="theme-toggle"
          onClick={() => setTheme(current => current === 'dark' ? 'light' : 'dark')}
          aria-label={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
          title={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
        >
          <span>{theme === 'dark' ? '☀️' : '🌙'}</span>
          <span>{theme === 'dark' ? 'Modo claro' : 'Modo escuro'}</span>
        </button>
      </header>

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
            {categories.map((category, index) => (
              <div
                key={category.name}
                className={`orbiting-category orbiting-category-${index + 1}`}
                aria-hidden="true"
              >
                <span className="category-icon">{category.icon}</span>
                <span className="category-name">{category.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>


      {data && (
        <section className="results-section" id="resultados">
          <div className="results-heading">
            <span className="eyebrow">PESQUISA AMPLIADA</span>
            <h2>Resultados para “{data.query}”</h2>
            <p>{data.total} resultado(s) relevantes encontrados</p>
          </div>

          {data.interpretation && data.interpretation.length > 0 && (
            <div className="interpretation">
              <strong>Também pesquisamos por:</strong> {data.interpretation.join(' · ')}
            </div>
          )}

          <div className="source-status">
            {data.sources.map(source => (
              <span key={source.name} className={source.status === 'indisponível' ? 'source-offline' : ''}>
                <i />{source.name}
              </span>
            ))}
          </div>

          <div className="filter-row" aria-label="Filtrar resultados">
            {filters.map(item => (
              <button
                type="button"
                key={item}
                className={filter === item ? 'active' : ''}
                onClick={() => { setFilter(item); setCurrentPage(1) }}
              >
                {item}
              </button>
            ))}
          </div>

          {visibleResults.length === 0 ? (
            <p className="empty-results">Nenhum resultado nesta categoria. Experimente outro filtro ou termo.</p>
          ) : (
            <div className="results-grid">
              {paginatedResults.map((item, index) => (
                <article className="result-card" key={item.source + '-' + item.title + '-' + index}>
                  <div className="result-cover">
                    {item.cover
                      ? <img src={item.cover} alt={'Capa: ' + item.title} loading="lazy" />
                      : <span>✧</span>}
                  </div>
                  <div className="result-body">
                    <div className="result-meta">
                      <span>{item.type}</span>
                      <span className={'relevance ' + (item.score >= 45 ? 'relevance-high' : item.score >= 20 ? 'relevance-mid' : 'relevance-low')}>
                        {item.relevance}
                      </span>
                    </div>
                    <h3>{item.title}</h3>
                    {item.authors && item.authors.length > 0 && (
                      <p className="result-author">{item.authors.slice(0, 3).join(', ')}</p>
                    )}
                    {item.year && <span className="result-year">{item.year}</span>}
                    {item.language && <span className="result-language">{item.language}</span>}
                    {item.description && (
                      <p className="result-description">
                        {item.description.replace(/<[^>]*>/g, '').slice(0, 230)}
                        {item.description.length > 230 ? '…' : ''}
                      </p>
                    )}
                    {item.genre && <p className="result-genre">{item.genre}</p>}
                    {item.providers && item.providers.length > 0 && (
                      <div className="result-providers">
                        <span className="result-providers-label">Onde assistir:</span>
                        <div className="result-provider-list">
                          {item.providers.map((provider, i) => (
                            <span
                              className="result-provider"
                              title={`${provider.name} · ${provider.type}`}
                              key={`${provider.name}-${provider.type}-${i}`}
                            >
                              {provider.logo && <img src={provider.logo} alt="" loading="lazy" />}
                              <span>{provider.name}</span>
                              <small>{provider.type}</small>
                            </span>
                          ))}
                        </div>
                        {item.providersLink && (
                          <a className="result-providers-source" href={item.providersLink} target="_blank" rel="noreferrer">
                            Ver opções no JustWatch ↗
                          </a>
                        )}
                      </div>
                    )}
                    <div className="result-footer">
                      <span className={item.access.toLowerCase().includes('gratuito') ? 'free-access' : ''}>
                        {item.access}
                      </span>
                      {item.link && <a href={item.link} target="_blank" rel="noreferrer">Consultar ↗</a>}
                      {item.pdfLink && (
                        <a className="result-pdf-link" href={item.pdfLink} target="_blank" rel="noreferrer">
                          {item.type === "Publicação acadêmica" ? "Abrir artigo em PDF ↗" : "Abrir livro em PDF ↗"}
                        </a>
                      )}
                    </div>
                    <small className="result-source">
                      Fonte: {item.sources?.join(' · ') || item.source}
                    </small>
                  </div>
                </article>
              ))}
            </div>
          )}
          {visibleResults.length > 0 && (
            <div className="pagination">
              <button
                type="button"
                aria-label="Página anterior"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
              >‹</button>
              <div className="pagination-info">
                <strong>Página {currentPage} de {totalPages}</strong>
                <span>
                  Exibindo {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, visibleResults.length)}
                  {' '}de {visibleResults.length} resultados
                </span>
              </div>
              <button
                type="button"
                aria-label="Próxima página"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
              >›</button>
            </div>
          )}

        </section>
      )}

      <section className="discovery discovery-expanded" id="categorias">
        <div className="section-heading discovery-heading">
          <div>
            <span className="eyebrow">EXPLORE SEM LIMITES</span>
            <h2>Por onde vamos começar?</h2>
            <p className="discovery-lead">Escolha um universo de conhecimento e deixe a curiosidade guiar sua próxima descoberta.</p>
          </div>
          <span className="section-note">UM MUNDO DE IDEIAS <span>✦</span></span>
        </div>

        <div className="category-grid">
          {categories.map(category => (
            <button
              type="button"
              className="category-card"
              key={category.name}
              onClick={() => void searchFor(category.query)}
              disabled={loading}
            >
              <span className="category-icon">{category.icon}</span>
              <strong>{category.name}</strong>
              <small>{category.description}</small>
              <span className="card-arrow">↗</span>
            </button>
          ))}
        </div>

        <div className="discovery-subheading">
          <div>
            <span className="eyebrow">IDEIAS PARA DESPERTAR SUA CURIOSIDADE</span>
            <h2>Inspire-se em novos assuntos</h2>
          </div>
          <span className="discovery-spark">✧</span>
        </div>

        <div className="topic-grid">
          {discoveryTopics.map(topic => (
            <button
              type="button"
              className="topic-card"
              key={topic.title}
              onClick={() => void searchFor(topic.query)}
              disabled={loading}
            >
              <span className="topic-icon">{topic.icon}</span>
              <span className="topic-group">{topic.group}</span>
              <strong>{topic.title}</strong>
              <span className="topic-action">Explorar assunto <b>↗</b></span>
            </button>
          ))}
        </div>

        <div className="free-discovery">
          <div className="free-discovery-copy">
            <span className="eyebrow">CONHECIMENTO MAIS ACESSÍVEL</span>
            <h2>Descubra o que é gratuito.</h2>
            <p>Há livros de domínio público, obras digitais e materiais de pesquisa que podem ser consultados sem custo. A disponibilidade depende de cada título e da fonte.</p>
            <button type="button" onClick={() => void searchFor('livros gratuitos domínio público') } disabled={loading}>
              Encontrar conteúdos gratuitos <span>→</span>
            </button>
          </div>
          <div className="free-source-list">
            <div><span>📖</span><p><strong>Project Gutenberg</strong><small>Livros de domínio público</small></p><b>GRATUITO</b></div>
            <div><span>🌐</span><p><strong>Open Library</strong><small>Empréstimos e livros digitais</small></p><b>VARIÁVEL</b></div>
            <div><span>🔎</span><p><strong>Google Books</strong><small>Prévia e obras em texto completo</small></p><b>VARIÁVEL</b></div>
            <div><span>🎓</span><p><strong>Crossref</strong><small>Referências de publicações científicas</small></p><b>CONSULTA</b></div>
          </div>
        </div>

        <div className="research-tips">
          <span className="eyebrow">UMA BUSCA MELHOR COMEÇA COM UMA BOA PERGUNTA</span>
          <h2>Pequenas dicas, grandes descobertas.</h2>
          <div className="tips-grid">
            <div><span>01</span><strong>Seja específico</strong><p>Inclua o assunto, o tema ou o período que deseja pesquisar.</p></div>
            <div><span>02</span><strong>Procure por autores</strong><p>O nome de um pesquisador ou escritor pode refinar os resultados.</p></div>
            <div><span>03</span><strong>Explore outras fontes</strong><p>Compare materiais e consulte a origem de cada publicação.</p></div>
          </div>
        </div>
      </section>


      <footer>
        <span className="footer-brand">nexo.</span>
        <span>Conhecimento conecta possibilidades.</span>
      </footer>
    </main>
  )
}

export default App
