import type { SearchResponse } from '../types/search'
import { filters } from '../data/home'

type Props = {
  data: SearchResponse | null
  filter: string
  setFilter: (value: string) => void
  currentPage: number
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>
}

export default function ResultsSection({ data, filter, setFilter, currentPage, setCurrentPage }: Props) {
  if (!data) return null

  const visibleResults = data.results.filter(item => {
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
  const paginatedResults = visibleResults.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  return (
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
          <button type="button" key={item} className={filter === item ? 'active' : ''}
            onClick={() => { setFilter(item); setCurrentPage(1) }}>
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
                {item.cover ? <img src={item.cover} alt={'Capa: ' + item.title} loading="lazy" /> : <span>✧</span>}
              </div>
              <div className="result-body">
                <div className="result-meta">
                  <span>{item.type}</span>
                  <span className={'relevance ' + (item.score >= 45 ? 'relevance-high' : item.score >= 20 ? 'relevance-mid' : 'relevance-low')}>
                    {item.relevance}
                  </span>
                </div>
                <h3>{item.title}</h3>
                {item.authors && item.authors.length > 0 && <p className="result-author">{item.authors.slice(0, 3).join(', ')}</p>}
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
                        <span className="result-provider" title={`${provider.name} · ${provider.type}`} key={`${provider.name}-${provider.type}-${i}`}>
                          {provider.logo && <img src={provider.logo} alt="" loading="lazy" />}
                          <span>{provider.name}</span><small>{provider.type}</small>
                        </span>
                      ))}
                    </div>
                    {item.providersLink && <a className="result-providers-source" href={item.providersLink} target="_blank" rel="noreferrer">Ver opções no JustWatch ↗</a>}
                  </div>
                )}
                <div className="result-footer">
                  <span className={item.access.toLowerCase().includes('gratuito') ? 'free-access' : ''}>{item.access}</span>
                  {item.link && <a href={item.link} target="_blank" rel="noreferrer">Consultar ↗</a>}
                  {item.pdfLink && (
                    <a className="result-pdf-link" href={item.pdfLink} target="_blank" rel="noreferrer">
                      {item.type === 'Publicação acadêmica' ? 'Abrir artigo em PDF ↗' : 'Abrir livro em PDF ↗'}
                    </a>
                  )}
                </div>
                <small className="result-source">Fonte: {item.sources?.join(' · ') || item.source}</small>
              </div>
            </article>
          ))}
        </div>
      )}

      {visibleResults.length > 0 && (
        <div className="pagination">
          <button type="button" aria-label="Página anterior" disabled={currentPage === 1}
            onClick={() => setCurrentPage(page => Math.max(1, page - 1))}>‹</button>
          <div className="pagination-info">
            <strong>Página {currentPage} de {totalPages}</strong>
            <span>Exibindo {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, visibleResults.length)} de {visibleResults.length} resultados</span>
          </div>
          <button type="button" aria-label="Próxima página" disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}>›</button>
        </div>
      )}
    </section>
  )
}
