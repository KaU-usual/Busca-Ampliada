
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
      headers: { "User-Agent": "BuscaAmpliada/1.0" }
    });

    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

function normalizeText(value) {
  return typeof value === "string" ? value : "";
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
  const url = `https://api.crossref.org/works?query.bibliographic=${encodeURIComponent(query)}&rows=10`;
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

      const sources = await Promise.allSettled([
        searchBooks(query),
        searchOpenLibrary(query),
        searchCrossref(query),
        searchGutendex(query)
      ]);

      const names = [
        "Google Books",
        "Open Library",
        "Crossref",
        "Project Gutenberg"
      ];

      const results = sources.flatMap((source, index) =>
        source.status === "fulfilled" ? source.value : []
      );

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
