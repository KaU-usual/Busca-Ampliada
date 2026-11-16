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

function cleanDescription(value) {
  return String(value || "")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;|&#160;|&#xA0;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;|&#34;/gi, '"')
    .replace(/&apos;|&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/\s+/g, " ")
    .trim();
}

function cleanAuthors(value) {
  const authors = Array.isArray(value) ? value : [value];

  return [...new Set(
    authors
      .map(author => String(author || "").trim())
      .filter(Boolean)
  )];
}


async function fetchJSON(url, timeout = 8000, options = {}) {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "User-Agent": "BuscaAmpliada/1.0",
        ...(options.headers || {})
      },
      signal: AbortSignal.timeout(timeout)
    });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}


async function fetchText(url, timeout = 10000) {
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "BuscaAmpliada/1.0" },
      signal: AbortSignal.timeout(timeout)
    });
    return response.ok ? await response.text() : "";
  } catch {
    return "";
  }
}

async function isPDFAvailable(url) {
  if (!url) return false;
  try {
    const response = await fetch(url, {
      method: "HEAD",
      headers: { "User-Agent": "BuscaAmpliada/1.0" },
      signal: AbortSignal.timeout(8000)
    });
    const type = (response.headers.get("content-type") || "").toLowerCase();
    return response.ok && type.includes("pdf");
  } catch {
    return false;
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

function buildMediaSearchTerms(query) {
  const normalized = normalizeText(query);

  const animationSearch =
    /\b(animacao|animacoes|anime|animes)\b/.test(normalized);
  const isMediaSearch =
    /\b(filme|filmes|serie|series|documentario|documentarios|cinema|animacao|animacoes|anime|animes)\b/.test(normalized);

  if (!isMediaSearch) return [];

  let subject = normalized
    .replace(/\b(filmes?|series?|documentarios?|cinema|animac(?:ao|oes)|animes?)\b/g, " ")
    .replace(/\b(sobre|de|do|da|dos|das|para|com)\b/g, " ")
    .replace(/\b(brasileir[oa]s?|japones[ae]s?|internaciona(?:l|is)|do brasil|do japao)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (animationSearch) {
    if (!subject) return ["animation", "anime"];

    const animationTranslations = {
      "espaco": ["space", "outer space", "cosmos"],
      "astronomia": ["astronomy", "space", "cosmos"],
      "planetas": ["planets", "planet", "space"],
      "universo": ["universe", "cosmos", "space"],
      "ciencia": ["science", "space", "scientific"],
      "natureza": ["nature", "wildlife", "animals"]
    };

    return [...new Set([
      subject,
      ...(animationTranslations[subject] || [])
    ])].slice(0, 3);
  }

  if (!subject) return [];

  const translations = {
    "medicina": ["medicine", "medical drama", "hospital"],
    "segunda guerra mundial": ["World War II", "WWII documentary", "Segunda Guerra Mundial"],
    "guerra mundial": ["World War II", "WWII documentary"],
    "historia": ["history documentary", "historical drama"],
    "ciencia": ["science documentary", "science fiction"],
    "natureza": ["nature documentary", "wildlife documentary"],
    "espaco": ["space", "outer space", "cosmos"],
    "astronomia": ["astronomy", "space", "cosmos"],
    "planetas": ["planets", "planet", "space"],
    "universo": ["universe", "cosmos", "space"]
  };

  return [...new Set([subject, ...(translations[subject] || [])])].slice(0, 3);
}

function score(item, query) {
  const title = normalizeText(item.title);
  const description = normalizeText(item.description);
  const rawNormalizedQuery = normalizeText(query);

  const academicIntent =
    /\b(artigo|artigos|academico|academica|cientifico|cientifica|estudo|estudos|tese|teses|dissertacao|periodico|revista cientifica)\b/.test(rawNormalizedQuery);

  const normalizedQuery = rawNormalizedQuery
    .replace(/^(?:quero|gostaria|preciso|procuro|pesquise|pesquisar|encontre|buscar|busque|explique|entender|compreender)\s+/, "")
    .replace(/^(?:(?:artigos?|estudos?|pesquisas?|trabalhos?)\s+(?:cientificos?\s+)?sobre)\s+/, "")
    .replace(/\b(brasileir[oa]s?|japones[ae]s?|internaciona(?:l|is)|do brasil|do japao)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const stopWords = [
    "quero", "gostaria", "preciso", "procuro", "pesquise",
    "pesquisar", "encontre", "buscar", "busque", "fale",
    "entender", "compreender", "sobre", "para", "com",
    "uma", "dos", "das", "que", "como", "filmes",
    "filme", "series", "livros", "livro", "pesquisas",
    "pesquisa", "documentarios", "animacao", "animacoes",
    "anime", "animes", "internacional", "internacionais"
  ];

  const terms = normalizedQuery.split(/\s+/)
    .filter(term => term.length > 2 && !stopWords.includes(term));

  let points = 0;

  const titleAliases = {
    "interestelar": ["interstellar"],
    "interstellar": ["interestelar"]
  };

  const aliases = titleAliases[normalizedQuery] || [];
  const authorText = normalizeText((item.authors || []).join(" "));
  const authorMatches = terms.filter(term => authorText.includes(term)).length;

  if (authorText.includes(normalizedQuery)) {
    points += 75;
  } else if (terms.length > 1 && authorMatches === terms.length) {
    points += 65;
  } else if (authorMatches > 0) {
    points += authorMatches * 8;
  }

  if (["Wikidata", "TMDB"].includes(item.source) && aliases.includes(title)) {
    points += 65;
  }

  if (item.type === "Filme" && aliases.includes(title)) {
    points += 75;
  }

  const exactTitle = title === normalizedQuery;
  const titleMatches = terms.filter(term => title.includes(term)).length;
  const descriptionMatches = terms.filter(term => description.includes(term)).length;
  const titleSearchMatch = terms.length > 0 && titleMatches === terms.length;

  if (exactTitle) points += 65;
  else if (title.includes(normalizedQuery)) points += 25;

  if (titleSearchMatch) points += 18;
  else points += titleMatches * 9;

  points += descriptionMatches * 2;

  // Considera também os termos traduzidos usados nas buscas audiovisuais.
  const mediaSearchSubject = rawNormalizedQuery
    .replace(/\b(filmes?|series?|documentarios?|cinema|animac(?:ao|oes)|animes?)\b/g, " ")
    .replace(/\b(sobre|de|do|da|dos|das|para|com)\b/g, " ")
    .trim();

  const mediaTerms = buildMediaSearchTerms(query)
    .flatMap(term => normalizeText(term).split(/\s+/))
    .filter(term => term.length > 2 &&
      (!mediaSearchSubject || !["animation", "anime"].includes(term)));

  const mediaText = normalizeText([
    item.title, item.description, item.genre
  ].join(" "));

  if (
    mediaTerms.some(term => mediaText.includes(term)) &&
    ["Filme", "Série", "Documentário", "Animação / série", "Animação / filme"].includes(item.type)
  ) {
    points += 35;
  }

  if (/\bcronos\b/.test(normalizedQuery)) {
    const mythTitle = /hesiod|teogonia|urano|zeus|tita|mitolog|deus|genealogia|sucessao/.test(title);
    const mythDescription = /hesiod|teogonia|urano|zeus|tita|mitolog|deus|genealogia|sucessao/.test(description);

    if (title.includes("cronos") && mythTitle) points += 40;
    else if (title.includes("cronos") && mythDescription) points += 25;
  }

  if (/\bzeus\b/.test(normalizedQuery) && /salazar/.test(title + " " + description)) {
    points -= 35;
  }

  const bookType = ["Livro", "Livro de domínio público"].includes(item.type);
  const relatedWork = bookType && !exactTitle && titleSearchMatch;

  if (bookType) {
    if (item.language === "Português (Brasil)") points += 18;
    else if (item.language === "Português") points += 10;

    if (!academicIntent && exactTitle) points += 35;
    if (!academicIntent && relatedWork) points -= 20;
  }

  if (item.type === "Publicação acadêmica") {
    if (titleMatches > 0 || descriptionMatches > 0) points += 5;
    if (!academicIntent && titleSearchMatch) points -= 22;
  }

  // Prioridade para a categoria explicitamente solicitada.
  const requestedMediaType =
    /\b(documentario|documentarios)\b/.test(rawNormalizedQuery) ? "Documentário" :
    /\b(animacao|animacoes|anime|animes)\b/.test(rawNormalizedQuery) ? "Animação" :
    /\b(serie|series)\b/.test(rawNormalizedQuery) ? "Série" :
    /\b(filme|filmes|cinema)\b/.test(rawNormalizedQuery) ? "Filme" : "";

  if (requestedMediaType) {
    const animationType = /^Animação \/ (filme|série)$/i.test(item.type);

    if (
      item.type === requestedMediaType ||
      (requestedMediaType === "Série" && item.type === "Animação / série") ||
      (requestedMediaType === "Animação" && animationType)
    ) {
      points += 65;
    } else if (bookType || item.type === "Publicação acadêmica") {
      points -= 40;
    } else {
      points -= 15;
    }
  }

  if (aliases.includes(title)) {
    if (item.type === "Filme") points += 100;
    else if (bookType) points -= 45;
    else if (item.type === "Publicação acadêmica") points -= 30;
  }

  if (item.pdfLink) points += 3;

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

function getBookLanguage(value) {
  const codes = (Array.isArray(value) ? value : [value])
    .map(item => String(item || "").toLowerCase().split("/").pop())
    .filter(Boolean);

  const code = codes.find(item => /^(pt-br|por-br)$/.test(item))
    || codes.find(item => /^(pt|por)$/.test(item) || item.startsWith("pt-"))
    || codes[0]
    || "";

  if (/^(pt-br|por-br)$/.test(code)) return "Português (Brasil)";
  if (/^(pt|por)$/.test(code) || code.startsWith("pt-")) return "Português";
  if (code.startsWith("en")) return "Inglês";
  if (code.startsWith("es")) return "Espanhol";
  if (code.startsWith("fr")) return "Francês";
  if (code.startsWith("de")) return "Alemão";
  return code ? code.toUpperCase() : "Idioma não informado";
}

async function searchBooks(query) {
  const urls = [
    "https://www.googleapis.com/books/v1/volumes?q=" + encodeURIComponent(query) + "&maxResults=40",
    "https://www.googleapis.com/books/v1/volumes?q=" + encodeURIComponent("inauthor:" + query) + "&maxResults=40",
    "https://www.googleapis.com/books/v1/volumes?q=" + encodeURIComponent(query) + "&langRestrict=pt&country=BR&maxResults=40"
  ];

  const responses = await Promise.all(urls.map(url => fetchJSON(url)));
  return responses.flatMap(data => (data?.items || []).map(item => {
    const info = item.volumeInfo || {};
    const access = item.accessInfo || {};
    const free = access.publicDomain === true;
    return {
      title: info.title || "",
      authors: cleanAuthors(info.authors),
      description: cleanDescription(info.description),
      year: info.publishedDate || "",
      source: "Google Books",
      type: "Livro",
      access: free ? "Gratuito (domínio público)" :
        access.pdf?.isAvailable ? "PDF disponível (verificar acesso)" : "Consultar acesso",
      language: getBookLanguage(info.language),
      pdfLink: access.pdf?.isAvailable ? access.pdf?.downloadLink || "" : "",
      link: info.infoLink || access.webReaderLink || item.selfLink || "",
      cover: info.imageLinks?.thumbnail || ""
    };
  }));
}

async function searchOpenLibrary(query) {
  const urls = [
    "https://openlibrary.org/search.json?q=" + encodeURIComponent(query) + "&limit=40",
    "https://openlibrary.org/search.json?author=" + encodeURIComponent(query) + "&limit=40",
    "https://openlibrary.org/search.json?q=" + encodeURIComponent(query) + "&language=por&limit=40"
  ];

  const responses = await Promise.all(urls.map(url => fetchJSON(url)));
  return responses.flatMap(data => (data?.docs || []).map(item => ({
    title: item.title || "",
    authors: cleanAuthors(item.author_name),
    description: "",
    year: item.first_publish_year || "",
    source: "Open Library",
    type: "Livro",
    access: item.ebook_access === "public" ? "Gratuito" :
      item.ebook_access === "borrowable" ? "Empréstimo digital (verificar)" : "Consultar disponibilidade",
    language: getBookLanguage(item.language),
    link: item.key ? "https://openlibrary.org" + item.key : "",
    cover: item.cover_i ? "https://covers.openlibrary.org/b/id/" + item.cover_i + "-M.jpg" : ""
  })));
}

async function searchCrossref(query) {
  const data = await fetchJSON("https://api.crossref.org/works?query.bibliographic=" + encodeURIComponent(query) + "&rows=30");
  return (data?.message?.items || []).map(item => ({
    title: item.title?.[0] || "",
    authors: cleanAuthors((item.author || []).map(author => [author.given, author.family].filter(Boolean).join(" "))),
    description: cleanDescription(item.abstract),
    year: item.published?.["date-parts"]?.[0]?.[0] || "",
    source: "Crossref", type: "Publicação acadêmica",
    access: item.link?.some(link => /pdf/i.test(link["content-type"] || ""))
      ? "PDF disponível (acesso a verificar)"
      : item.link?.length ? "Consultar acesso" : "Acesso não confirmado",
    language: getBookLanguage(item.language),
    pdfLink: item.link?.find(link => /pdf/i.test(link["content-type"] || ""))?.URL || "",
    link: item.DOI ? "https://doi.org/" + item.DOI : item.URL || "",
    cover: ""
  }));
}

async function searchGutendex(query) {
  const encoded = encodeURIComponent(query);
  const urls = [
    "https://gutendex.com/books/?page_size=32&languages=pt&search=" + encoded,
    "https://gutendex.com/books/?page_size=32&search=" + encoded
  ];

  const responses = await Promise.all(urls.map(url => fetchJSON(url)));
  return responses.flatMap(data => (data?.results || []).map(item => ({
    title: item.title || "",
    authors: cleanAuthors((item.authors || []).map(author => author.name)),
    description: "",
    year: "",
    source: "Project Gutenberg",
    type: "Livro de domínio público",
    access: "Gratuito",
    language: getBookLanguage(item.languages),
    pdfLink: item.formats?.["application/pdf"] || "",
    link: item.formats?.["text/html"] || item.formats?.["application/epub+zip"] || "",
    cover: item.formats?.["image/jpeg"] || ""
  })));
}


async function searchBBM(query) {
  const base = "https://digital.bbm.usp.br";
  const searchUrl = base + "/simple-search?query=" +
    encodeURIComponent(query) + "&rpp=10";

  const html = await fetchText(searchUrl);
  if (!html) return [];

  const rows = [...html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)];
  const records = [];

  for (const match of rows) {
    const row = match[1];
    const handle = row.match(/href=["']([^"']*\/handle\/bbm\/\d+)["']/i);
    if (!handle) continue;

    const cells = [...row.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)]
      .map(cell => cell[1]);

    const titleCell = cells[2] || row;
    const titleMatch = titleCell.match(/<a\b[^>]*>([\s\S]*?)<\/a>/i);
    const title = cleanDescription(titleMatch ? titleMatch[1] : titleCell);
    if (!title) continue;

    records.push({
      title,
      year: cleanDescription(cells[1] || ""),
      authors: cleanAuthors([cleanDescription(cells[3] || "")]),
      link: new URL(handle[1], base).href
    });
  }

  const ignoredWords = new Set([
    "o", "a", "os", "as", "um", "uma", "de", "da", "do",
    "das", "dos", "e", "em", "no", "na", "sobre", "por"
  ]);

  const searchTokens = normalizeText(query)
    .split(/[^a-z0-9]+/)
    .filter(token => token.length > 2 && !ignoredWords.has(token));

  const relevant = records.filter(item => {
    const searchable = normalizeText([
      item.title,
      ...(item.authors || [])
    ].join(" "));

    return searchTokens.length
      ? searchTokens.every(token => searchable.includes(token))
      : searchable.includes(normalizeText(query));
  });

  const unique = [...new Map(relevant.map(item => [item.link, item])).values()]
    .slice(0, 8);

  return Promise.all(unique.map(async item => {
    const detail = await fetchText(item.link);
    const pdfMatch = detail.match(
      /href=["']([^"']*\/bitstream\/[^"']+\.pdf(?:\?[^"']*)?)["']/i
    );
    const candidate = pdfMatch ? new URL(pdfMatch[1], base).href : "";
    const pdfLink = await isPDFAvailable(candidate) ? candidate : "";

    return {
      ...item,
      description: "Obra digitalizada pela Biblioteca Brasiliana Guita e José Mindlin, da USP.",
      source: "BBM Digital USP",
      type: "Livro de domínio público",
      access: "Gratuito (domínio público)",
      language: "Português",
      pdfLink,
      cover: ""
    };
  }));
}

async function searchMovies(query) {
  const data = await fetchJSON("https://itunes.apple.com/search?term=" + encodeURIComponent(query) + "&country=br&media=movie&entity=movie&limit=50");
  return (data?.results || []).map(item => ({
    title: item.trackName || item.collectionName || "",
    authors: cleanAuthors(item.artistName ? [item.artistName] : []),
    description: cleanDescription(item.longDescription || item.shortDescription),
    year: item.releaseDate ? item.releaseDate.slice(0, 4) : "",
    source: "Apple iTunes", type: /animation|anime/i.test(item.primaryGenreName || "") ? "Animação / filme" : "Filme",
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
    const isAnimation = genres.some(genre => /animation|anime/i.test(genre));
    return {
      title: show.name || "", authors: cleanAuthors(show.network?.name ? [show.network.name] : []),
      description: cleanDescription(show.summary),
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

async function searchTMDB(query, token, originalQuery = query) {
  if (!token) return [];

  const normalized = normalizeText(query);
  const documentarySearch =
    /documentario|documentarios|documentary|documentaries/.test(normalized);

  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/json"
  };

  const animationSearch =
    /animacao|animacoes|anime|animes/.test(normalizeText(originalQuery));

  if (animationSearch) {
    const original = normalizeText(originalQuery);

    const originCountry =
      /\b(brasileir[oa]s?|do brasil)\b/.test(original) ? "BR" :
      /\b(japones[ae]s?|do japao)\b/.test(original) ? "JP" : "";

    const filmOnly = /\b(filme|filmes|cinema)\b/.test(original);
    const seriesOnly = /\b(serie|series)\b/.test(original);
    const international = /\binternaciona(?:l|is)\b/.test(original);

    let paths = filmOnly ? ["movie"] :
      seriesOnly ? ["tv"] : ["movie", "tv"];

    const topic = original
      .replace(/\b(filmes?|series?|cinema|animac(?:ao|oes)|animes?)\b/g, " ")
      .replace(/\b(sobre|de|do|da|dos|das|para|com)\b/g, " ")
      .replace(/\b(brasileir[oa]s?|japones[ae]s?|do brasil|do japao|internaciona(?:l|is))\b/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    const broadSearch = !topic || !!originCountry || international;

    const responses = await Promise.all(paths.map(async path => {
      let data;

      if (broadSearch) {
        const countryFilter = originCountry
          ? "&with_origin_country=" + originCountry : "";

        const url =
          `https://api.themoviedb.org/3/discover/${path}` +
          "?with_genres=16" + countryFilter +
          "&sort_by=popularity.desc&language=pt-BR" +
          "&include_adult=false&page=1";

        data = await fetchJSON(url, 8000, { headers });
      } else {
        const url =
          `https://api.themoviedb.org/3/search/${path}` +
          "?query=" + encodeURIComponent(query) +
          "&language=pt-BR&include_adult=false&page=1";

        data = await fetchJSON(url, 8000, { headers });
      }

      const mediaResults = (data?.results || [])
        .filter(item => (item.genre_ids || []).includes(16))
        .slice(0, 20);

      const validatedResults = await Promise.all(mediaResults.map(async item => {
        if (originCountry) {
          const details = await fetchJSON(
            `https://api.themoviedb.org/3/${path}/${item.id}?language=pt-BR`,
            8000,
            { headers }
          );

          const countries = path === "movie"
            ? (details?.production_countries || []).map(country => country.iso_3166_1)
            : (details?.origin_country || []);

          if (!countries.includes(originCountry)) return null;
        }

        return {
          title: item.title || item.name || "",
          authors: [],
          description: cleanDescription(item.overview),
          year: (item.release_date || item.first_air_date || "").slice(0, 4),
          source: "TMDB",
          type: path === "movie" ? "Animação / filme" : "Animação / série",
          genre: "Animation",
          access: "Consultar onde assistir",
          link: `https://www.themoviedb.org/${path}/${item.id}`,
          cover: item.poster_path
            ? "https://image.tmdb.org/t/p/w500" + item.poster_path : "",
          tmdbId: item.id,
          tmdbMediaType: path
        };
      }));

      return validatedResults.filter(Boolean);
    }));

    return responses.flat();
  }

  if (documentarySearch) {
    const keywordUrl =
      "https://api.themoviedb.org/3/search/keyword?query=" +
      encodeURIComponent(query) + "&page=1";

    const keywordData = await fetchJSON(keywordUrl, 8000, { headers });
    const keywordIds = (keywordData?.results || [])
      .slice(0, 3)
      .map(item => item.id);

    const endpoints = ["movie", "tv"];

    const responses = await Promise.all(endpoints.map(async path => {
      const keywordFilter = keywordIds.length
        ? "&with_keywords=" + keywordIds.join("|")
        : "";

      const url =
        `https://api.themoviedb.org/3/discover/${path}` +
        "?with_genres=99" +
        keywordFilter +
        "&sort_by=popularity.desc" +
        "&language=en-US&include_adult=false&page=1";

      const data = await fetchJSON(url, 8000, { headers });

      return (data?.results || [])
        .filter(item => (item.genre_ids || []).includes(99))
        .map(item => ({
          title: item.title || item.name || "",
          authors: [],
          description: cleanDescription(item.overview),
          year: (item.release_date || item.first_air_date || "").slice(0, 4),
          source: "TMDB",
          type: "Documentário",
          access: "Consultar onde assistir",
          link: `https://www.themoviedb.org/${path}/${item.id}`,
          cover: item.poster_path
            ? "https://image.tmdb.org/t/p/w500" + item.poster_path
            : "",
          tmdbId: item.id,
          tmdbMediaType: path
        }));
    }));

    return responses.flat();
  }

  const interstellar = ["interestelar", "interstellar"].includes(normalized);

  const endpoints = [
    { path: "movie", type: "Filme" },
    { path: "tv", type: "Série" }
  ];

  const responses = await Promise.all(endpoints.map(async endpoint => {
    const searchQuery = interstellar && endpoint.path === "movie"
      ? "Interstellar" : query;
    const language = interstellar && endpoint.path === "movie"
      ? "en-US" : "pt-BR";

    const url = "https://api.themoviedb.org/3/search/" +
      endpoint.path +
      "?query=" + encodeURIComponent(searchQuery) +
      "&language=" + language +
      "&include_adult=false" +
      (interstellar && endpoint.path === "movie"
        ? "&primary_release_year=2014" : "");

    const data = await fetchJSON(url, 8000, { headers });

    return (data?.results || []).map(item => ({
      title: item.title || item.name || "",
      authors: [],
      description: cleanDescription(item.overview),
      year: (item.release_date || item.first_air_date || "").slice(0, 4),
      source: "TMDB",
      type: endpoint.type,
      access: "Consultar onde assistir",
      link: "https://www.themoviedb.org/" + endpoint.path + "/" + item.id,
      cover: item.poster_path
        ? "https://image.tmdb.org/t/p/w500" + item.poster_path
        : "",
      tmdbId: item.id,
      tmdbMediaType: endpoint.path
    }));
  }));

  return responses.flat();
}
async function addTMDBProviders(item, token) {
  if (!token || !item.tmdbId || !item.tmdbMediaType) return item;

  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/json"
  };

  const url = `https://api.themoviedb.org/3/${item.tmdbMediaType}/${item.tmdbId}/watch/providers`;
  const data = await fetchJSON(url, 8000, { headers });
  const br = data?.results?.BR;

  if (!br) return item;

  const providers = [
    ...(br.flatrate || []).map(p => ({
      name: p.provider_name,
      logo: p.logo_path ? "https://image.tmdb.org/t/p/w92" + p.logo_path : "",
      type: "Assinatura"
    })),
    ...(br.rent || []).map(p => ({
      name: p.provider_name,
      logo: p.logo_path ? "https://image.tmdb.org/t/p/w92" + p.logo_path : "",
      type: "Aluguel"
    })),
    ...(br.buy || []).map(p => ({
      name: p.provider_name,
      logo: p.logo_path ? "https://image.tmdb.org/t/p/w92" + p.logo_path : "",
      type: "Compra"
    }))
  ];

  return {
    ...item,
    providers,
    providersLink: br.link || ""
  };
}

async function searchWikidata(query) {
  const url = "https://www.wikidata.org/w/api.php?action=wbsearchentities"
    + "&search=" + encodeURIComponent(query)
    + "&language=en&uselang=en&format=json&type=item&limit=20";

  const data = await fetchJSON(url);

  return (data?.search || [])
    .filter(item =>
      /(filme|film|série de televisão|serie de televisão|television series|minissérie|miniseries|documentário|documentary)/i.test(item.description || "")
    )
    .map(item => ({
      title: item.label || "",
      authors: [],
      description: cleanDescription(item.description),
      year: "",
      source: "Wikidata",
      type: /documentary|documentário/i.test(item.description || "")
        ? "Documentário"
        : /série|series|minissérie|television/i.test(item.description || "")
          ? "Série"
          : "Filme",
      access: "Consultar onde assistir",
      link: "https://www.wikidata.org/wiki/" + item.id,
      cover: ""
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

    const normalizedTitle = normalizeText(item.title);
    const titleKey = ["interestelar", "interstellar"].includes(normalizedTitle)
      ? "interstellar"
      : normalizedTitle.replace(/[^a-z0-9]/g, "");
    const key = `${item.type || "Outro"}:${titleKey}`;
    const previous = map.get(key);

    if (!previous) {
      map.set(key, {
        ...item,
        sources: [...new Set(item.sources || [item.source])]
      });
      continue;
    }

    const preferred = item.score > previous.score ? item : previous;
    const secondary = preferred === item ? previous : item;

    const bestText = (first, second) => {
      first = String(first || "").trim();
      second = String(second || "").trim();
      return first.length >= second.length ? first : second;
    };

    map.set(key, {
      ...secondary,
      ...preferred,
      authors: preferred.authors?.length
        ? preferred.authors : secondary.authors || [],
      description: String(preferred.description || "").trim(),
      year: preferred.year || secondary.year || "",
      genre: preferred.genre || secondary.genre || "",
      link: preferred.link || secondary.link || "",
      pdfLink: preferred.pdfLink || secondary.pdfLink || "",
      language: [preferred.language, secondary.language].find(value => value === "Português (Brasil)")
        || [preferred.language, secondary.language].find(value => value === "Português")
        || preferred.language || secondary.language || "Idioma não informado",
      cover: preferred.cover || secondary.cover || "",
      tmdbId: preferred.tmdbId || secondary.tmdbId,
      tmdbMediaType: preferred.tmdbMediaType || secondary.tmdbMediaType,
      providers: preferred.providers || secondary.providers || [],
      providersLink: preferred.providersLink || secondary.providersLink || "",
      sources: [...new Set([
        ...(previous.sources || [previous.source]),
        ...(item.sources || [item.source])
      ])]
    });
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
      const mediaTerms = buildMediaSearchTerms(query);
      const audiovisualTerms = mediaTerms.length ? mediaTerms : terms;

      const animationOriginSearch =
        /\b(brasileir[oa]s?|do brasil|japones[ae]s?|do japao|internaciona(?:l|is))\b/
          .test(normalizeText(query)) &&
        /\b(animacao|animacoes|anime|animes)\b/.test(normalizeText(query));

      const sourceJobs = [
        { name: "Google Books", run: () => searchMultiple(searchBooks, terms) },
        { name: "Open Library", run: () => searchMultiple(searchOpenLibrary, terms) },
        { name: "Crossref", run: () => searchMultiple(searchCrossref, terms) },
        { name: "Project Gutenberg", run: () => searchMultiple(searchGutendex, terms) },
        { name: "BBM Digital USP", run: () => searchMultiple(searchBBM, terms) },
        { name: "Apple iTunes", run: () => searchMultiple(searchMovies, audiovisualTerms) },
        { name: "TVmaze", run: () => animationOriginSearch ? Promise.resolve([]) : searchMultiple(searchShows, audiovisualTerms) },
        { name: "TMDB", run: () => searchMultiple(term => searchTMDB(term, env.TMDB_TOKEN, query), audiovisualTerms) },
        { name: "Wikidata", run: () => animationOriginSearch ? Promise.resolve([]) : searchMultiple(searchWikidata, audiovisualTerms) }
      ];

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
      });

      const queryTerms = normalizeText(query)
        .split(/\s+/)
        .filter(term => term.length > 2);

      const authorSearch = queryTerms.length > 1 &&
        allResults.some(item => {
          const authorText = normalizeText((item.authors || []).join(" "));
          return queryTerms.every(term => authorText.includes(term));
        });

      const queryWords = normalizeText(query).split(" ");
      const requestedMediaType =
        queryWords.some(word => ["documentario", "documentarios"].includes(word)) ? "Documentário" :
        queryWords.some(word => ["animacao", "animacoes", "anime", "animes"].includes(word)) ? "Animação" :
        queryWords.some(word => ["serie", "series"].includes(word)) ? "Série" :
        queryWords.some(word => ["filme", "filmes", "cinema"].includes(word)) ? "Filme" : "";

      const filteredRanked = ranked.filter(item => {
        if (item.score <= 0) return false;

        const title = normalizeText(item.title);

        if (
          authorSearch &&
          item.type === "Livro" &&
          title === normalizeText(query)
        ) return false;

        if (requestedMediaType) {
          if (requestedMediaType === "Animação" &&
              queryWords.includes("filmes") &&
              item.type !== "Animação / filme") return false;
          if (requestedMediaType === "Animação" &&
              queryWords.includes("series") &&
              item.type !== "Animação / série") return false;
          if (requestedMediaType === "Documentário" && item.type !== "Documentário") return false;
          if (requestedMediaType === "Filme" && item.type !== "Filme") return false;
          if (requestedMediaType === "Série" &&
              !["Série", "Animação / série"].includes(item.type)) return false;
          if (requestedMediaType === "Animação" &&
              !/animação/i.test(item.type)) return false;
        }

        return true;
      });

      const results = deduplicate(filteredRanked)
      .sort((a, b) =>
  b.score - a.score ||
  ((["interestelar", "interstellar"].includes(normalizeText(query)))
    ? Number(b.type === "Filme") - Number(a.type === "Filme") : 0) ||
  Number(b.access.startsWith("Gratuito")) - Number(a.access.startsWith("Gratuito")) ||
  a.title.localeCompare(b.title)
)
        .slice(0, 100);

      const tmdbItems = results
        .filter(item => item.tmdbId && item.tmdbMediaType)
        .slice(0, 10);

      await Promise.all(tmdbItems.map(async item => {
        try {
          const enriched = await addTMDBProviders(item, env.TMDB_TOKEN);
          Object.assign(item, enriched);
        } catch {
          item.providers = [];
        }
      }));

      return json({
        status: "success", query, total: results.length, sources,
        interpretation: terms.slice(1),
        results
      });
    }

    return json({ error: "Rota não encontrada." }, 404);
  }
};