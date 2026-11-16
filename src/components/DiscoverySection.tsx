import { categories, discoveryTopics } from '../data/home'

type Props = {
  searchFor: (term: string) => void
  loading: boolean
}

export default function DiscoverySection({ searchFor, loading }: Props) {
  return (
    <section className="discovery discovery-expanded" id="categorias">
      <div className="category-grid">
        {categories.map(category => (
          <button
            type="button"
            className="category-card"
            key={category.name}
            onClick={() => searchFor(category.query)}
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
            onClick={() => searchFor(topic.query)}
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
          <button type="button" onClick={() => searchFor('livros gratuitos domínio público')} disabled={loading}>
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
  )
}
