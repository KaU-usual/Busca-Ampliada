import { useEffect, useRef, useState, type FormEvent } from 'react'
import './styles/App.css'
import ConstellationBackground from './components/ConstellationBackground'
import type { SearchResponse } from './types/search'
import { searchResources } from './services/searchService'
import Header from './components/Header'
import DiscoverySection from './components/DiscoverySection'
import Footer from './components/Footer'
import Hero from './components/Hero'
import ResultsSection from './components/ResultsSection'

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
      const responseData = await searchResources(normalized)
      if (requestId !== searchRequestId.current) return

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

  return (
    <main className="site" data-theme={theme}>
      <ConstellationBackground />
      <Header theme={theme} setTheme={setTheme} />

      <Hero
        theme={theme}
        query={query}
        setQuery={setQuery}
        result={result}
        data={data}
        loading={loading}
        handleSearch={handleSearch}
        clearSearch={clearSearch}
        searchFor={searchFor}
      />

      <ResultsSection
        data={data}
        filter={filter}
        setFilter={setFilter}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
      />

      <DiscoverySection searchFor={searchFor} loading={loading} />

      <Footer />
    </main>
  )
}

export default App
