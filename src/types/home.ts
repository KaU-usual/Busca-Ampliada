export type Category = {
  icon: string
  name: string
  description: string
  query: string
}

export type CelestialBody = {
  name: string
  description: string
}

export function isCategoryBody(
  body: Category | CelestialBody
): body is Category {
  return 'query' in body
}
