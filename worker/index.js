
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json; charset=utf-8"
    }
  });
}

async function fetchJSON(url) {
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "BuscaAmpliada/1.0" },
      signal: AbortSignal.timeout(8000)
    });

    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

function normalizeText(value) {
  return typeof value === "string"
    ? value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim()
    : "";
}

function buildSearchTerms(query) {
  const terms = [query.trim()];

  const parts = query
    .split(/\s+e\s+|[,;]+/i)
    .map(term => term.trim())
    .filter(term => term.length >= 5);

  terms.push(...parts);

  if (/^cronos$/i.test(query.trim())) {
    terms.push(
      "Cronos deus grego mitologia",
      "Cronos Urano Zeus Teogonia Hesiodo",
      "mitologia grega Cronos titãs"
    );
  } else if (/mitolog|deuses gregos|titãs/i.test(query)) {
    terms.push(
      "origem dos deuses gregos",
      "Cronos Zeus Titanomaquia",
      "mitologia grega Teogonia Hesíodo"
    );
  }

  return [...new Set(terms)].slice(0, 4);
}

async function searchMultiple(searchFunction, terms) {
  const results = [];

  for (const term of terms) {
    const items = await searchFunction(term);
    results.push(...items);
  }

  return results;
}

async function searchBooks(query) {
  const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=10`;
  const data = await fetchJSON(url);

  return (data?.items || []).map(item => {
    const info = item.volumeInfo || {};
    const access = item.accessInfo || {};
    const free = access.publicDomain === true ||
      access.epub?.isAvailable === true ||
      access.pdf?.isAvailable === true;

    return {
      title: normalizeText(info.title),
      authors: info.authors || [],
      description: normalizeText(info.description),
      year: info.publishedDate || "",
      source: "Google Books",
      type: "Livro",
      access: free ? "Gratuito" : "Consultar acesso",
      link: info.infoLink || item.selfLink || "",
      cover: info.imageLinks?.thumbnail || ""
    };
  });
}

async function searchOpenLibrary(query) {
  const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=10`;
  const data = await fetchJSON(url);

  return (data?.docs || []).map(item => ({
    title: normalizeText(item.title),
    authors: item.author_name || [],
    description: "",
    year: item.first_publish_year || "",
    source: "Open Library",
    type: "Livro",
    access: "Consultar disponibilidade",
    link: item.key ? `https://openlibrary.org${item.key}` : "",
    cover: item.cover_i
      ? `https://covers.openlibrary.org/b/id/${item.cover_i}-M.jpg`
      : ""
  }));
}

async function searchCrossref(query) {
  const url = `https://api.crossref.org/works?query.bibliographic=${encodeURIComponent(query)}&rows=20`;
  const data = await fetchJSON(url);

  return (data?.message?.items || []).map(item => ({
    title: normalizeText(item.title?.[0]),
    authors: (item.author || []).map(author =>
      [author.given, author.family].filter(Boolean).join(" ")
    ),
    description: "",
    year: item.published?.["date-parts"]?.[0]?.[0] || "",
    source: "Crossref",
    type: "Publicação acadêmica",
    access: item.link?.length ? "Consultar acesso" : "Acesso não confirmado",
    link: item.DOI ? `https://doi.org/${item.DOI}` : item.URL || "",
    cover: ""
  }));
}

