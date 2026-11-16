export type SearchResult = {
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
  providers?: {
    name: string
    logo: string
    type: 'Assinatura' | 'Aluguel' | 'Compra'
  }[]
  providersLink?: string
  score: number
  relevance: string
  sources?: string[]
}

export type SearchResponse = {
  status: string
  query: string
  total: number
  sources: { name: string; status: string }[]
  interpretation?: string[]
  results: SearchResult[]
  error?: string
}
