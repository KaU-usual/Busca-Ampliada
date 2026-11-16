import type { Category, CelestialBody } from '../types/home'

export const categories: Category[] = [
  { icon: '📚', name: 'Livros', description: 'Explore obras e autores', query: 'livros' },
  { icon: '🎓', name: 'Pesquisas', description: 'Artigos e conhecimento científico', query: 'pesquisas acadêmicas' },
  { icon: '🎬', name: 'Filmes', description: 'Histórias e produções', query: 'filmes' },
  { icon: '📺', name: 'Séries', description: 'Universos para descobrir', query: 'séries' },
  { icon: '🌍', name: 'Documentários', description: 'Conheça o mundo', query: 'documentários' },
  { icon: '🚀', name: 'Descobertas', description: 'Assuntos e novidades', query: 'novidades e descobertas' },
]

export const celestialBodies: CelestialBody[] = [
  { name: 'Mercúrio', description: 'O menor planeta e o mais próximo do Sol. Sua superfície rochosa tem crateras e temperaturas extremas.' },
  { name: 'Vênus', description: 'Um mundo de atmosfera muito densa, coberto por nuvens e com a superfície mais quente entre os planetas.' },
  { name: 'Terra', description: 'Nosso lar. Um planeta com água líquida abundante, atmosfera protetora e a vida que conhecemos.' },
  { name: 'Marte', description: 'O planeta vermelho. Tem vulcões gigantes, antigos leitos de rios e é alvo de exploração espacial.' },
  { name: 'Júpiter', description: 'O maior planeta do Sistema Solar. Um gigante gasoso marcado por tempestades, incluindo a Grande Mancha Vermelha.' },
  { name: 'Saturno', description: 'Um gigante gasoso conhecido por seu impressionante sistema de anéis formado principalmente por gelo e rocha.' },
  { name: 'Urano', description: 'Um gigante gelado que gira quase de lado. Sua atmosfera contém metano, que contribui para a cor azul-esverdeada.' },
  { name: 'Netuno', description: 'O planeta mais distante do Sol. Um gigante gelado de ventos extremamente velozes e intensa coloração azul.' },
]

export const filters = [
  'Todos',
  'Gratuitos',
  'Livros',
  'Pesquisas',
  'Filmes',
  'Séries',
  'Documentários',
  'Animações',
]

export const discoveryTopics = [
  { icon: '🤖', title: 'Inteligência artificial', group: 'TECNOLOGIA', query: 'inteligência artificial' },
  { icon: '🏛️', title: 'Civilizações antigas', group: 'HISTÓRIA', query: 'civilizações antigas' },
  { icon: '🌌', title: 'Mistérios do universo', group: 'CIÊNCIA', query: 'astronomia e universo' },
  { icon: '🧠', title: 'Como funciona o cérebro', group: 'CONHECIMENTO', query: 'neurociência cérebro humano' },
  { icon: '🌱', title: 'Mudanças climáticas', group: 'MEIO AMBIENTE', query: 'mudanças climáticas' },
  { icon: '🎨', title: 'Arte e criatividade', group: 'CULTURA', query: 'história da arte criatividade' },
]