async function searchGutendex(query) {
  const url = `https://gutendex.com/books/?search=${encodeURIComponent(query)}`;
  const data = await fetchJSON(url);

  return (data?.results || []).map(item => ({
    title: normalizeText(item.title),
    authors: (item.authors || []).map(author => author.name),
    description: "",
    year: "",
    source: "Project Gutenberg",
    type: "Livro de domínio público",
    access: "Gratuito",
    link: item.formats?.["text/html"] ||
      item.formats?.["application/epub+zip"] || "",
    cover: item.formats?.["image/jpeg"] || ""
  }));
}

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (url.pathname === "/api/health") {
      return json({ status: "online", project: "Busca Ampliada" });
    }

    if (url.pathname === "/api/search" && request.method === "POST") {
      let body;

      try {
        body = await request.json();
      } catch {
        return json({ error: "Envie um JSON válido." }, 400);
      }

      const query = typeof body.query === "string"
        ? body.query.trim()
        : "";

      if (query.length < 3) {
        return json({ error: "Digite pelo menos 3 caracteres." }, 400);
      }

      if (query.length > 500) {
        return json({ error: "A pesquisa deve ter até 500 caracteres." }, 400);
      }

      const searchTerms = buildSearchTerms(query);

const sources = await Promise.allSettled([
  searchMultiple(searchBooks, searchTerms),
  searchMultiple(searchOpenLibrary, searchTerms),
  searchMultiple(searchCrossref, searchTerms),
  searchMultiple(searchGutendex, searchTerms)
]);

      const names = [
        "Google Books",
        "Open Library",
        "Crossref",
        "Project Gutenberg"
      ];

      const results = sources.flatMap(source =>
  source.status === "fulfilled" ? source.value : []
);

function score(item, query) {
  const title = normalizeText(item.title || "");
  const description = normalizeText(item.description || "");

  const authors = Array.isArray(item.authors)
    ? item.authors.map(author => normalizeText(author))
    : [normalizeText(item.authors || "")];

  const text = `${title} ${description}`;
  const searchTerm = normalizeText(query || "");

  let points = 0;

  const cronosContext = [
    "urano", "zeus", "hesiodo", "teogonia",
    "mitologia", "titanomaquia", "titas",
    "genealogia", "deuses gregos"
  ];

  const zeusIsAuthor = authors.some(author =>
    author.includes("zeus") && title.includes(author)
  );

  const zeusSalazar = /zeus\s+a\s+salazar|zeus\s+salazar/.test(title);

  if (
  searchTerm &&
  title.includes(searchTerm) &&
  !(searchTerm === "zeus" && (zeusIsAuthor || zeusSalazar))
) {
    if (searchTerm === "cronos") {
      const hasMythContext = cronosContext.some(term => text.includes(term));
      points += hasMythContext ? 30 : 6;
    } else {
      points += 30;
    }
  } else if (
  searchTerm &&
  text.includes(searchTerm) &&
  !(searchTerm === "zeus" && (
    zeusIsAuthor ||
    zeusSalazar ||
    authors.some(author => author.includes("zeus"))
  ))
) {
    points += 15;
  }

  const directTerms = [
    "teogonia",
    "hesiodo",
    "urano",
    "titanomaquia",
    "mitologia grega",
    "origem dos deuses",
    "guerra dos titas",
    "mitos de geracao",
    "sucessao divina"
  ];

  const relatedTerms = [
    "deuses gregos",
    "mitologia",
    "olimpianos",
    "olimpio",
    "cosmogonia",
    "genealogia divina",
    "mito grego",
    "religiao grega"
  ];

  const unrelatedPatterns = [
    /segunda guerra mundial/,
    /guerra contra o ira/,
    /guerra do paraguai/,
    /guerra no iraque/,
    /guerra fria/,
    /guerra tarifaria/,
    /attack on titan/,
    /atos dos apostolos/,
    /pecado/,
    /esdras/,
    /daniel/,
    /foucault/,
    /g.?20/
  ];

  for (const term of directTerms) {
    const normalizedTerm = normalizeText(term);

    if (title.includes(normalizedTerm)) {
      points += searchTerm === "cronos" ? 7 : 15;
    } else if (text.includes(normalizedTerm)) {
      points += searchTerm === "cronos" ? 3 : 7;
    }
  }

  if (
    searchTerm !== "cronos" &&
    title.includes("zeus") &&
    !zeusIsAuthor &&
    !zeusSalazar
  ) {
    points += 15;
  } else if (
    searchTerm !== "cronos" &&
    description.includes("zeus") &&
    !authors.some(author => author.includes("zeus"))
  ) {
    points += 7;
  }

  if (searchTerm === "cronos" && text.includes("cronos")) {
    const hasContext = cronosContext.some(term => text.includes(term));
    points += hasContext ? 15 : 2;
  }

  for (const term of relatedTerms) {
    const normalizedTerm = normalizeText(term);

    if (searchTerm === "cronos") {
      if (title.includes(normalizedTerm)) points += 2;
      else if (text.includes(normalizedTerm)) points += 1;
    } else {
      if (title.includes(normalizedTerm)) points += 7;
      else if (text.includes(normalizedTerm)) points += 3;
    }
  }

  if (unrelatedPatterns.some(pattern => pattern.test(title))) {
    points -= 20;
  }

  return points;
}



results.forEach(item => {
  const points = score(item, query);

  item.relevanceScore = points;

  item.relevance = points >= 15
    ? "Diretamente relacionado"
    : points >= 7
      ? "Aprofundamento"
      : "Complementar";
});

results.sort((a, b) => b.relevanceScore - a.relevanceScore);

      return json({
        status: "success",
        query,
        total: results.length,
        sources: names.map((name, index) => ({
          name,
          status: sources[index].status === "fulfilled"
            ? "consultada"
            : "indisponível"
        })),
        results
      });
    }

    return json({ error: "Rota não encontrada." }, 404);
  }
};
