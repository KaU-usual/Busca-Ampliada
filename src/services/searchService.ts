import type { SearchResponse } from '../types/search'

const API_URL = 'https://busca-ampliada-api.dry-king-9d7d.workers.dev/api/search'

export async function searchResources(query: string): Promise<SearchResponse> {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  })

  const responseData: SearchResponse = await response.json()

  if (!response.ok) {
    throw new Error(responseData.error || 'Não foi possível pesquisar.')
  }

  return responseData
}
