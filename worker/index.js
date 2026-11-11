const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" }
  });
}

function normalizeText(value) {
  return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

async function fetchJSON(url, timeout = 8000) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(timeout) });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

function buildSearchTerms(query) {
  const normalized = normalizeText(query);
  const cleaned = normalized
    .replace(/^(quero|gostaria|preciso|procuro|pesquise|pesquisar|encontre|buscar|busque|me fale sobre|fale sobre|explique|entender|compreender)\s+/i, "")
    .replace(/[?!.,;:]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const terms = [query.trim()];
  if (cleaned && cleaned !== normalized) terms.push(cleaned);

  const stopWords = ["sobre", "para", "com", "uma", "dos", "das", "que", "como", "the", "and", "quero", "gostaria", "preciso", "procuro", "filmes", "filme", "series", "séries", "livros", "livro", "pesquisas", "pesquisa", "documentarios", "documentários"];
  const words = cleaned.split(/\s+/).filter(word => word.length > 2 && !stopWords.includes(word));
  if (words.length > 1) terms.push(words.join(" "));

  if (/\bcronos\b/.test(normalized)) {
    terms.push("Cronos Urano Zeus Hesiodo mitologia grega");
    terms.push("Teogonia Hesiodo sucessao dos deuses");
  } else if (/mitolog|deuses gregos|titas|olimpianos/.test(normalized)) {
    terms.push("mitologia grega deuses titas");
    terms.push("Hesiodo Teogonia mitos gregos");
  } else if (/inteligencia artificial|\bia\b/.test(normalized)) {
    terms.push("inteligencia artificial aprendizado de maquina");
  } else if (/mudancas climaticas|aquecimento global/.test(normalized)) {
    terms.push("mudancas climaticas aquecimento global impactos");
  }

  return [...new Set(terms.map(term => term.trim()).filter(Boolean))].slice(0, 3);
}

function score(item, query) {
  const title = normalizeText(item.title);
  const description = normalizeText(item.description);
  const normalizedQuery = normalizeText(query);
  const stopWords = ["quero", "gostaria", "preciso", "procuro", "pesquise", "pesquisar", "encontre", "buscar", "busque", "fale", "entender", "compreender", "sobre", "para", "com", "uma", "dos", "das", "que", "como", "filmes", "filme", "series", "séries", "livros", "livro", "pesquisas", "pesquisa", "documentarios", "documentários"];
  const terms = normalizedQuery.split(/\s+/).filter(term => term.length > 2 && !stopWords.includes(term));
  let points = 0;

  if (title === normalizedQuery) points += 70;
  else if (title.includes(normalizedQuery)) points += 48;

  const titleMatches = terms.filter(term => title.includes(term)).length;
  const descriptionMatches = terms.filter(term => description.includes(term)).length;
  if (terms.length && titleMatches === terms.length) points += 35;
  else points += titleMatches * 11;
  points += descriptionMatches * 3;

  if (/\bcronos\b/.test(normalizedQuery)) {
    const mythContext = /hesiod|teogonia|urano|zeus|tita|mitolog|deus|genealogia|sucessao/.test(title + " " + description);
    if (title.includes("cronos") && mythContext) points += 25;
    else if (title.includes("cronos")) points += 12;
    else if (mythContext) points += 7;
  }

  if (/\bzeus\b/.test(normalizedQuery) && /salazar/.test(title + " " + description)) {
    points -= 35;
  }

  if (item.type === "Publicação acadêmica" && (titleMatches > 0 || descriptionMatches > 0)) points += 5;
  return Math.max(0, Math.min(points, 100));
}

async function searchMultiple(searchFunction, terms) {
  const batches = [];
  for (const term of terms) {
    const results = await searchFunction(term);
    if (Array.isArray(results)) batches.push(...results);
  }
  return batches;
}

async function searchBooks(query) {
  const data = await fetchJSON("https://www.googleapis.com/books/v1/volumes?q=" + encodeURIComponent(query) + "&maxResults=10");
  return (data?.items || []).map(item => {
    const info = item.volumeInfo || {};
    const access = item.accessInfo || {};
    const free = access.publicDomain === true;
    return {
      title: info.title || "", authors: info.authors || [],
      description: info.description || "", year: info.publishedDate || "",
      source: "Google Books", type: "Livro",
      access: free ? "Gratuito (domínio público)" : "Consultar acesso",
      link: info.infoLink || item.selfLink || "",
      cover: info.imageLinks?.thumbnail || ""
    };
  });
}

async function searchOpenLibrary(query) {
  const data = await fetchJSON("https://openlibrary.org/search.json?q=" + encodeURIComponent(query) + "&limit=10");
  return (data?.docs || []).map(item => ({
    title: item.title || "", authors: item.author_name || [],
    description: "", year: item.first_publish_year || "",
    source: "Open Library", type: "Livro",
    access: item.ebook_access === "public" ? "Gratuito" :
      item.ebook_access === "borrowable" ? "Empréstimo digital (verificar)" : "Consultar disponibilidade",
    link: item.key ? "https://openlibrary.org" + item.key : "",
    cover: item.cover_i ? "https://covers.openlibrary.org/b/id/" + item.cover_i + "-M.jpg" : ""
  }));
}

async function searchCrossref(query) {
  const data = await fetchJSON("https://api.crossref.org/works?query.bibliographic=" + encodeURIComponent(query) + "&rows=10");
  return (data?.message?.items || []).map(item => ({
    title: item.title?.[0] || "",
    authors: (item.author || []).map(author => [author.given, author.family].filter(Boolean).join(" ")),
    description: item.abstract || "",
    year: item.published?.["date-parts"]?.[0]?.[0] || "",
    source: "Crossref", type: "Publicação acadêmica",
    access: item.link?.length ? "Consultar acesso" : "Acesso não confirmado",
    link: item.DOI ? "https://doi.org/" + item.DOI : item.URL || "",
    cover: ""
  }));
}

async function searchGutendex(query) {
  const data = await fetchJSON("https://gutendex.com/books/?search=" + encodeURIComponent(query));
  return (data?.results || []).map(item => ({
    title: item.title || "", authors: (item.authors || []).map(author => author.name),
    description: "", year: "", source: "Project Gutenberg",
    type: "Livro de domínio público", access: "Gratuito",
    link: item.formats?.["text/html"] || item.formats?.["application/epub+zip"] || "",
    cover: item.formats?.["image/jpeg"] || ""
  }));
}

async function searchMovies(query) {
  const data = await fetchJSON("https://itunes.apple.com/search?term=" + encodeURIComponent(query) + "&country=br&media=movie&entity=movie&limit=15");
  return (data?.results || []).map(item => ({
    title: item.trackName || item.collectionName || "",
    authors: item.artistName ? [item.artistName] : [],
    description: item.longDescription || item.shortDescription || "",
    year: item.releaseDate ? item.releaseDate.slice(0, 4) : "",
    source: "Apple iTunes", type: "Filme",
    genre: item.primaryGenreName || "",
    access: "Consultar opções de acesso",
    link: item.trackViewUrl || item.collectionViewUrl || "",
    cover: (item.artworkUrl100 || "").replace("100x100", "600x600")
  }));
}

async function searchShows(query) {
  const data = await fetchJSON("https://api.tvmaze.com/search/shows?q=" + encodeURIComponent(query));
  return (data || []).map(entry => {
    const show = entry.show || {};
    const genres = show.genres || [];
    const isDocumentary = genres.some(genre => /documentary/i.test(genre));
    const isAnimation = genres.some(genre => /animation/i.test(genre));
    return {
      title: show.name || "", authors: show.network?.name ? [show.network.name] : [],
      description: (show.summary || "").replace(/<[^>]*>/g, ""),
      year: show.premiered ? show.premiered.slice(0, 4) : "",
      source: "TVmaze",
      type: isDocumentary ? "Documentário" : isAnimation ? "Animação / série" : "Série",
      genre: genres.join(", "),
      access: "Consultar onde assistir",
      link: show.officialSite || show.url || "",
      cover: show.image?.medium || show.image?.original || ""
    };
  });
}

async function searchTmdb(query, env) {
  if (!env?.TMDB_API_TOKEN) return null;
  const data = await fetchJSON("https://api.themoviedb.org/3/search/multi?query=" + encodeURIComponent(query) + "&include_adult=false&language=pt-BR&page=1", 9000);
  return (data?.results || []).filter(item => ["movie", "tv"].includes(item.media_type)).map(item => ({
    title: item.title || item.name || "",
    authors: [],
    description: item.overview || "",
    year: (item.release_date || item.first_air_date || "").slice(0, 4),
    source: "The Movie Database",
    type: item.media_type === "movie" ? "Filme" : "Série",
    access: "Consultar onde assistir",
    link: "https://www.themoviedb.org/" + item.media_type + "/" + item.id,
    cover: item.poster_path ? "https://image.tmdb.org/t/p/w500" + item.poster_path : ""
  }));
}

function classify(points) {
  if (points >= 45) return "Diretamente relacionado";
  if (points >= 20) return "Aprofundamento";
  return "Complementar";
}

function deduplicate(results) {
  const map = new Map();
  for (const item of results) {
    if (!item.title || !item.title.trim()) continue;
    const key = normalizeText(item.title).replace(/[^a-z0-9]/g, "");
    const previous = map.get(key);
    if (!previous || item.score > previous.score) map.set(key, item);
    else if (previous && !previous.sources.includes(item.source)) previous.sources.push(item.source);
  }
  return [...map.values()];
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
    if (url.pathname === "/api/health") return json({ status: "online", project: "Busca Ampliada" });

    if (url.pathname === "/api/search" && request.method === "POST") {
      let body;
      try { body = await request.json(); }
      catch { return json({ error: "Envie um JSON válido." }, 400); }

      const query = typeof body.query === "string" ? body.query.trim() : "";
      if (query.length < 3) return json({ error: "Digite pelo menos 3 caracteres." }, 400);
      if (query.length > 500) return json({ error: "A pesquisa deve ter até 500 caracteres." }, 400);

      const terms = buildSearchTerms(query);
      const sourceJobs = [
        { name: "Google Books", run: () => searchMultiple(searchBooks, terms) },
        { name: "Open Library", run: () => searchMultiple(searchOpenLibrary, terms) },
        { name: "Crossref", run: () => searchMultiple(searchCrossref, terms) },
        { name: "Project Gutenberg", run: () => searchMultiple(searchGutendex, terms) },
        { name: "Apple iTunes", run: () => searchMultiple(searchMovies, terms) },
        { name: "TVmaze", run: () => searchMultiple(searchShows, terms) }
      ];
      if (env?.TMDB_API_TOKEN) {
        sourceJobs.push({ name: "The Movie Database", run: () => searchMultiple(term => searchTmdb(term, env), terms) });
      }

      const settled = await Promise.allSettled(sourceJobs.map(job => job.run()));
      const allResults = [];
      const sources = sourceJobs.map((job, index) => {
        const outcome = settled[index];
        if (outcome.status === "fulfilled" && Array.isArray(outcome.value)) {
          allResults.push(...outcome.value);
          return { name: job.name, status: outcome.value.length ? "resultados encontrados" : "consultada sem resultados" };
        }
        return { name: job.name, status: "indisponível" };
      });

      const ranked = allResults.map(item => {
        const points = score(item, query);
        return { ...item, score: points, relevance: classify(points), sources: [item.source] };
      }).filter(item => item.score > 0);

      const results = deduplicate(ranked)
        .sort((a, b) => b.score - a.score || (a.access.startsWith("Gratuito") ? -1 : 1))
        .slice(0, 60);

      return json({
        status: "success", query, total: results.length, sources,
        interpretation: terms.slice(1),
        notes: env?.TMDB_API_TOKEN ? [] : ["A busca avançada no TMDB pode ser ativada com um token de API gratuito, armazenado como segredo no servidor."],
        results
      });
    }

    return json({ error: "Rota não encontrada." }, 404);
  }
};