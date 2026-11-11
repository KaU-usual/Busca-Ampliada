export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === "/api/health") {
      return Response.json({
        status: "online",
        project: "Busca Ampliada"
      });
    }

    return Response.json(
      { error: "Rota não encontrada" },
      { status: 404 }
    );
  }
};
