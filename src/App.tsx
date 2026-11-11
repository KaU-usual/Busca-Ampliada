import { useState } from 'react'
import './App.css'

const categories = [
  { icon: '📚', name: 'Livros', description: 'Explore obras e autores' },
  { icon: '🎓', name: 'Pesquisas', description: 'Artigos e conhecimento científico' },
  { icon: '🎬', name: 'Filmes', description: 'Histórias e produções' },
  { icon: '📺', name: 'Séries', description: 'Universos para descobrir' },
  { icon: '🌍', name: 'Documentários', description: 'Conheça o mundo' },
  { icon: '🚀', name: 'Descobertas', description: 'Assuntos e novidades' },
]

const API_URL = ''

function App() {
  const [query, setQuery] = useState('')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (query.trim().length < 3) {
      setResult('Digite pelo menos 3 caracteres.')
      return
    }

    setLoading(true)
    setResult('Enviando sua pesquisa...')

    try {
      const response = await fetch(`${API_URL}/api/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Não foi possível pesquisar.')
      }

      setResult(data.message)
    } catch {
      setResult('Não foi possível conectar ao servidor. Verifique se o backend está ligado.')
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
              {loading ? 'Enviando...' : 'Pesquisar →'}
            </button>
          </form>

          {result && <p role="status" aria-live="polite">{result}</p>}

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
