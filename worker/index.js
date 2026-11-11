
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

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (url.pathname === "/api/health") {
      return json({
        status: "online",
        project: "Busca Ampliada"
      });
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

      return json({
        status: "received",
        query,
        message: "Pesquisa recebida. A integração com as fontes de conhecimento será adicionada na próxima etapa."
      });
    }

    return json({ error: "Rota não encontrada." }, 404);
  }
};
