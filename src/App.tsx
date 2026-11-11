import { useMemo, useState } from 'react'
import './App.css'

type SearchResult = {
  title: string; authors?: string[]; description?: string; year?: string | number
  source: string; type: string; genre?: string; access: string; link: string
  cover?: string; score: number; relevance: string; sources?: string[]
}
type SearchResponse = {
  status: string; query: string; total: number
  sources: { name: string; status: string }[]
  interpretation?: string[]; results: SearchResult[]; error?: string
}
const categories = [
  { icon: '📚', name: 'Livros', description: 'Obras, autores e domínio público', query: 'livros sobre ' },
  { icon: '🎓', name: 'Pesquisas', description: 'Artigos e conhecimento científico', query: 'pesquisas sobre ' },
  { icon: '🎬', name: 'Filmes', description: 'Cinema, clássicos e lançamentos', query: 'filmes sobre ' },
  { icon: '📺', name: 'Séries', description: 'Séries e animações', query: 'séries sobre ' },
  { icon: '🌍', name: 'Documentários', description: 'Histórias reais e descobertas', query: 'documentários sobre ' },
  { icon: '🚀', name: 'Descobertas', description: 'Temas para explorar', query: '' },
]
const filters = ['Todos', 'Livros', 'Pesquisas', 'Filmes', 'Séries', 'Animações', 'Documentários']
function matchesFilter(item: SearchResult, filter: string) {
  if (filter === 'Todos') return true
  if (filter === 'Pesquisas') return item.type === 'Publicação acadêmica'
  if (filter === 'Livros') return item.type.toLowerCase().includes('livro')
  if (filter === 'Filmes') return item.type === 'Filme'
  if (filter === 'Séries') return item.type === 'Série'
  if (filter === 'Animações') return item.type.toLowerCase().includes('animação')
  if (filter === 'Documentários') return item.type === 'Documentário'
  return true
}
function App() {
  const [query, setQuery] = useState('')
  const [data, setData] = useState<SearchResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('Todos')
  const visibleResults = useMemo(() => (data?.results || []).filter(item => matchesFilter(item, filter)), [data, filter])

  async function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const search = query.trim()
    if (search.length < 3) { setError('Digite pelo menos 3 caracteres.'); return }
    setLoading(true); setError(''); setData(null); setFilter('Todos')
    try {
      const response = await fetch('/api/search', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: search }),
      })
      const payload = await response.json() as SearchResponse
      if (!response.ok) throw new Error(payload.error || 'Não foi possível pesquisar.')
      setData(payload)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao conectar com o serviço de pesquisa.')
    } finally { setLoading(false) }
  }

  return (
    <main className="site">
      <header className="topbar">
        <a className="brand" href="#" aria-label="Nexo, início"><span className="brand-symbol">N</span><span>nexo<span className="brand-dot">.</span></span></a>
        <nav aria-label="Navegação principal"><a href="#explorar">Explorar</a><a href="#categorias">Categorias</a><a href="#resultados">Resultados</a></nav>
        <a className="access-button" href="#explorar">Descobrir</a>
      </header>
      <section className="hero">
        <div className="hero-content">
          <span className="eyebrow">CONHECIMENTO SEM FRONTEIRAS</span>
          <h1>O mundo é vasto.<br /><span>Descubra mais.</span></h1>
          <p>Encontre livros, pesquisas, filmes, séries e documentários. Explore qualquer assunto e descubra novas perspectivas.</p>
          <form className="search-box" onSubmit={handleSearch}>
            <span aria-hidden="true">⌕</span>
            <input value={query} onChange={event => setQuery(event.target.value)} placeholder="O que você gostaria de descobrir?" aria-label="Sua pesquisa" />
            <button type="submit" disabled={loading}>{loading ? 'Pesquisando...' : 'Pesquisar →'}</button>
          </form>
          {error && <p className="search-error" role="alert">{error}</p>}
          {loading && <p className="loading-message" role="status">Consultando livros, artigos, filmes e séries...</p>}
          <div className="search-hint"><span>Experimente:</span>
            {['Mitologia grega', 'Inteligência artificial', 'Astronomia'].map(term => <button type="button" key={term} onClick={() => setQuery(term)}>{term}</button>)}
          </div>
        </div>
        <div className="hero-art" aria-hidden="true"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="glow" /><div className="core">N</div><span className="floating-item item-one">📖</span><span className="floating-item item-two">✦</span><span className="floating-item item-three">◈</span></div>
      </section>
      <section className="discovery" id="explorar">
        <div className="section-heading"><div><span className="eyebrow">UM UNIVERSO DE POSSIBILIDADES</span><h2>Explore o conhecimento</h2></div><span className="section-note">Escolha uma categoria para começar ↗</span></div>
        <div className="category-grid" id="categorias">
          {categories.map(category => <button className="category-card" key={category.name} onClick={() => { if (category.query) setQuery(category.query); document.querySelector<HTMLInputElement>('.search-box input')?.focus() }}>
            <span className="category-icon">{category.icon}</span><strong>{category.name}</strong><small>{category.description}</small><span className="card-arrow">↗</span>
          </button>)}
        </div>
      </section>
      {data && <section className="results-section" id="resultados">
        <div className="results-heading"><span className="eyebrow">PESQUISA AMPLIADA</span><h2>Resultados para “{data.query}”</h2><p>{data.total} resultado(s) relevantes encontrados</p></div>
        {data.interpretation && data.interpretation.length > 0 && <div className="interpretation"><strong>Também pesquisamos por:</strong> {data.interpretation.join(' · ')}</div>}
        <div className="source-status">{data.sources.map(source => <span key={source.name} className={source.status === 'indisponível' ? 'source-offline' : ''}><i />{source.name}</span>)}</div>
        <div className="filter-row" aria-label="Filtrar resultados">{filters.map(item => <button type="button" key={item} className={filter === item ? 'active' : ''} onClick={() => setFilter(item)}>{item}</button>)}</div>
        {visibleResults.length === 0 ? <p className="empty-results">Nenhum resultado nesta categoria. Experimente outro filtro ou termo.</p> :
          <div className="results-grid">{visibleResults.map((item, index) => <article className="result-card" key={item.source + '-' + item.title + '-' + index}>
            <div className="result-cover">{item.cover ? <img src={item.cover} alt={'Capa: ' + item.title} loading="lazy" /> : <span>✧</span>}</div>
            <div className="result-body"><div className="result-meta"><span>{item.type}</span><span className={'relevance ' + (item.score >= 45 ? 'relevance-high' : item.score >= 20 ? 'relevance-mid' : 'relevance-low')}>{item.relevance}</span></div>
              <h3>{item.title}</h3>
              {item.authors && item.authors.length > 0 && <p className="result-author">{item.authors.slice(0, 3).join(', ')}</p>}
              {item.year && <span className="result-year">{item.year}</span>}
              {item.description && <p className="result-description">{item.description.replace(/<[^>]*>/g, '').slice(0, 230)}{item.description.length > 230 ? '…' : ''}</p>}
              {item.genre && <p className="result-genre">{item.genre}</p>}
              <div className="result-footer"><span className={item.access.toLowerCase().includes('gratuito') ? 'free-access' : ''}>{item.access}</span>{item.link && <a href={item.link} target="_blank" rel="noreferrer">Consultar ↗</a>}</div>
              <small className="result-source">Fonte: {item.sources?.join(' · ') || item.source}</small>
            </div>
          </article>)}</div>}
      </section>}
      <footer><span className="footer-brand">nexo.</span><span>Conhecimento conecta possibilidades.</span></footer>
    </main>
  )
}
export default App
