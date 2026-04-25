const { registrarEstudiante, buscarEstudiante, listarEstudiantes } = require("../controllers/estudiantesController");
const { jsonBody, sendJSON } = require("../middleware/helpers");

/**
 * Parsea query string simple: "cedula=123&nombre=Juan" → { cedula: "123", nombre: "Juan" }
 */
function parseQuery(url) {
  const idx = url.indexOf("?");
  if (idx === -1) return {};
  const params = {};
  url
    .slice(idx + 1)
    .split("&")
    .forEach((pair) => {
      const [k, v] = pair.split("=");
      if (k) params[decodeURIComponent(k)] = decodeURIComponent(v ?? "");
    });
  return params;
}

async function estudiantesRouter(req, res, pathname) {
  // GET /api/estudiantes/buscar
  if (req.method === "GET" && pathname === "/api/estudiantes/buscar") {
    const query = parseQuery(req.url);
    const result = await buscarEstudiante(query);
    return sendJSON(res, result.status, result.data);
  }

  // GET /api/estudiantes
  if (req.method === "GET" && pathname === "/api/estudiantes") {
    const result = await listarEstudiantes();
    return sendJSON(res, result.status, result.data);
  }

  // POST /api/estudiantes
  if (req.method === "POST" && pathname === "/api/estudiantes") {
    const body = await jsonBody(req);
    const result = await registrarEstudiante(body);
    return sendJSON(res, result.status, result.data);
  }

  return false; // ruta no manejada
}

module.exports = { estudiantesRouter };
